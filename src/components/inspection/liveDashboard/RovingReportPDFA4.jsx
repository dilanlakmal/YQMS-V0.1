import React from "react";
import {
  Page,
  Document,
  Text,
  View,
  StyleSheet,
  Font
} from "@react-pdf/renderer";

// Register the Khmer font
Font.register({
  family: "NotoSansKhmer",
  fonts: [
    {
      src: `/fonts/NotoSansKhmer-Regular.ttf`, // Use a direct URL
      fontWeight: "normal"
    },
    {
      src: `/fonts/NotoSansKhmer-Bold.ttf`, // Use a direct URL
      fontWeight: "bold"
    }
  ]
});

// Styles for the A4 PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "NotoSansKhmer" // Use the registered Khmer font
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: "#3b82f6",
    color: "white",
    padding: 10,
    fontWeight: "bold"
  },
  subtitle: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
    fontWeight: "bold"
  },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb"
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
    fontWeight: "bold"
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    flex: 1.2, // Slightly increased default flex for most columns in A4
    textAlign: "left",
    fontSize: 9 // Reduced font size (equivalent to Tailwind's xs: ~12px or 9pt)
  },
  tableCellOperation: {
    padding: 5,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    flex: 2.5, // Increased width for Operation Name column in A4
    textAlign: "left",
    fontSize: 9,
    flexWrap: "wrap" // Allow text to wrap
  },
  tableCellMachineCode: {
    padding: 5,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    flex: 1.2, // Slightly increased width for Machine Code column in A4
    textAlign: "left",
    fontSize: 9,
    flexWrap: "wrap" // Allow text to wrap
  },
  tableCellWide: {
    padding: 5,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    flex: 3, // Increased width for Defect Details column in A4
    textAlign: "left",
    fontSize: 9
  },
  statusPass: {
    backgroundColor: "#d1fae5"
  },
  statusReject: {
    backgroundColor: "#fee2e2"
  }
});

const RovingReportPDFA4 = ({ data }) => {
  // Group data by inspection_date, line_no, and mo_no for pagination in PDF
  const groupedData = data.reduce((acc, record) => {
    const key = `${record.inspection_date}-${record.line_no}-${record.mo_no}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(record);
    return acc;
  }, {});

  const pages = Object.values(groupedData);

  return (
    <Document>
      {pages.map((group, pageIndex) => (
        <Page
          key={pageIndex}
          size="A4" // A4 paper size
          orientation="landscape" // Landscape orientation
          style={styles.page}
        >
          {/* Title */}
          <Text style={styles.title}>QC Inline Roving - Summary Report</Text>

          {/* Summary Table */}
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Inspection Date</Text>
              <Text style={styles.tableCell}>QC ID</Text>
              <Text style={styles.tableCell}>QC Name</Text>
              <Text style={styles.tableCell}>Line No</Text>
              <Text style={styles.tableCell}>MO No</Text>
            </View>
            {group.map((record, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{record.inspection_date}</Text>
                <Text style={styles.tableCell}>{record.emp_id}</Text>
                <Text style={styles.tableCell}>{record.eng_name}</Text>
                <Text style={styles.tableCell}>{record.line_no}</Text>
                <Text style={styles.tableCell}>{record.mo_no}</Text>
              </View>
            ))}
          </View>

          {/* Inspection Data */}
          <Text style={styles.subtitle}>Inspection Data</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Operator ID</Text>
              <Text style={styles.tableCell}>Operator Name</Text>
              <Text style={styles.tableCellOperation}>Operation Name</Text>
              <Text style={styles.tableCellMachineCode}>Machine Code</Text>
              <Text style={styles.tableCell}>Inspection Type</Text>
              <Text style={styles.tableCell}>SPI Status</Text>
              <Text style={styles.tableCell}>Measurement Status</Text>
              <Text style={styles.tableCell}>Quality Status</Text>
              <Text style={styles.tableCell}>Inspection Time</Text>
              <Text style={styles.tableCell}>Checked Qty</Text>
              <Text style={styles.tableCell}>Defects Qty</Text>
              <Text style={styles.tableCell}>Defect Rate (%)</Text>
              <Text style={styles.tableCell}>Defect Ratio (%)</Text>
              <Text style={styles.tableCell}>Pass Rate (%)</Text>
              <Text style={styles.tableCellWide}>Defect Details</Text>
            </View>
            {group.flatMap((record) =>
              record.inlineData.map((entry, idx) => {
                const metrics = calculateMetrics(entry);
                return (
                  <View key={`${record._id}-${idx}`} style={styles.tableRow}>
                    <Text style={styles.tableCell}>
                      {entry.operator_emp_id}
                    </Text>
                    <Text style={styles.tableCell}>
                      {entry.operator_eng_name}
                    </Text>
                    <Text style={styles.tableCellOperation}>
                      {entry.operation_kh_name}
                    </Text>
                    <Text style={styles.tableCellMachineCode}>
                      {entry.ma_code}
                    </Text>
                    <Text style={styles.tableCell}>{entry.type}</Text>
                    <Text
                      style={[
                        styles.tableCell,
                        entry.spi === "Reject"
                          ? styles.statusReject
                          : styles.statusPass
                      ]}
                    >
                      {entry.spi}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        entry.measurement === "Reject"
                          ? styles.statusReject
                          : styles.statusPass
                      ]}
                    >
                      {entry.measurement}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        entry.qualityStatus === "Reject"
                          ? styles.statusReject
                          : styles.statusPass
                      ]}
                    >
                      {entry.qualityStatus}
                    </Text>
                    <Text style={styles.tableCell}>
                      {entry.inspection_time}
                    </Text>
                    <Text style={styles.tableCell}>
                      {entry.checked_quantity}
                    </Text>
                    <Text style={styles.tableCell}>
                      {metrics.totalDefectsQty}
                    </Text>
                    <Text style={styles.tableCell}>{metrics.defectRate}</Text>
                    <Text style={styles.tableCell}>{metrics.defectRatio}</Text>
                    <Text style={styles.tableCell}>{metrics.passRate}</Text>
                    <Text style={styles.tableCellWide}>
                      {metrics.defectDetails.length > 0
                        ? metrics.defectDetails
                            .map((defect) => `${defect.name}: ${defect.count}`)
                            .join(", ")
                        : "No Defects"}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </Page>
      ))}
    </Document>
  );
};

// Calculate metrics (same as in RovingReport.jsx)
const calculateMetrics = (inlineEntry) => {
  const checkedQty = inlineEntry.checked_quantity || 0;
  const rejectGarments = inlineEntry.rejectGarments || [];
  const totalDefectsQty = rejectGarments.reduce(
    (sum, garment) => sum + (garment.totalCount || 0),
    0
  );
  const rejectGarmentCount = rejectGarments.length;
  const goodOutput = checkedQty - rejectGarmentCount;

  const defectRate = checkedQty > 0 ? (totalDefectsQty / checkedQty) * 100 : 0;
  const defectRatio =
    checkedQty > 0 ? (rejectGarmentCount / checkedQty) * 100 : 0;
  const passRate = checkedQty > 0 ? (goodOutput / checkedQty) * 100 : 0;

  const defectDetails = rejectGarments
    .flatMap((garment) =>
      garment.garments.flatMap((g) =>
        g.defects.map((defect) => ({
          name: defect.name,
          count: defect.count
        }))
      )
    )
    .reduce((acc, defect) => {
      const existing = acc.find((d) => d.name === defect.name);
      if (existing) {
        existing.count += defect.count;
      } else {
        acc.push({ name: defect.name, count: defect.count });
      }
      return acc;
    }, []);

  return {
    defectRate: defectRate.toFixed(2),
    defectRatio: defectRatio.toFixed(2),
    passRate: passRate.toFixed(2),
    totalDefectsQty,
    rejectGarmentCount,
    defectDetails
  };
};

export default RovingReportPDFA4;
