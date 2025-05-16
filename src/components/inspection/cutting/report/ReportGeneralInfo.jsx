// src/components/inspection/cutting/report/ReportGeneralInfo.jsx
import React from "react";
import { useTranslation } from "react-i18next";

const ReportGeneralInfo = ({ report }) => {
  const { t } = useTranslation();

  if (!report) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {t("cutting.orderDetails")}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">
                  {t("cutting.buyer")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.buyerStyle")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.color")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.lotNo")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.orderQty")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">{report.buyer}</td>
                <td className="border border-gray-300 p-2">
                  {report.buyerStyle}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.color}
                </td>
                <td className="border border-gray-300 p-2">
                  {report.lotNo?.join(", ")}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.orderQty}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {t("cutting.fabricDetails")}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">
                  {t("cutting.fabricType")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.material")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.rollQty")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.spreadYds")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.unit")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.grossKgs")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.netKgs")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.totalTTLRoll")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">
                  {report.fabricDetails?.fabricType}
                </td>
                <td className="border border-gray-300 p-2">
                  {report.fabricDetails?.material}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.fabricDetails?.rollQty}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.fabricDetails?.spreadYds}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.fabricDetails?.unit}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.fabricDetails?.grossKgs}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.fabricDetails?.netKgs}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.fabricDetails?.totalTTLRoll}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {t("cutting.cuttingTableDetails")}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">
                  {t("cutting.spreadTable")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.spreadTableNo")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.planLayers")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.actualLayers")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.totalPcs")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.mackerNo")}
                </th>
                <th className="border border-gray-300 p-2">
                  {t("cutting.mackerLength")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-center">
                  {report.cuttingTableDetails?.spreadTable}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.cuttingTableDetails?.spreadTableNo}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.cuttingTableDetails?.planLayers}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.cuttingTableDetails?.actualLayers}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.cuttingTableDetails?.totalPcs}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.cuttingTableDetails?.mackerNo}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {report.cuttingTableDetails?.mackerLength}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {t("cutting.markerRatio")}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                {report.mackerRatio?.map((mr) => (
                  <th key={mr.index} className="border border-gray-300 p-2">
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
                    className="border border-gray-300 p-2 text-center"
                  >
                    {mr.ratio}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportGeneralInfo;
