// src\pages\Order\OrderDetailPage.tsx

import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import useFetchOrder from "../../hook/useFetchOrder";
import { KTAccordion, KTTooltip } from "../../metronic/core";
import { OrderQuotation, Package, Product } from "../../types";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ClipboardJS from "clipboard";
import { Slide, toast } from "react-toastify";
import { releaseOrder } from "../../services/api";
import ConfirmOrderModal from "./components/ConfirmOrderModal";

const APP_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_APP_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_APP_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_APP_URL
                : null;


// orderDetail.latest_quotation.packages.map((quotationPackage: Package, index: number) => ()
// 

const getCurrentDate = () => {
    const date = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
};

const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${monthNames[parseInt(month) - 1]} ${year}`;
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

const categoryOptions = [
    { value: "renovation", label: "Renovation" },
    { value: "partition", label: "Partition" },
    { value: "smart_iot", label: "Smart IoT" },
    { value: "project_management", label: "Project Management" },
    { value: "electrical_appliances", label: "Electrical Appliances" },
    { value: "air_conditioning", label: "Air Conditioning" },
    { value: "others", label: "Others" },
];

function OrderDetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const orderId = id ? parseInt(id, 10) : null;

    const { orderDetail, loading, error, refetch } = useFetchOrder(orderId);
    const [packageCategories, setPackageCategories] = useState<{ category: string; total_price: number }[]>([]);

    const [activeTab, setActiveTab] = useState('tab_1_1');
    const [isLoading, setIsLoading] = useState(false);

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    useEffect(() => {
        document.title = "Quotation Order Detail | RenoXpert";

        KTAccordion.init();
        KTTooltip.init();

        // if (orderDetail) {
        //     console.log(JSON.parse(JSON.stringify(orderDetail.total_amount)));
        // }

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };

    }, []);

    useEffect(() => {
        if (!orderDetail?.latest_quotation?.packages) return;

        const categoryTotals = orderDetail.latest_quotation.packages.reduce((acc, quotationPackage) => {
            const category = quotationPackage.category;
            const categoryTotal = quotationPackage.products.reduce((total, product) => {
                // Calculate supply price
                let supplyPrice = 0;
                if (product.pivot.includeSupply) {
                    supplyPrice = (product.provisioning.supply.retail_price * product.pivot.quantity) || 0;
                } else {
                    supplyPrice = (product.provisioning.supply.retail_price - product.provisioning.supply.excluded_price) || 0;
                }

                // Calculate install price
                let installPrice = 0;
                if (product.pivot.includeInstall) {
                    installPrice = (product.provisioning.install.retail_price * product.pivot.quantity) || 0;
                } else {
                    installPrice = (product.provisioning.install.retail_price - product.provisioning.install.excluded_price) || 0;
                }

                return total + supplyPrice + installPrice;
            }, 0);

            // Initialize the category if it doesn't exist
            if (!acc[category]) {
                acc[category] = 0;
            }

            // Add to the category total
            acc[category] += categoryTotal;

            return acc;
        }, {} as Record<string, number>);

        setPackageCategories(
            Object.entries(categoryTotals).map(([category, total_price]) => ({
                category: categoryOptions.find(option => option.value === category)?.label || category,
                total_price
            }))
        );

        if (orderDetail.latest_quotation.packages.length > 0) {
            KTAccordion.createInstances();
        }

    }, [orderDetail?.latest_quotation?.packages]);

    if (!orderId) return null; // Early return for null orderId


    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/orders');
        }
    };

    const handleReleaseOrder = async () => {
        setIsLoading(true);
        try {
            const response = await releaseOrder(orderId);

            if (response?.success) {
                notify('success', 'Order released successfully!');
                refetch();
            }

        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!orderDetail) return <div>Order not found</div>;

    // console.log(orderDetail);
    const selectedQuotation = JSON.parse(JSON.stringify(orderDetail.latest_quotation)) as OrderQuotation;
    const selectedPackages = JSON.parse(JSON.stringify(orderDetail.latest_quotation.packages)) as Package[];

    const address = [
        orderDetail.user.address.address_1,
        orderDetail.user.address.street,
        orderDetail.user.address.postcode,
        orderDetail.user.address.city,
        orderDetail.user.address.state,
    ]
        .filter(Boolean)
        .join(', ');

    const propertyAddress = [
        orderDetail.property.address,
        orderDetail.property.street,
        orderDetail.property.postcode,
        orderDetail.property.city,
        orderDetail.property.state
    ].filter(part => part !== null && part !== '')

    const tnc = (
        <ul className="list-disc list-inside space-y-4 text-sm">
            <li>This quotation is only valid for 7 days. If BeLive receives the Client’s confirmation after 7 days, BeLive reserves the right to make changes to the quotation.</li>
            <li>BeLive reserves the right to decide on the overall design and theme, the selection of furniture, fixtures, and fittings for the Client’s unit including the colour and material of products.</li>
            <li>The pre-booking payment has a grace period of 7 days upon booking payment.</li>
            <li>Any pictures or illustrations shown are for reference purposes only. BeLive will attempt to create a similar concept; however, some items may be seasonal, and BeLive reserves the right to substitute similar products of equivalent quality at our discretion.</li>
            <li>BeLive is allowed to take photos of the renovation and the end product for marketing and promotional purposes.</li>
            <li>BeLive reserves the right to replace the items as quoted with products of equivalent or higher value, of similar functionality, and/or purpose.</li>
            <li>The commencement date for the renovation shall be determined at the sole discretion of BeLive.</li>
            <li>BeLive will make reasonable efforts to meet the specified completion dates. However, unforeseen circumstances may lead to adjustments in the timeline. The Client will be informed of any changes.</li>
            <li>In the event of non-payment or breach of contract by the Client, BeLive reserves the right to suspend work until the issue is resolved. Any additional costs incurred as a result of such suspension will be borne by the Client.</li>
            <li>The bank interest rate for the installment plan may change by the bank(s) without prior notification to the Client.</li>
            <li>For safety and security reasons, access/execution of all works by BeLive staff, suppliers, contractors, and sub-contractors requires the unit to be vacated during the entire duration of renovation work.</li>
            <li>The Client consents to refrain from accessing the unit without prior notification to the BeLive team. Entry should be coordinated with a designated team member if the Client wishes to enter the unit during the renovation period.</li>
            <li>It is advised that the Client refrain from staying in the unit during the renovation period. Occupancy may impact renovation progress and could raise safety concerns.</li>
            <li>The Client acknowledges that the scope of work for this renovation project is fixed, and no changes, alterations, or customizations are permitted once the quotation is signed.</li>
            <li>The quotation includes up to 6 feet of copper piping per air conditioning unit. An additional charge of RM25 per foot will apply for any additional copper piping required.</li>
            <li>This quotation includes the supply and installation of kitchen cabinets up to the length specified. Any additional length will incur extra charges.</li>
            <li>Payment verification: Kindly WhatsApp us at +6011-5899 6291 with the bank-in slip or online payment receipt, along with the client’s name, development name, and unit number.</li>
            <li>It shall be the Client’s duty to ensure that all details ascribed in the email are correct and accurate. BeLive shall not be held responsible for any discrepancies.</li>
            <li>Renovations proceed in batches based on a first-come, first-served basis. BeLive is not responsible for delays due to a lack of documents or payment delays.</li>
            <li>The Client assumes all risk for installing a partition. BeLive is not liable for penalties or removal costs requested by authorities.</li>
            <li>The Client is solely responsible for paying the renovation deposit to the management office and for handling all related matters.</li>
            <li>For all goods, products, and materials under the renovation work, BeLive reserves the right to remove any furniture and/or fittings up to the value of the amount owing to BeLive.</li>
            <li>If the Client opts to make payment using a credit card, an additional admin fee of 2% will apply. This charge is not applicable for credit card installment plans, FPX, or bank transfers.</li>
            <li>Any payment made is non-refundable.</li>
            <li>By signing this quotation, the Client acknowledges and agrees to the terms and conditions outlined in the quotation and the attached renovation agreement.</li>
        </ul>
    );

    const renoAgreement = (
        <div className='flex flex-col w-full text-sm text-justify'>
            <div className="flex flex-col items-center justify-center gap-6 text-center mb-6">
                <span>THIS AGREEMENT is made this day of <strong>{orderDetail.status === 'confirmed' ? formatDate(orderDetail.updated_at) : getCurrentDate()}</strong></span>
                <span>BETWEEN</span>
                <span><strong>RENOXPERT SDN. BHD. [Registration No.202401032588 (1578437-W)]</strong> of <strong>42-46, Ground Floor, Jalan SS 19/1d, SS 19, 46500 Subang Jaya, Selangor</strong> (“the Contractor”) of the one part;</span>
                <span>AND</span>
                <span><strong>{orderDetail.user.name} (NRIC No. {orderDetail.user.ic})</strong> of <strong>{address}</strong> ("the Owner") of the other part</span>
            </div>
            <div className="flex flex-col gap-6 mb-6">
                <span className='font-bold'>WHEREAS:</span>
                <span>The Contractor desires to provide renovation services to the Owner and the Owner desires to utilize the services of the Contractor for the renovation of the Owner’s property described as <strong>A (1) unit of Service Residence known as {orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no}, {orderDetail.property.name}, {propertyAddress}</strong> (the “Property”) subject to the terms and conditions hereinafter appearing.</span>
                <span><strong>NOW THIS AGREEMENT WITNESSETH</strong> as follows:-</span>
                <div className="flex flex-col gap-3">
                    <span><strong>1. CONTRACT SUM</strong></span>
                    <span>1.1 The Owner hereby appoints the Contractor and the Contractor agrees to accept such appointment of making improvements to the Property, to carry out, execute and complete the upgrading and alteration works to the Property which are more particularly described and set out in the <strong>Quotation</strong> hereto (“Works”) at an agreed lump sum of <strong>Ringgit Malaysia (RM) ONLY</strong> (the “said Contract Sum”) payable by instalments/progressive payment in accordance with the <strong>First Schedule</strong> hereof, subject to the Owner’s right of inspection as set forth below.</span>
                    <span>1.2 Any change in the Contract Sum, change in the Works or change in the contract time that to be defined herein must be agreed by all parties herein and set forth in writing signed by the Owner and the Contractor.</span>
                </div>
                <div className="flex flex-col gap-3">
                    <span><strong>2. DURATION</strong></span>
                    <span>2.1 The renovation agreement and renovation Phase 1 shall commence upon the following conditions precedent have been fulfilled:-</span>
                    <div className="flex flex-col gap-3 pl-5">
                        <span>(a) the Owner shall make the first Fifty (50%) per cent as stated in the <strong>First Schedule</strong> as deposit;</span>
                        <span>(b) defects of the Property shall be duly rectified, repaired and fixed by the Developer’s defects’ teams and workers with the Owner or the Contractor’s approval;</span>
                        <span>(c) the Owner or the Contractor has obtained the working permit granted by the relevant authorities; and</span>
                        <span>(d) the full set of keys and access cards of the Property (if required) have been passed to the Contractor,</span>
                        <span>the commencement date for renovation work shall be after <strong>Seven (7) working days</strong> from the date when the <strong>clause 2.1(a), (b), (c) and (d)</strong> have been fulfilled following the sequence of <strong>clause 2.1(a), (b), (c) and (d)</strong>. Failure to comply with the above-mentioned conditions, the Owner shall unconditionally allow the Contractor to extend the commencement and completion date without any interest.</span>
                    </div>
                    <span>2.2 The renovation Phase 2 shall commence upon the following conditions precedent have been fulfilled:-</span>
                    <div className="flex flex-col gap-3 pl-5">
                        <span>(a) the Contractor has completed renovation Phase 1 works; and</span>
                        <span>(b) the Owner has made the second Fifty (50%) per cent as stated in the <strong>First Schedule</strong> as deposit;</span>
                        <span>the commencement date for renovation work shall be after <strong>Seven (7) working days</strong> from the date when the <strong>clause 2.2(a) and (b)</strong> have been fulfilled following the sequence of <strong>clause 2.2(a) and (b)</strong>. Failure to comply with the above-mentioned conditions, the Owner shall unconditionally allow the Contractor to extend the commencement and completion date without any interest.</span>
                    </div>
                    <span>2.3 The period for this renovation work shall take <strong>{convertToWords(orderDetail.completion_day).toUpperCase()} {orderDetail.completion_day} working days</strong> or any approved extension period by all parties (“the said Contract Time”). Time wherever mentioned shall be of the essence of this Agreement.</span>
                    <span>2.4 For the avoidance of doubt, renovation Phase 1 includes wiring, painting, and installation of smart devices while renovation Phase 2 includes the supply and installation of furniture and loose items.</span>
                </div>
                <div className="flex flex-col gap-3">
                    <span><strong>3. FORCE MAJEURE</strong></span>
                    <span>3.1 Notwithstanding <strong>Clause 4</strong>, no party shall be held liable in the performance of any obligations under this Agreement resulting from “Force Majeure” which shall include Movement Control Order (“MCO”), Full Movement Control Order (“FMCO”), Extended Movement Control Order (“EMCO”), acts of God, fire, or other catastrophe, storms, curfew, blockade, government restrictions and/or change in government policies, war, strikes or other labour disturbances, acute shortage of building materials, acts of civil or military authorities or any other causes beyond the control of the party thereby affected whether similar or dissimilar from the foregoing <strong>PROVIDED ALWAYS THAT</strong> the party claiming to be affected by any event of force majeure shall as soon as practicable give written notice of such claim to the other party with full particulars thereof.</span>
                </div>
                <div className="flex flex-col gap-3">
                    <span><strong>4. CONTRACTOR’S DUTIES, OBLIGATIONS, RIGHTS AND INTERESTS</strong></span>
                    <span>4.1 The Contractor shall be responsible for the purchase and delivery of materials, except in the event that the Owner volunteers for economic considerations. All materials at the Property shall be at the risk of the Contractor during the said Contract Time and if the Owner volunteered for the purchase and delivery of materials, such risk shall be passed to the Owner.</span>
                    <span>4.2 The Works shall be constructed in a good and workmanlike manner in accordance with the description and specification as set out in the Quotation hereto, which description and specification have been duly accepted and approved by the Owner, as the Owner hereby acknowledges via the instant messaging services such as email and/or WhatsApp.</span>
                    <span>4.3 The Contractor will furnish and be fully responsible for all equipment, labour, transportation, construction equipment and machinery, tools, appliances, fuel, power, light, heat and all other facilities and incidentals necessary for the furnishing, performance, testing, start-up, and completion of the Work.</span>
                    <span>4.4 The Contractor will provide competent, suitable personnel to perform services as required and will at all times maintain good discipline and order at the Property.</span>
                    <span>4.5 The Contractor may sub-contract the Works or any part thereof to any subcontractor(s) or party(ies) as is customary in the construction industry provided that the Contractor shall be solely liable to the Owner for any act or default by its subcontractor(s).</span>
                    <span>4.6 The Contractor may update the Owner from time to time on the progress of works by attach the photos of the works done by the Contractor and/or subcontractor(s), the photos and description of works shall form part of this Agreement by way of video or photos to be sent to the Owner by way of WhatsApp or any way the Contractor deems appropriate.</span>
                </div>
                <div className="flex flex-col gap-3">
                    <span><strong>5. NOTICES</strong></span>
                    <span>5.1 Any notice required to be given under this Agreement shall be deemed to be sufficiently served if sent by registered post or ordinary post to the party to whom such notice is being served at its address given herein and such notice shall be deemed to be received in the ordinary course of post <strong>three (3) working days</strong> after posting.</span>
                    <span>5.2 Notwithstanding <strong>Clause 5.1</strong> above, any notice required to be given under this Agreement shall be deemed to be sufficiently served by way of instant messaging services such as email and/or WhatsApp to the party to whom such notice is being served at its email address and/or WhatsApp number/account given herein and such notice shall be deemed to be received instantly within <strong>twenty four (24) hours</strong> after sent out.</span>
                </div>
                <div className="flex flex-col gap-3">
                    <span><strong>6. COSTS</strong></span>
                    <span>6.1 Unless otherwise agreed, all the legal costs, stamp duty of and incidental to this Agreement shall be borne and paid by the Contractor solely.</span>
                </div>
                <div className="flex flex-col gap-3">
                    <span><strong>7. SPECIAL CONDITIONS, SCHEDULES AND APPENDIX</strong></span>
                    <span>7.1 The Special Conditions, Schedules and Appendix hereinafter stipulated shall for an integral part of this Agreement and in the event of any inconsistency or repugnant terms in the aforementioned Agreement, the provisions contained in the Special Conditions shall prevail.</span>
                </div>
                <div className="flex flex-col gap-3">
                    <span><strong>8. GOVERNING LAW</strong></span>
                    <span>8.1 This Agreement shall in all respect, include all matters of construction, validity and performance be governed by, construed and enforced exclusively in accordance with the laws of Malaysia. The parties shall submit to the exclusive jurisdiction of the Malaysian courts.</span>
                </div>
                <div className="flex flex-col gap-3">
                    <span><strong>9. WARRANTY AND DEFECT PERIOD</strong></span>
                    <span>9.1 The Contractor warrants that each Product sold, installed and provided by the Contractor under this Agreement will conform to its Specifications for the Warranty and Defect period (the “said Product Warranty”). In the event if the Products are not conformed to its Specifications due to the Contractor’s fault, the Contractor shall grant Product Warranty and Defect claims to the Owner. The Product Warranty and Defect claims must be in written and serve to The Contractor in pursuant to the Clause 5 of this Agreement.</span>
                    <span>9.2 The Warranty and Defect period varies from <strong>Six (6) to Twelve (12) months</strong>, depending on the type of the Products. The Warranty period for each of the Products models are described clearly in the Second Schedule of this Agreement.</span>
                    <span>9.3 The Warranty and Defect period shall start from the date the Contractor installed the products and ceases upon the expiration of the period. The Owner shall furnish to us this agreement together with the sales receipt or original purchase invoice to the Contractor.</span>
                    <span>In addition, this Warranty shall not applies in the following circumstances:-</span>
                    <div className="flex flex-col gap-3 pl-5">
                        <span>(a) if any damages, abuse, negligent act or use, misuse, tampering, or wrongful usage including failure or neglect to maintain the correct, proper and normal usage by the Owner, any end-users or third parties;</span>
                        <span>(b) if any damages, defects, malfunctions or non-functioning to or in the Product howsoever arising from, caused by or incidental to any external cause (including accidents, fire, lightning, Act of God, exposure to water or moisture, or caused by or during any or any attempted burglary, theft and/or riot), and any corrosion, rust, staining or any other such like matters; and</span>
                        <span>(c) any damages and defect caused by the Owner, any end-users or third parties.</span>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <span><strong>10. NON-COMPLETION/ FAILURE TO HAND OVER</strong></span>
                    <span>10.1 In the event where the Contractor fails and/or delay in handing over the Property in good, adequate and final conditions as per the terms and conditions mentioned in this Agreement.</span>
                    <span>10.2 In default by the Contractor to hand over the Property in good, adequate and final conditions within the said Contract Time, the Contractor shall be liable to pay penalty at the rate of <strong>eight per centum (8%) per annum</strong> on daily basis on the undelivered items stated in the Quotation, with the maximum claim sum not more than the said Contract Sum (the “said Liquidated Damages”).</span>
                    <span>10.3 The Contractor shall not be liable to pay the said Liquidated Damages in pursuant to <strong>Clause 10.2</strong> in the event where the <strong>Clause 2.1 & 2.2</strong> above is not complied with.</span>
                </div>
                <div className="flex flex-col gap-3">
                    <span><strong>11. NO VARIATION</strong></span>
                    <span>11.1 No variation of this Agreement of whatever nature shall be made or purported to be made by any party or parties nor shall any variation or purported variation be valid or enforceable unless the same is in writing and duly agreed to and executed by the parties concerned.</span>
                </div>
                <div className="flex flex-col gap-3">
                    <span><strong>12. SEVERABILITY</strong></span>
                    <span>12.1 If any provision of this Agreement for any reason shall be declared invalid, void, illegal or otherwise unenforceable, the remaining provisions of this Agreement shall remain in full force and effect. The parties shall amend that provision in such reasonable manner so as to achieve the intention of the parties without illegality or where it is not practicable to do so, that provision shall be severed from this Agreement.</span>
                </div>
                <div className="flex flex-col gap-3">
                    <span><strong>13. BINDING EFFECTS</strong></span>
                    <span>13.1 This Agreement shall be binding on the respective heirs, personal representatives, successors in title and assigns of the parties hereto.</span>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-6 text-center mb-6">
                <div className="flex flex-col">
                    <span className='font-bold underline'>FIRST SCHEDULE</span>
                    <span>(to be taken read and construed as an essential part of this Agreement)</span>
                </div>
                <span className='font-bold'>-</span>
                <span className='font-bold'>PROGRESSIVE PAYMENT OF THE CONTRACT SUM</span>
                <table className='table align-middle text-gray-700 font-medium text-sm max-w-lg'>
                    <thead>
                        <tr>
                            <th>
                                Description
                            </th>
                            <th className='text-center'>
                                %
                            </th>
                            <th className='text-center'>
                                Amount (RM)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Upon Confirmation and before Commencement of Phase 1</td>
                            <td className='text-center'>50</td>
                            <td className='text-center'>{(orderDetail.total_amount / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                            <td>Upon Completion of Phase 1 and before Commencement of Phase 2</td>
                            <td className='text-center'>50</td>
                            <td className='text-center'>{(orderDetail.total_amount / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className='font-bold'>
                            <td>Total:</td>
                            <td className='text-center'>100</td>
                            <td className='text-center'>{orderDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                </table>
                <span>In the event of a default by the Owner of the payment hereunder when due, the Owner shall be liable to pay interest at the rate of eight per centum (8%) per annum on the outstanding sum from the date due for payment until the date of actual payment.</span>
            </div>
        </div>

    );

    function getProductDescription(product) {
        const { description, pivot } = product;
        const { includeSupply, includeInstall } = pivot;

        if (!description) return "";

        if (includeSupply && includeInstall) {
            return `Supply and Installation of ${description}`;
        }

        if (includeSupply) {
            return `Supply of ${description}`;
        }

        if (includeInstall) {
            return `Installation of ${description}`;
        }

        return "";
    }

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Quotation Order Detail
                    </span>
                </div>
                <div className="flex gap-3">
                    {orderDetail?.status === 'unreleased' && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleReleaseOrder}
                        >
                            Release Order
                        </button>
                    )}
                    {orderDetail?.status === 'released' &&
                        <button
                            className="btn btn-success btn-sm"
                            data-modal-toggle="#confirm_order_modal"
                        >
                            Confirm Order
                        </button>
                    }
                    <Link
                        to={`/orders/edit/${orderId}`}
                        className="btn btn-sm btn-info"
                        data-tooltip="#edit_tooltip"
                        data-action="edit"
                        data-id={orderId}
                    >
                        <i className="ki-outline ki-notepad-edit"></i>
                        Edit Order Quotation
                    </Link>

                    <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                        <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                            <i className="ki-filled ki-dots-vertical"></i>
                        </button>

                        <div className="dropdown-content menu menu-default w-full max-w-64 py-2" data-dropdown-dismiss="true">
                            <div className="menu-item">
                                <button
                                    className="menu-link copy-link"
                                    data-clipboard-text={`${APP_URL}owner/order/overview/id/${orderId}`}
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-outline ki-copy text-lg"></i>
                                            <span className="text-gray-900">
                                                Copy Quotation Order Link
                                            </span>
                                        </div>
                                    </span>
                                </button>
                            </div>
                            <div className="menu-item">
                                <Link
                                    to={`/orders/create?dp=${orderId}`}
                                    className="menu-link"
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-outline ki-save-2 text-lg"></i>
                                            <span className="text-gray-900">
                                                Duplicate Order
                                            </span>
                                        </div>
                                    </span>
                                </Link>
                            </div>
                            <div className="menu-item">
                                <button
                                    className="menu-link"
                                    data-modal-toggle="#preview_order_modal"
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-filled ki-phone text-lg"></i>
                                            <span>Preview in Owner View</span>
                                        </div>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-[3] gap-8">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                General Info
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            QUO No:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.order_no}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Original Amount:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`RM ${orderDetail.latest_quotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Total Amount:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <span className="text-sm text-gray-900 pb-3">
                                                RM {(selectedQuotation.total_amount - (selectedQuotation.bonus ? Number(selectedQuotation.bonus?.value) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedQuotation.bonus && ` (Discount: RM${Number(selectedQuotation.bonus?.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                                            </span>

                                        </td>
                                    </tr>
                                    {orderDetail.final_amount &&
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 flex items-center gap-1">
                                                <i data-tooltip="#final_pricing_tooltip" className="ki-filled ki-information-2 textlg text-warning mt-[1.5px]"></i>
                                                <span>Final Amount:</span>
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                <span className="text-sm text-gray-900 pb-3">
                                                    RM {(orderDetail.final_amount - (selectedQuotation.bonus ? Number(selectedQuotation.bonus?.value) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedQuotation.bonus && ` (Discount: RM${Number(selectedQuotation.bonus?.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                                                </span>

                                            </td>
                                        </tr>
                                    }
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <span className={`badge badge-sm p-2 cursor-default
                                                ${orderDetail.status === 'released' ? 'badge-primary' : ''} 
                                                ${orderDetail.status === 'confirmed' ? 'badge-success' : ''} 
                                                ${orderDetail.status === 'revoked' ? 'badge-danger' : ''} 
                                                badge-outline`}
                                            >
                                                {orderDetail.status}
                                            </span>
                                        </td>
                                    </tr>
                                    {/* <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Preview Link:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <button
                                                className="btn btn-outline btn-sm btn-primary disabled"
                                            >
                                                View Order Overview
                                            </button>
                                        </td>
                                    </tr> */}
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Version:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.latest_quotation.version ?
                                                String.fromCharCode(64 + orderDetail.latest_quotation.version)
                                                : "N/A"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Updated Date:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {formatDate(orderDetail.latest_quotation.created_at)}

                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Updated by:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.latest_quotation.created_by.name}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card bg-info-light">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Discount/Bonus
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    {selectedQuotation.bonus ?
                                        <>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Description:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    <ul className='text-sm text-gray-900 list-inside'>
                                                        {selectedQuotation.bonus.description ?
                                                            selectedQuotation.bonus.description.split('\n').map((item, index) => (
                                                                <li key={index}>{item}</li>
                                                            ))
                                                            :
                                                            <li>No Details</li>
                                                        }
                                                    </ul>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Value:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    RM {selectedQuotation.bonus.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </>
                                        :
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                N/A
                                            </td>
                                        </tr>
                                    }

                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Owner
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.user.name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Email:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.user.email}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Phone No.:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            +60 {orderDetail.user.phone_no}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Property
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Property Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.property.name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Unit:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Address:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {[
                                                orderDetail.property.address,
                                                orderDetail.property.street,
                                                orderDetail.property.postcode,
                                                orderDetail.property.city,
                                                orderDetail.property.state,
                                            ]
                                                .filter(Boolean)
                                                .join(', ')
                                            }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Total Bedroom:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.bedroom_count}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Total Bathroom:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.bathroom_count}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Reno Agreement Detail
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Completion Day(s):
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.completion_day} Working Days
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Revision History
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <div className="grid gap-2.5">
                                {orderDetail.order_quotations.length > 0 ?
                                    orderDetail.order_quotations.slice().reverse().map((orderQuotation: OrderQuotation, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between flex-wrap border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5"
                                        >
                                            <div className="flex flex-col">
                                                <Link
                                                    to={`ver/${orderQuotation.version}`}
                                                    className="flex items-center flex-wrap gap-3.5 cursor-pointer text-orange-500 font-semibold text-sm">
                                                    {orderDetail.order_no}-{String.fromCharCode(64 + orderQuotation.version)}
                                                </Link>
                                                <span className="text-xs text-gray-600">
                                                    Updated By:
                                                    <span className="font-semibold ml-1">{orderQuotation.created_by.name}</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center flex-wrap gap-3.5">
                                                <button className="btn btn-outline btn-info btn-sm disabled">
                                                    Revise
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                    :
                                    <div className="text-sm text-gray-600">No Revision History on this Quotation Order</div>}
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Summary Pricing
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    {packageCategories.map((category, index: number) => (
                                        <tr key={index}>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                {category.category}:
                                            </td>
                                            <td className="text-sm text-gray-700 font-medium pb-3">
                                                RM {category.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                        </div>
                    </div>
                </div>

                <div className='flex flex-col right-column flex-[6] gap-4'>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Quotation
                            </h3>
                        </div>

                        {selectedQuotation && (
                            <div className="card-body">
                                <div className="flex flex-col">
                                    <span className='text-lg font-semibold text-gray-900'>
                                        {selectedQuotation.quotation_name}
                                    </span>
                                    <span className="text-base font-normal text-gray-800">
                                        Price: RM {(selectedQuotation.total_amount - (selectedQuotation.bonus ? Number(selectedQuotation.bonus?.value) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedQuotation.bonus && ` (Discount: RM${Number(selectedQuotation.bonus?.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                                        }
                                    </span>
                                    <span className="text-base font-normal text-gray-400">
                                        {selectedQuotation.description}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedQuotation && (
                        <div className="card">
                            <div className="card-body">
                                <div className="text-base font-semibold text-gray-900 mb-2">
                                    Packages:
                                </div>
                                <div className="flex flex-col gap-5" data-accordion="true">
                                    {selectedPackages.map((prodPackage: Package) => (
                                        <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                            <div className="accordion-item active border rounded-xl w-full" data-accordion-item="true" id={"package_item_" + prodPackage.id.toString()}>
                                                <button className="accordion-toggle flex justify-between p-4" data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-base text-gray-900 font-medium">
                                                            {prodPackage.name}
                                                        </span>
                                                        <span className='text-base text-gray-700'>
                                                            RM {prodPackage.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        {prodPackage.category &&
                                                            <div className="badge text-sm">
                                                                {categoryOptions.find(option => option.value === prodPackage.category)?.label}
                                                            </div>
                                                        }
                                                        <span className='text-sm text-gray-400'>
                                                            {prodPackage.description}
                                                        </span>
                                                    </div>
                                                    <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                    <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                </button>
                                                <div className="accordion-content active border-t" id={"package_content_" + prodPackage.id.toString()}>
                                                    <div className="product-list flex flex-col">
                                                        <table className="table align-middle text-gray-700 font-medium text-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th className='w-[10px] text-center'>Supply</th>
                                                                    <th className='w-[10px] text-center'>Install</th>
                                                                    <th className='w-[250px]'>Product</th>
                                                                    <th className='w-[100px] text-center'>Quantity</th>
                                                                    <th className='w-[100px] text-center'>Unit Price</th>
                                                                    <th className='w-[100px] text-center'>Discount</th>
                                                                    <th className='w-[100px] text-center'>Total Price</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {prodPackage.products.map((product) => (
                                                                    <tr
                                                                        key={product.id}
                                                                        className={`${!product.pivot.includeSupply && !product.pivot.includeInstall ? 'light:bg-orange-50 dark:bg-orange-950' : ''}`}
                                                                    >
                                                                        <td>
                                                                            <span></span>
                                                                            <div className="flex flex-col items-center">
                                                                                <input
                                                                                    className="checkbox"
                                                                                    name="supply"
                                                                                    type="checkbox"
                                                                                    checked={!!product.pivot.includeSupply}
                                                                                    readOnly
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <div className="flex flex-col items-center">
                                                                                <input
                                                                                    className="checkbox"
                                                                                    name="install"
                                                                                    type="checkbox"
                                                                                    checked={!!product.pivot.includeInstall}
                                                                                    readOnly
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <div className="flex flex-col">
                                                                                <span>{product.name}</span>
                                                                                <span className="text-xs text-gray-400">
                                                                                    {(!product.description || product.description === "")
                                                                                        ? ""
                                                                                        : [
                                                                                            product.pivot.includeSupply && "Supply",
                                                                                            product.pivot.includeInstall && "Install"
                                                                                        ]
                                                                                            .filter(Boolean)
                                                                                            .join(" and ") + (product.description ? " " + product.description : "")
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className='text-center text-lg'>
                                                                            <span className="mx-2 text-base">
                                                                                {product.pivot.included ? ((!product.pivot.includeSupply && !product.pivot.includeInstall ? 0 : product.pivot.quantity)) : '0'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-center">
                                                                            RM {(product.provisioning.supply.retail_price + product.provisioning.install.retail_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className='text-center'>
                                                                            {!product.pivot.includeSupply || !product.pivot.includeInstall
                                                                                ? `- RM ${(
                                                                                    (!product.pivot.includeSupply ? product.provisioning.supply.excluded_price * product.pivot.quantity : 0) +
                                                                                    (!product.pivot.includeInstall ? product.provisioning.install.excluded_price * product.pivot.quantity : 0)
                                                                                )
                                                                                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                                : null}
                                                                        </td>
                                                                        <td className="text-center">
                                                                            {!product.pivot.included
                                                                                ? null
                                                                                : `RM ${(
                                                                                    (product.provisioning.supply.retail_price * product.pivot.quantity -
                                                                                        (!product.pivot.includeSupply ? product.provisioning.supply.excluded_price * product.pivot.quantity : 0)
                                                                                    ) +
                                                                                    (product.provisioning.install.retail_price * product.pivot.quantity -
                                                                                        (!product.pivot.includeInstall ? product.provisioning.install.excluded_price * product.pivot.quantity : 0)
                                                                                    )
                                                                                )
                                                                                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="modal p-4" data-modal="true" data-modal-backdrop-static="true" id="preview_order_modal">
                <div className="modal-content modal-overlay max-w-[420px]">
                    <div className="modal-header">
                        <div className="modal-title text-lg">
                            {orderDetail.status === 'confirmed' ?
                                <span className="">Quotation Order Overview (Preview)</span>
                                :
                                <span className="">Quotation Order Agreement (Preview)</span>
                            }
                        </div>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body overflow-y-auto scrollable-y flex flex-col ">
                        <div className="tabs mb-3">
                            <button
                                className={`tab ${activeTab === 'tab_1_1' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tab_1_1')}
                            >
                                {orderDetail.status === 'confirmed' ?
                                    'Overview'
                                    :
                                    'Quotation Order'
                                }
                            </button>
                            {orderDetail.status === 'confirmed' ?
                                <button
                                    className={`tab ${activeTab === 'tab_1_4' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('tab_1_4')}
                                >
                                    Quotation Order
                                </button>
                                :
                                ''
                            }
                            <button
                                className={`tab ${activeTab === 'tab_1_2' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tab_1_2')}
                            >
                                T&C
                            </button>
                            <button
                                className={`tab ${activeTab === 'tab_1_3' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tab_1_3')}
                            >
                                Reno Agreement
                            </button>
                        </div>
                        <div className={activeTab === 'tab_1_1' ? '' : 'hidden'} id="tab_1_1">
                            <div className="overflow-x-auto">
                                {orderDetail.status === 'confirmed' &&
                                    <div className="flex flex-col flex-1 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg text-gray-900 mb-1 font-semibold">{100 - (orderDetail.sale.remaining_percentage * 100)}% Invoice Issued</span>
                                            <div className="flex">
                                                <div className="badge badge-success badge-outline text-md mb-2">
                                                    {orderDetail.sale.invoices.reduce((sum, invoice) => {
                                                        if (invoice.status === 'paid') {
                                                            return sum + invoice.percentage;
                                                        }
                                                        return sum;
                                                    }, 0) * 100}% Paid
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-[12px] mb-2 relative overflow-hidden">
                                            {/* Issued progress bar (outer) */}
                                            <div
                                                className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                                style={{
                                                    width: `${100 - (orderDetail.sale.remaining_percentage * 100)}%`,
                                                    height: '12px'
                                                }}
                                            />

                                            {/* Paid progress bar (inner) */}
                                            <div
                                                className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                style={{
                                                    width: `${orderDetail.sale.invoices.reduce((sum, invoice) => {
                                                        if (invoice.status === 'paid') {
                                                            return sum + invoice.percentage;
                                                        }
                                                        return sum;
                                                    }, 0) * 100}%`,
                                                    height: '12px'
                                                }}
                                            />
                                        </div>
                                        <div className="flex mb-2 gap-2">
                                            <span className="badge badge-pill badge-outline gap-1 items-center bg-blue-50 border-blue-200 text-blue-300">
                                                <span className="badge badge-dot size-1.5 bg-blue-300"></span>
                                                Issued
                                            </span>
                                            <span className="badge badge-pill badge-outline gap-1 items-center badge-success">
                                                <span className="badge badge-dot size-1.5 badge-success"></span>
                                                Paid
                                            </span>
                                        </div>
                                    </div>
                                }

                                <div className="flex flex-col mb-4">
                                    <div className="card flex-1 mb-2">
                                        <div className="card-header py-0 flex justify-between">
                                            <h2 className="card-title">
                                                Quotation Order Detail
                                            </h2>
                                            <span className={`badge badge-sm p-2 cursor-default
                                                ${orderDetail.status === 'confirmed' ? 'badge-success' : ''} 
                                                ${orderDetail.status === 'revoked' ? 'badge-danger' : ''} 
                                                badge-outline`}
                                            >
                                                {orderDetail.status}
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            <div className="flex justify-between flex-wrap gap-8 mb-4">
                                                <div className="flex flex-col">
                                                    {/* <span className='badge badge-sm text-sm text-gray-900 font-semibold'>{orderDetail.order_no}</span> */}
                                                    <span className='text-sm text-gray-600'>QUO Number:</span>
                                                    <span className='text-sm text-gray-900 font-semibold'>{orderDetail.order_no}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className='text-sm text-gray-600'>Date Created:</span>
                                                    <span className='text-sm text-gray-900 font-semibold'>
                                                        {formatDate(orderDetail.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            {orderDetail.status === 'confirmed' &&
                                                <>

                                                    {/* Summary */}
                                                    {packageCategories.some(category => category.category !== "undefined") &&
                                                        <div className="card-body p-4 bg-gray-50 border-l-4 border-purple-500 rounded-lg shadow-sm mb-4">
                                                            <div className="flex flex-col gap-5">
                                                                {/* Header */}
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                                                    </svg>
                                                                    <span className="text-xl text-purple-600 font-bold">Summary</span>
                                                                </div>

                                                                {/* Category Summary */}
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    {packageCategories.map((category, index) => (
                                                                        <div key={index} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-xs hover:shadow-md transition-shadow">
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-sm text-gray-600 font-medium">Total {category.category} Cost</span>
                                                                            </div>
                                                                            <span className="text-sm text-gray-700 font-semibold">
                                                                                RM {category.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    }

                                                    {
                                                        selectedQuotation.bonus && (
                                                            <div className="card-body p-4 bg-gray-100 border-l-4 border-teal-500 rounded-lg shadow-md mb-4">
                                                                <div className="flex flex-col gap-4">
                                                                    <div className="flex flex-col">
                                                                        <span className='text-lg text-teal-600 font-bold'>Bonus:</span> {/* Increased font size and boldness */}
                                                                        <ul className='text-sm text-gray-900 font-semibold list-inside pl-2 mt-2'>
                                                                            {selectedQuotation.bonus.description ?
                                                                                selectedQuotation.bonus.description.split('\n').map((item, index) => (
                                                                                    <li key={index} className="mb-1">
                                                                                        <span className="block light:bg-teal-100 dark:bg-teal-500 p-2 rounded-md shadow-sm">{item}</span>
                                                                                    </li>
                                                                                ))
                                                                                :
                                                                                <li className="mb-1">
                                                                                    <span className="block light:bg-teal-100 dark:bg-teal-500 p-2 rounded-md shadow-sm">No Details</span>
                                                                                </li>
                                                                            }
                                                                        </ul>
                                                                    </div>
                                                                    <div className="flex flex-col mt-4">
                                                                        <span className='text-sm text-gray-600 font-semibold'>Discount:</span>
                                                                        <span className='text-xl text-teal-600 font-bold'>
                                                                            {`RM ${selectedQuotation.bonus.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    }

                                                    {/* Total Amount section */}
                                                    <div className="card-body p-4 bg-gray-100 border-l-4 border-blue-500 rounded-lg shadow-md mb-4">
                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex flex-col">
                                                                <span className='text-lg text-blue-600 font-bold'>Total Amount:</span> {/* Increased font size and boldness */}
                                                                <span className='text-xl text-gray-900 font-semibold'>
                                                                    {orderDetail.final_amount > 0 ? `RM ${(orderDetail.final_amount - Number(selectedQuotation.bonus?.value)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `RM ${orderDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                </span>
                                                                {selectedQuotation.bonus && (
                                                                    <span className='text-gray-900 text-sm'>
                                                                        Original Price: RM {orderDetail.final_amount > 0 ? orderDetail.final_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : orderDetail.latest_quotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            }
                                        </div>
                                    </div>

                                    <div className="card flex-1 mb-2">
                                        <div className="card-header">
                                            <h2 className="card-title">
                                                Property
                                            </h2>
                                        </div>
                                        <div className="card-body">
                                            <div className="flex justify-between flex-wrap">
                                                <div className="flex flex-col mb-4 mr-8">
                                                    <span className='text-sm text-gray-600'>Name:</span>
                                                    <span className='text-sm text-gray-900 font-semibold'>{orderDetail.property.name}</span>
                                                </div>
                                                <div className="flex flex-col mb-4">
                                                    <span className='text-sm text-gray-600'>Unit:</span>
                                                    <span className='text-sm text-gray-900 font-semibold'>{orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no}</span>
                                                </div>
                                                <div className="">

                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className='text-sm text-gray-600'>Address:</span>
                                                <span className='text-sm text-gray-900'>
                                                    {[
                                                        orderDetail.property.address,
                                                        orderDetail.property.street,
                                                        orderDetail.property.postcode,
                                                        orderDetail.property.city,
                                                        orderDetail.property.state,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ')
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {orderDetail.status === 'confirmed' ?
                                    <>
                                        <div className="flex flex-col gap-2 mb-4">
                                            <span className="flex text-gray-900 text-lg font-semibold">
                                                Payment Invoices
                                            </span>

                                            {orderDetail.sale.invoices.length === 0 ?
                                                <div className="flex flex-col items-center">
                                                    <img alt="image" className="dark:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3.svg" />
                                                    <img alt="image" className="light:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3-dark.svg" />

                                                    <h2 className="text-xl font-semibold text-gray-900">There is no Payment Invoices here</h2>
                                                </div>
                                                : orderDetail.sale.invoices.map((invoice, index) => (
                                                    <div
                                                        key={index}
                                                        className="card cursor-pointer"
                                                        data-modal-toggle="#payment_invoice_modal"
                                                    // onClick={() => setSelectedInvoiceId(Number(invoice.id))}
                                                    >
                                                        <div className="card-body flex justify-between items-center">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex">
                                                                        <div className="relative size-[50px] shrink-0 mr-8">
                                                                            <svg className="w-full h-full stroke-info-clarity fill-info-light" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                                                                                <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill="#EFF6FF">
                                                                                </path>
                                                                                <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke="#1B84FF" strokeOpacity="0.2">
                                                                                </path>
                                                                            </svg>
                                                                            <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                                                                <i className="ki-outline ki-document text-1.5xl ps-px text-info"></i>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <h3 className="text-gray-900 text-sm font-medium">
                                                                                {invoice.invoice_no}
                                                                            </h3>
                                                                            <div className="flex flex-col mr-8 mb-2">
                                                                                <span className={`badge badge-outline 
                                                                                                            ${invoice.status === 'paid' ? 'badge-success' : ''}
                                                                                                            ${invoice.status === 'overdue' ? 'badge-danger' : ''}
                                                                                                        `}>
                                                                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex mr-14 flex-wrap">
                                                                        <div className="flex flex-col mr-8 mb-2">
                                                                            <span className="text-xs text-gray-600">
                                                                                Amount:
                                                                            </span>
                                                                            <span className="text-sm text-gray-900 font-medium">
                                                                                RM {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs text-gray-600">
                                                                                Due Date:
                                                                            </span>
                                                                            <span className="text-sm text-gray-900 font-medium">
                                                                                {invoice.due_date
                                                                                    ? new Date(invoice.due_date).toLocaleDateString('en-GB', {
                                                                                        day: 'numeric',
                                                                                        month: 'long',
                                                                                        year: 'numeric'
                                                                                    })
                                                                                    : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </>
                                    :
                                    ''
                                }

                                {orderDetail.status === 'confirmed' ?
                                    ''
                                    :
                                    <>
                                        <table className="w-full border-collapse mb-6">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="p-2 text-center hidden md:table-cell">No.</th>
                                                    <th className="p-2 text-left">Description</th>
                                                    <th className="p-2 text-center">UOM</th>
                                                    <th className="p-2 text-center">QTY</th>
                                                    <th className="p-2 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderDetail.latest_quotation.packages.map((quotationPackage: Package, index: number) => (
                                                    <React.Fragment key={index}>
                                                        <tr className="bg-slate-50 border-b">
                                                            <td className="p-2 text-center hidden text-xs md:table-cell">{index + 1}</td>
                                                            <td className="p-2 text-xs font-semibold">{quotationPackage.name}</td>
                                                            <td className="p-2 text-center hidden text-xs md:table-cell"></td>
                                                            <td className="p-2 text-center text-xs"></td>
                                                            <td className="p-2 text-center text-xs"></td>
                                                        </tr>
                                                        {quotationPackage.products.map((product: Product, prodIndex: number) => (
                                                            // Check if product.pivot.visibility is true
                                                            (product.pivot.includeSupply || product.pivot.includeInstall) && product.pivot.visibility ? (
                                                                <tr key={prodIndex} className="border-b text-xs">
                                                                    <td className="p-2 hidden md:table-cell"></td>
                                                                    <td className="p-2 flex flex-col">
                                                                        <span className='text-gray-900'>{product.name}</span>
                                                                        <span className='text-gray-500 text-2xs'>
                                                                            {(!product.description || product.description === "")
                                                                                ? ""
                                                                                : getProductDescription(product)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-2 text-center text-gray-900">
                                                                        {product.uom}
                                                                    </td>
                                                                    <td className="p-2 text-center text-gray-900">
                                                                        {!product.pivot.included
                                                                            ? 0
                                                                            : product.pivot.quantity}
                                                                    </td>
                                                                    <td className="p-2 text-center hidden md:table-cell text-gray-900"></td>
                                                                </tr>
                                                            ) : (
                                                                ""
                                                            )
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>

                                        {/* Summary */}
                                        {packageCategories.some(category => category.category !== "undefined") &&
                                            <div className="card-body p-4 bg-gray-50 border-l-4 border-purple-500 rounded-lg shadow-sm mb-4">
                                                <div className="flex flex-col gap-5">
                                                    {/* Header */}
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                                        </svg>
                                                        <span className="text-xl text-purple-600 font-bold">Summary</span>
                                                    </div>

                                                    {/* Category Summary */}
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {packageCategories.map((category, index) => (
                                                            <div key={index} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-xs hover:shadow-md transition-shadow">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-sm text-gray-600 font-medium">Total {category.category} Cost</span>
                                                                </div>
                                                                <span className="text-sm text-gray-700 font-semibold">
                                                                    RM {category.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        }

                                        {
                                            selectedQuotation.bonus && (
                                                <div className="card-body p-4 bg-gray-100 border-l-4 border-teal-500 rounded-lg shadow-md mb-4">
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex flex-col">
                                                            <span className='text-lg text-teal-600 font-bold'>Bonus:</span> {/* Increased font size and boldness */}
                                                            <ul className='text-sm text-gray-900 font-semibold list-inside pl-2 mt-2'>
                                                                {selectedQuotation.bonus.description ?
                                                                    selectedQuotation.bonus.description.split('\n').map((item, index) => (
                                                                        <li key={index} className="mb-1">
                                                                            <span className="block light:bg-teal-100 dark:bg-teal-500 p-2 rounded-md shadow-sm">{item}</span>
                                                                        </li>
                                                                    ))
                                                                    :
                                                                    <li className="mb-1">
                                                                        <span className="block light:bg-teal-100 dark:bg-teal-500 p-2 rounded-md shadow-sm">No Details</span>
                                                                    </li>
                                                                }
                                                            </ul>
                                                        </div>
                                                        <div className="flex flex-col mt-4">
                                                            <span className='text-sm text-gray-600 font-semibold'>Discount:</span>
                                                            <span className='text-xl text-teal-600 font-bold'>
                                                                {`RM ${selectedQuotation.bonus.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        {/* Total Amount section */}
                                        <div className="card-body p-4 bg-gray-100 border-l-4 border-blue-500 rounded-lg shadow-md mb-4">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-col">
                                                    <span className='text-lg text-blue-600 font-bold'>Total Amount:</span> {/* Increased font size and boldness */}
                                                    <span className='text-xl text-gray-900 font-semibold'>
                                                        {orderDetail.final_amount > 0 ? `RM ${(orderDetail.final_amount - Number(selectedQuotation.bonus?.value)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `RM ${orderDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                    </span>
                                                    {selectedQuotation.bonus && (
                                                        <span className='text-gray-900 text-sm'>
                                                            Original Price: RM {orderDetail.final_amount > 0 ? orderDetail.final_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : orderDetail.latest_quotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-start gap-4">
                                            <label className="form-label flex items-center gap-2 flex-wrap">
                                                <input
                                                    className="checkbox"
                                                    name="agree_tnc"
                                                    type="checkbox"
                                                    value="1"
                                                    checked={false}
                                                    readOnly
                                                />
                                                <span className="max-w-[80%]">
                                                    I have read and accept the <a href='#' className='link' onClick={() => setActiveTab('tab_1_2')}>Term and Condition</a>
                                                </span>
                                            </label>
                                            <label className="form-label flex items-center gap-2 flex-wrap">
                                                <input
                                                    className="checkbox"
                                                    name="agree_reno_agreement"
                                                    type="checkbox"
                                                    value="1"
                                                    checked={false}
                                                    readOnly
                                                />
                                                <span className="max-w-[80%]">I acknowledge I have agreed with the <a href='#' className='link' onClick={() => setActiveTab('tab_1_3')}>Reno Agreement</a></span>
                                            </label>
                                        </div>
                                    </>
                                }
                            </div>
                        </div>
                        <div className={activeTab === 'tab_1_4' ? '' : 'hidden'} id="tab_1_4">
                            {orderDetail.status === 'confirmed' ?
                                <>
                                    <table className="w-full border-collapse">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 text-sm text-center hidden md:table-cell">No.</th>
                                                <th className="p-2 text-sm text-left">Description</th>
                                                <th className="p-2 text-center">UOM</th>
                                                <th className="p-2 text-center">QTY</th>
                                                <th className="p-2 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderDetail.latest_quotation.packages.map((quotationPackage: Package, index: number) => (
                                                <React.Fragment key={index}>
                                                    <tr className="bg-slate-50 border-b text-2xs">
                                                        <td className="p-2 text-center hidden md:table-cell">{index + 1}</td>
                                                        <td className="p-2 font-semibold">{quotationPackage.name}</td>
                                                        <td className="p-2 text-center hidden md:table-cell"></td>
                                                        <td className="p-2 text-center"></td>
                                                        <td className="p-2 text-center"></td>
                                                    </tr>
                                                    {quotationPackage.products.map((product: Product, prodIndex: number) => (
                                                        // Check if product.pivot.visibility is true
                                                        (product.pivot.includeSupply || product.pivot.includeInstall) && product.pivot.visibility ? (
                                                            <tr key={prodIndex} className="border-b text-2xs">
                                                                <td className="p-2 hidden md:table-cell"></td>
                                                                <td className="p-2 flex flex-col">
                                                                    <span className='text-gray-900'>{product.name}</span>
                                                                    <span className='text-gray-500 text-2xs'>
                                                                        {(!product.description || product.description === "")
                                                                            ? ""
                                                                            : getProductDescription(product)
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td className="p-2 text-center">
                                                                    {product.uom}
                                                                </td>
                                                                <td className="p-2 text-center">
                                                                    {!product.pivot.included
                                                                        ? 0
                                                                        : product.pivot.quantity}
                                                                </td>
                                                                <td className="p-2 text-center hidden md:table-cell"></td>
                                                            </tr>
                                                        ) : (
                                                            ""
                                                        )
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                                :
                                ''
                            }
                        </div>
                        <div className={activeTab === 'tab_1_2' ? '' : 'hidden'} id="tab_1_2">
                            {tnc}
                        </div>
                        <div className={activeTab === 'tab_1_3' ? '' : 'hidden'} id="tab_1_3">
                            {renoAgreement}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmOrderModal
                order={{ id: orderDetail.id, name: orderDetail.order_no }}
                onSubmit={refetch}
            />

            <div className="tooltip" id="final_pricing_tooltip">
                This is the price that will be display to the owner
            </div>
        </>
    )
}

export default OrderDetail;