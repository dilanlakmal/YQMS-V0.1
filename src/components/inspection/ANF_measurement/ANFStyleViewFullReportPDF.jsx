import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer";
import React, { useMemo } from "react";

// --- FONT REGISTRATION ---
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal"
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold"
    }
  ]
});

// --- STYLESHEET ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 8,
    backgroundColor: "#ffffff",
    paddingTop: 60, // Pushed down to make space for fixed header
    paddingBottom: 30,
    paddingHorizontal: 30,
    color: "#374151"
  },
  docHeader: {
    position: "absolute",
    top: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingBottom: 5
  },
  docTitle: { fontSize: 11, fontWeight: "bold", color: "#111827" },
  docSubtitle: { fontSize: 8, color: "#6b7280" },
  pageHeader: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#111827"
  },
  section: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    breakInside: "avoid"
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6"
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
    rowGap: 5,
    marginBottom: 10
  },
  infoBlock: { width: "18%" },
  infoLabel: { fontSize: 7, color: "#6b7280" },
  infoValue: { fontWeight: "bold", fontSize: 9 },
  table: { display: "table", width: "auto" },
  tableRow: { flexDirection: "row" },
  tableColHeader: {
    backgroundColor: "#f9fafb",
    padding: 4,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 7
  },
  tableCol: {
    padding: 4,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    textAlign: "center"
  },
  textLeft: { textAlign: "left" },
  summaryCardGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  summaryCard: {
    width: "16%",
    padding: 6,
    borderRadius: 4,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  summaryCardTitle: {
    fontSize: 7,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 3
  },
  summaryCardValue: { fontSize: 12, fontWeight: "bold", textAlign: "center" }
});

// --- IMPROVED HELPER FUNCTION ---
const fractionToDecimal = (fraction) => {
  if (!fraction || typeof fraction !== "string") return NaN; // Return NaN for invalid inputs
  if (fraction.trim() === "0") return 0; // Handle "0" string correctly
  if (!fraction.includes("/")) {
    const num = parseFloat(fraction);
    return isNaN(num) ? NaN : num;
  }
  const sign = fraction.startsWith("-") ? -1 : 1;
  const parts = fraction.replace(/[-+]/, "").split("/");
  if (parts.length === 2) {
    const num = parseInt(parts[0], 10);
    const den = parseInt(parts[1], 10);
    if (isNaN(num) || isNaN(den) || den === 0) return NaN;
    return sign * (num / den);
  }
  return NaN;
};

// --- REUSABLE PDF-SPECIFIC SUB-COMPONENTS ---

const PdfHeader = ({ styleNo }) => (
  <View style={styles.docHeader} fixed>
    <View>
      <Text style={styles.docTitle}>
        {styleNo} - After Washing Measurement Summary
      </Text>
      <Text style={styles.docSubtitle}>
        Yorkmars (Cambodia) Garment MFG Co., LTD
      </Text>
    </View>
    <Text style={{ fontSize: 8 }}>{new Date().toLocaleDateString()}</Text>
  </View>
);

const OrderQuantityTablePDF = ({ orderColors = [], allSizes = [] }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Order Quantity by Color & Size</Text>
    <View style={styles.table}>
      <View style={styles.tableRow} fixed>
        <Text
          style={[styles.tableColHeader, styles.textLeft, { width: "25%" }]}
        >
          Color
        </Text>
        {allSizes.map((size) => (
          <Text
            key={size}
            style={[
              styles.tableColHeader,
              { width: `${75 / allSizes.length}%` }
            ]}
          >
            {size}
          </Text>
        ))}
      </View>
      {orderColors.map((color) => {
        const sizeMap = new Map(
          (color.OrderQty || []).map((q) => [
            Object.keys(q)[0].split(";")[0],
            Object.values(q)[0]
          ])
        );
        return (
          <View key={color.Color} style={styles.tableRow}>
            <Text style={[styles.tableCol, styles.textLeft, { width: "25%" }]}>
              {color.Color}
            </Text>
            {allSizes.map((size) => (
              <Text
                key={size}
                style={[styles.tableCol, { width: `${75 / allSizes.length}%` }]}
              >
                {sizeMap.get(size) || 0}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  </View>
);

// Renders the summary tables for "Inspector Data" and "Summary by Color"
const SummaryTablePDF = ({
  title,
  data,
  hasContribution = false,
  orderQty
}) => (
  <View style={styles.section} wrap={false}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.tableRow} fixed>
        <Text
          style={[
            styles.tableColHeader,
            styles.textLeft,
            { width: hasContribution ? "12%" : "18%" }
          ]}
        >
          {hasContribution ? "QC ID" : "Color"}
        </Text>
        <Text style={[styles.tableColHeader, { width: "8%" }]}>Checked</Text>
        <Text style={[styles.tableColHeader, { width: "8%" }]}>OK</Text>
        <Text style={[styles.tableColHeader, { width: "8%" }]}>Reject</Text>
        <Text style={[styles.tableColHeader, { width: "8%" }]}>Points</Text>
        <Text style={[styles.tableColHeader, { width: "8%" }]}>Pass</Text>
        <Text style={[styles.tableColHeader, { width: "8%" }]}>Issues</Text>
        <Text style={[styles.tableColHeader, { width: "8%" }]}>T+</Text>
        <Text style={[styles.tableColHeader, { width: "8%" }]}>T-</Text>
        <Text style={[styles.tableColHeader, { width: "8%" }]}>Pass%(G)</Text>
        <Text style={[styles.tableColHeader, { width: "8%" }]}>Pass%(P)</Text>
        {hasContribution && (
          <Text style={[styles.tableColHeader, { width: "8%" }]}>Contrib.</Text>
        )}
      </View>
      {/* Body */}
      {(data || []).map((item, index) => {
        const checked = item.garmentDetailsCheckedQty || 0;
        const points = item.measurementDetailsPoints || 0;
        const passG =
          checked > 0
            ? `${((item.garmentDetailsOKGarment / checked) * 100).toFixed(2)}%`
            : "N/A";
        const passP =
          points > 0
            ? `${((item.measurementDetailsPass / points) * 100).toFixed(2)}%`
            : "N/A";
        const contribution =
          hasContribution && orderQty > 0
            ? `${((checked / orderQty) * 100).toFixed(2)}%`
            : "N/A";

        return (
          <View key={item.qcID || item.color || index} style={styles.tableRow}>
            <Text
              style={[
                styles.tableCol,
                styles.textLeft,
                { width: hasContribution ? "12%" : "18%" }
              ]}
            >
              {item.qcID || item.color}
            </Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>{checked}</Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>
              {item.garmentDetailsOKGarment || 0}
            </Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>
              {item.garmentDetailsRejected || 0}
            </Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>{points}</Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>
              {item.measurementDetailsPass || 0}
            </Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>
              {item.measurementDetailsTotalIssues || 0}
            </Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>
              {item.measurementDetailsTolPositive || 0}
            </Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>
              {item.measurementDetailsTolNegative || 0}
            </Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>{passG}</Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>{passP}</Text>
            {hasContribution && (
              <Text style={[styles.tableCol, { width: "8%" }]}>
                {contribution}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  </View>
);

// NEW: Renders the Summary by Size table on the color detail pages
const SizeSummaryTablePDF = ({ detail, allSizes = [] }) => {
  const inspectedSizesForColor = allSizes.filter((size) => {
    const sizeData = detail.summaryBySizeMap?.get(size);
    return sizeData && sizeData.sizeSummary?.garmentDetailsCheckedQty > 0;
  });

  if (inspectedSizesForColor.length === 0) return null;

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Summary by Size</Text>
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.tableRow} fixed>
          <Text
            style={[styles.tableColHeader, styles.textLeft, { width: "18%" }]}
          >
            Size
          </Text>
          <Text style={[styles.tableColHeader, { width: "8%" }]}>Checked</Text>
          <Text style={[styles.tableColHeader, { width: "8%" }]}>OK</Text>
          <Text style={[styles.tableColHeader, { width: "8%" }]}>Reject</Text>
          <Text style={[styles.tableColHeader, { width: "8%" }]}>Points</Text>
          <Text style={[styles.tableColHeader, { width: "8%" }]}>Pass</Text>
          <Text style={[styles.tableColHeader, { width: "8%" }]}>Issues</Text>
          <Text style={[styles.tableColHeader, { width: "8%" }]}>T+</Text>
          <Text style={[styles.tableColHeader, { width: "8%" }]}>T-</Text>
          <Text style={[styles.tableColHeader, { width: "10%" }]}>
            Pass%(G)
          </Text>
          <Text style={[styles.tableColHeader, { width: "10%" }]}>
            Pass%(P)
          </Text>
        </View>
        {/* Body */}
        {inspectedSizesForColor.map((size) => {
          const sizeSummaryData = detail.summaryBySizeMap.get(size);
          const s = sizeSummaryData?.sizeSummary || {};
          const passG =
            s.garmentDetailsCheckedQty > 0
              ? `${(
                  (s.garmentDetailsOKGarment / s.garmentDetailsCheckedQty) *
                  100
                ).toFixed(2)}%`
              : "N/A";
          const passP =
            s.measurementDetailsPoints > 0
              ? `${(
                  (s.measurementDetailsPass / s.measurementDetailsPoints) *
                  100
                ).toFixed(2)}%`
              : "N/A";
          return (
            <View key={size} style={styles.tableRow}>
              <Text
                style={[styles.tableCol, styles.textLeft, { width: "18%" }]}
              >
                {size}
              </Text>
              <Text style={[styles.tableCol, { width: "8%" }]}>
                {s.garmentDetailsCheckedQty || 0}
              </Text>
              <Text style={[styles.tableCol, { width: "8%" }]}>
                {s.garmentDetailsOKGarment || 0}
              </Text>
              <Text style={[styles.tableCol, { width: "8%" }]}>
                {s.garmentDetailsRejected || 0}
              </Text>
              <Text style={[styles.tableCol, { width: "8%" }]}>
                {s.measurementDetailsPoints || 0}
              </Text>
              <Text style={[styles.tableCol, { width: "8%" }]}>
                {s.measurementDetailsPass || 0}
              </Text>
              <Text style={[styles.tableCol, { width: "8%" }]}>
                {s.measurementDetailsTotalIssues || 0}
              </Text>
              <Text style={[styles.tableCol, { width: "8%" }]}>
                {s.measurementDetailsTolPositive || 0}
              </Text>
              <Text style={[styles.tableCol, { width: "8%" }]}>
                {s.measurementDetailsTolNegative || 0}
              </Text>
              <Text style={[styles.tableCol, { width: "10%" }]}>{passG}</Text>
              <Text style={[styles.tableCol, { width: "10%" }]}>{passP}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const TallyTablePDF = ({ tallyData = {} }) => {
  const measurementsTally = tallyData.measurementsTally || {};
  const buyerSpecData = tallyData.buyerSpecData || [];

  const dynamicColumns = useMemo(() => {
    const allFractions = new Set(
      Object.values(measurementsTally).flatMap(Object.keys)
    );
    return Array.from(allFractions).sort(
      (a, b) => fractionToDecimal(a) - fractionToDecimal(b)
    );
  }, [measurementsTally]);

  const colWidth = dynamicColumns.length > 0 ? 55 / dynamicColumns.length : 55;

  return (
    <View style={styles.table}>
      <View style={styles.tableRow} fixed>
        <Text style={[styles.tableColHeader, { width: "5%" }]}>No</Text>
        <Text
          style={[styles.tableColHeader, styles.textLeft, { width: "25%" }]}
        >
          Point
        </Text>
        <Text style={[styles.tableColHeader, { width: "5%" }]}>Spec</Text>
        <Text style={[styles.tableColHeader, { width: "5%" }]}>Tol-</Text>
        <Text style={[styles.tableColHeader, { width: "5%" }]}>Tol+</Text>
        {dynamicColumns.map((col) => (
          <Text
            key={col}
            style={[styles.tableColHeader, { width: `${colWidth}%` }]}
          >
            {col}
          </Text>
        ))}
      </View>
      {buyerSpecData.map((spec = {}, index) => {
        const tolMinus = fractionToDecimal(spec.tolNeg_fraction);
        const tolPlus = fractionToDecimal(spec.tolPos_fraction);
        return (
          <View key={spec.no || index} style={styles.tableRow} wrap={false}>
            <Text style={[styles.tableCol, { width: "5%" }]}>
              {spec.no ?? ""}
            </Text>
            <Text style={[styles.tableCol, styles.textLeft, { width: "25%" }]}>
              {spec.measurementPoint ?? ""}
            </Text>
            <Text style={[styles.tableCol, { width: "5%" }]}>
              {spec.spec_fraction ?? ""}
            </Text>
            <Text style={[styles.tableCol, { width: "5%" }]}>
              {spec.tolNeg_fraction ?? ""}
            </Text>
            <Text style={[styles.tableCol, { width: "5%" }]}>
              {spec.tolPos_fraction ?? ""}
            </Text>
            {dynamicColumns.map((col) => {
              const count = measurementsTally[spec.no]?.[col] || 0;
              const colDecimal = fractionToDecimal(col);
              // CORRECTED LOGIC: Check if the deviation is within the tolerance range.
              const isInTolerance =
                !isNaN(colDecimal) &&
                colDecimal >= tolMinus &&
                colDecimal <= tolPlus;
              // Apply color based on tolerance check.
              const bgColor =
                count > 0
                  ? isInTolerance
                    ? "#dcfce7"
                    : "#fee2e2"
                  : "transparent";
              return (
                <Text
                  key={col}
                  style={[
                    styles.tableCol,
                    { width: `${colWidth}%`, backgroundColor: bgColor }
                  ]}
                >
                  {count > 0 ? count : ""}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

// --- MAIN PDF DOCUMENT COMPONENT ---
const ANFStyleViewFullReportPDF = ({
  reportData,
  allSizes,
  detailsByColorProcessed
}) => {
  if (!reportData) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>No report data available.</Text>
        </Page>
      </Document>
    );
  }

  const {
    orderDetails = {},
    inspectorData = [],
    summaryByColor = []
  } = reportData;

  return (
    <Document author="Yorkmars Garment MFG Co., LTD">
      {/* ======================= FIRST PAGE: SUMMARY ======================= */}
      <Page style={styles.page} orientation="landscape">
        <PdfHeader styleNo={orderDetails.moNo ?? "N/A"} />
        <Text style={styles.pageHeader}>Overall Report Summary</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>MO No:</Text>
              <Text style={styles.infoValue}>{orderDetails.moNo ?? "N/A"}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Buyer:</Text>
              <Text style={styles.infoValue}>
                {orderDetails.buyer ?? "ANF"}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Cust. Style:</Text>
              <Text style={styles.infoValue}>
                {orderDetails.custStyle ?? "N/A"}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Order Qty:</Text>
              <Text style={styles.infoValue}>
                {orderDetails.orderQty_style ?? "N/A"}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Country:</Text>
              <Text style={styles.infoValue}>
                {orderDetails.country ?? "N/A"}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Mode:</Text>
              <Text style={styles.infoValue}>{orderDetails.mode ?? "N/A"}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Origin:</Text>
              <Text style={styles.infoValue}>
                {orderDetails.origin ?? "N/A"}
              </Text>
            </View>
          </View>
          <OrderQuantityTablePDF
            orderColors={orderDetails.orderColors}
            allSizes={allSizes}
          />
        </View>

        <SummaryTablePDF
          title="Inspector Data"
          data={inspectorData}
          hasContribution={true}
          orderQty={orderDetails.orderQty_style || 0}
        />
        <SummaryTablePDF title="Summary by Color" data={summaryByColor} />
      </Page>

      {/* ============ SUBSEQUENT PAGES: DETAILS PER COLOR ============ */}
      {(detailsByColorProcessed || []).map((detail = {}, index) => {
        const summary = detail.summaryCards || {};
        const passRateGarment =
          summary.garmentDetailsCheckedQty > 0
            ? (summary.garmentDetailsOKGarment /
                summary.garmentDetailsCheckedQty) *
              100
            : null;
        const passRatePoints =
          summary.measurementDetailsPoints > 0
            ? (summary.measurementDetailsPass /
                summary.measurementDetailsPoints) *
              100
            : null;

        return (
          <Page
            key={detail.color || index}
            style={styles.page}
            orientation="landscape"
          >
            <PdfHeader styleNo={orderDetails.moNo ?? "N/A"} />
            <Text style={styles.pageHeader}>
              Detailed Breakdown - Color: {detail.color ?? "N/A"}
            </Text>

            <View style={styles.summaryCardGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Checked</Text>
                <Text style={styles.summaryCardValue}>
                  {summary.garmentDetailsCheckedQty ?? 0}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>OK Garments</Text>
                <Text style={styles.summaryCardValue}>
                  {summary.garmentDetailsOKGarment ?? 0}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Total Points</Text>
                <Text style={styles.summaryCardValue}>
                  {summary.measurementDetailsPoints ?? 0}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Pass Points</Text>
                <Text style={styles.summaryCardValue}>
                  {summary.measurementDetailsPass ?? 0}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Pass % (G)</Text>
                <Text style={styles.summaryCardValue}>
                  {passRateGarment !== null
                    ? `${passRateGarment.toFixed(2)}%`
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Pass % (P)</Text>
                <Text style={styles.summaryCardValue}>
                  {passRatePoints !== null
                    ? `${passRatePoints.toFixed(2)}%`
                    : "N/A"}
                </Text>
              </View>
            </View>

            <SizeSummaryTablePDF detail={detail} allSizes={allSizes} />

            {(allSizes || []).map((size) => {
              const sizeTally = detail.tallyBySizeMap?.get(size);
              if (!sizeTally || (sizeTally.buyerSpecData || []).length === 0)
                return null;

              return (
                <View key={size} style={styles.section} wrap={false}>
                  <Text style={styles.sectionTitle}>
                    Size: {sizeTally.size} - Measurement Data
                  </Text>
                  <TallyTablePDF tallyData={sizeTally} />
                </View>
              );
            })}
          </Page>
        );
      })}
    </Document>
  );
};

export default ANFStyleViewFullReportPDF;
