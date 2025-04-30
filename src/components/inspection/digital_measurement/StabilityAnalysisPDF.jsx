import React from "react";
import { Text, View } from "@react-pdf/renderer";

const StabilityAnalysisPDF = ({
  sizeBasedSummary,
  styles,
  decimalToFraction
}) => {
  return (
    <>
      <Text style={styles.subtitle}>Stability Analysis</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          {[
            "Size",
            "Measurement Point",
            "Buyer Spec",
            "Tol-",
            "Tol+",
            "Total Count",
            "Total Pass",
            "Total Fail",
            "Mean",
            "Std. Dev",
            "Diff",
            "Diff %",
            "Pass Rate",
            "Cpk",
            "Cp",
            "CV (%)",
            "Stability"
          ].map((header) => (
            <Text
              key={header}
              style={[
                styles.tableHeader,
                { flex: header === "Measurement Point" ? 2 : 1 }
              ]}
            >
              {header}
            </Text>
          ))}
        </View>
        {sizeBasedSummary.length > 0 ? (
          sizeBasedSummary.map((point, index) => {
            const isFirstSizeRow =
              index === 0 || point.size !== sizeBasedSummary[index - 1].size;
            return (
              <View key={index} style={styles.tableRow}>
                {isFirstSizeRow ? (
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {point.size}
                  </Text>
                ) : null}
                <Text
                  style={[styles.tableCell, { flex: 2, textAlign: "left" }]}
                >
                  {point.measurementPoint}
                </Text>
                <Text style={styles.tableCell}>
                  {decimalToFraction(point.buyerSpec)}
                </Text>
                <Text style={styles.tableCell}>
                  {decimalToFraction(point.tolMinus)}
                </Text>
                <Text style={styles.tableCell}>
                  {decimalToFraction(point.tolPlus)}
                </Text>
                <Text style={styles.tableCell}>{point.totalCount}</Text>
                <Text style={styles.tableCell}>{point.totalPass}</Text>
                <Text style={styles.tableCell}>{point.totalFail}</Text>
                <Text style={styles.tableCell}>{point.mean.toFixed(2)}</Text>
                <Text style={styles.tableCell}>{point.stdDev.toFixed(2)}</Text>
                <Text style={styles.tableCell}>{point.diff.toFixed(4)}</Text>
                <Text style={styles.tableCell}>
                  {point.diffPercent.toFixed(2)}%
                </Text>
                <Text style={styles.tableCell}>{point.passRate}%</Text>
                <Text style={styles.tableCell}>
                  {point.cpk === Infinity
                    ? "Inf"
                    : point.cpk !== null
                    ? point.cpk.toFixed(2)
                    : "-"}
                </Text>
                <Text style={styles.tableCell}>
                  {point.cp === Infinity
                    ? "Inf"
                    : point.cp !== null
                    ? point.cp.toFixed(2)
                    : "-"}
                </Text>
                <Text style={styles.tableCell}>
                  {point.cv !== null ? point.cv.toFixed(2) : "-"}
                </Text>
                <Text style={styles.tableCell}>{point.stabilityStatus}</Text>
              </View>
            );
          })
        ) : (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 17 }]}>
              No stability data available
            </Text>
          </View>
        )}
      </View>
    </>
  );
};

export default StabilityAnalysisPDF;
