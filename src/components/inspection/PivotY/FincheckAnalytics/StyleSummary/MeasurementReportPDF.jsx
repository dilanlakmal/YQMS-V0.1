import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts if needed, otherwise Helvetica is default
// Font.register({ family: 'Roboto', src: 'path/to/font.ttf' });

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },
  // --- Header Styles ---
  headerContainer: {
    marginBottom: 10,
    width: "100%",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  factoryName: {
    fontSize: 14,
    color: "#4338ca", // Indigo-700
    fontWeight: "bold",
  },
  orderBadge: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 10,
    color: "#1f2937",
  },
  headerInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 5,
  },
  infoTextGroup: {
    flexDirection: "row",
    gap: 10,
  },
  infoText: {
    fontSize: 9,
    color: "#6b7280", // Gray-500
  },
  infoValue: {
    color: "#111827", // Gray-900
    fontWeight: "bold",
  },
  fincheckTitle: {
    fontSize: 14,
    color: "#312e81", // Indigo-900
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  headerLine: {
    height: 2,
    backgroundColor: "#4f46e5", // Indigo-600
    width: "100%",
    marginTop: 2,
  },
  // --- Config Title ---
  configTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  configTitleText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  stageBadge: {
    backgroundColor: "#14b8a6", // Teal-500 (or Purple based on stage)
    color: "#FFFFFF",
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginLeft: 5,
  },
  // --- Table Styles ---
  tableContainer: {
    width: "100%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#e5e7eb", // Gray-200
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 18,
    alignItems: "stretch",
  },
  headerRow: {
    backgroundColor: "#f3f4f6", // Gray-100
  },
  subHeaderRow: {
    backgroundColor: "#f9fafb", // Gray-50
  },
  // Cell Base
  cell: {
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  textCell: {
    fontSize: 7,
    textAlign: "center",
  },
  textCellBold: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Specific Column Widths
  colPoint: { width: 120, alignItems: "flex-start", paddingLeft: 4 },
  colTol: { width: 30 },

  // Dynamic Size Columns
  sizeHeaderCell: {
    backgroundColor: "#e0e7ff", // Indigo-50
    flexGrow: 1,
  },

  // Row colors
  rowEven: { backgroundColor: "#ffffff" },
  rowOdd: { backgroundColor: "#f9fafb" },
  rowCritical: { backgroundColor: "#eff6ff" }, // Blue-50

  // Value Colors (Simulating tailwind classes)
  bgGreen: { backgroundColor: "#f0fdf4" }, // Green-50
  textGreen: { color: "#16a34a" }, // Green-600
  bgRed: { backgroundColor: "#fef2f2" }, // Red-50
  textRed: { color: "#dc2626" }, // Red-600
  textGray: { color: "#9ca3af" }, // Gray-400

  stickyCol: {
    backgroundColor: "#f3f4f6",
  },

  // Footer
  pageNumber: {
    position: "absolute",
    fontSize: 8,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#9ca3af",
  },
});

// Helper for tolerance check (copied from logic)
const checkTolerance = (spec, value) => {
  if (value === 0 || value === "" || value === null || value === undefined)
    return { isWithin: true, isDefault: true };
  const reading = parseFloat(value);
  if (isNaN(reading)) return { isWithin: true, isDefault: true };

  const tolMinusDecimal = parseFloat(spec.TolMinus?.decimal);
  const tolPlusDecimal = parseFloat(spec.TolPlus?.decimal);
  if (isNaN(tolMinusDecimal) && isNaN(tolPlusDecimal))
    return { isWithin: true, isDefault: true };

  const lowerLimit = isNaN(tolMinusDecimal) ? 0 : -Math.abs(tolMinusDecimal);
  const upperLimit = isNaN(tolPlusDecimal) ? 0 : Math.abs(tolPlusDecimal);
  const epsilon = 0.0001;
  const isWithin =
    reading >= lowerLimit - epsilon && reading <= upperLimit + epsilon;

  return { isWithin, isDefault: false };
};

const formatSpecFraction = (fractionStr) => {
  if (!fractionStr || fractionStr === "-") return "-";
  return String(fractionStr).replace(/(\d)-(\d)/g, "$1 $2");
};

// --- SUB-COMPONENT: Single Table in PDF ---
const MeasurementTablePDF = ({ group, specsData, sizeList }) => {
  const { measurements, stage, config } = group;
  const fullSpecs =
    stage === "Before" ? specsData.Before?.full : specsData.After?.full;
  const criticalSpecs =
    stage === "Before" ? specsData.Before?.selected : specsData.After?.selected;
  const criticalSpecIds = new Set((criticalSpecs || []).map((s) => s.id));

  const validMeasurements = measurements.filter(
    (m) => m.size !== "Manual_Entry",
  );

  if (!fullSpecs || validMeasurements.length === 0) return null;

  const sortedMeasurements = [...validMeasurements].sort((a, b) => {
    const idxA = sizeList.indexOf(a.size);
    const idxB = sizeList.indexOf(b.size);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.size.localeCompare(b.size, undefined, { numeric: true });
  });

  // Calculate width percentages for dynamic columns
  // Fixed width approx 180px (Point + Tols), rest divided by total columns
  const totalSubCols = sortedMeasurements.reduce((acc, m) => {
    return (
      acc +
      1 +
      (m.allEnabledPcs?.length || 0) +
      (m.criticalEnabledPcs?.length || 0)
    );
  }, 0);

  // We use flex grow for dynamic columns

  return (
    <View wrap={false} style={{ marginBottom: 15 }}>
      {/* Config Title */}
      <View style={styles.configTitleRow}>
        <Text style={styles.configTitleText}>
          {[config.line, config.table, config.color]
            .filter(Boolean)
            .join(" / ") || "General Config"}
        </Text>
        <Text
          style={[
            styles.stageBadge,
            { backgroundColor: stage === "Before" ? "#a855f7" : "#14b8a6" },
          ]}
        >
          {stage === "Before" ? "Before Wash" : "Buyer Spec Measurement"}
        </Text>
      </View>

      <View style={styles.tableContainer}>
        {/* HEADER ROW 1: Measurement Point | Tol | Sizes */}
        <View style={[styles.tableRow, styles.headerRow]}>
          <View style={[styles.cell, styles.colPoint, styles.stickyCol]}>
            <Text style={styles.textCellBold}>Measurement Point</Text>
          </View>
          <View style={[styles.cell, styles.colTol]}>
            <Text style={[styles.textCellBold, styles.textRed]}>TOL (-)</Text>
          </View>
          <View style={[styles.cell, styles.colTol]}>
            <Text style={[styles.textCellBold, styles.textGreen]}>TOL (+)</Text>
          </View>

          {sortedMeasurements.map((m, i) => {
            const subCols =
              1 +
              (m.allEnabledPcs?.length || 0) +
              (m.criticalEnabledPcs?.length || 0);
            return (
              <View
                key={i}
                style={[styles.cell, styles.sizeHeaderCell, { flex: subCols }]}
              >
                <Text style={[styles.textCellBold, { color: "#4338ca" }]}>
                  {m.size}
                </Text>
              </View>
            );
          })}
        </View>

        {/* HEADER ROW 2: Sub-headers (Spec, A, C) */}
        <View style={[styles.tableRow, styles.subHeaderRow]}>
          <View style={[styles.cell, styles.colPoint, styles.stickyCol]}></View>
          <View style={[styles.cell, styles.colTol]}></View>
          <View style={[styles.cell, styles.colTol]}></View>

          {sortedMeasurements.map((m, i) => (
            <React.Fragment key={i}>
              <View
                style={[styles.cell, { flex: 1, backgroundColor: "#eff6ff" }]}
              >
                <Text style={[styles.textCellBold, { color: "#2563eb" }]}>
                  Spec
                </Text>
              </View>
              {m.allEnabledPcs?.map((_, idx) => (
                <View
                  key={`a-${idx}`}
                  style={[styles.cell, { flex: 1, backgroundColor: "#fffbeb" }]}
                >
                  <Text style={[styles.textCellBold, { color: "#d97706" }]}>
                    A #{idx + 1}
                  </Text>
                </View>
              ))}
              {m.criticalEnabledPcs?.map((_, idx) => (
                <View
                  key={`c-${idx}`}
                  style={[styles.cell, { flex: 1, backgroundColor: "#faf5ff" }]}
                >
                  <Text style={[styles.textCellBold, { color: "#9333ea" }]}>
                    C #{idx + 1}
                  </Text>
                </View>
              ))}
            </React.Fragment>
          ))}
        </View>

        {/* DATA ROWS */}
        {fullSpecs.map((spec, sIdx) => {
          const isCritical = criticalSpecIds.has(spec.id);
          const rowStyle = isCritical
            ? styles.rowCritical
            : sIdx % 2 === 0
              ? styles.rowEven
              : styles.rowOdd;
          const stickyStyle = isCritical
            ? { backgroundColor: "#eff6ff" }
            : sIdx % 2 === 0
              ? { backgroundColor: "#fff" }
              : { backgroundColor: "#f9fafb" };

          return (
            <View key={spec.id} style={[styles.tableRow, rowStyle]}>
              {/* Fixed Columns */}
              <View style={[styles.cell, styles.colPoint, stickyStyle]}>
                <Text style={styles.textCellBold}>
                  {spec.MeasurementPointEngName}
                </Text>
                {isCritical && (
                  <Text style={{ fontSize: 6, color: "#2563eb", marginTop: 1 }}>
                    ★ CRITICAL POINT
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.cell,
                  styles.colTol,
                  { backgroundColor: "#fef2f2" },
                ]}
              >
                <Text style={[styles.textCellBold, styles.textRed]}>
                  {spec.TolMinus?.fraction || "-"}
                </Text>
              </View>
              <View
                style={[
                  styles.cell,
                  styles.colTol,
                  { backgroundColor: "#f0fdf4" },
                ]}
              >
                <Text style={[styles.textCellBold, styles.textGreen]}>
                  {spec.TolPlus?.fraction || "-"}
                </Text>
              </View>

              {/* Dynamic Columns */}
              {sortedMeasurements.map((m, mIdx) => {
                const sizeSpec = spec.Specs?.find((s) => s.size === m.size);
                const specValDisplay = sizeSpec
                  ? formatSpecFraction(sizeSpec.fraction)
                  : "-";

                return (
                  <React.Fragment key={mIdx}>
                    {/* Spec Value */}
                    <View
                      style={[
                        styles.cell,
                        { flex: 1, backgroundColor: "#eff6ff" },
                      ]}
                    >
                      <Text style={[styles.textCellBold, { color: "#2563eb" }]}>
                        {specValDisplay}
                      </Text>
                    </View>

                    {/* 'A' Columns */}
                    {m.allEnabledPcs?.map((pcsIndex) => {
                      const valObj = m.allMeasurements?.[spec.id]?.[pcsIndex];
                      const decimal = valObj?.decimal || 0;
                      const fraction = valObj?.fraction || "-";
                      const check = checkTolerance(spec, decimal);

                      let styleArr = [
                        styles.textCell,
                        { fontFamily: "Helvetica" },
                      ]; // monospace fallback
                      if (decimal === 0) {
                        styleArr.push(styles.textGreen);
                        styleArr.push(styles.bgGreen);
                        styleArr.push({ fontWeight: "bold" });
                      } else if (check.isWithin || check.isDefault) {
                        styleArr.push(styles.textGreen);
                        styleArr.push(styles.bgGreen);
                        styleArr.push({ fontWeight: "bold" });
                      } else {
                        styleArr.push(styles.textRed);
                        styleArr.push(styles.bgRed);
                        styleArr.push({ fontWeight: "bold" });
                      }

                      return (
                        <View
                          key={`val-a-${pcsIndex}`}
                          style={[
                            styles.cell,
                            { flex: 1 },
                            styleArr[1],
                            styleArr[2],
                          ]}
                        >
                          <Text style={styleArr}>{fraction}</Text>
                        </View>
                      );
                    })}

                    {/* 'C' Columns */}
                    {m.criticalEnabledPcs?.map((pcsIndex) => {
                      const valObj =
                        m.criticalMeasurements?.[spec.id]?.[pcsIndex];
                      const decimal = valObj?.decimal || 0;
                      const fraction = valObj?.fraction || "-";
                      const check = checkTolerance(spec, decimal);

                      let styleArr = [styles.textCell];
                      if (decimal === 0) {
                        styleArr.push(styles.textGray);
                        // styleArr.push({ backgroundColor: '#f9fafb' });
                      } else if (check.isWithin || check.isDefault) {
                        styleArr.push(styles.textGreen);
                        styleArr.push(styles.bgGreen);
                        styleArr.push({ fontWeight: "bold" });
                      } else {
                        styleArr.push(styles.textRed);
                        styleArr.push(styles.bgRed);
                        styleArr.push({ fontWeight: "bold" });
                      }

                      return (
                        <View
                          key={`val-c-${pcsIndex}`}
                          style={[
                            styles.cell,
                            { flex: 1 },
                            styleArr[1],
                            styleArr[2],
                          ]}
                        >
                          <Text style={styleArr}>{fraction}</Text>
                        </View>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
};

// --- MAIN PDF DOCUMENT ---
const MeasurementReportPDF = ({ reports, specs, sizeList, styleNo, buyer }) => (
  <Document>
    {reports.map((report, rIdx) => {
      // Only render if it has measurement data (ignoring manual-only if needed, but table checks logic internally)
      if (!report.hasMeasurementData) return null;

      return (
        <Page
          key={report._id || rIdx}
          size="A4"
          orientation="landscape"
          style={styles.page}
        >
          {/* HEADER (Fixed on page) */}
          <View fixed style={styles.headerContainer}>
            <View style={styles.headerTopRow}>
              <Text style={styles.factoryName}>
                {report.inspectionDetails?.factory ||
                  "Yorkmars (Cambodia) Garment MFG Co., LTD"}
              </Text>
              <View style={styles.orderBadge}>
                <Text>Order: {report.orderNosString || styleNo}</Text>
              </View>
            </View>

            <View style={styles.headerInfoRow}>
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoText}>
                  REPORT:{" "}
                  <Text style={styles.infoValue}>
                    {report.inspectionDetails?.shippingStage || "Inspection"}
                  </Text>
                </Text>
                <Text style={styles.infoText}>
                  DATE:{" "}
                  <Text style={styles.infoValue}>
                    {new Date(report.inspectionDate).toLocaleDateString()}
                  </Text>
                </Text>
                <Text style={styles.infoText}>
                  TYPE:{" "}
                  <Text style={styles.infoValue}>
                    {report.inspectionType === "first"
                      ? "First"
                      : "Re-Inspection"}
                  </Text>
                </Text>
                <Text style={styles.infoText}>
                  QA ID: <Text style={styles.infoValue}>{report.qaId}</Text>
                </Text>
              </View>
              <Text style={styles.fincheckTitle}>FINCHECK INSPECTION</Text>
            </View>
            <View style={styles.headerLine} />
          </View>

          {/* CONTENT: Loop through groups for this report */}
          {report.measurementGroups.map((group, gIdx) => (
            <MeasurementTablePDF
              key={gIdx}
              group={group}
              specsData={specs}
              sizeList={sizeList}
            />
          ))}

          {/* FOOTER: Page Numbers */}
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
            fixed
          />
        </Page>
      );
    })}
  </Document>
);

export default MeasurementReportPDF;
