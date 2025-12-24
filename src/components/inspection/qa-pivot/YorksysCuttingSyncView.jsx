import React, { useEffect, useState } from "react";
import {
  Layers,
  RefreshCw,
  Loader,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  GitMerge,
  Ban
} from "lucide-react";
import { API_BASE_URL } from "../../../../config";

const YorksysCuttingSyncView = () => {
  const [cuttingData, setCuttingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [matchCount, setMatchCount] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);

  // Fetch initial data from cutting inspections
  const fetchCuttingData = async () => {
    setLoading(true);
    setError("");
    setUpdateResult(null);
    setMatchCount(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/cutting-inspections/product-types`
      );
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      setCuttingData(result.data);
    } catch (err) {
      setError(err.message || "Failed to fetch data from Cutting Inspections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuttingData();
  }, []);

  // Handle the "Update" button click to get a preview
  const handlePreviewUpdate = async () => {
    if (cuttingData.length === 0) return;
    setIsPreviewing(true);
    setError("");
    setUpdateResult(null);
    try {
      const moNos = cuttingData.map((d) => d.moNo);
      const response = await fetch(
        `${API_BASE_URL}/api/yorksys-orders/bulk-update-preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moNos })
        }
      );
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      setMatchCount(result.data.matchCount);
    } catch (err) {
      setError(err.message || "Failed to get update preview.");
      setMatchCount(null);
    } finally {
      setIsPreviewing(false);
    }
  };

  // Handle the final confirmation to perform the bulk update
  const handleConfirmUpdate = async () => {
    if (matchCount === null) return;
    setIsUpdating(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/yorksys-orders/bulk-update-product-type`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cuttingData)
        }
      );
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      setUpdateResult({ success: true, message: result.message });
    } catch (err) {
      setUpdateResult({
        success: false,
        message: err.message || "Failed to perform bulk update."
      });
    } finally {
      setIsUpdating(false);
      setMatchCount(null); // Reset the confirmation state
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-colors duration-300 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <GitMerge className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Sync Product Type from Cutting
        </h2>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 ml-11">
        This tool updates the 'Product Type' in Yorksys Orders using the
        'Garment Type' recorded during Cutting Inspection.
      </p>

      {/* --- Data Summary Box --- */}
      <div className="bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Cutting Inspection Data Summary
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Loading data...</span>
              </div>
            ) : error ? (
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-2xl font-bold">
                    {cuttingData.length}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    MOs with Product Types Found
                  </span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={fetchCuttingData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-50 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* --- Update Action Section --- */}
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Disabled Button */}
        <button
          onClick={handlePreviewUpdate}
          disabled={true} // Hardcoded disabled as requested
          className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold rounded-lg cursor-not-allowed shadow-none transition-colors border border-gray-300 dark:border-gray-600"
        >
          {isPreviewing ? (
            <>
              <Loader className="w-5 h-5 animate-spin mr-2" />
              Checking for Matches...
            </>
          ) : (
            "Update Yorksys Product Type from Cutting"
          )}
        </button>

        {/* Message Below Button */}
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg text-amber-700 dark:text-amber-400 animate-fadeIn">
          <Ban className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold">
            This functionality disabled since Product Type changed
          </span>
        </div>
      </div>

      {/* --- Confirmation Dialog (Hidden in disabled state but kept for logic) --- */}
      {matchCount !== null && !isUpdating && (
        <div className="mt-6 p-4 border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-800 dark:text-amber-300">
                Confirmation Required
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Found <strong>{matchCount} matching records</strong> in Yorksys
                Orders that will be updated. This action cannot be undone.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleConfirmUpdate}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                >
                  Yes, Proceed with Update
                </button>
                <button
                  onClick={() => setMatchCount(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Loading indicator for final update --- */}
      {isUpdating && (
        <div className="mt-6 p-4 border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center gap-3">
          <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Updating records... Please wait.
          </p>
        </div>
      )}

      {/* --- Final Result Message --- */}
      {updateResult && (
        <div
          className={`mt-6 p-4 flex items-center gap-3 rounded-md border ${
            updateResult.success
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          {updateResult.success ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{updateResult.message}</span>
        </div>
      )}
    </div>
  );
};

export default YorksysCuttingSyncView;
