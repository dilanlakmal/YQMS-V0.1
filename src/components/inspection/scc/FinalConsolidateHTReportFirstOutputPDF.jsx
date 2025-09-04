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

// --- FONT REGISTRATION (using a reliable open-source font) ---
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
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#fff"
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f9fafb"
  },
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
    borderTopWidth: 0
  },
  // Column Widths
  colDate: { width: "10%" },
  colMachine: { width: "8%" },
  colMo: { width: "10%" },
  colBuyer: { width: "10%" },
  colStyle: { width: "12%" },
  colColor: { width: "10%" },
  colOperator: { width: "10%" },
  colSpecs: { width: "15%" },
  col2ndHeat: { width: "15%" },
  // Image Page Styles
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
  imagesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexGrow: 1
  },
  imageBox: {
    width: "45%",
    height: "90%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
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
  },
  noImageText: {
    flex: 1,
    textAlign: "center",
    marginTop: 50,
    color: "#9ca3af"
  }
});

// --- PDF DOCUMENT COMPONENT ---
const FinalConsolidateHTReportFirstOutputPDF = ({ data }) => {
  if (!data) return null;

  return (
    <Document author="Yorkmars Garment MFG Co., LTD">
      {/* Page 1: The Main Data Table */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerContainer}>
          <Text style={styles.mainTitle}>
            Yorkmars (Cambodia) Garment MFG Co., LTD
          </Text>
          <Text style={styles.subtitle}>Heat Transfer First Output</Text>
        </View>

        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow} fixed>
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
            <Text style={[styles.tableColHeader, styles.colSpecs]}>
              Specs (1st Heat)
            </Text>
            <Text style={[styles.tableColHeader, styles.col2ndHeat]}>
              Specs (2nd Heat)
            </Text>
          </View>

          {/* Table Body */}
          {data.map((row, index) => (
            <View key={index} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCol, styles.colDate]}>
                {new Date(row.inspectionDate).toLocaleDateString()}
              </Text>
              <Text style={[styles.tableCol, styles.colMachine]}>
                {row.machineNo}
              </Text>
              <Text style={[styles.tableCol, styles.colMo]}>{row.moNo}</Text>
              <Text style={[styles.tableCol, styles.colBuyer]}>
                {row.buyer}
              </Text>
              <Text style={[styles.tableCol, styles.colStyle]}>
                {row.buyerStyle}
              </Text>
              <Text style={[styles.tableCol, styles.colColor]}>
                {row.color}
              </Text>
              <Text style={[styles.tableCol, styles.colOperator]}>
                {row.operatorData?.emp_id || "N/A"}
              </Text>
              <Text style={[styles.tableCol, styles.colSpecs]}>
                {`T: ${row.specs?.tempC || "N/A"}°C\n`}
                {`t: ${row.specs?.timeSec || "N/A"}s\n`}
                {`P: ${row.specs?.pressure || "N/A"}Bar`}
              </Text>
              <Text style={[styles.tableCol, styles.col2ndHeat]}>
                {row.secondHeatSpecs
                  ? `T: ${row.secondHeatSpecs?.tempC || "N/A"}°C\n` +
                    `t: ${row.secondHeatSpecs?.timeSec || "N/A"}s\n` +
                    `P: ${row.secondHeatSpecs?.pressure || "N/A"}Bar`
                  : "No"}
              </Text>
            </View>
          ))}
        </View>
      </Page>

      {/* Subsequent Pages: One page per record for images */}
      {data.map((row, index) => (
        <Page key={index} size="A4" style={styles.imagePage} wrap={false}>
          <View style={styles.imageDetailsContainer}>
            <Text style={styles.imageDetailsTitle}>Inspection Details</Text>
            <Text style={styles.imageDetailsText}>MO No: {row.moNo}</Text>
            <Text style={styles.imageDetailsText}>Color: {row.color}</Text>
            <Text style={styles.imageDetailsText}>
              Inspection Date:{" "}
              {new Date(row.inspectionDate).toLocaleDateString()}
            </Text>
            <Text style={styles.imageDetailsText}>
              Machine No: {row.machineNo}
            </Text>
            <Text style={styles.imageDetailsText}>
              Operator ID: {row.operatorData?.emp_id || "N/A"}
            </Text>
          </View>

          <View style={styles.imagesContainer}>
            <View style={styles.imageBox}>
              <Text style={styles.imageTitle}>Reference Sample Image</Text>
              {row.referenceSampleImage ? (
                <Image style={styles.image} src={row.referenceSampleImage} />
              ) : (
                <Text style={styles.noImageText}>No Image Provided</Text>
              )}
            </View>
            <View style={styles.imageBox}>
              <Text style={styles.imageTitle}>After Wash Image</Text>
              {row.afterWashImage ? (
                <Image style={styles.image} src={row.afterWashImage} />
              ) : (
                <Text style={styles.noImageText}>No Image Provided</Text>
              )}
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default FinalConsolidateHTReportFirstOutputPDF;
