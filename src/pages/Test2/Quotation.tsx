import { Document, Page, PDFViewer, Text, View, Image } from '@react-pdf/renderer';
import React from 'react'
import { styles } from './test2stylesheet';
// import { DataTableCell, Table, TableBody, TableCell, TableHeader } from '@alex9923/react-pdf-table';

export default function Quotation() {

    // Sample data with unit prices for demonstration
    const data = {
        packages: [
            {
                name: "Package A",
                products: [
                    { id: 1, name: "Product A", description: "High-quality item with durable material", quantity: 2, unitPrice: 50, uom: "Unit" },
                    { id: 2, name: "Product B", description: "Compact and lightweight design", quantity: 1, unitPrice: 30, uom: "Piece" },
                    { id: 3, name: "Product C", description: "Bulk pack for industrial use", quantity: 3, unitPrice: 40, uom: "Box" },
                ],
                qty: 2,
                category: "renovation",
                unitPrice: 120,
            },
            {
                name: "Package B",
                products: [
                    { id: 4, name: "Product D", description: "Premium grade component", quantity: 1, unitPrice: 10, uom: "Unit" },
                    { id: 5, name: "Product E", description: "Ergonomic and portable", quantity: 1, unitPrice: 30, uom: "Piece" },
                    { id: 6, name: "Product F", description: "Multi-purpose storage solution", quantity: 2, unitPrice: 40, uom: "Box" },
                ],
                qty: 2,
                category: "smart_iot",
                unitPrice: 80,
            },
            {
                name: "Package C",
                products: [
                    { id: 4, name: "Product D", description: "Premium grade component", quantity: 1, unitPrice: 10, uom: "Unit" },
                    { id: 5, name: "Product E", description: "Ergonomic and portable", quantity: 1, unitPrice: 10, uom: "Piece" },
                ],
                qty: 1,
                category: "smart_iot",
                unitPrice: 20,
            },
            {
                name: "Package D",
                products: [
                    { id: 4, name: "Product D", description: "Premium grade component", quantity: 1, unitPrice: 10, uom: "Unit" },
                    { id: 5, name: "Product E", description: "Ergonomic and portable", quantity: 1, unitPrice: 10, uom: "Piece" },
                ],
                qty: 1,
                category: "smart_iot",
                unitPrice: 20,
            },
            {
                name: "Package E",
                products: [
                    { id: 4, name: "Product D", description: "Premium grade component", quantity: 1, unitPrice: 10, uom: "Unit" },
                    { id: 5, name: "Product E", description: "Ergonomic and portable", quantity: 1, unitPrice: 10, uom: "Piece" },
                ],
                qty: 1,
                category: "smart_iot",
                unitPrice: 20,
            },
            {
                name: "Package F",
                products: [
                    { id: 4, name: "Product D", description: "Premium grade component", quantity: 1, unitPrice: 10, uom: "Unit" },
                    { id: 5, name: "Product E", description: "Ergonomic and portable", quantity: 1, unitPrice: 10, uom: "Piece" },
                ],
                qty: 1,
                category: "smart_iot",
                unitPrice: 20,
            },
        ],
        bonus: {
            value: 2000,
            description: "Exclusive VP Voucher ONLY For Vivo Owner Worth Up To RM2,000!\n1. FREE Defect Check\n2. FREE Smart Main Door Lock installation\n3. FREE Renovation Consultation\n4. FREE Rental Strategy Consultation"
        }
    };

    const COMPANY_NAME = "RenoXpert Sdn Bhd";
    const COMPANY_ADDRESS = "No. 42-46, Ground Floor, Jalan SS 19/1D";
    const COMPANY_CITY_STATE = "Subang Jaya, Selangor, 46500";
    const COMPANY_MOBILE = "03-58789831";
    const COMPANY_EMAIL = "sales@belive.my";
    const COMPANY_LOGO_URL = "public/app/RenoExpert_logo-01.jpg";

    // Define constants for quotationHeader
    const QUOTATION_TITLE = "Quotation";
    const QUOTATION_NUMBER = "QUO-2500001";
    const QUOTATION_DATE = "12-02-2025";

    // Define constants for attnHeader
    const ATTN_LABEL = "Attn:";
    const ATTN_NAME = "TEST USER";
    const ATTN_ADDRESS = "No. 42-46, Ground Floor, Jalan SS 19/1D, Subang Jaya, Selangor, 46500";
    const ATTN_MOBILE = "+6011-11476550";
    const ATTN_EMAIL = "testemail@gmail.com";

    // Calculate totals based on package unitPrice and qty
    const totalItems = data.packages.reduce((sum, item) => sum + item.qty, 0);
    const categoryTotals = data.packages.reduce((acc, pkg) => {
        const category = pkg.category;
        const categoryTotal = pkg.unitPrice * (pkg.qty || 1);

        if (!acc[category]) {
            acc[category] = { total_price: 0, quantity: 0 };
        }
        acc[category].total_price += categoryTotal;
        acc[category].quantity += pkg.qty;

        return acc;
    }, {});

    const totalPriceBeforeDiscount = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total_price, 0);
    const totalPrice = data.bonus ? (totalPriceBeforeDiscount - data.bonus.value).toFixed(2) : totalPriceBeforeDiscount.toFixed(2);

    const QuotationPDF = () => (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Redesigned Company Header */}
                <View style={styles.companyHeader}>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyTitle}>{COMPANY_NAME}</Text>
                        <Text style={styles.companyDetails}>
                            {COMPANY_ADDRESS}{'\n'}
                            Contact Number: {COMPANY_CITY_STATE}{'\n'}
                            Email: {COMPANY_MOBILE}{'\n'}
                            {COMPANY_EMAIL}
                        </Text>
                    </View>
                    <View>
                        {/* Placeholder for image (replace with actual Image component when logo is available) */}
                        <Image src={COMPANY_LOGO_URL} style={styles.companyImage} />
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
                <View style={styles.attnHeader}>
                    <Text style={styles.attnLabel}>{ATTN_LABEL}</Text>
                    <Text style={styles.attnText}>
                        {ATTN_NAME}{'\n'}
                        {ATTN_ADDRESS}{'\n'}
                        {ATTN_MOBILE}{'\n'}
                        {ATTN_EMAIL}
                    </Text>
                </View>

                <View>
                    {/* Package Table */}
                    <View style={styles.packageTable}>
                        <View style={styles.thead}>
                            <Text style={styles.th1}>No</Text>
                            <Text style={styles.th2}>Description</Text>
                            <Text style={styles.th3}>QTY</Text>
                            <Text style={styles.th4}>UOM</Text>
                        </View>
                        {data.packages.map((row, index) => (
                            <View style={styles.tr} key={index}>
                                <View>
                                    <View style={styles.setRow}>
                                        <Text style={[styles.td, styles.td1]}>{index + 1}</Text>
                                        <Text style={[styles.td, styles.td2]}>{row.name}</Text>
                                        <Text style={[styles.td, styles.td3]}>{row.qty}</Text>
                                        <Text style={[styles.td, styles.td4]}>-</Text>
                                    </View>
                                    {row.products.map((product) => (
                                        <View style={styles.productRow} key={product.id}>
                                            <Text style={[styles.td, styles.td1]} />
                                            <View style={styles.productName}>
                                                <Text style={styles.productItem}>{product.name}</Text>
                                                <Text style={styles.productDescription}>{product.description}</Text>
                                            </View>
                                            <Text style={styles.productQty}>{product.quantity}</Text>
                                            <Text style={styles.productUom}>{product.uom}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Category Summary Table */}
                    <View style={styles.summaryTable}>
                        <View style={styles.summaryHeader}>
                            {/* Placeholder for SVG (not supported in @react-pdf/renderer, using text instead) */}
                            <Text style={styles.summaryTitle}>Summary</Text>
                        </View>
                        {Object.entries(categoryTotals).map(([category, { total_price }], index) => (
                            <View style={styles.summaryRow} key={index}>
                                <Text style={styles.summaryLabel}>Total {category} Cost</Text>
                                <Text style={styles.summaryValue}>RM {total_price.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Bonus Table */}
                    <View style={styles.bonusTable}>
                        <Text style={styles.bonusTitle}>Bonus:</Text>
                        <View style={styles.bonusList}>
                            {data.bonus.description.split('\n').map((item, index) => (
                                <Text style={styles.bonusItem} key={index}>{item}</Text>
                            ))}
                        </View>
                        <Text style={styles.bonusDiscountLabel}>Discount:</Text>
                        <Text style={styles.bonusDiscountValue}>RM {data.bonus.value.toFixed(2)}</Text>
                    </View>

                    {/* Total Price Table */}
                    <View style={styles.totalTable}>
                        <Text style={styles.totalTitle}>Total Amount:</Text>
                        <Text style={styles.totalValue}>RM {totalPrice}</Text>
                        {data.bonus && (
                            <Text style={styles.originalPrice}>
                                Original Price: RM {Number(totalPriceBeforeDiscount).toFixed(2)}
                            </Text>
                        )}
                    </View>
                </View>
            </Page>
        </Document>
    );

    return (
        <div className='w-full h-full'>
            <PDFViewer width="100%" height="100%">
                <QuotationPDF />
            </PDFViewer>
        </div>
    )
}