import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, File } from "lucide-react";

const TrendAnalysisMO = ({ data, appliedFilters = {} }) => {
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

  // Sort MO Nos consistently
  const moNos = Object.keys(data)
    .filter((key) => key !== "total" && key !== "grand")
    .sort();

  // Filter hours with at least one non-zero value for any MO No
  const activeHours = Object.keys(hourLabels).filter((hour) => {
    return (
      moNos.some((moNo) => data[moNo][hour]?.rate > 0) ||
      (data.total && data.total[hour]?.rate > 0)
    );
  });

  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState({});

  // Toggle expansion for a specific MO No
  const toggleRow = (moNo) => {
    setExpandedRows((prev) => ({
      ...prev,
      [moNo]: !prev[moNo]
    }));
  };

  // Function to determine background color based on defect rate
  const getBackgroundColor = (rate) => {
    if (rate > 3) return "bg-red-100";
    if (rate >= 2) return "bg-yellow-100";
    return "bg-green-100";
  };

  // Function to determine font color based on defect rate
  const getFontColor = (rate) => {
    if (rate > 3) return "text-red-800";
    if (rate >= 2) return "text-orange-800";
    return "text-green-800";
  };

  // Function to check for 3 consecutive periods with defect rate > 3% (Critical)
  const isCritical = (moNo) => {
    const rates = activeHours.map((hour) => {
      const { rate, hasCheckedQty } = data[moNo][hour] || {
        rate: 0,
        hasCheckedQty: false
      };
      return hasCheckedQty ? rate : 0;
    });

    for (let i = 0; i <= rates.length - 3; i++) {
      if (rates[i] > 3 && rates[i + 1] > 3 && rates[i + 2] > 3) return true;
    }
    return false;
  };

  // Function to check for 2 consecutive periods with defect rate > 3% (Warning)
  const isWarning = (moNo) => {
    const rates = activeHours.map((hour) => {
      const { rate, hasCheckedQty } = data[moNo][hour] || {
        rate: 0,
        hasCheckedQty: false
      };
      return hasCheckedQty ? rate : 0;
    });

    for (let i = 0; i <= rates.length - 2; i++) {
      if (rates[i] > 3 && rates[i + 1] > 3) return true;
    }
    return false;
  };

  // Memoized defect trends to prevent recalculation unless data changes
  const defectTrendsByMoNo = useMemo(() => {
    const trends = {};
    moNos.forEach((moNo) => {
      const defectsByName = {};
      const totalCheckedQty = activeHours.reduce(
        (sum, hour) => sum + (data[moNo][hour]?.checkedQty || 0),
        0
      );

      activeHours.forEach((hour) => {
        const hourData = data[moNo][hour] || { checkedQty: 0, defects: [] };
        hourData.defects
          .filter((defect) => defect.name && defect.name !== "No Defect") // Filter out "No Defect"
          .forEach((defect) => {
            if (!defectsByName[defect.name]) {
              defectsByName[defect.name] = { totalCount: 0, trends: {} };
            }
            defectsByName[defect.name].trends[hour] = {
              count: defect.count,
              rate: defect.rate
            };
            defectsByName[defect.name].totalCount += defect.count;
          });
      });

      trends[moNo] = Object.entries(defectsByName)
        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
        .map(([name, { totalCount, trends }]) => ({
          name,
          totalRate:
            totalCheckedQty > 0 ? (totalCount / totalCheckedQty) * 100 : 0,
          trends
        }));
    });
    return trends;
  }, [data, moNos, activeHours]);

  // Prepare data for Excel and PDF export with all levels expanded
  const prepareExportData = () => {
    const exportData = [];

    // Add MO No rows and their defect details
    moNos.forEach((moNo) => {
      const moRow = {
        "MO No": `${moNo}${
          isCritical(moNo) ? " (Critical)" : isWarning(moNo) ? " (Warning)" : ""
        }`
      };
      activeHours.forEach((hour) => {
        const { rate, hasCheckedQty } = data[moNo][hour] || {
          rate: 0,
          hasCheckedQty: false
        };
        moRow[`${hourLabels[hour]} ${periodLabels[hour]}`] = hasCheckedQty
          ? `${rate.toFixed(2)}%`
          : "";
      });
      moRow["Total"] = `${data[moNo].totalRate.toFixed(2)}%`;
      exportData.push(moRow);

      // Add defect details for this MO No
      defectTrendsByMoNo[moNo].forEach((defect) => {
        const defectRow = { "MO No": `  ${defect.name}` }; // Indented to indicate sub-row
        activeHours.forEach((hour) => {
          const { rate = 0 } = defect.trends[hour] || {};
          defectRow[`${hourLabels[hour]} ${periodLabels[hour]}`] =
            rate > 0 ? `${rate.toFixed(2)}%` : "";
        });
        defectRow["Total"] = `${defect.totalRate.toFixed(2)}%`;
        exportData.push(defectRow);
      });
    });

    // Add Total row
    const totalRow = { "MO No": "Total" };
    activeHours.forEach((hour) => {
      const { rate, hasCheckedQty } = data.total[hour] || {
        rate: 0,
        hasCheckedQty: false
      };
      totalRow[`${hourLabels[hour]} ${periodLabels[hour]}`] = hasCheckedQty
        ? `${rate.toFixed(2)}%`
        : "";
    });
    totalRow["Total"] = `${(data.grand?.rate || 0).toFixed(2)}%`;
    exportData.push(totalRow);

    return exportData;
  };

  // Format applied filters for display
  const formatFilters = () => {
    return Object.entries(appliedFilters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  // Download as Excel
  const downloadExcel = () => {
    const exportData = prepareExportData();
    const ws = XLSX.utils.json_to_sheet([
      {
        "QC2 Defect Rate by MO No - Hour Trend":
          "Applied Filters: " + formatFilters()
      },
      {}, // Empty row for spacing
      ...XLSX.utils.sheet_add_json([], exportData, {
        skipHeader: true,
        origin: -1
      })
    ]);

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // MO No
      ...activeHours.map(() => ({ wch: 10 })), // Hour columns
      { wch: 10 } // Total
    ];

    // Apply Calibri font
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (!ws[cellRef]) continue;
        ws[cellRef].s = { font: { name: "Calibri", sz: 11 } };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TrendAnalysis");
    XLSX.writeFile(wb, "TrendAnalysisMO.xlsx");
  };

  // Download as PDF
  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("helvetica");
    doc.setFontSize(12);
    doc.text("QC2 Defect Rate by MO No - Hour Trend", 14, 10);
    doc.setFontSize(10);
    doc.text(`Applied Filters: ${formatFilters()}`, 14, 20);

    const headers = [
      "MO No",
      ...activeHours.map((hour) => `${hourLabels[hour]} ${periodLabels[hour]}`),
      "Total"
    ];
    const body = prepareExportData().map((row) => Object.values(row));

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2, font: "helvetica" },
      columnStyles: {
        0: { cellWidth: 40 }, // MO No
        [activeHours.length + 1]: { cellWidth: 15 } // Total
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index > 0) {
          const text = data.cell.text[0];
          const rate = text ? parseFloat(text.replace("%", "")) : 0;
          if (rate > 0) {
            data.cell.styles.fillColor =
              rate > 3
                ? [255, 204, 204]
                : rate >= 2
                ? [255, 255, 204]
                : [204, 255, 204];
          }
        }
      }
    });

    doc.save("TrendAnalysisMO.pdf");
  };

  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-gray-900">
          QC2 Defect Rate by MO No - Hour Trend
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={downloadExcel}
            title="Download as Excel"
            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
          >
            <Download size={18} />
          </button>
          <button
            onClick={downloadPDF}
            title="Download as PDF"
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
          >
            <File size={18} />
          </button>
        </div>
      </div>
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-blue-100">
            <th className="py-2 px-4 border border-gray-800 text-left text-sm font-bold text-gray-700">
              MO No
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
          {moNos.map((moNo) => (
            <React.Fragment key={moNo}>
              <tr className="hover:bg-gray-50">
                <td className="py-2 px-4 border border-gray-800 text-sm font-bold text-gray-700">
                  {moNo}
                  <button
                    onClick={() => toggleRow(moNo)}
                    className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                  >
                    {expandedRows[moNo] ? "−" : "+"}
                  </button>
                  {isCritical(moNo) && (
                    <span className="inline-block ml-2 px-2 py-1 bg-red-100 border border-red-800 text-red-800 text-xs font-bold rounded">
                      Critical
                    </span>
                  )}
                  {!isCritical(moNo) && isWarning(moNo) && (
                    <span className="inline-block ml-2 px-2 py-1 bg-yellow-100 border border-yellow-800 text-yellow-800 text-xs font-bold rounded">
                      Warning
                    </span>
                  )}
                </td>
                {activeHours.map((hour) => {
                  const { rate, hasCheckedQty } = data[moNo][hour] || {
                    rate: 0,
                    hasCheckedQty: false
                  };
                  return (
                    <td
                      key={hour}
                      className={`py-2 px-4 border border-gray-800 text-center text-sm font-medium ${
                        hasCheckedQty ? getBackgroundColor(rate) : "bg-gray-100"
                      } ${
                        hasCheckedQty ? getFontColor(rate) : "text-gray-700"
                      }`}
                    >
                      {hasCheckedQty ? `${rate.toFixed(2)}%` : ""}
                    </td>
                  );
                })}
                <td
                  className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${getBackgroundColor(
                    data[moNo].totalRate
                  )} ${getFontColor(data[moNo].totalRate)}`}
                >
                  {data[moNo].totalRate.toFixed(2)}%
                </td>
              </tr>
              {expandedRows[moNo] && (
                <>
                  {defectTrendsByMoNo[moNo].map((defect) => (
                    <tr key={`${moNo}-${defect.name}`} className="bg-gray-50">
                      <td className="py-2 px-4 pl-8 border border-gray-800 text-sm text-gray-700">
                        {defect.name}
                      </td>
                      {activeHours.map((hour) => {
                        const { rate = 0 } = defect.trends[hour] || {};
                        const hasData = rate > 0;
                        return (
                          <td
                            key={hour}
                            className={`py-2 px-4 border border-gray-800 text-center text-sm ${
                              hasData ? getBackgroundColor(rate) : "bg-gray-100"
                            } ${
                              hasData ? getFontColor(rate) : "text-gray-700"
                            }`}
                          >
                            {hasData ? `${rate.toFixed(2)}%` : ""}
                          </td>
                        );
                      })}
                      <td
                        className={`py-2 px-4 border border-gray-800 text-center text-sm font-bold ${getBackgroundColor(
                          defect.totalRate
                        )} ${getFontColor(defect.totalRate)}`}
                      >
                        {defect.totalRate.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </React.Fragment>
          ))}
          <tr className="bg-blue-100 font-bold">
            <td className="py-2 px-4 border border-gray-800 text-sm font-bold text-gray-700">
              Total
            </td>
            {activeHours.map((hour) => {
              const { rate, hasCheckedQty } = data.total[hour] || {
                rate: 0,
                hasCheckedQty: false
              };
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
                data.grand?.rate || 0
              )} ${getFontColor(data.grand?.rate || 0)}`}
            >
              {(data.grand?.rate || 0).toFixed(2)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TrendAnalysisMO;
