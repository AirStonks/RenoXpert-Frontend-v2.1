"use client"

import { Document, Page, PDFViewer, Text, View, Image, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"
import { useEffect, useState } from "react"
import useFetchOrder from "../../../hook/useFetchOrder"
import { styles } from "../styles/quotationPrintStyle"
import { useParams } from "react-router-dom"
import { Link } from "react-router-dom"
import type { Order, Product } from "../../../types"

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

        // Calculate filtered total_amount
        const filteredTotalAmount = Object.values(categoryTotals).reduce((sum, { total_price }) => sum + total_price, 0)

        const categoriesArray = Object.entries(categoryTotals).map(([category, { total_price, quantity }]) => ({
            category: category.startsWith("Add-on Option")
                ? category
                : categoryOptions.find((option) => option.value === category)?.label || category,
            total_price,
            quantity,
            cogs: categoryTotals[category].cogs,
        }))

        console.log(categoriesArray);


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
            const totalAmount =
                orderDetail.final_amount > 0
                    ? orderDetail.final_amount
                    : orderDetail.latest_quotation.packages.reduce((total, pkg) => {
                        // Skip if package is not an addon or not included
                        if (pkg.is_addon === true && pkg.is_addon_included === false) {
                            return total
                        }

                        // Use final_amount if available, otherwise use total_price
                        return total + pkg.total_price * (pkg.quantity || 1)
                    }, 0)

            setTotalExcludedAddonAmount(totalAmount)
        }
    }, [orderDetail])

    const COMPANY_NAME = "RenoXpert Sdn Bhd"
    const COMPANY_REG = "202401032588 (1578437-W)"
    const COMPANY_ADDRESS = "No. 42-46, Ground Floor, Jalan SS 19/1D"
    const COMPANY_CITY_STATE = "Subang Jaya, Selangor, 46500"
    const COMPANY_MOBILE = "03-58789831"
    const COMPANY_EMAIL = "sales@renoxpert.my"
    const COMPANY_LOGO_URL = "/public/app/RenoExpert_logo-01.jpg"

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
            const category = pkg.category ?? "Others" // Fallback to 'Others' if category is undefined
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

    const QuotationPDF = () => (
        <Page size="A4" style={styles.page}>
            {/* Redesigned Company Header */}
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
                            <Text style={[additionalStyles.summaryHeaderCell, { textAlign: "right" }]}>Nett Margin</Text>
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

                        if (!isAddon || (isAddon && isIncluded)) {
                            return (
                                <View style={styles.packageCard} key={pkgIndex} wrap={false}>
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
                                            <View style={{ flex: 2.5 }}>
                                                <Text style={additionalStyles.smallerItemTh}>Description</Text>
                                            </View>
                                            <View style={{ flex: 0.6 }}>
                                                <Text style={additionalStyles.smallerItemTh}>QTY</Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={additionalStyles.smallerItemTh}>Supply RRP</Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={additionalStyles.smallerItemTh}>Install RRP</Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={additionalStyles.smallerItemTh}>Total RRP</Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={additionalStyles.smallerItemTh}>Supply COGS</Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={additionalStyles.smallerItemTh}>Install COGS</Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={additionalStyles.smallerItemTh}>Total COGS</Text>
                                            </View>
                                            <View style={{ flex: 0.6 }}>
                                                <Text style={additionalStyles.smallerItemTh}>Margin %</Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={additionalStyles.smallerItemTh}>Margin Amount</Text>
                                            </View>
                                        </View>

                                        {pkg.products.map((product) => {
                                            // Calculate margins for each product
                                            const supplyRRP = product.pivot.includeSupply
                                                ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                : 0
                                            const installRRP = product.pivot.includeInstall
                                                ? product.provisioning.install.retail_price * product.pivot.quantity
                                                : 0
                                            const totalRRP = supplyRRP + installRRP

                                            const supplyCOGS = product.pivot.includeSupply
                                                ? product.provisioning.supply.cogs * product.pivot.quantity
                                                : 0
                                            const installCOGS = product.pivot.includeInstall
                                                ? product.provisioning.install.cogs * product.pivot.quantity
                                                : 0
                                            const totalCOGS = supplyCOGS + installCOGS

                                            const marginAmount = totalRRP - totalCOGS
                                            const marginPercent = totalRRP > 0 ? (marginAmount / totalRRP) * 100 : 0

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
                                                    <View style={{ flex: 2.5 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>{product.name}</Text>
                                                        <Text style={additionalStyles.smallerItemTdSecondary}>{product.description}</Text>
                                                    </View>
                                                    <View style={{ flex: 0.6, textAlign: "center" }}>
                                                        <Text style={additionalStyles.smallerItemTd}>{product.pivot.quantity}</Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {product.pivot.includeSupply
                                                                ? `RM ${supplyRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                : "-"}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {product.pivot.includeInstall
                                                                ? `RM ${installRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                : "-"}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {`RM ${totalRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {product.pivot.includeSupply
                                                                ? `RM ${supplyCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                : "-"}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {product.pivot.includeInstall
                                                                ? `RM ${installCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                : "-"}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {`RM ${totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.6 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {`${marginPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 0.8 }}>
                                                        <Text style={additionalStyles.smallerItemTd}>
                                                            {`RM ${marginAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )
                                        })}

                                        {/* Package Totals Row */}
                                        <View style={[styles.itemRow, { backgroundColor: "#f3f4f6" }]}>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>Total</Text>
                                            </View>
                                            <View style={{ flex: 2.5 }}>
                                                <Text style={additionalStyles.smallerItemTd}></Text>
                                            </View>
                                            <View style={{ flex: 0.6 }}>
                                                <Text style={additionalStyles.smallerItemTd}></Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${totals.supplyRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${totals.installRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${totals.totalRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${totals.supplyCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${totals.installCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${totals.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.6 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {totals.totalRRP > 0
                                                        ? `${(((totals.totalRRP - totals.totalCOGS) / totals.totalRRP) * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                                                        : "0.00%"}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 0.8 }}>
                                                <Text style={[additionalStyles.smallerItemTd, { fontWeight: "bold" }]}>
                                                    {`RM ${(totals.totalRRP - totals.totalCOGS).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                                {orderDetail.latest_quotation?.bonus?.description.split("\n").map((item, index) => (
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
        overflow: "hidden", // Prevent scrolling issues
    },
})

// Additional styles for smaller text in tables
const additionalStyles = StyleSheet.create({
    smallerItemTh: {
        fontSize: 5,
        fontWeight: "bold",
        padding: 3,
        textAlign: "left",
        color: "#1f2937",
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
        padding: 3,
        color: "#4b5563",
    },
})

// Add the necessary styles to the styles StyleSheet (add this to the styles object):


function DetailedOrderPrint() {
    const { id } = useParams<{ id: string }>()
    const orderId = id ? Number.parseInt(id, 10) : null
    const { orderDetail, loading, error, refetch } = useFetchOrder(orderId)

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
                    {/* Back */}
                    <Link
                        to={"/orders/" + orderDetail.id}
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
                                className={`w-full sm:w-auto px-6 py-3 rounded-lg text-white font-semibold transition-colors duration-200 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                disabled={loading}
                            >
                                {loading ? "Generating PDF..." : "Download PDF"}
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
    )
}

export default DetailedOrderPrint
