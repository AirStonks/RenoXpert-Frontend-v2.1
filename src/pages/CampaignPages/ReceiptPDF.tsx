// src\pages\CampaignPages\ReceiptPDF.tsx

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/'
        : '/';

// Create styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    borderBottom: '2 solid #E5E7EB',
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 15,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  companyTagline: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    borderBottom: '1 solid #E5E7EB',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: 'medium',
    flex: 1,
  },
  value: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
  },
  amountValue: {
    fontSize: 18,
    color: '#059669',
    fontWeight: 'bold',
  },
  statusSection: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  thankYou: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  contactInfo: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 10,
  },
});

interface ReceiptPDFProps {
  paymentData: {
    ref: string;
    amount: string;
    name: string;
    bookingNumber: string;
    paymentDate: string;
  };
}

const ReceiptPDF: React.FC<ReceiptPDFProps> = ({ paymentData }) => {
  // Function to format payment date
  const formatPaymentDate = (dateString: string) => {
    if (!dateString || dateString.length !== 14) {
      return 'N/A';
    }
    
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const hour = dateString.substring(8, 10);
    const minute = dateString.substring(10, 12);
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthName = monthNames[parseInt(month) - 1];
    
    return `${day} ${monthName} ${year} - ${hour}:${minute}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            style={styles.logo} 
            src={MEDIA_URL + "app/RenoExpert_logo-01.svg"}
          />
          <Text style={styles.companyName}>RENOXPERT</Text>
          <Text style={styles.companyTagline}>Your Trusted Renovation Partner</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>PAYMENT RECEIPT</Text>

        {/* Payment Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Booking Number:</Text>
            <Text style={styles.value}>{paymentData.bookingNumber || 'N/A'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Reference Number:</Text>
            <Text style={styles.value}>{paymentData.ref || 'N/A'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{paymentData.name || 'N/A'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date:</Text>
            <Text style={styles.value}>{formatPaymentDate(paymentData.paymentDate)}</Text>
          </View>
        </View>

        {/* Amount Section */}
        <View style={styles.section}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount Paid:</Text>
            <Text style={styles.amountValue}>
              RM {paymentData.amount ? Number(paymentData.amount).toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              }) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.statusText}>✓ PAYMENT SUCCESSFUL</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.thankYou}>Thank you for choosing RenoXpert!</Text>
          <Text style={styles.footerText}>
            This receipt serves as proof of your successful payment.{'\n'}
            Please keep this receipt for your records.
          </Text>
          <Text style={styles.contactInfo}>
            For any inquiries, please contact us at:{'\n'}
            Email: sales@renoxpert.com{'\n'}
            Phone: +60 123 456 789{'\n'}
            Website: https://renoxpert.my
          </Text>
          <Text style={styles.footerText}>
            Generated on: {new Date().toLocaleString()}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReceiptPDF;
