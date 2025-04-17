import { Document, Page, PDFViewer, Text, View, Image, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import React, { useEffect, useState } from 'react'
import useFetchOrder from '../../../hook/useFetchOrder';
import { styles } from '../styles/quotationPrintStyle';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

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

const QuotationOrderPDF = ({ orderDetail }) => {
    const [packageCategories, setPackageCategories] = useState<{ category: string; total_price: number; quantity: number }[]>([]);
    const [totalExcludedAddonAmount, setTotalExcludedAddonAmount] = useState<number>(0);

    useEffect(() => {
        if (!orderDetail?.latest_quotation?.packages) return;

        let addonCounter = 0; // To number each add-on uniquely

        const categoryTotals = orderDetail.latest_quotation.packages.reduce((acc, quotationPackage) => {
            let category;
            if (quotationPackage.is_addon === true) {
                addonCounter += 1;
                category = `Add-on Option ${addonCounter} (${quotationPackage.name})`;
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

    const COMPANY_NAME = "RenoXpert Sdn Bhd";
    const COMPANY_REG = "202401032588 (1578437-W)";
    const COMPANY_ADDRESS = "No. 42-46, Ground Floor, Jalan SS 19/1D";
    const COMPANY_CITY_STATE = "Subang Jaya, Selangor, 46500";
    const COMPANY_MOBILE = "03-58789831";
    const COMPANY_EMAIL = "sales@renoxpert.my";
    const COMPANY_LOGO_URL = "/public/app/RenoExpert_logo-01.jpg";

    // Define constants for quotationHeader
    const QUOTATION_TITLE = "Quotation";
    const QUOTATION_NUMBER = orderDetail.order_no;
    const QUOTATION_DATE = orderDetail.status === 'confirmed' ? formatDate(orderDetail.updated_at) : getCurrentDate();


    const ATTN_NAME = orderDetail.user.name;
    const ATTN_ADDRESS = `${orderDetail.user.address.address_1}, ${orderDetail.user.address.address_2}, ${orderDetail.user.address.city}, ${orderDetail.user.address.state}, ${orderDetail.user.address.postcode}`;
    const ATTN_MOBILE = `+${orderDetail.user.country_code} ${orderDetail.user.phone_no}`;
    const ATTN_EMAIL = orderDetail.user.email;

    const RENO_PROPERTY_NAME = orderDetail.property.name;
    const RENO_UNIT_NO = `${orderDetail.block}-${orderDetail.floor}-${orderDetail.unit_no}`
    const RENO_UNIT_TYPE = orderDetail.unit_type || "N/A";
    const RENO_PROPERTY_ADDRESS = [
        orderDetail.property.address,
        orderDetail.property.street,
        orderDetail.property.postcode,
        orderDetail.property.city,
        orderDetail.property.state,
    ].filter(Boolean).join(', ') || "N/A";

    // Calculate totals based on package unitPrice and qty
    const totalItems = orderDetail.latest_quotation.packages.reduce((sum, item) => sum + item.quantity, 0);
    const categoryTotals = orderDetail.latest_quotation.packages.reduce((acc, pkg) => {
        const category = pkg.category;
        const categoryTotal = pkg.total_price * (pkg.quantity || 1);

        if (!acc[category]) {
            acc[category] = { total_price: 0, quantity: 0 };
        }
        acc[category].total_price += categoryTotal;
        acc[category].quantity += pkg.quantity;

        return acc;
    }, {});

    const totalPriceBeforeDiscount = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total_price, 0);
    const totalPrice = orderDetail.latest_quotation?.bonus ? (totalPriceBeforeDiscount - Number(orderDetail.latest_quotation?.bonus?.value)) : totalPriceBeforeDiscount;

    const QuotationPDF = () => (
        <Page size="A4" style={styles.page}>
            {/* Redesigned Company Header */}
            {/* Redesigned Company Header */}
            <View style={styles.companyHeader}>
                <View>
                    <Image src={COMPANY_LOGO_URL} style={styles.companyImage} />
                </View>
                <View style={styles.companyInfo}>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.companyTitle}>{COMPANY_NAME}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.companyReg}>Reg No: {COMPANY_REG}</Text>
                    </View>
                    <Text style={styles.companyDetails}>
                        {COMPANY_ADDRESS}{'\n'}
                        {COMPANY_CITY_STATE}{'\n'}
                        Contact Number: {COMPANY_MOBILE}{'\n'}
                        Email: {COMPANY_EMAIL}
                    </Text>
                </View>
            </View>

            {/* Redesigned Quotation Header */}
            <View style={styles.quotationHeader}>
                <Text style={styles.quotationTitle}>{QUOTATION_TITLE}</Text>
                <View style={styles.quotationDetails}>
                    <Text style={styles.quotationText}>Number: {QUOTATION_NUMBER}</Text>
                    <Text style={styles.quotationText}>Date: {QUOTATION_DATE}</Text>
                </View>
            </View>

            {/* Redesigned Attn Header */}


            <View style={styles.headerRow}>
                <View style={styles.attnHeader}>
                    <View style={styles.attnTitle}>
                        <Text style={styles.attnLabel}>Attn:</Text>
                    </View>
                    <Text style={styles.attnText}>
                        {ATTN_NAME}{'\n'}
                        {ATTN_ADDRESS}{'\n'}
                        {ATTN_MOBILE}{'\n'}
                        {ATTN_EMAIL}
                    </Text>
                </View>
                <View style={styles.attnHeader}>
                    <View style={styles.attnTitle}>
                        <Text style={styles.attnLabel}>Unit to be renovated:</Text>
                    </View>
                    <Text style={styles.attnText}>
                        {RENO_UNIT_NO}{'\n'}
                        {RENO_PROPERTY_NAME}{'\n'}
                        Type {RENO_UNIT_TYPE}{'\n'}
                        {RENO_PROPERTY_ADDRESS}
                    </Text>
                </View>
            </View>

            {/* Quotation Body */}
            <View>
                {/* Package Table */}
                {(() => {
                    let packageCounter = 0;
                    let addonCounter = 0;

                    return orderDetail.latest_quotation.packages.map((pkg, pkgIndex) => {
                        const isAddon = pkg.is_addon;
                        const counter = isAddon ? addonCounter++ : packageCounter++;
                        const isIncluded = pkg.is_addon_included;

                        if (!isAddon || (isAddon && isIncluded)) {
                            return (
                                <View style={styles.packageCard} key={pkgIndex} wrap={false}>
                                    <View style={styles.packageHeader}>
                                        {isAddon ? (
                                            <Text style={styles.packageLabel}>{`ADD-ON OPTION ${counter + 1}:`}</Text>
                                        ) :
                                            ''
                                        }
                                        <Text style={styles.packageTitle}>{pkg.name}</Text>
                                        <Text style={styles.packageDesc}>{pkg.description}</Text>
                                        <View style={styles.quantityBadge}>
                                            {pkg.is_addon && !pkg.is_addon_included ? (
                                                <Text style={styles.quantityBadgeText}>Not Included</Text>
                                            )
                                                :
                                                <Text style={styles.quantityBadgeText}>Quantity: {pkg.quantity || 1}</Text>
                                            }
                                        </View>
                                    </View>
                                    <View style={styles.itemTable}>
                                        <View style={styles.itemHeader}>
                                            <View style={{ flex: 2 }}>
                                                <Text style={styles.itemTh}>S.o.W</Text>
                                            </View>
                                            <View style={{ flex: 6 }}>
                                                <Text style={styles.itemTh}>Description</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemTh}>QTY</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemTh}>UOM</Text>
                                            </View>
                                        </View>
                                        {pkg.products.map((product) => (
                                            (product.pivot.visibility == true && product.pivot.includeInstall == true || product.pivot.includeSupply == true) && (
                                                <View style={styles.itemRow} key={product.id}>
                                                    <View style={{ flex: 2 }}>
                                                        <Text style={styles.itemTd}>
                                                            {(product.pivot.includeSupply && product.pivot.includeInstall) ? 'Supply and Install' :
                                                                (!product.pivot.includeSupply && !product.pivot.includeInstall) ? '-' :
                                                                    (product.pivot.includeSupply && !product.pivot.includeInstall) ? 'Supply Only' :
                                                                        (!product.pivot.includeSupply && product.pivot.includeInstall) ? 'Install Only' : '-'}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 6 }}>
                                                        <Text style={styles.itemTd}>{product.name}</Text>
                                                        <Text style={styles.itemTdSecondary}>{product.description}</Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.itemTd}>{product.pivot.quantity}</Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.itemTd}>{product.uom}</Text>
                                                    </View>
                                                </View>
                                            )))}
                                    </View>
                                </View>
                            );
                        }
                    });
                })()}

                {/* Category Summary Table */}
                <View wrap={false}>
                    <View style={styles.summaryTable}>
                        <View style={styles.summaryHeader}>
                            {/* Placeholder for SVG (not supported in @react-pdf/renderer, using text instead) */}
                            <Text style={styles.summaryTitle}>Summary</Text>
                        </View>
                        {packageCategories.map((category, index: number) => (
                            <View style={styles.summaryRow} key={index}>
                                <Text style={styles.summaryLabel}>Total {category.category}</Text>
                                <Text style={styles.summaryValue}>RM {category.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Bonus Table */}
                {orderDetail.latest_quotation?.bonus &&
                    <View wrap={false}>
                        <View style={styles.bonusTable}>
                            <Text style={styles.bonusTitle}>Bonus:</Text>
                            <View style={styles.bonusList}>
                                {orderDetail.latest_quotation?.bonus?.description.split('\n').map((item, index) => (
                                    <Text style={styles.bonusItem} key={index}>{item}</Text>
                                ))}
                            </View>
                            <Text style={styles.bonusDiscountLabel}>Discount:</Text>
                            <Text style={styles.bonusDiscountValue}>RM {Number(orderDetail.latest_quotation?.bonus?.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </View>
                    </View>
                }

                {/* Total Price Table */}
                <View wrap={false}>
                    <View style={styles.totalTable}>
                        <Text style={styles.totalTitle}>Total Amount:</Text>
                        <Text style={styles.totalValue}>RM {(totalExcludedAddonAmount - Number(orderDetail.latest_quotation?.bonus?.value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        {orderDetail.latest_quotation?.bonus && (
                            <Text style={styles.originalPrice}>
                                Original Price: RM {totalExcludedAddonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
            <Text
                style={styles.pageNumber}
                render={({ pageNumber, totalPages }) => `${pageNumber}`}
                fixed
            />
        </Page >
    );

    const TncPDF = () => (
        <Page size="A4" style={styles.page}>
            <View style={styles.tncContainer}>
                <Text style={styles.tncTitle}>Terms and Conditions</Text>
                <View style={styles.tncList}>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            This quotation is only valid for 7 days. If BeLive receives the Client’s confirmation after 7 days, BeLive reserves the right to make changes to the quotation.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            BeLive reserves the right to decide on the overall design and theme, the selection of furniture, fixtures, and fittings for the Client’s unit including the colour and material of products.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            The pre-booking payment has a grace period of 7 days upon booking payment.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            Any pictures or illustrations shown are for reference purposes only. BeLive will attempt to create a similar concept; however, some items may be seasonal, and BeLive reserves the right to substitute similar products of equivalent quality at our discretion.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            BeLive is allowed to take photos of the renovation and the end product for marketing and promotional purposes.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            BeLive reserves the right to replace the items as quoted with products of equivalent or higher value, of similar functionality, and/or purpose.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            The commencement date for the renovation shall be determined at the sole discretion of BeLive.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            BeLive will make reasonable efforts to meet the specified completion dates. However, unforeseen circumstances may lead to adjustments in the timeline. The Client will be informed of any changes.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            In the event of non-payment or breach of contract by the Client, BeLive reserves the right to suspend work until the issue is resolved. Any additional costs incurred as a result of such suspension will be borne by the Client.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            The bank interest rate for the installment plan may change by the bank(s) without prior notification to the Client.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            For safety and security reasons, access/execution of all works by BeLive staff, suppliers, contractors, and sub-contractors requires the unit to be vacated during the entire duration of renovation work.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            The Client consents to refrain from accessing the unit without prior notification to the BeLive team. Entry should be coordinated with a designated team member if the Client wishes to enter the unit during the renovation period.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            It is advised that the Client refrain from staying in the unit during the renovation period. Occupancy may impact renovation progress and could raise safety concerns.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            The Client acknowledges that the scope of work for this renovation project is fixed, and no changes, alterations, or customizations are permitted once the quotation is signed.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            The quotation includes up to 6 feet of copper piping per air conditioning unit. An additional charge of RM25 per foot will apply for any additional copper piping required.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            This quotation includes the supply and installation of kitchen cabinets up to the length specified. Any additional length will incur extra charges.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            Complimentary items are provided if required for the unit, subject to necessity. These items are non-exchangeable for cash, discounts, or any other value. If deemed unnecessary for the unit, they will not be applicable for redemption.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            Payment verification: Kindly WhatsApp us at +6011-5698 5313 with the bank-in slip or online payment receipt, along with the client’s name, development name, and unit number.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            It shall be the Client’s duty to ensure that all details ascribed in the email are correct and accurate. BeLive shall not be held responsible for any discrepancies.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            Renovations proceed in batches based on a first-come, first-served basis. BeLive is not responsible for delays due to a lack of documents or payment delays.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            The Client assumes all risk for installing a partition. BeLive is not liable for penalties or removal costs requested by authorities.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            The Client is solely responsible for paying the renovation deposit to the management office and for handling all related matters.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            For all goods, products, and materials under the renovation work, BeLive reserves the right to remove any furniture and/or fittings up to the value of the amount owing to BeLive.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            If the Client opts to make payment using a credit card, an additional admin fee of 2% will apply. This charge is not applicable for credit card installment plans, FPX, or bank transfers.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            Any payment made is non-refundable.
                        </Text>
                    </View>
                    <View style={styles.tncItem}>
                        <Text style={styles.tncBullet}>•</Text>
                        <Text style={styles.tncText}>
                            By signing this quotation, the Client acknowledges and agrees to the terms and conditions outlined in the quotation and the attached renovation agreement.
                        </Text>
                    </View>
                </View>
            </View>
            <Text
                style={styles.pageNumber}
                render={({ pageNumber, totalPages }) => `${pageNumber}`}
                fixed
            />
        </Page>
    );

    const RenoAgreementPDF = () => (
        <Page size="A4" style={styles.page}>
            <View style={styles.agreementContainer}>
                {/* Header Section */}
                <View style={styles.agreementHeader}>
                    <Text style={styles.agreementTitle}>Reno Agreement</Text>
                    <Text style={styles.agreementText}>
                        THIS AGREEMENT is made this day of{' '}
                        <Text style={styles.bold}>
                            {orderDetail.status === 'confirmed' ? formatDate(orderDetail.updated_at) : getCurrentDate()}
                        </Text>
                    </Text>
                    <Text style={styles.agreementText}>BETWEEN</Text>
                    <Text style={styles.agreementText}>
                        <Text style={styles.bold}>RENOXPERT SDN. BHD. [Registration No.202401032588 (1578437-W)]</Text> of{' '}
                        <Text style={styles.bold}>42-46, Ground Floor, Jalan SS 19/1d, SS 19, 46500 Subang Jaya, Selangor</Text> (“the Contractor”) of the one part;
                    </Text>
                    <Text style={styles.agreementText}>AND</Text>
                    <Text style={styles.agreementText}>
                        <Text style={styles.bold}>{orderDetail.user ? orderDetail.user.name : '[Owner Name]'} (NRIC No. {orderDetail.user ? orderDetail.user.ic : "[Owner IC]"})</Text> of{' '}
                        <Text style={styles.bold}>{ATTN_ADDRESS || "[Owner Address]"}</Text> ("the Owner") of the other part
                    </Text>
                </View>

                {/* WHEREAS Section */}
                <View style={styles.agreementSection}>
                    <Text style={styles.agreementBold}>WHEREAS:</Text>
                    <Text style={styles.agreementText}>
                        The Contractor desires to provide renovation services to the Owner and the Owner desires to utilize the services of the Contractor for the renovation of the Owner’s property described as{' '}
                        <Text style={styles.bold}>
                            A (1) unit of Service Residence known as {orderDetail.block || '[Block]'}-{orderDetail.floor || '[Floor]'}-{orderDetail.unit_no || '[Unit No]'}, {orderDetail.property?.name || '[Property Name]'}, {orderDetail.property?.address || '[Property Address]'}
                        </Text> (the “Property”) subject to the terms and conditions hereinafter appearing.
                    </Text>
                    <Text style={styles.agreementBold}>NOW THIS AGREEMENT WITNESSETH as follows:-</Text>
                </View>

                {/* Clauses */}
                <View style={styles.agreementSection}>
                    <Text style={styles.agreementClause}>1. CONTRACT SUM</Text>
                    <Text style={styles.agreementText}>
                        1.1 The Owner hereby appoints the Contractor and the Contractor agrees to accept such appointment of making improvements to the Property, to carry out, execute and complete the upgrading and alteration works to the Property which are more particularly described and set out in the <Text style={styles.bold}>Quotation</Text> hereto (“Works”) at an agreed lump sum of <Text style={styles.bold}>Ringgit Malaysia {totalPrice} ONLY</Text> (the “said Contract Sum”) payable by instalments/progressive payment in accordance with the <Text style={styles.bold}>First Schedule</Text> hereof, subject to the Owner’s right of inspection as set forth below.
                    </Text>
                    <Text style={styles.agreementText}>
                        1.2 Any change in the Contract Sum, change in the Works or change in the contract time that to be defined herein must be agreed by all parties herein and set forth in writing signed by the Owner and the Contractor.
                    </Text>

                    <Text style={styles.agreementClause}>2. DURATION</Text>
                    <Text style={styles.agreementText}>
                        2.1 The renovation agreement and renovation Phase 1 shall commence upon the following conditions precedent have been fulfilled:-
                    </Text>
                    <View style={styles.agreementSubSection}>
                        <Text style={styles.agreementText}>(a) the Owner shall make the first Fifty (50%) per cent as stated in the <Text style={styles.bold}>First Schedule</Text> as deposit;</Text>
                        <Text style={styles.agreementText}>(b) defects of the Property shall be duly rectified, repaired and fixed by the Developer’s defects’ teams and workers with the Owner or the Contractor’s approval;</Text>
                        <Text style={styles.agreementText}>(c) the Owner or the Contractor has obtained the working permit granted by the relevant authorities; and</Text>
                        <Text style={styles.agreementText}>(d) the full set of keys and access cards of the Property (if required) have been passed to the Contractor,</Text>
                        <Text style={styles.agreementText}>
                            the commencement date for renovation work shall be after <Text style={styles.bold}>Seven (7) working days</Text> from the date when the <Text style={styles.bold}>clause 2.1(a), (b), (c) and (d)</Text> have been fulfilled following the sequence of <Text style={styles.bold}>clause 2.1(a), (b), (c) and (d)</Text>. Failure to comply with the above-mentioned conditions, the Owner shall unconditionally allow the Contractor to extend the commencement and completion date without any interest.
                        </Text>
                    </View>
                    <Text style={styles.agreementText}>
                        2.2 The renovation Phase 2 shall commence upon the following conditions precedent have been fulfilled:-
                    </Text>
                    <View style={styles.agreementSubSection}>
                        <Text style={styles.agreementText}>(a) the Contractor has completed renovation Phase 1 works; and</Text>
                        <Text style={styles.agreementText}>(b) the Owner has made the second Fifty (50%) per cent as stated in the <Text style={styles.bold}>First Schedule</Text> as deposit;</Text>
                        <Text style={styles.agreementText}>
                            the commencement date for renovation work shall be after <Text style={styles.bold}>Seven (7) working days</Text> from the date when the <Text style={styles.bold}>clause 2.2(a) and (b)</Text> have been fulfilled following the sequence of <Text style={styles.bold}>clause 2.2(a) and (b)</Text>. Failure to comply with the above-mentioned conditions, the Owner shall unconditionally allow the Contractor to extend the commencement and completion date without any interest.
                        </Text>
                    </View>
                    <Text style={styles.agreementText}>
                        2.3 The period for this renovation work shall take <Text style={styles.bold}>{convertToWords(orderDetail.completion_day).toUpperCase()} ({orderDetail.completion_day}) working days</Text> or any approved extension period by all parties (“the said Contract Time”). Time wherever mentioned shall be of the essence of this Agreement.
                    </Text>
                    <Text style={styles.agreementText}>
                        2.4 For the avoidance of doubt, renovation Phase 1 includes wiring, painting, and installation of smart devices while renovation Phase 2 includes the supply and installation of furniture and loose items.
                    </Text>

                    <Text style={styles.agreementClause}>3. FORCE MAJEURE</Text>
                    <Text style={styles.agreementText}>
                        3.1 Notwithstanding <Text style={styles.bold}>Clause 4</Text>, no party shall be held liable in the performance of any obligations under this Agreement resulting from “Force Majeure” which shall include Movement Control Order (“MCO”), Full Movement Control Order (“FMCO”), Extended Movement Control Order (“EMCO”), acts of God, fire, or other catastrophe, storms, curfew, blockade, government restrictions and/or change in government policies, war, strikes or other labour disturbances, acute shortage of building materials, acts of civil or military authorities or any other causes beyond the control of the party thereby affected whether similar or dissimilar from the foregoing <Text style={styles.bold}>PROVIDED ALWAYS THAT</Text> the party claiming to be affected by any event of force majeure shall as soon as practicable give written notice of such claim to the other party with full particulars thereof.
                    </Text>

                    <Text style={styles.agreementClause}>4. CONTRACTOR’S DUTIES, OBLIGATIONS, RIGHTS AND INTERESTS</Text>
                    <Text style={styles.agreementText}>
                        4.1 The Contractor shall be responsible for the purchase and delivery of materials, except in the event that the Owner volunteers for economic considerations. All materials at the Property shall be at the risk of the Contractor during the said Contract Time and if the Owner volunteered for the purchase and delivery of materials, such risk shall be passed to the Owner.
                    </Text>
                    <Text style={styles.agreementText}>
                        4.2 The Works shall be constructed in a good and workmanlike manner in accordance with the description and specification as set out in the Quotation hereto, which description and specification have been duly accepted and approved by the Owner, as the Owner hereby acknowledges via the instant messaging services such as email and/or WhatsApp.
                    </Text>
                    <Text style={styles.agreementText}>
                        4.3 The Contractor will furnish and be fully responsible for all equipment, labour, transportation, construction equipment and machinery, tools, appliances, fuel, power, light, heat and all other facilities and incidentals necessary for the furnishing, performance, testing, start-up, and completion of the Work.
                    </Text>
                    <Text style={styles.agreementText}>
                        4.4 The Contractor will provide competent, suitable personnel to perform services as required and will at all times maintain good discipline and order at the Property.
                    </Text>
                    <Text style={styles.agreementText}>
                        4.5 The Contractor may sub-contract the Works or any part thereof to any subcontractor(s) or party(ies) as is customary in the construction industry provided that the Contractor shall be solely liable to the Owner for any act or default by its subcontractor(s).
                    </Text>
                    <Text style={styles.agreementText}>
                        4.6 The Contractor may update the Owner from time to time on the progress of works by attach the photos of the works done by the Contractor and/or subcontractor(s), the photos and description of works shall form part of this Agreement by way of video or photos to be sent to the Owner by way of WhatsApp or any way the Contractor deems appropriate.
                    </Text>

                    <Text style={styles.agreementClause}>5. NOTICES</Text>
                    <Text style={styles.agreementText}>
                        5.1 Any notice required to be given under this Agreement shall be deemed to be sufficiently served if sent by registered post or ordinary post to the party to whom such notice is being served at its address given herein and such notice shall be deemed to be received in the ordinary course of post <Text style={styles.bold}>three (3) working days</Text> after posting.
                    </Text>
                    <Text style={styles.agreementText}>
                        5.2 Notwithstanding <Text style={styles.bold}>Clause 5.1</Text> above, any notice required to be given under this Agreement shall be deemed to be sufficiently served by way of instant messaging services such as email and/or WhatsApp to the party to whom such notice is being served at its email address and/or WhatsApp number/account given herein and such notice shall be deemed to be received instantly within <Text style={styles.bold}>twenty four (24) hours</Text> after sent out.
                    </Text>

                    <Text style={styles.agreementClause}>6. COSTS</Text>
                    <Text style={styles.agreementText}>
                        6.1 Unless otherwise agreed, all the legal costs, stamp duty of and incidental to this Agreement shall be borne and paid by the Contractor solely.
                    </Text>

                    <Text style={styles.agreementClause}>7. SPECIAL CONDITIONS, SCHEDULES AND APPENDIX</Text>
                    <Text style={styles.agreementText}>
                        7.1 The Special Conditions, Schedules and Appendix hereinafter stipulated shall form an integral part of this Agreement and in the event of any inconsistency or repugnant terms in the aforementioned Agreement, the provisions contained in the Special Conditions shall prevail.
                    </Text>

                    <Text style={styles.agreementClause}>8. GOVERNING LAW</Text>
                    <Text style={styles.agreementText}>
                        8.1 This Agreement shall in all respect, include all matters of construction, validity and performance be governed by, construed and enforced exclusively in accordance with the laws of Malaysia. The parties shall submit to the exclusive jurisdiction of the Malaysian courts.
                    </Text>

                    <Text style={styles.agreementClause}>9. WARRANTY AND DEFECT PERIOD</Text>
                    <Text style={styles.agreementText}>
                        9.1 The Contractor warrants that each Product sold, installed and provided by the Contractor under this Agreement will conform to its Specifications for the Warranty and Defect period (the “said Product Warranty”). In the event if the Products are not conformed to its Specifications due to the Contractor’s fault, the Contractor shall grant Product Warranty and Defect claims to the Owner. The Product Warranty and Defect claims must be in written and serve to The Contractor in pursuant to the Clause 5 of this Agreement.
                    </Text>
                    <Text style={styles.agreementText}>
                        9.2 The Warranty and Defect period varies from <Text style={styles.bold}>Six (6) to Twelve (12) months</Text>, depending on the type of the Products. The Warranty period for each of the Products models are described clearly in the Second Schedule of this Agreement.
                    </Text>
                    <Text style={styles.agreementText}>
                        9.3 The Warranty and Defect period shall start from the date the Contractor installed the products and ceases upon the expiration of the period. The Owner shall furnish to us this agreement together with the sales receipt or original purchase invoice to the Contractor.
                    </Text>
                    <Text style={styles.agreementText}>
                        In addition, this Warranty shall not apply in the following circumstances:-
                    </Text>
                    <View style={styles.agreementSubSection}>
                        <Text style={styles.agreementText}>
                            (a) if any damages, abuse, negligent act or use, misuse, tampering, or wrongful usage including failure or neglect to maintain the correct, proper and normal usage by the Owner, any end-users or third parties;
                        </Text>
                        <Text style={styles.agreementText}>
                            (b) if any damages, defects, malfunctions or non-functioning to or in the Product howsoever arising from, caused by or incidental to any external cause (including accidents, fire, lightning, Act of God, exposure to water or moisture, or caused by or during any or any attempted burglary, theft and/or riot), and any corrosion, rust, staining or any other such like matters; and
                        </Text>
                        <Text style={styles.agreementText}>
                            (c) any damages and defect caused by the Owner, any end-users or third parties.
                        </Text>
                    </View>

                    <Text style={styles.agreementClause}>10. NON-COMPLETION/ FAILURE TO HAND OVER</Text>
                    <Text style={styles.agreementText}>
                        10.1 In the event where the Contractor fails and/or delay in handing over the Property in good, adequate and final conditions as per the terms and conditions mentioned in this Agreement.
                    </Text>
                    <Text style={styles.agreementText}>
                        10.2 In default by the Contractor to hand over the Property in good, adequate and final conditions within the said Contract Time, the Contractor shall be liable to pay penalty at the rate of <Text style={styles.bold}>eight per centum (8%) per annum</Text> on daily basis on the undelivered items stated in the Quotation, with the maximum claim sum not more than the said Contract Sum (the “said Liquidated Damages”).
                    </Text>
                    <Text style={styles.agreementText}>
                        10.3 The Contractor shall not be liable to pay the said Liquidated Damages in pursuant to <Text style={styles.bold}>Clause 10.2</Text> in the event where the <Text style={styles.bold}>Clause 2.1 & 2.2</Text> above is not complied with.
                    </Text>

                    <Text style={styles.agreementClause}>11. NO VARIATION</Text>
                    <Text style={styles.agreementText}>
                        11.1 No variation of this Agreement of whatever nature shall be made or purported to be made by any party or parties nor shall any variation or purported variation be valid or enforceable unless the same is in writing and duly agreed to and executed by the parties concerned.
                    </Text>

                    <Text style={styles.agreementClause}>12. SEVERABILITY</Text>
                    <Text style={styles.agreementText}>
                        12.1 If any provision of this Agreement for any reason shall be declared invalid, void, illegal or otherwise unenforceable, the remaining provisions of this Agreement shall remain in full force and effect. The parties shall amend that provision in such reasonable manner so as to achieve the intention of the parties without illegality or where it is not practicable to do so, that provision shall be severed from this Agreement.
                    </Text>

                    <Text style={styles.agreementClause}>13. BINDING EFFECTS</Text>
                    <Text style={styles.agreementText}>
                        13.1 This Agreement shall be binding on the respective heirs, personal representatives, successors in title and assigns of the parties hereto.
                    </Text>
                </View>

                {/* First Schedule */}
                <View style={styles.agreementSection} wrap={false}>
                    <View style={styles.agreementHeader}>
                        <Text style={[styles.agreementBold, { textDecoration: 'underline' }]}>FIRST SCHEDULE</Text>
                        <Text style={styles.agreementText}>(to be taken read and construed as an essential part of this Agreement)</Text>
                    </View>
                    <Text style={styles.agreementBold}>PROGRESSIVE PAYMENT OF THE CONTRACT SUM</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableHeader}>Description</Text>
                            <Text style={[styles.tableHeader, { textAlign: 'center' }]}>%</Text>
                            <Text style={[styles.tableHeader, { textAlign: 'center' }]}>Amount (RM)</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>Upon Confirmation and before Commencement of Phase 1</Text>
                            <Text style={[styles.tableCell, { textAlign: 'center' }]}>50</Text>
                            <Text style={[styles.tableCell, { textAlign: 'center' }]}>
                                {orderDetail.final_amount > 0
                                    ? `RM ${(
                                        (orderDetail.final_amount -
                                            (orderDetail.latest_quotation?.bonus ? Number(orderDetail.latest_quotation?.bonus?.value) : 0)) / 2
                                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `RM ${((totalExcludedAddonAmount - Number(orderDetail.latest_quotation?.bonus?.value || 0)) / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>Upon Completion of Phase 1 and before Commencement of Phase 2</Text>
                            <Text style={[styles.tableCell, { textAlign: 'center' }]}>50</Text>
                            <Text style={[styles.tableCell, { textAlign: 'center' }]}>
                                {orderDetail.final_amount > 0
                                    ? `RM ${(
                                        (orderDetail.final_amount -
                                            (orderDetail.latest_quotation?.bonus ? Number(orderDetail.latest_quotation?.bonus?.value) : 0)) / 2
                                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `RM ${((totalExcludedAddonAmount - Number(orderDetail.latest_quotation?.bonus?.value || 0)) / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.bold]}>Total:</Text>
                            <Text style={[styles.tableCell, { textAlign: 'center' }, styles.bold]}>100</Text>
                            <Text style={[styles.tableCell, { textAlign: 'center' }, styles.bold]}>
                                {orderDetail.final_amount > 0
                                    ? `RM ${(
                                        orderDetail.final_amount -
                                        (orderDetail.latest_quotation?.bonus ? Number(orderDetail.latest_quotation?.bonus?.value) : 0)
                                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `RM ${(totalExcludedAddonAmount - Number(orderDetail.latest_quotation?.bonus?.value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.agreementText}>
                        In the event of a default by the Owner of the payment hereunder when due, the Owner shall be liable to pay interest at the rate of eight per centum (8%) per annum on the outstanding sum from the date due for payment until the date of actual payment.
                    </Text>
                </View>
            </View>
            <Text
                style={styles.pageNumber}
                render={({ pageNumber, totalPages }) => `${pageNumber}`}
                fixed
            />
        </Page>
    );

    return (
        <>
            <QuotationPDF />
            <TncPDF />
            <RenoAgreementPDF />
        </>
    )
};

// Custom styles to hide PDFViewer toolbar
const viewerStyles = StyleSheet.create({
    viewer: {
        width: '100%',
        height: '100%',
        border: 'none',
        overflow: 'hidden', // Prevent scrolling issues
    },
});

function QuotationOrderPrint() {
    const { id } = useParams<{ id: string }>();
    const orderId = id ? parseInt(id, 10) : null;
    const { orderDetail, loading, error, refetch } = useFetchOrder(orderId);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600" />
        </div>
    );
    if (error) return (
        <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
            <p className="text-red-600 text-lg font-semibold">Error fetching quotation.</p>
        </div>
    );
    if (!orderDetail) return (
        <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
            <p className="text-gray-600 text-lg font-semibold">No quotation found.</p>
        </div>
    );

    const fileName = `QUOTATION_${orderDetail.order_no}.pdf`;

    const pdfDocument = (
        <Document>
            <QuotationOrderPDF orderDetail={orderDetail} />
        </Document>
    );

    return (
        <div className="w-full min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 flex flex-col h-screen">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    {/* Back */}
                    <Link
                        to={'/orders/' + orderDetail.id}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                        <i className="ki-solid ki-arrow-left text-2xl"></i>
                    </Link>

                    <h1 className="text-2xl font-bold text-gray-800">Quotation Preview</h1>
                </div>

                {/* Download Button */}
                <div className="mb-6">
                    <PDFDownloadLink
                        document={pdfDocument}
                        fileName={fileName}
                    >
                        {({ loading }) => (
                            <button
                                className={`w-full sm:w-auto px-6 py-3 rounded-lg text-white font-semibold transition-colors duration-200 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                disabled={loading}
                            >
                                {loading ? 'Generating PDF...' : 'Download PDF'}
                            </button>
                        )}
                    </PDFDownloadLink>
                </div>

                {/* PDF Preview (Always Visible, Fills Remaining Space) */}
                <div className="w-full flex-1 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md">
                    <PDFViewer
                        width="100%"
                        height="100%"
                        style={viewerStyles.viewer}
                        showToolbar={false} // Hides the default toolbar with download button
                    >
                        {pdfDocument}
                    </PDFViewer>
                </div>
            </div>
        </div>
    );
}

export default QuotationOrderPrint