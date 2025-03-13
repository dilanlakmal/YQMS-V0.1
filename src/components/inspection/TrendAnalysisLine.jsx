import React, { useMemo, useState } from "react";

const TrendAnalysisLine = ({ data }) => {
  // Define hour headers from 6-7 AM to 8-9 PM
  const hourLabels = {
    "07:00": "6-7",
    "08:00": "7-8",
    "09:00": "8-9",
    "10:00": "9-10",
    "11:00": "10-11",
    "12:00": "11-12",
    "13:00": "12-1",
    "14:00": "1-2",
    "15:00": "2-3",
    "16:00": "3-4",
    "17:00": "4-5",
    "18:00": "5-6",
    "19:00": "6-7",
    "20:00": "7-8",
    "21:00": "8-9"
  };

  const periodLabels = {
    "07:00": "AM",
    "08:00": "AM",
    "09:00": "AM",
    "10:00": "AM",
    "11:00": "AM",
    "12:00": "AM",
    "13:00": "PM",
    "14:00": "PM",
    "15:00": "PM",
    "16:00": "PM",
    "17:00": "PM",
    "18:00": "PM",
    "19:00": "PM",
    "20:00": "PM",
    "21:00": "PM"
  };

  // Sort Line Nos consistently
  const lineNos = Object.keys(data)
    .filter((key) => key !== "total" && key !== "grand")
    .sort();

  // Filter hours with at least one non-zero value for any Line No/MO No
  const activeHours = Object.keys(hourLabels).filter((hour) =>
    lineNos.some((lineNo) => {
      const moNos = Object.keys(data[lineNo] || {});
      return moNos.some((moNo) => (data[lineNo][moNo][hour]?.rate || 0) > 0);
    })
  );

  // State for expanded rows (Line No and MO No)
  const [expandedLines, setExpandedLines] = useState({});
  const [expandedMos, setExpandedMos] = useState({});

  // Toggle expansion for Line No
  const toggleLine = (lineNo) =>
    setExpandedLines((prev) => ({ ...prev, [lineNo]: !prev[lineNo] }));

  // Toggle expansion for MO No within a Line No
  const toggleMo = (lineNo, moNo) =>
    setExpandedMos((prev) => ({
      ...prev,
      [`${lineNo}-${moNo}`]: !prev[`${lineNo}-${moNo}`]
    }));

  // Function to determine background color based on defect rate
  const getBackgroundColor = (rate) => {
    if (rate > 3) return "bg-red-100"; // Light red
    if (rate >= 2) return "bg-yellow-100"; // Yellow
    return "bg-green-100"; // Light green
  };

  // Function to determine font color based on defect rate
  const getFontColor = (rate) => {
    if (rate > 3) return "text-red-800"; // Dark red
    if (rate >= 2) return "text-orange-800"; // Dark orange
    return "text-green-800"; // Dark green
  };

  // Function to check for 3 consecutive periods with defect rate > 3% (Critical)
  const isCritical = (lineNo, moNo) => {
    const rates = activeHours.map((hour) => {
      const { rate = 0, hasCheckedQty = false } =
        data[lineNo]?.[moNo]?.[hour] || {};
      return hasCheckedQty ? rate : 0;
    });

    for (let i = 0; i <= rates.length - 3; i++) {
      if (rates[i] > 3 && rates[i + 1] > 3 && rates[i + 2] > 3) return true;
    }
    return false;
  };

  // Function to check for 2 consecutive periods with defect rate > 3% (Warning)
  const isWarning = (lineNo, moNo) => {
    const rates = activeHours.map((hour) => {
      const { rate = 0, hasCheckedQty = false } =
        data[lineNo]?.[moNo]?.[hour] || {};
      return hasCheckedQty ? rate : 0;
    });

    for (let i = 0; i <= rates.length - 2; i++) {
      if (rates[i] > 3 && rates[i + 1] > 3) return true;
    }
    return false;
  };

  // Memoized defect trends by Line No and MO No
  const defectTrendsByLineMo = useMemo(() => {
    const trends = {};
    lineNos.forEach((lineNo) => {
      trends[lineNo] = {};
      const moNos = Object.keys(data[lineNo] || {}).sort();
      moNos.forEach((moNo) => {
        const defectsByName = {};
        const totalCheckedQty = activeHours.reduce(
          (sum, hour) => sum + (data[lineNo][moNo][hour]?.checkedQty || 0),
          0
        );

        activeHours.forEach((hour) => {
          const hourData = data[lineNo][moNo][hour] || {
            checkedQty: 0,
            defects: []
          };
          hourData.defects.forEach((defect) => {
            if (!defectsByName[defect.name]) {
              defectsByName[defect.name] = { totalCount: 0, trends: {} };
            }
            defectsByName[defect.name].trends[hour] = {
              count: defect.count || 0,
              rate: defect.rate || 0
            };
            defectsByName[defect.name].totalCount += defect.count || 0;
          });
        });

        trends[lineNo][moNo] = Object.entries(defectsByName)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([defectName, { totalCount, trends }]) => ({
            defectName,
            totalDefectRate:
              totalCheckedQty > 0 ? (totalCount / totalCheckedQty) * 100 : 0,
            trends
          }));
      });
    });
    return trends;
  }, [data, lineNos, activeHours]);

  // Add error boundary fallback if data is invalid
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="mt-6 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-sm font-medium text-gray-900 mb-2">
          QC2 Defect Rate by Line No and MO No - Hour Trend
        </h2>
        <p className="text-gray-700">No data available</p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-6 overflow-x-auto">
      <h2 className="text-sm font-medium text-gray-900 mb-2">
        QC2 Defect Rate by Line No and MO No - Hour Trend
      </h2>
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-blue-100">
            <th className="py-2 px-4 border border-gray-800 text-left text-sm font-bold text-gray-700">
              Line No / MO No
            </th>
            {activeHours.map((hour) => (
              <th
                key={hour}
                className="py-2 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700"
              >
                {hourLabels[hour]}
              </th>
            ))}
            <th className="py-2 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700">
              Total
            </th>
          </tr>
          <tr className="bg-blue-100">
            <th className="py-1 px-4 border border-gray-800 text-left text-sm font-bold text-gray-700"></th>
            {activeHours.map((hour) => (
              <th
                key={hour}
                className="py-1 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700"
              >
                {periodLabels[hour]}
              </th>
            ))}
            <th className="py-1 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700"></th>
          </tr>
        </thead>
        <tbody>
          {lineNos.map((lineNo) => (
            <>
              {/* Line No Row */}
              <tr
                className={`hover:bg-blue-100 ${
                  expandedLines[lineNo] ? "bg-black text-white" : ""
                }`}
              >
                <td
                  className={`py-2 px-4 border border-gray-800 text-sm font-bold ${
                    expandedLines[lineNo] ? "text-white" : "text-gray-700"
                  }`}
                >
                  {lineNo}
                  <button
                    onClick={() => toggleLine(lineNo)}
                    className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                  >
                    {expandedLines[lineNo] ? "−" : "+"}
                  </button>
                </td>
                {activeHours.map((hour) => {
                  const totalRate = Object.values(data[lineNo] || {}).reduce(
                    (sum, moData) =>
                      sum +
                      (moData[hour]?.rate || 0) *
                        (moData[hour]?.checkedQty || 0),
                    0
                  );
                  const totalCheckedQty = Object.values(
                    data[lineNo] || {}
                  ).reduce(
                    (sum, moData) => sum + (moData[hour]?.checkedQty || 0),
                    0
                  );
                  const rate =
                    totalCheckedQty > 0 ? totalRate / totalCheckedQty : 0;
                  const hasCheckedQty = totalCheckedQty > 0;
                  return (
                    <td
                      key={hour}
                      className={`py-2 px-4 border border-gray-800 text-center text-sm font-medium ${
                        expandedLines[lineNo]
                          ? "bg-black text-white"
                          : hasCheckedQty
                          ? `${getBackgroundColor(rate)} ${getFontColor(rate)}`
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {hasCheckedQty ? `${rate.toFixed(2)}%` : ""}
                    </td>
                  );
                })}
                <td
                  className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${
                    expandedLines[lineNo]
                      ? "bg-black text-white"
                      : `${getBackgroundColor(
                          data[lineNo]?.totalRate || 0
                        )} ${getFontColor(data[lineNo]?.totalRate || 0)}`
                  }`}
                >
                  {(data[lineNo]?.totalRate || 0).toFixed(2)}%
                </td>
              </tr>

              {/* MO No Rows (Expanded) */}
              {/* MO No Rows (Expanded) */}
              {expandedLines[lineNo] &&
                Object.keys(data[lineNo] || {})
                  .sort()
                  .map((moNo) => (
                    <>
                      <tr
                        className={`hover:bg-gray-50 ${
                          expandedMos[`${lineNo}-${moNo}`]
                            ? "bg-gray-800 text-white"
                            : ""
                        }`}
                      >
                        <td
                          className={`py-2 px-4 pl-8 border border-gray-800 text-sm font-bold ${
                            expandedMos[`${lineNo}-${moNo}`]
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          {moNo}
                          <button
                            onClick={() => toggleMo(lineNo, moNo)}
                            className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                          >
                            {expandedMos[`${lineNo}-${moNo}`] ? "−" : "+"}
                          </button>
                          {isCritical(lineNo, moNo) && (
                            <span className="inline-block ml-2 px-2 py-1 bg-red-100 border border-red-800 text-red-800 text-xs font-bold rounded">
                              Critical
                            </span>
                          )}
                          {!isCritical(lineNo, moNo) &&
                            isWarning(lineNo, moNo) && (
                              <span className="inline-block ml-2 px-2 py-1 bg-yellow-100 border border-yellow-800 text-yellow-800 text-xs font-bold rounded">
                                Warning
                              </span>
                            )}
                        </td>
                        {activeHours.map((hour) => {
                          const { rate = 0, hasCheckedQty = false } =
                            data[lineNo]?.[moNo]?.[hour] || {};
                          return (
                            <td
                              key={hour}
                              className={`py-2 px-4 border border-gray-800 text-center text-sm font-medium ${
                                expandedMos[`${lineNo}-${moNo}`]
                                  ? "bg-gray-800 text-white"
                                  : hasCheckedQty
                                  ? `${getBackgroundColor(rate)} ${getFontColor(
                                      rate
                                    )}`
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {hasCheckedQty ? `${rate.toFixed(2)}%` : ""}
                            </td>
                          );
                        })}
                        <td
                          className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${
                            expandedMos[`${lineNo}-${moNo}`]
                              ? "bg-gray-800 text-white"
                              : `${getBackgroundColor(
                                  data[lineNo]?.[moNo]?.totalRate || 0
                                )} ${getFontColor(
                                  data[lineNo]?.[moNo]?.totalRate || 0
                                )}`
                          }`}
                        >
                          {(data[lineNo]?.[moNo]?.totalRate || 0).toFixed(2)}%
                        </td>
                      </tr>

                      {/* Defect Rows (Expanded) */}
                      {expandedMos[`${lineNo}-${moNo}`] &&
                        (defectTrendsByLineMo[lineNo]?.[moNo] || []).map(
                          (defect) => (
                            <tr
                              key={`${lineNo}-${moNo}-${defect.defectName}`}
                              className="bg-gray-50"
                            >
                              <td className="py-2 px-4 pl-12 border border-gray-800 text-sm text-gray-700">
                                {defect.defectName}
                              </td>
                              {activeHours.map((hour) => {
                                const { rate = 0 } = defect.trends[hour] || {};
                                const hasData = rate > 0;
                                return (
                                  <td
                                    key={hour}
                                    className={`py-2 px-4 border border-gray-800 text-center text-sm ${
                                      hasData
                                        ? getBackgroundColor(rate)
                                        : "bg-gray-100"
                                    } ${
                                      hasData
                                        ? getFontColor(rate)
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {hasData ? `${rate.toFixed(2)}%` : ""}
                                  </td>
                                );
                              })}
                              <td
                                className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${getBackgroundColor(
                                  defect.totalDefectRate || 0
                                )} ${getFontColor(
                                  defect.totalDefectRate || 0
                                )}`}
                              >
                                {(defect.totalDefectRate || 0).toFixed(2)}%
                              </td>
                            </tr>
                          )
                        )}
                    </>
                  ))}
            </>
          ))}

          {/* Final Total Row */}
          <tr className="bg-blue-100 font-bold">
            <td className="py-2 px-4 border border-gray-800 text-sm font-bold text-gray-700">
              Total
            </td>
            {activeHours.map((hour) => {
              const { rate = 0, hasCheckedQty = false } =
                data.total?.[hour] || {};
              return (
                <td
                  key={hour}
                  className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${
                    hasCheckedQty ? getBackgroundColor(rate) : "bg-white"
                  } ${hasCheckedQty ? getFontColor(rate) : "text-gray-700"}`}
                >
                  {hasCheckedQty ? `${rate.toFixed(2)}%` : ""}
                </td>
              );
            })}
            <td
              className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${getBackgroundColor(
                data.grand?.rate || 0
              )} ${getFontColor(data.grand?.rate || 0)}`}
            >
              {(data.grand?.rate || 0).toFixed(2)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TrendAnalysisLine;
