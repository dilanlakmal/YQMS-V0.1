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

// --- FONT REGISTRATION ---
// Ensure these fonts are in your /public/fonts/ directory
Font.register({
  family: "Roboto",
  fonts: [
    { src: "/fonts/Roboto-Regular.ttf" },
    { src: "/fonts/Roboto-Bold.ttf", fontWeight: "bold" }
  ]
});
Font.register({
  family: "KhmerOS",
  src: "/fonts/Khmer-Regular.ttf"
});

// --- STYLESHEET (with corrected Header Styles) ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 8,
    paddingTop: 100, // Space for the fixed header
    paddingBottom: 40,
    paddingHorizontal: 25,
    backgroundColor: "#ffffff"
  },
  // --- CORRECTED HEADER STYLES ---
  header: {
    position: "absolute",
    top: 25,
    left: 25,
    right: 25,
    flexDirection: "row", // Arrange children horizontally
    alignItems: "flex-start", // Align items to the top
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 10
  },
  logo: {
    width: 60, // Fixed width for the logo
    height: 60,
    marginRight: 10
  },
  headerTextContainer: {
    flex: 1, // CRITICAL: Allows this container to take up all remaining space
    flexDirection: "column" // Arrange text lines vertically
  },
  mainTitle: {
    fontSize: 9,
    fontWeight: "bold"
  },
  subTitle: {
    fontSize: 7,
    color: "#666666",
    marginTop: 3
  },
  subTitleKhmer: {
    fontSize: 7,
    fontFamily: "KhmerOS",
    color: "#666666",
    marginTop: 3
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15
  },
  // --- UNCHANGED TABLE STYLES ---
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 20
  },
  tableRow: { flexDirection: "row", backgroundColor: "#fff" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f2f2f2" },
  tableColHeader: {
    padding: 4,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    fontWeight: "bold",
    textAlign: "center"
  },
  tableCol: {
    padding: 4,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderLeftWidth: 0,
    borderTopWidth: 0
  },

  // --- NEW: STYLES FOR THE TOTAL ROW ---
  tableTotalRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6", // Light gray background
    borderTopWidth: 2,
    borderTopColor: "#d1d5db",
    fontWeight: "bold"
  },
  totalLabelCell: {
    width: "57%", // Span of first 4 columns (18+12+15+12)
    textAlign: "right",
    padding: 4,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    fontSize: 9
  },
  totalValueCell: {
    padding: 4,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  humanReadableTime: {
    fontSize: 7,
    fontWeight: "normal",
    color: "#555"
  },
  // --- END OF NEW STYLES ---

  summaryColFactory: { width: "18%" },
  summaryColType: { width: "12%" },
  summaryColMo: { width: "15%" },
  summaryColQc: { width: "12%" },
  summaryColTime: { width: "13%", textAlign: "right" },
  summaryColChecked: { width: "15%", textAlign: "right" },
  summaryColClaim: { width: "15%", textAlign: "right" },
  detailColFactory: { width: "10%" },
  detailColType: { width: "8%" },
  detailColMo: { width: "10%" },
  detailColDate: { width: "8%" },
  detailColQc: { width: "7%" },
  detailColStart: { width: "7%" },
  detailColTime: { width: "8%" },
  detailColIssues: { width: "7%", textAlign: "right" },
  detailColClaim: { width: "7%", textAlign: "right" },
  detailColDefects: { width: "28%", textAlign: "left" },
  defectSumColFactory: { width: "25%" },
  defectSumColType: { width: "20%" },
  defectSumColChecked: { width: "20%", textAlign: "right" },
  defectSumColDefects: { width: "35%", textAlign: "left" },
  textRight: { textAlign: "right" },
  textBold: { fontWeight: "bold" },
  moneyText: { color: "#166534" },
  pre: { fontFamily: "Roboto" }
});

// --- Reusable Header Component with Corrected Layout ---
const PdfHeader = () => (
  <View style={styles.header} fixed>
    <Image style={styles.logo} src="/assets/Home/yorkmars.jpg" />
    <View style={styles.headerTextContainer}>
      <Text style={styles.mainTitle}>
        Yorkmars (Cambodia) Garment MFG Co., LTD | Supplier Issues in QC
        Inspections
      </Text>
      <Text style={styles.subTitle}>
        #0287, PLOV LUM, PHUM TRAPRAING CHHREY, SANGKAT KAKAB, KHAN PORSENCHHEY
        | Tel: (855) 23 866 416/417
      </Text>
      <Text style={styles.subTitleKhmer}>
        យូកម៉ាស (ខេមបូឌា) ហ្គាមេន អឹមអេហ្វជី ខូអិលធីឌី
      </Text>
    </View>
  </View>
);

// --- Main PDF Document Component (Logic is unchanged) ---
const SupplierIssueDownloadPDF = ({
  aggregatedSummaryData,
  detailedData,
  defectSummaryData
}) => {
  const formatSecondsToTime = (totalSeconds) => {
    if (isNaN(totalSeconds)) return "00:00:00";
    const h = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const formatSecondsToHumanReadable = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "0 Mins";
    if (seconds === 0) return "0 Mins";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (h > 0) parts.push(`${h} hr`);
    if (m > 0) parts.push(`${m} Mins`);
    return parts.join(" ");
  };

  // --- CALCULATE TOTALS ---
  const summaryTotals = aggregatedSummaryData.reduce(
    (totals, item) => {
      totals.totalTime += item.totalTimeSeconds || 0;
      totals.totalChecked += item.totalChecked || 0;
      totals.totalClaim += item.totalClaim || 0;
      return totals;
    },
    { totalTime: 0, totalChecked: 0, totalClaim: 0 }
  );

  return (
    <Document>
      {/* Page 1: Factory Summary */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <PdfHeader />
        <Text style={styles.pageTitle}>Factory Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColHeader, styles.summaryColFactory]}>
              Factory Name
            </Text>
            <Text style={[styles.tableColHeader, styles.summaryColType]}>
              Factory Type
            </Text>
            <Text style={[styles.tableColHeader, styles.summaryColMo]}>
              MO No
            </Text>
            <Text style={[styles.tableColHeader, styles.summaryColQc]}>
              QC ID(s)
            </Text>
            <Text style={[styles.tableColHeader, styles.summaryColTime]}>
              Total Insp. Time
            </Text>
            <Text style={[styles.tableColHeader, styles.summaryColChecked]}>
              Total Checked Pcs
            </Text>
            <Text style={[styles.tableColHeader, styles.summaryColClaim]}>
              Total Claim
            </Text>
          </View>
          {aggregatedSummaryData.map((item, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCol, styles.summaryColFactory]}>
                {item.factoryName}
              </Text>
              <Text style={[styles.tableCol, styles.summaryColType]}>
                {item.factoryType}
              </Text>
              <Text style={[styles.tableCol, styles.summaryColMo]}>
                {item.moNo}
              </Text>
              <Text style={[styles.tableCol, styles.summaryColQc]}>
                {item.qcIds}
              </Text>
              <Text style={[styles.tableCol, styles.summaryColTime]}>
                {formatSecondsToTime(item.totalTimeSeconds)}
              </Text>
              <Text
                style={[
                  styles.tableCol,
                  styles.summaryColChecked,
                  styles.textBold
                ]}
              >
                {item.totalChecked.toLocaleString()}
              </Text>
              <Text
                style={[
                  styles.tableCol,
                  styles.summaryColClaim,
                  styles.textBold,
                  styles.moneyText
                ]}
              >
                ${item.totalClaim.toFixed(2)}
              </Text>
            </View>
          ))}
          {/* --- NEW TOTAL ROW RENDERED HERE --- */}
          <View style={styles.tableTotalRow} wrap={false}>
            <Text style={styles.totalLabelCell}>Total:</Text>
            <View style={[styles.totalValueCell, styles.summaryColTime]}>
              <Text>{formatSecondsToTime(summaryTotals.totalTime)}</Text>
              <Text style={styles.humanReadableTime}>
                ({formatSecondsToHumanReadable(summaryTotals.totalTime)})
              </Text>
            </View>
            <Text style={[styles.totalValueCell, styles.summaryColChecked]}>
              {summaryTotals.totalChecked.toLocaleString()}
            </Text>
            <Text
              style={[
                styles.totalValueCell,
                styles.summaryColClaim,
                styles.moneyText
              ]}
            >
              ${summaryTotals.totalClaim.toFixed(2)}
            </Text>
          </View>
        </View>
      </Page>

      {/* Page 2: Detailed View */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <PdfHeader />
        <Text style={styles.pageTitle}>
          Supplier Issue # - Detailed Inspection View
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColHeader, styles.detailColFactory]}>
              Factory
            </Text>
            <Text style={[styles.tableColHeader, styles.detailColType]}>
              Type
            </Text>
            <Text style={[styles.tableColHeader, styles.detailColMo]}>
              MO No
            </Text>
            <Text style={[styles.tableColHeader, styles.detailColDate]}>
              Date
            </Text>
            <Text style={[styles.tableColHeader, styles.detailColQc]}>
              QC ID
            </Text>
            <Text style={[styles.tableColHeader, styles.detailColStart]}>
              Start Time
            </Text>
            <Text style={[styles.tableColHeader, styles.detailColTime]}>
              Insp. Time
            </Text>
            <Text style={[styles.tableColHeader, styles.detailColIssues]}>
              Issues
            </Text>
            <Text style={[styles.tableColHeader, styles.detailColClaim]}>
              Claim ($)
            </Text>
            <Text style={[styles.tableColHeader, styles.detailColDefects]}>
              Defect Details
            </Text>
          </View>
          {detailedData.map((r) => (
            <View key={r._id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCol, styles.detailColFactory]}>
                {r.factoryName}
              </Text>
              <Text style={[styles.tableCol, styles.detailColType]}>
                {r.factoryType}
              </Text>
              <Text style={[styles.tableCol, styles.detailColMo]}>
                {r.moNo}
              </Text>
              <Text style={[styles.tableCol, styles.detailColDate]}>
                {format(new Date(r.reportDate), "MM/dd/yy")}
              </Text>
              <Text style={[styles.tableCol, styles.detailColQc]}>
                {r.inspectorId}
              </Text>
              <Text style={[styles.tableCol, styles.detailColStart]}>
                {format(new Date(r.createdAt), "h:mm a")}
              </Text>
              <Text style={[styles.tableCol, styles.detailColTime]}>
                {r.totalInspectionTimeString}
              </Text>
              <Text
                style={[
                  styles.tableCol,
                  styles.detailColIssues,
                  styles.textBold
                ]}
              >
                {r.totalCheckedQty}
              </Text>
              <Text
                style={[
                  styles.tableCol,
                  styles.detailColClaim,
                  styles.textBold,
                  styles.moneyText
                ]}
              >
                ${r.totalClaimAmountUSD.toFixed(2)}
              </Text>
              <Text
                style={[styles.tableCol, styles.detailColDefects, styles.pre]}
              >
                {r.defectCounts
                  .map((d) => `${d.defectNameEng}: ${d.qty}`)
                  .join("\n")}
              </Text>
            </View>
          ))}
        </View>
      </Page>

      {/* Page 3: Defect Summary */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <PdfHeader />
        <Text style={styles.pageTitle}>Supplier Issue # - Defect Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColHeader, styles.defectSumColFactory]}>
              Factory Name
            </Text>
            <Text style={[styles.tableColHeader, styles.defectSumColType]}>
              Factory Type
            </Text>
            <Text style={[styles.tableColHeader, styles.defectSumColChecked]}>
              Total Checked Pcs
            </Text>
            <Text style={[styles.tableColHeader, styles.defectSumColDefects]}>
              Defect Details
            </Text>
          </View>
          {defectSummaryData.map((item, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCol, styles.defectSumColFactory]}>
                {item.factoryName}
              </Text>
              <Text style={[styles.tableCol, styles.defectSumColType]}>
                {item.factoryType}
              </Text>
              <Text
                style={[
                  styles.tableCol,
                  styles.defectSumColChecked,
                  styles.textBold
                ]}
              >
                {item.totalCheckedPcs.toLocaleString()}
              </Text>
              <Text
                style={[
                  styles.tableCol,
                  styles.defectSumColDefects,
                  styles.pre
                ]}
              >
                {Object.entries(item.defects)
                  .map(([name, qty]) => `${name}: ${qty}`)
                  .join("\n")}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default SupplierIssueDownloadPDF;
