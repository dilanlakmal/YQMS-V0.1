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
// Resolve emp_id to display name from users list; fallback to id
const getNameForView = (empId, storedName, users = []) => {
  if (storedName && String(storedName).trim()) return storedName;
  if (!empId) return null;
  const u = users.find((user) => String(user.emp_id) === String(empId) || String(user.id) === String(empId));
  return u ? (u.name || u.eng_name || u.emp_id) : null;
};

/**
 * Generates and downloads an Excel file for a Washing Machine Test Report
 * @param {Object} report - The report data object
 * @param {string} apiBaseUrl - Base URL for API calls
 * @param {Array} users - Optional list of users to resolve emp_id to name for Submitted/Checked/Approved By
 * @returns {Promise<void>}
 */
const generateWashingMachineTestExcel = async (report, apiBaseUrl = "", users = []) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report Detail");

    // --- Column Setup ---
    // We use a 4-column layout for a balanced "PDF-like" look
    worksheet.columns = [
      { key: "label1", width: 18 },
      { key: "value1", width: 30 },
      { key: "label2", width: 18 },
      { key: "value2", width: 30 },
    ];

    // --- Styles ---
    const titleStyle = {
      font: { bold: true, size: 16, color: { argb: "FF1E3A8A" } },
      alignment: { horizontal: "center", vertical: "middle" }
    };

    const sectionHeaderStyle = (color = "FF3B82F6") => ({
      font: { bold: true, size: 11, color: { argb: "FFFFFFFF" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: color }
      },
      alignment: { vertical: "middle", horizontal: "left" },
      border: {
        bottom: { style: "medium", color: { argb: "FFFFFFFF" } }
      }
    });

    const labelStyle = {
      font: { bold: true, size: 10, color: { argb: "FF4B5563" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF9FAFB" }
      },
      alignment: { vertical: "middle" },
      border: {
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } }
      }
    };

    const valueStyle = {
      font: { size: 10, color: { argb: "FF111827" } },
      alignment: { vertical: "middle", wrapText: true },
      border: {
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } }
      }
    };

    // Status Styling
    const getStatusStyle = (status) => {
      let color = "FF6B7280"; // Default gray
      if (status === "completed") color = "FF059669"; // Green
      if (status === "received") color = "FFD97706"; // Yellow/Orange

      return {
        font: { bold: true, size: 10, color: { argb: color } },
        alignment: { vertical: "middle" },
        border: {
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } }
        }
      };
    };

    // --- Company Header ---
    worksheet.mergeCells("A1:D1");
    const companyCell = worksheet.getCell("A1");
    companyCell.value = "Yorkmars (Cambodia) Garment MFG Co., LTD";
    companyCell.style = titleStyle;
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells("A2:D2");
    const subTitleCell = worksheet.getCell("A2");
    subTitleCell.value = "Launch Washing Machine Test Report";
    subTitleCell.style = {
      font: { bold: true, size: 13, color: { argb: "FF374151" } },
      alignment: { horizontal: "center", vertical: "middle" }
    };
    worksheet.getRow(2).height = 25;

    let currentRow = 4;

    // --- Helpers ---
    const addSectionHeader = (title, color = "FF3B82F6") => {
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const cell = worksheet.getCell(`A${currentRow}`);
      cell.value = "  " + title;
      cell.style = sectionHeaderStyle(color);
      worksheet.getRow(currentRow).height = 22;
      currentRow++;
    };

    const addInfoRow = (l1, v1, l2, v2, isStatus = false) => {
      const row = worksheet.getRow(currentRow);

      // Col 1 & 2
      row.getCell(1).value = l1;
      row.getCell(1).style = labelStyle;
      row.getCell(2).value = v1;
      row.getCell(2).style = valueStyle;

      // Col 3 & 4
      if (l2) {
        row.getCell(3).value = l2;
        row.getCell(3).style = labelStyle;
        row.getCell(4).value = v2;
        if (isStatus && l2 === "Status") {
          row.getCell(4).style = getStatusStyle(report.status);
          row.getCell(4).value = v2.toUpperCase();
        } else {
          row.getCell(4).style = valueStyle;
        }
      } else {
        worksheet.mergeCells(`B${currentRow}:D${currentRow}`);
      }

      row.height = 20;
      currentRow++;
    };

    // --- General Info Section (2-Column Grid) ---
    addSectionHeader("GENERAL INFORMATION");
    addInfoRow("Report Type:", report.reportType || "Home Wash Test");
    addInfoRow("YM Style:", report.ymStyle || "N/A", "Buyer Style:", report.buyerStyle || "N/A");
    addInfoRow("Factory:", report.factory || "N/A", "Status:", report.status || "N/A", true);

    const submittedAt = report.createdAt
      ? new Date(report.createdAt).toLocaleString('en-GB', { hour12: true })
      : (report.submittedAt ? new Date(report.submittedAt).toLocaleString('en-GB', { hour12: true }) : "N/A");

    const submittedByDisplay = getNameForView(report.reporter_emp_id, report.reporter_name, users) || report.reporter_emp_id || "N/A";
    addInfoRow("Submitted By:", submittedByDisplay, "Submitted At:", submittedAt);

    if (report.status === "completed" && (report.checkedBy || report.approvedBy)) {
      const checkedByName = getNameForView(report.checkedBy, report.checkedByName, users);
      const approvedByName = getNameForView(report.approvedBy, report.approvedByName, users);
      const checkedByDisplay = checkedByName ? (checkedByName !== report.checkedBy ? `${checkedByName} (${report.checkedBy})` : checkedByName) : (report.checkedBy || "N/A");
      const approvedByDisplay = approvedByName ? (approvedByName !== report.approvedBy ? `${approvedByName} (${report.approvedBy})` : approvedByName) : (report.approvedBy || "N/A");
      addInfoRow("Checked By:", checkedByDisplay, "Approved By:", approvedByDisplay);
    }

    currentRow++;

    // --- Order Details Section ---
    addSectionHeader("ORDER DETAILS");
    addInfoRow("Colors:", report.color && report.color.length > 0 ? report.color.join(", ") : "N/A");
    addInfoRow("PO:", report.po && report.po.length > 0 ? report.po.join(", ") : "N/A");
    addInfoRow("Ex Fty Date:", report.exFtyDate && report.exFtyDate.length > 0 ? report.exFtyDate.join(", ") : "N/A");

    // --- Dynamic Extra Fields Section ---
    const skipFields = [
      "reportType", "ymStyle", "buyerStyle", "color", "po", "exFtyDate", "factory", "status",
      "createdAt", "updatedAt", "submittedAt", "reporter_emp_id", "reporter_name", "reporter_status", "notes",
      "images", "receivedImages", "completionImages", "receivedNotes", "completionNotes",
      "receivedDate", "receivedAt", "completedDate", "completedAt", "_id", "id", "__v",
      "userId", "userName", "engName", "checkedBy", "approvedBy", "checkedByName", "approvedByName" // Legacy / shown above
    ];

    const extraFields = Object.keys(report).filter(key => !skipFields.includes(key));

    if (extraFields.length > 0) {
      currentRow++;
      addSectionHeader("REPORT DETAILS");
      for (let i = 0; i < extraFields.length; i += 2) {
        const k1 = extraFields[i];
        const k2 = extraFields[i + 1];

        const label1 = (k1.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + k1.replace(/([A-Z])/g, ' $1').slice(1)).trim() + ":";
        const val1 = report[k1]?.toString() || "N/A";

        let label2 = "";
        let val2 = "";
        if (k2) {
          label2 = (k2.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + k2.replace(/([A-Z])/g, ' $1').slice(1)).trim() + ":";
          val2 = report[k2]?.toString() || "N/A";
        }

        addInfoRow(label1, val1, label2, val2);
      }
    }

    currentRow++;

    // --- Timeline Section ---
    addSectionHeader("TEST TIMELINE", "FF1E40AF"); // Darker blue

    // Helper for Step Blocks
    const addStepHeader = (title, date, color) => {
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const cell = worksheet.getCell(`A${currentRow}`);
      cell.value = `  ${title}  -  [ ${date} ]`;
      cell.style = {
        font: { bold: true, size: 10, color: { argb: "FF1F2937" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: color } },
        alignment: { vertical: "middle" },
        border: { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } }
      };
      worksheet.getRow(currentRow).height = 20;
      currentRow++;
    };

    const addNotesBlock = (notes, color) => {
      if (!notes) return;
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const cell = worksheet.getCell(`A${currentRow}`);
      cell.value = `Notes: ${notes}`;
      cell.style = {
        font: { italic: true, size: 9, color: { argb: "FF374151" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: color } },
        alignment: { vertical: "top", wrapText: true, indent: 2 },
        border: { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } }
      };
      // Auto-height for notes
      const lineCount = (notes.match(/\n/g) || []).length + 2;
      worksheet.getRow(currentRow).height = Math.max(25, lineCount * 14);
      currentRow++;
    };

    // Step 1: Sent To Washing
    const step1Date = report.createdAt
      ? new Date(report.createdAt).toLocaleString('en-GB', { hour12: true })
      : (report.submittedAt ? new Date(report.submittedAt).toLocaleString('en-GB', { hour12: true }) : "N/A");

    addStepHeader("Step 1: Sent To Home Washing", step1Date, "FFE3F2FD");
    if (report.notes) addNotesBlock(report.notes, "FFF0F9FF");

    // Step 2: Received
    if (report.receivedDate || report.receivedAt) {
      const step2Date = report.receivedAt
        ? new Date(report.receivedAt).toLocaleString('en-GB', { hour12: true })
        : (report.receivedDate ? new Date(report.receivedDate).toLocaleString('en-GB', { hour12: true }) : "N/A");
      addStepHeader("Step 2: Received", step2Date, "FFFFF9C4");
      if (report.receivedNotes) addNotesBlock(report.receivedNotes, "FFFFFDE7");
    }

    // Step 3: Completed
    if (report.completedDate || report.completedAt) {
      const step3Date = report.completedAt
        ? new Date(report.completedAt).toLocaleString('en-GB', { hour12: true })
        : (report.completedDate ? new Date(report.completedAt || report.completedDate).toLocaleString('en-GB', { hour12: true }) : "N/A");
      addStepHeader("Step 3: Completed", step3Date, "FFE8F5E9");
      if (report.completionNotes) addNotesBlock(report.completionNotes, "FFF1F8F1");
    }

    currentRow += 2;

    // --- Images Section ---
    addSectionHeader("IMAGE GALLERY", "FF111827"); // Black/Dark Gray

    const addImagesToWorksheet = async (title, images, sectionColor) => {
      if (!images || images.length === 0) return;

      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const headerCell = worksheet.getCell(`A${currentRow}`);
      headerCell.value = `  ${title} (${images.length})`;
      headerCell.style = {
        font: { bold: true, size: 10, color: { argb: "FF4B5563" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: sectionColor } },
        border: { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } }
      };
      worksheet.getRow(currentRow).height = 18;
      currentRow++;

      // We'll place images 2 per row
      for (let i = 0; i < images.length; i += 2) {
        const rowNum = currentRow;
        worksheet.getRow(rowNum).height = 140;

        for (let j = 0; j < 2; j++) {
          const idx = i + j;
          if (idx >= images.length) break;

          const imageUrl = normalizeUrl(images[idx], apiBaseUrl);
          const buffer = await fetchImageBuffer(imageUrl);

          if (buffer) {
            try {
              const imageId = workbook.addImage({
                buffer: buffer,
                extension: 'jpeg',
              });

              const colOffset = j === 0 ? 0.2 : 2.2;
              worksheet.addImage(imageId, {
                tl: { col: colOffset, row: rowNum - 0.9 },
                ext: { width: 140, height: 140 },
                editAs: 'oneCell'
              });

              const cell = worksheet.getRow(rowNum).getCell(j === 0 ? 2 : 4);
              cell.value = ` Image ${idx + 1}`;
              cell.alignment = { vertical: 'bottom', horizontal: 'right' };
              cell.font = { size: 8, color: { argb: "FF9CA3AF" } };
            } catch (err) {
              console.error("Error adding image:", err);
            }
          }
        }
        currentRow++;
      }
      currentRow++;
    };

    if (report.images && report.images.length > 0) {
      await addImagesToWorksheet("Step 1 Images", report.images, "FFF0F9FF");
    }

    if (report.receivedImages && report.receivedImages.length > 0) {
      await addImagesToWorksheet("Step 2 Images", report.receivedImages, "FFFFFDE7");
    }

    if (report.completionImages && report.completionImages.length > 0) {
      await addImagesToWorksheet("Step 3 Images", report.completionImages, "FFF1F8F1");
    }

    // --- Footer ---
    currentRow += 2;
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const footerCell = worksheet.getCell(`A${currentRow}`);
    footerCell.value = `Report Generated on ${new Date().toLocaleString('en-GB', { hour12: true })}`;
    footerCell.style = {
      font: { italic: true, size: 9, color: { argb: "FF6B7280" } },
      alignment: { horizontal: "right" }
    };

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
