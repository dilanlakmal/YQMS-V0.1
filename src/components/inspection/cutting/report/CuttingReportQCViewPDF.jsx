import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf
} from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import React from "react";
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

// --- REGISTER LOCAL KHMER FONT ---
Font.register({
  family: "KhmerOS",
  src: "/fonts/Khmer-Regular.ttf"
});

// --- STYLESHEET ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 7,
    backgroundColor: "#ffffff",
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 30,
    color: "#333"
  },
  docHeader: {
    position: "absolute",
    top: 25,
    left: 30,
    right: 30,
    textAlign: "center",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingBottom: 5
  },
  companyName: { fontSize: 13, fontWeight: "bold", color: "#111827" },
  reportTitle: { fontSize: 11, color: "#374151", marginTop: 2 },
  reportSubInfo: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12
  },
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 7,
    color: "#aaa"
  },
  section: {
    marginBottom: 12,
    breakInside: "avoid"
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
    color: "#111827"
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 4,
    columnGap: 10
  },
  gridItem: { width: "31%", flexDirection: "row" },
  gridItemFull: { width: "100%", flexDirection: "row", flexWrap: "wrap" },
  gridLabel: { fontWeight: "bold", marginRight: 3 },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 0.5,
    borderColor: "#e5e7eb"
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderColor: "#e5e7eb"
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
    fontWeight: "bold",
    fontSize: 6.5
  },
  tableCell: {
    padding: 3,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderColor: "#e5e7eb",
    flexGrow: 1,
    flexBasis: 0
  },
  tableCellLast: { borderRightWidth: 0 },
  textLeft: { textAlign: "left" },

  // Specific styling
  passColor: { backgroundColor: "#dcfce7" }, // Light green
  failColor: { backgroundColor: "#fee2e2" }, // Light red

  resultPass: {
    color: "#166534", // Dark Green
    fontWeight: "bold"
  },
  resultFail: {
    color: "#b91c1c", // Dark Red
    fontWeight: "bold"
  },
  resultPending: {
    color: "#6b7280", // Gray
    fontWeight: "bold"
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
    gap: 5
  },
  image: {
    width: 120,
    height: 120,
    objectFit: "contain",
    borderWidth: 1,
    borderColor: "#e0e0e0"
  }
});

export const getResultStatus = (
  totalInspectionQty,
  sumTotalReject,
  sumTotalPcs,
  t
) => {
  if (sumTotalPcs < totalInspectionQty) {
    return { status: t("common.pending"), style: styles.resultPending };
  }

  if (totalInspectionQty >= 30 && totalInspectionQty < 45) {
    if (sumTotalReject > 0)
      return { status: t("common.fail"), style: styles.resultFail };
    return { status: t("common.pass"), style: styles.resultPass };
  } else if (totalInspectionQty >= 45 && totalInspectionQty < 60) {
    if (sumTotalReject > 0)
      return { status: t("common.fail"), style: styles.resultFail };
    return { status: t("common.pass"), style: styles.resultPass };
  } else if (totalInspectionQty >= 60 && totalInspectionQty < 90) {
    if (sumTotalReject > 1)
      return { status: t("common.fail"), style: styles.resultFail };
    return { status: t("common.pass"), style: styles.resultPass };
  } else if (totalInspectionQty >= 90 && totalInspectionQty < 135) {
    if (sumTotalReject > 2)
      return { status: t("common.fail"), style: styles.resultFail };
    return { status: t("common.pass"), style: styles.resultPass };
  } else if (totalInspectionQty >= 135 && totalInspectionQty < 210) {
    if (sumTotalReject > 3)
      return { status: t("common.fail"), style: styles.resultFail };
    return { status: t("common.pass"), style: styles.resultPass };
  } else if (totalInspectionQty >= 210 && totalInspectionQty < 315) {
    if (sumTotalReject > 5)
      return { status: t("common.fail"), style: styles.resultFail };
    return { status: t("common.pass"), style: styles.resultPass };
  } else if (totalInspectionQty >= 315) {
    if (sumTotalReject > 7)
      return { status: t("common.fail"), style: styles.resultFail };
    return { status: t("common.pass"), style: styles.resultPass };
  }

  return { status: t("common.pending"), style: styles.resultPending };
};

// --- HELPER FUNCTIONS ---
export const getLocalizedText = (eng, khmer, chinese, i18n) => {
  const lang = i18n.language;
  if (lang === "km" && khmer) return khmer;
  if (lang === "zh" && chinese) return chinese;
  return eng || "";
};

const decimalToFraction = (dec) => {
  if (typeof dec !== "number" || isNaN(dec)) return "-";
  if (dec === 0) return "0";

  // 1. Handle the sign separately
  const sign = dec < 0 ? "-" : "";
  const absDec = Math.abs(dec);

  // 2. Perform calculations on the absolute value
  const whole = Math.floor(absDec);
  const frac = absDec - whole;

  if (frac < 0.0001) {
    return `${sign}${whole}`;
  }

  const tolerance = 1.0e-6;
  let h1 = 1,
    h2 = 0,
    k1 = 0,
    k2 = 1;
  let b = frac;
  do {
    let a = Math.floor(b);
    let aux = h1;
    h1 = a * h1 + h2;
    h2 = aux;
    aux = k1;
    k1 = a * k1 + k2;
    k2 = aux;
    b = 1 / (b - a);
  } while (Math.abs(frac - h1 / k1) > frac * tolerance);

  const numerator = h1;
  const denominator = k1;

  const fractionString =
    (whole > 0 ? `${whole} ` : "") + `${numerator}/${denominator}`;

  // 3. Prepend the original sign to the final result
  return `${sign}${fractionString}`;
};

// --- PDF COMPONENTS ---

export const PDFHeader = ({ report, t, resultStatus }) => (
  <View style={styles.docHeader} fixed>
    <Text style={styles.companyName}>
      YORKMARS (CAMBODIA) GARMENT MFG CO., LTD
    </Text>
    <Text style={styles.reportTitle}>
      {t("cutting.cutPanelInspectionReportTitle")}
    </Text>
    <View style={styles.reportSubInfo}>
      <Text>
        {t("cutting.garmentType")}: {report.garmentType}
      </Text>
      <Text>
        {t("cutting.moNo")}: {report.moNo}
      </Text>
      <Text>
        {t("cutting.tableNo")}: {report.tableNo}
      </Text>
      <Text>
        {t("cutting.spreadTable")}:{" "}
        {report.cuttingTableDetails?.spreadTable || "N/A"}
      </Text>
      <Text>
        {t("cutting.date")}: {report.inspectionDate}
      </Text>
      <Text>
        <Text style={{ fontWeight: "bold" }}>{t("common.result")}: </Text>
        <Text style={resultStatus.style}>{resultStatus.status}</Text>
      </Text>
    </View>
  </View>
);

export const PDFFooter = () => (
  <Text
    style={styles.pageFooter}
    fixed
    render={({ pageNumber, totalPages }) =>
      `Page ${pageNumber} of ${totalPages}`
    }
  />
);

export const CutPanelDetails = ({ report, t, qcUser, i18n }) => {
  const markerRatioString =
    report.mackerRatio
      ?.map((mr) => `${mr.markerSize}: ${mr.ratio}`)
      .join(" | ") || "N/A";

  // Get the localized name from the qcUser object if it exists
  const qcName = qcUser
    ? getLocalizedText(qcUser.eng_name, qcUser.kh_name, null, i18n)
    : report.cutting_emp_engName || ""; // Fallback to name in report data

  // Format the final display string
  const qcDisplayString = qcName
    ? `${report.cutting_emp_id} (${qcName})`
    : report.cutting_emp_id;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t("cutting.cutPanelDetailsTitle")}
      </Text>
      <View style={styles.gridContainer}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>{t("cutting.qcId")}:</Text>
          {/* Use the new formatted string */}
          <Text>{qcDisplayString}</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>{t("cutting.lotNo")}:</Text>
          <Text>{report.lotNo?.join(", ") || "N/A"}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>{t("cutting.color")}:</Text>
          <Text>{report.color}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>{t("cutting.orderQty")}:</Text>
          <Text>{report.orderQty}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>{t("cutting.planLayers")}:</Text>
          <Text>{report.cuttingTableDetails?.planLayers}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>{t("cutting.actualLayers")}:</Text>
          <Text>{report.cuttingTableDetails?.actualLayers}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>{t("cutting.totalPcs")}:</Text>
          <Text>{report.cuttingTableDetails?.totalPcs}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>{t("cutting.totalBundleQty")}:</Text>
          <Text>{report.totalBundleQty}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>{t("cutting.bundleQtyCheck")}:</Text>
          <Text>{report.bundleQtyCheck}</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>{t("cutting.cuttingBy")}:</Text>
          <Text>{report.cuttingtype}</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>{t("cutting.mackerNo")}:</Text>
          <Text>{report.cuttingTableDetails?.mackerNo || "N/A"}</Text>
        </View>

        {/* NEWLY ADDED MARKER RATIO DISPLAY */}
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>{t("cutting.markerRatio")}:</Text>
          <Text>{markerRatioString}</Text>
        </View>
      </View>
    </View>
  );
};

export const InspectionSummary = ({ data, t }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>
      {t("cutting.inspectionSummaryOverall")}
    </Text>
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, { flexBasis: "8%" }]}>
          {t("cutting.size")}
        </Text>
        <Text style={[styles.tableCell]}>{t("cutting.inspectionQty")}</Text>
        <Text style={[styles.tableCell]}>{t("cutting.pass")}</Text>
        <Text style={[styles.tableCell]}>{t("cutting.reject")}</Text>
        <Text style={[styles.tableCell]}>
          {t("cutting.rejectMeasurements")}
        </Text>
        <Text style={[styles.tableCell]}>{t("cutting.rejectDefects")}</Text>
        <Text style={[styles.tableCell, styles.tableCellLast]}>
          {t("cutting.passRate")} (%)
        </Text>
      </View>
      {data.details.map((item, index) => (
        <View key={index} style={styles.tableRow} wrap={false}>
          <Text style={[styles.tableCell, { flexBasis: "8%" }]}>
            {item.size}
          </Text>
          <Text style={styles.tableCell}>{item.inspectedQty.total}</Text>
          <Text style={styles.tableCell}>{item.pass.total}</Text>
          <Text style={styles.tableCell}>{item.reject.total}</Text>
          <Text style={styles.tableCell}>{item.rejectMeasurement.total}</Text>
          <Text style={styles.tableCell}>
            {item.rejectDefects.total < 0 ? 0 : item.rejectDefects.total}
          </Text>
          <Text style={[styles.tableCell, styles.tableCellLast]}>
            {item.passRate.total.toFixed(2)}
          </Text>
        </View>
      ))}
      <View
        style={[
          styles.tableRow,
          { fontWeight: "bold", backgroundColor: "#f3f4f6" }
        ]}
      >
        <Text style={[styles.tableCell, { flexBasis: "8%" }]}>
          {t("common.total")}
        </Text>
        <Text style={styles.tableCell}>{data.totals.inspectedQty.total}</Text>
        <Text style={styles.tableCell}>{data.totals.pass.total}</Text>
        <Text style={styles.tableCell}>{data.totals.reject.total}</Text>
        <Text style={styles.tableCell}>
          {data.totals.rejectMeasurement.total}
        </Text>
        <Text style={styles.tableCell}>
          {data.totals.rejectDefects.total < 0
            ? 0
            : data.totals.rejectDefects.total}
        </Text>
        <Text style={[styles.tableCell, styles.tableCellLast]}>
          {data.totals.passRate.total.toFixed(2)}
        </Text>
      </View>
    </View>
  </View>
);

export const MeasurementTableHeader = ({ data, t, fixed = false }) => (
  <View style={[styles.tableRow, styles.tableHeader]} fixed={fixed}>
    <Text style={[styles.tableCell, styles.textLeft, { flexBasis: "8%" }]}>
      {t("cutting.size")}
    </Text>
    <Text style={[styles.tableCell, { flexBasis: "8%" }]}>
      {t("cutting.bundleNo")}
    </Text>
    <Text style={[styles.tableCell, styles.textLeft, { flexBasis: "15%" }]}>
      {t("cutting.partName")}
    </Text>
    <Text style={[styles.tableCell, styles.textLeft, { flexBasis: "18%" }]}>
      {t("cutting.measurementPoint")}
    </Text>
    {data.headers.map((pcsName) => (
      <Text
        key={pcsName}
        style={[
          styles.tableCell,
          { flexBasis: `${51 / data.headers.length}%` }
        ]}
      >
        {pcsName}
      </Text>
    ))}
  </View>
);

export const MeasurementDetails = ({ data, t }) => {
  // Define the height of the header row to use as a margin.
  const headerHeight = 1;

  return (
    // 'wrap' is removed from the section to let the content flow naturally
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("cutting.measurementDetails")}</Text>

      {/* 1. RENDER THE FIXED HEADER. IT WILL REPEAT ON EVERY PAGE. */}
      <MeasurementTableHeader data={data} t={t} fixed />

      {/* 2. RENDER THE TABLE BODY IN A SEPARATE VIEW. */}
      <View style={{ marginTop: headerHeight }}>
        {data.data.map((row, rowIndex) => (
          // The 'wrap={false}' here prevents a single row from being split across two pages.
          <View key={rowIndex} style={styles.tableRow} wrap={false}>
            <Text
              style={[styles.tableCell, styles.textLeft, { flexBasis: "8%" }]}
            >
              {row.size}
            </Text>
            <Text style={[styles.tableCell, { flexBasis: "8%" }]}>
              {row.bundleNo}
            </Text>
            <Text
              style={[styles.tableCell, styles.textLeft, { flexBasis: "15%" }]}
            >
              {row.partName}
            </Text>
            <Text
              style={[styles.tableCell, styles.textLeft, { flexBasis: "18%" }]}
            >
              {row.measurementPoint}
            </Text>
            {data.headers.map((pcsName) => {
              const value = row.values[pcsName];
              const style = [
                styles.tableCell,
                { flexBasis: `${51 / data.headers.length}%` }
              ];
              if (row.tolerance && typeof value === "number") {
                if (value < row.tolerance.min || value > row.tolerance.max) {
                  style.push(styles.failColor);
                } else {
                  style.push(styles.passColor);
                }
              }
              return (
                <Text key={pcsName} style={style}>
                  {decimalToFraction(value)}
                </Text>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

export const FabricDefectsPDF = ({ data, t }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{t("cutting.fabricDefectsTitle")}</Text>
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, styles.textLeft, { flexBasis: "8%" }]}>
          {t("cutting.size")}
        </Text>
        <Text style={[styles.tableCell, { flexBasis: "8%" }]}>
          {t("cutting.bundleNo")}
        </Text>
        <Text style={[styles.tableCell, styles.textLeft, { flexBasis: "20%" }]}>
          {t("cutting.partName")}
        </Text>
        <Text
          style={[
            styles.tableCell,
            styles.textLeft,
            styles.tableCellLast,
            { flexBasis: "64%" }
          ]}
        >
          {t("cutting.defectDetails")}
        </Text>
      </View>
      {data.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow} wrap={false}>
          <Text
            style={[styles.tableCell, styles.textLeft, { flexBasis: "8%" }]}
          >
            {row.size}
          </Text>
          <Text style={[styles.tableCell, { flexBasis: "8%" }]}>
            {row.bundleNo}
          </Text>
          <Text
            style={[styles.tableCell, styles.textLeft, { flexBasis: "20%" }]}
          >
            {row.partName}
          </Text>
          <View
            style={[
              styles.tableCell,
              styles.textLeft,
              styles.tableCellLast,
              { flexBasis: "64%" }
            ]}
          >
            {Object.entries(row.defectsByPcs).map(([pcsName, defectsList]) => (
              <Text key={pcsName}>
                <Text style={{ fontWeight: "bold" }}>{pcsName}: </Text>
                <Text style={{ fontFamily: "KhmerOS" }}>
                  {" "}
                  {defectsList
                    .map((d) => `${d.displayName} (${d.qty})`)
                    .join(", ")}
                </Text>
              </Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  </View>
);

export const CuttingIssuesPDF = ({ report, t, i18n }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{t("cutting.cuttingIssuesTitle")}</Text>
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, { flexBasis: "10%" }]}>
          {t("cutting.size")}
        </Text>
        <Text style={[styles.tableCell, styles.textLeft, { flexBasis: "30%" }]}>
          {t("cutting.defectName")}
        </Text>
        <Text
          style={[
            styles.tableCell,
            styles.textLeft,
            styles.tableCellLast,
            { flexBasis: "60%" }
          ]}
        >
          {t("cutting.remarks")}
        </Text>
      </View>
      {report.inspectionData.flatMap((sizeEntry) =>
        (sizeEntry.cuttingDefects?.issues || []).map((issue, issueIdx) => (
          <View
            key={`${sizeEntry.inspectedSize}-${issueIdx}`}
            style={styles.tableRow}
            wrap={false}
          >
            <Text style={[styles.tableCell, { flexBasis: "10%" }]}>
              {sizeEntry.inspectedSize}
            </Text>

            <Text
              style={[styles.tableCell, styles.textLeft, { flexBasis: "30%" }]}
            >
              {getLocalizedText(
                issue.cuttingdefectName,
                issue.cuttingdefectNameKhmer,
                null,
                i18n
              )}
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.textLeft,
                styles.tableCellLast,
                { flexBasis: "60%" }
              ]}
            >
              {issue.remarks}
            </Text>
          </View>
        ))
      )}
    </View>
  </View>
);

export const AdditionalImagesPDF = ({ report, t }) => {
  // Check if there are any additional images across all sizes
  const allImages = report.inspectionData.flatMap(
    (sizeEntry) => sizeEntry.cuttingDefects?.additionalImages || []
  );

  if (allImages.length === 0) {
    return null; // Don't render anything if there are no images
  }

  return (
    <View style={styles.section} break>
      <Text style={styles.sectionTitle}>{t("cutting.additionalImages")}</Text>
      {report.inspectionData.map((sizeEntry, index) => {
        const images = sizeEntry.cuttingDefects?.additionalImages;
        if (!images || images.length === 0) {
          return null;
        }
        return (
          <View key={`img-section-${index}`} style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 8, fontWeight: "bold", marginBottom: 5 }}>
              {t("cutting.size")}: {sizeEntry.inspectedSize}
            </Text>
            <View style={styles.imageContainer}>
              {images.map((img, imgIdx) =>
                img.data ? ( // We will render based on the pre-loaded 'data' property
                  <Image
                    key={imgIdx}
                    style={styles.image}
                    src={img.data} // Use the base64 data URI
                  />
                ) : null
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

// --- MAIN DOCUMENT COMPONENT ---
const CuttingReportPDFDoc = ({
  report,
  processedData,
  i18n,
  resultStatus,
  qcUser
}) => {
  const { t } = i18n;
  const hasCuttingIssues = report.inspectionData.some(
    (sd) => sd.cuttingDefects?.issues?.length > 0
  );

  return (
    <Document
      author="Yorkmars Garment MFG Co., LTD"
      title={`Cutting Report - ${report.moNo}`}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <PDFHeader report={report} t={t} resultStatus={resultStatus} />
        <CutPanelDetails report={report} t={t} qcUser={qcUser} i18n={i18n} />
        <InspectionSummary data={processedData.inspectionSummary} t={t} />
        {processedData.measurementData.data.length > 0 && (
          <MeasurementDetails data={processedData.measurementData} t={t} />
        )}
        {processedData.defectData.length > 0 && (
          <FabricDefectsPDF data={processedData.defectData} t={t} />
        )}
        {hasCuttingIssues && (
          <CuttingIssuesPDF report={report} t={t} i18n={i18n} />
        )}
        <AdditionalImagesPDF report={report} t={t} />
        <PDFFooter />
      </Page>
    </Document>
  );
};

// --- EXPORTED GENERATOR FUNCTION ---
export const generateCuttingReportPDF = async (
  report,
  qcUser,
  fabricDefectsMaster,
  i18n
) => {
  // --- FULL DATA PROCESSING LOGIC ---
  const { t } = i18n;

  // --- ADD THIS HELPER FUNCTION TO FETCH AND CONVERT IMAGES ---
  const imageToDataUri = async (url) => {
    try {
      // Construct the proxy URL
      const proxyUrl = `${API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(
        url
      )}`;

      // Fetch from your OWN backend. The browser will allow this.
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Proxy fetch failed with status ${response.status}`);
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(
        `Failed to fetch and convert image via proxy: ${url}`,
        error
      );
      return null; // Return null if fetching fails
    }
  };

  // --- PRE-LOAD AND PREPARE IMAGES ---
  // We create a deep copy of the report to avoid mutating the original state.
  const reportWithImageData = JSON.parse(JSON.stringify(report));

  // Create an array of all image-fetching promises
  const imagePromises = [];
  reportWithImageData.inspectionData.forEach((sizeEntry) => {
    const images = sizeEntry.cuttingDefects?.additionalImages;
    if (images) {
      images.forEach((img) => {
        if (img.path) {
          const promise = imageToDataUri(img.path).then((dataUri) => {
            img.data = dataUri; // Attach the base64 data to the image object
          });
          imagePromises.push(promise);
        }
      });
    }
  });

  // Wait for all images to be fetched and converted
  await Promise.all(imagePromises);

  const getDefectDisplayName = (defectNameFromInspection) => {
    const masterDefect = fabricDefectsMaster.find(
      (m) =>
        m.defectName === defectNameFromInspection ||
        m.defectNameEng === defectNameFromInspection
    );
    return masterDefect
      ? getLocalizedText(
          masterDefect.defectNameEng,
          masterDefect.defectNameKhmer,
          masterDefect.defectNameChinese,
          i18n
        )
      : defectNameFromInspection;
  };

  const inspectionSummaryData = (() => {
    if (!report || !report.inspectionData) return { details: [], totals: {} };
    const details = report.inspectionData.map((sizeData) => ({
      size: sizeData.inspectedSize,
      inspectedQty: { total: sizeData.totalPcsSize || 0 },
      pass: { total: sizeData.passSize?.total || 0 },
      reject: { total: sizeData.rejectSize?.total || 0 },
      rejectMeasurement: { total: sizeData.rejectMeasurementSize?.total || 0 },
      rejectDefects: { total: sizeData.rejectGarmentSize?.total || 0 },
      passRate: { total: sizeData.passrateSize?.total || 0 }
    }));
    const totals = details.reduce(
      (acc, curr) => {
        acc.inspectedQty.total += curr.inspectedQty.total;
        acc.pass.total += curr.pass.total;
        acc.reject.total += curr.reject.total;
        acc.rejectMeasurement.total += curr.rejectMeasurement.total;
        acc.rejectDefects.total += curr.rejectDefects.total;
        return acc;
      },
      {
        inspectedQty: { total: 0 },
        pass: { total: 0 },
        reject: { total: 0 },
        rejectMeasurement: { total: 0 },
        rejectDefects: { total: 0 }
      }
    );
    totals.passRate = {
      total:
        totals.inspectedQty.total > 0
          ? (totals.pass.total / totals.inspectedQty.total) * 100
          : 0
    };
    return { details, totals };
  })();

  // ADD THIS CALCULATION
  const resultStatus = getResultStatus(
    report.totalInspectionQty || 0,
    inspectionSummaryData.totals.reject.total || 0,
    inspectionSummaryData.totals.inspectedQty.total || 0,
    t
  );

  const processedMeasurementData = (() => {
    if (!report || !report.inspectionData) return { data: [], headers: [] };
    const allPcsNames = new Set();
    report.inspectionData.forEach((sd) =>
      sd.bundleInspectionData.forEach((b) =>
        b.measurementInsepctionData.forEach((p) =>
          p.measurementPointsData.forEach((mp) =>
            mp.measurementValues.forEach((mv) =>
              mv.measurements.forEach((m) => allPcsNames.add(m.pcsName))
            )
          )
        )
      )
    );
    const sortedHeaders = Array.from(allPcsNames).sort((a, b) => {
      const prefixOrder = { T: 1, M: 2, B: 3 };
      const prefixA = a.charAt(0).toUpperCase();
      const prefixB = b.charAt(0).toUpperCase();
      const numA = parseInt(a.substring(1), 10);
      const numB = parseInt(b.substring(1), 10);

      const orderA = prefixOrder[prefixA] || 4; // Default to 4 if prefix is not T, M, or B
      const orderB = prefixOrder[prefixB] || 4;

      if (orderA !== orderB) {
        return orderA - orderB; // Sort by T, M, B
      }
      return numA - numB; // If prefixes are the same, sort by number
    });

    const data = [];
    report.inspectionData.forEach((sizeData) => {
      sizeData.bundleInspectionData.forEach((bundle) => {
        bundle.measurementInsepctionData.forEach((part) => {
          part.measurementPointsData.forEach((mp) => {
            const row = {
              size: sizeData.inspectedSize,
              bundleNo: bundle.bundleNo,
              partName: getLocalizedText(
                part.partName,
                part.partNameKhmer,
                null,
                i18n
              ),
              measurementPoint: getLocalizedText(
                mp.measurementPointName,
                mp.measurementPointNameKhmer,
                null,
                i18n
              ),
              values: {},
              tolerance: sizeData.tolerance
            };
            sortedHeaders.forEach((pcsName) => {
              const found = mp.measurementValues
                .flatMap((mv) => mv.measurements)
                .find((m) => m.pcsName === pcsName);
              row.values[pcsName] = found ? found.valuedecimal : null;
            });
            data.push(row);
          });
        });
      });
    });
    return { data, headers: sortedHeaders };
  })();

  const processedDefectData = (() => {
    if (!report || !report.inspectionData) return [];
    const data = [];
    report.inspectionData.forEach((sizeData) => {
      sizeData.bundleInspectionData.forEach((bundle) => {
        bundle.measurementInsepctionData.forEach((part) => {
          const defectsForPart = {};
          let hasDefects = false;
          part.fabricDefects.forEach((loc) => {
            loc.defectData.forEach((pcsDefect) => {
              if (pcsDefect.totalDefects > 0) {
                hasDefects = true;
                if (!defectsForPart[pcsDefect.pcsName])
                  defectsForPart[pcsDefect.pcsName] = [];
                pcsDefect.defects.forEach((detail) => {
                  if (detail.defectName) {
                    let existing = defectsForPart[pcsDefect.pcsName].find(
                      (d) => d.nameFromSchema === detail.defectName
                    );
                    if (existing) existing.qty += detail.defectQty || 0;
                    else {
                      // 1. Find the master record for the defect
                      const masterDefect = fabricDefectsMaster.find(
                        (m) =>
                          m.defectName === detail.defectName ||
                          m.defectNameEng === detail.defectName
                      );
                      // 2. Create the display name using ONLY the English name from the master record,
                      //    or fall back to the original name if not found.
                      const englishDisplayName =
                        masterDefect?.defectNameEng || detail.defectName;

                      defectsForPart[pcsDefect.pcsName].push({
                        nameFromSchema: detail.defectName,
                        //displayName: englishDisplayName,
                        displayName: getDefectDisplayName(detail.defectName),
                        qty: detail.defectQty || 0
                      });
                    }
                  }
                });
              }
            });
          });
          if (hasDefects) {
            data.push({
              size: sizeData.inspectedSize,
              bundleNo: bundle.bundleNo,
              partName: getLocalizedText(
                part.partName,
                part.partNameKhmer,
                null,
                i18n
              ),
              defectsByPcs: defectsForPart
            });
          }
        });
      });
    });
    return data;
  })();

  const processedData = {
    inspectionSummary: inspectionSummaryData,
    measurementData: processedMeasurementData,
    defectData: processedDefectData
  };

  const blob = await pdf(
    <CuttingReportPDFDoc
      report={reportWithImageData}
      //report={report}
      processedData={processedData}
      i18n={i18n}
      resultStatus={resultStatus}
      qcUser={qcUser}
    />
  ).toBlob();

  saveAs(blob, `Cutting_Report_${report.moNo}_${report.tableNo}.pdf`);
};
