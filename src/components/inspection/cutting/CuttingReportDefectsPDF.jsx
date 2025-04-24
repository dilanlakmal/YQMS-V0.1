import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: {
    marginBottom: 10
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5
  },
  table: {
    display: "table",
    width: "auto",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#000"
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#000"
  },
  headerCell: {
    padding: 5,
    fontSize: 10,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightStyle: "solid",
    borderRightColor: "#000",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#000",
    textAlign: "center"
  },
  cell: {
    padding: 5,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightStyle: "solid",
    borderRightColor: "#000",
    textAlign: "center"
  }
});

const CuttingReportDefectsPDF = ({ defectData }) => {
  if (!defectData || defectData.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.subtitle}>Physical Defects</Text>
        <Text>No defect recorded</Text>
      </View>
    );
  }

  const defectRows = defectData.flatMap((defect) =>
    defect.defects.map((d) => ({
      partName: defect.column,
      defectName: d.defectName,
      defectQty: d.defectQty
    }))
  );

  if (defectRows.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.subtitle}>Physical Defects</Text>
        <Text>No defect recorded</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.subtitle}>Physical Defects</Text>
      <View style={styles.table}>
        {/* Header Row 1: Part Name and Defect Details */}
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text
            style={[
              styles.headerCell,
              { width: "33.33%", borderBottomWidth: 0 }
            ]}
          >
            Part Name
          </Text>
          <Text
            style={[
              styles.headerCell,
              { width: "66.66%", borderRightWidth: 0, borderBottomWidth: 0 }
            ]}
          >
            Defect Details
          </Text>
        </View>
        {/* Header Row 2: Empty cell under Part Name, Name, and Qty */}
        <View style={styles.row}>
          <Text style={[styles.headerCell, { width: "33.33%" }]} />
          <Text style={[styles.headerCell, { width: "33.33%" }]}>Name</Text>
          <Text
            style={[
              styles.headerCell,
              { width: "33.33%", borderRightWidth: 0 }
            ]}
          >
            Qty
          </Text>
        </View>
        {/* Data Rows */}
        {defectRows.map((row, idx) => (
          <View
            key={idx}
            style={[
              styles.row,
              { borderBottomWidth: idx === defectRows.length - 1 ? 0 : 1 }
            ]}
          >
            <Text style={[styles.cell, { width: "33.33%" }]}>
              {row.partName}
            </Text>
            <Text style={[styles.cell, { width: "33.33%" }]}>
              {row.defectName}
            </Text>
            <Text
              style={[styles.cell, { width: "33.33%", borderRightWidth: 0 }]}
            >
              {row.defectQty}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default CuttingReportDefectsPDF;
