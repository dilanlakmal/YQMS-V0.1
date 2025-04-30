import React from "react";
import { Text, View } from "@react-pdf/renderer";

const MeasurementSummaryPDF = ({ measurementSummary, styles }) => {
  return (
    <>
      <Text style={styles.subtitle}>Measurement Summary</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
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
          ].map((header) => (
            <Text
              key={header}
              style={[
                styles.tableHeader,
                { flex: header === "MO No" ? 1.5 : 1 }
              ]}
            >
              {header}
            </Text>
          ))}
        </View>
        {measurementSummary.length > 0 ? (
          measurementSummary.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.moNo}</Text>
              <Text style={styles.tableCell}>{item.custStyle || "N/A"}</Text>
              <Text style={styles.tableCell}>{item.buyer || "N/A"}</Text>
              <Text style={styles.tableCell}>{item.country || "N/A"}</Text>
              <Text style={styles.tableCell}>{item.origin || "N/A"}</Text>
              <Text style={styles.tableCell}>{item.mode || "N/A"}</Text>
              <Text style={styles.tableCell}>{item.orderQty}</Text>
              <Text style={styles.tableCell}>{item.inspectedQty}</Text>
              <Text style={styles.tableCell}>{item.totalPass}</Text>
              <Text style={styles.tableCell}>{item.totalReject}</Text>
              <Text style={styles.tableCell}>{item.passRate}%</Text>
            </View>
          ))
        ) : (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 11 }]}>
              No data available
            </Text>
          </View>
        )}
      </View>
    </>
  );
};

export default MeasurementSummaryPDF;
