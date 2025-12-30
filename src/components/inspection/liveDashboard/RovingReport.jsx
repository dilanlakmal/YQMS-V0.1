import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from "@react-pdf/renderer";
import RovingReportPDFA3 from "./RovingReportPDFA3";
import RovingReportPDFA4 from "./RovingReportPDFA4";
import { Eye, RefreshCw, TrendingUp, TrendingDown, Activity, Moon, Sun } from "lucide-react";
import RovingReportFilterPane from "./RovingReportFilterPane";
import RovingReportDetailView from "./RovingReportDetailView";

// Helper function to determine Buyer based on mo_no (must match backend)
const getBuyerFromMoNumber = (moNo) => {
  if (!moNo) return "Other";
  if (moNo.includes("COM")) return "MWW";
  if (moNo.includes("CO")) return "Costco";
  if (moNo.includes("AR")) return "Aritzia";
  if (moNo.includes("RT")) return "Reitmans";
  if (moNo.includes("AF")) return "ANF";
  if (moNo.includes("NT")) return "STORI";
  return "Other";
};

const RovingReport = () => {
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Filter states
  const [startDate, setStartDate] = useState(new Date()); // Default to today
  const [endDate, setEndDate] = useState(null);
  const [lineNo, setLineNo] = useState("");
  const [moNo, setMoNo] = useState("");
  const [buyer, setBuyer] = useState("");
  const [operation, setOperation] = useState("");
  const [qcId, setQcId] = useState("");
  const [paperSize, setPaperSize] = useState("A3"); // Default to A3
  const [reportData, setReportData] = useState([]);
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [moNos, setMoNos] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [operations, setOperations] = useState([]);
  const [qcIds, setQcIds] = useState([]);
  const [lineNos, setLineNos] = useState([]); // Make lineNos stateful
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const RECORDS_PER_PAGE = 20;

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Apply dark class to document root
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Format date to "MM/DD/YYYY"
  const formatDate = (date) => {
    if (!date) return "";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Format timestamp to "MM/DD/YYYY HH:MM:SS"
  const formatTimestamp = (date) => {
    if (!date) return "Never";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const seconds = ("0" + date.getSeconds()).slice(-2);
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (startDate) params.startDate = formatDate(startDate);
      if (endDate) params.endDate = formatDate(endDate);
      if (lineNo) params.line_no = lineNo;
      if (moNo) params.mo_no = moNo;
      if (buyer) params.buyer_name = buyer;
      if (operation) params.operation_name = operation;
      if (qcId) params.emp_id = qcId;

      const response = await axios.get(
        `${API_BASE_URL}/api/qc-inline-roving-reports-filtered`,
        {
          params
        }
      );
      setReportData(response.data);
      setLastUpdated(new Date()); // Update the last updated timestamp
    } catch (error) {
      console.error("Error fetching roving report data:", error);
      setReportData([]);
      setLastUpdated(new Date()); // Update timestamp even on error
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch and set up polling
  useEffect(() => {
    fetchReportData(); // Initial fetch
    // Set up polling every 10 seconds
    const intervalId = setInterval(() => {
      fetchReportData();
    }, 10000); // 10 seconds interval

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [startDate, endDate, lineNo, moNo, qcId, buyer, operation]);

  // The dependency array ensures data is re-fetched whenever filters change.

  // Process fetched reportData and extract dropdown options
  useEffect(() => {
    const applyFilters = () => {
      // Extract unique values for dropdowns from the fetched data
      const uniqueLineNos = new Set();
      const uniqueMoNos = new Set();
      const uniqueBuyers = new Set();
      const uniqueQcIds = new Set();
      const uniqueTgNos = new Set(); // For the Operation filter

      reportData.forEach((report) => {
        if (report.line_no) uniqueLineNos.add(report.line_no);
        if (report.mo_no) uniqueMoNos.add(report.mo_no);
        if (report.mo_no) {
          const derivedBuyer = getBuyerFromMoNumber(report.mo_no);
          uniqueBuyers.add(derivedBuyer);
        }
        //if (report.buyer_name) uniqueBuyers.add(report.buyer_name);
        if (report.inspection_rep && Array.isArray(report.inspection_rep)) {
          report.inspection_rep.forEach((repEntry) => {
            if (repEntry.emp_id) uniqueQcIds.add(repEntry.emp_id);
            if (repEntry.inlineData && Array.isArray(repEntry.inlineData)) {
              repEntry.inlineData.forEach((item) => {
                if (item.tg_no) uniqueTgNos.add(item.tg_no); // Extract TG No.
              });
            }
          });
        }
      });

      const processedData = reportData.map((report) => {
        const inspectionRepCount =
          report.inspection_rep && Array.isArray(report.inspection_rep)
            ? report.inspection_rep.length
            : 0;

        return {
          ...report,
          inspectionRepCount,
          uniqueKey: `report-${
            report._id?.$oid ||
            report.inline_roving_id ||
            (typeof report._id === "string"
              ? report._id
              : JSON.stringify(report._id))
          }`
        };
      });

      // Update dropdown states with extracted unique values
      setLineNos(Array.from(uniqueLineNos).sort());
      setMoNos(Array.from(uniqueMoNos).sort());
      setBuyers(Array.from(uniqueBuyers).sort());
      setQcIds(Array.from(uniqueQcIds).sort());
      setOperations(Array.from(uniqueTgNos).sort()); // Set TG Nos for Operations

      const groupedData = processedData;
      setFilteredData(groupedData);

      const newTotalPages = Math.ceil(groupedData.length / RECORDS_PER_PAGE);
      if (currentPage >= newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages - 1);
      } else if (newTotalPages === 0 && currentPage !== 0) {
        setCurrentPage(0);
      } else if (currentPage < 0 && newTotalPages > 0) {
        setCurrentPage(0);
      }
    };

    applyFilters();
  }, [reportData]); // This effect runs whenever reportData changes

  const calculateMetrics = (inlineEntry) => {
    const checkedQty = inlineEntry?.checked_quantity || 0;
    const rejectGarments = Array.isArray(inlineEntry?.rejectGarments)
      ? inlineEntry.rejectGarments
      : [];

    // Calculate totalDefectsQty (sum of defect counts)
    const totalDefectsQty = rejectGarments.reduce(
      (sum, garment) => sum + (garment?.totalCount || 0),
      0
    );

    // Calculate rejectGarmentCount based on garments array
    let rejectGarmentCount = 0;
    rejectGarments.forEach((garment) => {
      if (Array.isArray(garment?.garments) && garment.garments.length > 0) {
        rejectGarmentCount += garment.garments.length; // Count objects in garments array
      }
    });

    const goodOutput = checkedQty - rejectGarmentCount;
    const defectRate =
      checkedQty > 0 ? (totalDefectsQty / checkedQty) * 100 : 0;
    const defectRatio =
      checkedQty > 0 ? (rejectGarmentCount / checkedQty) * 100 : 0;
    const passRate = checkedQty > 0 ? (goodOutput / checkedQty) * 100 : 0;

    const defectDetails = rejectGarments
      .flatMap((garment) =>
        Array.isArray(garment?.garments)
          ? garment.garments.flatMap((g) =>
              Array.isArray(g?.defects)
                ? g.defects.map((defect) => ({
                    name: defect?.name || "Unknown",
                    count: defect?.count || 0
                  }))
                : []
            )
          : []
      )
      .reduce((acc, defect) => {
        if (!defect || !defect.name) return acc; // Skip invalid defects
        const existing = acc.find((d) => d.name === defect.name);
        if (existing) {
          existing.count += defect.count;
        } else {
          acc.push({ name: defect.name, count: defect.count });
        }
        return acc;
      }, []);

    return {
      defectRate: defectRate.toFixed(2),
      defectRatio: defectRatio.toFixed(2),
      passRate: passRate.toFixed(2),
      totalDefectsQty,
      rejectGarmentCount,
      defectDetails
    };
  };

  const calculateGroupMetrics = (group) => {
    let totalCheckedQty = 0;
    let totalDefectsQty = 0;
    let totalRejectGarmentCount = 0;
    let totalSpiPass = 0;
    let totalSpiReject = 0;
    let totalMeasurementPass = 0;
    let totalMeasurementReject = 0;

    const dataToProcess = [];
    if (group && Array.isArray(group.inspection_rep)) {
      group.inspection_rep.forEach((repEntry) => {
        if (repEntry && Array.isArray(repEntry.inlineData)) {
          dataToProcess.push(...repEntry.inlineData);
        }
      });
    } else if (group && Array.isArray(group.inlineData)) {
      dataToProcess.push(...group.inlineData);
    } else {
      return {
        totalCheckedQty: 0,
        totalDefectsQty: 0,
        totalRejectGarmentCount: 0,
        defectRate: "0.00",
        defectRatio: "0.00",
        passRate: "0.00",
        totalSpiPass: 0,
        totalSpiReject: 0,
        totalMeasurementPass: 0,
        totalMeasurementReject: 0
      };
    }

    dataToProcess.forEach((entry) => {
      const metrics = calculateMetrics(entry);
      totalCheckedQty += entry.checked_quantity || 0;
      totalDefectsQty += metrics.totalDefectsQty;
      totalRejectGarmentCount += metrics.rejectGarmentCount;

      if (entry.spi === "Pass") totalSpiPass++;
      if (entry.spi === "Reject") totalSpiReject++;
      if (entry.measurement === "Pass") totalMeasurementPass++;
      if (entry.measurement === "Reject") totalMeasurementReject++;
    });

    const goodOutput = totalCheckedQty - totalRejectGarmentCount;
    const defectRate =
      totalCheckedQty > 0 ? (totalDefectsQty / totalCheckedQty) * 100 : 0;
    const defectRatio =
      totalCheckedQty > 0
        ? (totalRejectGarmentCount / totalCheckedQty) * 100
        : 0;
    const passRate =
      totalCheckedQty > 0 ? (goodOutput / totalCheckedQty) * 100 : 0;

    return {
      totalCheckedQty,
      totalDefectsQty,
      totalRejectGarmentCount,
      defectRate: defectRate.toFixed(2),
      defectRatio: defectRatio.toFixed(2),
      passRate: passRate.toFixed(2),
      totalSpiPass,
      totalSpiReject,
      totalMeasurementPass,
      totalMeasurementReject
    };
  };

  // Calculate overall summary metrics
  const calculateOverallMetrics = () => {
    let totalChecked = 0;
    let totalDefects = 0;
    let totalRejects = 0;
    let totalSpiPass = 0;
    let totalSpiReject = 0;

    filteredData.forEach((record) => {
      const metrics = calculateGroupMetrics(record);
      totalChecked += metrics.totalCheckedQty;
      totalDefects += metrics.totalDefectsQty;
      totalRejects += metrics.totalRejectGarmentCount;
      totalSpiPass += metrics.totalSpiPass;
      totalSpiReject += metrics.totalSpiReject;
    });

    const overallDefectRate = totalChecked > 0 ? (totalDefects / totalChecked) * 100 : 0;
    const overallPassRate = totalChecked > 0 ? ((totalChecked - totalRejects) / totalChecked) * 100 : 0;

    return {
      totalChecked,
      totalDefects,
      totalRejects,
      overallDefectRate: overallDefectRate.toFixed(2),
      overallPassRate: overallPassRate.toFixed(2),
      totalSpiPass,
      totalSpiReject
    };
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / RECORDS_PER_PAGE);
  // Ensure validCurrentPage is 0 if totalPages is 0, otherwise between 0 and totalPages - 1
  const validCurrentPage = Math.max(
    0,
    Math.min(currentPage, totalPages > 0 ? totalPages - 1 : 0)
  );
  const startIndex = validCurrentPage * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const currentRecordsOnPage = filteredData.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setStartDate(new Date()); // Reset to today
    setEndDate(null);
    setLineNo("");
    setMoNo("");
    setBuyer("");
    setOperation("");
    setQcId("");
  };

  const handleToggleDetailView = (rowKey) => {
    setExpandedRowKey((prevKey) => (prevKey === rowKey ? null : rowKey));
  };

  const closeDetailView = () => {
    setExpandedRowKey(null);
  };

  // Helper function to get background color based on value and type (updated for dark mode)
  const getBackgroundColor = (value, type) => {
    const numValue = parseFloat(value);
    if (type === "passRate") {
      if (numValue > 80) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
      if (numValue >= 50 && numValue <= 80) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    } else {
      // For defectRate and defectRatio
      if (numValue > 10) return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
      if (numValue >= 5 && numValue <= 10) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    }
  };

  const overallMetrics = calculateOverallMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                QC Inline Roving Report
              </h1>
              <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Real-time quality control monitoring dashboard
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isLoading && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Updating...</span>
                </div>
              )}
              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                <div>Last Updated:</div>
                <div className="font-medium">{formatTimestamp(lastUpdated)}</div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {filteredData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Checked</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallMetrics.totalChecked.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pass Rate</p>
                    <p className={`text-2xl font-bold ${parseFloat(overallMetrics.overallPassRate) > 80 ? 'text-green-600 dark:text-green-400' : parseFloat(overallMetrics.overallPassRate) >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {overallMetrics.overallPassRate}%
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${parseFloat(overallMetrics.overallPassRate) > 80 ? 'bg-green-100 dark:bg-green-900/30' : parseFloat(overallMetrics.overallPassRate) >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    <TrendingUp className={`w-6 h-6 ${parseFloat(overallMetrics.overallPassRate) > 80 ? 'text-green-600 dark:text-green-400' : parseFloat(overallMetrics.overallPassRate) >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`} />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Defect Rate</p>
                    <p className={`text-2xl font-bold ${parseFloat(overallMetrics.overallDefectRate) > 10 ? 'text-red-600 dark:text-red-400' : parseFloat(overallMetrics.overallDefectRate) >= 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                      {overallMetrics.overallDefectRate}%
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${parseFloat(overallMetrics.overallDefectRate) > 10 ? 'bg-red-100 dark:bg-red-900/30' : parseFloat(overallMetrics.overallDefectRate) >= 5 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                    <TrendingDown className={`w-6 h-6 ${parseFloat(overallMetrics.overallDefectRate) > 10 ? 'text-red-600 dark:text-red-400' : parseFloat(overallMetrics.overallDefectRate) >= 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`} />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredData.length}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Panel */}
        <div className="mb-6">
          <RovingReportFilterPane
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            lineNo={lineNo}
            setLineNo={setLineNo}
            lineNos={lineNos}
            buyer={buyer}
            setBuyer={setBuyer}
            buyers={buyers}
            operation={operation}
            setOperation={setOperation}
            operations={operations}
            qcId={qcId}
            setQcId={setQcId}
            qcIds={qcIds}
            moNo={moNo}
            setMoNo={setMoNo}
            moNos={moNos}
            onClearFilters={handleClearFilters}
            lastUpdated={lastUpdated}
            formatTimestamp={formatTimestamp}
          />
        </div>

        {/* Report Content */}
        {filteredData.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 transition-colors duration-300">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Activity className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Data Available</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">No records found for the selected filters.</p>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Quality Control Summary</h2>
              <p className="text-blue-100 dark:text-blue-200 text-sm mt-1">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} records
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                      Inspection Date
                    </th>
                    <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                      Line No
                    </th>
                    <th rowSpan="2" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                      MO No
                    </th>
                    <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                      Inspections
                    </th>
                    <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                      Checked Qty
                    </th>
                    <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                      Reject Garments
                    </th>
                    <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                      Defect Qty
                    </th>
                    <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                      Defect Rate (%)
                    </th>
                    <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                      Defect Ratio (%)
                    </th>
                    <th colSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">
                      SPI Results
                    </th>
                    <th colSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/20">
                      Measurement
                    </th>
                    <th rowSpan="2" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/20">
                      Pass
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600 bg-red-50 dark:bg-red-900/20">
                      Reject
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/20">
                      Pass
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600 bg-red-50 dark:bg-red-900/20">
                      Reject
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {currentRecordsOnPage.map((record, index) => {
                    if (expandedRowKey && record.uniqueKey !== expandedRowKey) {
                      return null; // Hide other rows when one is expanded
                    }

                    const metrics = calculateGroupMetrics(record);
                    const isEvenRow = index % 2 === 0;

                    return (
                      <React.Fragment key={record.uniqueKey}>
                        <tr className={`${
                          isEvenRow 
                            ? 'bg-white dark:bg-gray-800' 
                            : 'bg-gray-50 dark:bg-gray-700/50'
                        } hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150 border-b border-gray-100 dark:border-gray-600/50`}>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium border-r border-gray-200 dark:border-gray-600/50">
                            {record.inspection_date}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600/50">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                              {record.line_no}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600/50">
                            <span className="font-medium">{record.mo_no}</span>
                          </td>
                          <td className="px-4 py-4 text-sm text-center border-r border-gray-200 dark:border-gray-600/50">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300">
                              {record.inspectionRepCount}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-center font-semibold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600/50">
                            {metrics.totalCheckedQty || 0}
                          </td>
                          <td className="px-4 py-4 text-sm text-center font-semibold border-r border-gray-200 dark:border-gray-600/50">
                            <span className={`${metrics.totalRejectGarmentCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {metrics.totalRejectGarmentCount || 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-center font-semibold border-r border-gray-200 dark:border-gray-600/50">
                            <span className={`${metrics.totalDefectsQty > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {metrics.totalDefectsQty || 0}
                            </span>
                          </td>
                          <td className={`px-4 py-4 text-sm text-center font-semibold border-r border-gray-200 dark:border-gray-600/50`}>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBackgroundColor(metrics.defectRate, "defectRate")}`}>
                              {metrics.defectRate}%
                            </span>
                          </td>
                          <td className={`px-4 py-4 text-sm text-center font-semibold border-r border-gray-200 dark:border-gray-600/50`}>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBackgroundColor(metrics.defectRatio, "defectRatio")}`}>
                              {metrics.defectRatio}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-center font-semibold border-r border-gray-200 dark:border-gray-600/50 bg-green-50 dark:bg-green-900/10">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                              {metrics.totalSpiPass || 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-center font-semibold border-r border-gray-200 dark:border-gray-600/50 bg-red-50 dark:bg-red-900/10">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                              {metrics.totalSpiReject || 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-center font-semibold border-r border-gray-200 dark:border-gray-600/50 bg-green-50 dark:bg-green-900/10">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                              {metrics.totalMeasurementPass || 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-center font-semibold border-r border-gray-200 dark:border-gray-600/50 bg-red-50 dark:bg-red-900/10">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                              {metrics.totalMeasurementReject || 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-center">
                            <button
                              onClick={() => handleToggleDetailView(record.uniqueKey)}
                              className="inline-flex items-center p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors duration-150"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>

                        {expandedRowKey === record.uniqueKey && (
                          <tr>
                            <td colSpan="14" className="p-0">
                              <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                                <RovingReportDetailView
                                  reportDetail={record}
                                  onClose={closeDetailView}
                                  calculateGroupMetrics={calculateGroupMetrics}
                                  filters={{
                                    startDate: formatDate(startDate),
                                    endDate: endDate ? formatDate(endDate) : null,
                                    lineNo,
                                    moNo,
                                    buyer,
                                    operation,
                                    qcId
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span>
                    Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span> of{" "}
                    <span className="font-medium">{filteredData.length}</span> results
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      currentPage === 0
                        ? "bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (currentPage < 3) {
                        pageNum = i;
                      } else if (currentPage > totalPages - 4) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                            currentPage === pageNum
                              ? "bg-blue-600 dark:bg-blue-700 text-white"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1 || totalPages === 0}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      currentPage >= totalPages - 1 || totalPages === 0
                        ? "bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer with additional info */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Data refreshes automatically every 10 seconds • Last update: {formatTimestamp(lastUpdated)}</p>
        </div>
      </div>
    </div>
  );
};

export default RovingReport;

