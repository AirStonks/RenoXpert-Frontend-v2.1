import { Document, Page, PDFViewer, Text, View, Image, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import React, { useEffect, useState } from 'react'
import useFetchOrder from '../../../hook/useFetchOrder';
import { styles } from '../styles/quotationPrintStyle';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Order, Package } from '../../../types';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/'
        : '/';

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

const QuotationOrderPDF = ({ orderDetail }: { orderDetail: Order }) => {
    const [packageCategories, setPackageCategories] = useState<
        { category: string; total_price: number; cogs: number; quantity: number }[]
    >([])
    const [totalExcludedAddonAmount, setTotalExcludedAddonAmount] = useState<number>(0);


    const selectedQuotation = orderDetail.latest_quotation

    useEffect(() => {
        if (!orderDetail?.latest_quotation?.packages) return;

        let addonCounter = 0

        const packages: Package[] = orderDetail.latest_quotation.packages

        const categoryTotals = packages.reduce((acc, pkg) => {
            if (pkg.is_addon === true && pkg.is_addon_included === false) {
                return acc;
            }

            let category;
            if (pkg.is_addon === true) {
                addonCounter += 1;
                category = `Add-on Option ${addonCounter} (${pkg.name})`;
            } else {
                category = pkg.category || 'others';
            }

            const categoryData = pkg.products?.reduce(
                (data, product) => {
                    let supplyPrice = 0;
                    let installPrice = 0;
                    let supplyCogs = 0;
                    let installCogs = 0;

                    if (product.provisioning?.supply) {
                        if (product.pivot?.includeSupply) {
                            supplyPrice = (product.provisioning.supply.retail_price || 0) * (product.pivot.quantity || 1);
                            supplyCogs = (product.provisioning.supply.cogs || 0) * (product.pivot.quantity || 1);
                        } else {
                            supplyPrice = Math.max(0,
                                (product.provisioning.supply.retail_price || 0) -
                                (product.provisioning.supply.excluded_price || 0)
                            ) * (product.pivot?.quantity || 1);
                        }
                    }

                    if (product.provisioning?.install) {
                        if (product.pivot?.includeInstall) {
                            installPrice = (product.provisioning.install.retail_price || 0) * (product.pivot?.quantity || 1);
                            installCogs = (product.provisioning.install.cogs || 0) * (product.pivot?.quantity || 1);
                        } else {
                            installPrice = Math.max(0,
                                (product.provisioning.install.retail_price || 0) -
                                (product.provisioning.install.excluded_price || 0)
                            ) * (product.pivot?.quantity || 1);
                        }
                    }

                    return {
                        total_price: data.total_price + supplyPrice + installPrice,
                        cogs: data.cogs + supplyCogs + installCogs,
                    };
                },
                { total_price: 0, cogs: 0 }
            ) || { total_price: pkg.total_price || 0, cogs: 0 };

            const categoryTotalPrice = (orderDetail.is_be_powered || orderDetail.is_rnpl) ? (pkg.markup_amount * (pkg.quantity || 1)) : (categoryData.total_price * (pkg.quantity || 1));
            const categoryCogs = categoryData.cogs * (pkg.quantity || 1);

            if (!acc[category]) {
                acc[category] = { total_price: 0, cogs: 0, quantity: 0 };
            }
            acc[category].total_price += categoryTotalPrice;
            acc[category].cogs += categoryCogs;
            acc[category].quantity += pkg.quantity || 1;

            return acc;
        }, {} as Record<string, { total_price: number; cogs: number; quantity: number }>);

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

        setPackageCategories(sortedCategories)
    }, [orderDetail?.latest_quotation?.packages]);

    useEffect(() => {
        if (orderDetail) {
            const totalRetailPrice = orderDetail.final_amount ? orderDetail.final_amount : orderDetail.latest_quotation.packages.reduce((total, pkg) => {
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

            setTotalExcludedAddonAmount(totalRetailPrice);
        }
    }, [orderDetail]);

    const calculateSummaryTotals = (totalAmount: number) => {
        const totalCogs = packageCategories.reduce((sum, cat) => sum + cat.cogs, 0);
        const marginInAmount = totalAmount - totalCogs;
        const marginInPercentage = totalAmount > 0 ? (marginInAmount / totalAmount) * 100 : 0;

        const discount = selectedQuotation.bonus ? Number(selectedQuotation.bonus.value) : 0
        const nettAmount = totalAmount - discount;
        const nettMargin = nettAmount - totalCogs;
        const nettMarginPercentage = nettAmount > 0 ? (nettMargin / nettAmount) * 100 : 0;

        return {
            totalCogs,
            marginInAmount,
            marginInPercentage,
            discount,
            nettAmount,
            nettMargin,
            nettMarginPercentage,
        };
    };


    const calculatedTotalAmount = packageCategories.reduce((sum, cat) => sum + cat.total_price, 0);
    const summaryTotals = calculateSummaryTotals(calculatedTotalAmount);

    const COMPANY_NAME = "RenoXpert Sdn Bhd";
    const COMPANY_REG = "202401032588 (1578437-W)";
    const COMPANY_ADDRESS = "No. 42-46, Ground Floor, Jalan SS 19/1D";
    const COMPANY_CITY_STATE = "Subang Jaya, Selangor, 46500";
    const COMPANY_MOBILE = "03-58789831";
    const COMPANY_EMAIL = "sales@renoxpert.my";
    const COMPANY_LOGO_URL = MEDIA_URL + "app/RenoExpert_logo-01.jpg";

    // Define constants for quotationHeader
    const QUOTATION_TITLE = "Quotation";
    const QUOTATION_NUMBER = orderDetail.order_no;
    const QUOTATION_DATE = orderDetail.status === 'confirmed' ? formatDate(orderDetail.updated_at) : getCurrentDate();


    const ATTN_NAME = orderDetail.user ? orderDetail.user.name : "N/A";
    const ATTN_ADDRESS = orderDetail.user ? `${orderDetail.user.address.address_1}, ${orderDetail.user.address.address_2}, ${orderDetail.user.address.city}, ${orderDetail.user.address.state}, ${orderDetail.user.address.postcode}` : "N/A";
    const ATTN_MOBILE = orderDetail.user ? `+${orderDetail.user.country_code} ${orderDetail.user.phone_no}` : "N/A";
    const ATTN_EMAIL = orderDetail.user ? orderDetail.user.email : "N/A";

    const RENO_PROPERTY_NAME = orderDetail.property ? orderDetail.property.name : "N/A";
    const RENO_UNIT_NO = orderDetail.property ? `${orderDetail.block}-${orderDetail.floor}-${orderDetail.unit_no}` : "N/A";
    const RENO_UNIT_TYPE = orderDetail.unit_type || "N/A";
    const RENO_PROPERTY_ADDRESS = orderDetail.property ? [
        orderDetail.property.address,
        orderDetail.property.street,
        orderDetail.property.postcode,
        orderDetail.property.city,
        orderDetail.property.state,
    ].filter(Boolean).join(', ') || "N/A" : "N/A";

    // Calculate totals based on package unitPrice and qty
    const totalItems = orderDetail.latest_quotation.packages.reduce((sum, item) => sum + item.quantity, 0);
    const categoryTotals = orderDetail.latest_quotation.packages.reduce(
        (acc: Record<string, { total_price: number; quantity: number }>, pkg) => {
            const category = pkg.category ?? 'Others'; // Fallback to 'Others' if category is undefined
            const categoryTotal = (pkg.total_price ?? 0) * (pkg.quantity ?? 1);

            if (!acc[category]) {
                acc[category] = { total_price: 0, quantity: 0 };
            }
            acc[category].total_price += categoryTotal;
            acc[category].quantity += pkg.quantity ?? 0;

            return acc;
        },
        {}
    );


    const totalPriceBeforeDiscount = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total_price, 0);
    const totalPrice = orderDetail.latest_quotation?.bonus ? (totalPriceBeforeDiscount - Number(orderDetail.latest_quotation?.bonus?.value)) : totalPriceBeforeDiscount;

    const selectedPackages = orderDetail.latest_quotation.packages

    const nettAmount = totalExcludedAddonAmount - Number(orderDetail.latest_quotation?.bonus?.value || 0)
    const upfrontAmount = selectedPackages.reduce((acc, pkg) => acc + (
        orderDetail.is_be_powered &&
            pkg.payment_method === "one-off" &&
            (pkg.is_addon ? pkg.is_addon_included === true : true)
            ? (pkg.markup_amount ? pkg.markup_amount : pkg.total_price) * (pkg.quantity || 1)
            : 0)
        , orderDetail.be_powered_base_price || 0);


    const monthlySum = selectedPackages.reduce((acc, pkg) => acc + (
        orderDetail.is_be_powered &&
            pkg.payment_method !== 'one-off' &&
            (pkg.is_addon ? pkg.is_addon_included === true : true)
            ? pkg.monthly_amount * (pkg.quantity || 1)
            : 0)
        , 0);

    const totalRenoNowPrice = selectedPackages.reduce((total, pkg) => {
        if (pkg.rnpl_method === 'reno-now' && (pkg.is_addon === true && pkg.is_addon_included === true)) {
            return total + (pkg.markup_amount * (pkg.quantity || 1))
        }
        return total
    }, 0) + (orderDetail.rnpl_base_price || 0);

    const selectedProgram = orderDetail.is_be_powered ? "bePowered" : orderDetail.is_rnpl ? "rnpl" : "normal";

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
                                            (product.pivot.visibility == true && (product.pivot.includeInstall == true || product.pivot.includeSupply == true)) && (
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

                {/* Amount Breakdown Section */}
                <View wrap={false} style={styles.summaryPricingSection}>
                    {/* Category Totals */}
                    <View style={{ marginBottom: 8 }}>
                        {packageCategories.map((category, index: number) => (
                            <View style={[styles.summaryPricingRow, { borderBottomWidth: 0, paddingVertical: 2 }]} key={index}>
                                <View style={{ flex: 3 }}>
                                    <Text style={[additionalStyles.summaryCell, { fontSize: 7 }]}>Total {category.category}</Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontSize: 7 }]}>
                                        RM {category.total_price.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Discount/Bonus Section */}
                    {Number(orderDetail?.latest_quotation?.bonus?.value) > 0 && (
                        <View style={{ marginBottom: 8 }}>
                            <Text style={[additionalStyles.summaryCell, { fontWeight: "bold", color: "#14b8a6", marginBottom: 4 }]}>Discount:</Text>
                            <View style={{ marginBottom: 4 }}>
                                {((orderDetail?.latest_quotation?.bonus?.description || "").split("\n") || ["No Details"]).map((item: string, index: number) => (
                                    <Text style={[additionalStyles.summaryCell, { fontSize: 6, color: "#4b5563", marginBottom: 2 }]} key={index}>
                                        {item}
                                    </Text>
                                ))}
                            </View>
                            <View style={styles.summaryPricingRow}>
                                <View style={{ flex: 3 }}>
                                    <Text style={[additionalStyles.summaryCell, { fontSize: 7, fontWeight: "bold" }]}>Total Discount:</Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontSize: 8, fontWeight: "bold", color: "#14b8a6" }]}>
                                        RM {(Number(orderDetail?.latest_quotation?.bonus?.value) || 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Divider */}
                    <View style={{ borderTopWidth: 1, borderTopColor: "#e5e7eb", marginVertical: 6 }} />

                    {/* Total Quotation Amount */}
                    <View style={styles.summaryPricingRow}>
                        <View style={{ flex: 3 }}>
                            <Text style={[additionalStyles.summaryCell, { fontWeight: "bold", fontSize: 8 }]}>Total Quotation Amount:</Text>
                        </View>
                        <View style={{ flex: 2 }}>
                            <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold", fontSize: 8 }]}>
                                RM {totalExcludedAddonAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2
                                })}
                            </Text>
                        </View>
                    </View>

                    {/* Payment Terms */}
                    <View style={{ marginTop: 6 }}>
                        <View style={styles.summaryPricingRow}>
                            <View style={{ flex: 3 }}>
                                <Text style={[additionalStyles.summaryCell, { fontWeight: "bold", fontSize: 8 }]}>Payment Terms:</Text>
                            </View>
                            <View style={{ flex: 2 }}>
                                <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold", fontSize: 8 }]}>
                                    {selectedProgram === "bePowered" ? "Reno Subscription" : selectedProgram === "rnpl" ? "RenoNow PayLater" : "Full Payment"}
                                </Text>
                            </View>
                        </View>
                        <View style={{ marginTop: 2 }}>
                            <Text style={[additionalStyles.summaryCell, { fontSize: 6, fontStyle: "italic", color: "#6b7280" }]}>
                                (Terms & Conditions)
                            </Text>
                        </View>
                    </View>

                    {/* Initial Down Payment */}
                    {(!orderDetail.is_progressive_payment && !orderDetail.is_be_powered && !orderDetail.is_rnpl) ? null : (
                        <View style={{ marginTop: 6 }}>
                            <View style={styles.summaryPricingRow}>
                                <View style={{ flex: 3 }}>
                                    <Text style={[additionalStyles.summaryCell, { fontWeight: "bold", fontSize: 8 }]}>Initial Down Payment:</Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold", fontSize: 8 }]}>
                                        {selectedProgram === 'bePowered' && (
                                            <>RM {(upfrontAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2
                                            })}</>
                                        )}
                                        {selectedProgram === 'rnpl' && (
                                            <>RM {totalRenoNowPrice.toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2
                                            })}</>
                                        )}
                                        {selectedProgram !== 'rnpl' && selectedProgram !== 'bePowered' && (
                                            <>RM {(totalExcludedAddonAmount / 2).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2
                                            })}</>
                                        )}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Balance Payment */}
                    {(!orderDetail.is_progressive_payment && !orderDetail.is_be_powered && !orderDetail.is_rnpl) ? null : (
                        <View style={{ marginTop: 6 }}>
                            <View style={styles.summaryPricingRow}>
                                <View style={{ flex: 3 }}>
                                    <Text style={[additionalStyles.summaryCell, { fontWeight: "bold", fontSize: 8 }]}>Balance Payment:</Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold", fontSize: 8 }]}>
                                        {selectedProgram === 'bePowered' && (
                                            orderDetail.installment_method === 'fixed' ? (
                                                <>RM {orderDetail.installment_amount.toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2
                                                })}/mth</>
                                            ) : (
                                                <>RM {(totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0) - upfrontAmount).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2
                                                })}</>
                                            )
                                        )}
                                        {selectedProgram === 'rnpl' && (
                                            <>RM {(totalExcludedAddonAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0) - totalRenoNowPrice).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2
                                            })}</>
                                        )}
                                        {selectedProgram !== 'rnpl' && selectedProgram !== 'bePowered' && (
                                            <>RM {(totalExcludedAddonAmount / 2).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2
                                            })}</>
                                        )}
                                    </Text>
                                </View>
                            </View>
                            {selectedProgram === 'bePowered' && (
                                <View style={{ marginTop: 2, alignItems: "flex-end" }}>
                                    <Text style={[additionalStyles.summaryCell, { fontSize: 6, fontStyle: "italic", color: "#6b7280" }]}>
                                        Pay in 60 mths
                                    </Text>
                                </View>
                            )}
                            {selectedProgram === 'rnpl' && (
                                <View style={{ marginTop: 2, alignItems: "flex-end" }}>
                                    <Text style={[additionalStyles.summaryCell, { fontSize: 6, fontStyle: "italic", color: "#6b7280" }]}>
                                        Pay through RPM
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

            </View>
            <Text
                style={styles.pageNumber}
                render={({ pageNumber }) => `${pageNumber}`}
                fixed
            />


            {/* <Text
                style={styles.watermark}
                fixed
            >
                SAMPLE ONLY
            </Text> */}
        </Page >
    );

    const TncPDF = () => (
        <Page size="A4" style={styles.page}>
            <View style={styles.tncContainer} wrap>
                <Text style={styles.tncTitle}>Terms & Conditions – Owner Collaboration Quotation</Text>
                
                <View style={{ marginBottom: 8 }}>
                    <Text style={styles.tncText}>
                        These Terms & Conditions ("T&C") form an integral part of the official quotation issued by <Text style={{ fontWeight: 'bold' }}>BeLive Ventures Sdn. Bhd.</Text> ("Company") to the Owner and, where applicable, shall be read together with the <Text style={{ fontWeight: 'bold' }}>Owner Collaboration Agreement ("OCA")</Text> executed or intended to be executed between the parties.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 8 }}>
                    <Text style={styles.tncText}>
                        This quotation and its accompanying T&C shall constitute a <Text style={{ fontWeight: 'bold' }}>legally binding agreement</Text> between the Owner and Company upon the Owner's acceptance, signature, or payment of any sum stated herein, <Text style={{ fontWeight: 'bold' }}>irrespective of whether the OCA has been executed</Text>.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                    <Text style={styles.tncText}>
                        In the event of any inconsistency, ambiguity, or conflict between these T&C and the provisions of the OCA, <Text style={{ fontWeight: 'bold' }}>the terms contained in the OCA shall prevail</Text>. However, where both documents impose obligations on the Owner or Company, <Text style={{ fontWeight: 'bold' }}>the stricter or more specific obligation shall take precedence</Text> to ensure consistency with the intent, purpose, and performance standards of the collaboration.
                    </Text>
                </View>

                <Text style={[styles.tncTitle, { fontSize: 10, marginTop: 12, marginBottom: 6 }]}>1. Engagement and Quotation Validity</Text>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        1.1 This quotation shall remain valid for seven (7) calendar days from the issuance date. Any confirmation received after this period shall be subjected to revision at the Company's sole discretion. Upon confirmation or payment of any portion of the quoted amount within the validity period, this quotation shall be deemed fully accepted, and the Owner shall have no right to withdraw, cancel, or modify the engagement except as expressly permitted herein.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        1.2 By signing this quotation, the Owner hereby engages the Company to carry out, execute, and complete the agreed renovation and delivery works for the contract sum stated in the quotation (inclusive of all applicable taxes, if any). This quotation, once accepted, shall constitute a binding and enforceable contract between the Owner and the Company for the works described herein.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        1.3 The Company shall have sole discretion to determine the overall design theme, spatial layout, and material specifications to ensure quality, durability, and rental optimisation. While the Company will make reasonable effort to incorporate the design intent conveyed through any reference visuals, final decisions on finishes, fittings, and configurations shall rest exclusively with the Company and do not require prior approval from Owner. The Owner expressly agrees that all design, layout, and material selections made by the Company in good faith and consistent with the intended rental optimisation shall be deemed final and accepted by the Owner, with no right of dispute or claim.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        1.4 All reference images, design mood boards, sample materials, and illustrative visuals are strictly for conceptual guidance only. The Company reserves the right to substitute any item—due to availability, cost-efficiency, supplier changes, or functional improvement—with products of similar or higher quality, value, or durability without prior notice to the Owner. The Company shall not be held liable for any variations in colour tone, texture, material source, or aesthetic appearance arising from such substitutions, provided that equivalent functionality and overall quality are maintained.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        1.5 The Company reserves the right to photograph and record the unit before, during, and after completion for documentation, portfolio, and marketing purposes. All such photos, videos, or media captured shall remain the sole intellectual property of the Company and may be used for internal documentation, quality verification, and marketing purposes without any compensation or further consent from the Owner.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={[styles.tncText, { fontWeight: 'bold' }]}>1.6 Intellectual Property and Design Ownership</Text>
                    <Text style={styles.tncText}>
                        All design concepts, layouts, drawings, 3D visualisations, furniture configurations, material selections, or any other creative work produced or proposed by the Company in relation to the Property ("Design Works") remain the sole and exclusive intellectual property of the Company.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        The Owner acknowledges that these Design Works are proprietary to the Company and are provided solely for the purpose of executing the renovation contracted under this quotation.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        The Owner shall not, whether directly or indirectly, reproduce, share, distribute, replicate, or cause to be replicated any part of the Design Works in any other property or project without the Company's prior written consent.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                    <Text style={styles.tncText}>
                        Any unauthorised use, duplication, or adaptation of the Design Works shall constitute an infringement of the Company's intellectual property rights, entitling the Company to seek injunctive relief, damages, and any other remedies available under law.
                    </Text>
                </View>

                <Text style={[styles.tncTitle, { fontSize: 10, marginTop: 12, marginBottom: 6 }]}>2. Renovation Period & Commencement Timeline</Text>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>2.1</Text> The standard renovation period shall be as stated in the signed quotation ("Renovation Period"), commencing from the Actual Commencement Date as defined below.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>2.2</Text> For the avoidance of doubt, the Actual Commencement Date is the latest date on which all the following conditions are satisfied:
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6, paddingLeft: 12 }}>
                    <Text style={styles.tncText}>
                        (a) The Owner has made the required downpayment in accordance with the selected payment method (see Clause 3);{'\n'}
                        (b) All developer defect rectifications have been duly completed and approved by the Company;{'\n'}
                        (c) All necessary renovation permits, approvals, and access permissions have been obtained from the building management, joint management body, or relevant authorities; and{'\n'}
                        (d) The Owner has delivered to the Company all required keys, access cards, access device and any other items or information required to commence the renovation works.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>2.3</Text> The Company shall commence or facilitate the commencement of work within seven (7) working days from the Actual Commencement Date. The renovation period shall be <Text style={{ fontWeight: 'bold' }}>{convertToWords(orderDetail.completion_day || 0).toUpperCase()} {orderDetail.completion_day || 0} working days</Text> from the date of commencement. This timeline assumes that all necessary site access, approvals, and documentation are provided in a timely manner. Any delays not attributable to the Company may justify an extension of time for completion, subject to mutual agreement.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>2.4</Text> The Company shall not be held liable for any delay, loss, or damage arising from circumstances beyond its reasonable control. These include, but are not limited to: (a) building access restrictions; (b) work hour limitations imposed by the building management; (c) delays in obtaining permits or approvals; (d) adverse weather conditions; (e) shipping or customs clearance delays; (f) shortage or unavailability of materials; (g) labour disruptions; (h) public holidays; or (i) any delay caused by the Owner, including delay in payment, failure to provide timely decisions, or failure to fulfil obligations under this agreement.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>2.5</Text> In any such events, the Renovation Period shall be automatically and reasonably extended without penalty and the Company shall not be liable for any penalties, liquidated damages, or claims resulting from such delays. The Company shall notify the Owner in writing of the revised estimated completion date.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>2.6</Text> The Owner shall, at the Owner's own cost and responsibility, pay all renovation deposits required by the building management office and ensure that all necessary permits, forms, and documentation are duly submitted and approved prior to the commencement of renovation works. The Company shall not be liable for any delay, additional cost, or loss resulting from the Owner's failure to obtain such approvals or to comply with any requirements imposed by the building management, Joint Management Body (JMB), or relevant authorities.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={[styles.tncText, { fontWeight: 'bold' }]}>2.7 Partitioning Works and Compliance Responsibility</Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        The Owner acknowledges that any partitioning works (including but not limited to room subdivisions, additional walls, or layout modifications) are undertaken solely at the Owner's risk. Such works may be subject to removal orders, forfeiture of renovation deposits, or fines imposed by the Management Office (MO), Joint Management Body (JMB), or local authority. The Owner shall obtain all required written approvals or permits prior to commencement.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        The Owner agrees to indemnify, defend, and hold harmless the Company and its agents, employees, and subcontractors from and against any claims, losses, damages, penalties, costs, or expenses (including legal fees) arising from or related to such partitioning works, including but not limited to enforcement actions, removal orders, fines, or compliance costs.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                    <Text style={styles.tncText}>
                        The Company shall not be liable for any enforcement actions, losses, damages, or costs incurred as a result of the Owner's failure to obtain the required approvals or non-compliance with applicable rules and regulations.
                    </Text>
                </View>

                <Text style={[styles.tncTitle, { fontSize: 10, marginTop: 12, marginBottom: 6 }]}>3. Payment Terms</Text>

                {selectedProgram === "normal" && (
                    <>
                        <Text style={[styles.tncTitle, { fontSize: 9, marginTop: 8, marginBottom: 4 }]}>3.A Full Payment (50–50 Method)</Text>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.A.1</Text> The Owner agrees to pay the total renovation contract sum in two (2) equal instalments of fifty percent (50%) each, in accordance with the following schedule:
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6, paddingLeft: 12 }}>
                            <Text style={styles.tncText}>
                                (a) <Text style={{ fontWeight: 'bold' }}>First 50% (Downpayment):</Text> Payable upon signing of this quotation and before commencement of Phase 1 works.{'\n'}
                                (b) <Text style={{ fontWeight: 'bold' }}>Second 50%:</Text> Payable upon completion of Phase 1 works (wiring, painting, and installation of smart devices) and before commencement of Phase 2 works (installation of built-in furniture, kitchen cabinets, wardrobes, beds, and other fittings).
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.A.2</Text> The Company shall issue progress notifications, site updates, and photographic evidence (where applicable) to the Owner before requesting each milestone payment.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.A.3</Text> The Company shall not be obliged to commence or continue any work unless and until the respective milestone payment has been received in full. Any delay in payment shall automatically entitle the Company to suspend work, extend the renovation period without penalty, and reschedule activities on a best-effort basis.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.A.4</Text> If the Owner fails to make any due payment within three (3) working days of notification, the Company reserves the right to:
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6, paddingLeft: 12 }}>
                            <Text style={styles.tncText}>
                                (a) Suspend all works on-site without liability;{'\n'}
                                (b) Impose compensation for idle manpower, material storage, or project rescheduling costs; and{'\n'}
                                (c) Recover from the Owner any additional expenses, damages, or losses arising directly or indirectly from the delay.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.A.5</Text> All payments made by the Owner to the Company shall be deemed fully earned and are strictly non-refundable, including in cases of cancellation, withdrawal, or termination by the Owner after the commencement of any preparatory or renovation works. This applies regardless of the stage of completion or reason for termination, and without prejudice to the Company's right to claim further losses, damages, or costs incurred as a result of such cancellation or termination.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.A.6</Text> Payments may be made via bank transfer, FPX, or credit/debit card. A two percent (2%) administrative fee applies for credit/debit card transactions, and all bank, gateway, or financing charges (including Easy Payment Plan or similar schemes) shall be borne solely by the Owner. The Company shall not be liable for any delays, failures, or additional charges arising from third-party payment platforms or financial institutions. The Company reserves the right to suspend or withhold further works, services, or deliveries in the event of delayed, failed, or reversed payments until such issues are fully resolved to the Company's satisfaction.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.A.7 Default Interest Rate:</Text> Any overdue payment shall accrue interest at eight percent (8%) per annum from the due date until full settlement, without prejudice to any other rights or remedies available to the Company.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>Retention of Title:</Text> Ownership and legal title to all furniture, fixtures, fittings, and materials supplied or installed under this quotation shall remain vested exclusively in the Company until full and final settlement of all sums due and payable (including any additional charges or interest or costs incurred) have been received in full. In the event of non-payment, default, or breach by the Owner, the Company reserves the right, without notice and without incurring any liability, to:
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6, paddingLeft: 12 }}>
                            <Text style={styles.tncText}>
                                (a) remove or recover any such items from the premises,{'\n'}
                                (b) suspend further works or services, and/or{'\n'}
                                (c) claim monetary compensation equivalent to the value of the unpaid items or associated losses.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 12 }}>
                            <Text style={styles.tncText}>
                                The Owner shall grant the Company or its authorised agents unrestricted access to the premises for the purposes of exercising its rights under this clause.
                            </Text>
                        </View>
                    </>
                )}

                {selectedProgram === "rnpl" && (
                    <>
                        <Text style={[styles.tncTitle, { fontSize: 9, marginTop: 8, marginBottom: 4 }]}>3.B RenoNow PayLater Method</Text>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.B1 Initial Down Payment</Text>{'\n'}
                                The Owner shall pay the upfront down payment as stated in the quotation ("Initial Down Payment") upon signing of this quotation. No renovation or procurement works shall commence until the Initial Down Payment has been received in full and all commencement conditions under Clause 2.2 are met.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.B2 Deferred Balance & Rental Deduction Mechanism</Text>{'\n'}
                                (a) The remaining renovation balance ("Deferred Balance") shall be recovered by Company through monthly deductions from the gross rental proceeds collected under the Owner Collaboration Agreement ("OCA").{'\n'}
                                (b) The Owner hereby irrevocably authorises Company to deduct the agreed monthly repayment directly from rental income before remitting the balance to the Owner.{'\n'}
                                (c) Monthly deductions shall commence from the first month in which the Property generates rental income under Company's management.{'\n'}
                                (d) Any month without rental income shall not waive or extinguish the payment obligation; such instalments shall automatically carry forward and be recovered from subsequent months or directly from the Owner upon demand.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.B3 Repayment Duration and Liability</Text>{'\n'}
                                (a) The Deferred Balance shall be repaid in full within the agreed repayment period stated in the quotation ("Repayment Period").{'\n'}
                                (b) The Owner remains wholly liable for the entire Deferred Balance, irrespective of tenancy turnover, vacancy periods, or temporary rental shortfall.{'\n'}
                                (c) Upon termination, sale, or transfer of ownership of the Property, all outstanding Deferred Balance shall become immediately due and payable in full.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.B4 Exclusive Management & Rental Control</Text>{'\n'}
                                (a) During the Repayment Period, the Owner shall not rent, market, or manage the Property through any third party or directly without Company's written consent.{'\n'}
                                (b) Any such act shall constitute a material breach, entitling Company to immediate recovery of the full outstanding Deferred Balance and termination of all management services.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.B5 Payment Default and Enforcement</Text>{'\n'}
                                (a) Any unpaid instalment outstanding for more than fourteen (14) days shall accrue interest at eight percent (8%) per annum until full payment.{'\n'}
                                (b) Company reserves the right to suspend all renovation warranties and/or lodge a private caveat on the Property until full settlement.{'\n'}
                                (c) Any dispute raised by the Owner shall not suspend or delay Company's right to recover payments under this clause.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.B6 Non-Refundability</Text>{'\n'}
                                All payments made under this quotation shall be deemed irrevocably earned and strictly non-refundable, including in cases of Owner's withdrawal, termination of engagement, or vacancy of the property for any reason.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.B7 Financing & Administrative Charges</Text>{'\n'}
                                All fees, charges, or costs associated with the use of payment gateway, credit/debit card, or third-party financing channels, including but not limited to Easy Payment Plan (EPP) or similar instalment services, shall be borne solely by the Owner and are non-refundable under any circumstances.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.B8 Payment Methods and Administrative Fee</Text>{'\n'}
                                Payments may be made via bank transfer, FPX, or credit/debit card. A two percent (2%) administrative fee applies for credit/debit card transactions for one-off payments, and all bank, gateway, or financing charges (including Easy Payment Plan or similar schemes) shall be borne solely by the Owner. The Company shall not be liable for any delays, failures, or additional charges arising from third-party payment platforms or financial institutions. The Company reserves the right to suspend or withhold further works, services, or deliveries in the event of delayed, failed, or reversed payments until such issues are fully resolved to the Company's satisfaction.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.B9 Retention of Title</Text>{'\n'}
                                All furniture, fixtures, and installations supplied under this arrangement shall remain the sole and exclusive property of Company until the full Deferred Balance is received and settled. In the event of default or non-payment, Company reserves the right, without prior notice and without incurring any liability, to remove such items from the premises or to pursue recovery of their equivalent monetary value through legal means. The Owner expressly agrees to grant Company or its authorised representatives access to the premises, if necessary, to exercise its rights under this clause.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 12 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.B10 Performance Disclaimer</Text>{'\n'}
                                Company shall exercise its best commercial efforts to secure tenancy and optimize rental returns for the Property; however, the Owner acknowledges and accepts that occupancy rates and rental yields are subject to market forces, seasonal demand, and other external factors beyond Company's control. Accordingly, Company shall not be held liable for any periods of vacancy, rental fluctuations, or shortfalls in expected returns.
                            </Text>
                        </View>
                    </>
                )}

                {selectedProgram === "bePowered" && (
                    <>
                        <Text style={[styles.tncTitle, { fontSize: 9, marginTop: 8, marginBottom: 4 }]}>3.C Payment Terms – Reno Subscription Method (60-Month Tenure)</Text>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C1 Initial Down Payment</Text>{'\n'}
                                The Owner shall pay the agreed upfront down payment as stated in the quotation ("Initial Down Payment") upon signing of this quotation. No renovation, furnishing, or procurement works shall commence until full payment of the Initial Down Payment and fulfilment of all commencement conditions under Clause 2.2.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C2 Subscription Tenure and Fixed Monthly Payment</Text>{'\n'}
                                (a) The remaining renovation balance ("Subscription Balance") shall be payable by the Owner to Company in sixty (60) consecutive fixed monthly instalments ("Subscription Payments") as specified in the quotation.{'\n'}
                                (b) Each Subscription Payment shall be due on the same calendar date of every month, commencing from the month following the handover or issuance of the completion notice, whichever occurs first.{'\n'}
                                (c) The Subscription Payments are fixed and shall not vary regardless of the Property's rental income, occupancy rate, or tenancy status.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C3 Authorisation for Automatic Deduction</Text>{'\n'}
                                (a) The Owner irrevocably authorises Company to deduct each monthly Subscription Payment directly from the rental proceeds collected under the Owner Collaboration Agreement ("OCA"), prior to releasing any balance to the Owner.{'\n'}
                                (b) In months where the rental proceeds are insufficient to cover the due Subscription Payment, the Owner shall settle the shortfall directly to Company within seven (7) calendar days of written notice.{'\n'}
                                (c) Any outstanding balance shall automatically carry forward and be recoverable from subsequent rental proceeds or direct payments without prejudice to Company's rights to enforce full recovery.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C4 Owner's Commitment and Continuing Liability</Text>{'\n'}
                                (a) The Owner acknowledges that this Subscription arrangement constitutes a fixed payment obligation, not a profit-sharing or rental-dependent scheme.{'\n'}
                                (b) The Owner shall remain fully liable for all Subscription Payments throughout the 60-month tenure, irrespective of occupancy rate, vacancy, tenant behaviour, or rental performance.{'\n'}
                                (c) In the event of any sale, transfer of ownership, or early termination of the OCA, all remaining unpaid Subscription Payments shall become immediately due and payable in full.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C5 Survival of Payment Obligation</Text>{'\n'}
                                The Owner's payment obligation under this clause shall survive the expiry or termination of this quotation and the OCA, regardless of the reason for such termination. Termination, cancellation, or withdrawal by either Party shall not affect Company's right to recover all outstanding sums due under this Subscription arrangement.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C6 No Set-Off or Counterclaim</Text>{'\n'}
                                The Owner shall not be entitled to withhold, delay, or deduct any Subscription Payment by way of set-off, counterclaim, or dispute against Company. All payments are to be made in full and without condition.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C7 Cross-Default with OCA Breaches</Text>{'\n'}
                                Any default, non-payment, or breach of this Subscription clause shall constitute an immediate cross-default under the Owner Collaboration Agreement. Company shall be entitled to exercise any and all remedies available under the OCA, including suspension of management services, deduction of outstanding sums from rental proceeds, and legal recovery of debt.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C8 Early Settlement Option</Text>{'\n'}
                                The Owner may elect to fully settle the outstanding Subscription Balance prior to the expiry of the 60-month tenure without penalty, provided that written notice is submitted to Company at least thirty (30) days in advance.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C9 Default and Enforcement</Text>{'\n'}
                                (a) Any Subscription Payment not received within fourteen (14) days of its due date shall accrue interest at eight percent (8%) per annum until full settlement.{'\n'}
                                (b) Company reserves the right to suspend renovation warranties, management services, or tenant operations if payment default persists beyond thirty (30) days.{'\n'}
                                (c) In the event of continued default, Company may lodge a private caveat over the Property, recover sums directly from rental income, or initiate legal proceedings for debt recovery and damages.{'\n'}
                                (d) Any complaint, dispute, or claim raised by the Owner shall not suspend or defer the Owner's payment obligations herein.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C10 Retention of Title and Ownership</Text>{'\n'}
                                All furniture, fixtures, fittings, and materials installed or supplied under the Reno Subscription program shall remain the sole and exclusive property of Company until the Owner has fully settled all 60 Subscription Payments and any outstanding charges, fees, or penalties. In the event of non-payment, early termination or default by the Owner, Company reserves the right to remove, reclaim, or recover the equivalent monetary value for such items without liability. The Owner expressly agrees to grant Company or its authorised representatives access to the property for the purposes of exercising its rights under this clause.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C11 Administrative and Financing Fees</Text>{'\n'}
                                Any bank fees, administrative charges, or financing charges associated with this Subscription arrangement, including but not limited to Easy Payment Plan (EPP) or similar instalment facilities, shall be fully borne by the Owner.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C12 Payment Methods and Administrative Fee</Text>{'\n'}
                                Payments may be made via bank transfer, FPX, or credit/debit card. A two percent (2%) administrative fee applies for credit/debit card transactions for one-off payments, and all bank, gateway, or financing charges (including Easy Payment Plan or similar schemes) shall be borne solely by the Owner. The Company shall not be liable for any delays, failures, or additional charges arising from third-party payment platforms or financial institutions. The Company reserves the right to suspend or withhold further works, services, or deliveries in the event of delayed, failed, or reversed payments until such issues are fully resolved to the Company's satisfaction.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C13 Non-Refundability and Termination</Text>{'\n'}
                                (a) All payments made under this quotation are strictly non-refundable and deemed earned for services rendered or work completed.{'\n'}
                                (b) Should the Owner terminate the collaboration or transfer management before the expiry of the 60-month Subscription tenure, all remaining unpaid Subscription Payments shall become immediately due in full.{'\n'}
                                (c) Company shall have no obligation to refund or offset any prior payments made.
                            </Text>
                        </View>
                        
                        <View style={{ marginBottom: 12 }}>
                            <Text style={styles.tncText}>
                                <Text style={{ fontWeight: 'bold' }}>3.C14 Performance Disclaimer</Text>{'\n'}
                                Company shall exercise its best commercial efforts to optimise rental performance and maintain occupancy of the Property; however, the Owner acknowledges that Subscription Payments are independent of rental income or tenant occupancy, and shall remain payable in full regardless of any vacancy, rental fluctuations, or tenant defaults.
                            </Text>
                        </View>
                    </>
                )}

                <Text style={[styles.tncTitle, { fontSize: 10, marginTop: 12, marginBottom: 6 }]}>4. Scope Variation & Change Requests</Text>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>4.1</Text> The renovation scope is strictly limited to the items, specifications, and work descriptions stated in the approved quotation and any accompanying design proposal (if any).
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>4.2</Text> No variation, substitution, omission, or addition to the approved scope shall be valid and binding unless:
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6, paddingLeft: 12 }}>
                    <Text style={styles.tncText}>
                        (a) Requested in writing by the Owner;{'\n'}
                        (b) Formally approved and accepted in writing by the Company; and{'\n'}
                        (c) Documented in a duly signed Variation Order ("VO") specifying the revised cost, scope, and any necessary extension of time.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>4.3</Text> Verbal instructions, informal communications, or implied requests or approvals shall not be recognised or enforceable under any circumstances.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>4.4</Text> The Company reserves the absolute right to reject any variation request that may:
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6, paddingLeft: 12 }}>
                    <Text style={styles.tncText}>
                        (a) delay or disrupt the project timeline,{'\n'}
                        (b) compromise the structural or design integrity of the works,{'\n'}
                        (c) breach building management or regulatory requirements, or{'\n'}
                        (d) conflict with the intended co-living functionality or overall design aesthetic.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>4.5</Text> All approved VO works shall be chargeable to the Owner and payable in full prior to commencement of the related works. The Company shall not be obligated to carry out any VO until such payment has been received and cleared in full.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>4.6</Text> For the avoidance of doubt, the approval of a VO shall automatically extend the renovation timeline on a reasonable best-effort basis and the Company shall not be liable for any delay, penalty, or claim arising therefrom.
                    </Text>
                </View>

                <Text style={[styles.tncTitle, { fontSize: 10, marginTop: 12, marginBottom: 6 }]}>5. Limitation of Liability</Text>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>5.1</Text> The Company shall not be liable for any indirect, incidental, consequential, special, exemplary, or punitive damages, including but not limited to loss of profit, business opportunity, goodwill, or anticipated rental income. This exclusion applies regardless of the cause of action and even if the Company was advised of the possibility of such damages, except where such loss arises directly and solely from the Company's proven gross negligence or willful misconduct.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>5.2</Text> The Owner expressly acknowledges and accepts that reasonable variations in colour tone, material texture, finishing, pattern alignment, or visual appearance whether due to manufacturing differences, lighting conditions, or installation method shall not constitute a defect, non-conformity, or breach of contract.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>5.3</Text> The Company's total aggregate liability under this quotation and in relation to the associated works, whether in contract, tort, equity or otherwise, shall in no event exceed the total contract sum actually paid by the Owner to the Company under this quotation.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>5.4</Text> For the avoidance of doubt, the Company shall not be liable for any defects, damage, or loss arising from:
                    </Text>
                </View>
                
                <View style={{ marginBottom: 12, paddingLeft: 12 }}>
                    <Text style={styles.tncText}>
                        (a) misuse or abuse of the delivered works or materials;{'\n'}
                        (b) poor maintenance or failure to maintain by the Owner or third parties;{'\n'}
                        (c) unauthorised alterations or modifications;{'\n'}
                        (d) environmental exposure or natural wear and tear;{'\n'}
                        (e) third-party interference; or{'\n'}
                        (f) any event or condition beyond the Company's reasonable control.
                    </Text>
                </View>

                <Text style={[styles.tncTitle, { fontSize: 10, marginTop: 12, marginBottom: 6 }]}>6. Owner's Indemnity</Text>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>6.1</Text> The Owner shall fully indemnify, defend, and hold harmless BeLive Ventures Sdn Bhd ("Company"), its directors, officers, employees, contractors, and agents against all losses, claims, demands, penalties, liabilities, damages, expenses (including legal fees on a solicitor-and-client basis), or proceedings arising directly or indirectly from:
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6, paddingLeft: 12 }}>
                    <Text style={styles.tncText}>
                        (a) any act, default, omission, or negligence of the Owner or any person acting under the Owner's instruction;{'\n'}
                        (b) any breach of the terms of this quotation, the OCA, or any applicable law, by-law, or building management requirement; or{'\n'}
                        (c) any misrepresentation, false declaration, site interference, or failure by the Owner to obtain requisite permits, consents or approvals from relevant authorities or property management bodies.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                    <Text style={styles.tncText}>
                        This indemnity shall survive the completion, expiration, or termination of this quotation and the OCA, and shall remain valid and enforceable until all claims, liabilities, or proceedings arising out of or in connection with the matters above have been fully resolved.
                    </Text>
                </View>

                <Text style={[styles.tncTitle, { fontSize: 10, marginTop: 12, marginBottom: 6 }]}>7. Site Access & Safety</Text>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>7.1</Text> The Owner shall not enter, occupy, or permit any third party to enter the Property during renovation period without prior written notice and approval from Company. Unauthorized entry may result in delays, damage, or safety hazards. Company shall not be responsible or liable whatsoever for any loss, injury, or accident arising from such unauthorized access.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>7.2</Text> The Owner shall not store personal items, materials, or equipment at the site, nor engage or permit any third-party contractors, vendors, or visitors to access or perform work at the Property without Company's prior written consent.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>7.3</Text> Company reserves the absolute right to suspend or terminate this engagement with immediately effect if the Owner, or any person acting on the Owner's behalf, obstructs site operations, creates or contributes to unsafe conditions, interferes with Company's personnel or contractors, or violates any building management or statutory safety regulations. In such circumstances, the Company shall not be liable for any resulting delay, cost or loss. All additional costs, damages or liabilities arising from such suspension or termination shall be fully borne by the Owner.
                    </Text>
                </View>

                <Text style={[styles.tncTitle, { fontSize: 10, marginTop: 12, marginBottom: 6 }]}>8. Governing Law, Dispute Resolution & Evidence</Text>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>8.1</Text> This quotation and its Terms & Conditions shall be governed by and construed in accordance with the laws of Malaysia.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>8.2</Text> The Parties shall use their best efforts to resolve any dispute, controversy, or claim arising out of or in connection with this quotation through written consultation and good-faith negotiation. Failing amicable settlement within thirty (30) days, either Party may refer the matter to the courts of Malaysia for final adjudication.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>8.3</Text> The courts of Malaysia shall have <Text style={{ fontWeight: 'bold' }}>exclusive jurisdiction</Text> over all disputes arising from or relating to this quotation and its enforcement, and each Party irrevocably submits to such jurisdiction.
                    </Text>
                </View>
                
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.tncText}>
                        <Text style={{ fontWeight: 'bold' }}>8.4</Text> Electronic Evidence & Communication Validity:
                    </Text>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                    <Text style={styles.tncText}>
                        All communications, approvals, authorisations, or records exchanged via electronic means—including but not limited to email, WhatsApp, project management platforms, and digital signature systems—shall be deemed valid, legally binding, and admissible as evidence of agreement between the Parties. No Party shall dispute the validity, enforceability or admissibility of this quotation or any related documents solely on the basis that they were executed, transmitted, or stored electronically.
                    </Text>
                </View>

                <View style={{ marginTop: 12, alignItems: 'center' }}>
                    <Text style={[styles.tncText, { fontWeight: 'bold' }]}>(End of Terms & Conditions)</Text>
                </View>
            </View>
            <Text
                style={styles.pageNumber}
                render={({ pageNumber }) => `${pageNumber}`}
                fixed
            />
        </Page>
    );


    return (
        <>
            <QuotationPDF />
            <TncPDF />
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

// Additional styles for smaller text in tables and new Installment Detail section
const additionalStyles = StyleSheet.create({
    smallerItemTh: {
        fontSize: 5,
        fontWeight: "bold",
        padding: 3,
        textAlign: "left",
        color: "#1f2937",
        flexDirection: "column",
        display: "flex",
    },
    smallerItemTd: {
        fontSize: 5,
        padding: 3,
        color: "#4b5563",
    },
    smallerItemTdSecondary: {
        fontSize: 4,
        color: "#6b7280",
        paddingLeft: 6,
    },
    smallerPackageTitle: {
        fontSize: 8,
        fontWeight: "bold",
        color: "#111827",
    },
    smallerPackageDesc: {
        fontSize: 6,
        color: "#4b5563",
        marginTop: 2,
    },
    smallerQuantityBadgeText: {
        fontSize: 5,
        color: "#333",
        fontWeight: "bold",
    },
    summaryHeaderCell: {
        fontSize: 6,
        fontWeight: "bold",
        padding: 3,
        color: "#4b5563",
    },
    summaryCell: {
        fontSize: 6,
        padding: 0,
        color: "#4b5563",
    },
    installmentContainer: {
        backgroundColor: "#ffffffcc", // bg-white/80
        borderRadius: 16, // rounded-2xl
        borderWidth: 1,
        borderColor: "#e5e7eb80", // border-gray-200/50
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        marginBottom: 8,
    },
    installmentHeader: {
        paddingHorizontal: 24, // px-6
        paddingVertical: 16, // py-4
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb80", // border-gray-200/50
    },
    installmentTitle: {
        fontSize: 12, // text-lg
        fontWeight: "semibold",
        color: "#111827", // text-gray-900
    },
    installmentContent: {
        padding: 24, // p-6
        flexDirection: "column",
        gap: 16, // space-y-4
    },
    installmentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    installmentSection: {
        flexDirection: "column",
        gap: 4, // space-y-1
    },
    installmentSubRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4, // mt-1
    },
    installmentLabel: {
        fontSize: 8,
        fontWeight: "medium",
        color: "#111827", // text-gray-900
    },
    installmentValue: {
        fontSize: 8,
        fontWeight: "medium",
        color: "#111827", // text-gray-900
    },
    installmentSubLabel: {
        fontSize: 7,
        color: "#4b5563", // text-gray-600
    },
    installmentSubValue: {
        fontSize: 7,
        color: "#4b5563", // text-gray-600
    },
    installmentSubLabelContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    addOnBadge: {
        marginLeft: 8, // ml-2
        paddingHorizontal: 8, // px-2
        paddingVertical: 4, // py-1
        backgroundColor: "#dbeafe", // bg-blue-100
        borderRadius: 999, // rounded-full
    },
    addOnBadgeText: {
        fontSize: 6, // text-xs
        color: "#1e40af", // text-blue-700
        fontWeight: "medium",
    },
    installmentTotalSection: {
        flexDirection: "column",
        paddingTop: 8, // pt-2
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb", // border-gray-200
        marginTop: 8, // mt-2
    },
    installmentTotalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    installmentTotalLabel: {
        fontSize: 10, // text-xl
        fontWeight: "bold",
        color: "#111827", // text-gray-900
    },
    installmentTotalValue: {
        fontSize: 10, // text-xl
        fontWeight: "bold",
        color: "#111827", // text-gray-900
    },
})

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
                        to={LOCAL_PATH_PREFIX + 'orders/' + orderDetail.id}
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