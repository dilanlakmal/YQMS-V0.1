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
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? "N/A" : trimmed;
  }
  if (typeof value === 'number') return value.toString();
  const stringValue = String(value).trim();
  return stringValue === '' ? "N/A" : stringValue;
};

// Safe Text Component to prevent empty string errors
const SafeText = ({ children, style, ...props }) => {
  // Handle all falsy values and empty strings
  let content = children;
  
  if (content === null || content === undefined || content === '') {
    content = 'N/A';
  } else if (typeof content === 'string') {
    content = content.trim();
    if (content === '') {
      content = 'N/A';
    }
  } else if (typeof content === 'number') {
    content = content.toString();
  } else {
    content = String(content);
  }
  
  return <Text style={style} {...props}>{content}</Text>;
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

const OrderInfoSection = ({ recordData, inspectorDetails, SafeImage }) => {
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Order Information</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {/* Left side - Order Information */}
        <View style={{ width: "80%" }}>
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
        
        {/* Right side - Inspector Details */}
        <View style={{ width: "15%", padding: 4, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
          <Text style={[styles.sectionTitle, { fontSize: 8, marginBottom: 4, textAlign: "center" }]}>Inspector</Text>
          
          {inspectorDetails && Object.keys(inspectorDetails).length > 0 ? (
            <View style={{ alignItems: "center" }}>
              {/* Inspector Photo */}
              {inspectorDetails.face_photo ? (
                <View style={{ marginBottom: 4, alignItems: "center" }}>
                  <SafeImage
                    src={inspectorDetails.face_photo}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: "#3b82f6"
                    }}
                    alt="Inspector Photo"
                  />
                </View>
              ) : (
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#e5e7eb",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 4,
                  borderWidth: 1,
                  borderColor: "#9ca3af"
                }}>
                  <Text style={{ fontSize: 14, color: "#6b7280" }}>👤</Text>
                </View>
              )}
              
              {/* Inspector ID and Name */}
              <View style={{ marginBottom: 2, alignItems: "center" }}>
                <Text style={{ fontSize: 6, color: "#6b7280", textAlign: "center" }}>ID:</Text>
                <Text style={{ fontSize: 7, fontWeight: "bold", textAlign: "center" }}>
                  {inspectorDetails.emp_id || inspectorDetails.id || inspectorDetails.userId || 'N/A'}
                </Text>
              </View>
              
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 6, color: "#6b7280", textAlign: "center" }}>Name:</Text>
                <Text style={{ fontSize: 7, fontWeight: "bold", textAlign: "center" }}>
                  {inspectorDetails.eng_name || inspectorDetails.name || inspectorDetails.username || 'N/A'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: "center", justifyContent: "center", height: 60 }}>
              <Text style={{ fontSize: 6, color: "#6b7280", textAlign: "center" }}>
                No inspector data
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

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
                <Text style={[styles.tableColHeader, styles.textLeft, { width: "25%" }]}>Defect Name</Text>
                <Text style={[styles.tableColHeader, { width: "10%" }]}>Count</Text>
                <Text style={[styles.tableColHeader, { width: "65%" }]}>Images</Text>
              </View>
              
              {pcDefect.pcDefects.map((defect, defectIndex) => (
                <View key={defectIndex} style={styles.tableRow}>
                  <Text style={[styles.tableCol, styles.textLeft, { width: "25%" }]}>
                    {safeString(defect.defectName)}
                  </Text>
                  <Text style={[styles.tableCol, { width: "10%" }]}>
                    {defect.defectQty || defect.defectCount || 1}
                  </Text>
                  <View style={[styles.tableCol, { width: "65%", flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", minHeight: 80 }]}>
                    {(() => {
                      // FIXED: Check multiple possible property names for images
                      const capturedImages = defect.defectImages || defect.capturedImages || [];
                      const uploadedImages = defect.uploadedImages || defect.uploaded_images || defect.images || [];
                      
                      // FIXED: Also check if defectImages contains both types
                      const allImages = [...capturedImages, ...uploadedImages];
                      
                      
                      if (allImages.length === 0) {
                        return <Text style={{ fontSize: 6, color: "#6b7280" }}>No images</Text>;
                      }
                      
                      return (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
                          {allImages.slice(0, 6).map((img, imgIndex) => {
                            const isCaptured = imgIndex < capturedImages.length;
                            const displayIndex = isCaptured ? imgIndex + 1 : imgIndex - capturedImages.length + 1;
                            
                            
                            return (
                              <View key={`image-${imgIndex}`} style={{ margin: 2, alignItems: "center" }}>
                                <SafeImage
                                  src={img} // Use the larger inspectionImage style
                                  style={styles.inspectionImage}
                                  alt={`Defect ${defect.defectName} - ${isCaptured ? 'Captured' : 'Uploaded'} Image ${displayIndex}`}
                                />
                                <Text style={{ 
                                  fontSize: 5, 
                                  color: isCaptured ? "#16a34a" : "#2563eb", 
                                  textAlign: "center", 
                                  marginTop: 1, 
                                  fontWeight: "bold" 
                                }}>
                                  {isCaptured ? `C${displayIndex}` : `U${displayIndex}`}
                                </Text>
                              </View>
                            );
                          })}
                          {allImages.length > 6 && (
                            <Text style={{ fontSize: 6, color: "#6b7280", alignSelf: "center", marginLeft: 4 }}>
                              +{allImages.length - 6} more
                            </Text>
                          )}
                        </View>
                      );
                    })()}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 8, color: "#6b7280" }}>No defects found</Text>
          )}
        </View>
      ))}
      
      {/* Additional Images Section */}
      {additionalImages && additionalImages.length > 0 && (
        <View style={{ marginTop: 15, borderWidth: 1, borderColor: "#e5e7eb", padding: 10 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 8 }]}>
            Additional Images ({additionalImages.length})
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
            {additionalImages.slice(0, 8).map((img, imgIndex) => (
              <View key={imgIndex} style={{ margin: 3, alignItems: "center" }}>
                <SafeImage
                  src={img} // Use the larger inspectionImage style
                  style={styles.inspectionImage}
                  alt={`Additional Image ${imgIndex + 1}`}
                />
                <Text style={{ fontSize: 5, color: "#6b7280", textAlign: "center", marginTop: 1 }}>
                  Add {imgIndex + 1}
                </Text>
              </View>
            ))}
            {additionalImages.length > 8 && (
              <Text style={{ fontSize: 6, color: "#6b7280", alignSelf: "center" }}>
                +{additionalImages.length - 8} more
              </Text>
            )}
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
                  {(() => {
                    const capturedImages = point.comparison || [];
                    const uploadedImages = point.uploadedImages || [];
                    const hasImages = capturedImages.length > 0 || uploadedImages.length > 0;
                    
                    if (!hasImages) {
                      return <Text style={{ fontSize: 6, color: "#6b7280" }}>No images</Text>;
                    }
                    
                    return (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
                        {/* Captured Images */}
                        {capturedImages.map((img, imgIndex) => (
                          <View key={`captured-${imgIndex}`} style={{ margin: 2, alignItems: "center" }}>
                            <SafeImage
                              src={img}
                              style={styles.inspectionImage}
                              alt={`${point.pointName} - Captured Image ${imgIndex + 1}`}
                            />
                            <Text style={{ fontSize: 4, color: "#16a34a", textAlign: "center", marginTop: 1, fontWeight: "bold" }}>
                              C{imgIndex + 1}
                            </Text>
                          </View>
                        ))}
                        {/* Uploaded Images */}
                        {uploadedImages.map((img, imgIndex) => (
                          <View key={`uploaded-${imgIndex}`} style={{ margin: 2, alignItems: "center" }}>
                            <SafeImage
                              src={img}
                              style={styles.inspectionImage}
                              alt={`${point.pointName} - Uploaded Image ${imgIndex + 1}`}
                            />
                            <Text style={{ fontSize: 4, color: "#2563eb", textAlign: "center", marginTop: 1, fontWeight: "bold" }}>
                              U{imgIndex + 1}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  })()}
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

                {/* Time Hot Row */}
                {machine.timeHot && (machine.timeHot.actualValue !== undefined && machine.timeHot.actualValue !== null && machine.timeHot.actualValue !== "") && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Time Hot</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.timeHot.standardValue)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.timeHot.actualValue)}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.timeHot.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.timeHot.status?.ok ? "OK" : "NO"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>min</Text>
                  </View>
                )}

                {/* Time Cool Row */}
                {machine.timeCool && (machine.timeCool.actualValue !== undefined && machine.timeCool.actualValue !== null && machine.timeCool.actualValue !== "") && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Time Cool</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.timeCool.standardValue)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.timeCool.actualValue)}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.timeCool.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.timeCool.status?.ok ? "OK" : "NO"}
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
                {(() => {
                  const capturedImages = mainPoint.comparisonImages || [];
                  const uploadedImages = mainPoint.uploadedImages || [];
                  const hasImages = capturedImages.length > 0 || uploadedImages.length > 0;
                  
                  
                  
                  return (mainPoint.remark || hasImages) && (
                    <View style={{ marginTop: 4, marginBottom: 8, backgroundColor: "#f9fafb", padding: 4 }}>
                      {mainPoint.remark && mainPoint.remark.trim() && (
                        <View style={{ marginBottom: hasImages ? 4 : 0 }}>
                          <Text style={{ fontSize: 7, color: "#6b7280" }}>Remark:</Text>
                          <Text style={{ fontSize: 8, color: "#374151" }}>{safeString(mainPoint.remark)}</Text>
                        </View>
                      )}
                      {hasImages && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                          <Text style={{ fontSize: 6, color: "#6b7280", marginBottom: 2, width: "100%" }}>Images:</Text>
                          {capturedImages.map((img, imgIndex) => (
                            <View key={`captured-${imgIndex}`} style={{ margin: 3, alignItems: "center" }}>
                              <SafeImage
                                src={img}
                                style={styles.inspectionImage}
                                alt={`${mainPoint.name} - Captured Image ${imgIndex + 1}`}
                              />
                              <Text style={{ fontSize: 5, color: "#6b7280", textAlign: "center", marginTop: 1 }}>
                                C{imgIndex + 1}
                              </Text>
                            </View>
                          ))}
                          {uploadedImages.map((img, imgIndex) => (
                            <View key={`uploaded-${imgIndex}`} style={{ margin: 3, alignItems: "center" }}>
                              <SafeImage
                                src={img}
                                style={styles.inspectionImage}
                                alt={`${mainPoint.name} - Uploaded Image ${imgIndex + 1}`}
                              />
                              <Text style={{ fontSize: 5, color: "#6b7280", textAlign: "center", marginTop: 1 }}>
                                U{imgIndex + 1}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })()}

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
                      const displayName = (rawSubPointName || '').toString().trim() || `Sub-point ${subIndex + 1}`;
                      const displayOption = (rawOptionName || '').toString().trim() || 'N/A';
                      
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
                             <SafeText style={[
                                styles.passStatus,
                                { 
                                  backgroundColor: isFail ? '#fee2e2' : '#dcfce7',
                                  color: isFail ? '#dc2626' : '#16a34a',
                                  fontSize: 7
                                }
                              ]}>
                                {displayName} - {displayOption}
                              </SafeText>
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
                                <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: subPoint.comparisonImages && subPoint.comparisonImages.length > 0 ? 2 : 0 }}>
                                  Remark: {safeString(subPoint.remark)}
                                </Text>
                              )}
                              {(() => {
                                const capturedImages = subPoint.comparisonImages || [];
                                const uploadedImages = subPoint.uploadedImages || [];
                                const hasImages = capturedImages.length > 0 || uploadedImages.length > 0;
                                
                                
                                
                                return hasImages && (
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2, alignItems: 'flex-start' }}>
                                    {capturedImages.map((img, imgIndex) => (
                                      <View key={`captured-${imgIndex}`} style={{ margin: 2, alignItems: "center" }}>
                                        <SafeImage
                                          src={img}
                                          style={[styles.inspectionImage, { width: 80, height: 60 }]}
                                          alt={`${displayName} - Captured Image ${imgIndex + 1}`}
                                        />
                                        <Text style={{ fontSize: 4, color: "#6b7280", textAlign: "center", marginTop: 1 }}>
                                          C{imgIndex + 1}
                                        </Text>
                                      </View>
                                    ))}
                                    {uploadedImages.map((img, imgIndex) => (
                                      <View key={`uploaded-${imgIndex}`} style={{ margin: 2, alignItems: "center" }}>
                                        <SafeImage
                                          src={img}
                                          style={[styles.inspectionImage, { width: 80, height: 60 }]}
                                          alt={`${displayName} - Uploaded Image ${imgIndex + 1}`}
                                        />
                                        <Text style={{ fontSize: 4, color: "#6b7280", textAlign: "center", marginTop: 1 }}>
                                          U{imgIndex + 1}
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                );
                              })()}
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

                {/* Time Hot Row */}
                {machine.timeHot && (machine.timeHot.actualValue !== undefined && machine.timeHot.actualValue !== null && machine.timeHot.actualValue !== "") && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Time Hot</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.timeHot.standardValue)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.timeHot.actualValue)}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.timeHot.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.timeHot.status?.ok ? "OK" : "NO"}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>min</Text>
                  </View>
                )}

                {/* Time Cool Row */}
                {machine.timeCool && (machine.timeCool.actualValue !== undefined && machine.timeCool.actualValue !== null && machine.timeCool.actualValue !== "") && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCol, { width: "20%" }]}>Time Cool</Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.timeCool.standardValue)}
                    </Text>
                    <Text style={[styles.tableCol, { width: "20%" }]}>
                      {safeString(machine.timeCool.actualValue)}
                    </Text>
                    <Text style={[
                      styles.tableCol, 
                      { width: "20%" },
                      machine.timeCool.status?.ok ? styles.passGreen : styles.failRed
                    ]}>
                      {machine.timeCool.status?.ok ? "OK" : "NO"}
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
const QcWashingFullReportPDF = ({ recordData, comparisonData = null, API_BASE_URL, checkpointDefinitions = [], inspectorDetails = null, preloadedImages = {}  }) => {
  const [fetchedInspectorDetails, setFetchedInspectorDetails] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchInspectorDetails = async () => {
      if (inspectorDetails || !recordData?.userId) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${recordData.userId}`);
        if (response.ok) setFetchedInspectorDetails(await response.json());
      } catch (error) {
        console.error('Error fetching inspector details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInspectorDetails();
  }, [recordData?.userId, API_BASE_URL, inspectorDetails]);
  
  const finalInspectorDetails = inspectorDetails || fetchedInspectorDetails;
  
  // Helper for placeholder images
  const ImagePlaceholder = ({ style, text, subtext }) => (
    <View style={[style, { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', padding: 4, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed' }]}>
      <Text style={{ fontSize: 6, color: '#374151', textAlign: 'center', fontWeight: 'bold' }}>📷</Text>
      <Text style={{ fontSize: 5, color: '#6b7280', textAlign: 'center', marginTop: 1 }}>{text || 'Image'}</Text>
      {subtext && <Text style={{ fontSize: 4, color: '#9ca3af', textAlign: 'center', marginTop: 1 }}>{subtext}</Text>}
    </View>
  );

  // Updated SafeImage component
const SafeImage = ({ src, style, alt }) => {
  const getImageSource = (imgSrc) => {
    if (!imgSrc) {
      console.log('SafeImage: No source provided');
      return null;
    }
    
    let url = '';
    if (typeof imgSrc === 'string') {
      url = imgSrc.trim();
    } else if (typeof imgSrc === 'object' && imgSrc !== null) {
      url = imgSrc.originalUrl || imgSrc.url || imgSrc.src || imgSrc.path || '';
    }

    // If already base64, return as-is
    if (url.startsWith('data:')) {
      return url;
    }
    if (!url) {
      return null;
    }


    // Check if we have preloaded base64 data with exact match
    if (preloadedImages && preloadedImages[url]) {
      return preloadedImages[url];
    }

    // Try different URL variations
    const urlVariations = [
      url,
      url.replace('./public/', '/'),
      url.replace('./public', ''),
      url.startsWith('/') ? url.substring(1) : '/' + url,
      url.replace(/^\/+/, '/'),
      // Add more variations for defect images
      url.includes('/qc_washing_images/') ? url : '/storage/qc_washing_images/defect/' + url.split('/').pop(),
      url.includes('/storage/') ? url : '/storage/' + url.split('/').pop(),
    ];

    for (const variation of urlVariations) {
      if (preloadedImages[variation]) {
        return preloadedImages[variation];
      }
    }

    return null;
  };

  const imageUrl = getImageSource(src);

  if (!imageUrl) {
    return <ImagePlaceholder style={style} text="No Image" subtext={alt || 'Missing'} />;
  }

  try {
    return <Image src={imageUrl} style={style} />;
  } catch (error) {
    return <ImagePlaceholder style={style} text="Load Error" subtext={error.message} />;
  }
};


if (loading) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text>Loading report...</Text>
      </Page>
    </Document>
  );
}

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
        <OrderInfoSection recordData={recordData} inspectorDetails={finalInspectorDetails} SafeImage={SafeImage} />
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

// Export both components for different use cases
export default QcWashingFullReportPDF;
export { QcWashingFullReportPDF };
