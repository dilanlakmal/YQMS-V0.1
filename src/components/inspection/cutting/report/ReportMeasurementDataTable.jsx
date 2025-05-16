// src/components/inspection/cutting/report/ReportMeasurementDataTable.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { decimalToFraction } from "../../../../utils/fractionUtils"; // Adjust path if needed

const ReportMeasurementDataTable = ({ partData, bundleNo, tolerance }) => {
  const { t, i18n } = useTranslation();

  if (!partData || !partData.measurementPointsData) return null;

  const getPointNameDisplay = (point) => {
    if (i18n.language === "km" && point.measurementPointNameKhmer)
      return point.measurementPointNameKhmer;
    if (i18n.language === "zh" && point.measurementPointNameChinese)
      return point.measurementPointNameChinese;
    return point.measurementPointName;
  };

  // Collect all unique pcsNames (T1, T2, M1, B1 etc.) to form columns
  const allPcsNames = new Set();
  partData.measurementPointsData.forEach((mp) => {
    mp.measurementValues.forEach((mv) => {
      mv.measurements.forEach((m) => allPcsNames.add(m.pcsName));
    });
  });

  // Custom sort function for T, M, B order
  const sortPcsNames = (a, b) => {
    const prefixOrder = { T: 1, M: 2, B: 3 };
    const prefixA = a.charAt(0).toUpperCase();
    const prefixB = b.charAt(0).toUpperCase();
    const numA = parseInt(a.substring(1));
    const numB = parseInt(b.substring(1));

    if (prefixOrder[prefixA] < prefixOrder[prefixB]) return -1;
    if (prefixOrder[prefixA] > prefixOrder[prefixB]) return 1;

    // If prefixes are the same, sort by number
    return numA - numB;
  };

  const sortedPcsNames = Array.from(allPcsNames).sort(sortPcsNames);

  return (
    <div className="mt-4">
      <h5 className="text-sm font-semibold text-gray-700 mb-1">
        {t("cutting.measurementDataFor")} {t("cutting.bundleNo")}: {bundleNo};{" "}
        {t("cutting.partName")}:{" "}
        {i18n.language === "km" && partData.partNameKhmer
          ? partData.partNameKhmer
          : partData.partName}
      </h5>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-1 sticky left-0 bg-gray-100 z-10 min-w-[150px]">
                {t("cutting.measurementPoint")}
              </th>
              {sortedPcsNames.map((pcsName) => (
                <th
                  key={pcsName}
                  className="border border-gray-300 p-1 min-w-[50px]"
                >
                  {pcsName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partData.measurementPointsData.map((mp, mpIndex) => (
              <tr key={mpIndex} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-1 sticky left-0 bg-white hover:bg-gray-50 z-10">
                  {getPointNameDisplay(mp)}
                </td>
                {sortedPcsNames.map((pcsName) => {
                  let valueDisplay = "-";
                  let cellBgClass = ""; // Default background

                  // Find the measurement value for the current pcsName
                  let foundMeasurement = null;
                  for (const mv of mp.measurementValues) {
                    const measurement = mv.measurements.find(
                      (m) => m.pcsName === pcsName
                    );
                    if (measurement) {
                      foundMeasurement = measurement;
                      break;
                    }
                  }

                  if (foundMeasurement) {
                    valueDisplay = decimalToFraction(
                      foundMeasurement.valuedecimal
                    );
                    if (
                      tolerance &&
                      typeof foundMeasurement.valuedecimal === "number"
                    ) {
                      if (
                        foundMeasurement.valuedecimal < tolerance.min ||
                        foundMeasurement.valuedecimal > tolerance.max
                      ) {
                        cellBgClass = "bg-red-100"; // Outside tolerance
                      } else {
                        cellBgClass = "bg-green-100"; // Within tolerance
                      }
                    }
                  }

                  return (
                    <td
                      key={pcsName}
                      className={`border border-gray-300 p-1 text-center ${cellBgClass}`}
                    >
                      {valueDisplay}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportMeasurementDataTable;
