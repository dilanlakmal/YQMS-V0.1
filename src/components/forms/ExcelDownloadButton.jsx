import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import { useTranslation } from 'react-i18next';

function ExcelDownloadButton({ data, filters = {} }) {
  const { t } = useTranslation();
  const generateFileName = () => {
    const parts = [];
    if (filters.taskNo) parts.push(`Task ${filters.taskNo}`);
    if (filters.type) parts.push(filters.type);
    if (filters.moNo) parts.push(filters.moNo);
    if (filters.styleNo) parts.push(filters.styleNo);
    if (filters.lineNo) parts.push(filters.lineNo);
    if (filters.color) parts.push(filters.color);
    if (filters.size) parts.push(filters.size);
    return parts.length > 0 ? `${parts.join("-")}.xlsx` : "download.xlsx";
  };

  const handleDownload = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    // Apply Styles
    const titleStyle = {
      font: { bold: true, size: 20,  color: { argb: "FF0020C0" } },
      alignment: { horizontal: "center" },
    };
    
    const reportStyle = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: "center" },
    };

    const headerStyle = {
      font: { bold: true, color: { argb: "FF000000" } },
      alignment: { horizontal: "center" },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF8fb8e2" } },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    };

    // Add Company Name
    worksheet.addRow(["Yorkmars (Cambodia) Garment MFG Co., LTD"]).eachCell((cell) => {
      cell.style = titleStyle;
    });
    worksheet.mergeCells("A1:J1");

    // Empty Row
    worksheet.addRow([]);

    // Report Name
    worksheet.addRow([filters.type || "Data Report"]).eachCell((cell) => {
      cell.style = reportStyle;
    });
    worksheet.mergeCells("A3:J3");

    // Empty Row
    worksheet.addRow([]);

    // Add Headers
    const headers = [
      "Date",
      "Type",
      "Task No",
      "MO No",
      "Style No",
      "Line No",
      "Color",
      "Size",
      "Buyer",
      "Bundle ID",
    ];
    worksheet.addRow(headers).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Add Data
    data.forEach((item) => {
      worksheet.addRow([
        item.date,
        item.type,
        item.taskNo,
        item.selectedMono,
        item.custStyle,
        item.lineNo,
        item.color,
        item.size,
        item.buyer,
        item.bundle_id,
      ]);
    });

    // Auto-adjust Column Width
    worksheet.columns.forEach((column) => {
      column.width = 25;
    });

    // Generate Excel File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, generateFileName());
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 ml-4"
    >
      {t("downDa.download_excel")}
    </button>
  );
}

export default ExcelDownloadButton;
