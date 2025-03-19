import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import Swal from "sweetalert2";

const SunriseDB = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

      const response = await fetch(`${API_BASE_URL}/api/sunrise/rs18`, {
        signal: controller.signal // Attach the abort signal
      });

      clearTimeout(timeoutId); // Clear timeout if request completes early

      if (!response.ok) {
        throw new Error("Failed to fetch RS18 data");
      }
      const result = await response.json();
      setData(result);
      setVisible(true);
    } catch (err) {
      setError(err.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewData = () => {
    if (!data) {
      fetchData();
    } else {
      setVisible(!visible);
    }
  };

  const paginateData = (data) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const renderTable = () => {
    if (!data || !visible) return null;

    const headers = [
      "InspectionDate",
      "StartHR",
      "EndHR",
      "WorkLine",
      "MONo",
      "EmpID",
      "EmpName",
      "EmpID_QC",
      "EmpName_QC",
      "SizeName",
      "ColorNo",
      "ColorName",
      "SeqNo",
      "SeqName",
      "ReworkCode",
      "ReworkName",
      "DefectsQty"
    ];
    const paginatedData = paginateData(data);
    const totalPages = Math.ceil(data.length / rowsPerPage);

    return (
      <div className="mt-4 overflow-x-auto overflow-y-auto max-h-96">
        <h3 className="text-lg font-semibold mb-2">RS18</h3>
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-blue-100 sticky top-0 z-10">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="p-2 border border-gray-300 text-sm font-medium text-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {headers.map((header) => (
                  <td
                    key={header}
                    className="p-2 border border-gray-300 text-sm text-center"
                  >
                    {row[header] || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Sunrise Database - RS18</h3>
      <button
        onClick={handleViewData}
        className="px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        {visible ? "Hide Data" : "View Data"}
      </button>
      {loading && <p className="mt-4">Loading...</p>}
      {error && <p className="text-red-600 mt-4">Error: {error}</p>}
      {renderTable()}
    </div>
  );
};

export default SunriseDB;
