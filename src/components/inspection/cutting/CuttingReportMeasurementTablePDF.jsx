import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
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
    textAlign: "center"
  },
  cell: {
    padding: 5,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightStyle: "solid",
    borderRightColor: "#000",
    textAlign: "center"
  },
  measurementPointCell: {
    padding: 5,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightStyle: "solid",
    borderRightColor: "#000",
    textAlign: "left" // Left-align for Measurement Point
  },
  passCell: {
    backgroundColor: "#e6ffe6" // Light green
  },
  failCell: {
    backgroundColor: "#ffe6e6" // Light red
  }
});

const decimalToFraction = (decimal) => {
  if (decimal === 0) return "0";
  const sign = decimal < 0 ? "-" : "";
  decimal = Math.abs(decimal);
  const precision = 10000;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const numerator = Math.round(decimal * precision);
  const denominator = precision;
  const divisor = gcd(numerator, denominator);
  const num = numerator / divisor;
  const den = denominator / divisor;
  if (den === 1) return `${sign}${num}`;
  return `${sign}${num}/${den}`;
};

const TOLERANCE_MIN = -0.125;
const TOLERANCE_MAX = 0.125;

const CuttingReportMeasurementTablePDF = ({ panel }) => {
  const getSubColumns = (location) => {
    const md = panel.measurementData.find((m) => m.location === location);
    if (!md) return [];
    const allPartNames = md.measurementPointData.flatMap((mpd) =>
      mpd.measurementValues.map((mv) => mv.partName)
    );
    return [...new Set(allPartNames)].sort();
  };

  const topSubColumns = getSubColumns("Top");
  const middleSubColumns = getSubColumns("Middle");
  const bottomSubColumns = getSubColumns("Bottom");

  const allPoints = panel.measurementData.flatMap((md) =>
    md.measurementPointData.map((mpd) => mpd.measurementPointName)
  );
  const uniquePoints = [...new Set(allPoints)];

  // Calculate column widths
  const totalSubColumns =
    topSubColumns.length + middleSubColumns.length + bottomSubColumns.length;
  const measurementPointWidth = 30; // Fixed width for Measurement Point (in percentage)
  const subColumnWidth = (100 - measurementPointWidth) / totalSubColumns; // Width for each sub-column

  return (
    <View style={styles.table}>
      {/* Header Row 1: Measurement Point, Top, Middle, Bottom */}
      <View style={[styles.row, { borderBottomWidth: 0 }]}>
        <Text
          style={[
            styles.headerCell,
            { width: `${measurementPointWidth}%`, borderBottomWidth: 0 }
          ]}
          rowSpan={2}
        >
          Measurement Point
        </Text>
        {topSubColumns.length > 0 && (
          <Text
            style={[
              styles.headerCell,
              {
                width: `${subColumnWidth * topSubColumns.length}%`,
                borderBottomWidth: 0
              }
            ]}
          >
            Top
          </Text>
        )}
        {middleSubColumns.length > 0 && (
          <Text
            style={[
              styles.headerCell,
              {
                width: `${subColumnWidth * middleSubColumns.length}%`,
                borderBottomWidth: 0
              }
            ]}
          >
            Middle
          </Text>
        )}
        {bottomSubColumns.length > 0 && (
          <Text
            style={[
              styles.headerCell,
              {
                width: `${subColumnWidth * bottomSubColumns.length}%`,
                borderBottomWidth: 0,
                borderRightWidth: 0
              }
            ]}
          >
            Bottom
          </Text>
        )}
      </View>
      {/* Header Row 2: Sub-columns (T1, T2, ..., M1, M2, ..., B1, B2, ...) */}
      <View style={styles.row}>
        {/* Empty cell under Measurement Point */}
        <Text
          style={[
            styles.headerCell,
            { width: `${measurementPointWidth}%`, borderBottomWidth: 1 }
          ]}
        />
        {topSubColumns.map((partName) => (
          <Text
            key={partName}
            style={[styles.headerCell, { width: `${subColumnWidth}%` }]}
          >
            {partName}
          </Text>
        ))}
        {middleSubColumns.map((partName) => (
          <Text
            key={partName}
            style={[styles.headerCell, { width: `${subColumnWidth}%` }]}
          >
            {partName}
          </Text>
        ))}
        {bottomSubColumns.map((partName, idx) => (
          <Text
            key={partName}
            style={[
              styles.headerCell,
              {
                width: `${subColumnWidth}%`,
                borderRightWidth: idx === bottomSubColumns.length - 1 ? 0 : 1
              }
            ]}
          >
            {partName}
          </Text>
        ))}
      </View>
      {/* Data Rows */}
      {uniquePoints.map((pointName, pointIdx) => (
        <View
          key={pointIdx}
          style={[
            styles.row,
            {
              borderBottomWidth: pointIdx === uniquePoints.length - 1 ? 0 : 1
            }
          ]}
        >
          <Text
            style={[
              styles.measurementPointCell,
              { width: `${measurementPointWidth}%` }
            ]}
          >
            {pointName}
          </Text>
          {topSubColumns.map((partName) => {
            const md = panel.measurementData.find((m) => m.location === "Top");
            const mpd = md?.measurementPointData.find(
              (mp) => mp.measurementPointName === pointName
            );
            const mv = mpd?.measurementValues.find(
              (v) => v.partName === partName
            );
            const measurementValue = mv ? parseFloat(mv.measurement) : 0;
            const isWithinTolerance =
              measurementValue >= TOLERANCE_MIN &&
              measurementValue <= TOLERANCE_MAX;
            return (
              <Text
                key={partName}
                style={[
                  styles.cell,
                  { width: `${subColumnWidth}%` },
                  isWithinTolerance ? styles.passCell : styles.failCell
                ]}
              >
                {mv ? decimalToFraction(mv.measurement) : "0"}
              </Text>
            );
          })}
          {middleSubColumns.map((partName) => {
            const md = panel.measurementData.find(
              (m) => m.location === "Middle"
            );
            const mpd = md?.measurementPointData.find(
              (mp) => mp.measurementPointName === pointName
            );
            const mv = mpd?.measurementValues.find(
              (v) => v.partName === partName
            );
            const measurementValue = mv ? parseFloat(mv.measurement) : 0;
            const isWithinTolerance =
              measurementValue >= TOLERANCE_MIN &&
              measurementValue <= TOLERANCE_MAX;
            return (
              <Text
                key={partName}
                style={[
                  styles.cell,
                  { width: `${subColumnWidth}%` },
                  isWithinTolerance ? styles.passCell : styles.failCell
                ]}
              >
                {mv ? decimalToFraction(mv.measurement) : "0"}
              </Text>
            );
          })}
          {bottomSubColumns.map((partName, idx) => {
            const md = panel.measurementData.find(
              (m) => m.location === "Bottom"
            );
            const mpd = md?.measurementPointData.find(
              (mp) => mp.measurementPointName === pointName
            );
            const mv = mpd?.measurementValues.find(
              (v) => v.partName === partName
            );
            const measurementValue = mv ? parseFloat(mv.measurement) : 0;
            const isWithinTolerance =
              measurementValue >= TOLERANCE_MIN &&
              measurementValue <= TOLERANCE_MAX;
            return (
              <Text
                key={partName}
                style={[
                  styles.cell,
                  {
                    width: `${subColumnWidth}%`,
                    borderRightWidth:
                      idx === bottomSubColumns.length - 1 ? 0 : 1
                  },
                  isWithinTolerance ? styles.passCell : styles.failCell
                ]}
              >
                {mv ? decimalToFraction(mv.measurement) : "0"}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export default CuttingReportMeasurementTablePDF;
