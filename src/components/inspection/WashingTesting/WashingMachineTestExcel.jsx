import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

/**
 * Normalizes an image URL for fetching
 * @param {string} url - The image URL
 * @param {string} apiBaseUrl - The API base URL
 * @returns {string} - The full URL
 */
const normalizeUrl = (url, apiBaseUrl = "") => {
  if (!url) return "";
  if (url.startsWith("data:")) return url;

  let fullUrl = url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    fullUrl = url;
  } else if (url.startsWith("/storage/")) {
    fullUrl = `${apiBaseUrl}${url}`;
  } else if (url.startsWith("storage/")) {
    fullUrl = `${apiBaseUrl}/${url}`;
  } else if (url.includes("/washing_machine_test/")) {
    const filename = url.split("/washing_machine_test/")[1];
    fullUrl = `${apiBaseUrl}/api/report-washing/image/${filename}`;
  } else {
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    fullUrl = `${apiBaseUrl}${cleanPath}`;
  }

  // Use image-proxy endpoint for better compatibility and to avoid CORS issues
  if (apiBaseUrl && fullUrl && !fullUrl.startsWith("data:")) {
    return `${apiBaseUrl}/api/image-proxy?url=${encodeURIComponent(fullUrl)}`;
  }

  return fullUrl;
};

/**
 * Fetches an image and returns it as a buffer
 * @param {string} url - The image URL
 * @returns {Promise<ArrayBuffer|null>}
 */
const fetchImageBuffer = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (error) {
    console.error("Error fetching image for Excel:", error);
    return null;
  }
};

/**
 * Generates and downloads an Excel file for a Washing Machine Test Report
 * @param {Object} report - The report data object
 * @param {string} apiBaseUrl - Base URL for API calls
 * @returns {Promise<void>}
 */
const generateWashingMachineTestExcel = async (report, apiBaseUrl = "") => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report Detail");

    // --- Column Setup ---
    worksheet.columns = [
      { header: "Field", key: "field", width: 25 },
      { header: "Value", key: "value", width: 45 },
      { header: "Notes", key: "notes", width: 40 },
    ];

    // --- Styles ---
    const titleStyle = {
      font: { bold: true, size: 18, color: { argb: "FF1E3A8A" } },
      alignment: { horizontal: "center", vertical: "middle" }
    };

    const sectionHeaderStyle = {
      font: { bold: true, size: 12, color: { argb: "FFFFFFFF" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF3B82F6" }
      },
      alignment: { vertical: "middle" },
      border: {
        bottom: { style: "medium" }
      }
    };

    const labelStyle = {
      font: { bold: true, color: { argb: "FF374151" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3F4F6" }
      },
      alignment: { vertical: "top" },
      border: {
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } }
      }
    };

    const cellBorderStyle = {
      border: {
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } }
      },
      alignment: { vertical: "top", wrapText: true }
    };

    // --- Company Header ---
    worksheet.mergeCells("A1:C1");
    const companyCell = worksheet.getCell("A1");
    companyCell.value = "Yorkmars (Cambodia) Garment MFG Co., LTD";
    companyCell.style = titleStyle;
    worksheet.getRow(1).height = 40;

    worksheet.mergeCells("A2:C2");
    const subTitleCell = worksheet.getCell("A2");
    subTitleCell.value = "Launch Washing Machine Test Report";
    subTitleCell.style = {
      font: { bold: true, size: 14, color: { argb: "FF374151" } },
      alignment: { horizontal: "center", vertical: "middle" }
    };
    worksheet.getRow(2).height = 25;

    let currentRow = 4;

    // --- Basic Info Section ---
    const addSectionHeader = (title) => {
      worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
      const cell = worksheet.getCell(`A${currentRow}`);
      cell.value = title;
      cell.style = sectionHeaderStyle;
      worksheet.getRow(currentRow).height = 22;
      currentRow++;
    };

    const addDataRow = (label, value) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = label;
      row.getCell(1).style = labelStyle;
      row.getCell(2).value = value;
      row.getCell(2).style = cellBorderStyle;
      worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
      currentRow++;
    };

    addSectionHeader("General Information");
    addDataRow("YM Style", report.ymStyle || "N/A");
    addDataRow("Buyer Style", report.buyerStyle || "N/A");
    addDataRow("Factory", report.factory || "N/A");
    addDataRow("Report Date", report.reportDate ? new Date(report.reportDate).toLocaleDateString() : "N/A");
    addDataRow("Status", report.status ? report.status.toUpperCase() : "N/A");
    addDataRow("Submitted By", report.engName || report.userName || report.userId || "N/A");
    addDataRow("Submitted At", report.createdAt ? new Date(report.createdAt).toLocaleString() : (report.submittedAt ? new Date(report.submittedAt).toLocaleString() : "N/A"));

    currentRow++;
    addSectionHeader("Order Details");
    addDataRow("Colors", report.color && report.color.length > 0 ? report.color.join(", ") : "N/A");
    addDataRow("PO", report.po && report.po.length > 0 ? report.po.join(", ") : "N/A");
    addDataRow("Ex Fty Date", report.exFtyDate && report.exFtyDate.length > 0 ? report.exFtyDate.join(", ") : "N/A");

    currentRow++;
    addSectionHeader("Test Timeline");

    // --- Step 1: Submission ---
    const step1Date = report.sendToHomeWashingDate ? new Date(report.sendToHomeWashingDate).toLocaleString() : (report.submittedAt ? new Date(report.submittedAt).toLocaleString() : "N/A");
    addDataRow("Step 1: Sent To Washing", step1Date);
    worksheet.getRow(currentRow - 1).height = 20;

    if (report.notes) {
      addDataRow("Step 1 Notes", report.notes);
    }

    // --- Step 2: Received ---
    if (report.receivedDate || report.receivedAt) {
      const step2Date = report.receivedAt ? new Date(report.receivedAt).toLocaleString() : (report.receivedDate ? new Date(report.receivedDate).toLocaleString() : "N/A");
      addDataRow("Step 2: Received", step2Date);
      if (report.receivedNotes) {
        addDataRow("Step 2 Notes", report.receivedNotes);
      }
    }

    // --- Step 3: Completed ---
    if (report.completedDate || report.completedAt) {
      const step3Date = report.completedAt ? new Date(report.completedAt).toLocaleString() : (report.completedDate ? new Date(report.completedDate).toLocaleString() : "N/A");
      addDataRow("Step 3: Completed", step3Date);
      if (report.completionNotes) {
        addDataRow("Step 3 Notes", report.completionNotes);
      }
    }

    // --- Images Section ---
    currentRow++;
    addSectionHeader("Images Gallery");

    // Function to add images to worksheet
    const addImagesToWorksheet = async (title, images, startRow) => {
      if (!images || images.length === 0) return startRow;

      const headerRow = worksheet.getRow(startRow);
      headerRow.getCell(1).value = title;
      headerRow.getCell(1).style = { font: { bold: true }, border: { bottom: { style: "thin" } } };
      worksheet.mergeCells(`A${startRow}:C${startRow}`);

      let imageRow = startRow + 1;

      for (let i = 0; i < images.length; i++) {
        const imageUrl = normalizeUrl(images[i], apiBaseUrl);
        const buffer = await fetchImageBuffer(imageUrl);

        if (buffer) {
          try {
            const imageId = workbook.addImage({
              buffer: buffer,
              extension: 'jpeg',
            });

            // Set row height for image
            worksheet.getRow(imageRow).height = 120;

            worksheet.addImage(imageId, {
              tl: { col: 0.2, row: imageRow - 0.8 },
              ext: { width: 140, height: 140 }
            });

            worksheet.getRow(imageRow).getCell(2).value = `Image ${i + 1}`;
            worksheet.getRow(imageRow).getCell(2).alignment = { vertical: 'middle' };

            imageRow++;
          } catch (imgErr) {
            console.error("Error adding image to excel:", imgErr);
            worksheet.getRow(imageRow).getCell(1).value = `(Failed to load image ${i + 1})`;
            imageRow++;
          }
        } else {
          worksheet.getRow(imageRow).getCell(1).value = `(Image ${i + 1} not found)`;
          imageRow++;
        }
      }

      return imageRow + 1;
    };

    let nextImageRow = currentRow;
    if (report.images && report.images.length > 0) {
      nextImageRow = await addImagesToWorksheet("Initial Images", report.images, nextImageRow);
    }

    if (report.receivedImages && report.receivedImages.length > 0) {
      nextImageRow = await addImagesToWorksheet("Received Images", report.receivedImages, nextImageRow);
    }

    if (report.completionImages && report.completionImages.length > 0) {
      nextImageRow = await addImagesToWorksheet("Completion Images", report.completionImages, nextImageRow);
    }

    // --- Footer ---
    const footerRow = nextImageRow + 2;
    worksheet.mergeCells(`A${footerRow}:C${footerRow}`);
    const footerCell = worksheet.getCell(`A${footerRow}`);
    footerCell.value = `Report Generated on ${new Date().toLocaleString()}`;
    footerCell.style = { font: { italic: true, size: 9, color: { argb: "FF6B7280" } }, alignment: { horizontal: "right" } };

    // --- Finalize and Save ---
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


