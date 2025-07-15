import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font
} from "@react-pdf/renderer";

// --- Register Fonts ---
Font.register({
  family: "Roboto",
  fonts: [
    { src: "/fonts/Roboto-Regular.ttf" },
    { src: "/fonts/Roboto-Bold.ttf", fontWeight: "bold" }
  ]
});
Font.register({
  family: "KhmerOS",
  src: "/fonts/Khmer-Regular.ttf" // Corrected to use the proper filename
});

// --- Define Styles ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    padding: 30,
    backgroundColor: "#ffffff"
  },
  header: {
    textAlign: "center",
    marginBottom: 20
  },
  title: {
    fontSize: 16,
    fontWeight: "bold"
  },
  subtitle: {
    fontSize: 12,
    color: "#333333"
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
    flexDirection: "row"
  },
  tableColHeader: {
    backgroundColor: "#f2f2f2",
    padding: 5,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    fontWeight: "bold",
    textAlign: "center"
  },
  tableCol: {
    padding: 5,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    textAlign: "center"
  },

  // --- FIX #1: CORRECTED STYLE NAMES TO MATCH USAGE ---
  colDate: { width: "8%" },
  colTime: { width: "7%" },
  colType: { width: "10%" },
  colMo: { width: "12%" },
  colLine: { width: "7%" },
  colChecked: { width: "7%" },
  colRejectPcs: { width: "7%" },
  colTotalDefects: { width: "7%" },
  colDefectDetails: { width: "22%", textAlign: "left" }, // Changed from colDefects to match JSX
  colResult: { width: "7%" },
  colGrade: { width: "6%" },

  defectText: {
    fontFamily: "KhmerOS"
  },
  statusPill: {
    padding: "2px 4px",
    borderRadius: 8,
    fontSize: 8,
    fontWeight: "bold"
  },
  criticalPill: { backgroundColor: "#fecaca", color: "#b91c1c" },
  majorPill: { backgroundColor: "#fed7aa", color: "#9a3412" },
  minorPill: { backgroundColor: "#fef08a", color: "#854d0e" },
  passText: { color: "#166534", fontWeight: "bold" },
  failText: { color: "#b91c1c", fontWeight: "bold" }
});

const QCAccuracyIndividualReportPDF = ({ qcData }) => {
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

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
          <Text style={styles.title}>QC Accuracy - Detailed Report</Text>
          <Text style={styles.subtitle}>
            Inspector: {qcData.qcName} ({qcData.qcId})
          </Text>
        </View>

        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableColHeader, styles.colDate]}>Date</Text>
            <Text style={[styles.tableColHeader, styles.colTime]}>Time</Text>
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
            <Text style={[styles.tableColHeader, styles.colRejectPcs]}>
              Reject Pcs
            </Text>
            <Text style={[styles.tableColHeader, styles.colTotalDefects]}>
              Total Defects
            </Text>
            {/* --- FIX #2: APPLYING THE CORRECT STYLE NAME --- */}
            <Text style={[styles.tableColHeader, styles.colDefectDetails]}>
              Defect Details
            </Text>
            <Text style={[styles.tableColHeader, styles.colResult]}>
              Result
            </Text>
            <Text style={[styles.tableColHeader, styles.colGrade]}>Grade</Text>
          </View>

          {/* Table Body */}
          {qcData.reports.map((report) => (
            <View key={report._id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCol, styles.colDate]}>
                {formatDate(report.reportDate)}
              </Text>
              <Text style={[styles.tableCol, styles.colTime]}>
                {formatTime(report.createdAt)}
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
              <Text style={[styles.tableCol, styles.colRejectPcs]}>
                {report.uniquePcsInReport?.length || 0}
              </Text>
              <Text style={[styles.tableCol, styles.colTotalDefects]}>
                {report.totalDefectsInReport || 0}
              </Text>

              {/* --- FIX #2: APPLYING THE CORRECT STYLE NAME --- */}
              <View style={[styles.tableCol, styles.colDefectDetails]}>
                {report.defects?.length > 0 && report.defects[0]?.defectCode ? (
                  report.defects.map((d, i) => (
                    <View key={i} style={{ marginBottom: 4 }}>
                      <Text style={styles.defectText}>
                        {d.defectNameEng} (x{d.qty})
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 2
                        }}
                      >
                        <Text
                          style={[
                            styles.statusPill,
                            getStatusPillStyle(d.standardStatus)
                          ]}
                        >
                          {d.standardStatus}
                        </Text>
                        <Text
                          style={{ fontSize: 8, color: "#555", marginLeft: 4 }}
                        >
                          ({d.decision})
                        </Text>
                      </View>
                    </View>
                  ))
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

export default QCAccuracyIndividualReportPDF;
