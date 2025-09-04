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
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableRow: { flexDirection: "row" },
  tableHeaderRow: { backgroundColor: "#f9fafb" },
  tableColHeader: {
    padding: 5,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    fontWeight: "bold",
    fontSize: 8,
    textAlign: "center"
  },
  tableCol: {
    padding: 4,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    textAlign: "center"
  },
  // Column Widths
  colDate: { width: "9%" },
  colMachine: { width: "7%" },
  colMo: { width: "9%" },
  colBuyer: { width: "9%" },
  colStyle: { width: "10%" },
  colColor: { width: "9%" },
  colOperator: { width: "9%" },
  colSpecs: { width: "11%" },
  colRejections: { width: "7%" },
  colResult: { width: "7%" },
  colRemarks: { width: "13%", textAlign: "left" },
  // Image Page Styles
  imagePage: { padding: 40 },
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
  imageDetailsText: { fontSize: 10, marginBottom: 3 },
  imageBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  imageTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 10 },
  image: { maxWidth: "100%", maxHeight: "90%", objectFit: "contain" }
});

// --- PDF DOCUMENT COMPONENT ---
const FinalConsolidateHTReportDailyWashingPDF = ({ data }) => (
  <Document author="Yorkmars Garment MFG Co., LTD">
    {/* Page 1: The Main Data Table */}
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.headerContainer}>
        <Text style={styles.mainTitle}>
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </Text>
        <Text style={styles.subtitle}>Daily Washing Test Results</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeaderRow]} fixed>
          <Text style={[styles.tableColHeader, styles.colDate]}>
            Insp. Date
          </Text>
          <Text style={[styles.tableColHeader, styles.colMachine]}>
            Machine
          </Text>
          <Text style={[styles.tableColHeader, styles.colMo]}>MO No</Text>
          <Text style={[styles.tableColHeader, styles.colBuyer]}>Buyer</Text>
          <Text style={[styles.tableColHeader, styles.colStyle]}>
            Buyer Style
          </Text>
          <Text style={[styles.tableColHeader, styles.colColor]}>Color</Text>
          <Text style={[styles.tableColHeader, styles.colOperator]}>
            Operator
          </Text>
          <Text style={[styles.tableColHeader, styles.colSpecs]}>Specs</Text>
          <Text style={[styles.tableColHeader, styles.colRejections]}>
            Rejects
          </Text>
          <Text style={[styles.tableColHeader, styles.colResult]}>Result</Text>
          <Text style={[styles.tableColHeader, styles.colRemarks]}>
            Remarks
          </Text>
        </View>

        {data.map((row, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={[styles.tableCol, styles.colDate]}>
              {new Date(row.inspectionDate).toLocaleDateString()}
            </Text>
            <Text style={[styles.tableCol, styles.colMachine]}>
              {row.machineNo}
            </Text>
            <Text style={[styles.tableCol, styles.colMo]}>{row.moNo}</Text>
            <Text style={[styles.tableCol, styles.colBuyer]}>{row.buyer}</Text>
            <Text style={[styles.tableCol, styles.colStyle]}>
              {row.buyerStyle}
            </Text>
            <Text style={[styles.tableCol, styles.colColor]}>{row.color}</Text>
            <Text style={[styles.tableCol, styles.colOperator]}>
              {row.operatorData?.emp_id || "N/A"}
            </Text>
            <Text style={[styles.tableCol, styles.colSpecs]}>
              {`T: ${row.standardSpecifications?.tempC || "N/A"}°C\nt: ${
                row.standardSpecifications?.timeSec || "N/A"
              }s`}
            </Text>
            <Text style={[styles.tableCol, styles.colRejections]}>
              {row.numberOfRejections}
            </Text>
            <Text style={[styles.tableCol, styles.colResult]}>
              {row.finalResult}
            </Text>
            <Text style={[styles.tableCol, styles.colRemarks]}>
              {row.remarks || "-"}
            </Text>
          </View>
        ))}
      </View>
    </Page>

    {/* Subsequent Pages: One page per record that has an image */}
    {data
      .filter((row) => row.afterWashImage)
      .map((row, index) => (
        <Page key={index} size="A4" style={styles.imagePage} wrap={false}>
          <View style={styles.imageDetailsContainer}>
            <Text style={styles.imageDetailsTitle}>Inspection Details</Text>
            <Text style={styles.imageDetailsText}>MO No: {row.moNo}</Text>
            <Text style={styles.imageDetailsText}>
              Machine No: {row.machineNo}
            </Text>
            <Text style={styles.imageDetailsText}>
              Date: {new Date(row.inspectionDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.imageBox}>
            <Text style={styles.imageTitle}>After Wash Image</Text>
            <Image style={styles.image} src={row.afterWashImage} />
          </View>
        </Page>
      ))}
  </Document>
);

export default FinalConsolidateHTReportDailyWashingPDF;
