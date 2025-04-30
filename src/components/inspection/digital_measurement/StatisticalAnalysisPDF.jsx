import React from "react";
import { Text, View } from "@react-pdf/renderer";

const StatisticalAnalysisPDF = ({
  measurementPoints,
  sizes,
  matrix,
  styles
}) => {
  return (
    <>
      <Text style={styles.subtitle}>Statistical Analysis</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.tableHeader, { flex: 2 }]}>
            Measurement Point
          </Text>
          {sizes.map((size) => (
            <Text key={size} style={[styles.tableHeader, { flex: 1 }]}>
              {size}
            </Text>
          ))}
        </View>
        {matrix.length > 0 ? (
          matrix.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2, textAlign: "left" }]}>
                {row.measurementPoint}
              </Text>
              {sizes.map((size) => (
                <Text key={size} style={[styles.tableCell, { flex: 1 }]}>
                  {row.data[size].totalCount > 0
                    ? `Count: ${row.data[size].totalCount}, Cpk: ${
                        row.data[size].cpk === Infinity
                          ? "Inf"
                          : row.data[size].cpk !== null
                          ? row.data[size].cpk.toFixed(2)
                          : "-"
                      }`
                    : "-"}
                </Text>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: sizes.length + 2 }]}>
              No statistical data available
            </Text>
          </View>
        )}
      </View>
    </>
  );
};

export default StatisticalAnalysisPDF;
