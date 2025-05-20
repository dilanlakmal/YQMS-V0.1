// src/components/inspection/cutting/report/ReportSizeSummaryTable.jsx
import React from "react";
import { useTranslation } from "react-i18next";

const ReportSizeSummaryTable = ({ bundleInspectionData, inspectedSize }) => {
  const { t, i18n } = useTranslation();

  if (!bundleInspectionData || bundleInspectionData.length === 0) return null;

  const getPartNameDisplay = (part) => {
    if (i18n.language === "km" && part.partNameKhmer) return part.partNameKhmer;
    // Add Chinese or other languages if needed
    return part.partName;
  };

  return (
    <div className="mt-4">
      <h4 className="text-md font-semibold text-gray-700 mb-2">
        {t("cutting.sizeSummaryFor")} {inspectedSize}
      </h4>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-1">
                {t("cutting.bundleNo")}
              </th>
              <th className="border border-gray-300 p-1">
                {t("cutting.serialLetter")}
              </th>
              <th className="border border-gray-300 p-1">
                {t("cutting.partName")}
              </th>
              <th className="border border-gray-300 p-1">
                {t("cutting.totalPcs")}
              </th>
              <th className="border border-gray-300 p-1">
                {t("cutting.pass")}
              </th>
              <th className="border border-gray-300 p-1">
                {t("cutting.reject")}
              </th>
              <th className="border border-gray-300 p-1">
                {t("cutting.rejectMeasurements")}
              </th>
              <th className="border border-gray-300 p-1">
                {t("cutting.rejectDefects")}
              </th>
              <th className="border border-gray-300 p-1">
                {t("cutting.passRate")} (%)
              </th>
            </tr>
          </thead>
          <tbody>
            {bundleInspectionData.map((bundle) =>
              bundle.measurementInsepctionData.map((part, partIndex) => {
                // Calculate total Pcs, Pass, Reject for this specific part across T/M/B for this bundle
                // This requires summing up based on bundle.pcs, bundle.pass, bundle.reject for this part.
                // The schema stores pcs, pass, reject at bundle level (T/M/B totals for all parts in bundle).
                // For part-specific summary, we need to infer or adjust logic.
                // For now, let's assume the bundle data refers to the sum for *all* its parts.
                // A more precise breakdown would require schema changes or complex client-side logic based on number of parts.

                // Simplified approach: Show bundle-level stats repeated for each part in the bundle for now
                // Or, if measurementInsepctionData has its own stats, use that.
                // The current schema has bundle.pcs, bundle.pass, bundle.reject which are totals for *that bundle*.
                // If a bundle has multiple parts, these totals apply to the sum of those parts.
                // Let's assume the provided `bundle.pcs`, `bundle.pass`, etc. are for the *entire bundle*.
                // To display per part, we'd ideally have per-part stats or divide bundle stats by num parts (approximation).

                // Let's use the bundle-level stats for now, and show T/M/B breakdown of those.
                // This row will represent the part within the bundle.
                const bundleTotalPcs =
                  bundle.pcs.top + bundle.pcs.middle + bundle.pcs.bottom;
                const bundleTotalPass =
                  bundle.pass.top + bundle.pass.middle + bundle.pass.bottom;
                const bundleTotalReject =
                  bundle.reject.top +
                  bundle.reject.middle +
                  bundle.reject.bottom;
                const bundleTotalRejectMeasurement =
                  bundle.rejectMeasurement.top +
                  bundle.rejectMeasurement.middle +
                  bundle.rejectMeasurement.bottom;
                const bundleTotalRejectDefects =
                  bundle.rejectGarment.top +
                  bundle.rejectGarment.middle +
                  bundle.rejectGarment.bottom;
                // const bundleTotalRejectDefects =
                //   bundleTotalReject - bundleTotalRejectMeasurement;
                const bundlePassRate =
                  bundleTotalPcs > 0
                    ? ((bundleTotalPass / bundleTotalPcs) * 100).toFixed(2)
                    : 0;

                return (
                  <React.Fragment key={`${bundle.bundleNo}-${part.partName}`}>
                    <tr>
                      <td
                        className="border border-gray-300 p-1 text-center"
                        rowSpan={2}
                      >
                        {bundle.bundleNo}
                      </td>
                      <td
                        className="border border-gray-300 p-1 text-center"
                        rowSpan={2}
                      >
                        {bundle.serialLetter}
                      </td>
                      <td className="border border-gray-300 p-1" rowSpan={2}>
                        {getPartNameDisplay(part)} ({part.partNo})
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        {bundleTotalPcs}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        {bundleTotalPass}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        {bundleTotalReject}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        {bundleTotalRejectMeasurement}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        {bundleTotalRejectDefects < 0
                          ? 0
                          : bundleTotalRejectDefects}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        {bundlePassRate}
                      </td>
                    </tr>
                    <tr
                      className="text-gray-600"
                      style={{ fontSize: "0.7rem" }}
                    >
                      <td className="border border-gray-300 p-1 text-center">
                        T:{bundle.pcs.top}, M:{bundle.pcs.middle}, B:
                        {bundle.pcs.bottom}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        T:{bundle.pass.top}, M:{bundle.pass.middle}, B:
                        {bundle.pass.bottom}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        T:{bundle.reject.top}, M:{bundle.reject.middle}, B:
                        {bundle.reject.bottom}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        T:{bundle.rejectMeasurement.top}, M:
                        {bundle.rejectMeasurement.middle}, B:
                        {bundle.rejectMeasurement.bottom}
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        T:{bundle.rejectGarment.top}, M:
                        {bundle.rejectGarment.middle}, B:
                        {bundle.rejectGarment.bottom}
                      </td>

                      <td className="border border-gray-300 p-1 text-center">
                        T:{bundle.passrate.top.toFixed(0)}% M:
                        {bundle.passrate.middle.toFixed(0)}% B:
                        {bundle.passrate.bottom.toFixed(0)}%
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportSizeSummaryTable;
