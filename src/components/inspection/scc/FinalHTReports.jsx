// import axios from "axios";
// import {
//   BookOpen,
//   CalendarDays,
//   Check,
//   Clock,
//   Filter as FilterIcon,
//   Gauge,
//   Loader2,
//   RefreshCw,
//   Thermometer,
//   UserCircle2,
//   X
// } from "lucide-react";
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { useTranslation } from "react-i18next";
// import { API_BASE_URL } from "../../../../config";

// // Helper to get image URL (kept for Operator photos)
// const getFacePhotoUrl = (facePhotoPath) => {
//   if (!facePhotoPath) return null;
//   if (facePhotoPath.startsWith("http")) return facePhotoPath;
//   if (facePhotoPath.startsWith("/storage/"))
//     return `${API_BASE_URL}${facePhotoPath}`;
//   try {
//     const apiOrigin = new URL(API_BASE_URL).origin;
//     return `${apiOrigin}${facePhotoPath}`;
//   } catch (e) {
//     return facePhotoPath;
//   }
// };

// const TIME_SLOTS_CONFIG = [
//   { key: "07:00", label: "07.00 AM", inspectionNo: 1 },
//   { key: "09:00", label: "09.00 AM", inspectionNo: 2 },
//   { key: "12:00", label: "12.00 PM", inspectionNo: 3 },
//   { key: "14:00", label: "02.00 PM", inspectionNo: 4 },
//   { key: "16:00", label: "04.00 PM", inspectionNo: 5 },
//   { key: "18:00", label: "06.00 PM", inspectionNo: 6 }
// ];

// // Reusable Cell Components for Clarity
// const OperatorCell = ({ operatorData }) => {
//   if (!operatorData || !operatorData.emp_id)
//     return <span className="text-slate-400 italic">N/A</span>;
//   const imageUrl = getFacePhotoUrl(operatorData.emp_face_photo);
//   return (
//     // Change to flex-col and center items for a vertical layout
//     <div className="flex flex-col items-center justify-center text-center space-y-1">
//       <div className="font-medium text-slate-700 text-xs">
//         {operatorData.emp_id}
//       </div>
//       {imageUrl ? (
//         <img
//           src={imageUrl}
//           alt={operatorData.emp_eng_name}
//           className="w-10 h-10 rounded-full object-cover border"
//           onError={(e) => {
//             e.currentTarget.style.display = "none";
//             // Find the placeholder and display it
//             const parent = e.currentTarget.parentElement;
//             if (parent) {
//               const placeholder = parent.querySelector(".operator-placeholder");
//               if (placeholder) placeholder.style.display = "block";
//             }
//           }}
//         />
//       ) : (
//         <UserCircle2 className="w-10 h-10 text-slate-300 operator-placeholder" />
//       )}
//       <div
//         className="text-[10px] text-slate-500 truncate w-full max-w-[100px]"
//         title={operatorData.emp_eng_name || "N/A"}
//       >
//         {operatorData.emp_eng_name || "N/A"}
//       </div>
//     </div>
//   );
// };

// const SpecsCell = ({ temp, time, pressure }) => (
//   <div className="text-xs space-y-1 text-left min-w-[100px]">
//     <div className="flex items-center">
//       <Thermometer size={12} className="mr-1.5 text-red-500" />
//       T: {temp ?? "N/A"}°C
//     </div>
//     <div className="flex items-center">
//       <Clock size={12} className="mr-1.5 text-blue-500" />
//       t: {time ?? "N/A"}s
//     </div>
//     {pressure !== undefined && (
//       <div className="flex items-center">
//         <Gauge size={12} className="mr-1.5 text-green-500" />
//         P: {pressure ?? "N/A"}Bar
//       </div>
//     )}
//   </div>
// );

// // --- NEW COMPONENT: TimeSlotSpecsCell with Pass/Fail Logic ---
// const TimeSlotSpecsCell = ({
//   icon,
//   label,
//   actual,
//   required,
//   tolerance = 0
// }) => {
//   const isPass = () => {
//     if (
//       actual === null ||
//       actual === undefined ||
//       required === null ||
//       required === undefined
//     ) {
//       return null; // Undetermined state
//     }
//     const diff = Math.abs(Number(actual) - Number(required));
//     return diff <= tolerance;
//   };

//   const status = isPass();

//   return (
//     <div className="flex items-center justify-between">
//       <div className="flex items-center">
//         {icon}
//         {label}: {actual ?? "N/A"}
//       </div>
//       {status !== null &&
//         (status ? (
//           <Check size={14} className="text-green-600 font-bold" />
//         ) : (
//           <X size={14} className="text-red-600 font-bold" />
//         ))}
//     </div>
//   );
// };

// const FinalHTReports = () => {
//   const { t } = useTranslation();

//   // Filter States
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [selectedEmpId, setSelectedEmpId] = useState("All");
//   const [selectedMoNo, setSelectedMoNo] = useState("All");
//   const [selectedMachineNo, setSelectedMachineNo] = useState("All");

//   // Data States
//   const [reportData, setReportData] = useState(null);
//   const [filterOptions, setFilterOptions] = useState({ empIds: [], moNos: [] });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const machineNoOptions = useMemo(
//     () => Array.from({ length: 15 }, (_, i) => String(i + 1)),
//     []
//   );

//   const fetchConsolidatedReport = useCallback(
//     async (date, empId, moNo, machineNo) => {
//       setLoading(true);
//       setError(null);
//       try {
//         const formattedDate = `${
//           date.getMonth() + 1
//         }/${date.getDate()}/${date.getFullYear()}`;
//         const response = await axios.get(
//           `${API_BASE_URL}/api/scc/final-report/ht`,
//           {
//             params: {
//               date: formattedDate,
//               empId,
//               moNo,
//               machineNo
//             }
//           }
//         );
//         setReportData(response.data);
//         // Set filter options only when fetching for 'All' to populate them initially for the day
//         if (empId === "All" && moNo === "All" && machineNo === "All") {
//           setFilterOptions(
//             response.data.filterOptions || { empIds: [], moNos: [] }
//           );
//         }
//       } catch (err) {
//         console.error("Error fetching consolidated HT report:", err);
//         setError(
//           t(
//             "scc.finalReports.fetchError",
//             "Failed to fetch consolidated report."
//           )
//         );
//         setReportData(null);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [t]
//   );

//   // Main effect to fetch data when any filter changes
//   useEffect(() => {
//     fetchConsolidatedReport(
//       selectedDate,
//       selectedEmpId,
//       selectedMoNo,
//       selectedMachineNo
//     );
//   }, [
//     selectedDate,
//     selectedEmpId,
//     selectedMoNo,
//     selectedMachineNo,
//     fetchConsolidatedReport
//   ]);

//   const handleClearFilters = () => {
//     // We keep the selectedDate
//     setSelectedEmpId("All");
//     setSelectedMoNo("All");
//     setSelectedMachineNo("All");
//     // The useEffect above will trigger a refetch with the cleared filters.
//   };

//   const renderTable = (titleKey, data, columns) => (
//     <section className="mb-8 p-4 bg-white border border-slate-200 rounded-lg shadow-md">
//       <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
//         <BookOpen className="mr-3 text-indigo-600" />
//         {t(titleKey)}
//       </h2>
//       <div className="overflow-x-auto pretty-scrollbar">
//         <table className="min-w-full text-sm border-collapse">
//           <thead className="bg-slate-100">
//             <tr>
//               {columns.map((col) => (
//                 <th
//                   key={col.key}
//                   className="p-2 border border-slate-300 text-left font-semibold text-slate-600"
//                   style={col.style || {}} // Apply style to header
//                 >
//                   {t(col.label)}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-200">
//             {data && data.length > 0 ? (
//               data.map((row, rowIndex) => (
//                 <tr key={rowIndex} className="hover:bg-slate-50">
//                   {columns.map((col) => (
//                     <td
//                       key={`${col.key}-${rowIndex}`}
//                       className="p-2 border border-slate-300 align-top"
//                       style={col.style || {}} // Apply style to body cells
//                     >
//                       {col.render(row)}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   colSpan={columns.length}
//                   className="p-4 text-center text-slate-500 italic"
//                 >
//                   {t(
//                     "scc.finalReports.noData",
//                     "No data available for this date or filter selection."
//                   )}
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </section>
//   );

//   // Column definitions remain unchanged
//   const firstOutputColumns = [
//     {
//       key: "machineNo",
//       label: "scc.machineNo",
//       render: (row) => row.machineNo
//     },
//     { key: "moNo", label: "scc.moNo", render: (row) => row.moNo },
//     { key: "buyer", label: "scc.buyer", render: (row) => row.buyer },
//     {
//       key: "buyerStyle",
//       label: "scc.buyerStyle",
//       render: (row) => row.buyerStyle
//     },
//     { key: "color", label: "scc.color", render: (row) => row.color },
//     {
//       key: "operatorData",
//       label: "scc.operatorData",
//       render: (row) => <OperatorCell operatorData={row.operatorData} />
//     },
//     {
//       key: "specs",
//       label: "scc.specs",
//       render: (row) => (
//         <SpecsCell
//           temp={row.specs.tempC}
//           time={row.specs.timeSec}
//           pressure={row.specs.pressure}
//         />
//       )
//     },
//     {
//       key: "secondHeat",
//       label: "scc.secondHeat",
//       render: (row) => (row.secondHeatSpecs ? t("scc.yes") : t("scc.no"))
//     },
//     {
//       key: "secondHeatSpecs",
//       label: "scc.specs2ndHeat",
//       render: (row) =>
//         row.secondHeatSpecs ? (
//           <SpecsCell
//             temp={row.secondHeatSpecs.tempC}
//             time={row.secondHeatSpecs.timeSec}
//             pressure={row.secondHeatSpecs.pressure}
//           />
//         ) : (
//           ""
//         )
//     }
//   ];
//   const dailyWashingColumns = [
//     {
//       key: "machineNo",
//       label: "scc.machineNo",
//       render: (row) => row.machineNo
//     },
//     { key: "moNo", label: "scc.moNo", render: (row) => row.moNo },
//     { key: "buyer", label: "scc.buyer", render: (row) => row.buyer },
//     {
//       key: "buyerStyle",
//       label: "scc.buyerStyle",
//       render: (row) => row.buyerStyle
//     },
//     { key: "color", label: "scc.color", render: (row) => row.color },
//     {
//       key: "operatorData",
//       label: "scc.operatorData",
//       render: (row) => <OperatorCell operatorData={row.operatorData} />
//     },
//     {
//       key: "specs",
//       label: "scc.specs",
//       render: (row) => (
//         <SpecsCell
//           temp={row.standardSpecifications.tempC}
//           time={row.standardSpecifications.timeSec}
//           pressure={row.standardSpecifications.pressure}
//         />
//       )
//     },
//     {
//       key: "rejections",
//       label: "scc.numRejections",
//       render: (row) => row.numberOfRejections
//     },
//     {
//       key: "finalResult",
//       label: "scc.finalResult",
//       render: (row) => (
//         <span
//           className={`px-2 py-1 rounded font-semibold text-xs ${
//             row.finalResult === "Pass"
//               ? "bg-green-100 text-green-700"
//               : "bg-red-100 text-red-700"
//           }`}
//         >
//           {row.finalResult}
//         </span>
//       )
//     },
//     {
//       key: "remarks",
//       label: "scc.remarks",
//       render: (row) => row.remarks || "-"
//     }
//   ];

//   const machineCalibColumns = [
//     {
//       key: "machineNo",
//       label: "scc.machineNo",
//       render: (row) => row.machineNo
//     },
//     { key: "moNo", label: "scc.moNo", render: (row) => row.moNo },
//     {
//       key: "buyer",
//       label: "scc.buyer",
//       style: { minWidth: "60px" },
//       render: (row) => row.buyer
//     },
//     {
//       key: "buyerStyle",
//       label: "scc.buyerStyle",
//       render: (row) => row.buyerStyle
//     },
//     { key: "color", label: "scc.color", render: (row) => row.color },
//     {
//       key: "operatorData",
//       label: "scc.operatorData",
//       render: (row) => <OperatorCell operatorData={row.operatorData} />
//     },
//     {
//       key: "specs",
//       label: "scc.specs",
//       render: (row) => (
//         <SpecsCell
//           temp={row.baseReqTemp}
//           time={row.baseReqTime}
//           pressure={row.baseReqPressure}
//         />
//       )
//     },
//     {
//       key: "stretchTest",
//       label: "scc.stretchScratchTest",
//       style: { minWidth: "60px" },
//       render: (row) => (
//         <div>
//           <span
//             className={`font-semibold ${
//               row.stretchTestResult === "Pass"
//                 ? "text-green-700"
//                 : "text-red-700"
//             }`}
//           >
//             {row.stretchTestResult}
//           </span>{" "}
//           {row.stretchTestResult === "Reject" &&
//             row.stretchTestRejectReasons?.length > 0 && (
//               <div className="text-xs text-slate-600">
//                 ({t("sccDailyHTQC.reasons")}:{" "}
//                 {row.stretchTestRejectReasons.join(", ")})
//               </div>
//             )}
//         </div>
//       )
//     },
//     {
//       key: "timeSlots",
//       label: "scc.timeSlotResults",
//       style: { minWidth: "400px" },
//       render: (row) => (
//         <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
//           {TIME_SLOTS_CONFIG.map((slot) => {
//             const inspection = row.inspections.find(
//               (insp) => insp.timeSlotKey === slot.key
//             );

//             if (!inspection) {
//               return (
//                 <div key={slot.key} className="p-1 border rounded bg-slate-100">
//                   <div className="font-bold text-slate-700 text-[11px]">
//                     {slot.label}
//                   </div>
//                   <span className="text-xs text-slate-400 italic">No Data</span>
//                 </div>
//               );
//             }

//             // Check status of each parameter
//             const tempIsPass =
//               Math.abs(
//                 (inspection.temp_actual ?? 0) - (row.baseReqTemp ?? 0)
//               ) <= 5;
//             const timeIsPass =
//               (inspection.time_actual ?? null) === (row.baseReqTime ?? null);
//             const pressureIsPass =
//               (inspection.pressure_actual ?? null) ===
//               (row.baseReqPressure ?? null);

//             // Determine overall slot background color
//             const isOverallFail = !tempIsPass || !timeIsPass || !pressureIsPass;
//             const bgColor = isOverallFail ? "bg-red-50" : "bg-green-50";

//             return (
//               <div
//                 key={slot.key}
//                 className={`p-1.5 border rounded ${bgColor} text-xs space-y-1`}
//               >
//                 <div className="font-bold text-slate-800 text-[11px]">
//                   {slot.label}
//                 </div>
//                 <TimeSlotSpecsCell
//                   icon={
//                     <Thermometer size={12} className="mr-1.5 text-red-500" />
//                   }
//                   label="T"
//                   actual={inspection.temp_actual}
//                   required={row.baseReqTemp}
//                   tolerance={5}
//                 />
//                 <TimeSlotSpecsCell
//                   icon={<Clock size={12} className="mr-1.5 text-blue-500" />}
//                   label="t"
//                   actual={inspection.time_actual}
//                   required={row.baseReqTime}
//                   tolerance={0}
//                 />
//                 <TimeSlotSpecsCell
//                   icon={<Gauge size={12} className="mr-1.5 text-green-500" />}
//                   label="P"
//                   actual={inspection.pressure_actual}
//                   required={row.baseReqPressure}
//                   tolerance={0}
//                 />
//               </div>
//             );
//           })}
//         </div>
//       )
//     }
//   ];

//   const htInspectionColumns = [
//     {
//       key: "machineNo",
//       label: "scc.machineNo",
//       render: (row) => row.machineNo
//     },
//     { key: "moNo", label: "scc.moNo", render: (row) => row.moNo },
//     { key: "buyer", label: "scc.buyer", render: (row) => row.buyer },
//     {
//       key: "buyerStyle",
//       label: "scc.buyerStyle",
//       render: (row) => row.buyerStyle
//     },
//     { key: "color", label: "scc.color", render: (row) => row.color },
//     {
//       key: "operatorData",
//       label: "scc.operatorData",
//       render: (row) => <OperatorCell operatorData={row.operatorData} />
//     },
//     {
//       key: "batchNo",
//       label: "sccHTInspection.batchNo",
//       render: (row) => row.batchNo
//     },
//     {
//       key: "tableNo",
//       label: "sccHTInspection.tableNo",
//       render: (row) => row.tableNo
//     },
//     {
//       key: "totalPcs",
//       label: "sccHTInspection.totalPcs",
//       render: (row) => row.totalPcs
//     },
//     {
//       key: "inspQty",
//       label: "sccHTInspection.inspQty",
//       render: (row) => row.totalInspectedQty
//     },
//     {
//       key: "defectsQty",
//       label: "sccHTInspection.defectsQty",
//       render: (row) => row.totalDefectsQty
//     },
//     {
//       key: "defectDetails",
//       label: "sccHTInspection.defectDetails",
//       render: (row) => (
//         <div className="text-xs">
//           {Object.entries(row.defectSummary).map(([name, qty]) => (
//             <div key={name}>
//               {name}: {qty}
//             </div>
//           ))}
//         </div>
//       )
//     },
//     {
//       key: "defectRate",
//       label: "sccHTInspection.defectRate",
//       render: (row) => (
//         // Add a parent span with the conditional background color
//         <span
//           className={`inline-block w-full text-center p-1 rounded-md ${
//             row.finalDefectRate > 0
//               ? "bg-red-100 text-red-700"
//               : "bg-green-100 text-green-700"
//           }`}
//         >
//           {`${(row.finalDefectRate * 100).toFixed(2)}%`}
//         </span>
//       )
//     }
//   ];

//   // --- NEW: Sorting function ---
//   const sortByMachineNo = (data) => {
//     if (!data) return [];
//     // Create a mutable copy using the spread syntax before sorting
//     return [...data].sort((a, b) => {
//       const numA = parseInt(a.machineNo, 10);
//       const numB = parseInt(b.machineNo, 10);

//       if (isNaN(numA)) return 1; // Put non-numeric things last
//       if (isNaN(numB)) return -1;

//       return numA - numB;
//     });
//   };

//   return (
//     <div>
//       <div className="mb-6 text-center">
//         <h1 className="text-xl font-bold text-slate-900">
//           Yorkmars (Cambodia) Garment MFG Co., LTD
//         </h1>
//         <p className="text-sm text-slate-600">
//           SCC - HT Daily Reports | {selectedDate.toLocaleDateString()} |{" "}
//           {selectedEmpId === "All" ? "All EMP" : selectedEmpId} |{" "}
//           {selectedMachineNo === "All"
//             ? "All Machines"
//             : `Machine ${selectedMachineNo}`}{" "}
//           | {selectedMoNo === "All" ? "All MOs" : selectedMoNo}
//         </p>
//       </div>

//       <div className="p-4 mb-6 bg-white border border-slate-200 rounded-lg shadow-sm">
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
//           <div>
//             <label
//               htmlFor="reportDate"
//               className="text-sm font-medium text-slate-700 block mb-1"
//             >
//               {t("scc.date")}
//             </label>
//             <DatePicker
//               selected={selectedDate}
//               onChange={(date) => setSelectedDate(date)}
//               dateFormat="MM/dd/yyyy"
//               className="w-full p-2 border border-gray-300 rounded-md text-sm"
//               id="reportDate"
//             />
//           </div>
//           <div>
//             <label
//               htmlFor="empIdFilter"
//               className="text-sm font-medium text-slate-700 block mb-1"
//             >
//               {t("scc.empId")}
//             </label>
//             <select
//               id="empIdFilter"
//               value={selectedEmpId}
//               onChange={(e) => setSelectedEmpId(e.target.value)}
//               className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
//             >
//               <option value="All">All EMP IDs</option>
//               {filterOptions.empIds.map((id) => (
//                 <option key={id} value={id}>
//                   {id}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label
//               htmlFor="moNoFilter"
//               className="text-sm font-medium text-slate-700 block mb-1"
//             >
//               {t("scc.moNo")}
//             </label>
//             <select
//               id="moNoFilter"
//               value={selectedMoNo}
//               onChange={(e) => setSelectedMoNo(e.target.value)}
//               className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
//             >
//               <option value="All">All MO Nos</option>
//               {filterOptions.moNos.map((mo) => (
//                 <option key={mo} value={mo}>
//                   {mo}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label
//               htmlFor="machineNoFilter"
//               className="text-sm font-medium text-slate-700 block mb-1"
//             >
//               {t("scc.machineNo")}
//             </label>
//             <select
//               id="machineNoFilter"
//               value={selectedMachineNo}
//               onChange={(e) => setSelectedMachineNo(e.target.value)}
//               className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
//             >
//               <option value="All">All Machines</option>
//               {machineNoOptions.map((num) => (
//                 <option key={num} value={num}>
//                   {num}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={handleClearFilters}
//               className="w-full flex items-center justify-center p-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors text-sm"
//             >
//               <RefreshCw size={16} className="mr-2" />
//               {t("scc.clearFilters")}
//             </button>
//           </div>
//         </div>
//       </div>

//       {loading && (
//         <div className="text-center p-10">
//           <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto" />
//         </div>
//       )}
//       {error && (
//         <div className="text-center p-10 text-red-600 bg-red-100 rounded-md">
//           {error}
//         </div>
//       )}

//       {!loading && !error && reportData && (
//         <div className="space-y-8">
//           {renderTable(
//             "scc.finalReports.firstOutputTitle",
//             sortByMachineNo(reportData.firstOutput),
//             firstOutputColumns
//           )}
//           {renderTable(
//             "scc.finalReports.dailyWashingTitle",
//             sortByMachineNo(reportData.dailyWashing),
//             dailyWashingColumns
//           )}
//           {renderTable(
//             "scc.finalReports.machineCalibTitle",
//             sortByMachineNo(reportData.machineCalibration),
//             machineCalibColumns
//           )}
//           {renderTable(
//             "scc.finalReports.htInspectionTitle",
//             sortByMachineNo(reportData.htInspection),
//             htInspectionColumns
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default FinalHTReports;

import { PDFDownloadLink } from "@react-pdf/renderer"; // 2. IMPORT PDFDownloadLink
import axios from "axios";
import {
  BookOpen,
  Check,
  Clock,
  FileDown,
  Gauge,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Thermometer,
  UserCircle2,
  X
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";
import FinalConsolidateHTReportDailyWashingPDF from "./FinalConsolidateHTReportDailyWashingPDF";
import FinalConsolidateHTReportFirstOutputPDF from "./FinalConsolidateHTReportFirstOutputPDF";
import FinalConsolidateHTReportHTInspectionPDF from "./FinalConsolidateHTReportHTInspectionPDF";
import FinalConsolidateHTReportMachineCalibPDF from "./FinalConsolidateHTReportMachineCalibPDF";

// NEW: Generic helper to construct full image URLs
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  try {
    const serverOrigin = new URL(API_BASE_URL).origin;
    return `${serverOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
  } catch (e) {
    return path; // Fallback
  }
};

// MODIFICATION: Re-added getFacePhotoUrl as an alias for the generic helper
const getFacePhotoUrl = getImageUrl;

const ImageModal = ({ isOpen, onClose, images }) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  // Determine the grid layout based on the number of images
  const gridColsClass = images.length > 1 ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white p-4 rounded-lg shadow-2xl max-w-6xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white rounded-full p-2 text-slate-700 hover:bg-slate-200 transition"
          aria-label="Close image view"
        >
          <X size={24} />
        </button>
        <div className={`grid grid-cols-1 ${gridColsClass} gap-4`}>
          {/* Map over the images array to display each one */}
          {images.map((image, index) => (
            <div key={index} className="text-center">
              <h3 className="font-bold text-lg mb-2 text-slate-800">
                {image.title}
              </h3>
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.title}
                  className="max-w-full max-h-[75vh] object-contain mx-auto rounded-md"
                />
              ) : (
                <p className="text-slate-500 italic mt-10">No Image Provided</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TIME_SLOTS_CONFIG = [
  { key: "07:00", label: "07.00 AM", inspectionNo: 1 },
  { key: "09:00", label: "09.00 AM", inspectionNo: 2 },
  { key: "12:00", label: "12.00 PM", inspectionNo: 3 },
  { key: "14:00", label: "02.00 PM", inspectionNo: 4 },
  { key: "16:00", label: "04.00 PM", inspectionNo: 5 },
  { key: "18:00", label: "06.00 PM", inspectionNo: 6 }
];

// Reusable Cell Components for Clarity
const OperatorCell = ({ operatorData }) => {
  if (!operatorData || !operatorData.emp_id)
    return <span className="text-slate-400 italic">N/A</span>;
  const imageUrl = getFacePhotoUrl(operatorData.emp_face_photo);
  return (
    // Change to flex-col and center items for a vertical layout
    <div className="flex flex-col items-center justify-center text-center space-y-1">
      <div className="font-medium text-slate-700 text-xs">
        {operatorData.emp_id}
      </div>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={operatorData.emp_eng_name}
          className="w-10 h-10 rounded-full object-cover border"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            // Find the placeholder and display it
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const placeholder = parent.querySelector(".operator-placeholder");
              if (placeholder) placeholder.style.display = "block";
            }
          }}
        />
      ) : (
        <UserCircle2 className="w-10 h-10 text-slate-300 operator-placeholder" />
      )}
      <div
        className="text-[10px] text-slate-500 truncate w-full max-w-[100px]"
        title={operatorData.emp_eng_name || "N/A"}
      >
        {operatorData.emp_eng_name || "N/A"}
      </div>
    </div>
  );
};

const SpecsCell = ({ temp, time, pressure }) => (
  <div className="text-xs space-y-1 text-left min-w-[100px]">
    <div className="flex items-center">
      <Thermometer size={12} className="mr-1.5 text-red-500" />
      T: {temp ?? "N/A"}°C
    </div>
    <div className="flex items-center">
      <Clock size={12} className="mr-1.5 text-blue-500" />
      t: {time ?? "N/A"}s
    </div>
    {pressure !== undefined && (
      <div className="flex items-center">
        <Gauge size={12} className="mr-1.5 text-green-500" />
        P: {pressure ?? "N/A"}Bar
      </div>
    )}
  </div>
);

// --- NEW COMPONENT: TimeSlotSpecsCell with Pass/Fail Logic ---
const TimeSlotSpecsCell = ({
  icon,
  label,
  actual,
  required,
  tolerance = 0
}) => {
  const isPass = () => {
    if (
      actual === null ||
      actual === undefined ||
      required === null ||
      required === undefined
    ) {
      return null; // Undetermined state
    }
    const diff = Math.abs(Number(actual) - Number(required));
    return diff <= tolerance;
  };

  const status = isPass();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        {icon}
        {label}: {actual ?? "N/A"}
      </div>
      {status !== null &&
        (status ? (
          <Check size={14} className="text-green-600 font-bold" />
        ) : (
          <X size={14} className="text-red-600 font-bold" />
        ))}
    </div>
  );
};

// --- NEW HELPER FUNCTION: Safely formats a Date object to a 'YYYY-MM-DD' string ---
const formatDateForQuery = (date) => {
  if (!date || !(date instanceof Date)) {
    return null;
  }
  const year = date.getFullYear();
  // getMonth() is 0-indexed, so we add 1. padStart ensures two digits.
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const FinalHTReports = () => {
  const { t } = useTranslation();

  // Filter States
  //const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedEmpId, setSelectedEmpId] = useState("All");
  const [selectedMoNo, setSelectedMoNo] = useState("All");
  const [selectedMachineNo, setSelectedMachineNo] = useState("All");

  // Data States
  const [reportData, setReportData] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ empIds: [], moNos: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // MODIFIED: State for the more flexible image modal
  const [modalData, setModalData] = useState({
    isOpen: false,
    images: [] // Now an array of image objects
  });

  const machineNoOptions = useMemo(
    () => Array.from({ length: 15 }, (_, i) => String(i + 1)),
    []
  );
  // PREPARE DATA FOR ALL PDF
  const firstOutputPdfData = useMemo(() => {
    if (!reportData?.firstOutput) return [];
    return reportData.firstOutput.map((row) => ({
      ...row,
      referenceSampleImage: getImageUrl(row.referenceSampleImage),
      afterWashImage: getImageUrl(row.afterWashImage)
    }));
  }, [reportData?.firstOutput]);

  const dailyWashingPdfData = useMemo(() => {
    if (!reportData?.dailyWashing) return [];
    return reportData.dailyWashing.map((row) => ({
      ...row,
      afterWashImage: getImageUrl(row.afterWashImage)
    }));
  }, [reportData?.dailyWashing]);

  const htInspectionPdfData = useMemo(() => {
    if (!reportData?.htInspection) return [];
    return reportData.htInspection.map((row) => ({
      ...row,
      defectImageUrl: getImageUrl(row.defectImageUrl)
    }));
  }, [reportData?.htInspection]);

  const fetchConsolidatedReport = useCallback(
    // MODIFICATION: Accept start and end dates
    async (sDate, eDate, empId, moNo, machineNo) => {
      setLoading(true);
      setError(null);
      if (!sDate || !eDate) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/final-report/ht`,
          {
            params: {
              // MODIFICATION: Pass ISO strings for backend parsing
              startDate: formatDateForQuery(sDate),
              endDate: formatDateForQuery(eDate),
              empId,
              moNo,
              machineNo
            }
          }
        );
        setReportData(response.data);
        if (empId === "All" && moNo === "All" && machineNo === "All") {
          setFilterOptions(
            response.data.filterOptions || { empIds: [], moNos: [] }
          );
        }
      } catch (err) {
        console.error("Error fetching consolidated HT report:", err);
        setError(
          t(
            "scc.finalReports.fetchError",
            "Failed to fetch consolidated report."
          )
        );
        setReportData(null);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    // MODIFICATION: Pass date range to fetch function
    fetchConsolidatedReport(
      startDate,
      endDate,
      selectedEmpId,
      selectedMoNo,
      selectedMachineNo
    );
  }, [
    startDate,
    endDate,
    selectedEmpId,
    selectedMoNo,
    selectedMachineNo,
    fetchConsolidatedReport
  ]);

  const handleClearFilters = () => {
    // MODIFICATION: Reset dates to today, clear other filters
    setStartDate(new Date());
    setEndDate(new Date());
    setSelectedEmpId("All");
    setSelectedMoNo("All");
    setSelectedMachineNo("All");
  };

  const renderTable = (titleKey, data, columns) => {
    // Helper to decide which PDF component and data to use
    const getPdfConfig = () => {
      switch (titleKey) {
        case "scc.finalReports.firstOutputTitle":
          return {
            Component: FinalConsolidateHTReportFirstOutputPDF,
            data: firstOutputPdfData,
            fileName: "First_Output_HT_Report.pdf"
          };
        case "scc.finalReports.dailyWashingTitle":
          return {
            Component: FinalConsolidateHTReportDailyWashingPDF,
            data: dailyWashingPdfData,
            fileName: "Daily_Washing_HT_Report.pdf"
          };
        case "scc.finalReports.machineCalibTitle":
          return {
            Component: FinalConsolidateHTReportMachineCalibPDF,
            data: reportData.machineCalibration, // direct data is fine
            fileName: "Machine_Calibration_HT_Report.pdf"
          };
        case "scc.finalReports.htInspectionTitle":
          return {
            Component: FinalConsolidateHTReportHTInspectionPDF,
            data: htInspectionPdfData,
            fileName: "HT_Inspection_Report.pdf"
          };
        default:
          return null;
      }
    };

    const pdfConfig = getPdfConfig();
    return (
      <section className="mb-8 p-4 bg-white border border-slate-200 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <BookOpen className="mr-3 text-indigo-600" />
            {t(titleKey)}
          </h2>
          {/* Render PDF button if a config exists and there's data */}
          {pdfConfig && data && data.length > 0 && (
            <PDFDownloadLink
              document={<pdfConfig.Component data={pdfConfig.data} />}
              fileName={pdfConfig.fileName}
            >
              {({ loading }) => (
                <button
                  className="p-2 bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 transition-colors disabled:opacity-50"
                  title="Download as PDF"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <FileDown size={18} />
                  )}
                </button>
              )}
            </PDFDownloadLink>
          )}
        </div>

        {/* MODIFICATION 1: Add max-height and overflow-auto to the wrapper div */}
        <div className="overflow-auto pretty-scrollbar max-h-[60vh]">
          <table className="min-w-full text-sm border-collapse">
            {/* MODIFICATION 2: Make the table header sticky */}
            <thead className="sticky top-0 z-10 bg-slate-100">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="p-2 border border-slate-300 text-left font-semibold text-slate-600"
                    style={col.style || {}}
                  >
                    {t(col.label)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data && data.length > 0 ? (
                data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50">
                    {columns.map((col) => (
                      <td
                        key={`${col.key}-${rowIndex}`}
                        className="p-2 border border-slate-300 align-top"
                        style={col.style || {}}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-4 text-center text-slate-500 italic"
                  >
                    {t(
                      "scc.finalReports.noData",
                      "No data available for this date or filter selection."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  // --- NEW: Universal Date Column Definition ---
  const inspectionDateColumn = {
    key: "inspectionDate",
    label: "scc.inspectionDate", // Add to translation file
    style: { minWidth: "100px" },
    render: (row) =>
      row.inspectionDate
        ? new Date(row.inspectionDate).toLocaleDateString()
        : "N/A"
  };

  // Column definitions remain unchanged
  const firstOutputColumns = [
    inspectionDateColumn,
    {
      key: "machineNo",
      label: "scc.machineNo",
      render: (row) => row.machineNo
    },
    { key: "moNo", label: "scc.moNo", render: (row) => row.moNo },
    { key: "buyer", label: "scc.buyer", render: (row) => row.buyer },
    {
      key: "buyerStyle",
      label: "scc.buyerStyle",
      render: (row) => row.buyerStyle
    },
    { key: "color", label: "scc.color", render: (row) => row.color },
    {
      key: "operatorData",
      label: "scc.operatorData",
      render: (row) => <OperatorCell operatorData={row.operatorData} />
    },
    {
      key: "specs",
      label: "scc.specs",
      render: (row) => (
        <SpecsCell
          temp={row.specs.tempC}
          time={row.specs.timeSec}
          pressure={row.specs.pressure}
        />
      )
    },
    {
      key: "secondHeat",
      label: "scc.secondHeat",
      render: (row) => (row.secondHeatSpecs ? t("scc.yes") : t("scc.no"))
    },
    {
      key: "secondHeatSpecs",
      label: "scc.specs2ndHeat",
      render: (row) =>
        row.secondHeatSpecs ? (
          <SpecsCell
            temp={row.secondHeatSpecs.tempC}
            time={row.secondHeatSpecs.timeSec}
            pressure={row.secondHeatSpecs.pressure}
          />
        ) : (
          ""
        )
    },
    {
      key: "images",
      label: "scc.finalReports.images",
      render: (row) => (
        <div className="text-center">
          <button
            onClick={() =>
              // MODIFIED: Use the new 'images' array structure
              setModalData({
                isOpen: true,
                images: [
                  {
                    url: getImageUrl(row.referenceSampleImage),
                    title: "Reference Sample Image"
                  },
                  {
                    url: getImageUrl(row.afterWashImage),
                    title: "After Wash Image"
                  }
                ]
              })
            }
            className="p-2 rounded-full hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="View Images"
            disabled={!row.referenceSampleImage && !row.afterWashImage}
          >
            <ImageIcon
              size={18}
              className={
                !row.referenceSampleImage && !row.afterWashImage
                  ? "text-slate-300"
                  : "text-indigo-600"
              }
            />
          </button>
        </div>
      )
    }
  ];
  const dailyWashingColumns = [
    inspectionDateColumn,
    {
      key: "machineNo",
      label: "scc.machineNo",
      render: (row) => row.machineNo
    },
    { key: "moNo", label: "scc.moNo", render: (row) => row.moNo },
    { key: "buyer", label: "scc.buyer", render: (row) => row.buyer },
    {
      key: "buyerStyle",
      label: "scc.buyerStyle",
      render: (row) => row.buyerStyle
    },
    { key: "color", label: "scc.color", render: (row) => row.color },
    {
      key: "operatorData",
      label: "scc.operatorData",
      render: (row) => <OperatorCell operatorData={row.operatorData} />
    },
    {
      key: "specs",
      label: "scc.specs",
      render: (row) => (
        <SpecsCell
          temp={row.standardSpecifications.tempC}
          time={row.standardSpecifications.timeSec}
          pressure={row.standardSpecifications.pressure}
        />
      )
    },
    {
      key: "rejections",
      label: "scc.numRejections",
      render: (row) => row.numberOfRejections
    },
    {
      key: "finalResult",
      label: "scc.finalResult",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded font-semibold text-xs ${
            row.finalResult === "Pass"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.finalResult}
        </span>
      )
    },
    {
      key: "remarks",
      label: "scc.remarks",
      render: (row) => row.remarks || "-"
    },
    {
      key: "images",
      label: "scc.finalReports.images",
      render: (row) => (
        <div className="text-center">
          <button
            onClick={() =>
              setModalData({
                isOpen: true,
                images: [
                  {
                    url: getImageUrl(row.afterWashImage),
                    title: "After Wash Image"
                  }
                ]
              })
            }
            className="p-2 rounded-full hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="View After Wash Image"
            disabled={!row.afterWashImage}
          >
            <ImageIcon
              size={18}
              className={
                !row.afterWashImage ? "text-slate-300" : "text-indigo-600"
              }
            />
          </button>
        </div>
      )
    }
  ];

  const machineCalibColumns = [
    inspectionDateColumn,
    {
      key: "machineNo",
      label: "scc.machineNo",
      render: (row) => row.machineNo
    },
    { key: "moNo", label: "scc.moNo", render: (row) => row.moNo },
    {
      key: "buyer",
      label: "scc.buyer",
      style: { minWidth: "60px" },
      render: (row) => row.buyer
    },
    {
      key: "buyerStyle",
      label: "scc.buyerStyle",
      render: (row) => row.buyerStyle
    },
    { key: "color", label: "scc.color", render: (row) => row.color },
    {
      key: "operatorData",
      label: "scc.operatorData",
      render: (row) => <OperatorCell operatorData={row.operatorData} />
    },
    {
      key: "specs",
      label: "scc.specs",
      render: (row) => (
        <SpecsCell
          temp={row.baseReqTemp}
          time={row.baseReqTime}
          pressure={row.baseReqPressure}
        />
      )
    },
    {
      key: "stretchTest",
      label: "scc.stretchScratchTest",
      style: { minWidth: "60px" },
      render: (row) => (
        <div>
          <span
            className={`font-semibold ${
              row.stretchTestResult === "Pass"
                ? "text-green-700"
                : "text-red-700"
            }`}
          >
            {row.stretchTestResult}
          </span>{" "}
          {row.stretchTestResult === "Reject" &&
            row.stretchTestRejectReasons?.length > 0 && (
              <div className="text-xs text-slate-600">
                ({t("sccDailyHTQC.reasons")}:{" "}
                {row.stretchTestRejectReasons.join(", ")})
              </div>
            )}
        </div>
      )
    },
    {
      key: "timeSlots",
      label: "scc.timeSlotResults",
      style: { minWidth: "400px" },
      render: (row) => (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {TIME_SLOTS_CONFIG.map((slot) => {
            const inspection = row.inspections.find(
              (insp) => insp.timeSlotKey === slot.key
            );

            if (!inspection) {
              return (
                <div key={slot.key} className="p-1 border rounded bg-slate-100">
                  <div className="font-bold text-slate-700 text-[11px]">
                    {slot.label}
                  </div>
                  <span className="text-xs text-slate-400 italic">No Data</span>
                </div>
              );
            }

            // Check status of each parameter
            const tempIsPass =
              Math.abs(
                (inspection.temp_actual ?? 0) - (row.baseReqTemp ?? 0)
              ) <= 5;
            const timeIsPass =
              (inspection.time_actual ?? null) === (row.baseReqTime ?? null);
            const pressureIsPass =
              (inspection.pressure_actual ?? null) ===
              (row.baseReqPressure ?? null);

            // Determine overall slot background color
            const isOverallFail = !tempIsPass || !timeIsPass || !pressureIsPass;
            const bgColor = isOverallFail ? "bg-red-50" : "bg-green-50";

            return (
              <div
                key={slot.key}
                className={`p-1.5 border rounded ${bgColor} text-xs space-y-1`}
              >
                <div className="font-bold text-slate-800 text-[11px]">
                  {slot.label}
                </div>
                <TimeSlotSpecsCell
                  icon={
                    <Thermometer size={12} className="mr-1.5 text-red-500" />
                  }
                  label="T"
                  actual={inspection.temp_actual}
                  required={row.baseReqTemp}
                  tolerance={5}
                />
                <TimeSlotSpecsCell
                  icon={<Clock size={12} className="mr-1.5 text-blue-500" />}
                  label="t"
                  actual={inspection.time_actual}
                  required={row.baseReqTime}
                  tolerance={0}
                />
                <TimeSlotSpecsCell
                  icon={<Gauge size={12} className="mr-1.5 text-green-500" />}
                  label="P"
                  actual={inspection.pressure_actual}
                  required={row.baseReqPressure}
                  tolerance={0}
                />
              </div>
            );
          })}
        </div>
      )
    }
  ];

  const htInspectionColumns = [
    inspectionDateColumn,
    {
      key: "machineNo",
      label: "scc.machineNo",
      render: (row) => row.machineNo
    },
    { key: "moNo", label: "scc.moNo", render: (row) => row.moNo },
    { key: "buyer", label: "scc.buyer", render: (row) => row.buyer },
    {
      key: "buyerStyle",
      label: "scc.buyerStyle",
      render: (row) => row.buyerStyle
    },
    { key: "color", label: "scc.color", render: (row) => row.color },
    {
      key: "operatorData",
      label: "scc.operatorData",
      render: (row) => <OperatorCell operatorData={row.operatorData} />
    },
    {
      key: "batchNo",
      label: "sccHTInspection.batchNo",
      render: (row) => row.batchNo
    },
    {
      key: "tableNo",
      label: "sccHTInspection.tableNo",
      render: (row) => row.tableNo
    },
    {
      key: "totalPcs",
      label: "sccHTInspection.totalPcs",
      render: (row) => row.totalPcs
    },
    {
      key: "inspQty",
      label: "sccHTInspection.inspQty",
      render: (row) => row.totalInspectedQty
    },
    {
      key: "defectsQty",
      label: "sccHTInspection.defectsQty",
      render: (row) => row.totalDefectsQty
    },
    {
      key: "defectDetails",
      label: "sccHTInspection.defectDetails",
      render: (row) => (
        <div className="text-xs">
          {Object.entries(row.defectSummary).map(([name, qty]) => (
            <div key={name}>
              {name}: {qty}
            </div>
          ))}
        </div>
      )
    },
    {
      key: "defectRate",
      label: "sccHTInspection.defectRate",
      render: (row) => (
        // Add a parent span with the conditional background color
        <span
          className={`inline-block w-full text-center p-1 rounded-md ${
            row.finalDefectRate > 0
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {`${(row.finalDefectRate * 100).toFixed(2)}%`}
        </span>
      )
    },
    {
      key: "images",
      label: "scc.finalReports.images",
      render: (row) => (
        <div className="text-center">
          <button
            onClick={() =>
              setModalData({
                isOpen: true,
                images: [
                  {
                    url: getImageUrl(row.defectImageUrl),
                    title: "Defect Image"
                  }
                ]
              })
            }
            className="p-2 rounded-full hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="View Defect Image"
            disabled={!row.defectImageUrl}
          >
            <ImageIcon
              size={18}
              className={
                !row.defectImageUrl ? "text-slate-300" : "text-indigo-600"
              }
            />
          </button>
        </div>
      )
    }
  ];

  // --- NEW: Comprehensive Sorting Function ---
  const sortData = (data) => {
    if (!data) return [];
    // Create a mutable copy before sorting
    return [...data].sort((a, b) => {
      // Primary Sort: Inspection Date (Ascending)
      const dateA = new Date(a.inspectionDate);
      const dateB = new Date(b.inspectionDate);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;

      // Secondary Sort: Machine Number (Ascending)
      const numA = parseInt(a.machineNo, 10) || 0;
      const numB = parseInt(b.machineNo, 10) || 0;
      return numA - numB;
    });
  };

  // --- NEW: Sorting function ---
  const sortByMachineNo = (data) => {
    if (!data) return [];
    // Create a mutable copy using the spread syntax before sorting
    return [...data].sort((a, b) => {
      const numA = parseInt(a.machineNo, 10);
      const numB = parseInt(b.machineNo, 10);

      if (isNaN(numA)) return 1; // Put non-numeric things last
      if (isNaN(numB)) return -1;

      return numA - numB;
    });
  };

  return (
    <div>
      {/* NEW: Render the Image Modal */}
      <ImageModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ isOpen: false, images: [] })} // Reset images on close
        images={modalData.images} // Pass the images array
      />

      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-sm text-slate-600">
          SCC - HT Daily Reports | {startDate.toLocaleDateString()} -{" "}
          {endDate.toLocaleDateString()} |{" "}
          {selectedEmpId === "All" ? "All EMP" : selectedEmpId} |{" "}
          {selectedMachineNo === "All"
            ? "All Machines"
            : `Machine ${selectedMachineNo}`}{" "}
          | {selectedMoNo === "All" ? "All MOs" : selectedMoNo}
        </p>
      </div>

      <div className="p-4 mb-6 bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
          <div className="lg:col-span-1">
            <label
              htmlFor="reportStartDate"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.startDate", "Start Date")}
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="MM/dd/yyyy"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              id="reportStartDate"
              popperClassName="react-datepicker-popper-z-50"
            />
          </div>
          <div className="lg:col-span-1">
            <label
              htmlFor="reportEndDate"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.endDate", "End Date")}
            </label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="MM/dd/yyyy"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              id="reportEndDate"
              popperClassName="react-datepicker-popper-z-50"
            />
          </div>

          <div>
            <label
              htmlFor="empIdFilter"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.empId")}
            </label>
            <select
              id="empIdFilter"
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="All">All EMP IDs</option>
              {filterOptions.empIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="moNoFilter"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.moNo")}
            </label>
            <select
              id="moNoFilter"
              value={selectedMoNo}
              onChange={(e) => setSelectedMoNo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="All">All MO Nos</option>
              {filterOptions.moNos.map((mo) => (
                <option key={mo} value={mo}>
                  {mo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="machineNoFilter"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.machineNo")}
            </label>
            <select
              id="machineNoFilter"
              value={selectedMachineNo}
              onChange={(e) => setSelectedMachineNo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="All">All Machines</option>
              {machineNoOptions.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearFilters}
              className="w-full flex items-center justify-center p-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors text-sm"
            >
              <RefreshCw size={16} className="mr-2" />
              {t("scc.clearFilters")}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center p-10">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto" />
        </div>
      )}
      {error && (
        <div className="text-center p-10 text-red-600 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {!loading && !error && reportData && (
        <div className="space-y-8">
          {renderTable(
            "scc.finalReports.firstOutputTitle",
            //sortByMachineNo(reportData.firstOutput),
            sortData(reportData.firstOutput),
            firstOutputColumns
          )}
          {renderTable(
            "scc.finalReports.dailyWashingTitle",
            //sortByMachineNo(reportData.dailyWashing),
            sortData(reportData.dailyWashing),
            dailyWashingColumns
          )}
          {renderTable(
            "scc.finalReports.machineCalibTitle",
            //sortByMachineNo(reportData.machineCalibration),
            sortData(reportData.machineCalibration),
            machineCalibColumns
          )}
          {renderTable(
            "scc.finalReports.htInspectionTitle",
            //sortByMachineNo(reportData.htInspection),
            sortData(reportData.htInspection),
            htInspectionColumns
          )}
        </div>
      )}
    </div>
  );
};

export default FinalHTReports;
