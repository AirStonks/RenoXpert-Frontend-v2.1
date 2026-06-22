import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package as PackageIcon, Award, CreditCard } from 'lucide-react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import { getCampaign } from '../../services/publicApi';
import type { Campaign, CampaignPackage, Order, OrderQuotation, Package, Product } from '../../types';
import { getRenoSubscriptionFixedOverrideNettAmount } from '../../utils/renoSubscription';
import { Card } from './components/Card';
import { Tabs } from './components/Tabs';
import { AccordionItem } from './components/AccordionItem';
import { Pill } from './components/Pill';

type TemplateOrderLike = Order & {
    latest_quotation?: OrderQuotation & { packages?: Package[] };
};

function getProductQty(product: Product): number {
    return Number(product.pivot?.quantity || 0);
}

const convertToWords = (num: number) => {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const teens = [
        'ten',
        'eleven',
        'twelve',
        'thirteen',
        'fourteen',
        'fifteen',
        'sixteen',
        'seventeen',
        'eighteen',
        'nineteen',
    ];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    if (num < 10) return ones[num];
    if (num >= 10 && num < 20) return teens[num - 10];
    const tenPart = Math.floor(num / 10);
    const onePart = num % 10;
    return tens[tenPart] + (onePart > 0 ? '-' + ones[onePart] : '');
};

export default function CampaignPackageDetailPage() {
    const { campaignSlug, campaignPackageId } = useParams<{ campaignSlug: string; campaignPackageId: string }>();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedPackageIds, setExpandedPackageIds] = useState<Record<string, boolean>>({});
    const [selectedPlan, setSelectedPlan] = useState<string>('60');
    const [activeTab, setActiveTab] = useState<'quotation' | 'tnc'>('quotation');
    // [Q2] client-side add-on inclusion overrides, keyed by package id. Preview only — never persisted.
    const [addonOverrides, setAddonOverrides] = useState<Record<string, boolean>>({});
    // [Q3] mobile sticky bar visibility, driven by an IntersectionObserver on the Payment Summary card.
    const [showStickyBar, setShowStickyBar] = useState<boolean>(false);
    const paymentSummaryRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const run = async () => {
            if (!campaignSlug) {
                setError('Campaign slug is required');
                setLoading(false);
                return;
            }
            if (!campaignPackageId) {
                setError('Campaign package id is required');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const res = await getCampaign(campaignSlug);
                if (res?.success) {
                    setCampaign(res.data);
                } else {
                    setError('Campaign not found');
                }
            } catch (e) {
                console.error(e);
                setError('Failed to load campaign');
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [campaignSlug, campaignPackageId]);

    const selectedCampaignPackage: CampaignPackage | null = useMemo(() => {
        const pkgs = (campaign?.packages || []) as CampaignPackage[];
        if (!pkgs.length) return null;
        const found = pkgs.find((p) => String(p.id) === String(campaignPackageId));
        return found || null;
    }, [campaign?.packages, campaignPackageId]);

    const templateOrder: TemplateOrderLike | null = useMemo(() => {
        return (selectedCampaignPackage?.order as TemplateOrderLike | undefined) || null;
    }, [selectedCampaignPackage]);
    

    const templateQuotation = templateOrder?.latest_quotation || null;

    useEffect(() => {
        const title = campaign?.title || 'Campaign';
        const pkgTitle = selectedCampaignPackage?.name ? ` - ${selectedCampaignPackage.name}` : '';
        document.title = `${title}${pkgTitle} | Package Detail`;
    }, [campaign?.title, selectedCampaignPackage?.name]);

    useEffect(() => {
        const el = paymentSummaryRef.current;
        if (!el) {
            setShowStickyBar(false);
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => setShowStickyBar(!entry.isIntersecting),
            { threshold: 0 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [activeTab, selectedCampaignPackage, templateOrder, templateQuotation]);

    // Parse bonus from quotation or order
    const bonus = useMemo(() => {
        try {
            if (templateQuotation?.bonus) {
                if (typeof templateQuotation.bonus === 'string') return JSON.parse(templateQuotation.bonus);
                return templateQuotation.bonus;
            }
            if (templateOrder?.bonus) {
                if (typeof templateOrder.bonus === 'string') return JSON.parse(templateOrder.bonus);
                return templateOrder.bonus;
            }
            return null;
        } catch {
            return null;
        }
    }, [templateQuotation?.bonus, templateOrder?.bonus]);

    const selectedProgram = useMemo(() => {
        if (templateOrder?.is_be_powered) return 'bePowered';
        if (templateOrder?.is_rnpl) return 'rnpl';
        return 'normal';
    }, [templateOrder?.is_be_powered, templateOrder?.is_rnpl]);

    // [Q2] Apply user toggles over each add-on's is_addon_included; non-add-ons pass through unchanged.
    const effectivePackages = useMemo<Package[]>(() => {
        const pkgs = templateQuotation?.packages || [];
        return pkgs.map((pkg) => {
            if (!pkg.is_addon) return pkg;
            const id = String(pkg.id ?? pkg.name ?? 'pkg');
            const included = id in addonOverrides ? addonOverrides[id] : pkg.is_addon_included !== false;
            return { ...pkg, is_addon_included: included };
        });
    }, [templateQuotation?.packages, addonOverrides]);

    const upfrontAmount = useMemo(() => {
        if (!templateOrder?.is_be_powered) return 0;
        const pkgs = effectivePackages;
        return pkgs.reduce(
            (acc, pkg) =>
                acc +
                (templateOrder.is_be_powered &&
                    pkg.payment_method === 'one-off' &&
                    (pkg.is_addon ? pkg.is_addon_included === true : true)
                    ? (pkg.markup_amount ? pkg.markup_amount : pkg.total_price) * (pkg.quantity || 1)
                    : 0),
            templateOrder.be_powered_base_price || 0,
        );
    }, [templateOrder?.is_be_powered, templateOrder?.be_powered_base_price, effectivePackages]);

    const totalExcludedAddonAmount = useMemo(() => {
        if (templateOrder?.f_1 && templateOrder?.total_amount != null) return Number(templateOrder.total_amount);
        const pkgs = effectivePackages;
        return pkgs.reduce((total, pkg) => {
            if (pkg.is_addon === true && pkg.is_addon_included === false) return total;
            const packagePrice = templateOrder?.is_rnpl && pkg.markup_amount ? pkg.markup_amount : pkg.total_price || 0;
            return total + Number(packagePrice) * (pkg.quantity || 1);
        }, 0);
    }, [templateOrder?.f_1, templateOrder?.total_amount, templateOrder?.is_rnpl, effectivePackages]);

    const totalRenoNowPrice = useMemo(() => {
        if (!templateOrder?.is_rnpl) return 0;
        return templateOrder.rnpl_base_price || 0;
    }, [templateOrder?.is_rnpl, templateOrder?.rnpl_base_price]);

    const bonusValue = useMemo(() => Number(bonus?.value) || 0, [bonus?.value]);

    const overrideTotalQuotationAmount = useMemo(() => {
        return getRenoSubscriptionFixedOverrideNettAmount({
            isRenoSubscription: selectedProgram === 'bePowered' && Boolean(templateOrder?.is_be_powered),
            installmentMethod: templateOrder?.installment_method,
            upfrontAmount,
            installmentAmount: templateOrder?.installment_amount,
            tenure: templateOrder?.tenure,
            bonusValue,
        });
    }, [
        selectedProgram,
        templateOrder?.is_be_powered,
        templateOrder?.installment_method,
        upfrontAmount,
        templateOrder?.installment_amount,
        templateOrder?.tenure,
        bonusValue,
    ]);

    const displayTotalQuotationAmount = useMemo(() => {
        return overrideTotalQuotationAmount ?? totalExcludedAddonAmount - bonusValue;
    }, [overrideTotalQuotationAmount, totalExcludedAddonAmount, bonusValue]);

    // [Q1] Non-refundable booking fee + the original (pre-fee) initial down payment per program.
    const bookingFee = useMemo(
        () => Number(selectedCampaignPackage?.booking_amount || 0),
        [selectedCampaignPackage?.booking_amount],
    );

    const originalInitialDownPayment = useMemo(() => {
        if (selectedProgram === 'bePowered') return upfrontAmount - bonusValue;
        if (selectedProgram === 'rnpl') return totalRenoNowPrice;
        return totalExcludedAddonAmount / 2;
    }, [selectedProgram, upfrontAmount, bonusValue, totalRenoNowPrice, totalExcludedAddonAmount]);

    const togglePackage = (pkgId: string) => {
        setExpandedPackageIds((prev) => ({ ...prev, [pkgId]: !prev[pkgId] }));
    };

    const toggleAddon = (pkg: Package) => {
        const id = String(pkg.id ?? pkg.name ?? 'pkg');
        const current = id in addonOverrides ? addonOverrides[id] : pkg.is_addon_included !== false;
        setAddonOverrides((prev) => ({ ...prev, [id]: !current }));
    };

    const tnc = (
        <div className="text-sm space-y-6">
            <h1 className="text-xl font-bold mb-4">Terms & Conditions – Owner Collaboration Quotation</h1>
            <p className="text-justify leading-relaxed">
                These Terms & Conditions ("T&C") form an integral part of the official quotation issued by <strong>BeLive Ventures Sdn. Bhd.</strong> ("Company") to the Owner and, where applicable, shall be read together with the <strong>Owner Collaboration Agreement ("OCA")</strong> executed or intended to be executed between the parties.
            </p>
            <p className="text-justify leading-relaxed">
                This quotation and its accompanying T&C shall constitute a <strong>legally binding agreement</strong> between the Owner and Company upon the Owner's acceptance, signature, or payment of any sum stated herein, <strong>irrespective of whether the OCA has been executed</strong>.
            </p>
            <p className="text-justify leading-relaxed">
                In the event of any inconsistency, ambiguity, or conflict between these T&C and the provisions of the OCA, <strong>the terms contained in the OCA shall prevail</strong>. However, where both documents impose obligations on the Owner or Company, <strong>the stricter or more specific obligation shall take precedence</strong> to ensure consistency with the intent, purpose, and performance standards of the collaboration.
            </p>

            <div className="rounded-xl bg-campaign-50 border border-campaign-100 p-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                    <strong>Payment constitutes acknowledgement.</strong> By making any payment toward this quotation, the Owner acknowledges having read, understood, and agreed to this quotation and these Terms &amp; Conditions.
                </p>
            </div>

            <h2 id="tnc-sec-1" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">1. Engagement and Quotation Validity</h2>
            <p className="text-justify leading-relaxed mb-3">
                1.1 This quotation shall remain valid for seven (7) calendar days from the issuance date. Any confirmation received after this period shall be subjected to revision at the Company's sole discretion. Upon confirmation or payment of any portion of the quoted amount within the validity period, this quotation shall be deemed fully accepted, and the Owner shall have no right to withdraw, cancel, or modify the engagement except as expressly permitted herein.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                1.2 By signing this quotation, the Owner hereby engages the Company to carry out, execute, and complete the agreed renovation and delivery works for the contract sum stated in the quotation (inclusive of all applicable taxes, if any). This quotation, once accepted, shall constitute a binding and enforceable contract between the Owner and the Company for the works described herein.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                1.3 The Company shall have sole discretion to determine the overall design theme, spatial layout, and material specifications to ensure quality, durability, and rental optimisation. While the Company will make reasonable effort to incorporate the design intent conveyed through any reference visuals, final decisions on finishes, fittings, and configurations shall rest exclusively with the Company and do not require prior approval from Owner. The Owner expressly agrees that all design, layout, and material selections made by the Company in good faith and consistent with the intended rental optimisation shall be deemed final and accepted by the Owner, with no right of dispute or claim.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                1.4 All reference images, design mood boards, sample materials, and illustrative visuals are strictly for conceptual guidance only. The Company reserves the right to substitute any item—due to availability, cost-efficiency, supplier changes, or functional improvement—with products of similar or higher quality, value, or durability without prior notice to the Owner. The Company shall not be held liable for any variations in colour tone, texture, material source, or aesthetic appearance arising from such substitutions, provided that equivalent functionality and overall quality are maintained.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                1.5 The Company reserves the right to photograph and record the unit before, during, and after completion for documentation, portfolio, and marketing purposes. All such photos, videos, or media captured shall remain the sole intellectual property of the Company and may be used for internal documentation, quality verification, and marketing purposes without any compensation or further consent from the Owner.
            </p>
            <p className="text-justify leading-relaxed font-bold mb-2">1.6 Intellectual Property and Design Ownership</p>
            <p className="text-justify leading-relaxed mb-3">
                All design concepts, layouts, drawings, 3D visualisations, furniture configurations, material selections, or any other creative work produced or proposed by the Company in relation to the Property ("Design Works") remain the sole and exclusive intellectual property of the Company.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                The Owner acknowledges that these Design Works are proprietary to the Company and are provided solely for the purpose of executing the renovation contracted under this quotation.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                The Owner shall not, whether directly or indirectly, reproduce, share, distribute, replicate, or cause to be replicated any part of the Design Works in any other property or project without the Company's prior written consent.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                Any unauthorised use, duplication, or adaptation of the Design Works shall constitute an infringement of the Company's intellectual property rights, entitling the Company to seek injunctive relief, damages, and any other remedies available under law.
            </p>

            <h2 id="tnc-sec-2" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">2. Renovation Period & Commencement Timeline</h2>
            <p className="text-justify leading-relaxed mb-3">
                <strong>2.1</strong> The standard renovation period shall be as stated in the signed quotation ("Renovation Period"), commencing from the Actual Commencement Date as defined below.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>2.2</strong> For the avoidance of doubt, the Actual Commencement Date is the latest date on which all the following conditions are satisfied:
            </p>
            <p className="text-justify leading-relaxed mb-3 pl-6">
                (a) The Owner has made the required downpayment in accordance with the selected payment method (see Clause 3);<br />
                (b) All developer defect rectifications have been duly completed and approved by the Company;<br />
                (c) All necessary renovation permits, approvals, and access permissions have been obtained from the building management, joint management body, or relevant authorities; and<br />
                (d) The Owner has delivered to the Company all required keys, access cards, access device and any other items or information required to commence the renovation works.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>2.3</strong> The Company shall commence or facilitate the commencement of work within seven (7) working days from the Actual Commencement Date. The renovation period shall be <strong>{convertToWords(templateOrder?.completion_day || 0).toUpperCase()} {templateOrder?.completion_day || 0} working days</strong> from the date of commencement. This timeline assumes that all necessary site access, approvals, and documentation are provided in a timely manner. Any delays not attributable to the Company may justify an extension of time for completion, subject to mutual agreement.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>2.4</strong> The Company shall not be held liable for any delay, loss, or damage arising from circumstances beyond its reasonable control. These include, but are not limited to: (a) building access restrictions; (b) work hour limitations imposed by the building management; (c) delays in obtaining permits or approvals; (d) adverse weather conditions; (e) shipping or customs clearance delays; (f) shortage or unavailability of materials; (g) labour disruptions; (h) public holidays; or (i) any delay caused by the Owner, including delay in payment, failure to provide timely decisions, or failure to fulfil obligations under this agreement.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>2.5</strong> In any such events, the Renovation Period shall be automatically and reasonably extended without penalty and the Company shall not be liable for any penalties, liquidated damages, or claims resulting from such delays. The Company shall notify the Owner in writing of the revised estimated completion date.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                2.6 The Owner shall, at the Owner's own cost and responsibility, pay all renovation deposits required by the building management office and ensure that all necessary permits, forms, and documentation are duly submitted and approved prior to the commencement of renovation works. The Company shall not be liable for any delay, additional cost, or loss resulting from the Owner's failure to obtain such approvals or to comply with any requirements imposed by the building management, Joint Management Body (JMB), or relevant authorities. Partitioning Works and Compliance Responsibility
            </p>
            <p className="text-justify leading-relaxed mb-3">
                The Owner acknowledges that any partitioning works (including but not limited to room subdivisions, additional walls, or layout modifications) are undertaken solely at the Owner's risk. Such works may be subject to removal orders, forfeiture of renovation deposits, or fines imposed by the Management Office (MO), Joint Management Body (JMB), or local authority. The Owner shall obtain all required written approvals or permits prior to commencement.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                The Owner agrees to indemnify, defend, and hold harmless the Company and its agents, employees, and subcontractors from and against any claims, losses, damages, penalties, costs, or expenses (including legal fees) arising from or related to such partitioning works, including but not limited to enforcement actions, removal orders, fines, or compliance costs.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                The Company shall not be liable for any enforcement actions, losses, damages, or costs incurred as a result of the Owner's failure to obtain the required approvals or non-compliance with applicable rules and regulations.
            </p>

            <h2 id="tnc-sec-3" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">3. Payment Terms</h2>
            <p className="text-justify leading-relaxed mb-3">
                <strong>3.0 Acknowledgement by Payment.</strong> The Owner's payment of the booking fee or any sum stated in this quotation shall be deemed conclusive acknowledgement and acceptance of this quotation and these Terms &amp; Conditions, irrespective of whether this quotation has been separately signed.
            </p>

            {selectedProgram === "normal" && (
                <>
                    <h3 className="text-base font-bold mt-4 mb-2">3.A Full Payment (50–50 Method)</h3>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.A.1</strong> The Owner agrees to pay the total renovation contract sum in two (2) equal instalments of fifty percent (50%) each, in accordance with the following schedule:
                    </p>
                    <p className="text-justify leading-relaxed mb-3 pl-6">
                        (a) <strong>First 50% (Downpayment):</strong> Payable upon signing of this quotation and before commencement of Phase 1 works.<br />
                        (b) <strong>Second 50%:</strong> Payable upon completion of Phase 1 works (wiring, painting, and installation of smart devices) and before commencement of Phase 2 works (installation of built-in furniture, kitchen cabinets, wardrobes, beds, and other fittings).
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.A.2</strong> The Company shall issue progress notifications, site updates, and photographic evidence (where applicable) to the Owner before requesting each milestone payment.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.A.3</strong> The Company shall not be obliged to commence or continue any work unless and until the respective milestone payment has been received in full. Any delay in payment shall automatically entitle the Company to suspend work, extend the renovation period without penalty, and reschedule activities on a best-effort basis.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.A.4</strong> If the Owner fails to make any due payment within three (3) working days of notification, the Company reserves the right to:
                    </p>
                    <p className="text-justify leading-relaxed mb-3 pl-6">
                        (a) Suspend all works on-site without liability;<br />
                        (b) Impose compensation for idle manpower, material storage, or project rescheduling costs; and<br />
                        (c) Recover from the Owner any additional expenses, damages, or losses arising directly or indirectly from the delay.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.A.5</strong> All payments made by the Owner to the Company shall be deemed fully earned and are strictly non-refundable, including in cases of cancellation, withdrawal, or termination by the Owner after the commencement of any preparatory or renovation works. This applies regardless of the stage of completion or reason for termination, and without prejudice to the Company's right to claim further losses, damages, or costs incurred as a result of such cancellation or termination.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.A.6</strong> Payments may be made via bank transfer, FPX, or credit/debit card. A two percent (2%) administrative fee applies for credit/debit card transactions, and all bank, gateway, or financing charges (including Easy Payment Plan or similar schemes) shall be borne solely by the Owner. The Company shall not be liable for any delays, failures, or additional charges arising from third-party payment platforms or financial institutions. The Company reserves the right to suspend or withhold further works, services, or deliveries in the event of delayed, failed, or reversed payments until such issues are fully resolved to the Company's satisfaction.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.A.7 Default Interest Rate:</strong> Any overdue payment shall accrue interest at eight percent (8%) per annum from the due date until full settlement, without prejudice to any other rights or remedies available to the Company.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>Retention of Title:</strong> Ownership and legal title to all furniture, fixtures, fittings, and materials supplied or installed under this quotation shall remain vested exclusively in the Company until full and final settlement of all sums due and payable (including any additional charges or interest or costs incurred) have been received in full. In the event of non-payment, default, or breach by the Owner, the Company reserves the right, without notice and without incurring any liability, to:
                    </p>
                    <p className="text-justify leading-relaxed mb-3 pl-6">
                        (a) remove or recover any such items from the premises,<br />
                        (b) suspend further works or services, and/or<br />
                        (c) claim monetary compensation equivalent to the value of the unpaid items or associated losses.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        The Owner shall grant the Company or its authorised agents unrestricted access to the premises for the purposes of exercising its rights under this clause.
                    </p>
                </>
            )}

            {selectedProgram === "rnpl" && (
                <>
                    <h3 className="text-base font-bold mt-4 mb-2">3.B RenoNow PayLater Method</h3>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.B1 Initial Down Payment</strong><br />
                        The Owner shall pay the upfront down payment as stated in the quotation ("Initial Down Payment") upon signing of this quotation. No renovation or procurement works shall commence until the Initial Down Payment has been received in full and all commencement conditions under Clause 2.2 are met.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.B2 Deferred Balance & Rental Deduction Mechanism</strong><br />
                        (a) The remaining renovation balance ("Deferred Balance") shall be recovered by Company through monthly deductions from the gross rental proceeds collected under the Owner Collaboration Agreement ("OCA").<br />
                        (b) The Owner hereby irrevocably authorises Company to deduct the agreed monthly repayment directly from rental income before remitting the balance to the Owner.<br />
                        (c) Monthly deductions shall commence from the first month in which the Property generates rental income under Company's management.<br />
                        (d) Any month without rental income shall not waive or extinguish the payment obligation; such instalments shall automatically carry forward and be recovered from subsequent months or directly from the Owner upon demand.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.B3 Repayment Duration and Liability</strong><br />
                        (a) The Deferred Balance shall be repaid in full within the agreed repayment period stated in the quotation ("Repayment Period").<br />
                        (b) The Owner remains wholly liable for the entire Deferred Balance, irrespective of tenancy turnover, vacancy periods, or temporary rental shortfall.<br />
                        (c) Upon termination, sale, or transfer of ownership of the Property, all outstanding Deferred Balance shall become immediately due and payable in full.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.B4 Exclusive Management & Rental Control</strong><br />
                        (a) During the Repayment Period, the Owner shall not rent, market, or manage the Property through any third party or directly without Company's written consent.<br />
                        (b) Any such act shall constitute a material breach, entitling Company to immediate recovery of the full outstanding Deferred Balance and termination of all management services.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.B5 Payment Default and Enforcement</strong><br />
                        (a) Any unpaid instalment outstanding for more than fourteen (14) days shall accrue interest at eight percent (8%) per annum until full payment.<br />
                        (b) Company reserves the right to suspend all renovation warranties and/or lodge a private caveat on the Property until full settlement.<br />
                        (c) Any dispute raised by the Owner shall not suspend or delay Company's right to recover payments under this clause.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.B6 Non-Refundability</strong><br />
                        All payments made under this quotation shall be deemed irrevocably earned and strictly non-refundable, including in cases of Owner's withdrawal, termination of engagement, or vacancy of the property for any reason.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.B7 Financing & Administrative Charges</strong><br />
                        All fees, charges, or costs associated with the use of payment gateway, credit/debit card, or third-party financing channels, including but not limited to Easy Payment Plan (EPP) or similar instalment services, shall be borne solely by the Owner and are non-refundable under any circumstances.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.B8 Payment Methods and Administrative Fee</strong><br />
                        Payments may be made via bank transfer, FPX, or credit/debit card. A two percent (2%) administrative fee applies for credit/debit card transactions for one-off payments, and all bank, gateway, or financing charges (including Easy Payment Plan or similar schemes) shall be borne solely by the Owner. The Company shall not be liable for any delays, failures, or additional charges arising from third-party payment platforms or financial institutions. The Company reserves the right to suspend or withhold further works, services, or deliveries in the event of delayed, failed, or reversed payments until such issues are fully resolved to the Company's satisfaction.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.B9 Retention of Title</strong><br />
                        All furniture, fixtures, and installations supplied under this arrangement shall remain the sole and exclusive property of Company until the full Deferred Balance is received and settled. In the event of default or non-payment, Company reserves the right, without prior notice and without incurring any liability, to remove such items from the premises or to pursue recovery of their equivalent monetary value through legal means. The Owner expressly agrees to grant Company or its authorised representatives access to the premises, if necessary, to exercise its rights under this clause.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.B10 Performance Disclaimer</strong><br />
                        Company shall exercise its best commercial efforts to secure tenancy and optimize rental returns for the Property; however, the Owner acknowledges and accepts that occupancy rates and rental yields are subject to market forces, seasonal demand, and other external factors beyond Company's control. Accordingly, Company shall not be held liable for any periods of vacancy, rental fluctuations, or shortfalls in expected returns.
                    </p>
                </>
            )}

            {selectedProgram === "bePowered" && (
                <>
                    <h3 className="text-base font-bold mt-4 mb-2">3.C Payment Terms – Reno Subscription Method (60-Month Tenure)</h3>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C1 Initial Down Payment</strong><br />
                        The Owner shall pay the agreed upfront down payment as stated in the quotation ("Initial Down Payment") upon signing of this quotation. No renovation, furnishing, or procurement works shall commence until full payment of the Initial Down Payment and fulfilment of all commencement conditions under Clause 2.2.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C2 Subscription Tenure and Fixed Monthly Payment</strong><br />
                        (a) The remaining renovation balance ("Subscription Balance") shall be payable by the Owner to Company in sixty (60) consecutive fixed monthly instalments ("Subscription Payments") as specified in the quotation.<br />
                        (b) Each Subscription Payment shall be due on the same calendar date of every month, commencing from the month following the handover or issuance of the completion notice, whichever occurs first.<br />
                        (c) The Subscription Payments are fixed and shall not vary regardless of the Property's rental income, occupancy rate, or tenancy status.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C3 Authorisation for Automatic Deduction</strong><br />
                        (a) The Owner irrevocably authorises Company to deduct each monthly Subscription Payment directly from the rental proceeds collected under the Owner Collaboration Agreement ("OCA"), prior to releasing any balance to the Owner.<br />
                        (b) In months where the rental proceeds are insufficient to cover the due Subscription Payment, the Owner shall settle the shortfall directly to Company within seven (7) calendar days of written notice.<br />
                        (c) Any outstanding balance shall automatically carry forward and be recoverable from subsequent rental proceeds or direct payments without prejudice to Company's rights to enforce full recovery.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C4 Owner's Commitment and Continuing Liability</strong><br />
                        (a) The Owner acknowledges that this Subscription arrangement constitutes a fixed payment obligation, not a profit-sharing or rental-dependent scheme.<br />
                        (b) The Owner shall remain fully liable for all Subscription Payments throughout the 60-month tenure, irrespective of occupancy rate, vacancy, tenant behaviour, or rental performance.<br />
                        (c) In the event of any sale, transfer of ownership, or early termination of the OCA, all remaining unpaid Subscription Payments shall become immediately due and payable in full.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C5 Survival of Payment Obligation</strong><br />
                        The Owner's payment obligation under this clause shall survive the expiry or termination of this quotation and the OCA, regardless of the reason for such termination. Termination, cancellation, or withdrawal by either Party shall not affect Company's right to recover all outstanding sums due under this Subscription arrangement.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C6 No Set-Off or Counterclaim</strong><br />
                        The Owner shall not be entitled to withhold, delay, or deduct any Subscription Payment by way of set-off, counterclaim, or dispute against Company. All payments are to be made in full and without condition.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C7 Cross-Default with OCA Breaches</strong><br />
                        Any default, non-payment, or breach of this Subscription clause shall constitute an immediate cross-default under the Owner Collaboration Agreement. Company shall be entitled to exercise any and all remedies available under the OCA, including suspension of management services, deduction of outstanding sums from rental proceeds, and legal recovery of debt.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C8 Early Settlement Option</strong><br />
                        The Owner may elect to fully settle the outstanding Subscription Balance prior to the expiry of the 60-month tenure without penalty, provided that written notice is submitted to Company at least thirty (30) days in advance.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C9 Default and Enforcement</strong><br />
                        (a) Any Subscription Payment not received within fourteen (14) days of its due date shall accrue interest at eight percent (8%) per annum until full settlement.<br />
                        (b) Company reserves the right to suspend renovation warranties, management services, or tenant operations if payment default persists beyond thirty (30) days.<br />
                        (c) In the event of continued default, Company may lodge a private caveat over the Property, recover sums directly from rental income, or initiate legal proceedings for debt recovery and damages.<br />
                        (d) Any complaint, dispute, or claim raised by the Owner shall not suspend or defer the Owner's payment obligations herein.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C10 Retention of Title and Ownership</strong><br />
                        All furniture, fixtures, fittings, and materials installed or supplied under the Reno Subscription program shall remain the sole and exclusive property of Company until the Owner has fully settled all 60 Subscription Payments and any outstanding charges, fees, or penalties. In the event of non-payment, early termination or default by the Owner, Company reserves the right to remove, reclaim, or recover the equivalent monetary value for such items without liability. The Owner expressly agrees to grant Company or its authorised representatives access to the property for the purposes of exercising its rights under this clause.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C11 Administrative and Financing Fees</strong><br />
                        Any bank fees, administrative charges, or financing charges associated with this Subscription arrangement, including but not limited to Easy Payment Plan (EPP) or similar instalment facilities, shall be fully borne by the Owner.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C12 Payment Methods and Administrative Fee</strong><br />
                        Payments may be made via bank transfer, FPX, or credit/debit card. A two percent (2%) administrative fee applies for credit/debit card transactions for one-off payments, and all bank, gateway, or financing charges (including Easy Payment Plan or similar schemes) shall be borne solely by the Owner. The Company shall not be liable for any delays, failures, or additional charges arising from third-party payment platforms or financial institutions. The Company reserves the right to suspend or withhold further works, services, or deliveries in the event of delayed, failed, or reversed payments until such issues are fully resolved to the Company's satisfaction.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C13 Non-Refundability and Termination</strong><br />
                        (a) All payments made under this quotation are strictly non-refundable and deemed earned for services rendered or work completed.<br />
                        (b) Should the Owner terminate the collaboration or transfer management before the expiry of the 60-month Subscription tenure, all remaining unpaid Subscription Payments shall become immediately due in full.<br />
                        (c) Company shall have no obligation to refund or offset any prior payments made.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C14 Performance Disclaimer</strong><br />
                        Company shall exercise its best commercial efforts to optimise rental performance and maintain occupancy of the Property; however, the Owner acknowledges that Subscription Payments are independent of rental income or tenant occupancy, and shall remain payable in full regardless of any vacancy, rental fluctuations, or tenant defaults.
                    </p>
                </>
            )}

            <h2 id="tnc-sec-4" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">4. Scope Variation & Change Requests</h2>
            <p className="text-justify leading-relaxed mb-3">
                <strong>4.1</strong> The renovation scope is strictly limited to the items, specifications, and work descriptions stated in the approved quotation and any accompanying design proposal (if any).
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>4.2</strong> No variation, substitution, omission, or addition to the approved scope shall be valid and binding unless:
            </p>
            <p className="text-justify leading-relaxed mb-3 pl-6">
                (a) Requested in writing by the Owner;<br />
                (b) Formally approved and accepted in writing by the Company; and<br />
                (c) Documented in a duly signed Variation Order ("VO") specifying the revised cost, scope, and any necessary extension of time.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>4.3</strong> Verbal instructions, informal communications, or implied requests or approvals shall not be recognised or enforceable under any circumstances.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>4.4</strong> The Company reserves the absolute right to reject any variation request that may:
            </p>
            <p className="text-justify leading-relaxed mb-3 pl-6">
                (a) delay or disrupt the project timeline,<br />
                (b) compromise the structural or design integrity of the works,<br />
                (c) breach building management or regulatory requirements, or<br />
                (d) conflict with the intended co-living functionality or overall design aesthetic.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>4.5</strong> All approved VO works shall be chargeable to the Owner and payable in full prior to commencement of the related works. The Company shall not be obligated to carry out any VO until such payment has been received and cleared in full.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>4.6</strong> For the avoidance of doubt, the approval of a VO shall automatically extend the renovation timeline on a reasonable best-effort basis and the Company shall not be liable for any delay, penalty, or claim arising therefrom.
            </p>

            <h2 id="tnc-sec-5" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">5. Limitation of Liability</h2>
            <p className="text-justify leading-relaxed mb-3">
                <strong>5.1</strong> The Company shall not be liable for any indirect, incidental, consequential, special, exemplary, or punitive damages, including but not limited to loss of profit, business opportunity, goodwill, or anticipated rental income. This exclusion applies regardless of the cause of action and even if the Company was advised of the possibility of such damages, except where such loss arises directly and solely from the Company's proven gross negligence or willful misconduct.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>5.2</strong> The Owner expressly acknowledges and accepts that reasonable variations in colour tone, material texture, finishing, pattern alignment, or visual appearance whether due to manufacturing differences, lighting conditions, or installation method shall not constitute a defect, non-conformity, or breach of contract.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>5.3</strong> The Company's total aggregate liability under this quotation and in relation to the associated works, whether in contract, tort, equity or otherwise, shall in no event exceed the total contract sum actually paid by the Owner to the Company under this quotation.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>5.4</strong> For the avoidance of doubt, the Company shall not be liable for any defects, damage, or loss arising from:
            </p>
            <p className="text-justify leading-relaxed mb-3 pl-6">
                (a) misuse or abuse of the delivered works or materials;<br />
                (b) poor maintenance or failure to maintain by the Owner or third parties;<br />
                (c) unauthorised alterations or modifications;<br />
                (d) environmental exposure or natural wear and tear;<br />
                (e) third-party interference; or<br />
                (f) any event or condition beyond the Company's reasonable control.
            </p>

            <h2 id="tnc-sec-6" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">6. Owner's Indemnity</h2>
            <p className="text-justify leading-relaxed mb-3">
                <strong>6.1</strong> The Owner shall fully indemnify, defend, and hold harmless BeLive Ventures Sdn Bhd ("Company"), its directors, officers, employees, contractors, and agents against all losses, claims, demands, penalties, liabilities, damages, expenses (including legal fees on a solicitor-and-client basis), or proceedings arising directly or indirectly from:
            </p>
            <p className="text-justify leading-relaxed mb-3 pl-6">
                (a) any act, default, omission, or negligence of the Owner or any person acting under the Owner's instruction;<br />
                (b) any breach of the terms of this quotation, the OCA, or any applicable law, by-law, or building management requirement; or<br />
                (c) any misrepresentation, false declaration, site interference, or failure by the Owner to obtain requisite permits, consents or approvals from relevant authorities or property management bodies.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                This indemnity shall survive the completion, expiration, or termination of this quotation and the OCA, and shall remain valid and enforceable until all claims, liabilities, or proceedings arising out of or in connection with the matters above have been fully resolved.
            </p>

            <h2 id="tnc-sec-7" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">7. Site Access & Safety</h2>
            <p className="text-justify leading-relaxed mb-3">
                <strong>7.1</strong> The Owner shall not enter, occupy, or permit any third party to enter the Property during renovation period without prior written notice and approval from Company. Unauthorized entry may result in delays, damage, or safety hazards. Company shall not be responsible or liable whatsoever for any loss, injury, or accident arising from such unauthorized access.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>7.2</strong> The Owner shall not store personal items, materials, or equipment at the site, nor engage or permit any third-party contractors, vendors, or visitors to access or perform work at the Property without Company's prior written consent.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>7.3</strong> Company reserves the absolute right to suspend or terminate this engagement with immediately effect if the Owner, or any person acting on the Owner's behalf, obstructs site operations, creates or contributes to unsafe conditions, interferes with Company's personnel or contractors, or violates any building management or statutory safety regulations. In such circumstances, the Company shall not be liable for any resulting delay, cost or loss. All additional costs, damages or liabilities arising from such suspension or termination shall be fully borne by the Owner.
            </p>

            <h2 id="tnc-sec-8" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">8. Governing Law, Dispute Resolution & Evidence</h2>
            <p className="text-justify leading-relaxed mb-3">
                <strong>8.1</strong> This quotation and its Terms & Conditions shall be governed by and construed in accordance with the laws of Malaysia.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>8.2</strong> The Parties shall use their best efforts to resolve any dispute, controversy, or claim arising out of or in connection with this quotation through written consultation and good-faith negotiation. Failing amicable settlement within thirty (30) days, either Party may refer the matter to the courts of Malaysia for final adjudication.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>8.3</strong> The courts of Malaysia shall have <strong>exclusive jurisdiction</strong> over all disputes arising from or relating to this quotation and its enforcement, and each Party irrevocably submits to such jurisdiction.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>8.4</strong> Electronic Evidence & Communication Validity:
            </p>
            <p className="text-justify leading-relaxed mb-3">
                All communications, approvals, authorisations, or records exchanged via electronic means—including but not limited to email, WhatsApp, project management platforms, and digital signature systems—shall be deemed valid, legally binding, and admissible as evidence of agreement between the Parties. No Party shall dispute the validity, enforceability or admissibility of this quotation or any related documents solely on the basis that they were executed, transmitted, or stored electronically.
            </p>

            <p className="text-center font-bold mt-6 mb-3">(End of Terms & Conditions)</p>
        </div>
    )

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-slate-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 w-64 bg-slate-200 rounded" />
                        <div className="h-4 w-96 bg-slate-200 rounded" />
                        <div className="h-40 w-full bg-slate-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="w-full min-h-screen bg-slate-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Unable to load details</h1>
                    <p className="mt-3 text-slate-500">{error || 'Campaign not found'}</p>
                    <div className="mt-8">
                        <Link
                            to=".."
                            className="inline-flex items-center gap-2 px-5 py-3 bg-campaign text-white rounded-xl hover:bg-campaign-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-slate-50">
            {/* Top bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-700" />
                        </button>
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Campaign package detail</div>
                            <div className="font-semibold text-slate-900">{campaign.title}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header card */}
                <Card className="p-6 sm:p-8">
                    <h1 className="text-2xl font-bold text-slate-900">{selectedCampaignPackage?.name || campaign.title}</h1>
                    {selectedCampaignPackage?.description && (
                        <p className="text-sm mt-3 text-slate-500 leading-relaxed whitespace-pre-line">{selectedCampaignPackage.description}</p>
                    )}
                </Card>

                {/* Tabs */}
                <Tabs
                    tabs={[
                        { key: 'quotation', label: 'Quotation' },
                        { key: 'tnc', label: 'Terms & Conditions' },
                    ]}
                    active={activeTab}
                    onChange={(k) => setActiveTab(k as 'quotation' | 'tnc')}
                />

                {activeTab === 'tnc' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Contents index (presentational; in-page anchors) */}
                        <aside className="hidden lg:block">
                            <div className="sticky top-24">
                                <Card className="p-5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Contents</p>
                                    <nav className="flex flex-col gap-1.5 text-sm">
                                        <a href="#tnc-sec-1" className="text-slate-500 hover:text-campaign transition-colors">1. Engagement &amp; Validity</a>
                                        <a href="#tnc-sec-2" className="text-slate-500 hover:text-campaign transition-colors">2. Renovation Period</a>
                                        <a href="#tnc-sec-3" className="text-slate-500 hover:text-campaign transition-colors">3. Payment Terms</a>
                                        <a href="#tnc-sec-4" className="text-slate-500 hover:text-campaign transition-colors">4. Scope Variation</a>
                                        <a href="#tnc-sec-5" className="text-slate-500 hover:text-campaign transition-colors">5. Limitation of Liability</a>
                                        <a href="#tnc-sec-6" className="text-slate-500 hover:text-campaign transition-colors">6. Owner&apos;s Indemnity</a>
                                        <a href="#tnc-sec-7" className="text-slate-500 hover:text-campaign transition-colors">7. Site Access &amp; Safety</a>
                                        <a href="#tnc-sec-8" className="text-slate-500 hover:text-campaign transition-colors">8. Governing Law</a>
                                    </nav>
                                </Card>
                            </div>
                        </aside>
                        <div className="lg:col-span-2">
                            <Card className="p-6 sm:p-7">{tnc}</Card>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                            {!selectedCampaignPackage ? (
                                <Card className="p-8 text-center">
                                    <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                        <PackageIcon className="h-6 w-6 text-slate-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">Package not found</h3>
                                    <p className="mt-2 text-slate-500">This campaign package doesn&apos;t exist.</p>
                                </Card>
                            ) : !templateOrder || !templateQuotation ? (
                                <Card className="p-8 text-center">
                                    <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                        <PackageIcon className="h-6 w-6 text-slate-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">No template order configured</h3>
                                    <p className="mt-2 text-slate-500">This campaign package doesn&apos;t have a linked template order yet.</p>
                                </Card>
                            ) : (
                                <>
                                    {/* Payment Summary */}
                                    <div ref={paymentSummaryRef}>
                                    <Card className="p-6">
                                        <div className="flex flex-col space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <Pill tone="brand">
                                                <CreditCard className="h-4 w-4" aria-label="Payment Icon" />
                                                {templateOrder.is_be_powered ? 'Reno Subscription' : templateOrder.is_rnpl ? 'RenoNow PayLater' : 'Full Payment'}
                                            </Pill>

                                            {selectedProgram !== 'rnpl' && (
                                                <select
                                                    className="rounded-lg border-slate-200 text-sm bg-white py-1.5 px-3"
                                                    id="payment_plan"
                                                    value={selectedPlan}
                                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                                    name="payment_plan"
                                                    disabled={selectedProgram === 'bePowered'}
                                                >
                                                    {selectedProgram !== 'bePowered' && <option value="36">36 months</option>}
                                                    <option value="60">60 months</option>
                                                </select>
                                            )}
                                        </div>
                                        <div className="flex justify-between">
                                            {selectedProgram === 'normal' ? (
                                                <div className="flex flex-col items-start w-full">
                                                    <p className="text-2xl text-campaign font-bold">
                                                        RM{' '}
                                                        {(
                                                            ((totalExcludedAddonAmount - bonusValue) * (selectedPlan === '60' ? 1.14 : 1.105)) /
                                                            Number(selectedPlan)
                                                        ).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                        <span className="text-sm text-slate-500">/month </span>
                                                        <span className="text-xs text-slate-500">for {selectedPlan === '60' ? '60' : '36'} months</span>
                                                    </p>
                                                    <div className="flex justify-between w-full">
                                                        <button
                                                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-campaign hover:text-campaign-600 transition-colors"
                                                            onClick={() => setActiveTab('tnc')}
                                                            type="button"
                                                        >
                                                            <InformationCircleIcon className="w-4 h-4" aria-label="Payment Info" />
                                                            <span>(Terms &amp; Conditions)</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : selectedProgram === 'bePowered' ? (
                                                <div className="flex flex-col items-start w-full">
                                                    <p className="text-2xl text-campaign font-bold">
                                                        <span className="text-sm text-slate-500">Total </span>
                                                        RM {(upfrontAmount - bonusValue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                        <span className="text-sm text-slate-500"> Upfront</span>
                                                    </p>
                                                    <div className="flex w-full justify-between">
                                                        <p className="text-sm text-campaign font-bold">
                                                            <span className="text-sm text-slate-500">pay </span>
                                                            RM{' '}
                                                            {(templateOrder.installment_method === 'fixed'
                                                                ? Number(templateOrder.installment_amount || 0)
                                                                : totalExcludedAddonAmount - bonusValue - upfrontAmount
                                                            ).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                            <span className="text-xs text-slate-500"> for {templateOrder?.tenure || 60} months</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-start w-full">
                                                    <p className="text-2xl text-campaign font-bold">
                                                        <span className="text-sm text-slate-500">
                                                            Kickstart <span className="text-2xl text-campaign font-bold">NOW</span> by just paying{' '}
                                                        </span>
                                                        RM {totalRenoNowPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {selectedProgram === 'normal' && (
                                            <div className="flex items-start justify-between mt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500">
                                                        <strong>Or</strong> pay one-time: RM{' '}
                                                        {(totalExcludedAddonAmount - bonusValue).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {selectedProgram === 'rnpl' && (
                                            <div className="flex items-start justify-between mt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500">
                                                        Remaining RM{' '}
                                                        {((totalExcludedAddonAmount - totalRenoNowPrice) - bonusValue).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}{' '}
                                                        covered by tenants
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        </div>
                                    </Card>
                                    </div>

                                    {/* Pricing summary */}
                                    <Card className="p-6 divide-y divide-slate-100">
                                        {bonus && (
                                            <div className="pb-4">
                                                <div className="rounded-xl bg-teal-50/50 p-4">
                                                    <h3 className="text-xs text-teal-700 font-bold">Discount:</h3>
                                                    <div className="text-xs text-slate-500 font-medium space-y-2 mt-1">
                                                        {(bonus.description?.split('\n') || ['No Details']).map((item: string, index: number) => (
                                                            <p key={index} className="mb-1 last:mb-0">
                                                                {item}
                                                            </p>
                                                        ))}
                                                    </div>
                                                    {Number(bonus?.value) !== 0 && (
                                                        <div className="flex justify-between items-center mt-2">
                                                            <span className="text-xs text-slate-500 font-medium">Total Discount:</span>
                                                            <p className="text-sm text-teal-700 font-bold">
                                                                RM{' '}
                                                                {Number(bonus.value).toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center py-3">
                                            <span className="text-sm text-slate-500">Total Quotation Amount</span>
                                            <span className="text-sm text-slate-900 font-semibold whitespace-nowrap">
                                                RM{' '}
                                                {displayTotalQuotationAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center py-3">
                                            <span className="text-sm text-slate-500">Payment Terms</span>
                                            <span className="text-sm text-slate-900 font-semibold whitespace-nowrap">
                                                {selectedProgram === 'bePowered'
                                                    ? 'Reno Subscription'
                                                    : selectedProgram === 'rnpl'
                                                        ? 'RenoNow PayLater'
                                                        : 'Full Payment'}
                                            </span>
                                        </div>

                                        {/* [Q1] Initial Down Payment breakdown with non-refundable booking fee */}
                                        {!templateOrder?.is_progressive_payment && !templateOrder?.is_be_powered && !templateOrder?.is_rnpl ? null : (
                                            <div className="py-3">
                                                {bookingFee > 0 ? (
                                                    <>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-slate-500 flex items-center gap-2">
                                                                Booking Fee
                                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">Non-refundable</span>
                                                            </span>
                                                            <span className="text-sm text-red-600 font-semibold whitespace-nowrap">
                                                                − RM {bookingFee.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-2">
                                                            <span className="text-sm font-semibold text-slate-900">Initial Down Payment</span>
                                                            <span className="text-sm text-slate-900 font-bold whitespace-nowrap">
                                                                RM {(originalInitialDownPayment - bookingFee).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1 pl-4">
                                                            <span className="text-xs text-slate-400">Original Initial Down Payment</span>
                                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                                RM {originalInitialDownPayment.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-slate-500">Initial Down Payment</span>
                                                        <span className="text-sm text-slate-900 font-semibold whitespace-nowrap">
                                                            RM {originalInitialDownPayment.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!templateOrder?.is_progressive_payment && !templateOrder?.is_be_powered && !templateOrder?.is_rnpl ? null : (
                                            <div className="flex flex-col space-y-1 py-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500">Balance Payment</span>
                                                    {selectedProgram === 'bePowered' && (
                                                        templateOrder?.installment_method === 'fixed' ? (
                                                            <span className="text-sm text-slate-900 font-semibold whitespace-nowrap">
                                                                RM {Number(templateOrder.installment_amount || 0).toLocaleString(undefined, {
                                                                    minimumFractionDigits: 0,
                                                                    maximumFractionDigits: 2,
                                                                })}/mth
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-slate-900 font-semibold whitespace-nowrap">
                                                                RM {(totalExcludedAddonAmount - bonusValue - upfrontAmount).toLocaleString(undefined, {
                                                                    minimumFractionDigits: 0,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </span>
                                                        )
                                                    )}
                                                    {selectedProgram === 'rnpl' && (
                                                        <span className="text-sm text-slate-900 font-semibold whitespace-nowrap">
                                                            RM {(totalExcludedAddonAmount - bonusValue - totalRenoNowPrice).toLocaleString(undefined, {
                                                                minimumFractionDigits: 0,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    )}
                                                    {selectedProgram !== 'rnpl' && selectedProgram !== 'bePowered' && (
                                                        <span className="text-sm text-slate-900 font-semibold whitespace-nowrap">
                                                            RM {(totalExcludedAddonAmount / 2).toLocaleString(undefined, {
                                                                minimumFractionDigits: 0,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    )}
                                                </div>
                                                {selectedProgram === 'bePowered' && (
                                                    <div className="flex justify-end">
                                                        <span className="text-xs text-slate-400 italic">Pay in {templateOrder?.tenure || 60} mths</span>
                                                    </div>
                                                )}
                                                {selectedProgram === 'rnpl' && (
                                                    <div className="flex justify-end">
                                                        <span className="text-xs text-slate-400 italic">Pay through RPM</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>

                                    {/* Quotation packages */}
                                    <div className="space-y-4">
                                        {(() => {
                                            const pkgs = effectivePackages;
                                            const regularPackages = pkgs.filter((pkg) => !pkg.is_addon);
                                            const addonPackages = pkgs.filter((pkg) => pkg.is_addon === true);

                                            const renderPackage = (pkg: Package, isAddon: boolean) => {
                                                const pkgId = String(pkg.id ?? pkg.name ?? 'pkg');
                                                const products = ((pkg.products || []) as Product[]).filter((p) => p.pivot?.visibility == true);
                                                const included = isAddon
                                                    ? (pkgId in addonOverrides ? addonOverrides[pkgId] : pkg.is_addon_included !== false)
                                                    : true;
                                                const showToggle = isAddon && !templateOrder?.f_1;

                                                const accordion = (
                                                    <AccordionItem
                                                        key={pkgId}
                                                        open={!!expandedPackageIds[pkgId]}
                                                        onToggle={() => togglePackage(pkgId)}
                                                        className={isAddon ? `border-slate-200 bg-slate-50/50 ${included ? '' : 'opacity-60'}` : ''}
                                                        headerClassName="bg-slate-50/70 hover:bg-slate-100"
                                                        header={
                                                            <div>
                                                                {isAddon && (
                                                                    <div className="mb-1.5">
                                                                        <Pill tone="brand">Add-on</Pill>
                                                                    </div>
                                                                )}
                                                                <div className={`text-sm font-semibold text-slate-900 ${isAddon && !included ? 'line-through decoration-slate-300' : ''}`}>{pkg.name || 'Package'}</div>
                                                                <div className="text-xs text-slate-400 mt-1">{products.length} item(s)</div>
                                                            </div>
                                                        }
                                                    >
                                                        {pkg.description && <p className="text-sm text-slate-500 mb-4 whitespace-pre-line">{pkg.description}</p>}

                                                        {products.length === 0 ? (
                                                            <div className="text-sm text-slate-500">No items in this package.</div>
                                                        ) : (
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr>
                                                                            <th className="text-slate-400 text-xs uppercase font-semibold py-2 pr-4 text-left min-w-[240px]">Item</th>
                                                                            <th className="text-slate-400 text-xs uppercase font-semibold py-2 px-3 text-center min-w-[80px]">Qty</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-50">
                                                                        {products.map((p) => (
                                                                            <tr key={String(p.id)}>
                                                                                <td className="py-3 pr-4">
                                                                                    <div className="text-sm font-medium text-slate-900">{p.name || '-'}</div>
                                                                                    {p.description && <div className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</div>}
                                                                                </td>
                                                                                <td className="text-sm text-slate-600 py-3 px-3 text-center">
                                                                                    {getProductQty(p)} {p.uom}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </AccordionItem>
                                                );

                                                if (!showToggle) return accordion;

                                                return (
                                                    <div key={pkgId}>
                                                        <div className="flex items-center justify-end mb-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleAddon(pkg)}
                                                                className="inline-flex items-center gap-2"
                                                                aria-pressed={included}
                                                                aria-label={`${included ? 'Exclude' : 'Include'} ${pkg.name || 'add-on'}`}
                                                            >
                                                                <span className={`text-xs font-semibold ${included ? 'text-campaign' : 'text-slate-400'}`}>{included ? 'Included' : 'Excluded'}</span>
                                                                <span className={`relative inline-block w-11 h-6 rounded-full transition-colors ${included ? 'bg-campaign' : 'bg-slate-200'}`}>
                                                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${included ? 'translate-x-5' : ''}`} />
                                                                </span>
                                                            </button>
                                                        </div>
                                                        {accordion}
                                                    </div>
                                                );
                                            };

                                            return (
                                                <>
                                                    {regularPackages.map((pkg) => renderPackage(pkg, false))}
                                                    {addonPackages.length > 0 && (
                                                        <div className="mt-4 space-y-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-campaign-50 text-campaign">
                                                                    <Award className="w-5 h-5" aria-label="Award Icon" />
                                                                </span>
                                                                <h3 className="text-sm font-bold text-slate-900">OPTIONAL ADD-ON PACKAGES</h3>
                                                            </div>
                                                            {addonPackages.map((pkg) => renderPackage(pkg, true))}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </>
                            )}
                    </div>
                )}
            </div>

            {/* [Q3] Mobile sticky payment bar — appears after the Payment Summary scrolls off; mirrors the gross primary figure. */}
            {activeTab === 'quotation' && selectedCampaignPackage && templateOrder && templateQuotation && (
                <div
                    className={`lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex items-center justify-between transition-transform duration-300 shadow-[0_-8px_24px_rgba(16,24,40,0.10)] ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}
                >
                    <div>
                        <p className="text-[10px] text-slate-400 leading-none uppercase tracking-wide">
                            {selectedProgram === 'bePowered' ? 'Reno Subscription' : selectedProgram === 'rnpl' ? 'RenoNow PayLater' : 'Full Payment'}
                        </p>
                        <p className="text-base font-extrabold text-slate-900 leading-tight mt-0.5">
                            {selectedProgram === 'normal' && (
                                <>
                                    RM {(((totalExcludedAddonAmount - bonusValue) * (selectedPlan === '60' ? 1.14 : 1.105)) / Number(selectedPlan)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    <span className="text-xs font-medium text-slate-500">/mo</span>
                                </>
                            )}
                            {selectedProgram === 'bePowered' && (
                                <>
                                    RM {(upfrontAmount - bonusValue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    <span className="text-xs font-medium text-slate-500"> upfront</span>
                                </>
                            )}
                            {selectedProgram === 'rnpl' && (
                                <>
                                    RM {totalRenoNowPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    <span className="text-xs font-medium text-slate-500"> to start</span>
                                </>
                            )}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setActiveTab('tnc')}
                        className="text-xs font-medium text-campaign hover:text-campaign-600 transition-colors"
                    >
                        Terms &amp; Conditions
                    </button>
                </div>
            )}
        </div>
    );
}

