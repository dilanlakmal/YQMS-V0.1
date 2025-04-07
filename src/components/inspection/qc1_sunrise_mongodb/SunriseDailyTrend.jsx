import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config"; // Adjust path as needed
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Explicitly import autoTable
// Add a fallback import for debugging
if (typeof autoTable === "undefined") {
  console.error("jspdf-autotable not loaded. Attempting default import.");
  import("jspdf-autotable").then((module) => {
    global.autoTable = module.default;
  });
}
import { FaFileExcel, FaFilePdf } from "react-icons/fa";

const QCSunriseDailyTrend = ({ filters }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customFilters, setCustomFilters] = useState({
    addLines: false,
    addMO: false,
    addBuyer: false,
    addColors: false,
    addSizes: false
  });
  const [rows, setRows] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);

  // Determine if filters are applied (non-empty values) with default fallback
  const isMoNoFiltered = (filters.moNo ?? "").trim() !== "";
  const isLineNoFiltered = (filters.lineNo ?? "").trim() !== "";
  const isColorFiltered = (filters.color ?? "").trim() !== "";
  const isSizeFiltered = (filters.size ?? "").trim() !== "";

  // Fetch data from /api/qc2-mo-summaries
  const fetchData = async () => {
    try {
      setLoading(true);
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== "" && value !== undefined && value !== null
        )
      );

      // Always group by date for trend analysis
      activeFilters.groupByDate = "true";
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
      const url = `${API_BASE_URL}/api/qc2-mo-summaries?${queryString}`;
      const response = await axios.get(url);
      setSummaryData(response.data);
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
    fetchData();
  }, [JSON.stringify(filters), customFilters]);

  // Process data when summaryData changes
  useEffect(() => {
    if (summaryData.length === 0) return;

    // Extract unique dates
    const datesSet = new Set(summaryData.map((d) => d.inspection_date));
    const sortedDates = [...datesSet].sort((a, b) => new Date(a) - new Date(b));
    setUniqueDates(sortedDates);

    // Define grouping fields
    const groupingFields = [];
    if (customFilters.addLines) groupingFields.push("lineNo");
    if (customFilters.addMO) groupingFields.push("moNo");
    if (customFilters.addBuyer) groupingFields.push("buyer");
    if (customFilters.addColors) groupingFields.push("color");
    if (customFilters.addSizes) groupingFields.push("size");

    // Build hierarchy and rows
    const hierarchy = buildHierarchy(summaryData, groupingFields);
    const tableRows = buildRows(hierarchy, groupingFields, sortedDates);
    setRows(tableRows);
  }, [summaryData, customFilters]);

  // Build hierarchical data structure
  const buildHierarchy = (data, groupingFields) => {
    if (groupingFields.length === 0) {
      const dateMap = {};
      data.forEach((doc) => {
        dateMap[doc.inspection_date] = doc;
      });
      return dateMap;
    } else {
      const field = groupingFields[0];
      const groups = {};
      data.forEach((doc) => {
        const value = doc[field] || "N/A";
        if (!groups[value]) groups[value] = [];
        groups[value].push(doc);
      });
      const result = {};
      for (const [value, docs] of Object.entries(groups)) {
        result[value] = buildHierarchy(docs, groupingFields.slice(1));
      }
      return result;
    }
  };

  // Build table rows recursively
  const buildRows = (
    hierarchy,
    groupingFields,
    dates,
    level = 0,
    path = [],
    currentFieldIndex = 0
  ) => {
    const rows = [];
    if (currentFieldIndex < groupingFields.length) {
      // Group level
      const field = groupingFields[currentFieldIndex];
      Object.keys(hierarchy)
        .sort()
        .forEach((value) => {
          const subHierarchy = hierarchy[value];
          const groupData = {};
          dates.forEach((date) => {
            const sum = getSumForGroup(subHierarchy, date);
            groupData[date] =
              sum.checkedQty > 0 ? (sum.defectsQty / sum.checkedQty) * 100 : 0;
          });
          rows.push({
            level,
            type: "group",
            key: value,
            path: [...path, value],
            data: groupData
          });
          const subRows = buildRows(
            subHierarchy,
            groupingFields,
            dates,
            level + 1,
            [...path, value],
            currentFieldIndex + 1
          );
          rows.push(...subRows);
        });
    } else {
      // Leaf level: defect rows
      const dateMap = hierarchy;
      const defectNames = new Set();
      Object.values(dateMap).forEach((doc) => {
        if (doc && doc.defectArray) {
          doc.defectArray.forEach((defect) => {
            if (defect.defectName) defectNames.add(defect.defectName);
          });
        }
      });
      [...defectNames].sort().forEach((defectName) => {
        const defectData = {};
        dates.forEach((date) => {
          const doc = dateMap[date];
          if (doc && doc.defectArray) {
            const defect = doc.defectArray.find(
              (d) => d.defectName === defectName
            );
            defectData[date] =
              defect && doc.checkedQty > 0
                ? (defect.totalCount / doc.checkedQty) * 100
                : 0;
          } else {
            defectData[date] = 0;
          }
        });
        rows.push({
          level,
          type: "defect",
          key: defectName,
          path: [...path, defectName],
          data: defectData
        });
      });
    }
    return rows;
  };

  // Sum checkedQty and defectsQty for a group on a specific date
  const getSumForGroup = (currentHierarchy, date) => {
    if (
      typeof currentHierarchy !== "object" ||
      Array.isArray(currentHierarchy)
    ) {
      const doc = currentHierarchy[date];
      return doc
        ? { checkedQty: doc.checkedQty, defectsQty: doc.defectsQty }
        : { checkedQty: 0, defectsQty: 0 };
    }
    let sum = { checkedQty: 0, defectsQty: 0 };
    for (const key in currentHierarchy) {
      const subSum = getSumForGroup(currentHierarchy[key], date);
      sum.checkedQty += subSum.checkedQty;
      sum.defectsQty += subSum.defectsQty;
    }
    return sum;
  };

  // Color coding functions from TrendAnalysisLine.jsx
  const getBackgroundColor = (rate) => {
    if (rate > 3) return "bg-red-100";
    if (rate >= 2) return "bg-yellow-100";
    return "bg-green-100";
  };

  const getFontColor = (rate) => {
    if (rate > 3) return "text-red-800";
    if (rate >= 2) return "text-orange-800";
    return "text-green-800";
  };

  const getBackgroundColorRGB = (rate) => {
    if (rate > 3) return [255, 204, 204];
    if (rate >= 2) return [255, 255, 204];
    return [204, 255, 204];
  };

  const getFontColorRGB = (rate) => {
    if (rate > 3) return [153, 0, 0];
    if (rate >= 2) return [204, 102, 0];
    return [0, 102, 0];
  };

  const getBackgroundColorHex = (rate) => {
    if (rate > 3) return "FFCCCC";
    if (rate >= 2) return "FFFFCC";
    return "CCFFCC";
  };

  // Export data preparation
  const prepareExportData = () => {
    const exportData = [];
    const ratesMap = new Map();

    exportData.push([
      "Daily Defect Trend Analysis",
      ...Array(uniqueDates.length).fill("")
    ]);
    ratesMap.set("0-0", 0);

    exportData.push(Array(uniqueDates.length + 1).fill(""));
    ratesMap.set("1-0", 0);

    const headerRow = ["Group / Defect", ...uniqueDates];
    exportData.push(headerRow);
    ratesMap.set("2-0", 0);

    let rowIndex = 3;
    rows.forEach((row) => {
      const indent = "  ".repeat(row.level);
      const rowData = [`${indent}${row.key}`];
      uniqueDates.forEach((date, colIndex) => {
        const rate = row.data[date] || 0;
        rowData.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${colIndex + 1}`, rate);
      });
      exportData.push(rowData);
      rowIndex++;
    });

    const totalRow = ["Total"];
    uniqueDates.forEach((date, colIndex) => {
      const hierarchy = buildHierarchy(summaryData, [
        ...(customFilters.addLines ? ["lineNo"] : []),
        ...(customFilters.addMO ? ["moNo"] : []),
        ...(customFilters.addBuyer ? ["buyer"] : []),
        ...(customFilters.addColors ? ["color"] : []),
        ...(customFilters.addSizes ? ["size"] : [])
      ]);
      const sum = getSumForGroup(hierarchy, date);
      const rate =
        sum.checkedQty > 0 ? (sum.defectsQty / sum.checkedQty) * 100 : 0;
      totalRow.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
      ratesMap.set(`${rowIndex}-${colIndex + 1}`, rate);
    });
    exportData.push(totalRow);

    return { exportData, ratesMap };
  };

  // Download Excel
  const downloadExcel = () => {
    const { exportData, ratesMap } = prepareExportData();
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;

        const rate = ratesMap.get(`${row}-${col}`) || 0;
        const isHeaderRow = row === 2;
        const isTotalRow = row === range.e.r;

        ws[cellAddress].s = {
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          },
          fill: {
            fgColor: {
              rgb:
                isHeaderRow || isTotalRow
                  ? "ADD8E6"
                  : rate > 0
                  ? getBackgroundColorHex(rate)
                  : row < 2
                  ? "FFFFFF"
                  : "E5E7EB"
            }
          },
          alignment: {
            horizontal: col === 0 ? "left" : "center",
            vertical: "middle"
          }
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defect Trend");
    XLSX.writeFile(wb, "DailyDefectTrend.xlsx");
  };

  // Download PDF
  const downloadPDF = () => {
    const { exportData, ratesMap } = prepareExportData();
    const doc = new jsPDF({ orientation: "landscape" });

    // Use the imported or globally assigned autoTable
    const tablePlugin =
      typeof autoTable === "function" ? autoTable : global.autoTable;
    if (!tablePlugin) {
      console.error(
        "autoTable plugin not available. Please check jspdf-autotable installation."
      );
      return;
    }

    tablePlugin(doc, {
      head: [exportData[2]],
      body: exportData.slice(3),
      startY: 20,
      theme: "grid",
      headStyles: {
        fillColor: [173, 216, 230],
        textColor: [55, 65, 81],
        fontStyle: "bold"
      },
      styles: {
        cellPadding: 2,
        fontSize: 8,
        halign: "center",
        valign: "middle"
      },
      columnStyles: { 0: { halign: "left" } },
      didParseCell: (data) => {
        const rowIndex = data.row.index + 3;
        const colIndex = data.column.index;
        const rate = ratesMap.get(`${rowIndex}-${colIndex}`) || 0;
        const isTotalRow = rowIndex === exportData.length - 1;

        if (data.section === "body") {
          if (colIndex === 0) {
            data.cell.styles.fillColor = isTotalRow
              ? [173, 216, 230]
              : [255, 255, 255];
            data.cell.styles.textColor = [55, 65, 81];
          } else {
            const hasData = data.row.raw[colIndex].includes("%");
            data.cell.styles.fillColor =
              hasData && rate > 0
                ? getBackgroundColorRGB(rate)
                : isTotalRow
                ? [173, 216, 230]
                : [229, 231, 235];
            data.cell.styles.textColor =
              hasData && rate > 0 ? getFontColorRGB(rate) : [55, 65, 81];
          }
        }
      },
      didDrawPage: () => {
        doc.text("Daily Defect Trend Analysis", 14, 10);
      }
    });

    doc.save("DailyDefectTrend.pdf");
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error)
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-gray-900">
          Daily Defect Trend
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={downloadExcel}
            className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            title="Download as Excel"
          >
            <FaFileExcel className="mr-2" /> Excel
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            title="Download as PDF"
          >
            <FaFilePdf className="mr-2" /> PDF
          </button>
        </div>
      </div>

      {/* Filter Checkboxes */}
      <div className="mb-4 p-2 bg-gray-100 rounded-lg flex flex-wrap gap-4">
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
              isLineNoFiltered ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
          Add Lines
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={customFilters.addMO || isMoNoFiltered}
            onChange={(e) =>
              setCustomFilters((prev) => ({ ...prev, addMO: e.target.checked }))
            }
            disabled={isMoNoFiltered}
            className={`mr-1 ${
              isMoNoFiltered ? "opacity-50 cursor-not-allowed" : ""
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
              isColorFiltered ? "opacity-50 cursor-not-allowed" : ""
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
              isSizeFiltered ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
          Add Sizes
        </label>
      </div>

      {/* Table */}
      <div className="overflow-y-auto" style={{ maxHeight: "500px" }}>
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-blue-100 sticky top-0 z-10">
              <th className="py-2 px-4 border border-gray-800 text-left text-sm font-bold text-gray-700">
                Group / Defect
              </th>
              {uniqueDates.map((date) => (
                <th
                  key={date}
                  className="py-2 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700"
                >
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className={row.type === "group" ? "bg-gray-50" : ""}
              >
                <td
                  className={`py-2 px-4 border border-gray-800 text-sm ${
                    row.type === "group" ? "font-bold" : ""
                  }`}
                  style={{ paddingLeft: `${row.level * 20}px` }}
                >
                  {row.key}
                </td>
                {uniqueDates.map((date) => {
                  const rate = row.data[date] || 0;
                  return (
                    <td
                      key={date}
                      className={`py-2 px-4 border border-gray-800 text-center text-sm ${
                        rate > 0 ? getBackgroundColor(rate) : "bg-gray-100"
                      } ${rate > 0 ? getFontColor(rate) : "text-gray-700"}`}
                    >
                      {rate > 0 ? `${rate.toFixed(2)}%` : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-blue-100 font-bold">
              <td className="py-2 px-4 border border-gray-800 text-sm font-bold text-gray-700">
                Total
              </td>
              {uniqueDates.map((date) => {
                const dateData = summaryData.filter(
                  (d) => d.inspection_date === date
                );
                const totalChecked = dateData.reduce(
                  (sum, d) => sum + (d.checkedQty || 0),
                  0
                );
                const totalDefects = dateData.reduce(
                  (sum, d) => sum + (d.defectsQty || 0),
                  0
                );
                const rate =
                  totalChecked > 0 ? (totalDefects / totalChecked) * 100 : 0;
                return (
                  <td
                    key={date}
                    className={`py-2 px-4 border border-gray-800 text-center text-sm ${
                      rate > 0 ? getBackgroundColor(rate) : "bg-white"
                    } ${rate > 0 ? getFontColor(rate) : "text-gray-700"}`}
                  >
                    {rate > 0 ? `${rate.toFixed(2)}%` : ""}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QCSunriseDailyTrend;
