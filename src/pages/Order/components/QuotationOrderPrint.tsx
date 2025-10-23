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

                {/* Installment Detail Section */}
                {orderDetail.is_be_powered ? (
                    <View wrap={false} style={styles.summaryPricingSection}>
                        <Text style={styles.summaryPricingTitle}>Installment Detail</Text>
                        <View style={styles.summaryPricingTable}>
                            {/* Original Nett Amount Row */}
                            <View style={styles.summaryPricingRow}>
                                <View style={{ flex: 3 }}>
                                    <Text style={[additionalStyles.summaryCell, { fontWeight: "bold" }]}>Original Nett Amount</Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold" }]}>
                                        RM {nettAmount.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </Text>
                                </View>
                            </View>

                            {/* Upfront Payment Header */}
                            <View style={[styles.summaryPricingRow, { borderTopWidth: 1, borderTopColor: "#e5e7eb", marginTop: 2 }]}>
                                <View style={{ flex: 3 }}>
                                    <Text style={[additionalStyles.summaryCell, { fontWeight: "bold" }]}>Upfront Payment</Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold" }]}>
                                        RM {upfrontAmount.toLocaleString(undefined, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        })}
                                    </Text>
                                </View>
                            </View>

                            {/* Base Price Sub-row */}
                            <View style={styles.summaryPricingRow}>
                                <View style={{ flex: 3 }}>
                                    <Text style={[additionalStyles.summaryCell, { paddingLeft: 12 }]}>Base Price</Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right" }]}>
                                        RM {orderDetail.be_powered_base_price.toLocaleString(undefined, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        })}
                                    </Text>
                                </View>
                            </View>

                            {/* One-off packages */}
                            {selectedPackages.filter(pkg =>
                                orderDetail.is_be_powered &&
                                pkg.payment_method === 'one-off' &&
                                (pkg.is_addon ? pkg.is_addon_included === true : true)
                            ).map((pkg, index) => (
                                <View style={styles.summaryPricingRow} key={index}>
                                    <View style={{ flex: 3 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 12 }}>
                                            <Text style={additionalStyles.summaryCell}>
                                                {pkg.name} x{pkg.quantity || 1}
                                            </Text>
                                            {pkg.is_addon && (
                                                <View style={additionalStyles.addOnBadge}>
                                                    <Text style={additionalStyles.addOnBadgeText}>Add-On</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <View style={{ flex: 2 }}>
                                        <Text style={[additionalStyles.summaryCell, { textAlign: "right" }]}>
                                            RM {(pkg.markup_amount * (pkg.quantity || 1)).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            ))}

                            {/* Installment Header */}
                            <View style={[styles.summaryPricingRow, { borderTopWidth: 1, borderTopColor: "#e5e7eb", marginTop: 2 }]}>
                                <View style={{ flex: 3 }}>
                                    <Text style={[additionalStyles.summaryCell, { fontWeight: "bold" }]}>
                                        Installment ({orderDetail.tenure} months)
                                    </Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold" }]}>
                                        RM {(orderDetail.installment_method === 'fixed' ? orderDetail.installment_amount : monthlySum).toLocaleString(undefined, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        })}/mth
                                    </Text>
                                </View>
                            </View>

                            {/* Installment details */}
                            {orderDetail.installment_method === 'fixed' ? (
                                <View style={styles.summaryPricingRow}>
                                    <View style={{ flex: 3 }}>
                                        <Text style={[additionalStyles.summaryCell, { paddingLeft: 12 }]}>Installment method fixed</Text>
                                    </View>
                                    <View style={{ flex: 2 }}>
                                        <Text style={[additionalStyles.summaryCell, { textAlign: "right" }]}>Fixed</Text>
                                    </View>
                                </View>
                            ) : selectedPackages.filter(pkg =>
                                orderDetail.is_be_powered &&
                                pkg.payment_method !== 'one-off' &&
                                (pkg.is_addon ? pkg.is_addon_included === true : true)
                            ).map((pkg, index) => (
                                <View style={styles.summaryPricingRow} key={index}>
                                    <View style={{ flex: 3 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 12 }}>
                                            <Text style={additionalStyles.summaryCell}>
                                                {pkg.name} x{pkg.quantity || 1}
                                            </Text>
                                            {pkg.is_addon && (
                                                <View style={additionalStyles.addOnBadge}>
                                                    <Text style={additionalStyles.addOnBadgeText}>Add-On</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <View style={{ flex: 2 }}>
                                        <Text style={[additionalStyles.summaryCell, { textAlign: "right" }]}>
                                            RM {(pkg.monthly_amount * (pkg.quantity || 1)).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0
                                            })}/mth
                                        </Text>
                                    </View>
                                </View>
                            ))}

                            {/* Bonus section */}
                            {orderDetail?.latest_quotation?.bonus && (
                                <View style={[styles.summaryPricingRow, { borderTopWidth: 1, borderTopColor: "#e5e7eb", marginTop: 2 }]}>
                                    <View style={{ flex: 3 }}>
                                        <Text style={[additionalStyles.summaryCell, { fontWeight: "bold", color: "#dc2626" }]}>Bonus</Text>
                                    </View>
                                    <View style={{ flex: 2 }}>
                                        <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold", color: "#dc2626" }]}>
                                            - RM {Number(orderDetail?.latest_quotation?.bonus.value).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Total section */}
                            <View style={[styles.summaryPricingRow, { borderTopWidth: 2, borderTopColor: "#374151", marginTop: 4, paddingTop: 4 }]}>
                                <View style={{ flex: 3 }}>
                                    <Text style={[additionalStyles.summaryCell, { fontWeight: "bold", fontSize: 8 }]}>Total</Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold", fontSize: 8 }]}>
                                        RM {(upfrontAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)).toLocaleString(undefined, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        })} + (RM {(orderDetail.installment_method === 'fixed' ? orderDetail.installment_amount : monthlySum).toLocaleString(undefined, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        })} / month)
                                    </Text>
                                </View>
                            </View>

                            {/* EPP Options */}
                            <View style={styles.summaryPricingRow}>
                                <View style={{ flex: 3 }}>
                                    <Text style={[additionalStyles.summaryCell, { paddingLeft: 12, color: "#15803d" }]}>
                                        EPP (36 months)
                                    </Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right", color: "#15803d" }]}>
                                        RM {((upfrontAmount * 1.105) / 36).toLocaleString(undefined, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        })}/mth
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.summaryPricingRow}>
                                <View style={{ flex: 3 }}>
                                    <Text style={[additionalStyles.summaryCell, { paddingLeft: 12, color: "#15803d" }]}>
                                        EPP (60 months)
                                    </Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right", color: "#15803d" }]}>
                                        RM {((upfrontAmount * 1.14) / 60).toLocaleString(undefined, {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        })}/mth
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <>
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
                                <Text style={styles.totalValue}>RM {(summaryTotals.nettAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                {orderDetail.latest_quotation?.bonus && (
                                    <Text style={styles.originalPrice}>
                                        Original Price: RM {totalExcludedAddonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </>
                )}

            </View>
            <Text
                style={styles.pageNumber}
                render={({ pageNumber }) => `${pageNumber}`}
                fixed
            />


            <Text
                style={styles.watermark}
                fixed
            >
                SAMPLE ONLY
            </Text>
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