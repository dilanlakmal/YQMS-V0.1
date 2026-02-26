import React, { useState, useEffect } from "react";
import {
  X,
  Loader,
  AlertTriangle,
  CheckCircle,
  Languages,
  ArrowRightLeft,
  Info,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config";

const RepairNamesModal = ({ isOpen, onClose, moNo, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState("");

  // Fetch preview when modal opens
  useEffect(() => {
    if (isOpen && moNo) {
      fetchPreview();
    } else {
      // Reset state when modal closes
      setPreviewData(null);
      setError("");
    }
  }, [isOpen, moNo]);

  const fetchPreview = async () => {
    setIsLoading(true);
    setError("");
    setPreviewData(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/preview-name-swap`,
        { moNo: moNo.trim() },
      );

      setPreviewData(response.data);
    } catch (err) {
      console.error("Error fetching name swap preview:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to analyze name swap requirements.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSwap = async () => {
    if (!previewData?.hasAnyIssues) return;

    setIsExecuting(true);
    setError("");

    try {
      // Determine which arrays to swap based on preview
      const arraysToSwap = [];
      if (previewData.affectedArrays) {
        Object.keys(previewData.affectedArrays).forEach((key) => {
          if (previewData.affectedArrays[key].hasIssues) {
            arraysToSwap.push(key);
          }
        });
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/execute-name-swap`,
        {
          moNo: moNo.trim(),
          arraysToSwap: arraysToSwap,
        },
      );

      if (response.data.success) {
        onSuccess(response.data.message);
        onClose();
      }
    } catch (err) {
      console.error("Error executing name swap:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to swap names.",
      );
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-violet-50 dark:bg-violet-900/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <Languages className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Repair Swapped Names
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Order: <span className="font-medium">{moNo}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isExecuting}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-violet-500 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Analyzing measurement point names...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Preview Data */}
          {previewData && !isLoading && (
            <div className="space-y-5">
              {/* Explanation Box */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">What this does:</p>
                    <p>
                      Detects when English name field contains Chinese
                      characters and Chinese name field contains English text,
                      then swaps them to correct positions.
                    </p>
                  </div>
                </div>
              </div>

              {/* No Issues Found */}
              {!previewData.hasAnyIssues && (
                <div className="p-8 text-center">
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    No Swapped Names Detected!
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    All measurement point names appear to be in their correct
                    fields.
                  </p>
                </div>
              )}

              {/* Issues Found */}
              {previewData.hasAnyIssues && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-lg border ${
                        previewData.summary?.bwHasIssues
                          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                          : "bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <p
                        className={`text-2xl font-bold ${
                          previewData.summary?.bwHasIssues
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {previewData.summary?.bwAffectedCount || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Before Wash Points
                      </p>
                      {previewData.summary?.bwHasIssues && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                          Needs Fix
                        </span>
                      )}
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        previewData.summary?.awHasIssues
                          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                          : "bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <p
                        className={`text-2xl font-bold ${
                          previewData.summary?.awHasIssues
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {previewData.summary?.awAffectedCount || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        After Wash Points
                      </p>
                      {previewData.summary?.awHasIssues && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                          Needs Fix
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-700 dark:text-amber-300">
                        <p className="font-medium mb-1">
                          Found {previewData.summary?.totalAffectedPoints}{" "}
                          point(s) with swapped names
                        </p>
                        <p>
                          English name field contains Chinese characters, and
                          Chinese name field contains English text. These will
                          be swapped.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview Details */}
                  {previewData.previewDetails &&
                    previewData.previewDetails.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Preview of Changes:
                        </p>
                        <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin">
                          {previewData.previewDetails.map((detail, idx) => (
                            <div
                              key={idx}
                              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {detail.displayName}
                                </span>
                                <span className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs rounded-full">
                                  {detail.affectedCount} point(s)
                                </span>
                              </div>

                              {/* Sample swaps */}
                              {detail.samples &&
                                detail.samples.map((sample, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="flex items-center gap-2 text-xs py-2 border-t border-gray-200 dark:border-gray-600 first:border-t-0"
                                  >
                                    {/* Current (Wrong) */}
                                    <div className="flex-1 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                      <p className="text-red-600 dark:text-red-400 font-medium">
                                        Current:
                                      </p>
                                      <p className="text-gray-700 dark:text-gray-300 truncate">
                                        Eng:{" "}
                                        <span className="font-chinese">
                                          {sample.currentEngName}
                                        </span>
                                      </p>
                                      <p className="text-gray-700 dark:text-gray-300 truncate">
                                        Chi: {sample.currentChiName}
                                      </p>
                                    </div>

                                    {/* Arrow */}
                                    <ArrowRightLeft className="w-5 h-5 text-violet-500 flex-shrink-0" />

                                    {/* After (Correct) */}
                                    <div className="flex-1 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                      <p className="text-green-600 dark:text-green-400 font-medium">
                                        After Fix:
                                      </p>
                                      <p className="text-gray-700 dark:text-gray-300 truncate">
                                        Eng: {sample.newEngName}
                                      </p>
                                      <p className="text-gray-700 dark:text-gray-300 truncate font-chinese">
                                        Chi: {sample.newChiName}
                                      </p>
                                    </div>
                                  </div>
                                ))}

                              {detail.affectedCount > 3 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                                  ... and {detail.affectedCount - 3} more
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteSwap}
            disabled={isExecuting || isLoading || !previewData?.hasAnyIssues}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !previewData?.hasAnyIssues
                ? "No swapped names detected"
                : "Swap the names"
            }
          >
            {isExecuting ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="w-4 h-4" />
            )}
            {isExecuting ? "Swapping..." : "Confirm & Swap Names"}
            {previewData?.summary?.totalAffectedPoints > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {previewData.summary.totalAffectedPoints}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepairNamesModal;
