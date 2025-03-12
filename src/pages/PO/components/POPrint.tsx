import { Document, Page, PDFViewer, Text, View, Image } from '@react-pdf/renderer';
import { useParams } from 'react-router-dom';
import useFetchPO from '../../../hook/useFetchPO';
import { styles } from '../styles/quotationPrintStyle';

const getCurrentDate = () => {
    const date = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
};

function POPrint() {
    const { id } = useParams<{ id: string }>();
    const poId = id ? parseInt(id, 10) : null;
    const { poDetail, loading, error } = useFetchPO(poId);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
    );
    if (error) return <p>Error fetching order.</p>;
    if (!poDetail) return <p>No order found.</p>;

    const COMPANY_NAME = "RenoXpert Sdn Bhd";
    const COMPANY_ADDRESS = "No. 42-46, Ground Floor, Jalan SS 19/1D";
    const COMPANY_CITY_STATE = "Subang Jaya, Selangor, 46500";
    const COMPANY_MOBILE = "03-58789831";
    const COMPANY_EMAIL = "sales@renoxpert.my";
    const COMPANY_LOGO_URL = "/public/app/RenoExpert_logo-01.jpg";

    const ITEM_TITLE = "Purchase Order";
    const ITEM_NUMBER = poDetail.po_no;
    const ITEM_DATE = getCurrentDate();

    const ATTN_NAME = poDetail.vendor.name;
    const ATTN_ADDRESS = `-`;
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

    const QuotationPDF = () => (
        <Page size="A4" style={styles.page}>
            {/* Company Header */}
            <View style={styles.companyHeader}>
                <View>
                    <Image src={COMPANY_LOGO_URL} style={styles.companyImage} />
                </View>
                <View style={styles.companyInfo}>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.companyTitle}>{COMPANY_NAME}</Text>
                    </View>
                    <Text style={styles.companyDetails}>
                        {COMPANY_ADDRESS}{'\n'}
                        {COMPANY_CITY_STATE}{'\n'}
                        Contact Number: {COMPANY_MOBILE}{'\n'}
                        Email: {COMPANY_EMAIL}
                    </Text>
                </View>
            </View>

            {/* Quotation Header */}
            <View style={styles.quotationHeader}>
                <Text style={styles.quotationTitle}>{ITEM_TITLE}</Text>
                <View style={styles.quotationDetails}>
                    <Text style={styles.quotationText}>Number: {ITEM_NUMBER}</Text>
                    <Text style={styles.quotationText}>Created Date: {ITEM_DATE}</Text>
                </View>
            </View>

            {/* Vendor and Owner Headers */}
            <View style={styles.headerRow}>
                <View style={styles.attnHeader}>
                    <View style={styles.attnTitle}>
                        <Text style={[styles.attnLabel, styles.vendorLabel]}>Vendor:</Text>
                    </View>
                    <Text style={styles.attnText}>{ATTN_NAME}</Text>
                    <Text style={styles.attnText}>
                        {ATTN_ADDRESS}{'\n'}
                        {ATTN_MOBILE}{'\n'}
                        {ATTN_EMAIL}
                    </Text>
                </View>
                <View style={styles.attnHeader}>
                    <View style={styles.attnTitle}>
                        <Text style={[styles.attnLabel, styles.ownerLabel]}>Owner:</Text>
                    </View>
                    <Text style={styles.attnText}>{OWNER_NAME}</Text>
                    <Text style={styles.attnText}>
                        {OWNER_ADDRESS}{'\n'}
                        +{OWNER_COUNTRY_CODE} {OWNER_MOBILE}{'\n'}
                        {OWNER_EMAIL}
                    </Text>
                </View>
            </View>

            {/* Unit Header */}
            <View style={[styles.attnHeader, styles.unitHeader]}>
                <View style={styles.attnTitle}>
                    <Text style={[styles.attnLabel, styles.unitLabel]}>Unit:</Text>
                </View>
                <Text style={styles.attnText}>
                    Unit No: {UNIT_NO}{'\n'}
                    Property Name: {PROPERTY_NAME}{'\n'}
                    Unit Type: {UNIT_TYPE}{'\n'}
                    Address: {PROPERTY_ADDRESS}
                </Text>
            </View>

            {/* Package Cards */}
            {poDetail.po_packages.map((pkg, pkgIndex) => (
                <View style={styles.packageCard} key={pkgIndex} wrap={false}>
                    <View style={styles.packageHeader}>
                        <Text style={styles.packageTitle}>Package {pkgIndex + 1}: {pkg.name}</Text>
                        <View style={styles.quantityBadge}>
                            <Text style={styles.quantityBadgeText}>Quantity: {pkg.quantity}</Text>
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
                        {pkg.po_items.map((product) => (
                            <View style={styles.itemRow} key={product.id}>
                                <View style={{ flex: 2 }}>
                                    <Text style={styles.itemTd}>
                                        {(product.supply && product.install) ? 'Supply and Install' :
                                            (!product.supply && !product.install) ? '-' :
                                                (product.supply && !product.install) ? 'Supply Only' :
                                                    (!product.supply && product.install) ? 'Install Only' : '-'}
                                    </Text>
                                </View>
                                <View style={{ flex: 6 }}>
                                    <Text style={styles.itemTd}>{product.product_name}</Text>
                                    <Text style={styles.itemTdSecondary}>{product.product_desc}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemTd}>{product.qty}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemTd}>{product.uom}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            ))}

            {/* Total Price Table */}
            <View wrap={false}>
                <View style={styles.totalTable}>
                    <Text style={styles.totalTitle}>Total Amount:</Text>
                    <Text style={styles.totalValue}>RM {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </View>
            </View>

            {/* Page Number */}
            <Text
                style={styles.pageNumber}
                render={({ pageNumber, totalPages }) => `${pageNumber}`}
                fixed
            />

            {poDetail.order_status === "unreleased" && (
                <Text
                    style={styles.watermark}
                    fixed
                >
                    DRAFT
                </Text>
            )}
        </Page>
    );

    return (
        <div className='w-full h-full'>
            <PDFViewer width="100%" height="100%">
                <Document>
                    <QuotationPDF />
                </Document>
            </PDFViewer>
        </div>
    );
}

export default POPrint;