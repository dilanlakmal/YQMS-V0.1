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
    throw error;
  }
};

// Helper for sorting sizes
const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const getSizeSortValue = (size) => {
  const upperSize = size?.toUpperCase() || "";
  const index = sizeOrder.indexOf(upperSize);
  return index !== -1 ? index : sizeOrder.length;
};

// Helper to check for Khmer characters
const hasKhmer = (text) => /[\u1780-\u17FF\u19E0-\u19FF]/.test(text);

// Helper to check for Chinese characters
const hasChinese = (text) => /[\u4E00-\u9FFF]/.test(text);

// Helper to split text into script segments (Khmer, Chinese, Other)
const splitTextByScript = (text) => {
  const segments = [];
  let currentSegment = "";
  let currentType = null;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isKhmerChar = /[\u1780-\u17FF\u19E0-\u19FF]/.test(char);
    const isChineseChar = /[\u4E00-\u9FFF]/.test(char);
    let charType;
    if (isKhmerChar) charType = "khmer";
    else if (isChineseChar) charType = "chinese";
    else charType = "other";

    if (charType !== currentType && currentSegment) {
      segments.push({ type: currentType, text: currentSegment });
      currentSegment = "";
    }

    currentType = charType;
    currentSegment += char;
  }

  if (currentSegment) {
    segments.push({ type: currentType, text: currentSegment });
  }

  return segments;
};

// Helper to clean unwanted symbols and process defect names
const processDefectName = (text) => {
  if (!text || typeof text !== "string") return text;

  // Remove '/' symbols and normalize spaces
  let cleanedText = text
    .replace(/\//g, " ") // Replace / with space
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Trim leading/trailing spaces

  // Split into segments by script
  const segments = splitTextByScript(cleanedText);

  // Separate Khmer and Chinese segments with "---", exclude Chinese for final output
  let processedSegments = [];
  let finalSegments = [];

  segments.forEach((segment, index) => {
    processedSegments.push(segment);

    // Add "---" between Khmer and Chinese segments during processing
    const nextSegment = segments[index + 1];
    if (
      nextSegment &&
      ((segment.type === "khmer" && nextSegment.type === "chinese") ||
        (segment.type === "chinese" && nextSegment.type === "khmer"))
    ) {
      processedSegments.push({ type: "separator", text: "---" });
    }
  });

  // Log the processed segments with separators for debugging (can be removed in production)
  console.log(
    "Processed Defect Name Segments:",
    processedSegments.map((s) => `${s.type}: ${s.text}`).join(" ")
  );

  // Filter out Chinese segments for final output
  finalSegments = processedSegments.filter(
    (segment) => segment.type !== "chinese"
  );

  // Join the remaining segments (Khmer, English, separators)
  let result = finalSegments.map((segment) => segment.text).join("");

  // Remove any trailing or leading "---" and normalize spaces again
  result = result
    .replace(/^---|---$/g, "") // Remove leading/trailing "---"
    .replace(/\s*---\s*/g, " --- ") // Normalize spaces around "---"
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();

  return result || "Unknown";
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

      // Font Loading
      let khmerBoldBase64, khmerRegularBase64;
      try {
        khmerBoldBase64 = await loadFont("fonts/NotoSansKhmer-Bold.ttf");
        khmerRegularBase64 = await loadFont("fonts/NotoSansKhmer-Regular.ttf");

        doc.addFileToVFS("NotoSansKhmer-Bold.ttf", khmerBoldBase64);
        doc.addFileToVFS("NotoSansKhmer-Regular.ttf", khmerRegularBase64);

        doc.addFont("NotoSansKhmer-Bold.ttf", "NotoSansKhmer", "bold");
        doc.addFont("NotoSansKhmer-Regular.ttf", "NotoSansKhmer", "normal");
      } catch (fontError) {
        console.error(
          "Failed to load required fonts. PDF generation aborted.",
          fontError
        );
        alert("Error loading fonts. Cannot generate PDF.");
        setIsGenerating(false);
        return;
      }

      // Preprocess groupedData to clean the Color field and DefectArray
      const cleanedData = groupedData.map((item) => ({
        ...item,
        // Clean Color field (from previous requirement)
        Color: item.Color
          ? item.Color.replace(/\[|\]/g, "") // Remove [ and ]
              .replace(/\//g, " ") // Replace / with space
              .replace(/\(|\)/g, "") // Remove ( and )
              .replace(/\s+/g, " ") // Replace multiple spaces with single space
              .trim()
          : item.Color,
        // Process DefectArray to clean defect names
        DefectArray: item.DefectArray
          ? item.DefectArray.map((defect) => ({
              ...defect,
              defectName: processDefectName(defect.defectName)
            }))
          : item.DefectArray
      }));

      // Sorting Logic
      let sortedData = [...cleanedData];
      const requiredSortColumns = ["Line No", "MO No", "Color", "Size"];
      const shouldSort = requiredSortColumns.every((col) =>
        columnsToDisplay.includes(col)
      );

      if (shouldSort) {
        sortedData.sort((a, b) => {
          const lineA = parseInt(a.lineNo, 10);
          const lineB = parseInt(b.lineNo, 10);
          const isLineAValid = !isNaN(lineA) && lineA >= 1 && lineA <= 30;
          const isLineBValid = !isNaN(lineB) && lineB >= 1 && lineB <= 30;

          if (isLineAValid && !isLineBValid) return -1;
          if (!isLineAValid && isLineBValid) return 1;
          if (isLineAValid && isLineBValid && lineA !== lineB)
            return lineA - lineB;
          if (a.lineNo !== b.lineNo)
            return String(a.lineNo).localeCompare(String(b.lineNo));

          const moCompare = String(a.MONo || "").localeCompare(
            String(b.MONo || "")
          );
          if (moCompare !== 0) return moCompare;

          const colorCompare = String(a.Color || "").localeCompare(
            String(b.Color || "")
          );
          if (colorCompare !== 0) return colorCompare;

          const sizeCompare = String(a.Size || "").localeCompare(
            String(b.Size || "")
          );
          return sizeCompare;
        });
      }

      // Table Columns
      const tableColumn = [
        ...columnsToDisplay,
        "Checked Qty",
        "Defects Qty",
        "Defect Rate",
        "Defect Details"
      ];

      // Prepare Table Rows
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

        // Format Defect Details as String
        let defectDetailsString = "No matching defects";
        if (item.DefectArray && item.DefectArray.length > 0) {
          const detailsLines = item.DefectArray.map((defect) => {
            const name = String(defect.defectName || "Unknown");
            const qty = String(defect.defectQty || 0);
            const rate =
              item.CheckedQty > 0
                ? ((defect.defectQty / item.CheckedQty) * 100).toFixed(2)
                : "0.00";
            return `${name}: ${qty} (${rate}%)`;
          });
          defectDetailsString = detailsLines.join("\n");
        }
        rowData.push(defectDetailsString);

        return rowData;
      });

      // Define color rules for Defect Rate
      const getDefectRateColor = (rate) => {
        if (rate > 5) return [255, 204, 204];
        if (rate >= 3 && rate <= 5) return [255, 229, 204];
        return [204, 255, 204];
      };

      // Add Title
      doc.setFont("NotoSansKhmer", "bold");
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text("QC Sunrise Summary Report", 14, 15);

      // Generate Main Table
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
          [columnsToDisplay.indexOf("Date")]: { cellWidth: 20 },
          [columnsToDisplay.indexOf("Line No")]: { cellWidth: 15 },
          [columnsToDisplay.indexOf("MO No")]: { cellWidth: 20 },
          [columnsToDisplay.indexOf("Color")]: { cellWidth: 20 },
          [columnsToDisplay.indexOf("Size")]: { cellWidth: 15 },
          [columnsToDisplay.indexOf("Buyer")]: { cellWidth: 20 },
          [columnsToDisplay.length]: { cellWidth: 15, halign: "right" },
          [columnsToDisplay.length + 1]: { cellWidth: 15, halign: "right" },
          [columnsToDisplay.length + 2]: { cellWidth: 15, halign: "right" },
          [columnsToDisplay.length + 3]: {
            cellWidth: 120,
            fontSize: 6,
            cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
            overflow: "linebreak"
          }
        },
        willDrawCell: (data) => {
          if (data.column.dataKey === "Defect Details") {
            data.cell.originalText = data.cell.text;
            data.cell.text = "";
          }
        },
        didDrawCell: (data) => {
          if (data.column.dataKey === "Defect Details") {
            const lines = data.cell.originalText.split("\n");
            const fontSize = 6;
            const lineHeight = fontSize * 1.2;
            let y = data.cell.y + 2;
            doc.setTextColor(55, 65, 81);

            lines.forEach((line) => {
              const segments = splitTextByScript(line);
              let x = data.cell.x + 2;

              segments.forEach((segment) => {
                // Skip Chinese segments in rendering
                if (segment.type === "chinese") return;

                doc.setFont("NotoSansKhmer", "normal");
                doc.setFontSize(fontSize);
                doc.text(segment.text, x, y);
                x += doc.getTextWidth(segment.text);
              });

              y += lineHeight;
            });
          }

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
        },
        didParseCell: (data) => {
          if (
            data.cell.section === "body" &&
            data.cell.raw &&
            data.column.dataKey !== "Defect Details"
          ) {
            const text = String(data.cell.raw);
            if (hasKhmer(text)) {
              data.cell.styles.font = "NotoSansKhmer";
            } else {
              data.cell.styles.font = "NotoSansKhmer";
            }
          }

          if (data.cell.section === "head") {
            data.cell.styles.font = "NotoSansKhmer";
            data.cell.styles.fontStyle = "bold";
          }
        }
      });

      // Add Page Numbers
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
