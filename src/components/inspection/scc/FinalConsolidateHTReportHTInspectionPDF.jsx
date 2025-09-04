import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer";
import React from "react";

// --- FONT REGISTRATION ---
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal"
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold"
    }
  ]
});

// --- STYLESHEET ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    backgroundColor: "#ffffff",
    padding: 30,
    color: "#333"
  },
  headerContainer: {
    textAlign: "center",
    marginBottom: 20
  },
  mainTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827"
  },
  subtitle: {
    fontSize: 11,
    color: "#4b5563",
    marginTop: 4
  },
  // Table Styles
  table: {
    display: "table",
    width: "auto" // Auto width to fit content
  },
  tableRow: {
    flexDirection: "row"
  },
  tableHeaderRow: {
    backgroundColor: "#f9fafb"
  },
  tableColHeader: {
    padding: 5,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    fontWeight: "bold",
    fontSize: 8,
    textAlign: "center"
  },
  tableCol: {
    padding: 4,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    textAlign: "center"
  },
  // MODIFIED: Recalculated column widths
  colDate: { width: "9%" },
  colMo: { width: "12%" },
  colStyle: { width: "12%" },
  colOperator: { width: "9%" },
  colBatch: { width: "7%" },
  colTable: { width: "7%" },
  colInsp: { width: "8%" },
  colDefectQty: { width: "8%" },
  colDefectDetail: { width: "18%", textAlign: "left" },
  colRate: { width: "10%" },
  // Image Page Styles (similar to other PDFs)
  imagePage: {
    padding: 40,
    display: "flex",
    flexDirection: "column"
  },
  imageDetailsContainer: {
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingBottom: 15,
    marginBottom: 20
  },
  imageDetailsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10
  },
  imageDetailsText: {
    fontSize: 10,
    marginBottom: 3
  },
  imageBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  imageTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 10
  },
  image: {
    maxWidth: "100%",
    maxHeight: "90%",
    objectFit: "contain"
  }
});

const FinalConsolidateHTReportHTInspectionPDF = ({ data }) => (
  <Document author="Yorkmars Garment MFG Co., LTD">
    {/* Page 1: The Main Data Table */}
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.headerContainer}>
        <Text style={styles.mainTitle}>
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </Text>
        <Text style={styles.subtitle}>HT Inspection Results</Text>
      </View>

      <View style={styles.table}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeaderRow]} fixed>
          <Text style={[styles.tableColHeader, styles.colDate]}>
            Insp. Date
          </Text>
          <Text style={[styles.tableColHeader, styles.colMo]}>MO No</Text>
          <Text style={[styles.tableColHeader, styles.colStyle]}>Color</Text>
          <Text style={[styles.tableColHeader, styles.colOperator]}>
            Operator
          </Text>
          <Text style={[styles.tableColHeader, styles.colBatch]}>Batch</Text>
          <Text style={[styles.tableColHeader, styles.colTable]}>Table</Text>
          <Text style={[styles.tableColHeader, styles.colInsp]}>Insp. Qty</Text>
          <Text style={[styles.tableColHeader, styles.colDefectQty]}>
            Defects
          </Text>
          <Text style={[styles.tableColHeader, styles.colDefectDetail]}>
            Defect Details
          </Text>
          <Text style={[styles.tableColHeader, styles.colRate]}>Rate</Text>
        </View>

        {/* Table Body */}
        {data.map((row, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={[styles.tableCol, styles.colDate]}>
              {new Date(row.inspectionDate).toLocaleDateString()}
            </Text>
            <Text style={[styles.tableCol, styles.colMo]}>{row.moNo}</Text>
            <Text style={[styles.tableCol, styles.colStyle]}>{row.color}</Text>
            <Text style={[styles.tableCol, styles.colOperator]}>
              {row.operatorData?.emp_id || "N/A"}
            </Text>
            <Text style={[styles.tableCol, styles.colBatch]}>
              {row.batchNo}
            </Text>
            <Text style={[styles.tableCol, styles.colTable]}>
              {row.tableNo}
            </Text>
            <Text style={[styles.tableCol, styles.colInsp]}>
              {row.totalInspectedQty}
            </Text>
            <Text style={[styles.tableCol, styles.colDefectQty]}>
              {row.totalDefectsQty}
            </Text>
            <Text style={[styles.tableCol, styles.colDefectDetail]}>
              {Object.entries(row.defectSummary)
                .map(([name, qty]) => `${name}: ${qty}`)
                .join("\n")}
            </Text>
            <Text style={[styles.tableCol, styles.colRate]}>
              {(row.finalDefectRate * 100).toFixed(2)}%
            </Text>
          </View>
        ))}
      </View>
    </Page>

    {/* Subsequent Pages: One page for each record that has a defect image */}
    {data
      .filter((row) => row.defectImageUrl)
      .map((row, index) => (
        <Page key={index} size="A4" style={styles.imagePage} wrap={false}>
          <View style={styles.imageDetailsContainer}>
            <Text style={styles.imageDetailsTitle}>Inspection Details</Text>
            <Text style={styles.imageDetailsText}>MO No: {row.moNo}</Text>
            <Text style={styles.imageDetailsText}>Color: {row.color}</Text>
            <Text style={styles.imageDetailsText}>
              Date: {new Date(row.inspectionDate).toLocaleDateString()}
            </Text>
            <Text style={styles.imageDetailsText}>Batch No: {row.batchNo}</Text>
            <Text style={styles.imageDetailsText}>Table No: {row.tableNo}</Text>
          </View>
          <View style={styles.imageBox}>
            <Text style={styles.imageTitle}>Defect Image</Text>
            <Image style={styles.image} src={row.defectImageUrl} />
          </View>
        </Page>
      ))}
  </Document>
);

export default FinalConsolidateHTReportHTInspectionPDF;
