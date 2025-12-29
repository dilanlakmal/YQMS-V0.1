import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../../../config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Download, 
  FileText, 
  RefreshCw, 
  Filter,
  Calendar,
  MapPin,
  Package,
  User,
  Palette,
  Ruler,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Search,
  X
} from "lucide-react";

const LiveSummary = ({ filters = {} }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customFilters, setCustomFilters] = useState({
    addDates: false,
    addLines: false,
    addMO: false,
    addBuyer: false,
    addColors: false,
    addSizes: false
  });

  // Determine if filters are applied
  const isMoNoFiltered = filters.moNo && filters.moNo.trim() !== "";
  const isLineNoFiltered = filters.lineNo && filters.lineNo.trim() !== "";
  const isColorFiltered = filters.color && filters.color.trim() !== "";
  const isSizeFiltered = filters.size && filters.size.trim() !== "";

  // Fetch data from the API
  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      console.log("Fetching data with filters:", filters);
      
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== "" && value !== undefined && value !== null
        )
      );

      // Add custom grouping parameters
      activeFilters.groupByDate = customFilters.addDates ? "true" : "false";
      activeFilters.groupByLine = customFilters.addLines || isLineNoFiltered ? "true" : "false";
      activeFilters.groupByMO = customFilters.addMO || isMoNoFiltered ? "true" : "false";
      activeFilters.groupByBuyer = customFilters.addBuyer ? "true" : "false";
      activeFilters.groupByColor = customFilters.addColors || isColorFiltered ? "true" : "false";
      activeFilters.groupBySize = customFilters.addSizes || isSizeFiltered ? "true" : "false";

      const queryString = new URLSearchParams(activeFilters).toString();
      const url = queryString
        ? `${API_BASE_URL}/api/qc2-mo-summaries?${queryString}`
        : `${API_BASE_URL}/api/qc2-mo-summaries`;

      console.log("Fetching from URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data);

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: Expected an array");
      }

      setSummaryData(data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch summary data");
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
      reconnection: true
    });

    socket.on("qc2_data_updated", fetchSummaryData);

    return () => {
      socket.off("qc2_data_updated", fetchSummaryData);
      socket.disconnect();
    };
  }, [JSON.stringify(filters), customFilters]);

  // Process defect details
  const processDefectDetails = (defectArray, checkedQty) => {
    const defectMap = {};
    defectArray.forEach((defect) => {
      if (defect.defectName && defect.totalCount > 0) {
        defectMap[defect.defectName] = (defectMap[defect.defectName] || 0) + defect.totalCount;
      }
    });

    return Object.entries(defectMap)
      .map(([name, count]) => ({
        name,
        count,
        defectRate: checkedQty > 0 ? (count / checkedQty) * 100 : 0
      }))
      .sort((a, b) => b.defectRate - a.defectRate);
  };

  // Get status badge for rates
  const getStatusBadge = (rate) => {
    const percentage = rate * 100;
    if (percentage > 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {percentage.toFixed(1)}%
        </span>
      );
    } else if (percentage >= 2) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          <TrendingUp className="w-3 h-3 mr-1" />
          {percentage.toFixed(1)}%
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          {percentage.toFixed(1)}%
        </span>
      );
    }
  };

  // Get defect badge with enhanced styling
  const getDefectBadge = (defect) => {
    const rate = defect.defectRate;
    let bgColor = "bg-green-50 dark:bg-green-900/20";
    let textColor = "text-green-700 dark:text-green-300";
    let borderColor = "border-green-200 dark:border-green-700";
    let icon = CheckCircle;

    if (rate > 3) {
      bgColor = "bg-red-50 dark:bg-red-900/20";
      textColor = "text-red-700 dark:text-red-300";
      borderColor = "border-red-200 dark:border-red-700";
      icon = AlertTriangle;
    } else if (rate >= 2) {
      bgColor = "bg-amber-50 dark:bg-amber-900/20";
      textColor = "text-amber-700 dark:text-amber-300";
      borderColor = "border-amber-200 dark:border-amber-700";
      icon = TrendingUp;
    }

    const IconComponent = icon;

    return (
      <div className={`${bgColor} ${textColor} ${borderColor} border rounded-lg p-3 mb-2 transition-all duration-200 hover:shadow-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <IconComponent className="w-4 h-4 mr-2" />
            <span className="font-semibold text-sm">{defect.name}</span>
          </div>
          <span className="text-xs font-bold">{rate.toFixed(1)}%</span>
        </div>
        <div className="text-xs opacity-75 mt-1 flex items-center">
          <span>{defect.count.toLocaleString()} units</span>
          <div className="ml-2 flex-1 bg-white dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                rate > 3 ? 'bg-red-400' : rate >= 2 ? 'bg-amber-400' : 'bg-green-400'
              }`}
              style={{ width: `${Math.min(rate * 10, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Process and sort data
  const processedData = summaryData.map((row) => ({
    ...row,
    defectArray: processDefectDetails(row.defectArray || [], row.checkedQty || 0)
  }));

  // Filter data based on search term
  const filteredData = processedData.filter(row => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (row.moNo && row.moNo.toLowerCase().includes(searchLower)) ||
      (row.lineNo && row.lineNo.toString().toLowerCase().includes(searchLower)) ||
      (row.buyer && row.buyer.toLowerCase().includes(searchLower)) ||
      (row.color && row.color.toLowerCase().includes(searchLower)) ||
      (row.size && row.size.toLowerCase().includes(searchLower)) ||
      (row.inspection_date && row.inspection_date.toLowerCase().includes(searchLower))
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (customFilters.addDates) {
      const dateA = a.inspection_date || "";
      const dateB = b.inspection_date || "";
      if (dateA !== dateB) return dateA.localeCompare(dateB);
    }

    if (customFilters.addLines || isLineNoFiltered) {
      const lineA = a.lineNo || "N/A";
      const lineB = b.lineNo || "N/A";
      const aIsNumeric = !isNaN(lineA) && lineA !== "N/A";
      const bIsNumeric = !isNaN(lineB) && lineB !== "N/A";

      if (aIsNumeric && bIsNumeric) return Number(lineA) - Number(lineB);
      else if (aIsNumeric && !bIsNumeric) return -1;
      else if (!aIsNumeric && bIsNumeric) return 1;
      else if (lineA !== lineB) return lineA.localeCompare(lineB);
    }

    if (customFilters.addMO || isMoNoFiltered) {
      const moA = a.moNo || "";
      const moB = b.moNo || "";
      return moA.localeCompare(moB);
    }

    return 0;
  });

  // Keep all your existing export functions unchanged
  const prepareExcelData = () => {
    const data = [];
    sortedData.forEach((row) => {
      const defectDetails = row.defectArray || [];
      if (defectDetails.length === 0) {
        data.push({
          ...(customFilters.addDates && { Date: row.inspection_date || "N/A" }),
          ...((customFilters.addLines || isLineNoFiltered) && { "Line No": row.lineNo || "N/A" }),
          ...((customFilters.addMO || isMoNoFiltered) && { "MO No": row.moNo || "N/A" }),
          ...(customFilters.addBuyer && { Buyer: row.buyer || "N/A" }),
          ...((customFilters.addColors || isColorFiltered) && { Color: row.color || "N/A" }),
          ...((customFilters.addSizes || isSizeFiltered) && { Size: row.size || "N/A" }),
          "Checked Qty": row.checkedQty?.toLocaleString() || "0",
          "Total Pass": row.totalPass?.toLocaleString() || "0",
          "Reject Units": row.totalRejects?.toLocaleString() || "0",
          "Defects Qty": row.defectsQty?.toLocaleString() || "0",
          "Defect Rate (%)": `${(row.defectRate * 100).toFixed(1) || "0.0"}%`,
          "Defect Ratio (%)": `${(row.defectRatio * 100).toFixed(1) || "0.0"}%`,
          "Total Bundles": row.totalBundles?.toLocaleString() || "0",
          "Defective Bundles": row.defectiveBundles?.toLocaleString() || "0",
          "Defect Details": "No Defects"
        });
      } else {
        defectDetails.forEach((defect, index) => {
          data.push({
            ...(customFilters.addDates && { Date: index === 0 ? row.inspection_date || "N/A" : "" }),
            ...((customFilters.addLines || isLineNoFiltered) && { "Line No": index === 0 ? row.lineNo || "N/A" : "" }),
            ...((customFilters.addMO || isMoNoFiltered) && { "MO No": index === 0 ? row.moNo || "N/A" : "" }),
            ...(customFilters.addBuyer && { Buyer: index === 0 ? row.buyer || "N/A" : "" }),
            ...((customFilters.addColors || isColorFiltered) && { Color: index === 0 ? row.color || "N/A" : "" }),
            ...((customFilters.addSizes || isSizeFiltered) && { Size: index === 0 ? row.size || "N/A" : "" }),
            "Checked Qty": index === 0 ? row.checkedQty?.toLocaleString() || "0" : "",
            "Total Pass": index === 0 ? row.totalPass?.toLocaleString() || "0" : "",
            "Reject Units": index === 0 ? row.totalRejects?.toLocaleString() || "0" : "",
            "Defects Qty": index === 0 ? row.defectsQty?.toLocaleString() || "0" : "",
            "Defect Rate (%)": index === 0 ? `${(row.defectRate * 100).toFixed(1) || "0.0"}%` : "",
            "Defect Ratio (%)": index === 0 ? `${(row.defectRatio * 100).toFixed(1) || "0.0"}%` : "",
            "Total Bundles": index === 0 ? row.totalBundles?.toLocaleString() || "0" : "",
            "Defective Bundles": index === 0 ? row.defectiveBundles?.toLocaleString() || "0" : "",
            "Defect Details": `${defect.name}: ${defect.count.toLocaleString()} (${defect.defectRate.toFixed(1)}%)`
          });
        });
      }
    });
    return data;
  };

  const preparePDFData = () => {
    return sortedData.map((row) => {
      const defectDetails = row.defectArray || [];
      const defectDetailsText = defectDetails
        .map((d) => `${d.name}: ${d.count} (${d.defectRate.toFixed(1)}%)`)
        .join("\n") || "No Defects";

      return [
        ...(customFilters.addDates ? [row.inspection_date || "N/A"] : []),
        ...(customFilters.addLines || isLineNoFiltered ? [row.lineNo || "N/A"] : []),
        ...(customFilters.addMO || isMoNoFiltered ? [row.moNo || "N/A"] : []),
        ...(customFilters.addBuyer ? [row.buyer || "N/A"] : []),
        ...(customFilters.addColors || isColorFiltered ? [row.color || "N/A"] : []),
        ...(customFilters.addSizes || isSizeFiltered ? [row.size || "N/A"] : []),
        row.checkedQty?.toLocaleString() || "0",
        row.totalPass?.toLocaleString() || "0",
        row.totalRejects?.toLocaleString() || "0",
        row.defectsQty?.toLocaleString() || "0",
        `${(row.defectRate * 100).toFixed(1) || "0.0"}%`,
        `${(row.defectRatio * 100).toFixed(1) || "0.0"}%`,
        row.totalBundles?.toLocaleString() || "0",
        row.defectiveBundles?.toLocaleString() || "0",
        defectDetailsText
      ];
    });
  };

  const downloadExcel = () => {
    const data = prepareExcelData();
    const ws = XLSX.utils.json_to_sheet(data);

    ws["!cols"] = [
      ...(customFilters.addDates ? [{ wch: 12 }] : []),
      ...(customFilters.addLines || isLineNoFiltered ? [{ wch: 10 }] : []),
      ...(customFilters.addMO || isMoNoFiltered ? [{ wch: 15 }] : []),
      ...(customFilters.addBuyer ? [{ wch: 20 }] : []),
      ...(customFilters.addColors || isColorFiltered ? [{ wch: 15 }] : []),
      ...(customFilters.addSizes || isSizeFiltered ? [{ wch: 10 }] : []),
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 40 }
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (!ws[cellRef]) continue;
        ws[cellRef].s = { font: { name: "Calibri", sz: 11 } };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Summary");
    XLSX.writeFile(wb, "LiveSummary.xlsx");
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("helvetica");
    doc.setFontSize(12);
    doc.text("Live Summary Report", 14, 10);

    const headers = [
      ...(customFilters.addDates ? ["Date"] : []),
      ...(customFilters.addLines || isLineNoFiltered ? ["Line No"] : []),
      ...(customFilters.addMO || isMoNoFiltered ? ["MO No"] : []),
      ...(customFilters.addBuyer ? ["Buyer"] : []),
      ...(customFilters.addColors || isColorFiltered ? ["Color"] : []),
      ...(customFilters.addSizes || isSizeFiltered ? ["Size"] : []),
      "Checked Qty", "Total Pass", "Reject Units", "Defects Qty",
      "Defect Rate (%)", "Defect Ratio (%)", "Total Bundles", "Defective Bundles", "Defect Details"
    ];

    // Calculate dynamic column indices (keeping your existing logic)
    let currentIndex = 0;
    const columnIndices = {};
    if (customFilters.addDates) columnIndices.date = currentIndex++;
    if (customFilters.addLines || isLineNoFiltered) columnIndices.lineNo = currentIndex++;
    if (customFilters.addMO || isMoNoFiltered) columnIndices.moNo = currentIndex++;
    if (customFilters.addBuyer) columnIndices.buyer = currentIndex++;
    if (customFilters.addColors || isColorFiltered) columnIndices.color = currentIndex++;
    if (customFilters.addSizes || isSizeFiltered) columnIndices.size = currentIndex++;

    const checkedQtyIndex = currentIndex++;
    const totalPassIndex = currentIndex++;
    const rejectUnitsIndex = currentIndex++;
    const defectsQtyIndex = currentIndex++;
    const defectRateIndex = currentIndex++;
    const defectRatioIndex = currentIndex++;
    const totalBundlesIndex = currentIndex++;
    const defectiveBundlesIndex = currentIndex++;
    const defectDetailsIndex = currentIndex++;

    const columnStyles = {
      ...(customFilters.addDates ? { [columnIndices.date]: { cellWidth: 20 } } : {}),
      ...(customFilters.addLines || isLineNoFiltered ? { [columnIndices.lineNo]: { cellWidth: 15 } } : {}),
      ...(customFilters.addMO || isMoNoFiltered ? { [columnIndices.moNo]: { cellWidth: 20 } } : {}),
      ...(customFilters.addBuyer ? { [columnIndices.buyer]: { cellWidth: 25 } } : {}),
      ...(customFilters.addColors || isColorFiltered ? { [columnIndices.color]: { cellWidth: 15 } } : {}),
      ...(customFilters.addSizes || isSizeFiltered ? { [columnIndices.size]: { cellWidth: 10 } } : {}),
      [checkedQtyIndex]: { cellWidth: 20 },
      [totalPassIndex]: { cellWidth: 20 },
      [rejectUnitsIndex]: { cellWidth: 20 },
      [defectsQtyIndex]: { cellWidth: 20 },
      [defectRateIndex]: { cellWidth: 20 },
      [defectRatioIndex]: { cellWidth: 20 },
      [totalBundlesIndex]: { cellWidth: 20 },
      [defectiveBundlesIndex]: { cellWidth: 20 },
      [defectDetailsIndex]: { cellWidth: 60 }
    };

    autoTable(doc, {
      head: [headers],
      body: preparePDFData(),
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2, font: "helvetica" },
      columnStyles: columnStyles,
      didParseCell: (data) => {
        if (data.section === "body" && [defectRateIndex, defectRatioIndex].includes(data.column.index)) {
          const rate = parseFloat(data.cell.text[0]?.replace("%", "") || "0");
          const rateValue = rate;
          data.cell.styles.fillColor = rateValue > 3
            ? [255, 204, 204]
            : rateValue >= 2
            ? [255, 255, 204]
            : [204, 255, 204];
        }
      }
    });

    doc.save("LiveSummary.pdf");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading summary data...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we fetch the latest information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Error Loading Data</h3>
        </div>
        <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchSummaryData}
          className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Summary Dashboard</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Real-time quality control summary • {sortedData.length} records
                {searchTerm && ` • Filtered by "${searchTerm}"`}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-600">
            <button
              onClick={downloadExcel}
              title="Download as Excel"
              className="flex items-center px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-1" />
              Excel
            </button>
            <button
              onClick={downloadPDF}
              title="Download as PDF"
              className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all duration-200"
            >
              <FileText className="w-4 h-4 mr-1" />
              PDF
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by MO, Line, Buyer, Color, Size..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Always Visible Filter Controls */}
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Column Display Options
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { key: 'addDates', label: 'Dates', icon: Calendar, forced: false },
              { key: 'addLines', label: 'Lines', icon: MapPin, forced: isLineNoFiltered },
              { key: 'addMO', label: 'MO Numbers', icon: Package, forced: isMoNoFiltered },
              { key: 'addBuyer', label: 'Buyers', icon: User, forced: false },
              { key: 'addColors', label: 'Colors', icon: Palette, forced: isColorFiltered },
              { key: 'addSizes', label: 'Sizes', icon: Ruler, forced: isSizeFiltered }
            ].map(({ key, label, icon: Icon, forced }) => (
              <label key={key} className={`flex items-center p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                customFilters[key] || forced
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              } ${forced ? 'opacity-75 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={customFilters[key] || forced}
                  onChange={(e) => setCustomFilters(prev => ({ ...prev, [key]: e.target.checked }))}
                  disabled={forced}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mr-3"
                />
                <Icon className={`w-4 h-4 mr-2 ${
                  customFilters[key] || forced ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  customFilters[key] || forced ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {label}
                </span>
                {forced && (
                  <span className="ml-auto text-xs text-blue-600 dark:text-blue-400 font-medium">Auto</span>
                )}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {sortedData.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
              {searchTerm ? 'No matching records found' : 'No Data Available'}
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              {searchTerm 
                ? `No summary data matches your search for "${searchTerm}"`
                : 'No summary data found for the current filters.'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    {customFilters.addDates && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Date
                        </div>
                      </th>
                    )}
                    {(customFilters.addLines || isLineNoFiltered) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          Line No
                        </div>
                      </th>
                    )}
                    {(customFilters.addMO || isMoNoFiltered) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2" />
                          MO No
                        </div>
                      </th>
                    )}
                    {customFilters.addBuyer && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Buyer
                        </div>
                      </th>
                    )}
                    {(customFilters.addColors || isColorFiltered) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Palette className="w-4 h-4 mr-2" />
                          Color
                        </div>
                      </th>
                    )}
                    {(customFilters.addSizes || isSizeFiltered) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Ruler className="w-4 h-4 mr-2" />
                          Size
                        </div>
                      </th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Checked Qty
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Pass
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reject Units
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Defects Qty
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Defect Rate
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Defect Ratio
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Bundles
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Defective Bundles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Defect Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedData.map((row, index) => {
                    const defectDetails = row.defectArray || [];
                    
                    return (
                      <tr 
                        key={index} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 ${
                          index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                        }`}
                      >
                        {customFilters.addDates && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              {row.inspection_date || "N/A"}
                            </div>
                          </td>
                        )}
                        {(customFilters.addLines || isLineNoFiltered) && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-semibold">
                              {row.lineNo || "N/A"}
                            </span>
                          </td>
                        )}
                        {(customFilters.addMO || isMoNoFiltered) && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center">
                              <Package className="w-4 h-4 mr-2 text-gray-400" />
                              {row.moNo || "N/A"}
                            </div>
                          </td>
                        )}
                        {customFilters.addBuyer && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2 text-gray-400" />
                              {row.buyer || "N/A"}
                            </div>
                          </td>
                        )}
                        {(customFilters.addColors || isColorFiltered) && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              <Palette className="w-3 h-3 mr-1" />
                              {row.color || "N/A"}
                            </span>
                          </td>
                        )}
                        {(customFilters.addSizes || isSizeFiltered) && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              <Ruler className="w-3 h-3 mr-1" />
                              {row.size || "N/A"}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {row.checkedQty?.toLocaleString() || "0"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">units</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {row.totalPass?.toLocaleString() || "0"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">passed</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                            {row.totalRejects?.toLocaleString() || "0"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">rejected</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                            {row.defectsQty?.toLocaleString() || "0"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">defects</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(row.defectRate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(row.defectRatio)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {row.totalBundles?.toLocaleString() || "0"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">bundles</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {row.defectiveBundles?.toLocaleString() || "0"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">defective</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            {defectDetails.length > 0 ? (
                              <div className="space-y-1">
                                {defectDetails.slice(0, 3).map((defect, idx) => (
                                  <div key={idx}>
                                    {getDefectBadge(defect)}
                                  </div>
                                ))}
                                {defectDetails.length > 3 && (
                                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                      +{defectDetails.length - 3} more defects
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 rounded-lg p-3 text-center">
                                <CheckCircle className="w-4 h-4 mx-auto mb-1" />
                                <span className="text-xs font-medium">No Defects</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-blue-500" />
              <span>Total Records: <strong className="text-gray-900 dark:text-white">{sortedData.length}</strong></span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              <span>
                Total Checked: <strong className="text-gray-900 dark:text-white">
                  {sortedData.reduce((sum, row) => sum + (row.checkedQty || 0), 0).toLocaleString()}
                </strong>
              </span>
            </div>
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
              <span>
                Total Defects: <strong className="text-gray-900 dark:text-white">
                  {sortedData.reduce((sum, row) => sum + (row.defectsQty || 0), 0).toLocaleString()}
                </strong>
              </span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-amber-500" />
              <span>
                Avg Defect Rate: <strong className="text-gray-900 dark:text-white">
                  {sortedData.length > 0 
                    ? ((sortedData.reduce((sum, row) => sum + (row.defectRate || 0), 0) / sortedData.length) * 100).toFixed(1)
                    : '0.0'
                  }%
                </strong>
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Good (&lt;2%)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Warning (2-3%)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Critical (&gt;3%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSummary;

