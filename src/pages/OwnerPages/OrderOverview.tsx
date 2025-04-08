import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Order, Package, Product } from '../../types/index';
import Loading from '../../components/Loading';
import { Slide, toast } from 'react-toastify';
import KTComponent from '../../metronic/core';
import useFetchOwnerOrder from '../../hook/useFetchOwnerOrder';
import { Link } from 'react-router-dom';

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

function OrderOverview() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const orderId = id ? parseInt(id, 10) : null;

    const { orderDetail: order, loading, error } = useFetchOwnerOrder(orderId);
    const [packageCategories, setPackageCategories] = useState<{ category: string; total_price: number }[]>([]);
    const [orderDetail, setOrderDetail] = useState<Order>(null);
    const [totalExcludedAddonAmount, setTotalExcludedAddonAmount] = useState<number>(0);

    const [activeTab, setActiveTab] = useState('tab_1_1');

    const [agreeTnc, setAgreeTnc] = useState(false);
    const [agreeRenoAgreement, setAgreeRenoAgreement] = useState(false);

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
        if (order) {
            setOrderDetail(order);
        }
    }, [order]);

    useEffect(() => {
        if (!orderDetail?.latest_quotation?.metadata) return;

        let addonCounter = 0; // To number each add-on uniquely

        const packages: Package[] = JSON.parse(JSON.parse(JSON.stringify(orderDetail?.latest_quotation?.metadata)));

        const categoryTotals = packages.reduce((acc, quotationPackage) => {
            let category;
            if (quotationPackage.is_addon === true) {
                addonCounter += 1;
                category = `Add-on Option ${addonCounter}`;
            } else {
                category = quotationPackage.category;
            }

            const categoryTotal = quotationPackage.products.reduce((total, product) => {
                let supplyPrice = 0;
                if (product.pivot.includeSupply) {
                    supplyPrice = (product.provisioning.supply.retail_price * product.pivot.quantity) || 0;
                } else {
                    supplyPrice = (product.provisioning.supply.retail_price - product.provisioning.supply.excluded_price) || 0;
                }

                let installPrice = 0;
                if (product.pivot.includeInstall) {
                    installPrice = (product.provisioning.install.retail_price * product.pivot.quantity) || 0;
                } else {
                    installPrice = (product.provisioning.install.retail_price - product.provisioning.install.excluded_price) || 0;
                }

                return total + supplyPrice + installPrice;
            }, 0) * (quotationPackage.quantity || 1);

            if (!(quotationPackage.is_addon === true && quotationPackage.is_addon_included === false)) {
                if (!acc[category]) {
                    acc[category] = { total_price: 0, quantity: 0 };
                }
                acc[category].total_price += categoryTotal;
                acc[category].quantity += quotationPackage.quantity;
            }

            return acc;
        }, {} as Record<string, { total_price: number, quantity: number }>);

        // Calculate filtered total_amount
        const filteredTotalAmount = Object.values(categoryTotals).reduce((sum, { total_price }) => sum + total_price, 0);

        const categoriesArray = Object.entries(categoryTotals).map(([category, { total_price, quantity }]) => ({
            category: category.startsWith('Add-on Option')
                ? category
                : categoryOptions.find(option => option.value === category)?.label || category,
            total_price,
            quantity
        }));

        const sortedCategories = [
            ...categoriesArray.filter(item => !item.category.startsWith('Add-on Option')),
            ...categoriesArray.filter(item => item.category.startsWith('Add-on Option'))
        ];

        setPackageCategories(sortedCategories);

        // Update orderDetail with filtered total_amount (assuming you can modify it)
        setOrderDetail(prev => ({
            ...prev,
            total_amount: filteredTotalAmount
        }));

    }, [orderDetail?.latest_quotation]);

    useEffect(() => {
        if (orderDetail) {
            const packages: Package[] = JSON.parse(JSON.parse(JSON.stringify(orderDetail?.latest_quotation?.metadata)));

            const totalAmount = orderDetail.final_amount > 0 ? orderDetail.final_amount : packages.reduce((total, pkg) => {
                // Skip if package is not an addon or not included
                if (pkg.is_addon === true && pkg.is_addon_included === false) {
                    return total;
                }

                // Use final_amount if available, otherwise use total_price
                return total + (pkg.total_price * (pkg.quantity || 1));
            }, 0);

            setTotalExcludedAddonAmount(totalAmount);
        }
    }, [orderDetail])

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

    useEffect(() => {
        document.title = "Order Overview | RenoXpert";
        KTComponent.init();
    }, []);

    const handleAgreeTncChange = (event) => {
        setAgreeTnc(event.target.checked);
    };

    const handleAgreeRenoAgreementChange = (event) => {
        setAgreeRenoAgreement(event.target.checked);
    };

    const handleAgreeOrder = async () => {
        navigate('/confirm/order/otp/verify', {
            state: {
                'conutry_code': orderDetail.user.country_code,
                'mobile': orderDetail.user.phone_no,
                'orderId': orderDetail.id
            }
        });
    }

    if (loading) return <Loading />;
    if (error) return (
        <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center">
                <img alt="image" className="dark:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3.svg" />
                <img alt="image" className="light:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3-dark.svg" />

                <h2 className="text-xl font-semibold text-gray-900">Order not found or invalid</h2>
            </div>
        </div>

    );
    if (!orderDetail) return <div>An unexpected error occured</div>;

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
            <li>Complimentary items are provided if required for the unit, subject to necessity. These items are non-exchangeable for cash, discounts, or any other value. If deemed unnecessary for the unit, they will not be applicable for redemption.</li>
            <li>Payment verification: Kindly WhatsApp us at +6011-5698 5313 with the bank-in slip or online payment receipt, along with the client’s name, development name, and unit number.</li>
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

    const address = orderDetail.user ? [
        orderDetail.user.address.address_1,
        orderDetail.user.address.street,
        orderDetail.user.address.postcode,
        orderDetail.user.address.city,
        orderDetail.user.address.state,
    ].filter(Boolean).join(', ') :
        null
        ;

    const propertyAddress = [
        orderDetail.property.address,
        orderDetail.property.street,
        orderDetail.property.postcode,
        orderDetail.property.city,
        orderDetail.property.state
    ].filter(part => part !== null && part !== '')

    const bonus = JSON.parse(JSON.parse(JSON.stringify(orderDetail.latest_quotation.bonus)))


    const renoAgreement = (
        <div className='flex flex-col w-full text-sm text-justify'>
            <div className="flex flex-col items-center justify-center gap-6 text-center mb-6">
                <span>THIS AGREEMENT is made this day of <strong>{orderDetail.status === 'confirmed' ? formatDate(orderDetail.updated_at) : getCurrentDate()}</strong></span>
                <span>BETWEEN</span>
                <span><strong>RENOXPERT SDN. BHD. [Registration No.202401032588 (1578437-W)]</strong> of <strong>42-46, Ground Floor, Jalan SS 19/1d, SS 19, 46500 Subang Jaya, Selangor</strong> (“the Contractor”) of the one part;</span>
                <span>AND</span>
                <span><strong>{orderDetail.user ? orderDetail.user.name : '[Owner Name]'} (NRIC No. {orderDetail.user ? orderDetail.user.ic : "[Owner IC]"})</strong> of <strong>{address ? address : "[Owner Address]"}</strong> ("the Owner") of the other part</span>
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
            </div><div className="flex flex-col items-center justify-center gap-6 text-center mb-6">
                <div className="flex flex-col">
                    <span className='font-bold underline'>FIRST SCHEDULE</span>
                    <span>(to be taken read and construed as an essential part of this Agreement)</span>
                </div>
                <span className='font-bold'>-</span>
                <span className='font-bold'>PROGRESSIVE PAYMENT OF THE CONTRACT SUM</span>
                {orderDetail && orderDetail.is_progressive_payment ? (
                    <table className='table align-middle text-gray-700 font-medium text-sm max-w-lg'>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th className='text-center'>%</th>
                                <th className='text-center'>Amount (RM)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Upon Confirmation and before Commencement of Phase 1</td>
                                <td className='text-center'>50</td>
                                <td className='text-center'>
                                    {((totalExcludedAddonAmount - Number(bonus?.value || 0)) / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                            <tr>
                                <td>Upon Completion of Phase 1 and before Commencement of Phase 2</td>
                                <td className='text-center'>50</td>
                                <td className='text-center'>
                                    {((totalExcludedAddonAmount - Number(bonus?.value || 0)) / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                            <tr className='font-bold'>
                                <td>Total:</td>
                                <td className='text-center'>100</td>
                                <td className='text-center'>
                                    {(totalExcludedAddonAmount - Number(bonus?.value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <table className='table align-middle text-gray-700 font-medium text-sm max-w-lg'>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th className='text-center'>%</th>
                                <th className='text-center'>Amount (RM)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Upon Confirmation of Agreement</td>
                                <td className='text-center'>100</td>
                                <td className='text-center'>
                                    {orderDetail
                                        ? (totalExcludedAddonAmount - Number(bonus?.value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                        : '0.00'}
                                </td>
                            </tr>
                            <tr className='font-bold'>
                                <td>Total:</td>
                                <td className='text-center'>100</td>
                                <td className='text-center'>
                                    {orderDetail
                                        ? (totalExcludedAddonAmount - Number(bonus?.value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                        : '0.00'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
                <span>In the event of a default by the Owner of the payment hereunder when due, the Owner shall be liable to pay interest at the rate of eight per centum (8%) per annum on the outstanding sum from the date due for payment until the date of actual payment.</span>
            </div>
        </div>

    );

    const isButtonDisabled = !(agreeTnc && agreeRenoAgreement);

    return (
        <>
            <div className="flex w-full px-2">
                <div className="card flex-auto w-full max-w-4xl">
                    {/* Header */}
                    <div className="card-header flex justify-between">
                        <div className="flex gap-4 justify-center">
                            <Link
                                to={'/owner/home'}
                                className="ki-solid ki-arrow-left items-center text-gray-900">
                            </Link>
                            {orderDetail.status === 'confirmed' ?
                                <span className="text-lg text-gray-900 font-semibold">Quotation Order Overview</span>
                                :
                                <span className="text-lg text-gray-900 font-semibold">Quotation Order Agreement</span>
                            }

                        </div>
                        {/* <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0">
                        <i className="ki-filled ki-printer"></i>
                    </button> */}
                    </div>

                    {/* Body */}
                    <div className="card-body pt-2 px-4">
                        {/* Tabs */}
                        <div className="tabs mb-5">
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

                        {/* Tab Content */}
                        <div className={activeTab === 'tab_1_1' ? 'block' : 'hidden'} id="tab_1_1">
                            <div className="overflow-x-auto">
                                {/* Progress Bar */}
                                {orderDetail.status === 'confirmed' && (
                                    <div className="flex flex-col mb-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
                                            <span className="text-lg text-gray-900 font-semibold">
                                                {(100 - orderDetail.sale.remaining_percentage * 100).toFixed(2)}% Invoice Issued
                                            </span>
                                            <div className="badge badge-success badge-outline text-md mt-2 sm:mt-0">
                                                {(orderDetail.sale.invoices.reduce((sum, invoice) => {
                                                    return invoice.status === 'paid' ? sum + invoice.percentage : sum;
                                                }, 0) * 100).toFixed(2)}% Paid
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
                                                    width: `${orderDetail.sale.invoices.reduce((sum, invoice) => {
                                                        return invoice.status === 'paid' ? sum + invoice.percentage : sum;
                                                    }, 0) * 100}%`,
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

                                {/* Cards */}
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="card flex-1 bg-white shadow-sm rounded-lg">
                                        <div className="card-header p-4 flex justify-between items-center">
                                            <h2 className="card-title text-lg font-semibold">Quotation Order Detail</h2>
                                            <span
                                                className={`badge badge-sm p-2 capitalize badge-outline ${orderDetail.status === 'confirmed' ? 'badge-success' : orderDetail.status === 'revoked' ? 'badge-danger' : ''
                                                    }`}
                                            >
                                                {orderDetail.status === 'confirmed' ? 'Sale' : orderDetail.status}
                                            </span>
                                        </div>
                                        <div className="card-body p-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-sm text-gray-600">QUO Number:</span>
                                                    <p className="text-sm text-gray-900 font-semibold">{orderDetail.order_no}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-600">Date Created:</span>
                                                    <p className="text-sm text-gray-900 font-semibold">{formatDate(orderDetail.created_at)}</p>
                                                </div>
                                            </div>
                                            {/* Add-On Customization Button (Visible only when not confirmed) */}
                                            {orderDetail.status !== 'confirmed' && (
                                                <div className="mt-4">
                                                    <Link
                                                        to={`/owner/order/${orderDetail.id}/customize-addons`}
                                                        className="inline-block bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                                                    >
                                                        Customize Add-On Packages
                                                    </Link>
                                                </div>
                                            )}
                                            {orderDetail.status === 'confirmed' && (
                                                <>
                                                    {!orderDetail.f_1 && (
                                                        <div className="mt-4 p-4 bg-gray-50 border-l-4 border-purple-500 rounded-lg">
                                                            <h3 className="text-lg text-purple-600 font-bold flex items-center gap-2">
                                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                                                </svg>
                                                                Summary
                                                            </h3>
                                                            <div className="mt-2 space-y-2">
                                                                {packageCategories.map((category, index) => (
                                                                    <div key={index} className="flex justify-between p-2 bg-white rounded shadow-sm">
                                                                        <span className="text-sm text-gray-600">Total {category.category} Cost</span>
                                                                        <span className="text-sm text-gray-700 font-semibold">
                                                                            RM {category.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {bonus && (
                                                        <div className="mt-4 p-4 bg-gray-100 border-l-4 border-teal-500 rounded-lg">
                                                            <h3 className="text-lg text-teal-600 font-bold">Bonus:</h3>
                                                            <ul className="text-sm text-gray-900 font-semibold mt-2 space-y-1">
                                                                {bonus.description ? (
                                                                    bonus.description.split('\n').map((item, index) => (
                                                                        <li key={index} className="p-2 bg-teal-50 rounded">{item}</li>
                                                                    ))
                                                                ) : (
                                                                    <li className="p-2 bg-teal-50 rounded">No Details</li>
                                                                )}
                                                            </ul>
                                                            <div className="mt-2">
                                                                <span className="text-sm text-gray-600 font-semibold">Discount:</span>
                                                                <p className="text-xl text-teal-600 font-bold">
                                                                    RM {bonus?.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="mt-4 p-4 bg-gray-100 border-l-4 border-blue-500 rounded-lg">
                                                        <h3 className="text-lg text-blue-600 font-bold">Total Amount:</h3>
                                                        <p className='text-xl text-gray-900 font-semibold'>
                                                            {orderDetail.final_amount > 0
                                                                ? `RM ${(
                                                                    orderDetail.final_amount -
                                                                    (bonus ? Number(bonus?.value) : 0)
                                                                ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                : `RM ${(totalExcludedAddonAmount - (Number(bonus?.value) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                        </p>
                                                        {bonus && (
                                                            <p className='text-gray-900 text-sm'>
                                                                Original Price: RM {orderDetail.final_amount > 0 ? totalExcludedAddonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalExcludedAddonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card flex-1 bg-white shadow-sm rounded-lg">
                                        <div className="card-header p-4">
                                            <h2 className="card-title text-lg font-semibold">Property</h2>
                                        </div>
                                        <div className="card-body p-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-sm text-gray-600">Name:</span>
                                                    <p className="text-sm text-gray-900 font-semibold">{orderDetail.property.name}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-600">Unit:</span>
                                                    <p className="text-sm text-gray-900 font-semibold">
                                                        {orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-600">Unit Type:</span>
                                                    <p className="text-sm text-gray-900 font-semibold">{orderDetail.unit_type || '-'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-600">Partition:</span>
                                                    <p className="text-sm text-gray-900 font-semibold">{orderDetail.include_partition ? 'Yes' : 'No'}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <span className="text-sm text-gray-600">Address:</span>
                                                <p className="text-sm text-gray-900">
                                                    {[
                                                        orderDetail.property.address,
                                                        orderDetail.property.street,
                                                        orderDetail.property.postcode,
                                                        orderDetail.property.city,
                                                        orderDetail.property.state,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Invoices */}
                                {orderDetail.status === 'confirmed' && (
                                    <div className="mb-6">
                                        <h2 className="text-lg text-gray-900 font-semibold mb-4">Payment Invoices</h2>
                                        {orderDetail.sale.invoices.length === 0 ? (
                                            <div className="flex flex-col items-center">
                                                <img alt="No invoices" className="dark:hidden max-h-[160px] mb-4" src="/public/media/illustrations/3.svg" />
                                                <img alt="No invoices" className="light:hidden max-h-[160px] mb-4" src="/public/media/illustrations/3-dark.svg" />
                                                <h3 className="text-xl font-semibold text-gray-900">No Payment Invoices Available</h3>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {orderDetail.sale.invoices.map((invoice, index) => (
                                                    <Link to={`/invoice/${invoice.id}/view`} key={index} className="card bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow">
                                                        <div className="card-body p-4 flex flex-col">
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <div className="relative size-12 shrink-0">
                                                                    <svg className="w-full h-full stroke-blue-500 fill-blue-100" viewBox="0 0 44 48">
                                                                        <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" />
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-sm text-gray-900 font-medium">{invoice.invoice_no}</h3>
                                                                    <span
                                                                        className={`badge badge-outline ${invoice.status === 'paid' ? 'badge-success' : invoice.status === 'overdue' ? 'badge-danger' : ''
                                                                            }`}
                                                                    >
                                                                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2">
                                                                <span className="text-xs text-gray-600">Amount:</span>
                                                                <p className="text-sm text-gray-900 font-medium">
                                                                    RM {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </p>
                                                            </div>
                                                            <div className="mt-2">
                                                                <span className="text-xs text-gray-600">Due Date:</span>
                                                                <p className="text-sm text-gray-900 font-medium">
                                                                    {invoice.due_date
                                                                        ? new Date(invoice.due_date).toLocaleDateString('en-GB', {
                                                                            day: 'numeric',
                                                                            month: 'long',
                                                                            year: 'numeric',
                                                                        })
                                                                        : 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Quotation Order Table (when not confirmed) */}
                                {orderDetail.status !== 'confirmed' && (
                                    <div className="overflow-x-auto mb-6">
                                        <table className="w-full border-collapse text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="p-2 text-center hidden md:table-cell">No.</th>
                                                    <th className="p-2 text-left">Description</th>
                                                    <th className="p-2 text-center">UOM</th>
                                                    <th className="p-2 text-center">QTY</th>
                                                    <th className="p-2 text-center hidden md:table-cell"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    let packageCounter = 0;
                                                    let addonCounter = 0;
                                                    return JSON.parse(JSON.parse(JSON.stringify(orderDetail.latest_quotation.metadata))).map((quotationPackage, index) => {
                                                        const isAddon = quotationPackage.is_addon;
                                                        const counter = isAddon ? addonCounter++ : packageCounter++;

                                                        return (
                                                            <React.Fragment key={index}>
                                                                <tr className="bg-slate-50 border-b">
                                                                    <td className="p-2 text-center hidden md:table-cell">{index + 1}</td>
                                                                    <td className="p-2 font-semibold">
                                                                        <div className="flex flex-col">
                                                                            {quotationPackage.is_addon && <span className="text-gray-900">ADD-ON OPTIONAL {counter + 1}: </span>}
                                                                            <span>{quotationPackage.name}</span>
                                                                            <span className="text-gray-700 text-xs">{quotationPackage.description}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-2 text-center"></td>
                                                                    <td className="p-2 text-center font-semibold">
                                                                        {quotationPackage.is_addon && !quotationPackage.is_addon_included ?
                                                                            <i className="ki-filled ki-cross-circle text-danger text-xl"></i>
                                                                            :
                                                                            quotationPackage.quantity || 1
                                                                        }
                                                                    </td>
                                                                    <td className="p-2 text-center hidden md:table-cell"></td>
                                                                </tr>
                                                                {quotationPackage.products.map((product, prodIndex) => (
                                                                    (product.pivot.includeSupply || product.pivot.includeInstall) && product.pivot.visibility ? (
                                                                        <tr key={prodIndex} className="border-b">
                                                                            <td className="p-2 hidden md:table-cell"></td>
                                                                            <td className="p-2">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-gray-900">{product.name}</span>
                                                                                    <span className="text-gray-500 text-xs">
                                                                                        {product.description
                                                                                            ? product.description.startsWith('Supply & installation of')
                                                                                                ? !product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                                    ? product.description.replace('Supply & installation of', '').trim()
                                                                                                    : !product.pivot.includeSupply
                                                                                                        ? `Installation of ${product.description.replace('Supply & installation of', '').trim()}`
                                                                                                        : !product.pivot.includeInstall
                                                                                                            ? `Supply of ${product.description.replace('Supply & installation of', '').trim()}`
                                                                                                            : product.description
                                                                                                : product.description
                                                                                            : ''}
                                                                                    </span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-2 text-center text-gray-900">{product.uom}</td>
                                                                            <td className="p-2 text-center text-gray-900">{product.pivot.included ? product.pivot.quantity : 0}</td>
                                                                            <td className="p-2 text-center hidden md:table-cell text-gray-900">
                                                                                {!product.pivot.included && `- ${product.product_excluded_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                            </td>
                                                                        </tr>
                                                                    ) : null
                                                                ))}
                                                            </React.Fragment>
                                                        )
                                                    });
                                                })()}
                                            </tbody>
                                        </table>
                                        {/* Summary, Bonus, Total Amount, and Progressive Payment sections */}
                                        {!orderDetail.f_1 && (
                                            <div className="mt-4 p-4 bg-gray-50 border-l-4 border-purple-500 rounded-lg">
                                                <h3 className="text-lg text-purple-600 font-bold flex items-center gap-2">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                                    </svg>
                                                    Summary
                                                </h3>
                                                <div className="mt-2 space-y-2">
                                                    {packageCategories.map((category, index) => (
                                                        <div key={index} className="flex justify-between p-2 bg-white rounded shadow-sm">
                                                            <span className="text-sm text-gray-600">Total {category.category} Cost</span>
                                                            <span className="text-sm text-gray-700 font-semibold">
                                                                RM {category.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {bonus && (
                                            <div className="mt-4 p-4 bg-gray-100 border-l-4 border-teal-500 rounded-lg">
                                                <h3 className="text-lg text-teal-600 font-bold">Bonus:</h3>
                                                <ul className="text-sm text-gray-900 font-semibold mt-2 space-y-1">
                                                    {bonus.description ? (
                                                        bonus.description.split('\n').map((item, index) => (
                                                            <li key={index} className="p-2 bg-teal-50 rounded">{item}</li>
                                                        ))
                                                    ) : (
                                                        <li className="p-2 bg-teal-50 rounded">No Details</li>
                                                    )}
                                                </ul>
                                                <div className="mt-2">
                                                    <span className="text-sm text-gray-600 font-semibold">Discount:</span>
                                                    <p className="text-xl text-teal-600 font-bold">
                                                        RM {bonus?.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="mt-4 p-4 bg-gray-100 border-l-4 border-blue-500 rounded-lg">
                                            <h3 className="text-lg text-blue-600 font-bold">Total Amount:</h3>
                                            <p className='text-xl text-gray-900 font-semibold'>
                                                {orderDetail.final_amount > 0
                                                    ? `RM ${(
                                                        orderDetail.final_amount -
                                                        (bonus ? Number(bonus?.value) : 0)
                                                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                    : `RM ${(totalExcludedAddonAmount - (Number(bonus?.value) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                            </p>
                                            {bonus && (
                                                <p className='text-gray-900 text-sm'>
                                                    Original Price: RM {orderDetail.final_amount > 0 ? totalExcludedAddonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalExcludedAddonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-6 flex flex-col items-center">
                                            <span className="font-bold text-lg mb-2">Progressive Payment of the Contract Sum</span>
                                            <div className="overflow-x-auto w-full max-w-lg">
                                                <table className="table w-full text-sm text-gray-700 font-medium">
                                                    <thead>
                                                        <tr>
                                                            <th className="p-2">Description</th>
                                                            <th className="p-2 text-center">%</th>
                                                            <th className="p-2 text-center">Amount (RM)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {orderDetail.is_progressive_payment ? (
                                                            <>
                                                                <tr>
                                                                    <td className="p-2">Upon Confirmation and before Commencement of Phase 1</td>
                                                                    <td className="p-2 text-center">50</td>
                                                                    <td className="p-2 text-center">
                                                                        {((totalExcludedAddonAmount - Number(bonus?.value || 0)) / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="p-2">Upon Completion of Phase 1 and before Commencement of Phase 2</td>
                                                                    <td className="p-2 text-center">50</td>
                                                                    <td className="p-2 text-center">
                                                                        {((totalExcludedAddonAmount - Number(bonus?.value || 0)) / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </td>
                                                                </tr>
                                                            </>
                                                        ) : (
                                                            <tr>
                                                                <td className="p-2">Upon Confirmation of Agreement</td>
                                                                <td className="p-2 text-center">100</td>
                                                                <td className="p-2 text-center">
                                                                    {(totalExcludedAddonAmount - Number(bonus?.value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr className="font-bold">
                                                            <td className="p-2">Total:</td>
                                                            <td className="p-2 text-center">100</td>
                                                            <td className="p-2 text-center">
                                                                {(totalExcludedAddonAmount - Number(bonus?.value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Checkboxes */}
                                {orderDetail.status !== 'confirmed' && (
                                    <div className="flex flex-col gap-4 mt-6">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="checkbox"
                                                name="agree_tnc"
                                                checked={agreeTnc || orderDetail.status === 'confirmed'}
                                                onChange={handleAgreeTncChange}
                                                disabled={orderDetail.status === 'confirmed'}
                                            />
                                            <span className="text-sm">
                                                I have read and accept the{' '}
                                                <a href="#" className="text-blue-500 hover:underline" onClick={() => setActiveTab('tab_1_2')}>
                                                    Terms and Conditions
                                                </a>
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="checkbox"
                                                name="agree_reno_agreement"
                                                checked={agreeRenoAgreement || orderDetail.status === 'confirmed'}
                                                onChange={handleAgreeRenoAgreementChange}
                                                disabled={orderDetail.status === 'confirmed'}
                                            />
                                            <span className="text-sm">
                                                I acknowledge I have agreed with the{' '}
                                                <a href="#" className="text-blue-500 hover:underline" onClick={() => setActiveTab('tab_1_3')}>
                                                    Reno Agreement
                                                </a>
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quotation Order Tab (confirmed status) */}
                        <div className={activeTab === 'tab_1_4' ? 'block' : 'hidden'} id="tab_1_4">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm mb-6">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-2 text-center hidden md:table-cell">No.</th>
                                            <th className="p-2 text-left">Description</th>
                                            <th className="p-2 text-center">UOM</th>
                                            <th className="p-2 text-center">QTY</th>
                                            <th className="p-2 text-center hidden md:table-cell"></th>
                                        </tr>
                                    </thead>
                                    <tbody>

                                        {(() => {
                                            let packageCounter = 0;
                                            let addonCounter = 0;
                                            return JSON.parse(JSON.parse(JSON.stringify(orderDetail.latest_quotation.metadata))).map((quotationPackage, index) => {
                                                const isAddon = quotationPackage.is_addon;
                                                const counter = isAddon ? addonCounter++ : packageCounter++;

                                                return (
                                                    <React.Fragment key={index}>
                                                        <tr className="bg-slate-50 border-b">
                                                            <td className="p-2 text-center hidden md:table-cell">{index + 1}</td>
                                                            <td className="p-2 font-semibold">
                                                                <div className="flex flex-col">
                                                                    {quotationPackage.is_addon && <span className="text-gray-900">ADD-ON OPTIONAL {counter + 1}: </span>}
                                                                    <span>{quotationPackage.name}</span>
                                                                    <span className="text-gray-700 text-xs">{quotationPackage.description}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-2 text-center"></td>
                                                            <td className="p-2 text-center font-semibold">
                                                                {quotationPackage.is_addon && !quotationPackage.is_addon_included ?
                                                                    <i className="ki-filled ki-cross-circle text-danger text-xl"></i>
                                                                    :
                                                                    quotationPackage.quantity || 1
                                                                }
                                                            </td>
                                                            <td className="p-2 text-center hidden md:table-cell"></td>
                                                        </tr>
                                                        {quotationPackage.products.map((product, prodIndex) => (
                                                            (product.pivot.includeSupply || product.pivot.includeInstall) && product.pivot.visibility ? (
                                                                <tr key={prodIndex} className="border-b">
                                                                    <td className="p-2 hidden md:table-cell"></td>
                                                                    <td className="p-2">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-gray-900">{product.name}</span>
                                                                            <span className="text-gray-500 text-xs">
                                                                                {product.description
                                                                                    ? product.description.startsWith('Supply & installation of')
                                                                                        ? !product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                            ? product.description.replace('Supply & installation of', '').trim()
                                                                                            : !product.pivot.includeSupply
                                                                                                ? `Installation of ${product.description.replace('Supply & installation of', '').trim()}`
                                                                                                : !product.pivot.includeInstall
                                                                                                    ? `Supply of ${product.description.replace('Supply & installation of', '').trim()}`
                                                                                                    : product.description
                                                                                        : product.description
                                                                                    : ''}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-2 text-center text-gray-900">{product.uom}</td>
                                                                    <td className="p-2 text-center text-gray-900">{product.pivot.included ? product.pivot.quantity : 0}</td>
                                                                    <td className="p-2 text-center hidden md:table-cell text-gray-900">
                                                                        {!product.pivot.included && `- ${product.product_excluded_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                    </td>
                                                                </tr>
                                                            ) : null
                                                        ))}
                                                    </React.Fragment>
                                                )
                                            });
                                        })()}
                                    </tbody>
                                </table>
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-lg mb-2">Progressive Payment of the Contract Sum</span>
                                    <div className="overflow-x-auto w-full max-w-lg">
                                        <table className="table w-full text-sm text-gray-700 font-medium">
                                            <thead>
                                                <tr>
                                                    <th className="p-2">Description</th>
                                                    <th className="p-2 text-center">%</th>
                                                    <th className="p-2 text-center">Amount (RM)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderDetail.is_progressive_payment ? (
                                                    <>
                                                        <tr>
                                                            <td className="p-2">Upon Confirmation and before Commencement of Phase 1</td>
                                                            <td className="p-2 text-center">50</td>
                                                            <td className="p-2 text-center">
                                                                {((totalExcludedAddonAmount - Number(bonus?.value || 0)) / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-2">Upon Completion of Phase 1 and before Commencement of Phase 2</td>
                                                            <td className="p-2 text-center">50</td>
                                                            <td className="p-2 text-center">
                                                                {((totalExcludedAddonAmount - Number(bonus?.value || 0)) / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                        </tr>
                                                    </>
                                                ) : (
                                                    <tr>
                                                        <td className="p-2">Upon Confirmation of Agreement</td>
                                                        <td className="p-2 text-center">100</td>
                                                        <td className="p-2 text-center">
                                                            {(totalExcludedAddonAmount - Number(bonus?.value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr className="font-bold">
                                                    <td className="p-2">Total:</td>
                                                    <td className="p-2 text-center">100</td>
                                                    <td className="p-2 text-center">
                                                        {(totalExcludedAddonAmount - Number(bonus?.value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* T&C Tab */}
                        <div className={activeTab === 'tab_1_2' ? 'block' : 'hidden'} id="tab_1_2">
                            <div className="prose max-w-none p-4">{tnc}</div>
                        </div>

                        {/* Reno Agreement Tab */}
                        <div className={activeTab === 'tab_1_3' ? 'block' : 'hidden'} id="tab_1_3">
                            <div className="prose max-w-none p-4">{renoAgreement}</div>
                        </div>
                    </div>
                </div>
            </div>


            {orderDetail.status === 'released' ?
                <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
                    <button
                        className="btn btn-lg btn-primary rounded-3xl shadow-lg"
                        onClick={handleAgreeOrder}
                        disabled={isButtonDisabled}
                    >
                        Agree Quotation Order
                    </button>
                </div>
                :
                ''
            }

            {/* <div className="fixed bottom-10 right-6">
                <button className="btn btn-outline btn-primary rounded-full" data-scrollto="#footer">
                    <i className="ki-outline ki-black-down">
                    </i>
                </button>
            </div> */}
        </>
    );
}

export default OrderOverview;