import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { notoSansFont } from "../../../fonts/notoSans";

const SunriseDownloadPDF = ({ filteredData, totals, getDefectRateStyles }) => {
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

  const downloadPDF = () => {
    try {
      const exportData = prepareExportData();
      const doc = new jsPDF({ orientation: "landscape" });

      try {
        doc.addFileToVFS("NotoSans.ttf", notoSansFont);
        doc.addFont("NotoSans.ttf", "NotoSans", "normal");
        doc.setFont("NotoSans", "normal");
      } catch (fontError) {
        console.error("Failed to load NotoSans font:", fontError);
        console.warn("Falling back to Helvetica");
        doc.setFont("Helvetica");
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
          font: "NotoSans",
          fontStyle: "normal"
        },
        headStyles: { fillColor: [0, 128, 0], fontStyle: "normal" },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 15 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 20 },
          6: { cellWidth: 15 },
          7: { cellWidth: 15 },
          8: { cellWidth: 15 },
          9: { cellWidth: 15 },
          10: { cellWidth: 15 },
          11: { cellWidth: 40 },
          12: { cellWidth: 20 },
          13: { cellWidth: 20 }
        },
        didParseCell: (data) => {
          if (data.column.index === 10 && data.cell.text[0]) {
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
    <button
      onClick={downloadPDF}
      className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition duration-300"
    >
      Download PDF
    </button>
  );
};

export default SunriseDownloadPDF;
