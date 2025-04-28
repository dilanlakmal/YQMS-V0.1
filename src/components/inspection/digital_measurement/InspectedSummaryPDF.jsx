// src/components/inspection/digital_measurement/InspectedSummaryPDF.jsx
import React from "react";
import { Page, Document, View, Text, StyleSheet } from "@react-pdf/renderer";

// Simplified decimalToFraction for PDF (without JSX elements)
const decimalToFractionForPDF = (decimal) => {
  if (!decimal || isNaN(decimal)) return " ";

  const sign = decimal < 0 ? "-" : "";
  const absDecimal = Math.abs(decimal);
  const fractionValue =
    absDecimal >= 1 ? absDecimal - Math.floor(absDecimal) : absDecimal;
  const whole = absDecimal >= 1 ? Math.floor(absDecimal) : 0;

  if (fractionValue === 0) return `${sign}${whole || 0}`;

  const fractions = [
    { value: 0.0625, fraction: "1/16" },
    { value: 0.125, fraction: "1/8" },
    { value: 0.1875, fraction: "3/16" },
    { value: 0.25, fraction: "1/4" },
    { value: 0.3125, fraction: "5/16" },
    { value: 0.375, fraction: "3/8" },
    { value: 0.4375, fraction: "7/16" },
    { value: 0.5, fraction: "1/2" },
    { value: 0.5625, fraction: "9/16" },
    { value: 0.625, fraction: "5/8" },
    { value: 0.6875, fraction: "11/16" },
    { value: 0.75, fraction: "3/4" },
    { value: 0.8125, fraction: "13/16" },
    { value: 0.875, fraction: "7/8" },
    { value: 0.9375, fraction: "15/16" }
  ];

  const tolerance = 0.01;
  const closestFraction = fractions.find(
    (f) => Math.abs(fractionValue - f.value) < tolerance
  );

  if (closestFraction) {
    return whole !== 0
      ? `${sign}${whole} ${closestFraction.fraction}`
      : `${sign}${closestFraction.fraction}`;
  }
  return `${sign}${fractionValue.toFixed(3)}`;
};

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

const InspectedSummaryPDF = ({ records, sizeSpec, selectedMono }) => {
  const rows = records.flatMap((record, garmentIndex) => {
    const inspectionDate = new Date(record.created_at).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    );
    const garmentNo = garmentIndex + 1;
    const points = record.actual
      .map((actualItem, index) => {
        if (actualItem.value === 0) return null;
        const spec = sizeSpec[index];
        const measurementPoint = spec.EnglishRemark;
        const tolMinus = spec.ToleranceMinus.decimal;
        const tolPlus = spec.TolerancePlus.decimal;
        const buyerSpec = spec.Specs.find(
          (s) => Object.keys(s)[0] === record.size
        )[record.size].decimal;
        const measureValue = actualItem.value;
        const lower = buyerSpec + tolMinus;
        const upper = buyerSpec + tolPlus;
        const status =
          measureValue >= lower && measureValue <= upper ? "Pass" : "Fail";
        return {
          inspectionDate,
          garmentNo,
          measurementPoint,
          buyerSpec,
          tolMinus,
          tolPlus,
          measureValue,
          status,
          span: record.actual.filter((item) => item.value !== 0).length
        };
      })
      .filter((p) => p !== null);

    return points.map((point, pointIndex) => ({
      ...point,
      isFirst: pointIndex === 0
    }));
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={{ fontSize: 14, marginBottom: 10 }}>
          Inspected Summary for MO No: {selectedMono}
        </Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            {[
              "Inspection Date",
              "Garment NO",
              "Measurement Point",
              "Buyer Specs",
              "TolMinus",
              "TolPlus",
              "Measure Value",
              "Status"
            ].map((header, index) => (
              <Text
                key={index}
                style={[styles.tableCell, index === 7 ? styles.lastCell : {}]}
              >
                {header}
              </Text>
            ))}
          </View>
          {/* Rows */}
          {rows.length > 0 ? (
            rows.map((point, index) => (
              <View key={index} style={styles.tableRow}>
                {point.isFirst ? (
                  <Text style={[styles.tableCell]} rowSpan={point.span}>
                    {point.inspectionDate}
                  </Text>
                ) : null}
                {point.isFirst ? (
                  <Text style={[styles.tableCell]} rowSpan={point.span}>
                    {point.garmentNo}
                  </Text>
                ) : null}
                <Text style={[styles.tableCell]}>{point.measurementPoint}</Text>
                <Text style={[styles.tableCell]}>
                  {decimalToFractionForPDF(point.buyerSpec)}
                </Text>
                <Text style={[styles.tableCell]}>
                  {decimalToFractionForPDF(point.tolMinus)}
                </Text>
                <Text style={[styles.tableCell]}>
                  {decimalToFractionForPDF(point.tolPlus)}
                </Text>
                <Text style={[styles.tableCell]}>
                  {point.measureValue.toFixed(1)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.lastCell,
                    {
                      backgroundColor:
                        point.status === "Pass" ? "#d4edda" : "#f8d7da"
                    }
                  ]}
                >
                  {point.status}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text
                style={[styles.tableCell, { flex: 8, borderRightWidth: 0 }]}
              >
                No garments inspected for this MO No
              </Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default InspectedSummaryPDF;
