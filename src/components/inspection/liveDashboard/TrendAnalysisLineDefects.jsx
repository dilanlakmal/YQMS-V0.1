import React, { useMemo, useState } from "react";

const TrendAnalysisLineDefects = ({ data, lineNo }) => {
  // Add lineNo prop
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

  // Sort and filter Line Nos consistently based on lineNo prop
  const lineNos = Object.keys(data)
    .filter((key) => key !== "total" && key !== "grand")
    .filter((key) => (lineNo ? key === lineNo : true)) // Exact match filter
    .sort();

  // Filter hours with at least one non-zero defect rate for any Line No
  const activeHours = Object.keys(hourLabels).filter((hour) =>
    lineNos.some((lineNo) => {
      const moNos = Object.keys(data[lineNo] || {});
      return moNos.some((moNo) =>
        (data[lineNo][moNo][hour]?.defects || []).some(
          (defect) => (defect.rate || 0) > 0
        )
      );
    })
  );

  // State for expanded rows (Line No)
  const [expandedLines, setExpandedLines] = useState({});

  // Toggle expansion for Line No
  const toggleLine = (lineNo) =>
    setExpandedLines((prev) => ({ ...prev, [lineNo]: !prev[lineNo] }));

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

  // Memoized defect trends by Line No (aggregated across MOs)
  const defectTrendsByLine = useMemo(() => {
    const trends = {};
    lineNos.forEach((lineNo) => {
      const defectsByName = {};
      let totalCheckedQty = 0;

      const moNos = Object.keys(data[lineNo] || {});
      moNos.forEach((moNo) => {
        if (moNo !== "totalRate") {
          activeHours.forEach((hour) => {
            const hourData = data[lineNo][moNo][hour] || {
              checkedQty: 0,
              defects: []
            };
            totalCheckedQty += hourData.checkedQty || 0;
            hourData.defects.forEach((defect) => {
              if (!defectsByName[defect.name]) {
                defectsByName[defect.name] = {
                  totalCount: 0,
                  trends: Object.fromEntries(
                    activeHours.map((h) => [h, { count: 0, rate: 0 }])
                  )
                };
              }
              defectsByName[defect.name].trends[hour].count +=
                defect.count || 0;
              defectsByName[defect.name].totalCount += defect.count || 0;
            });
          });
        }
      });

      Object.keys(defectsByName).forEach((defectName) => {
        activeHours.forEach((hour) => {
          const hourCheckedQty = moNos.reduce(
            (sum, moNo) => sum + (data[lineNo][moNo][hour]?.checkedQty || 0),
            0
          );
          const defectCount = defectsByName[defectName].trends[hour].count;
          defectsByName[defectName].trends[hour].rate =
            hourCheckedQty > 0 ? (defectCount / hourCheckedQty) * 100 : 0;
        });
        defectsByName[defectName].totalDefectRate =
          totalCheckedQty > 0
            ? (defectsByName[defectName].totalCount / totalCheckedQty) * 100
            : 0;
      });

      trends[lineNo] = Object.entries(defectsByName)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([defectName, { totalCount, trends, totalDefectRate }]) => ({
          defectName,
          totalCount,
          totalDefectRate,
          trends
        }));
    });
    return trends;
  }, [data, lineNos, activeHours]);

  // Error boundary fallback if data is invalid or no lines match filter
  if (!data || Object.keys(data).length === 0 || lineNos.length === 0) {
    return (
      <div className="mt-6 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-sm font-medium text-gray-900 mb-2">
          QC2 Defect Rate by Line No and Defect - Hour Trend
        </h2>
        <p className="text-gray-700">
          {lineNos.length === 0
            ? "No matching lines found"
            : "No data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-6">
      <h2 className="text-sm font-medium text-gray-900 mb-2">
        QC2 Defect Rate by Line No and Defect - Hour Trend
      </h2>
      <div className="overflow-x-auto">
        <div
          className="overflow-y-auto relative"
          style={{ maxHeight: "800px" }}
        >
          <table className="min-w-full border-collapse table-fixed">
            <thead className="bg-blue-100">
              <tr>
                <th
                  className="py-2 px-4 border border-gray-800 text-left text-sm font-bold text-gray-700 sticky top-0 bg-blue-100 z-20"
                  style={{ minWidth: "200px" }}
                >
                  Line No / Defect
                </th>
                {activeHours.map((hour) => (
                  <th
                    key={`header-${hour}`}
                    className="py-2 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700 sticky top-0 bg-blue-100 z-20"
                    style={{ minWidth: "80px" }}
                  >
                    {hourLabels[hour]}
                  </th>
                ))}
                <th
                  className="py-2 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700 sticky top-0 bg-blue-100 z-20"
                  style={{ minWidth: "80px" }}
                >
                  Total
                </th>
              </tr>
              <tr>
                <th
                  className="py-1 px-4 border border-gray-800 text-left text-sm font-bold text-gray-700 sticky top-[40px] bg-blue-100 z-20"
                  style={{ minWidth: "200px" }}
                ></th>
                {activeHours.map((hour) => (
                  <th
                    key={`period-${hour}`}
                    className="py-1 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700 sticky top-[40px] bg-blue-100 z-20"
                    style={{ minWidth: "80px" }}
                  >
                    {periodLabels[hour]}
                  </th>
                ))}
                <th
                  className="py-1 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700 sticky top-[40px] bg-blue-100 z-20"
                  style={{ minWidth: "80px" }}
                ></th>
              </tr>
            </thead>
            <tbody>
              {lineNos.map((lineNo) => (
                <React.Fragment key={lineNo}>
                  <tr
                    className={`hover:bg-gray-400 ${
                      expandedLines[lineNo] ? "bg-black text-white" : ""
                    }`}
                  >
                    <td
                      className={`py-2 px-4 border border-gray-800 text-sm font-bold ${
                        expandedLines[lineNo] ? "text-white" : "text-gray-700"
                      }`}
                      style={{ minWidth: "200px" }}
                    >
                      L:{lineNo}
                      <button
                        onClick={() => toggleLine(lineNo)}
                        className="ml-2 text-blue-500 hover:text-blue-300 focus:outline-none"
                      >
                        {expandedLines[lineNo] ? "−" : "+"}
                      </button>
                    </td>
                    {activeHours.map((hour) => {
                      const totalRate = Object.values(
                        data[lineNo] || {}
                      ).reduce(
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
                          key={`line-${lineNo}-${hour}`}
                          className={`py-2 px-4 border border-gray-800 text-center text-sm font-medium ${
                            expandedLines[lineNo]
                              ? "bg-black text-white"
                              : hasCheckedQty
                              ? `${getBackgroundColor(rate)} ${getFontColor(
                                  rate
                                )}`
                              : "bg-gray-100 text-gray-700"
                          }`}
                          style={{ minWidth: "80px" }}
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
                      style={{ minWidth: "80px" }}
                    >
                      {(data[lineNo]?.totalRate || 0).toFixed(2)}%
                    </td>
                  </tr>

                  {expandedLines[lineNo] &&
                    (defectTrendsByLine[lineNo] || []).map((defect) => (
                      <tr
                        key={`${lineNo}-${defect.defectName}`}
                        className="bg-gray-50"
                      >
                        <td
                          className="py-2 px-4 pl-8 border border-gray-800 text-sm text-gray-700"
                          style={{ minWidth: "200px" }}
                        >
                          {defect.defectName}
                        </td>
                        {activeHours.map((hour) => {
                          const { rate = 0 } = defect.trends[hour] || {};
                          const hasData = rate > 0;
                          return (
                            <td
                              key={`defect-${lineNo}-${defect.defectName}-${hour}`}
                              className={`py-2 px-4 border border-gray-800 text-center text-sm ${
                                hasData
                                  ? getBackgroundColor(rate)
                                  : "bg-gray-100"
                              } ${
                                hasData ? getFontColor(rate) : "text-gray-700"
                              }`}
                              style={{ minWidth: "80px" }}
                            >
                              {hasData ? `${rate.toFixed(2)}%` : ""}
                            </td>
                          );
                        })}
                        <td
                          className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${getBackgroundColor(
                            defect.totalDefectRate || 0
                          )} ${getFontColor(defect.totalDefectRate || 0)}`}
                          style={{ minWidth: "80px" }}
                        >
                          {(defect.totalDefectRate || 0).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}

              <tr className="bg-blue-100 font-bold">
                <td
                  className="py-2 px-4 border border-gray-800 text-sm font-bold text-gray-700"
                  style={{ minWidth: "200px" }}
                >
                  Total
                </td>
                {activeHours.map((hour) => {
                  const { rate = 0, hasCheckedQty = false } =
                    data.total?.[hour] || {};
                  return (
                    <td
                      key={`total-${hour}`}
                      className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${
                        hasCheckedQty ? getBackgroundColor(rate) : "bg-white"
                      } ${
                        hasCheckedQty ? getFontColor(rate) : "text-gray-700"
                      }`}
                      style={{ minWidth: "80px" }}
                    >
                      {hasCheckedQty ? `${rate.toFixed(2)}%` : ""}
                    </td>
                  );
                })}
                <td
                  className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${getBackgroundColor(
                    data.grand?.rate || 0
                  )} ${getFontColor(data.grand?.rate || 0)}`}
                  style={{ minWidth: "80px" }}
                >
                  {(data.grand?.rate || 0).toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysisLineDefects;
