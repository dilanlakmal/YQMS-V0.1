// import React from "react";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import { FileText } from "lucide-react";
// import { Buffer } from "buffer";

// // Function to load and convert font file to base64
// const loadFont = async (url) => {
//   try {
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error(`Failed to load font at ${url}: ${response.statusText}`);
//     }
//     const arrayBuffer = await response.arrayBuffer();
//     return Buffer.from(arrayBuffer).toString("base64");
//   } catch (error) {
//     console.error(`Error loading font from ${url}:`, error);
//     throw error; // Re-throw to be caught in handleDownloadPDF
//   }
// };

// // Helper for sorting sizes (basic example, customize if needed)
// const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]; // Add other sizes as needed
// const getSizeSortValue = (size) => {
//   const upperSize = size?.toUpperCase() || "";
//   const index = sizeOrder.indexOf(upperSize);
//   return index !== -1 ? index : sizeOrder.length; // Place unknown sizes at the end
// };

// const QCSunriseSummaryPDF = ({
//   groupedData,
//   columnsToDisplay,
//   isGenerating,
//   setIsGenerating
// }) => {
//   const handleDownloadPDF = async () => {
//     if (isGenerating || !groupedData || groupedData.length === 0) return;
//     setIsGenerating(true);

//     try {
//       const doc = new jsPDF({ orientation: "landscape" });

//       // --- Font Loading ---
//       let khmerBoldBase64, khmerRegularBase64, chineseRegularBase64;
//       try {
//         // Ensure these paths are correct relative to your public folder
//         khmerBoldBase64 = await loadFont("/fonts/NotoSansKhmer-Bold.ttf");
//         khmerRegularBase64 = await loadFont("/fonts/NotoSansKhmer-Regular.ttf");
//         chineseRegularBase64 = await loadFont("/fonts/NotoSansSC-Regular.ttf");

//         doc.addFileToVFS("NotoSansKhmer-Bold.ttf", khmerBoldBase64);
//         doc.addFileToVFS("NotoSansKhmer-Regular.ttf", khmerRegularBase64);
//         doc.addFileToVFS("NotoSansSC-Regular.ttf", chineseRegularBase64);

//         doc.addFont("NotoSansKhmer-Bold.ttf", "NotoSansKhmer", "bold");
//         doc.addFont("NotoSansKhmer-Regular.ttf", "NotoSansKhmer", "normal");
//         doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");
//       } catch (fontError) {
//         console.error(
//           "Failed to load required fonts. PDF generation aborted.",
//           fontError
//         );
//         alert("Error loading fonts. Cannot generate PDF.");
//         setIsGenerating(false);
//         return;
//       }
//       // --- End Font Loading ---

//       // --- Sorting Logic ---
//       let sortedData = [...groupedData]; // Create a copy to sort
//       const requiredSortColumns = ["Line No", "MO No", "Color", "Size"];
//       const shouldSort = requiredSortColumns.every((col) =>
//         columnsToDisplay.includes(col)
//       );

//       if (shouldSort) {
//         sortedData.sort((a, b) => {
//           // 1. Line No (Numeric Ascending, 1-30 range prioritized)
//           const lineA = parseInt(a.lineNo, 10);
//           const lineB = parseInt(b.lineNo, 10);
//           const isLineAValid = !isNaN(lineA) && lineA >= 1 && lineA <= 30;
//           const isLineBValid = !isNaN(lineB) && lineB >= 1 && lineB <= 30;

//           if (isLineAValid && !isLineBValid) return -1;
//           if (!isLineAValid && isLineBValid) return 1;
//           if (isLineAValid && isLineBValid && lineA !== lineB)
//             return lineA - lineB;
//           // Handle non-numeric or out-of-range Line Nos (optional: sort them alphabetically or place at end)
//           if (a.lineNo !== b.lineNo)
//             return String(a.lineNo).localeCompare(String(b.lineNo));

//           // 2. MO No (Alphanumeric Ascending)
//           const moCompare = String(a.MONo || "").localeCompare(
//             String(b.MONo || "")
//           );
//           if (moCompare !== 0) return moCompare;

//           // 3. Color (Alphanumeric Ascending)
//           const colorCompare = String(a.Color || "").localeCompare(
//             String(b.Color || "")
//           );
//           if (colorCompare !== 0) return colorCompare;

//           // 4. Size (Custom or Alphanumeric Ascending)
//           // Using basic alphanumeric sort for simplicity, replace with custom logic if needed
//           // const sizeCompare = getSizeSortValue(a.Size) - getSizeSortValue(b.Size);
//           const sizeCompare = String(a.Size || "").localeCompare(
//             String(b.Size || "")
//           );
//           return sizeCompare;
//         });
//       }
//       // --- End Sorting Logic ---

//       // --- Table Columns ---
//       const tableColumn = [
//         ...columnsToDisplay,
//         "Checked Qty",
//         "Defects Qty",
//         "Defect Rate",
//         "Defect Details"
//       ];

//       // --- Prepare Table Rows ---
//       const tableRows = sortedData.map((item) => {
//         const rowData = [];
//         if (columnsToDisplay.includes("Date"))
//           rowData.push(item.inspectionDate || "");
//         if (columnsToDisplay.includes("Line No"))
//           rowData.push(item.lineNo || "");
//         if (columnsToDisplay.includes("MO No")) rowData.push(item.MONo || "");
//         if (columnsToDisplay.includes("Color")) rowData.push(item.Color || "");
//         if (columnsToDisplay.includes("Size")) rowData.push(item.Size || "");
//         if (columnsToDisplay.includes("Buyer")) rowData.push(item.Buyer || "");
//         // Add other columns based on columnsToDisplay...

//         rowData.push(String(item.CheckedQty || 0));
//         rowData.push(String(item.totalDefectsQty || 0));
//         const defectRate =
//           item.defectRate != null
//             ? parseFloat(item.defectRate).toFixed(2)
//             : "0.00";
//         rowData.push(`${defectRate}%`);

//         // --- Format Defect Details as String ---
//         let defectDetailsString = "No matching defects";
//         if (item.DefectArray && item.DefectArray.length > 0) {
//           // Calculate necessary padding (adjust nameWidth as needed)
//           const nameWidth = 35; // Characters allocated for Defect Name
//           const qtyWidth = 10; // Characters for Qty
//           const rateWidth = 10; // Characters for Rate

//           const header = `${"Defect Name".padEnd(nameWidth)} ${"Qty".padEnd(
//             qtyWidth
//           )} ${"Rate".padEnd(rateWidth)}`;
//           const separator = `${"-".repeat(nameWidth)} ${"-".repeat(
//             qtyWidth
//           )} ${"-".repeat(rateWidth)}`;

//           const detailsLines = item.DefectArray.map((defect) => {
//             const name = String(defect.defectName || "Unknown").substring(
//               0,
//               nameWidth
//             ); // Truncate if too long
//             const qty = String(defect.defectQty || 0);
//             const rate =
//               item.CheckedQty > 0
//                 ? ((defect.defectQty / item.CheckedQty) * 100).toFixed(2) + "%"
//                 : "0.00%";
//             return `${name.padEnd(nameWidth)} ${qty.padEnd(
//               qtyWidth
//             )} ${rate.padEnd(rateWidth)}`;
//           });

//           defectDetailsString = [header, separator, ...detailsLines].join("\n");
//         }
//         rowData.push(defectDetailsString);
//         // --- End Format Defect Details ---

//         return rowData;
//       });

//       // Define color rules for Defect Rate
//       const getDefectRateColor = (rate) => {
//         if (rate > 5) return [255, 204, 204]; // Red (bg-red-100) - Lighter for background
//         if (rate >= 3 && rate <= 5) return [255, 229, 204]; // Orange (bg-orange-100) - Lighter for background
//         return [204, 255, 204]; // Green (bg-green-100) - Lighter for background
//       };

//       // --- Add Title ---
//       doc.setFont("NotoSansKhmer", "bold");
//       doc.setFontSize(14);
//       doc.setTextColor(17, 24, 39); // text-gray-900
//       doc.text("QC Sunrise Summary Report", 14, 15);

//       // --- Generate Main Table (Single Call) ---
//       autoTable(doc, {
//         head: [tableColumn],
//         body: tableRows,
//         startY: 22, // Start table below the title
//         theme: "grid", // Use grid theme for clearer lines
//         showHead: "everyPage",
//         pageBreak: "auto", // Default, let autoTable handle breaks
//         rowPageBreak: "avoid", // Try to avoid breaking rows across pages
//         styles: {
//           font: "NotoSansKhmer", // Default font
//           fontSize: 7, // Smaller font size for data
//           cellPadding: 1.5,
//           overflow: "linebreak", // Important for wrapped text
//           valign: "middle"
//         },
//         headStyles: {
//           font: "NotoSansKhmer",
//           fontStyle: "bold",
//           fillColor: [100, 116, 139], // slate-600
//           textColor: [255, 255, 255],
//           fontSize: 8, // Slightly larger header font
//           halign: "center",
//           valign: "middle"
//         },
//         alternateRowStyles: {
//           fillColor: [241, 245, 249] // slate-50
//         },
//         columnStyles: {
//           // Adjust column widths as needed (index based on tableColumn array)
//           [columnsToDisplay.length]: { halign: "right" }, // Checked Qty
//           [columnsToDisplay.length + 1]: { halign: "right" }, // Defects Qty
//           [columnsToDisplay.length + 2]: { halign: "right" }, // Defect Rate
//           [columnsToDisplay.length + 3]: {
//             // Defect Details
//             cellWidth: 85, // Increase width significantly for the formatted string
//             font: "NotoSansKhmer", // Use Khmer as base for details
//             fontSize: 6, // Even smaller font for dense details
//             cellPadding: { top: 1, right: 1, bottom: 1, left: 1 }
//           },
//           // Example: Set width for 'Color' if it exists
//           [columnsToDisplay.indexOf("Color")]: { cellWidth: 25 },
//           // Example: Set width for 'MO No' if it exists
//           [columnsToDisplay.indexOf("MO No")]: { cellWidth: 25 }
//         },
//         didParseCell: (data) => {
//           // --- Dynamic Font Switching ---
//           // Only switch font if Chinese characters are detected
//           if (data.cell.section === "body" && data.cell.raw) {
//             // Check for Chinese characters specifically in the Defect Details column
//             if (data.column.index === tableColumn.indexOf("Defect Details")) {
//               const text = String(data.cell.raw);
//               const hasChinese = /[\u4E00-\u9FFF]/.test(text);
//               if (hasChinese) {
//                 // Apply Chinese font only if needed, Khmer is default
//                 data.cell.styles.font = "NotoSansSC";
//               }
//               // Ensure Khmer is used if no Chinese detected, overriding potential inheritance issues
//               else {
//                 data.cell.styles.font = "NotoSansKhmer";
//               }
//             } else {
//               // Apply font switching for other columns as well if needed
//               const text = String(data.cell.raw);
//               const hasChinese = /[\u4E00-\u9FFF]/.test(text);
//               // No need to explicitly check for Khmer here, as it's the default
//               if (hasChinese) {
//                 data.cell.styles.font = "NotoSansSC";
//               }
//               // Ensure Khmer is used if no Chinese detected, overriding potential inheritance issues
//               else {
//                 data.cell.styles.font = "NotoSansKhmer";
//               }
//             }
//           }

//           // Header font is set in headStyles, ensure it's correct
//           if (data.cell.section === "head") {
//             data.cell.styles.font = "NotoSansKhmer";
//             data.cell.styles.fontStyle = "bold";
//           }
//         },
//         didDrawCell: (data) => {
//           // --- Apply Background Color to Defect Rate Column ---
//           const defectRateIndex = tableColumn.indexOf("Defect Rate");
//           if (
//             data.column.index === defectRateIndex &&
//             data.row.section === "body" &&
//             data.cell.text &&
//             data.cell.text[0]
//           ) {
//             const text = data.cell.text[0];
//             const rate = text.includes("%")
//               ? parseFloat(text.replace("%", ""))
//               : NaN;
//             if (!isNaN(rate)) {
//               const color = getDefectRateColor(rate);
//               doc.setFillColor(...color);
//               doc.rect(
//                 data.cell.x,
//                 data.cell.y,
//                 data.cell.width,
//                 data.cell.height,
//                 "F" // Fill
//               );
//               // Redraw text to ensure it's visible over the background fill
//               // Use text properties from the cell style for consistency
//               doc.setFont(data.cell.styles.font, data.cell.styles.fontStyle);
//               doc.setFontSize(data.cell.styles.fontSize);
//               doc.setTextColor(55, 65, 81); // Use a readable text color (e.g., gray-700)
//               // Manually handle text alignment based on styles
//               const { halign, valign } = data.cell.styles;
//               const textPos = data.cell.getTextPos(); // Get calculated text position
//               doc.text(text, textPos.x, textPos.y, {
//                 // Use calculated position
//                 align: halign,
//                 baseline: valign
//               });
//             }
//           }

//           // --- Removed Nested Table Drawing ---
//           // The pre-formatted string handles the defect details content.
//         }
//       });
//       // --- End Generate Main Table ---

//       // --- Add Page Numbers ---
//       const pageCount = doc.internal.getNumberOfPages();
//       doc.setFont("NotoSansKhmer", "normal");
//       doc.setFontSize(8);
//       for (let i = 1; i <= pageCount; i++) {
//         doc.setPage(i);
//         doc.text(
//           `Page ${i} of ${pageCount}`,
//           doc.internal.pageSize.width - 20, // Position right
//           doc.internal.pageSize.height - 10, // Position bottom
//           { align: "right" }
//         );
//       }
//       // --- End Add Page Numbers ---

//       // Save the PDF
//       doc.save("QCSunriseSummary.pdf");
//     } catch (error) {
//       console.error("Error generating PDF:", error);
//       alert(`Failed to generate PDF: ${error.message || error}`); // Show error to user
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   return (
//     <button
//       onClick={handleDownloadPDF}
//       disabled={isGenerating || !groupedData || groupedData.length === 0}
//       title="Download PDF Report"
//       className={`flex items-center px-3 py-1 rounded-md text-white transition duration-150 ease-in-out ${
//         isGenerating || !groupedData || groupedData.length === 0
//           ? "bg-gray-400 cursor-not-allowed"
//           : "bg-red-600 hover:bg-red-700"
//       } focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
//     >
//       <FileText className="w-5 h-5 mr-1" /> {/* Added margin */}
//       {isGenerating ? "Generating..." : ""}{" "}
//       {/* Show text only when generating */}
//     </button>
//   );
// };

// export default QCSunriseSummaryPDF;

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";
import { Buffer } from "buffer";

// Function to load and convert font file to base64
const loadFont = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load font at ${url}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (error) {
    console.error(`Error loading font from ${url}:`, error);
    throw error; // Re-throw to be caught in handleDownloadPDF
  }
};

// Helper for sorting sizes (basic example, customize if needed)
const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]; // Add other sizes as needed
const getSizeSortValue = (size) => {
  const upperSize = size?.toUpperCase() || "";
  const index = sizeOrder.indexOf(upperSize);
  return index !== -1 ? index : sizeOrder.length; // Place unknown sizes at the end
};

const QCSunriseSummaryPDF = ({
  groupedData,
  columnsToDisplay,
  isGenerating,
  setIsGenerating
}) => {
  const handleDownloadPDF = async () => {
    if (isGenerating || !groupedData || groupedData.length === 0) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF({ orientation: "landscape" });

      // --- Font Loading ---
      let khmerBoldBase64, khmerRegularBase64, chineseRegularBase64;
      try {
        // Ensure these paths are correct relative to your public folder
        khmerBoldBase64 = await loadFont("/fonts/NotoSansKhmer-Bold.ttf");
        khmerRegularBase64 = await loadFont("/fonts/NotoSansKhmer-Regular.ttf");
        chineseRegularBase64 = await loadFont("/fonts/NotoSansSC-Regular.ttf");

        doc.addFileToVFS("NotoSansKhmer-Bold.ttf", khmerBoldBase64);
        doc.addFileToVFS("NotoSansKhmer-Regular.ttf", khmerRegularBase64);
        doc.addFileToVFS("NotoSansSC-Regular.ttf", chineseRegularBase64);

        doc.addFont("NotoSansKhmer-Bold.ttf", "NotoSansKhmer", "bold");
        doc.addFont("NotoSansKhmer-Regular.ttf", "NotoSansKhmer", "normal");
        doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");
      } catch (fontError) {
        console.error(
          "Failed to load required fonts. PDF generation aborted.",
          fontError
        );
        alert("Error loading fonts. Cannot generate PDF.");
        setIsGenerating(false);
        return;
      }
      // --- End Font Loading ---

      // --- Sorting Logic ---
      let sortedData = [...groupedData]; // Create a copy to sort
      const requiredSortColumns = ["Line No", "MO No", "Color", "Size"];
      const shouldSort = requiredSortColumns.every((col) =>
        columnsToDisplay.includes(col)
      );

      if (shouldSort) {
        sortedData.sort((a, b) => {
          // 1. Line No (Numeric Ascending, 1-30 range prioritized)
          const lineA = parseInt(a.lineNo, 10);
          const lineB = parseInt(b.lineNo, 10);
          const isLineAValid = !isNaN(lineA) && lineA >= 1 && lineA <= 30;
          const isLineBValid = !isNaN(lineB) && lineB >= 1 && lineB <= 30;

          if (isLineAValid && !isLineBValid) return -1;
          if (!isLineAValid && isLineBValid) return 1;
          if (isLineAValid && isLineBValid && lineA !== lineB)
            return lineA - lineB;
          // Handle non-numeric or out-of-range Line Nos
          if (a.lineNo !== b.lineNo)
            return String(a.lineNo).localeCompare(String(b.lineNo));

          // 2. MO No (Alphanumeric Ascending)
          const moCompare = String(a.MONo || "").localeCompare(
            String(b.MONo || "")
          );
          if (moCompare !== 0) return moCompare;

          // 3. Color (Alphanumeric Ascending)
          const colorCompare = String(a.Color || "").localeCompare(
            String(b.Color || "")
          );
          if (colorCompare !== 0) return colorCompare;

          // 4. Size (Custom or Alphanumeric Ascending)
          const sizeCompare = String(a.Size || "").localeCompare(
            String(b.Size || "")
          );
          return sizeCompare;
        });
      }
      // --- End Sorting Logic ---

      // --- Table Columns ---
      const tableColumn = [
        ...columnsToDisplay,
        "Checked Qty",
        "Defects Qty",
        "Defect Rate",
        "Defect Details"
      ];

      // --- Prepare Table Rows ---
      const tableRows = sortedData.map((item) => {
        const rowData = [];
        if (columnsToDisplay.includes("Date"))
          rowData.push(item.inspectionDate || "");
        if (columnsToDisplay.includes("Line No"))
          rowData.push(item.lineNo || "");
        if (columnsToDisplay.includes("MO No")) rowData.push(item.MONo || "");
        if (columnsToDisplay.includes("Color")) rowData.push(item.Color || "");
        if (columnsToDisplay.includes("Size")) rowData.push(item.Size || "");
        if (columnsToDisplay.includes("Buyer")) rowData.push(item.Buyer || "");

        rowData.push(String(item.CheckedQty || 0));
        rowData.push(String(item.totalDefectsQty || 0));
        const defectRate =
          item.defectRate != null
            ? parseFloat(item.defectRate).toFixed(2)
            : "0.00";
        rowData.push(`${defectRate}%`);

        // --- Format Defect Details as String ---
        let defectDetailsString = "No matching defects";
        if (item.DefectArray && item.DefectArray.length > 0) {
          // Adjusted widths for better alignment
          const nameWidth = 80; // Increased for longer defect names
          const qtyWidth = 10;
          const rateWidth = 10;

          const header = `${"Defect Name".padEnd(nameWidth)} ${"Qty".padEnd(
            qtyWidth
          )} ${"Rate".padEnd(rateWidth)}`;
          const separator = `${"-".repeat(nameWidth)} ${"-".repeat(
            qtyWidth
          )} ${"-".repeat(rateWidth)}`;

          const detailsLines = item.DefectArray.map((defect) => {
            const name = String(defect.defectName || "Unknown").substring(
              0,
              nameWidth
            );
            const qty = String(defect.defectQty || 0);
            const rate =
              item.CheckedQty > 0
                ? ((defect.defectQty / item.CheckedQty) * 100).toFixed(2) + "%"
                : "0.00%";
            return `${name.padEnd(nameWidth)} ${qty.padEnd(
              qtyWidth
            )} ${rate.padEnd(rateWidth)}`;
          });

          defectDetailsString = [header, separator, ...detailsLines].join("\n");
        }
        rowData.push(defectDetailsString);
        // --- End Format Defect Details ---

        return rowData;
      });

      // Define color rules for Defect Rate
      const getDefectRateColor = (rate) => {
        if (rate > 5) return [255, 204, 204]; // Red
        if (rate >= 3 && rate <= 5) return [255, 229, 204]; // Orange
        return [204, 255, 204]; // Green
      };

      // --- Add Title ---
      doc.setFont("NotoSansKhmer", "bold");
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text("QC Sunrise Summary Report", 14, 15);

      // --- Generate Main Table ---
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 22,
        theme: "grid",
        showHead: "everyPage",
        pageBreak: "auto",
        rowPageBreak: "avoid",
        styles: {
          font: "NotoSansKhmer",
          fontSize: 7,
          cellPadding: 1.5,
          overflow: "linebreak",
          valign: "middle"
        },
        headStyles: {
          font: "NotoSansKhmer",
          fontStyle: "bold",
          fillColor: [100, 116, 139],
          textColor: [255, 255, 255],
          fontSize: 8,
          halign: "center",
          valign: "middle"
        },
        alternateRowStyles: {
          fillColor: [241, 245, 249]
        },
        columnStyles: {
          [columnsToDisplay.length]: { halign: "right" }, // Checked Qty
          [columnsToDisplay.length + 1]: { halign: "right" }, // Defects Qty
          [columnsToDisplay.length + 2]: { halign: "right" }, // Defect Rate
          [columnsToDisplay.length + 3]: {
            // Defect Details
            cellWidth: 100, // Increased for wider content
            font: "NotoSansKhmer",
            fontSize: 7, // Slightly larger for readability
            cellPadding: { top: 1, right: 1, bottom: 1, left: 1 }
          },
          [columnsToDisplay.indexOf("Color")]: { cellWidth: 25 },
          [columnsToDisplay.indexOf("MO No")]: { cellWidth: 25 }
        },
        didParseCell: (data) => {
          // --- Dynamic Font Switching ---
          if (data.cell.section === "body" && data.cell.raw) {
            if (data.column.index === tableColumn.indexOf("Defect Details")) {
              const text = String(data.cell.raw);
              const hasChinese = /[\u4E00-\u9FFF]/.test(text);
              if (hasChinese) {
                data.cell.styles.font = "NotoSansSC";
              } else {
                data.cell.styles.font = "NotoSansKhmer";
              }
            } else {
              const text = String(data.cell.raw);
              const hasChinese = /[\u4E00-\u9FFF]/.test(text);
              if (hasChinese) {
                data.cell.styles.font = "NotoSansSC";
              } else {
                data.cell.styles.font = "NotoSansKhmer";
              }
            }
          }

          if (data.cell.section === "head") {
            data.cell.styles.font = "NotoSansKhmer";
            data.cell.styles.fontStyle = "bold";
          }
        },
        didDrawCell: (data) => {
          // --- Apply Background Color to Defect Rate Column ---
          const defectRateIndex = tableColumn.indexOf("Defect Rate");
          if (
            data.column.index === defectRateIndex &&
            data.row.section === "body" &&
            data.cell.text &&
            data.cell.text[0]
          ) {
            const text = data.cell.text[0];
            const rate = text.includes("%")
              ? parseFloat(text.replace("%", ""))
              : NaN;
            if (!isNaN(rate)) {
              const color = getDefectRateColor(rate);
              doc.setFillColor(...color);
              doc.rect(
                data.cell.x,
                data.cell.y,
                data.cell.width,
                data.cell.height,
                "F"
              );
              doc.setFont(data.cell.styles.font, data.cell.styles.fontStyle);
              doc.setFontSize(data.cell.styles.fontSize);
              doc.setTextColor(55, 65, 81);
              const { halign, valign } = data.cell.styles;
              const textPos = data.cell.getTextPos();
              doc.text(text, textPos.x, textPos.y, {
                align: halign,
                baseline: valign
              });
            }
          }
        }
      });

      // --- Add Page Numbers ---
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFont("NotoSansKhmer", "normal");
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10,
          { align: "right" }
        );
      }

      // Save the PDF
      doc.save("QCSunriseSummary.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Failed to generate PDF: ${error.message || error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownloadPDF}
      disabled={isGenerating || !groupedData || groupedData.length === 0}
      title="Download PDF Report"
      className={`flex items-center px-3 py-1 rounded-md text-white transition duration-150 ease-in-out ${
        isGenerating || !groupedData || groupedData.length === 0
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-red-600 hover:bg-red-700"
      } focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
    >
      <FileText className="w-5 h-5 mr-1" />
      {isGenerating ? "Generating..." : ""}
    </button>
  );
};

export default QCSunriseSummaryPDF;
