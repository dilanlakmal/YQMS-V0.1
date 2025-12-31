// import React, { useMemo, useState, useEffect } from "react";
// import axios from "axios";
// import {
//   BarChart3,
//   Layers,
//   FileSpreadsheet,
//   TrendingUp,
//   AlertTriangle,
//   CheckCircle,
//   XCircle,
//   Shield,
//   Award,
//   ThumbsUp,
//   ThumbsDown,
//   Loader2,
//   MapPin,
//   User
// } from "lucide-react";
// import { API_BASE_URL } from "../../../../../config";
// import { determineBuyerFromOrderNo } from "./YPivotQAInspectionBuyerDetermination";

// const YPivotQAInspectionDefectSummary = ({
//   savedDefects = [],
//   activeGroup = null,
//   reportData = null,
//   selectedOrders = []
// }) => {
//   // AQL Config State
//   const [aqlConfigs, setAqlConfigs] = useState([]);
//   const [loadingAql, setLoadingAql] = useState(false);

//   // Determine if AQL method is used
//   const isAQLMethod = useMemo(() => {
//     return reportData?.selectedTemplate?.InspectedQtyMethod === "AQL";
//   }, [reportData?.selectedTemplate]);

//   // Determine buyer
//   const determinedBuyer = useMemo(() => {
//     if (!selectedOrders || selectedOrders.length === 0) return "Unknown";
//     return determineBuyerFromOrderNo(selectedOrders[0]).buyer;
//   }, [selectedOrders]);

//   // Get inspected qty from report config
//   const inspectedQty = useMemo(() => {
//     return parseInt(reportData?.config?.inspectedQty) || 0;
//   }, [reportData?.config?.inspectedQty]);

//   // Fetch AQL Config when needed
//   useEffect(() => {
//     if (!isAQLMethod || !determinedBuyer || determinedBuyer === "Unknown") {
//       setAqlConfigs([]);
//       return;
//     }

//     const fetchAqlConfig = async () => {
//       setLoadingAql(true);
//       try {
//         const res = await axios.get(
//           `${API_BASE_URL}/api/fincheck-inspection/aql-config?buyer=${determinedBuyer}`
//         );
//         if (res.data.success) {
//           setAqlConfigs(res.data.data);
//         }
//       } catch (err) {
//         console.error("Error fetching AQL config:", err);
//         setAqlConfigs([]);
//       } finally {
//         setLoadingAql(false);
//       }
//     };

//     fetchAqlConfig();
//   }, [isAQLMethod, determinedBuyer]);

//   // Find matching sample data for each status
//   const aqlSampleData = useMemo(() => {
//     if (!aqlConfigs || aqlConfigs.length === 0 || !inspectedQty) {
//       return { minor: null, major: null, critical: null, baseConfig: null };
//     }

//     const findMatchingSample = (config) => {
//       if (!config?.SampleData) return null;
//       return config.SampleData.find(
//         (sample) => inspectedQty >= sample.Min && inspectedQty <= sample.Max
//       );
//     };

//     const minorConfig = aqlConfigs.find((c) => c.Status === "Minor");
//     const majorConfig = aqlConfigs.find((c) => c.Status === "Major");
//     const criticalConfig = aqlConfigs.find((c) => c.Status === "Critical");

//     return {
//       minor: findMatchingSample(minorConfig),
//       major: findMatchingSample(majorConfig),
//       critical: findMatchingSample(criticalConfig),
//       minorConfig,
//       majorConfig,
//       criticalConfig,
//       baseConfig: minorConfig || majorConfig || criticalConfig
//     };
//   }, [aqlConfigs, inspectedQty]);

//   // --- Process data for summary table ---
//   const summaryData = useMemo(() => {
//     if (!savedDefects || savedDefects.length === 0) {
//       return {
//         groups: [],
//         totals: { minor: 0, major: 0, critical: 0, total: 0 },
//         uniqueDefects: 0,
//         defectsList: []
//       };
//     }

//     const groupsMap = {};
//     const allDefectsMap = {}; // For AQL table
//     const grandTotals = { minor: 0, major: 0, critical: 0, total: 0 };
//     const uniqueDefectsSet = new Set();

//     savedDefects.forEach((defect) => {
//       // 1. Identify Config Group
//       const configKey = defect.groupId || "legacy";
//       let configLabel = "";
//       if (defect.lineName) configLabel += `Line ${defect.lineName}`;
//       if (defect.tableName)
//         configLabel += (configLabel ? " • " : "") + `Table ${defect.tableName}`;
//       if (defect.colorName)
//         configLabel += (configLabel ? " • " : "") + defect.colorName;
//       if (!configLabel) configLabel = "Unknown";

//       if (!groupsMap[configKey]) {
//         groupsMap[configKey] = {
//           configKey,
//           configLabel,
//           lineName: defect.lineName,
//           tableName: defect.tableName,
//           colorName: defect.colorName,
//           isActive: activeGroup && activeGroup.id === configKey,
//           defects: {}, // Store defects keyed by ID
//           totalRowsInConfig: 0 // To calculate Config RowSpan
//         };
//       }

//       const defectKey = defect.defectId || defect.defectName;
//       uniqueDefectsSet.add(defectKey);

//       // 2. Initialize Defect Entry in this Config Group if not exists
//       if (!groupsMap[configKey].defects[defectKey]) {
//         groupsMap[configKey].defects[defectKey] = {
//           defectId: defect.defectId,
//           defectName: defect.defectName,
//           defectCode: defect.defectCode,
//           locations: [], // List of specific location rows for this defect
//           minorTotal: 0,
//           majorTotal: 0,
//           criticalTotal: 0,
//           grandTotal: 0
//         };
//       }

//       const defectEntry = groupsMap[configKey].defects[defectKey];

//       // --- FIXED LOGIC START: Calculate Counts based on Type ---
//       let rowMinor = 0;
//       let rowMajor = 0;
//       let rowCritical = 0;
//       let rowTotal = 0;

//       if (defect.isNoLocation) {
//         // --- CASE A: No Location Defect ---
//         // Status is on the defect object itself
//         const status = defect.status?.toLowerCase();
//         const qty = defect.qty || 1;

//         if (status === "minor") rowMinor += qty;
//         else if (status === "major") rowMajor += qty;
//         else if (status === "critical") rowCritical += qty;
//         rowTotal += qty;

//         // Add display location
//         defectEntry.locations.push({
//           display: "No Location",
//           qcId: defect.qcUser?.emp_id || null,
//           qty: qty
//         });
//       } else {
//         // --- CASE B: With Location Defect ---
//         // Status is nested inside locations -> positions
//         if (defect.locations && defect.locations.length > 0) {
//           defect.locations.forEach((loc) => {
//             // Count positions
//             if (loc.positions && loc.positions.length > 0) {
//               loc.positions.forEach((pos) => {
//                 const status = pos.status?.toLowerCase();
//                 if (status === "minor") rowMinor += 1;
//                 else if (status === "major") rowMajor += 1;
//                 else if (status === "critical") rowCritical += 1;
//                 rowTotal += 1;
//               });
//             } else {
//               // Fallback if positions array is empty but qty exists
//               rowTotal += loc.qty || 1;
//             }

//             // Add display location
//             defectEntry.locations.push({
//               display: `${loc.locationName} (${loc.view})`,
//               qcId: defect.qcUser?.emp_id || null, // Or parse from positions if needed
//               qty: loc.qty || 1
//             });
//           });
//         }
//       }
//       // --- FIXED LOGIC END ---

//       // 3. Update Defect Totals (Aggregate)
//       defectEntry.minorTotal += rowMinor;
//       defectEntry.majorTotal += rowMajor;
//       defectEntry.criticalTotal += rowCritical;
//       defectEntry.grandTotal += rowTotal;

//       // 4. Update Global Totals
//       grandTotals.minor += rowMinor;
//       grandTotals.major += rowMajor;
//       grandTotals.critical += rowCritical;
//       grandTotals.total += rowTotal;

//       // 5. Update AQL Map
//       if (!allDefectsMap[defectKey]) {
//         allDefectsMap[defectKey] = {
//           defectId: defect.defectId,
//           defectName: defect.defectName,
//           defectCode: defect.defectCode,
//           minor: 0,
//           major: 0,
//           critical: 0,
//           total: 0
//         };
//       }

//       allDefectsMap[defectKey].minor += rowMinor;
//       allDefectsMap[defectKey].major += rowMajor;
//       allDefectsMap[defectKey].critical += rowCritical;
//       allDefectsMap[defectKey].total += rowTotal;
//     });

//     // 6. Structure Final Data for Rendering
//     const groups = Object.values(groupsMap).map((group) => {
//       // Sort Defects by Code
//       const sortedDefects = Object.values(group.defects).sort((a, b) => {
//         const codeA = parseFloat(a.defectCode) || 0;
//         const codeB = parseFloat(b.defectCode) || 0;
//         return codeA - codeB;
//       });

//       // Calculate total rows needed for the Config column rowspan
//       let totalRows = 0;
//       sortedDefects.forEach((d) => {
//         totalRows += d.locations.length;
//       });

//       return { ...group, defects: sortedDefects, totalRowsInConfig: totalRows };
//     });

//     const defectsList = Object.values(allDefectsMap).sort((a, b) => {
//       const codeA = parseFloat(a.defectCode) || 0;
//       const codeB = parseFloat(b.defectCode) || 0;
//       return codeA - codeB;
//     });

//     return {
//       groups,
//       totals: grandTotals,
//       uniqueDefects: uniqueDefectsSet.size,
//       defectsList
//     };
//   }, [savedDefects, activeGroup]);

//   // Calculate AQL Pass/Fail Result
//   const aqlResult = useMemo(() => {
//     if (!isAQLMethod || !aqlSampleData.baseConfig) {
//       return null;
//     }

//     const {
//       minor: minorSample,
//       major: majorSample,
//       critical: criticalSample
//     } = aqlSampleData;
//     const {
//       minor: minorCount,
//       major: majorCount,
//       critical: criticalCount
//     } = summaryData.totals;

//     const getStatus = (count, sample) => {
//       if (!sample || sample.Ac === null || sample.Ac === undefined) {
//         return { status: "N/A", reason: "No AQL config" };
//       }

//       const ac = parseInt(sample.Ac);
//       const re = parseInt(sample.Re);

//       if (count <= ac) {
//         return { status: "PASS", reason: `${count} ≤ ${ac} (Ac)` };
//       } else {
//         return { status: "FAIL", reason: `${count} ≥ ${re} (Re)` };
//       }
//     };

//     const minorResult = getStatus(minorCount, minorSample);
//     const majorResult = getStatus(majorCount, majorSample);
//     const criticalResult = getStatus(criticalCount, criticalSample);

//     const hasAnyFail =
//       minorResult.status === "FAIL" ||
//       majorResult.status === "FAIL" ||
//       criticalResult.status === "FAIL";

//     return {
//       minor: {
//         ...minorResult,
//         count: minorCount,
//         ac: minorSample?.Ac,
//         re: minorSample?.Re
//       },
//       major: {
//         ...majorResult,
//         count: majorCount,
//         ac: majorSample?.Ac,
//         re: majorSample?.Re
//       },
//       critical: {
//         ...criticalResult,
//         count: criticalCount,
//         ac: criticalSample?.Ac,
//         re: criticalSample?.Re
//       },
//       final: hasAnyFail ? "FAIL" : "PASS",
//       sampleSize: minorSample?.SampleSize || majorSample?.SampleSize || 0,
//       batch: minorSample?.BatchName || majorSample?.BatchName || "N/A",
//       sampleLetter:
//         minorSample?.SampleLetter || majorSample?.SampleLetter || "N/A"
//     };
//   }, [isAQLMethod, aqlSampleData, summaryData.totals]);

//   if (!savedDefects || savedDefects.length === 0) {
//     return (
//       <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
//         <div className="flex flex-col items-center justify-center py-8 text-gray-400">
//           <FileSpreadsheet className="w-16 h-16 mb-4 opacity-50" />
//           <p className="text-lg font-bold text-gray-600 dark:text-gray-300">
//             No Defects Recorded
//           </p>
//           <p className="text-sm text-gray-500 mt-1">
//             Add defects from the "Select Defects" tab to see the summary.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4 pb-20 animate-fadeIn">
//       {/* Header Card with Stats */}
//       <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-5 text-white">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//           <div className="flex items-center gap-3">
//             <div className="p-2.5 bg-white/10 rounded-xl">
//               <BarChart3 className="w-6 h-6" />
//             </div>
//             <div>
//               <h2 className="text-lg font-bold">Defect Summary</h2>
//               <p className="text-xs text-slate-400">
//                 {summaryData.groups.length} configuration(s) •{" "}
//                 {summaryData.uniqueDefects} unique defect(s)
//               </p>
//             </div>
//           </div>

//           <div className="flex gap-3">
//             <div className="text-center px-4 py-2 bg-white/10 rounded-xl">
//               <p className="text-2xl font-black">{summaryData.totals.total}</p>
//               <p className="text-[9px] uppercase tracking-wider opacity-70">
//                 Total
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Summary Table by Config */}
//       <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
//         <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
//           <h3 className="text-white font-bold text-sm flex items-center gap-2">
//             <Layers className="w-4 h-4" />
//             Defect Summary by Configuration
//           </h3>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm border-collapse min-w-[900px]">
//             <thead>
//               <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
//                 <th className="px-4 py-3 text-left font-bold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 min-w-[150px]">
//                   <div className="flex items-center gap-2">
//                     <Layers className="w-4 h-4" />
//                     Config
//                   </div>
//                 </th>
//                 <th className="px-4 py-3 text-left font-bold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 min-w-[180px]">
//                   Defect Name
//                 </th>
//                 <th className="px-4 py-3 text-left font-bold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 min-w-[200px]">
//                   <div className="flex items-center gap-2">
//                     <MapPin className="w-4 h-4" />
//                     Location
//                   </div>
//                 </th>
//                 {/* Status Columns with Full Names */}
//                 <th className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 w-[80px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
//                   Minor
//                 </th>
//                 <th className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 w-[80px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
//                   Major
//                 </th>
//                 <th className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 w-[80px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
//                   Critical
//                 </th>
//                 <th className="px-3 py-3 text-center font-bold text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[80px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
//                   Total
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {summaryData.groups.map((group, groupIndex) => {
//                 // Tracking current location row index within the group for rendering
//                 let groupRenderIndex = 0;

//                 return group.defects.map((defect, defectIndex) => {
//                   const defectLocationRows = defect.locations.length;

//                   return defect.locations.map((loc, locIndex) => {
//                     const isFirstGroupRow = groupRenderIndex === 0;
//                     const isFirstDefectRow = locIndex === 0;

//                     // Increment counter for next iteration
//                     groupRenderIndex++;

//                     return (
//                       <tr
//                         key={`${group.configKey}-${defect.defectId}-${locIndex}`}
//                         className={`border-b border-gray-100 dark:border-gray-700/50 ${
//                           group.isActive
//                             ? "bg-green-50/50 dark:bg-green-900/10"
//                             : groupIndex % 2 === 0
//                             ? "bg-white dark:bg-gray-800"
//                             : "bg-gray-50/50 dark:bg-gray-800/50"
//                         } hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors`}
//                       >
//                         {/* Config Column: Render only on the very first row of the entire group */}
//                         {isFirstGroupRow && (
//                           <td
//                             rowSpan={group.totalRowsInConfig}
//                             className={`px-4 py-3 align-top border-r border-gray-200 dark:border-gray-700 ${
//                               group.isActive
//                                 ? "bg-green-100/50 dark:bg-green-900/20"
//                                 : "bg-gray-50 dark:bg-gray-900/30"
//                             }`}
//                           >
//                             <div className="space-y-2 sticky top-2">
//                               <div className="flex items-start gap-2">
//                                 <Layers
//                                   className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
//                                     group.isActive
//                                       ? "text-green-500"
//                                       : "text-gray-400"
//                                   }`}
//                                 />
//                                 <div className="min-w-0">
//                                   {group.lineName && (
//                                     <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
//                                       Line {group.lineName}
//                                     </p>
//                                   )}
//                                   {group.tableName && (
//                                     <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
//                                       Table {group.tableName}
//                                     </p>
//                                   )}
//                                   {group.colorName && (
//                                     <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
//                                       {group.colorName}
//                                     </p>
//                                   )}
//                                 </div>
//                               </div>
//                               {group.isActive && (
//                                 <span className="inline-flex px-2 py-0.5 bg-green-500 text-white text-[8px] font-bold rounded-full uppercase tracking-wider">
//                                   Active
//                                 </span>
//                               )}
//                             </div>
//                           </td>
//                         )}

//                         {/* Defect Name: Render only on the first row of this defect, span all location rows */}
//                         {isFirstDefectRow && (
//                           <td
//                             rowSpan={defectLocationRows}
//                             className="px-4 py-2.5 align-top border-r border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50"
//                           >
//                             <div className="flex items-center gap-2">
//                               <span className="flex-shrink-0 font-mono text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 min-w-[36px] text-center">
//                                 {defect.defectCode}
//                               </span>
//                               <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
//                                 {defect.defectName}
//                               </span>
//                             </div>
//                           </td>
//                         )}

//                         {/* Location Column: Render on EVERY row */}
//                         <td className="px-4 py-2.5 border-r border-gray-100 dark:border-gray-700/50">
//                           <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
//                               <span
//                                 className={
//                                   loc.display === "No Location"
//                                     ? "text-gray-400 italic"
//                                     : "font-medium"
//                                 }
//                               >
//                                 {loc.display}
//                               </span>
//                               {loc.qcId && (
//                                 <span className="inline-flex items-center gap-1 text-[9px] font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800 ml-1">
//                                   <User className="w-3 h-3" />
//                                   {loc.qcId}
//                                 </span>
//                               )}
//                             </div>
//                             {loc.qty > 0 && (
//                               <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 rounded text-gray-500 font-mono">
//                                 Qty: {loc.qty}
//                               </span>
//                             )}
//                           </div>
//                         </td>

//                         {/* Status Columns: Render only on first row of defect, show AGGREGATE totals */}
//                         {isFirstDefectRow && (
//                           <>
//                             <td
//                               rowSpan={defectLocationRows}
//                               className="px-3 py-2.5 text-center align-top border-r border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50"
//                             >
//                               {defect.minorTotal > 0 ? (
//                                 <span className="font-bold text-xs text-green-700 dark:text-green-400">
//                                   {defect.minorTotal}
//                                 </span>
//                               ) : (
//                                 <span className="text-gray-300 dark:text-gray-600">
//                                   -
//                                 </span>
//                               )}
//                             </td>

//                             <td
//                               rowSpan={defectLocationRows}
//                               className="px-3 py-2.5 text-center align-top border-r border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50"
//                             >
//                               {defect.majorTotal > 0 ? (
//                                 <span className="font-bold text-xs text-orange-700 dark:text-orange-400">
//                                   {defect.majorTotal}
//                                 </span>
//                               ) : (
//                                 <span className="text-gray-300 dark:text-gray-600">
//                                   -
//                                 </span>
//                               )}
//                             </td>

//                             <td
//                               rowSpan={defectLocationRows}
//                               className="px-3 py-2.5 text-center align-top border-r border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50"
//                             >
//                               {defect.criticalTotal > 0 ? (
//                                 <span className="font-bold text-xs text-red-700 dark:text-red-400">
//                                   {defect.criticalTotal}
//                                 </span>
//                               ) : (
//                                 <span className="text-gray-300 dark:text-gray-600">
//                                   -
//                                 </span>
//                               )}
//                             </td>

//                             <td
//                               rowSpan={defectLocationRows}
//                               className="px-3 py-2.5 text-center align-top bg-white/50 dark:bg-gray-800/50"
//                             >
//                               <span className="font-bold text-xs text-indigo-700 dark:text-indigo-400">
//                                 {defect.grandTotal}
//                               </span>
//                             </td>
//                           </>
//                         )}
//                       </tr>
//                     );
//                   });
//                 });
//               })}

//               {/* Grand Totals Row */}
//               <tr className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white">
//                 <td
//                   colSpan={3}
//                   className="px-4 py-4 text-right font-bold text-xs uppercase tracking-wider border-r border-gray-600"
//                 >
//                   <div className="flex items-center justify-end gap-2">
//                     <TrendingUp className="w-4 h-4" />
//                     Grand Total
//                   </div>
//                 </td>
//                 <td className="px-3 py-4 text-center border-r border-gray-600">
//                   {summaryData.totals.minor > 0 ? (
//                     <span className="inline-flex items-center justify-center min-w-[36px] h-8 px-3 bg-green-500 text-white font-bold text-sm rounded-lg shadow-lg">
//                       {summaryData.totals.minor}
//                     </span>
//                   ) : (
//                     <span className="text-gray-500">-</span>
//                   )}
//                 </td>
//                 <td className="px-3 py-4 text-center border-r border-gray-600">
//                   {summaryData.totals.major > 0 ? (
//                     <span className="inline-flex items-center justify-center min-w-[36px] h-8 px-3 bg-orange-500 text-white font-bold text-sm rounded-lg shadow-lg">
//                       {summaryData.totals.major}
//                     </span>
//                   ) : (
//                     <span className="text-gray-500">-</span>
//                   )}
//                 </td>
//                 <td className="px-3 py-4 text-center border-r border-gray-600">
//                   {summaryData.totals.critical > 0 ? (
//                     <span className="inline-flex items-center justify-center min-w-[36px] h-8 px-3 bg-red-500 text-white font-bold text-sm rounded-lg shadow-lg">
//                       {summaryData.totals.critical}
//                     </span>
//                   ) : (
//                     <span className="text-gray-500">-</span>
//                   )}
//                 </td>
//                 <td className="px-3 py-4 text-center">
//                   <span className="inline-flex items-center justify-center min-w-[40px] h-9 px-3 bg-white text-indigo-700 font-black text-base rounded-lg shadow-lg">
//                     {summaryData.totals.total}
//                   </span>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* AQL Defect Result Section - Only show if AQL method */}
//       {isAQLMethod && (
//         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
//           <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
//             <h3 className="text-white font-bold text-sm flex items-center gap-2">
//               <Shield className="w-4 h-4" />
//               Report: Defect Result (AQL)
//             </h3>
//           </div>

//           <div className="p-4 space-y-4">
//             {loadingAql ? (
//               <div className="flex items-center justify-center py-8">
//                 <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
//               </div>
//             ) : aqlResult ? (
//               <>
//                 {/* AQL Configuration Cards */}
//                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
//                   <div className="p-2.5 bg-gray-100 dark:bg-gray-900 rounded-lg text-center">
//                     <p className="text-[9px] text-gray-500 uppercase font-medium">
//                       Type
//                     </p>
//                     <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
//                       {aqlSampleData.baseConfig?.InspectionType || "N/A"}
//                     </p>
//                   </div>
//                   <div className="p-2.5 bg-gray-100 dark:bg-gray-900 rounded-lg text-center">
//                     <p className="text-[9px] text-gray-500 uppercase font-medium">
//                       Level
//                     </p>
//                     <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
//                       {aqlSampleData.baseConfig?.Level || "N/A"}
//                     </p>
//                   </div>
//                   <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-center">
//                     <p className="text-[9px] text-purple-600 uppercase font-medium">
//                       Batch
//                     </p>
//                     <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
//                       {aqlResult.batch}
//                     </p>
//                   </div>
//                   <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-center">
//                     <p className="text-[9px] text-emerald-600 uppercase font-medium">
//                       Sample Letter
//                     </p>
//                     <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
//                       {aqlResult.sampleLetter}
//                     </p>
//                   </div>
//                   <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg text-center">
//                     <p className="text-[9px] text-cyan-600 uppercase font-medium">
//                       Sample Size
//                     </p>
//                     <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
//                       {aqlResult.sampleSize}
//                     </p>
//                   </div>
//                   <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-center">
//                     <p className="text-[9px] text-indigo-600 uppercase font-medium">
//                       Inspected Qty
//                     </p>
//                     <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
//                       {inspectedQty}
//                     </p>
//                   </div>
//                 </div>

//                 {/* AQL Levels */}
//                 <div className="grid grid-cols-3 gap-2">
//                   <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-lg text-center border border-green-200 dark:border-green-800">
//                     <p className="text-[9px] text-green-600 uppercase font-medium">
//                       Minor AQL
//                     </p>
//                     <p className="text-sm font-bold text-green-700 dark:text-green-300">
//                       {aqlSampleData.minorConfig?.AQLLevel || "N/A"}
//                     </p>
//                   </div>
//                   <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-center border border-orange-200 dark:border-orange-800">
//                     <p className="text-[9px] text-orange-600 uppercase font-medium">
//                       Major AQL
//                     </p>
//                     <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
//                       {aqlSampleData.majorConfig?.AQLLevel || "N/A"}
//                     </p>
//                   </div>
//                   <div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-lg text-center border border-red-200 dark:border-red-800">
//                     <p className="text-[9px] text-red-600 uppercase font-medium">
//                       Critical AQL
//                     </p>
//                     <p className="text-sm font-bold text-red-700 dark:text-red-300">
//                       {aqlSampleData.criticalConfig?.AQLLevel || "N/A"}
//                     </p>
//                   </div>
//                 </div>

//                 {/* AQL Result Table */}
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-sm border-collapse">
//                     <thead>
//                       <tr className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
//                         <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
//                           Defect Name
//                         </th>
//                         <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-[80px] bg-green-600/80">
//                           Minor
//                         </th>
//                         <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-[80px] bg-orange-600/80">
//                           Major
//                         </th>
//                         <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-[80px] bg-red-600/80">
//                           Critical
//                         </th>
//                         <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-[80px]">
//                           Total
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {summaryData.defectsList.map((defect, idx) => (
//                         <tr
//                           key={defect.defectId || idx}
//                           className={`border-b border-gray-200 dark:border-gray-700 ${
//                             idx % 2 === 0
//                               ? "bg-white dark:bg-gray-800"
//                               : "bg-gray-50 dark:bg-gray-800/50"
//                           }`}
//                         >
//                           <td className="px-4 py-2.5">
//                             <div className="flex items-center gap-2">
//                               <span className="font-mono text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
//                                 {defect.defectCode}
//                               </span>
//                               <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
//                                 {defect.defectName}
//                               </span>
//                             </div>
//                           </td>
//                           <td className="px-3 py-2.5 text-center">
//                             {defect.minor > 0 ? (
//                               <span className="font-bold text-green-700 dark:text-green-400">
//                                 {defect.minor}
//                               </span>
//                             ) : (
//                               <span className="text-gray-300">-</span>
//                             )}
//                           </td>
//                           <td className="px-3 py-2.5 text-center">
//                             {defect.major > 0 ? (
//                               <span className="font-bold text-orange-700 dark:text-orange-400">
//                                 {defect.major}
//                               </span>
//                             ) : (
//                               <span className="text-gray-300">-</span>
//                             )}
//                           </td>
//                           <td className="px-3 py-2.5 text-center">
//                             {defect.critical > 0 ? (
//                               <span className="font-bold text-red-700 dark:text-red-400">
//                                 {defect.critical}
//                               </span>
//                             ) : (
//                               <span className="text-gray-300">-</span>
//                             )}
//                           </td>
//                           <td className="px-3 py-2.5 text-center font-bold text-gray-800 dark:text-gray-200">
//                             {defect.total}
//                           </td>
//                         </tr>
//                       ))}

//                       {/* Totals Row */}
//                       <tr className="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-gray-300 dark:border-gray-600">
//                         <td className="px-4 py-3 text-right text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
//                           Total
//                         </td>
//                         <td className="px-3 py-3 text-center">
//                           <span className="text-green-700 dark:text-green-400 text-sm">
//                             {summaryData.totals.minor}
//                           </span>
//                         </td>
//                         <td className="px-3 py-3 text-center">
//                           <span className="text-orange-700 dark:text-orange-400 text-sm">
//                             {summaryData.totals.major}
//                           </span>
//                         </td>
//                         <td className="px-3 py-3 text-center">
//                           <span className="text-red-700 dark:text-red-400 text-sm">
//                             {summaryData.totals.critical}
//                           </span>
//                         </td>
//                         <td className="px-3 py-3 text-center">
//                           <span className="text-indigo-700 dark:text-indigo-400 text-base">
//                             {summaryData.totals.total}
//                           </span>
//                         </td>
//                       </tr>

//                       {/* Ac/Re Row */}
//                       <tr className="bg-gray-200 dark:bg-gray-800 text-xs">
//                         <td className="px-4 py-2 text-right font-medium text-gray-500">
//                           Ac / Re
//                         </td>
//                         <td className="px-3 py-2 text-center">
//                           <span className="text-green-600">
//                             {aqlResult.minor.ac ?? "—"} /{" "}
//                             {aqlResult.minor.re ?? "—"}
//                           </span>
//                         </td>
//                         <td className="px-3 py-2 text-center">
//                           <span className="text-orange-600">
//                             {aqlResult.major.ac ?? "—"} /{" "}
//                             {aqlResult.major.re ?? "—"}
//                           </span>
//                         </td>
//                         <td className="px-3 py-2 text-center">
//                           <span className="text-red-600">
//                             {aqlResult.critical.ac ?? "—"} /{" "}
//                             {aqlResult.critical.re ?? "—"}
//                           </span>
//                         </td>
//                         <td className="px-3 py-2 text-center">
//                           <span className="text-gray-400">—</span>
//                         </td>
//                       </tr>

//                       {/* Status Row */}
//                       <tr className="bg-gray-100 dark:bg-gray-900">
//                         <td className="px-4 py-3 text-right font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
//                           Status
//                         </td>
//                         <td className="px-3 py-3 text-center">
//                           {aqlResult.minor.status === "PASS" ? (
//                             <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg">
//                               <ThumbsUp className="w-3 h-3" />
//                               PASS
//                             </span>
//                           ) : aqlResult.minor.status === "FAIL" ? (
//                             <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg">
//                               <ThumbsDown className="w-3 h-3" />
//                               FAIL
//                             </span>
//                           ) : (
//                             <span className="text-gray-400 text-xs">N/A</span>
//                           )}
//                         </td>
//                         <td className="px-3 py-3 text-center">
//                           {aqlResult.major.status === "PASS" ? (
//                             <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg">
//                               <ThumbsUp className="w-3 h-3" />
//                               PASS
//                             </span>
//                           ) : aqlResult.major.status === "FAIL" ? (
//                             <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg">
//                               <ThumbsDown className="w-3 h-3" />
//                               FAIL
//                             </span>
//                           ) : (
//                             <span className="text-gray-400 text-xs">N/A</span>
//                           )}
//                         </td>
//                         <td className="px-3 py-3 text-center">
//                           {aqlResult.critical.status === "PASS" ? (
//                             <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg">
//                               <ThumbsUp className="w-3 h-3" />
//                               PASS
//                             </span>
//                           ) : aqlResult.critical.status === "FAIL" ? (
//                             <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg">
//                               <ThumbsDown className="w-3 h-3" />
//                               FAIL
//                             </span>
//                           ) : (
//                             <span className="text-gray-400 text-xs">N/A</span>
//                           )}
//                         </td>
//                         <td className="px-3 py-3 text-center">
//                           <span className="text-gray-400">—</span>
//                         </td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>

//                 {/* Final Result Banner */}
//                 <div
//                   className={`p-6 rounded-xl border-2 ${
//                     aqlResult.final === "PASS"
//                       ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700"
//                       : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-300 dark:border-red-700"
//                   }`}
//                 >
//                   <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
//                     <div
//                       className={`p-4 rounded-full ${
//                         aqlResult.final === "PASS"
//                           ? "bg-green-100 dark:bg-green-800/50"
//                           : "bg-red-100 dark:bg-red-800/50"
//                       }`}
//                     >
//                       {aqlResult.final === "PASS" ? (
//                         <Award className="w-10 h-10 text-green-600 dark:text-green-400" />
//                       ) : (
//                         <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
//                       )}
//                     </div>
//                     <div className="text-center sm:text-left">
//                       <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
//                         Final Defect Result
//                       </p>
//                       <p
//                         className={`text-4xl font-black ${
//                           aqlResult.final === "PASS"
//                             ? "text-green-600 dark:text-green-400"
//                             : "text-red-600 dark:text-red-400"
//                         }`}
//                       >
//                         {aqlResult.final}
//                       </p>
//                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                         {aqlResult.final === "PASS"
//                           ? "All defect categories are within acceptable limits"
//                           : "One or more defect categories exceeded acceptable limits"}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
//                 <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
//                 <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
//                   AQL Configuration Not Available
//                 </p>
//                 <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
//                   Please ensure inspected quantity is entered and AQL
//                   configuration is set for buyer: {determinedBuyer}
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Quick Stats Cards */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
//           <div className="flex items-center gap-2 mb-2">
//             <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
//               <Layers className="w-4 h-4 text-gray-500" />
//             </div>
//             <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
//               Configs
//             </p>
//           </div>
//           <p className="text-2xl font-black text-gray-800 dark:text-gray-200">
//             {summaryData.groups.length}
//           </p>
//         </div>

//         <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-md border border-green-200 dark:border-green-800 p-4 hover:shadow-lg transition-shadow">
//           <div className="flex items-center gap-2 mb-2">
//             <div className="p-1.5 bg-green-100 dark:bg-green-800/50 rounded-lg">
//               <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
//             </div>
//             <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-wider font-medium">
//               Minor
//             </p>
//           </div>
//           <p className="text-2xl font-black text-green-700 dark:text-green-400">
//             {summaryData.totals.minor}
//           </p>
//         </div>

//         <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl shadow-md border border-orange-200 dark:border-orange-800 p-4 hover:shadow-lg transition-shadow">
//           <div className="flex items-center gap-2 mb-2">
//             <div className="p-1.5 bg-orange-100 dark:bg-orange-800/50 rounded-lg">
//               <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
//             </div>
//             <p className="text-[10px] text-orange-600 dark:text-orange-400 uppercase tracking-wider font-medium">
//               Major
//             </p>
//           </div>
//           <p className="text-2xl font-black text-orange-700 dark:text-orange-400">
//             {summaryData.totals.major}
//           </p>
//         </div>

//         <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl shadow-md border border-red-200 dark:border-red-800 p-4 hover:shadow-lg transition-shadow">
//           <div className="flex items-center gap-2 mb-2">
//             <div className="p-1.5 bg-red-100 dark:bg-red-800/50 rounded-lg">
//               <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
//             </div>
//             <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-wider font-medium">
//               Critical
//             </p>
//           </div>
//           <p className="text-2xl font-black text-red-700 dark:text-red-400">
//             {summaryData.totals.critical}
//           </p>
//         </div>
//       </div>

//       <style jsx>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//             transform: translateY(5px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.3s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default YPivotQAInspectionDefectSummary;

import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart3,
  Layers,
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Award,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  MapPin,
  User
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import { determineBuyerFromOrderNo } from "./YPivotQAInspectionBuyerDetermination";

// ============================================================================
// EXPORTED HOOKS & UTILITIES
// ============================================================================

/**
 * Hook to calculate defect summary data from saved defects
 */
export const useDefectSummaryData = (savedDefects = [], activeGroup = null) => {
  return useMemo(() => {
    if (!savedDefects || savedDefects.length === 0) {
      return {
        groups: [],
        totals: { minor: 0, major: 0, critical: 0, total: 0 },
        uniqueDefects: 0,
        defectsList: []
      };
    }

    const groupsMap = {};
    const allDefectsMap = {};
    const grandTotals = { minor: 0, major: 0, critical: 0, total: 0 };
    const uniqueDefectsSet = new Set();

    savedDefects.forEach((defect) => {
      const configKey = defect.groupId || "legacy";
      let configLabel = "";
      if (defect.lineName) configLabel += `Line ${defect.lineName}`;
      if (defect.tableName)
        configLabel += (configLabel ? " • " : "") + `Table ${defect.tableName}`;
      if (defect.colorName)
        configLabel += (configLabel ? " • " : "") + defect.colorName;
      if (!configLabel) configLabel = "Unknown";

      if (!groupsMap[configKey]) {
        groupsMap[configKey] = {
          configKey,
          configLabel,
          lineName: defect.lineName,
          tableName: defect.tableName,
          colorName: defect.colorName,
          isActive: activeGroup && activeGroup.id === configKey,
          defects: {},
          totalRowsInConfig: 0
        };
      }

      const defectKey = defect.defectId || defect.defectName;
      uniqueDefectsSet.add(defectKey);

      if (!groupsMap[configKey].defects[defectKey]) {
        groupsMap[configKey].defects[defectKey] = {
          defectId: defect.defectId,
          defectName: defect.defectName,
          defectCode: defect.defectCode,
          locations: [],
          minorTotal: 0,
          majorTotal: 0,
          criticalTotal: 0,
          grandTotal: 0
        };
      }

      const defectEntry = groupsMap[configKey].defects[defectKey];

      let rowMinor = 0;
      let rowMajor = 0;
      let rowCritical = 0;
      let rowTotal = 0;

      if (defect.isNoLocation) {
        const status = defect.status?.toLowerCase();
        const qty = defect.qty || 1;

        if (status === "minor") rowMinor += qty;
        else if (status === "major") rowMajor += qty;
        else if (status === "critical") rowCritical += qty;
        rowTotal += qty;

        defectEntry.locations.push({
          display: "No Location",
          qcId: defect.qcUser?.emp_id || null,
          qty: qty
        });
      } else {
        if (defect.locations && defect.locations.length > 0) {
          defect.locations.forEach((loc) => {
            if (loc.positions && loc.positions.length > 0) {
              loc.positions.forEach((pos) => {
                const status = pos.status?.toLowerCase();
                if (status === "minor") rowMinor += 1;
                else if (status === "major") rowMajor += 1;
                else if (status === "critical") rowCritical += 1;
                rowTotal += 1;
              });
            } else {
              rowTotal += loc.qty || 1;
            }

            defectEntry.locations.push({
              display: `${loc.locationName} (${loc.view})`,
              qcId: defect.qcUser?.emp_id || null,
              qty: loc.qty || 1
            });
          });
        }
      }

      defectEntry.minorTotal += rowMinor;
      defectEntry.majorTotal += rowMajor;
      defectEntry.criticalTotal += rowCritical;
      defectEntry.grandTotal += rowTotal;

      grandTotals.minor += rowMinor;
      grandTotals.major += rowMajor;
      grandTotals.critical += rowCritical;
      grandTotals.total += rowTotal;

      if (!allDefectsMap[defectKey]) {
        allDefectsMap[defectKey] = {
          defectId: defect.defectId,
          defectName: defect.defectName,
          defectCode: defect.defectCode,
          minor: 0,
          major: 0,
          critical: 0,
          total: 0
        };
      }

      allDefectsMap[defectKey].minor += rowMinor;
      allDefectsMap[defectKey].major += rowMajor;
      allDefectsMap[defectKey].critical += rowCritical;
      allDefectsMap[defectKey].total += rowTotal;
    });

    const groups = Object.values(groupsMap).map((group) => {
      const sortedDefects = Object.values(group.defects).sort((a, b) => {
        const codeA = parseFloat(a.defectCode) || 0;
        const codeB = parseFloat(b.defectCode) || 0;
        return codeA - codeB;
      });

      let totalRows = 0;
      sortedDefects.forEach((d) => {
        totalRows += d.locations.length;
      });

      return { ...group, defects: sortedDefects, totalRowsInConfig: totalRows };
    });

    const defectsList = Object.values(allDefectsMap).sort((a, b) => {
      const codeA = parseFloat(a.defectCode) || 0;
      const codeB = parseFloat(b.defectCode) || 0;
      return codeA - codeB;
    });

    return {
      groups,
      totals: grandTotals,
      uniqueDefects: uniqueDefectsSet.size,
      defectsList
    };
  }, [savedDefects, activeGroup]);
};

/**
 * Hook to fetch and calculate AQL results
 */
export const useAqlData = (isAQLMethod, determinedBuyer, inspectedQty) => {
  const [aqlConfigs, setAqlConfigs] = useState([]);
  const [loadingAql, setLoadingAql] = useState(false);

  useEffect(() => {
    if (!isAQLMethod || !determinedBuyer || determinedBuyer === "Unknown") {
      setAqlConfigs([]);
      return;
    }

    const fetchAqlConfig = async () => {
      setLoadingAql(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/aql-config?buyer=${determinedBuyer}`
        );
        if (res.data.success) {
          setAqlConfigs(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching AQL config:", err);
        setAqlConfigs([]);
      } finally {
        setLoadingAql(false);
      }
    };

    fetchAqlConfig();
  }, [isAQLMethod, determinedBuyer]);

  const aqlSampleData = useMemo(() => {
    if (!aqlConfigs || aqlConfigs.length === 0 || !inspectedQty) {
      return { minor: null, major: null, critical: null, baseConfig: null };
    }

    const findMatchingSample = (config) => {
      if (!config?.SampleData) return null;
      return config.SampleData.find(
        (sample) => inspectedQty >= sample.Min && inspectedQty <= sample.Max
      );
    };

    const minorConfig = aqlConfigs.find((c) => c.Status === "Minor");
    const majorConfig = aqlConfigs.find((c) => c.Status === "Major");
    const criticalConfig = aqlConfigs.find((c) => c.Status === "Critical");

    return {
      minor: findMatchingSample(minorConfig),
      major: findMatchingSample(majorConfig),
      critical: findMatchingSample(criticalConfig),
      minorConfig,
      majorConfig,
      criticalConfig,
      baseConfig: minorConfig || majorConfig || criticalConfig
    };
  }, [aqlConfigs, inspectedQty]);

  return { aqlConfigs, aqlSampleData, loadingAql };
};

/**
 * Calculate AQL result from sample data and defect totals
 */
export const calculateAqlResult = (aqlSampleData, defectTotals) => {
  if (!aqlSampleData?.baseConfig) return null;

  const {
    minor: minorSample,
    major: majorSample,
    critical: criticalSample
  } = aqlSampleData;
  const {
    minor: minorCount,
    major: majorCount,
    critical: criticalCount
  } = defectTotals;

  const getStatus = (count, sample) => {
    if (!sample || sample.Ac === null || sample.Ac === undefined) {
      return { status: "N/A", reason: "No AQL config" };
    }
    const ac = parseInt(sample.Ac);
    const re = parseInt(sample.Re);
    if (count <= ac) {
      return { status: "PASS", reason: `${count} ≤ ${ac} (Ac)` };
    } else {
      return { status: "FAIL", reason: `${count} ≥ ${re} (Re)` };
    }
  };

  const minorResult = getStatus(minorCount, minorSample);
  const majorResult = getStatus(majorCount, majorSample);
  const criticalResult = getStatus(criticalCount, criticalSample);

  const hasAnyFail =
    minorResult.status === "FAIL" ||
    majorResult.status === "FAIL" ||
    criticalResult.status === "FAIL";

  return {
    minor: {
      ...minorResult,
      count: minorCount,
      ac: minorSample?.Ac,
      re: minorSample?.Re
    },
    major: {
      ...majorResult,
      count: majorCount,
      ac: majorSample?.Ac,
      re: majorSample?.Re
    },
    critical: {
      ...criticalResult,
      count: criticalCount,
      ac: criticalSample?.Ac,
      re: criticalSample?.Re
    },
    final: hasAnyFail ? "FAIL" : "PASS",
    sampleSize: minorSample?.SampleSize || majorSample?.SampleSize || 0,
    batch: minorSample?.BatchName || majorSample?.BatchName || "N/A",
    sampleLetter:
      minorSample?.SampleLetter || majorSample?.SampleLetter || "N/A"
  };
};

// ============================================================================
// EXPORTED COMPONENTS
// ============================================================================

/**
 * AQL Configuration Cards
 */
export const AQLConfigCards = ({ aqlSampleData, aqlResult, inspectedQty }) => (
  <div className="space-y-3">
    {/* Config Row */}
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-center">
        <p className="text-[8px] text-gray-500 uppercase font-medium">Type</p>
        <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200">
          {aqlSampleData.baseConfig?.InspectionType || "N/A"}
        </p>
      </div>
      <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-center">
        <p className="text-[8px] text-gray-500 uppercase font-medium">Level</p>
        <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200">
          {aqlSampleData.baseConfig?.Level || "N/A"}
        </p>
      </div>
      <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-center">
        <p className="text-[8px] text-purple-600 uppercase font-medium">
          Batch
        </p>
        <p className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
          {aqlResult?.batch || "N/A"}
        </p>
      </div>
      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-center">
        <p className="text-[8px] text-emerald-600 uppercase font-medium">
          Letter
        </p>
        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
          {aqlResult?.sampleLetter || "N/A"}
        </p>
      </div>
      <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg text-center">
        <p className="text-[8px] text-cyan-600 uppercase font-medium">Sample</p>
        <p className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
          {aqlResult?.sampleSize || 0}
        </p>
      </div>
      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-center">
        <p className="text-[8px] text-indigo-600 uppercase font-medium">
          Inspected
        </p>
        <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
          {inspectedQty}
        </p>
      </div>
    </div>

    {/* AQL Levels */}
    <div className="grid grid-cols-3 gap-2">
      <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-center border border-green-200 dark:border-green-800">
        <p className="text-[8px] text-green-600 uppercase font-medium">
          Minor AQL
        </p>
        <p className="text-xs font-bold text-green-700 dark:text-green-300">
          {aqlSampleData.minorConfig?.AQLLevel || "N/A"}
        </p>
      </div>
      <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-center border border-orange-200 dark:border-orange-800">
        <p className="text-[8px] text-orange-600 uppercase font-medium">
          Major AQL
        </p>
        <p className="text-xs font-bold text-orange-700 dark:text-orange-300">
          {aqlSampleData.majorConfig?.AQLLevel || "N/A"}
        </p>
      </div>
      <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-center border border-red-200 dark:border-red-800">
        <p className="text-[8px] text-red-600 uppercase font-medium">
          Critical AQL
        </p>
        <p className="text-xs font-bold text-red-700 dark:text-red-300">
          {aqlSampleData.criticalConfig?.AQLLevel || "N/A"}
        </p>
      </div>
    </div>
  </div>
);

/**
 * AQL Result Table Component
 */
export const AQLResultTable = ({ defectsList, totals, aqlResult }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs border-collapse min-w-[500px]">
      <thead>
        <tr className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider">
            Defect Name
          </th>
          <th className="px-2 py-2 text-center text-[10px] font-bold uppercase w-[60px] bg-green-600/80">
            Minor
          </th>
          <th className="px-2 py-2 text-center text-[10px] font-bold uppercase w-[60px] bg-orange-600/80">
            Major
          </th>
          <th className="px-2 py-2 text-center text-[10px] font-bold uppercase w-[60px] bg-red-600/80">
            Critical
          </th>
          <th className="px-2 py-2 text-center text-[10px] font-bold uppercase w-[60px]">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {defectsList.map((defect, idx) => (
          <tr
            key={defect.defectId || idx}
            className={`border-b border-gray-200 dark:border-gray-700 ${
              idx % 2 === 0
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-800/50"
            }`}
          >
            <td className="px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">
                  {defect.defectCode}
                </span>
                <span className="text-[10px] font-medium text-gray-800 dark:text-gray-200 truncate">
                  {defect.defectName}
                </span>
              </div>
            </td>
            <td className="px-2 py-2 text-center">
              {defect.minor > 0 ? (
                <span className="font-bold text-green-700 dark:text-green-400">
                  {defect.minor}
                </span>
              ) : (
                <span className="text-gray-300">-</span>
              )}
            </td>
            <td className="px-2 py-2 text-center">
              {defect.major > 0 ? (
                <span className="font-bold text-orange-700 dark:text-orange-400">
                  {defect.major}
                </span>
              ) : (
                <span className="text-gray-300">-</span>
              )}
            </td>
            <td className="px-2 py-2 text-center">
              {defect.critical > 0 ? (
                <span className="font-bold text-red-700 dark:text-red-400">
                  {defect.critical}
                </span>
              ) : (
                <span className="text-gray-300">-</span>
              )}
            </td>
            <td className="px-2 py-2 text-center font-bold text-gray-800 dark:text-gray-200">
              {defect.total}
            </td>
          </tr>
        ))}

        {defectsList.length === 0 && (
          <tr>
            <td
              colSpan={5}
              className="px-3 py-6 text-center text-gray-400 text-xs"
            >
              No defects recorded
            </td>
          </tr>
        )}

        {/* Totals */}
        <tr className="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-gray-300 dark:border-gray-600">
          <td className="px-3 py-2 text-right text-[10px] uppercase text-gray-600">
            Total
          </td>
          <td className="px-2 py-2 text-center text-green-700 dark:text-green-400">
            {totals.minor}
          </td>
          <td className="px-2 py-2 text-center text-orange-700 dark:text-orange-400">
            {totals.major}
          </td>
          <td className="px-2 py-2 text-center text-red-700 dark:text-red-400">
            {totals.critical}
          </td>
          <td className="px-2 py-2 text-center text-indigo-700 dark:text-indigo-400">
            {totals.total}
          </td>
        </tr>

        {/* Ac/Re */}
        {aqlResult && (
          <tr className="bg-gray-200 dark:bg-gray-800 text-[10px]">
            <td className="px-3 py-1.5 text-right font-medium text-gray-500">
              Ac / Re
            </td>
            <td className="px-2 py-1.5 text-center text-green-600">
              {aqlResult.minor.ac ?? "—"} / {aqlResult.minor.re ?? "—"}
            </td>
            <td className="px-2 py-1.5 text-center text-orange-600">
              {aqlResult.major.ac ?? "—"} / {aqlResult.major.re ?? "—"}
            </td>
            <td className="px-2 py-1.5 text-center text-red-600">
              {aqlResult.critical.ac ?? "—"} / {aqlResult.critical.re ?? "—"}
            </td>
            <td className="px-2 py-1.5 text-center text-gray-400">—</td>
          </tr>
        )}

        {/* Status */}
        {aqlResult && (
          <tr className="bg-gray-100 dark:bg-gray-900">
            <td className="px-3 py-2 text-right font-bold text-[10px] uppercase text-gray-600">
              Status
            </td>
            <td className="px-2 py-2 text-center">
              {aqlResult.minor.status === "PASS" ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded">
                  <ThumbsUp className="w-2.5 h-2.5" /> PASS
                </span>
              ) : aqlResult.minor.status === "FAIL" ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded">
                  <ThumbsDown className="w-2.5 h-2.5" /> FAIL
                </span>
              ) : (
                <span className="text-gray-400 text-[9px]">N/A</span>
              )}
            </td>
            <td className="px-2 py-2 text-center">
              {aqlResult.major.status === "PASS" ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded">
                  <ThumbsUp className="w-2.5 h-2.5" /> PASS
                </span>
              ) : aqlResult.major.status === "FAIL" ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded">
                  <ThumbsDown className="w-2.5 h-2.5" /> FAIL
                </span>
              ) : (
                <span className="text-gray-400 text-[9px]">N/A</span>
              )}
            </td>
            <td className="px-2 py-2 text-center">
              {aqlResult.critical.status === "PASS" ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded">
                  <ThumbsUp className="w-2.5 h-2.5" /> PASS
                </span>
              ) : aqlResult.critical.status === "FAIL" ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded">
                  <ThumbsDown className="w-2.5 h-2.5" /> FAIL
                </span>
              ) : (
                <span className="text-gray-400 text-[9px]">N/A</span>
              )}
            </td>
            <td className="px-2 py-2 text-center text-gray-400">—</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

/**
 * Final Defect Result Banner (Compact)
 */
export const FinalDefectResultBanner = ({ result, compact = false }) => {
  const isPass = result === "PASS";

  if (compact) {
    return (
      <div
        className={`p-3 rounded-lg border ${
          isPass
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <div
            className={`p-1.5 rounded-full ${
              isPass ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {isPass ? (
              <Award className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div className="text-center">
            <p className="text-[9px] font-medium text-gray-500 uppercase">
              Final Defect Result
            </p>
            <p
              className={`text-lg font-black ${
                isPass ? "text-green-600" : "text-red-600"
              }`}
            >
              {result}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-xl border-2 ${
        isPass
          ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700"
          : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-300 dark:border-red-700"
      }`}
    >
      <div className="flex items-center justify-center gap-3">
        <div
          className={`p-2.5 rounded-full ${
            isPass ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {isPass ? (
            <Award className="w-6 h-6 text-green-600" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600" />
          )}
        </div>
        <div className="text-center">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            Final Defect Result
          </p>
          <p
            className={`text-2xl font-black ${
              isPass ? "text-green-600" : "text-red-600"
            }`}
          >
            {result}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Defect Summary Table by Configuration
 */
export const DefectSummaryTable = ({ groups, totals }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs border-collapse min-w-[700px]">
      <thead>
        <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
          <th className="px-3 py-2 text-left font-bold text-[10px] text-gray-600 dark:text-gray-300 uppercase border-r border-gray-200 dark:border-gray-600 min-w-[120px]">
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3" /> Config
            </div>
          </th>
          <th className="px-3 py-2 text-left font-bold text-[10px] text-gray-600 dark:text-gray-300 uppercase border-r border-gray-200 dark:border-gray-600 min-w-[140px]">
            Defect
          </th>
          <th className="px-3 py-2 text-left font-bold text-[10px] text-gray-600 dark:text-gray-300 uppercase border-r border-gray-200 dark:border-gray-600 min-w-[150px]">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Location
            </div>
          </th>
          <th className="px-2 py-2 text-center font-bold text-[10px] uppercase border-r border-gray-200 dark:border-gray-600 w-[55px] bg-green-100 dark:bg-green-900/30 text-green-700">
            Minor
          </th>
          <th className="px-2 py-2 text-center font-bold text-[10px] uppercase border-r border-gray-200 dark:border-gray-600 w-[55px] bg-orange-100 dark:bg-orange-900/30 text-orange-700">
            Major
          </th>
          <th className="px-2 py-2 text-center font-bold text-[10px] uppercase border-r border-gray-200 dark:border-gray-600 w-[55px] bg-red-100 dark:bg-red-900/30 text-red-700">
            Critical
          </th>
          <th className="px-2 py-2 text-center font-bold text-[10px] text-indigo-700 uppercase w-[55px] bg-indigo-100 dark:bg-indigo-900/30">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group, groupIndex) => {
          let groupRenderIndex = 0;

          return group.defects.map((defect) => {
            const defectLocationRows = defect.locations.length;

            return defect.locations.map((loc, locIndex) => {
              const isFirstGroupRow = groupRenderIndex === 0;
              const isFirstDefectRow = locIndex === 0;
              groupRenderIndex++;

              return (
                <tr
                  key={`${group.configKey}-${defect.defectId}-${locIndex}`}
                  className={`border-b border-gray-100 dark:border-gray-700/50 ${
                    group.isActive
                      ? "bg-green-50/50 dark:bg-green-900/10"
                      : groupIndex % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50/50 dark:bg-gray-800/50"
                  }`}
                >
                  {isFirstGroupRow && (
                    <td
                      rowSpan={group.totalRowsInConfig}
                      className={`px-3 py-2 align-top border-r border-gray-200 dark:border-gray-700 ${
                        group.isActive
                          ? "bg-green-100/50"
                          : "bg-gray-50 dark:bg-gray-900/30"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-start gap-1.5">
                          <Layers
                            className={`w-3 h-3 mt-0.5 ${
                              group.isActive
                                ? "text-green-500"
                                : "text-gray-400"
                            }`}
                          />
                          <div className="min-w-0 text-[10px]">
                            {group.lineName && (
                              <p className="font-semibold">
                                Line {group.lineName}
                              </p>
                            )}
                            {group.tableName && (
                              <p className="font-semibold">
                                Table {group.tableName}
                              </p>
                            )}
                            {group.colorName && (
                              <p className="font-semibold">{group.colorName}</p>
                            )}
                          </div>
                        </div>
                        {group.isActive && (
                          <span className="inline-flex px-1.5 py-0.5 bg-green-500 text-white text-[7px] font-bold rounded uppercase">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {isFirstDefectRow && (
                    <td
                      rowSpan={defectLocationRows}
                      className="px-3 py-2 align-top border-r border-gray-100 dark:border-gray-700/50"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] bg-gray-200 dark:bg-gray-700 px-1 rounded">
                          {defect.defectCode}
                        </span>
                        <span className="text-[10px] font-medium text-gray-800 dark:text-gray-200">
                          {defect.defectName}
                        </span>
                      </div>
                    </td>
                  )}

                  <td className="px-3 py-1.5 border-r border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        className={
                          loc.display === "No Location"
                            ? "text-gray-400 italic"
                            : "font-medium"
                        }
                      >
                        {loc.display}
                      </span>
                      {loc.qcId && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-mono bg-blue-50 text-blue-600 px-1 rounded">
                          <User className="w-2.5 h-2.5" />
                          {loc.qcId}
                        </span>
                      )}
                    </div>
                  </td>

                  {isFirstDefectRow && (
                    <>
                      <td
                        rowSpan={defectLocationRows}
                        className="px-2 py-2 text-center align-top border-r border-gray-100"
                      >
                        {defect.minorTotal > 0 ? (
                          <span className="font-bold text-green-700">
                            {defect.minorTotal}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td
                        rowSpan={defectLocationRows}
                        className="px-2 py-2 text-center align-top border-r border-gray-100"
                      >
                        {defect.majorTotal > 0 ? (
                          <span className="font-bold text-orange-700">
                            {defect.majorTotal}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td
                        rowSpan={defectLocationRows}
                        className="px-2 py-2 text-center align-top border-r border-gray-100"
                      >
                        {defect.criticalTotal > 0 ? (
                          <span className="font-bold text-red-700">
                            {defect.criticalTotal}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td
                        rowSpan={defectLocationRows}
                        className="px-2 py-2 text-center align-top"
                      >
                        <span className="font-bold text-indigo-700">
                          {defect.grandTotal}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              );
            });
          });
        })}

        {/* Grand Total */}
        <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
          <td
            colSpan={3}
            className="px-3 py-2.5 text-right font-bold text-[10px] uppercase border-r border-gray-600"
          >
            <div className="flex items-center justify-end gap-1">
              <TrendingUp className="w-3 h-3" /> Grand Total
            </div>
          </td>
          <td className="px-2 py-2.5 text-center border-r border-gray-600">
            {totals.minor > 0 ? (
              <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 bg-green-500 text-white font-bold text-xs rounded">
                {totals.minor}
              </span>
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </td>
          <td className="px-2 py-2.5 text-center border-r border-gray-600">
            {totals.major > 0 ? (
              <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 bg-orange-500 text-white font-bold text-xs rounded">
                {totals.major}
              </span>
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </td>
          <td className="px-2 py-2.5 text-center border-r border-gray-600">
            {totals.critical > 0 ? (
              <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 bg-red-500 text-white font-bold text-xs rounded">
                {totals.critical}
              </span>
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </td>
          <td className="px-2 py-2.5 text-center">
            <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 bg-white text-indigo-700 font-black text-sm rounded">
              {totals.total}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

// ============================================================================
// MAIN COMPONENT (Original, uses internal logic)
// ============================================================================
const YPivotQAInspectionDefectSummary = ({
  savedDefects = [],
  activeGroup = null,
  reportData = null,
  selectedOrders = []
}) => {
  const isAQLMethod = useMemo(() => {
    return reportData?.selectedTemplate?.InspectedQtyMethod === "AQL";
  }, [reportData?.selectedTemplate]);

  const determinedBuyer = useMemo(() => {
    if (!selectedOrders || selectedOrders.length === 0) return "Unknown";
    return determineBuyerFromOrderNo(selectedOrders[0]).buyer;
  }, [selectedOrders]);

  const inspectedQty = useMemo(() => {
    return parseInt(reportData?.config?.inspectedQty) || 0;
  }, [reportData?.config?.inspectedQty]);

  const summaryData = useDefectSummaryData(savedDefects, activeGroup);
  const { aqlSampleData, loadingAql } = useAqlData(
    isAQLMethod,
    determinedBuyer,
    inspectedQty
  );
  const aqlResult = useMemo(
    () => calculateAqlResult(aqlSampleData, summaryData.totals),
    [aqlSampleData, summaryData.totals]
  );

  if (!savedDefects || savedDefects.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <FileSpreadsheet className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-bold text-gray-600 dark:text-gray-300">
            No Defects Recorded
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Add defects from the "Select Defects" tab to see the summary.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-4 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Defect Summary</h2>
              <p className="text-[10px] text-slate-400">
                {summaryData.groups.length} config(s) •{" "}
                {summaryData.uniqueDefects} defect(s)
              </p>
            </div>
          </div>
          <div className="text-center px-3 py-1.5 bg-white/10 rounded-lg">
            <p className="text-xl font-black">{summaryData.totals.total}</p>
            <p className="text-[8px] uppercase opacity-70">Total</p>
          </div>
        </div>
      </div>

      {/* Config Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Layers className="w-4 h-4" /> Defect Summary by Configuration
          </h3>
        </div>
        <DefectSummaryTable
          groups={summaryData.groups}
          totals={summaryData.totals}
        />
      </div>

      {/* AQL Section */}
      {isAQLMethod && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" /> Report: Defect Result (AQL)
            </h3>
          </div>

          <div className="p-4 space-y-4">
            {loadingAql ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : aqlResult ? (
              <>
                <AQLConfigCards
                  aqlSampleData={aqlSampleData}
                  aqlResult={aqlResult}
                  inspectedQty={inspectedQty}
                />
                <AQLResultTable
                  defectsList={summaryData.defectsList}
                  totals={summaryData.totals}
                  aqlResult={aqlResult}
                />
                <FinalDefectResultBanner result={aqlResult.final} />
              </>
            ) : (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-amber-700">
                  AQL Configuration Not Available
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Please ensure inspected qty is entered and AQL config is set
                  for: {determinedBuyer}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionDefectSummary;
