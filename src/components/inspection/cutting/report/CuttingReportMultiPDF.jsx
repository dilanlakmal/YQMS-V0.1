import { Document, Page, StyleSheet, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import React from "react";
import { API_BASE_URL } from "../../../../../config";
import {
  AdditionalImagesPDF,
  CutPanelDetails,
  CuttingIssuesPDF,
  FabricDefectsPDF,
  InspectionSummary,
  MeasurementDetails,
  PDFFooter,
  PDFHeader,
  getLocalizedText,
  getResultStatus
} from "./CuttingReportQCViewPDF";

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
    paddingBottom: 5,
    marginBottom: 10
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
  section: { marginBottom: 12, breakInside: "avoid" },
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
  passColor: { backgroundColor: "#dcfce7" },
  failColor: { backgroundColor: "#fee2e2" },
  resultPass: { color: "#166534", fontWeight: "bold" },
  resultFail: { color: "#b91c1c", fontWeight: "bold" },
  resultPending: { color: "#6b7280", fontWeight: "bold" }
});

// This component renders a single report on one or more pages
const ReportPage = ({ report, qcUser, processedData, i18n }) => {
  const { t } = i18n;
  const hasCuttingIssues = report.inspectionData.some(
    (sd) => sd.cuttingDefects?.issues?.length > 0
  );

  const resultStatus = getResultStatus(
    report.totalInspectionQty || 0,
    processedData.inspectionSummary.totals.reject.total || 0,
    processedData.inspectionSummary.totals.inspectedQty.total || 0,
    t
  );

  return (
    <Page size="A4" orientation="landscape" style={styles.page} break>
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
  );
};

// Main exported function for generating the multi-report PDF
export const generateMultiReportPDF = async (
  reports,
  qcUsers,
  fabricDefectsMaster,
  i18n,
  tableNoFilter
) => {
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
  // --- PRE-LOAD ALL IMAGES FOR ALL REPORTS ---
  const reportsWithImageData = JSON.parse(JSON.stringify(reports));
  const allImagePromises = [];
  reportsWithImageData.forEach((report) => {
    report.inspectionData.forEach((sizeEntry) => {
      const images = sizeEntry.cuttingDefects?.additionalImages;
      if (images) {
        images.forEach((img) => {
          if (img.path) {
            const promise = imageToDataUri(img.path).then((dataUri) => {
              img.data = dataUri;
            });
            allImagePromises.push(promise);
          }
        });
      }
    });
  });

  await Promise.all(allImagePromises);

  // --- FULL DATA PROCESSING LOGIC FOR A SINGLE REPORT ---
  const processReportData = (report) => {
    const { t } = i18n;

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

    const inspectionSummary = (() => {
      const details = report.inspectionData.map((d) => ({
        size: d.inspectedSize,
        inspectedQty: {
          total: d.totalPcsSize || 0,
          top: d.pcsSize?.top || 0,
          middle: d.pcsSize?.middle || 0,
          bottom: d.pcsSize?.bottom || 0
        },
        pass: {
          total: d.passSize?.total || 0,
          top: d.passSize?.top || 0,
          middle: d.passSize?.middle || 0,
          bottom: d.passSize?.bottom || 0
        },
        reject: {
          total: d.rejectSize?.total || 0,
          top: d.rejectSize?.top || 0,
          middle: d.rejectSize?.middle || 0,
          bottom: d.rejectSize?.bottom || 0
        },
        rejectMeasurement: {
          total: d.rejectMeasurementSize?.total || 0,
          top: d.rejectMeasurementSize?.top || 0,
          middle: d.rejectMeasurementSize?.middle || 0,
          bottom: d.rejectMeasurementSize?.bottom || 0
        },
        rejectDefects: {
          total: d.rejectGarmentSize?.total || 0,
          top: d.rejectGarmentSize?.top || 0,
          middle: d.rejectGarmentSize?.middle || 0,
          bottom: d.rejectGarmentSize?.bottom || 0
        },
        passRate: {
          total: d.passrateSize?.total || 0,
          top: d.passrateSize?.top || 0,
          middle: d.passrateSize?.middle || 0,
          bottom: d.passrateSize?.bottom || 0
        }
      }));
      const totals = details.reduce(
        (acc, curr) => {
          Object.keys(acc).forEach((key) => {
            if (curr[key]) {
              Object.keys(acc[key]).forEach((subKey) => {
                acc[key][subKey] += curr[key][subKey] || 0;
              });
            }
          });
          return acc;
        },
        {
          inspectedQty: { total: 0, top: 0, middle: 0, bottom: 0 },
          pass: { total: 0, top: 0, middle: 0, bottom: 0 },
          reject: { total: 0, top: 0, middle: 0, bottom: 0 },
          rejectMeasurement: { total: 0, top: 0, middle: 0, bottom: 0 },
          rejectDefects: { total: 0, top: 0, middle: 0, bottom: 0 }
        }
      );
      totals.passRate = {
        total:
          totals.inspectedQty.total > 0
            ? (totals.pass.total / totals.inspectedQty.total) * 100
            : 0,
        top:
          totals.inspectedQty.top > 0
            ? (totals.pass.top / totals.inspectedQty.top) * 100
            : 0,
        middle:
          totals.inspectedQty.middle > 0
            ? (totals.pass.middle / totals.inspectedQty.middle) * 100
            : 0,
        bottom:
          totals.inspectedQty.bottom > 0
            ? (totals.pass.bottom / totals.inspectedQty.bottom) * 100
            : 0
      };
      return { details, totals };
    })();

    const measurements = (() => {
      let processed = [];
      const allPcsNamesMasterSet = new Set();
      report.inspectionData.forEach((s) =>
        s.bundleInspectionData.forEach((b) =>
          b.measurementInsepctionData.forEach((p) =>
            p.measurementPointsData.forEach((mp) =>
              mp.measurementValues.forEach((mv) =>
                mv.measurements.forEach((m) =>
                  allPcsNamesMasterSet.add(m.pcsName)
                )
              )
            )
          )
        )
      );
      const sortedMasterPcsNames = Array.from(allPcsNamesMasterSet).sort(
        (a, b) => {
          const prefixOrder = { T: 1, M: 2, B: 3 };
          const prefixA = a.charAt(0).toUpperCase();
          const prefixB = b.charAt(0).toUpperCase();
          const numA = parseInt(a.substring(1));
          const numB = parseInt(b.substring(1));

          const orderA = prefixOrder[prefixA] || 4; // Use 4 for any other prefixes
          const orderB = prefixOrder[prefixB] || 4;

          if (orderA !== orderB) {
            return orderA - orderB; // Sort by T, then M, then B
          }
          return numA - numB; // If prefixes are the same, sort numerically
        }
      );
      report.inspectionData.forEach((s) =>
        s.bundleInspectionData.forEach((b) =>
          b.measurementInsepctionData.forEach((p) =>
            p.measurementPointsData.forEach((mp) => {
              const row = {
                size: s.inspectedSize,
                bundleQtyForSize: s.bundleQtyCheckSize,
                bundleNo: b.bundleNo,
                partName: getLocalizedText(
                  p.partName,
                  p.partNameKhmer,
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
                tolerance: s.tolerance
              };
              sortedMasterPcsNames.forEach((pcsName) => {
                row.values[pcsName] =
                  mp.measurementValues
                    .flatMap((mv) => mv.measurements)
                    .find((m) => m.pcsName === pcsName)?.valuedecimal ?? null;
              });
              processed.push(row);
            })
          )
        )
      );
      return { data: processed, headers: sortedMasterPcsNames };
    })();

    const defects = (() => {
      let processed = [];
      report.inspectionData.forEach((s) =>
        s.bundleInspectionData.forEach((b) =>
          b.measurementInsepctionData.forEach((p) => {
            const defectsForPart = {};
            let hasDefects = false;
            p.fabricDefects.forEach((ld) =>
              ld.defectData.forEach((pd) => {
                if (pd.totalDefects > 0 && pd.defects) {
                  hasDefects = true;
                  if (!defectsForPart[pd.pcsName])
                    defectsForPart[pd.pcsName] = [];
                  pd.defects.forEach((d) => {
                    if (d.defectName) {
                      let existing = defectsForPart[pd.pcsName].find(
                        (x) => x.nameFromSchema === d.defectName
                      );
                      if (existing) existing.qty += d.defectQty || 0;
                      else
                        defectsForPart[pd.pcsName].push({
                          nameFromSchema: d.defectName,
                          displayName: getDefectDisplayName(d.defectName),
                          qty: d.defectQty || 0
                        });
                    }
                  });
                }
              })
            );
            if (hasDefects)
              processed.push({
                size: s.inspectedSize,
                bundleNo: b.bundleNo,
                partName: getLocalizedText(
                  p.partName,
                  p.partNameKhmer,
                  null,
                  i18n
                ),
                defectsByPcs: defectsForPart
              });
          })
        )
      );
      return processed;
    })();

    return {
      inspectionSummary,
      measurementData: measurements,
      defectData: defects
    };
  };

  const blob = await pdf(
    <Document>
      {reportsWithImageData.map((report) => {
        const processedData = processReportData(report);
        const qcUser = qcUsers.find((u) => u?.emp_id === report.cutting_emp_id);
        return (
          <ReportPage
            key={report._id}
            report={report}
            qcUser={qcUser}
            processedData={processedData}
            i18n={i18n}
          />
        );
      })}
    </Document>
  ).toBlob();

  const moNo = reports[0]?.moNo || "Report";

  const fileName = !tableNoFilter
    ? `${moNo}_AllTables.pdf`
    : `Cutting_Report_${moNo}_${tableNoFilter}.pdf`;

  saveAs(blob, fileName);
};
