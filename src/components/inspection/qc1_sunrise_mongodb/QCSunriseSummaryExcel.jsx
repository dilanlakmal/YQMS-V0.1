import React from "react";
import * as XLSX from "xlsx";
import { FaFileExcel } from "react-icons/fa";

const QCSunriseSummaryExcel = ({
  groupedData,
  columnsToDisplay,
  isGenerating,
  setIsGenerating
}) => {
  const handleDownloadExcel = () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // Prepare data for Excel
      const excelData = groupedData.map((item) => {
        const row = {};
        if (columnsToDisplay.includes("Date"))
          row["Date"] = item.inspectionDate;
        if (columnsToDisplay.includes("Line No")) row["Line No"] = item.lineNo;
        if (columnsToDisplay.includes("MO No")) row["MO No"] = item.MONo;
        if (columnsToDisplay.includes("Color")) row["Color"] = item.Color;
        if (columnsToDisplay.includes("Size")) row["Size"] = item.Size;
        if (columnsToDisplay.includes("Buyer")) row["Buyer"] = item.Buyer;
        row["Checked Qty"] = item.CheckedQty;
        row["Defects Qty"] = item.totalDefectsQty;
        row["Defect Rate (%)"] = item.defectRate;

        // Add defect details as a comma-separated string
        row["Defect Details"] = item.DefectArray.length
          ? item.DefectArray.map(
              (defect) =>
                `${defect.defectName}: ${defect.defectQty} (${
                  item.CheckedQty > 0
                    ? ((defect.defectQty / item.CheckedQty) * 100).toFixed(2)
                    : 0
                }%)`
            ).join(", ")
          : "No matching defects";

        return row;
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      // Auto-size columns (approximation)
      const colWidths = Object.keys(excelData[0]).map((key) =>
        Math.max(
          key.length,
          ...excelData.map((row) => (row[key] ? row[key].toString().length : 0))
        )
      );
      ws["!cols"] = colWidths.map((w) => ({ wch: w + 2 }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Summary");

      // Generate and download Excel file
      XLSX.writeFile(wb, "QCSunriseSummary.xlsx");
    } catch (error) {
      console.error("Error generating Excel:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownloadExcel}
      disabled={isGenerating}
      className={`flex items-center px-3 py-1 rounded-md text-white ${
        isGenerating
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-green-600 hover:bg-green-700"
      } focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out`}
    >
      <FaFileExcel className="w-5 h-5" />
    </button>
  );
};

export default QCSunriseSummaryExcel;
