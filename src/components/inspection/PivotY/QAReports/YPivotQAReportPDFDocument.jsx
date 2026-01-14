import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  Link
} from "@react-pdf/renderer";

import MeasurementSectionPDF from "./YPivotQAReportMeasurementPDF";
import DefectSectionPDF from "./YPivotQAReportDefectPDF";

// =============================================================================
// FONT REGISTRATION (Optional - for better typography)
// =============================================================================
// Font.register({
//   family: 'Inter',
//   fonts: [
//     { src: '/fonts/Inter-Regular.ttf', fontWeight: 'normal' },
//     { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
//   ]
// });

// =============================================================================
// STYLES
// =============================================================================
const colors = {
  primary: "#4F46E5",
  primaryDark: "#3730A3",
  secondary: "#7C3AED",
  success: "#059669",
  danger: "#DC2626",
  warning: "#D97706",
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
  // Page
  page: {
    padding: 40,
    paddingTop: 90,
    paddingBottom: 60,
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF"
  },

  // Header
  header: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    borderBottomStyle: "solid"
  },
  headerRow1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  headerCompany: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.primary
  },
  headerOrderNo: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
    backgroundColor: colors.gray[100],
    padding: "4 8",
    borderRadius: 4
  },
  headerRow2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerMeta: {
    flexDirection: "row",
    gap: 12
  },
  headerMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  headerMetaLabel: {
    fontSize: 7,
    color: colors.gray[500],
    textTransform: "uppercase"
  },
  headerMetaValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800]
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
    textAlign: "center"
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  footerLeft: {
    fontSize: 7,
    color: colors.gray[500]
  },
  footerCenter: {
    fontSize: 7,
    color: colors.gray[400]
  },
  footerRight: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.primary
  },

  // Content Sections
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: colors.primary,
    padding: "8 12",
    marginBottom: 0
  },
  sectionTitleGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  sectionContent: {
    padding: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderTopWidth: 0
  },

  // Result Banner
  resultBanner: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 2
  },
  resultBannerPass: {
    backgroundColor: "#ECFDF5",
    borderColor: colors.success
  },
  resultBannerFail: {
    backgroundColor: "#FEF2F2",
    borderColor: colors.danger
  },
  resultItem: {
    alignItems: "center"
  },
  resultLabel: {
    fontSize: 7,
    color: colors.gray[500],
    textTransform: "uppercase",
    marginBottom: 2
  },
  resultValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold"
  },
  resultPass: {
    color: colors.success
  },
  resultFail: {
    color: colors.danger
  },

  // Info Grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  infoCard: {
    width: "23%",
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4
  },
  infoCardWide: {
    width: "48%"
  },
  infoCardFull: {
    width: "100%"
  },
  infoLabel: {
    fontSize: 6,
    color: colors.gray[500],
    textTransform: "uppercase",
    marginBottom: 2
  },
  infoValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800]
  },

  // Tables
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4,
    overflow: "hidden"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    textAlign: "center"
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100]
  },
  tableRowAlt: {
    backgroundColor: colors.gray[50]
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 8,
    color: colors.gray[700],
    textAlign: "center"
  },
  tableCellBold: {
    fontFamily: "Helvetica-Bold"
  },

  // Image Grid
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  imageContainer: {
    width: "31%",
    marginBottom: 8
  },
  imageWrapper: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.gray[50], // Light background for letterboxing
    position: "relative" // Needed for absolute positioning of badges
  },

  image: {
    width: "100%",
    height: 160, // Increased height to accommodate vertical images better
    objectFit: "contain" // <--- FIX: Prevents cropping, shows full image
  },

  imageLarge: {
    height: 180
  },
  imageCaption: {
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: colors.gray[100]
  },
  imageCaptionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800],
    marginBottom: 2
  },
  imageCaptionSubtitle: {
    fontSize: 6,
    color: colors.gray[500]
  },
  imageBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    padding: "2 4",
    borderRadius: 2,
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF"
  },
  badgeMinor: {
    backgroundColor: colors.warning
  },
  badgeMajor: {
    backgroundColor: colors.danger
  },
  badgeCritical: {
    backgroundColor: "#7F1D1D"
  },

  // --- NEW BADGES (Top Left - Position) ---
  positionBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    padding: "2 4",
    borderRadius: 2,
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase"
  },

  badgeOutside: { backgroundColor: "#3b82f6" }, // Blue
  badgeInside: { backgroundColor: "#6366f1" }, // Indigo
  badgeNa: { backgroundColor: colors.gray[400] },

  // Checklist
  checklistGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  checklistItem: {
    width: "32%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4
  },
  checklistLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
    maxWidth: "70%"
  },
  checklistBadge: {
    padding: "2 6",
    borderRadius: 10,
    fontSize: 6,
    fontFamily: "Helvetica-Bold"
  },
  badgeConform: {
    backgroundColor: "#D1FAE5",
    color: colors.success
  },
  badgeNonConform: {
    backgroundColor: "#FEE2E2",
    color: colors.danger
  },
  badgeNA: {
    backgroundColor: "#FEF3C7",
    color: colors.warning
  },

  // Measurement Table
  measurementTable: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4,
    overflow: "hidden"
  },
  measurementHeader: {
    flexDirection: "row",
    backgroundColor: "#0088CC"
  },
  measurementHeaderCell: {
    padding: 4,
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.2)"
  },
  measurementRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100]
  },
  measurementCell: {
    padding: 3,
    fontSize: 6,
    color: colors.gray[700],
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: colors.gray[100]
  },
  measurementCellPass: {
    backgroundColor: "#D1FAE5",
    color: colors.success
  },
  measurementCellFail: {
    backgroundColor: "#FEE2E2",
    color: colors.danger
  },

  // Defect Summary
  defectSummaryRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100]
  },
  defectNameCell: {
    width: "40%",
    padding: 6,
    fontSize: 7,
    color: colors.gray[700]
  },
  defectCountCell: {
    width: "15%",
    padding: 6,
    fontSize: 7,
    textAlign: "center",
    fontFamily: "Helvetica-Bold"
  },

  // AQL Section
  aqlCard: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  aqlCardItem: {
    flex: 1,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4,
    alignItems: "center"
  },
  aqlCardLabel: {
    fontSize: 6,
    color: colors.gray[500],
    textTransform: "uppercase",
    marginBottom: 4
  },
  aqlCardValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.primary
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 12
  },

  // Text utilities
  textCenter: {
    textAlign: "center"
  },
  textBold: {
    fontFamily: "Helvetica-Bold"
  },
  textMuted: {
    color: colors.gray[500]
  },
  textSmall: {
    fontSize: 7
  },

  // Spacing
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },

  // Inspector Card
  inspectorCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    marginBottom: 12
  },
  inspectorPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    objectFit: "cover",
    backgroundColor: colors.gray[200]
  },
  inspectorInfo: {
    flex: 1
  },
  inspectorName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800],
    marginBottom: 2
  },
  inspectorMeta: {
    flexDirection: "row",
    gap: 12
  },
  inspectorMetaItem: {
    fontSize: 7,
    color: colors.gray[500]
  },

  // Color Size Breakdown
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },

  // No data placeholder
  noData: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray[50],
    borderRadius: 4
  },
  noDataText: {
    fontSize: 8,
    color: colors.gray[400],
    fontStyle: "italic"
  },

  // Page break
  pageBreak: {
    marginTop: 20
  },

  // Subsection
  subsection: {
    marginTop: 12,
    marginBottom: 8
  },
  subsectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200]
  },

  // Remark box
  remarkBox: {
    padding: 8,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 4,
    marginTop: 6
  },
  remarkLabel: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: colors.warning,
    textTransform: "uppercase",
    marginBottom: 2
  },
  remarkText: {
    fontSize: 7,
    color: "#92400E",
    fontStyle: "italic"
  },

  // Configuration group header
  configGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    marginBottom: 8
  },
  configGroupLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
    textTransform: "uppercase"
  },
  configGroupCount: {
    fontSize: 7,
    color: colors.gray[500],
    backgroundColor: "#FFFFFF",
    padding: "2 6",
    borderRadius: 10
  }
});

// =============================================================================
// HEADER COMPONENT
// =============================================================================
const Header = ({ reportData, orderNo }) => (
  <View style={styles.header} fixed>
    <View style={styles.headerRow1}>
      <Text style={styles.headerCompany}>
        Yorkmars (Cambodia) Garment MFG Co., LTD
      </Text>
      <Text style={styles.headerOrderNo}>Order: {orderNo || "N/A"}</Text>
    </View>
    <View style={styles.headerRow2}>
      <View style={styles.headerMeta}>
        <View style={styles.headerMetaItem}>
          <Text style={styles.headerMetaLabel}>Report: </Text>
          <Text style={styles.headerMetaValue}>
            {reportData?.reportType || "Inspection"}
          </Text>
        </View>
        <View style={styles.headerMetaItem}>
          <Text style={styles.headerMetaLabel}>Date: </Text>
          <Text style={styles.headerMetaValue}>
            {reportData?.inspectionDate
              ? new Date(reportData.inspectionDate).toLocaleDateString()
              : "N/A"}
          </Text>
        </View>
        <View style={styles.headerMetaItem}>
          <Text style={styles.headerMetaLabel}>Type: </Text>
          <Text style={styles.headerMetaValue}>
            {reportData?.inspectionType === "first" ? "First" : "Re-Inspection"}
          </Text>
        </View>
        <View style={styles.headerMetaItem}>
          <Text style={styles.headerMetaLabel}>QA ID: </Text>
          <Text style={styles.headerMetaValue}>
            {reportData?.empId || "N/A"}
          </Text>
        </View>
      </View>
      <Text style={styles.headerTitle}>FINCHECK INSPECTION</Text>
    </View>
  </View>
);

// =============================================================================
// FOOTER COMPONENT
// =============================================================================
const Footer = () => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerLeft}>
      Generated: {new Date().toLocaleString()}
    </Text>
    <Text style={styles.footerCenter}>Confidential Document</Text>
    <Text
      style={styles.footerRight}
      render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber} of ${totalPages}`
      }
    />
  </View>
);

// =============================================================================
// RESULT BANNER COMPONENT
// =============================================================================
const ResultBanner = ({ finalResult, measurementResult, defectResult }) => {
  const isPass = finalResult === "PASS";
  return (
    <View
      style={[
        styles.resultBanner,
        isPass ? styles.resultBannerPass : styles.resultBannerFail
      ]}
    >
      <View style={styles.resultItem}>
        <Text style={styles.resultLabel}>Final Result</Text>
        <Text
          style={[
            styles.resultValue,
            isPass ? styles.resultPass : styles.resultFail
          ]}
        >
          {finalResult}
        </Text>
      </View>
      <View style={styles.resultItem}>
        <Text style={styles.resultLabel}>Measurement</Text>
        <Text
          style={[
            styles.resultValue,
            measurementResult === "PASS" ? styles.resultPass : styles.resultFail
          ]}
        >
          {measurementResult}
        </Text>
      </View>
      <View style={styles.resultItem}>
        <Text style={styles.resultLabel}>Defect</Text>
        <Text
          style={[
            styles.resultValue,
            defectResult === "PASS" ? styles.resultPass : styles.resultFail
          ]}
        >
          {defectResult}
        </Text>
      </View>
    </View>
  );
};

// =============================================================================
// INFO CARD COMPONENT
// =============================================================================
const InfoCard = ({ label, value, wide = false, full = false }) => (
  <View
    style={[
      styles.infoCard,
      wide && styles.infoCardWide,
      full && styles.infoCardFull
    ]}
  >
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "-"}</Text>
  </View>
);

// =============================================================================
// INSPECTOR SECTION
// =============================================================================

const InspectorSection = ({ inspector, reportData }) => {
  // Use the Base64 image from the backend if available (inspector.photoBase64),
  // otherwise fallback to what might be in inspector object (unlikely to work if URL)
  const imageSrc = inspector?.photoBase64 || inspector?.face_photo;

  return (
    <View style={styles.inspectorCard}>
      {imageSrc ? (
        <Image
          style={{
            width: 50,
            height: 50,
            borderRadius: 25, // Make it a circle
            marginRight: 12,
            objectFit: "cover",
            backgroundColor: colors.gray[200]
          }}
          src={imageSrc}
        />
      ) : (
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            marginRight: 12,
            backgroundColor: colors.gray[200],
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          {/* Fallback Text if no image */}
          <Text style={{ fontSize: 8, color: colors.gray[500] }}>No Photo</Text>
        </View>
      )}
      <View style={styles.inspectorInfo}>
        <Text style={styles.inspectorName}>
          {inspector?.eng_name || reportData?.empName || "Unknown Inspector"}
        </Text>
        <View style={styles.inspectorMeta}>
          <Text style={styles.inspectorMetaItem}>
            ID: {reportData?.empId || "-"}
          </Text>
          <Text style={styles.inspectorMetaItem}>
            Title: {inspector?.job_title || "N/A"}
          </Text>
          <Text style={styles.inspectorMetaItem}>
            Dept: {inspector?.dept_name || "N/A"}
          </Text>
        </View>
      </View>
    </View>
  );
};

// =============================================================================
// ORDER INFO SECTION
// =============================================================================

const SKUDetailsTable = ({ skuData }) => {
  if (!skuData || skuData.length === 0) return null;

  // Reduced font size for dense data
  const rowTextStyle = { fontSize: 6 };

  return (
    <View style={[styles.table, { marginTop: 12 }]}>
      {/* Header */}
      <View style={[styles.tableHeader, { backgroundColor: "#10b981" }]}>
        {/* Adjusted widths: SKU gets 25% */}
        <Text style={[styles.tableHeaderCell, { width: "40%" }]}>SKU</Text>
        <Text style={[styles.tableHeaderCell, { width: "12%" }]}>PO Line</Text>
        <Text style={[styles.tableHeaderCell, { width: "12%" }]}>Color</Text>
        <Text style={[styles.tableHeaderCell, { width: "12%" }]}>ETD</Text>
        <Text style={[styles.tableHeaderCell, { width: "12%" }]}>ETA</Text>
        <Text style={[styles.tableHeaderCell, { width: "12%" }]}>Qty</Text>
      </View>

      {/* Rows */}
      {skuData.map((sku, idx) => (
        <View
          key={idx}
          style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
        >
          {/* SKU Column: 40% width, Bold, Smaller Font */}
          <Text
            style={[
              styles.tableCell,
              rowTextStyle,
              { width: "40%", fontFamily: "Helvetica-Bold", textAlign: "left" } // Left align looks better for wrapped text
            ]}
          >
            {sku.sku || "N/A"}
          </Text>

          <Text style={[styles.tableCell, rowTextStyle, { width: "12%" }]}>
            {sku.POLine || "N/A"}
          </Text>
          <Text style={[styles.tableCell, rowTextStyle, { width: "12%" }]}>
            {sku.Color || "N/A"}
          </Text>
          <Text style={[styles.tableCell, rowTextStyle, { width: "12%" }]}>
            {sku.ETD || "-"}
          </Text>
          <Text style={[styles.tableCell, rowTextStyle, { width: "12%" }]}>
            {sku.ETA || "-"}
          </Text>
          <Text
            style={[
              styles.tableCell,
              rowTextStyle,
              { width: "12%", color: "#059669", fontFamily: "Helvetica-Bold" }
            ]}
          >
            {sku.Qty?.toLocaleString() || 0}
          </Text>
        </View>
      ))}
    </View>
  );
};

const OrderInfoSection = ({ orderData, selectedOrders }) => {
  const dtOrder = orderData?.dtOrder || {};
  const yorksys = orderData?.yorksysOrder || {};

  // Extract SKU Data (Collect from Yorksys if available)
  // Logic mirrors web: either direct `yorksysOrder.skuData` or from breakdown array
  let allSkuData = yorksys.skuData || [];
  if (allSkuData.length === 0 && orderData?.orderBreakdowns) {
    // Flatten from breakdowns if not at root
    orderData.orderBreakdowns.forEach((bd) => {
      if (bd.yorksysOrder?.skuData) {
        allSkuData = [...allSkuData, ...bd.yorksysOrder.skuData];
      }
    });
  }

  // Two-Column Layout Style
  const rowStyle = {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingVertical: 4
  };

  const colStyle = {
    width: "50%",
    paddingRight: 8
  };

  const labelStyle = {
    fontSize: 7,
    color: colors.gray[500],
    textTransform: "uppercase",
    marginBottom: 1
  };

  const valueStyle = {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800]
  };

  // Helper for a single data point
  const DataItem = ({ label, value }) => (
    <View style={{ marginBottom: 4 }}>
      <Text style={labelStyle}>{label}</Text>
      <Text style={valueStyle}>{value || "-"}</Text>
    </View>
  );

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { backgroundColor: "#2563EB" }]}>
        ORDER INFORMATION
      </Text>

      <View style={styles.sectionContent}>
        {/* 1. General Info (2-Column Layout) */}
        <View style={{ marginBottom: 12 }}>
          {/* Row 1 */}
          <View style={rowStyle}>
            <View style={colStyle}>
              <DataItem
                label="Order No(s)"
                value={selectedOrders?.join(", ")}
              />
            </View>
            <View style={colStyle}>
              <DataItem
                label="Total Qty"
                value={dtOrder.totalQty?.toLocaleString()}
              />
            </View>
          </View>

          {/* Row 2 */}
          <View style={rowStyle}>
            <View style={colStyle}>
              <DataItem label="Customer" value={dtOrder.customer} />
            </View>
            <View style={colStyle}>
              <DataItem label="Factory" value={dtOrder.factory} />
            </View>
          </View>

          {/* Row 3 */}
          <View style={rowStyle}>
            <View style={colStyle}>
              <DataItem label="Style" value={dtOrder.custStyle} />
            </View>
            <View style={colStyle}>
              <DataItem label="Season" value={yorksys.season} />
            </View>
          </View>

          {/* Row 4 */}
          <View style={rowStyle}>
            <View style={colStyle}>
              <DataItem label="Origin" value={dtOrder.origin} />
            </View>
            <View style={colStyle}>
              <DataItem label="Mode" value={dtOrder.mode} />
            </View>
          </View>

          {/* Row 5 */}
          <View style={rowStyle}>
            <View style={colStyle}>
              <DataItem label="Destination" value={yorksys.destination} />
            </View>
            <View style={colStyle}>
              <DataItem label="Product Type" value={yorksys.productType} />
            </View>
          </View>

          {/* Row 6 (Full Width) */}
          <View style={[rowStyle, { borderBottomWidth: 0 }]}>
            <View style={{ width: "100%" }}>
              <DataItem
                label="Fabric Content"
                value={yorksys.fabricContent
                  ?.map((f) => `${f.fabricName} ${f.percentageValue}%`)
                  .join(", ")}
              />
            </View>
          </View>
        </View>

        {/* 2. Color Size Breakdown */}
        {orderData?.colorSizeBreakdown && (
          <View style={styles.subsection} break>
            <Text style={styles.subsectionTitle}>Color/Size Breakdown</Text>
            <ColorSizeTable data={orderData.colorSizeBreakdown} />
          </View>
        )}

        {/* 3. SKU Details Table (NEW) */}
        {allSkuData.length > 0 && (
          <View style={styles.subsection} break={allSkuData.length > 10}>
            <Text style={[styles.subsectionTitle, { color: "#059669" }]}>
              SKU Details
            </Text>
            <SKUDetailsTable skuData={allSkuData} />
          </View>
        )}
      </View>
    </View>
  );
};

// =============================================================================
// COLOR SIZE TABLE
// =============================================================================
const ColorSizeTable = ({ data }) => {
  if (!data?.colors || data.colors.length === 0) {
    return (
      <View style={styles.noData}>
        <Text style={styles.noDataText}>No color/size data available</Text>
      </View>
    );
  }

  const { sizeList, colors: colorRows, grandTotal } = data;
  const cellWidth = 100 / (sizeList.length + 2); // +2 for Color and Total columns

  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: `${cellWidth * 2}%` }]}>
          Color
        </Text>
        {sizeList.map((size) => (
          <Text
            key={size}
            style={[styles.tableHeaderCell, { width: `${cellWidth}%` }]}
          >
            {size}
          </Text>
        ))}
        <Text style={[styles.tableHeaderCell, { width: `${cellWidth}%` }]}>
          Total
        </Text>
      </View>

      {/* Rows */}
      {colorRows.slice(0, 10).map((row, idx) => (
        <View
          key={idx}
          style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
        >
          <View
            style={[
              styles.tableCell,
              {
                width: `${cellWidth * 2}%`,
                flexDirection: "row",
                alignItems: "center",
                gap: 4
              }
            ]}
          >
            <View
              style={[
                styles.colorDot,
                { backgroundColor: row.colorCode || colors.gray[400] }
              ]}
            />
            <Text style={styles.tableCellBold}>{row.color}</Text>
          </View>
          {sizeList.map((size) => (
            <Text
              key={size}
              style={[styles.tableCell, { width: `${cellWidth}%` }]}
            >
              {row.sizes[size] || "-"}
            </Text>
          ))}
          <Text
            style={[
              styles.tableCell,
              styles.tableCellBold,
              { width: `${cellWidth}%` }
            ]}
          >
            {row.total?.toLocaleString()}
          </Text>
        </View>
      ))}

      {/* Total Row */}
      <View style={[styles.tableRow, { backgroundColor: colors.gray[200] }]}>
        <Text
          style={[
            styles.tableCell,
            styles.tableCellBold,
            { width: `${cellWidth * 2}%` }
          ]}
        >
          TOTAL
        </Text>
        {sizeList.map((size) => (
          <Text
            key={size}
            style={[styles.tableCell, { width: `${cellWidth}%` }]}
          >
            {data.sizeTotals?.[size]?.toLocaleString() || "-"}
          </Text>
        ))}
        <Text
          style={[
            styles.tableCell,
            styles.tableCellBold,
            { width: `${cellWidth}%`, color: colors.primary }
          ]}
        >
          {grandTotal?.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

// =============================================================================
// AQL SECTION
// =============================================================================
const AQLSection = ({ aqlResult, aqlSampleData, totals, inspectedQty }) => {
  if (!aqlResult) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { backgroundColor: "#7C3AED" }]}>
        AQL DEFECT RESULT
      </Text>
      <View style={styles.sectionContent}>
        {/* AQL Cards */}
        <View style={styles.aqlCard}>
          <View style={styles.aqlCardItem}>
            <Text style={styles.aqlCardLabel}>Inspected Qty</Text>
            <Text style={styles.aqlCardValue}>{inspectedQty}</Text>
          </View>
          <View style={styles.aqlCardItem}>
            <Text style={styles.aqlCardLabel}>Sample Size</Text>
            <Text style={styles.aqlCardValue}>
              {aqlSampleData?.sampleSize || "-"}
            </Text>
          </View>
          <View style={styles.aqlCardItem}>
            <Text style={styles.aqlCardLabel}>Minor Accept</Text>
            <Text style={styles.aqlCardValue}>
              {aqlSampleData?.minorAccept ?? "-"}
            </Text>
          </View>
          <View style={styles.aqlCardItem}>
            <Text style={styles.aqlCardLabel}>Major Accept</Text>
            <Text style={styles.aqlCardValue}>
              {aqlSampleData?.majorAccept ?? "-"}
            </Text>
          </View>
        </View>

        {/* AQL Result Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
              Category
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
              Found
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
              Allowed
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
              Result
            </Text>
          </View>
          {/* Minor */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: "25%" }]}>Minor</Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>
              {totals?.minor || 0}
            </Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>
              {aqlSampleData?.minorAccept ?? "N/A"}
            </Text>
            <Text
              style={[
                styles.tableCell,
                { width: "25%" },
                aqlResult.minorPass
                  ? styles.measurementCellPass
                  : styles.measurementCellFail
              ]}
            >
              {aqlResult.minorPass ? "PASS" : "FAIL"}
            </Text>
          </View>
          {/* Major */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: "25%" }]}>Major</Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>
              {totals?.major || 0}
            </Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>
              {aqlSampleData?.majorAccept ?? "N/A"}
            </Text>
            <Text
              style={[
                styles.tableCell,
                { width: "25%" },
                aqlResult.majorPass
                  ? styles.measurementCellPass
                  : styles.measurementCellFail
              ]}
            >
              {aqlResult.majorPass ? "PASS" : "FAIL"}
            </Text>
          </View>
          {/* Critical */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: "25%" }]}>Critical</Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>
              {totals?.critical || 0}
            </Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>0</Text>
            <Text
              style={[
                styles.tableCell,
                { width: "25%" },
                (totals?.critical || 0) === 0
                  ? styles.measurementCellPass
                  : styles.measurementCellFail
              ]}
            >
              {(totals?.critical || 0) === 0 ? "PASS" : "FAIL"}
            </Text>
          </View>
        </View>

        {/* Final Result */}
        <View
          style={[
            styles.resultBanner,
            { marginTop: 12 },
            aqlResult.final === "PASS"
              ? styles.resultBannerPass
              : styles.resultBannerFail
          ]}
        >
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>AQL Final Result</Text>
            <Text
              style={[
                styles.resultValue,
                aqlResult.final === "PASS"
                  ? styles.resultPass
                  : styles.resultFail
              ]}
            >
              {aqlResult.final}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// =============================================================================
// DEFECT SUMMARY SECTION
// =============================================================================
const DefectSummarySection = ({ summaryData, defectImages }) => {
  if (!summaryData?.groups || summaryData.groups.length === 0) {
    return null;
  }

  return (
    <>
      {/* 1. New Table Component from external file */}
      <DefectSectionPDF summaryData={summaryData} />

      {/* 2. Existing Defect Visual Evidence Logic (Kept here as requested) */}
      {defectImages && defectImages.length > 0 && (
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { backgroundColor: colors.primary }]}
          >
            DEFECT VISUAL EVIDENCE
          </Text>
          <View style={styles.sectionContent}>
            <DefectImageGrid images={defectImages} />
          </View>
        </View>
      )}
    </>
  );
};

// =============================================================================
// DEFECT IMAGE GRID
// =============================================================================

const DefectImageGrid = ({ images }) => {
  // Helper to split array into chunks of 3 (for manual rows)
  const chunk = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );

  // Group images by configLabel
  const groupedImages = {};
  images.forEach((img) => {
    const key = img.configLabel || "General";
    if (!groupedImages[key]) {
      groupedImages[key] = [];
    }
    groupedImages[key].push(img);
  });

  return (
    <View>
      {Object.entries(groupedImages).map(([configName, configImages]) => {
        // Split images into rows of 3
        const imageRows = chunk(configImages.slice(0, 9), 3);

        return (
          // REMOVED wrap={false} here to allow breaking across pages
          <View key={configName} style={{ marginBottom: 12 }}>
            {/* Header (Keep with next element if possible) */}
            <View style={styles.configGroupHeader} minPresenceAhead={100}>
              <Text style={styles.configGroupLabel}>{configName}</Text>
              <Text style={styles.configGroupCount}>
                {configImages.length} items
              </Text>
            </View>

            {/* Render Manual Rows */}
            {imageRows.map((row, rowIndex) => (
              <View
                key={rowIndex}
                style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}
                wrap={false} // Keep individual rows intact
              >
                {row.map((img, colIndex) => (
                  <View key={colIndex} style={{ width: "32%" }}>
                    <View style={styles.imageWrapper}>
                      {img.base64 ? (
                        <Image
                          style={styles.image}
                          src={img.base64}
                          cache={false}
                        />
                      ) : (
                        <View
                          style={[
                            styles.image,
                            {
                              backgroundColor: colors.gray[200],
                              justifyContent: "center",
                              alignItems: "center"
                            }
                          ]}
                        >
                          <Text
                            style={{ fontSize: 6, color: colors.gray[500] }}
                          >
                            No Image
                          </Text>
                        </View>
                      )}

                      {/* Position Badge (Top Left) */}
                      {img.positionType && (
                        <View
                          style={[
                            styles.positionBadge,
                            img.positionType === "Outside"
                              ? styles.badgeOutside
                              : img.positionType === "Inside"
                              ? styles.badgeInside
                              : styles.badgeNa
                          ]}
                        >
                          <Text>{img.positionType}</Text>
                        </View>
                      )}

                      {/* Status Badge (Top Right) */}
                      {img.status && (
                        <View
                          style={[
                            styles.imageBadge,
                            img.status === "Minor" && styles.badgeMinor,
                            img.status === "Major" && styles.badgeMajor,
                            img.status === "Critical" && styles.badgeCritical
                          ]}
                        >
                          <Text>{img.status}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.imageCaption}>
                      <Text style={styles.imageCaptionTitle}>
                        {img.pcsLabel} - {img.defectName}
                      </Text>
                      <Text style={styles.imageCaptionSubtitle}>
                        {img.locationText || "General"}
                      </Text>
                      {img.comment && (
                        <Text
                          style={[
                            styles.imageCaptionSubtitle,
                            {
                              marginTop: 2,
                              fontStyle: "italic",
                              color: colors.gray[600]
                            }
                          ]}
                        >
                          "{img.comment}"
                        </Text>
                      )}
                    </View>
                  </View>
                ))}

                {/* Spacer Views to keep alignment if row has < 3 items */}
                {[...Array(3 - row.length)].map((_, i) => (
                  <View key={`spacer-${i}`} style={{ width: "32%" }} />
                ))}
              </View>
            ))}

            {configImages.length > 9 && (
              <Text
                style={[
                  styles.textMuted,
                  styles.textSmall,
                  styles.textCenter,
                  styles.mt8
                ]}
              >
                +{configImages.length - 9} more images not shown
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

// =============================================================================
// CHECKLIST SECTION
// =============================================================================
const ChecklistSection = ({ headers, headerData }) => {
  if (!headers || headers.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { backgroundColor: "#9333EA" }]}>
        CHECKLIST
      </Text>
      <View style={styles.sectionContent}>
        <View style={styles.checklistGrid}>
          {headers.map((section) => {
            const selectedVal = headerData?.selectedOptions?.[section._id];
            return (
              <View key={section._id} style={styles.checklistItem}>
                <Text style={styles.checklistLabel}>{section.MainTitle}</Text>
                <View
                  style={[
                    styles.checklistBadge,
                    selectedVal === "Conform" && styles.badgeConform,
                    selectedVal === "Non-Conform" && styles.badgeNonConform,
                    selectedVal === "N/A" && styles.badgeNA,
                    !selectedVal && {
                      backgroundColor: colors.gray[200],
                      color: colors.gray[500]
                    }
                  ]}
                >
                  <Text>{selectedVal || "Pending"}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Evidence Images */}
        {(() => {
          const evidenceSections = headers.filter((section) => {
            const hasImages = Object.keys(
              headerData?.capturedImages || {}
            ).some((k) => k.startsWith(`${section._id}_`));
            return hasImages || headerData?.remarks?.[section._id];
          });

          if (evidenceSections.length === 0) return null;

          return (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Checklist Evidence</Text>
              {evidenceSections.map((section) => {
                const remark = headerData?.remarks?.[section._id];
                const images = Object.keys(headerData?.capturedImages || {})
                  .filter((k) => k.startsWith(`${section._id}_`))
                  .map((k) => headerData.capturedImages[k]);

                return (
                  <View key={section._id} style={styles.mb8}>
                    <Text
                      style={[styles.textSmall, styles.textBold, styles.mb4]}
                    >
                      {section.MainTitle}
                    </Text>
                    {images.length > 0 && (
                      <View style={styles.imageGrid}>
                        {images.slice(0, 3).map((img, idx) => (
                          <View key={idx} style={styles.imageContainer}>
                            <View style={styles.imageWrapper}>
                              {img.base64 ? (
                                <Image style={styles.image} src={img.base64} />
                              ) : (
                                <View
                                  style={[
                                    styles.image,
                                    { backgroundColor: colors.gray[200] }
                                  ]}
                                />
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                    {remark && (
                      <View style={styles.remarkBox}>
                        <Text style={styles.remarkLabel}>Remark</Text>
                        <Text style={styles.remarkText}>{remark}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })()}
      </View>
    </View>
  );
};

// =============================================================================
// PHOTO DOCUMENTATION SECTION
// =============================================================================

const PhotoDocumentationSection = ({ photoData }) => {
  if (!photoData || photoData.length === 0) return null;

  // Helper to split array into chunks of 3
  const chunk = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );

  // Pre-filter valid sections
  const validSections = photoData
    .map((section) => ({
      ...section,
      validItems:
        section.items?.filter((item) => item.images?.length > 0).slice(0, 6) ||
        []
    }))
    .filter((section) => section.validItems.length > 0);

  if (validSections.length === 0) return null;

  return (
    <View style={styles.section} break>
      <Text style={[styles.sectionTitle, { backgroundColor: "#EA580C" }]}>
        PHOTOS
      </Text>

      <View style={styles.sectionContent}>
        {validSections.map((section, sectionIdx) => {
          const itemRows = chunk(section.validItems, 3);

          // Calculate top margin (reduce for the very first section to save space)
          const sectionStyle =
            sectionIdx === 0 ? { marginTop: 4 } : { marginTop: 12 };

          return (
            <View key={section.sectionId || sectionIdx} style={sectionStyle}>
              {/* Loop through Rows */}
              {itemRows.map((row, rowIndex) => (
                <View
                  key={rowIndex}
                  // wrap={false} keeps the content inside this View together.
                  // For rowIndex 0, this bundles the TITLE + ROW 1.
                  wrap={false}
                  style={{ marginBottom: 12 }}
                >
                  {/* Render Title ONLY inside the first row block */}
                  {rowIndex === 0 && (
                    <Text style={styles.subsectionTitle}>
                      {section.sectionName}
                    </Text>
                  )}

                  {/* Render the Row of Images */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {row.map((item, itemIdx) => (
                      <View key={itemIdx} style={{ width: "32%" }}>
                        <View style={styles.imageWrapper}>
                          {item.images[0]?.base64 ? (
                            <Image
                              style={styles.image}
                              src={item.images[0].base64}
                              cache={false}
                            />
                          ) : (
                            <View
                              style={[
                                styles.image,
                                {
                                  backgroundColor: colors.gray[200],
                                  justifyContent: "center",
                                  alignItems: "center"
                                }
                              ]}
                            >
                              <Text
                                style={{ fontSize: 6, color: colors.gray[500] }}
                              >
                                No Image
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.imageCaption}>
                          <Text style={styles.imageCaptionTitle}>
                            #{item.itemNo} {item.itemName}
                          </Text>
                          {item.remarks && (
                            <Text style={styles.imageCaptionSubtitle}>
                              "{item.remarks}"
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}

                    {/* Spacer Views to keep alignment if row has < 3 items */}
                    {[...Array(3 - row.length)].map((_, i) => (
                      <View key={`spacer-${i}`} style={{ width: "32%" }} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
};

// =============================================================================
// MAIN PDF DOCUMENT COMPONENT
// =============================================================================
const YPivotQAReportPDFDocument = ({
  reportData,
  orderData,
  inspectorInfo,
  definitions,
  headerData,
  measurementStageData,
  measurementResult,
  summaryData,
  defectImages,
  aqlResult,
  aqlSampleData,
  finalResult,
  defectResult,
  isAQLMethod,
  inspectedQty,
  photoDataWithImages,
  headerDataWithImages,
  defectImagesWithBase64
}) => {
  const selectedOrders = reportData?.orderNos || [];
  const orderNo = selectedOrders.length > 0 ? selectedOrders[0] : "N/A";

  return (
    <Document
      title={`Inspection Report - ${orderNo}`}
      author="Yorkmars QA System"
      subject="Fincheck Inspection Report"
      creator="Fincheck System"
    >
      {/* PAGE 1: Overview & Results */}
      <Page size="A4" style={styles.page}>
        <Header reportData={reportData} orderNo={orderNo} />
        <Footer />

        {/* Result Banner */}
        <ResultBanner
          finalResult={finalResult}
          measurementResult={measurementResult?.result || "N/A"}
          defectResult={defectResult}
        />

        {/* Inspector */}
        <InspectorSection inspector={inspectorInfo} reportData={reportData} />

        {/* Order Info */}
        <OrderInfoSection
          orderData={orderData}
          selectedOrders={selectedOrders}
        />
      </Page>

      {/* PAGE 2: AQL & Defects */}
      {(isAQLMethod || summaryData?.groups?.length > 0) && (
        <Page size="A4" style={styles.page}>
          <Header reportData={reportData} orderNo={orderNo} />
          <Footer />

          {/* AQL Section */}
          {isAQLMethod && (
            <AQLSection
              aqlResult={aqlResult}
              aqlSampleData={aqlSampleData}
              totals={summaryData?.totals}
              inspectedQty={inspectedQty}
            />
          )}

          {/* Defect Summary */}
          <DefectSummarySection
            summaryData={summaryData}
            defectImages={defectImagesWithBase64}
          />
        </Page>
      )}

      {/* PAGE 3: Measurements */}
      {measurementStageData?.length > 0 && (
        <Page size="A4" style={styles.page} wrap>
          <Header reportData={reportData} orderNo={orderNo} />
          <Footer />
          <MeasurementSectionPDF
            measurementStageData={measurementStageData}
            measurementResult={measurementResult}
          />
        </Page>
      )}

      {/* PAGE 4: Checklist */}
      {definitions?.headers?.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Header reportData={reportData} orderNo={orderNo} />
          <Footer />

          <ChecklistSection
            headers={definitions.headers}
            headerData={headerDataWithImages}
          />
        </Page>
      )}

      {/* PAGE 5: Photo Documentation */}
      {photoDataWithImages?.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Header reportData={reportData} orderNo={orderNo} />
          <Footer />

          <PhotoDocumentationSection photoData={photoDataWithImages} />
        </Page>
      )}
    </Document>
  );
};

export default YPivotQAReportPDFDocument;
