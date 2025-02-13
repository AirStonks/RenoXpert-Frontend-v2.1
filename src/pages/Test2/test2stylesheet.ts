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
    companyImage: {
        width: "128px",
        height: "128px",
        objectFit: "contain",
        borderRadius: 8
    },
    companyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    quotationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    attnHeader: {
        marginBottom: 12
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
    table: {
        width: "100%",
        marginBottom: 8
    },
    thead: {
        flexDirection: "row",
        border: 1,
        borderColor: "#e4e4e4",
    },
    th1: {
        width: '10%',
        textAlign: 'left',
        fontSize: '11px',
        paddingBottom: '10px',
        paddingTop: '10px',
        marginLeft: '11px',
    },
    th2: {
        width: '70%',
        textAlign: 'left',
        fontSize: '11px',
        borderLeft: 1,
        borderColor: '#e4e4e4',
        paddingBottom: '10px',
        paddingTop: '10px',
        paddingLeft: '11px',
    },
    th3: {
        width: '10%',
        textAlign: 'center',
        fontSize: '11px',
        borderLeft: 1,
        borderColor: '#e4e4e4',
        paddingBottom: '10px',
        paddingTop: '10px',
    },
    th4: {
        width: '10%',
        textAlign: 'center',
        fontSize: '11px',
        borderLeft: 1,
        borderColor: '#e4e4e4',
        paddingBottom: '10px',
        paddingTop: '10px',
    }
});