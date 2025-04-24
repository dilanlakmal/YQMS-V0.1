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
  table: {
    display: "table",
    width: "auto",
    borderWidth: 1,
    borderStyle: "solid"
  },
  row: {
    flexDirection: "row"
  },
  cell: {
    padding: 5,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightStyle: "solid"
  },
  headerCell: {
    padding: 5,
    fontSize: 10,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightStyle: "solid",
    borderBottomWidth: 1,
    borderBottomStyle: "solid"
  }
});

const CuttingReportOrderDetailsPDF = ({ data }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.subtitle}>Order Details</Text>
      <View style={styles.table}>
        <View style={styles.row}>
          {[
            "Inspection Date",
            "MO No",
            "Buyer",
            "Lot No",
            "Color",
            "Table No",
            "Cutting Table",
            "Cutting Type",
            "Garment Type",
            "QC ID"
          ].map((header, i) => (
            <Text
              key={i}
              style={[
                styles.headerCell,
                { width: "10%", borderRightWidth: i < 9 ? 1 : 0 }
              ]}
            >
              {header}
            </Text>
          ))}
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, { width: "10%" }]}>
            {data.inspectionDate}
          </Text>
          <Text style={[styles.cell, { width: "10%" }]}>{data.moNo}</Text>
          <Text style={[styles.cell, { width: "10%" }]}>{data.buyer}</Text>
          <Text style={[styles.cell, { width: "10%" }]}>{data.lotNo}</Text>
          <Text style={[styles.cell, { width: "10%" }]}>{data.color}</Text>
          <Text style={[styles.cell, { width: "10%" }]}>{data.tableNo}</Text>
          <Text style={[styles.cell, { width: "10%" }]}>
            {data.cuttingtableLetter}
            {data.cuttingtableNo}
          </Text>
          <Text style={[styles.cell, { width: "10%" }]}>
            {data.cuttingtype}
          </Text>
          <Text style={[styles.cell, { width: "10%" }]}>
            {data.garmentType}
          </Text>
          <Text style={[styles.cell, { width: "10%", borderRightWidth: 0 }]}>
            {data.cutting_emp_id}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={[styles.section, { width: "48%" }]}>
          <Text style={styles.subtitle}>Inspection Details</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              {[
                "Order Qty",
                "Total Bundle Qty",
                "Bundle Qty Check",
                "Total Inspection Qty",
                "Total Layer Qty",
                "Total Pcs"
              ].map((header, i) => (
                <Text
                  key={i}
                  style={[
                    styles.headerCell,
                    { width: "16.66%", borderRightWidth: i < 5 ? 1 : 0 }
                  ]}
                >
                  {header}
                </Text>
              ))}
            </View>
            <View style={styles.row}>
              <Text style={[styles.cell, { width: "16.66%" }]}>
                {data.orderQty}
              </Text>
              <Text style={[styles.cell, { width: "16.66%" }]}>
                {data.totalBundleQty}
              </Text>
              <Text style={[styles.cell, { width: "16.66%" }]}>
                {data.bundleQtyCheck}
              </Text>
              <Text style={[styles.cell, { width: "16.66%" }]}>
                {data.totalInspectionQty}
              </Text>
              <Text style={[styles.cell, { width: "16.66%" }]}>
                {data.actualLayerQty || data.planLayerQty}
              </Text>
              <Text
                style={[styles.cell, { width: "16.66%", borderRightWidth: 0 }]}
              >
                {data.totalPcs}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { width: "48%" }]}>
          <Text style={styles.subtitle}>
            Marker Data (Marker: {data.marker || "N/A"})
          </Text>
          <View style={styles.table}>
            <View style={styles.row}>
              {data.markerRatio
                .sort((a, b) => a.index - b.index)
                .map((ratio) => (
                  <Text
                    key={ratio.index}
                    style={[
                      styles.headerCell,
                      { width: `${100 / data.markerRatio.length}%` }
                    ]}
                  >
                    {ratio.markerSize}
                  </Text>
                ))}
            </View>
            <View style={styles.row}>
              {data.markerRatio
                .sort((a, b) => a.index - b.index)
                .map((ratio) => (
                  <Text
                    key={ratio.index}
                    style={[
                      styles.cell,
                      { width: `${100 / data.markerRatio.length}%` }
                    ]}
                  >
                    {ratio.ratio}
                  </Text>
                ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CuttingReportOrderDetailsPDF;
