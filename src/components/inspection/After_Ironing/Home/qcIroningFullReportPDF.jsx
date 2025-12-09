import React, { Fragment } from "react";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
} from "@react-pdf/renderer";
import { getToleranceAsFraction, decimalToFraction } from "./fractionConverter";
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

// --- REUSABLE PDF COMPONENTS ---
const PdfHeader = ({ orderNo, beforeAfterWash }) => (
  <View style={styles.docHeader} fixed>
    <View>
      <Text style={styles.docTitle}>
        {safeString(orderNo)} - After Ironing Measurement Summary
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
              <Text style={styles.infoLabel}>Ironing Type:</Text>
              <Text style={styles.infoValue}>{safeString(recordData.ironingType || recordData.washType)}</Text>
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
              <Text style={styles.infoLabel}>Ironing Qty:</Text>
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
                      const capturedImages = defect.defectImages || defect.capturedImages || [];
                      const uploadedImages = defect.uploadedImages || defect.uploaded_images || defect.images || [];
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
                                  src={img}
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
                  src={img}
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

// NEW INSPECTION DETAILS SECTION
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

                {/* Sub Points */}
                {mainPoint.subPoints && mainPoint.subPoints.length > 0 && (
                  <View style={{ marginTop: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: "#e5e7eb" }}>
                    <Text style={{ fontSize: 8, fontWeight: "bold", marginBottom: 5, color: "#6b7280" }}>Sub-points:</Text>
                    {mainPoint.subPoints.map((subPoint, subIndex) => {
                      // Find the sub-point definition from checkpoint definitions
                      const subPointDef = mainPointDef?.subPoints?.find(sp => sp.id === subPoint.subPointId);
                      const subPointOption = subPointDef?.options?.find(opt => opt.name === subPoint.decision);
                      const isFail = subPointOption?.isFail === true;
                      
                      const rawSubPointName = subPointDef?.name || subPoint.name || '';
                      const rawOptionName = subPoint.decision || '';
                      
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

// Washing Measurement Comparison Section - Separate table per size
const WashingComparisonSection = ({ washingData, afterIroningData }) => {
  if (!washingData?.afterWash?.length && !afterIroningData?.length) {
    return (
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>Measurement Comparison</Text>
        <Text style={{ textAlign: "center", color: "#6b7280", fontSize: 9, padding: 10 }}>
          No measurement comparison data available.
        </Text>
      </View>
    );
  }

  const sizeMap = new Map();
  
  const extractData = (data, stage) => {
    if (!data || !Array.isArray(data)) return;
    data.forEach(measurement => {
      const size = measurement.size;
      if (!sizeMap.has(size)) {
        sizeMap.set(size, { points: new Map(), pieces: new Set() });
      }
      const sizeData = sizeMap.get(size);
      
      measurement.pcs?.forEach((pc, pcIndex) => {
        const pcNumber = pc.pcNumber || (pcIndex + 1);
        sizeData.pieces.add(pcNumber);
        
        pc.measurementPoints?.forEach(point => {
          const pointName = point.pointName;
          if (!sizeData.points.has(pointName)) {
            sizeData.points.set(pointName, {
              pointName,
              specs: point.specs,
              toleranceMinus: point.toleranceMinus,
              tolerancePlus: point.tolerancePlus,
              pieces: new Map()
            });
          }
          const pointData = sizeData.points.get(pointName);
          if (!pointData.pieces.has(pcNumber)) {
            pointData.pieces.set(pcNumber, { afterWash: null, afterIroning: null });
          }
          pointData.pieces.get(pcNumber)[stage] = {
            fraction: point.measured_value_fraction || '0',
            result: point.result
          };
        });
      });
    });
  };
  
  if (washingData?.afterWash?.length) extractData(washingData.afterWash, 'afterWash');
  if (afterIroningData?.length) extractData(afterIroningData, 'afterIroning');
  
  const hasAfterWash = washingData?.afterWash?.length > 0;
  const hasAfterIroning = afterIroningData?.length > 0;
  const stageCount = (hasAfterWash ? 1 : 0) + (hasAfterIroning ? 1 : 0);

  return (
    <Fragment>
      {Array.from(sizeMap.entries()).map(([size, sizeData], sizeIndex) => {
        const piecesArr = Array.from(sizeData.pieces).sort((a, b) => a - b);
        const pointsArr = Array.from(sizeData.points.values());
        const stageWidth = stageCount > 0 ? Math.floor(60 / stageCount) : 30;
        
        return (
          <View key={sizeIndex} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Measurement Comparison - Size: {size}</Text>
            <View style={styles.table}>
              {/* Header Row 1: Point, Tol+, Tol-, Spec, Stage Headers */}
              <View style={styles.tableRow} fixed>
                <Text style={[styles.tableColHeader, styles.textLeft, { width: "20%" }]}>Point</Text>
                <Text style={[styles.tableColHeader, { width: "6%" }]}>Tol+</Text>
                <Text style={[styles.tableColHeader, { width: "6%" }]}>Tol-</Text>
                <Text style={[styles.tableColHeader, { width: "8%" }]}>Spec</Text>
                {hasAfterWash && <Text style={[styles.tableColHeader, { width: `${stageWidth}%`, backgroundColor: "#dcfce7", color: "#166534" }]}>After Wash</Text>}
                {hasAfterIroning && <Text style={[styles.tableColHeader, { width: `${stageWidth}%`, backgroundColor: "#e0e7ff", color: "#4338ca" }]}>After Ironing</Text>}
              </View>
              {/* Header Row 2: PC Numbers */}
              <View style={styles.tableRow} fixed>
                <Text style={[styles.tableColHeader, { width: "20%" }]}></Text>
                <Text style={[styles.tableColHeader, { width: "6%" }]}></Text>
                <Text style={[styles.tableColHeader, { width: "6%" }]}></Text>
                <Text style={[styles.tableColHeader, { width: "8%" }]}></Text>
                {hasAfterWash && piecesArr.map(pc => <Text key={`aw-${pc}`} style={[styles.tableColHeader, { width: `${stageWidth/piecesArr.length}%`, fontSize: 6, backgroundColor: "#f0fdf4" }]}>PC{pc}</Text>)}
                {hasAfterIroning && piecesArr.map(pc => <Text key={`ai-${pc}`} style={[styles.tableColHeader, { width: `${stageWidth/piecesArr.length}%`, fontSize: 6, backgroundColor: "#eef2ff" }]}>PC{pc}</Text>)}
              </View>
              {/* Data Rows */}
              {pointsArr.map((point, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCol, styles.textLeft, { width: "20%", fontSize: 7 }]}>{safeString(point.pointName)}</Text>
                  <Text style={[styles.tableCol, { width: "6%", fontSize: 6 }]}>{decimalToFraction(point.tolerancePlus)}</Text>
                  <Text style={[styles.tableCol, { width: "6%", fontSize: 6 }]}>{decimalToFraction(point.toleranceMinus)}</Text>
                  <Text style={[styles.tableCol, { width: "8%", fontSize: 6 }]}>{safeString(point.specs)}</Text>
                  {hasAfterWash && piecesArr.map(pc => {
                    const m = point.pieces.get(pc)?.afterWash;
                    return <Text key={`aw-${pc}`} style={[styles.tableCol, { width: `${stageWidth/piecesArr.length}%`, fontSize: 6 }, m ? (m.result === 'pass' ? { backgroundColor: "#dcfce7", color: "#166534" } : { backgroundColor: "#fee2e2", color: "#991b1b" }) : {}]}>{m ? m.fraction : '-'}</Text>;
                  })}
                  {hasAfterIroning && piecesArr.map(pc => {
                    const m = point.pieces.get(pc)?.afterIroning;
                    return <Text key={`ai-${pc}`} style={[styles.tableCol, { width: `${stageWidth/piecesArr.length}%`, fontSize: 6 }, m ? (m.result === 'pass' ? { backgroundColor: "#dcfce7", color: "#166534" } : { backgroundColor: "#fee2e2", color: "#991b1b" }) : {}]}>{m ? m.fraction : '-'}</Text>;
                  })}
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </Fragment>
  );
};

// --- MAIN PDF DOCUMENT COMPONENT ---
const QcWashingFullReportPDF = ({ 
  recordData, 
  comparisonData = null, 
  API_BASE_URL, 
  checkpointDefinitions = [], 
  inspectorDetails = null, 
  preloadedImages = {},
  washingComparisonData = null, // Add this new prop
  reportTitle = "After Ironing Report",
  isLoading = false,
  skipImageLoading = false 
}) => {
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
        url.includes('/uploads/') ? url : '/uploads/' + url.split('/').pop(),
        url.includes('/storage/') ? url : '/storage/' + url.split('/').pop(),
        url.includes('/qc_washing_images/') ? url : '/storage/qc_washing_images/defect/' + url.split('/').pop(),
        url.includes('/after_ironing_images/') ? url : '/storage/after_ironing_images/defect/' + url.split('/').pop(),
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
      console.error('Image render error for', alt, ':', error);
      return <ImagePlaceholder style={style} text="Load Error" subtext={error.message} />;
    }
  };

  // Remove the loading check that was causing the issue
  if (!recordData) {
    return (
      <Document>
        <Page style={styles.page}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: '#ff0000' }}>Error: No report data available</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
              Please ensure the record data is properly loaded before generating the PDF.
            </Text>
          </View>
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
          beforeAfterWash="After Ironing"
        />
        <Text style={styles.pageHeader}>After Ironing Report Summary</Text>

        <OrderInfoSection recordData={recordData} inspectorDetails={inspectorDetails} SafeImage={SafeImage} />

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

      {/* Inspection Details Page */}
      {(hasNewInspectionStructure || 
        inspectionDetails.checkedPoints?.length > 0 || 
        inspectionDetails.parameters?.length > 0 || 
        inspectionDetails.machineProcesses?.length > 0) && (
        <Page style={styles.page} orientation="landscape">
          <PdfHeader 
            orderNo={recordData.orderNo || "N/A"} 
            beforeAfterWash="After Ironing"
          />
          <Text style={styles.pageHeader}>Inspection Details</Text>
          
          {hasNewInspectionStructure ? (
            <NewInspectionDetailsSection
              inspectionDetails={inspectionDetails}
              checkpointDefinitions={checkpointDefinitions}
              SafeImage={SafeImage}
            />
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inspection Details</Text>
              <Text style={{ fontSize: 8, color: "#6b7280", textAlign: "center", padding: 10 }}>
                No inspection data available for this report
              </Text>
            </View>
          )}
        </Page>
      )}

      {/* Measurement Detail Pages */}
      {measurements.map((sizeData, index) => (
        <Page key={index} style={styles.page} orientation="landscape">
          <PdfHeader 
            orderNo={recordData.orderNo || "N/A"} 
            beforeAfterWash="After Ironing"
          />
          <Text style={styles.pageHeader}>
            Detailed Measurements - Size: {safeString(sizeData.size)}
          </Text>
          <MeasurementDetailTable sizeData={sizeData} />
        </Page>
      ))}

      {/* Measurement Comparison Page */}
      {(washingComparisonData || measurements.length > 0) && (
        <Page style={styles.page} orientation="landscape">
          <PdfHeader 
            orderNo={recordData.orderNo || "N/A"} 
            beforeAfterWash="After Ironing"
          />
          <Text style={styles.pageHeader}>Measurement Comparison</Text>
          <WashingComparisonSection 
            washingData={washingComparisonData} 
            afterIroningData={measurements}
          />
        </Page>
      )}

      {/* Before vs After Comparison Page */}
      {comparisonData && comparisonData.measurementDetails?.measurement && 
       recordData.measurementDetails?.measurement && (
        <Page style={styles.page} orientation="landscape">
          <PdfHeader 
            orderNo={recordData.orderNo || "N/A"} 
            beforeAfterWash="After Ironing"
          />
          <Text style={styles.pageHeader}>Before vs After Comparison</Text>
          <ComparisonSection recordData={recordData} comparisonData={comparisonData} />
        </Page>
      )}
    </Document>
  );
};

// Export both components for different use cases
export default QcWashingFullReportPDF;
export { QcWashingFullReportPDF };


                
