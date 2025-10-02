import React from "react";
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
    borderColor: "#e5e7eb"
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
    marginBottom: 10
  },
  infoBlock: { 
    width: "16%",
    marginRight: 12,
    marginBottom: 5 
   },
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
    width: 100,
    height: 75,
    borderWidth: 0.5,
    borderColor: "#e5e7eb"
  },
  inspectionImage: {
    width: 120,
    height: 90,
    borderWidth: 0.5,
    borderColor: "#e5e7eb"
  },
  machineImage: {
    width: 180,
    height: 120,
    borderWidth: 0.5,
    borderColor: "#e5e7eb"
  }
});

// --- HELPER FUNCTIONS ---
const safeString = (value) => {
  if (value === null || value === undefined) return "N/A";
  const stringValue = String(value).trim();
  return stringValue || "N/A";
};

// Safe Text Component to prevent empty string errors
const SafeText = ({ children, style, ...props }) => {
  const content = children || 'N/A';
  const safeContent = typeof content === 'string' ? content.trim() || 'N/A' : content;
  return <Text style={style} {...props}>{safeContent}</Text>;
};

// --- FIXED IMAGE LOADING UTILITY ---
const loadImageAsBase64 = async (src, API_BASE_URL) => {
  let imageUrl = src;
  
  // Handle different image data formats
  if (typeof src === 'object' && src !== null) {
    if (src.originalUrl) {
      imageUrl = src.originalUrl;
    } else {
      imageUrl = src.url || src.src || src.path || JSON.stringify(src);
    }
  }
  
  if (typeof src === 'string' && src.startsWith('{')) {
    try {
      const parsed = JSON.parse(src);
      if (parsed.originalUrl) {
        imageUrl = parsed.originalUrl;
      } else {
        imageUrl = parsed.url || parsed.src || parsed.path || src;
      }
    } catch (e) {
      imageUrl = src;
    }
  }

  if (!imageUrl || typeof imageUrl !== 'string') {
    console.warn('Invalid image URL:', src);
    return null;
  }

  // If already base64, return as-is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  try {
    // Clean and normalize the URL
    let cleanUrl = imageUrl.trim();
    
    // Handle relative URLs
    if (cleanUrl.startsWith('/storage/') || cleanUrl.startsWith('/public/')) {
      cleanUrl = `${API_BASE_URL}${cleanUrl}`;
    }
    
    // Ensure proper URL encoding
    const urlParts = cleanUrl.split('/');
    const encodedParts = urlParts.map((part, index) => {
      if (index < 3) return part; // Don't encode protocol and domain
      return encodeURIComponent(decodeURIComponent(part));
    });
    cleanUrl = encodedParts.join('/');
    
    console.log('🖼️ Loading image:', cleanUrl);
    
    // Use the image proxy API with better error handling
    const proxyUrl = `${API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(cleanUrl)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      if (data.dataUrl && data.dataUrl.startsWith('data:')) {
        console.log('✅ Image loaded successfully:', cleanUrl);
        return data.dataUrl;
      } else {
        console.warn('❌ Invalid response format:', data);
        return null;
      }
    } else {
      console.warn('❌ HTTP error loading image:', cleanUrl, response.status, response.statusText);
      return null;
    }
    
  } catch (error) {
    console.warn('❌ Error loading image:', imageUrl, error.message);
    return null;
  }
};

// --- FIXED HELPER FUNCTION TO NORMALIZE IMAGE KEYS ---
const normalizeImageKey = (src) => {
  if (typeof src === 'string') {
    return src.trim();
  } else if (typeof src === 'object' && src !== null) {
    return src.originalUrl || src.url || src.src || src.path || JSON.stringify(src);
  }
  return JSON.stringify(src);
};

// --- REUSABLE PDF COMPONENTS ---
const PdfHeader = ({ orderNo, beforeAfterWash }) => (
  <View style={styles.docHeader} fixed>
    <View>
      <Text style={styles.docTitle}>
        {safeString(orderNo)} - {safeString(beforeAfterWash)} Washing Measurement Summary
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

const DefectAnalysisTable = ({ defectsByPc = [], additionalImages = [], SafeImage }) => {
  console.log('📝 DefectAnalysisTable received:', {
    defectsByPc: defectsByPc.length,
    additionalImages: additionalImages.length,
    firstDefectImages: defectsByPc[0]?.pcDefects?.[0]?.defectImages?.length || 0,
    sampleDefectImage: defectsByPc[0]?.pcDefects?.[0]?.defectImages?.[0],
    sampleAdditionalImage: additionalImages[0]
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
        <View key={pcIndex} style={{ marginBottom: 15, borderWidth: 1, borderColor: "#e5e7eb", padding: 10 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 8 }]}>
            PC {safeString(pcDefect.garmentNo || pcDefect.pcNumber)}
          </Text>
          
          {pcDefect.pcDefects && pcDefect.pcDefects.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableRow} fixed>
                <Text style={[styles.tableColHeader, styles.textLeft, { width: "20%" }]}>Defect Name</Text>
                <Text style={[styles.tableColHeader, { width: "10%" }]}>Count</Text>
                <Text style={[styles.tableColHeader, { width: "70%" }]}>Images</Text>
              </View>
              {pcDefect.pcDefects.map((defect, defectIndex) => (
                <View key={defectIndex} style={styles.tableRow}>
                  <Text style={[styles.tableCol, styles.textLeft, { width: "20%" }]}>
                    {safeString(defect.defectName)}
                  </Text>
                  <Text style={[styles.tableCol, { width: "10%" }]}>
                    {defect.defectQty || defect.defectCount || 1}
                  </Text>
                  <View style={[styles.tableCol, { width: "70%", flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", minHeight: 80 }]}>
                    {defect.defectImages && defect.defectImages.length > 0 ? (
                      defect.defectImages.map((img, imgIndex) => {
                        console.log(`🖼️ Processing defect image ${imgIndex + 1}:`, img);
                        
                        return (
                          <View key={imgIndex} style={{ margin: 3, alignItems: "center" }}>
                            <SafeImage
                              src={img}
                              style={styles.defectImage}
                              alt={`Defect ${defect.defectName} - Image ${imgIndex + 1}`}
                            />
                            <Text style={{ fontSize: 6, color: "#6b7280", textAlign: "center", marginTop: 2 }}>
                              {imgIndex + 1}
                            </Text>
                          </View>
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
        <View style={{ marginTop: 15, borderWidth: 1, borderColor: "#e5e7eb", padding: 10 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 8 }]}>
            Additional Images ({additionalImages.length})
          </Text>
          <Text style={{ fontSize: 6, color: "#6b7280", marginBottom: 5 }}>
            These are supplementary images captured during the inspection process.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
            {additionalImages.map((img, imgIndex) => {
              console.log(`🖼️ Processing additional image ${imgIndex + 1}:`, img);
              
              return (
                <View key={imgIndex} style={{ margin: 4, alignItems: "center" }}>
                  <SafeImage
                    src={img}
                    style={[styles.defectImage, { width: 120, height: 90 }]}
                    alt={`Additional Image ${imgIndex + 1}`}
                  />
                  <Text style={{ fontSize: 6, color: "#6b7280", textAlign: "center", marginTop: 2 }}>
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
        Size: {safeString(sizeData.size)} (K-Value: {safeString(sizeData.kvalue)}) - Detailed Measurements
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
const InspectionDetailsSection = ({ inspectionDetails, SafeImage }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Inspection Details</Text>
      
      {/* Legacy Checked Points */}
      {inspectionDetails.checkedPoints && inspectionDetails.checkedPoints.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10 }]}>Checked Points</Text>
          <View style={styles.table}>
            <View style={styles.tableRow} fixed>
              <Text style={[styles.tableColHeader, styles.textLeft, { width: "20%" }]}>Point Name</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Expected</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Actual</Text>
              <Text style={[styles.tableColHeader, { width: "10%" }]}>Status</Text>
              <Text style={[styles.tableColHeader, styles.textLeft, { width: "20%" }]}>Remark</Text>
              <Text style={[styles.tableColHeader, { width: "15%" }]}>Images</Text>
            </View>
            {inspectionDetails.checkedPoints.map((point, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.textLeft, { width: "20%" }]}>
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
                  {safeString(point.status || (point.decision === 'ok' ? 'Pass' : 'Fail'))}
                </Text>
                <Text style={[styles.tableCol, styles.textLeft, { width: "20%" }]}>
                  {safeString(point.remark)}
                </Text>
                <View style={[styles.tableCol, { width: "15%", flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", minHeight: 100 }]}>
                  {point.comparison && point.comparison.length > 0 ? (
                    point.comparison.map((img, imgIndex) => (
                      <View key={imgIndex} style={{ margin: 2, alignItems: "center" }}>
                        <SafeImage
                          src={img}
                          style={styles.inspectionImage}
                          alt={`${point.pointName} - Comparison Image ${imgIndex + 1}`}
                        />
                        <Text style={{ fontSize: 4, color: "#6b7280", textAlign: "center", marginTop: 1 }}>
                          {imgIndex + 1}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ fontSize: 6, color: "#6b7280" }}>No images</Text>
                  )}
                </View>
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
                      {safeString(machine.temperature.standardValue)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.temperature.actualValue)}
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
                      {safeString(machine.time.standardValue)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.time.actualValue)}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.time.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.time.status?.ok ? "OK" : "NO"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>min</Text>
                  </View>
                )}

                {/* Silicon Row */}
                {machine.silicon?.actualValue && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Silicon</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.silicon.standardValue)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.silicon.actualValue)}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.silicon.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.silicon.status?.ok ? "OK" : "NO"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>g</Text>
                  </View>
                )}

                {/* Softener Row */}
                {machine.softener?.actualValue && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Softener</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.softener.standardValue)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.softener.actualValue)}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.softener.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.softener.status?.ok ? "OK" : "NO"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>g</Text>
                  </View>
                )}
              </View>
              
              {/* Machine Image */}
              {machine.image && (
                <View style={styles.imageContainer}>
                  <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 3 }}>Machine Image:</Text>
                  <View style={{ alignItems: "center" }}>
                    <SafeImage
                      src={machine.image}
                      style={styles.machineImage}
                      alt={`Machine ${machine.machineType} Image`}
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// NEW INSPECTION DETAILS SECTION - FIXED
const NewInspectionDetailsSection = ({ inspectionDetails, checkpointDefinitions = [], SafeImage }) => {
  console.log('🔍 NewInspectionDetailsSection received:', {
    checkpointInspectionData: inspectionDetails.checkpointInspectionData?.length || 0,
    parameters: inspectionDetails.parameters?.length || 0,
    machineProcesses: inspectionDetails.machineProcesses?.length || 0,
    checkpointDefinitions: checkpointDefinitions?.length || 0,
    sampleCheckpointImages: inspectionDetails.checkpointInspectionData?.[0]?.comparisonImages?.length || 0,
    sampleSubPointImages: inspectionDetails.checkpointInspectionData?.[0]?.subPoints?.[0]?.comparisonImages?.length || 0
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
            const mainPointOption = mainPointDef?.options?.find(opt => opt.name === mainPoint.decision);
            const isMainFail = mainPointOption?.isFail;
            
            const mainPointStatus = {
              isPass: !isMainFail,
              status: isMainFail ? 'NO' : 'OK',
              color: isMainFail ? '#dc2626' : '#16a34a',
              backgroundColor: isMainFail ? '#fee2e2' : '#dcfce7'
            };

            return (
              <View key={mainPoint.id || index} style={{ marginBottom: 10, borderWidth: 1, borderColor: "#e5e7eb", padding: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                    {safeString(mainPoint.name || `Checkpoint ${index + 1}`)}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={[styles.passStatus, { backgroundColor: mainPointStatus.backgroundColor, color: mainPointStatus.color }]}>
                      {safeString(mainPoint.decision)}
                    </Text>
                    <Text style={[styles.passStatus, { backgroundColor: mainPointStatus.backgroundColor, color: mainPointStatus.color, fontWeight: 'bold', marginLeft: 8 }]}>
                      {mainPointStatus.status}
                    </Text>
                  </View>
                </View>

                {/* Main Point Remark and Images */}
                {(mainPoint.remark || (mainPoint.comparisonImages && mainPoint.comparisonImages.length > 0)) && (
                   <View style={{ marginTop: 4, marginBottom: 8, backgroundColor: "#f9fafb", padding: 4 }}>
                    {mainPoint.remark && mainPoint.remark.trim() && (
                      <View style={{ marginBottom: mainPoint.comparisonImages && mainPoint.comparisonImages.length > 0 ? 4 : 0 }}>
                        <Text style={{ fontSize: 7, color: "#6b7280" }}>Remark:</Text>
                        <Text style={{ fontSize: 8, color: "#374151" }}>{safeString(mainPoint.remark)}</Text>
                      </View>
                    )}
                    {mainPoint.comparisonImages && mainPoint.comparisonImages.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 6, color: "#6b7280", marginBottom: 2, width: "100%" }}>Images:</Text>
                        {mainPoint.comparisonImages.map((img, imgIndex) => (
                          <View key={imgIndex} style={{ margin: 3, alignItems: "center" }}>
                            <SafeImage
                              src={img}
                              style={styles.inspectionImage}
                              alt={`${mainPoint.name} - Image ${imgIndex + 1}`}
                            />
                            <Text style={{ fontSize: 5, color: "#6b7280", textAlign: "center", marginTop: 1 }}>
                              {imgIndex + 1}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Sub Points - FIXED */}
                {mainPoint.subPoints && mainPoint.subPoints.length > 0 && (
                  <View style={{ marginTop: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: "#e5e7eb" }}>
                    <Text style={{ fontSize: 8, fontWeight: "bold", marginBottom: 5, color: "#6b7280" }}>Sub-points:</Text>
                    {mainPoint.subPoints.map((subPoint, subIndex) => {
                      // Find the sub-point definition from checkpoint definitions
                      const subPointDef = mainPointDef?.subPoints?.find(sp => sp.id === subPoint.subPointId);
                      const subPointOption = subPointDef?.options?.find(opt => opt.name === subPoint.decision);
                      const isFail = subPointOption?.isFail === true;
                      
                      // CRITICAL FIX: Ensure all values are properly handled
                      const rawSubPointName = subPointDef?.name || subPoint.name || '';
                      const rawOptionName = subPoint.decision || '';
                      
                      // ENSURE NO EMPTY STRINGS - CRITICAL FIX
                      const displayName = rawSubPointName && rawSubPointName.toString().trim() 
                        ? rawSubPointName.toString().trim() 
                        : `Sub-point ${subIndex + 1}`;
                      
                      const displayOption = rawOptionName && rawOptionName.toString().trim() 
                        ? rawOptionName.toString().trim() 
                        : 'N/A';
                      
                      return (
                        <View key={subPoint.id || `subpoint-${subIndex}`} style={{ 
                          marginBottom: 6, 
                          backgroundColor: "#f9fafb", 
                          padding: 6, 
                          borderWidth: 1,
                          borderColor: "#e5e7eb"
                        }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            {/* Left side: Sub-point name and option */}
                            <View style={{ flexDirection: "row", alignItems: "center", width: "70%" }}>
                              <Text style={{ fontSize: 8, color: "#374151", fontWeight: "500", marginRight: 4 }}>
                                {subIndex + 1}.
                              </Text>
                              <Text style={[
                                styles.passStatus,
                                { 
                                  backgroundColor: isFail ? '#fee2e2' : '#dcfce7',
                                  color: isFail ? '#dc2626' : '#16a34a',
                                  fontSize: 7
                                }
                              ]}>
                                {displayName} - {displayOption}
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
                          
                          {/* Remark and Images on new line if they exist */}
                          {(subPoint.remark || (subPoint.comparisonImages && subPoint.comparisonImages.length > 0)) && (
                            <View style={{ marginTop: 4 }}>
                              {subPoint.remark && subPoint.remark.toString().trim() && (
                                <Text style={{ fontSize: 7, color: "#6b7280", fontStyle: "italic", marginBottom: subPoint.comparisonImages && subPoint.comparisonImages.length > 0 ? 2 : 0 }}>
                                  Remark: {safeString(subPoint.remark)}
                                </Text>
                              )}
                              {subPoint.comparisonImages && subPoint.comparisonImages.length > 0 && (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2, alignItems: 'flex-start' }}>
                                  {subPoint.comparisonImages.map((img, imgIndex) => (
                                    <View key={`img-${imgIndex}`} style={{ margin: 2, alignItems: "center" }}>
                                      <SafeImage
                                        src={img}
                                        style={[styles.inspectionImage, { width: 80, height: 60 }]}
                                        alt={`${displayName} - Image ${imgIndex + 1}`}
                                      />
                                      <Text style={{ fontSize: 4, color: "#6b7280", textAlign: "center", marginTop: 1 }}>
                                        {imgIndex + 1}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
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
                      {safeString(machine.temperature.standardValue)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.temperature.actualValue)}
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
                      {safeString(machine.time.standardValue)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.time.actualValue)}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.time.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.time.status?.ok ? "OK" : "NO"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>min</Text>
                  </View>
                )}

                {/* Silicon Row */}
                {machine.silicon?.actualValue && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Silicon</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.silicon.standardValue)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.silicon.actualValue)}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.silicon.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.silicon.status?.ok ? "OK" : "NO"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>g</Text>
                  </View>
                )}

                {/* Softener Row */}
                {machine.softener?.actualValue && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Softener</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.softener.standardValue)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.softener.actualValue)}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.softener.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.softener.status?.ok ? "OK" : "NO"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>g</Text>
                  </View>
                )}
              </View>
              
              {/* Machine Image */}
              {machine.image && (
                <View style={styles.imageContainer}>
                  <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 3 }}>Machine Image:</Text>
                  <View style={{ alignItems: "center" }}>
                    <SafeImage
                      src={machine.image}
                      style={styles.machineImage}
                      alt={`Machine ${machine.machineType} Image`}
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// BEFORE AFTER COMPARISON SECTION
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
          Before: {safeString(secondaryData.before_after_wash)} ({safeString(secondaryData.reportType)}) | After: {safeString(primaryData.before_after_wash)} ({safeString(primaryData.reportType)})
        </Text>
      </View>
      
      {afterMeasurements.map((afterSizeData, index) => {
        const beforeSizeData = beforeMeasurements.find(size => size.size === afterSizeData.size);
        if (!beforeSizeData) {
          return (
            <View key={index} style={{ marginBottom: 10, padding: 8, backgroundColor: "#fef3c7" }}>
              <Text style={{ fontSize: 8, color: "#d97706" }}>
                Size: {safeString(afterSizeData.size)} - No comparison data available
              </Text>
            </View>
          );
        }
        
        const afterMeasurementPoints = afterSizeData.pcs[0]?.measurementPoints || [];
        const maxPcs = Math.max(afterSizeData.pcs.length, beforeSizeData.pcs.length);
        
        return (
          <View key={index} style={{ marginBottom: 20 }} wrap={false}>
            <Text style={[styles.sectionTitle, { fontSize: 10 }]}>
              Size: {safeString(afterSizeData.size)} - Before vs After Comparison
            </Text>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 7, color: "#6b7280" }}>
                Before: {beforeSizeData.pcs.length} pcs | After: {afterSizeData.pcs.length} pcs | 
                K-Value Before: {safeString(beforeSizeData.kvalue)} | K-Value After: {safeString(afterSizeData.kvalue)}
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
                      {safeString(getToleranceAsFraction(afterPoint, 'minus'))}
                    </Text>
                    <Text style={[styles.tableCol, { width: "5%" }]}>
                      +{safeString(getToleranceAsFraction(afterPoint, 'plus'))}
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
            <View style={{ marginTop: 8, padding: 8, backgroundColor: "#f9fafb" }}>
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

// COMPARISON SECTION
const ComparisonSection = ({ recordData, comparisonData }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Comparison Analysis</Text>
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <View style={[styles.summaryCard, { width: "48%" }]}>
        <Text style={styles.summaryCardTitle}>Current Report</Text>
        <View style={{ marginTop: 5 }}>
          <Text style={{ fontSize: 8 }}>Pass Rate: {recordData.passRate || 0}%</Text>
          <Text style={{ fontSize: 8 }}>Total Pieces: {recordData.totalCheckedPcs || 0}</Text>
          <Text style={{ fontSize: 8 }}>Result: {safeString(recordData.overallFinalResult)}</Text>
        </View>
      </View>
      <View style={[styles.summaryCard, { width: "48%" }]}>
        <Text style={styles.summaryCardTitle}>Previous Report</Text>
        <View style={{ marginTop: 5 }}>
          <Text style={{ fontSize: 8 }}>Pass Rate: {comparisonData.passRate || 0}%</Text>
          <Text style={{ fontSize: 8 }}>Total Pieces: {comparisonData.totalCheckedPcs || 0}</Text>
          <Text style={{ fontSize: 8 }}>Result: {safeString(comparisonData.overallFinalResult)}</Text>
        </View>
      </View>
    </View>
  </View>
);

// --- MAIN PDF DOCUMENT COMPONENT ---
const QcWashingFullReportPDF = ({ recordData, comparisonData = null, API_BASE_URL, checkpointDefinitions = [], preloadedImages = {}, skipImageLoading = false }) => {
  
  // Helper for placeholder images
  const ImagePlaceholder = ({ style, text, subtext }) => (
    <View style={[style, { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', padding: 4, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed' }]}>
      <Text style={{ fontSize: 6, color: '#374151', textAlign: 'center', fontWeight: 'bold' }}>📷</Text>
      <Text style={{ fontSize: 5, color: '#6b7280', textAlign: 'center', marginTop: 1 }}>{text || 'Image'}</Text>
      {subtext && <Text style={{ fontSize: 4, color: '#9ca3af', textAlign: 'center', marginTop: 1 }}>{subtext}</Text>}
    </View>
  );

  // FIXED SafeImage component with better key matching
  const SafeImage = ({ src, style, alt }) => {
    console.log('🔍 SafeImage called with src:', src);
    
    // Generate consistent keys for lookup using the same logic as storage
    const generateImageKeys = (src) => {
      const keys = [];
      
      if (typeof src === 'string') {
        keys.push(src.trim());
        keys.push(src); // Also try untrimmed version
      } else if (typeof src === 'object' && src !== null) {
        // Try all possible properties in the same order as storage
        if (src.originalUrl) keys.push(src.originalUrl);
        if (src.url) keys.push(src.url);
        if (src.src) keys.push(src.src);
        if (src.path) keys.push(src.path);
        // Also add the stringified version
        keys.push(JSON.stringify(src));
      }
      
      return [...new Set(keys)]; // Remove duplicates
    };

    const possibleKeys = generateImageKeys(src);
    console.log('🔍 Trying keys:', possibleKeys);
    console.log('🔍 Available preloaded keys:', Object.keys(preloadedImages));

    // Try to find image with any of the possible keys
    let imageSrc = null;
    let matchedKey = null;
    
    for (const key of possibleKeys) {
      if (preloadedImages[key]) {
        imageSrc = preloadedImages[key];
        matchedKey = key;
        break;
      }
    }

    if (!imageSrc) {
      console.warn('🔍 Image not found in preloadedImages. Tried keys:', possibleKeys);
      const filename = possibleKeys[0] ? possibleKeys[0].split('/').pop() || 'Image' : 'Image';
      return <ImagePlaceholder style={style} text={filename} subtext="Not Found" />;
    }

    console.log('✅ Found image for key:', matchedKey);
    
    // Validate base64 format
    if (!imageSrc.startsWith('data:')) {
      console.warn('⚠️ Invalid image format, expected base64 data URL');
      return <ImagePlaceholder style={style} text="Invalid Format" subtext="Bad Data" />;
    }

    try {
      return <Image src={imageSrc} style={style} />;
    } catch (error) {
      console.error('❌ Error rendering image:', error);
      return <ImagePlaceholder style={style} text="Render Error" subtext={error.message} />;
    }
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
    const isPass = !selectedOption.isFail;
    return { isPass, status: isPass ? 'OK' : 'NO', color: isPass ? '#16a34a' : '#dc2626', backgroundColor: isPass ? '#dcfce7' : '#fee2e2' };
  };
  
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
              Final Result: {safeString(recordData.overallFinalResult)}
            </Text>
          </View>
        </View>
        <DefectAnalysisTable 
          defectsByPc={defectsByPc} 
          additionalImages={additionalImages}
          SafeImage={SafeImage}
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
              checkpointDefinitions={checkpointDefinitions}
              SafeImage={SafeImage}
            />
          ) : (
            <InspectionDetailsSection
              inspectionDetails={inspectionDetails}
              SafeImage={SafeImage}
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
            Detailed Measurements - Size: {safeString(sizeData.size)}
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

// Wrapper component that optionally preloads images
const QcWashingFullReportPDFWrapper = ({ recordData, comparisonData = null, API_BASE_URL, checkpointDefinitions = [], skipImageLoading = false }) => {
  // If skipImageLoading is true, render PDF directly without wrapper
  if (skipImageLoading) {
    return (
      <QcWashingFullReportPDF 
        recordData={recordData}
        comparisonData={comparisonData}
        API_BASE_URL={API_BASE_URL}
        checkpointDefinitions={checkpointDefinitions}
        preloadedImages={{}}
        skipImageLoading={true}
      />
    );
  }

  const [preloadedImages, setPreloadedImages] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const preloadAllImages = async () => {
      try {
        const imageCollection = new Map();
        
        // FIXED: Consistent helper function to add images using the same key logic
        const addImageToCollection = (img, context = '') => {
          if (!img) return;
          
          console.log(`📝 Processing image from ${context}:`, img);
          
          // Use the same key normalization logic as SafeImage
          let storageKey = normalizeImageKey(img);
          
          if (storageKey) {
            imageCollection.set(storageKey, storageKey); // Store the key as both key and value for now
            console.log(`📝 Added to collection - Key: "${storageKey}"`);
          } else {
            console.warn('⚠️ Could not extract key from image:', img);
          }
        };

        // Collect defect images
        if (recordData.defectDetails?.defectsByPc) {
          recordData.defectDetails.defectsByPc.forEach((pc, pcIndex) => {
            if (pc.pcDefects) {
              pc.pcDefects.forEach((defect, defectIndex) => {
                if (defect.defectImages && Array.isArray(defect.defectImages)) {
                  defect.defectImages.forEach((img, imgIndex) => {
                    addImageToCollection(img, `defect-pc${pcIndex}-defect${defectIndex}-img${imgIndex}`);
                  });
                }
              });
            }
          });
        }

        // Collect additional images
        if (recordData.defectDetails?.additionalImages && Array.isArray(recordData.defectDetails.additionalImages)) {
          recordData.defectDetails.additionalImages.forEach((img, index) => {
            addImageToCollection(img, `additional-${index}`);
          });
        }

        // Collect new inspection images
        if (recordData.inspectionDetails?.checkpointInspectionData) {
          recordData.inspectionDetails.checkpointInspectionData.forEach((checkpoint, checkIndex) => {
            if (checkpoint.comparisonImages && Array.isArray(checkpoint.comparisonImages)) {
              checkpoint.comparisonImages.forEach((img, imgIndex) => {
                addImageToCollection(img, `checkpoint${checkIndex}-main-img${imgIndex}`);
              });
            }
            if (checkpoint.subPoints) {
              checkpoint.subPoints.forEach((subPoint, subIndex) => {
                if (subPoint.comparisonImages && Array.isArray(subPoint.comparisonImages)) {
                  subPoint.comparisonImages.forEach((img, imgIndex) => {
                    addImageToCollection(img, `checkpoint${checkIndex}-sub${subIndex}-img${imgIndex}`);
                  });
                }
              });
            }
          });
        }

        // Collect legacy inspection images
        if (recordData.inspectionDetails?.checkedPoints) {
          recordData.inspectionDetails.checkedPoints.forEach((point, pointIndex) => {
            if (point.comparison && Array.isArray(point.comparison)) {
              point.comparison.forEach((img, imgIndex) => {
                addImageToCollection(img, `legacy-point${pointIndex}-img${imgIndex}`);
              });
            }
          });
        }

        // Collect machine images
        if (recordData.inspectionDetails?.machineProcesses) {
          recordData.inspectionDetails.machineProcesses.forEach((machine, machineIndex) => {
            if (machine.image) {
              addImageToCollection(machine.image, `machine${machineIndex}`);
            }
          });
        }

        console.log(`🖼️ Total unique images to load: ${imageCollection.size}`);
        
        if (imageCollection.size === 0) {
          console.log('No images found, proceeding without loading');
          if (isMounted) {
            setPreloadedImages({});
            setLoading(false);
          }
          return;
        }

        // FIXED: Load images with better error handling and validation
        const imageMap = {};
        const loadPromises = Array.from(imageCollection.entries()).map(async ([key, url], index) => {
          try {
            // Add progressive delay to avoid overwhelming server
            await new Promise(resolve => setTimeout(resolve, index * 100));
            
            console.log(`🔄 Loading image ${index + 1}/${imageCollection.size}: ${key}`);
            
            const base64 = await loadImageAsBase64(url, API_BASE_URL);
            
            if (base64 && base64.startsWith('data:')) {
              imageMap[key] = base64;
              console.log(`✅ Successfully loaded: ${key}`);
              return { success: true, key };
            } else {
              console.warn(`❌ Invalid base64 data for: ${key}`);
              return { success: false, key, error: 'Invalid base64 data' };
            }
          } catch (error) {
            console.error(`❌ Failed to load ${key}:`, error.message);
            return { success: false, key, error: error.message };
          }
        });

        const results = await Promise.allSettled(loadPromises);
        
        let successCount = 0;
        let failCount = 0;
        
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++;
          } else {
            failCount++;
          }
        });

        console.log(`🖼️ Image loading complete: ${successCount} success, ${failCount} failed`);
        console.log('🔍 Final imageMap keys:', Object.keys(imageMap));

        if (isMounted) {
          setPreloadedImages(imageMap);
          setLoading(false);
          console.log('✅ Images stored in state, rendering PDF');
        }

      } catch (error) {
        console.error('❌ Critical error in preloadAllImages:', error);
        if (isMounted) {
          setError(error.message);
          setPreloadedImages({});
          setLoading(false);
        }
      }
    };

    // Set up timeout with cleanup
    const timeoutId = setTimeout(() => {
      console.warn('Image loading timed out after 15 seconds, proceeding without images');
      if (isMounted) {
        setLoading(false);
      }
    }, 15000);

    // Start loading images
    preloadAllImages();

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [recordData, API_BASE_URL]);

  // FIXED LOADING SCREEN - Ensure no empty strings
  if (loading) {
    return (
      <Document>
        <Page style={styles.page}>
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: 20
          }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: 'bold',
              marginBottom: 10,
              textAlign: 'center'
            }}>
              Loading images...
            </Text>
            <Text style={{ 
              fontSize: 12, 
              textAlign: 'center',
              color: '#6b7280'
            }}>
              Please wait while we prepare your report
            </Text>
          </View>
        </Page>
      </Document>
    );
  }

  // Show error state if there was an error
  if (error) {
    console.log('🔄 Error occurred, falling back to PDF without images');
    return (
      <QcWashingFullReportPDF 
        recordData={recordData}
        comparisonData={comparisonData}
        API_BASE_URL={API_BASE_URL}
        checkpointDefinitions={checkpointDefinitions}
        preloadedImages={{}}
        skipImageLoading={true}
      />
    );
  }

  // CRITICAL: Log the transition
  console.log('🎉 Rendering final PDF with preloaded images:', Object.keys(preloadedImages).length);

  return (
    <QcWashingFullReportPDF 
      recordData={recordData}
      comparisonData={comparisonData}
      API_BASE_URL={API_BASE_URL}
      checkpointDefinitions={checkpointDefinitions}
      preloadedImages={preloadedImages}
      skipImageLoading={false}
    />
  );
};

// SIMPLE PDF COMPONENT WITHOUT IMAGE LOADING (for your download function)
const QcWashingSimplePDF = ({ recordData, comparisonData = null, API_BASE_URL, checkpointDefinitions = [] }) => {
  return (
    <QcWashingFullReportPDF 
      recordData={recordData}
      comparisonData={comparisonData}
      API_BASE_URL={API_BASE_URL}
      checkpointDefinitions={checkpointDefinitions}
      preloadedImages={{}}
      skipImageLoading={true}
    />
  );
};

// Export both components for different use cases
export default QcWashingFullReportPDFWrapper;
export { QcWashingFullReportPDF, QcWashingFullReportPDFWrapper, QcWashingSimplePDF };


