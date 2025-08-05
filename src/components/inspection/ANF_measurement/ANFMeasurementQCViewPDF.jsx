import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Image
} from "@react-pdf/renderer";
import { format } from "date-fns";

// --- FONT REGISTRATION (Ensure you have these fonts in your public/fonts directory) ---
Font.register({
  family: "Roboto",
  fonts: [
    { src: "/fonts/Roboto-Regular.ttf" },
    { src: "/fonts/Roboto-Bold.ttf", fontWeight: "bold" }
  ]
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 7,
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 25,
    backgroundColor: "#ffffff"
  },
  header: {
    position: "absolute",
    top: 25,
    left: 25,
    right: 25,
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 10
  },
  logo: { width: 50, height: 50, marginRight: 10 },
  headerTextContainer: { flex: 1, flexDirection: "column" },
  mainTitle: { fontSize: 9, fontWeight: "bold" },
  subTitle: { fontSize: 7, color: "#666666", marginTop: 3 },
  pageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15
  },

  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableRow: { flexDirection: "row", backgroundColor: "#fff" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f2f2f2" },
  tableColHeader: {
    padding: 3,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    fontWeight: "bold",
    textAlign: "center"
  },
  tableCol: {
    padding: 3,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    textAlign: "center"
  },
  textLeft: { textAlign: "left" },

  // Column Widths
  colDate: { width: "8%" },
  colQC: { width: "7%" },
  colMO: { width: "10%" },
  colColor: { width: "12%" },
  colOrdQty: { width: "8%" },
  colSizes: { width: "6%" },
  colChecked: { width: "7%" },
  colOK: { width: "6%" },
  colReject: { width: "6%" },
  colPoints: { width: "6%" },
  colPass: { width: "6%" },
  colIssues: { width: "6%" },
  colTolPlus: { width: "3%" },
  colTolNeg: { width: "3%" },
  colPassGarment: { width: "6%" },
  colPassPoint: { width: "6%" }
});

const PdfHeader = () => (
  <View style={styles.header} fixed>
    <Image style={styles.logo} src="/assets/Home/yorkmars.jpg" />
    <View style={styles.headerTextContainer}>
      <Text style={styles.mainTitle}>
        Yorkmars (Cambodia) Garment MFG Co., LTD
      </Text>
      <Text style={styles.subTitle}>ANF Measurement - QC Daily Report</Text>
    </View>
  </View>
);

const ANFMeasurementQCViewPDF = ({ data }) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <PdfHeader />
        <Text style={styles.pageTitle}>QC Daily Measurement Report</Text>

        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow} fixed>
            <Text style={[styles.tableColHeader, styles.colDate]}>Date</Text>
            <Text style={[styles.tableColHeader, styles.colQC]}>QC ID</Text>
            <Text style={[styles.tableColHeader, styles.colMO]}>MO No</Text>
            <Text style={[styles.tableColHeader, styles.colColor]}>Colors</Text>
            <Text style={[styles.tableColHeader, styles.colOrdQty]}>
              Ord. Qty
            </Text>
            <Text style={[styles.tableColHeader, styles.colSizes]}>Sizes</Text>
            <Text style={[styles.tableColHeader, styles.colChecked]}>
              Checked
            </Text>
            <Text style={[styles.tableColHeader, styles.colOK]}>OK</Text>
            <Text style={[styles.tableColHeader, styles.colReject]}>
              Reject
            </Text>
            <Text style={[styles.tableColHeader, styles.colPoints]}>
              Points
            </Text>
            <Text style={[styles.tableColHeader, styles.colPass]}>Pass</Text>
            <Text style={[styles.tableColHeader, styles.colIssues]}>
              Issues
            </Text>
            <Text style={[styles.tableColHeader, styles.colTolPlus]}>T+</Text>
            <Text style={[styles.tableColHeader, styles.colTolNeg]}>T-</Text>
            <Text style={[styles.tableColHeader, styles.colPassGarment]}>
              Pass% (G)
            </Text>
            <Text style={[styles.tableColHeader, styles.colPassPoint]}>
              Pass% (P)
            </Text>
          </View>

          {/* Table Body */}
          {data.map((item, index) => {
            const summary = item.overallMeasurementSummary;
            const passRateGarment =
              summary?.garmentDetailsCheckedQty > 0
                ? (
                    (summary.garmentDetailsOKGarment /
                      summary.garmentDetailsCheckedQty) *
                    100
                  ).toFixed(2) + "%"
                : "N/A";
            const passRatePoints =
              summary?.measurementDetailsPoints > 0
                ? (
                    (summary.measurementDetailsPass /
                      summary.measurementDetailsPoints) *
                    100
                  ).toFixed(2) + "%"
                : "N/A";

            return (
              <View
                key={item._id || index}
                style={styles.tableRow}
                wrap={false}
              >
                <Text style={[styles.tableCol, styles.colDate]}>
                  {format(new Date(item.inspectionDate), "yyyy-MM-dd")}
                </Text>
                <Text style={[styles.tableCol, styles.colQC]}>{item.qcID}</Text>
                <Text style={[styles.tableCol, styles.colMO, styles.textLeft]}>
                  {item.moNo}
                </Text>
                <Text
                  style={[styles.tableCol, styles.colColor, styles.textLeft]}
                >
                  {item.color.join(", ")}
                </Text>
                <Text style={[styles.tableCol, styles.colOrdQty]}>
                  {item.orderDetails.orderQty_style}
                </Text>
                <Text style={[styles.tableCol, styles.colSizes]}>
                  {item.measurementDetails.length}
                </Text>
                <Text style={[styles.tableCol, styles.colChecked]}>
                  {summary?.garmentDetailsCheckedQty || 0}
                </Text>
                <Text style={[styles.tableCol, styles.colOK]}>
                  {summary?.garmentDetailsOKGarment || 0}
                </Text>
                <Text style={[styles.tableCol, styles.colReject]}>
                  {summary?.garmentDetailsRejected || 0}
                </Text>
                <Text style={[styles.tableCol, styles.colPoints]}>
                  {summary?.measurementDetailsPoints || 0}
                </Text>
                <Text style={[styles.tableCol, styles.colPass]}>
                  {summary?.measurementDetailsPass || 0}
                </Text>
                <Text style={[styles.tableCol, styles.colIssues]}>
                  {summary?.measurementDetailsTotalIssues || 0}
                </Text>
                <Text style={[styles.tableCol, styles.colTolPlus]}>
                  {summary?.measurementDetailsTolPositive || 0}
                </Text>
                <Text style={[styles.tableCol, styles.colTolNeg]}>
                  {summary?.measurementDetailsTolNegative || 0}
                </Text>
                <Text style={[styles.tableCol, styles.colPassGarment]}>
                  {passRateGarment}
                </Text>
                <Text style={[styles.tableCol, styles.colPassPoint]}>
                  {passRatePoints}
                </Text>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};

export default ANFMeasurementQCViewPDF;
