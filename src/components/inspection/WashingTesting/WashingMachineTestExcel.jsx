import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

/**
 * Generates and downloads an Excel file for a Washing Machine Test Report
 * @param {Object} report - The report data object
 * @returns {Promise<void>}
 */
const generateWashingMachineTestExcel = async (report) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    // Styles
    const titleStyle = {
      font: { bold: true, size: 20, color: { argb: "FF0020C0" } },
      alignment: { horizontal: "center", vertical: "middle" }
    };

    const headerStyle = {
      font: { bold: true, color: { argb: "FF000000" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6F3FF" }
      },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      },
      alignment: { vertical: "middle" }
    };

    const valueStyle = {
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      },
      alignment: { vertical: "middle" }
    };

    // Company Name
    worksheet.mergeCells("A1:B1");
    const companyCell = worksheet.getCell("A1");
    companyCell.value = "Yorkmars (Cambodia) Garment MFG Co., LTD";
    companyCell.style = titleStyle;

    // Report Title
    worksheet.mergeCells("A2:B2");
    const titleCell = worksheet.getCell("A2");
    titleCell.value = "Laundry Washing Machine Test Report";
    titleCell.style = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: "center", vertical: "middle" }
    };

    // Empty row
    worksheet.addRow([]);

    // Report Data
    const reportData = [
      { label: "YM Style", value: report.ymStyle || "N/A" },
      { label: "Buyer Style", value: report.buyerStyle || "N/A" },
      { label: "Factory", value: report.factory || "N/A" },
      { label: "Report Date", value: report.reportDate ? new Date(report.reportDate).toLocaleDateString() : "N/A" },
      { label: "Send To Home Washing Date", value: report.sendToHomeWashingDate ? new Date(report.sendToHomeWashingDate).toLocaleDateString() : "N/A" },
      { label: "Submitted By", value: report.engName || report.userName || report.userId || "N/A" },
      { label: "Submitted At", value: report.createdAt ? new Date(report.createdAt).toLocaleString() : report.submittedAt ? new Date(report.submittedAt).toLocaleString() : "N/A" },
      { label: "Colors", value: report.color && report.color.length > 0 ? report.color.join(", ") : "N/A" },
      { label: "PO", value: report.po && report.po.length > 0 ? report.po.join(", ") : "N/A" },
      { label: "Ex Fty Date", value: report.exFtyDate && report.exFtyDate.length > 0 ? report.exFtyDate.join(", ") : "N/A" }
    ];

    // Add headers
    const headerRow = worksheet.addRow(["Field", "Value"]);
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Add data rows
    reportData.forEach((item) => {
      const row = worksheet.addRow([item.label, item.value]);
      row.eachCell((cell, colNumber) => {
        cell.style = valueStyle;
        if (colNumber === 1) {
          cell.font = { bold: true };
        }
      });
    });

    // Add Images section if available
    if (report.images && report.images.length > 0) {
      worksheet.addRow([]);
      const imagesHeaderRow = worksheet.addRow(["Images", ""]);
      imagesHeaderRow.eachCell((cell) => {
        cell.style = headerStyle;
      });
      
      report.images.forEach((imageUrl, idx) => {
        const imageRow = worksheet.addRow([`Image ${idx + 1}`, imageUrl]);
        imageRow.eachCell((cell) => {
          cell.style = valueStyle;
        });
      });
    }

    // Set column widths
    worksheet.columns = [
      { width: 30 },
      { width: 50 }
    ];

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    
    const filename = `Washing_Test_Report_${report.ymStyle || "Unknown"}_${new Date().toISOString().split("T")[0]}.xlsx`;
    saveAs(blob, filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error("Error generating Excel:", error);
    throw error;
  }
};

export default generateWashingMachineTestExcel;

