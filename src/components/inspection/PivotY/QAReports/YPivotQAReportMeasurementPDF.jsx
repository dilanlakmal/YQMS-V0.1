import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

// =============================================================================
// STYLES
// =============================================================================
const colors = {
  primary: "#0088CC",
  primaryLight: "#e0f2fe",
  success: "#15803d", // Green-700
  successBg: "#dcfce7", // Green-100
  danger: "#b91c1c", // Red-700
  dangerBg: "#fee2e2", // Red-100
  warning: "#b45309", // Amber-700
  specBg: "#eff6ff", // Blue-50
  specText: "#2563eb", // Blue-600
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827"
  }
};

const styles = StyleSheet.create({
  // --- LAYOUT ---
  section: { marginBottom: 16 },
  sectionContent: {
    padding: 10,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200]
  },

  // --- HEADERS ---
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: colors.primary,
    padding: "8 12"
  },
  stageHeader: {
    padding: "6 10",
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 3
  },
  textStage: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase"
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300]
  },
  textGroup: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800]
  },

  // --- STATS CARDS ---
  statsRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 10
  },
  statCard: {
    flex: 1,
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: "center"
  },
  statLabel: {
    fontSize: 5,
    color: colors.gray[500],
    textTransform: "uppercase",
    marginBottom: 2
  },
  statValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800]
  },

  // --- LEGEND ---
  legendRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  legendText: {
    fontSize: 6,
    color: colors.gray[600]
  },

  // --- MAIN RESULT BANNER ---
  resultBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    padding: 8,
    borderWidth: 1,
    borderRadius: 4
  },
  resultItem: { alignItems: "center" },
  resultLabel: { fontSize: 7, color: colors.gray[500], marginBottom: 2 },
  resultValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },

  // --- TABLE (Detailed) ---
  tableContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[300]
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    minHeight: 14
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300]
  },

  // --- SUMMARY TABLE (NEW STYLES) ---
  sumTable: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[300]
  },
  sumHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#334155", // Dark Slate
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300]
  },
  sumHeaderCell: {
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.2)"
  },
  sumRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    minHeight: 16
  },
  sumCell: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: colors.gray[200]
  },
  sumTextHeader: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase"
  },
  sumText: { fontSize: 7, fontFamily: "Helvetica-Bold" },

  // Cell Commons
  cellCenter: { justifyContent: "center", alignItems: "center" },

  // Specific Columns
  colPoint: {
    width: 90,
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: colors.gray[300],
    justifyContent: "center"
  },
  colTol: {
    width: 22,
    padding: 1,
    borderRightWidth: 1,
    borderRightColor: colors.gray[300],
    justifyContent: "center",
    alignItems: "center"
  },

  // Size Wrapper
  sizeWrapper: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: colors.gray[300]
  },
  sizeTitleBox: {
    padding: 3,
    backgroundColor: "#e0e7ff", // Indigo 50
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300]
  },

  // Sub Columns (Spec, Pcs)
  subColContainer: { flexDirection: "row", height: "100%" },
  subColSpec: {
    backgroundColor: "#eff6ff", // Blue 50
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
    justifyContent: "center",
    alignItems: "center"
  },
  subColPcs: {
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
    justifyContent: "center",
    alignItems: "center"
  },

  // Text Styles
  textPoint: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700]
  },
  textTol: { fontSize: 5, color: colors.gray[500] },
  textSizeTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800],
    textAlign: "center"
  },
  textSubHeader: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[600]
  },
  textData: { fontSize: 6, fontFamily: "Helvetica" },
  textDataBold: { fontSize: 6, fontFamily: "Helvetica-Bold" }
});

// =============================================================================
// HELPER: UTILITIES
// =============================================================================

const cleanText = (str) => {
  if (str === null || str === undefined) return "";
  let s = String(str);
  s = s
    .replace(/¼/g, " 1/4")
    .replace(/½/g, " 1/2")
    .replace(/¾/g, " 3/4")
    .replace(/⅛/g, " 1/8")
    .replace(/⅜/g, " 3/8")
    .replace(/⅝/g, " 5/8")
    .replace(/⅞/g, " 7/8")
    .replace(/⅙/g, " 1/6")
    .replace(/⅚/g, " 5/6")
    .replace(/⅓/g, " 1/3")
    .replace(/⅔/g, " 2/3");
  s = s.replace(/[\u2044\u2215]/g, "/");
  s = s
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/≠/g, "!=")
    .replace(/±/g, "+/-");
  s = s.replace(/[”"]/g, '"').replace(/[’‘]/g, "'");
  s = s.replace(/\s+/g, " ").trim();
  return s;
};

const getUniqueRows = (allSpecs) => {
  if (!allSpecs) return [];
  const seen = new Set();
  const unique = [];
  allSpecs.forEach((spec) => {
    const name = (spec.MeasurementPointEngName || "").trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      unique.push(spec);
    }
  });
  return unique;
};

const getSpecDetailsForSize = (rowName, size, allSpecs) => {
  const matchedSpecEntry = allSpecs.find(
    (s) =>
      (s.MeasurementPointEngName || "").trim() === rowName &&
      s.Specs?.some((sz) => sz.size === size)
  );
  if (!matchedSpecEntry)
    return { decimal: null, fraction: "-", tolPlus: "-", tolMinus: "-" };
  const targetObj = matchedSpecEntry.Specs.find((s) => s.size === size);
  const tolPlus = matchedSpecEntry.TolPlus?.fraction || "-";
  const tolMinus = matchedSpecEntry.TolMinus?.fraction || "-";
  return {
    decimal: targetObj?.decimal,
    fraction: targetObj?.fraction || "-",
    tolPlus,
    tolMinus
  };
};

const checkTolerance = (targetDecimal, value, tolPlusStr, tolMinusStr) => {
  if (value === 0 || value === "" || value === null || value === undefined) {
    return { isWithin: true, status: "Empty" };
  }
  const target = parseFloat(targetDecimal);
  const reading = parseFloat(value);
  if (isNaN(target) || isNaN(reading)) return { isWithin: true };
  const tPlus = parseFloat(tolPlusStr || 0);
  const tMinus = parseFloat(tolMinusStr || 0);
  const upperLimit = target + tPlus;
  const lowerLimit = target - tMinus;
  const isWithin =
    reading >= lowerLimit - 0.0001 && reading <= upperLimit + 0.0001;
  return { isWithin };
};

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// =============================================================================
// HELPER: Config Summary Logic
// =============================================================================
const getConfigResult = (measurements) => {
  if (!measurements || measurements.length === 0) return "PASS";
  const hasFail = measurements.some((m) => m.inspectorDecision === "fail");
  return hasFail ? "FAIL" : "PASS";
};

// =============================================================================
// COMPONENT: Config Summary Table
// =============================================================================
const ConfigSummaryTable = ({ groupedData }) => {
  if (!groupedData?.groups?.length && !groupedData?.noContext?.length) {
    return null;
  }

  // Combine groups
  const allGroups = [
    ...groupedData.groups,
    ...(groupedData.noContext.length > 0
      ? [
          {
            id: "noContext",
            lineName: "",
            tableName: "",
            colorName: "General",
            measurements: groupedData.noContext
          }
        ]
      : [])
  ];

  // Get all unique sizes
  const allSizes = new Set();
  allGroups.forEach((group) => {
    group.measurements.forEach((m) => {
      if (m.size) allSizes.add(m.size);
    });
  });
  const sortedSizes = Array.from(allSizes).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  return (
    <View style={styles.sumTable}>
      {/* Header */}
      <View style={styles.sumHeaderRow}>
        <View
          style={[
            styles.sumHeaderCell,
            { flex: 2, alignItems: "flex-start", paddingLeft: 8 }
          ]}
        >
          <Text style={styles.sumTextHeader}>Configuration</Text>
        </View>
        {sortedSizes.map((size) => (
          <View key={size} style={[styles.sumHeaderCell, { flex: 1 }]}>
            <Text style={styles.sumTextHeader}>{size}</Text>
          </View>
        ))}
        <View
          style={[
            styles.sumHeaderCell,
            { flex: 1, backgroundColor: "#4338ca" }
          ]}
        >
          <Text style={styles.sumTextHeader}>Result</Text>
        </View>
      </View>

      {/* Rows */}
      {allGroups.map((group, idx) => {
        const configLabel =
          [
            group.lineName ? `Line ${group.lineName}` : null,
            group.tableName ? `Table ${group.tableName}` : null,
            group.colorName || null
          ]
            .filter(Boolean)
            .join(" / ") || "General";

        const overallResult = getConfigResult(group.measurements);

        return (
          <View
            key={idx}
            style={[
              styles.sumRow,
              { backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#f8fafc" }
            ]}
          >
            {/* Config Name */}
            <View
              style={[
                styles.sumCell,
                { flex: 2, alignItems: "flex-start", paddingLeft: 8 }
              ]}
            >
              <Text style={[styles.sumText, { color: colors.gray[800] }]}>
                {cleanText(configLabel)}
              </Text>
            </View>

            {/* Size Columns */}
            {sortedSizes.map((size) => {
              const m = group.measurements.find((m) => m.size === size);
              let content = "-";
              let bg = {};
              let color = colors.gray[400];

              if (m) {
                const isPass = m.inspectorDecision === "pass";
                content = isPass ? "PASS" : "FAIL";
                bg = isPass
                  ? { backgroundColor: colors.successBg }
                  : { backgroundColor: colors.dangerBg };
                color = isPass ? colors.success : colors.danger;
              }

              return (
                <View key={size} style={[styles.sumCell, bg, { flex: 1 }]}>
                  <Text style={[styles.sumText, { color }]}>{content}</Text>
                </View>
              );
            })}

            {/* Overall Result */}
            <View
              style={[
                styles.sumCell,
                {
                  flex: 1,
                  backgroundColor:
                    overallResult === "PASS"
                      ? colors.successBg
                      : colors.dangerBg
                }
              ]}
            >
              <Text
                style={[
                  styles.sumText,
                  {
                    color:
                      overallResult === "PASS" ? colors.success : colors.danger
                  }
                ]}
              >
                {overallResult}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const MeasurementLegend = () => (
  <View style={styles.legendRow}>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
      <Text style={styles.legendText}>Pass</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
      <Text style={styles.legendText}>Fail</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: "#a855f7" }]} />
      <Text style={styles.legendText}>A = All Points</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
      <Text style={styles.legendText}>C = Critical Pcs</Text>
    </View>
  </View>
);

const MeasurementTableChunk = ({
  sizeChunk,
  measurements,
  uniqueRows,
  allSpecs
}) => {
  if (!sizeChunk.length || !uniqueRows.length) return null;

  const sizeColumnConfigs = sizeChunk.map((size) => {
    const m = measurements.find((meas) => meas.size === size);
    const allPcs = Array.from(m?.allEnabledPcs || []).sort((a, b) => a - b);
    const critPcs = Array.from(m?.criticalEnabledPcs || []).sort(
      (a, b) => a - b
    );
    const columns = [];
    allPcs.forEach((pIdx) => columns.push({ type: "all", idx: pIdx }));
    critPcs.forEach((pIdx) => columns.push({ type: "crit", idx: pIdx }));
    const displayColumns = columns.map((col, i) => ({
      ...col,
      label: `#${i + 1}`
    }));
    if (displayColumns.length === 0)
      displayColumns.push({ type: "empty", label: "-" });
    return { size, measurement: m, cols: displayColumns };
  });

  return (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeaderRow}>
        <View style={styles.colPoint}>
          <Text style={styles.textPoint}>Measurement Point</Text>
        </View>
        <View style={styles.colTol}>
          <Text
            style={[
              styles.textTol,
              { color: colors.danger, fontWeight: "bold" }
            ]}
          >
            Tol -
          </Text>
        </View>
        <View style={styles.colTol}>
          <Text
            style={[
              styles.textTol,
              { color: colors.danger, fontWeight: "bold" }
            ]}
          >
            Tol +
          </Text>
        </View>
        {sizeColumnConfigs.map((config, idx) => (
          <View key={idx} style={styles.sizeWrapper}>
            <View style={styles.sizeTitleBox}>
              <Text style={styles.textSizeTitle}>{config.size}</Text>
              {config.measurement?.kValue && (
                <Text
                  style={{
                    fontSize: 5,
                    textAlign: "center",
                    color: colors.primary
                  }}
                >
                  K: {config.measurement.kValue}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
      <View
        style={[
          styles.tableRow,
          { backgroundColor: colors.gray[50], minHeight: 12 }
        ]}
      >
        <View style={styles.colPoint} />
        <View style={styles.colTol} />
        <View style={styles.colTol} />
        {sizeColumnConfigs.map((config, idx) => {
          const colWidthPct = 100 / (1 + config.cols.length);
          return (
            <View
              key={idx}
              style={[styles.sizeWrapper, styles.subColContainer]}
            >
              <View style={[styles.subColSpec, { width: `${colWidthPct}%` }]}>
                <Text style={[styles.textSubHeader, { color: colors.primary }]}>
                  Spec
                </Text>
              </View>
              {config.cols.map((col, cIdx) => (
                <View
                  key={cIdx}
                  style={[
                    styles.subColPcs,
                    {
                      width: `${colWidthPct}%`,
                      backgroundColor:
                        col.type === "all"
                          ? "#f3e8ff"
                          : col.type === "crit"
                          ? "#ffedd5"
                          : "transparent"
                    }
                  ]}
                >
                  <Text style={styles.textSubHeader}>{col.label}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
      {uniqueRows.map((rowSpec, rIdx) => {
        const firstSizeDetails = getSpecDetailsForSize(
          rowSpec.MeasurementPointEngName,
          sizeChunk[0],
          allSpecs
        );
        const displayTolMinus = cleanText(firstSizeDetails.tolMinus);
        const displayTolPlus = cleanText(firstSizeDetails.tolPlus);
        return (
          <View
            key={rIdx}
            style={[
              styles.tableRow,
              { backgroundColor: rIdx % 2 === 0 ? "#FFFFFF" : "#F9FAFB" }
            ]}
          >
            <View style={styles.colPoint}>
              <Text style={styles.textPoint}>
                {cleanText(rowSpec.MeasurementPointEngName)}
              </Text>
            </View>
            <View style={styles.colTol}>
              <Text style={styles.textTol}>{displayTolMinus}</Text>
            </View>
            <View style={styles.colTol}>
              <Text style={styles.textTol}>{displayTolPlus}</Text>
            </View>
            {sizeColumnConfigs.map((config, sIdx) => {
              const colWidthPct = 100 / (1 + config.cols.length);
              const details = getSpecDetailsForSize(
                (rowSpec.MeasurementPointEngName || "").trim(),
                config.size,
                allSpecs
              );
              const matchedSpecEntry = allSpecs.find(
                (s) =>
                  (s.MeasurementPointEngName || "").trim() ===
                    (rowSpec.MeasurementPointEngName || "").trim() &&
                  s.Specs?.some((sz) => sz.size === config.size)
              );
              const tolPlusDec = matchedSpecEntry?.TolPlus?.decimal;
              const tolMinusDec = matchedSpecEntry?.TolMinus?.decimal;
              return (
                <View
                  key={sIdx}
                  style={[styles.sizeWrapper, styles.subColContainer]}
                >
                  <View
                    style={[styles.subColSpec, { width: `${colWidthPct}%` }]}
                  >
                    <Text
                      style={[styles.textDataBold, { color: colors.primary }]}
                    >
                      {cleanText(details.fraction)}
                    </Text>
                  </View>
                  {config.cols.map((col, cIdx) => {
                    let displayVal = "-";
                    let bgStyle = {};
                    let textStyle = { color: colors.gray[300] };
                    if (col.type !== "empty" && config.measurement) {
                      const dataSource =
                        col.type === "all"
                          ? config.measurement.allMeasurements
                          : config.measurement.criticalMeasurements;
                      const effectiveSpecId = matchedSpecEntry
                        ? matchedSpecEntry.id
                        : rowSpec.id;
                      const reading = dataSource?.[effectiveSpecId]?.[col.idx];
                      if (reading && reading.decimal !== undefined) {
                        displayVal = cleanText(reading.fraction);
                        const check = checkTolerance(
                          details.decimal,
                          reading.decimal,
                          tolPlusDec,
                          tolMinusDec
                        );
                        if (check.isWithin) {
                          bgStyle = { backgroundColor: colors.successBg };
                          textStyle = { color: colors.success };
                        } else {
                          bgStyle = { backgroundColor: colors.dangerBg };
                          textStyle = {
                            color: colors.danger,
                            fontFamily: "Helvetica-Bold"
                          };
                        }
                      }
                    }
                    return (
                      <View
                        key={cIdx}
                        style={[
                          styles.subColPcs,
                          bgStyle,
                          { width: `${colWidthPct}%` }
                        ]}
                      >
                        <Text style={[styles.textData, textStyle]}>
                          {displayVal}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const calculateGroupStats = (measurements, allSpecs) => {
  let totalPoints = 0,
    passPoints = 0,
    failPoints = 0,
    totalPcs = 0,
    passPcs = 0,
    failPcs = 0;
  measurements.forEach((m) => {
    const allPcs = Array.from(m.allEnabledPcs || []);
    const critPcs = Array.from(m.criticalEnabledPcs || []);
    const pcsIndices = [...allPcs, ...critPcs];
    const applicableSpecs = allSpecs.filter((s) =>
      s.Specs?.some((sz) => sz.size === m.size)
    );
    pcsIndices.forEach((pcsIndex) => {
      totalPcs++;
      let pcsHasFail = false;
      applicableSpecs.forEach((spec) => {
        let valObj = null;
        if (allPcs.includes(pcsIndex))
          valObj = m.allMeasurements?.[spec.id]?.[pcsIndex];
        else if (critPcs.includes(pcsIndex))
          valObj = m.criticalMeasurements?.[spec.id]?.[pcsIndex];
        if (valObj && valObj.decimal !== undefined) {
          totalPoints++;
          const targetObj = spec.Specs.find((s) => s.size === m.size);
          const tolPlus = spec.TolPlus?.decimal;
          const tolMinus = spec.TolMinus?.decimal;
          const check = checkTolerance(
            targetObj?.decimal,
            valObj.decimal,
            tolPlus,
            tolMinus
          );
          if (check.isWithin) passPoints++;
          else {
            failPoints++;
            pcsHasFail = true;
          }
        }
      });
      if (pcsHasFail) failPcs++;
      else passPcs++;
    });
  });
  return {
    totalPoints,
    passPoints,
    failPoints,
    totalPcs,
    passPcs,
    failPcs,
    pointPassRate:
      totalPoints > 0 ? ((passPoints / totalPoints) * 100).toFixed(1) : "0.0",
    pcsPassRate: totalPcs > 0 ? ((passPcs / totalPcs) * 100).toFixed(1) : "0.0"
  };
};

const MeasurementStatsCards = ({ stats }) => (
  <View style={styles.statsRow}>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Total Pts</Text>
      <Text style={[styles.statValue, { color: colors.primary }]}>
        {stats.totalPoints}
      </Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Fail Pts</Text>
      <Text style={[styles.statValue, { color: colors.danger }]}>
        {stats.failPoints}
      </Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Pt Pass %</Text>
      <Text style={[styles.statValue, { color: colors.success }]}>
        {stats.pointPassRate}%
      </Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Total Pcs</Text>
      <Text style={[styles.statValue, { color: "#6366f1" }]}>
        {stats.totalPcs}
      </Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Fail Pcs</Text>
      <Text style={[styles.statValue, { color: colors.warning }]}>
        {stats.failPcs}
      </Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Pcs Pass %</Text>
      <Text style={[styles.statValue, { color: "#10b981" }]}>
        {stats.pcsPassRate}%
      </Text>
    </View>
  </View>
);

// =============================================================================
// MAIN EXPORT
// =============================================================================
const MeasurementSectionPDF = ({ measurementStageData, measurementResult }) => {
  if (!measurementStageData || measurementStageData.length === 0) return null;

  return (
    <View style={styles.section} break>
      <Text style={styles.sectionTitle}>MEASUREMENT SUMMARY</Text>

      <View style={styles.sectionContent}>
        <MeasurementLegend />

        {measurementStageData.map((stageData, sIdx) => {
          const allSpecs = stageData.specs?.full || [];
          return (
            <View key={sIdx} style={{ marginBottom: 16 }} break={sIdx > 0}>
              <View
                style={[
                  styles.stageHeader,
                  {
                    backgroundColor:
                      stageData.stage === "Before" ? "#8b5cf6" : "#14b8a6"
                  }
                ]}
              >
                <Text style={styles.textStage}>{stageData.label}</Text>
              </View>

              {/* Configuration Summary Table */}
              <ConfigSummaryTable groupedData={stageData.groupedData} />

              {stageData.groupedData?.groups?.map((group, gIdx) => {
                const configLabel =
                  [
                    group.lineName ? `Line ${group.lineName}` : null,
                    group.tableName ? `Table ${group.tableName}` : null,
                    group.colorName ? group.colorName.toUpperCase() : null
                  ]
                    .filter(Boolean)
                    .join(" / ") || "General Configuration";
                const measurements = group.measurements || [];
                const uniqueSizes = [
                  ...new Set(measurements.map((m) => m.size))
                ].sort((a, b) =>
                  a.localeCompare(b, undefined, { numeric: true })
                );
                const stats = calculateGroupStats(measurements, allSpecs);
                const uniqueRows = getUniqueRows(allSpecs);
                const sizeChunks = chunkArray(uniqueSizes, 3);

                return (
                  <View key={gIdx} style={{ marginBottom: 12 }}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.textGroup}>
                        {cleanText(configLabel)}
                      </Text>
                      {group.qcUser && (
                        <Text
                          style={{
                            fontSize: 8,
                            color: colors.gray[500],
                            marginLeft: 8
                          }}
                        >
                          (QC: {cleanText(group.qcUser.eng_name)})
                        </Text>
                      )}
                    </View>
                    <MeasurementStatsCards stats={stats} />
                    {sizeChunks.map((chunk, cIdx) => (
                      <View key={cIdx} break={cIdx > 0}>
                        {cIdx > 0 && (
                          <Text
                            style={{
                              fontSize: 8,
                              color: colors.gray[500],
                              marginBottom: 4
                            }}
                          >
                            {cleanText(configLabel)} (Continued...)
                          </Text>
                        )}
                        <MeasurementTableChunk
                          sizeChunk={chunk}
                          measurements={measurements}
                          uniqueRows={uniqueRows}
                          allSpecs={allSpecs}
                        />
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default MeasurementSectionPDF;
