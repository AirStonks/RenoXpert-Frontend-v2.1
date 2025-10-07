"use client"

import { Document, Page, PDFViewer, Text, View, Image, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"
import { useEffect, useState } from "react"
import useFetchOrder from "../../../hook/useFetchOrder"
import { styles } from "../styles/quotationPrintStyle"
import { useParams } from "react-router-dom"
import { Link } from "react-router-dom"
import type { Order, Product } from "../../../types"
import { useUser } from "../../../context/UserContext"
import { isStaffUser } from "../../../utils/userPermissions"

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/'
        : '/';

const getCurrentDate = () => {
    const date = new Date()
    const options = { day: "2-digit", month: "short", year: "numeric" }
    return date.toLocaleDateString("en-GB", options as Intl.DateTimeFormatOptions)
}

const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${day} ${monthNames[Number.parseInt(month) - 1]} ${year}`
}

const convertToWords = (num: number) => {
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
    const teens = [
        "ten",
        "eleven",
        "twelve",
        "thirteen",
        "fourteen",
        "fifteen",
        "sixteen",
        "seventeen",
        "eighteen",
        "nineteen",
    ]
    const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

    if (num < 10) {
        return ones[num]
    } else if (num >= 10 && num < 20) {
        return teens[num - 10]
    } else {
        const tenPart = Math.floor(num / 10)
        const onePart = num % 10
        return tens[tenPart] + (onePart > 0 ? "-" + ones[onePart] : "")
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
]

const DetailedOrderPDF = ({ orderDetail }: { orderDetail: Order }) => {
    const [packageCategories, setPackageCategories] = useState<
        { category: string; total_price: number; quantity: number, cogs: number }[]
    >([])
    const [totalExcludedAddonAmount, setTotalExcludedAddonAmount] = useState<number>(0)

    useEffect(() => {
        if (!orderDetail?.latest_quotation?.packages) return

        let addonCounter = 0 // To number each add-on uniquely

        const categoryTotals = orderDetail?.latest_quotation?.packages.reduce((acc, quotationPackage) => {
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

        const categoriesArray = Object.entries(categoryTotals).map(([category, { total_price, quantity }]) => ({
            category: category.startsWith("Add-on Option")
                ? category
                : categoryOptions.find((option) => option.value === category)?.label || category,
            total_price,
            quantity,
            cogs: categoryTotals[category].cogs,
        }))

        const sortedCategories = [
            ...categoriesArray.filter((item) => !item.category.startsWith("Add-on Option")),
            ...categoriesArray.filter((item) => item.category.startsWith("Add-on Option")),
        ]

        setPackageCategories(sortedCategories)
    }, [orderDetail?.latest_quotation?.packages])

    const [totalCogs, setTotalCogs] = useState<number>(0)
    const [marginInAmount, setMarginInAmount] = useState<number>(0)
    const [marginInPercentage, setMarginInPercentage] = useState<number>(0)

    useEffect(() => {
        if (orderDetail) {
            // Calculate total COGS
            const cogsTotal = orderDetail.latest_quotation.packages.reduce((total, pkg) => {
                // Skip if package is not an addon or not included
                if (pkg.is_addon === true && pkg.is_addon_included === false) {
                    return total
                }

                const packageCogs = pkg.products.reduce((prodTotal, product) => {
                    if (!product.pivot.included) return prodTotal

                    const supplyCOGS = product.pivot.includeSupply ? product.provisioning.supply.cogs * product.pivot.quantity : 0
                    const installCOGS = product.pivot.includeInstall
                        ? product.provisioning.install.cogs * product.pivot.quantity
                        : 0

                    return prodTotal + supplyCOGS + installCOGS
                }, 0)

                return total + packageCogs * (pkg.quantity || 1)
            }, 0)

            setTotalCogs(cogsTotal)

            // Calculate margin
            const margin = totalExcludedAddonAmount - cogsTotal
            setMarginInAmount(margin)

            // Calculate margin percentage
            const percentage = totalExcludedAddonAmount > 0 ? (margin / totalExcludedAddonAmount) * 100 : 0
            setMarginInPercentage(percentage)
        }
    }, [orderDetail, totalExcludedAddonAmount])

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

            setTotalExcludedAddonAmount(totalRetailPrice)
        }
    }, [orderDetail])

    const COMPANY_NAME = "RenoXpert Sdn Bhd"
    const COMPANY_REG = "202401032588 (1578437-W)"
    const COMPANY_ADDRESS = "No. 42-46, Ground Floor, Jalan SS 19/1D"
    const COMPANY_CITY_STATE = "Subang Jaya, Selangor, 46500"
    const COMPANY_MOBILE = "03-58789831"
    const COMPANY_EMAIL = "sales@renoxpert.my"
    const COMPANY_LOGO_URL = MEDIA_URL + "app/RenoExpert_logo-01.jpg"

    // Define constants for quotationHeader
    const QUOTATION_TITLE = "Detailed Quotation"
    const QUOTATION_NUMBER = orderDetail.order_no
    const QUOTATION_DATE = orderDetail.status === "confirmed" ? formatDate(orderDetail.updated_at) : getCurrentDate()

    const ATTN_NAME = orderDetail.user ? orderDetail.user.name : "N/A"
    const ATTN_ADDRESS = orderDetail.user
        ? `${orderDetail.user.address.address_1}, ${orderDetail.user.address.address_2}, ${orderDetail.user.address.city}, ${orderDetail.user.address.state}, ${orderDetail.user.address.postcode}`
        : "N/A"
    const ATTN_MOBILE = orderDetail.user ? `+${orderDetail.user.country_code} ${orderDetail.user.phone_no}` : "N/A"
    const ATTN_EMAIL = orderDetail.user ? orderDetail.user.email : "N/A"

    const RENO_PROPERTY_NAME = orderDetail.property ? orderDetail.property.name : "N/A"
    const RENO_UNIT_NO = orderDetail.property ? `${orderDetail.block}-${orderDetail.floor}-${orderDetail.unit_no}` : "N/A"
    const RENO_UNIT_TYPE = orderDetail.unit_type || "N/A"
    const RENO_PROPERTY_ADDRESS = orderDetail.property
        ? [
            orderDetail.property.address,
            orderDetail.property.street,
            orderDetail.property.postcode,
            orderDetail.property.city,
            orderDetail.property.state,
        ]
            .filter(Boolean)
            .join(", ") || "N/A"
        : "N/A"

    // Calculate totals based on package unitPrice and qty
    const totalItems = orderDetail.latest_quotation.packages.reduce((sum, item) => sum + item.quantity, 0)
    const categoryTotals = orderDetail.latest_quotation.packages.reduce(
        (acc: Record<string, { total_price: number; quantity: number }>, pkg) => {
            const category = pkg.category ?? "Others"
            const categoryTotal = (pkg.total_price ?? 0) * (pkg.quantity ?? 1)

            if (!acc[category]) {
                acc[category] = { total_price: 0, quantity: 0 }
            }
            acc[category].total_price += categoryTotal
            acc[category].quantity += pkg.quantity ?? 0

            return acc
        },
        {},
    )

    const totalPriceBeforeDiscount = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total_price, 0)
    const totalPrice = orderDetail.latest_quotation?.bonus
        ? totalPriceBeforeDiscount - Number(orderDetail.latest_quotation?.bonus?.value)
        : totalPriceBeforeDiscount

    // Function to calculate totals for each package
    const calculatePackageTotals = (products: Product[]) => {
        return products.reduce(
            (acc, product) => {
                if (!product.pivot.included) return acc

                const supplyRRP = product.pivot.includeSupply
                    ? product.provisioning.supply.retail_price * product.pivot.quantity
                    : 0

                const installRRP = product.pivot.includeInstall
                    ? product.provisioning.install.retail_price * product.pivot.quantity
                    : 0

                const supplyCOGS = product.pivot.includeSupply ? product.provisioning.supply.cogs * product.pivot.quantity : 0

                const installCOGS = product.pivot.includeInstall
                    ? product.provisioning.install.cogs * product.pivot.quantity
                    : 0

                return {
                    supplyRRP: acc.supplyRRP + supplyRRP,
                    installRRP: acc.installRRP + installRRP,
                    totalRRP: acc.totalRRP + supplyRRP + installRRP,
                    supplyCOGS: acc.supplyCOGS + supplyCOGS,
                    installCOGS: acc.installCOGS + installCOGS,
                    totalCOGS: acc.totalCOGS + supplyCOGS + installCOGS,
                }
            },
            {
                supplyRRP: 0,
                installRRP: 0,
                totalRRP: 0,
                supplyCOGS: 0,
                installCOGS: 0,
                totalCOGS: 0,
            },
        )
    }

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
            {/* Company Header */}
            <View style={styles.companyHeader}>
                <View>
                    <Image src={COMPANY_LOGO_URL || "/placeholder.svg"} style={styles.companyImage} />
                </View>
                <View style={styles.companyInfo}>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.companyTitle}>{COMPANY_NAME}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.companyReg}>Reg No: {COMPANY_REG}</Text>
                    </View>
                    <Text style={styles.companyDetails}>
                        {COMPANY_ADDRESS}
                        {"\n"}
                        {COMPANY_CITY_STATE}
                        {"\n"}
                        Contact Number: {COMPANY_MOBILE}
                        {"\n"}
                        Email: {COMPANY_EMAIL}
                    </Text>
                </View>
            </View>

            {/* Quotation Header */}
            <View style={styles.quotationHeader}>
                <Text style={styles.quotationTitle}>{QUOTATION_TITLE}</Text>
                <View style={styles.quotationDetails}>
                    <Text style={styles.quotationText}>Number: {QUOTATION_NUMBER}</Text>
                    <Text style={styles.quotationText}>Date: {QUOTATION_DATE}</Text>
                </View>
            </View>

            {/* Attn Header */}
            <View style={styles.headerRow}>
                <View style={styles.attnHeader}>
                    <View style={styles.attnTitle}>
                        <Text style={styles.attnLabel}>Attn:</Text>
                    </View>
                    <Text style={styles.attnText}>
                        {ATTN_NAME}
                        {"\n"}
                        {ATTN_ADDRESS}
                        {"\n"}
                        {ATTN_MOBILE}
                        {"\n"}
                        {ATTN_EMAIL}
                    </Text>
                </View>
                <View style={styles.attnHeader}>
                    <View style={styles.attnTitle}>
                        <Text style={styles.attnLabel}>Unit to be renovated:</Text>
                    </View>
                    <Text style={styles.attnText}>
                        {RENO_UNIT_NO}
                        {"\n"}
                        {RENO_PROPERTY_NAME}
                        {"\n"}
                        Type {RENO_UNIT_TYPE}
                        {"\n"}
                        {RENO_PROPERTY_ADDRESS}
                    </Text>
                </View>
            </View>

            {/* Summary Pricing Section */}
            <View wrap={false} style={styles.summaryPricingSection}>
                <Text style={styles.summaryPricingTitle}>Summary Pricing</Text>
                <View style={styles.summaryPricingTable}>
                    <View style={styles.summaryPricingHeader}>
                        <View style={{ flex: 2 }}>
                            <Text style={additionalStyles.summaryHeaderCell}>Category</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.summaryHeaderCell, { textAlign: "right" }]}>Total Price</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.summaryHeaderCell, { textAlign: "right" }]}>COGS</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.summaryHeaderCell, { textAlign: "right" }]}>Gross Margin</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.summaryHeaderCell, { textAlign: "right" }]}>Margin %</Text>
                        </View>
                    </View>

                    {packageCategories.map((category, index) => {
                        const categoryMargin = category.total_price - category.cogs;
                        const categoryMarginPercentage =
                            category.total_price > 0 ? (categoryMargin / category.total_price) * 100 : 0;

                        return (
                            <View style={styles.summaryPricingRow} key={index}>
                                <View style={{ flex: 2 }}>
                                    <Text style={additionalStyles.summaryCell}>{category.category}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right" }]}>
                                        RM{" "}
                                        {category.total_price.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right" }]}>
                                        RM {category.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right" }]}>
                                        RM{" "}
                                        {categoryMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[additionalStyles.summaryCell, { textAlign: "right" }]}>
                                        {categoryMarginPercentage.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                        %
                                    </Text>
                                </View>
                            </View>
                        )
                    })}

                    {/* Totals Row */}
                    <View style={[styles.summaryPricingRow, { borderTopWidth: 1, borderTopColor: "#e5e7eb", marginTop: 2 }]}>
                        <View style={{ flex: 2 }}>
                            <Text style={[additionalStyles.summaryCell, { fontWeight: "bold" }]}>Total</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold" }]}>
                                RM{" "}
                                {totalExcludedAddonAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold" }]}>
                                RM {totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold" }]}>
                                RM {marginInAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold" }]}>
                                {marginInPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </Text>
                        </View>
                    </View>

                    {/* Bonus/Discount Row (if applicable) */}
                    {orderDetail.latest_quotation.bonus && (
                        <View style={styles.summaryPricingRow}>
                            <View style={{ flex: 2 }}>
                                <Text style={additionalStyles.summaryCell}>Bonus/Discount</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[additionalStyles.summaryCell, { textAlign: "right" }]}>
                                    - RM{" "}
                                    {Number(orderDetail.latest_quotation.bonus.value).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[additionalStyles.summaryCell, { textAlign: "right" }]}>-</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[additionalStyles.summaryCell, { textAlign: "right" }]}>
                                    - RM{" "}
                                    {Number(orderDetail.latest_quotation.bonus.value).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[additionalStyles.summaryCell, { textAlign: "right" }]}>
                                    -{" "}
                                    {(
                                        marginInPercentage -
                                        ((totalExcludedAddonAmount - Number(orderDetail.latest_quotation.bonus.value) - totalCogs) /
                                            (totalExcludedAddonAmount - Number(orderDetail.latest_quotation.bonus.value))) *
                                        100
                                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    %
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Nett Amount Row */}
                    <View style={styles.summaryPricingRow}>
                        <View style={{ flex: 2 }}>
                            <Text style={[additionalStyles.summaryCell, { fontWeight: "bold" }]}>Nett Amount</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold" }]}>
                                RM{" "}
                                {(totalExcludedAddonAmount - Number(orderDetail.latest_quotation.bonus?.value || 0)).toLocaleString(
                                    undefined,
                                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                                )}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold" }]}>
                                RM {totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold" }]}>
                                RM{" "}
                                {(
                                    totalExcludedAddonAmount -
                                    Number(orderDetail.latest_quotation.bonus?.value || 0) -
                                    totalCogs
                                ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.summaryCell, { textAlign: "right", fontWeight: "bold" }]}>
                                {(
                                    ((totalExcludedAddonAmount - Number(orderDetail.latest_quotation.bonus?.value || 0) - totalCogs) /
                                        (totalExcludedAddonAmount - Number(orderDetail.latest_quotation.bonus?.value || 0))) *
                                    100
                                ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                %
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Installment Detail Section */}
            {orderDetail.is_be_powered && (
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
            )}

            {/* Quotation Body */}
            <View>
                {/* Package Table with Detailed Products */}
                {(() => {
                    let packageCounter = 0
                    let addonCounter = 0

                    return orderDetail.latest_quotation.packages.map((pkg, pkgIndex) => {
                        const isAddon = pkg.is_addon
                        const counter = isAddon ? addonCounter++ : packageCounter++
                        const isIncluded = pkg.is_addon_included
                        const totals = calculatePackageTotals(pkg.products)
                        const grandTotal = totals.totalRRP * (pkg.quantity || 1)

                        if (!isAddon || (isAddon && isIncluded)) {
                            return (
                                <View style={styles.packageCard} key={pkgIndex} wrap={false}>
                                    <View>

                                    </View>
                                    <View style={styles.packageHeader}>
                                        {isAddon ? <Text style={styles.packageLabel}>{`ADD-ON OPTION ${counter + 1}:`}</Text> : ""}
                                        <Text style={additionalStyles.smallerPackageTitle}>{pkg.name}</Text>
                                        <Text style={additionalStyles.smallerPackageDesc}>{pkg.description}</Text>
                                        <View style={styles.quantityBadge}>
                                            {pkg.is_addon && !pkg.is_addon_included ? (
                                                <Text style={additionalStyles.smallerQuantityBadgeText}>Not Included</Text>
                                            ) : (
                                                <Text style={additionalStyles.smallerQuantityBadgeText}>Quantity: {pkg.quantity || 1}</Text>
                                            )}
                                        </View>
                                    </View>

                                    {/* Detailed Product Table */}
                                    <View style={styles.itemTable}>
                                        <View style={styles.itemHeader}>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={additionalStyles.smallerItemTh}>S.o.W</Text>
                                            </View>
                                            <View style={{ flex: 2.5, paddingRight: 5 }}>
                                                <Text style={additionalStyles.smallerItemTh}>Description</Text>
                                            </View>
                                            <View style={{ flex: 1, textAlign: "center", borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: "#000" }}>
                                                <Text style={{ ...additionalStyles.smallerItemTh, textAlign: "center" }}>Supplier</Text>
                                            </View>
                                            <View style={{ flex: 0.6, textAlign: "center" }}>
                                                <Text style={{ ...additionalStyles.smallerItemTh, textAlign: "center" }}>QTY</Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <View style={additionalStyles.smallerItemTh}>
                                                    <Text>Supply</Text>
                                                    <Text>RRP</Text>
                                                </View>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <View style={additionalStyles.smallerItemTh}>
                                                    <Text>Install</Text>
                                                    <Text>RRP</Text>
                                                </View>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <View style={[additionalStyles.smallerItemTh, { color: "green", fontWeight: "bold" }]}>
                                                    <Text>Total</Text>
                                                    <Text>RRP</Text>
                                                </View>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <View style={additionalStyles.smallerItemTh}>
                                                    <Text>Supply</Text>
                                                    <Text>COGS</Text>
                                                </View>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <View style={additionalStyles.smallerItemTh}>
                                                    <Text>Install</Text>
                                                    <Text>COGS</Text>
                                                </View>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <View style={[additionalStyles.smallerItemTh, { color: "red", fontWeight: "bold" }]}>
                                                    <Text>Total</Text>
                                                    <Text>COGS</Text>
                                                </View>
                                            </View>
                                            <View style={{ flex: 0.6 }}>
                                                <View style={additionalStyles.smallerItemTh}>
                                                    <Text>Margin</Text>
                                                    <Text>%</Text>
                                                </View>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <View style={additionalStyles.smallerItemTh}>
                                                    <Text>Margin</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {pkg.products.map((product) => {
                                            const supplyRRP = product.pivot.includeSupply
                                                ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                : 0;
                                            const installRRP = product.pivot.includeInstall
                                                ? product.provisioning.install.retail_price * product.pivot.quantity
                                                : 0;
                                            const totalRRP = supplyRRP + installRRP;

                                            const supplyCOGS = product.pivot.includeSupply
                                                ? product.provisioning.supply.cogs * product.pivot.quantity
                                                : 0;
                                            const installCOGS = product.pivot.includeInstall
                                                ? product.provisioning.install.cogs * product.pivot.quantity
                                                : 0;
                                            const totalCOGS = supplyCOGS + installCOGS;

                                            const marginAmount = totalRRP - totalCOGS;
                                            const marginPercent = totalRRP > 0 ? (marginAmount / totalRRP) * 100 : 0;

                                            return (
                                                <View style={styles.itemRow} key={product.id}>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {product.pivot.includeSupply && product.pivot.includeInstall
                                                                ? "Supply and Install"
                                                                : !product.pivot.includeSupply && !product.pivot.includeInstall
                                                                    ? "-"
                                                                    : product.pivot.includeSupply && !product.pivot.includeInstall
                                                                        ? "Supply Only"
                                                                        : !product.pivot.includeSupply && product.pivot.includeInstall
                                                                            ? "Install Only"
                                                                            : "-"}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 2.5, paddingRight: 5 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>{product.name}</Text>
                                                        <Text style={additionalStyles.smallerItemTdSecondary}>{product.description}</Text>
                                                    </View>
                                                    <View style={{ flex: 1, textAlign: "center", borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: "#000" }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {product.supplier_name ? product.supplier_name : "-"}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.6, textAlign: "center" }}>
                                                        <Text style={additionalStyles.smallerItemTd}>{product.pivot.quantity}</Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {product.pivot.includeSupply
                                                                ? `RM ${supplyRRP.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}`
                                                                : "-"}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {product.pivot.includeInstall
                                                                ? `RM ${installRRP.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}`
                                                                : "-"}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={[additionalStyles.smallerItemTd, { color: "green", fontWeight: "bold" }]}>
                                                            {`RM ${totalRRP.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}`}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {product.pivot.includeSupply
                                                                ? `RM ${supplyCOGS.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}`
                                                                : "-"}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {product.pivot.includeInstall
                                                                ? `RM ${installCOGS.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}`
                                                                : "-"}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={[additionalStyles.smallerItemTd, { color: "red", fontWeight: "bold" }]}>
                                                            {`RM ${totalCOGS.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}`}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.6 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {`${marginPercent.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}%`}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {`RM ${marginAmount.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}`}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}

                                        {/* Sub-total Row */}
                                        <View style={[styles.itemRow, { backgroundColor: "#f3f4f6" }]}>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>Sub-total</Text>
                                            </View>
                                            <View style={{ flex: 2.5 }}>
                                                <Text style={additionalStyles.smallerItemTd}></Text>
                                            </View>
                                            <View style={{ flex: 1, paddingRight: 5 }}>
                                                <Text style={additionalStyles.smallerItemTd}></Text>
                                            </View>
                                            <View style={{ flex: 0.6 }}>
                                                <Text style={additionalStyles.smallerItemTd}></Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${totals.supplyRRP.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${totals.installRRP.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold", color: "green" }]}>
                                                    {`RM ${totals.totalRRP.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${totals.supplyCOGS.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${totals.installCOGS.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold", color: "red" }]}>
                                                    {`RM ${totals.totalCOGS.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.6 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {totals.totalRRP > 0
                                                        ? `${(((totals.totalRRP - totals.totalCOGS) / totals.totalRRP) * 100).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}%`
                                                        : "0.00%"}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${(totals.totalRRP - totals.totalCOGS).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Grand Total Row */}
                                        <View style={[styles.itemRow, { backgroundColor: "#e5e7eb" }]}>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>Grand Total</Text>
                                            </View>
                                            <View style={{ flex: 2.5 }}>
                                                <Text style={additionalStyles.smallerItemTd}></Text>
                                            </View>
                                            <View style={{ flex: 1, paddingRight: 5 }}>
                                                <Text style={additionalStyles.smallerItemTd}></Text>
                                            </View>
                                            <View style={{ flex: 0.6, alignItems: "center" }}>
                                                <Text style={additionalStyles.smallerItemTd}>{pkg.quantity}</Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${(totals.supplyRRP * (pkg.quantity || 1)).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${(totals.installRRP * (pkg.quantity || 1)).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold", color: "green" }]}>
                                                    {`RM ${grandTotal.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${(totals.supplyCOGS * (pkg.quantity || 1)).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${(totals.installCOGS * (pkg.quantity || 1)).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold", color: "red" }]}>
                                                    {`RM ${(totals.totalCOGS * (pkg.quantity || 1)).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.6 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {grandTotal > 0
                                                        ? `${(((grandTotal - (totals.totalCOGS * (pkg.quantity || 1))) / grandTotal) * 100).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}%`
                                                        : "0.00%"}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${(grandTotal - (totals.totalCOGS * (pkg.quantity || 1))).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )
                        }
                        return null
                    })
                })()}

                {/* Category Summary Table */}
                <View wrap={false}>
                    <View style={styles.summaryTable}>
                        <View style={styles.summaryHeader}>
                            <Text style={styles.summaryTitle}>Summary</Text>
                        </View>
                        {packageCategories.map((category, index: number) => (
                            <View style={styles.summaryRow} key={index}>
                                <Text style={styles.summaryLabel}>Total {category.category}</Text>
                                <Text style={styles.summaryValue}>
                                    RM{" "}
                                    {category.total_price.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Bonus Table */}
                {orderDetail.latest_quotation?.bonus && (
                    <View wrap={false}>
                        <View style={styles.bonusTable}>
                            <Text style={styles.bonusTitle}>Bonus:</Text>
                            <View style={styles.bonusList}>
                                {orderDetail.latest_quotation?.bonus?.description?.split("\n").map((item, index) => (
                                    <Text style={styles.bonusItem} key={index}>
                                        {item}
                                    </Text>
                                ))}
                            </View>
                            <Text style={styles.bonusDiscountLabel}>Discount:</Text>
                            <Text style={styles.bonusDiscountValue}>
                                RM{" "}
                                {Number(orderDetail.latest_quotation?.bonus?.value).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Total Price Table */}
                <View wrap={false}>
                    <View style={styles.totalTable}>
                        <Text style={styles.totalTitle}>Total Amount:</Text>
                        <Text style={styles.totalValue}>
                            RM{" "}
                            {(totalExcludedAddonAmount - Number(orderDetail.latest_quotation?.bonus?.value || 0)).toLocaleString(
                                undefined,
                                { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                            )}
                        </Text>
                        {orderDetail.latest_quotation?.bonus && (
                            <Text style={styles.originalPrice}>
                                Original Price: RM{" "}
                                {totalExcludedAddonAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </Text>
                        )}
                    </View>
                </View>
            </View>

            <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
        </Page>
    )

    return (
        <>
            <QuotationPDF />
        </>
    )
}

// Custom styles to hide PDFViewer toolbar
const viewerStyles = StyleSheet.create({
    viewer: {
        width: "100%",
        height: "100%",
        border: "none",
        overflow: "hidden",
    },
})

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


function DetailedOrderPrint() {
    const { id } = useParams<{ id: string }>()
    const orderId = id ? Number.parseInt(id, 10) : null
    const { orderDetail, loading, error, refetch } = useFetchOrder(orderId)
    const { currentUser } = useUser()

    // Check if user is staff and restrict access
    if (isStaffUser(currentUser)) {
        return (
            <div className="d-flex flex-column flex-center flex-column-fluid">
                <div className="d-flex flex-column flex-center text-center p-10">
                    <div className="card card-flush w-lg-650px py-5">
                        <div className="card-body py-15 py-lg-20">
                            <div className="mb-13">
                                <i className="ki-duotone ki-shield-cross fs-3x text-warning mb-5">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                            </div>
                            <div className="mb-11">
                                <h1 className="fw-bold text-gray-900 mb-3">Access Restricted</h1>
                                <div className="text-gray-500 fw-semibold fs-6">
                                    You don't have permission to access this module.
                                </div>
                            </div>
                            <div className="mb-0">
                                <a href={LOCAL_PATH_PREFIX} className="btn btn-primary">
                                    <i className="ki-duotone ki-home fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Return to Dashboard
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600" />
            </div>
        )
    if (error)
        return (
            <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
                <p className="text-red-600 text-lg font-semibold">Error fetching quotation.</p>
            </div>
        )
    if (!orderDetail)
        return (
            <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
                <p className="text-gray-600 text-lg font-semibold">No quotation found.</p>
            </div>
        )

    const fileName = `DETAILED_QUOTATION_${orderDetail.order_no}.pdf`

    const pdfDocument = (
        <Document>
            <DetailedOrderPDF orderDetail={orderDetail} />
        </Document>
    )

    return (
        <div className="w-full min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 flex flex-col h-screen">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        to={LOCAL_PATH_PREFIX + "orders/" + orderDetail.id}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                        <i className="ki-solid ki-arrow-left text-2xl"></i>
                    </Link>

                    <h1 className="text-2xl font-bold text-gray-800">Detailed Quotation Preview</h1>
                </div>

                {/* Download Button */}
                <div className="mb-6">
                    <PDFDownloadLink document={pdfDocument} fileName={fileName}>
                        {({ loading }) => (
                            <button
                                className={`w-full sm:w-auto px-6 py-3 rounded-lg text-white font-semibold transition-colors duration-200 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                                disabled={loading}
                            >
                                {loading ? "Generating PDF..." : "Download PDF"}
                            </button>
                        )}
                    </PDFDownloadLink>
                </div>

                {/* PDF Preview */}
                <div className="w-full flex-1 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md">
                    <PDFViewer
                        width="100%"
                        height="100%"
                        style={viewerStyles.viewer}
                        showToolbar={false}
                    >
                        {pdfDocument}
                    </PDFViewer>
                </div>
            </div>
        </div>
    )
}

export default DetailedOrderPrint