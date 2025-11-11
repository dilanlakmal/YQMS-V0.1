import React, { useEffect, useState } from "react";
import {
  Layers,
  RefreshCw,
  Loader,
  CheckCircle,
  AlertTriangle,
  HelpCircle
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
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        Sync Product Type from Cutting
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        This tool updates the 'Product Type' in Yorksys Orders using the
        'Garment Type' recorded during Cutting Inspection.
      </p>

      {/* --- Data Summary Box --- */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-md font-semibold text-slate-700 mb-2">
              Cutting Inspection Data Summary
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Loading data...</span>
              </div>
            ) : error ? (
              <p className="text-red-600 text-sm font-medium">{error}</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-800">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span className="text-2xl font-bold">
                    {cuttingData.length}
                  </span>
                  <span className="text-sm">MOs with Product Types Found</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={fetchCuttingData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* --- Update Action Section --- */}
      <div className="text-center">
        <button
          onClick={handlePreviewUpdate}
          disabled={
            loading || cuttingData.length === 0 || isPreviewing || isUpdating
          }
          className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
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
      </div>

      {/* --- Confirmation Dialog --- */}
      {matchCount !== null && !isUpdating && (
        <div className="mt-6 p-4 border-l-4 border-amber-400 bg-amber-50 rounded-md">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-800">
                Confirmation Required
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Found <strong>{matchCount} matching records</strong> in Yorksys
                Orders that will be updated. This action cannot be undone.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleConfirmUpdate}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Yes, Proceed with Update
                </button>
                <button
                  onClick={() => setMatchCount(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300"
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
        <div className="mt-6 p-4 border-l-4 border-blue-400 bg-blue-50 rounded-md flex items-center gap-3">
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-blue-700">
            Updating records... Please wait.
          </p>
        </div>
      )}

      {/* --- Final Result Message --- */}
      {updateResult && (
        <div
          className={`mt-6 p-4 flex items-center gap-3 rounded-md border ${
            updateResult.success
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
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
