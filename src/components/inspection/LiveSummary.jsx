import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../../config"; // Adjust path as needed

const LiveSummary = ({ filters = {} }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from the /api/qc2-mo-summaries endpoint
  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      console.log("Fetching data with filters:", filters); // Debug: Log filters

      // Only include non-empty filter values in the query string
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== "" && value !== undefined && value !== null
        )
      );
      const queryString = new URLSearchParams(activeFilters).toString();
      const url = queryString
        ? `${API_BASE_URL}/api/qc2-mo-summaries?${queryString}`
        : `${API_BASE_URL}/api/qc2-mo-summaries`; // No query string if no active filters

      console.log("Fetching from URL:", url); // Debug: Log the URL
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data); // Debug: Log received data
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: Expected an array");
      }
      setSummaryData(data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err); // Debug: Log error
      setError(err.message || "Failed to fetch summary data");
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();

    // Set up Socket.IO listener for real-time updates
    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
      reconnection: true
    });
    socket.on("qc2_data_updated", fetchSummaryData);

    return () => {
      socket.off("qc2_data_updated", fetchSummaryData);
      socket.disconnect();
    };
  }, [JSON.stringify(filters)]); // Use JSON.stringify to deep compare filters object

  // Flatten defectArray for each row and calculate defect-specific rates
  const processDefectDetails = (defectArray, checkedQty) => {
    const defectMap = {};
    defectArray.forEach((defect) => {
      if (defect.defectName && defect.totalCount > 0) {
        defectMap[defect.defectName] =
          (defectMap[defect.defectName] || 0) + defect.totalCount;
      }
    });

    return Object.entries(defectMap).map(([name, count]) => ({
      name,
      count,
      defectRate: checkedQty > 0 ? (count / checkedQty) * 100 : 0
    }));
  };

  // Determine background and text color based on rate
  const getRateStyle = (rate) => {
    const rateValue = rate * 100; // Convert to percentage for comparison
    if (rateValue > 3) {
      return { bgColor: "bg-red-200", textColor: "text-red-800" };
    } else if (rateValue >= 2 && rateValue <= 3) {
      return { bgColor: "bg-yellow-200", textColor: "text-orange-800" };
    } else {
      return { bgColor: "bg-green-200", textColor: "text-green-800" };
    }
  };

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
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">
        Live QC2 Summary
      </h2>
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-white border-collapse">
          <thead className="bg-gray-800 text-white sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 border-b border-gray-600 text-left">
                Line No
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-left">
                MO No
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right">
                Checked Qty
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right">
                Total Pass
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right">
                Reject Units
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right">
                Defects Qty
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right">
                Defect Rate (%)
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right">
                Defect Ratio (%)
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right">
                Total Bundles
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right">
                Defective Bundles
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-left">
                Defect Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {summaryData.length === 0 ? (
              <tr>
                <td colSpan="11" className="py-4 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              summaryData.map((row, index) => {
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
                      <td className="py-3 px-4 border-b border-gray-200">
                        {row.lineNo || "N/A"}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        {row.moNo}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-right">
                        {row.checkedQty?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-right">
                        {row.totalPass?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-right">
                        {row.totalRejects?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-right">
                        {row.defectsQty?.toLocaleString() || "0"}
                      </td>
                      <td
                        className={`py-3 px-4 border-b border-gray-200 text-right ${defectRateStyle.bgColor}`}
                      >
                        <span className={defectRateStyle.textColor}>
                          {(row.defectRate * 100).toFixed(1) || "0.0"}%
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 border-b border-gray-200 text-right ${defectRatioStyle.bgColor}`}
                      >
                        <span className={defectRatioStyle.textColor}>
                          {(row.defectRatio * 100).toFixed(1) || "0.0"}%
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-right">
                        {row.totalBundles?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-right">
                        {row.defectiveBundles?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200">
                        {defectDetails.length > 0 ? (
                          <div className="bg-blue-50 text-blue-800 p-2 rounded">
                            {defectDetails.map((defect, idx) => (
                              <div key={idx}>
                                {`${
                                  defect.name
                                }: ${defect.count.toLocaleString()} (${defect.defectRate.toFixed(
                                  1
                                )}%)`}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="bg-blue-50 text-blue-800 p-2 rounded">
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
