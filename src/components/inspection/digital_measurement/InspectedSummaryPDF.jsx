import React from "react";
import { Text, View } from "@react-pdf/renderer";

const InspectedSummaryPDF = ({
  moNo,
  measurementDetails,
  sizeSpec,
  styles,
  decimalToFraction
}) => {
  return (
    <>
      <Text style={styles.subtitle}>Inspected Summary for MO No: {moNo}</Text>
      <View style={styles.table}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeaderRow]}>
          {[
            { header: "Inspection Date", flex: 1.2 },
            { header: "Garment NO", flex: 1.2 },
            { header: "Size", flex: 0.8 },
            { header: "Measurement Point", flex: 2.5 },
            { header: "Buyer Specs", flex: 1 },
            { header: "TolMinus", flex: 0.8 },
            { header: "TolPlus", flex: 0.8 },
            { header: "Measure Value", flex: 1 },
            { header: "Diff", flex: 0.8 },
            { header: "Status", flex: 0.8 }
          ].map((col) => (
            <Text
              key={col.header}
              style={[
                styles.tableHeader,
                { flex: col.flex, textAlign: "center" }
              ]}
            >
              {col.header}
            </Text>
          ))}
        </View>
        {/* Table Body */}
        {measurementDetails.records.length > 0 ? (
          measurementDetails.records.map((record, garmentIndex) => {
            const inspectionDate = new Date(
              record.created_at
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit"
            });
            const garmentNo = `${garmentIndex + 1}\n(Ref: "${
              record.reference_no
            }")`;
            const size = record.size || "N/A";

            const points = record.actual
              .map((actualItem, index) => {
                if (actualItem.value === 0) return null;
                const spec = sizeSpec[index];
                if (!spec) return null;
                const measurementPoint = spec.EnglishRemark;
                const tolMinus = spec.ToleranceMinus.decimal;
                const tolPlus = spec.TolerancePlus.decimal;
                const buyerSpec =
                  spec.Specs.find((s) => Object.keys(s)[0] === record.size)?.[
                    record.size
                  ]?.decimal || 0;
                const measureValue = actualItem.value;
                const diff = buyerSpec - measureValue;
                const lower = buyerSpec + tolMinus;
                const upper = buyerSpec + tolPlus;
                const status =
                  measureValue >= lower && measureValue <= upper
                    ? "Pass"
                    : "Fail";
                return {
                  measurementPoint,
                  buyerSpec,
                  tolMinus,
                  tolPlus,
                  measureValue,
                  diff,
                  status
                };
              })
              .filter((p) => p !== null);

            // Calculate row height for merged cells (based on number of points)
            const rowSpanHeight = points.length * 12; // 12pt per row, adjust as needed

            return (
              <View key={garmentIndex} wrap={false}>
                {points.map((point, pointIndex) => (
                  <View
                    key={`${garmentIndex}-${pointIndex}`}
                    style={styles.tableRow}
                  >
                    {/* Inspection Date */}
                    {pointIndex === 0 ? (
                      <View
                        style={[
                          styles.tableCell,
                          {
                            flex: 1.2,
                            height: rowSpanHeight,
                            justifyContent: "center",
                            alignItems: "center"
                          }
                        ]}
                      >
                        <Text>{inspectionDate}</Text>
                      </View>
                    ) : null}
                    {/* Garment NO */}
                    {pointIndex === 0 ? (
                      <View
                        style={[
                          styles.tableCell,
                          {
                            flex: 1.2,
                            height: rowSpanHeight,
                            justifyContent: "center",
                            alignItems: "center"
                          }
                        ]}
                      >
                        <Text>{garmentNo}</Text>
                      </View>
                    ) : null}
                    {/* Size */}
                    {pointIndex === 0 ? (
                      <View
                        style={[
                          styles.tableCell,
                          {
                            flex: 0.8,
                            height: rowSpanHeight,
                            justifyContent: "center",
                            alignItems: "center"
                          }
                        ]}
                      >
                        <Text>{size}</Text>
                      </View>
                    ) : null}
                    {/* Measurement Point */}
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 2.5, textAlign: "left", paddingLeft: 4 }
                      ]}
                    >
                      {point.measurementPoint}
                    </Text>
                    {/* Buyer Specs */}
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 1, textAlign: "center" }
                      ]}
                    >
                      {decimalToFraction(point.buyerSpec)}
                    </Text>
                    {/* TolMinus */}
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 0.8, textAlign: "center" }
                      ]}
                    >
                      {decimalToFraction(point.tolMinus)}
                    </Text>
                    {/* TolPlus */}
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 0.8, textAlign: "center" }
                      ]}
                    >
                      {decimalToFraction(point.tolPlus)}
                    </Text>
                    {/* Measure Value */}
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 1, textAlign: "center" }
                      ]}
                    >
                      {point.measureValue.toFixed(3)}
                    </Text>
                    {/* Diff */}
                    <View
                      style={[
                        styles.tableCell,
                        {
                          flex: 0.8,
                          backgroundColor:
                            point.diff >= point.tolMinus &&
                            point.diff <= point.tolPlus
                              ? "#DCFFDC"
                              : "#FFDCDC",
                          justifyContent: "center",
                          alignItems: "center"
                        }
                      ]}
                    >
                      <Text>{point.diff.toFixed(3)}</Text>
                    </View>
                    {/* Status */}
                    <View
                      style={[
                        styles.tableCell,
                        {
                          flex: 0.8,
                          backgroundColor:
                            point.status === "Pass" ? "#DCFFDC" : "#FFDCDC",
                          justifyContent: "center",
                          alignItems: "center"
                        }
                      ]}
                    >
                      <Text>{point.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
        ) : (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 10, textAlign: "center" }]}>
              No inspection data available
            </Text>
          </View>
        )}
      </View>
    </>
  );
};

export default InspectedSummaryPDF;
