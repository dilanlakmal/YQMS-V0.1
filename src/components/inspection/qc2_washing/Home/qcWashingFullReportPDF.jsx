import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  Image
} from "@react-pdf/renderer";
import {
  getToleranceAsFraction,
  decimalToFraction
} from "../Home/fractionConverter";
import { API_BASE_URL } from "../../../../../config";

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
    paddingTop: 60,
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
  infoBlock: { width: "16%" },
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
  summaryCardValue: { fontSize: 12, fontWeight: "bold", textAlign: "center" },
  passStatus: {
    padding: 2,
    borderRadius: 2,
    fontSize: 6,
    fontWeight: "bold",
    textAlign: "center"
  },
  passGreen: { backgroundColor: "#dcfce7", color: "#166534" },
  failRed: { backgroundColor: "#fee2e2", color: "#991b1b" },
  imageContainer: {
    marginTop: 5,
    marginBottom: 5
  },
  defectImage: {
    width: 60,
    height: 40,
    // objectFit: "cover",
    borderRadius: 2,
    marginRight: 5,
    marginBottom: 3
  },
  inspectionImage: {
    width: 80,
    height: 60,
    objectFit: "cover",
    borderRadius: 2,
    marginRight: 5,
    marginBottom: 3
  },
  machineImage: {
    width: 120,
    height: 80,
    objectFit: "cover",
    borderRadius: 2,
    marginTop: 5
  }
});

// --- HELPER FUNCTIONS ---
const safeString = (value) => {
  if (value === null || value === undefined) return "N/A";
  return String(value);
};

// Update your getImageSrc function to ensure proper file extensions
const getImageSrc = (imagePath, API_BASE_URL) => {
  if (!imagePath) return null;

  // Allow both base64 and direct URLs
  if (imagePath.startsWith("data:image/") || imagePath.startsWith("http")) {
    return imagePath;
  }

  return null; // fallback
};

const SafeImage = ({ src, style, alt }) => {
  if (!src) {
    return (
      <View
        style={[
          style,
          {
            backgroundColor: "#f3f4f6",
            justifyContent: "center",
            alignItems: "center"
          }
        ]}
      >
        <Text style={{ fontSize: 6, color: "#6b7280" }}>No Image</Text>
      </View>
    );
  }

  try {
    return <Image src={src} style={style} />;
  } catch (error) {
    console.warn("Failed to render image:", src, error.message);

    // Return colored placeholder based on image type
    let bgColor = "#f3f4f6";
    let textColor = "#6b7280";
    let text = "Image Error";

    if (src?.includes("defect")) {
      bgColor = "#fee2e2";
      textColor = "#991b1b";
      text = "Defect Image";
    } else if (src?.includes("inspection")) {
      bgColor = "#dbeafe";
      textColor = "#1e40af";
      text = "Inspection Image";
    }

    return (
      <View
        style={[
          style,
          {
            backgroundColor: bgColor,
            justifyContent: "center",
            alignItems: "center"
          }
        ]}
      >
        <Text style={{ fontSize: 6, color: textColor, textAlign: "center" }}>
          {text}
        </Text>
        {alt && (
          <Text style={{ fontSize: 4, color: "#9ca3af", textAlign: "center" }}>
            {alt}
          </Text>
        )}
      </View>
    );
  }
};

// --- REUSABLE PDF COMPONENTS ---
const PdfHeader = ({ orderNo, beforeAfterWash }) => (
  <View style={styles.docHeader} fixed>
    <View>
      <Text style={styles.docTitle}>
        {orderNo} - {beforeAfterWash} Washing Measurement Summary
      </Text>
      <Text style={styles.docSubtitle}>
        Yorkmars (Cambodia) Garment MFG Co., LTD
      </Text>
    </View>
    <Text style={{ fontSize: 8 }}>{new Date().toLocaleDateString()}</Text>
  </View>
);

const OrderInfoSection = ({ recordData }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Order Information</Text>
    <View style={styles.infoGrid}>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Order No:</Text>
        <Text style={styles.infoValue}>{safeString(recordData.orderNo)}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Order Qty:</Text>
        <Text style={styles.infoValue}>{safeString(recordData.orderQty)}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Color:</Text>
        <Text style={styles.infoValue}>{safeString(recordData.color)}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Color Qty:</Text>
        <Text style={styles.infoValue}>
          {safeString(recordData.colorOrderQty)}
        </Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Wash Type:</Text>
        <Text style={styles.infoValue}>{safeString(recordData.washType)}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Report Type:</Text>
        <Text style={styles.infoValue}>
          {safeString(recordData.reportType)}
        </Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Factory:</Text>
        <Text style={styles.infoValue}>
          {safeString(recordData.factoryName)}
        </Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Buyer:</Text>
        <Text style={styles.infoValue}>{safeString(recordData.buyer)}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Wash Qty:</Text>
        <Text style={styles.infoValue}>{safeString(recordData.washQty)}</Text>
      </View>
    </View>
  </View>
);

const QualitySummaryCards = ({ recordData }) => (
  <View style={styles.summaryCardGrid}>
    <View style={styles.summaryCard}>
      <Text style={styles.summaryCardTitle}>Checked Qty</Text>
      <Text style={styles.summaryCardValue}>{recordData.checkedQty || 0}</Text>
    </View>
    <View style={styles.summaryCard}>
      <Text style={styles.summaryCardTitle}>Total Pcs</Text>
      <Text style={styles.summaryCardValue}>
        {recordData.totalCheckedPcs || 0}
      </Text>
    </View>
    <View style={styles.summaryCard}>
      <Text style={styles.summaryCardTitle}>Check Points</Text>
      <Text style={styles.summaryCardValue}>
        {recordData.totalCheckedPoint || 0}
      </Text>
    </View>
    <View style={styles.summaryCard}>
      <Text style={styles.summaryCardTitle}>Total Pass</Text>
      <Text style={styles.summaryCardValue}>{recordData.totalPass || 0}</Text>
    </View>
    <View style={styles.summaryCard}>
      <Text style={styles.summaryCardTitle}>Total Fail</Text>
      <Text style={styles.summaryCardValue}>{recordData.totalFail || 0}</Text>
    </View>
    <View style={styles.summaryCard}>
      <Text style={styles.summaryCardTitle}>Pass Rate</Text>
      <Text style={styles.summaryCardValue}>{recordData.passRate || 0}%</Text>
    </View>
  </View>
);

const DefectAnalysisTable = ({
  defectsByPc = [],
  additionalImages = [],
  API_BASE_URL
}) => {
  if (
    defectsByPc.length === 0 &&
    (!additionalImages || additionalImages.length === 0)
  ) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Defect Analysis</Text>
        <Text style={{ textAlign: "center", color: "#6b7280", fontSize: 9 }}>
          No defects recorded for this inspection
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Defect Analysis</Text>

      {defectsByPc.map((pcDefect, pcIndex) => (
        <View
          key={pcIndex}
          style={{
            marginBottom: 15,
            border: "1px solid #e5e7eb",
            borderRadius: 4,
            padding: 10
          }}
        >
          <Text
            style={[styles.sectionTitle, { fontSize: 10, marginBottom: 8 }]}
          >
            PC {pcDefect.garmentNo || pcDefect.pcNumber}
          </Text>

          {pcDefect.pcDefects && pcDefect.pcDefects.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableRow} fixed>
                <Text
                  style={[
                    styles.tableColHeader,
                    styles.textLeft,
                    { width: "25%" }
                  ]}
                >
                  Defect Name
                </Text>
                <Text style={[styles.tableColHeader, { width: "10%" }]}>
                  Count
                </Text>
                <Text style={[styles.tableColHeader, { width: "30%" }]}>
                  Images
                </Text>
              </View>
              {pcDefect.pcDefects.map((defect, defectIndex) => (
                <View key={defectIndex} style={styles.tableRow}>
                  <Text
                    style={[styles.tableCol, styles.textLeft, { width: "25%" }]}
                  >
                    {safeString(defect.defectName)}
                  </Text>
                  <Text style={[styles.tableCol, { width: "10%" }]}>
                    {defect.defectQty || defect.defectCount || 1}
                  </Text>
                  <View
                    style={[
                      styles.tableCol,
                      { width: "30%", flexDirection: "row", flexWrap: "wrap" }
                    ]}
                  >
                    {defect.defectImages && defect.defectImages.length > 0 ? (
                      defect.defectImages.map((img, imgIndex) => {
                        return (
                          <SafeImage
                            key={imgIndex}
                            src={getImageSrc(img, API_BASE_URL)}
                            style={styles.defectImage}
                          />
                        );
                      })
                    ) : (
                      <Text style={{ fontSize: 6, color: "#6b7280" }}>
                        No images
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 8, color: "#6b7280" }}>
              No defects found
            </Text>
          )}
        </View>
      ))}

      {/* Additional Images */}
      {additionalImages && additionalImages.length > 0 && (
        <View
          style={{
            marginTop: 15,
            border: "1px solid #e5e7eb",
            borderRadius: 4,
            padding: 10
          }}
        >
          <Text
            style={[styles.sectionTitle, { fontSize: 10, marginBottom: 8 }]}
          >
            Additional Images ({additionalImages.length})
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {additionalImages.map((img, imgIndex) => {
              return (
                <View key={imgIndex} style={{ margin: 2 }}>
                  <SafeImage
                    src={getImageSrc(img, API_BASE_URL)}
                    style={[styles.defectImage, { width: 80, height: 60 }]}
                  />
                  <Text style={{ fontSize: 4, color: "#999" }}>
                    Add {imgIndex + 1}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const MeasurementDetailTable = ({ sizeData }) => {
  const measurementPoints = sizeData.pcs[0]?.measurementPoints || [];
  if (measurementPoints.length === 0) return null;

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>
        Size: {sizeData.size} (K-Value: {sizeData.kvalue}) - Detailed
        Measurements
      </Text>
      <View style={styles.table}>
        <View style={styles.tableRow} fixed>
          <Text
            style={[styles.tableColHeader, styles.textLeft, { width: "25%" }]}
          >
            Measurement Point
          </Text>
          <Text style={[styles.tableColHeader, { width: "10%" }]}>Spec</Text>
          <Text style={[styles.tableColHeader, { width: "8%" }]}>Tol-</Text>
          <Text style={[styles.tableColHeader, { width: "8%" }]}>Tol+</Text>
          {sizeData.pcs.map((pc, index) => (
            <Text
              key={index}
              style={[
                styles.tableColHeader,
                { width: `${49 / sizeData.pcs.length}%` }
              ]}
            >
              {safeString(pc.pcNumber)}
            </Text>
          ))}
        </View>
        {measurementPoints.map((point, pointIndex) => (
          <View key={pointIndex} style={styles.tableRow}>
            <Text style={[styles.tableCol, styles.textLeft, { width: "25%" }]}>
              {safeString(point.pointName)}
            </Text>
            <Text style={[styles.tableCol, { width: "10%" }]}>
              {safeString(point.specs)}
            </Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>
              {safeString(getToleranceAsFraction(point, "minus"))}
            </Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>
              +{safeString(getToleranceAsFraction(point, "plus"))}
            </Text>
            {sizeData.pcs.map((pc, pcIndex) => {
              const pcMeasurement = pc.measurementPoints.find(
                (mp) => mp.rowNo === point.rowNo
              );
              const isPass = pcMeasurement?.result === "pass";
              const measuredValue = safeString(
                pcMeasurement?.measured_value_fraction
              );

              return (
                <Text
                  key={pcIndex}
                  style={[
                    styles.tableCol,
                    { width: `${49 / sizeData.pcs.length}%` },
                    isPass ? styles.passGreen : styles.failRed
                  ]}
                >
                  {measuredValue}
                </Text>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const SizewiseSummaryTable = ({ measurementSizeSummary }) => (
  <View style={styles.section} wrap={false}>
    <Text style={styles.sectionTitle}>Size-wise Measurement Summary</Text>
    <View style={styles.table}>
      <View style={styles.tableRow} fixed>
        <Text
          style={[styles.tableColHeader, styles.textLeft, { width: "15%" }]}
        >
          Size
        </Text>
        <Text style={[styles.tableColHeader, { width: "12%" }]}>
          Checked Pcs
        </Text>
        <Text style={[styles.tableColHeader, { width: "12%" }]}>
          Check Points
        </Text>
        <Text style={[styles.tableColHeader, { width: "12%" }]}>
          Total Pass
        </Text>
        <Text style={[styles.tableColHeader, { width: "12%" }]}>
          Total Fail
        </Text>
        <Text style={[styles.tableColHeader, { width: "12%" }]}>
          Plus Tol Fail
        </Text>
        <Text style={[styles.tableColHeader, { width: "12%" }]}>
          Minus Tol Fail
        </Text>
        <Text style={[styles.tableColHeader, { width: "13%" }]}>Pass Rate</Text>
      </View>
      {measurementSizeSummary.map((sizeSummary, index) => {
        const passRate =
          sizeSummary.checkedPoints > 0
            ? (
                (sizeSummary.totalPass / sizeSummary.checkedPoints) *
                100
              ).toFixed(1)
            : "0";
        return (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCol, styles.textLeft, { width: "15%" }]}>
              {safeString(sizeSummary.size)}
            </Text>
            <Text style={[styles.tableCol, { width: "12%" }]}>
              {sizeSummary.checkedPcs || 0}
            </Text>
            <Text style={[styles.tableCol, { width: "12%" }]}>
              {sizeSummary.checkedPoints || 0}
            </Text>
            <Text style={[styles.tableCol, { width: "12%" }]}>
              {sizeSummary.totalPass || 0}
            </Text>
            <Text style={[styles.tableCol, { width: "12%" }]}>
              {sizeSummary.totalFail || 0}
            </Text>
            <Text style={[styles.tableCol, { width: "12%" }]}>
              {sizeSummary.plusToleranceFailCount || 0}
            </Text>
            <Text style={[styles.tableCol, { width: "12%" }]}>
              {sizeSummary.minusToleranceFailCount || 0}
            </Text>
            <Text style={[styles.tableCol, { width: "13%" }]}>{passRate}%</Text>
          </View>
        );
      })}
    </View>
  </View>
);

const InspectionDetailsSection = ({ inspectionDetails, API_BASE_URL }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Inspection Details</Text>

      {/* Checked Points */}
      {inspectionDetails.checkedPoints?.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10 }]}>
            Checked Points
          </Text>
          <View style={styles.table}>
            <View style={styles.tableRow} fixed>
              <Text
                style={[
                  styles.tableColHeader,
                  styles.textLeft,
                  { width: "20%" }
                ]}
              >
                Point Name
              </Text>
              <Text style={[styles.tableColHeader, { width: "12%" }]}>
                Decision
              </Text>
              <Text style={[styles.tableColHeader, { width: "12%" }]}>
                Status
              </Text>
              <Text
                style={[
                  styles.tableColHeader,
                  styles.textLeft,
                  { width: "20%" }
                ]}
              >
                Remark
              </Text>
              <Text style={[styles.tableColHeader, { width: "36%" }]}>
                Comparison Images
              </Text>
            </View>
            {inspectionDetails.checkedPoints.map((point, index) => {
              return (
                <View key={index} style={styles.tableRow}>
                  <Text
                    style={[styles.tableCol, styles.textLeft, { width: "20%" }]}
                  >
                    {safeString(point.pointName)}
                  </Text>
                  <Text style={[styles.tableCol, { width: "12%" }]}>
                    {safeString(point.decision)}
                  </Text>
                  <Text
                    style={[
                      styles.tableCol,
                      { width: "12%" },
                      point.status === "Pass" || point.decision === "ok"
                        ? styles.passGreen
                        : styles.failRed
                    ]}
                  >
                    {point.status ||
                      (point.decision === "ok" ? "Pass" : "Fail")}
                  </Text>
                  <Text
                    style={[styles.tableCol, styles.textLeft, { width: "20%" }]}
                  >
                    {safeString(point.remark)}
                  </Text>
                  <View
                    style={[
                      styles.tableCol,
                      {
                        width: "36%",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        alignItems: "flex-start"
                      }
                    ]}
                  >
                    {/* Point Image (if exists) */}
                    {point.image && (
                      <View style={{ margin: 2 }}>
                        <SafeImage
                          src={getImageSrc(point.image, API_BASE_URL)}
                          style={styles.inspectionImage}
                          alt={`Point ${point.pointName} Image`}
                        />
                        <Text
                          style={{
                            fontSize: 4,
                            color: "#999",
                            textAlign: "center"
                          }}
                        >
                          Point Image
                        </Text>
                      </View>
                    )}

                    {/* Comparison Images */}
                    {point.comparison && point.comparison.length > 0
                      ? point.comparison.map((img, imgIndex) => {
                          return (
                            <View key={imgIndex} style={{ margin: 2 }}>
                              <SafeImage
                                src={getImageSrc(img, API_BASE_URL)}
                                style={styles.inspectionImage}
                                alt={`Comparison ${imgIndex + 1}`}
                              />
                              <Text
                                style={{
                                  fontSize: 4,
                                  color: "#999",
                                  textAlign: "center"
                                }}
                              >
                                Comp {imgIndex + 1}
                              </Text>
                            </View>
                          );
                        })
                      : !point.image && (
                          <Text
                            style={{
                              fontSize: 6,
                              color: "#6b7280",
                              padding: 4
                            }}
                          >
                            No images
                          </Text>
                        )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Parameters section */}
      {inspectionDetails.parameters?.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10 }]}>
            Parameters
          </Text>
          <View style={styles.table}>
            <View style={styles.tableRow} fixed>
              <Text style={[styles.tableColHeader, { width: "20%" }]}>
                Parameter Name
              </Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>
                Checked Qty
              </Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>
                Defect Qty
              </Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>
                Pass Rate
              </Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>
                Result
              </Text>
              <Text
                style={[
                  styles.tableColHeader,
                  styles.textLeft,
                  { width: "20%" }
                ]}
              >
                Remark
              </Text>
            </View>
            {inspectionDetails.parameters.map((param, index) => (
              <View key={index} style={styles.tableRow}>
                <Text
                  style={[styles.tableCol, styles.textLeft, { width: "20%" }]}
                >
                  {safeString(param.parameterName)}
                </Text>
                <Text style={[styles.tableCol, { width: "15%" }]}>
                  {param.checkedQty || 0}
                </Text>
                <Text style={[styles.tableCol, { width: "15%" }]}>
                  {param.defectQty || 0}
                </Text>
                <Text style={[styles.tableCol, { width: "15%" }]}>
                  {param.passRate || 0}%
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    { width: "15%" },
                    param.result === "Pass" ? styles.passGreen : styles.failRed
                  ]}
                >
                  {safeString(param.result)}
                </Text>
                <Text
                  style={[styles.tableCol, styles.textLeft, { width: "20%" }]}
                >
                  {safeString(param.remark)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Machine Processes */}
      {inspectionDetails.machineProcesses?.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10 }]}>
            Machine Processes
          </Text>
          {inspectionDetails.machineProcesses.map((machine, index) => {
            return (
              <View
                key={index}
                style={{
                  marginBottom: 10,
                  border: "1px solid #e5e7eb",
                  borderRadius: 4,
                  padding: 8
                }}
              >
                <Text
                  style={{ fontSize: 9, fontWeight: "bold", marginBottom: 5 }}
                >
                  Machine Type: {safeString(machine.machineType)}
                </Text>
                <View style={styles.table}>
                  <View style={styles.tableRow} fixed>
                    <Text style={[styles.tableColHeader, { width: "20%" }]}>
                      Parameter
                    </Text>
                    <Text style={[styles.tableColHeader, { width: "20%" }]}>
                      Standard
                    </Text>
                    <Text style={[styles.tableColHeader, { width: "20%" }]}>
                      Actual
                    </Text>
                    <Text style={[styles.tableColHeader, { width: "20%" }]}>
                      Status
                    </Text>
                    <Text style={[styles.tableColHeader, { width: "20%" }]}>
                      Unit
                    </Text>
                  </View>

                  {/* Temperature Row */}
                  {machine.temperature && (
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        Temperature
                      </Text>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        {machine.temperature.standardValue ?? "N/A"}
                      </Text>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        {machine.temperature.actualValue ?? "N/A"}
                      </Text>
                      <Text
                        style={[
                          styles.tableCol,
                          { width: "20%" },
                          machine.temperature.status?.ok
                            ? styles.passGreen
                            : styles.failRed
                        ]}
                      >
                        {machine.temperature.status?.ok ? "OK" : "NG"}
                      </Text>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        °C
                      </Text>
                    </View>
                  )}

                  {/* Time Row */}
                  {machine.time && (
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        Time
                      </Text>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        {machine.time.standardValue ?? "N/A"}
                      </Text>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        {machine.time.actualValue ?? "N/A"}
                      </Text>
                      <Text
                        style={[
                          styles.tableCol,
                          { width: "20%" },
                          machine.time.status?.ok
                            ? styles.passGreen
                            : styles.failRed
                        ]}
                      >
                        {machine.time.status?.ok ? "OK" : "NG"}
                      </Text>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        min
                      </Text>
                    </View>
                  )}

                  {/* Silicon Row - only show if has actual value */}
                  {machine.silicon?.actualValue && (
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        Silicon
                      </Text>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        {machine.silicon.standardValue ?? "N/A"}
                      </Text>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        {machine.silicon.actualValue ?? "N/A"}
                      </Text>
                      <Text
                        style={[
                          styles.tableCol,
                          { width: "20%" },
                          machine.silicon.status?.ok
                            ? styles.passGreen
                            : styles.failRed
                        ]}
                      >
                        {machine.silicon.status?.ok ? "OK" : "NG"}
                      </Text>
                      <Text style={[styles.tableCol, { width: "20%" }]}>g</Text>
                    </View>
                  )}

                  {/* Softener Row - only show if has actual value */}
                  {machine.softener?.actualValue && (
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        Softener
                      </Text>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        {machine.softener.standardValue ?? "N/A"}
                      </Text>
                      <Text style={[styles.tableCol, { width: "20%" }]}>
                        {machine.softener.actualValue ?? "N/A"}
                      </Text>
                      <Text
                        style={[
                          styles.tableCol,
                          { width: "20%" },
                          machine.softener.status?.ok
                            ? styles.passGreen
                            : styles.failRed
                        ]}
                      >
                        {machine.softener.status?.ok ? "OK" : "NG"}
                      </Text>
                      <Text style={[styles.tableCol, { width: "20%" }]}>g</Text>
                    </View>
                  )}
                </View>

                {/* Machine Image with SafeImage */}
                {machine.image && (
                  <View style={styles.imageContainer}>
                    <Text
                      style={{ fontSize: 7, color: "#6b7280", marginBottom: 3 }}
                    >
                      Machine Image:
                    </Text>
                    <SafeImage
                      src={getImageSrc(machine.image, API_BASE_URL)}
                      style={styles.machineImage}
                      alt={`Machine ${machine.machineType} Image`}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const BeforeAfterComparisonSection = ({
  recordData,
  comparisonData,
  API_BASE_URL
}) => {
  const primaryData =
    recordData.before_after_wash === "Before Wash"
      ? comparisonData
      : recordData;
  const secondaryData =
    recordData.before_after_wash === "Before Wash"
      ? recordData
      : comparisonData;

  const afterMeasurements = primaryData.measurementDetails?.measurement || [];
  const beforeMeasurements =
    secondaryData.measurementDetails?.measurement || [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Before vs After Wash Comparison</Text>
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 8, color: "#6b7280" }}>
          Before: {secondaryData.before_after_wash} | After:{" "}
          {primaryData.before_after_wash}
        </Text>
      </View>

      {afterMeasurements.map((afterSizeData, index) => {
        const beforeSizeData = beforeMeasurements.find(
          (size) => size.size === afterSizeData.size
        );
        if (!beforeSizeData) {
          return (
            <View
              key={index}
              style={{
                marginBottom: 10,
                padding: 8,
                backgroundColor: "#fef3c7",
                borderRadius: 4
              }}
            >
              <Text style={{ fontSize: 8, color: "#d97706" }}>
                Size: {afterSizeData.size} - No comparison data available
              </Text>
            </View>
          );
        }

        const afterMeasurementPoints =
          afterSizeData.pcs[0]?.measurementPoints || [];
        const maxPcs = Math.max(
          afterSizeData.pcs.length,
          beforeSizeData.pcs.length
        );

        return (
          <View key={index} style={{ marginBottom: 20 }} wrap={false}>
            <Text style={[styles.sectionTitle, { fontSize: 10 }]}>
              Size: {afterSizeData.size} - Before vs After Comparison
            </Text>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 7, color: "#6b7280" }}>
                Before: {beforeSizeData.pcs.length} pcs | After:{" "}
                {afterSizeData.pcs.length} pcs | K-Value Before:{" "}
                {beforeSizeData.kvalue} | K-Value After: {afterSizeData.kvalue}
              </Text>
            </View>

            <View style={styles.table}>
              {/* Main Header Row */}
              <View style={styles.tableRow} fixed>
                <Text
                  style={[
                    styles.tableColHeader,
                    styles.textLeft,
                    { width: "20%" }
                  ]}
                >
                  Point
                </Text>
                <Text style={[styles.tableColHeader, { width: "8%" }]}>
                  Spec
                </Text>
                <Text style={[styles.tableColHeader, { width: "5%" }]}>
                  Tol-
                </Text>
                <Text style={[styles.tableColHeader, { width: "5%" }]}>
                  Tol+
                </Text>
                {Array.from({ length: maxPcs }, (_, pcIndex) => (
                  <Text
                    key={pcIndex}
                    style={[
                      styles.tableColHeader,
                      { width: `${62 / maxPcs}%`, fontSize: 8 }
                    ]}
                  >
                    Garment {pcIndex + 1}
                  </Text>
                ))}
              </View>

              {/* Sub Header Row for Before/After/Difference */}
              <View style={styles.tableRow} fixed>
                <Text style={[styles.tableColHeader, { width: "20%" }]}></Text>
                <Text style={[styles.tableColHeader, { width: "8%" }]}></Text>
                <Text style={[styles.tableColHeader, { width: "5%" }]}></Text>
                <Text style={[styles.tableColHeader, { width: "5%" }]}></Text>
                {Array.from({ length: maxPcs }, (_, pcIndex) => (
                  <View
                    key={pcIndex}
                    style={[{ width: `${62 / maxPcs}%`, flexDirection: "row" }]}
                  >
                    <Text
                      style={[
                        styles.tableColHeader,
                        {
                          width: "33.33%",
                          fontSize: 6,
                          backgroundColor: "#e0f2fe",
                          borderRightWidth: 0.5,
                          borderRightColor: "#e5e7eb"
                        }
                      ]}
                    >
                      Before
                    </Text>
                    <Text
                      style={[
                        styles.tableColHeader,
                        {
                          width: "33.33%",
                          fontSize: 6,
                          backgroundColor: "#f0f9ff",
                          borderRightWidth: 0.5,
                          borderRightColor: "#e5e7eb"
                        }
                      ]}
                    >
                      After
                    </Text>
                    <Text
                      style={[
                        styles.tableColHeader,
                        {
                          width: "33.34%",
                          fontSize: 6,
                          backgroundColor: "#fef3c7"
                        }
                      ]}
                    >
                      Diff
                    </Text>
                  </View>
                ))}
              </View>

              {/* Data Rows */}
              {afterMeasurementPoints.map((afterPoint, pointIndex) => {
                const beforePoint =
                  beforeSizeData.pcs[0]?.measurementPoints.find(
                    (bp) => bp.pointName === afterPoint.pointName
                  );

                return (
                  <View key={pointIndex} style={styles.tableRow}>
                    <Text
                      style={[
                        styles.tableCol,
                        styles.textLeft,
                        { width: "20%" }
                      ]}
                    >
                      {safeString(afterPoint.pointName)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "8%" }]}>
                      {safeString(afterPoint.specs)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "5%" }]}>
                      {getToleranceAsFraction(afterPoint, "minus")}
                    </Text>
                    <Text style={[styles.tableCol, { width: "5%" }]}>
                      +{getToleranceAsFraction(afterPoint, "plus")}
                    </Text>

                    {Array.from({ length: maxPcs }, (_, pcIndex) => {
                      const afterPc = afterSizeData.pcs[pcIndex];
                      const beforePc = beforeSizeData.pcs[pcIndex];

                      const afterMeasurement = afterPc?.measurementPoints.find(
                        (mp) => mp.pointName === afterPoint.pointName
                      );
                      const beforeMeasurement =
                        beforePc?.measurementPoints.find(
                          (mp) => mp.pointName === afterPoint.pointName
                        );

                      const afterValue =
                        afterMeasurement?.measured_value_fraction || "N/A";
                      const beforeValue =
                        beforeMeasurement?.measured_value_fraction || "N/A";
                      const afterPass = afterMeasurement?.result === "pass";
                      const beforePass = beforeMeasurement?.result === "pass";

                      let differenceText = "N/A";
                      let differenceColor = "#6b7280";

                      if (
                        afterMeasurement &&
                        beforeMeasurement &&
                        afterMeasurement.measured_value_decimal !== undefined &&
                        beforeMeasurement.measured_value_decimal !== undefined
                      ) {
                        const difference =
                          afterMeasurement.measured_value_decimal -
                          beforeMeasurement.measured_value_decimal;
                        if (Math.abs(difference) > 0.001) {
                          const fractionDiff = decimalToFraction(
                            Math.abs(difference)
                          );
                          differenceText =
                            difference > 0
                              ? `+${fractionDiff}"`
                              : `-${fractionDiff}"`;
                          differenceColor =
                            difference > 0 ? "#dc2626" : "#16a34a";
                        } else {
                          differenceText = '0"';
                          differenceColor = "#6b7280";
                        }
                      }

                      return (
                        <View
                          key={pcIndex}
                          style={[
                            { width: `${62 / maxPcs}%`, flexDirection: "row" }
                          ]}
                        >
                          {/* Before Value */}
                          <Text
                            style={[
                              styles.tableCol,
                              styles.textLeft,
                              {
                                width: "33.33%",
                                fontSize: 8,
                                backgroundColor: "#e0f2fe",
                                color: beforePass ? "#16a34a" : "#dc2626",
                                fontWeight: "bold",
                                borderRightWidth: 0.5,
                                borderRightColor: "#e5e7eb"
                              }
                            ]}
                          >
                            {beforeValue}
                          </Text>

                          {/* After Value */}
                          <Text
                            style={[
                              styles.tableCol,
                              styles.textLeft,
                              {
                                width: "33.33%",
                                fontSize: 8,
                                backgroundColor: "#f0f9ff",
                                color: afterPass ? "#16a34a" : "#dc2626",
                                fontWeight: "bold",
                                borderRightWidth: 0.5,
                                borderRightColor: "#e5e7eb"
                              }
                            ]}
                          >
                            {afterValue}
                          </Text>

                          {/* Difference */}
                          <Text
                            style={[
                              styles.tableCol,
                              styles.textLeft,
                              {
                                width: "33.34%",
                                fontSize: 8,
                                backgroundColor: "#fef3c7",
                                color: differenceColor,
                                fontWeight: "bold"
                              }
                            ]}
                          >
                            {differenceText}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>

            {/* Enhanced Summary for this size */}
            <View
              style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: "#f9fafb",
                borderRadius: 4
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between"
                }}
              >
                <View style={{ width: "48%" }}>
                  <Text
                    style={{
                      fontSize: 8,
                      fontWeight: "bold",
                      color: "#2563eb"
                    }}
                  >
                    Before Wash Summary:
                  </Text>
                  <Text style={{ fontSize: 7 }}>
                    Pass:{" "}
                    {beforeSizeData.pcs.reduce(
                      (total, pc) =>
                        total +
                        pc.measurementPoints.filter(
                          (mp) => mp.result === "pass"
                        ).length,
                      0
                    )}{" "}
                    /{" "}
                    {beforeSizeData.pcs.reduce(
                      (total, pc) => total + pc.measurementPoints.length,
                      0
                    )}
                  </Text>
                  <Text style={{ fontSize: 7 }}>
                    Pass Rate:{" "}
                    {(
                      (beforeSizeData.pcs.reduce(
                        (total, pc) =>
                          total +
                          pc.measurementPoints.filter(
                            (mp) => mp.result === "pass"
                          ).length,
                        0
                      ) /
                        beforeSizeData.pcs.reduce(
                          (total, pc) => total + pc.measurementPoints.length,
                          0
                        )) *
                      100
                    ).toFixed(1)}
                    %
                  </Text>
                </View>

                <View style={{ width: "48%" }}>
                  <Text
                    style={{
                      fontSize: 8,
                      fontWeight: "bold",
                      color: "#16a34a"
                    }}
                  >
                    After Wash Summary:
                  </Text>
                  <Text style={{ fontSize: 7 }}>
                    Pass:{" "}
                    {afterSizeData.pcs.reduce(
                      (total, pc) =>
                        total +
                        pc.measurementPoints.filter(
                          (mp) => mp.result === "pass"
                        ).length,
                      0
                    )}{" "}
                    /{" "}
                    {afterSizeData.pcs.reduce(
                      (total, pc) => total + pc.measurementPoints.length,
                      0
                    )}
                  </Text>
                  <Text style={{ fontSize: 7 }}>
                    Pass Rate:{" "}
                    {(
                      (afterSizeData.pcs.reduce(
                        (total, pc) =>
                          total +
                          pc.measurementPoints.filter(
                            (mp) => mp.result === "pass"
                          ).length,
                        0
                      ) /
                        afterSizeData.pcs.reduce(
                          (total, pc) => total + pc.measurementPoints.length,
                          0
                        )) *
                      100
                    ).toFixed(1)}
                    %
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const ComparisonSection = ({ recordData, comparisonData }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Comparison Analysis</Text>
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <View style={[styles.summaryCard, { width: "48%" }]}>
        <Text style={styles.summaryCardTitle}>Current Report</Text>
        <View style={{ marginTop: 5 }}>
          <Text style={{ fontSize: 8 }}>
            Pass Rate: {recordData.passRate || 0}%
          </Text>
          <Text style={{ fontSize: 8 }}>
            Total Pieces: {recordData.totalCheckedPcs || 0}
          </Text>
          <Text style={{ fontSize: 8 }}>
            Result: {recordData.overallFinalResult || "N/A"}
          </Text>
        </View>
      </View>
      <View style={[styles.summaryCard, { width: "48%" }]}>
        <Text style={styles.summaryCardTitle}>Previous Report</Text>
        <View style={{ marginTop: 5 }}>
          <Text style={{ fontSize: 8 }}>
            Pass Rate: {comparisonData.passRate || 0}%
          </Text>
          <Text style={{ fontSize: 8 }}>
            Total Pieces: {comparisonData.totalCheckedPcs || 0}
          </Text>
          <Text style={{ fontSize: 8 }}>
            Result: {comparisonData.overallFinalResult || "N/A"}
          </Text>
        </View>
      </View>
    </View>
  </View>
);

// --- MAIN PDF DOCUMENT COMPONENT ---
const QcWashingFullReportPDF = ({
  recordData,
  comparisonData = null,
  API_BASE_URL
}) => {
  const baseUrl = API_BASE_URL || "http://localhost:8000";

  if (!recordData) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>No report data available.</Text>
        </Page>
      </Document>
    );
  }

  let measurements = [];
  if (recordData.measurementDetails) {
    if (Array.isArray(recordData.measurementDetails)) {
      measurements = recordData.measurementDetails;
    } else if (
      recordData.measurementDetails.measurement &&
      Array.isArray(recordData.measurementDetails.measurement)
    ) {
      measurements = recordData.measurementDetails.measurement;
    }
  }

  const defectsByPc = recordData.defectDetails?.defectsByPc || [];
  const additionalImages = recordData.defectDetails?.additionalImages || [];
  const inspectionDetails = recordData.inspectionDetails || {};
  const measurementSizeSummary =
    recordData.measurementDetails?.measurementSizeSummary || [];

  return (
    <Document author="Yorkmars (Cambodia) Garment MFG Co., LTD">
      <Page style={styles.page} orientation="landscape">
        <PdfHeader
          orderNo={recordData.orderNo || "N/A"}
          beforeAfterWash={recordData.before_after_wash || "Washing"}
        />
        <Text style={styles.pageHeader}>QC Washing Report Summary</Text>
        <OrderInfoSection recordData={recordData} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quality Summary</Text>
          <QualitySummaryCards recordData={recordData} />
          <View style={{ textAlign: "center", marginTop: 10 }}>
            <Text
              style={[
                styles.summaryCardValue,
                { fontSize: 16 },
                recordData.overallFinalResult === "Pass"
                  ? styles.passGreen
                  : styles.failRed
              ]}
            >
              Final Result: {recordData.overallFinalResult || "N/A"}
            </Text>
          </View>
        </View>
        <DefectAnalysisTable
          defectsByPc={defectsByPc}
          additionalImages={additionalImages}
          API_BASE_URL={baseUrl}
        />
        {measurementSizeSummary.length > 0 && (
          <SizewiseSummaryTable
            measurementSizeSummary={measurementSizeSummary}
          />
        )}
        {comparisonData && (
          <ComparisonSection
            recordData={recordData}
            comparisonData={comparisonData}
          />
        )}
      </Page>
      {(inspectionDetails.checkedPoints?.length > 0 ||
        inspectionDetails.parameters?.length > 0 ||
        inspectionDetails.machineProcesses?.length > 0) && (
        <Page style={styles.page} orientation="landscape">
          <PdfHeader
            orderNo={recordData.orderNo || "N/A"}
            beforeAfterWash={recordData.before_after_wash || "Washing"}
          />
          <Text style={styles.pageHeader}>Inspection Details</Text>
          <InspectionDetailsSection
            inspectionDetails={inspectionDetails}
            API_BASE_URL={baseUrl}
          />
        </Page>
      )}
      {measurements.map((sizeData, index) => (
        <Page key={index} style={styles.page} orientation="landscape">
          <PdfHeader
            orderNo={recordData.orderNo || "N/A"}
            beforeAfterWash={recordData.before_after_wash || "Washing"}
          />
          <Text style={styles.pageHeader}>
            Detailed Measurements - Size: {sizeData.size}
          </Text>
          <MeasurementDetailTable sizeData={sizeData} />
        </Page>
      ))}
      {comparisonData &&
        comparisonData.measurementDetails?.measurement &&
        recordData.measurementDetails?.measurement && (
          <Page style={styles.page} orientation="landscape">
            <PdfHeader
              orderNo={recordData.orderNo || "N/A"}
              beforeAfterWash={recordData.before_after_wash || "Washing"}
            />
            <Text style={styles.pageHeader}>
              Before vs After Wash Comparison
            </Text>
            <BeforeAfterComparisonSection
              recordData={recordData}
              comparisonData={comparisonData}
              API_BASE_URL={baseUrl}
            />
          </Page>
        )}
    </Document>
  );
};

export default QcWashingFullReportPDF;
