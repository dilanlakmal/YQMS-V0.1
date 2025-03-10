import React, { useMemo, useState } from "react";

const TrendAnalysisMO = ({ data }) => {
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
    "21:00": "8-9",
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
    "21:00": "PM",
  };

  // Sort MO Nos consistently
  const moNos = Object.keys(data)
    .filter((key) => key !== "total" && key !== "grand")
    .sort();

  // Filter hours with at least one non-zero value for any MO No
  const activeHours = Object.keys(hourLabels).filter((hour) => {
    return (
      moNos.some((moNo) => data[moNo][hour]?.rate > 0) ||
      (data.total && data.total[hour]?.rate > 0)
    );
  });

  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState({});

  // Toggle expansion for a specific MO No
  const toggleRow = (moNo) => {
    setExpandedRows((prev) => ({
      ...prev,
      [moNo]: !prev[moNo],
    }));
  };

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
  const isCritical = (moNo) => {
    const rates = activeHours.map((hour) => {
      const { rate, hasCheckedQty } = data[moNo][hour] || {
        rate: 0,
        hasCheckedQty: false,
      };
      return hasCheckedQty ? rate : 0;
    });

    for (let i = 0; i <= rates.length - 3; i++) {
      if (rates[i] > 3 && rates[i + 1] > 3 && rates[i + 2] > 3) {
        return true;
      }
    }
    return false;
  };

  // Function to check for 2 consecutive periods with defect rate > 3% (Warning)
  const isWarning = (moNo) => {
    const rates = activeHours.map((hour) => {
      const { rate, hasCheckedQty } = data[moNo][hour] || {
        rate: 0,
        hasCheckedQty: false,
      };
      return hasCheckedQty ? rate : 0;
    });

    for (let i = 0; i <= rates.length - 2; i++) {
      if (rates[i] > 3 && rates[i + 1] > 3) {
        return true;
      }
    }
    return false;
  };

  // Memoized defect trends to prevent recalculation unless data changes
  const defectTrendsByMoNo = useMemo(() => {
    const trends = {};
    moNos.forEach((moNo) => {
      const defectsByName = {};
      const totalCheckedQty = activeHours.reduce(
        (sum, hour) => sum + (data[moNo][hour]?.checkedQty || 0),
        0
      );

      activeHours.forEach((hour) => {
        const hourData = data[moNo][hour] || { checkedQty: 0, defects: [] };
        hourData.defects.forEach((defect) => {
          if (!defectsByName[defect.name]) {
            defectsByName[defect.name] = { totalCount: 0, trends: {} };
          }
          defectsByName[defect.name].trends[hour] = {
            count: defect.count,
            rate: defect.rate,
          };
          defectsByName[defect.name].totalCount += defect.count;
        });
      });

      trends[moNo] = Object.entries(defectsByName)
        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
        .map(([name, { totalCount, trends }]) => ({
          name,
          totalRate:
            totalCheckedQty > 0 ? (totalCount / totalCheckedQty) * 100 : 0,
          trends,
        }));
    });
    return trends;
  }, [data, moNos, activeHours]);

  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-6 overflow-x-auto">
      <h2 className="text-sm font-medium text-gray-900 mb-2">
        QC2 Defect Rate by MO No - Hour Trend
      </h2>
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-blue-100">
            <th className="py-2 px-4 border border-gray-800 text-left text-sm font-bold text-gray-700">
              MO No
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
          {moNos.map((moNo) => (
            <React.Fragment key={moNo}>
              <tr className="hover:bg-gray-50">
                <td className="py-2 px-4 border border-gray-800 text-sm font-bold text-gray-700">
                  {moNo}
                  <button
                    onClick={() => toggleRow(moNo)}
                    className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                  >
                    {expandedRows[moNo] ? "−" : "+"}
                  </button>
                  {isCritical(moNo) && (
                    <span className="inline-block ml-2 px-2 py-1 bg-red-100 border border-red-800 text-red-800 text-xs font-bold rounded">
                      Critical
                    </span>
                  )}
                  {!isCritical(moNo) && isWarning(moNo) && (
                    <span className="inline-block ml-2 px-2 py-1 bg-yellow-100 border border-yellow-800 text-yellow-800 text-xs font-bold rounded">
                      Warning
                    </span>
                  )}
                </td>
                {activeHours.map((hour) => {
                  const { rate, hasCheckedQty } = data[moNo][hour] || {
                    rate: 0,
                    hasCheckedQty: false,
                  };
                  return (
                    <td
                      key={hour}
                      className={`py-2 px-4 border border-gray-800 text-center text-sm font-medium ${
                        hasCheckedQty ? getBackgroundColor(rate) : "bg-gray-100"
                      } ${
                        hasCheckedQty ? getFontColor(rate) : "text-gray-700"
                      }`}
                    >
                      {hasCheckedQty ? `${rate.toFixed(2)}%` : ""}
                    </td>
                  );
                })}
                <td
                  className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${getBackgroundColor(
                    data[moNo].totalRate
                  )} ${getFontColor(data[moNo].totalRate)}`}
                >
                  {data[moNo].totalRate.toFixed(2)}%
                </td>
              </tr>
              {expandedRows[moNo] && (
                <>
                  {defectTrendsByMoNo[moNo].map((defect) => (
                    <tr key={`${moNo}-${defect.name}`} className="bg-gray-50">
                      <td className="py-2 px-4 pl-8 border border-gray-800 text-sm text-gray-700">
                        {defect.name}
                      </td>
                      {activeHours.map((hour) => {
                        const { rate = 0 } = defect.trends[hour] || {};
                        const hasData = rate > 0;
                        return (
                          <td
                            key={hour}
                            className={`py-2 px-4 border border-gray-800 text-center text-sm ${
                              hasData ? getBackgroundColor(rate) : "bg-gray-100"
                            } ${
                              hasData ? getFontColor(rate) : "text-gray-700"
                            }`}
                          >
                            {hasData ? `${rate.toFixed(2)}%` : ""}
                          </td>
                        );
                      })}
                      <td
                        className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${getBackgroundColor(
                          defect.totalRate
                        )} ${getFontColor(defect.totalRate)}`}
                      >
                        {defect.totalRate.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </React.Fragment>
          ))}
          <tr className="bg-blue-100 font-bold">
            <td className="py-2 px-4 border border-gray-800 text-sm font-bold text-gray-700">
              Total
            </td>
            {activeHours.map((hour) => {
              const { rate, hasCheckedQty } = data.total[hour] || {
                rate: 0,
                hasCheckedQty: false,
              };
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

export default TrendAnalysisMO;
