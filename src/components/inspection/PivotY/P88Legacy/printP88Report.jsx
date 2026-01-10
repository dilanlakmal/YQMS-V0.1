import React, { useState, useEffect } from "react";

const PrintP88Report = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: "", type: "" });
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [spaceInfo, setSpaceInfo] = useState(null);
  const [pathValidation, setPathValidation] = useState(null);
  const [downloadMode, setDownloadMode] = useState("range");
  const [startRange, setStartRange] = useState(1);
  const [endRange, setEndRange] = useState(100);
  const [progress, setProgress] = useState(null);
  const [includeDownloaded, setIncludeDownloaded] = useState(false);
  const [recordStats, setRecordStats] = useState(null);

  // New state for date range and factory
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [factories, setFactories] = useState([]);
  const [dateFilteredStats, setDateFilteredStats] = useState(null);
  const [language, setLanguage] = useState("english");

  // Fetch available factories on component mount
  useEffect(() => {
    fetchFactories();
    getRecordStats();
  }, [includeDownloaded]);

  useEffect(() => {
    if (startDate && endDate) {
      getDateFilteredStats();
    }
  }, [startDate, endDate, factoryName, includeDownloaded]);

  const fetchFactories = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/scraping/factories`);
      if (response.ok) {
        const data = await response.json();
        setFactories(data.factories || []);
      } else {
        console.error(
          `Failed to fetch factories: ${response.status} ${response.statusText}`
        );
        setStatus({
          message: `Failed to load factories: ${response.status} ${response.statusText}`,
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error fetching factories:", error);
      setStatus({
        message: `Error loading factories: ${error.message}`,
        type: "error"
      });
    }
  };

  const getDateFilteredStats = async () => {
    if (!startDate || !endDate) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const params = new URLSearchParams({
        startDate,
        endDate,
        factoryName: factoryName || "",
        includeDownloaded: includeDownloaded.toString()
      });

      const response = await fetch(
        `${apiBaseUrl}/api/scraping/date-filtered-stats?${params}`
      );
      if (response.ok) {
        const data = await response.json();
        setDateFilteredStats(data);
        if (data.totalRecords > 0) {
          setStartRange(1);
          setEndRange(data.totalRecords);
          checkAvailableSpace(selectedPath, {
            start: 1,
            end: data.totalRecords
          });
        }
        setStatus({ message: "", type: "" });
      } else {
        console.error(
          `Failed to fetch date filtered stats: ${response.status} ${response.statusText}`
        );
        setStatus({
          message: `Failed to fetch stats: ${response.status} ${response.statusText}`,
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error getting date filtered stats:", error);
      setStatus({
        message: `Error getting stats: ${error.message}`,
        type: "error"
      });
    }
  };

  const checkAvailableSpace = async (path = "", rangeOverrides = null) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const endpoint = "check-bulk-space";

      const body = {
        downloadPath: path,
        startRange:
          downloadMode === "range" ? rangeOverrides?.start ?? startRange : null,
        endRange:
          downloadMode === "range" ? rangeOverrides?.end ?? endRange : null,
        downloadAll: downloadMode === "all",
        includeDownloaded: includeDownloaded,
        startDate: startDate || null,
        endDate: endDate || null,
        factoryName: factoryName || null
      };

      const response = await fetch(`${apiBaseUrl}/api/scraping/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        setSpaceInfo(data);
        return data;
      }
    } catch (error) {
      console.error("Error checking space:", error);
    }
    return null;
  };

  const getRecordStats = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(
        `${apiBaseUrl}/api/scraping/record-count?includeDownloaded=${includeDownloaded}`
      );

      if (response.ok) {
        const data = await response.json();
        setRecordStats(data);
      } else {
        console.error(
          `Failed to fetch record stats: ${response.status} ${response.statusText}`
        );
        setStatus({
          message: `Failed to load record stats: ${response.status} ${response.statusText}`,
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error getting record stats:", error);
      setStatus({
        message: `Error loading record stats: ${error.message}`,
        type: "error"
      });
    }
  };

  const validatePath = async (path) => {
    if (!path) {
      setPathValidation(null);
      return;
    }
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/scraping/validate-path`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ downloadPath: path })
      });
      if (response.ok) {
        const data = await response.json();
        setPathValidation(data);
      }
    } catch (error) {
      console.error("Error validating path:", error);
    }
  };

  const handlePrintReport = async () => {
    // Validate date range
    if (!startDate || !endDate) {
      setStatus({
        message: "Please select both start and end dates",
        type: "error"
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setStatus({
        message: "Start date must be before end date",
        type: "error"
      });
      return;
    }

    setLoading(true);
    setStatus({ message: "", type: "" });
    setProgress(null);

    try {
      setShowDownloadDialog(true);
      await checkAvailableSpace();
    } catch (error) {
      console.error("Error:", error);
      setStatus({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDownload = async () => {
    if (pathValidation && !pathValidation.isValid) {
      setStatus({
        message: "Please select a valid download path",
        type: "error"
      });
      return;
    }

    if (downloadMode === "range" && (startRange > endRange || startRange < 1)) {
      setStatus({ message: "Please enter a valid range", type: "error" });
      return;
    }

    if (spaceInfo && !spaceInfo.hasEnoughSpace) {
      const recordText = spaceInfo.recordCount
        ? ` for ${spaceInfo.recordCount} reports`
        : "";
      const proceed = window.confirm(
        `Warning: You may not have enough disk space${recordText}. Available: ${spaceInfo.availableSpace}, Estimated needed: ${spaceInfo.estimatedDownloadSize}. Do you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    setLoading(true);
    setShowDownloadDialog(false);
    setProgress({ current: 0, total: spaceInfo?.recordCount || 1 });

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const endpoint = "download-bulk-reports";

      const body = {
        downloadPath: selectedPath,
        startRange: downloadMode === "range" ? startRange : null,
        endRange: downloadMode === "range" ? endRange : null,
        downloadAll: downloadMode === "all",
        startDate: startDate,
        endDate: endDate,
        factoryName: factoryName || null,
        includeDownloaded: includeDownloaded,
        language: language
      };

      const response = await fetch(`${apiBaseUrl}/api/scraping/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let serverError = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          serverError = errorData.message || errorData.error || serverError;
        } catch (e) {
          // Ignore if response body is not valid JSON
        }
        throw new Error(serverError);
      }

      const data = await response.json();
      if (data.success) {
        setDownloadInfo(data.downloadInfo);
        setStatus({
          message: `Bulk download completed! ${data.downloadInfo.successfulDownloads} successful, ${data.downloadInfo.failedDownloads} failed. Total: ${data.downloadInfo.totalFiles} files (${data.downloadInfo.totalSize})`,
          type: "success"
        });
      } else {
        setStatus({
          message: data.message || "Failed to download report(s)",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const handlePathChange = async (e) => {
    const path = e.target.value;
    setSelectedPath(path);
    await validatePath(path);
    if (path) {
      await checkAvailableSpace(path);
    } else {
      await checkAvailableSpace();
    }
  };

  const handleModeChange = async (mode) => {
    setDownloadMode(mode);
    await checkAvailableSpace(selectedPath);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  P88 Report Downloader
                </h1>
                <p className="text-blue-100 text-sm">
                  Download inspection reports by date range and factory
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Date Range and Factory Selection */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Filter Criteria</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Start Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    📅 Submitted Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    📅 Submitted End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Factory Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    🏭 Suplier Name (Optional)
                  </label>
                  <select
                    value={factoryName}
                    onChange={(e) => setFactoryName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Suppliers</option>
                    {factories.map((factory, index) => (
                      <option key={index} value={factory}>
                        {factory}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    🌐 Report Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="english">🇺🇸 English</option>
                    <option value="chinese">🇨🇳 中文 (Chinese)</option>
                  </select>
                </div>
              </div>

              {/* Date Range Validation */}
              {startDate &&
                endDate &&
                new Date(startDate) > new Date(endDate) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-700">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">
                        Invalid date range: Start date must be before end date
                      </span>
                    </div>
                  </div>
                )}
            </div>

            {/* Filtered Record Statistics */}
            {dateFilteredStats && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span>
                    Filtered Records ({startDate} to {endDate})
                  </span>
                  {factoryName && (
                    <span className="text-blue-600">- {factoryName}</span>
                  )}
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: "Total Records",
                      value: dateFilteredStats.totalRecords,
                      color: "blue"
                    },
                    {
                      label: "Downloaded",
                      value: dateFilteredStats.downloadedRecords,
                      color: "green"
                    },
                    {
                      label: "Pending",
                      value: dateFilteredStats.pendingRecords,
                      color: "orange"
                    }
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div
                        className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}
                      >
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download Mode Selection */}
            {dateFilteredStats && dateFilteredStats.totalRecords > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    />
                  </svg>
                  <span>Download Mode</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      value: "range",
                      icon: "📊",
                      title: "Range of Reports",
                      desc: "Download specific range from filtered results"
                    },
                    {
                      value: "all",
                      icon: "📁",
                      title: "All Filtered Reports",
                      desc: "Download all reports matching criteria"
                    }
                  ].map((mode) => (
                    <label
                      key={mode.value}
                      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
                        downloadMode === mode.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        value={mode.value}
                        checked={downloadMode === mode.value}
                        onChange={(e) => handleModeChange(e.target.value)}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="text-2xl mb-2">{mode.icon}</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {mode.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {mode.desc}
                        </div>
                      </div>
                      {downloadMode === mode.value && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-blue-500 rounded-full p-1">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Include Downloaded Option */}
            {dateFilteredStats && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDownloaded}
                    onChange={(e) => {
                      setIncludeDownloaded(e.target.checked);
                      checkAvailableSpace(selectedPath);
                    }}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Include already downloaded reports
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Re-download reports that have been previously downloaded
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* Range Selection */}
            {downloadMode === "range" && dateFilteredStats && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                  <span>
                    Select Range (from {dateFilteredStats.totalRecords} filtered
                    records)
                  </span>
                </h4>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      From
                    </label>
                    <input
                      type="number"
                      value={startRange}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setStartRange(val);
                        checkAvailableSpace(selectedPath, { start: val });
                      }}
                      min="1"
                      max={dateFilteredStats.totalRecords}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Start"
                    />
                  </div>
                  <div className="flex-shrink-0 pt-8">
                    <svg
                      className="w-5 h-5 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      To
                    </label>
                    <input
                      type="number"
                      value={endRange}
                      onChange={(e) => {
                        let val = parseInt(e.target.value) || 1;
                        if (val > dateFilteredStats.totalRecords) {
                          val = dateFilteredStats.totalRecords;
                        }
                        setEndRange(val);
                        checkAvailableSpace(selectedPath, { end: val });
                      }}
                      min="1"
                      max={dateFilteredStats.totalRecords}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="End"
                    />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {Math.max(
                      0,
                      Math.min(endRange, dateFilteredStats.totalRecords) -
                        startRange +
                        1
                    )}{" "}
                    reports selected
                  </span>
                </div>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={handlePrintReport}
              disabled={
                loading ||
                !startDate ||
                !endDate ||
                (startDate &&
                  endDate &&
                  new Date(startDate) > new Date(endDate))
              }
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform ${
                loading ||
                !startDate ||
                !endDate ||
                (startDate &&
                  endDate &&
                  new Date(startDate) > new Date(endDate))
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>
                    {progress
                      ? `Processing ${progress.current}/${progress.total}...`
                      : "Processing..."}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>
                    {!startDate || !endDate
                      ? "Select Date Range to Continue"
                      : downloadMode === "range"
                      ? `Download Reports ${startRange}-${endRange}`
                      : "Download All Filtered Reports"}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {status.message && (
          <div
            className={`mb-6 rounded-xl border-l-4 p-6 shadow-lg ${
              status.type === "success"
                ? "bg-green-50 border-green-400 text-green-800 dark:bg-green-900/30 dark:border-green-600 dark:text-green-200"
                : status.type === "warning"
                ? "bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-200"
                : "bg-red-50 border-red-400 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-200"
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {status.type === "success" && (
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {status.type === "warning" && (
                  <svg
                    className="w-6 h-6 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                )}
                {status.type === "error" && (
                  <svg
                    className="w-6 h-6 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{status.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Download Info */}
        {downloadInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Download Summary</span>
              </h3>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {downloadInfo.totalRecords}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Total Records
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {downloadInfo.successfulDownloads}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Successful
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                      {downloadInfo.failedDownloads}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Failed
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {downloadInfo.totalFiles}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Total Files
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      📁 Download Location:
                    </div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total Size: {downloadInfo.totalSize}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-600 dark:text-gray-200 p-3 rounded border dark:border-gray-500 font-mono text-sm break-all">
                    {downloadInfo.downloadPath}
                  </div>
                </div>

                {downloadInfo.details && downloadInfo.details.length > 0 && (
                  <details className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                      📄 View Detailed Results ({downloadInfo.details.length}{" "}
                      reports)
                    </summary>
                    <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                      {downloadInfo.details.map((detail, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            detail.success
                              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                              : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium flex items-center space-x-2 dark:text-gray-200">
                              {detail.success ? (
                                <svg
                                  className="w-4 h-4 text-green-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4 text-red-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                              <span>Report #{detail.inspectionNumber}</span>
                            </span>
                            {detail.success && (
                              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                                {detail.fileCount} files
                              </span>
                            )}
                          </div>
                          {detail.success ? (
                            detail.files.length > 0 && (
                              <div className="space-y-1">
                                {detail.files.map((file, fileIndex) => (
                                  <div
                                    key={fileIndex}
                                    className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 p-2 rounded"
                                  >
                                    <span>• {file.name}</span>
                                    <span className="bg-gray-100 dark:bg-gray-500 px-2 py-1 rounded">
                                      {file.size}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )
                          ) : (
                            <div className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-900/40 p-2 rounded">
                              <strong>Error:</strong> {detail.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Download Dialog Modal */}
      {showDownloadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Download Configuration</span>
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Download Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span>Download Summary</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Date Range:
                    </span>
                    <div className="text-blue-600 font-medium">
                      {startDate} to {endDate}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Factory:</span>
                    <div className="text-blue-600 font-medium">
                      {factoryName || "All Factories"}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Language:</span>
                    <div className="text-blue-600 font-medium">
                      {language === "chinese"
                        ? "🇨🇳 中文 (Chinese)"
                        : "🇺🇸 English"}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Mode:</span>
                    <div className="text-blue-600 font-medium">
                      {downloadMode === "range"
                        ? `Range (${startRange}-${endRange})`
                        : "All Filtered Reports"}
                    </div>
                  </div>
                  {spaceInfo?.recordCount && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">
                        Reports to Download:
                      </span>
                      <div className="text-blue-600 font-medium">
                        {spaceInfo.recordCount}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Storage Information */}
              {spaceInfo && (
                <div
                  className={`rounded-xl p-4 border ${
                    spaceInfo.hasEnoughSpace
                      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                      : "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {spaceInfo.hasEnoughSpace ? (
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-yellow-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Storage Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Available Space:
                          </span>
                          <div className="text-gray-900 dark:text-white">
                            {spaceInfo.availableSpace}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Estimated Download:
                          </span>
                          <div className="text-gray-900 dark:text-white">
                            {spaceInfo.estimatedDownloadSize}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Location:
                          </span>
                          <div className="text-gray-900 dark:text-gray-200 font-mono text-xs bg-white dark:bg-gray-700 p-2 rounded border dark:border-gray-600 mt-1 break-all">
                            {spaceInfo.path}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-sm mt-3 p-2 rounded ${
                          spaceInfo.hasEnoughSpace
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                        }`}
                      >
                        {spaceInfo.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Path Input */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                  📁 Custom Download Path (Optional)
                </label>
                <input
                  type="text"
                  value={selectedPath}
                  onChange={handlePathChange}
                  placeholder="Leave empty for default path (e.g., C:\Downloads\Reports)"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                {pathValidation && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      pathValidation.isValid
                        ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                        : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {pathValidation.isValid ? (
                        <svg
                          className="w-4 h-4 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span>{pathValidation.message}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => {
                    setShowDownloadDialog(false);
                    setSelectedPath("");
                    setSpaceInfo(null);
                    setPathValidation(null);
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDownload}
                  disabled={
                    loading || (pathValidation && !pathValidation.isValid)
                  }
                  className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 font-medium ${
                    loading || (pathValidation && !pathValidation.isValid)
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Downloading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Start Download</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintP88Report;
