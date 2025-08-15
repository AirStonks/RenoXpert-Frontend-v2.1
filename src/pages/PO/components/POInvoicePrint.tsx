// import { Document, Page, PDFDownloadLink, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
// import { useParams } from 'react-router-dom';
// import { PDFViewer } from '@react-pdf/renderer';
// import { Link } from 'react-router-dom';
// import useFetchInvoice from '../../../hook/useFetchInvoice';
// import { Invoice, POPackage, PurchaseOrder } from '../../../types';
// import { useEffect, useState } from 'react';
// import { styles } from '../styles/poInvoicePrintStyle';

// const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

// const MEDIA_URL =
//     import.meta.env.VITE_APP_ENV === "local"
//         ? '/public/media/'
//         : '/media/';

// const getCurrentDate = () => {
//     const date = new Date();
//     const options = { day: '2-digit', month: 'short', year: 'numeric' };
//     return date.toLocaleDateString('en-GB', options as Intl.DateTimeFormatOptions);
// };

// const formatDate = (dateStr: string) => {
//     const [day, month, year] = dateStr.split("/");
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     return `${day} ${monthNames[parseInt(month) - 1]} ${year}`;
// };

// // Separate the PDF content into its own component
// const PoPDF = ({ invoiceDetail, poDetail }: { invoiceDetail: Invoice; poDetail: PurchaseOrder }) => {
//     const COMPANY_NAME = "RenoXpert Sdn Bhd";
//     const COMPANY_REG = "202401032588 (1578437-W)";
//     const COMPANY_ADDRESS = "No. 42-46, Ground Floor, Jalan SS 19/1D";
//     const COMPANY_CITY_STATE = "Subang Jaya, Selangor, 46500";
//     const COMPANY_MOBILE = "03-58789831";
//     const COMPANY_EMAIL = "sales@renoxpert.my";
//     const COMPANY_LOGO_URL = MEDIA_URL + "app/RenoExpert_logo-01.jpg";

//     const ITEM_TITLE = invoiceDetail.status === 'paid' ? "Receipt" : "Invoice";
//     const ITEM_NUMBER = invoiceDetail.invoice_no;
//     const ITEM_DATE_LABEL = invoiceDetail.status === 'paid' ? 'Receipt Date' : 'Date';
//     const ITEM_DATE = invoiceDetail.status === 'paid' ? formatDate(invoiceDetail.updated_at) : getCurrentDate();

//     const ATTN_NAME = poDetail.vendor.name;
//     const ATTN_ADDRESS = `-`;
//     const ATTN_MOBILE = `+${poDetail.vendor.country_code} ${poDetail.vendor.phone_no}`;
//     const ATTN_EMAIL = poDetail.vendor.email;

//     const OWNER_ADDRESS = poDetail.sale ? [
//         poDetail.sale.order.user.address.address_1,
//         poDetail.sale.order.user.address.address_2,
//         poDetail.sale.order.user.address.city,
//         poDetail.sale.order.user.address.state,
//         poDetail.sale.order.user.address.postcode
//     ].filter(value => value).join(", ") || "N/A" : 'N/A';

//     const OWNER_NAME = poDetail.sale ? poDetail.sale.order.user.name : 'N/A';
//     const OWNER_COUNTRY_CODE = poDetail.sale ? poDetail.sale.order.user.country_code : '';
//     const OWNER_MOBILE = poDetail.sale ? poDetail.sale.order.user.phone_no : 'N/A';
//     const OWNER_EMAIL = poDetail.sale ? poDetail.sale.order.user.email : 'N/A';

//     const UNIT_NO = poDetail.sale ? `${poDetail.sale.order.block}-${poDetail.sale.order.floor}-${poDetail.sale.order.unit_no}` : 'N/A';
//     const PROPERTY_NAME = poDetail.sale ? poDetail.sale.order.property.name : 'N/A';
//     const UNIT_TYPE = poDetail.sale ? (poDetail.sale.order.unit_type || "N/A") : 'N/A';
//     const PROPERTY_ADDRESS = poDetail.sale ? [
//         poDetail.sale.order.property.address,
//         poDetail.sale.order.property.street,
//         poDetail.sale.order.property.postcode,
//         poDetail.sale.order.property.city,
//         poDetail.sale.order.property.state,
//     ].filter(Boolean).join(', ') || "N/A" : 'N/A';

//     const totalPrice = poDetail.total_amount;

//     return (
//         <Page size="A4" style={styles.page}>
//             <View style={styles.companyHeader}>
//                 <View>
//                     <Image src={COMPANY_LOGO_URL} style={styles.companyImage} />
//                 </View>
//                 <View style={styles.companyInfo}>
//                     <View style={{ alignItems: 'flex-end' }}>
//                         <Text style={styles.companyTitle}>{COMPANY_NAME}</Text>
//                     </View>
//                     <View style={{ alignItems: 'flex-end' }}>
//                         <Text style={styles.companyReg}>Reg No: {COMPANY_REG}</Text>
//                     </View>
//                     <Text style={styles.companyDetails}>
//                         {COMPANY_ADDRESS}{'\n'}
//                         {COMPANY_CITY_STATE}{'\n'}
//                         Contact Number: {COMPANY_MOBILE}{'\n'}
//                         Email: {COMPANY_EMAIL}
//                     </Text>
//                 </View>
//             </View>

//             <View style={styles.quotationHeader}>
//                 <Text style={styles.quotationTitle}>{ITEM_TITLE}</Text>
//                 <View style={styles.quotationDetails}>
//                     <Text style={styles.quotationText}>Number: {ITEM_NUMBER}</Text>
//                     <Text style={styles.quotationText}>{ITEM_DATE_LABEL}: {ITEM_DATE}</Text>
//                 </View>
//             </View>

//             <View style={styles.headerRow}>
//                 <View style={styles.attnHeader}>
//                     <View style={styles.attnTitle}>
//                         <Text style={[styles.attnLabel, styles.vendorLabel]}>Vendor:</Text>
//                     </View>
//                     <Text style={styles.attnText}>{ATTN_NAME}</Text>
//                     <Text style={styles.attnText}>
//                         {ATTN_ADDRESS}{'\n'}
//                         {ATTN_MOBILE}{'\n'}
//                         {ATTN_EMAIL}
//                     </Text>
//                 </View>
//                 <View style={styles.attnHeader}>
//                     <View style={styles.attnTitle}>
//                         <Text style={[styles.attnLabel, styles.ownerLabel]}>Owner:</Text>
//                     </View>
//                     <Text style={styles.attnText}>{OWNER_NAME}</Text>
//                     <Text style={styles.attnText}>
//                         {OWNER_ADDRESS}{'\n'}
//                         +{OWNER_COUNTRY_CODE} {OWNER_MOBILE}{'\n'}
//                         {OWNER_EMAIL}
//                     </Text>
//                 </View>
//             </View>

//             <View style={[styles.attnHeader, styles.unitHeader]}>
//                 <View style={styles.attnTitle}>
//                     <Text style={[styles.attnLabel, styles.unitLabel]}>Unit:</Text>
//                 </View>
//                 <Text style={styles.attnText}>
//                     Unit No: {UNIT_NO}{'\n'}
//                     Property Name: {PROPERTY_NAME}{'\n'}
//                     Unit Type: {UNIT_TYPE}{'\n'}
//                     Address: {PROPERTY_ADDRESS}
//                 </Text>
//             </View>

//             {poDetail.po_packages.map((pkg: POPackage, pkgIndex: number) => (
//                 <View style={styles.packageCard} key={pkgIndex} wrap={false}>
//                     <View style={styles.packageHeader}>
//                         <Text style={styles.packageTitle}>Package {pkgIndex + 1}: {pkg.name}</Text>
//                         <View style={styles.quantityBadge}>
//                             <Text style={styles.quantityBadgeText}>Quantity: {pkg.quantity}</Text>
//                         </View>
//                     </View>
//                 </View>
//             ))}

//             <View wrap={false}>
//                 <View style={styles.totalTable}>
//                     <Text style={styles.totalTitle}>Total Amount:</Text>
//                     <Text style={styles.totalValue}>RM {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
//                 </View>
//             </View>

//             <Text
//                 style={styles.pageNumber}
//                 render={({ pageNumber, totalPages }) => `${pageNumber}`}
//                 fixed
//             />

//             {poDetail.order_status === "unreleased" && (
//                 <Text
//                     style={styles.watermark}
//                     fixed
//                 >
//                     DRAFT
//                 </Text>
//             )}
//         </Page>
//     );
// };

// // Custom styles to hide PDFViewer toolbar
// const viewerStyles = StyleSheet.create({
//     viewer: {
//         width: '100%',
//         height: '100%',
//         border: 'none',
//     },
// });

// function POInvoicePrint() {
//     const { id, invId } = useParams<{ id: string, invId: string }>();
//     const poId = id ? parseInt(id, 10) : null;
//     const invoiceId = invId ? parseInt(invId, 10) : null;
//     const { invoiceDetail, loading, error } = useFetchInvoice(invoiceId);

//     const [poDetail, setPoDetail] = useState<PurchaseOrder>(null);

//     useEffect(() => {
//         if (invoiceDetail) {
//             setPoDetail(invoiceDetail.po);
//         }
//     }, [invoiceDetail]);

//     if (loading) return (
//         <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600" />
//         </div>
//     );
//     if (error) return (
//         <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
//             <p className="text-red-600 text-lg font-semibold">Error fetching order.</p>
//         </div>
//     );
//     if (!poDetail) return (
//         <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
//             <p className="text-gray-600 text-lg font-semibold">No Invoice found.</p>
//         </div>
//     );

//     const fileName = `PURCHASE_ORDER_${poDetail.po_no}.pdf`;

//     const pdfDocument = (
//         <Document>
//             <PoPDF invoiceDetail={invoiceDetail} poDetail={poDetail} />
//         </Document>
//     );

//     return (
//         <div className="w-full min-h-screen bg-gray-100">
//             <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 flex flex-col h-screen">
//                 {/* Header */}
//                 <div className="flex items-center gap-4 mb-6">
//                     {/* Back */}
//                     <Link
//                         to={LOCAL_PATH_PREFIX + 'purchase-orders/' + poId + '/invoices'}
//                         className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
//                     >
//                         <i className="ki-solid ki-arrow-left text-2xl"></i>
//                     </Link>

//                     <h1 className="text-2xl font-bold text-gray-800">PO Invoice Preview</h1>
//                 </div>

//                 {/* Download Button */}
//                 <div className="mb-6">
//                     <PDFDownloadLink
//                         document={pdfDocument}
//                         fileName={fileName}
//                     >
//                         {({ loading }) => (
//                             <button
//                                 className={`w-full sm:w-auto px-6 py-3 rounded-lg text-white font-semibold transition-colors duration-200 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
//                                     }`}
//                                 disabled={loading}
//                             >
//                                 {loading ? 'Generating PDF...' : 'Download PDF'}
//                             </button>
//                         )}
//                     </PDFDownloadLink>
//                 </div>

//                 {/* PDF Preview (Always Visible, Fills Remaining Space) */}
//                 <div className="w-full flex-1 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md">
//                     <PDFViewer
//                         width="100%"
//                         height="100%"
//                         style={viewerStyles.viewer}
//                         showToolbar={false} // Hides the default toolbar with download button
//                     >
//                         {pdfDocument}
//                     </PDFViewer>
//                 </div>
//             </div>
//         </div>
//     );


// }

// export default POInvoicePrint;