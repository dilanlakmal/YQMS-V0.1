// import React, { useState, useEffect } from "react";
// import * as XLSX from "xlsx"; // For Excel export
// import jsPDF from "jspdf"; // For PDF export
// import autoTable from "jspdf-autotable"; // Explicitly import autoTable
// import { notoSansFont } from "../fonts/notoSans";

// const SunriseAnalyze = ({ rs18Data, outputData }) => {
//   const [filters, setFilters] = useState({
//     startDate: "",
//     endDate: "",
//     workLine: "",
//     moNo: "",
//     colorNo: "",
//     sizeName: ""
//   });
//   const [currentPage, setCurrentPage] = useState(1);
//   const rowsPerPage = 10;

//   // Helper function to parse MM-DD-YYYY date into a Date object
//   const parseDate = (dateStr) => {
//     if (!dateStr) return null;
//     const [month, day, year] = dateStr.split("-").map(Number); // Expects MM-DD-YYYY
//     return new Date(year, month - 1, day); // Month is 0-based in JS Date
//   };

//   // Convert YYYY-MM-DD (input) to MM-DD-YYYY (internal) and vice versa
//   const formatToInternalDate = (dateStr) => {
//     if (!dateStr) return "";
//     const [year, month, day] = dateStr.split("-");
//     return `${month}-${day}-${year}`; // YYYY-MM-DD to MM-DD-YYYY
//   };

//   const formatToInputDate = (dateStr) => {
//     if (!dateStr) return "";
//     const [month, day, year] = dateStr.split("-");
//     return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`; // MM-DD-YYYY to YYYY-MM-DD
//   };

//   // Get unique filter options based on date range
//   const getUniqueValuesInDateRange = (key) => {
//     if (!outputData) return [];
//     const startDate = filters.startDate ? parseDate(filters.startDate) : null;
//     const endDate = filters.endDate ? parseDate(filters.endDate) : null;

//     const filtered = outputData.filter((row) => {
//       const rowDate = parseDate(row.InspectionDate);
//       return (
//         (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate)
//       );
//     });

//     return [...new Set(filtered.map((row) => row[key]))].sort();
//   };

//   const uniqueWorkLines = getUniqueValuesInDateRange("WorkLine");
//   const uniqueMoNos = getUniqueValuesInDateRange("MONo");
//   const uniqueColorNos = getUniqueValuesInDateRange("ColorNo");
//   const uniqueSizeNames = getUniqueValuesInDateRange("SizeName");

//   // Merge data and apply filters
//   const getMergedData = () => {
//     if (!rs18Data || !outputData) return [];

//     const commonKeys = [
//       "InspectionDate",
//       "WorkLine",
//       "MONo",
//       "SizeName",
//       "ColorNo",
//       "ColorName"
//     ];
//     const mergedData = [];

//     const outputMap = new Map();
//     outputData.forEach((row) => {
//       const key = commonKeys.map((k) => row[k]).join("|");
//       outputMap.set(key, {
//         TotalQtyT38: row.TotalQtyT38,
//         TotalQtyT39: row.TotalQtyT39
//       });
//     });

//     const defectMap = new Map();
//     rs18Data.forEach((row) => {
//       const key = commonKeys.map((k) => row[k]).join("|");
//       if (!defectMap.has(key)) defectMap.set(key, []);
//       defectMap
//         .get(key)
//         .push({ ReworkName: row.ReworkName, DefectsQty: row.DefectsQty });
//     });

//     const allKeys = new Set([...outputMap.keys(), ...defectMap.keys()]);
//     allKeys.forEach((key) => {
//       const [InspectionDate, WorkLine, MONo, SizeName, ColorNo, ColorName] =
//         key.split("|");
//       const output = outputMap.get(key) || { TotalQtyT38: 0, TotalQtyT39: 0 };
//       const defects = defectMap.get(key) || [];

//       const checkedQty = Math.max(output.TotalQtyT38, output.TotalQtyT39);
//       const defectsQty = defects.reduce(
//         (sum, defect) => sum + defect.DefectsQty,
//         0
//       );
//       const defectRate = checkedQty === 0 ? 0 : (defectsQty / checkedQty) * 100;

//       const defectsWithRate = defects.map((defect) => ({
//         ...defect,
//         DefectRate:
//           checkedQty === 0 ? 0 : (defect.DefectsQty / checkedQty) * 100
//       }));

//       mergedData.push({
//         InspectionDate,
//         WorkLine,
//         MONo,
//         SizeName,
//         ColorNo,
//         ColorName,
//         TotalQtyT38: output.TotalQtyT38,
//         TotalQtyT39: output.TotalQtyT39,
//         CheckedQty: checkedQty,
//         DefectsQty: defectsQty,
//         DefectRate: defectRate,
//         DefectDetails: defectsWithRate
//       });
//     });

//     return mergedData.filter((row) => {
//       const rowDate = parseDate(row.InspectionDate);
//       const startDate = filters.startDate ? parseDate(filters.startDate) : null;
//       const endDate = filters.endDate ? parseDate(filters.endDate) : null;

//       return (
//         (!startDate || rowDate >= startDate) &&
//         (!endDate || rowDate <= endDate) &&
//         (!filters.workLine || row.WorkLine === filters.workLine) &&
//         (!filters.moNo || row.MONo === filters.moNo) &&
//         (!filters.colorNo || row.ColorNo === filters.colorNo) &&
//         (!filters.sizeName || row.SizeName === filters.sizeName)
//       );
//     });
//   };

//   const filteredData = getMergedData();
//   const paginatedData = filteredData.slice(
//     (currentPage - 1) * rowsPerPage,
//     currentPage * rowsPerPage
//   );
//   const totalPages = Math.ceil(filteredData.length / rowsPerPage);

//   // Calculate totals for numeric columns
//   const totals = {
//     TotalQtyT38: filteredData.reduce((sum, row) => sum + row.TotalQtyT38, 0),
//     TotalQtyT39: filteredData.reduce((sum, row) => sum + row.TotalQtyT39, 0),
//     CheckedQty: filteredData.reduce((sum, row) => sum + row.CheckedQty, 0),
//     DefectsQty: filteredData.reduce((sum, row) => sum + row.DefectsQty, 0),
//     DefectRate:
//       filteredData.reduce((sum, row) => sum + row.CheckedQty, 0) === 0
//         ? 0
//         : (
//             (filteredData.reduce((sum, row) => sum + row.DefectsQty, 0) /
//               filteredData.reduce((sum, row) => sum + row.CheckedQty, 0)) *
//             100
//           ).toFixed(2)
//   };

//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({
//       ...prev,
//       [name]:
//         name === "startDate" || name === "endDate"
//           ? formatToInternalDate(value)
//           : value
//     }));
//     setCurrentPage(1);
//   };

//   const clearFilters = () => {
//     setFilters({
//       startDate: "",
//       endDate: "",
//       workLine: "",
//       moNo: "",
//       colorNo: "",
//       sizeName: ""
//     });
//     setCurrentPage(1);
//   };

//   // Get DefectRate background and font colors
//   const getDefectRateStyles = (rate) => {
//     if (rate > 5) {
//       return { background: "#ffcccc", color: "#cc0000" }; // Light red bg, dark red font
//     } else if (rate >= 3 && rate <= 5) {
//       return { background: "#ffebcc", color: "#e68a00" }; // Light orange bg, dark orange font
//     } else {
//       return { background: "#ccffcc", color: "#006600" }; // Light green bg, dark green font
//     }
//   };

//   // Prepare data for export
//   const prepareExportData = () => {
//     const exportData = [];
//     const seenCombinations = new Map();

//     filteredData.forEach((row) => {
//       const combinationKey = [
//         row.InspectionDate,
//         row.WorkLine,
//         row.MONo,
//         row.SizeName,
//         row.ColorNo,
//         row.ColorName
//       ].join("|");

//       const isFirstRowForCombination = !seenCombinations.has(combinationKey);
//       seenCombinations.set(combinationKey, true);

//       if (row.DefectDetails.length === 0) {
//         exportData.push({
//           InspectionDate: isFirstRowForCombination ? row.InspectionDate : "",
//           WorkLine: isFirstRowForCombination ? row.WorkLine : "",
//           MONo: isFirstRowForCombination ? row.MONo : "",
//           SizeName: isFirstRowForCombination ? row.SizeName : "",
//           ColorNo: isFirstRowForCombination ? row.ColorNo : "",
//           ColorName: isFirstRowForCombination ? row.ColorName : "",
//           TotalQtyT38: isFirstRowForCombination ? row.TotalQtyT38 : "",
//           TotalQtyT39: isFirstRowForCombination ? row.TotalQtyT39 : "",
//           CheckedQty: isFirstRowForCombination ? row.CheckedQty : "",
//           DefectsQty: isFirstRowForCombination ? row.DefectsQty : "",
//           DefectRate: isFirstRowForCombination
//             ? `${row.DefectRate.toFixed(2)}%`
//             : "",
//           ReworkName: "No defects",
//           ReworkDefectsQty: 0,
//           ReworkDefectRate: "0.00%"
//         });
//       } else {
//         row.DefectDetails.forEach((defect, index) => {
//           exportData.push({
//             InspectionDate:
//               isFirstRowForCombination && index === 0 ? row.InspectionDate : "",
//             WorkLine:
//               isFirstRowForCombination && index === 0 ? row.WorkLine : "",
//             MONo: isFirstRowForCombination && index === 0 ? row.MONo : "",
//             SizeName:
//               isFirstRowForCombination && index === 0 ? row.SizeName : "",
//             ColorNo: isFirstRowForCombination && index === 0 ? row.ColorNo : "",
//             ColorName:
//               isFirstRowForCombination && index === 0 ? row.ColorName : "",
//             TotalQtyT38:
//               isFirstRowForCombination && index === 0 ? row.TotalQtyT38 : "",
//             TotalQtyT39:
//               isFirstRowForCombination && index === 0 ? row.TotalQtyT39 : "",
//             CheckedQty:
//               isFirstRowForCombination && index === 0 ? row.CheckedQty : "",
//             DefectsQty:
//               isFirstRowForCombination && index === 0 ? row.DefectsQty : "",
//             DefectRate:
//               isFirstRowForCombination && index === 0
//                 ? `${row.DefectRate.toFixed(2)}%`
//                 : "",
//             ReworkName: defect.ReworkName,
//             ReworkDefectsQty: defect.DefectsQty,
//             ReworkDefectRate: `${defect.DefectRate.toFixed(2)}%`
//           });
//         });
//       }
//     });

//     exportData.push({
//       InspectionDate: "Total",
//       WorkLine: "-",
//       MONo: "-",
//       SizeName: "-",
//       ColorNo: "-",
//       ColorName: "-",
//       TotalQtyT38: totals.TotalQtyT38,
//       TotalQtyT39: totals.TotalQtyT39,
//       CheckedQty: totals.CheckedQty,
//       DefectsQty: totals.DefectsQty,
//       DefectRate: `${totals.DefectRate}%`,
//       ReworkName: "-",
//       ReworkDefectsQty: "-",
//       ReworkDefectRate: "-"
//     });

//     return exportData;
//   };

//   // Download as Excel
//   const downloadExcel = () => {
//     const exportData = prepareExportData();
//     const worksheet = XLSX.utils.json_to_sheet(exportData);

//     const range = XLSX.utils.decode_range(worksheet["!ref"]);
//     for (let R = range.s.r; R <= range.e.r; ++R) {
//       for (let C = range.s.c; C <= range.e.c; ++C) {
//         const cellAddress = { c: C, r: R };
//         const cellRef = XLSX.utils.encode_cell(cellAddress);
//         if (!worksheet[cellRef]) continue;
//         worksheet[cellRef].s = {
//           font: { name: "Calibri", sz: 12 }
//         };
//       }
//     }

//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "SunriseAnalyze");
//     XLSX.writeFile(workbook, "SunriseAnalyze.xlsx");
//   };

//   // Download as PDF with Noto Sans for Khmer/Chinese support
//   const downloadPDF = () => {
//     try {
//       const exportData = prepareExportData();
//       const doc = new jsPDF({ orientation: "landscape" });

//       // Add Noto Sans font
//       try {
//         doc.addFileToVFS("NotoSans.ttf", notoSansFont);
//         doc.addFont("NotoSans.ttf", "NotoSans", "normal");
//         doc.setFont("NotoSans", "normal"); // Explicitly set to normal to avoid bold attempts
//       } catch (fontError) {
//         console.error("Failed to load NotoSans font:", fontError);
//         console.warn("Falling back to Helvetica");
//         doc.setFont("Helvetica"); // Fallback to default font if NotoSans fails
//       }

//       doc.text("Sunrise Analyze Report", 14, 10);

//       autoTable(doc, {
//         head: [
//           [
//             "InspectionDate",
//             "WorkLine",
//             "MONo",
//             "SizeName",
//             "ColorNo",
//             "ColorName",
//             "TotalQtyT38",
//             "TotalQtyT39",
//             "CheckedQty",
//             "DefectsQty",
//             "DefectRate",
//             "ReworkName",
//             "ReworkDefectsQty",
//             "ReworkDefectRate"
//           ]
//         ],
//         body: exportData.map((row) => Object.values(row)),
//         startY: 20,
//         styles: {
//           fontSize: 6,
//           cellPadding: 1,
//           font: "NotoSans", // Try NotoSans first
//           fontStyle: "normal" // Explicitly enforce normal style
//         }, // Use NotoSans for Khmer/Chinese
//         headStyles: { fillColor: [0, 128, 0], fontStyle: "normal" },
//         alternateRowStyles: { fillColor: [240, 240, 240] },
//         columnStyles: {
//           0: { cellWidth: 20 }, // InspectionDate
//           1: { cellWidth: 15 }, // WorkLine
//           2: { cellWidth: 20 }, // MONo
//           3: { cellWidth: 15 }, // SizeName
//           4: { cellWidth: 15 }, // ColorNo
//           5: { cellWidth: 20 }, // ColorName
//           6: { cellWidth: 15 }, // TotalQtyT38
//           7: { cellWidth: 15 }, // TotalQtyT39
//           8: { cellWidth: 15 }, // CheckedQty
//           9: { cellWidth: 15 }, // DefectsQty
//           10: { cellWidth: 15 }, // DefectRate
//           11: { cellWidth: 40 }, // ReworkName (increased width)
//           12: { cellWidth: 20 }, // ReworkDefectsQty
//           13: { cellWidth: 20 } // ReworkDefectRate
//         },
//         didParseCell: (data) => {
//           if (data.column.index === 10 && data.cell.text[0]) {
//             // DefectRate column
//             const rateText = data.cell.text[0].replace("%", "").trim();
//             const rate = rateText ? parseFloat(rateText) : 0;
//             if (!isNaN(rate)) {
//               const styles = getDefectRateStyles(rate);
//               data.cell.styles.fillColor = [
//                 parseInt(styles.background.slice(1, 3), 16),
//                 parseInt(styles.background.slice(3, 5), 16),
//                 parseInt(styles.background.slice(5, 7), 16)
//               ];
//               data.cell.styles.textColor = [
//                 parseInt(styles.color.slice(1, 3), 16),
//                 parseInt(styles.color.slice(3, 5), 16),
//                 parseInt(styles.color.slice(5, 7), 16)
//               ];
//             }
//           }
//         },
//         didDrawPage: () => {
//           // Ensure font consistency across pages
//           doc.setFont("NotoSans", "normal");
//         }
//       });

//       doc.save("SunriseAnalyze.pdf");
//     } catch (error) {
//       console.error("Error generating PDF:", error);
//       alert("Failed to generate PDF. Check the console for details.");
//     }
//   };

//   return (
//     <div className="mt-4">
//       {/* Filter Pane */}
//       <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-100 rounded-lg">
//         <div>
//           <label className="block text-sm font-medium">
//             Start Date (MM-DD-YYYY):
//           </label>
//           <input
//             type="date"
//             name="startDate"
//             value={formatToInputDate(filters.startDate)} // Display YYYY-MM-DD
//             onChange={handleFilterChange}
//             className="mt-1 p-2 border rounded-md w-full"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium">
//             End Date (MM-DD-YYYY):
//           </label>
//           <input
//             type="date"
//             name="endDate"
//             value={formatToInputDate(filters.endDate)} // Display YYYY-MM-DD
//             onChange={handleFilterChange}
//             className="mt-1 p-2 border rounded-md w-full"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium">Line No:</label>
//           <select
//             name="workLine"
//             value={filters.workLine}
//             onChange={handleFilterChange}
//             className="mt-1 p-2 border rounded-md w-full"
//           >
//             <option value="">All</option>
//             {uniqueWorkLines.map((line) => (
//               <option key={line} value={line}>
//                 {line}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium">MO No:</label>
//           <select
//             name="moNo"
//             value={filters.moNo}
//             onChange={handleFilterChange}
//             className="mt-1 p-2 border rounded-md w-full"
//           >
//             <option value="">All</option>
//             {uniqueMoNos.map((mo) => (
//               <option key={mo} value={mo}>
//                 {mo}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium">Color:</label>
//           <select
//             name="colorNo"
//             value={filters.colorNo}
//             onChange={handleFilterChange}
//             className="mt-1 p-2 border rounded-md w-full"
//           >
//             <option value="">All</option>
//             {uniqueColorNos.map((color) => (
//               <option key={color} value={color}>
//                 {color}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium">Size:</label>
//           <select
//             name="sizeName"
//             value={filters.sizeName}
//             onChange={handleFilterChange}
//             className="mt-1 p-2 border rounded-md w-full"
//           >
//             <option value="">All</option>
//             {uniqueSizeNames.map((size) => (
//               <option key={size} value={size}>
//                 {size}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="flex items-end">
//           <button
//             onClick={clearFilters}
//             className="px-4 py-2 bg-red-500 text-white rounded-md w-full"
//           >
//             Clear Filters
//           </button>
//         </div>
//       </div>

//       {/* Download Buttons */}
//       <div className="flex justify-end mb-4 space-x-4">
//         <button
//           onClick={downloadExcel}
//           className="px-4 py-2 bg-blue-500 text-white rounded-md"
//         >
//           Download Excel
//         </button>
//         <button
//           onClick={downloadPDF}
//           className="px-4 py-2 bg-purple-500 text-white rounded-md"
//         >
//           Download PDF
//         </button>
//       </div>

//       {/* Analyze Table */}
//       <div className="overflow-x-auto overflow-y-auto max-h-96">
//         <table className="min-w-full border-collapse border border-gray-200">
//           <thead className="bg-green-100 sticky top-0 z-10">
//             <tr>
//               {[
//                 "InspectionDate",
//                 "WorkLine",
//                 "MONo",
//                 "SizeName",
//                 "ColorNo",
//                 "ColorName",
//                 "TotalQtyT38",
//                 "TotalQtyT39",
//                 "CheckedQty",
//                 "DefectsQty",
//                 "DefectRate",
//                 "Defect Details"
//               ].map((header) => (
//                 <th
//                   key={header}
//                   className="p-2 border border-gray-300 text-sm font-medium text-gray-700"
//                 >
//                   {header}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {paginatedData.map((row, index) => {
//               const defectRateStyles = getDefectRateStyles(row.DefectRate);
//               return (
//                 <tr key={index} className="hover:bg-gray-50">
//                   <td className="p-2 border border-gray-300 text-sm text-center">
//                     {row.InspectionDate}
//                   </td>
//                   <td className="p-2 border border-gray-300 text-sm text-center">
//                     {row.WorkLine}
//                   </td>
//                   <td className="p-2 border border-gray-300 text-sm text-center">
//                     {row.MONo}
//                   </td>
//                   <td className="p-2 border border-gray-300 text-sm text-center">
//                     {row.SizeName}
//                   </td>
//                   <td className="p-2 border border-gray-300 text-sm text-center">
//                     {row.ColorNo}
//                   </td>
//                   <td className="p-2 border border-gray-300 text-sm text-center">
//                     {row.ColorName}
//                   </td>
//                   <td className="p-2 border border-gray-300 text-sm text-center">
//                     {row.TotalQtyT38}
//                   </td>
//                   <td className="p-2 border border-gray-300 text-sm text-center">
//                     {row.TotalQtyT39}
//                   </td>
//                   <td className="p-2 border border-gray-300 text-sm text-center">
//                     {row.CheckedQty}
//                   </td>
//                   <td className="p-2 border border-gray-300 text-sm text-center">
//                     {row.DefectsQty}
//                   </td>
//                   <td
//                     className="p-2 border border-gray-300 text-sm text-center"
//                     style={{
//                       backgroundColor: defectRateStyles.background,
//                       color: defectRateStyles.color
//                     }}
//                   >
//                     {row.DefectRate.toFixed(2)}%
//                   </td>
//                   <td className="p-2 border border-gray-300 text-sm text-left">
//                     {row.DefectDetails.length > 0 ? (
//                       <ul>
//                         {row.DefectDetails.map((defect, i) => (
//                           <li key={i}>
//                             {`${defect.ReworkName}: ${
//                               defect.DefectsQty
//                             } (${defect.DefectRate.toFixed(2)}%)`}
//                           </li>
//                         ))}
//                       </ul>
//                     ) : (
//                       "No defects"
//                     )}
//                   </td>
//                 </tr>
//               );
//             })}
//             <tr className="bg-gray-200 font-bold">
//               <td className="p-2 border border-gray-300 text-sm text-center">
//                 Total
//               </td>
//               <td className="p-2 border border-gray-300 text-sm text-center">
//                 -
//               </td>
//               <td className="p-2 border border-gray-300 text-sm text-center">
//                 -
//               </td>
//               <td className="p-2 border border-gray-300 text-sm text-center">
//                 -
//               </td>
//               <td className="p-2 border border-gray-300 text-sm text-center">
//                 -
//               </td>
//               <td className="p-2 border border-gray-300 text-sm text-center">
//                 -
//               </td>
//               <td className="p-2 border border-gray-300 text-sm text-center">
//                 {totals.TotalQtyT38}
//               </td>
//               <td className="p-2 border border-gray-300 text-sm text-center">
//                 {totals.TotalQtyT39}
//               </td>
//               <td className="p-2 border border-gray-300 text-sm text-center">
//                 {totals.CheckedQty}
//               </td>
//               <td className="p-2 border border-gray-300 text-sm text-center">
//                 {totals.DefectsQty}
//               </td>
//               <td
//                 className="p-2 border border-gray-300 text-sm text-center"
//                 style={getDefectRateStyles(parseFloat(totals.DefectRate))}
//               >
//                 {totals.DefectRate}%
//               </td>
//               <td className="p-2 border border-gray-300 text-sm text-center">
//                 -
//               </td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       <div className="flex justify-between items-center mt-2">
//         <button
//           onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//           disabled={currentPage === 1}
//           className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
//         >
//           Previous
//         </button>
//         <span className="text-sm">
//           Page {currentPage} of {totalPages}
//         </span>
//         <button
//           onClick={() =>
//             setCurrentPage((prev) => Math.min(prev + 1, totalPages))
//           }
//           disabled={currentPage === totalPages}
//           className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// };

// export default SunriseAnalyze;

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx"; // For Excel export
import jsPDF from "jspdf"; // For PDF export
import autoTable from "jspdf-autotable"; // Explicitly import autoTable
import { notoSansFont } from "../fonts/notoSans";
import {
  FaTimes,
  FaBars,
  FaChartBar,
  FaList,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaChartLine
} from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto"; // Required for Chart.js

const SunriseAnalyze = ({ rs18Data, outputData }) => {
  const [isOpen, setIsOpen] = useState(false); // Controls popup visibility
  const [isNavOpen, setIsNavOpen] = useState(false); // Controls navigation panel
  const [selectedMenu, setSelectedMenu] = useState("Daily Summary"); // Tracks selected menu
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Controls filter pane visibility
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    workLine: "",
    moNo: "",
    colorNo: "",
    sizeName: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [topN, setTopN] = useState(5); // Default Top N for defects chart

  // **Helper Functions (Unchanged from Original Code)**

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [month, day, year] = dateStr.split("-").map(Number); // Expects MM-DD-YYYY
    return new Date(year, month - 1, day); // Month is 0-based in JS Date
  };

  const formatToInternalDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${month}-${day}-${year}`; // YYYY-MM-DD to MM-DD-YYYY
  };

  const formatToInputDate = (dateStr) => {
    if (!dateStr) return "";
    const [month, day, year] = dateStr.split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`; // MM-DD-YYYY to YYYY-MM-DD
  };

  const getUniqueValuesInDateRange = (key) => {
    if (!outputData) return [];
    const startDate = filters.startDate ? parseDate(filters.startDate) : null;
    const endDate = filters.endDate ? parseDate(filters.endDate) : null;

    const filtered = outputData.filter((row) => {
      const rowDate = parseDate(row.InspectionDate);
      return (
        (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate)
      );
    });

    return [...new Set(filtered.map((row) => row[key]))].sort();
  };

  const uniqueWorkLines = getUniqueValuesInDateRange("WorkLine");
  const uniqueMoNos = getUniqueValuesInDateRange("MONo");
  const uniqueColorNos = getUniqueValuesInDateRange("ColorNo");
  const uniqueSizeNames = getUniqueValuesInDateRange("SizeName");

  const getMergedData = () => {
    if (!rs18Data || !outputData) return [];

    const commonKeys = [
      "InspectionDate",
      "WorkLine",
      "MONo",
      "SizeName",
      "ColorNo",
      "ColorName"
    ];
    const mergedData = [];

    const outputMap = new Map();
    outputData.forEach((row) => {
      const key = commonKeys.map((k) => row[k]).join("|");
      outputMap.set(key, {
        TotalQtyT38: row.TotalQtyT38,
        TotalQtyT39: row.TotalQtyT39
      });
    });

    const defectMap = new Map();
    rs18Data.forEach((row) => {
      const key = commonKeys.map((k) => row[k]).join("|");
      if (!defectMap.has(key)) defectMap.set(key, []);
      defectMap
        .get(key)
        .push({ ReworkName: row.ReworkName, DefectsQty: row.DefectsQty });
    });

    const allKeys = new Set([...outputMap.keys(), ...defectMap.keys()]);
    allKeys.forEach((key) => {
      const [InspectionDate, WorkLine, MONo, SizeName, ColorNo, ColorName] =
        key.split("|");
      const output = outputMap.get(key) || { TotalQtyT38: 0, TotalQtyT39: 0 };
      const defects = defectMap.get(key) || [];

      const checkedQty = Math.max(output.TotalQtyT38, output.TotalQtyT39);
      const defectsQty = defects.reduce(
        (sum, defect) => sum + defect.DefectsQty,
        0
      );
      const defectRate = checkedQty === 0 ? 0 : (defectsQty / checkedQty) * 100;

      const defectsWithRate = defects.map((defect) => ({
        ...defect,
        DefectRate:
          checkedQty === 0 ? 0 : (defect.DefectsQty / checkedQty) * 100
      }));

      mergedData.push({
        InspectionDate,
        WorkLine,
        MONo,
        SizeName,
        ColorNo,
        ColorName,
        TotalQtyT38: output.TotalQtyT38,
        TotalQtyT39: output.TotalQtyT39,
        CheckedQty: checkedQty,
        DefectsQty: defectsQty,
        DefectRate: defectRate,
        DefectDetails: defectsWithRate
      });
    });

    return mergedData.filter((row) => {
      const rowDate = parseDate(row.InspectionDate);
      const startDate = filters.startDate ? parseDate(filters.startDate) : null;
      const endDate = filters.endDate ? parseDate(filters.endDate) : null;

      return (
        (!startDate || rowDate >= startDate) &&
        (!endDate || rowDate <= endDate) &&
        (!filters.workLine || row.WorkLine === filters.workLine) &&
        (!filters.moNo || row.MONo === filters.moNo) &&
        (!filters.colorNo || row.ColorNo === filters.colorNo) &&
        (!filters.sizeName || row.SizeName === filters.sizeName)
      );
    });
  };

  const filteredData = getMergedData();
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Calculate totals
  const totals = {
    TotalQtyT38: filteredData.reduce((sum, row) => sum + row.TotalQtyT38, 0),
    TotalQtyT39: filteredData.reduce((sum, row) => sum + row.TotalQtyT39, 0),
    CheckedQty: filteredData.reduce((sum, row) => sum + row.CheckedQty, 0),
    DefectsQty: filteredData.reduce((sum, row) => sum + row.DefectsQty, 0),
    DefectRate:
      filteredData.reduce((sum, row) => sum + row.CheckedQty, 0) === 0
        ? 0
        : (
            (filteredData.reduce((sum, row) => sum + row.DefectsQty, 0) /
              filteredData.reduce((sum, row) => sum + row.CheckedQty, 0)) *
            100
          ).toFixed(2)
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]:
        name === "startDate" || name === "endDate"
          ? formatToInternalDate(value)
          : value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      workLine: "",
      moNo: "",
      colorNo: "",
      sizeName: ""
    });
    setCurrentPage(1);
  };

  const getDefectRateStyles = (rate) => {
    if (rate > 5) {
      return { background: "#ffcccc", color: "#cc0000" }; // Light red bg, dark red font
    } else if (rate >= 3 && rate <= 5) {
      return { background: "#ffebcc", color: "#e68a00" }; // Light orange bg, dark orange font
    } else {
      return { background: "#ccffcc", color: "#006600" }; // Light green bg, dark green font
    }
  };

  // **Chart Data Preparation**

  const defectRateByLine = () => {
    const lineData = {};
    filteredData.forEach((row) => {
      if (!lineData[row.WorkLine]) {
        lineData[row.WorkLine] = { checked: 0, defects: 0 };
      }
      lineData[row.WorkLine].checked += row.CheckedQty;
      lineData[row.WorkLine].defects += row.DefectsQty;
    });
    return Object.entries(lineData)
      .map(([line, data]) => ({
        line,
        defectRate: data.checked === 0 ? 0 : (data.defects / data.checked) * 100
      }))
      .sort((a, b) => b.defectRate - a.defectRate);
  };

  const topNDefects = () => {
    const defectCounts = {};
    filteredData.forEach((row) => {
      row.DefectDetails.forEach((defect) => {
        if (!defectCounts[defect.ReworkName]) {
          defectCounts[defect.ReworkName] = 0;
        }
        defectCounts[defect.ReworkName] += defect.DefectsQty;
      });
    });
    return Object.entries(defectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);
  };

  const barChartData = {
    labels: defectRateByLine().map((d) => d.line),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: defectRateByLine().map((d) => d.defectRate),
        backgroundColor: defectRateByLine().map((d) =>
          d.defectRate > 5
            ? "#cc0000"
            : d.defectRate >= 3
            ? "#e68a00"
            : "#006600"
        )
      }
    ]
  };

  const barChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Defect Rate (%)" }
      }
    },
    plugins: {
      legend: { display: false },
      datalabels: {
        // Add data labels on top of bars
        anchor: "end",
        align: "top",
        formatter: (value) => value.toFixed(2) + "%",
        color: "#000"
      },
      annotation: {
        annotations: {
          line1: {
            type: "line",
            yMin: 5,
            yMax: 5,
            borderColor: "#cc0000",
            borderWidth: 2,
            borderDash: [5, 5]
          },
          line2: {
            type: "line",
            yMin: 3,
            yMax: 3,
            borderColor: "#e68a00",
            borderWidth: 2,
            borderDash: [5, 5]
          }
        }
      }
    }
  };

  const topNChartData = {
    labels: topNDefects().map((d) => d[0]),
    datasets: [
      {
        label: "Defects Qty",
        data: topNDefects().map((d) => d[1]),
        backgroundColor: "#4CAF50"
      }
    ]
  };

  const topNChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Defects Qty" }
      }
    },
    plugins: {
      legend: { display: false },
      datalabels: {
        // Add data labels on top of bars
        anchor: "end",
        align: "top",
        formatter: (value) => value,
        color: "#000"
      }
    }
  };

  // **Export Functions (Unchanged from Original Code)**

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

  const downloadExcel = () => {
    const exportData = prepareExportData();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (!worksheet[cellRef]) continue;
        worksheet[cellRef].s = {
          font: { name: "Calibri", sz: 12 }
        };
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SunriseAnalyze");
    XLSX.writeFile(workbook, "SunriseAnalyze.xlsx");
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

  // **Render Component**

  return (
    <>
      {/* Analyze Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-300"
      >
        Analyze
      </button>

      {/* Popup Window */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-full h-full overflow-auto relative">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-2xl text-gray-600 hover:text-red-600 transition duration-300"
            >
              <FaTimes />
            </button>

            {/* Menu Icon */}
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="absolute top-4 left-4 text-2xl text-gray-600 hover:text-blue-600 transition duration-300"
            >
              <FaBars />
            </button>

            {/* Navigation Panel */}
            {isNavOpen && (
              <div className="fixed top-0 left-0 w-64 h-full bg-gray-800 text-white p-4 shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-center">Menu</h2>
                <ul>
                  {[
                    { name: "Daily Summary", icon: <FaCalendarDay /> },
                    { name: "Weekly Summary", icon: <FaCalendarWeek /> },
                    { name: "Monthly Summary", icon: <FaCalendarAlt /> },
                    { name: "Daily Trend", icon: <FaChartLine /> },
                    { name: "Weekly Trend", icon: <FaChartLine /> },
                    { name: "Monthly Trend", icon: <FaChartLine /> }
                  ].map((item) => (
                    <li
                      key={item.name}
                      className={`cursor-pointer p-2 flex items-center rounded-md hover:bg-gray-600 transition duration-300 ${
                        selectedMenu === item.name ? "bg-gray-600" : ""
                      }`}
                      onClick={() => {
                        setSelectedMenu(item.name);
                        setIsNavOpen(false); // Close nav after selection
                      }}
                    >
                      <span className="text-lg mr-2">{item.icon}</span>
                      <span>{item.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main Dashboard Content */}
            <div className={`p-6 ${isNavOpen ? "ml-64" : ""}`}>
              {/* Dashboard Title */}
              <h1 className="text-4xl font-extrabold text-center mb-2 text-blue-700">
                QC1 Dashboard
              </h1>
              <h2 className="text-xl text-center mb-6 text-gray-600 italic">
                {selectedMenu}
              </h2>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
              >
                {isFilterOpen ? "Hide Filters" : "Show Filters"}
              </button>

              {/* Filter Pane */}
              {isFilterOpen && (
                <div className="mb-6 grid grid-cols-6 gap-4 p-4 bg-gray-100 rounded-lg shadow-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date:
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formatToInputDate(filters.startDate)}
                      onChange={handleFilterChange}
                      className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Date:
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formatToInputDate(filters.endDate)}
                      onChange={handleFilterChange}
                      className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Line No:
                    </label>
                    <select
                      name="workLine"
                      value={filters.workLine}
                      onChange={handleFilterChange}
                      className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      {uniqueWorkLines.map((line) => (
                        <option key={line} value={line}>
                          {line}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      MO No:
                    </label>
                    <select
                      name="moNo"
                      value={filters.moNo}
                      onChange={handleFilterChange}
                      className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      {uniqueMoNos.map((mo) => (
                        <option key={mo} value={mo}>
                          {mo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Color:
                    </label>
                    <select
                      name="colorNo"
                      value={filters.colorNo}
                      onChange={handleFilterChange}
                      className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      {uniqueColorNos.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Size:
                    </label>
                    <select
                      name="sizeName"
                      value={filters.sizeName}
                      onChange={handleFilterChange}
                      className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      {uniqueSizeNames.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-6 flex justify-center">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Cards */}
              {selectedMenu === "Daily Summary" && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-lg flex items-center transform hover:scale-105 transition duration-300">
                    <FaChartBar className="text-4xl text-blue-500 mr-4" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">
                        Checked Qty
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {totals.CheckedQty}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-lg flex items-center transform hover:scale-105 transition duration-300">
                    <FaList className="text-4xl text-red-500 mr-4" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">
                        Defects Qty
                      </h3>
                      <p className="text-2xl font-bold text-red-600">
                        {totals.DefectsQty}
                      </p>
                    </div>
                  </div>
                  <div
                    className="bg-white p-4 rounded-lg shadow-lg flex items-center transform hover:scale-105 transition duration-300"
                    style={getDefectRateStyles(parseFloat(totals.DefectRate))}
                  >
                    <FaChartLine className="text-4xl text-green-500 mr-4" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">
                        Defect Rate
                      </h3>
                      <p className="text-2xl font-bold">{totals.DefectRate}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Table */}
              {selectedMenu === "Daily Summary" && (
                <div className="overflow-x-auto overflow-y-auto max-h-96 mb-6">
                  <table className="min-w-full border-collapse border border-gray-200">
                    <thead className="bg-green-100 sticky top-0 z-10">
                      <tr>
                        {[
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
                          "Defect Details"
                        ].map((header) => (
                          <th
                            key={header}
                            className="p-2 border border-gray-300 text-sm font-medium text-gray-700"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((row, index) => {
                        const defectRateStyles = getDefectRateStyles(
                          row.DefectRate
                        );
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="p-2 border border-gray-300 text-sm text-center">
                              {row.InspectionDate}
                            </td>
                            <td className="p-2 border border-gray-300 text-sm text-center">
                              {row.WorkLine}
                            </td>
                            <td className="p-2 border border-gray-300 text-sm text-center">
                              {row.MONo}
                            </td>
                            <td className="p-2 border border-gray-300 text-sm text-center">
                              {row.SizeName}
                            </td>
                            <td className="p-2 border border-gray-300 text-sm text-center">
                              {row.ColorNo}
                            </td>
                            <td className="p-2 border border-gray-300 text-sm text-center">
                              {row.ColorName}
                            </td>
                            <td className="p-2 border border-gray-300 text-sm text-center">
                              {row.TotalQtyT38}
                            </td>
                            <td className="p-2 border border-gray-300 text-sm text-center">
                              {row.TotalQtyT39}
                            </td>
                            <td className="p-2 border border-gray-300 text-sm text-center">
                              {row.CheckedQty}
                            </td>
                            <td className="p-2 border border-gray-300 text-sm text-center">
                              {row.DefectsQty}
                            </td>
                            <td
                              className="p-2 border border-gray-300 text-sm text-center"
                              style={{
                                backgroundColor: defectRateStyles.background,
                                color: defectRateStyles.color
                              }}
                            >
                              {row.DefectRate.toFixed(2)}%
                            </td>
                            <td className="p-2 border border-gray-300 text-sm text-left">
                              {row.DefectDetails.length > 0 ? (
                                <ul>
                                  {row.DefectDetails.map((defect, i) => (
                                    <li key={i}>
                                      {`${defect.ReworkName}: ${
                                        defect.DefectsQty
                                      } (${defect.DefectRate.toFixed(2)}%)`}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                "No defects"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-200 font-bold">
                        <td className="p-2 border border-gray-300 text-sm text-center">
                          Total
                        </td>
                        <td className="p-2 border border-gray-300 text-sm text-center">
                          -
                        </td>
                        <td className="p-2 border border-gray-300 text-sm text-center">
                          -
                        </td>
                        <td className="p-2 border border-gray-300 text-sm text-center">
                          -
                        </td>
                        <td className="p-2 border border-gray-300 text-sm text-center">
                          -
                        </td>
                        <td className="p-2 border border-gray-300 text-sm text-center">
                          -
                        </td>
                        <td className="p-2 border border-gray-300 text-sm text-center">
                          {totals.TotalQtyT38}
                        </td>
                        <td className="p-2 border border-gray-300 text-sm text-center">
                          {totals.TotalQtyT39}
                        </td>
                        <td className="p-2 border border-gray-300 text-sm text-center">
                          {totals.CheckedQty}
                        </td>
                        <td className="p-2 border border-gray-300 text-sm text-center">
                          {totals.DefectsQty}
                        </td>
                        <td
                          className="p-2 border border-gray-300 text-sm text-center"
                          style={getDefectRateStyles(
                            parseFloat(totals.DefectRate)
                          )}
                        >
                          {totals.DefectRate}%
                        </td>
                        <td className="p-2 border border-gray-300 text-sm text-center">
                          -
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition duration-300"
                    >
                      Previous
                    </button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition duration-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Charts */}
              {selectedMenu === "Daily Summary" && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">
                      Defect Rate by Line No
                    </h3>
                    <Bar data={barChartData} options={barChartOptions} />
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">
                      Top N Defects
                    </h3>
                    <div className="mb-2">
                      <label
                        htmlFor="topN"
                        className="mr-2 text-sm font-medium text-gray-700"
                      >
                        Select Top N:
                      </label>
                      <select
                        id="topN"
                        value={topN}
                        onChange={(e) => setTopN(parseInt(e.target.value))}
                        className="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {[...Array(40).keys()].map((i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Bar data={topNChartData} options={topNChartOptions} />
                  </div>
                </div>
              )}

              {/* Download Buttons */}
              <div className="flex justify-end mt-6 space-x-4">
                <button
                  onClick={downloadExcel}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
                >
                  Download Excel
                </button>
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition duration-300"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SunriseAnalyze;
