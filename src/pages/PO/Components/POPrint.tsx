import { Document, Page, PDFViewer, Text, View, Image } from '@react-pdf/renderer';
import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom';
import useFetchPO from '../../../hook/useFetchPO';
import { styles } from '../styles/quotationPrintStyle';

const getCurrentDate = () => {
    const date = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
};

// const formatDate = (dateStr: string) => {
//     const [day, month, year] = dateStr.split("/");
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     return `${day} ${monthNames[parseInt(month) - 1]} ${year}`;
// };

// const convertToWords = (num: number) => {
//     const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
//     const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
//     const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

//     if (num < 10) {
//         return ones[num];
//     } else if (num >= 10 && num < 20) {
//         return teens[num - 10];
//     } else {
//         const tenPart = Math.floor(num / 10);
//         const onePart = num % 10;
//         return tens[tenPart] + (onePart > 0 ? "-" + ones[onePart] : "");
//     }
// }

function POPrint() {
    const { id } = useParams<{ id: string }>();
    const poId = id ? parseInt(id, 10) : null;
    const { po, loading, error } = useFetchPO(poId);

    useEffect(() => {


    }, []);

    // // Function to generate and download PDF
    // const downloadPDF = async () => {
    //     const doc = (
    //         <Document>
    //             <QuotationPDF />
    //             <TncPDF />
    //             <RenoAgreementPDF />
    //         </Document>
    //     );
    //     const blob = await pdf(doc).toBlob();
    //     const url = URL.createObjectURL(blob);
    //     const link = document.createElement('a');
    //     link.href = url;
    //     link.download = `${QUOTATION_NUMBER}_${ATTN_NAME.toUpperCase().replace(/\s+/g, '_')}.pdf`;
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link);
    //     URL.revokeObjectURL(url);
    // };

    // // Trigger download when orderDetail is loaded
    // useEffect(() => {
    //     if (!loading && orderDetail && !error && packageCategories.length > 0) {
    //         downloadPDF();
    //     }
    // }, [loading, orderDetail, error]);

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
    const ATTN_ADDRESS = `TEST_ADDRESS`;
    const ATTN_MOBILE = `+${po.vendor.country_code} ${po.vendor.phone_no}`;
    const ATTN_EMAIL = po.vendor.email;

    // // Calculate totals based on package unitPrice and qty
    // const totalItems = orderDetail.latest_quotation.packages.reduce((sum, item) => sum + item.quantity, 0);
    // const categoryTotals = orderDetail.latest_quotation.packages.reduce((acc, pkg) => {
    //     const category = pkg.category;
    //     const categoryTotal = pkg.total_price * (pkg.quantity || 1);

    //     if (!acc[category]) {
    //         acc[category] = { total_price: 0, quantity: 0 };
    //     }
    //     acc[category].total_price += categoryTotal;
    //     acc[category].quantity += pkg.quantity;

    //     return acc;
    // }, {});

    // const totalPriceBeforeDiscount = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total_price, 0);
    const totalPrice = po.total_amount;

    const QuotationPDF = () => (
        <Page size="A4" style={styles.page}>
            {/* Redesigned Company Header */}
            <View style={styles.companyHeader}>
                <View style={styles.companyInfo}>
                    <Text style={styles.companyTitle}>{COMPANY_NAME}</Text>
                    <Text style={styles.companyDetails}>
                        {COMPANY_ADDRESS}{'\n'}
                        {COMPANY_CITY_STATE}{'\n'}
                        Contact Number: {COMPANY_MOBILE}{'\n'}
                        Email: {COMPANY_EMAIL}
                    </Text>
                </View>
                <View>
                    {/* Placeholder for image (replace with actual Image component when logo is available) */}
                    <Image src={COMPANY_LOGO_URL} style={styles.companyImage} />
                </View>
            </View>

            {/* Redesigned Quotation Header */}
            <View style={styles.quotationHeader}>
                <Text style={styles.quotationTitle}>{ITEM_TITLE}</Text>
                <View style={styles.quotationDetails}>
                    <Text style={styles.quotationText}>Number: {ITEM_NUMBER}</Text>
                    <Text style={styles.quotationText}>Date: {ITEM_DATE}</Text>
                </View>
            </View>

            {/* Redesigned Attn Header */}
            <View style={styles.attnHeader}>
                <View style={styles.attnTitle}>
                    <Text style={styles.attnLabel}>Vendor:</Text>
                    <Text style={styles.attnText}>{ATTN_NAME}</Text>
                </View>
                <Text style={styles.attnText}>
                    {ATTN_ADDRESS}{'\n'}
                    {ATTN_MOBILE}{'\n'}
                    {ATTN_EMAIL}
                </Text>
            </View>

            {/* Quotation Body */}
            <View>
                {/* Package Table */}
                <View style={styles.packageTable}>
                    {/* Table Header */}
                    <View style={styles.thead}>
                        <Text style={styles.th1}>No</Text>
                        <Text style={styles.th2}>Description</Text>
                        <Text style={styles.th3}>QTY</Text>
                        <Text style={styles.th4}>UOM</Text>
                    </View>

                    {/* Package Rows */}
                    {po.po_packages.map((pkg, pkgIndex) => (
                        <View style={styles.packageRow} key={pkgIndex}>
                            {/* Package Set Row */}
                            <View style={styles.setRow}>
                                <Text style={[styles.td, styles.td1]}>{pkgIndex + 1}</Text>
                                <Text style={[styles.td, styles.td2]}>{pkg.name}</Text>
                                <Text style={[styles.td, styles.td3]}>{pkg.quantity}</Text>
                                <Text style={[styles.td, styles.td4]}>-</Text>
                            </View>

                            {/* Product Rows */}
                            {pkg.po_items.map((product) => (
                                <View style={styles.productRow} key={product.id}>
                                    <Text style={[styles.td, styles.td1]}>{''}</Text>
                                    <View style={styles.td2}>
                                        <Text style={styles.productItem}>{product.product_name}</Text>
                                        <Text style={styles.productDescription}>
                                            {product.product_desc}
                                        </Text>
                                    </View>
                                    <Text style={[styles.td, styles.td3]}>
                                        {product.qty}
                                    </Text>
                                    <Text style={[styles.td, styles.td4]}>{product.uom}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                {/* Bonus Table */}
                {/* {orderDetail.latest_quotation?.bonus &&
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
                } */}

                {/* Total Price Table */}
                <View wrap={false}>
                    <View style={styles.totalTable}>
                        <Text style={styles.totalTitle}>Total Amount:</Text>
                        <Text style={styles.totalValue}>RM {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        {/* {orderDetail.latest_quotation?.bonus && (
                            <Text style={styles.originalPrice}>
                                Original Price: RM {Number(totalPriceBeforeDiscount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        )} */}
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
        <div className='w-full h-full'>
            <PDFViewer width="100%" height="100%">
                <Document>
                    <QuotationPDF />
                    {/* <TncPDF />
                    <RenoAgreementPDF /> */}
                </Document>
            </PDFViewer>
        </div>
    )
}

export default POPrint