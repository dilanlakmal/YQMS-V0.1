import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import Swal from "sweetalert2";
import { openDB } from "idb";

const SunriseDB = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visibleTab, setVisibleTab] = useState("data"); // "data" or "analyze"
  const [currentPage, setCurrentPage] = useState({ data: 1, analyze: 1 });
  const [selectedDate, setSelectedDate] = useState(""); // Date picker state
  const rowsPerPage = 10;

  // Initialize IndexedDB
  const initDB = async () => {
    return openDB("SunriseDB", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("rs18")) {
          db.createObjectStore("rs18", { keyPath: "id" });
        }
      }
    });
  };

  // Save data to IndexedDB
  const saveDataToDB = async (data) => {
    try {
      const db = await initDB();
      await db.put("rs18", { id: "rs18Data", data });
    } catch (err) {
      console.error("Error saving to IndexedDB:", err);
    }
  };

  // Load data from IndexedDB
  const loadDataFromDB = async () => {
    try {
      const db = await initDB();
      const result = await db.get("rs18", "rs18Data");
      return result?.data || null;
    } catch (err) {
      console.error("Error loading from IndexedDB:", err);
      return null;
    }
  };

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

      const response = await fetch(`${API_BASE_URL}/api/sunrise/rs18`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to fetch RS18 data");
      }
      const result = await response.json();
      setData(result);
      await saveDataToDB(result);
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

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      const cachedData = await loadDataFromDB();
      if (cachedData) {
        setData(cachedData);
      }
    };
    loadCachedData();
  }, []);

  const handleViewData = () => {
    if (!data) {
      fetchData();
    }
    setVisibleTab("data");
  };

  const handleAnalyzeClick = () => {
    if (!data) {
      Swal.fire({
        icon: "warning",
        title: "No Data",
        text: "Please fetch data before analyzing."
      });
      fetchData();
    }
    setVisibleTab("analyze");
  };

  const handleRefreshData = () => {
    fetchData();
  };

  const handleClearData = async () => {
    setData(null);
    setVisibleTab("data");
    setSelectedDate("");
    try {
      const db = await initDB();
      await db.delete("rs18", "rs18Data");
    } catch (err) {
      console.error("Error clearing IndexedDB:", err);
    }
  };

  const paginateData = (data, page) => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const renderDataTable = () => {
    if (!data || visibleTab !== "data") return null;

    const headers = [
      "InspectionDate",
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
    const paginatedData = paginateData(data, currentPage.data);
    const totalPages = Math.ceil(data.length / rowsPerPage);

    return (
      <div className="mt-4 overflow-x-auto overflow-y-auto max-h-96">
        <h3 className="text-lg font-semibold mb-2">RS18 Data</h3>
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
            onClick={() =>
              setCurrentPage((prev) => ({
                ...prev,
                data: Math.max(prev.data - 1, 1)
              }))
            }
            disabled={currentPage.data === 1}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage.data} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => ({
                ...prev,
                data: Math.min(prev.data + 1, totalPages)
              }))
            }
            disabled={currentPage.data === totalPages}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderAnalyzeTable = () => {
    if (!data || visibleTab !== "analyze") return null;

    const filteredData = selectedDate
      ? data
          .filter((row) => row.InspectionDate === selectedDate)
          .reduce((acc, row) => {
            const reworkName = row.ReworkName;
            if (!acc[reworkName]) {
              acc[reworkName] = { ReworkName: reworkName, ReworkQty: 0 };
            }
            acc[reworkName].ReworkQty += row.DefectsQty;
            return acc;
          }, {})
      : data.reduce((acc, row) => {
          const reworkName = row.ReworkName;
          if (!acc[reworkName]) {
            acc[reworkName] = { ReworkName: reworkName, ReworkQty: 0 };
          }
          acc[reworkName].ReworkQty += row.DefectsQty;
          return acc;
        }, {});

    const tableData = Object.values(filteredData);
    const totalPages = Math.ceil(tableData.length / rowsPerPage);
    const paginatedData = paginateData(tableData, currentPage.analyze);

    return (
      <div className="mt-4 overflow-y-auto max-h-96">
        <h3 className="text-lg font-semibold mb-4">Rework Summary</h3>
        <div className="mb-4">
          <label htmlFor="datePicker" className="mr-2">
            Select Date:
          </label>
          <input
            type="date"
            id="datePicker"
            value={
              selectedDate ? selectedDate.split("-").reverse().join("-") : ""
            }
            onChange={(e) => {
              const date = e.target.value.split("-").reverse().join("-"); // Convert YYYY-MM-DD to MM-DD-YYYY
              setSelectedDate(date);
              setCurrentPage((prev) => ({ ...prev, analyze: 1 }));
            }}
            className="p-2 border rounded-md"
          />
          <button
            onClick={() => {
              setSelectedDate("");
              setCurrentPage((prev) => ({ ...prev, analyze: 1 }));
            }}
            className="ml-2 px-3 py-1 bg-gray-200 rounded-md"
          >
            Clear Date
          </button>
        </div>
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-blue-100 sticky top-0 z-10">
            <tr>
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                Rework Name
              </th>
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                Rework Qty
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-2 border border-gray-300 text-sm text-left">
                  {row.ReworkName}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row.ReworkQty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={() =>
              setCurrentPage((prev) => ({
                ...prev,
                analyze: Math.max(prev.analyze - 1, 1)
              }))
            }
            disabled={currentPage.analyze === 1}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage.analyze} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => ({
                ...prev,
                analyze: Math.min(prev.analyze + 1, totalPages)
              }))
            }
            disabled={currentPage.analyze === totalPages}
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
      <div className="flex space-x-4 mb-4">
        <button
          onClick={handleViewData}
          className={`px-4 py-2 rounded-md ${
            visibleTab === "data"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          View Data
        </button>
        <button
          onClick={handleAnalyzeClick}
          className={`px-4 py-2 rounded-md ${
            visibleTab === "analyze"
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Analyze
        </button>
        <button
          onClick={handleRefreshData}
          className="px-4 py-2 bg-yellow-500 text-white rounded-md"
        >
          Refresh Data
        </button>
        <button
          onClick={handleClearData}
          className="px-4 py-2 bg-red-500 text-white rounded-md"
        >
          Clear Data
        </button>
      </div>
      {loading && <p className="mt-4">Loading...</p>}
      {error && <p className="text-red-600 mt-4">Error: {error}</p>}
      {renderDataTable()}
      {renderAnalyzeTable()}
    </div>
  );
};

export default SunriseDB;
