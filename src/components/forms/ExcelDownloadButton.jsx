import { saveAs } from "file-saver";
import React from "react";
import * as XLSX from "xlsx";

function ExcelDownloadButton({ data, filters }) {
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

  const handleDownload = () => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Company name in first row
    const companyName = [["Yorkmars (Cambodia) Garment MFG Co., LTD"]];
    const emptyRow = [""];
    const reportName = [[filters.type || "Data Report"]];

    // Convert data to worksheet format
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

    const wsData = [
      ...companyName,
      emptyRow,
      ...reportName,
      emptyRow,
      headers,
      ...data.map((item) => [
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
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidth = { wch: 30 };
    ws["!cols"] = headers.map(() => colWidth);

    // Style company name
    ws["A1"].s = {
      font: { bold: true, sz: 20 },
      alignment: { horizontal: "center" },
    };

    // Style headers
    const headerRow = 4;
    headers.forEach((_, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: index });
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E6F3FF" } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    });

    // Add to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Data");

    // Generate and save file
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xff;

    const blob = new Blob([buf], { type: "application/octet-stream" });
    saveAs(blob, generateFileName());
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 ml-4"
    >
      Download Excel
    </button>
  );
}

export default ExcelDownloadButton;
