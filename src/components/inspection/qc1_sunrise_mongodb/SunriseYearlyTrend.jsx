import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";

// Helper to convert YYYY-MM-DD to DD/MM/YYYY
const formatDateToDDMMYYYY = (dateStr) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

// Helper to convert DD/MM/YYYY to YYYY-MM-DD
const formatDateToYYYYMMDD = (dateStr) => {
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day}`;
};

// Helper to get year key from DD/MM/YYYY (e.g., "2025")
const getYearKey = (dateStr) => {
  const [_, __, year] = dateStr.split("/");
  return year;
};

const QCSunriseYearlyTrend = ({ filters }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customFilters, setCustomFilters] = useState({
    addLines: false,
    addMO: false,
    addBuyer: false,
    addColors: false,
    addSizes: false,
  });
  const [rows, setRows] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);

  // Determine if filters are applied
  const isMoNoFiltered = (filters.moNo ?? "").trim() !== "";
  const isLineNoFiltered = (filters.lineNo ?? "").trim() !== "";
  const isColorFiltered = (filters.color ?? "").trim() !== "";
  const isSizeFiltered = (filters.size ?? "").trim() !== "";

  // Fetch data from /api/sunrise/qc1-data
  const fetchData = async () => {
    try {
      setLoading(true);
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== "" && value !== undefined && value !== null
        )
      );

      const queryParams = {};
      if (activeFilters.startDate) queryParams.startDate = activeFilters.startDate;
      if (activeFilters.endDate) queryParams.endDate = activeFilters.endDate;
      if (activeFilters.lineNo) queryParams.lineNo = activeFilters.lineNo;
      if (activeFilters.moNo) queryParams.MONo = activeFilters.moNo;
      if (activeFilters.color) queryParams.Color = activeFilters.color;
      if (activeFilters.size) queryParams.Size = activeFilters.size;
      if (activeFilters.buyer) queryParams.Buyer = activeFilters.buyer;
      if (activeFilters.defectName) queryParams.defectName = activeFilters.defectName;

      if (customFilters.addLines && !queryParams.lineNo) queryParams.lineNo = "";
      if (customFilters.addMO && !queryParams.MONo) queryParams.MONo = "";
      if (customFilters.addBuyer && !queryParams.Buyer) queryParams.Buyer = "";
      if (customFilters.addColors && !queryParams.Color) queryParams.Color = "";
      if (customFilters.addSizes && !queryParams.Size) queryParams.Size = "";

      if (!queryParams.startDate || !queryParams.endDate) {
        const today = new Date();
        queryParams.endDate = today.toISOString().split("T")[0];
        queryParams.startDate = new Date(today.setFullYear(today.getFullYear() - 5))
          .toISOString()
          .split("T")[0]; // 5 years ago
      }

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${API_BASE_URL}/api/sunrise/qc1-data?${queryString}`;
      const response = await axios.get(url);
      setSummaryData(response.data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch QC1 Sunrise data");
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(filters), customFilters]);

  // Process data for table
  useEffect(() => {
    if (summaryData.length === 0) return;

    // Extract unique years
    const yearsSet = new Set(summaryData.map((d) => getYearKey(d.inspectionDate)));
    const sortedYears = [...yearsSet].sort((a, b) => Number(a) - Number(b));
    setUniqueYears(sortedYears);

    // Define grouping fields
    const groupingFields = [];
    if (customFilters.addLines) groupingFields.push("lineNo");
    if (customFilters.addMO) groupingFields.push("MONo");
    if (customFilters.addBuyer) groupingFields.push("Buyer");
    if (customFilters.addColors) groupingFields.push("Color");
    if (customFilters.addSizes) groupingFields.push("Size");

    const hierarchy = buildHierarchy(summaryData, groupingFields);
    const tableRows = buildRows(hierarchy, groupingFields, sortedYears);
    setRows(tableRows);
  }, [summaryData, customFilters]);

  // Build hierarchical data structure
  const buildHierarchy = (data, groupingFields) => {
    if (groupingFields.length === 0) {
      const yearMap = {};
      data.forEach((doc) => {
        const yearKey = getYearKey(doc.inspectionDate);
        if (!yearMap[yearKey]) {
          yearMap[yearKey] = { CheckedQty: 0, totalDefectsQty: 0, DefectArray: [] };
        }
        yearMap[yearKey].CheckedQty += doc.CheckedQty || 0;
        yearMap[yearKey].totalDefectsQty += doc.totalDefectsQty || 0;
        if (doc.DefectArray) {
          doc.DefectArray.forEach((defect) => {
            const existing = yearMap[yearKey].DefectArray.find(
              (d) => d.defectName === defect.defectName
            );
            if (existing) {
              existing.defectQty += defect.defectQty || 0;
            } else {
              yearMap[yearKey].DefectArray.push({ ...defect });
            }
          });
        }
      });
      return yearMap;
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
    years,
    level = 0,
    path = [],
    currentFieldIndex = 0
  ) => {
    const rows = [];
    if (currentFieldIndex < groupingFields.length) {
      const field = groupingFields[currentFieldIndex];
      Object.keys(hierarchy)
        .sort()
        .forEach((value) => {
          const subHierarchy = hierarchy[value];
          const groupData = {};
          years.forEach((year) => {
            const sum = getSumForGroup(subHierarchy, year);
            groupData[year] =
              sum.checkedQty > 0 ? (sum.defectsQty / sum.checkedQty) * 100 : 0;
          });
          rows.push({
            level,
            type: "group",
            key: value,
            path: [...path, value],
            data: groupData,
          });
          const subRows = buildRows(
            subHierarchy,
            groupingFields,
            years,
            level + 1,
            [...path, value],
            currentFieldIndex + 1
          );
          rows.push(...subRows);
        });
    } else {
      const yearMap = hierarchy;
      const defectNames = new Set();
      Object.values(yearMap).forEach((doc) => {
        if (doc && doc.DefectArray) {
          doc.DefectArray.forEach((defect) => {
            if (defect.defectName) defectNames.add(defect.defectName);
          });
        }
      });
      [...defectNames].sort().forEach((defectName) => {
        const defectData = {};
        years.forEach((year) => {
          const doc = yearMap[year];
          if (doc && doc.DefectArray) {
            const defect = doc.DefectArray.find((d) => d.defectName === defectName);
            defectData[year] =
              defect && doc.CheckedQty > 0
                ? (defect.defectQty / doc.CheckedQty) * 100
                : 0;
          } else {
            defectData[year] = 0;
          }
        });
        rows.push({
          level,
          type: "defect",
          key: defectName,
          path: [...path, defectName],
          data: defectData,
        });
      });
    }
    return rows;
  };

  // Sum CheckedQty and totalDefectsQty for a group on a specific year
  const getSumForGroup = (currentHierarchy, year) => {
    if (typeof currentHierarchy !== "object" || Array.isArray(currentHierarchy)) {
      const doc = currentHierarchy[year];
      return doc
        ? { checkedQty: doc.CheckedQty, defectsQty: doc.totalDefectsQty }
        : { checkedQty: 0, defectsQty: 0 };
    }
    let sum = { checkedQty: 0, defectsQty: 0 };
    for (const key in currentHierarchy) {
      const subSum = getSumForGroup(currentHierarchy[key], year);
      sum.checkedQty += subSum.checkedQty;
      sum.defectsQty += subSum.defectsQty;
    }
    return sum;
  };

  // Color coding functions
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

    exportData.push(["Yearly Defect Trend Analysis", ...Array(uniqueYears.length).fill("")]);
    ratesMap.set("0-0", 0);

    exportData.push(Array(uniqueYears.length + 1).fill(""));
    ratesMap.set("1-0", 0);

    const headerRow = ["Group / Defect", ...uniqueYears];
    exportData.push(headerRow);
    ratesMap.set("2-0", 0);

    let rowIndex = 3;
    rows.forEach((row) => {
      const indent = "  ".repeat(row.level);
      const rowData = [`${indent}${row.key}`];
      uniqueYears.forEach((year, colIndex) => {
        const rate = row.data[year] || 0;
        rowData.push(rate > 0 ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${colIndex + 1}`, rate);
      });
      exportData.push(rowData);
      rowIndex++;
    });

    const totalRow = ["Total"];
    uniqueYears.forEach((year, colIndex) => {
      const yearData = summaryData.filter((d) => getYearKey(d.inspectionDate) === year);
      const totalChecked = yearData.reduce((sum, d) => sum + (d.CheckedQty || 0), 0);
      const totalDefects = yearData.reduce((sum, d) => sum + (d.totalDefectsQty || 0), 0);
      const rate = totalChecked > 0 ? (totalDefects / totalChecked) * 100 : 0;
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
          border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
          fill: {
            fgColor: {
              rgb: isHeaderRow || isTotalRow ? "ADD8E6" : rate > 0 ? getBackgroundColorHex(rate) : row < 2 ? "FFFFFF" : "E5E7EB",
            },
          },
          alignment: { horizontal: col === 0 ? "left" : "center", vertical: "middle" },
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yearly Defect Trend");
    XLSX.writeFile(wb, "YearlyDefectTrend.xlsx");
  };

  // Download PDF
  const downloadPDF = () => {
    const { exportData, ratesMap } = prepareExportData();
    const doc = new jsPDF({ orientation: "landscape" });

    const tablePlugin = typeof autoTable === "function" ? autoTable : global.autoTable;
    if (!tablePlugin) {
      console.error("autoTable plugin not available.");
      return;
    }

    tablePlugin(doc, {
      head: [exportData[2]],
      body: exportData.slice(3),
      startY: 20,
      theme: "grid",
      headStyles: { fillColor: [173, 216, 230], textColor: [55, 65, 81], fontStyle: "bold" },
      styles: { cellPadding: 2, fontSize: 8, halign: "center", valign: "middle" },
      columnStyles: { 0: { halign: "left" } },
      didParseCell: (data) => {
        const rowIndex = data.row.index + 3;
        const colIndex = data.column.index;
        const rate = ratesMap.get(`${rowIndex}-${colIndex}`) || 0;
        const isTotalRow = rowIndex === exportData.length - 1;

        if (data.section === "body") {
          if (colIndex === 0) {
            data.cell.styles.fillColor = isTotalRow ? [173, 216, 230] : [255, 255, 255];
            data.cell.styles.textColor = [55, 65, 81];
          } else {
            const hasData = data.row.raw[colIndex].includes("%");
            data.cell.styles.fillColor =
              hasData && rate > 0 ? getBackgroundColorRGB(rate) : isTotalRow ? [173, 216, 230] : [229, 231, 235];
            data.cell.styles.textColor = hasData && rate > 0 ? getFontColorRGB(rate) : [55, 65, 81];
          }
        }
      },
      didDrawPage: () => {
        doc.text("Yearly Defect Trend Analysis", 14, 10);
      },
    });

    doc.save("YearlyDefectTrend.pdf");
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-gray-900">Yearly Defect Trend</h2>
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
            onChange={(e) => setCustomFilters((prev) => ({ ...prev, addLines: e.target.checked }))}
            disabled={isLineNoFiltered}
            className={`mr-1 ${isLineNoFiltered ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          Add Lines
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={customFilters.addMO || isMoNoFiltered}
            onChange={(e) => setCustomFilters((prev) => ({ ...prev, addMO: e.target.checked }))}
            disabled={isMoNoFiltered}
            className={`mr-1 ${isMoNoFiltered ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          Add MO
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={customFilters.addBuyer}
            onChange={(e) => setCustomFilters((prev) => ({ ...prev, addBuyer: e.target.checked }))}
            className="mr-1"
          />
          Add Buyer
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={customFilters.addColors || isColorFiltered}
            onChange={(e) => setCustomFilters((prev) => ({ ...prev, addColors: e.target.checked }))}
            disabled={isColorFiltered}
            className={`mr-1 ${isColorFiltered ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          Add Colors
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={customFilters.addSizes || isSizeFiltered}
            onChange={(e) => setCustomFilters((prev) => ({ ...prev, addSizes: e.target.checked }))}
            disabled={isSizeFiltered}
            className={`mr-1 ${isSizeFiltered ? "opacity-50 cursor-not-allowed" : ""}`}
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
              {uniqueYears.map((year) => (
                <th
                  key={year}
                  className="py-2 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700"
                >
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className={row.type === "group" ? "bg-gray-50" : ""}>
                <td
                  className={`py-2 px-4 border border-gray-800 text-sm ${row.type === "group" ? "font-bold" : ""}`}
                  style={{ paddingLeft: `${row.level * 20}px` }}
                >
                  {row.key}
                </td>
                {uniqueYears.map((year) => {
                  const rate = row.data[year] || 0;
                  return (
                    <td
                      key={year}
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
              {uniqueYears.map((year) => {
                const yearData = summaryData.filter((d) => getYearKey(d.inspectionDate) === year);
                const totalChecked = yearData.reduce((sum, d) => sum + (d.CheckedQty || 0), 0);
                const totalDefects = yearData.reduce((sum, d) => sum + (d.totalDefectsQty || 0), 0);
                const rate = totalChecked > 0 ? (totalDefects / totalChecked) * 100 : 0;
                return (
                  <td
                    key={year}
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

export default QCSunriseYearlyTrend;