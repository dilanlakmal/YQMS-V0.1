import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import Swal from "sweetalert2";
import { openDB } from "idb";
import { FaSync } from "react-icons/fa"; // Refresh icon
import SunriseAnalyze from "./SunriseAnalyze"; // Import the new component

const SunriseDB = () => {
  const [rs18Data, setRs18Data] = useState(null);
  const [outputData, setOutputData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState({
    rs18: "",
    output: ""
  });
  const [showRs18Data, setShowRs18Data] = useState(false);
  const [showOutputData, setShowOutputData] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [currentPage, setCurrentPage] = useState({ rs18: 1, output: 1 });
  const rowsPerPage = 10;

  // Initialize IndexedDB
  const initDB = async () => {
    try {
      const db = await openDB("SunriseDB", 2, {
        upgrade(db, oldVersion, newVersion) {
          console.log(
            `Upgrading database from version ${oldVersion} to ${newVersion}`
          );
          if (!db.objectStoreNames.contains("rs18")) {
            db.createObjectStore("rs18", { keyPath: "id" });
            console.log("Created rs18 object store");
          }
          if (!db.objectStoreNames.contains("output")) {
            db.createObjectStore("output", { keyPath: "id" });
            console.log("Created output object store");
          }
        }
      });
      console.log("IndexedDB initialized successfully");
      return db;
    } catch (err) {
      console.error("Error initializing IndexedDB:", err);
      throw err;
    }
  };

  // Save data to IndexedDB
  const saveDataToDB = async (storeName, data) => {
    try {
      const db = await initDB();
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      await store.put({ id: `${storeName}Data`, data });
      await tx.done;
      console.log(`Data saved to ${storeName} in IndexedDB successfully`);
    } catch (err) {
      console.error(`Error saving to IndexedDB (${storeName}):`, err);
      throw err;
    }
  };

  // Load data from IndexedDB
  const loadDataFromDB = async (storeName) => {
    try {
      const db = await initDB();
      if (!db.objectStoreNames.contains(storeName)) {
        console.warn(`Object store ${storeName} does not exist yet`);
        return null;
      }
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const result = await store.get(`${storeName}Data`);
      await tx.done;
      console.log(
        `Data loaded from ${storeName} in IndexedDB:`,
        result?.data ? "Data found" : "No data"
      );
      return result?.data || null;
    } catch (err) {
      console.error(`Error loading from IndexedDB (${storeName}):`, err);
      return null;
    }
  };

  // Fetch both RS18 and Output data simultaneously
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage({ rs18: "", output: "" });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

      const [rs18Response, outputResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/sunrise/rs18`, {
          signal: controller.signal
        }),
        fetch(`${API_BASE_URL}/api/sunrise/output`, {
          signal: controller.signal
        })
      ]);

      clearTimeout(timeoutId);

      if (!rs18Response.ok) throw new Error("Failed to fetch RS18 data");
      if (!outputResponse.ok)
        throw new Error("Failed to fetch Sunrise Output data");

      const rs18Result = await rs18Response.json();
      const outputResult = await outputResponse.json();

      setRs18Data(rs18Result);
      setOutputData(outputResult);

      await Promise.all([
        saveDataToDB("rs18", rs18Result),
        saveDataToDB("output", outputResult)
      ]);

      setSuccessMessage({
        rs18: "Defect Data fetched Successfully",
        output: "Output Data fetched Successfully"
      });

      setTimeout(() => setSuccessMessage({ rs18: "", output: "" }), 3000); // Clear message after 3 seconds
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
      try {
        const cachedRs18Data = await loadDataFromDB("rs18");
        const cachedOutputData = await loadDataFromDB("output");

        if (cachedRs18Data) {
          setRs18Data(cachedRs18Data);
          console.log("RS18 data loaded from IndexedDB into state");
        } else {
          console.log("No RS18 data found in IndexedDB");
        }

        if (cachedOutputData) {
          setOutputData(cachedOutputData);
          console.log("Output data loaded from IndexedDB into state");
        } else {
          console.log("No Output data found in IndexedDB");
        }
      } catch (err) {
        console.error("Error in loadCachedData:", err);
      }
    };

    loadCachedData();
  }, []);

  const paginateData = (data, page) => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const renderRs18Table = () => {
    if (!rs18Data || !showRs18Data) return null;

    const headers = [
      "InspectionDate",
      "WorkLine",
      "MONo",
      "SizeName",
      "ColorNo",
      "ColorName",
      "ReworkCode",
      "ReworkName",
      "DefectsQty"
    ];
    const paginatedData = paginateData(rs18Data, currentPage.rs18);
    const totalPages = Math.ceil(rs18Data.length / rowsPerPage);

    return (
      <div className="mt-4 overflow-x-auto overflow-y-auto max-h-96">
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
                rs18: Math.max(prev.rs18 - 1, 1)
              }))
            }
            disabled={currentPage.rs18 === 1}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage.rs18} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => ({
                ...prev,
                rs18: Math.min(prev.rs18 + 1, totalPages)
              }))
            }
            disabled={currentPage.rs18 === totalPages}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderOutputTable = () => {
    if (!outputData || !showOutputData) return null;

    const headers = [
      "InspectionDate",
      "WorkLine",
      "MONo",
      "SizeName",
      "ColorNo",
      "ColorName",
      "TotalQtyT38",
      "TotalQtyT39"
    ];
    const paginatedData = paginateData(outputData, currentPage.output);
    const totalPages = Math.ceil(outputData.length / rowsPerPage);

    return (
      <div className="mt-4 overflow-x-auto overflow-y-auto max-h-96">
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
                output: Math.max(prev.output - 1, 1)
              }))
            }
            disabled={currentPage.output === 1}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage.output} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => ({
                ...prev,
                output: Math.min(prev.output + 1, totalPages)
              }))
            }
            disabled={currentPage.output === totalPages}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-center">
        <button
          onClick={fetchAllData}
          className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md"
          disabled={loading}
        >
          <FaSync className="mr-2" />
          Refresh Data
        </button>
      </div>

      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-red-600 text-center">Error: {error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RS18 Card */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            Sunrise Database - RS18
          </h3>
          <button
            onClick={() => setShowRs18Data(!showRs18Data)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            {showRs18Data ? "Hide Data" : "View Data"}
          </button>
          {successMessage.rs18 && (
            <p className="text-green-600 mt-2">{successMessage.rs18}</p>
          )}
          {renderRs18Table()}
        </div>

        {/* Output Card */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            Sunrise Database - Output
          </h3>
          <button
            onClick={() => setShowOutputData(!showOutputData)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            {showOutputData ? "Hide Data" : "View Data"}
          </button>
          {successMessage.output && (
            <p className="text-green-600 mt-2">{successMessage.output}</p>
          )}
          {renderOutputTable()}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => {
            if (!rs18Data || !outputData) {
              Swal.fire({
                icon: "warning",
                title: "No Data",
                text: "Please refresh data before analyzing."
              });
              fetchAllData();
            }
            setShowAnalyze(!showAnalyze);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-md"
        >
          {showAnalyze ? "Hide Analyze" : "Analyze"}
        </button>
      </div>

      {showAnalyze && (
        <SunriseAnalyze rs18Data={rs18Data} outputData={outputData} />
      )}
    </div>
  );
};

export default SunriseDB;
