import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#fff',
        color: '#262626',
        fontFamily: 'Helvetica',
        fontSize: 12,
        padding: '30px 50px'
    },
    pageNumber: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 10,
    },
    companyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Align items vertically centered
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#272f48', // Darker line for separation
        marginBottom: 12,
    },
    companyInfo: {
        flexDirection: 'column',
    },
    companyTitle: {
        fontSize: 20, // Slightly larger for emphasis
        fontWeight: 'bold',
        color: '#272f48',
        marginBottom: 4,
    },
    companyDetails: {
        fontSize: 10, // Smaller for a cleaner look
        color: '#4b5563', // Softer gray for secondary info
        lineHeight: 1.5,
    },
    companyImage: {
        width: "100px", // Slightly smaller for balance
        height: "100px",
        objectFit: "contain",
        borderRadius: 8,
        // borderWidth: 1,
        // borderColor: '#ececec', // Subtle border
    },

    quotationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb', // Light gray background for contrast
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    quotationTitle: {
        fontSize: 16, // Slightly smaller but bold
        fontWeight: 'bold',
        color: '#2563eb', // Blue for emphasis
    },
    quotationDetails: {
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    quotationText: {
        fontSize: 10,
        color: '#4b5563',
        lineHeight: 1.5,
    },

    // Row for Vendor and Owner headers
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    // Base attnHeader style (for Vendor and Owner)
    attnHeader: {
        flexDirection: 'column',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ececec',
        borderRadius: 8,
        width: '48%', // For Vendor and Owner in the row
    },

    // Specific style for Unit Header to ensure full width
    unitHeader: {
        width: '100%', // Explicitly full width
        marginBottom: 12,
    },

    attnTitle: {
        flexDirection: 'row',
        marginRight: 4,
        alignItems: 'center',
    },

    // Base label style
    attnLabel: {
        fontSize: 12,
        fontWeight: 'medium',
        marginBottom: 4,
        marginRight: 4,
    },

    // Specific label colors
    vendorLabel: {
        color: '#d97706', // Amber for Vendor
    },
    ownerLabel: {
        color: '#1d4ed8', // Blue for Owner
    },
    unitLabel: {
        color: '#047857', // Green for Unit
    },

    attnText: {
        fontSize: 10,
        color: '#374151',
        lineHeight: 1.5,
    },
    headerTitle: {
        fontSize: 18,
        lineHeight: "32px",
        fontWeight: "bold",
        color: "#272f48",
    },
    headerText: {
        fontSize: 14,
        lineHeight: "20px",
        color: "#7a829b",
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1
    },
    // Package Table (unchanged)
    packageTable: {
        width: "100%",
        marginBottom: 12,
    },
    thead: {
        flexDirection: "row",
        backgroundColor: "#f9f9f9",
        paddingBottom: 8,
    },
    th1: {
        width: "8%", // S.o.W
        textAlign: "left",
        fontSize: 10,
        paddingLeft: 8,
        paddingTop: 8,
        fontWeight: "medium",
        color: "#333",
    },
    th2: {
        // Supply header
        width: "8%",
        textAlign: "center",
        fontSize: 10,
        paddingTop: 8,
        fontWeight: "medium",
        color: "#333",
    },
    th3: {
        // Install header
        width: "8%",
        textAlign: "center",
        fontSize: 10,
        paddingTop: 8,
        fontWeight: "medium",
        color: "#333",
    },
    th4: { // Description
        width: "56%",
        textAlign: "left",
        fontSize: 10,
        paddingLeft: 12,
        paddingTop: 8,
        fontWeight: "medium",
        color: "#333",
    },
    th5: { // QTY
        width: "10%",
        textAlign: "center",
        fontSize: 10,
        paddingTop: 8,
        fontWeight: "medium",
        color: "#333",
    },
    th6: { // UOM
        width: "10%",
        textAlign: "center",
        fontSize: 10,
        paddingTop: 8,
        fontWeight: "medium",
        color: "#333",
    },

    packageRow: {
        marginBottom: 12,
    },
    setRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderColor: '#ececec',
        paddingVertical: 4,
    },
    td: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#555',
        paddingVertical: 2,
    },
    td1: {
        width: '8%', // S.o.W
        textAlign: 'center',
        paddingLeft: 8,
    },
    td2: {
        // Supply cell
        width: "8%",
        textAlign: "center",
        fontSize: 12, // Slightly larger for emphasis
        fontFamily: "Helvetica",
        paddingVertical: 2,
        color: "#15803d", // Green for "Yes"
    },
    td3: {
        // Install cell
        width: "8%",
        textAlign: "center",
        fontSize: 12,
        fontFamily: "Helvetica",
        paddingVertical: 2,
        color: "#15803d", // Green for "Yes"
    },
    td4: { // Description
        width: '56%',
        paddingLeft: 12,
    },
    td5: { // QTY
        width: '10%',
        textAlign: 'center',
    },
    td6: { // UOM
        width: '10%',
        textAlign: 'center',
    },
    checkbox: {
        width: 10,
        height: 10,
        borderWidth: 1,
        borderColor: "#15803d",
        justifyContent: "center",
        alignItems: "center",
    },
    checkmark: {
        fontSize: 8,
        color: "#15803d",
    },
    emptyBox: {
        width: 10,
        height: 10,
        borderWidth: 1,
        borderColor: "#6b7280",
    },

    productRow: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    productItem: {
        fontSize: 9,
        color: '#666',
    },
    productDescription: {
        fontSize: 8,
        color: '#888',
        paddingLeft: 8,
    },

    productQty: {
        width: "10%",
        textAlign: "center",
        fontSize: 9,
        color: "#666",
    },
    productUom: {
        width: "10%",
        textAlign: "center",
        fontSize: 9,
        color: "#666",
    },

    // Category Summary Table
    summaryTable: {
        width: "100%",
        marginBottom: 12,
        backgroundColor: "#f9fafb", // bg-gray-50 equivalent
        padding: 12,
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: "#9333ea", // purple-500 equivalent
    },
    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    summaryTitle: {
        fontSize: 14, // text-xl equivalent (scaled down for PDF)
        fontWeight: "bold",
        color: "#7c3aed", // purple-600 equivalent
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#ffffff", // bg-white
        padding: 12,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2, // shadow-xs equivalent (no hover in PDF, so static shadow)
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 10, // text-sm
        color: "#4b5563", // gray-600
        fontWeight: "medium",
    },
    summaryValue: {
        fontSize: 10, // text-sm
        color: "#374151", // gray-700
        fontWeight: "semibold",
    },

    // Bonus Table (unchanged)
    bonusTable: {
        width: "100%",
        marginBottom: 12,
        backgroundColor: "#f5fafa",
        padding: 12,
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: "#14b8a6",
    },
    bonusTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#14b8a6",
        marginBottom: 8,
    },
    bonusList: {
        paddingLeft: 8,
    },
    bonusItem: {
        fontSize: 9,
        color: "#1f2937",
        fontWeight: "medium",
        marginBottom: 4,
        padding: 4,
        backgroundColor: "#e6fffa",
        borderRadius: 4,
    },
    bonusDiscountLabel: {
        fontSize: 10,
        color: "#4b5563",
        fontWeight: "medium",
        marginTop: 8,
    },
    bonusDiscountValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#14b8a6",
    },

    // Total Price Table
    totalTable: {
        width: "100%",
        marginBottom: 12,
        backgroundColor: "#f3f4f6", // bg-gray-100 equivalent
        padding: 12,
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: "#3b82f6", // blue-500 equivalent
    },
    totalTitle: {
        fontSize: 12, // text-lg equivalent (scaled down for PDF)
        fontWeight: "bold",
        color: "#2563eb", // blue-600 equivalent
        marginBottom: 4,
    },
    totalValue: {
        fontSize: 14, // text-xl equivalent (scaled down)
        color: "#1f2937", // gray-900
        fontWeight: "semibold",
    },
    originalPrice: {
        fontSize: 10, // text-sm
        color: "#1f2937", // gray-900
        marginTop: 4,
    },
    // TNC
    tncContainer: {
        flexDirection: 'column',
        padding: '30px 30px',
    },
    tncTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#2563eb', // Matches quotationTitle for consistency
    },
    tncList: {
        flexDirection: 'column',
    },
    tncItem: {
        flexDirection: 'row',
        marginBottom: 10,
        pageBreakInside: 'avoid', // Prevents splitting individual items across pages
    },
    tncBullet: {
        fontSize: 10,
        width: 10,
        textAlign: 'center',
        marginRight: 5,
    },
    tncText: {
        fontSize: 10,
        lineHeight: 1.5,
        textAlign: 'justify',
        flex: 1,
    },
    // Reno Agreement
    agreementTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#2563eb', // Matches quotationTitle for consistency
    },
    agreementContainer: {
        flexDirection: 'column',
        padding: '30px 30px',
    },
    agreementHeader: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 20,
        textAlign: 'center',
        gap: 12,
    },
    agreementSection: {
        marginBottom: 20,
    },
    agreementSubSection: {
        marginLeft: 20,
        marginTop: 5,
    },
    agreementText: {
        fontSize: 10,
        lineHeight: 1.5,
        textAlign: 'justify',
        marginBottom: 5,
    },
    agreementBold: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    agreementClause: {
        fontSize: 11,
        fontWeight: 'bold',
        marginVertical: 5,
        textDecoration: 'underline',
    },
    table: {
        width: '100%',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#ececec',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ececec',
    },
    tableHeader: {
        fontSize: 10,
        fontWeight: 'bold',
        padding: 5,
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#ececec',
    },
    tableCell: {
        fontSize: 9,
        padding: 5,
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#ececec',
    },
    bold: {
        fontWeight: 'bold',
    },
});