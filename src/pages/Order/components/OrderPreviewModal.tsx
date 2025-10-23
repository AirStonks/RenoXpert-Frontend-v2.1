import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Order, OrderQuotation, Package, Product } from '../../../types';
import { AwardIcon, CreditCardIcon } from 'lucide-react';
import { CalendarDateRangeIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import KTComponent from '../../../metronic/core';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

interface OrderPreviewModalProps {
    orderDetail: Order;
    selectedQuotation: OrderQuotation;
    packageCategories: { category: string; total_price: number; cogs: number; quantity: number }[];
    formatDate: (dateStr: string) => string;
    totalExcludedAddonAmount: number;
}

const getCurrentDate = () => {
    const date = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options as Intl.DateTimeFormatOptions);
};

const convertToWords = (num: number) => {
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

    if (num < 10) {
        return ones[num];
    } else if (num >= 10 && num < 20) {
        return teens[num - 10];
    } else {
        const tenPart = Math.floor(num / 10);
        const onePart = num % 10;
        return tens[tenPart] + (onePart > 0 ? "-" + ones[onePart] : "");
    }
}

const OrderPreviewModal = ({
    orderDetail,
    selectedQuotation,
    packageCategories,
    formatDate,
    totalExcludedAddonAmount,
}: OrderPreviewModalProps) => {
    const [activeTab, setActiveTab] = useState('tab_1_1');
    const [agreeTnc, setAgreeTnc] = useState(false);
    const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({});
    const [selectedPlan, setSelectedPlan] = useState<string>("60")
    const [selectedProgram, setSelectedProgram] = useState<string>("normal")

    useEffect(() => {

        KTComponent.init();

        if (orderDetail) {
            setOpenAccordions(() => {
                const initialState: { [key: string]: boolean } = {};
                if (orderDetail) {
                    orderDetail.latest_quotation.packages.forEach((_, index) => {
                        initialState[`content_${index}`] = false;
                    });
                }
                return initialState;
            });

            setOpenAccordions((prev) => ({
                ...prev,
                property: false
            }));
        }
    }, [orderDetail]);

    useEffect(() => {
        if (orderDetail) {
            setOpenAccordions(() => {
                const initialState: { [key: string]: boolean } = {}
                if (orderDetail) {
                    orderDetail.latest_quotation.packages.forEach(
                        (item: Package, index: number) => {
                            initialState[`content_${index}`] = false
                        },
                    )
                }
                return initialState
            })

            setOpenAccordions((prev) => ({
                ...prev,
                property: false,
                amount_breakdown: false
            }))

            if (orderDetail.is_be_powered) {
                setSelectedPlan("60")
                setSelectedProgram("bePowered")
            }

            if (orderDetail.is_rnpl) {
                setSelectedPlan("60")
                setSelectedProgram("rnpl")
            }

        }
    }, [orderDetail])

    const toggleAccordion = (id: string) => {
        setOpenAccordions((prev) => ({
            ...prev,
            [id]: prev[id] == null ? false : !prev[id],
        }));
    };

    const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPlan = e.target.value
        setSelectedPlan(selectedPlan)
    }

    const handleAgreeTncChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAgreeTnc(event.target.checked);
    };


    const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedProgram = e.target.value
        setSelectedProgram(selectedProgram)

        if (selectedProgram === 'bePowered') {
            setSelectedPlan("60")
        }
    }

    const address = orderDetail.user ? [
        orderDetail.user.address.address_1,
        orderDetail.user.address.street,
        orderDetail.user.address.postcode,
        orderDetail.user.address.city,
        orderDetail.user.address.state,
    ]
        .filter(Boolean)
        .join(', ')
        :
        null;

    const propertyAddress = orderDetail.property ? [
        orderDetail.property.address,
        orderDetail.property.street,
        orderDetail.property.postcode,
        orderDetail.property.city,
        orderDetail.property.state
    ].filter(part => part !== null && part !== '') : null

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

            <h2 className="text-lg font-bold mt-6 mb-3">1. Engagement and Quotation Validity</h2>
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

            <h2 className="text-lg font-bold mt-6 mb-3">2. Renovation Period & Commencement Timeline</h2>
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
                <strong>2.3</strong> The Company shall commence or facilitate the commencement of work within seven (7) working days from the Actual Commencement Date. The renovation period shall be <strong>{convertToWords(orderDetail.completion_day).toUpperCase()} {orderDetail.completion_day} working days</strong> from the date of commencement. This timeline assumes that all necessary site access, approvals, and documentation are provided in a timely manner. Any delays not attributable to the Company may justify an extension of time for completion, subject to mutual agreement.
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

            <h2 className="text-lg font-bold mt-6 mb-3">3. Payment Terms</h2>

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
                        <strong>3.B8 Retention of Title</strong><br />
                        All furniture, fixtures, and installations supplied under this arrangement shall remain the sole and exclusive property of Company until the full Deferred Balance is received and settled. In the event of default or non-payment, Company reserves the right, without prior notice and without incurring any liability, to remove such items from the premises or to pursue recovery of their equivalent monetary value through legal means. The Owner expressly agrees to grant Company or its authorised representatives access to the premises, if necessary, to exercise its rights under this clause.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.B9 Performance Disclaimer</strong><br />
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
                        <strong>3.C12 Non-Refundability and Termination</strong><br />
                        (a) All payments made under this quotation are strictly non-refundable and deemed earned for services rendered or work completed.<br />
                        (b) Should the Owner terminate the collaboration or transfer management before the expiry of the 60-month Subscription tenure, all remaining unpaid Subscription Payments shall become immediately due in full.<br />
                        (c) Company shall have no obligation to refund or offset any prior payments made.
                    </p>
                    <p className="text-justify leading-relaxed mb-3">
                        <strong>3.C13 Performance Disclaimer</strong><br />
                        Company shall exercise its best commercial efforts to optimise rental performance and maintain occupancy of the Property; however, the Owner acknowledges that Subscription Payments are independent of rental income or tenant occupancy, and shall remain payable in full regardless of any vacancy, rental fluctuations, or tenant defaults.
                    </p>
                </>
            )}

            <h2 className="text-lg font-bold mt-6 mb-3">4. Scope Variation & Change Requests</h2>
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

            <h2 className="text-lg font-bold mt-6 mb-3">5. Limitation of Liability</h2>
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

            <h2 className="text-lg font-bold mt-6 mb-3">6. Owner's Indemnity</h2>
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

            <h2 className="text-lg font-bold mt-6 mb-3">7. Site Access & Safety</h2>
            <p className="text-justify leading-relaxed mb-3">
                <strong>7.1</strong> The Owner shall not enter, occupy, or permit any third party to enter the Property during renovation period without prior written notice and approval from Company. Unauthorized entry may result in delays, damage, or safety hazards. Company shall not be responsible or liable whatsoever for any loss, injury, or accident arising from such unauthorized access.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>7.2</strong> The Owner shall not store personal items, materials, or equipment at the site, nor engage or permit any third-party contractors, vendors, or visitors to access or perform work at the Property without Company's prior written consent.
            </p>
            <p className="text-justify leading-relaxed mb-3">
                <strong>7.3</strong> Company reserves the absolute right to suspend or terminate this engagement with immediately effect if the Owner, or any person acting on the Owner's behalf, obstructs site operations, creates or contributes to unsafe conditions, interferes with Company's personnel or contractors, or violates any building management or statutory safety regulations. In such circumstances, the Company shall not be liable for any resulting delay, cost or loss. All additional costs, damages or liabilities arising from such suspension or termination shall be fully borne by the Owner.
            </p>

            <h2 className="text-lg font-bold mt-6 mb-3">8. Governing Law, Dispute Resolution & Evidence</h2>
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

    const packages = orderDetail.latest_quotation.packages

    const upfrontAmount = packages.reduce((acc, pkg) => acc + (
        orderDetail.is_be_powered &&
            pkg.payment_method === "one-off" &&
            (pkg.is_addon ? pkg.is_addon_included === true : true)
            ? (pkg.markup_amount ? pkg.markup_amount : pkg.total_price) * (pkg.quantity || 1)
            : 0)
        , orderDetail.be_powered_base_price);

    const monthlySum = packages.reduce((acc, pkg) => acc + (
        orderDetail.is_be_powered &&
            pkg.payment_method !== 'one-off' &&
            (pkg.is_addon ? pkg.is_addon_included === true : true)
            ? pkg.monthly_amount * (pkg.quantity || 1)
            : 0)
        , 0);

    const totalRenoNowPrice = packages.reduce((total, pkg) => {
        if (pkg.rnpl_method === 'reno-now' && (pkg.is_addon === true && pkg.is_addon_included === true)) {
            return total + (pkg.markup_amount * (pkg.quantity || 1))
        }

        return total
    }, 0) + (orderDetail.rnpl_base_price || 0)

    return (
        <div className="modal p-4" data-modal="true" data-modal-backdrop-static="true" id="preview_order_modal">
            <div className="modal-content modal-overlay modal-center-y max-w-[460px] max-h-[920px]">
                <div className="modal-header">
                    <div className="modal-title text-md">
                        {orderDetail.status === 'confirmed' ? (
                            <span>Official Quotation (Preview)</span>
                        ) : (
                            <span>Official Quotation (Preview)</span>
                        )}
                    </div>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                        data-modal-dismiss="true"
                    >
                        <i className="ki-filled ki-cross"></i>
                    </button>
                </div>
                <div className={`modal-body overflow-y-auto scrollable-y flex flex-col mb-40`}>
                    {!orderDetail.user && (
                        <div className="badge text-sm w-full text-center mb-4 badge-warning badge-outline">
                            This is a Draft Quotation Order, not viewable to public
                        </div>
                    )}
                    <div className="tabs mb-3">
                        <button
                            className={`tab ${activeTab === 'tab_1_1' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tab_1_1')}
                        >
                            {orderDetail.status === 'confirmed' ? 'Overview' : 'Quotation Order'}
                        </button>
                        {orderDetail.status === 'confirmed' ? (
                            <button
                                className={`tab ${activeTab === 'tab_1_4' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tab_1_4')}
                            >
                                Quotation Order
                            </button>
                        ) : (
                            ''
                        )}
                        <button
                            className={`tab ${activeTab === 'tab_1_2' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tab_1_2')}
                        >
                            T&C
                        </button>

                    </div>
                    <div className={activeTab === 'tab_1_1' ? 'block' : 'hidden'} id="tab_1_1">
                        {/* Progress Bar */}
                        {orderDetail.status === "confirmed" && (
                            <div className="flex flex-col mb-4">
                                <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
                                    <span className="text-md text-gray-900 font-semibold">
                                        {(100 - orderDetail.sale.remaining_percentage * 100).toFixed(2)}% Invoice Issued
                                    </span>
                                    <div className="badge badge-success badge-outline text-sm mt-2 sm:mt-0">
                                        {(
                                            orderDetail.sale.invoices.reduce(
                                                (sum, invoice) => (invoice.status === "paid" ? sum + invoice.percentage : sum),
                                                0,
                                            ) * 100
                                        ).toFixed(2)}
                                        % Paid
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-blue-200"
                                        style={{ width: `${100 - orderDetail.sale.remaining_percentage * 100}%` }}
                                    />
                                    <div
                                        className="absolute top-0 left-0 h-full bg-green-500"
                                        style={{
                                            width: `${orderDetail.sale.invoices.reduce(
                                                (sum, invoice) => (invoice.status === "paid" ? sum + invoice.percentage : sum),
                                                0,
                                            ) * 100
                                                }%`,
                                        }}
                                    />
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <span className="badge badge-outline bg-blue-50 border-blue-200 text-blue-300 flex items-center gap-1">
                                        <span className="badge badge-dot size-1.5 bg-blue-300"></span> Issued
                                    </span>
                                    <span className="badge badge-outline badge-success flex items-center gap-1">
                                        <span className="badge badge-dot size-1.5 bg-green-500"></span> Paid
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Property */}
                        <div className="accordion-item flex-1 card mb-4 shadow-sm rounded-md">
                            <button
                                className="flex items-center justify-between gap-4 w-full text-2xs p-0 py-2 rounded-xl md:cursor-default transition duration-200 focus:outline-none"
                                onClick={() => toggleAccordion("property")}
                            >
                                <div className="card-body p-0 px-4 flex justify-around items-center">
                                    <span className="text-xs text-gray-600">Quote: QUO-2500031</span>
                                    <span className="text-xs text-gray-600">Date: 16 Apr 2025</span>
                                    {orderDetail.status !== "released" && (
                                        <div className="flex flex-col">
                                            {/* Quotation Status */}
                                            <span
                                                className={`badge badge-xs p-2 capitalize badge-outline ${orderDetail.status === "confirmed"
                                                    ? "badge-success"
                                                    : orderDetail.status === "voided"
                                                        ? "badge-danger"
                                                        : ""
                                                    }`}
                                            >
                                                {orderDetail.status === "confirmed" ? "Sale" : orderDetail.status}
                                            </span>
                                        </div>
                                    )}
                                    <i
                                        className={`ki-outline ${openAccordions["property"] !== false ? "ki-down" : "ki-right"
                                            } text-gray-600 text-xs transition-transform duration-300`}
                                    ></i>
                                </div>
                            </button>
                            <div
                                className={`border-t overflow-hidden transition-all duration-300 ease-in-out ${openAccordions["property"] !== false ? "max-h-screen" : "max-h-0"
                                    }`}
                            >
                                <div className="p-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: "Name", value: orderDetail.property ? orderDetail.property.name : "-" },
                                            {
                                                label: "Unit",
                                                value: orderDetail.property ? `${orderDetail.block}-${orderDetail.floor}-${orderDetail.unit_no}` : '-'
                                            },
                                            { label: "Unit Type", value: orderDetail.unit_type || "-" },
                                            {
                                                label: "Partition",
                                                value: orderDetail.include_partition ? "Yes" : "No",
                                            },
                                        ].map(({ label, value }) => (
                                            <div key={label}>
                                                <span className="text-xs text-gray-600">{label}:</span>
                                                <p className="text-xs text-gray-900 font-semibold">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-xs text-gray-600">Address:</span>
                                        <p className="text-xs text-gray-900">
                                            {orderDetail.property
                                                ? [
                                                    orderDetail.property.address,
                                                    orderDetail.property.street,
                                                    orderDetail.property.postcode,
                                                    orderDetail.property.city,
                                                    orderDetail.property.state,
                                                ]
                                                    .filter(Boolean)
                                                    .join(", ")
                                                : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="my-4" />

                        {/* Payment Invoices */}
                        {orderDetail.status === "confirmed" && (
                            <div className="mb-6">
                                <h2 className="text-md text-gray-900 font-semibold mb-4">Payment Invoices</h2>
                                {orderDetail.sale.invoices.length === 0 ? (
                                    <div className="flex flex-col items-center">
                                        <img
                                            alt="No invoices"
                                            className="max-h-[160px] mb-4"
                                            src={`${MEDIA_URL}illustrations/3${document.documentElement.classList.contains("dark") ? "-dark" : ""
                                                }.svg`}
                                        />
                                        <h3 className="text-md font-semibold text-gray-900">No Payment Invoices Available</h3>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {orderDetail.sale.invoices.map((invoice, index) => (
                                            <Link
                                                to={LOCAL_PATH_PREFIX + `invoice/${invoice.id}/view`}
                                                key={index}
                                                className="card bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow"
                                            >
                                                <div className="card-body p-4 flex flex-col">
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <div className="relative size-12 shrink-0">
                                                            <svg className="w-full h-full stroke-blue-500 fill-blue-100" viewBox="0 0 44 48">
                                                                <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xs text-gray-900 font-medium">{invoice.invoice_no}</h3>
                                                            <span
                                                                className={`badge badge-outline ${invoice.status === "paid"
                                                                    ? "badge-success"
                                                                    : invoice.status === "overdue"
                                                                        ? "badge-danger"
                                                                        : ""
                                                                    }`}
                                                            >
                                                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className="text-2xs text-gray-600">Amount:</span>
                                                        <p className="text-xs text-gray-900 font-medium">
                                                            RM{" "}
                                                            {invoice.amount.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className="text-2xs text-gray-600">Due Date:</span>
                                                        <p className="text-xs text-gray-900 font-medium">
                                                            {invoice.due_date
                                                                ? new Date(invoice.due_date).toLocaleDateString("en-GB", {
                                                                    day: "numeric",
                                                                    month: "long",
                                                                    year: "numeric",
                                                                })
                                                                : "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Packages and Summary */}
                        {orderDetail.status !== "confirmed" && (
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between bg-gray-50 py-3 px-4 rounded-t-lg border-b border-gray-200 mb-6">
                                    <div className="flex items-center gap-3">
                                        <svg
                                            className="w-5 h-5 text-blue-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M20 12H4m16-4H4m16 8H4m-2-6h20a2 2 0 012 2v6a2 2 0 01-2 2H2a2 2 0 01-2-2v-6a2 2 0 012-2z"
                                            />
                                        </svg>
                                        <h2 className="text-lg sm:text-xl text-blue-600 font-bold tracking-tight">Packages</h2>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {orderDetail
                                        ? (() => {
                                            let packageCounter = 0
                                            let addonCounter = 0
                                            const packages = orderDetail.latest_quotation.packages

                                            const regularPackages = packages.filter((prodPackage: Package) => !prodPackage.is_addon)
                                            const addonPackages = packages.filter((prodPackage: Package) => prodPackage.is_addon)

                                            const renderPackage = (prodPackage: Package, index: number, isAddon: boolean) => {
                                                const counter = isAddon ? addonCounter++ : packageCounter++
                                                const accordionId = `content_${index}`
                                                const isOpen = openAccordions[accordionId] !== false

                                                return (
                                                    <div
                                                        className={`accordion-item border rounded-xl w-full shadow-sm bg-white ${prodPackage.is_addon_included ? " border-blue-600" : ""}`}
                                                        key={index}
                                                    >
                                                        <button
                                                            className="flex items-center justify-between gap-4 w-full text-2xs p-4 rounded-xl hover:bg-gray-50 transition duration-200 focus:outline-none"
                                                            onClick={() => toggleAccordion(`content_${index}`)}
                                                        >
                                                            <div className="flex items-center flex-grow text-left w-full">
                                                                <div className="flex flex-col w-full">
                                                                    {isAddon ? (
                                                                        <>
                                                                            <div className="flex justify-between">
                                                                                <span className="font-bold text-gray-800 text-2xs">
                                                                                    Add-on Option {counter + 1}:
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-sm font-semibold text-gray-900">
                                                                                {prodPackage.name}
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-sm font-semibold text-gray-900">
                                                                                {prodPackage.name}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <ul className="text-xs text-gray-500 mt-1 max-w-md">
                                                                        {prodPackage?.description?.split("\n").map((item, index) => (
                                                                            <li key={index} className="flex items-start">
                                                                                {item}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-4">
                                                                {isAddon ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        <label className="switch switch-lg">
                                                                            <input
                                                                                className="checkbox"
                                                                                type="checkbox"
                                                                                checked={!!prodPackage.is_addon_included}
                                                                                readOnly
                                                                            />
                                                                        </label>
                                                                        <div className="inline-block">
                                                                            <span className={`badge ${isAddon ? "bg-white border-blue-300" : ""}`}>
                                                                                x{prodPackage.quantity}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="inline-block">
                                                                            <span className="badge bg-white border-gray-300">
                                                                                x{prodPackage.quantity}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <i
                                                                    className={`ki-outline ${isOpen ? "ki-down" : "ki-right"} text-gray-600 text-xs transition-transform duration-300`}
                                                                ></i>
                                                            </div>
                                                        </button>
                                                        <div
                                                            className={`border-t overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[9999px]" : "max-h-0"}`}
                                                        >
                                                            <div className="p-4">
                                                                <h2 className="text-xs font-semibold text-gray-800 mb-3">Products</h2>
                                                                <table className="w-full text-xs text-left border-collapse">
                                                                    <thead>
                                                                        <tr
                                                                            className={`border-b ${isAddon ? "bg-white border-gray-300" : "bg-gray-100"}`}
                                                                        >
                                                                            <th className="p-3 font-medium text-gray-700">S.o.W</th>
                                                                            <th className="p-3 font-medium text-gray-700">Product</th>
                                                                            <th className="p-3 font-medium text-gray-700">Quantity</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {prodPackage.products.map((product: Product, idx: number) => {
                                                                            const isSupplyAndInstall =
                                                                                product.pivot.includeSupply || product.pivot.includeInstall

                                                                            if (product.pivot.visibility) {
                                                                                if (isSupplyAndInstall) {
                                                                                    return (
                                                                                        <tr
                                                                                            key={idx}
                                                                                            className={`border-b hover:bg-gray-100 transition duration-150 ${isAddon ? " border-gray-300" : ""}`}
                                                                                        >
                                                                                            <td className="py-3 px-2 text-gray-700 text-left">
                                                                                                {product.pivot.includeSupply && product.pivot.includeInstall
                                                                                                    ? "Supply & Install"
                                                                                                    : product.pivot.includeSupply
                                                                                                        ? "Supply"
                                                                                                        : "Install"}
                                                                                            </td>
                                                                                            <td className="p-3">
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="font-medium text-gray-900">
                                                                                                        {product.name}
                                                                                                    </span>
                                                                                                    <span className="text-2xs text-gray-600 mt-1">
                                                                                                        {product.description || "-"}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="p-3 text-gray-700">
                                                                                                {product.pivot.quantity} {product.uom}
                                                                                                {product.pivot.quantity > 1 ? "s" : ""}
                                                                                            </td>
                                                                                        </tr>
                                                                                    )
                                                                                }
                                                                            }
                                                                            return null
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <>
                                                    {regularPackages.map((prodPackage: Package, index: number) =>
                                                        renderPackage(prodPackage, index, false),
                                                    )}
                                                    {addonPackages.length > 0 && (
                                                        <div className="mt-2 ml-1 space-y-4 p-2 py-4 rounded-xl border bg-blue-50 border-blue-600">
                                                            <div className="font-bold flex items-center gap-1">
                                                                <AwardIcon className="w-8 h-8 text-orange-500" aria-label="Payment Icon" />
                                                                <h3>OPTIONAL ADD-ON PACKAGES: </h3>
                                                            </div>
                                                            {addonPackages.map((prodPackage: Package, index: number) =>
                                                                renderPackage(prodPackage, regularPackages.length + index, true),
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )
                                        })()
                                        : null}
                                    <hr className="my-4" />

                                    {!orderDetail.is_be_powered && !orderDetail.is_rnpl && (
                                        <div className="card mb-4 shadow-sm rounded-md">
                                            <div className="card-body p-4">
                                                <div className="flex flex-col mb-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1 mb-2">
                                                            <CalendarDateRangeIcon className="w-5 h-5 text-blue-600" aria-label="Payment Icon" />
                                                            <span className="text-xs font-semibold text-gray-700">
                                                                Progressive Payment of the Contract Sum
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <table className="w-full text-xs text-gray-700 font-medium border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b border-gray-200">
                                                            <th className="p-3 text-left font-semibold text-gray-700">Description</th>
                                                            <th className="p-3 text-center font-semibold text-gray-700">%</th>
                                                            <th className="p-3 text-center font-semibold text-gray-700">Amount (RM)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {orderDetail.is_progressive_payment ? (
                                                            [
                                                                {
                                                                    desc: "Upon Confirmation and before Commencement of Phase 1",
                                                                    percent: 50,
                                                                },
                                                                {
                                                                    desc: "Upon Completion of Phase 1 and before Commencement of Phase 2",
                                                                    percent: 50,
                                                                },
                                                            ].map((row, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className="border-b border-gray-200 hover:bg-gray-50 transition duration-150"
                                                                >
                                                                    <td className="p-3 text-gray-600 max-w-xs">{row.desc}</td>
                                                                    <td className="p-3 text-center">{row.percent}%</td>
                                                                    <td className="p-3 text-center">
                                                                        {((totalExcludedAddonAmount - (Number(selectedQuotation.bonus?.value) || 0)) / 2).toLocaleString(
                                                                            undefined,
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            },
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr className="border-b border-gray-200 hover:bg-gray-50 transition duration-150">
                                                                <td className="p-3 text-gray-600 max-w-xs">Upon Confirmation of Agreement</td>
                                                                <td className="p-3 text-center">100%</td>
                                                                <td className="p-3 text-center">
                                                                    {(totalExcludedAddonAmount - (Number(selectedQuotation.bonus?.value) || 0)).toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr className="font-bold bg-gray-50 border-t border-gray-200">
                                                            <td className="p-3 text-gray-700">Total</td>
                                                            <td className="p-3 text-center">100%</td>
                                                            <td className="p-3 text-center">
                                                                {(totalExcludedAddonAmount - (Number(selectedQuotation.bonus?.value) || 0)).toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Checkboxes */}
                        {orderDetail.status !== "confirmed" && (
                            <div className="flex flex-col gap-4 my-6">
                                {[
                                    {
                                        name: "agree_tnc",
                                        label: "Terms and Conditions",
                                        checked: agreeTnc,
                                        onChange: handleAgreeTncChange,
                                        tab: "tab_1_2",
                                    },
                                ].map(({ name, label, checked, onChange, tab }) => (
                                    <label key={name} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            name={name}
                                            checked={checked || orderDetail.status === "confirmed"}
                                            onChange={onChange}
                                            disabled={orderDetail.status === "confirmed"}
                                        />
                                        <span className="text-xs">
                                            I have read and accept the{" "}
                                            <a
                                                href="#"
                                                className="text-blue-500 hover:underline"
                                                onClick={() => setActiveTab(tab)}
                                            >
                                                {label}
                                            </a>
                                        </span>
                                    </label>
                                ))}
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="checkbox"
                                        name="agree_partition_risk"
                                    // checked={agreePartitionRisk || orderDetail.status === "confirmed"}
                                    // onClick={handleAgreePartitionRisk}
                                    // disabled={orderDetail.status === "confirmed"}
                                    />
                                    <span className="text-xs">I understand and acknowledge the risk of Partioning</span>
                                </label>
                                {orderDetail.status === "released" && (
                                    <div className="flex justify-center mt-2">
                                        <button
                                            className="btn btn-md btn-primary rounded-3xl shadow-lg text-xs text-center"
                                        // onClick={handleAgreeOrder}
                                        // disabled={isButtonDisabled}
                                        >
                                            Agree Quotation Order
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className={activeTab === 'tab_1_4' ? 'block' : 'hidden'} id="tab_1_4">
                        {orderDetail.status === "confirmed" && (
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between bg-gray-50 py-3 px-4 rounded-t-lg border-b border-gray-200 mb-6">
                                    <div className="flex items-center gap-3">
                                        <svg
                                            className="w-5 h-5 text-blue-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M20 12H4m16-4H4m16 8H4m-2-6h20a2 2 0 012 2v6a2 2 0 01-2 2H2a2 2 0 01-2-2v-6a2 2 0 012-2z"
                                            />
                                        </svg>
                                        <h2 className="text-lg sm:text-xl text-blue-600 font-bold tracking-tight">Packages</h2>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {orderDetail
                                        ? (() => {
                                            let packageCounter = 0
                                            let addonCounter = 0
                                            const packages = orderDetail.latest_quotation.packages

                                            const regularPackages = packages.filter((prodPackage: Package) => !prodPackage.is_addon)
                                            const addonPackages = packages.filter((prodPackage: Package) => prodPackage.is_addon)

                                            const renderPackage = (prodPackage: Package, index: number, isAddon: boolean) => {
                                                const counter = isAddon ? addonCounter++ : packageCounter++
                                                const accordionId = `content_${index}`
                                                const isOpen = openAccordions[accordionId] !== false

                                                return (
                                                    <div
                                                        className={`accordion-item border rounded-xl w-full shadow-sm bg-white ${prodPackage.is_addon_included ? " border-blue-600" : ""}`}
                                                        key={index}
                                                    >
                                                        <button
                                                            className="flex items-center justify-between gap-4 w-full text-2xs p-4 rounded-xl hover:bg-gray-50 transition duration-200 focus:outline-none"
                                                            onClick={() => toggleAccordion(`content_${index}`)}
                                                        >
                                                            <div className="flex items-center flex-grow text-left w-full">
                                                                <div className="flex flex-col w-full">
                                                                    {isAddon ? (
                                                                        <>
                                                                            <div className="flex justify-between">
                                                                                <span className="font-bold text-gray-800 text-2xs">
                                                                                    Add-on Option {counter + 1}:
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-sm font-semibold text-gray-900">
                                                                                {prodPackage.name}
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-sm font-semibold text-gray-900">
                                                                                {prodPackage.name}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <ul className="text-xs text-gray-500 mt-1 max-w-md">
                                                                        {prodPackage?.description?.split("\n").map((item, index) => (
                                                                            <li key={index} className="flex items-start">
                                                                                {item}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-4">
                                                                {isAddon ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        <label className="switch switch-lg">
                                                                            <input
                                                                                className="checkbox"
                                                                                type="checkbox"
                                                                                checked={!!prodPackage.is_addon_included}
                                                                                readOnly
                                                                            />
                                                                        </label>
                                                                        <div className="inline-block">
                                                                            <span className={`badge ${isAddon ? "bg-white border-blue-300" : ""}`}>
                                                                                x{prodPackage.quantity}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="inline-block">
                                                                            <span className="badge bg-white border-gray-300">
                                                                                x{prodPackage.quantity}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <i
                                                                    className={`ki-outline ${isOpen ? "ki-down" : "ki-right"} text-gray-600 text-xs transition-transform duration-300`}
                                                                ></i>
                                                            </div>
                                                        </button>
                                                        <div
                                                            className={`border-t overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[9999px]" : "max-h-0"}`}
                                                        >
                                                            <div className="p-4">
                                                                <h2 className="text-xs font-semibold text-gray-800 mb-3">Products</h2>
                                                                <table className="w-full text-xs text-left border-collapse">
                                                                    <thead>
                                                                        <tr
                                                                            className={`border-b ${isAddon ? "bg-white border-gray-300" : "bg-gray-100"}`}
                                                                        >
                                                                            <th className="p-3 font-medium text-gray-700">S.o.W</th>
                                                                            <th className="p-3 font-medium text-gray-700">Product</th>
                                                                            <th className="p-3 font-medium text-gray-700">Quantity</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {prodPackage.products.map((product: Product, idx: number) => {
                                                                            const isSupplyAndInstall =
                                                                                product.pivot.includeSupply || product.pivot.includeInstall

                                                                            if (product.pivot.visibility) {
                                                                                if (isSupplyAndInstall) {
                                                                                    return (
                                                                                        <tr
                                                                                            key={idx}
                                                                                            className={`border-b hover:bg-gray-100 transition duration-150 ${isAddon ? " border-gray-300" : ""}`}
                                                                                        >
                                                                                            <td className="py-3 px-2 text-gray-700 text-left">
                                                                                                {product.pivot.includeSupply && product.pivot.includeInstall
                                                                                                    ? "Supply & Install"
                                                                                                    : product.pivot.includeSupply
                                                                                                        ? "Supply"
                                                                                                        : "Install"}
                                                                                            </td>
                                                                                            <td className="p-3">
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="font-medium text-gray-900">
                                                                                                        {product.name}
                                                                                                    </span>
                                                                                                    <span className="text-2xs text-gray-600 mt-1">
                                                                                                        {product.description || "-"}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="p-3 text-gray-700">
                                                                                                {product.pivot.quantity} {product.uom}
                                                                                                {product.pivot.quantity > 1 ? "s" : ""}
                                                                                            </td>
                                                                                        </tr>
                                                                                    )
                                                                                }
                                                                            }
                                                                            return null
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <>
                                                    {regularPackages.map((prodPackage: Package, index: number) =>
                                                        renderPackage(prodPackage, index, false),
                                                    )}
                                                    {addonPackages.length > 0 && (
                                                        <div className="mt-2 ml-1 space-y-4 p-2 py-4 rounded-xl border bg-blue-50 border-blue-600">
                                                            <div className="font-bold flex items-center gap-1">
                                                                <AwardIcon className="w-8 h-8 text-orange-500" aria-label="Payment Icon" />
                                                                <h3>OPTIONAL ADD-ON PACKAGES: </h3>
                                                            </div>
                                                            {addonPackages.map((prodPackage: Package, index: number) =>
                                                                renderPackage(prodPackage, regularPackages.length + index, true),
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )
                                        })()
                                        : null}
                                    <hr className="my-4" />

                                    {!orderDetail.is_be_powered && !orderDetail.is_rnpl && (
                                        <div className="card mb-4 shadow-sm rounded-md">
                                            <div className="card-body p-4">
                                                <div className="flex flex-col mb-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1 mb-2">
                                                            <CalendarDateRangeIcon className="w-5 h-5 text-blue-600" aria-label="Payment Icon" />
                                                            <span className="text-xs font-semibold text-gray-700">
                                                                Progressive Payment of the Contract Sum
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <table className="w-full text-xs text-gray-700 font-medium border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b border-gray-200">
                                                            <th className="p-3 text-left font-semibold text-gray-700">Description</th>
                                                            <th className="p-3 text-center font-semibold text-gray-700">%</th>
                                                            <th className="p-3 text-center font-semibold text-gray-700">Amount (RM)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {orderDetail.is_progressive_payment ? (
                                                            [
                                                                {
                                                                    desc: "Upon Confirmation and before Commencement of Phase 1",
                                                                    percent: 50,
                                                                },
                                                                {
                                                                    desc: "Upon Completion of Phase 1 and before Commencement of Phase 2",
                                                                    percent: 50,
                                                                },
                                                            ].map((row, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className="border-b border-gray-200 hover:bg-gray-50 transition duration-150"
                                                                >
                                                                    <td className="p-3 text-gray-600 max-w-xs">{row.desc}</td>
                                                                    <td className="p-3 text-center">{row.percent}%</td>
                                                                    <td className="p-3 text-center">
                                                                        {((totalExcludedAddonAmount - (Number(selectedQuotation.bonus?.value) || 0)) / 2).toLocaleString(
                                                                            undefined,
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            },
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr className="border-b border-gray-200 hover:bg-gray-50 transition duration-150">
                                                                <td className="p-3 text-gray-600 max-w-xs">Upon Confirmation of Agreement</td>
                                                                <td className="p-3 text-center">100%</td>
                                                                <td className="p-3 text-center">
                                                                    {(totalExcludedAddonAmount - (Number(selectedQuotation.bonus?.value) || 0)).toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr className="font-bold bg-gray-50 border-t border-gray-200">
                                                            <td className="p-3 text-gray-700">Total</td>
                                                            <td className="p-3 text-center">100%</td>
                                                            <td className="p-3 text-center">
                                                                {(totalExcludedAddonAmount - (Number(selectedQuotation.bonus?.value) || 0)).toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={activeTab === 'tab_1_2' ? 'block' : 'hidden'} id="tab_1_2">
                        <div className="prose max-w-none p-4 text-xs">{tnc}</div>
                    </div>
                </div>

                {/* Pricing Section */}
                <div className="fixed bottom-0 left-0 right-0 bg-white p-3 px-5 z-50 transition-all duration-300 rounded-xl shadow-[0_-6px_12px_rgba(0,0,0,0.25)]">

                    {orderDetail.status !== "confirmed" ? (
                        <>
                            {/* Accordion content with conditional border-top */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordions["amount_breakdown"]
                                    ? "max-h-screen"
                                    : "max-h-0"
                                    }`}
                            >
                                <div className="mt-2 space-y-4">
                                    <div className="flex flex-col space-y-2">
                                        {packageCategories.map((category, index) => (
                                            <div key={index} className="flex justify-between gap-2">
                                                <span className="text-xs text-gray-600">Total {category.category}</span>
                                                <span className="text-xs text-gray-700 font-semibold whitespace-nowrap">
                                                    RM{" "}
                                                    {category.total_price.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedQuotation.bonus && (
                                        <div className="">
                                            <h3 className="text-sm text-teal-600 font-bold">Discount:</h3>
                                            <div className="text-2xs text-gray-600 font-semibold space-y-2 mt-1">
                                                {(selectedQuotation.bonus?.description?.split("\n") || ["No Details"]).map((item: string, index: number) => (
                                                    <p key={index} className="mb-1 last:mb-0">
                                                        {item}
                                                    </p>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-gray-600 font-semibold">Total Discount:</span>
                                                <p className="text-md text-teal-600 font-bold">
                                                    RM{" "}
                                                    {Number(selectedQuotation.bonus?.value).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <hr className="my-2" />

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-800">Total Quotation Amount: </span>
                                        <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {totalExcludedAddonAmount.toLocaleString(undefined, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 2,
                                        })}</span>
                                    </div>

                                    <div className="flex flex-col space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-gray-800">Payment Terms: </span>
                                            <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">
                                                {selectedProgram === "bePowered" ?
                                                    "Reno Subscription" : selectedProgram === "rnpl" ?
                                                        "RenoNow PayLater" : "Full Payment"}
                                            </span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-2xs text-gray-600 italic">(Terms & Conditions)</span>
                                            <button className="mx-1" data-modal-toggle="#payment_info_modal">
                                                <InformationCircleIcon className="w-4 h-4 text-yellow-500" aria-label="Payment Info" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-800">Initial Down Payment: </span>
                                        {selectedProgram === 'bePowered' && (
                                            <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {(upfrontAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2,
                                            })}
                                            </span>
                                        )}
                                        {selectedProgram === 'rnpl' && (
                                            <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {totalRenoNowPrice.toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2,
                                            })}
                                            </span>
                                        )}
                                        {selectedProgram !== 'rnpl' && selectedProgram !== 'bePowered' && (
                                            <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {(totalExcludedAddonAmount / 2).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2,
                                            })}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-gray-800">Balance Payment: </span>
                                            {selectedProgram === 'bePowered' && (
                                                orderDetail.installment_method === 'fixed' ? (
                                                    <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {orderDetail.installment_amount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 2,
                                                    })}/mth
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {(totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0) - upfrontAmount).toLocaleString(undefined, {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                    </span>
                                                )
                                            )}
                                            {selectedProgram === 'rnpl' && (
                                                <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {(totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0) - totalRenoNowPrice).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                })}
                                                </span>
                                            )}
                                            {selectedProgram !== 'rnpl' && selectedProgram !== 'bePowered' && (
                                                <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {(totalExcludedAddonAmount / 2).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                })}
                                                </span>
                                            )}
                                        </div>
                                        {selectedProgram === 'bePowered' && (
                                            <div className="flex justify-end">
                                                <span className="text-2xs text-gray-600 italic">Pay in 60 mths</span>
                                            </div>
                                        )}
                                        {selectedProgram === 'rnpl' && (
                                            <div className="flex justify-end">
                                                <span className="text-2xs text-gray-600 italic">Pay through RPM</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <hr className="my-2" />
                            </div>

                            <div className="flex flex-col space-y-2 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <CreditCardIcon className="w-5 h-5 text-blue-600" aria-label="Payment Icon" />
                                        <select
                                            className="flex select select-sm w-fit pr-8 border border-gray-300 rounded-md bg-white py-0 px-2 text-2xs h-6 appearance-none"
                                            id="program"
                                            value={selectedProgram}
                                            onChange={handleProgramChange}
                                            name="program"
                                        >
                                            {orderDetail.is_be_powered ? (
                                                <option value="bePowered">Reno Subscription</option>
                                            ) : orderDetail.is_rnpl ? (
                                                <option value="rnpl">RenoNow PayLater</option>
                                            ) : (
                                                <option value="normal">Full Payment</option>
                                            )}
                                        </select>
                                    </div>

                                    {selectedProgram !== "rnpl" && (
                                        <select
                                            className="flex select select-sm w-fit pr-8 border border-gray-300 rounded-md bg-white py-0 px-2 text-2xs h-6 appearance-none"
                                            id="payment_plan"
                                            value={selectedPlan}
                                            // onChange={handlePlanChange}
                                            name="payment_plan"
                                            disabled
                                        >
                                            {selectedProgram !== "bePowered" && (
                                                <option value="36">36 months</option>
                                            )}
                                            <option value="60">60 months</option>
                                        </select>
                                    )}
                                </div>
                                <div className="flex justify-between">
                                    {selectedProgram === "normal" ? (
                                        <>
                                            <div className="flex flex-col items-start w-full">
                                                <p className="text-lg text-[#d71e42] font-bold">
                                                    RM{" "}
                                                    {(
                                                        ((totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)) *
                                                            (selectedPlan === "60" ? 1.14 : 1.105)) /
                                                        Number(selectedPlan)
                                                    ).toLocaleString(undefined, {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    })}
                                                    <span className="text-sm text-gray-600">/month </span>
                                                    <span className="text-xs text-gray-600">for {selectedPlan === "60" ? "60" : "36"} months</span>
                                                </p>

                                                {!orderDetail.is_be_powered && (
                                                    <div className="flex justify-between w-full">
                                                        <p className="italic text-gray-600 text-xs flex items-center">
                                                            <span>(Terms & Conditions)</span>
                                                            <button className="mx-1" data-modal-toggle="#payment_info_modal">
                                                                <InformationCircleIcon className="w-4 h-4 text-yellow-500" aria-label="Payment Info" />
                                                            </button>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : selectedProgram === "bePowered" ? (
                                        <div className="flex flex-col items-start w-full">
                                            <p className="text-lg text-[#d71e42] font-bold">
                                                <span className="text-sm text-gray-600">Total </span>
                                                RM {(upfrontAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                })}
                                                <span className="text-sm text-gray-600"> Upfront</span>
                                            </p>
                                            <div className="flex w-full justify-between">
                                                <p className="text-sm text-[#d71e42] font-bold">
                                                    <span className="text-sm text-gray-600">pay </span>
                                                    RM{" "}
                                                    {orderDetail.is_be_powered
                                                        ? (orderDetail.installment_method === 'fixed' ? orderDetail.installment_amount : (totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0) - upfrontAmount)).toLocaleString(
                                                            undefined,
                                                            {
                                                                minimumFractionDigits: 0,
                                                                maximumFractionDigits: 0,
                                                            },
                                                        )
                                                        : (
                                                            ((totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)) * (selectedPlan === "60" ? 1.14 : 1.105)) /
                                                            Number(selectedPlan)
                                                        ).toLocaleString(undefined, {
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 0,
                                                        })}
                                                    <span className="text-xs text-gray-600"> for {selectedPlan === "60" ? "60" : "36"} months</span>
                                                </p>
                                                <button
                                                    className="italic underline text-blue-600 text-xs"
                                                    onClick={() => toggleAccordion("amount_breakdown")}
                                                >
                                                    {openAccordions["amount_breakdown"] ? "Hide Details" : "View Details"}
                                                </button>
                                            </div>
                                            {!orderDetail.is_be_powered && (
                                                <div className="flex justify-between w-full">
                                                    <p className="italic text-gray-600 text-xs flex items-center">
                                                        <span>(Terms & Conditions)</span>
                                                        <button className="mx-1" data-modal-toggle="#payment_info_modal">
                                                            <InformationCircleIcon className="w-4 h-4 text-yellow-500" aria-label="Payment Info" />
                                                        </button>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : selectedProgram === "rnpl" ? (
                                        <div className="flex flex-col items-start w-full">
                                            <p className="text-lg text-[#d71e42] font-bold">
                                                <span className="text-sm text-gray-600">Kickstart <span className="text-lg text-[#d71e42] font-bold">NOW</span> by just paying </span>
                                                RM{" "}
                                                {totalRenoNowPrice.toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                })}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                                {selectedProgram === "normal" && (
                                    <div className="flex items-start justify-between mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-600">
                                                <strong>Or</strong> pay one-time: RM{" "}
                                                {(totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                        <button
                                            className="italic underline text-blue-600 text-xs"
                                            onClick={() => toggleAccordion("amount_breakdown")}
                                        >
                                            {openAccordions["amount_breakdown"] ? "Hide Details" : "View Details"}
                                        </button>
                                    </div>
                                )}
                                {selectedProgram === "rnpl" && (
                                    <div className="flex items-start justify-between mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-600">
                                                Remaining RM{" "}
                                                {((totalExcludedAddonAmount - totalRenoNowPrice) - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })} covered by tenants
                                            </span>
                                        </div>
                                        <button
                                            className="italic underline text-blue-600 text-xs"
                                            onClick={() => toggleAccordion("amount_breakdown")}
                                        >
                                            {openAccordions["amount_breakdown"] ? "Hide Details" : "View Details"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Accordion content with conditional border-top */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordions["amount_breakdown"]
                                    ? "max-h-screen"
                                    : "max-h-0"
                                    }`}
                            >
                                <div className="mt-2 space-y-4">
                                    <div className="flex flex-col space-y-2">
                                        {packageCategories.map((category, index) => (
                                            <div key={index} className="flex justify-between gap-2">
                                                <span className="text-xs text-gray-600">Total {category.category}</span>
                                                <span className="text-xs text-gray-700 font-semibold whitespace-nowrap">
                                                    RM{" "}
                                                    {category.total_price.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {Number(orderDetail?.latest_quotation?.bonus?.value) > 0 && (
                                        <div className="">
                                            <h3 className="text-sm text-teal-600 font-bold">Discount:</h3>
                                            <div className="text-2xs text-gray-600 font-semibold space-y-2 mt-1">
                                                {((orderDetail?.latest_quotation?.bonus?.description || "").split("\n") || ["No Details"]).map((item: string, index: number) => (
                                                    <p key={index} className="mb-1 last:mb-0">
                                                        {item}
                                                    </p>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-gray-600 font-semibold">Total Discount:</span>
                                                <p className="text-md text-teal-600 font-bold">
                                                    RM{" "}
                                                    {(Number(orderDetail?.latest_quotation?.bonus?.value) || 0).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <hr className="my-2" />

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-800">Total Quotation Amount: </span>
                                        <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {totalExcludedAddonAmount.toLocaleString(undefined, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 2,
                                        })}</span>
                                    </div>

                                    <div className="flex flex-col space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-gray-800">Payment Terms: </span>
                                            <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">
                                                {selectedProgram === "bePowered" ?
                                                    "Reno Subscription" : selectedProgram === "rnpl" ?
                                                        "RenoNow PayLater" : "Full Payment"}
                                            </span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-2xs text-gray-600 italic">(Terms & Conditions)</span>
                                            <button className="mx-1" data-modal-toggle="#payment_info_modal">
                                                <InformationCircleIcon className="w-4 h-4 text-yellow-500" aria-label="Payment Info" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-800">Initial Down Payment: </span>
                                        {selectedProgram === 'bePowered' && (
                                            <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {(upfrontAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2,
                                            })}
                                            </span>
                                        )}
                                        {selectedProgram === 'rnpl' && (
                                            <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {totalRenoNowPrice.toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2,
                                            })}
                                            </span>
                                        )}
                                        {selectedProgram !== 'rnpl' && selectedProgram !== 'bePowered' && (
                                            <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {(totalExcludedAddonAmount / 2).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2,
                                            })}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-gray-800">Balance Payment: </span>
                                            {selectedProgram === 'bePowered' && (
                                                orderDetail.installment_method === 'fixed' ? (
                                                    <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {orderDetail.installment_amount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 2,
                                                    })}/mth
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {(totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0) - upfrontAmount).toLocaleString(undefined, {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                    </span>
                                                )
                                            )}
                                            {selectedProgram === 'rnpl' && (
                                                <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {(totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0) - totalRenoNowPrice).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                })}
                                                </span>
                                            )}
                                            {selectedProgram !== 'rnpl' && selectedProgram !== 'bePowered' && (
                                                <span className="text-sm text-gray-800 font-semibold whitespace-nowrap">RM {(totalExcludedAddonAmount / 2).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                })}
                                                </span>
                                            )}
                                        </div>
                                        {selectedProgram === 'bePowered' && (
                                            <div className="flex justify-end">
                                                <span className="text-2xs text-gray-600 italic">Pay in 60 mths</span>
                                            </div>
                                        )}
                                        {selectedProgram === 'rnpl' && (
                                            <div className="flex justify-end">
                                                <span className="text-2xs text-gray-600 italic">Pay through RPM</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <hr className="my-2" />
                            </div>

                            <div className="flex flex-col space-y-2 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <CreditCardIcon className="w-5 h-5 text-blue-600" aria-label="Payment Icon" />
                                        <select
                                            className="flex select select-sm w-fit pr-8 border border-gray-300 rounded-md bg-white py-0 px-2 text-2xs h-6 appearance-none"
                                            id="program"
                                            value={selectedProgram}
                                            onChange={handleProgramChange}
                                            name="program"
                                        >
                                            {orderDetail.is_be_powered ? (
                                                <option value="bePowered">Reno Subscription</option>
                                            ) : orderDetail.is_rnpl ? (
                                                <option value="rnpl">RenoNow PayLater</option>
                                            ) : (
                                                <option value="normal">Full Payment</option>
                                            )}
                                        </select>
                                    </div>

                                    {selectedProgram !== "rnpl" && (
                                        <select
                                            className="flex select select-sm w-fit pr-8 border border-gray-300 rounded-md bg-white py-0 px-2 text-2xs h-6 appearance-none"
                                            id="payment_plan"
                                            value={selectedPlan}
                                            // onChange={handlePlanChange}
                                            name="payment_plan"
                                            disabled
                                        >
                                            {selectedProgram !== "bePowered" && (
                                                <option value="36">36 months</option>
                                            )}
                                            <option value="60">60 months</option>
                                        </select>
                                    )}
                                </div>
                                <div className="flex justify-between">
                                    {selectedProgram === "normal" ? (
                                        <>
                                            <div className="flex flex-col items-start w-full">
                                                <p className="text-lg text-[#d71e42] font-bold">
                                                    RM{" "}
                                                    {(
                                                        ((totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)) *
                                                            (selectedPlan === "60" ? 1.14 : 1.105)) /
                                                        Number(selectedPlan)
                                                    ).toLocaleString(undefined, {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    })}
                                                    <span className="text-sm text-gray-600">/month </span>
                                                    <span className="text-xs text-gray-600">for {selectedPlan === "60" ? "60" : "36"} months</span>
                                                </p>

                                                {!orderDetail.is_be_powered && (
                                                    <div className="flex justify-between w-full">
                                                        <p className="italic text-gray-600 text-xs flex items-center">
                                                            <span>(Terms & Conditions)</span>
                                                            <button className="mx-1" data-modal-toggle="#payment_info_modal">
                                                                <InformationCircleIcon className="w-4 h-4 text-yellow-500" aria-label="Payment Info" />
                                                            </button>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : selectedProgram === "bePowered" ? (
                                        <div className="flex flex-col items-start w-full">
                                            <p className="text-lg text-[#d71e42] font-bold">
                                                <span className="text-sm text-gray-600">Total </span>
                                                RM {(upfrontAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                })}
                                                <span className="text-sm text-gray-600"> Upfront</span>
                                            </p>
                                            <div className="flex w-full justify-between">
                                                <p className="text-sm text-[#d71e42] font-bold">
                                                    <span className="text-sm text-gray-600">pay </span>
                                                    RM{" "}
                                                    {orderDetail.is_be_powered
                                                        ? (orderDetail.installment_method === 'fixed' ? orderDetail.installment_amount : (totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0) - upfrontAmount)).toLocaleString(
                                                            undefined,
                                                            {
                                                                minimumFractionDigits: 0,
                                                                maximumFractionDigits: 0,
                                                            },
                                                        )
                                                        : (
                                                            ((totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)) * (selectedPlan === "60" ? 1.14 : 1.105)) /
                                                            Number(selectedPlan)
                                                        ).toLocaleString(undefined, {
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 0,
                                                        })}
                                                    <span className="text-xs text-gray-600"> for {selectedPlan === "60" ? "60" : "36"} months</span>
                                                </p>
                                                <button
                                                    className="italic underline text-blue-600 text-xs"
                                                    onClick={() => toggleAccordion("amount_breakdown")}
                                                >
                                                    {openAccordions["amount_breakdown"] ? "Hide Details" : "View Details"}
                                                </button>
                                            </div>
                                            {!orderDetail.is_be_powered && (
                                                <div className="flex justify-between w-full">
                                                    <p className="italic text-gray-600 text-xs flex items-center">
                                                        <span>(Terms & Conditions)</span>
                                                        <button className="mx-1" data-modal-toggle="#payment_info_modal">
                                                            <InformationCircleIcon className="w-4 h-4 text-yellow-500" aria-label="Payment Info" />
                                                        </button>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : selectedProgram === "rnpl" ? (
                                        <div className="flex flex-col items-start w-full">
                                            <p className="text-lg text-[#d71e42] font-bold">
                                                <span className="text-sm text-gray-600">Kickstart <span className="text-lg text-[#d71e42] font-bold">NOW</span> by just paying </span>
                                                RM{" "}
                                                {totalRenoNowPrice.toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                })}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                                {selectedProgram === "normal" && (
                                    <div className="flex items-start justify-between mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-600">
                                                <strong>Or</strong> pay one-time: RM{" "}
                                                {(totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                        <button
                                            className="italic underline text-blue-600 text-xs"
                                            onClick={() => toggleAccordion("amount_breakdown")}
                                        >
                                            {openAccordions["amount_breakdown"] ? "Hide Details" : "View Details"}
                                        </button>
                                    </div>
                                )}
                                {selectedProgram === "rnpl" && (
                                    <div className="flex items-start justify-between mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-600">
                                                Remaining RM{" "}
                                                {((totalExcludedAddonAmount - totalRenoNowPrice) - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })} covered by tenants
                                            </span>
                                        </div>
                                        <button
                                            className="italic underline text-blue-600 text-xs"
                                            onClick={() => toggleAccordion("amount_breakdown")}
                                        >
                                            {openAccordions["amount_breakdown"] ? "Hide Details" : "View Details"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderPreviewModal;