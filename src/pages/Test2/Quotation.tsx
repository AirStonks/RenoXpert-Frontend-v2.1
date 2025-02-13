import { Document, Page, PDFViewer, Text, View, Image } from '@react-pdf/renderer';
import React from 'react'
import { styles } from './test2stylesheet';
// import { DataTableCell, Table, TableBody, TableCell, TableHeader } from '@alex9923/react-pdf-table';

export default function Quotation() {
    const items = [
        { id: 1, description: "Web Development Service", quantity: 20, price: 75 },
        { id: 2, description: "Technical Consulting", quantity: 10, price: 100 },
        { id: 3, description: "Cloud Hosting", quantity: 12, price: 50 },
        { id: 4, description: "Cloud Hosting", quantity: 12, price: 50 },
        { id: 5, description: "Cloud Hosting", quantity: 12, price: 50 },
    ];



    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const tax = subtotal * 0.10; // Assuming 10% tax
    const total = subtotal + tax;

    const QuotationPDF = () => (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.companyHeader}>
                    <View>
                        <Text style={styles.headerTitle}>Company Name</Text>
                        <Text style={styles.headerText}>123, Business Street</Text>
                        <Text style={styles.headerText}>City, State, 12345</Text>
                        <Text style={styles.headerText}>Mobile: (60) 123456789</Text>
                        <Text style={styles.headerText}>Email: companyemail@testing.my</Text>
                    </View>
                    <View>
                        {/* <Image src="/logo.png" style={styles.companyImage}>Company Logo</Image> */}
                        <Text>Company Logo</Text>
                    </View>
                </View>

                <View style={styles.quotationHeader}>
                    <View>
                        <Text style={styles.headerTitle}>Quotation</Text>
                        <Text style={styles.headerText}>Number: QUO-2500001</Text>
                    </View>
                    <Text style={styles.headerText}>Date: 12-02-2025</Text>
                </View>

                <View style={styles.attnHeader}>
                    <Text>Attn.</Text>
                    <Text style={styles.headerText}>Attn Name.</Text>
                    <Text style={styles.headerText}>Attn Address.</Text>
                    <Text style={styles.headerText}>Attn Mobile.</Text>
                    <Text style={styles.headerText}>Attn Email.</Text>
                </View>

                {/* Table */}
                <View style={styles.thead}>
                    <Text style={styles.th1}>No</Text>
                    <Text style={styles.th2}>Description</Text>
                    <Text style={styles.th3}>QTY</Text>
                    <Text style={styles.th4}>UOM</Text>
                </View>

                <View>
                    <Text>1</Text>
                    <Text></Text>
                </View>


                {/* <Table
                    data={items}
                >
                    <TableHeader>
                        <TableCell>No</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Price</TableCell>
                    </TableHeader>
                    <TableBody>
                        <DataTableCell getContent={(r) => r.id} />
                        <DataTableCell getContent={(r) => r.description} />
                        <DataTableCell getContent={(r) => r.quantity} />
                        <DataTableCell getContent={(r) => r.price} />
                    </TableBody>
                </Table> */}
            </Page>
        </Document>
    );

    return (
        <div className='w-full'>
            <div className='w-full h-[750px]'>
                <PDFViewer width="100%" height="100%">
                    <QuotationPDF />
                </PDFViewer>
            </div>
        </div>
    )
}