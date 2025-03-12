import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../../config"; // Adjust path as needed

const LiveSummary = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from the /api/qc2-mo-summaries endpoint
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/qc2-mo-summaries`);
        if (!response.ok) {
          throw new Error("Failed to fetch summary data");
        }
        const data = await response.json();
        setSummaryData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setSummaryData([]);
      } finally {
        setLoading(false);
      }
    };

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
  }, []);

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

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Live QC2 Summary</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          {/* Fixed Header Row */}
          <thead className="bg-gray-800 text-white sticky top-0 z-10">
            <tr>
              <th className="py-2 px-4 border-b border-gray-200">Line No</th>
              <th className="py-2 px-4 border-b border-gray-200">MO No</th>
              <th className="py-2 px-4 border-b border-gray-200 text-right">
                Checked Qty
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-right">
                Total Pass
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-right">
                Reject Units
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-right">
                Defects Qty
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-right">
                Defect Rate (%)
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-right">
                Defect Ratio (%)
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-right">
                Total Bundles
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-right">
                Defective Bundles
              </th>
              <th className="py-2 px-4 border-b border-gray-200">
                Defect Details
              </th>
            </tr>
          </thead>
          {/* Scrollable Body */}
          <tbody className="max-h-96 overflow-y-auto block">
            {summaryData.map((row, index) => {
              const defectDetails = processDefectDetails(
                row.defectArray,
                row.checkedQty
              );
              const rowSpan = defectDetails.length || 1;

              return defectDetails.length > 0 ? (
                defectDetails.map((defect, defectIndex) => (
                  <tr
                    key={`${index}-${defectIndex}`}
                    className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                  >
                    {/* Render main row data only on the first defect entry */}
                    {defectIndex === 0 && (
                      <>
                        <td
                          rowSpan={rowSpan}
                          className="py-2 px-4 border-b border-gray-200 align-top"
                        >
                          {row.lineNo || "N/A"}
                        </td>
                        <td
                          rowSpan={rowSpan}
                          className="py-2 px-4 border-b border-gray-200 align-top"
                        >
                          {row.moNo}
                        </td>
                        <td
                          rowSpan={rowSpan}
                          className="py-2 px-4 border-b border-gray-200 text-right align-top"
                        >
                          {row.checkedQty.toLocaleString()}
                        </td>
                        <td
                          rowSpan={rowSpan}
                          className="py-2 px-4 border-b border-gray-200 text-right align-top"
                        >
                          {row.totalPass.toLocaleString()}
                        </td>
                        <td
                          rowSpan={rowSpan}
                          className="py-2 px-4 border-b border-gray-200 text-right align-top"
                        >
                          {row.totalRejects.toLocaleString()}
                        </td>
                        <td
                          rowSpan={rowSpan}
                          className="py-2 px-4 border-b border-gray-200 text-right align-top"
                        >
                          {row.defectsQty.toLocaleString()}
                        </td>
                        <td
                          rowSpan={rowSpan}
                          className="py-2 px-4 border-b border-gray-200 text-right align-top"
                        >
                          {(row.defectRate * 100).toFixed(1)}%
                        </td>
                        <td
                          rowSpan={rowSpan}
                          className="py-2 px-4 border-b border-gray-200 text-right align-top"
                        >
                          {(row.defectRatio * 100).toFixed(1)}%
                        </td>
                        <td
                          rowSpan={rowSpan}
                          className="py-2 px-4 border-b border-gray-200 text-right align-top"
                        >
                          {row.totalBundles.toLocaleString()}
                        </td>
                        <td
                          rowSpan={rowSpan}
                          className="py-2 px-4 border-b border-gray-200 text-right align-top"
                        >
                          {row.defectiveBundles.toLocaleString()}
                        </td>
                      </>
                    )}
                    {/* Defect Details Column */}
                    <td className="py-2 px-4 border-b border-gray-200 bg-blue-50 text-blue-800">
                      {`${
                        defect.name
                      }: ${defect.count.toLocaleString()} (${defect.defectRate.toFixed(
                        1
                      )}%)`}
                    </td>
                  </tr>
                ))
              ) : (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                >
                  <td className="py-2 px-4 border-b border-gray-200">
                    {row.lineNo || "N/A"}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200">
                    {row.moNo}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-right">
                    {row.checkedQty.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-right">
                    {row.totalPass.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-right">
                    {row.totalRejects.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-right">
                    {row.defectsQty.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-right">
                    {(row.defectRate * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-right">
                    {(row.defectRatio * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-right">
                    {row.totalBundles.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-right">
                    {row.defectiveBundles.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 bg-blue-50 text-blue-800">
                    No Defects
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveSummary;
