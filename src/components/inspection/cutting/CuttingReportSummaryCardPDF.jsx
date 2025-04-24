import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: {
    marginBottom: 10
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5
  },
  card: {
    padding: 5,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#000",
    width: "14%",
    textAlign: "center"
  },
  cardTitle: {
    fontSize: 10,
    marginBottom: 3
  },
  cardValue: {
    fontSize: 12,
    fontWeight: "bold"
  },
  totalPcs: {
    backgroundColor: "#e6f0fa" // Light blue
  },
  totalPass: {
    backgroundColor: "#e6ffe6" // Light green
  },
  totalReject: {
    backgroundColor: "#ffe6e6" // Light red
  },
  measurementIssues: {
    backgroundColor: "#ffe6e6" // Light red
  },
  physicalDefects: {
    backgroundColor: "#ffe6e6" // Light red
  },
  passRateFail: {
    backgroundColor: "#ffe6e6" // Light red
  },
  passRatePass: {
    backgroundColor: "#e6ffe6" // Light green
  },
  resultPass: {
    backgroundColor: "#e6ffe6" // Light green
  },
  resultFail: {
    backgroundColor: "#ffe6e6" // Light red
  }
});

const CuttingReportSummaryCardPDF = ({ summary }) => {
  const passRate = parseFloat(summary.passRate);
  const isPassRateBelowThreshold = passRate < 80;
  const isResultPass = summary.result.toLowerCase() === "pass";

  return (
    <View style={styles.section}>
      <Text style={styles.subtitle}>Summary Data</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={[styles.card, styles.totalPcs]}>
          <Text style={styles.cardTitle}>Total Pcs</Text>
          <Text style={styles.cardValue}>{summary.totalPcs}</Text>
        </View>
        <View style={[styles.card, styles.totalPass]}>
          <Text style={styles.cardTitle}>Total Pass</Text>
          <Text style={styles.cardValue}>{summary.totalPass}</Text>
        </View>
        <View style={[styles.card, styles.totalReject]}>
          <Text style={styles.cardTitle}>Total Reject</Text>
          <Text style={styles.cardValue}>{summary.totalReject}</Text>
        </View>
        <View style={[styles.card, styles.measurementIssues]}>
          <Text style={styles.cardTitle}>Measurement Issues</Text>
          <Text style={styles.cardValue}>{summary.totalRejectMeasurement}</Text>
        </View>
        <View style={[styles.card, styles.physicalDefects]}>
          <Text style={styles.cardTitle}>Physical Defects</Text>
          <Text style={styles.cardValue}>{summary.totalRejectDefects}</Text>
        </View>
        <View
          style={[
            styles.card,
            isPassRateBelowThreshold ? styles.passRateFail : styles.passRatePass
          ]}
        >
          <Text style={styles.cardTitle}>Pass Rate</Text>
          <Text style={styles.cardValue}>{summary.passRate}%</Text>
        </View>
        <View
          style={[
            styles.card,
            isResultPass ? styles.resultPass : styles.resultFail
          ]}
        >
          <Text style={styles.cardTitle}>Result</Text>
          <Text style={styles.cardValue}>{summary.result}</Text>
        </View>
      </View>
    </View>
  );
};

export default CuttingReportSummaryCardPDF;
