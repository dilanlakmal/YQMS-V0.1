// src/components/inspection/cutting/report/ReportDefectTable.jsx
import React from "react";
import { useTranslation } from "react-i18next";

const ReportDefectTable = ({ partData, bundleNo }) => {
  const { t, i18n } = useTranslation();

  if (!partData || !partData.fabricDefects) return null;

  // Aggregate defects by pcsName
  const defectsByPcs = {};
  let hasAnyDefects = false;

  partData.fabricDefects.forEach((locationDefects) => {
    locationDefects.defectData.forEach((pcsDefect) => {
      if (pcsDefect.totalDefects > 0) {
        hasAnyDefects = true;
        if (!defectsByPcs[pcsDefect.pcsName]) {
          defectsByPcs[pcsDefect.pcsName] = [];
        }
        pcsDefect.defects.forEach((defect) => {
          // Find existing defect to aggregate count, or add new
          let existing = defectsByPcs[pcsDefect.pcsName].find(
            (d) => d.defectName === defect.defectName
          );
          if (existing) {
            existing.defectQty += defect.defectQty;
          } else {
            defectsByPcs[pcsDefect.pcsName].push({ ...defect });
          }
        });
      }
    });
  });

  const getDefectNameDisplay = (defect) => {
    // Assuming your defect objects might have translations (e.g., defectNameEng, defectNameKhmer)
    if (i18n.language === "km" && defect.defectNameKhmer)
      return defect.defectNameKhmer;
    return defect.defectName; // Fallback to defectName
  };

  if (!hasAnyDefects) {
    return (
      <div className="mt-2 text-xs text-gray-600">
        {t("cutting.defectDetailsFor")} {t("cutting.bundleNo")}: {bundleNo};{" "}
        {t("cutting.partName")}:{" "}
        {i18n.language === "km" && partData.partNameKhmer
          ? partData.partNameKhmer
          : partData.partName}{" "}
        - {t("cutting.noDefectsRecorded")}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <h5 className="text-xs font-semibold text-gray-700 mb-1">
        {t("cutting.defectDetailsFor")} {t("cutting.bundleNo")}: {bundleNo};{" "}
        {t("cutting.partName")}:{" "}
        {i18n.language === "km" && partData.partNameKhmer
          ? partData.partNameKhmer
          : partData.partName}
      </h5>
      <div className="overflow-x-auto">
        <table className="border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-1 min-w-[100px]">
                {t("cutting.pcsName")}
              </th>
              <th className="border border-gray-300 p-1 min-w-[200px]">
                {t("cutting.defectName")}
              </th>
              <th className="border border-gray-300 p-1 min-w-[100px]">
                {t("cutting.defectQty")}
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(defectsByPcs).map(([pcsName, defectsList]) =>
              defectsList.map((defect, index) => (
                <tr key={`${pcsName}-${index}`}>
                  {index === 0 && (
                    <td
                      rowSpan={defectsList.length}
                      className="border border-gray-300 p-1 align-top text-center"
                    >
                      {pcsName}
                    </td>
                  )}
                  <td className="border border-gray-300 p-1">
                    {getDefectNameDisplay(defect)}
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    {defect.defectQty}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportDefectTable;
