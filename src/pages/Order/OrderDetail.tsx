// src\pages\Order\OrderDetailPage.tsx

import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import useFetchOrder from "../../hook/useFetchOrder";
import { KTAccordion, KTModal, KTTooltip } from "../../metronic/core";
import { OrderQuotation, Package, Product } from "../../types";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ClipboardJS from "clipboard";
import { Slide, toast } from "react-toastify";
import { releaseOrder, reReleaseOrder, updateOrderInternalRemark } from "../../services/api";
import ConfirmOrderModal from "./components/ConfirmOrderModal";
import ReReleaseOrderModal from "./components/ReReleaseOrderModal";

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
    return date.toLocaleDateString('en-GB', options as Intl.DateTimeFormatOptions);
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
    const [packageCategories, setPackageCategories] = useState<{ category: string; total_price: number; cogs: number; quantity: number }[]>([]);
    const [totalExcludedAddonAmount, setTotalExcludedAddonAmount] = useState<number>(0);

    const [activeTab, setActiveTab] = useState('tab_1_1');
    const [isEditingInternalRemark, setIsEditingInternalRemark] = useState(false);
    const [editableInternalRemark, setEditableInternalRemark] = useState('');
    const [agreeTnc, setAgreeTnc] = useState(false);
    const [agreeRenoAgreement, setAgreeRenoAgreement] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({});

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

        let addonCounter = 0; // To number each add-on uniquely

        const packages: Package[] = orderDetail.latest_quotation.packages;

        const categoryTotals = packages.reduce((acc, quotationPackage) => {
            let category;
            if (quotationPackage.is_addon === true) {
                addonCounter += 1;
                category = `Add-on Option ${addonCounter} (${quotationPackage.name})`;
            } else {
                category = quotationPackage.category;
            }

            const categoryData = quotationPackage.products.reduce(
                (data, product) => {
                    // Calculate retail prices (existing logic)
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

                    // Calculate COGS
                    let supplyCogs = 0;
                    if (product.pivot.includeSupply) {
                        supplyCogs = (product.provisioning.supply.cogs * product.pivot.quantity) || 0;
                    }

                    let installCogs = 0;
                    if (product.pivot.includeInstall) {
                        installCogs = (product.provisioning.install.cogs * product.pivot.quantity) || 0;
                    }

                    return {
                        total_price: data.total_price + supplyPrice + installPrice,
                        cogs: data.cogs + supplyCogs + installCogs,
                    };
                },
                { total_price: 0, cogs: 0 }
            );

            const categoryTotalPrice = categoryData.total_price * (quotationPackage.quantity || 1);
            const categoryCogs = categoryData.cogs * (quotationPackage.quantity || 1);

            if (!(quotationPackage.is_addon === true && quotationPackage.is_addon_included === false)) {
                if (!acc[category]) {
                    acc[category] = { total_price: 0, cogs: 0, quantity: 0 };
                }
                acc[category].total_price += categoryTotalPrice;
                acc[category].cogs += categoryCogs;
                acc[category].quantity += quotationPackage.quantity;
            }

            return acc;
        }, {} as Record<string, { total_price: number; cogs: number; quantity: number }>);

        // Calculate filtered total_amount (based on total_price)
        const filteredTotalAmount = Object.values(categoryTotals).reduce((sum, { total_price }) => sum + total_price, 0);

        // Calculate total COGS
        const filteredTotalCogs = Object.values(categoryTotals).reduce((sum, { cogs }) => sum + cogs, 0);

        const categoriesArray = Object.entries(categoryTotals).map(([category, { total_price, cogs, quantity }]) => ({
            category: category.startsWith('Add-on Option')
                ? category
                : categoryOptions.find(option => option.value === category)?.label || category,
            total_price,
            cogs,
            quantity,
        }));

        const sortedCategories = [
            ...categoriesArray.filter(item => !item.category.startsWith('Add-on Option')),
            ...categoriesArray.filter(item => item.category.startsWith('Add-on Option')),
        ];

        setPackageCategories(sortedCategories);

        if (orderDetail.latest_quotation.packages.length > 0) {
            KTAccordion.createInstances();
        }
    }, [orderDetail?.latest_quotation?.packages]);

    useEffect(() => {
        if (orderDetail) {
            const totalAmount = orderDetail.final_amount > 0 ? orderDetail.final_amount : orderDetail.latest_quotation.packages.reduce((total, pkg) => {
                // Skip if package is not an addon or not included
                if (pkg.is_addon === true && pkg.is_addon_included === false) {
                    return total;
                }

                // Use final_amount if available, otherwise use total_price
                return total + (pkg.total_price * (pkg.quantity || 1));
            }, 0);

            setTotalExcludedAddonAmount(totalAmount);
        }
    }, [orderDetail]);

    useEffect(() => {
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
    }, [orderDetail]); // Empty dependency array to run only once on mount

    if (!orderId) return null; // Early return for null orderId


    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/orders');
        }
    };

    const toggleAccordion = (id: string) => {
        setOpenAccordions((prev) => ({
            ...prev,
            [id]: prev[id] == null ? false : !prev[id],
        }));
    };

    const handleAgreeTncChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAgreeTnc(event.target.checked);
    };

    const handleAgreeRenoAgreementChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAgreeRenoAgreement(event.target.checked);
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

    const handleEditInternalRemark = () => {
        setEditableInternalRemark(orderDetail.internal_remark || '');
        setIsEditingInternalRemark(true);
    }

    const handleChangeInternalRemark = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditableInternalRemark(event.target.value);
    }

    const handleSaveInternalRemark = async () => {
        setIsLoading(true);

        try {
            const response = await updateOrderInternalRemark(orderId, editableInternalRemark);

            if (response?.success) {
                setIsEditingInternalRemark(false);
                refetch();
                notify('success', 'Internal remark updated!');
            }

        } catch (error) {
            console.error(error);
            notify('error', 'Error occurred while saving internal remark.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleReReleaseOrder = async () => {

        setIsLoading(true);

        try {
            const response = await reReleaseOrder(orderId);

            if (response?.success) {

                const modalEl = document.querySelector('#re_release_order_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);
                modal.hide();

                notify('success', 'Order re-released successfully!');
                refetch();
            }

        } catch (error) {
            notify('error', 'Failed to re-release order.');
        } finally {
            setIsLoading(false);
        }
    }

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!orderDetail) return <div>Order not found</div>;


    // console.log(orderDetail);
    const selectedQuotation = orderDetail.latest_quotation;
    const selectedPackages = orderDetail.latest_quotation.packages;


    const calculateQuotationMargin = () => {
        // Calculate total retail price
        const totalRetailPrice = orderDetail.final_amount ? orderDetail.final_amount : selectedPackages.reduce((total, pkg) => {
            if (pkg.is_addon === true && pkg.is_addon_included === false) {
                return total;
            }

            const packageRetail = pkg.products.reduce((pkgTotal, product) => {
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

                return pkgTotal + (supplyPrice + installPrice);
            }, 0);
            return total + (packageRetail * (pkg.quantity || 1));
        }, 0);

        const totalDiscountPrice = Number(selectedQuotation.bonus?.value || 0);

        // Calculate total COGS (Cost of Goods Sold)
        const totalCogs = selectedPackages.reduce((total, pkg) => {
            if (pkg.is_addon === true && pkg.is_addon_included === false) {
                return total;
            }

            const packageCogs = pkg.products.reduce((pkgTotal, product) => {
                const supplyCogs = product.pivot.includeSupply
                    ? product.provisioning.supply.cogs * product.pivot.quantity
                    : 0;
                const installCogs = product.pivot.includeInstall
                    ? product.provisioning.install.cogs * product.pivot.quantity
                    : 0;
                return pkgTotal + (supplyCogs + installCogs);
            }, 0);
            return total + (packageCogs * (pkg.quantity || 1));
        }, 0);

        // Calculate margin in amount
        const marginInAmount = totalRetailPrice - totalCogs;

        // Calculate margin in percentage
        const marginInPercentage = totalRetailPrice > 0
            ? (marginInAmount / totalRetailPrice) * 100
            : 0;

        return {
            totalCogs,
            marginInAmount,
            marginInPercentage
        };
    };

    const { totalCogs, marginInAmount, marginInPercentage } = calculateQuotationMargin();

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

    const renoAgreement = (
        <div className='flex flex-col w-full text-sm text-justify'>
            <div className="flex flex-col items-center justify-center gap-6 text-center mb-6">
                <span>THIS AGREEMENT is made this day of <strong>{orderDetail.status === 'confirmed' ? formatDate(orderDetail.confirmed_at) : getCurrentDate()}</strong></span>
                <span>BETWEEN</span>
                <span><strong>RENOXPERT SDN. BHD. [Registration No.202401032588 (1578437-W)]</strong> of <strong>42-46, Ground Floor, Jalan SS 19/1d, SS 19, 46500 Subang Jaya, Selangor</strong> (“the Contractor”) of the one part;</span>
                <span>AND</span>
                <span><strong>{orderDetail.user ? orderDetail.user.name : '[Owner Name]'} (NRIC No. {orderDetail.user ? orderDetail.user.ic : "[Owner IC]"})</strong> of <strong>{address ? address : "[Owner Address]"}</strong> ("the Owner") of the other part</span>
            </div>
            <div className="flex flex-col gap-6 mb-6">
                <span className='font-bold'>WHEREAS:</span>
                <span>The Contractor desires to provide renovation services to the Owner and the Owner desires to utilize the services of the Contractor for the renovation of the Owner’s property described as <strong>A (1) unit of Service Residence known as {orderDetail.block ? orderDetail.block : '[Block]'}-{orderDetail.floor ? orderDetail.floor : '[Floor]'}-{orderDetail.unit_no ? orderDetail.unit_no : '[Unit No]'}, {orderDetail.property ? orderDetail.property.name : '[Property Name]'}, {propertyAddress ? propertyAddress : '[Property Address]'}</strong> (the “Property”) subject to the terms and conditions hereinafter appearing.</span>
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
                                    {orderDetail.final_amount > 0
                                        ? `RM ${(
                                            (orderDetail.final_amount -
                                                (selectedQuotation.bonus ? Number(selectedQuotation.bonus?.value) : 0)) / 2
                                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : `RM ${((totalExcludedAddonAmount - Number(selectedQuotation.bonus?.value || 0)) / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </td>
                            </tr>
                            <tr>
                                <td>Upon Completion of Phase 1 and before Commencement of Phase 2</td>
                                <td className='text-center'>50</td>
                                <td className='text-center'>
                                    {orderDetail.final_amount > 0
                                        ? `RM ${(
                                            (orderDetail.final_amount -
                                                (selectedQuotation.bonus ? Number(selectedQuotation.bonus?.value) : 0)) / 2
                                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : `RM ${((totalExcludedAddonAmount - Number(selectedQuotation.bonus?.value || 0)) / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </td>
                            </tr>
                            <tr className='font-bold'>
                                <td>Total:</td>
                                <td className='text-center'>100</td>
                                <td className='text-center'>
                                    {orderDetail.final_amount > 0
                                        ? `RM ${(
                                            orderDetail.final_amount -
                                            (selectedQuotation.bonus ? Number(selectedQuotation.bonus?.value) : 0)
                                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : `RM ${(totalExcludedAddonAmount - Number(selectedQuotation.bonus?.value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                                    {orderDetail && orderDetail.final_amount > 0
                                        ? `RM ${(
                                            orderDetail.final_amount -
                                            (selectedQuotation.bonus ? Number(selectedQuotation.bonus?.value) : 0)
                                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : orderDetail
                                            ? `RM ${(totalExcludedAddonAmount - Number(selectedQuotation.bonus?.value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : 'RM 0.00'}
                                </td>
                            </tr>
                            <tr className='font-bold'>
                                <td>Total:</td>
                                <td className='text-center'>100</td>
                                <td className='text-center'>
                                    {orderDetail && orderDetail.final_amount > 0
                                        ? `RM ${(
                                            orderDetail.final_amount -
                                            (selectedQuotation.bonus ? Number(selectedQuotation.bonus?.value) : 0)
                                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : orderDetail
                                            ? `RM ${(totalExcludedAddonAmount - Number(selectedQuotation.bonus?.value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : 'RM 0.00'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
                <span>In the event of a default by the Owner of the payment hereunder when due, the Owner shall be liable to pay interest at the rate of eight per centum (8%) per annum on the outstanding sum from the date due for payment until the date of actual payment.</span>
            </div>
        </div>
    );

    const discount = selectedQuotation.bonus ? Number(selectedQuotation.bonus.value) : 0;
    const nettAmount = totalExcludedAddonAmount - discount;
    const nettMargin = nettAmount - totalCogs;
    const nettMarginPercentage = nettAmount > 0 ? (nettMargin / nettAmount) * 100 : 0;

    return (
        <>
            {isLoading && <Loading />}

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
                    {
                        orderDetail?.status === 'voided' &&
                        <button
                            className="btn btn-primary btn-sm"
                            data-modal-toggle="#re_release_order_modal"
                        >
                            Re-release Order
                        </button>
                    }
                    {orderDetail?.status !== 'confirmed' &&
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
                    }

                    <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                        <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                            <i className="ki-filled ki-dots-vertical"></i>
                        </button>

                        <div className="dropdown-content menu menu-default w-full max-w-64 py-2" data-dropdown-dismiss="true">
                            {orderDetail.user &&
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
                            }
                            <div className="menu-item">
                                <Link
                                    to={`/orders/create?dp=${orderId}`}
                                    className="menu-link"
                                    target="_blank"
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
                            <div className="menu-item">
                                <Link
                                    to={`/orders/print/${orderId}`}
                                    className="menu-link"
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-filled ki-file-down text-lg"></i>
                                            <span>Print Quotation</span>
                                        </div>
                                    </span>
                                </Link>
                                <Link
                                    to={`/orders/print/${orderId}/internal`}
                                    className="menu-link"
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-filled ki-file-down text-lg"></i>
                                            <span>Internal Quotation PDF</span>
                                        </div>
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="flex flex-col flex-[2] gap-8">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Owner
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    {orderDetail.user ?
                                        <>
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
                                                    +{orderDetail.user.country_code} {orderDetail.user.phone_no}
                                                </td>
                                            </tr>
                                        </>
                                        :
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            N/A
                                        </td>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
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
                                            {`RM ${totalExcludedAddonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    {orderDetail.final_amount &&
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                Final Amount:
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                RM {(orderDetail.final_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    }
                                    {selectedQuotation.bonus &&
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                Discount Amount:
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                - RM {Number(selectedQuotation.bonus.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    }
                                    {orderDetail.final_amount ?
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 flex items-center gap-1">
                                                <i data-tooltip="#final_pricing_tooltip" className="ki-filled ki-information-2 textlg text-warning mt-[1.5px]"></i>
                                                <span>Nett Amount:</span>
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                <span className="text-sm text-gray-900 pb-3">
                                                    RM {(orderDetail.final_amount - (selectedQuotation.bonus ? Number(selectedQuotation.bonus?.value) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                        </tr>
                                        :
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                Nett Amount:
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                <span className="text-sm text-gray-900 pb-3">
                                                    RM {(totalExcludedAddonAmount - (selectedQuotation.bonus ? Number(selectedQuotation.bonus?.value) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>

                                            </td>
                                        </tr>
                                    }
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <span className={`badge badge-sm p-2 cursor-default capitalize
                                                ${orderDetail.status === 'released' ? 'badge-primary' : ''} 
                                                ${orderDetail.status === 'confirmed' ? 'badge-success' : ''} 
                                                ${orderDetail.status === 'revoked' || orderDetail.status === 'voided' ? 'badge-danger' : ''} 
                                                ${orderDetail.status === 'draft' ? 'badge-warning' : ''} 
                                                badge-outline`}
                                            >
                                                {orderDetail.status === 'confirmed' ? 'sale' : orderDetail.status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Version:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.latest_quotation.version ?
                                                String.fromCharCode(64 + orderDetail.latest_quotation.version)
                                                : "N/A"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Quotation Released Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.released_at ? formatDate(orderDetail.released_at) : 'N/A'}
                                        </td>
                                    </tr>
                                    {orderDetail.status === 'confirmed' &&
                                        <tr>
                                            <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                Quotation Agreed Date:
                                            </td>
                                            <td className="text-sm text-gray-900 pb-3">
                                                {formatDate(orderDetail.confirmed_at)}
                                            </td>
                                        </tr>
                                    }
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

                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Internal Remark
                            </h3>
                            <div className="flex">
                                {isEditingInternalRemark === false &&
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleEditInternalRemark}
                                    >
                                        Edit
                                    </button>
                                }
                            </div>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            {isEditingInternalRemark ?
                                <div className="flex flex-col gap-4">
                                    <textarea
                                        className="textarea textarea-bordered w-full h-32"
                                        value={editableInternalRemark || ''}
                                        onChange={(e) => handleChangeInternalRemark(e)}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setIsEditingInternalRemark(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={handleSaveInternalRemark}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                                :
                                orderDetail.internal_remark ?
                                    <span className="text-gray-900">{orderDetail.internal_remark}</span>
                                    :
                                    <span className="text-gray-600">N/A</span>
                            }
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
                                                    RM {Number(selectedQuotation.bonus.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                Property
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    {orderDetail.property ?
                                        <>

                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-24">
                                                    Property Name:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.property ? orderDetail.property.name : 'N/A'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-12">
                                                    Unit:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-12">
                                                    Unit Type:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.unit_type ? orderDetail.unit_type : "-"}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-12">
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
                                                    Total Single Bedroom:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.single_bedroom_count}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Total Queen Bedroom:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.queen_bedroom_count}
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
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                    Partition:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {orderDetail.include_partition ? 'Yes' : 'No'}
                                                </td>
                                            </tr>
                                        </>
                                        :
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            N/A
                                        </td>
                                    }
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
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Payment Schedule:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {orderDetail.is_progressive_payment ? 'Progressive Payment' : 'Full Payment'}
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
                                                <span className="text-xs text-gray-500">
                                                    Updated At:
                                                    <span className="font-semibold ml-1">{orderQuotation.updated_at}</span>
                                                </span>
                                                <span className="text-xs text-gray-700">
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
                </div>

                <div className='flex flex-col flex-[6] gap-4'>
                    <div className="flex gap-4">
                        <div className="card w-full">
                            <div className="card-header flex justify-between items-center">
                                <h3 className="card-title">Summary Pricing</h3>
                            </div>
                            <div className="card-group pt-3.5 pb-3.5">
                                <table className="table-auto w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-sm text-gray-600 pb-3 text-left">Category</th>
                                            <th className="text-sm text-gray-600 pb-3 text-right">Total Price</th>
                                            <th className="text-sm text-gray-600 pb-3 text-right">COGS</th>
                                            <th className="text-sm text-gray-600 pb-3 text-right">Nett Margin</th>
                                            <th className="text-sm text-gray-600 pb-3 text-right">Margin %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packageCategories.map((category, index) => {
                                            const categoryMargin = category.total_price - category.cogs;
                                            const categoryMarginPercentage =
                                                category.total_price > 0 ? (categoryMargin / category.total_price) * 100 : 0;

                                            return (
                                                <tr key={index}>
                                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">{category.category}</td>
                                                    <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                        RM {category.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                        RM {category.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                        RM {categoryMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                        {categoryMarginPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Totals Row */}
                                        <tr className="border-t">
                                            <td className="text-sm text-gray-600 font-bold pt-3 pe-4 lg:pe-8">Total</td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {totalExcludedAddonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {marginInAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                {marginInPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                            </td>
                                        </tr>
                                        {/* Bonus/Discount Row (if applicable) */}
                                        {selectedQuotation.bonus && (
                                            <tr>
                                                <td className="text-sm text-gray-600 pt-3 whitespace-nowrap">Bonus/Discount</td>
                                                <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">
                                                    - RM {Number(selectedQuotation.bonus.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">-</td>
                                                <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">
                                                    - RM {Number(selectedQuotation.bonus.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">
                                                    - {(marginInPercentage - nettMarginPercentage).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                </td>
                                            </tr>
                                        )}
                                        {/* Nett Amount Row */}
                                        <tr>
                                            <td className="text-sm text-gray-600 font-bold pt-3 pe-4 lg:pe-8">Nett Amount</td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {nettAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {(totalCogs).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {nettMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                {nettMarginPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {selectedQuotation && (
                        <div className="card">
                            <div className="card-body">
                                <div className="text-base font-semibold text-gray-900 mb-2">
                                    Packages:
                                </div>
                                <div className="flex flex-col gap-5" data-accordion="true">
                                    {(() => {
                                        let packageCounter = 0;
                                        let addonCounter = 0;

                                        return selectedPackages.map((prodPackage: Package) => {
                                            const isAddon = prodPackage.is_addon;
                                            const counter = isAddon ? addonCounter++ : packageCounter++;
                                            const label = isAddon ? `ADD-ON OPTIONAL ${counter + 1}: \n${prodPackage.name}` : prodPackage.name;

                                            // Calculate totals for each column
                                            const totals = prodPackage.products.reduce(
                                                (acc, product) => {
                                                    if (!product.pivot.included) return acc;
                                                    const supplyRRP = product.pivot.includeSupply
                                                        ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                        : 0;
                                                    const installRRP = product.pivot.includeInstall
                                                        ? product.provisioning.install.retail_price * product.pivot.quantity
                                                        : 0;
                                                    const supplyCOGS = product.pivot.includeSupply
                                                        ? product.provisioning.supply.cogs * product.pivot.quantity
                                                        : 0;
                                                    const installCOGS = product.pivot.includeInstall
                                                        ? product.provisioning.install.cogs * product.pivot.quantity
                                                        : 0;

                                                    return {
                                                        supplyRRP: acc.supplyRRP + supplyRRP,
                                                        installRRP: acc.installRRP + installRRP,
                                                        totalRRP: acc.totalRRP + supplyRRP + installRRP,
                                                        supplyCOGS: acc.supplyCOGS + supplyCOGS,
                                                        installCOGS: acc.installCOGS + installCOGS,
                                                        totalCOGS: acc.totalCOGS + supplyCOGS + installCOGS,
                                                    };
                                                },
                                                {
                                                    supplyRRP: 0,
                                                    installRRP: 0,
                                                    totalRRP: 0,
                                                    supplyCOGS: 0,
                                                    installCOGS: 0,
                                                    totalCOGS: 0,
                                                }
                                            );

                                            // Calculate Margin % and Margin Amount
                                            const marginPercent =
                                                totals.totalRRP !== 0
                                                    ? (((totals.totalRRP - totals.totalCOGS) / totals.totalRRP) * 100).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }) + "%"
                                                    : totals.totalCOGS > 0
                                                        ? "-100.00%"
                                                        : "0.00%";
                                            const marginAmount = (totals.totalRRP - totals.totalCOGS).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            });

                                            return (
                                                <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                                    <div
                                                        className="accordion-item active border rounded-xl w-full"
                                                        data-accordion-item="true"
                                                        id={"package_item_" + prodPackage.id.toString()}
                                                    >
                                                        <button
                                                            className="accordion-toggle flex justify-between p-4"
                                                            data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}
                                                        >
                                                            <div className="flex flex-col items-start">
                                                                <span className="text-base text-gray-900 font-medium text-start">{label}</span>
                                                                <span className="text-sm text-gray-600 text-start">{prodPackage.description}</span>
                                                                <span className="text-base text-gray-700">
                                                                    RM{" "}
                                                                    {(prodPackage.total_price * (prodPackage.quantity ? prodPackage.quantity : 1)).toLocaleString(
                                                                        undefined,
                                                                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                                                    )}
                                                                </span>
                                                                {prodPackage.category && (
                                                                    <div className="badge text-sm">
                                                                        {categoryOptions.find((option) => option.value === prodPackage.category)?.label}
                                                                    </div>
                                                                )}
                                                                <span className="text-sm text-gray-600 font-medium text-start">
                                                                    {prodPackage.description_internal && (
                                                                        <div className="flex items-center gap-2">
                                                                            <i className="ki-filled ki-information-2 text-warning text-xl"></i>
                                                                            {prodPackage.description_internal}
                                                                        </div>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-8">
                                                                {prodPackage.is_addon && (
                                                                    <span className="text-gray-700 font-semibold py-2 px-4 bg-slate-200 rounded-md whitespace-nowrap">
                                                                        {`Add-on Included: ${prodPackage.is_addon_included ? "Yes" : "No"}`}
                                                                    </span>
                                                                )}
                                                                <span className="text-gray-600 font-semibold py-2 px-4 bg-gray-200 rounded-md whitespace-nowrap">
                                                                    Quantity: {prodPackage.quantity ? prodPackage.quantity : 1}
                                                                </span>
                                                                <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                                <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                            </div>
                                                        </button>
                                                        <div
                                                            className="accordion-content active border-t"
                                                            id={"package_content_" + prodPackage.id.toString()}
                                                        >
                                                            <div className="product-list flex flex-col">
                                                                <table className="table align-middle text-gray-700 text-sm">
                                                                    <thead>
                                                                        <tr>
                                                                            <th className="w-[10px] text-center">Supply</th>
                                                                            <th className="w-[10px] text-center">Install</th>
                                                                            <th className="w-[10px] text-center"></th>
                                                                            <th className="w-[450px]">Product</th>
                                                                            <th className="w-[100px] text-center">Quantity</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Supply RRP</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Install RRP</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Total RRP</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Supply COGS</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Install COGS</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Total COGS</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Margin %</th>
                                                                            <th className="w-[100px] whitespace-nowrap">Margin Amount</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {prodPackage.products.map((product) => (
                                                                            <tr
                                                                                key={product.id}
                                                                                className={`${!product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                    ? "light:bg-orange-50 dark:bg-orange-950"
                                                                                    : ""
                                                                                    }`}
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
                                                                                <td className="text-center">
                                                                                    {!product.pivot.visibility && <i className="ki-solid ki-eye-slash text-2xl"></i>}
                                                                                </td>
                                                                                <td>
                                                                                    <div className="flex flex-col">
                                                                                        <span>{product.name}</span>
                                                                                        <span className="text-xs text-gray-500">
                                                                                            {(!product.description || product.description === "")
                                                                                                ? ""
                                                                                                : [
                                                                                                    product.pivot.includeSupply && "Supply",
                                                                                                    product.pivot.includeInstall && "Install",
                                                                                                ]
                                                                                                    .filter(Boolean)
                                                                                                    .join(" and ") + (product.description ? " " + product.description : "")}
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="text-center text-lg">
                                                                                    <span className="mx-2 text-base">
                                                                                        {product.pivot.included
                                                                                            ? !product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                                ? 0
                                                                                                : product.pivot.quantity
                                                                                            : "0"}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                                                    {product.pivot.includeSupply &&
                                                                                        `RM ${product.provisioning.supply.retail_price.toLocaleString(undefined, {
                                                                                            minimumFractionDigits: 2,
                                                                                            maximumFractionDigits: 2,
                                                                                        })}`}
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                                                    {product.pivot.includeInstall &&
                                                                                        `RM ${product.provisioning.install.retail_price.toLocaleString(undefined, {
                                                                                            minimumFractionDigits: 2,
                                                                                            maximumFractionDigits: 2,
                                                                                        })}`}
                                                                                </td>
                                                                                <td className="whitespace-nowrap font-semibold text-success">
                                                                                    {!product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                        ? null
                                                                                        : `RM ${(
                                                                                            (product.pivot.includeSupply
                                                                                                ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                                                                : 0) +
                                                                                            (product.pivot.includeInstall
                                                                                                ? product.provisioning.install.retail_price * product.pivot.quantity
                                                                                                : 0)
                                                                                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                                                    {product.pivot.includeSupply &&
                                                                                        `RM ${product.provisioning.supply.cogs.toLocaleString(undefined, {
                                                                                            minimumFractionDigits: 2,
                                                                                            maximumFractionDigits: 2,
                                                                                        })}`}
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                                                    {product.pivot.includeInstall &&
                                                                                        `RM ${product.provisioning.install.cogs.toLocaleString(undefined, {
                                                                                            minimumFractionDigits: 2,
                                                                                            maximumFractionDigits: 2,
                                                                                        })}`}
                                                                                </td>
                                                                                <td className="whitespace-nowrap font-semibold text-danger">
                                                                                    {!product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                        ? null
                                                                                        : `RM ${(
                                                                                            (product.pivot.includeSupply
                                                                                                ? product.provisioning.supply.cogs * product.pivot.quantity
                                                                                                : 0) +
                                                                                            (product.pivot.includeInstall
                                                                                                ? product.provisioning.install.cogs * product.pivot.quantity
                                                                                                : 0)
                                                                                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </td>
                                                                                <td className="whitespace-nowrap font-semibold">
                                                                                    {product.pivot.included
                                                                                        ? (() => {
                                                                                            const totalRRP =
                                                                                                (product.pivot.includeSupply
                                                                                                    ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                                                                    : 0) +
                                                                                                (product.pivot.includeInstall
                                                                                                    ? product.provisioning.install.retail_price * product.pivot.quantity
                                                                                                    : 0);
                                                                                            const totalCOGS =
                                                                                                (product.pivot.includeSupply
                                                                                                    ? product.provisioning.supply.cogs * product.pivot.quantity
                                                                                                    : 0) +
                                                                                                (product.pivot.includeInstall
                                                                                                    ? product.provisioning.install.cogs * product.pivot.quantity
                                                                                                    : 0);
                                                                                            return product.pivot.includeSupply || product.pivot.includeInstall
                                                                                                ? totalRRP !== 0
                                                                                                    ? `${(((totalRRP - totalCOGS) / totalRRP) * 100).toLocaleString(undefined, {
                                                                                                        minimumFractionDigits: 2,
                                                                                                        maximumFractionDigits: 2,
                                                                                                    })}%`
                                                                                                    : totalCOGS > 0
                                                                                                        ? "-100.00%"
                                                                                                        : "0.00%"
                                                                                                : "";
                                                                                        })()
                                                                                        : ""}
                                                                                </td>
                                                                                <td className="whitespace-nowrap font-semibold">
                                                                                    {product.pivot.included
                                                                                        ? (() => {
                                                                                            const totalRRP =
                                                                                                (product.pivot.includeSupply
                                                                                                    ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                                                                    : 0) +
                                                                                                (product.pivot.includeInstall
                                                                                                    ? product.provisioning.install.retail_price * product.pivot.quantity
                                                                                                    : 0);
                                                                                            const totalCOGS =
                                                                                                (product.pivot.includeSupply
                                                                                                    ? product.provisioning.supply.cogs * product.pivot.quantity
                                                                                                    : 0) +
                                                                                                (product.pivot.includeInstall
                                                                                                    ? product.provisioning.install.cogs * product.pivot.quantity
                                                                                                    : 0);
                                                                                            const marginAmount = totalRRP - totalCOGS;
                                                                                            return product.pivot.includeSupply || product.pivot.includeInstall
                                                                                                ? `RM ${marginAmount.toLocaleString(undefined, {
                                                                                                    minimumFractionDigits: 2,
                                                                                                    maximumFractionDigits: 2,
                                                                                                })}`
                                                                                                : "";
                                                                                        })()
                                                                                        : ""}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                    <tfoot>
                                                                        <tr className="bg-gray-500">
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td className="text-center py-3">
                                                                                <span className="text-lg font-bold">
                                                                                    Total
                                                                                </span>
                                                                            </td> {/* Added padding for better spacing */}
                                                                            <td className="whitespace-nowrap text-gray-600">
                                                                                <span className="text-sm">
                                                                                    {totals.supplyRRP >= 0 &&
                                                                                        `RM ${totals.supplyRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-gray-600">
                                                                                <span className="text-sm">
                                                                                    {totals.installRRP >= 0 &&
                                                                                        `RM ${totals.installRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-success font-extrabold highlight-total"> {/* Added font-extrabold for emphasis */}
                                                                                <span className="text-sm font-bold text-success">
                                                                                    {totals.totalRRP >= 0 &&
                                                                                        `RM ${totals.totalRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-gray-600">
                                                                                <span className="text-sm">
                                                                                    {totals.supplyCOGS >= 0 &&
                                                                                        `RM ${totals.supplyCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-gray-600">
                                                                                <span className="text-sm">
                                                                                    {totals.installCOGS >= 0 &&
                                                                                        `RM ${totals.installCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-danger font-extrabold highlight-total-cogs"> {/* Added font-extrabold for emphasis */}
                                                                                <span className="text-sm font-bold text-danger">
                                                                                    {totals.totalCOGS >= 0 &&
                                                                                        `RM ${totals.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-gray-600">
                                                                                <span className="text-sm font-bold">
                                                                                    {marginPercent}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-gray-600">
                                                                                <span className="text-sm font-bold">
                                                                                    {`RM ${marginAmount}`}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    </tfoot>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="modal p-4" data-modal="true" data-modal-backdrop-static="true" id="preview_order_modal">
                <div className="modal-content modal-overlay max-w-[420px]">
                    <div className="modal-header">
                        <div className="modal-title text-md">
                            {orderDetail.status === 'confirmed' ? (
                                <span>Quotation Order Overview (Preview)</span>
                            ) : (
                                <span>Quotation Order Agreement (Preview)</span>
                            )}
                        </div>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body overflow-y-auto scrollable-y flex flex-col">
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
                            <button
                                className={`tab ${activeTab === 'tab_1_3' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tab_1_3')}
                            >
                                Reno Agreement
                            </button>
                        </div>
                        <div className={activeTab === 'tab_1_1' ? 'block' : 'hidden'} id="tab_1_1">
                            <div className="overflow-x-auto">
                                {/* Progress Bar */}
                                {orderDetail.status === 'confirmed' && (
                                    <div className="flex flex-col mb-6">
                                        <div className="flex flex-col justify-between items-center mb-2">
                                            <span className="text-md text-gray-900 font-semibold">
                                                {(100 - orderDetail.sale.remaining_percentage * 100).toFixed(2)}%
                                                Invoice Issued
                                            </span>
                                            <div className="badge badge-success badge-outline text-sm mt-2 sm:mt-0">
                                                {(orderDetail.sale.invoices.reduce(
                                                    (sum, invoice) =>
                                                        invoice.status === 'paid' ? sum + invoice.percentage : sum,
                                                    0
                                                ) * 100).toFixed(2)}
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
                                                        (sum, invoice) =>
                                                            invoice.status === 'paid' ? sum + invoice.percentage : sum,
                                                        0
                                                    ) * 100
                                                        }%`,
                                                }}
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <span className="badge badge-outline bg-blue-50 border-blue-200 text-blue-300 flex items-center gap-1">
                                                <span className="badge badge-dot size-1.5 bg-blue-300"></span>{' '}
                                                Issued
                                            </span>
                                            <span className="badge badge-outline badge-success flex items-center gap-1">
                                                <span className="badge badge-dot size-1.5 bg-green-500"></span>{' '}
                                                Paid
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-4 mb-6">
                                    {/* Quotation Detail */}
                                    <div className="card flex-1 bg-white shadow-sm rounded-lg">
                                        <div className="card-header p-4 flex justify-between items-center">
                                            <h2 className="card-title text-md font-semibold">
                                                Quotation Order Detail
                                            </h2>
                                            <span
                                                className={`badge badge-sm p-2 capitalize badge-outline ${orderDetail.status === 'confirmed'
                                                    ? 'badge-success'
                                                    : orderDetail.status === 'revoked'
                                                        ? 'badge-danger'
                                                        : ''
                                                    }`}
                                            >
                                                {orderDetail.status === 'confirmed'
                                                    ? 'Sale'
                                                    : orderDetail.status}
                                            </span>
                                        </div>
                                        <div className="card-body p-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-2xs text-gray-600">QUO Number:</span>
                                                    <p className="text-xs text-gray-900 font-semibold">
                                                        {orderDetail.order_no}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-2xs text-gray-600">Date Created:</span>
                                                    <p className="text-xs text-gray-900 font-semibold">
                                                        {formatDate(orderDetail.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 mt-2">
                                                <div>
                                                    <span className="text-sm text-gray-600">Total Amount:</span>
                                                    <p className="text-md text-gray-900 font-bold">
                                                        RM{' '}
                                                        {(
                                                            (orderDetail.final_amount > 0
                                                                ? orderDetail.final_amount
                                                                : totalExcludedAddonAmount) -
                                                            (Number(selectedQuotation.bonus?.value) || 0)
                                                        ).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            {orderDetail.status === 'confirmed' && (
                                                <>
                                                    {!orderDetail.f_1 && (
                                                        <div className="mt-4 p-4 bg-gray-50 border-l-4 border-purple-500 rounded-lg">
                                                            <h3 className="text-md text-purple-600 font-bold flex items-center gap-2">
                                                                Summary
                                                            </h3>
                                                            <div className="mt-2 space-y-2">
                                                                {packageCategories.map((category, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className="flex justify-between p-2 bg-white rounded shadow-sm"
                                                                    >
                                                                        <span className="text-xs text-gray-600">
                                                                            Total {category.category}
                                                                        </span>
                                                                        <span className="text-xs text-gray-700 font-semibold whitespace-nowrap">
                                                                            RM{' '}
                                                                            {category.total_price.toLocaleString(undefined, {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedQuotation.bonus && (
                                                        <div className="mt-4 p-4 bg-gray-100 border-l-4 border-teal-500 rounded-lg">
                                                            <h3 className="text-md text-teal-600 font-bold">Bonus:</h3>
                                                            <ul className="text-xs text-gray-900 font-semibold mt-2 space-y-1">
                                                                {(selectedQuotation.bonus.description?.split('\n') || [
                                                                    'No Details',
                                                                ]).map((item, index) => (
                                                                    <li
                                                                        key={index}
                                                                        className="p-2 bg-teal-50 rounded"
                                                                    >
                                                                        {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            <div className="mt-2">
                                                                <span className="text-xs text-gray-600 font-semibold">
                                                                    Discount:
                                                                </span>
                                                                <p className="text-md text-teal-600 font-bold">
                                                                    RM{' '}
                                                                    {Number(selectedQuotation.bonus.value).toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="mt-4 p-4 bg-gray-100 border-l-4 border-blue-500 rounded-lg">
                                                        <h3 className="text-md text-blue-600 font-bold">
                                                            Total Amount:
                                                        </h3>
                                                        <p className="text-md text-gray-900 font-semibold">
                                                            RM{' '}
                                                            {(
                                                                (orderDetail.final_amount > 0
                                                                    ? orderDetail.final_amount
                                                                    : totalExcludedAddonAmount) -
                                                                (Number(selectedQuotation.bonus?.value) || 0)
                                                            ).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </p>
                                                        {selectedQuotation.bonus && (
                                                            <p className="text-xs text-gray-900">
                                                                Original Price: RM{' '}
                                                                {totalExcludedAddonAmount.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Property */}
                                    <div className="accordion-item flex-1 border rounded-xl shadow-sm">
                                        <button
                                            className="flex items-center justify-between gap-4 w-full text-2xs p-4 rounded-xl md:cursor-default md:hover:bg-transparent transition duration-200 focus:outline-none"
                                            onClick={() => toggleAccordion('property')}
                                        >
                                            <h2 className="text-md font-semibold">Property</h2>
                                            <i
                                                className={`ki-outline ${openAccordions['property'] !== false ? 'ki-down' : 'ki-right'
                                                    } text-gray-600 text-xs transition-transform duration-300`}
                                            ></i>
                                        </button>
                                        <div
                                            className={`border-t overflow-hidden transition-all duration-300 ease-in-out ${openAccordions['property'] !== false ? 'max-h-screen' : 'max-h-0'
                                                }`}
                                        >
                                            <div className="p-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {[
                                                        { label: 'Name', value: orderDetail.property ? orderDetail.property.name : 'N/A' },
                                                        {
                                                            label: 'Unit',
                                                            value: `${orderDetail.block}-${orderDetail.floor}-${orderDetail.unit_no}`,
                                                        },
                                                        { label: 'Unit Type', value: orderDetail.unit_type || '-' },
                                                        {
                                                            label: 'Partition',
                                                            value: orderDetail.include_partition ? 'Yes' : 'No',
                                                        },
                                                    ].map(({ label, value }) => (
                                                        <div key={label}>
                                                            <span className="text-xs text-gray-600">{label}:</span>
                                                            <p className="text-xs text-gray-900 font-semibold">
                                                                {value}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-4">
                                                    <span className="text-xs text-gray-600">Address:</span>
                                                    <p className="text-xs text-gray-900">
                                                        {orderDetail.property && [
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
                                </div>

                                <hr className="my-4" />

                                {/* Payment Invoices */}
                                {orderDetail.status === 'confirmed' && (
                                    <div className="mb-6">
                                        <h2 className="text-md text-gray-900 font-semibold mb-4">
                                            Payment Invoices
                                        </h2>
                                        {orderDetail.sale.invoices.length === 0 ? (
                                            <div className="flex flex-col items-center">
                                                <img
                                                    alt="No invoices"
                                                    className="max-h-[160px] mb-4"
                                                    src={`/public/media/illustrations/3${document.documentElement.classList.contains('dark')
                                                        ? '-dark'
                                                        : ''
                                                        }.svg`}
                                                />
                                                <h3 className="text-md font-semibold text-gray-900">
                                                    No Payment Invoices Available
                                                </h3>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {orderDetail.sale.invoices.map((invoice, index) => (
                                                    <Link
                                                        to={`/invoice/${invoice.id}/view`}
                                                        key={index}
                                                        className="card bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="card-body p-4 flex flex-col">
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <div className="relative size-12 shrink-0">
                                                                    <svg
                                                                        className="w-full h-full stroke-blue-500 fill-blue-100"
                                                                        viewBox="0 0 44 48"
                                                                    >
                                                                        <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" />
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-xs text-gray-900 font-medium">
                                                                        {invoice.invoice_no}
                                                                    </h3>
                                                                    <span
                                                                        className={`badge badge-outline ${invoice.status === 'paid'
                                                                            ? 'badge-success'
                                                                            : invoice.status === 'overdue'
                                                                                ? 'badge-danger'
                                                                                : ''
                                                                            }`}
                                                                    >
                                                                        {invoice.status.charAt(0).toUpperCase() +
                                                                            invoice.status.slice(1)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2">
                                                                <span className="text-2xs text-gray-600">Amount:</span>
                                                                <p className="text-xs text-gray-900 font-medium">
                                                                    RM{' '}
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
                                                                        ? new Date(invoice.due_date).toLocaleDateString(
                                                                            'en-GB',
                                                                            { day: 'numeric', month: 'long', year: 'numeric' }
                                                                        )
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

                                {/* Packages and Summary */}
                                {orderDetail.status !== 'confirmed' && (
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
                                                <h2 className="text-lg text-blue-600 font-bold tracking-tight">
                                                    Packages
                                                </h2>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            {orderDetail
                                                ? (() => {
                                                    let packageCounter = 0;
                                                    let addonCounter = 0;
                                                    return orderDetail.latest_quotation.packages.map(
                                                        (prodPackage, index) => {
                                                            const isAddon = prodPackage.is_addon;
                                                            const counter = isAddon ? addonCounter++ : packageCounter++;
                                                            const accordionId = `content_${index}`;
                                                            const isOpen = openAccordions[accordionId] !== false;

                                                            return (
                                                                <div
                                                                    className={`accordion-item border rounded-xl w-full shadow-sm ${isAddon ? 'bg-blue-50 border-blue-300' : ''
                                                                        }`}
                                                                    key={index}
                                                                >
                                                                    <button
                                                                        className="flex items-center justify-between gap-4 w-full text-2xs p-4 rounded-xl hover:bg-gray-50 transition duration-200 focus:outline-none"
                                                                        onClick={() => toggleAccordion(`content_${index}`)}
                                                                    >
                                                                        <div className="flex items-center flex-grow text-left w-full">
                                                                            <div className="flex flex-col w-full">
                                                                                {prodPackage.is_addon ? (
                                                                                    <>
                                                                                        <div className="flex justify-between">
                                                                                            <span className="font-medium text-gray-700 text-2xs">
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
                                                                                <span className="text-xs text-gray-500 mt-1 max-w-md">
                                                                                    {prodPackage.description}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center space-x-4">
                                                                            {prodPackage.is_addon ? (
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
                                                                                        <span
                                                                                            className={`badge ${isAddon ? 'bg-white border-blue-300' : ''
                                                                                                }`}
                                                                                        >
                                                                                            x{prodPackage.quantity}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="inline-block">
                                                                                    <span className="badge bg-white border-blue-300">
                                                                                        x{prodPackage.quantity}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            <i
                                                                                className={`ki-outline ${isOpen ? 'ki-down' : 'ki-right'
                                                                                    } text-gray-600 text-xs transition-transform duration-300`}
                                                                            ></i>
                                                                        </div>
                                                                    </button>
                                                                    <div
                                                                        className={`border-t overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[9999px]' : 'max-h-0'
                                                                            }`}
                                                                    >
                                                                        <div className="p-4">
                                                                            <h2 className="text-xs font-semibold text-gray-800 mb-3">
                                                                                Products
                                                                            </h2>
                                                                            <table className="w-full text-xs text-left border-collapse">
                                                                                <thead>
                                                                                    <tr
                                                                                        className={`border-b ${isAddon
                                                                                            ? 'bg-white border-blue-300'
                                                                                            : 'bg-gray-100'
                                                                                            }`}
                                                                                    >
                                                                                        <th className="p-3 font-medium text-gray-700">
                                                                                            S.o.W
                                                                                        </th>
                                                                                        <th className="p-3 font-medium text-gray-700">
                                                                                            Product
                                                                                        </th>
                                                                                        <th className="p-3 font-medium text-gray-700">
                                                                                            Quantity
                                                                                        </th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {prodPackage.products.map((product, idx) => {
                                                                                        const isSupplyAndInstall =
                                                                                            product.pivot.includeSupply ||
                                                                                            product.pivot.includeInstall;

                                                                                        const isVisible = product.pivot.visibility;

                                                                                        if (isSupplyAndInstall && isVisible) {
                                                                                            return (
                                                                                                <tr
                                                                                                    key={idx}
                                                                                                    className={`border-b hover:bg-gray-100 transition duration-150 ${isAddon ? ' border-blue-300' : ''
                                                                                                        }`}
                                                                                                >
                                                                                                    <td className="py-3 px-2 text-gray-700 text-left">
                                                                                                        {product.pivot.includeSupply &&
                                                                                                            product.pivot.includeInstall
                                                                                                            ? 'Supply & Install'
                                                                                                            : product.pivot.includeSupply
                                                                                                                ? 'Supply'
                                                                                                                : 'Install'}
                                                                                                    </td>
                                                                                                    <td className="p-3">
                                                                                                        <div className="flex flex-col">
                                                                                                            <span className="font-medium text-gray-900">
                                                                                                                {product.name}
                                                                                                            </span>
                                                                                                            <span className="text-2xs text-gray-600 mt-1">
                                                                                                                {product.description || '-'}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="p-3 text-gray-700">
                                                                                                        {product.pivot.quantity} {product.uom}
                                                                                                        {product.pivot.quantity > 1 ? 's' : ''}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            );
                                                                                        }
                                                                                        return null;
                                                                                    })}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    );
                                                })()
                                                : null}

                                            <hr className="my-4" />

                                            {!orderDetail.f_1 && (
                                                <div className="p-4 bg-gray-50 border-l-4 border-purple-500 rounded-lg">
                                                    <h3 className="text-md text-purple-600 font-bold flex items-center gap-2">
                                                        Summary
                                                    </h3>
                                                    <div className="mt-2 space-y-2">
                                                        {packageCategories.map((category, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex justify-between p-2 bg-white rounded shadow-sm"
                                                            >
                                                                <span className="text-xs text-gray-600">
                                                                    Total {category.category}
                                                                </span>
                                                                <span className="text-xs text-gray-700 font-semibold whitespace-nowrap">
                                                                    RM{' '}
                                                                    {category.total_price.toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedQuotation.bonus && (
                                                <div className="mt-4 p-4 bg-gray-100 border-l-4 border-teal-500 rounded-lg">
                                                    <h3 className="text-md text-teal-600 font-bold">Bonus:</h3>
                                                    <ul className="text-xs text-gray-900 font-semibold mt-2 space-y-1">
                                                        {(selectedQuotation.bonus.description?.split('\n') || [
                                                            'No Details',
                                                        ]).map((item, index) => (
                                                            <li
                                                                key={index}
                                                                className="p-2 bg-teal-50 rounded"
                                                            >
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <div className="mt-2">
                                                        <span className="text-xs text-gray-600 font-semibold">
                                                            Discount:
                                                        </span>
                                                        <p className="text-md text-teal-600 font-bold">
                                                            RM{' '}
                                                            {Number(selectedQuotation.bonus.value).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mt-4 p-4 bg-gray-100 border-l-4 border-blue-500 rounded-lg">
                                                <h3 className="text-md text-blue-600 font-bold">Total Amount:</h3>
                                                <p className="text-md text-gray-900 font-semibold">
                                                    RM{' '}
                                                    {(
                                                        (orderDetail.final_amount > 0
                                                            ? orderDetail.final_amount
                                                            : totalExcludedAddonAmount) -
                                                        (Number(selectedQuotation.bonus?.value) || 0)
                                                    ).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </p>
                                                {selectedQuotation.bonus && (
                                                    <p className="text-xs text-gray-900">
                                                        Original Price: RM{' '}
                                                        {totalExcludedAddonAmount.toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-6 p-4 bg-gray-100 border-l-4 border-indigo-500 rounded-lg">
                                                <h3 className="text-md text-indigo-600 font-bold mb-3 flex items-center gap-2">
                                                    Progressive Payment of the Contract Sum
                                                </h3>
                                                <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
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
                                                                        desc: 'Upon Confirmation and before Commencement of Phase 1',
                                                                        percent: 50,
                                                                    },
                                                                    {
                                                                        desc: 'Upon Completion of Phase 1 and before Commencement of Phase 2',
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
                                                                            {(
                                                                                (totalExcludedAddonAmount -
                                                                                    (Number(selectedQuotation.bonus?.value) || 0)) /
                                                                                2
                                                                            ).toLocaleString(undefined, {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            })}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr className="border-b border-gray-200 hover:bg-gray-50 transition duration-150">
                                                                    <td className="p-3 text-gray-600 max-w-xs">Upon Confirmation of Agreement</td>
                                                                    <td className="p-3 text-center">100%</td>
                                                                    <td className="p-3 text-center">
                                                                        {(
                                                                            totalExcludedAddonAmount -
                                                                            (Number(selectedQuotation.bonus?.value) || 0)
                                                                        ).toLocaleString(undefined, {
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
                                                                    {(
                                                                        totalExcludedAddonAmount -
                                                                        (Number(selectedQuotation.bonus?.value) || 0)
                                                                    ).toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Checkboxes */}
                                {orderDetail.status !== 'confirmed' && (
                                    <div className="flex flex-col gap-4 mt-6">
                                        {[
                                            {
                                                name: 'agree_tnc',
                                                label: 'Terms and Conditions',
                                                checked: agreeTnc,
                                                onChange: handleAgreeTncChange,
                                                tab: 'tab_1_2',
                                            },
                                            {
                                                name: 'agree_reno_agreement',
                                                label: 'Reno Agreement',
                                                checked: agreeRenoAgreement,
                                                onChange: handleAgreeRenoAgreementChange,
                                                tab: 'tab_1_3',
                                            },
                                        ].map(({ name, label, checked, onChange, tab }) => (
                                            <label key={name} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox"
                                                    name={name}
                                                    checked={checked || orderDetail.status === 'confirmed'}
                                                    onChange={onChange}
                                                    disabled={orderDetail.status === 'confirmed'}
                                                />
                                                <span className="text-xs">
                                                    I have read and accept the{' '}
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
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={activeTab === 'tab_1_4' ? 'block' : 'hidden'} id="tab_1_4">
                            {orderDetail.status === 'confirmed' ? (
                                <div className="flex flex-col gap-4">
                                    {orderDetail.latest_quotation.packages.map((quotationPackage, index) => {
                                        const isAddon = quotationPackage.is_addon;
                                        const counter = isAddon ? index + 1 : index + 1; // Simplified counter logic
                                        const accordionId = `content_${index}`;
                                        const isOpen = openAccordions[accordionId] !== false;

                                        return (
                                            <div
                                                className={`accordion-item border rounded-xl w-full shadow-sm ${isAddon ? 'bg-blue-50 border-blue-300' : ''
                                                    }`}
                                                key={index}
                                            >
                                                <button
                                                    className="flex items-center justify-between gap-4 w-full text-2xs p-4 rounded-xl hover:bg-gray-50 transition duration-200 focus:outline-none"
                                                    onClick={() => toggleAccordion(`content_${index}`)}
                                                >
                                                    <div className="flex items-center flex-grow text-left w-full">
                                                        <div className="flex flex-col w-full">
                                                            {quotationPackage.is_addon ? (
                                                                <>
                                                                    <div className="flex justify-between">
                                                                        <span className="font-medium text-gray-700 text-2xs">
                                                                            Add-on Option {counter + 1}:
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-gray-900">
                                                                        {quotationPackage.name}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm font-semibold text-gray-900">
                                                                        {quotationPackage.name}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <span className="text-xs text-gray-500 mt-1 max-w-md">
                                                                {quotationPackage.description}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        {quotationPackage.is_addon ? (
                                                            <div className="flex flex-col gap-2">
                                                                <label className="switch switch-lg">
                                                                    <input
                                                                        className="checkbox"
                                                                        type="checkbox"
                                                                        checked={!!quotationPackage.is_addon_included}
                                                                        readOnly
                                                                    />
                                                                </label>
                                                                <div className="inline-block">
                                                                    <span
                                                                        className={`badge ${isAddon ? 'bg-white border-blue-300' : ''
                                                                            }`}
                                                                    >
                                                                        x{quotationPackage.quantity}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-block">
                                                                <span className="badge bg-white border-blue-300">
                                                                    x{quotationPackage.quantity}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <i
                                                            className={`ki-outline ${isOpen ? 'ki-down' : 'ki-right'
                                                                } text-gray-600 text-xs transition-transform duration-300`}
                                                        ></i>
                                                    </div>
                                                </button>
                                                <div
                                                    className={`border-t overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[9999px]' : 'max-h-0'
                                                        }`}
                                                >
                                                    <div className="p-4">
                                                        <h2 className="text-xs font-semibold text-gray-800 mb-3">
                                                            Products
                                                        </h2>
                                                        <table className="w-full text-xs text-left border-collapse">
                                                            <thead>
                                                                <tr
                                                                    className={`border-b ${isAddon ? 'bg-white border-blue-300' : 'bg-gray-100'
                                                                        }`}
                                                                >
                                                                    <th className="p-3 font-medium text-gray-700">S.o.W</th>
                                                                    <th className="p-3 font-medium text-gray-700">Product</th>
                                                                    <th className="p-3 font-medium text-gray-700">
                                                                        Quantity
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {quotationPackage.products.map((product, idx) => {
                                                                    const isSupplyAndInstall =
                                                                        product.pivot.includeSupply || product.pivot.includeInstall;

                                                                    if (isSupplyAndInstall) {
                                                                        return (
                                                                            <tr
                                                                                key={idx}
                                                                                className={`border-b hover:bg-gray-100 transition duration-150 ${isAddon ? ' border-blue-300' : ''
                                                                                    }`}
                                                                            >
                                                                                <td className="py-3 px-2 text-gray-700 text-left">
                                                                                    {product.pivot.includeSupply &&
                                                                                        product.pivot.includeInstall
                                                                                        ? 'Supply & Install'
                                                                                        : product.pivot.includeSupply
                                                                                            ? 'Supply'
                                                                                            : 'Install'}
                                                                                </td>
                                                                                <td className="p-3">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-medium text-gray-900">
                                                                                            {product.name}
                                                                                        </span>
                                                                                        <span className="text-2xs text-gray-600 mt-1">
                                                                                            {product.description || '-'}
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="p-3 text-gray-700">
                                                                                    {product.pivot.quantity} {product.uom}
                                                                                    {product.pivot.quantity > 1 ? 's' : ''}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-md mb-2">
                                            Progressive Payment of the Contract Sum
                                        </span>
                                        <div className="overflow-x-auto w-full max-w-lg">
                                            <table className="table w-full text-xs text-gray-700 font-medium">
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
                                                                <td className="p-2">
                                                                    Upon Confirmation and before Commencement of Phase 1
                                                                </td>
                                                                <td className="p-2 text-center">50</td>
                                                                <td className="p-2 text-center">
                                                                    {orderDetail.final_amount > 0
                                                                        ? (
                                                                            (orderDetail.final_amount -
                                                                                (selectedQuotation.bonus
                                                                                    ? Number(selectedQuotation.bonus?.value)
                                                                                    : 0)) /
                                                                            2
                                                                        ).toLocaleString(undefined, {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        })
                                                                        : (
                                                                            (totalExcludedAddonAmount -
                                                                                Number(selectedQuotation.bonus?.value || 0)) /
                                                                            2
                                                                        ).toLocaleString(undefined, {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        })}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="p-2">
                                                                    Upon Completion of Phase 1 and before Commencement of Phase 2
                                                                </td>
                                                                <td className="p-2 text-center">50</td>
                                                                <td className="p-2 text-center">
                                                                    {orderDetail.final_amount > 0
                                                                        ? (
                                                                            (orderDetail.final_amount -
                                                                                (selectedQuotation.bonus
                                                                                    ? Number(selectedQuotation.bonus?.value)
                                                                                    : 0)) /
                                                                            2
                                                                        ).toLocaleString(undefined, {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        })
                                                                        : (
                                                                            (totalExcludedAddonAmount -
                                                                                Number(selectedQuotation.bonus?.value || 0)) /
                                                                            2
                                                                        ).toLocaleString(undefined, {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        })}
                                                                </td>
                                                            </tr>
                                                        </>
                                                    ) : (
                                                        <tr>
                                                            <td className="p-2">Upon Confirmation of Agreement</td>
                                                            <td className="p-2 text-center">100</td>
                                                            <td className="p-2 text-center">
                                                                {orderDetail.final_amount > 0
                                                                    ? (
                                                                        orderDetail.final_amount -
                                                                        (selectedQuotation.bonus
                                                                            ? Number(selectedQuotation.bonus?.value)
                                                                            : 0)
                                                                    ).toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })
                                                                    : (
                                                                        totalExcludedAddonAmount -
                                                                        Number(selectedQuotation.bonus?.value || 0)
                                                                    ).toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr className="font-bold">
                                                        <td className="p-2">Total:</td>
                                                        <td className="p-2 text-center">100</td>
                                                        <td className="p-2 text-center">
                                                            {orderDetail.final_amount > 0
                                                                ? (
                                                                    orderDetail.final_amount -
                                                                    (selectedQuotation.bonus
                                                                        ? Number(selectedQuotation.bonus?.value)
                                                                        : 0)
                                                                ).toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })
                                                                : (
                                                                    totalExcludedAddonAmount -
                                                                    Number(selectedQuotation.bonus?.value || 0)
                                                                ).toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <div className={activeTab === 'tab_1_2' ? 'block' : 'hidden'} id="tab_1_2">
                            <div className="prose max-w-none p-4 text-xs">{tnc}</div>
                        </div>
                        <div className={activeTab === 'tab_1_3' ? 'block' : 'hidden'} id="tab_1_3">
                            <div className="prose max-w-none p-4 text-xs">{renoAgreement}</div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmOrderModal
                order={{ id: orderDetail.id, name: orderDetail.order_no }}
                onSubmit={refetch}
            />

            <ReReleaseOrderModal
                handleConfirm={handleReReleaseOrder}
            />

            <div className="tooltip" id="final_pricing_tooltip">
                This is the price that will be display to the owner
            </div>
        </>
    )
}

export default OrderDetail;