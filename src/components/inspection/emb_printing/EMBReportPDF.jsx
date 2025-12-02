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

// Register Fonts
Font.register({
  family: "Roboto",
  fonts: [
    { src: "/fonts/Roboto-Regular.ttf" },
    { src: "/fonts/Roboto-Bold.ttf", fontWeight: "bold" }
  ]
});

// Define Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    padding: 30,
    backgroundColor: "#ffffff"
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 10
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af"
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 5
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#eff6ff",
    padding: 6,
    marginBottom: 8,
    borderLeft: "3px solid #2563eb"
  },
  row: {
    flexDirection: "row",
    marginBottom: 5
  },
  label: {
    width: "30%",
    fontWeight: "bold",
    color: "#374151"
  },
  value: {
    width: "70%",
    color: "#111827"
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10
  },
  tableRow: {
    flexDirection: "row"
  },
  tableColHeader: {
    backgroundColor: "#f3f4f6",
    padding: 6,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 9
  },
  tableCol: {
    padding: 6,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    textAlign: "center",
    fontSize: 9
  },
  badge: {
    padding: "3px 8px",
    borderRadius: 10,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center"
  },
  passBadge: {
    backgroundColor: "#d1fae5",
    color: "#065f46"
  },
  rejectBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b"
  },
  pendingBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e"
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTop: "1px solid #e5e7eb",
    paddingTop: 10
  }
});

const EMBReportPDF = ({ report }) => {
  if (!report) {
    console.warn("EMBReportPDF: No report data provided");
    return null;
  }

  // Debug: Log report data to verify structure
  console.log("EMBReportPDF - Report data:", {
    inspectionType: report.inspectionType,
    reportType: report.reportType,
    inspectionDate: report.inspectionDate,
    factoryName: report.factoryName,
    moNo: report.moNo,
    totalPcs: report.totalPcs,
    defectsQty: report.defectsQty,
    result: report.result,
    hasAqlData: !!report.aqlData,
    hasDefects: !!report.defects && report.defects.length > 0
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "N/A";
    }
  };

  const formatTime = (timeString) => {
    return timeString || "N/A";
  };

  const getResultBadgeStyle = (result) => {
    switch (result?.toLowerCase()) {
      case "pass":
        return styles.passBadge;
      case "reject":
        return styles.rejectBadge;
      default:
        return styles.pendingBadge;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {report.inspectionType || "First Output"} - {report.reportType || "EMB"} Report
          </Text>
          <Text style={styles.subtitle}>
            Inspection Date: {formatDate(report.inspectionDate)}
          </Text>
        </View>

        {/* General Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Factory:</Text>
            <Text style={styles.value}>{report.factoryName || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>MO Number:</Text>
            <Text style={styles.value}>{report.moNo || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Buyer:</Text>
            <Text style={styles.value}>{report.buyer || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Buyer Style:</Text>
            <Text style={styles.value}>{report.buyerStyle || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Color:</Text>
            <Text style={styles.value}>
              {Array.isArray(report.color) ? report.color.join(", ") : report.color || "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>SKU Number:</Text>
            <Text style={styles.value}>
              {Array.isArray(report.skuNumber) ? report.skuNumber.join(", ") : report.skuNumber || "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Inspector:</Text>
            <Text style={styles.value}>{report.inspector || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Inspection Time:</Text>
            <Text style={styles.value}>{formatTime(report.inspectionTime)}</Text>
          </View>
        </View>

        {/* EMB Details */}
        {(report.reportType === "EMB" || report.reportType === "EMB + Print") && report.embDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EMB Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Speed:</Text>
              <Text style={styles.value}>{report.embDetails.speed || "N/A"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Stitch:</Text>
              <Text style={styles.value}>{report.embDetails.stitch || "N/A"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Needle Size:</Text>
              <Text style={styles.value}>{report.embDetails.needleSize || "N/A"}</Text>
            </View>
          </View>
        )}

        {/* Printing Details */}
        {(report.reportType === "Printing" || report.reportType === "EMB + Print") && report.printingDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Printing Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Method:</Text>
              <Text style={styles.value}>{report.printingDetails.method || "N/A"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Curing:</Text>
              <Text style={styles.value}>{report.printingDetails.curing || "N/A"}</Text>
            </View>
          </View>
        )}

        {/* AQL Sampling Plan */}
        {report.aqlData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AQL Sampling Plan</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Code Letter:</Text>
              <Text style={styles.value}>{report.aqlData.sampleSizeLetterCode || "N/A"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Sample Size:</Text>
              <Text style={styles.value}>{report.aqlData.sampleSize || "N/A"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Accept (Ac):</Text>
              <Text style={styles.value}>{report.aqlData.acceptDefect ?? "N/A"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Reject (Re):</Text>
              <Text style={styles.value}>{report.aqlData.rejectDefect ?? "N/A"}</Text>
            </View>
          </View>
        )}

        {/* Inspection Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inspection Results dfhdfhfdh</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Pcs:</Text>
            <Text style={styles.value}>{report.totalPcs || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Defects Qty:</Text>
            <Text style={styles.value}>{report.defectsQty || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Defect Rate:</Text>
            <Text style={styles.value}>{report.defectRate ? `${report.defectRate.toFixed(2)}%` : "0.00%"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Result:</Text>
            <View style={[styles.badge, getResultBadgeStyle(report.result)]}>
              <Text>{report.result || "Pending"}</Text>
            </View>
          </View>
        </View>

        {/* Defects Table */}
        {report.defects && report.defects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Defects</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableColHeader, { width: "10%" }]}>Category</Text>
                <Text style={[styles.tableColHeader, { width: "30%" }]}>Defect Type</Text>
                <Text style={[styles.tableColHeader, { width: "10%" }]}>Qty</Text>
                <Text style={[styles.tableColHeader, { width: "50%" }]}>Remarks</Text>
              </View>
              {report.defects.map((defect, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCol, { width: "10%" }]}>
                    {defect.category || "N/A"}
                  </Text>
                  <Text style={[styles.tableCol, { width: "30%" }]}>
                    {defect.defectType || defect.name || "N/A"}
                  </Text>
                  <Text style={[styles.tableCol, { width: "10%" }]}>
                    {defect.qty || defect.count || 0}
                  </Text>
                  <Text style={[styles.tableCol, { width: "50%" }]}>
                    {defect.remarks || "-"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Conclusion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conclusion</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Packing Result:</Text>
            <Text style={styles.value}>{report.packingResult || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Workmanship Result:</Text>
            <Text style={styles.value}>{report.workmanshipResult || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Quality Plan Result:</Text>
            <Text style={styles.value}>{report.qualityPlanResult || "N/A"}</Text>
          </View>
          {report.remarks && report.remarks !== "NA" && (
            <View style={styles.row}>
              <Text style={styles.label}>Remarks:</Text>
              <Text style={styles.value}>{report.remarks}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString("en-US")} | EMB/Printing Inspection Report
        </Text>
      </Page>
    </Document>
  );
};

export default EMBReportPDF;

