import React from "react";
import * as XLSX from "xlsx";

const SunriseDownloadExcel = ({ filteredData, totals }) => {
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

  return (
    <button
      onClick={downloadExcel}
      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
    >
      Download Excel
    </button>
  );
};

export default SunriseDownloadExcel;
