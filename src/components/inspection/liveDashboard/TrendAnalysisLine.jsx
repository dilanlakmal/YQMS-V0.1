import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mt-6 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-2">
            QC2 Defect Rate by Line No and MO No - Hour Trend
          </h2>
          <p className="text-gray-700">
            Something went wrong. Please try again or contact support.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const TrendAnalysisLine = ({ data, lineNoFilter }) => {
  // Define hour headers from 6-7 AM to 8-9 PM
  const hourLabels = {
    "07:00": "6-7",
    "08:00": "7-8",
    "09:00": "8-9",
    "10:00": "9-10",
    "11:00": "10-11",
    "12:00": "11-12",
    "13:00": "12-1",
    "14:00": "1-2",
    "15:00": "2-3",
    "16:00": "3-4",
    "17:00": "4-5",
    "18:00": "5-6",
    "19:00": "6-7",
    "20:00": "7-8",
    "21:00": "8-9"
  };

  const periodLabels = {
    "07:00": "AM",
    "08:00": "AM",
    "09:00": "AM",
    "10:00": "AM",
    "11:00": "AM",
    "12:00": "AM",
    "13:00": "PM",
    "14:00": "PM",
    "15:00": "PM",
    "16:00": "PM",
    "17:00": "PM",
    "18:00": "PM",
    "19:00": "PM",
    "20:00": "PM",
    "21:00": "PM"
  };

  // Sort Line Nos consistently
  const lineNos = Object.keys(data || {})
    .filter((key) => key !== "total" && key !== "grand")
    .filter((lineNo) => !lineNoFilter || lineNo === lineNoFilter) // Exact match for lineNoFilter
    .sort();

  // Filter hours with at least one non-zero value for any Line No/MO No
  const activeHours = Object.keys(hourLabels).filter((hour) =>
    lineNos.some((lineNo) => {
      const moNos = Object.keys((data || {})[lineNo] || {});
      return moNos.some(
        (moNo) => ((data || {})[lineNo]?.[moNo]?.[hour]?.rate || 0) > 0
      );
    })
  );

  // State for expanded rows (Line No and MO No)
  const [expandedLines, setExpandedLines] = useState({});
  const [expandedMos, setExpandedMos] = useState({});

  // Toggle expansion for Line No
  const toggleLine = (lineNo) =>
    setExpandedLines((prev) => ({ ...prev, [lineNo]: !prev[lineNo] }));

  // Toggle expansion for MO No within a Line No
  const toggleMo = (lineNo, moNo) =>
    setExpandedMos((prev) => ({
      ...prev,
      [`${lineNo}-${moNo}`]: !prev[`${lineNo}-${moNo}`]
    }));

  // Function to determine background color based on defect rate
  const getBackgroundColor = (rate) => {
    if (rate > 3) return "bg-red-100"; // Light red
    if (rate >= 2) return "bg-yellow-100"; // Yellow
    return "bg-green-100"; // Light green
  };

  // Function to determine font color based on defect rate
  const getFontColor = (rate) => {
    if (rate > 3) return "text-red-800"; // Dark red
    if (rate >= 2) return "text-orange-800"; // Dark orange
    return "text-green-800"; // Dark green
  };

  // Map background colors to RGB for PDF and Excel
  const getBackgroundColorRGB = (rate) => {
    if (rate > 3) return [255, 204, 204]; // Light red (bg-red-100)
    if (rate >= 2) return [255, 255, 204]; // Light yellow (bg-yellow-100)
    return [204, 255, 204]; // Light green (bg-green-100)
  };

  // Map font colors to RGB for PDF
  const getFontColorRGB = (rate) => {
    if (rate > 3) return [153, 0, 0]; // Dark red (text-red-800)
    if (rate >= 2) return [204, 102, 0]; // Dark orange (text-orange-800)
    return [0, 102, 0]; // Dark green (text-green-800)
  };

  // Map background colors to hex for Excel (xlsx format)
  const getBackgroundColorHex = (rate) => {
    if (rate > 3) return "FFCCCC"; // Light red (bg-red-100)
    if (rate >= 2) return "FFFFCC"; // Light yellow (bg-yellow-100)
    return "CCFFCC"; // Light green (bg-green-100)
  };

  // Function to check for 3 consecutive periods with defect rate > 3% (Critical)
  const isCritical = (lineNo, moNo) => {
    const rates = activeHours.map((hour) => {
      const { rate = 0, hasCheckedQty = false } =
        (data || {})[lineNo]?.[moNo]?.[hour] || {};
      return hasCheckedQty ? rate : 0;
    });

    for (let i = 0; i <= rates.length - 3; i++) {
      if (rates[i] > 3 && rates[i + 1] > 3 && rates[i + 2] > 3) return true;
    }
    return false;
  };

  // Function to check for 2 consecutive periods with defect rate > 3% (Warning)
  const isWarning = (lineNo, moNo) => {
    const rates = activeHours.map((hour) => {
      const { rate = 0, hasCheckedQty = false } =
        (data || {})[lineNo]?.[moNo]?.[hour] || {};
      return hasCheckedQty ? rate : 0;
    });

    for (let i = 0; i <= rates.length - 2; i++) {
      if (rates[i] > 3 && rates[i + 1] > 3) return true;
    }
    return false;
  };

  // Memoized defect trends by Line No and MO No
  const defectTrendsByLineMo = useMemo(() => {
    const trends = {};
    lineNos.forEach((lineNo) => {
      trends[lineNo] = {};
      const moNos = Object.keys((data || {})[lineNo] || {})
        .filter((key) => key !== "totalRate")
        .sort();
      moNos.forEach((moNo) => {
        const defectsByName = {};
        const totalCheckedQty = activeHours.reduce(
          (sum, hour) =>
            sum + (((data || {})[lineNo] || {})[moNo]?.[hour]?.checkedQty || 0),
          0
        );

        activeHours.forEach((hour) => {
          const hourData = ((data || {})[lineNo] || {})[moNo]?.[hour] || {
            checkedQty: 0,
            defects: []
          };
          hourData.defects
            .filter((defect) => defect.name && defect.name !== "No Defect") // Filter out "No Defect"
            .forEach((defect) => {
              if (!defectsByName[defect.name]) {
                defectsByName[defect.name] = { totalCount: 0, trends: {} };
              }
              defectsByName[defect.name].trends[hour] = {
                count: defect.count || 0,
                rate: defect.rate || 0
              };
              defectsByName[defect.name].totalCount += defect.count || 0;
            });
        });

        trends[lineNo][moNo] = Object.entries(defectsByName)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([defectName, { totalCount, trends }]) => ({
            defectName,
            totalDefectRate:
              totalCheckedQty > 0 ? (totalCount / totalCheckedQty) * 100 : 0,
            trends
          }));
      });
    });
    return trends;
  }, [data, lineNos, activeHours]);

  // Prepare data for Excel and PDF export (always fully expanded)
  const prepareExportData = () => {
    const exportData = [];
    const ratesMap = new Map(); // Store rates for each cell to use in styling

    // Add table title as the first row
    const titleRow = [
      "QC2 Defect Rate by Line No and MO No - Hour Trend",
      ...Array(activeHours.length + 1).fill("")
    ];
    exportData.push(titleRow);
    ratesMap.set(`${0}-0`, 0); // Title row has no rate

    // Add empty row for spacing
    exportData.push(Array(activeHours.length + 2).fill(""));
    ratesMap.set(`${1}-0`, 0); // Empty row has no rate

    // Add header rows
    const headerRow1 = ["Line No / MO No"];
    const headerRow2 = [""];
    activeHours.forEach((hour) => {
      headerRow1.push(hourLabels[hour]);
      headerRow2.push(periodLabels[hour]);
    });
    headerRow1.push("Total");
    headerRow2.push("");
    exportData.push(headerRow1);
    exportData.push(headerRow2);
    // Header rows have no rates
    ratesMap.set(`${2}-0`, 0);
    ratesMap.set(`${3}-0`, 0);

    let rowIndex = 4; // Start after title, empty row, and headers

    // Add data rows for each Line No, MO No, and Defects (always include all levels)
    lineNos.forEach((lineNo) => {
      // Line No row
      const lineRow = [lineNo];
      activeHours.forEach((hour, colIndex) => {
        const totalRate = Object.values((data || {})[lineNo] || {}).reduce(
          (sum, moData) =>
            sum + (moData[hour]?.rate || 0) * (moData[hour]?.checkedQty || 0),
          0
        );
        const totalCheckedQty = Object.values(
          (data || {})[lineNo] || {}
        ).reduce((sum, moData) => sum + (moData[hour]?.checkedQty || 0), 0);
        const rate = totalCheckedQty > 0 ? totalRate / totalCheckedQty : 0;
        const hasCheckedQty = totalCheckedQty > 0;
        lineRow.push(hasCheckedQty ? `${rate.toFixed(2)}%` : "");
        ratesMap.set(`${rowIndex}-${colIndex + 1}`, hasCheckedQty ? rate : 0);
      });
      const totalLineRate = (data || {})[lineNo]?.totalRate || 0;
      lineRow.push(`${totalLineRate.toFixed(2)}%`);
      ratesMap.set(`${rowIndex}-${activeHours.length + 1}`, totalLineRate);
      exportData.push(lineRow);
      rowIndex++;

      // MO No rows (always include, simulating full expansion)
      Object.keys((data || {})[lineNo] || {})
        .sort()
        .forEach((moNo) => {
          const moRow = [`  ${moNo}`];
          activeHours.forEach((hour, colIndex) => {
            const { rate = 0, hasCheckedQty = false } =
              ((data || {})[lineNo] || {})[moNo]?.[hour] || {};
            moRow.push(hasCheckedQty ? `${rate.toFixed(2)}%` : "");
            ratesMap.set(
              `${rowIndex}-${colIndex + 1}`,
              hasCheckedQty ? rate : 0
            );
          });
          const totalMoRate = (data || {})[lineNo]?.[moNo]?.totalRate || 0;
          moRow.push(`${totalMoRate.toFixed(2)}%`);
          ratesMap.set(`${rowIndex}-${activeHours.length + 1}`, totalMoRate);
          exportData.push(moRow);
          rowIndex++;

          // Defect rows (always include, simulating full expansion)
          ((defectTrendsByLineMo[lineNo] || {})[moNo] || []).forEach(
            (defect) => {
              const defectRow = [`    ${defect.defectName}`];
              activeHours.forEach((hour, colIndex) => {
                const { rate = 0 } = defect.trends[hour] || {};
                const hasData = rate > 0;
                defectRow.push(hasData ? `${rate.toFixed(2)}%` : "");
                ratesMap.set(`${rowIndex}-${colIndex + 1}`, hasData ? rate : 0);
              });
              const totalDefectRate = defect.totalDefectRate || 0;
              defectRow.push(`${totalDefectRate.toFixed(2)}%`);
              ratesMap.set(
                `${rowIndex}-${activeHours.length + 1}`,
                totalDefectRate
              );
              exportData.push(defectRow);
              rowIndex++;
            }
          );
        });
    });

    // Add total row
    const totalRow = ["Total"];
    activeHours.forEach((hour, colIndex) => {
      const { rate = 0, hasCheckedQty = false } =
        (data || {}).total?.[hour] || {};
      totalRow.push(hasCheckedQty ? `${rate.toFixed(2)}%` : "");
      ratesMap.set(`${rowIndex}-${colIndex + 1}`, hasCheckedQty ? rate : 0);
    });
    const grandRate = (data || {}).grand?.rate || 0;
    totalRow.push(`${grandRate.toFixed(2)}%`);
    ratesMap.set(`${rowIndex}-${activeHours.length + 1}`, grandRate);
    exportData.push(totalRow);

    return { exportData, ratesMap };
  };

  // Download Excel
  const downloadExcel = () => {
    try {
      const { exportData, ratesMap } = prepareExportData();
      const ws = XLSX.utils.aoa_to_sheet(exportData);

      // Apply gridlines and background colors to cells
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) continue;

          const rate = ratesMap.get(`${row}-${col}`) || 0;
          const isHeaderRow = row === 2 || row === 3; // Header rows
          const isTotalRow = row === range.e.r; // Total row

          ws[cellAddress].s = {
            border: {
              top: { style: "thin", color: { auto: 1 } },
              bottom: { style: "thin", color: { auto: 1 } },
              left: { style: "thin", color: { auto: 1 } },
              right: { style: "thin", color: { auto: 1 } }
            },
            fill: {
              fgColor: {
                rgb:
                  isHeaderRow || isTotalRow
                    ? "ADD8E6" // Light blue for headers and total row (bg-blue-100)
                    : rate > 0
                    ? getBackgroundColorHex(rate)
                    : row === 0 || row === 1
                    ? "FFFFFF" // White for title and empty row
                    : "E5E7EB" // Gray for cells with no data (bg-gray-100)
              }
            },
            alignment: {
              horizontal: col === 0 ? "left" : "center",
              vertical: "middle"
            }
          };
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Trend Analysis Line");
      XLSX.writeFile(wb, "TrendAnalysisLine.xlsx");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      alert("Failed to download Excel. Please check the console for details.");
    }
  };

  // Download PDF
  const downloadPDF = () => {
    try {
      // Use the current state values explicitly to avoid initialization issues
      const currentExpandedLines = { ...expandedLines };
      const currentExpandedMos = { ...expandedMos };
      const { exportData, ratesMap } = prepareExportData(
        currentExpandedLines,
        currentExpandedMos
      );

      // Calculate defect count per MO No for accurate row mapping
      const defectCountPerMoNo = {};
      lineNos.forEach((lineNo) => {
        const moNos = Object.keys((data || {})[lineNo] || {}).filter(
          (key) => key !== "totalRate"
        );
        let moRowOffset = 0;
        moNos.forEach((moNo) => {
          defectCountPerMoNo[`${lineNo}-${moNo}`] = {
            count: ((defectTrendsByLineMo[lineNo] || {})[moNo] || []).length,
            offset: moRowOffset
          };
          moRowOffset +=
            1 +
            (((defectTrendsByLineMo[lineNo] || {})[moNo] || []).length || 0);
        });
        defectCountPerMoNo[lineNo] = moRowOffset;
      });

      const doc = new jsPDF({
        orientation: "landscape"
      });

      autoTable(doc, {
        head: [exportData[2], exportData[3]], // Skip the title and empty row
        body: exportData.slice(4),
        startY: 20,
        theme: "grid",
        headStyles: {
          fillColor: [173, 216, 230], // Light blue (bg-blue-100)
          textColor: [55, 65, 81], // Dark gray (text-gray-700)
          fontStyle: "bold"
        },
        styles: {
          cellPadding: 2,
          fontSize: 8,
          halign: "center",
          valign: "middle"
        },
        columnStyles: {
          0: { halign: "left" } // Align "Line No / MO No" column to the left
        },
        didParseCell: (data) => {
          const rowIndex = data.row.index + 4; // Adjust for skipped title and empty row
          const colIndex = data.column.index;
          const rate = ratesMap.get(`${rowIndex}-${colIndex}`) || 0;
          const isTotalRow = rowIndex === exportData.length - 1;

          // Determine which Line No and MO No this row corresponds to
          let currentLineNo = null;
          let currentMoNo = null;
          let cumulativeRows = 4; // Start after title, empty row, and headers
          for (const lineNo of lineNos) {
            cumulativeRows += 1; // For the Line No row
            if (rowIndex === cumulativeRows - 1) {
              currentLineNo = lineNo;
              break;
            }
            const moNos = Object.keys((data || {})[lineNo] || {})
              .filter((key) => key !== "totalRate")
              .sort();
            for (const moNo of moNos) {
              const defectCount = (
                (defectTrendsByLineMo[lineNo] || {})[moNo] || []
              ).length;
              const moRows = 1 + defectCount; // 1 for MO No row + defect rows
              if (
                rowIndex >= cumulativeRows &&
                rowIndex < cumulativeRows + moRows
              ) {
                currentLineNo = lineNo;
                currentMoNo = moNo;
                break;
              }
              cumulativeRows += moRows;
            }
            if (currentLineNo) break;
          }

          // Apply background and font colors based on rate and expanded state
          if (data.section === "body") {
            if (colIndex === 0) {
              // First column (Line No / MO No)
              if (isTotalRow) {
                data.cell.styles.fillColor = [173, 216, 230]; // Light blue for total row
                data.cell.styles.textColor = [55, 65, 81]; // text-gray-700
              } else if (
                currentLineNo &&
                currentExpandedLines[currentLineNo] &&
                !currentMoNo
              ) {
                data.cell.styles.fillColor = [0, 0, 0]; // Black for expanded Line No
                data.cell.styles.textColor = [255, 255, 255]; // White text
              } else if (
                currentLineNo &&
                currentMoNo &&
                currentExpandedLines[currentLineNo] &&
                currentExpandedMos[`${currentLineNo}-${currentMoNo}`]
              ) {
                data.cell.styles.fillColor = [31, 41, 55]; // Gray-800/light black for expanded MO No
                data.cell.styles.textColor = [255, 255, 255]; // White text
              } else {
                data.cell.styles.fillColor = [255, 255, 255]; // White for unexpanded
                data.cell.styles.textColor = [55, 65, 81]; // text-gray-700
              }
            } else {
              // Rate columns
              const hasCheckedQty =
                data.row.raw &&
                data.row.raw[colIndex] &&
                data.row.raw[colIndex].includes("%");
              if (hasCheckedQty && rate === 0) {
                data.cell.styles.fillColor = [204, 255, 204]; // Light green for rate = 0 with data
                data.cell.styles.textColor = [0, 102, 0]; // Dark green
              } else if (rate > 0) {
                data.cell.styles.fillColor = getBackgroundColorRGB(rate);
                data.cell.styles.textColor = getFontColorRGB(rate);
              } else {
                data.cell.styles.fillColor = isTotalRow
                  ? [173, 216, 230]
                  : [229, 231, 235]; // bg-gray-100 or light blue for total row
                data.cell.styles.textColor = [55, 65, 81]; // text-gray-700
              }
            }
          }
        },
        didDrawPage: (data) => {
          // Add table title
          doc.text("QC2 Defect Rate by Line No and MO No - Hour Trend", 14, 10);
        }
      });

      doc.save("TrendAnalysisLine.pdf");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please check the console for details.");
    }
  };

  // Add error boundary fallback if data is invalid
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="mt-6 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-sm font-medium text-gray-900 mb-2">
          QC2 Defect Rate by Line No and MO No - Hour Trend
        </h2>
        <p className="text-gray-700">No data available</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="mt-6 bg-white shadow-md rounded-lg p-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-medium text-gray-900">
            QC2 Defect Rate by Line No and MO No - Hour Trend
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={downloadExcel}
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none"
              title="Download as Excel"
            >
              <FaFileExcel className="mr-2" />
              Excel
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
              title="Download as PDF"
            >
              <FaFilePdf className="mr-2" />
              PDF
            </button>
          </div>
        </div>
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-blue-100">
              <th className="py-2 px-4 border border-gray-800 text-left text-sm font-bold text-gray-700">
                Line No / MO No
              </th>
              {activeHours.map((hour) => (
                <th
                  key={hour}
                  className="py-2 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700"
                >
                  {hourLabels[hour]}
                </th>
              ))}
              <th className="py-2 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700">
                Total
              </th>
            </tr>
            <tr className="bg-blue-100">
              <th className="py-1 px-4 border border-gray-800 text-left text-sm font-bold text-gray-700"></th>
              {activeHours.map((hour) => (
                <th
                  key={hour}
                  className="py-1 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700"
                >
                  {periodLabels[hour]}
                </th>
              ))}
              <th className="py-1 px-4 border border-gray-800 text-center text-sm font-bold text-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {lineNos.map((lineNo) => (
              <>
                {/* Line No Row */}
                <tr
                  className={`hover:bg-gray-400 ${
                    expandedLines[lineNo] ? "bg-black text-white" : ""
                  }`}
                >
                  <td
                    className={`py-2 px-4 border border-gray-800 text-sm font-bold ${
                      expandedLines[lineNo] ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {lineNo}
                    <button
                      onClick={() => toggleLine(lineNo)}
                      className="ml-2 text-blue-500 hover:text-blue-300 focus:outline-none"
                    >
                      {expandedLines[lineNo] ? "−" : "+"}
                    </button>
                  </td>
                  {activeHours.map((hour) => {
                    const totalRate = Object.values(
                      (data || {})[lineNo] || {}
                    ).reduce(
                      (sum, moData) =>
                        sum +
                        (moData[hour]?.rate || 0) *
                          (moData[hour]?.checkedQty || 0),
                      0
                    );
                    const totalCheckedQty = Object.values(
                      (data || {})[lineNo] || {}
                    ).reduce(
                      (sum, moData) => sum + (moData[hour]?.checkedQty || 0),
                      0
                    );
                    const rate =
                      totalCheckedQty > 0 ? totalRate / totalCheckedQty : 0;
                    const hasCheckedQty = totalCheckedQty > 0;
                    return (
                      <td
                        key={hour}
                        className={`py-2 px-4 border border-gray-800 text-center text-sm font-medium ${
                          expandedLines[lineNo]
                            ? "bg-black text-white"
                            : hasCheckedQty
                            ? `${getBackgroundColor(rate)} ${getFontColor(
                                rate
                              )}`
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {hasCheckedQty ? `${rate.toFixed(2)}%` : ""}
                      </td>
                    );
                  })}
                  <td
                    className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${
                      expandedLines[lineNo]
                        ? "bg-black text-white"
                        : `${getBackgroundColor(
                            (data || {})[lineNo]?.totalRate || 0
                          )} ${getFontColor(
                            (data || {})[lineNo]?.totalRate || 0
                          )}`
                    }`}
                  >
                    {((data || {})[lineNo]?.totalRate || 0).toFixed(2)}%
                  </td>
                </tr>

                {/* MO No Rows (Expanded) */}
                {expandedLines[lineNo] &&
                  Object.keys((data || {})[lineNo] || {})
                    .filter((key) => key !== "totalRate")
                    .sort()
                    .map((moNo) => (
                      <>
                        <tr
                          className={`hover:bg-gray-400 ${
                            expandedMos[`${lineNo}-${moNo}`]
                              ? "bg-gray-800 text-white"
                              : ""
                          }`}
                        >
                          <td
                            className={`py-2 px-4 pl-8 border border-gray-800 text-sm font-bold ${
                              expandedMos[`${lineNo}-${moNo}`]
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {moNo}
                            <button
                              onClick={() => toggleMo(lineNo, moNo)}
                              className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                            >
                              {expandedMos[`${lineNo}-${moNo}`] ? "−" : "+"}
                            </button>
                            {isCritical(lineNo, moNo) && (
                              <span className="inline-block ml-2 px-2 py-1 bg-red-100 border border-red-800 text-red-800 text-xs font-bold rounded">
                                Critical
                              </span>
                            )}
                            {!isCritical(lineNo, moNo) &&
                              isWarning(lineNo, moNo) && (
                                <span className="inline-block ml-2 px-2 py-1 bg-yellow-100 border border-yellow-800 text-yellow-800 text-xs font-bold rounded">
                                  Warning
                                </span>
                              )}
                          </td>
                          {activeHours.map((hour) => {
                            const { rate = 0, hasCheckedQty = false } =
                              ((data || {})[lineNo] || {})[moNo]?.[hour] || {};
                            return (
                              <td
                                key={hour}
                                className={`py-2 px-4 border border-gray-800 text-center text-sm font-medium ${
                                  expandedMos[`${lineNo}-${moNo}`]
                                    ? "bg-gray-800 text-white"
                                    : hasCheckedQty
                                    ? `${getBackgroundColor(
                                        rate
                                      )} ${getFontColor(rate)}`
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {hasCheckedQty ? `${rate.toFixed(2)}%` : ""}
                              </td>
                            );
                          })}
                          <td
                            className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${
                              expandedMos[`${lineNo}-${moNo}`]
                                ? "bg-gray-800 text-white"
                                : `${getBackgroundColor(
                                    (data || {})[lineNo]?.[moNo]?.totalRate || 0
                                  )} ${getFontColor(
                                    (data || {})[lineNo]?.[moNo]?.totalRate || 0
                                  )}`
                            }`}
                          >
                            {(
                              (data || {})[lineNo]?.[moNo]?.totalRate || 0
                            ).toFixed(2)}
                            %
                          </td>
                        </tr>

                        {/* Defect Rows (Expanded) */}
                        {expandedMos[`${lineNo}-${moNo}`] &&
                          (
                            (defectTrendsByLineMo[lineNo] || {})[moNo] || []
                          ).map((defect) => (
                            <tr
                              key={`${lineNo}-${moNo}-${defect.defectName}`}
                              className="bg-gray-50"
                            >
                              <td className="py-2 px-4 pl-12 border border-gray-800 text-sm text-gray-700">
                                {defect.defectName}
                              </td>
                              {activeHours.map((hour) => {
                                const { rate = 0 } = defect.trends[hour] || {};
                                const hasData = rate > 0;
                                return (
                                  <td
                                    key={hour}
                                    className={`py-2 px-4 border border-gray-800 text-center text-sm ${
                                      hasData
                                        ? getBackgroundColor(rate)
                                        : "bg-gray-100"
                                    } ${
                                      hasData
                                        ? getFontColor(rate)
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {hasData ? `${rate.toFixed(2)}%` : ""}
                                  </td>
                                );
                              })}
                              <td
                                className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${getBackgroundColor(
                                  defect.totalDefectRate || 0
                                )} ${getFontColor(
                                  defect.totalDefectRate || 0
                                )}`}
                              >
                                {(defect.totalDefectRate || 0).toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                      </>
                    ))}
              </>
            ))}

            {/* Final Total Row */}
            <tr className="bg-blue-100 font-bold">
              <td className="py-2 px-4 border border-gray-800 text-sm font-bold text-gray-700">
                Total
              </td>
              {activeHours.map((hour) => {
                const { rate = 0, hasCheckedQty = false } =
                  (data || {}).total?.[hour] || {};
                return (
                  <td
                    key={hour}
                    className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${
                      hasCheckedQty ? getBackgroundColor(rate) : "bg-white"
                    } ${hasCheckedQty ? getFontColor(rate) : "text-gray-700"}`}
                  >
                    {hasCheckedQty ? `${rate.toFixed(2)}%` : ""}
                  </td>
                );
              })}
              <td
                className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${getBackgroundColor(
                  (data || {}).grand?.rate || 0
                )} ${getFontColor((data || {}).grand?.rate || 0)}`}
              >
                {((data || {}).grand?.rate || 0).toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ErrorBoundary>
  );
};

export default TrendAnalysisLine;
