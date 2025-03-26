import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#fff',
        color: '#262626',
        fontFamily: 'Helvetica',
        fontSize: 10,
        padding: '20px 30px',
    },
    watermark: {
        position: 'absolute',
        fontSize: 140,
        color: '#000000',
        opacity: 0.1,
        transform: 'rotate(-45deg)',
        top: '42%',
        left: '12%',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    pageNumber: {
        position: 'absolute',
        bottom: 5,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 8,
    },
    companyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#272f48',
        marginBottom: 8,
    },
    companyInfo: {
        flexDirection: 'column',
        textAlign: 'right', // This should propagate to children, but we'll enforce it below
    },
    companyTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#272f48',
        marginBottom: 2,
        textAlign: 'right', // Explicitly set to right
    },
    companyReg: {
        fontSize: 8,
        color: '#787878',
        lineHeight: 1.2,
        textAlign: 'right',
    },
    companyDetails: {
        fontSize: 8,
        color: '#4b5563',
        lineHeight: 1.2,
        textAlign: 'right', // Already set, just confirming
    },
    companyImage: {
        width: "140px", // Reduced from 100px
        height: "80px",
        objectFit: "contain",
        borderRadius: 6, // Reduced from 8
    },
    quotationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 8, // Reduced from 12
        borderRadius: 6, // Reduced from 8
        marginBottom: 8, // Reduced from 12
    },
    quotationTitle: {
        fontSize: 14, // Reduced from 16
        fontWeight: 'bold',
        color: '#2563eb',
    },
    quotationDetails: {
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    quotationText: {
        fontSize: 8, // Reduced from 10
        color: '#4b5563',
        lineHeight: 1.2, // Reduced from 1.5
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4, // Reduced from 12
        gap: 4,
    },
    attnHeader: {
        flexDirection: 'column',
        padding: 8, // Reduced from 12
        borderWidth: 1,
        borderColor: '#ececec',
        borderRadius: 6, // Reduced from 8
        width: '100%',
    },
    unitHeader: {
        width: '100%',
        marginBottom: 8, // Reduced from 12
    },
    attnTitle: {
        flexDirection: 'row',
        marginRight: 2, // Reduced from 4
        alignItems: 'center',
    },
    attnLabel: {
        fontSize: 10, // Reduced from 12
        fontWeight: 'medium',
        marginBottom: 2, // Reduced from 4
        marginRight: 2, // Reduced from 4
    },
    vendorLabel: { color: '#d97706' },
    ownerLabel: { color: '#1d4ed8' },
    unitLabel: { color: '#047857' },
    attnText: {
        fontSize: 8, // Reduced from 10
        color: '#374151',
        lineHeight: 1.2, // Reduced from 1.5
    },
    headerTitle: {
        fontSize: 16, // Reduced from 18
        lineHeight: "24px", // Reduced from 32px
        fontWeight: "bold",
        color: "#272f48",
    },
    headerText: {
        fontSize: 12, // Reduced from 14
        lineHeight: "16px", // Reduced from 20px
        color: "#7a829b",
    },
    section: {
        margin: 5, // Reduced from 10
        padding: 5, // Reduced from 10
        flexGrow: 1,
    },
    packageTable: {
        width: "100%",
        marginBottom: 8, // Reduced from 12
    },
    thead: {
        flexDirection: "row",
        backgroundColor: "#f9f9f9",
        paddingBottom: 4, // Reduced from 8
        zIndex: 1,
    },
    th1: {
        width: "8%",
        textAlign: "left",
        fontSize: 8, // Reduced from 10
        paddingLeft: 4, // Reduced from 8
        paddingTop: 4, // Reduced from 8
        fontWeight: "medium",
        color: "#333",
    },
    th4: {
        width: "18%",
        textAlign: "left",
        fontSize: 8, // Reduced from 10
        paddingLeft: 6, // Reduced from 12
        paddingTop: 4, // Reduced from 8
        fontWeight: "medium",
        color: "#333",
    },
    th5: {
        width: "54%",
        textAlign: "left",
        fontSize: 8, // Reduced from 10
        paddingLeft: 6, // Reduced from 12
        paddingTop: 4, // Reduced from 8
        fontWeight: "medium",
        color: "#333",
    },
    th6: {
        width: "10%",
        textAlign: "center",
        fontSize: 8, // Reduced from 10
        paddingTop: 4, // Reduced from 8
        fontWeight: "medium",
        color: "#333",
    },
    th7: {
        width: "10%",
        textAlign: "center",
        fontSize: 8, // Reduced from 10
        paddingTop: 4, // Reduced from 8
        fontWeight: "medium",
        color: "#333",
    },
    packageRow: {
        marginBottom: 8, // Reduced from 12
    },
    setRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderColor: '#ececec',
        paddingVertical: 2, // Reduced from 4
    },
    td: {
        fontSize: 8, // Reduced from 10
        fontWeight: 'bold',
        color: '#555',
        paddingVertical: 1, // Reduced from 2
    },
    td1: { width: '8%', paddingLeft: 4 }, // Reduced from 8
    td4: { width: '18%', paddingLeft: 6, fontSize: 6 }, // Reduced from 12
    td5: { width: '54%', paddingLeft: 6 }, // Reduced from 12
    td6: { width: '10%', textAlign: 'center' },
    td7: { width: '10%', textAlign: 'center' },
    checkbox: {
        width: 8, // Reduced from 10
        height: 8,
        borderWidth: 1,
        borderColor: "#15803d",
        justifyContent: "center",
        alignItems: "center",
    },
    checkmark: {
        fontSize: 6, // Reduced from 8
        color: "#15803d",
    },
    emptyBox: {
        width: 8, // Reduced from 10
        height: 8,
        borderWidth: 1,
        borderColor: "#6b7280",
    },
    productRow: {
        flexDirection: 'row',
        paddingVertical: 2, // Reduced from 4
    },
    productItem: {
        fontSize: 7, // Reduced from 9
        color: '#666',
    },
    productDescription: {
        fontSize: 6, // Reduced from 8
        color: '#888',
        paddingLeft: 4, // Reduced from 8
    },
    productQty: {
        width: "10%",
        textAlign: "center",
        fontSize: 7, // Reduced from 9
        color: "#666",
    },
    productUom: {
        width: "10%",
        textAlign: "center",
        fontSize: 7, // Reduced from 9
        color: "#666",
    },
    summaryTable: {
        width: "100%",
        marginBottom: 8, // Reduced from 12
        backgroundColor: "#f9fafb",
        padding: 8, // Reduced from 12
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: "#9333ea",
    },
    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8, // Reduced from 12
    },
    summaryTitle: {
        fontSize: 12, // Reduced from 14
        fontWeight: "bold",
        color: "#7c3aed",
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#ffffff",
        padding: 8, // Reduced from 12
        borderRadius: 6, // Reduced from 8
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        marginBottom: 4, // Reduced from 8
    },
    summaryLabel: {
        fontSize: 8, // Reduced from 10
        color: "#4b5563",
        fontWeight: "medium",
    },
    summaryValue: {
        fontSize: 8, // Reduced from 10
        color: "#374151",
        fontWeight: "semibold",
    },
    bonusTable: {
        width: "100%",
        marginBottom: 8, // Reduced from 12
        backgroundColor: "#f5fafa",
        padding: 8, // Reduced from 12
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: "#14b8a6",
    },
    bonusTitle: {
        fontSize: 12, // Reduced from 14
        fontWeight: "bold",
        color: "#14b8a6",
        marginBottom: 4, // Reduced from 8
    },
    bonusList: {
        paddingLeft: 4, // Reduced from 8
    },
    bonusItem: {
        fontSize: 7, // Reduced from 9
        color: "#1f2937",
        fontWeight: "medium",
        marginBottom: 2, // Reduced from 4
        padding: 2, // Reduced from 4
        backgroundColor: "#e6fffa",
        borderRadius: 4,
    },
    bonusDiscountLabel: {
        fontSize: 8, // Reduced from 10
        color: "#4b5563",
        fontWeight: "medium",
        marginTop: 4, // Reduced from 8
    },
    bonusDiscountValue: {
        fontSize: 12, // Reduced from 14
        fontWeight: "bold",
        color: "#14b8a6",
    },
    totalTable: {
        width: "100%",
        marginBottom: 8, // Reduced from 12
        backgroundColor: "#f3f4f6",
        padding: 8, // Reduced from 12
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: "#3b82f6",
    },
    totalTitle: {
        fontSize: 10, // Reduced from 12
        fontWeight: "bold",
        color: "#2563eb",
        marginBottom: 2, // Reduced from 4
    },
    totalValue: {
        fontSize: 12, // Reduced from 14
        color: "#1f2937",
        fontWeight: "semibold",
    },
    originalPrice: {
        fontSize: 8, // Reduced from 10
        color: "#1f2937",
        marginTop: 2, // Reduced from 4
    },
    tncContainer: {
        flexDirection: 'column',
        padding: '20px 20px', // Reduced from 30px 30px
    },
    tncTitle: {
        fontSize: 12, // Reduced from 14
        fontWeight: 'bold',
        marginBottom: 10, // Reduced from 15
        textAlign: 'center',
        color: '#2563eb',
    },
    tncList: {
        flexDirection: 'column',
    },
    tncItem: {
        flexDirection: 'row',
        marginBottom: 6, // Reduced from 10
        pageBreakInside: 'avoid',
    },
    tncBullet: {
        fontSize: 8, // Reduced from 10
        width: 8, // Reduced from 10
        textAlign: 'center',
        marginRight: 3, // Reduced from 5
    },
    tncText: {
        fontSize: 8, // Reduced from 10
        lineHeight: 1.2, // Reduced from 1.5
        textAlign: 'justify',
        flex: 1,
    },
    agreementTitle: {
        fontSize: 12, // Reduced from 14
        fontWeight: 'bold',
        marginBottom: 10, // Reduced from 15
        textAlign: 'center',
        color: '#2563eb',
    },
    agreementContainer: {
        flexDirection: 'column',
        padding: '20px 20px', // Reduced from 30px 30px
    },
    agreementHeader: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 12, // Reduced from 20
        textAlign: 'center',
        gap: 8, // Reduced from 12
    },
    agreementSection: {
        marginBottom: 12, // Reduced from 20
    },
    agreementSubSection: {
        marginLeft: 12, // Reduced from 20
        marginTop: 3, // Reduced from 5
    },
    agreementText: {
        fontSize: 8, // Reduced from 10
        lineHeight: 1.2, // Reduced from 1.5
        textAlign: 'justify',
        marginBottom: 3, // Reduced from 5
    },
    agreementBold: {
        fontSize: 8, // Reduced from 10
        fontWeight: 'bold',
        marginBottom: 3, // Reduced from 5
    },
    agreementClause: {
        fontSize: 9, // Reduced from 11
        fontWeight: 'bold',
        marginVertical: 3, // Reduced from 5
        textDecoration: 'underline',
    },
    table: {
        width: '100%',
        marginTop: 6, // Reduced from 10
        borderWidth: 1,
        borderColor: '#ececec',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ececec',
    },
    tableHeader: {
        fontSize: 8, // Reduced from 10
        fontWeight: 'bold',
        padding: 3, // Reduced from 5
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#ececec',
    },
    tableCell: {
        fontSize: 7, // Reduced from 9
        padding: 3, // Reduced from 5
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#ececec',
    },
    bold: {
        fontWeight: 'bold',
    },

    packageCard: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#ffffff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ececec',
    },
    packageHeader: {
        marginBottom: 4,
        flexDirection: 'row',    // Keep vertical stacking
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    packageTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333',
    },
    packageDetail: {
        fontSize: 8,
        color: '#555',
        padding: 6,
        borderRadius: 4,
        marginBottom: 4,
    },
    quantityBadge: {
        backgroundColor: '#EFEFEF', // Blue background for contrast
        borderRadius: 10,           // Rounded corners for badge effect
        paddingVertical: 4,         // Vertical padding
        paddingHorizontal: 8,       // Horizontal padding
        marginTop: 2,               // Space from S.o.W text
    },
    quantityBadgeText: {
        fontSize: 8,                // Matches packageDetail size
        fontWeight: 'semibold',         // Bold for emphasis
        textAlign: 'center',        // Center the number
    },
    itemTable: {
        width: '100%',
    },
    itemHeader: {
        flexDirection: 'row',
        backgroundColor: '#EFEFEF',
        paddingVertical: 4,
        borderRadius: 4,
    },
    itemTh: {
        fontSize: 8,
        fontWeight: 'medium',
        color: '#333',
        textAlign: 'left',
        paddingLeft: 4,
    },
    itemRow: {
        flexDirection: 'row',
        paddingVertical: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#ececec',
    },
    itemTd: {
        fontSize: 7,
        color: '#666',
        paddingLeft: 4,
    },
    itemTdSecondary: {
        fontSize: 6,           // Smaller than itemTd (7) for subtlety
        color: '#888',         // Lighter than #666 for less emphasis
        paddingLeft: 8,        // Consistent with itemTd
        fontWeight: 'normal',  // Ensure it’s not bold (optional, depending on fontFamily)
    },
});