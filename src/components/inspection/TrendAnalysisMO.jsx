import React from "react";

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

  // Function to determine background color based on defect rate
  const getBackgroundColor = (rate) => {
    if (rate > 3) return "bg-red-100"; // Light red
    if (rate >= 2) return "bg-yellow-100"; // Yellow
    return "bg-green-100"; // Light green
  };

  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-6 overflow-x-auto">
      <h2 className="text-sm font-medium text-gray-900 mb-2">
        QC2 Defect Rate by Hour
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
            <tr key={moNo} className="hover:bg-gray-50">
              <td className="py-2 px-4 border border-gray-800 text-sm font-bold text-gray-700">
                {moNo}
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
                    }`}
                  >
                    {hasCheckedQty ? `${rate.toFixed(2)}%` : ""}
                  </td>
                );
              })}
              <td
                className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${getBackgroundColor(
                  data[moNo].totalRate
                )}`}
              >
                {data[moNo].totalRate.toFixed(2)}%
              </td>
            </tr>
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
                  }`}
                >
                  {hasCheckedQty ? `${rate.toFixed(2)}%` : ""}
                </td>
              );
            })}
            <td
              className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${getBackgroundColor(
                data.grand?.rate || 0
              )}`}
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
