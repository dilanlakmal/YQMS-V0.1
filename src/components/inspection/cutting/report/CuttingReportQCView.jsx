import axios from "axios";
import { Download, Loader2, Search, UserCircle2 } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { decimalToFraction } from "../../../../utils/fractionUtils";
import { generateMultiReportPDF } from "./CuttingReportMultiPDF";
import { generateCuttingReportPDF } from "./CuttingReportQCViewPDF";

import { useSearchParams } from "react-router-dom";

// ====================================================================
// NEW: Reusable Component for Displaying a Single Report
// ====================================================================
const SingleReportView = ({ report, onGeneratePDF, fabricDefectsMaster }) => {
  const { t, i18n } = useTranslation();
  const [qcUser, setQcUser] = useState(null);

  useEffect(() => {
    const fetchQcUserDetails = async (empId) => {
      if (!empId) {
        setQcUser(null);
        return;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/${empId}`);
        setQcUser({
          ...response.data,
          image_path: response.data.face_photo || null
        });
      } catch (err) {
        setQcUser({
          emp_id: empId,
          eng_name: "N/A",
          kh_name: "N/A",
          image_path: null
        });
      }
    };

    if (report?.cutting_emp_id) {
      fetchQcUserDetails(report.cutting_emp_id);
    }
  }, [report]);

  // Helper functions scoped to this component
  const getLocalizedText = (eng, khmer, chinese) => {
    if (i18n.language === "km" && khmer) return khmer;
    if (i18n.language === "zh" && chinese) return chinese;
    return eng || "";
  };

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
          masterDefect.defectNameChinese
        )
      : defectNameFromInspection;
  };

  const getImagePath = (relativePath) => {
    if (!relativePath) return "";
    if (relativePath.startsWith("http")) return relativePath;
    const base = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
    const path = relativePath.startsWith("/")
      ? relativePath
      : `/${relativePath}`;
    return `${base}${path}`;
  };

  // All data processing is now encapsulated here and memoized for performance
  const {
    inspectionSummaryData,
    processedMeasurementData,
    processedDefectData,
    resultStatus
  } = useMemo(() => {
    if (!report) {
      return {
        inspectionSummaryData: { details: [], totals: {} },
        processedMeasurementData: { data: [], headers: [] },
        processedDefectData: [],
        resultStatus: { status: "Pending", color: "text-gray-400" }
      };
    }

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
      report.inspectionData.forEach((sizeData) =>
        sizeData.bundleInspectionData.forEach((bundle) =>
          bundle.measurementInsepctionData.forEach((part) =>
            part.measurementPointsData.forEach((mp) =>
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
          if (prefixOrder[prefixA] !== prefixOrder[prefixB])
            return (prefixOrder[prefixA] || 4) - (prefixOrder[prefixB] || 4);
          return numA - numB;
        }
      );
      report.inspectionData.forEach((sizeData) =>
        sizeData.bundleInspectionData.forEach((bundle) =>
          bundle.measurementInsepctionData.forEach((part) =>
            part.measurementPointsData.forEach((mp) => {
              const row = {
                size: sizeData.inspectedSize,
                bundleQtyForSize: sizeData.bundleQtyCheckSize,
                bundleNo: bundle.bundleNo,
                partName: getLocalizedText(part.partName, part.partNameKhmer),
                measurementPoint: getLocalizedText(
                  mp.measurementPointName,
                  mp.measurementPointNameKhmer
                ),
                values: {},
                tolerance: sizeData.tolerance
              };
              sortedMasterPcsNames.forEach((pcsName) => {
                const measurement = mp.measurementValues
                  .flatMap((mv) => mv.measurements)
                  .find((m) => m.pcsName === pcsName);
                row.values[pcsName] = measurement
                  ? measurement.valuedecimal
                  : null;
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
      report.inspectionData.forEach((sizeData) =>
        sizeData.bundleInspectionData.forEach((bundle) =>
          bundle.measurementInsepctionData.forEach((part) => {
            const defectsForPart = {};
            let partHasDefects = false;
            part.fabricDefects.forEach((locationDefect) =>
              locationDefect.defectData.forEach((pcsDefect) => {
                if (pcsDefect.totalDefects > 0 && pcsDefect.defects) {
                  partHasDefects = true;
                  if (!defectsForPart[pcsDefect.pcsName])
                    defectsForPart[pcsDefect.pcsName] = [];
                  pcsDefect.defects.forEach((detail) => {
                    if (detail.defectName) {
                      let existing = defectsForPart[pcsDefect.pcsName].find(
                        (d) => d.nameFromSchema === detail.defectName
                      );
                      if (existing) existing.qty += detail.defectQty || 0;
                      else
                        defectsForPart[pcsDefect.pcsName].push({
                          nameFromSchema: detail.defectName,
                          displayName: getDefectDisplayName(detail.defectName),
                          qty: detail.defectQty || 0
                        });
                    }
                  });
                }
              })
            );
            if (partHasDefects) {
              processed.push({
                size: sizeData.inspectedSize,
                bundleQtyForSize: sizeData.bundleQtyCheckSize,
                bundleNo: bundle.bundleNo,
                partName: getLocalizedText(part.partName, part.partNameKhmer),
                defectsByPcs: defectsForPart
              });
            }
          })
        )
      );
      return processed;
    })();

    const status = (() => {
      if (!report || !inspectionSummary.totals)
        return {
          status: t("common.pending"),
          color: "text-gray-400 font-bold"
        };
      const { totalInspectionQty } = report;
      const { reject, inspectedQty } = inspectionSummary.totals;
      if (inspectedQty.total < totalInspectionQty)
        return {
          status: t("common.pending"),
          color: "text-gray-400 font-bold"
        };
      if (totalInspectionQty >= 30 && totalInspectionQty < 45)
        return reject.total > 0
          ? { status: t("common.fail"), color: "text-red-600 font-bold" }
          : { status: t("common.pass"), color: "text-green-600 font-bold" };
      if (totalInspectionQty >= 45 && totalInspectionQty < 60)
        return reject.total > 0
          ? { status: t("common.fail"), color: "text-red-600 font-bold" }
          : { status: t("common.pass"), color: "text-green-600 font-bold" };
      if (totalInspectionQty >= 60 && totalInspectionQty < 90)
        return reject.total > 1
          ? { status: t("common.fail"), color: "text-red-600 font-bold" }
          : { status: t("common.pass"), color: "text-green-600 font-bold" };
      if (totalInspectionQty >= 90 && totalInspectionQty < 135)
        return reject.total > 2
          ? { status: t("common.fail"), color: "text-red-600 font-bold" }
          : { status: t("common.pass"), color: "text-green-600 font-bold" };
      if (totalInspectionQty >= 135 && totalInspectionQty < 210)
        return reject.total > 3
          ? { status: t("common.fail"), color: "text-red-600 font-bold" }
          : { status: t("common.pass"), color: "text-green-600 font-bold" };
      if (totalInspectionQty >= 210 && totalInspectionQty < 315)
        return reject.total > 5
          ? { status: t("common.fail"), color: "text-red-600 font-bold" }
          : { status: t("common.pass"), color: "text-green-600 font-bold" };
      if (totalInspectionQty >= 315)
        return reject.total > 7
          ? { status: t("common.fail"), color: "text-red-600 font-bold" }
          : { status: t("common.pass"), color: "text-green-600 font-bold" };
      return { status: t("common.pending"), color: "text-gray-400 font-bold" };
    })();

    return {
      inspectionSummaryData: inspectionSummary,
      processedMeasurementData: measurements,
      processedDefectData: defects,
      resultStatus: status
    };
  }, [report, i18n.language, t, getDefectDisplayName]);

  // Variables for table row grouping logic
  let lastSize = null,
    lastBundleNo = null,
    lastDefectSize = null,
    lastDefectBundleNo = null;

  return (
    <div className="bg-white p-6 shadow-lg rounded-lg print:shadow-none print:border-none print:p-0 mb-8 page-break-before">
      <div className="max-w-6xl mx-auto print:max-w-full">
        <div className="text-center mb-6 border-b pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            YORKMARS (CAMBODIA) GARMENT MFG CO., LTD
          </h1>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mt-1">
            {t("cutting.cutPanelInspectionReportTitle")}
          </h2>
          <div className="mt-2 text-sm text-gray-600 flex flex-wrap justify-center items-center gap-x-4">
            <span>
              {t("cutting.panel")}: {report.garmentType}
            </span>
            <span className="print:hidden">|</span>
            <span>
              {t("cutting.moNo")}: {report.moNo}
            </span>
            <span className="print:hidden">|</span>
            <span>
              {t("cutting.tableNo")}: {report.tableNo}
            </span>
            <span className="print:hidden">|</span>
            <span>
              {t("cutting.date")}: {report.inspectionDate}
            </span>
          </div>
        </div>

        <div className="mb-4 flex justify-end space-x-2 print:hidden">
          <button
            onClick={() => onGeneratePDF(report, qcUser)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            title={t("common.downloadPdf")}
          >
            <Download size={18} className="mr-2" /> {t("common.pdf")}
          </button>
        </div>

        {/* Cut Panel Details section */}
        <div className="relative mb-6 p-4 border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-md sm:text-lg font-semibold text-gray-700 mb-3">
            {t("cutting.cutPanelDetailsTitle")}
          </h3>
          <div className="absolute top-4 right-4 p-2 border border-gray-300 rounded-md bg-gray-50 shadow-sm text-center w-32 print:hidden">
            <p className="text-xs font-semibold">
              {qcUser?.emp_id || report.cutting_emp_id}
            </p>
            {qcUser?.image_path ? (
              <img
                src={getImagePath(qcUser.image_path)}
                alt="QC Avatar"
                className="w-12 h-12 rounded-full mx-auto my-1 object-cover border"
              />
            ) : (
              <UserCircle2 className="w-12 h-12 text-gray-400 mx-auto my-1" />
            )}
            <p className="text-[0.6rem] text-gray-600 truncate">
              {getLocalizedText(qcUser?.eng_name, qcUser?.kh_name, "")}
            </p>
            <div className="mt-1 text-xs">
              <span className="font-medium">{t("common.result")}:</span>{" "}
              <span className={resultStatus.color}>{resultStatus.status}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs sm:text-sm pr-36">
            <div>
              <strong>{t("cutting.lotNo")}:</strong>{" "}
              {report.lotNo?.join(", ") || "N/A"}
            </div>
            <div>
              <strong>{t("cutting.color")}:</strong> {report.color}
            </div>
            <div>
              <strong>{t("cutting.orderQty")}:</strong> {report.orderQty}
            </div>
            <div>
              <strong>{t("cutting.spreadTable")}:</strong>{" "}
              {report.cuttingTableDetails?.spreadTable || "N/A"}
            </div>
            <div>
              <strong>{t("cutting.planLayers")}:</strong>{" "}
              {report.cuttingTableDetails?.planLayers}
            </div>
            <div>
              <strong>{t("cutting.actualLayers")}:</strong>{" "}
              {report.cuttingTableDetails?.actualLayers}
            </div>
            <div>
              <strong>{t("cutting.totalPcs")}:</strong>{" "}
              {report.cuttingTableDetails?.totalPcs}
            </div>
            <div>
              <strong>{t("cutting.mackerNo")}:</strong>{" "}
              {report.cuttingTableDetails?.mackerNo}
            </div>
          </div>
          <h4 className="text-sm font-semibold text-gray-600 mt-4 mb-2">
            {t("cutting.markerRatio")}
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-50">
                  {report.mackerRatio?.map((mr) => (
                    <th
                      key={mr.index}
                      className="border border-gray-300 p-1 text-center"
                    >
                      {mr.markerSize}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {report.mackerRatio?.map((mr) => (
                    <td
                      key={mr.index}
                      className="border border-gray-300 p-1 text-center"
                    >
                      {mr.ratio}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs sm:text-sm mt-4 pr-36">
            <div>
              <strong>{t("cutting.totalBundleQty")}:</strong>{" "}
              {report.totalBundleQty}
            </div>
            <div>
              <strong>{t("cutting.bundleQtyCheck")}:</strong>{" "}
              {report.bundleQtyCheck}
            </div>
            <div>
              <strong>{t("cutting.cuttingBy")}:</strong> {report.cuttingtype}
            </div>
          </div>
        </div>

        {/* Inspection Summary table */}
        <div className="mb-6">
          <h3 className="text-md sm:text-lg font-semibold text-gray-700 mb-2">
            {t("cutting.inspectionSummaryOverall")}
          </h3>
          <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
            <table className="min-w-full border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 sm:p-2 border">{t("cutting.size")}</th>
                  <th className="p-1 sm:p-2 border">
                    {t("cutting.inspectionQty")}
                  </th>
                  <th className="p-1 sm:p-2 border">{t("cutting.pass")}</th>
                  <th className="p-1 sm:p-2 border">{t("cutting.reject")}</th>
                  <th className="p-1 sm:p-2 border">
                    {t("cutting.rejectMeasurements")}
                  </th>
                  <th className="p-1 sm:p-2 border">
                    {t("cutting.rejectDefects")}
                  </th>
                  <th className="p-1 sm:p-2 border">
                    {t("cutting.passRate")} (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {inspectionSummaryData.details.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td className="p-1 sm:p-2 border text-center" rowSpan={2}>
                        {item.size}
                      </td>
                      <td className="p-1 sm:p-2 border text-center">
                        {item.inspectedQty.total}
                      </td>
                      <td className="p-1 sm:p-2 border text-center">
                        {item.pass.total}
                      </td>
                      <td className="p-1 sm:p-2 border text-center">
                        {item.reject.total}
                      </td>
                      <td className="p-1 sm:p-2 border text-center">
                        {item.rejectMeasurement.total}
                      </td>
                      <td className="p-1 sm:p-2 border text-center">
                        {item.rejectDefects.total < 0
                          ? 0
                          : item.rejectDefects.total}
                      </td>
                      <td className="p-1 sm:p-2 border text-center">
                        {item.passRate.total.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="text-[0.7rem] text-gray-500 bg-gray-50">
                      <td className="p-1 border text-center">
                        T:{item.inspectedQty.top} M:{item.inspectedQty.middle}{" "}
                        B:{item.inspectedQty.bottom}
                      </td>
                      <td className="p-1 border text-center">
                        T:{item.pass.top} M:{item.pass.middle} B:
                        {item.pass.bottom}
                      </td>
                      <td className="p-1 border text-center">
                        T:{item.reject.top} M:{item.reject.middle} B:
                        {item.reject.bottom}
                      </td>
                      <td className="p-1 border text-center">
                        T:{item.rejectMeasurement.top} M:
                        {item.rejectMeasurement.middle} B:
                        {item.rejectMeasurement.bottom}
                      </td>
                      <td className="p-1 border text-center">
                        T:
                        {item.rejectDefects.top < 0
                          ? 0
                          : item.rejectDefects.top}{" "}
                        M:
                        {item.rejectDefects.middle < 0
                          ? 0
                          : item.rejectDefects.middle}{" "}
                        B:
                        {item.rejectDefects.bottom < 0
                          ? 0
                          : item.rejectDefects.bottom}
                      </td>
                      <td className="p-1 border text-center">
                        T:{item.passRate.top.toFixed(0)}% M:
                        {item.passRate.middle.toFixed(0)}% B:
                        {item.passRate.bottom.toFixed(0)}%
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot className="font-bold bg-gray-100">
                <tr>
                  <td className="p-1 sm:p-2 border text-center" rowSpan={2}>
                    {t("common.total")}
                  </td>
                  <td className="p-1 sm:p-2 border text-center">
                    {inspectionSummaryData.totals.inspectedQty.total}
                  </td>
                  <td className="p-1 sm:p-2 border text-center">
                    {inspectionSummaryData.totals.pass.total}
                  </td>
                  <td className="p-1 sm:p-2 border text-center">
                    {inspectionSummaryData.totals.reject.total}
                  </td>
                  <td className="p-1 sm:p-2 border text-center">
                    {inspectionSummaryData.totals.rejectMeasurement.total}
                  </td>
                  <td className="p-1 sm:p-2 border text-center">
                    {inspectionSummaryData.totals.rejectDefects.total < 0
                      ? 0
                      : inspectionSummaryData.totals.rejectDefects.total}
                  </td>
                  <td className="p-1 sm:p-2 border text-center">
                    {inspectionSummaryData.totals.passRate.total.toFixed(2)}
                  </td>
                </tr>
                <tr className="text-[0.7rem] text-gray-500 font-semibold">
                  <td className="p-1 border text-center">
                    T:{inspectionSummaryData.totals.inspectedQty.top} M:
                    {inspectionSummaryData.totals.inspectedQty.middle} B:
                    {inspectionSummaryData.totals.inspectedQty.bottom}
                  </td>
                  <td className="p-1 border text-center">
                    T:{inspectionSummaryData.totals.pass.top} M:
                    {inspectionSummaryData.totals.pass.middle} B:
                    {inspectionSummaryData.totals.pass.bottom}
                  </td>
                  <td className="p-1 border text-center">
                    T:{inspectionSummaryData.totals.reject.top} M:
                    {inspectionSummaryData.totals.reject.middle} B:
                    {inspectionSummaryData.totals.reject.bottom}
                  </td>
                  <td className="p-1 border text-center">
                    T:{inspectionSummaryData.totals.rejectMeasurement.top} M:
                    {inspectionSummaryData.totals.rejectMeasurement.middle} B:
                    {inspectionSummaryData.totals.rejectMeasurement.bottom}
                  </td>
                  <td className="p-1 border text-center">
                    T:
                    {inspectionSummaryData.totals.rejectDefects.top < 0
                      ? 0
                      : inspectionSummaryData.totals.rejectDefects.top}{" "}
                    M:
                    {inspectionSummaryData.totals.rejectDefects.middle < 0
                      ? 0
                      : inspectionSummaryData.totals.rejectDefects.middle}{" "}
                    B:
                    {inspectionSummaryData.totals.rejectDefects.bottom < 0
                      ? 0
                      : inspectionSummaryData.totals.rejectDefects.bottom}
                  </td>
                  <td className="p-1 border text-center">
                    T:{inspectionSummaryData.totals.passRate.top.toFixed(0)}% M:
                    {inspectionSummaryData.totals.passRate.middle.toFixed(0)}%
                    B:{inspectionSummaryData.totals.passRate.bottom.toFixed(0)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Measurement Details table */}
        <div className="mb-6">
          <h3 className="text-md sm:text-lg font-semibold text-gray-700 mb-2">
            {t("cutting.measurementDetails")}{" "}
            <span className="text-xs text-gray-500 ml-2">
              ({t("cutting.tolerance")}:{" "}
              {report.inspectionData[0]?.tolerance.min} /{" "}
              {report.inspectionData[0]?.tolerance.max})
            </span>
          </h3>
          {processedMeasurementData.data.length > 0 ? (
            <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
              <table className="min-w-full border-collapse text-xs table-fixed">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-1 border sticky bg-gray-100 left-0 z-10 w-16">
                      {t("cutting.size")}
                    </th>
                    <th className="p-1 border w-16">{t("cutting.bundleNo")}</th>
                    <th className="p-1 border w-28">{t("cutting.partName")}</th>
                    <th className="p-1 border w-32">
                      {t("cutting.measurementPoint")}
                    </th>
                    {processedMeasurementData.headers.map((h) => (
                      <th key={h} className="p-1 border w-12">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processedMeasurementData.data.map((row, rowIndex) => {
                    const showSize = row.size !== lastSize;
                    if (showSize) lastSize = row.size;
                    const showBundleNo =
                      showSize || row.bundleNo !== lastBundleNo;
                    if (showBundleNo) lastBundleNo = row.bundleNo;
                    const sizeRowSpan = showSize
                      ? processedMeasurementData.data.filter(
                          (r) => r.size === row.size
                        ).length
                      : 1;
                    const bundleRowSpan = showBundleNo
                      ? processedMeasurementData.data.filter(
                          (r) =>
                            r.size === row.size && r.bundleNo === row.bundleNo
                        ).length
                      : 1;
                    return (
                      <tr key={rowIndex}>
                        {showSize && (
                          <td
                            className="p-1 border text-center align-middle sticky bg-white left-0 z-10"
                            rowSpan={sizeRowSpan}
                          >
                            {row.size}
                          </td>
                        )}
                        {showBundleNo && (
                          <td
                            className="p-1 border text-center align-middle"
                            rowSpan={bundleRowSpan}
                          >
                            {row.bundleNo}
                          </td>
                        )}
                        <td className="p-1 border">{row.partName}</td>
                        <td className="p-1 border">{row.measurementPoint}</td>
                        {processedMeasurementData.headers.map((pcsName) => {
                          const value = row.values[pcsName];
                          const isFail =
                            row.tolerance &&
                            typeof value === "number" &&
                            (value < row.tolerance.min ||
                              value > row.tolerance.max);
                          return (
                            <td
                              key={pcsName}
                              className={`p-1 border text-center ${
                                isFail ? "bg-red-100" : "bg-green-100"
                              }`}
                            >
                              {decimalToFraction(value)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              {t("cutting.noMeasurementDataAvailable")}
            </p>
          )}
        </div>

        {/* Fabric Defects table */}
        <div className="mb-6">
          <h3 className="text-md sm:text-lg font-semibold text-gray-700 mb-2">
            {t("cutting.fabricDefectsTitle")}
          </h3>
          {processedDefectData.length > 0 ? (
            <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
              <table className="min-w-full border-collapse text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-1 border">{t("cutting.size")}</th>
                    <th className="p-1 border">{t("cutting.bundleNo")}</th>
                    <th className="p-1 border">{t("cutting.partName")}</th>
                    <th className="p-1 border">{t("cutting.defectDetails")}</th>
                  </tr>
                </thead>
                <tbody>
                  {processedDefectData.map((row, rowIndex) => {
                    const showSize = row.size !== lastDefectSize;
                    if (showSize) lastDefectSize = row.size;
                    const showBundleNo =
                      showSize || row.bundleNo !== lastDefectBundleNo;
                    if (showBundleNo) lastDefectBundleNo = row.bundleNo;
                    const sizeRowSpan = showSize
                      ? processedDefectData.filter((r) => r.size === row.size)
                          .length
                      : 1;
                    const bundleRowSpan = showBundleNo
                      ? processedDefectData.filter(
                          (r) =>
                            r.size === row.size && r.bundleNo === row.bundleNo
                        ).length
                      : 1;
                    return (
                      <tr key={rowIndex}>
                        {showSize && (
                          <td
                            className="p-1 border text-center align-middle"
                            rowSpan={sizeRowSpan}
                          >
                            {row.size}
                          </td>
                        )}
                        {showBundleNo && (
                          <td
                            className="p-1 border text-center align-middle"
                            rowSpan={bundleRowSpan}
                          >
                            {row.bundleNo}
                          </td>
                        )}
                        <td className="p-1 border">{row.partName}</td>
                        <td className="p-1 border align-top">
                          {Object.entries(row.defectsByPcs).map(
                            ([pcs, defects]) => (
                              <div key={pcs}>
                                <strong>{pcs}:</strong>{" "}
                                {defects
                                  .map((d) => `${d.displayName} (${d.qty})`)
                                  .join(", ")}
                              </div>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              {
                (t("cutting.noFabricDefectsReported"),
                "No fabric defects reported.")
              }
            </p>
          )}
        </div>
        {/* Cutting Issues table */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-md sm:text-lg font-semibold text-gray-700 mb-2">
            {t("cutting.cuttingIssuesTitle")}
          </h3>
          {report.inspectionData.some(
            (sd) => sd.cuttingDefects?.issues?.length > 0
          ) ? (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-1 border">{t("cutting.size")}</th>
                    <th className="p-1 border">{t("cutting.defectName")}</th>
                    <th className="p-1 border">{t("cutting.remarks")}</th>
                    <th className="p-1 border">{t("cutting.evidence")}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.inspectionData.flatMap((entry) =>
                    entry.cuttingDefects?.issues?.map((issue, idx) => (
                      <tr key={`${entry.inspectedSize}-${idx}`}>
                        <td className="p-1 border text-center">
                          {entry.inspectedSize}
                        </td>
                        <td className="p-1 border">
                          {getLocalizedText(
                            issue.cuttingdefectName,
                            issue.cuttingdefectNameKhmer
                          )}
                        </td>
                        <td className="p-1 border whitespace-pre-wrap">
                          {issue.remarks}
                        </td>
                        <td className="p-1 border">
                          <div className="flex flex-wrap gap-1">
                            {issue.imageData?.map(
                              (img, i) =>
                                img.path && (
                                  <a
                                    href={getImagePath(img.path)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    key={i}
                                  >
                                    <img
                                      src={getImagePath(img.path)}
                                      alt={`Evidence ${i + 1}`}
                                      className="max-w-[60px] max-h-[60px] object-contain border hover:opacity-75"
                                    />
                                  </a>
                                )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-500 mb-3">
              {
                (t("cutting.noSpecificIssuesReportedOverall"),
                "No specific cutting issues reported across all sizes.")
              }
            </p>
          )}

          {/* ADDED BACK: Logic to display additional comments and images */}
          {report.inspectionData.map(
            (sizeEntry, index) =>
              (sizeEntry.cuttingDefects?.additionalComments ||
                sizeEntry.cuttingDefects?.additionalImages?.length > 0) && (
                <div
                  key={`add-${index}`}
                  className="mt-3 pt-3 border-t border-dashed"
                >
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    {t("cutting.additionalInfoForSize")}:{" "}
                    {sizeEntry.inspectedSize}
                  </p>
                  {sizeEntry.cuttingDefects.additionalComments && (
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-gray-600 mb-1">
                        {t("cutting.additionalComments")}
                      </h4>
                      <p className="text-xs text-gray-700 p-2 border bg-gray-50 rounded whitespace-pre-wrap">
                        {sizeEntry.cuttingDefects.additionalComments}
                      </p>
                    </div>
                  )}
                  {sizeEntry.cuttingDefects.additionalImages?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-1">
                        {t("cutting.additionalImages")}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {sizeEntry.cuttingDefects.additionalImages.map(
                          (img, imgIdx) =>
                            img.path && (
                              <a
                                href={getImagePath(img.path)}
                                target="_blank"
                                rel="noopener noreferrer"
                                key={imgIdx}
                              >
                                <img
                                  src={getImagePath(img.path)}
                                  alt={`${t("cutting.additionalImage")} ${
                                    img.no || imgIdx + 1
                                  }`}
                                  className="max-w-[100px] max-h-[100px] object-contain border rounded hover:opacity-75"
                                />
                              </a>
                            )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// Main Component for Viewing Reports
// ====================================================================
const CuttingReportQCView = ({
  initialReportId,
  onBackToList,
  fabricDefectsMaster = []
}) => {
  const { t, i18n } = useTranslation();

  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: null,
    moNo: "",
    tableNo: "", // This is no longer a primary search field but kept for UI
    qcId: ""
  });

  // Main state now holds an array of reports
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State and refs for filter dropdowns
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const moNoDropdownRef = useRef(null);

  const [tableNoSearch, setTableNoSearch] = useState("");
  const [tableNoOptions, setTableNoOptions] = useState([]);
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const tableNoDropdownRef = useRef(null);

  const [qcInspectorOptions, setQcInspectorOptions] = useState([]);
  const [qcUsers, setQcUsers] = useState([]);

  // <--- 3. ADD THIS NEW USE EFFECT (Logic to Auto-Load Report)
  useEffect(() => {
    const urlMoNo = searchParams.get("moNo");
    const urlTableNo = searchParams.get("tableNo");

    if (urlMoNo && urlTableNo) {
      // A. Update the Visual Filters (Inputs)
      setFilters((prev) => ({
        ...prev,
        moNo: urlMoNo,
        tableNo: urlTableNo,
        // Optional: Clear dates so they don't restrict the specific lookup
        startDate: null,
        endDate: null
      }));
      setMoNoSearch(urlMoNo);
      setTableNoSearch(urlTableNo);

      // B. Trigger the API Call Immediately
      const fetchReportFromNotification = async () => {
        setLoading(true);
        setError(null);
        setReports([]);

        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/cutting-inspections/query`,
            {
              params: {
                moNo: urlMoNo,
                tableNo: urlTableNo,
                // Send null/empty dates to ensure backend ignores date filtering for this specific lookup
                startDate: null,
                endDate: null,
                qcId: ""
              },
              withCredentials: true
            }
          );

          if (response.data && response.data.length > 0) {
            setReports(response.data);
          } else {
            setError(t("cutting.reportNotFound") || "Report not found");
          }
        } catch (err) {
          console.error(err);
          setError("Failed to load report from notification link.");
        } finally {
          setLoading(false);
        }
      };

      fetchReportFromNotification();
    }
  }, [searchParams, t]);

  // Add back the effect to load an initial report by ID
  useEffect(() => {
    if (initialReportId) {
      const fetchInitialReport = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/cutting-inspection-report-detail/${initialReportId}`,
            { withCredentials: true }
          );
          if (response.data) {
            setReports([response.data]); // Set the result as an array with one item
            // Pre-fill filters to match the loaded report
            setFilters((prev) => ({
              ...prev,
              moNo: response.data.moNo,
              tableNo: response.data.tableNo,
              qcId: response.data.cutting_emp_id
            }));
            setMoNoSearch(response.data.moNo);
            setTableNoSearch(response.data.tableNo);
          } else {
            setError(t("cutting.reportNotFound"));
          }
        } catch (err) {
          setError(t("cutting.failedToFetchInitialReport"));
        } finally {
          setLoading(false);
        }
      };
      fetchInitialReport();
    }
  }, [initialReportId, t]);

  // Effect to fetch MO numbers based on date range
  useEffect(() => {
    const fetchMoNumbers = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/mo-numbers`,
          {
            params: {
              search: moNoSearch,
              startDate: filters.startDate,
              endDate: filters.endDate
            },
            withCredentials: true
          }
        );
        setMoNoOptions(response.data);
        if (response.data.length > 0 && moNoSearch.trim() !== "") {
          setShowMoNoDropdown(true);
        } else if (moNoSearch.trim() === "") {
          setShowMoNoDropdown(false);
        }
      } catch (error) {
        console.error("Error fetching MO numbers:", error);
      }
    };
    const debounce = setTimeout(fetchMoNumbers, 300);
    return () => clearTimeout(debounce);
  }, [moNoSearch, filters.moNo, filters.startDate, filters.endDate]);

  // Add back the effect to fetch Table numbers when an MO is selected
  useEffect(() => {
    if (!filters.moNo) {
      setTableNoOptions([]);
      return;
    }
    const fetchTableNumbers = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/table-numbers`,
          {
            params: {
              moNo: filters.moNo,
              search: tableNoSearch,
              startDate: filters.startDate,
              endDate: filters.endDate
            },
            withCredentials: true
          }
        );
        setTableNoOptions(response.data);
        if (response.data.length > 0 && tableNoSearch.trim() !== "")
          setShowTableNoDropdown(true);
        else if (tableNoSearch.trim() === "") setShowTableNoDropdown(false);
      } catch (error) {
        console.error("Error fetching table numbers:", error);
      }
    };
    const debounce = setTimeout(fetchTableNumbers, 300);
    return () => clearTimeout(debounce);
  }, [filters.moNo, tableNoSearch, filters.startDate, filters.endDate]);

  // Effect to fetch all QC inspectors for the filter dropdown
  useEffect(() => {
    const fetchQcInspectors = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/qc-inspectors`,
          { withCredentials: true }
        );
        setQcInspectorOptions(response.data);
        // Fetch full details for all potential users
        const userPromises = response.data.map((qc) =>
          axios.get(`${API_BASE_URL}/api/users/${qc.emp_id}`)
        );
        const userResults = await Promise.all(userPromises);
        setQcUsers(userResults.map((res) => res.data));
      } catch (error) {
        console.error("Error fetching QC inspectors:", error);
      }
    };
    fetchQcInspectors();
  }, []);

  // Effect to handle clicking outside of dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Effect to handle clicking outside dropdowns (add tableNoDropdownRef)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
      // MODIFICATION 4: Add logic for table number dropdown
      if (
        tableNoDropdownRef.current &&
        !tableNoDropdownRef.current.contains(event.target)
      ) {
        setShowTableNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handler for updating date filters
  const handleDateChange = (name, date) => {
    const startDateOnly = new Date(filters.startDate).setHours(0, 0, 0, 0);
    const endDateOnly = date ? new Date(date).setHours(0, 0, 0, 0) : null;

    if (name === "endDate" && endDateOnly && endDateOnly < startDateOnly) {
      Swal.fire({
        icon: "warning",
        title: t("common.invalidDateRange"),
        text: t("common.endDateCannotBeBeforeStartDate")
      });
      return;
    }
    // When date changes, reset the MO number to force re-selection
    setFilters((prev) => ({ ...prev, [name]: date, moNo: "", tableNo: "" }));
    setMoNoSearch("");
    setReports([]); // Clear old results
  };

  // Handler for text input filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // handleSearch to pass the optional tableNo
  const handleSearch = async () => {
    if (!filters.moNo) {
      Swal.fire({
        icon: "warning",
        title: t("cutting.missingInformation"),
        text: "MO Number is required to search."
      });
      return;
    }
    setLoading(true);
    setError(null);
    setReports([]);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-inspections/query`,
        {
          params: {
            moNo: filters.moNo,
            tableNo: filters.tableNo, // Pass the table number
            startDate: filters.startDate,
            endDate: filters.endDate,
            qcId: filters.qcId
          },
          withCredentials: true
        }
      );
      if (response.data && response.data.length > 0) {
        setReports(response.data);
      } else {
        setError("No reports found for the selected criteria.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch reports.");
    } finally {
      setLoading(false);
    }
  };

  // PDF generation handler, passed down to each child report component
  const handleGeneratePDF = async (reportToGenerate, specificQcUser) => {
    if (!reportToGenerate) return;
    Swal.fire({
      title: t("common.generatingPdf"),
      text: t("common.pleaseWait"),
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    try {
      await generateCuttingReportPDF(
        reportToGenerate,
        specificQcUser,
        fabricDefectsMaster,
        i18n
      );
      Swal.close();
    } catch (pdfError) {
      console.error("PDF Generation Error:", pdfError);
      Swal.fire({
        icon: "error",
        title: t("common.pdfError"),
        text: pdfError.message || t("common.failedToGeneratePdf")
      });
    }
  };

  // ADD THIS NEW HANDLER for the "Download All" button
  const handleGenerateMultiPDF = async () => {
    if (!reports || reports.length === 0) {
      Swal.fire(t("common.noDataToGeneratePdf"), "", "warning");
      return;
    }
    Swal.fire({
      title: t("common.generatingPdf"),
      text: t("common.pleaseWait"),
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    try {
      await generateMultiReportPDF(
        reports,
        qcUsers,
        fabricDefectsMaster,
        i18n,
        filters.tableNo
      );
      Swal.close();
    } catch (pdfError) {
      console.error("Multi-PDF Generation Error:", pdfError);
      Swal.fire({
        icon: "error",
        title: t("common.pdfError"),
        text: pdfError.message || t("common.failedToGeneratePdf")
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-100 print:bg-white">
      <div className="max-w-6xl mx-auto mb-6 p-4 border border-gray-200 rounded-lg shadow-sm print:hidden bg-white">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {(t("cutting.filterReport"), "Filter Report")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("common.startDate")}
            </label>
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleDateChange("startDate", date)}
              dateFormat="MM/dd/yyyy"
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("common.endDate")}
            </label>
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleDateChange("endDate", date)}
              dateFormat="MM/dd/yyyy"
              minDate={filters.startDate}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm"
              isClearable
            />
          </div>
          <div ref={moNoDropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700">
              {t("cutting.moNo")}
            </label>
            <input
              type="text"
              value={moNoSearch}
              onChange={(e) => {
                setMoNoSearch(e.target.value);
                setShowMoNoDropdown(true);
              }}
              onFocus={() =>
                moNoOptions.length > 0 && setShowMoNoDropdown(true)
              }
              placeholder={t("cutting.search_mono")}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm"
            />
            {showMoNoDropdown && moNoOptions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                {moNoOptions.map((option) => (
                  <li
                    key={option}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, moNo: option }));
                      setMoNoSearch(option);
                      setShowMoNoDropdown(false);
                    }}
                    className="p-2 hover:bg-blue-100 cursor-pointer text-sm"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div ref={tableNoDropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700">
              {t("cutting.tableNo")} (Optional)
            </label>
            <input
              type="text"
              value={tableNoSearch}
              onChange={(e) => {
                setTableNoSearch(e.target.value);
                setShowTableNoDropdown(true);
              }}
              onFocus={() =>
                tableNoOptions.length > 0 && setShowTableNoDropdown(true)
              }
              className={`mt-1 w-full p-2 border rounded-lg ${
                !filters.moNo && "bg-gray-100"
              }`}
              disabled={!filters.moNo}
            />
            {showTableNoDropdown && tableNoOptions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                {tableNoOptions.map((option) => (
                  <li
                    key={option}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, tableNo: option }));
                      setTableNoSearch(option);
                      setShowTableNoDropdown(false);
                    }}
                    className="p-2 hover:bg-blue-100 cursor-pointer"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("cutting.qcId")}
            </label>
            <select
              name="qcId"
              value={filters.qcId}
              onChange={handleFilterChange}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm text-sm"
            >
              <option value="">{t("common.all")}</option>
              {qcInspectorOptions.map((qc) => (
                <option key={qc.emp_id} value={qc.emp_id}>
                  {qc.emp_id} -{" "}
                  {i18n.language === "km" ? qc.kh_name : qc.eng_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search size={20} />
              )}
              <span className="ml-2">
                {(t("common.viewReportBtn"), "View")}
              </span>
            </button>
            <button
              onClick={handleGenerateMultiPDF}
              className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center shadow-sm"
              disabled={loading || reports.length === 0}
              title="Download All as PDF"
            >
              <Download size={24} />
            </button>
          </div>
        </div>
      </div>
      {/* Add back the "Back to List" button */}
      <div className="max-w-6xl mx-auto mb-4 flex justify-start">
        {onBackToList && (
          <button
            onClick={onBackToList}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center"
          >
            <XCircle size={18} className="mr-2" /> {t("common.backToList")}
          </button>
        )}
      </div>

      <div className="space-y-8">
        {loading && (
          <div className="text-center p-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading Reports...</p>
          </div>
        )}
        {error && !loading && (
          <div className="p-8 text-center bg-white rounded-lg shadow-md">
            <p className="text-red-600 text-xl">{error}</p>
          </div>
        )}

        {!loading &&
          !error &&
          reports.length > 0 &&
          reports.map((reportItem) => (
            <SingleReportView
              key={reportItem._id}
              report={reportItem}
              onGeneratePDF={handleGeneratePDF}
              fabricDefectsMaster={fabricDefectsMaster}
            />
          ))}

        {!loading && !error && reports.length === 0 && (
          <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-md">
            <p>{(t("cutting.noReportSelectedPrompt"), "No Reports found")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CuttingReportQCView;
