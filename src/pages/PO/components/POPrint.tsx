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
    const { po, loading, error } = useFetchPO(poId);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
    );
    if (error) return <p>Error fetching order.</p>;
    if (!po) return <p>No order found.</p>;

    const COMPANY_NAME = "RenoXpert Sdn Bhd";
    const COMPANY_ADDRESS = "No. 42-46, Ground Floor, Jalan SS 19/1D";
    const COMPANY_CITY_STATE = "Subang Jaya, Selangor, 46500";
    const COMPANY_MOBILE = "03-58789831";
    const COMPANY_EMAIL = "sales@renoxpert.my";
    const COMPANY_LOGO_URL = "/public/app/RenoExpert_logo-01.jpg";

    // Define constants for quotationHeader
    const ITEM_TITLE = "Purchase Order";
    const ITEM_NUMBER = po.po_no;
    const ITEM_DATE = getCurrentDate();


    const ATTN_NAME = po.vendor.name;
    // const ATTN_ADDRESS = `${po.vendor.address.address_1}, ${po.vendor.address.address_2}, ${po.vendor.address.city}, ${po.vendor.address.state}, ${po.vendor.address.postcode}`;
    const ATTN_ADDRESS = `-`;
    const ATTN_MOBILE = `+${po.vendor.country_code} ${po.vendor.phone_no}`;
    const ATTN_EMAIL = po.vendor.email;

    const OWNER_ADDRESS = po.sale ? [
        po.sale.order.user.address.address_1,
        po.sale.order.user.address.address_2,
        po.sale.order.user.address.city,
        po.sale.order.user.address.state,
        po.sale.order.user.address.postcode
    ]
        .filter(value => value) // Removes null, undefined, and empty strings
        .join(", ") || "N/A"
        :
        'N/A'; // Default to "N/A" if all values are empty

    const OWNER_NAME = po.sale ? po.sale.order.user.name : 'N/A';
    const OWNER_COUNTRY_CODE = po.sale ? po.sale.order.user.country_code : '';
    const OWNER_MOBILE = po.sale ? po.sale.order.user.phone_no : 'N/A';
    const OWNER_EMAIL = po.sale ? po.sale.order.user.email : 'N/A';

    const UNIT_NO = po.sale ? `${po.sale.order.block}-${po.sale.order.floor}-${po.sale.order.unit_no}` : 'N/A';
    const PROPERTY_NAME = po.sale ? po.sale.order.property.name : 'N/A';
    const UNIT_TYPE = po.sale ? (po.sale.order.unit_type || "N/A") : 'N/A';
    const PROPERTY_ADDRESS = po.sale ? [
        po.sale.order.property.address,
        po.sale.order.property.street,
        po.sale.order.property.postcode,
        po.sale.order.property.city,
        po.sale.order.property.state,
    ]
        .filter(Boolean)
        .join(', ') || "N/A"
        :
        'N/A';

    const totalPrice = po.total_amount;

    const QuotationPDF = () => (
        <Page size="A4" style={styles.page}>
            {/* Redesigned Company Header */}
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

            {/* Quotation Body */}
            <View>
                <View style={styles.packageTable}>
                    <View style={styles.thead}>
                        <Text style={styles.th1}>No</Text>
                        <Text style={styles.th4}>S.o.W</Text>
                        <Text style={styles.th5}>Description</Text>
                        <Text style={styles.th6}>QTY</Text>
                        <Text style={styles.th7}>UOM</Text>
                    </View>
                    {po.po_packages.map((pkg, pkgIndex) => (
                        <View style={styles.packageRow} key={pkgIndex}>
                            <View style={styles.setRow}>
                                <Text style={[styles.td, styles.td1]}>{pkgIndex + 1}</Text>
                                <Text style={[styles.td, styles.td4]}>{pkg.sow || '-'}</Text>
                                <Text style={[styles.td, styles.td5]}>{pkg.name}</Text>
                                <Text style={[styles.td, styles.td6]}>{pkg.quantity}</Text>
                                <Text style={[styles.td, styles.td7]}>-</Text>
                            </View>
                            {pkg.po_items.map((product) => (
                                <View style={styles.productRow} key={product.id}>
                                    <Text style={[styles.td, styles.td1]}>{''}</Text>
                                    <Text style={[styles.td, styles.td4]}>
                                        {(product.supply && product.install) ? 'Supply and Install' :
                                            (!product.supply && !product.install) ? '-' :
                                                (product.supply && !product.install) ? 'Supply Only' :
                                                    (!product.supply && product.install) ? 'Install Only' : '-'}
                                    </Text>
                                    <View style={[styles.td, styles.td5]}>
                                        <Text style={styles.productItem}>{product.product_name}</Text>
                                        <Text style={styles.productDescription}>
                                            {product.product_desc}
                                        </Text>
                                    </View>
                                    <Text style={[styles.td, styles.td6]}>{product.qty}</Text>
                                    <Text style={[styles.td, styles.td7]}>{product.uom}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                {/* Total Price Table */}
                <View wrap={false}>
                    <View style={styles.totalTable}>
                        <Text style={styles.totalTitle}>Total Amount:</Text>
                        <Text style={styles.totalValue}>RM {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </View>
                </View>
            </View>

            {/* Page Number */}
            <Text
                style={styles.pageNumber}
                render={({ pageNumber, totalPages }) => `${pageNumber}`}
                fixed
            />

            {po.order_status === "unreleased" && (
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
    )
}

export default POPrint