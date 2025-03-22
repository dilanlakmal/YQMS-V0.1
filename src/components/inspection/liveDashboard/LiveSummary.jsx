import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../../../config"; // Adjust path as needed
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Explicitly import autoTable
import { Download, File } from "lucide-react"; // Using File as a PDF-like icon

const LiveSummary = ({ filters = {} }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customFilters, setCustomFilters] = useState({
    addDates: false,
    addLines: false,
    addMO: false,
    addBuyer: false,
    addColors: false,
    addSizes: false
  });

  // Determine if filters are applied (non-empty values)
  const isMoNoFiltered = filters.moNo && filters.moNo.trim() !== "";
  const isLineNoFiltered = filters.lineNo && filters.lineNo.trim() !== "";
  const isColorFiltered = filters.color && filters.color.trim() !== "";
  const isSizeFiltered = filters.size && filters.size.trim() !== "";

  // Fetch data from the /api/qc2-mo-summaries endpoint
  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      console.log("Fetching data with filters:", filters);

      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== "" && value !== undefined && value !== null
        )
      );

      // Add custom grouping parameters based on checkbox states or forced by filters
      activeFilters.groupByDate = customFilters.addDates ? "true" : "false";
      activeFilters.groupByLine =
        customFilters.addLines || isLineNoFiltered ? "true" : "false";
      activeFilters.groupByMO =
        customFilters.addMO || isMoNoFiltered ? "true" : "false";
      activeFilters.groupByBuyer = customFilters.addBuyer ? "true" : "false";
      activeFilters.groupByColor =
        customFilters.addColors || isColorFiltered ? "true" : "false";
      activeFilters.groupBySize =
        customFilters.addSizes || isSizeFiltered ? "true" : "false";

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
  }, [JSON.stringify(filters), customFilters]); // Re-fetch when customFilters or filters change

  // Flatten defectArray and calculate defect-specific rates, then sort by rate
  const processDefectDetails = (defectArray, checkedQty) => {
    const defectMap = {};
    defectArray.forEach((defect) => {
      if (defect.defectName && defect.totalCount > 0) {
        defectMap[defect.defectName] =
          (defectMap[defect.defectName] || 0) + defect.totalCount;
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

  // Determine background and text color for summary rates
  const getRateStyle = (rate) => {
    const rateValue = rate * 100;
    if (rateValue > 3) {
      return { bgColor: "bg-red-200", textColor: "text-red-800" };
    } else if (rateValue >= 2 && rateValue <= 3) {
      return { bgColor: "bg-yellow-200", textColor: "text-orange-800" };
    } else {
      return { bgColor: "bg-green-200", textColor: "text-green-800" };
    }
  };

  // Determine background color for defect details based on defect rate
  const getDefectDetailBgColor = (defectRate) => {
    if (defectRate > 3) return "bg-red-100";
    else if (defectRate >= 2 && defectRate <= 3) return "bg-yellow-100";
    else if (defectRate < 2) return "bg-green-100";
    else return "bg-blue-50";
  };

  // Process summaryData by adding defect details
  const processedData = summaryData.map((row) => {
    console.log("Processing row:", row); // Debug each row
    return {
      ...row,
      defectArray: processDefectDetails(
        row.defectArray || [],
        row.checkedQty || 0
      )
    };
  });

  // Sort processed data based on the specified order
  const sortedData = [...processedData].sort((a, b) => {
    // Sort by inspection_date first (if present)
    if (customFilters.addDates) {
      const dateA = a.inspection_date || "";
      const dateB = b.inspection_date || "";
      if (dateA !== dateB) return dateA.localeCompare(dateB);
    }

    // Then sort by lineNo (if present)
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

    // Then sort by moNo (if present)
    if (customFilters.addMO || isMoNoFiltered) {
      const moA = a.moNo || "";
      const moB = b.moNo || "";
      return moA.localeCompare(moB);
    }

    return 0; // Default: no sorting if none of the fields are selected
  });

  // Prepare data for Excel export with one row per defect
  const prepareExcelData = () => {
    const data = [];
    sortedData.forEach((row) => {
      const defectDetails = row.defectArray || [];
      if (defectDetails.length === 0) {
        data.push({
          ...(customFilters.addDates && { Date: row.inspection_date || "N/A" }),
          ...((customFilters.addLines || isLineNoFiltered) && {
            "Line No": row.lineNo || "N/A"
          }),
          ...((customFilters.addMO || isMoNoFiltered) && {
            "MO No": row.moNo || "N/A"
          }),
          ...(customFilters.addBuyer && { Buyer: row.buyer || "N/A" }),
          ...((customFilters.addColors || isColorFiltered) && {
            Color: row.color || "N/A"
          }),
          ...((customFilters.addSizes || isSizeFiltered) && {
            Size: row.size || "N/A"
          }),
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
            ...(customFilters.addDates && {
              Date: index === 0 ? row.inspection_date || "N/A" : ""
            }),
            ...((customFilters.addLines || isLineNoFiltered) && {
              "Line No": index === 0 ? row.lineNo || "N/A" : ""
            }),
            ...((customFilters.addMO || isMoNoFiltered) && {
              "MO No": index === 0 ? row.moNo || "N/A" : ""
            }),
            ...(customFilters.addBuyer && {
              Buyer: index === 0 ? row.buyer || "N/A" : ""
            }),
            ...((customFilters.addColors || isColorFiltered) && {
              Color: index === 0 ? row.color || "N/A" : ""
            }),
            ...((customFilters.addSizes || isSizeFiltered) && {
              Size: index === 0 ? row.size || "N/A" : ""
            }),
            "Checked Qty":
              index === 0 ? row.checkedQty?.toLocaleString() || "0" : "",
            "Total Pass":
              index === 0 ? row.totalPass?.toLocaleString() || "0" : "",
            "Reject Units":
              index === 0 ? row.totalRejects?.toLocaleString() || "0" : "",
            "Defects Qty":
              index === 0 ? row.defectsQty?.toLocaleString() || "0" : "",
            "Defect Rate (%)":
              index === 0
                ? `${(row.defectRate * 100).toFixed(1) || "0.0"}%`
                : "",
            "Defect Ratio (%)":
              index === 0
                ? `${(row.defectRatio * 100).toFixed(1) || "0.0"}%`
                : "",
            "Total Bundles":
              index === 0 ? row.totalBundles?.toLocaleString() || "0" : "",
            "Defective Bundles":
              index === 0 ? row.defectiveBundles?.toLocaleString() || "0" : "",
            "Defect Details": `${
              defect.name
            }: ${defect.count.toLocaleString()} (${defect.defectRate.toFixed(
              1
            )}%)`
          });
        });
      }
    });
    return data;
  };

  // Prepare data for PDF export (single cell with newlines)
  const preparePDFData = () => {
    return sortedData.map((row) => {
      const defectDetails = row.defectArray || [];
      const defectDetailsText =
        defectDetails
          .map((d) => `${d.name}: ${d.count} (${d.defectRate.toFixed(1)}%)`)
          .join("\n") || "No Defects";

      return [
        ...(customFilters.addDates ? [row.inspection_date || "N/A"] : []),
        ...(customFilters.addLines || isLineNoFiltered
          ? [row.lineNo || "N/A"]
          : []),
        ...(customFilters.addMO || isMoNoFiltered ? [row.moNo || "N/A"] : []),
        ...(customFilters.addBuyer ? [row.buyer || "N/A"] : []),
        ...(customFilters.addColors || isColorFiltered
          ? [row.color || "N/A"]
          : []),
        ...(customFilters.addSizes || isSizeFiltered
          ? [row.size || "N/A"]
          : []),
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

  // Download as Excel with Calibri font
  const downloadExcel = () => {
    const data = prepareExcelData();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths dynamically
    ws["!cols"] = [
      ...(customFilters.addDates ? [{ wch: 12 }] : []), // Date
      ...(customFilters.addLines || isLineNoFiltered ? [{ wch: 10 }] : []), // Line No
      ...(customFilters.addMO || isMoNoFiltered ? [{ wch: 15 }] : []), // MO No
      ...(customFilters.addBuyer ? [{ wch: 20 }] : []), // Buyer
      ...(customFilters.addColors || isColorFiltered ? [{ wch: 15 }] : []), // Color
      ...(customFilters.addSizes || isSizeFiltered ? [{ wch: 10 }] : []), // Size
      { wch: 12 }, // Checked Qty
      { wch: 12 }, // Total Pass
      { wch: 12 }, // Reject Units
      { wch: 12 }, // Defects Qty
      { wch: 15 }, // Defect Rate (%)
      { wch: 15 }, // Defect Ratio (%)
      { wch: 12 }, // Total Bundles
      { wch: 15 }, // Defective Bundles
      { wch: 40 } // Defect Details
    ];

    // Apply Calibri font to all cells
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

  // Download as PDF
  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("helvetica");
    doc.setFontSize(12);
    doc.text("Live Summary", 14, 10);

    const headers = [
      ...(customFilters.addDates ? ["Date"] : []),
      ...(customFilters.addLines || isLineNoFiltered ? ["Line No"] : []),
      ...(customFilters.addMO || isMoNoFiltered ? ["MO No"] : []),
      ...(customFilters.addBuyer ? ["Buyer"] : []),
      ...(customFilters.addColors || isColorFiltered ? ["Color"] : []),
      ...(customFilters.addSizes || isSizeFiltered ? ["Size"] : []),
      "Checked Qty",
      "Total Pass",
      "Reject Units",
      "Defects Qty",
      "Defect Rate (%)",
      "Defect Ratio (%)",
      "Total Bundles",
      "Defective Bundles",
      "Defect Details"
    ];

    // Calculate dynamic column indices
    let currentIndex = 0;
    const columnIndices = {};
    if (customFilters.addDates) columnIndices.date = currentIndex++;
    if (customFilters.addLines || isLineNoFiltered)
      columnIndices.lineNo = currentIndex++;
    if (customFilters.addMO || isMoNoFiltered)
      columnIndices.moNo = currentIndex++;
    if (customFilters.addBuyer) columnIndices.buyer = currentIndex++;
    if (customFilters.addColors || isColorFiltered)
      columnIndices.color = currentIndex++;
    if (customFilters.addSizes || isSizeFiltered)
      columnIndices.size = currentIndex++;
    const checkedQtyIndex = currentIndex++;
    const totalPassIndex = currentIndex++;
    const rejectUnitsIndex = currentIndex++;
    const defectsQtyIndex = currentIndex++;
    const defectRateIndex = currentIndex++;
    const defectRatioIndex = currentIndex++;
    const totalBundlesIndex = currentIndex++;
    const defectiveBundlesIndex = currentIndex++;
    const defectDetailsIndex = currentIndex++;

    // Build columnStyles dynamically
    const columnStyles = {
      ...(customFilters.addDates
        ? { [columnIndices.date]: { cellWidth: 20 } }
        : {}), // Date
      ...(customFilters.addLines || isLineNoFiltered
        ? { [columnIndices.lineNo]: { cellWidth: 15 } }
        : {}), // Line No
      ...(customFilters.addMO || isMoNoFiltered
        ? { [columnIndices.moNo]: { cellWidth: 20 } }
        : {}), // MO No
      ...(customFilters.addBuyer
        ? { [columnIndices.buyer]: { cellWidth: 25 } }
        : {}), // Buyer
      ...(customFilters.addColors || isColorFiltered
        ? { [columnIndices.color]: { cellWidth: 15 } }
        : {}), // Color
      ...(customFilters.addSizes || isSizeFiltered
        ? { [columnIndices.size]: { cellWidth: 10 } }
        : {}), // Size
      [checkedQtyIndex]: { cellWidth: 20 }, // Checked Qty
      [totalPassIndex]: { cellWidth: 20 }, // Total Pass
      [rejectUnitsIndex]: { cellWidth: 20 }, // Reject Units
      [defectsQtyIndex]: { cellWidth: 20 }, // Defects Qty
      [defectRateIndex]: { cellWidth: 20 }, // Defect Rate (%)
      [defectRatioIndex]: { cellWidth: 20 }, // Defect Ratio (%)
      [totalBundlesIndex]: { cellWidth: 20 }, // Total Bundles
      [defectiveBundlesIndex]: { cellWidth: 20 }, // Defective Bundles
      [defectDetailsIndex]: { cellWidth: 60 } // Defect Details
    };

    autoTable(doc, {
      head: [headers],
      body: preparePDFData(),
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2, font: "helvetica" },
      columnStyles: columnStyles,
      didParseCell: (data) => {
        if (
          data.section === "body" &&
          [defectRateIndex, defectRatioIndex].includes(data.column.index)
        ) {
          const rate = parseFloat(data.cell.text[0]?.replace("%", "") || "0");
          const style = getRateStyle(rate / 100);
          data.cell.styles.fillColor =
            style.bgColor === "bg-red-200"
              ? [255, 204, 204]
              : style.bgColor === "bg-yellow-200"
              ? [255, 255, 204]
              : [204, 255, 204];
        }
      }
    });

    doc.save("LiveSummary.pdf");
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        Error: {error}{" "}
        <button
          onClick={fetchSummaryData}
          className="ml-2 text-blue-500 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6 border-b-2 border-gray-300 pb-2">
        <h2 className="text-sm font-bold text-gray-800">Summary</h2>
        <div className="flex space-x-2">
          <button
            onClick={downloadExcel}
            title="Download as Excel"
            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
          >
            <Download size={18} />
          </button>
          <button
            onClick={downloadPDF}
            title="Download as PDF"
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
          >
            <File size={18} /> {/* Using File icon as a PDF-like substitute */}
          </button>
        </div>
      </div>

      {/* Custom Filter Section */}
      <div className="mb-4 p-2 bg-gray-100 rounded-lg flex flex-wrap gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={customFilters.addDates}
            onChange={(e) =>
              setCustomFilters((prev) => ({
                ...prev,
                addDates: e.target.checked
              }))
            }
            className="mr-1"
          />
          Add Dates
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={customFilters.addLines || isLineNoFiltered}
            onChange={(e) =>
              setCustomFilters((prev) => ({
                ...prev,
                addLines: e.target.checked
              }))
            }
            disabled={isLineNoFiltered}
            className={`mr-1 ${
              isLineNoFiltered ? "cursor-not-allowed opacity-50" : ""
            }`}
          />
          Add Lines
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={customFilters.addMO || isMoNoFiltered}
            onChange={(e) =>
              setCustomFilters((prev) => ({
                ...prev,
                addMO: e.target.checked
              }))
            }
            disabled={isMoNoFiltered}
            className={`mr-1 ${
              isMoNoFiltered ? "cursor-not-allowed opacity-50" : ""
            }`}
          />
          Add MO
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={customFilters.addBuyer}
            onChange={(e) =>
              setCustomFilters((prev) => ({
                ...prev,
                addBuyer: e.target.checked
              }))
            }
            className="mr-1"
          />
          Add Buyer
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={customFilters.addColors || isColorFiltered}
            onChange={(e) =>
              setCustomFilters((prev) => ({
                ...prev,
                addColors: e.target.checked
              }))
            }
            disabled={isColorFiltered}
            className={`mr-1 ${
              isColorFiltered ? "cursor-not-allowed opacity-50" : ""
            }`}
          />
          Add Colors
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={customFilters.addSizes || isSizeFiltered}
            onChange={(e) =>
              setCustomFilters((prev) => ({
                ...prev,
                addSizes: e.target.checked
              }))
            }
            disabled={isSizeFiltered}
            className={`mr-1 ${
              isSizeFiltered ? "cursor-not-allowed opacity-50" : ""
            }`}
          />
          Add Sizes
        </label>
      </div>

      <div className="overflow-x-auto shadow-lg rounded-lg max-h-[500px]">
        <table className="min-w-full bg-white border-collapse">
          <thead className="bg-gray-800 text-white sticky top-0 z-10">
            <tr>
              {customFilters.addDates && (
                <th className="py-3 px-4 border-b border-gray-600 text-left text-sm font-bold">
                  Date
                </th>
              )}
              {(customFilters.addLines || isLineNoFiltered) && (
                <th className="py-3 px-4 border-b border-gray-600 text-left text-sm font-bold">
                  Line No
                </th>
              )}
              {(customFilters.addMO || isMoNoFiltered) && (
                <th className="py-3 px-4 border-b border-gray-600 text-left text-sm font-bold">
                  MO No
                </th>
              )}
              {customFilters.addBuyer && (
                <th className="py-3 px-4 border-b border-gray-600 text-left text-sm font-bold">
                  Buyer
                </th>
              )}
              {(customFilters.addColors || isColorFiltered) && (
                <th className="py-3 px-4 border-b border-gray-600 text-left text-sm font-bold">
                  Color
                </th>
              )}
              {(customFilters.addSizes || isSizeFiltered) && (
                <th className="py-3 px-4 border-b border-gray-600 text-left text-sm font-bold">
                  Size
                </th>
              )}
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Checked Qty
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Total Pass
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Reject Units
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Defects Qty
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Defect Rate (%)
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Defect Ratio (%)
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Total Bundles
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-right text-sm font-bold">
                Defective Bundles
              </th>
              <th className="py-3 px-4 border-b border-gray-600 text-left text-sm font-bold">
                Defect Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 overflow-y-auto">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    9 +
                    (customFilters.addDates ? 1 : 0) +
                    (customFilters.addLines || isLineNoFiltered ? 1 : 0) +
                    (customFilters.addMO || isMoNoFiltered ? 1 : 0) +
                    (customFilters.addBuyer ? 1 : 0) +
                    (customFilters.addColors || isColorFiltered ? 1 : 0) +
                    (customFilters.addSizes || isSizeFiltered ? 1 : 0)
                  }
                  className="py-4 text-center text-gray-500 text-sm font-bold"
                >
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => {
                const defectDetails = row.defectArray || [];
                const defectRateStyle = getRateStyle(row.defectRate);
                const defectRatioStyle = getRateStyle(row.defectRatio);

                return (
                  <tr
                    key={index}
                    className={`hover:bg-gray-100 transition-colors duration-200 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    {customFilters.addDates && (
                      <td className="py-3 px-4 border-b border-gray-200 text-sm font-bold">
                        {row.inspection_date || "N/A"}
                      </td>
                    )}
                    {(customFilters.addLines || isLineNoFiltered) && (
                      <td className="py-3 px-4 border-b border-gray-200 text-sm font-bold">
                        {row.lineNo || "N/A"}
                      </td>
                    )}
                    {(customFilters.addMO || isMoNoFiltered) && (
                      <td className="py-3 px-4 border-b border-gray-200 text-sm font-bold">
                        {row.moNo || "N/A"}
                      </td>
                    )}
                    {customFilters.addBuyer && (
                      <td className="py-3 px-4 border-b border-gray-200 text-sm font-bold">
                        {row.buyer || "N/A"}
                      </td>
                    )}
                    {(customFilters.addColors || isColorFiltered) && (
                      <td className="py-3 px-4 border-b border-gray-200 text-sm font-bold">
                        {row.color || "N/A"}
                      </td>
                    )}
                    {(customFilters.addSizes || isSizeFiltered) && (
                      <td className="py-3 px-4 border-b border-gray-200 text-sm font-bold">
                        {row.size || "N/A"}
                      </td>
                    )}
                    <td className="py-3 px-4 border-b border-gray-200 text-right text-sm font-bold">
                      {row.checkedQty?.toLocaleString() || "0"}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200 text-right text-sm font-bold">
                      {row.totalPass?.toLocaleString() || "0"}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200 text-right text-sm font-bold">
                      {row.totalRejects?.toLocaleString() || "0"}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200 text-right text-sm font-bold">
                      {row.defectsQty?.toLocaleString() || "0"}
                    </td>
                    <td
                      className={`py-3 px-4 border-b border-gray-200 text-right text-sm font-bold ${defectRateStyle.bgColor}`}
                    >
                      <span className={defectRateStyle.textColor}>
                        {(row.defectRate * 100).toFixed(1) || "0.0"}%
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 border-b border-gray-200 text-right text-sm font-bold ${defectRatioStyle.bgColor}`}
                    >
                      <span className={defectRatioStyle.textColor}>
                        {(row.defectRatio * 100).toFixed(1) || "0.0"}%
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200 text-right text-sm font-bold">
                      {row.totalBundles?.toLocaleString() || "0"}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200 text-right text-sm font-bold">
                      {row.defectiveBundles?.toLocaleString() || "0"}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200">
                      {defectDetails.length > 0 ? (
                        <div className="p-2 rounded">
                          {defectDetails.map((defect, idx) => (
                            <div
                              key={idx}
                              className={`${getDefectDetailBgColor(
                                defect.defectRate
                              )} text-blue-800 p-1 mb-1 rounded text-sm font-bold`}
                            >
                              {`${
                                defect.name
                              }: ${defect.count.toLocaleString()} (${defect.defectRate.toFixed(
                                1
                              )}%)`}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="bg-blue-50 text-blue-800 p-2 rounded text-sm font-bold">
                          No Defects
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveSummary;
