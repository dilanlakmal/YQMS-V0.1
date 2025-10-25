import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf
} from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import React from "react";
import Swal from 'sweetalert2';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "white"
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center"
  },
  reportName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center"
  },
  table: {
    display: "table",
    width: "auto",
    marginTop: 10,
    borderStyle: "solid"
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 25,
    alignItems: "center"
  },
  tableHeader: {
    backgroundColor: "#E6F3FF",
    fontWeight: "bold"
  },
  tableCell: {
    width: "10%",
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "left"
  }
});

function PDFDocument({ data, filters }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.companyName}>
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </Text>
        <Text style={styles.reportName}>{filters.type || "Data Report"}</Text>

        <View style={styles.table}>
          {/* Table Headers */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            {[
              "Date",
              "Type",
              "Task No",
              "MO No",
              "Style No",
              "Line No",
              "Color",
              "Size",
              "Buyer",
              "Bundle ID"
            ].map((header, i) => (
              <Text key={i} style={styles.tableCell}>
                {header}
              </Text>
            ))}
          </View>

          {/* Table Data */}
          {data.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.date}</Text>
              <Text style={styles.tableCell}>{item.type}</Text>
              <Text style={styles.tableCell}>{item.taskNo}</Text>
              <Text style={styles.tableCell}>{item.selectedMono}</Text>
              <Text style={styles.tableCell}>{item.custStyle}</Text>
              <Text style={styles.tableCell}>{item.lineNo}</Text>
              <Text style={styles.tableCell}>{item.color}</Text>
              <Text style={styles.tableCell}>{item.size}</Text>
              <Text style={styles.tableCell}>{item.buyer}</Text>
              <Text style={styles.tableCell}>{item.bundle_id}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

function PDFDownloadButton({ data, filters }) {
  const generateFileName = () => {
    const parts = [];
    if (filters.taskNo) parts.push(`Task ${filters.taskNo}`);
    if (filters.type) parts.push(filters.type);
    if (filters.moNo) parts.push(filters.moNo);
    if (filters.styleNo) parts.push(filters.styleNo);
    if (filters.lineNo) parts.push(filters.lineNo);
    if (filters.color) parts.push(filters.color);
    if (filters.size) parts.push(filters.size);

    return parts.length > 0 ? `${parts.join("-")}.pdf` : "download.pdf";
  };

  const handleDownload = async () => {
    try {
      const blob = await pdf(
        <PDFDocument data={data} filters={filters} />
      ).toBlob();
      saveAs(blob, generateFileName());
      
      // Show success alert after download
      Swal.fire({
        title: 'Success!',
        text: 'PDF downloaded successfully!',
        icon: 'success',
        timer: 5000,
        timerProgressBar: true,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to download PDF. Please try again.',
        icon: 'error',
        timer: 5000,
        timerProgressBar: true,
        showConfirmButton: false
      });
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 ml-4"
    >
      Download PDF
    </button>
  );
}

export default PDFDownloadButton;
