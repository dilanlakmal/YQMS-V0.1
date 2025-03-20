import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx"; // For Excel export
import jsPDF from "jspdf"; // For PDF export
import autoTable from "jspdf-autotable"; // Explicitly import autoTable
import { notoSansFont } from "../fonts/notoSans";

const SunriseAnalyze = ({ rs18Data, outputData }) => {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    workLine: "",
    moNo: "",
    colorNo: "",
    sizeName: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Helper function to parse MM-DD-YYYY date into a Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [month, day, year] = dateStr.split("-").map(Number); // Expects MM-DD-YYYY
    return new Date(year, month - 1, day); // Month is 0-based in JS Date
  };

  // Convert YYYY-MM-DD (input) to MM-DD-YYYY (internal) and vice versa
  const formatToInternalDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${month}-${day}-${year}`; // YYYY-MM-DD to MM-DD-YYYY
  };

  const formatToInputDate = (dateStr) => {
    if (!dateStr) return "";
    const [month, day, year] = dateStr.split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`; // MM-DD-YYYY to YYYY-MM-DD
  };

  // Get unique filter options based on date range
  const getUniqueValuesInDateRange = (key) => {
    if (!outputData) return [];
    const startDate = filters.startDate ? parseDate(filters.startDate) : null;
    const endDate = filters.endDate ? parseDate(filters.endDate) : null;

    const filtered = outputData.filter((row) => {
      const rowDate = parseDate(row.InspectionDate);
      return (
        (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate)
      );
    });

    return [...new Set(filtered.map((row) => row[key]))].sort();
  };

  const uniqueWorkLines = getUniqueValuesInDateRange("WorkLine");
  const uniqueMoNos = getUniqueValuesInDateRange("MONo");
  const uniqueColorNos = getUniqueValuesInDateRange("ColorNo");
  const uniqueSizeNames = getUniqueValuesInDateRange("SizeName");

  // Merge data and apply filters
  const getMergedData = () => {
    if (!rs18Data || !outputData) return [];

    const commonKeys = [
      "InspectionDate",
      "WorkLine",
      "MONo",
      "SizeName",
      "ColorNo",
      "ColorName"
    ];
    const mergedData = [];

    const outputMap = new Map();
    outputData.forEach((row) => {
      const key = commonKeys.map((k) => row[k]).join("|");
      outputMap.set(key, {
        TotalQtyT38: row.TotalQtyT38,
        TotalQtyT39: row.TotalQtyT39
      });
    });

    const defectMap = new Map();
    rs18Data.forEach((row) => {
      const key = commonKeys.map((k) => row[k]).join("|");
      if (!defectMap.has(key)) defectMap.set(key, []);
      defectMap
        .get(key)
        .push({ ReworkName: row.ReworkName, DefectsQty: row.DefectsQty });
    });

    const allKeys = new Set([...outputMap.keys(), ...defectMap.keys()]);
    allKeys.forEach((key) => {
      const [InspectionDate, WorkLine, MONo, SizeName, ColorNo, ColorName] =
        key.split("|");
      const output = outputMap.get(key) || { TotalQtyT38: 0, TotalQtyT39: 0 };
      const defects = defectMap.get(key) || [];

      const checkedQty = Math.max(output.TotalQtyT38, output.TotalQtyT39);
      const defectsQty = defects.reduce(
        (sum, defect) => sum + defect.DefectsQty,
        0
      );
      const defectRate = checkedQty === 0 ? 0 : (defectsQty / checkedQty) * 100;

      const defectsWithRate = defects.map((defect) => ({
        ...defect,
        DefectRate:
          checkedQty === 0 ? 0 : (defect.DefectsQty / checkedQty) * 100
      }));

      mergedData.push({
        InspectionDate,
        WorkLine,
        MONo,
        SizeName,
        ColorNo,
        ColorName,
        TotalQtyT38: output.TotalQtyT38,
        TotalQtyT39: output.TotalQtyT39,
        CheckedQty: checkedQty,
        DefectsQty: defectsQty,
        DefectRate: defectRate,
        DefectDetails: defectsWithRate
      });
    });

    return mergedData.filter((row) => {
      const rowDate = parseDate(row.InspectionDate);
      const startDate = filters.startDate ? parseDate(filters.startDate) : null;
      const endDate = filters.endDate ? parseDate(filters.endDate) : null;

      return (
        (!startDate || rowDate >= startDate) &&
        (!endDate || rowDate <= endDate) &&
        (!filters.workLine || row.WorkLine === filters.workLine) &&
        (!filters.moNo || row.MONo === filters.moNo) &&
        (!filters.colorNo || row.ColorNo === filters.colorNo) &&
        (!filters.sizeName || row.SizeName === filters.sizeName)
      );
    });
  };

  const filteredData = getMergedData();
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Calculate totals for numeric columns
  const totals = {
    TotalQtyT38: filteredData.reduce((sum, row) => sum + row.TotalQtyT38, 0),
    TotalQtyT39: filteredData.reduce((sum, row) => sum + row.TotalQtyT39, 0),
    CheckedQty: filteredData.reduce((sum, row) => sum + row.CheckedQty, 0),
    DefectsQty: filteredData.reduce((sum, row) => sum + row.DefectsQty, 0),
    DefectRate:
      filteredData.reduce((sum, row) => sum + row.CheckedQty, 0) === 0
        ? 0
        : (
            (filteredData.reduce((sum, row) => sum + row.DefectsQty, 0) /
              filteredData.reduce((sum, row) => sum + row.CheckedQty, 0)) *
            100
          ).toFixed(2)
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]:
        name === "startDate" || name === "endDate"
          ? formatToInternalDate(value)
          : value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      workLine: "",
      moNo: "",
      colorNo: "",
      sizeName: ""
    });
    setCurrentPage(1);
  };

  // Get DefectRate background and font colors
  const getDefectRateStyles = (rate) => {
    if (rate > 5) {
      return { background: "#ffcccc", color: "#cc0000" }; // Light red bg, dark red font
    } else if (rate >= 3 && rate <= 5) {
      return { background: "#ffebcc", color: "#e68a00" }; // Light orange bg, dark orange font
    } else {
      return { background: "#ccffcc", color: "#006600" }; // Light green bg, dark green font
    }
  };

  // Prepare data for export
  const prepareExportData = () => {
    const exportData = [];
    const seenCombinations = new Map();

    filteredData.forEach((row) => {
      const combinationKey = [
        row.InspectionDate,
        row.WorkLine,
        row.MONo,
        row.SizeName,
        row.ColorNo,
        row.ColorName
      ].join("|");

      const isFirstRowForCombination = !seenCombinations.has(combinationKey);
      seenCombinations.set(combinationKey, true);

      if (row.DefectDetails.length === 0) {
        exportData.push({
          InspectionDate: isFirstRowForCombination ? row.InspectionDate : "",
          WorkLine: isFirstRowForCombination ? row.WorkLine : "",
          MONo: isFirstRowForCombination ? row.MONo : "",
          SizeName: isFirstRowForCombination ? row.SizeName : "",
          ColorNo: isFirstRowForCombination ? row.ColorNo : "",
          ColorName: isFirstRowForCombination ? row.ColorName : "",
          TotalQtyT38: isFirstRowForCombination ? row.TotalQtyT38 : "",
          TotalQtyT39: isFirstRowForCombination ? row.TotalQtyT39 : "",
          CheckedQty: isFirstRowForCombination ? row.CheckedQty : "",
          DefectsQty: isFirstRowForCombination ? row.DefectsQty : "",
          DefectRate: isFirstRowForCombination
            ? `${row.DefectRate.toFixed(2)}%`
            : "",
          ReworkName: "No defects",
          ReworkDefectsQty: 0,
          ReworkDefectRate: "0.00%"
        });
      } else {
        row.DefectDetails.forEach((defect, index) => {
          exportData.push({
            InspectionDate:
              isFirstRowForCombination && index === 0 ? row.InspectionDate : "",
            WorkLine:
              isFirstRowForCombination && index === 0 ? row.WorkLine : "",
            MONo: isFirstRowForCombination && index === 0 ? row.MONo : "",
            SizeName:
              isFirstRowForCombination && index === 0 ? row.SizeName : "",
            ColorNo: isFirstRowForCombination && index === 0 ? row.ColorNo : "",
            ColorName:
              isFirstRowForCombination && index === 0 ? row.ColorName : "",
            TotalQtyT38:
              isFirstRowForCombination && index === 0 ? row.TotalQtyT38 : "",
            TotalQtyT39:
              isFirstRowForCombination && index === 0 ? row.TotalQtyT39 : "",
            CheckedQty:
              isFirstRowForCombination && index === 0 ? row.CheckedQty : "",
            DefectsQty:
              isFirstRowForCombination && index === 0 ? row.DefectsQty : "",
            DefectRate:
              isFirstRowForCombination && index === 0
                ? `${row.DefectRate.toFixed(2)}%`
                : "",
            ReworkName: defect.ReworkName,
            ReworkDefectsQty: defect.DefectsQty,
            ReworkDefectRate: `${defect.DefectRate.toFixed(2)}%`
          });
        });
      }
    });

    exportData.push({
      InspectionDate: "Total",
      WorkLine: "-",
      MONo: "-",
      SizeName: "-",
      ColorNo: "-",
      ColorName: "-",
      TotalQtyT38: totals.TotalQtyT38,
      TotalQtyT39: totals.TotalQtyT39,
      CheckedQty: totals.CheckedQty,
      DefectsQty: totals.DefectsQty,
      DefectRate: `${totals.DefectRate}%`,
      ReworkName: "-",
      ReworkDefectsQty: "-",
      ReworkDefectRate: "-"
    });

    return exportData;
  };

  // Download as Excel
  const downloadExcel = () => {
    const exportData = prepareExportData();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (!worksheet[cellRef]) continue;
        worksheet[cellRef].s = {
          font: { name: "Calibri", sz: 12 }
        };
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SunriseAnalyze");
    XLSX.writeFile(workbook, "SunriseAnalyze.xlsx");
  };

  // Download as PDF with Noto Sans for Khmer/Chinese support
  const downloadPDF = () => {
    try {
      const exportData = prepareExportData();
      const doc = new jsPDF({ orientation: "landscape" });

      // Add Noto Sans font
      try {
        doc.addFileToVFS("NotoSans.ttf", notoSansFont);
        doc.addFont("NotoSans.ttf", "NotoSans", "normal");
        doc.setFont("NotoSans", "normal"); // Explicitly set to normal to avoid bold attempts
      } catch (fontError) {
        console.error("Failed to load NotoSans font:", fontError);
        console.warn("Falling back to Helvetica");
        doc.setFont("Helvetica"); // Fallback to default font if NotoSans fails
      }

      doc.text("Sunrise Analyze Report", 14, 10);

      autoTable(doc, {
        head: [
          [
            "InspectionDate",
            "WorkLine",
            "MONo",
            "SizeName",
            "ColorNo",
            "ColorName",
            "TotalQtyT38",
            "TotalQtyT39",
            "CheckedQty",
            "DefectsQty",
            "DefectRate",
            "ReworkName",
            "ReworkDefectsQty",
            "ReworkDefectRate"
          ]
        ],
        body: exportData.map((row) => Object.values(row)),
        startY: 20,
        styles: {
          fontSize: 6,
          cellPadding: 1,
          font: "NotoSans", // Try NotoSans first
          fontStyle: "normal" // Explicitly enforce normal style
        }, // Use NotoSans for Khmer/Chinese
        headStyles: { fillColor: [0, 128, 0], fontStyle: "normal" },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        columnStyles: {
          0: { cellWidth: 20 }, // InspectionDate
          1: { cellWidth: 15 }, // WorkLine
          2: { cellWidth: 20 }, // MONo
          3: { cellWidth: 15 }, // SizeName
          4: { cellWidth: 15 }, // ColorNo
          5: { cellWidth: 20 }, // ColorName
          6: { cellWidth: 15 }, // TotalQtyT38
          7: { cellWidth: 15 }, // TotalQtyT39
          8: { cellWidth: 15 }, // CheckedQty
          9: { cellWidth: 15 }, // DefectsQty
          10: { cellWidth: 15 }, // DefectRate
          11: { cellWidth: 40 }, // ReworkName (increased width)
          12: { cellWidth: 20 }, // ReworkDefectsQty
          13: { cellWidth: 20 } // ReworkDefectRate
        },
        didParseCell: (data) => {
          if (data.column.index === 10 && data.cell.text[0]) {
            // DefectRate column
            const rateText = data.cell.text[0].replace("%", "").trim();
            const rate = rateText ? parseFloat(rateText) : 0;
            if (!isNaN(rate)) {
              const styles = getDefectRateStyles(rate);
              data.cell.styles.fillColor = [
                parseInt(styles.background.slice(1, 3), 16),
                parseInt(styles.background.slice(3, 5), 16),
                parseInt(styles.background.slice(5, 7), 16)
              ];
              data.cell.styles.textColor = [
                parseInt(styles.color.slice(1, 3), 16),
                parseInt(styles.color.slice(3, 5), 16),
                parseInt(styles.color.slice(5, 7), 16)
              ];
            }
          }
        },
        didDrawPage: () => {
          // Ensure font consistency across pages
          doc.setFont("NotoSans", "normal");
        }
      });

      doc.save("SunriseAnalyze.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Check the console for details.");
    }
  };

  return (
    <div className="mt-4">
      {/* Filter Pane */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-100 rounded-lg">
        <div>
          <label className="block text-sm font-medium">
            Start Date (MM-DD-YYYY):
          </label>
          <input
            type="date"
            name="startDate"
            value={formatToInputDate(filters.startDate)} // Display YYYY-MM-DD
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            End Date (MM-DD-YYYY):
          </label>
          <input
            type="date"
            name="endDate"
            value={formatToInputDate(filters.endDate)} // Display YYYY-MM-DD
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Line No:</label>
          <select
            name="workLine"
            value={filters.workLine}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full"
          >
            <option value="">All</option>
            {uniqueWorkLines.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">MO No:</label>
          <select
            name="moNo"
            value={filters.moNo}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full"
          >
            <option value="">All</option>
            {uniqueMoNos.map((mo) => (
              <option key={mo} value={mo}>
                {mo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Color:</label>
          <select
            name="colorNo"
            value={filters.colorNo}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full"
          >
            <option value="">All</option>
            {uniqueColorNos.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Size:</label>
          <select
            name="sizeName"
            value={filters.sizeName}
            onChange={handleFilterChange}
            className="mt-1 p-2 border rounded-md w-full"
          >
            <option value="">All</option>
            {uniqueSizeNames.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-red-500 text-white rounded-md w-full"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="flex justify-end mb-4 space-x-4">
        <button
          onClick={downloadExcel}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Download Excel
        </button>
        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-purple-500 text-white rounded-md"
        >
          Download PDF
        </button>
      </div>

      {/* Analyze Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-96">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-green-100 sticky top-0 z-10">
            <tr>
              {[
                "InspectionDate",
                "WorkLine",
                "MONo",
                "SizeName",
                "ColorNo",
                "ColorName",
                "TotalQtyT38",
                "TotalQtyT39",
                "CheckedQty",
                "DefectsQty",
                "DefectRate",
                "Defect Details"
              ].map((header) => (
                <th
                  key={header}
                  className="p-2 border border-gray-300 text-sm font-medium text-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => {
              const defectRateStyles = getDefectRateStyles(row.DefectRate);
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.InspectionDate}
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.WorkLine}
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.MONo}
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.SizeName}
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.ColorNo}
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.ColorName}
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.TotalQtyT38}
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.TotalQtyT39}
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.CheckedQty}
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-center">
                    {row.DefectsQty}
                  </td>
                  <td
                    className="p-2 border border-gray-300 text-sm text-center"
                    style={{
                      backgroundColor: defectRateStyles.background,
                      color: defectRateStyles.color
                    }}
                  >
                    {row.DefectRate.toFixed(2)}%
                  </td>
                  <td className="p-2 border border-gray-300 text-sm text-left">
                    {row.DefectDetails.length > 0 ? (
                      <ul>
                        {row.DefectDetails.map((defect, i) => (
                          <li key={i}>
                            {`${defect.ReworkName}: ${
                              defect.DefectsQty
                            } (${defect.DefectRate.toFixed(2)}%)`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No defects"
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-200 font-bold">
              <td className="p-2 border border-gray-300 text-sm text-center">
                Total
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                -
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                -
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                -
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                -
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                -
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                {totals.TotalQtyT38}
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                {totals.TotalQtyT39}
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                {totals.CheckedQty}
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                {totals.DefectsQty}
              </td>
              <td
                className="p-2 border border-gray-300 text-sm text-center"
                style={getDefectRateStyles(parseFloat(totals.DefectRate))}
              >
                {totals.DefectRate}%
              </td>
              <td className="p-2 border border-gray-300 text-sm text-center">
                -
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SunriseAnalyze;
