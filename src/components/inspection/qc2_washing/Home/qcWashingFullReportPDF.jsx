import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
} from "@react-pdf/renderer";
import { getToleranceAsFraction, decimalToFraction } from "../Home/fractionConverter";
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

const getCheckpointStatus = (checkpointId, decision, checkpointDefinitions) => {
  if (!Array.isArray(checkpointDefinitions) || !checkpointId || !decision) {
    return { isPass: null, status: 'N/A', color: '#6b7280' };
  }

  const checkpointDef = checkpointDefinitions.find(def => def._id === checkpointId);
  if (!checkpointDef || !checkpointDef.options) {
    return { isPass: null, status: 'N/A', color: '#6b7280' };
  }

  const selectedOption = checkpointDef.options.find(opt => opt.name === decision);
  if (!selectedOption) {
    return { isPass: null, status: 'N/A', color: '#6b7280' };
  }

  const isPass = !selectedOption.isFail; // If isFail is true, then it's not a pass
  return {
    isPass,
    status: isPass ? 'OK' : 'NO',
    color: isPass ? '#16a34a' : '#dc2626',
    backgroundColor: isPass ? '#dcfce7' : '#fee2e2'
  };
};

// Enhanced getImageSrc function for PDF rendering
const ImagePlaceholder = ({ style, text, subtext }) => (
  <View style={[style, { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', padding: 4 }]}>
    <Text style={{ fontSize: 6, color: '#6b7280', textAlign: 'center' }}>{text}</Text>
    {subtext && <Text style={{ fontSize: 4, color: '#9ca3af', textAlign: 'center', marginTop: 2 }}>{subtext}</Text>}
  </View>
);

const SafeImage = ({ src, style, alt }) => {
  // If src is a placeholder object, extract the originalUrl. Otherwise, use src directly.
  const imageUrl = (typeof src === 'object' && src !== null && src.isPlaceholder) ? src.originalUrl : src;

  // If there's no valid imageUrl string, render the placeholder.
  if (!imageUrl || typeof imageUrl !== 'string') {
    const subtext = (typeof src === 'object' && src?.isPlaceholder) ? "URL Blocked" : "Not Available";
    return <ImagePlaceholder style={style} text={alt || 'Image'} subtext={subtext} />;
  }

  // @react-pdf/renderer's Image component requires an object for network requests.
  const imageSrc = {
    uri: imageUrl,
    method: 'GET',
    headers: {} // Body is not allowed for GET requests
  };

  return (
    <Image
      src={imageSrc}
      style={style}
      onError={(e) => console.error(`PDF Image Load Error for ${alt}: ${e.message || 'Unknown error'}`)}
    />
  );
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
        <Text style={styles.infoValue}>{safeString(recordData.colorOrderQty)}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Wash Type:</Text>
        <Text style={styles.infoValue}>{safeString(recordData.washType)}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Report Type:</Text>
        <Text style={styles.infoValue}>{safeString(recordData.reportType)}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Factory:</Text>
        <Text style={styles.infoValue}>{safeString(recordData.factoryName)}</Text>
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
      <Text style={styles.summaryCardValue}>{recordData.totalCheckedPcs || 0}</Text>
    </View>
    <View style={styles.summaryCard}>
      <Text style={styles.summaryCardTitle}>Check Points</Text>
      <Text style={styles.summaryCardValue}>{recordData.totalCheckedPoint || 0}</Text>
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

const DefectAnalysisTable = ({ defectsByPc = [], additionalImages = [], API_BASE_URL }) => {
  console.log('📝 DefectAnalysisTable received:', {
    defectsByPc: defectsByPc.length,
    additionalImages: additionalImages.length,
    firstDefectImages: defectsByPc[0]?.pcDefects?.[0]?.defectImages?.length || 0
  });

  if (defectsByPc.length === 0 && (!additionalImages || additionalImages.length === 0)) {
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
        <View key={pcIndex} style={{ marginBottom: 15, border: "1px solid #e5e7eb", borderRadius: 4, padding: 10 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 8 }]}>
            PC {pcDefect.garmentNo || pcDefect.pcNumber}
          </Text>
          
          {pcDefect.pcDefects && pcDefect.pcDefects.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableRow} fixed>
                <Text style={[styles.tableColHeader, styles.textLeft, { width: "25%" }]}>Defect Name</Text>
                <Text style={[styles.tableColHeader, { width: "10%" }]}>Count</Text>
                <Text style={[styles.tableColHeader, { width: "30%" }]}>Images</Text>
              </View>
              {pcDefect.pcDefects.map((defect, defectIndex) => (
                <View key={defectIndex} style={styles.tableRow}>
                  <Text style={[styles.tableCol, styles.textLeft, { width: "25%" }]}>
                    {safeString(defect.defectName)}
                  </Text>
                  <Text style={[styles.tableCol, { width: "10%" }]}>
                    {defect.defectQty || defect.defectCount || 1}
                  </Text>
                  <View style={[styles.tableCol, { width: "30%", flexDirection: "row", flexWrap: "wrap" }]}>
                    {defect.defectImages && defect.defectImages.length > 0 ? (
                      defect.defectImages.map((img, imgIndex) => {
                        console.log(`🖼️ Processing defect image ${imgIndex + 1}:`, img);
                        
                        return (
                          <SafeImage
                            key={imgIndex}
                            src={img.originalUrl || img} // Pass the original URL
                            style={styles.defectImage}
                            alt={`Defect Image ${imgIndex + 1}`}
                          />
                        );
                      })
                    ) : (
                      <Text style={{ fontSize: 6, color: "#6b7280" }}>No images</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 8, color: "#6b7280" }}>No defects found</Text>
          )}
        </View>
      ))}
      
      {/* Additional Images */}
      {additionalImages && additionalImages.length > 0 && (
        <View style={{ marginTop: 15, border: "1px solid #e5e7eb", borderRadius: 4, padding: 10 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 8 }]}>
            Additional Images ({additionalImages.length})
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {additionalImages.map((img, imgIndex) => {
              console.log(`🖼️ Processing additional image ${imgIndex + 1}:`, img);
              
              return (
                <View key={imgIndex} style={{ margin: 2 }}>
                  <SafeImage
                    src={img.originalUrl || img} // Pass the original URL
                    style={[styles.defectImage, { width: 80, height: 60 }]}
                    alt={`Additional Image ${imgIndex + 1}`}
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
        Size: {sizeData.size} (K-Value: {sizeData.kvalue}) - Detailed Measurements
      </Text>
      <View style={styles.table}>
        <View style={styles.tableRow} fixed>
          <Text style={[styles.tableColHeader, styles.textLeft, { width: "25%" }]}>
            Measurement Point
          </Text>
          <Text style={[styles.tableColHeader, { width: "10%" }]}>Spec</Text>
          <Text style={[styles.tableColHeader, { width: "8%" }]}>Tol-</Text>
          <Text style={[styles.tableColHeader, { width: "8%" }]}>Tol+</Text>
          {sizeData.pcs.map((pc, index) => (
            <Text key={index} style={[styles.tableColHeader, { width: `${49 / sizeData.pcs.length}%` }]}>
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
              {safeString(getToleranceAsFraction(point, 'minus'))}
            </Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>
              +{safeString(getToleranceAsFraction(point, 'plus'))}
            </Text>
            {sizeData.pcs.map((pc, pcIndex) => {
              const pcMeasurement = pc.measurementPoints.find(mp => mp.rowNo === point.rowNo);
              const isPass = pcMeasurement?.result === "pass";
              const measuredValue = safeString(pcMeasurement?.measured_value_fraction);
              
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
        <Text style={[styles.tableColHeader, styles.textLeft, { width: "15%" }]}>Size</Text>
        <Text style={[styles.tableColHeader, { width: "12%" }]}>Checked Pcs</Text>
        <Text style={[styles.tableColHeader, { width: "12%" }]}>Check Points</Text>
        <Text style={[styles.tableColHeader, { width: "12%" }]}>Total Pass</Text>
        <Text style={[styles.tableColHeader, { width: "12%" }]}>Total Fail</Text>
        <Text style={[styles.tableColHeader, { width: "12%" }]}>Plus Tol Fail</Text>
        <Text style={[styles.tableColHeader, { width: "12%" }]}>Minus Tol Fail</Text>
        <Text style={[styles.tableColHeader, { width: "13%" }]}>Pass Rate</Text>
      </View>
      {measurementSizeSummary.map((sizeSummary, index) => {
        const passRate = sizeSummary.checkedPoints > 0 
          ? ((sizeSummary.totalPass / sizeSummary.checkedPoints) * 100).toFixed(1)
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
            <Text style={[styles.tableCol, { width: "13%" }]}>
              {passRate}%
            </Text>
          </View>
        );
      })}
    </View>
  </View>
);
// LEGACY INSPECTION DETAILS SECTION
const InspectionDetailsSection = ({ inspectionDetails, API_BASE_URL }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Inspection Details</Text>
      
      {/* Legacy Checked Points */}
      {inspectionDetails.checkedPoints && inspectionDetails.checkedPoints.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10 }]}>Checked Points</Text>
          <View style={styles.table}>
            <View style={styles.tableRow} fixed>
              <Text style={[styles.tableColHeader, styles.textLeft, { width: "25%" }]}>Point Name</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Expected</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Actual</Text>
              <Text style={[styles.tableColHeader, { width: "10%" }]}>Status</Text>
              <Text style={[styles.tableColHeader, styles.textLeft, { width: "35%" }]}>Remark</Text>
            </View>
            {inspectionDetails.checkedPoints.map((point, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.textLeft, { width: "25%" }]}>
                  {safeString(point.pointName)}
                </Text>
                <Text style={[styles.tableCol, { width: "15%" }]}>
                  {safeString(point.expectedValue)}
                </Text>
                <Text style={[styles.tableCol, { width: "15%" }]}>
                  {safeString(point.actualValue)}
                </Text>
                <Text style={[
                  styles.tableCol, 
                  { width: "10%" },
                  point.status === 'Pass' || point.decision === 'ok' ? styles.passGreen : styles.failRed
                ]}>
                  {point.status || (point.decision === 'ok' ? 'Pass' : 'Fail')}
                </Text>
                <Text style={[styles.tableCol, styles.textLeft, { width: "35%" }]}>
                  {safeString(point.remark)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Parameters section */}
      {inspectionDetails.parameters?.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10 }]}>Parameters ({inspectionDetails.parameters.length})</Text>
          <View style={styles.table}>
            <View style={styles.tableRow} fixed>
              <Text style={[styles.tableColHeader, { width: "20%" }]}>Parameter Name</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Checked Qty</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Defect Qty</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Pass Rate</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Result</Text>
              <Text style={[styles.tableColHeader, styles.textLeft, { width: "20%" }]}>Remark</Text>
            </View>
            {inspectionDetails.parameters.map((param, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.textLeft, { width: "20%" }]}>
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
                <Text style={[
                  styles.tableCol, 
                  { width: "15%" },
                  param.result === "Pass" ? styles.passGreen : styles.failRed
                ]}>
                  {safeString(param.result)}
                </Text>
                <Text style={[styles.tableCol, styles.textLeft, { width: "20%" }]}>
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
          <Text style={[styles.sectionTitle, { fontSize: 10 }]}>Machine Processes ({inspectionDetails.machineProcesses.length})</Text>
          {inspectionDetails.machineProcesses.map((machine, index) => (
            <View key={index} style={{ marginBottom: 10, border: "1px solid #e5e7eb", borderRadius: 4, padding: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: "bold", marginBottom: 5 }}>
                Machine Type: {safeString(machine.machineType)}
              </Text>
              <View style={styles.table}>
                <View style={styles.tableRow} fixed>
                  <Text style={[styles.tableColHeader, { width: "20%" }]}>Parameter</Text>
                  <Text style={[styles.tableColHeader, { width: "20%" }]}>Standard</Text>
                  <Text style={[styles.tableColHeader, { width: "20%" }]}>Actual</Text>
                  <Text style={[styles.tableColHeader, { width: "20%" }]}>Status</Text>
                  <Text style={[styles.tableColHeader, { width: "20%" }]}>Unit</Text>
                </View>

                {/* Temperature Row */}
                {machine.temperature && (machine.temperature.actualValue !== undefined && machine.temperature.actualValue !== null && machine.temperature.actualValue !== "") && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Temperature</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.temperature.standardValue ?? "N/A"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.temperature.actualValue ?? "N/A"}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.temperature.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.temperature.status?.ok ? "OK" : "NO"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>°C</Text>
                  </View>
                )}

                {/* Time Row */}
                {machine.time && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Time</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.time.standardValue ?? "N/A"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.time.actualValue ?? "N/A"}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.time.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.time.status?.ok ? "OK" : "NG"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>min</Text>
                  </View>
                )}

                {/* Silicon Row */}
                {machine.silicon?.actualValue && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Silicon</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.silicon.standardValue ?? "N/A"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.silicon.actualValue ?? "N/A"}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.silicon.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.silicon.status?.ok ? "OK" : "NG"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>g</Text>
                  </View>
                )}

                {/* Softener Row */}
                {machine.softener?.actualValue && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Softener</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.softener.standardValue ?? "N/A"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.softener.actualValue ?? "N/A"}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.softener.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.softener.status?.ok ? "OK" : "NG"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>g</Text>
                  </View>
                )}
              </View>
              
              {/* Machine Image */}
              {machine.image && (
                <View style={styles.imageContainer}>
                  <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 3 }}>Machine Image:</Text>
                  <SafeImage
                    src={machine.image}
                    style={styles.machineImage}
                    alt={`Machine ${machine.machineType} Image`}
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const NewInspectionDetailsSection = ({ inspectionDetails, API_BASE_URL, checkpointDefinitions = [] }) => {
  console.log('🔍 NewInspectionDetailsSection received:', {
    checkpointInspectionData: inspectionDetails.checkpointInspectionData?.length || 0,
    parameters: inspectionDetails.parameters?.length || 0,
    machineProcesses: inspectionDetails.machineProcesses?.length || 0,
    checkpointDefinitions: checkpointDefinitions?.length || 0,
    fullInspectionDetails: inspectionDetails
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Inspection Details</Text>
      
      {/* New Checkpoint Inspection Data */}
      {inspectionDetails.checkpointInspectionData && inspectionDetails.checkpointInspectionData.length > 0 ? (
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10 }]}>Checkpoints</Text>
          {inspectionDetails.checkpointInspectionData.map((mainPoint, index) => {
            // Get status for main checkpoint
            const mainPointDef = checkpointDefinitions?.find(def => def._id === mainPoint.checkpointId);
            const mainPointOption = mainPointDef?.options.find(opt => opt.name === mainPoint.decision);
            const isMainFail = mainPointOption?.isFail;
            
            const mainPointStatus = {
              isPass: !isMainFail,
              status: isMainFail ? 'NO' : 'OK',
              color: isMainFail ? '#dc2626' : '#16a34a',
              backgroundColor: isMainFail ? '#fee2e2' : '#dcfce7'
            };

            return (
              <View key={mainPoint.id || index} style={{ marginBottom: 10, border: "1px solid #e5e7eb", borderRadius: 4, padding: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                    {mainPoint.name || `Checkpoint ${index + 1}`}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[styles.passStatus, { backgroundColor: mainPointStatus.backgroundColor, color: mainPointStatus.color }]}>
                      {mainPoint.decision || 'N/A'}
                    </Text>
                    {/* <Text style={[styles.passStatus, { backgroundColor: mainPointStatus.backgroundColor, color: mainPointStatus.color, fontWeight: 'bold' }]}>
                      {mainPointStatus.status}
                    </Text> */}
                  </View>
                </View>

                {/* Main Point Remark */}
                {mainPoint.remark && (
                  <View style={{ marginTop: 4, marginBottom: 8, backgroundColor: "#f9fafb", padding: 4, borderRadius: 2 }}>
                    <Text style={{ fontSize: 7, color: "#6b7280" }}>Remark:</Text>
                    <Text style={{ fontSize: 8, color: "#374151" }}>{mainPoint.remark}</Text>
                  </View>
                )}

                {/* Sub Points - Improved Layout */}
                {mainPoint.subPoints && mainPoint.subPoints.length > 0 && (
                  <View style={{ marginTop: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: "#e5e7eb" }}>
                    <Text style={{ fontSize: 8, fontWeight: "bold", marginBottom: 5, color: "#6b7280" }}>Sub-points:</Text>
                    {mainPoint.subPoints.map((subPoint, subIndex) => {
                      // Find the sub-point definition from checkpoint definitions
                      const subPointDef = mainPointDef?.subPoints?.find(sp => sp.id === subPoint.subPointId);
                      const subPointOption = subPointDef?.options?.find(opt => opt.name === subPoint.decision);
                      const isFail = subPointOption?.isFail === true;
                      
                      // Get the actual sub-point name from definition
                      const subPointName = subPointDef?.name || subPoint.name;
                      const optionName = subPoint.decision || 'N/A';
                      
                      console.log(`Sub-point ${subIndex + 1}:`, {
                        subPointId: subPoint.subPointId,
                        subPointName: subPointName,
                        decision: subPoint.decision,
                        subPointDef: subPointDef?.name,
                        subPointOption: subPointOption?.name,
                        isFail: isFail
                      });

                      return (
                        <View key={subPoint.id || subIndex} style={{ 
                          marginBottom: 6, 
                          backgroundColor: "#f9fafb", 
                          padding: 6, 
                          borderRadius: 2,
                          borderWidth: 1,
                          borderColor: "#e5e7eb"
                        }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            {/* Left side: Sub-point name and option */}
                            <View style={{ flexDirection: "row", alignItems: "center", width: "70%" }}>
                              <Text style={{ fontSize: 8, color: "#374151", fontWeight: "500", marginRight: 4 }}>
                                {subIndex}.
                              </Text>
                              {/* <Text style={{ fontSize: 8, color: "#374151", fontWeight: "500", marginRight: 8 }}>
                                {optionName}:
                              </Text> */}
                              <Text style={[
                                styles.passStatus,
                                { 
                                  backgroundColor: isFail ? '#fee2e2' : '#dcfce7',
                                  color: isFail ? '#dc2626' : '#16a34a',
                                  fontSize: 7
                                }
                              ]}>
                                {optionName}
                              </Text>
                            </View>
                            
                            {/* Right side: Status */}
                            <Text style={[
                              styles.passStatus,
                              { 
                                backgroundColor: isFail ? '#fee2e2' : '#dcfce7',
                                color: isFail ? '#dc2626' : '#16a34a',
                                fontWeight: 'bold',
                                fontSize: 7
                              }
                            ]}>
                              {isFail ? 'NO' : 'OK'}
                            </Text>
                          </View>
                          
                          {/* Remark on new line if exists */}
                          {subPoint.remark && (
                            <Text style={{ fontSize: 7, color: "#6b7280", fontStyle: "italic", marginTop: 3 }}>
                              Remark: {subPoint.remark}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10 }]}>Checkpoints</Text>
          <Text style={{ fontSize: 8, color: "#6b7280", textAlign: "center", padding: 10 }}>
            No checkpoint inspection data available
          </Text>
        </View>
      )}

      {/* Parameters section - unchanged */}
      {inspectionDetails.parameters?.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10 }]}>Parameters ({inspectionDetails.parameters.length})</Text>
          <View style={styles.table}>
            <View style={styles.tableRow} fixed>
              <Text style={[styles.tableColHeader, { width: "20%" }]}>Parameter Name</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Checked Qty</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Defect Qty</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Pass Rate</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Result</Text>
              <Text style={[styles.tableColHeader, styles.textLeft, { width: "20%" }]}>Remark</Text>
            </View>
            {inspectionDetails.parameters.map((param, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.textLeft, { width: "20%" }]}>
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
                <Text style={[
                  styles.tableCol, 
                  { width: "15%" },
                  param.result === "Pass" ? styles.passGreen : styles.failRed
                ]}>
                  {safeString(param.result)}
                </Text>
                <Text style={[styles.tableCol, styles.textLeft, { width: "20%" }]}>
                  {safeString(param.remark)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Machine Processes - unchanged from your existing code */}
      {inspectionDetails.machineProcesses?.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10 }]}>Machine Processes ({inspectionDetails.machineProcesses.length})</Text>
          {inspectionDetails.machineProcesses.map((machine, index) => (
            <View key={index} style={{ marginBottom: 10, border: "1px solid #e5e7eb", borderRadius: 4, padding: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: "bold", marginBottom: 5 }}>
                Machine Type: {safeString(machine.machineType)}
              </Text>
              <View style={styles.table}>
                <View style={styles.tableRow} fixed>
                  <Text style={[styles.tableColHeader, { width: "20%" }]}>Parameter</Text>
                  <Text style={[styles.tableColHeader, { width: "20%" }]}>Standard</Text>
                  <Text style={[styles.tableColHeader, { width: "20%" }]}>Actual</Text>
                  <Text style={[styles.tableColHeader, { width: "20%" }]}>Status</Text>
                  <Text style={[styles.tableColHeader, { width: "20%" }]}>Unit</Text>
                </View>

                {/* Temperature Row */}
                {machine.temperature && (machine.temperature.actualValue !== undefined && machine.temperature.actualValue !== null && machine.temperature.actualValue !== "") && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Temperature</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.temperature.standardValue ?? "N/A"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.temperature.actualValue ?? "N/A"}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.temperature.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.temperature.status?.ok ? "OK" : "NO"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>°C</Text>
                  </View>
                )}

                {/* Time Row */}
                {machine.time && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Time</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.time.standardValue ?? "N/A"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.time.actualValue ?? "N/A"}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.time.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.time.status?.ok ? "OK" : "NG"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>min</Text>
                  </View>
                )}

                {/* Silicon Row - only show if has actual value */}
                {machine.silicon?.actualValue && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Silicon</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.silicon.standardValue ?? "N/A"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.silicon.actualValue ?? "N/A"}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.silicon.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.silicon.status?.ok ? "OK" : "NG"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>g</Text>
                  </View>
                )}

                {/* Softener Row - only show if has actual value */}
                {machine.softener?.actualValue && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Softener</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.softener.standardValue ?? "N/A"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {machine.softener.actualValue ?? "N/A"}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.softener.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.softener.status?.ok ? "OK" : "NG"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>g</Text>
                  </View>
                )}
              </View>
              
              {/* Machine Image with SafeImage */}
              {machine.image && (
                <View style={styles.imageContainer}>
                  <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 3 }}>Machine Image:</Text>
                  <SafeImage
                    src={machine.image}
                    style={styles.machineImage}
                    alt={`Machine ${machine.machineType} Image`}
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};


const BeforeAfterComparisonSection = ({ recordData, comparisonData, API_BASE_URL }) => {
  const primaryData = recordData.before_after_wash === 'Before Wash' ? comparisonData : recordData;
  const secondaryData = recordData.before_after_wash === 'Before Wash' ? recordData : comparisonData;
  
  const afterMeasurements = primaryData.measurementDetails?.measurement || [];
  const beforeMeasurements = secondaryData.measurementDetails?.measurement || [];
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Before vs After Wash Comparison</Text>
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 8, color: "#6b7280" }}>
          Before: {secondaryData.before_after_wash} ({secondaryData.reportType || 'N/A'}) | After: {primaryData.before_after_wash} ({primaryData.reportType || 'N/A'})
        </Text>
      </View>
      
      {afterMeasurements.map((afterSizeData, index) => {
        const beforeSizeData = beforeMeasurements.find(size => size.size === afterSizeData.size);
        if (!beforeSizeData) {
          return (
            <View key={index} style={{ marginBottom: 10, padding: 8, backgroundColor: "#fef3c7", borderRadius: 4 }}>
              <Text style={{ fontSize: 8, color: "#d97706" }}>
                Size: {afterSizeData.size} - No comparison data available
              </Text>
            </View>
          );
        }
        
        const afterMeasurementPoints = afterSizeData.pcs[0]?.measurementPoints || [];
        const maxPcs = Math.max(afterSizeData.pcs.length, beforeSizeData.pcs.length);
        
        return (
          <View key={index} style={{ marginBottom: 20 }} wrap={false}>
            <Text style={[styles.sectionTitle, { fontSize: 10 }]}>
              Size: {afterSizeData.size} - Before vs After Comparison
            </Text>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 7, color: "#6b7280" }}>
                Before: {beforeSizeData.pcs.length} pcs | After: {afterSizeData.pcs.length} pcs | 
                K-Value Before: {beforeSizeData.kvalue} | K-Value After: {afterSizeData.kvalue}
              </Text>
            </View>
            
            <View style={styles.table}>
              {/* Main Header Row */}
              <View style={styles.tableRow} fixed>
                <Text style={[styles.tableColHeader, styles.textLeft, { width: "20%" }]}>Point</Text>
                <Text style={[styles.tableColHeader, { width: "8%" }]}>Spec</Text>
                <Text style={[styles.tableColHeader, { width: "5%" }]}>Tol-</Text>
                <Text style={[styles.tableColHeader, { width: "5%" }]}>Tol+</Text>
                {Array.from({ length: maxPcs }, (_, pcIndex) => (
                  <Text key={pcIndex} style={[styles.tableColHeader, { width: `${62 / maxPcs}%`, fontSize: 8 }]}>
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
                  <View key={pcIndex} style={[{ width: `${62 / maxPcs}%`, flexDirection: "row" }]}>
                    <Text style={[
                      styles.tableColHeader, 
                      { 
                        width: "33.33%", 
                        fontSize: 6, 
                        backgroundColor: "#e0f2fe",
                        borderRightWidth: 0.5,
                        borderRightColor: "#e5e7eb"
                      }
                    ]}>
                      Before
                    </Text>
                    <Text style={[
                      styles.tableColHeader, 
                      { 
                        width: "33.33%", 
                        fontSize: 6, 
                        backgroundColor: "#f0f9ff",
                        borderRightWidth: 0.5,
                        borderRightColor: "#e5e7eb"
                      }
                    ]}>
                      After
                    </Text>
                    <Text style={[
                      styles.tableColHeader, 
                      { 
                        width: "33.34%", 
                        fontSize: 6, 
                        backgroundColor: "#fef3c7"
                      }
                    ]}>
                      Diff
                    </Text>
                  </View>
                ))}
              </View>
              
              {/* Data Rows */}
              {afterMeasurementPoints.map((afterPoint, pointIndex) => {
                const beforePoint = beforeSizeData.pcs[0]?.measurementPoints.find(
                  bp => bp.pointName === afterPoint.pointName
                );
                
                return (
                  <View key={pointIndex} style={styles.tableRow}>
                    <Text style={[styles.tableCol, styles.textLeft, { width: "20%" }]}>
                      {safeString(afterPoint.pointName)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "8%" }]}>
                      {safeString(afterPoint.specs)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "5%" }]}>
                      {getToleranceAsFraction(afterPoint, 'minus')}
                    </Text>
                    <Text style={[styles.tableCol, { width: "5%" }]}>
                      +{getToleranceAsFraction(afterPoint, 'plus')}
                    </Text>
                    
                    {Array.from({ length: maxPcs }, (_, pcIndex) => {
                      const afterPc = afterSizeData.pcs[pcIndex];
                      const beforePc = beforeSizeData.pcs[pcIndex];
                      
                      const afterMeasurement = afterPc?.measurementPoints.find(mp => mp.pointName === afterPoint.pointName);
                      const beforeMeasurement = beforePc?.measurementPoints.find(mp => mp.pointName === afterPoint.pointName);
                      
                      const afterValue = afterMeasurement?.measured_value_fraction || "N/A";
                      const beforeValue = beforeMeasurement?.measured_value_fraction || "N/A";
                      const afterPass = afterMeasurement?.result === 'pass';
                      const beforePass = beforeMeasurement?.result === 'pass';
                                          
                      let differenceText = "N/A";
                      let differenceColor = "#6b7280";
                      
                      if (afterMeasurement && beforeMeasurement && 
                          afterMeasurement.measured_value_decimal !== undefined && 
                          beforeMeasurement.measured_value_decimal !== undefined) {
                        const difference = afterMeasurement.measured_value_decimal - beforeMeasurement.measured_value_decimal;
                        if (Math.abs(difference) > 0.001) {
                          const fractionDiff = decimalToFraction(Math.abs(difference));
                          differenceText = difference > 0 ? `+${fractionDiff}"` : `-${fractionDiff}"`;
                          differenceColor = difference > 0 ? "#dc2626" : "#16a34a";
                        } else {
                          differenceText = "0\"";
                          differenceColor = "#6b7280";
                        }
                      }
                      
                      return (
                        <View key={pcIndex} style={[{ width: `${62 / maxPcs}%`, flexDirection: "row" }]}>
                          {/* Before Value */}
                          <Text style={[
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
                          ]}>
                            {beforeValue}
                          </Text>
                          
                          {/* After Value */}
                          <Text style={[
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
                          ]}>
                            {afterValue}
                          </Text>
                          
                          {/* Difference */}
                          <Text style={[
                            styles.tableCol, 
                            styles.textLeft,
                            { 
                              width: "33.34%", 
                              fontSize: 8,
                              backgroundColor: "#fef3c7",
                              color: differenceColor,
                              fontWeight: "bold"
                            }
                          ]}>
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
            <View style={{ marginTop: 8, padding: 8, backgroundColor: "#f9fafb", borderRadius: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ width: "48%" }}>
                  <Text style={{ fontSize: 8, fontWeight: "bold", color: "#2563eb" }}>Before Wash Summary:</Text>
                  <Text style={{ fontSize: 7 }}>
                    Pass: {beforeSizeData.pcs.reduce((total, pc) => 
                      total + pc.measurementPoints.filter(mp => mp.result === 'pass').length, 0
                    )} / {beforeSizeData.pcs.reduce((total, pc) => total + pc.measurementPoints.length, 0)}
                  </Text>
                  <Text style={{ fontSize: 7 }}>
                    Pass Rate: {(
                      (beforeSizeData.pcs.reduce((total, pc) => 
                        total + pc.measurementPoints.filter(mp => mp.result === 'pass').length, 0
                      ) / beforeSizeData.pcs.reduce((total, pc) => total + pc.measurementPoints.length, 0)) * 100
                    ).toFixed(1)}%
                  </Text>
                </View>
                
                <View style={{ width: "48%" }}>
                  <Text style={{ fontSize: 8, fontWeight: "bold", color: "#16a34a" }}>After Wash Summary:</Text>
                  <Text style={{ fontSize: 7 }}>
                    Pass: {afterSizeData.pcs.reduce((total, pc) => 
                      total + pc.measurementPoints.filter(mp => mp.result === 'pass').length, 0
                    )} / {afterSizeData.pcs.reduce((total, pc) => total + pc.measurementPoints.length, 0)}
                  </Text>
                  <Text style={{ fontSize: 7 }}>
                    Pass Rate: {(
                      (afterSizeData.pcs.reduce((total, pc) => 
                        total + pc.measurementPoints.filter(mp => mp.result === 'pass').length, 0
                      ) / afterSizeData.pcs.reduce((total, pc) => total + pc.measurementPoints.length, 0)) * 100
                    ).toFixed(1)}%
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
          <Text style={{ fontSize: 8 }}>Pass Rate: {recordData.passRate || 0}%</Text>
          <Text style={{ fontSize: 8 }}>Total Pieces: {recordData.totalCheckedPcs || 0}</Text>
          <Text style={{ fontSize: 8 }}>Result: {recordData.overallFinalResult || "N/A"}</Text>
        </View>
      </View>
      <View style={[styles.summaryCard, { width: "48%" }]}>
        <Text style={styles.summaryCardTitle}>Previous Report</Text>
        <View style={{ marginTop: 5 }}>
          <Text style={{ fontSize: 8 }}>Pass Rate: {comparisonData.passRate || 0}%</Text>
          <Text style={{ fontSize: 8 }}>Total Pieces: {comparisonData.totalCheckedPcs || 0}</Text>
          <Text style={{ fontSize: 8 }}>Result: {comparisonData.overallFinalResult || "N/A"}</Text>
        </View>
      </View>
    </View>
  </View>
);

// --- MAIN PDF DOCUMENT COMPONENT ---
const QcWashingFullReportPDF = ({ recordData, comparisonData = null, API_BASE_URL, checkpointDefinitions = [] }) => {
  
  if (!recordData) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>No report data available.</Text>
        </Page>
      </Document>
    );
  }

  // Detect which data structure we're dealing with
  const hasNewInspectionStructure = recordData.inspectionDetails?.checkpointInspectionData && 
                                   recordData.inspectionDetails.checkpointInspectionData.length > 0;

  console.log('🔍 PDF Structure Detection:', {
    hasNewInspectionStructure,
    checkpointInspectionDataLength: recordData.inspectionDetails?.checkpointInspectionData?.length || 0,
    checkedPointsLength: recordData.inspectionDetails?.checkedPoints?.length || 0,
    parametersLength: recordData.inspectionDetails?.parameters?.length || 0,
    machineProcessesLength: recordData.inspectionDetails?.machineProcesses?.length || 0,
    checkpointDefinitionsLength: checkpointDefinitions?.length || 0
  });

  let measurements = [];
  if (recordData.measurementDetails) {
    if (Array.isArray(recordData.measurementDetails)) {
      measurements = recordData.measurementDetails;
    } else if (recordData.measurementDetails.measurement && Array.isArray(recordData.measurementDetails.measurement)) {
      measurements = recordData.measurementDetails.measurement;
    }
  }

  const defectsByPc = recordData.defectDetails?.defectsByPc || [];
  const additionalImages = recordData.defectDetails?.additionalImages || [];
  const inspectionDetails = recordData.inspectionDetails || {};
  const measurementSizeSummary = recordData.measurementDetails?.measurementSizeSummary || [];

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
            <Text style={[
              styles.summaryCardValue,
              { fontSize: 16 },
              recordData.overallFinalResult === "Pass" ? styles.passGreen : styles.failRed
            ]}>
              Final Result: {recordData.overallFinalResult || "N/A"}
            </Text>
          </View>
        </View>

        <DefectAnalysisTable 
          defectsByPc={defectsByPc} 
          additionalImages={additionalImages}
          API_BASE_URL={API_BASE_URL}
        />

        {measurementSizeSummary.length > 0 && <SizewiseSummaryTable measurementSizeSummary={measurementSizeSummary} />}

        {comparisonData && <ComparisonSection recordData={recordData} comparisonData={comparisonData} />}
      </Page>

      {/* Inspection Details Page - ALWAYS SHOW IF ANY INSPECTION DATA EXISTS */}
      {(hasNewInspectionStructure || 
        inspectionDetails.checkedPoints?.length > 0 || 
        inspectionDetails.parameters?.length > 0 || 
        inspectionDetails.machineProcesses?.length > 0) && (
        <Page style={styles.page} orientation="landscape">
          <PdfHeader 
            orderNo={recordData.orderNo || "N/A"} 
            beforeAfterWash={recordData.before_after_wash || "Washing"}
          />
          <Text style={styles.pageHeader}>Inspection Details</Text>
          
          {/* Use new inspection component if new structure exists, otherwise use legacy */}
          {hasNewInspectionStructure ? (
            <NewInspectionDetailsSection 
              inspectionDetails={inspectionDetails} 
              API_BASE_URL={API_BASE_URL} 
              checkpointDefinitions={checkpointDefinitions}
            />
          ) : (
            <InspectionDetailsSection 
              inspectionDetails={inspectionDetails} 
              API_BASE_URL={API_BASE_URL} 
            />
          )}
        </Page>
      )}

      {/* Measurement Detail Pages */}
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

      {/* Before vs After Comparison Page */}
      {comparisonData && comparisonData.measurementDetails?.measurement && 
       recordData.measurementDetails?.measurement && (
        <Page style={styles.page} orientation="landscape">
          <PdfHeader 
            orderNo={recordData.orderNo || "N/A"} 
            beforeAfterWash={recordData.before_after_wash || "Washing"}
          />
          <Text style={styles.pageHeader}>Before vs After Wash Comparison</Text>
          <BeforeAfterComparisonSection recordData={recordData} comparisonData={comparisonData} API_BASE_URL={API_BASE_URL} />
        </Page>
      )}
    </Document>
  );
};

export default QcWashingFullReportPDF;
