// src/components/inspection/digital_measurement/MeasurementSummaryPDF.jsx
import React from "react";
import { Page, Document, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 10 },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf"
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#bfbfbf"
  },
  tableHeader: { backgroundColor: "#f0f0f0", fontWeight: "bold" },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderColor: "#bfbfbf",
    flex: 1,
    textAlign: "center"
  },
  lastCell: { borderRightWidth: 0 }
});

const MeasurementSummaryPDF = ({ summaryData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={{ fontSize: 14, marginBottom: 10 }}>
        Measurement Summary
      </Text>
      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          {[
            "MO No",
            "Cust. Style",
            "Buyer",
            "Country",
            "Origin",
            "Mode",
            "Order Qty",
            "Inspected Qty",
            "Total Pass",
            "Total Reject",
            "Pass Rate"
          ].map((header, index) => (
            <Text
              key={index}
              style={[styles.tableCell, index === 10 ? styles.lastCell : {}]}
            >
              {header}
            </Text>
          ))}
        </View>
        {/* Rows */}
        {summaryData.length > 0 ? (
          summaryData.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell]}>{item.moNo}</Text>
              <Text style={[styles.tableCell]}>{item.custStyle || "N/A"}</Text>
              <Text style={[styles.tableCell]}>{item.buyer || "N/A"}</Text>
              <Text style={[styles.tableCell]}>{item.country || "N/A"}</Text>
              <Text style={[styles.tableCell]}>{item.origin || "N/A"}</Text>
              <Text style={[styles.tableCell]}>{item.mode || "N/A"}</Text>
              <Text style={[styles.tableCell]}>{item.orderQty}</Text>
              <Text style={[styles.tableCell]}>{item.inspectedQty}</Text>
              <Text style={[styles.tableCell]}>{item.totalPass}</Text>
              <Text style={[styles.tableCell]}>{item.totalReject}</Text>
              <Text style={[styles.tableCell, styles.lastCell]}>
                {item.passRate}%
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 11, borderRightWidth: 0 }]}>
              No data available
            </Text>
          </View>
        )}
      </View>
    </Page>
  </Document>
);

export default MeasurementSummaryPDF;
