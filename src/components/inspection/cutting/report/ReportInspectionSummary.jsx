// src/components/inspection/cutting/report/ReportInspectionSummary.jsx
import React from "react";
import { useTranslation } from "react-i18next";

const ReportInspectionSummary = ({ inspectionData }) => {
  const { t } = useTranslation();

  if (!inspectionData || inspectionData.length === 0) return null;

  const totals = inspectionData.reduce(
    (acc, curr) => {
      acc.totalPcsSize += curr.totalPcsSize || 0;
      acc.totalPass += curr.passSize?.total || 0;
      acc.totalReject += curr.rejectSize?.total || 0;
      acc.totalRejectMeasurement += curr.rejectMeasurementSize?.total || 0;
      // Assuming rejectDefects is total reject - measurement reject
      acc.totalRejectDefects +=
        (curr.rejectSize?.total || 0) -
        (curr.rejectMeasurementSize?.total || 0);
      return acc;
    },
    {
      totalPcsSize: 0,
      totalPass: 0,
      totalReject: 0,
      totalRejectMeasurement: 0,
      totalRejectDefects: 0
    }
  );

  const overallPassRate =
    totals.totalPcsSize > 0
      ? ((totals.totalPass / totals.totalPcsSize) * 100).toFixed(2)
      : 0;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-2">
        {t("cutting.inspectionSummary")}
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">
                {t("cutting.size")}
              </th>
              <th className="border border-gray-300 p-2">
                {t("cutting.totalInspected")}
              </th>
              <th className="border border-gray-300 p-2">
                {t("cutting.totalPass")}
              </th>
              <th className="border border-gray-300 p-2">
                {t("cutting.totalReject")}
              </th>
              <th className="border border-gray-300 p-2">
                {t("cutting.rejectMeasurements")}
              </th>
              <th className="border border-gray-300 p-2">
                {t("cutting.rejectDefects")}
              </th>
              <th className="border border-gray-300 p-2">
                {t("cutting.passRate")} (%)
              </th>
            </tr>
          </thead>
          <tbody>
            {inspectionData.map((data, index) => {
              const rejectDefects =
                (data.rejectSize?.total || 0) -
                (data.rejectMeasurementSize?.total || 0);
              return (
                <tr key={index}>
                  <td className="border border-gray-300 p-2 text-center">
                    {data.inspectedSize}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {data.totalPcsSize}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {data.passSize?.total}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {data.rejectSize?.total}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {data.rejectMeasurementSize?.total}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {rejectDefects < 0 ? 0 : rejectDefects}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {data.passrateSize?.total.toFixed(2)}
                  </td>
                </tr>
              );
            })}
            <tr className="font-bold bg-gray-50">
              <td className="border border-gray-300 p-2 text-center">
                {t("common.total")}
              </td>
              <td className="border border-gray-300 p-2 text-center">
                {totals.totalPcsSize}
              </td>
              <td className="border border-gray-300 p-2 text-center">
                {totals.totalPass}
              </td>
              <td className="border border-gray-300 p-2 text-center">
                {totals.totalReject}
              </td>
              <td className="border border-gray-300 p-2 text-center">
                {totals.totalRejectMeasurement}
              </td>
              <td className="border border-gray-300 p-2 text-center">
                {totals.totalRejectDefects < 0 ? 0 : totals.totalRejectDefects}
              </td>
              <td className="border border-gray-300 p-2 text-center">
                {overallPassRate}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportInspectionSummary;
