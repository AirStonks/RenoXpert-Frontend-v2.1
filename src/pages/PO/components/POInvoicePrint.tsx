"use client"

import { Document, Page, PDFViewer, Text, View, Image, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import useFetchPO from '../../../hook/useFetchPO';
import { Invoice, POPackage, PurchaseOrder } from '../../../types';
import { styles } from '../styles/poInvoicePrintStyle';

// Extended interface for PurchaseOrder with sale property
interface ExtendedPurchaseOrder extends PurchaseOrder {
    sale?: {
        sales_no?: string;
        status?: string;
        total_amount?: number;
        order?: {
            user?: {
                name?: string;
                email?: string;
                phone_no?: string;
                country_code?: string;
                address?: {
                    address_1?: string;
                    address_2?: string;
                    city?: string;
                    state?: string;
                    postcode?: string;
                };
            };
            block?: string;
            floor?: string;
            unit_no?: string;
            unit_type?: string;
            property?: {
                name?: string;
                address?: string;
                street?: string;
                postcode?: string;
                city?: string;
                state?: string;
            };
        };
    };
}

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



const PoInvoicePDF = ({ invoiceDetail, poDetail }: { invoiceDetail: Invoice; poDetail: ExtendedPurchaseOrder }) => {
    const COMPANY_NAME = "RenoXpert Sdn Bhd";
    const COMPANY_REG = "202401032588 (1578437-W)";
    const COMPANY_ADDRESS = "No. 42-46, Ground Floor, Jalan SS 19/1D";
    const COMPANY_CITY_STATE = "Subang Jaya, Selangor, 46500";
    const COMPANY_MOBILE = "03-58789831";
    const COMPANY_EMAIL = "sales@renoxpert.my";
    const COMPANY_LOGO_URL = MEDIA_URL + "app/RenoExpert_logo-01.jpg";

    const ITEM_TITLE = invoiceDetail.status === 'paid' ? "Receipt" : "Invoice";
    const ITEM_NUMBER = invoiceDetail.invoice_no;
    const ITEM_DATE_LABEL = invoiceDetail.status === 'paid' ? 'Receipt Date' : 'Date';
    const ITEM_DATE = invoiceDetail.status === 'paid' ? formatDate(invoiceDetail.updated_at) : getCurrentDate();

    const ATTN_NAME = poDetail.vendor.name;
    const ATTN_ADDRESS = poDetail.vendor.address ? [
        poDetail.vendor.address.address_1,
        poDetail.vendor.address.address_2,
        poDetail.vendor.address.city,
        poDetail.vendor.address.state,
        poDetail.vendor.address.postcode
    ].filter(value => value).join(", ") || "-" : "-";
    const ATTN_MOBILE = `+${poDetail.vendor.country_code} ${poDetail.vendor.phone_no}`;
    const ATTN_EMAIL = poDetail.vendor.email;

    const OWNER_ADDRESS = poDetail.sale ? [
        poDetail.sale.order.user.address.address_1,
        poDetail.sale.order.user.address.address_2,
        poDetail.sale.order.user.address.city,
        poDetail.sale.order.user.address.state,
        poDetail.sale.order.user.address.postcode
    ].filter(value => value).join(", ") || "N/A" : 'N/A';

    const OWNER_NAME = poDetail.sale ? poDetail.sale.order.user.name : 'N/A';
    const OWNER_COUNTRY_CODE = poDetail.sale ? poDetail.sale.order.user.country_code : '';
    const OWNER_MOBILE = poDetail.sale ? poDetail.sale.order.user.phone_no : 'N/A';
    const OWNER_EMAIL = poDetail.sale ? poDetail.sale.order.user.email : 'N/A';

    const UNIT_NO = poDetail.sale ? `${poDetail.sale.order.block}-${poDetail.sale.order.floor}-${poDetail.sale.order.unit_no}` : 'N/A';
    const PROPERTY_NAME = poDetail.sale ? poDetail.sale.order.property.name : 'N/A';
    const UNIT_TYPE = poDetail.sale ? (poDetail.sale.order.unit_type || "N/A") : 'N/A';
    const PROPERTY_ADDRESS = poDetail.sale ? [
        poDetail.sale.order.property.address,
        poDetail.sale.order.property.street,
        poDetail.sale.order.property.postcode,
        poDetail.sale.order.property.city,
        poDetail.sale.order.property.state,
    ].filter(Boolean).join(', ') || "N/A" : 'N/A';

    const totalPrice = poDetail.total_amount;

    return (
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

            {/* Invoice Header */}
            <View style={styles.quotationHeader}>
                <Text style={styles.quotationTitle}>{ITEM_TITLE}</Text>
                <View style={styles.quotationDetails}>
                    <Text style={styles.quotationText}>Number: {ITEM_NUMBER}</Text>
                    <Text style={styles.quotationText}>{ITEM_DATE_LABEL}: {ITEM_DATE}</Text>
                </View>
            </View>

            {/* Vendor and Owner Information */}
            <View style={styles.headerRow}>
                <View style={styles.attnHeader}>
                    <View style={styles.attnTitle}>
                        <Text style={[styles.attnLabel, additionalStyles.vendorLabel]}>Vendor:</Text>
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
                        <Text style={[styles.attnLabel, additionalStyles.ownerLabel]}>Owner:</Text>
                    </View>
                    <Text style={styles.attnText}>
                        {OWNER_NAME}
                        {"\n"}
                        {OWNER_ADDRESS}
                        {"\n"}
                        +{OWNER_COUNTRY_CODE} {OWNER_MOBILE}
                        {"\n"}
                        {OWNER_EMAIL}
                    </Text>
                </View>
            </View>

            {/* Unit Information */}
            <View style={[styles.attnHeader, additionalStyles.unitHeader]}>
                <View style={styles.attnTitle}>
                    <Text style={[styles.attnLabel, additionalStyles.unitLabel]}>Unit:</Text>
                </View>
                <Text style={styles.attnText}>
                    Unit No: {UNIT_NO}
                    {"\n"}
                    Property Name: {PROPERTY_NAME}
                    {"\n"}
                    Unit Type: {UNIT_TYPE}
                    {"\n"}
                    Address: {PROPERTY_ADDRESS}
                </Text>
            </View>

            {/* Purchase Order Details */}
            <View wrap={false} style={additionalStyles.poDetailsSection}>
                <Text style={additionalStyles.poDetailsTitle}>Purchase Order Details</Text>

                {poDetail.po_packages.map((pkg: POPackage, pkgIndex: number) => (
                    <View key={pkgIndex} style={additionalStyles.packageSection}>
                        {/* Package Header */}
                        <View style={additionalStyles.packageHeader}>
                            <Text style={additionalStyles.packageTitle}>Package {pkgIndex + 1}: {pkg.name}</Text>
                            <Text style={additionalStyles.packageDescription}>{pkg.description || "No description"}</Text>
                        </View>

                        {/* Package Items Table */}
                        <View style={additionalStyles.poDetailsTable}>
                            <View style={additionalStyles.poDetailsHeader}>
                                <View style={{ flex: 4, borderRightWidth: 1, borderRightColor: "#d1d5db" }}>
                                    <Text style={[additionalStyles.poDetailsHeaderCell, { borderRightWidth: 0 }]}>Item Name</Text>
                                </View>
                                <View style={{ flex: 0.8, borderRightWidth: 1, borderRightColor: "#d1d5db" }}>
                                    <Text style={[additionalStyles.poDetailsHeaderCell, { textAlign: "center", borderRightWidth: 0 }]}>Base Qty</Text>
                                </View>
                                <View style={{ flex: 0.8, borderRightWidth: 1, borderRightColor: "#d1d5db" }}>
                                    <Text style={[additionalStyles.poDetailsHeaderCell, { textAlign: "center", borderRightWidth: 0 }]}>Supply Qty</Text>
                                </View>
                                <View style={{ flex: 0.8, borderRightWidth: 1, borderRightColor: "#d1d5db" }}>
                                    <Text style={[additionalStyles.poDetailsHeaderCell, { textAlign: "center", borderRightWidth: 0 }]}>Install Qty</Text>
                                </View>
                                <View style={{ flex: 0.6, borderRightWidth: 1, borderRightColor: "#d1d5db" }}>
                                    <Text style={[additionalStyles.poDetailsHeaderCell, { textAlign: "center", borderRightWidth: 0 }]}>UOM</Text>
                                </View>
                                <View style={{ flex: 1.1, borderRightWidth: 1, borderRightColor: "#d1d5db" }}>
                                    <Text style={[additionalStyles.poDetailsHeaderCell, { textAlign: "center", borderRightWidth: 0 }]}>Supply Price</Text>
                                </View>
                                <View style={{ flex: 1.1, borderRightWidth: 1, borderRightColor: "#d1d5db" }}>
                                    <Text style={[additionalStyles.poDetailsHeaderCell, { textAlign: "center", borderRightWidth: 0 }]}>Install Price</Text>
                                </View>
                                <View style={{ flex: 1.2 }}>
                                    <Text style={[additionalStyles.poDetailsHeaderCell, { textAlign: "center", borderRightWidth: 0 }]}>Total</Text>
                                </View>
                            </View>

                            {pkg.po_items && pkg.po_items.map((item, itemIndex) => (
                                <View style={additionalStyles.poDetailsRow} key={itemIndex}>
                                    <View style={{ flex: 4, borderRightWidth: 1, borderRightColor: "#e5e7eb" }}>
                                        <Text style={[additionalStyles.poDetailsCell, { flexWrap: "wrap", borderRightWidth: 0 }]}>
                                            {item.product_name}
                                            {item.product_desc && (
                                                <>
                                                    {"\n"}
                                                    <Text style={{ fontSize: 6, color: "#6b7280", fontStyle: "italic" }}>
                                                        {item.product_desc}
                                                    </Text>
                                                </>
                                            )}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 0.8, borderRightWidth: 1, borderRightColor: "#e5e7eb" }}>
                                        <Text style={[additionalStyles.poDetailsCell, { textAlign: "center", borderRightWidth: 0 }]}>{item.qty || "0"}</Text>
                                    </View>
                                    <View style={{ flex: 0.8, borderRightWidth: 1, borderRightColor: "#e5e7eb" }}>
                                        <Text style={[additionalStyles.poDetailsCell, { textAlign: "center", borderRightWidth: 0 }]}>{item.supply_qty || "0"}</Text>
                                    </View>
                                    <View style={{ flex: 0.8, borderRightWidth: 1, borderRightColor: "#e5e7eb" }}>
                                        <Text style={[additionalStyles.poDetailsCell, { textAlign: "center", borderRightWidth: 0 }]}>{item.install_qty || "0"}</Text>
                                    </View>
                                    <View style={{ flex: 0.6, borderRightWidth: 1, borderRightColor: "#e5e7eb" }}>
                                        <Text style={[additionalStyles.poDetailsCell, { textAlign: "center", borderRightWidth: 0 }]}>{item.uom}</Text>
                                    </View>
                                    <View style={{ flex: 1.1, borderRightWidth: 1, borderRightColor: "#e5e7eb" }}>
                                        <Text style={[additionalStyles.poDetailsCell, { textAlign: "center", borderRightWidth: 0 }]}>
                                            RM {item.supply_price?.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }) || "0.00"}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1.1, borderRightWidth: 1, borderRightColor: "#e5e7eb" }}>
                                        <Text style={[additionalStyles.poDetailsCell, { textAlign: "center", borderRightWidth: 0 }]}>
                                            RM {item.install_price?.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }) || "0.00"}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1.2 }}>
                                        <Text style={[additionalStyles.poDetailsCell, { textAlign: "center", fontWeight: "bold", borderRightWidth: 0 }]}>
                                            RM {item.total_price?.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }) || "0.00"}
                                        </Text>
                                    </View>
                                </View>
                            ))}

                            {/* Package Subtotal */}
                            <View style={[additionalStyles.poDetailsRow, { backgroundColor: "#f9fafb", borderTopWidth: 1, borderTopColor: "#e5e7eb" }]}>
                                <View style={{ flex: 8.8 }}>
                                    <Text style={[additionalStyles.poDetailsCell, { fontWeight: "bold" }]}>Package Subtotal</Text>
                                </View>
                                <View style={{ flex: 1.2 }}>
                                    <Text style={[additionalStyles.poDetailsCell, { textAlign: "center", fontWeight: "bold" }]}>
                                        RM {pkg.total_price?.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }) || "0.00"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Grand Total */}
                <View style={[additionalStyles.poDetailsTable, { marginTop: 16 }]}>
                    <View style={[additionalStyles.poDetailsRow, { backgroundColor: "#f3f4f6", borderTopWidth: 2, borderTopColor: "#374151" }]}>
                        <View style={{ flex: 7 }}>
                            <Text style={[additionalStyles.poDetailsCell, { fontWeight: "bold", fontSize: 9 }]}>Grand Total</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[additionalStyles.poDetailsCell, { textAlign: "center", fontWeight: "bold", fontSize: 9 }]}>
                                RM {totalPrice?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }) || "0.00"}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Amount in Words */}
            {/* <View wrap={false} style={additionalStyles.amountInWordsSection}>
                <Text style={additionalStyles.amountInWordsText}>
                    Amount in Words: {convertToWords(Math.floor(totalPrice)).toUpperCase()} RINGGIT MALAYSIA ONLY
                </Text>
            </View> */}

            {/* Payment Terms */}
            {/* <View wrap={false} style={additionalStyles.paymentTermsSection}>
                <Text style={additionalStyles.paymentTermsTitle}>Payment Terms</Text>
                <View style={additionalStyles.paymentTermsList}>
                    <Text style={additionalStyles.paymentTermsItem}>
                        • Payment is due within 30 days from the invoice date
                    </Text>
                    <Text style={additionalStyles.paymentTermsItem}>
                        • Late payments may incur additional charges
                    </Text>
                    <Text style={additionalStyles.paymentTermsItem}>
                        • Please include invoice number with payment
                    </Text>
                </View>
            </View> */}

            {/* Footer */}
            <View wrap={false} style={additionalStyles.footerSection}>
                <Text style={additionalStyles.footerText}>
                    Thank you for your business. For any queries, please contact us at {COMPANY_EMAIL} or {COMPANY_MOBILE}.
                </Text>
            </View>

            <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />

            {poDetail.order_status === "unreleased" && (
                <Text style={styles.watermark} fixed>
                    DRAFT
                </Text>
            )}
        </Page>
    );
};

// Custom styles to hide PDFViewer toolbar
const viewerStyles = StyleSheet.create({
    viewer: {
        width: "100%",
        height: "100%",
        border: "none",
        overflow: "hidden",
    },
});

// Additional styles for enhanced layout
const additionalStyles = StyleSheet.create({
    vendorLabel: {
        color: "#1e40af",
        fontWeight: "bold",
    },
    ownerLabel: {
        color: "#059669",
        fontWeight: "bold",
    },
    unitLabel: {
        color: "#7c3aed",
        fontWeight: "bold",
    },
    unitHeader: {
        marginTop: 8,
        marginBottom: 16,
    },
    poDetailsSection: {
        marginTop: 16,
        marginBottom: 16,
    },
    poDetailsTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 8,
        textAlign: "center",
        textDecoration: "underline",
    },
    packageSection: {
        marginBottom: 16,
    },
    packageHeader: {
        backgroundColor: "#f3f4f6",
        padding: 8,
        borderRadius: 4,
        marginBottom: 8,
        borderLeft: "4px solid #3b82f6",
    },
    packageTitle: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 2,
    },
    packageDescription: {
        fontSize: 8,
        color: "#6b7280",
        fontStyle: "italic",
    },
    poDetailsTable: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 4,
        overflow: "hidden",
    },
    poDetailsHeader: {
        flexDirection: "row",
        backgroundColor: "#f9fafb",
        borderBottomWidth: 1,
        borderBottomColor: "#d1d5db",
    },
    poDetailsHeaderCell: {
        fontSize: 8,
        fontWeight: "bold",
        padding: 6,
        color: "#374151",
        borderRightWidth: 1,
        borderRightColor: "#d1d5db",
    },
    poDetailsRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    poDetailsCell: {
        fontSize: 7,
        padding: 6,
        color: "#4b5563",
        borderRightWidth: 1,
        borderRightColor: "#e5e7eb",
        flexWrap: "wrap",
    },
    poDetailsCellSecondary: {
        fontSize: 6,
        color: "#6b7280",
        paddingLeft: 8,
        fontStyle: "italic",
    },
    amountInWordsSection: {
        marginTop: 16,
        marginBottom: 16,
        padding: 12,
        backgroundColor: "#f3f4f6",
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#d1d5db",
    },
    amountInWordsText: {
        fontSize: 8,
        fontWeight: "bold",
        color: "#111827",
        textAlign: "center",
        fontStyle: "italic",
    },
    paymentTermsSection: {
        marginTop: 16,
        marginBottom: 16,
    },
    paymentTermsTitle: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 8,
        textDecoration: "underline",
    },
    paymentTermsList: {
        paddingLeft: 12,
    },
    paymentTermsItem: {
        fontSize: 7,
        color: "#4b5563",
        marginBottom: 4,
    },
    footerSection: {
        marginTop: 24,
        padding: 12,
        backgroundColor: "#f9fafb",
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    footerText: {
        fontSize: 7,
        color: "#6b7280",
        textAlign: "center",
        fontStyle: "italic",
    },
});

function POInvoicePrint() {
    const { id } = useParams<{ id: string }>();
    const poId = id ? parseInt(id, 10) : null;
    const { poDetail, loading, error } = useFetchPO(poId);

    // Create a mock invoice detail for the PDF
    const mockInvoiceDetail: Invoice = {
        id: "0",
        invoice_no: `INV-${poDetail?.po_no || 'N/A'}`,
        status: 'unpaid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        po: poDetail as ExtendedPurchaseOrder
    };

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600" />
            </div>
        );
    if (error)
        return (
            <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
                <p className="text-red-600 text-lg font-semibold">Error fetching purchase order.</p>
            </div>
        );
    if (!poDetail)
        return (
            <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
                <p className="text-gray-600 text-lg font-semibold">No purchase order found.</p>
            </div>
        );

    const fileName = `PURCHASE_ORDER_${poDetail.po_no}.pdf`;

    const pdfDocument = (
        <Document>
            <PoInvoicePDF invoiceDetail={mockInvoiceDetail} poDetail={poDetail} />
        </Document>
    );

    return (
        <div className="w-full min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 flex flex-col h-screen">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        to={LOCAL_PATH_PREFIX + 'purchase-orders/' + poId + '/invoices'}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                        <i className="ki-solid ki-arrow-left text-2xl"></i>
                    </Link>

                    <h1 className="text-2xl font-bold text-gray-800">Purchase Order Invoice Preview</h1>
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
    );
}

export default POInvoicePrint;