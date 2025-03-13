import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../../../config"; // Adjust path as needed

const LiveSummary = ({ filters = {} }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from the /api/qc2-mo-summaries endpoint
  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      console.log("Fetching data with filters:", filters);

      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== "" && value !== undefined && value !== null
        )
      );
      const queryString = new URLSearchParams(activeFilters).toString();
      const url = queryString
        ? `${API_BASE_URL}/api/qc2-mo-summaries?${queryString}`
        : `${API_BASE_URL}/api/qc2-mo-summaries`;

      console.log("Fetching from URL:", url);
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data);
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: Expected an array");
      }
      setSummaryData(data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch summary data");
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();

    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
      reconnection: true
    });
    socket.on("qc2_data_updated", fetchSummaryData);

    return () => {
      socket.off("qc2_data_updated", fetchSummaryData);
      socket.disconnect();
    };
  }, [JSON.stringify(filters)]);

  // Flatten defectArray and calculate defect-specific rates, then sort by rate
  const processDefectDetails = (defectArray, checkedQty) => {
    const defectMap = {};
    defectArray.forEach((defect) => {
      if (defect.defectName && defect.totalCount > 0) {
        defectMap[defect.defectName] =
          (defectMap[defect.defectName] || 0) + defect.totalCount;
      }
    });

    return Object.entries(defectMap)
      .map(([name, count]) => ({
        name,
        count,
        defectRate: checkedQty > 0 ? (count / checkedQty) * 100 : 0
      }))
      .sort((a, b) => b.defectRate - a.defectRate); // Sort by defect rate descending
  };

  // Determine background and text color for summary rates
  const getRateStyle = (rate) => {
    const rateValue = rate * 100;
    if (rateValue > 3) {
      return { bgColor: "bg-red-200", textColor: "text-red-800" };
    } else if (rateValue >= 2 && rateValue <= 3) {
      return { bgColor: "bg-yellow-200", textColor: "text-orange-800" };
    } else {
      return { bgColor: "bg-green-200", textColor: "text-green-800" };
    }
  };

  // Determine background color for defect details based on defect rate
  const getDefectDetailBgColor = (defectRate) => {
    if (defectRate > 3) {
      return "bg-red-100"; // Light red
    } else if (defectRate >= 2 && defectRate <= 3) {
      return "bg-yellow-100"; // Yellow
    } else if (defectRate < 2) {
      return "bg-green-100"; // Light green for defect rate < 2%
    } else {
      return "bg-blue-50"; // Default blue
    }
  };

  // Sort summaryData: Numeric Line Nos (1-30) first, then others (WA, Sub, etc.)
  const sortedSummaryData = [...summaryData].sort((a, b) => {
    const aLineNo = a.lineNo || "N/A";
    const bLineNo = b.lineNo || "N/A";

    // Check if Line No is numeric
    const aIsNumeric = !isNaN(aLineNo) && aLineNo !== "N/A";
    const bIsNumeric = !isNaN(bLineNo) && bLineNo !== "N/A";

    if (aIsNumeric && bIsNumeric) {
      // Both are numeric, sort numerically
      return Number(aLineNo) - Number(bLineNo);
    } else if (aIsNumeric && !bIsNumeric) {
      // Numeric comes before non-numeric
      return -1;
    } else if (!aIsNumeric && bIsNumeric) {
      // Non-numeric comes after numeric
      return 1;
    } else {
      // Both non-numeric, sort alphabetically
      return aLineNo.localeCompare(bLineNo);
    }
  });

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        Error: {error}{" "}
        <button
          onClick={fetchSummaryData}
          className="ml-2 text-blue-500 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-sm font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">
        Summary
      </h2>
      <div className="overflow-x-auto shadow-lg rounded-lg max-h-[500px]">
        <table className="min-w-full bg-white border-collapse">
          <thead className="bg-gray-800 text-white sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 border-b border-gray-600 text-left text-sm font-bold">
                Line No
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-left text-sm font-bold">
                MO No
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Checked Qty
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Total Pass
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Reject Units
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Defects Qty
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Defect Rate (%)
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Defect Ratio (%)
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Total Bundles
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Defective Bundles
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-left text-sm font-bold">
                Defect Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 overflow-y-auto">
            {sortedSummaryData.length === 0 ? (
              <tr>
                <td
                  colSpan="11"
                  className="py-4 text-center text-gray-500 text-sm font-bold"
                >
                  No data available
                </td>
              </tr>
            ) : (
              sortedSummaryData.map((row, index) => {
                const defectDetails = processDefectDetails(
                  row.defectArray,
                  row.checkedQty
                );
                const defectRateStyle = getRateStyle(row.defectRate);
                const defectRatioStyle = getRateStyle(row.defectRatio);

                return (
                  <React.Fragment key={index}>
                    <tr
                      className={`hover:bg-gray-100 transition-colors duration-200 ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <td className="py-3 px-4 border-b border-gray-200 text-sm font-bold">
                        {row.lineNo || "N/A"}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm font-bold">
                        {row.moNo}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-right text-sm font-bold">
                        {row.checkedQty?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-right text-sm font-bold">
                        {row.totalPass?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-right text-sm font-bold">
                        {row.totalRejects?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-right text-sm font-bold">
                        {row.defectsQty?.toLocaleString() || "0"}
                      </td>
                      <td
                        className={`py-3 px-4 border-b border-gray-200 text-right text-sm font-bold ${defectRateStyle.bgColor}`}
                      >
                        <span className={defectRateStyle.textColor}>
                          {(row.defectRate * 100).toFixed(1) || "0.0"}%
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 border-b border-gray-200 text-right text-sm font-bold ${defectRatioStyle.bgColor}`}
                      >
                        <span className={defectRatioStyle.textColor}>
                          {(row.defectRatio * 100).toFixed(1) || "0.0"}%
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-right text-sm font-bold">
                        {row.totalBundles?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-right text-sm font-bold">
                        {row.defectiveBundles?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        {defectDetails.length > 0 ? (
                          <div className="p-2 rounded">
                            {defectDetails.map((defect, idx) => (
                              <div
                                key={idx}
                                className={`${getDefectDetailBgColor(
                                  defect.defectRate
                                )} text-blue-800 p-1 mb-1 rounded text-sm font-bold`}
                              >
                                {`${
                                  defect.name
                                }: ${defect.count.toLocaleString()} (${defect.defectRate.toFixed(
                                  1
                                )}%)`}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="bg-blue-50 text-blue-800 p-2 rounded text-sm font-bold">
                            No Defects
                          </span>
                        )}
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

export default LiveSummary;
