import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { RefreshCw, History, AlertTriangle, CheckCircle } from "lucide-react";

const SunriseDataSync = () => {
  const [loading, setLoading] = useState({ all: false, recent: false });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSync = async (type) => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    setMessage(null);
    setError(null);

    const endpoint =
      type === "all"
        ? `${API_BASE_URL}/api/qc1-sunrise/sync-all`
        : `${API_BASE_URL}/api/qc1-sunrise/sync-recent`;

    try {
      const response = await axios.post(endpoint);
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "An unknown error occurred.");
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
        QC1 Sunrise Data Synchronization
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Use these options to process and aggregate the raw QC1 Sunrise data into
        the summary collection for faster reporting. This can be a long-running
        process.
      </p>

      {message && (
        <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800 flex items-center">
          <CheckCircle className="w-5 h-5 mr-3" />
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Sync All Data */}
        <div className="p-4 border dark:border-gray-700 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                Sync All Data
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Processes every record from the beginning. Use this for initial
                setup or full resynchronization.{" "}
                <strong className="text-orange-500">
                  This may take a very long time.
                </strong>
              </p>
            </div>
            <button
              onClick={() => handleSync("all")}
              disabled={loading.all || loading.recent}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed w-40 justify-center"
            >
              {loading.all ? (
                <RefreshCw className="animate-spin" />
              ) : (
                <RefreshCw />
              )}
              {loading.all ? "Syncing..." : "Sync All"}
            </button>
          </div>
        </div>

        {/* Sync Last 3 Days */}
        <div className="p-4 border dark:border-gray-700 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                Sync Recent Data
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Quickly updates records for today and the last two days. Ideal
                for daily updates.
              </p>
            </div>
            <button
              onClick={() => handleSync("recent")}
              disabled={loading.all || loading.recent}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-40 justify-center"
            >
              {loading.recent ? (
                <RefreshCw className="animate-spin" />
              ) : (
                <History />
              )}
              {loading.recent ? "Syncing..." : "Sync Recent"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SunriseDataSync;
