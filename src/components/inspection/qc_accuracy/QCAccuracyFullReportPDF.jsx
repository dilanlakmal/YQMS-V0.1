import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font
} from "@react-pdf/renderer";

// Register Fonts - Ensure these paths are correct in your public folder
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

// Define Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 8,
    padding: 20,
    backgroundColor: "#ffffff"
  },
  header: {
    textAlign: "center",
    marginBottom: 15
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Roboto"
  },
  filterContainer: {
    border: "1px solid #bfbfbf",
    borderRadius: 3,
    padding: 8,
    marginBottom: 15,
    fontSize: 9
  },
  filterTable: {
    display: "table",
    width: "auto"
  },
  filterTableRow: {
    flexDirection: "row"
  },
  filterTableCell: {
    width: "33.33%",
    padding: 2
  },
  filterLabel: {
    fontWeight: "bold",
    fontFamily: "Roboto"
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
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#fff"
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2"
  },
  tableColHeader: {
    padding: 4,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Roboto"
  },
  tableCol: {
    padding: 4,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    textAlign: "center"
  },
  colQA: { width: "6%" },
  colQC: { width: "6%" },
  colDate: { width: "7%" },
  colType: { width: "9%" },
  colMo: { width: "10%" },
  colLine: { width: "5%" },
  colChecked: { width: "6%" },
  colReject: { width: "6%" },
  colTotalDefect: { width: "6%" },
  colDefectDetails: { width: "27%", textAlign: "left" },
  colResult: { width: "6%" },
  colGrade: { width: "6%" },
  passText: { color: "#166534", fontWeight: "bold" },
  failText: { color: "#b91c1c", fontWeight: "bold" },
  defectName: {
    fontFamily: "KhmerOS", // Use Khmer font for defect names
    fontSize: 8
  },
  defectMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2
  },
  statusPill: {
    padding: "2px 4px",
    borderRadius: 8,
    fontSize: 7,
    fontWeight: "bold",
    fontFamily: "Roboto"
  },
  decisionText: {
    fontSize: 7,
    color: "#555",
    marginLeft: 4,
    fontFamily: "Roboto"
  },
  criticalPill: { backgroundColor: "#fecaca", color: "#b91c1c" },
  majorPill: { backgroundColor: "#fed7aa", color: "#9a3412" },
  minorPill: { backgroundColor: "#fef08a", color: "#854d0e" }
});

const QCAccuracyFullReportPDF = ({ data, filters }) => {
  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString() : "N/A";

  const getStatusPillStyle = (status) => {
    switch (status) {
      case "Critical":
        return styles.criticalPill;
      case "Major":
        return styles.majorPill;
      case "Minor":
        return styles.minorPill;
      default:
        return {};
    }
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>QC Accuracy - Full Inspection Report</Text>
        </View>

        <View style={styles.filterContainer}>
          <View style={styles.filterTable}>
            <View style={styles.filterTableRow}>
              <View style={styles.filterTableCell}>
                <Text>
                  <Text style={styles.filterLabel}>Date Range:</Text>{" "}
                  {formatDate(filters.startDate)} -{" "}
                  {formatDate(filters.endDate)}
                </Text>
              </View>
              <View style={styles.filterTableCell}>
                <Text>
                  <Text style={styles.filterLabel}>QA ID:</Text>{" "}
                  {filters.qaId?.label || "All"}
                </Text>
              </View>
              <View style={styles.filterTableCell}>
                <Text>
                  <Text style={styles.filterLabel}>QC ID:</Text>{" "}
                  {filters.qcId?.label || "All"}
                </Text>
              </View>
            </View>
            <View style={styles.filterTableRow}>
              <View style={styles.filterTableCell}>
                <Text>
                  <Text style={styles.filterLabel}>MO No:</Text>{" "}
                  {filters.moNo?.label || "All"}
                </Text>
              </View>
              <View style={styles.filterTableCell}>
                <Text>
                  <Text style={styles.filterLabel}>Line/Table:</Text>{" "}
                  {filters.lineNo?.label || filters.tableNo?.label || "All"}
                </Text>
              </View>
              <View style={styles.filterTableCell}>
                <Text>
                  <Text style={styles.filterLabel}>Grade:</Text>{" "}
                  {filters.overallGrade?.label || "All"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColHeader, styles.colQA]}>QA</Text>
            <Text style={[styles.tableColHeader, styles.colQC]}>QC</Text>
            <Text style={[styles.tableColHeader, styles.colDate]}>Date</Text>
            <Text style={[styles.tableColHeader, styles.colType]}>
              Report Type
            </Text>
            <Text style={[styles.tableColHeader, styles.colMo]}>MO No</Text>
            <Text style={[styles.tableColHeader, styles.colLine]}>
              Line/Table
            </Text>
            <Text style={[styles.tableColHeader, styles.colChecked]}>
              Checked
            </Text>
            <Text style={[styles.tableColHeader, styles.colReject]}>
              Reject Pcs
            </Text>
            <Text style={[styles.tableColHeader, styles.colTotalDefect]}>
              Defects
            </Text>
            <Text style={[styles.tableColHeader, styles.colDefectDetails]}>
              Defect Details
            </Text>
            <Text style={[styles.tableColHeader, styles.colResult]}>
              Result
            </Text>
            <Text style={[styles.tableColHeader, styles.colGrade]}>Grade</Text>
          </View>
          {data.map((report) => (
            <View key={report._id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCol, styles.colQA]}>
                {report.qcInspector.empId}
              </Text>
              <Text style={[styles.tableCol, styles.colQC]}>
                {report.scannedQc.empId}
              </Text>
              <Text style={[styles.tableCol, styles.colDate]}>
                {formatDate(report.reportDate)}
              </Text>
              <Text style={[styles.tableCol, styles.colType]}>
                {report.reportType}
              </Text>
              <Text style={[styles.tableCol, styles.colMo]}>{report.moNo}</Text>
              <Text style={[styles.tableCol, styles.colLine]}>
                {report.lineNo !== "NA" ? report.lineNo : report.tableNo}
              </Text>
              <Text style={[styles.tableCol, styles.colChecked]}>
                {report.totalCheckedQty}
              </Text>
              <Text style={[styles.tableCol, styles.colReject]}>
                {
                  report.defects.filter(
                    (v, i, a) => a.findIndex((t) => t.pcsNo === v.pcsNo) === i
                  ).length
                }
              </Text>
              <Text style={[styles.tableCol, styles.colTotalDefect]}>
                {report.defects.reduce((sum, d) => sum + (d.qty || 0), 0)}
              </Text>

              {/* --- FIX: ENHANCED DEFECT DETAILS CELL --- */}
              <View style={[styles.tableCol, styles.colDefectDetails]}>
                {report.defects?.length > 0 &&
                report.defects.some((d) => d.defectCode) ? (
                  report.defects.map((d, i) =>
                    d.defectCode ? (
                      <View key={i} style={{ marginBottom: 4 }}>
                        <Text style={styles.defectName}>
                          {d.defectNameEng} (x{d.qty})
                        </Text>
                        <View style={styles.defectMeta}>
                          <Text
                            style={[
                              styles.statusPill,
                              getStatusPillStyle(d.standardStatus)
                            ]}
                          >
                            {d.standardStatus}
                          </Text>
                          <Text style={styles.decisionText}>
                            ({d.decision})
                          </Text>
                        </View>
                      </View>
                    ) : null
                  )
                ) : (
                  <Text style={{ color: "#888" }}>No Defects</Text>
                )}
              </View>

              <Text
                style={[
                  styles.tableCol,
                  styles.colResult,
                  report.result === "Pass" ? styles.passText : styles.failText
                ]}
              >
                {report.result}
              </Text>
              <Text style={[styles.tableCol, styles.colGrade]}>
                {report.grade}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default QCAccuracyFullReportPDF;
