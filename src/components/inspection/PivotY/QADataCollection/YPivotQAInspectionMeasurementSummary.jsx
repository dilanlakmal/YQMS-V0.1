// import React, { useMemo } from "react";
// import { Star, Layers, Lock, Target } from "lucide-react";
// import { checkTolerance } from "../QATemplates/YPivotQATemplatesHelpers";

// const YPivotQAInspectionMeasurementSummary = ({
//   savedMeasurements,
//   specsData,
//   selectedSpecsList,
//   activeGroup
// }) => {
//   // Group measurements by groupId (Session Context)
//   const groupedMeasurements = useMemo(() => {
//     const groups = {};
//     const noContext = [];

//     savedMeasurements.forEach((m) => {
//       if (m.groupId) {
//         if (!groups[m.groupId]) {
//           groups[m.groupId] = {
//             id: m.groupId,
//             line: m.line,
//             table: m.table,
//             color: m.color,
//             lineName: m.lineName || m.line,
//             tableName: m.tableName || m.table,
//             colorName: m.colorName || m.color,
//             qcUser: m.qcUser,
//             measurements: []
//           };
//         }
//         groups[m.groupId].measurements.push(m);
//       } else {
//         noContext.push(m);
//       }
//     });

//     return { groups: Object.values(groups), noContext };
//   }, [savedMeasurements]);

//   if (!savedMeasurements || savedMeasurements.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center py-16 px-4">
//         <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
//         <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">
//           No Measurements Yet
//         </h3>
//         <p className="text-sm text-gray-500 dark:text-gray-500 text-center max-w-md">
//           Complete measurement entries from the Specs tab to see summary here.
//         </p>
//       </div>
//     );
//   }

//   // Helper to check if a spec is critical
//   const isCriticalSpec = (specId) => {
//     if (!selectedSpecsList || selectedSpecsList.length === 0) return false;
//     return selectedSpecsList.some((s) => s.id === specId);
//   };

//   // Render table for a group of measurements
//   const renderSummaryTable = (
//     measurements,
//     title,
//     showOnlyCritical = false
//   ) => {
//     // Get all unique specs from measurements
//     const allSpecIds = new Set();
//     measurements.forEach((m) => {
//       if (m.measurements) {
//         Object.keys(m.measurements).forEach((specId) => {
//           allSpecIds.add(specId);
//         });
//       }
//     });

//     // Filter specs based on showOnlyCritical
//     let filteredSpecs = specsData.filter((spec) => allSpecIds.has(spec.id));
//     if (showOnlyCritical) {
//       filteredSpecs = filteredSpecs.filter((spec) => isCriticalSpec(spec.id));
//     }

//     if (filteredSpecs.length === 0) {
//       return (
//         <div className="text-center py-8 text-gray-400 text-sm italic">
//           No {showOnlyCritical ? "critical" : ""} measurements found
//         </div>
//       );
//     }

//     // Sort measurements by size for consistent display
//     const sortedMeasurements = [...measurements].sort((a, b) =>
//       a.size.localeCompare(b.size)
//     );

//     return (
//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
//           <thead>
//             {/* Size Header Row */}
//             <tr className="bg-gray-100 dark:bg-gray-800">
//               <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-100 dark:bg-gray-800 z-10 min-w-[200px]">
//                 {title}
//               </th>
//               {sortedMeasurements.map((m, idx) => {
//                 const pcsCount = Array.isArray(m.selectedPcs)
//                   ? m.selectedPcs.length
//                   : m.selectedPcs === "ALL"
//                   ? m.qty
//                   : 1;

//                 return (
//                   <th
//                     key={idx}
//                     colSpan={pcsCount}
//                     className="border border-gray-300 dark:border-gray-600 p-2 text-center bg-indigo-50 dark:bg-indigo-900/30"
//                   >
//                     <div className="font-bold text-sm text-gray-800 dark:text-gray-200">
//                       Size: {m.size}
//                     </div>
//                     {m.kValue && (
//                       <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
//                         K: {m.kValue}
//                       </div>
//                     )}
//                     <div className="text-[9px] text-gray-400 mt-0.5">
//                       {m.displayMode === "selected" ? "Critical" : "All Points"}
//                     </div>
//                   </th>
//                 );
//               })}
//             </tr>
//             {/* Pcs Sub-Header Row */}
//             <tr className="bg-gray-50 dark:bg-gray-700">
//               <th className="border border-gray-300 dark:border-gray-600 p-2 text-xs text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
//                 Measurement Point
//               </th>
//               {sortedMeasurements.map((m, mIdx) => {
//                 const pcsIndices = Array.isArray(m.selectedPcs)
//                   ? m.selectedPcs
//                   : m.selectedPcs === "ALL"
//                   ? Array.from({ length: m.qty }, (_, i) => i)
//                   : [0];

//                 return pcsIndices.map((pcsIdx) => (
//                   <th
//                     key={`${mIdx}-${pcsIdx}`}
//                     className="border border-gray-300 dark:border-gray-600 p-1 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 min-w-[60px]"
//                   >
//                     Pcs #{pcsIdx + 1}
//                   </th>
//                 ));
//               })}
//             </tr>
//           </thead>
//           <tbody>
//             {filteredSpecs.map((spec) => {
//               const isCritical = isCriticalSpec(spec.id);

//               return (
//                 <tr
//                   key={spec.id}
//                   className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
//                 >
//                   {/* Measurement Point Name */}
//                   <td
//                     className={`border border-gray-300 dark:border-gray-600 p-2 sticky left-0 z-10 ${
//                       isCritical && !showOnlyCritical
//                         ? "bg-blue-50 dark:bg-blue-900/30"
//                         : "bg-white dark:bg-gray-900"
//                     }`}
//                   >
//                     <div className="flex items-center gap-2">
//                       {isCritical && !showOnlyCritical && (
//                         <Star className="w-3 h-3 text-blue-500 fill-current flex-shrink-0" />
//                       )}
//                       <div className="min-w-0">
//                         <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
//                           {spec.MeasurementPointEngName}
//                         </div>
//                         {spec.MeasurementPointChiName && (
//                           <div className="text-[10px] text-gray-400 truncate">
//                             {spec.MeasurementPointChiName}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                     {isCritical && !showOnlyCritical && (
//                       <span className="inline-block mt-1 text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
//                         CRITICAL
//                       </span>
//                     )}
//                   </td>

//                   {/* Measurement Values */}
//                   {sortedMeasurements.map((m, mIdx) => {
//                     const pcsIndices = Array.isArray(m.selectedPcs)
//                       ? m.selectedPcs
//                       : m.selectedPcs === "ALL"
//                       ? Array.from({ length: m.qty }, (_, i) => i)
//                       : [0];

//                     return pcsIndices.map((pcsIdx) => {
//                       const measurement = m.measurements?.[spec.id]?.[pcsIdx];
//                       const value = measurement?.decimal || 0;
//                       const displayValue = measurement?.fraction || "0";

//                       // Check tolerance
//                       const toleranceResult = checkTolerance(
//                         spec,
//                         value,
//                         m.size
//                       );

//                       let bgColor = "bg-gray-50 dark:bg-gray-800";
//                       let textColor = "text-gray-400";

//                       if (!toleranceResult.isDefault) {
//                         if (toleranceResult.isWithin) {
//                           bgColor = "bg-green-100 dark:bg-green-900/40";
//                           textColor = "text-green-700 dark:text-green-300";
//                         } else {
//                           bgColor = "bg-red-100 dark:bg-red-900/40";
//                           textColor = "text-red-700 dark:text-red-300";
//                         }
//                       }

//                       return (
//                         <td
//                           key={`${mIdx}-${pcsIdx}`}
//                           className={`border border-gray-300 dark:border-gray-600 p-1 text-center ${bgColor}`}
//                         >
//                           <span
//                             className={`text-xs font-mono font-bold ${textColor}`}
//                           >
//                             {displayValue}
//                           </span>
//                         </td>
//                       );
//                     });
//                   })}
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   return (
//     <div className="p-4 space-y-8 max-w-full mx-auto">
//       {/* Render for each group */}
//       {groupedMeasurements.groups.map((group) => {
//         const isGroupActive = activeGroup && activeGroup.id === group.id;

//         const headerParts = [
//           group.lineName ? `Line ${group.lineName}` : null,
//           group.tableName ? `Table ${group.tableName}` : null,
//           group.colorName ? `Color ${group.colorName}` : null
//         ].filter(Boolean);

//         const headerLabel =
//           headerParts.length > 0
//             ? headerParts.join(" / ")
//             : "Inspection Session";

//         return (
//           <div key={group.id} className="space-y-6">
//             {/* Group Header */}
//             <div
//               className={`flex items-center gap-3 pb-2 border-b-2 ${
//                 isGroupActive
//                   ? "border-green-500"
//                   : "border-gray-200 dark:border-gray-700"
//               }`}
//             >
//               <div
//                 className={`p-2 rounded-lg ${
//                   isGroupActive
//                     ? "bg-green-100 text-green-600"
//                     : "bg-gray-100 text-gray-500"
//                 }`}
//               >
//                 <Layers className="w-5 h-5" />
//               </div>
//               <div>
//                 <h4
//                   className={`text-sm font-bold ${
//                     isGroupActive
//                       ? "text-green-700 dark:text-green-400"
//                       : "text-gray-600 dark:text-gray-300"
//                   }`}
//                 >
//                   {headerLabel}
//                 </h4>
//                 {group.qcUser && (
//                   <p className="text-xs text-gray-500">
//                     QC: {group.qcUser.eng_name}
//                   </p>
//                 )}
//               </div>
//               {isGroupActive ? (
//                 <span className="ml-auto text-xs bg-green-500 text-white px-2 py-1 rounded font-bold">
//                   Active Session
//                 </span>
//               ) : (
//                 <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold flex items-center gap-1">
//                   <Lock className="w-3 h-3" /> Locked
//                 </span>
//               )}
//             </div>

//             {/* Critical Point Summary */}
//             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
//               <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
//                 <h3 className="text-white font-bold text-lg flex items-center gap-2">
//                   <Star className="w-5 h-5 fill-current" />
//                   Critical Point Summary
//                 </h3>
//                 <p className="text-blue-100 text-xs mt-1">
//                   Selected critical measurement points only
//                 </p>
//               </div>
//               <div className="p-4">
//                 {renderSummaryTable(
//                   group.measurements,
//                   "Critical Points",
//                   true
//                 )}
//               </div>
//             </div>

//             {/* All Point Summary */}
//             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
//               <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
//                 <h3 className="text-white font-bold text-lg flex items-center gap-2">
//                   <Target className="w-5 h-5" />
//                   All Point Summary
//                 </h3>
//                 <p className="text-purple-100 text-xs mt-1">
//                   All measurement points (Critical points are highlighted)
//                 </p>
//               </div>
//               <div className="p-4">
//                 {renderSummaryTable(group.measurements, "All Points", false)}
//               </div>
//             </div>
//           </div>
//         );
//       })}

//       {/* Render Legacy / No Context Measurements */}
//       {groupedMeasurements.noContext.length > 0 && (
//         <div className="space-y-6">
//           <div className="flex items-center gap-3 pb-2 border-b-2 border-gray-200 dark:border-gray-700">
//             <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
//               <Layers className="w-5 h-5" />
//             </div>
//             <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300">
//               General Measurements (No Context)
//             </h4>
//           </div>

//           {/* Critical Point Summary */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
//             <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
//               <h3 className="text-white font-bold text-lg flex items-center gap-2">
//                 <Star className="w-5 h-5 fill-current" />
//                 Critical Point Summary
//               </h3>
//               <p className="text-blue-100 text-xs mt-1">
//                 Selected critical measurement points only
//               </p>
//             </div>
//             <div className="p-4">
//               {renderSummaryTable(
//                 groupedMeasurements.noContext,
//                 "Critical Points",
//                 true
//               )}
//             </div>
//           </div>

//           {/* All Point Summary */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
//             <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
//               <h3 className="text-white font-bold text-lg flex items-center gap-2">
//                 <Target className="w-5 h-5" />
//                 All Point Summary
//               </h3>
//               <p className="text-purple-100 text-xs mt-1">
//                 All measurement points (Critical points are highlighted)
//               </p>
//             </div>
//             <div className="p-4">
//               {renderSummaryTable(
//                 groupedMeasurements.noContext,
//                 "All Points",
//                 false
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default YPivotQAInspectionMeasurementSummary;

import React, { useMemo } from "react";
import {
  Star,
  Layers,
  Lock,
  Target,
  CheckCircle2,
  XCircle,
  Info,
  List
} from "lucide-react";
import { checkTolerance } from "../QATemplates/YPivotQATemplatesHelpers";

const YPivotQAInspectionMeasurementSummary = ({
  savedMeasurements,
  specsData,
  selectedSpecsList,
  activeGroup
}) => {
  // Group measurements by groupId (Session Context)
  const groupedMeasurements = useMemo(() => {
    const groups = {};
    const noContext = [];

    savedMeasurements.forEach((m) => {
      if (m.groupId) {
        if (!groups[m.groupId]) {
          groups[m.groupId] = {
            id: m.groupId,
            line: m.line,
            table: m.table,
            color: m.color,
            lineName: m.lineName || m.line,
            tableName: m.tableName || m.table,
            colorName: m.colorName || m.color,
            qcUser: m.qcUser,
            measurements: []
          };
        }
        groups[m.groupId].measurements.push(m);
      } else {
        noContext.push(m);
      }
    });

    return { groups: Object.values(groups), noContext };
  }, [savedMeasurements]);

  // Helper to filter specs by K value
  const getFilteredSpecs = (specs, kValue) => {
    if (kValue) {
      return specs.filter((s) => s.kValue === kValue || s.kValue === "NA");
    }
    return specs;
  };

  // Helper to check if a spec is critical
  const isCriticalSpec = useMemo(() => {
    const criticalIds = new Set((selectedSpecsList || []).map((s) => s.id));
    return (specId) => criticalIds.has(specId);
  }, [selectedSpecsList]);

  // Build table structure for a group of measurements
  const buildTableData = (measurements) => {
    // Sort measurements by size for consistent display
    const sortedMeasurements = [...measurements].sort((a, b) => {
      const sizeA = a.size || "";
      const sizeB = b.size || "";
      return sizeA.localeCompare(sizeB, undefined, { numeric: true });
    });

    const tableData = sortedMeasurements.map((m) => {
      const columns = [];

      // Add All mode pcs first
      const allEnabledPcs = m.allEnabledPcs || [];
      allEnabledPcs
        .sort((a, b) => a - b)
        .forEach((pcsIndex) => {
          columns.push({
            pcsIndex: pcsIndex,
            pcsNumber: columns.length + 1,
            isAllMode: true,
            measurements: m.allMeasurements || {}
          });
        });

      // Add Critical mode pcs
      const criticalEnabledPcs = m.criticalEnabledPcs || [];
      criticalEnabledPcs
        .sort((a, b) => a - b)
        .forEach((pcsIndex) => {
          columns.push({
            pcsIndex: pcsIndex,
            pcsNumber: columns.length + 1,
            isAllMode: false,
            measurements: m.criticalMeasurements || {}
          });
        });

      return {
        size: m.size,
        kValue: m.kValue,
        columns: columns
      };
    });

    return tableData;
  };

  // Calculate summary stats for a group
  const calculateGroupStats = (measurements) => {
    let totalPoints = 0;
    let passPoints = 0;
    let failPoints = 0;
    let totalPcs = 0;
    let passPcs = 0;
    let failPcs = 0;

    measurements.forEach((m) => {
      // All mode stats
      const allEnabledPcs = m.allEnabledPcs || [];
      allEnabledPcs.forEach((pcsIndex) => {
        totalPcs++;
        let pcsHasFail = false;

        const filteredAllSpecs = getFilteredSpecs(specsData, m.kValue);
        filteredAllSpecs.forEach((spec) => {
          totalPoints++;
          const val = m.allMeasurements?.[spec.id]?.[pcsIndex];

          // specsData.forEach((spec) => {
          //   totalPoints++;
          //   const val = m.allMeasurements?.[spec.id]?.[pcsIndex];
          const value = val?.decimal || 0;

          if (value === 0) {
            passPoints++;
          } else {
            const toleranceResult = checkTolerance(spec, value, m.size);
            if (toleranceResult.isWithin || toleranceResult.isDefault) {
              passPoints++;
            } else {
              failPoints++;
              pcsHasFail = true;
            }
          }
        });

        if (pcsHasFail) failPcs++;
        else passPcs++;
      });

      // Critical mode stats
      const criticalEnabledPcs = m.criticalEnabledPcs || [];
      criticalEnabledPcs.forEach((pcsIndex) => {
        totalPcs++;
        let pcsHasFail = false;

        const filteredCriticalSpecs = getFilteredSpecs(
          selectedSpecsList,
          m.kValue
        );
        filteredCriticalSpecs.forEach((spec) => {
          // selectedSpecsList.forEach((spec) => {
          totalPoints++;
          const val = m.criticalMeasurements?.[spec.id]?.[pcsIndex];
          const value = val?.decimal || 0;

          if (value === 0) {
            passPoints++;
          } else {
            const toleranceResult = checkTolerance(spec, value, m.size);
            if (toleranceResult.isWithin || toleranceResult.isDefault) {
              passPoints++;
            } else {
              failPoints++;
              pcsHasFail = true;
            }
          }
        });

        if (pcsHasFail) failPcs++;
        else passPcs++;
      });
    });

    return {
      totalPoints,
      passPoints,
      failPoints,
      totalPcs,
      passPcs,
      failPcs,
      pointPassRate:
        totalPoints > 0
          ? ((passPoints / totalPoints) * 100).toFixed(2)
          : "0.00",
      pcsPassRate:
        totalPcs > 0 ? ((passPcs / totalPcs) * 100).toFixed(2) : "0.00"
    };
  };

  // Render the summary table
  const renderSummaryTable = (measurements) => {
    const tableData = buildTableData(measurements);

    if (
      tableData.length === 0 ||
      tableData.every((t) => t.columns.length === 0)
    ) {
      return (
        <div className="text-center py-8 text-gray-400 text-sm italic">
          <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          No measurements recorded yet
        </div>
      );
    }

    // Calculate total columns
    const totalColumns = tableData.reduce(
      (sum, t) => sum + t.columns.length,
      0
    );

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
          <thead>
            {/* Size Header Row */}
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th
                rowSpan={2}
                className="border border-gray-300 dark:border-gray-600 p-2 text-left font-bold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-100 dark:bg-gray-800 z-20 min-w-[160px] sm:min-w-[200px]"
              >
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-gray-500" />
                  <span>Measurement Point</span>
                </div>
              </th>
              {tableData.map(
                (sizeData, sIdx) =>
                  sizeData.columns.length > 0 && (
                    <th
                      key={sIdx}
                      colSpan={sizeData.columns.length}
                      className="border border-gray-300 dark:border-gray-600 p-2 text-center bg-indigo-100 dark:bg-indigo-900/40"
                    >
                      <div className="font-bold text-gray-800 dark:text-gray-200 text-base">
                        {sizeData.size}
                      </div>
                      {sizeData.kValue && (
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
                          K: {sizeData.kValue}
                        </div>
                      )}
                    </th>
                  )
              )}
            </tr>

            {/* Pcs Sub-Header Row */}
            <tr className="bg-gray-50 dark:bg-gray-700">
              {tableData.map((sizeData, sIdx) =>
                sizeData.columns.map((col, cIdx) => (
                  <th
                    key={`${sIdx}-${cIdx}`}
                    className={`border border-gray-300 dark:border-gray-600 p-1.5 text-center min-w-[50px] sm:min-w-[60px] ${
                      col.isAllMode
                        ? "bg-purple-100 dark:bg-purple-900/40"
                        : "bg-amber-100 dark:bg-amber-900/40"
                    }`}
                  >
                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      #{col.pcsNumber}
                    </div>
                    <div
                      className={`text-[9px] font-bold px-1 py-0.5 rounded mt-0.5 inline-block ${
                        col.isAllMode
                          ? "bg-purple-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {col.isAllMode ? "A" : "C"}
                    </div>
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {(() => {
              // Collect all unique K values from the measurements in this table
              const kValuesInMeasurements = new Set(
                measurements.map((m) => m.kValue).filter(Boolean)
              );

              // Filter specs based on K values
              // If we have K values in measurements, only show specs matching those K values (or NA)
              // If no K values (e.g., After Wash), show all specs
              let displaySpecs = specsData;
              if (kValuesInMeasurements.size > 0) {
                displaySpecs = specsData.filter(
                  (s) =>
                    kValuesInMeasurements.has(s.kValue) || s.kValue === "NA"
                );
              }

              return displaySpecs.map((spec, specIdx) => {
                const isCritical = isCriticalSpec(spec.id);

                return (
                  <tr
                    key={spec.id}
                    className={`${
                      isCritical
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : specIdx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800/50"
                    } hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors`}
                  >
                    {/* Measurement Point Name */}
                    <td
                      className={`border border-gray-300 dark:border-gray-600 p-2 sticky left-0 z-10 ${
                        isCritical
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : specIdx % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {isCritical && (
                          <Star className="w-3 h-3 text-blue-500 fill-current flex-shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight"
                            style={{
                              wordBreak: "break-word",
                              hyphens: "auto"
                            }}
                          >
                            {spec.MeasurementPointEngName}
                          </div>
                          {isCritical && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                              <Star className="w-2 h-2 fill-current" />
                              CRITICAL
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Values for each pcs column */}
                    {tableData.map((sizeData, sIdx) =>
                      sizeData.columns.map((col, cIdx) => {
                        // For Critical mode columns, only show value if spec is critical
                        if (!col.isAllMode && !isCritical) {
                          return (
                            <td
                              key={`${sIdx}-${cIdx}`}
                              className="border border-gray-300 dark:border-gray-600 p-1 text-center bg-gray-200 dark:bg-gray-700"
                            >
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                —
                              </span>
                            </td>
                          );
                        }

                        const measurement =
                          col.measurements?.[spec.id]?.[col.pcsIndex];
                        const value = measurement?.decimal || 0;
                        const displayValue = measurement?.fraction || "0";

                        // Check tolerance
                        const toleranceResult = checkTolerance(
                          spec,
                          value,
                          sizeData.size
                        );

                        // Determine pass/fail
                        // 0 (default) = Pass = green background
                        // Within tolerance = Pass = green background
                        // Out of tolerance = Fail = red background
                        let bgColor, textColor, Icon;

                        if (value === 0) {
                          // Default value = Pass
                          bgColor = "bg-green-100 dark:bg-green-900/50";
                          textColor = "text-green-700 dark:text-green-300";
                          Icon = null;
                        } else if (
                          toleranceResult.isDefault ||
                          toleranceResult.isWithin
                        ) {
                          // Within tolerance = Pass
                          bgColor = "bg-green-100 dark:bg-green-900/50";
                          textColor = "text-green-700 dark:text-green-300";
                          Icon = CheckCircle2;
                        } else {
                          // Out of tolerance = Fail
                          bgColor = "bg-red-100 dark:bg-red-900/50";
                          textColor = "text-red-700 dark:text-red-300";
                          Icon = XCircle;
                        }

                        return (
                          <td
                            key={`${sIdx}-${cIdx}`}
                            className={`border border-gray-300 dark:border-gray-600 p-1 text-center ${bgColor}`}
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span
                                className={`text-xs font-mono font-bold ${textColor}`}
                              >
                                {displayValue}
                              </span>
                              {Icon && (
                                <Icon
                                  className={`w-3 h-3 mt-0.5 ${textColor}`}
                                />
                              )}
                            </div>
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    );
  };

  // Render legend
  const renderLegend = () => (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
        Legend:
      </span>
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-5 bg-purple-500 text-white text-[9px] font-bold rounded flex items-center justify-center">
          A
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          All Points
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-5 bg-amber-500 text-white text-[9px] font-bold rounded flex items-center justify-center">
          C
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Critical Only
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Star className="w-4 h-4 text-blue-500 fill-current" />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Critical Point
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-green-100 dark:bg-green-900/50 border border-green-300 rounded"></div>
        <span className="text-xs text-gray-600 dark:text-gray-400">Pass</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-red-100 dark:bg-red-900/50 border border-red-300 rounded"></div>
        <span className="text-xs text-gray-600 dark:text-gray-400">Fail</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400">—</span>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Not Measured
        </span>
      </div>
    </div>
  );

  // Render stats card
  const renderStatsCard = (stats) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300">
          {stats.totalPoints}
        </div>
        <div className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400">
          Total Points
        </div>
      </div>
      <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
        <div className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-300">
          {stats.pointPassRate}%
        </div>
        <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">
          Point Pass Rate
        </div>
      </div>
      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <div className="text-lg sm:text-xl font-bold text-indigo-700 dark:text-indigo-300">
          {stats.totalPcs}
        </div>
        <div className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400">
          Total Pcs
        </div>
      </div>
      <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <div className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-300">
          {stats.pcsPassRate}%
        </div>
        <div className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">
          Pcs Pass Rate
        </div>
      </div>
    </div>
  );

  if (!savedMeasurements || savedMeasurements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">
          No Measurements Yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center max-w-md">
          Complete measurement entries from the Setup & Measure tab to see
          summary here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-6 max-w-full mx-auto">
      {/* Render for each group */}
      {groupedMeasurements.groups.map((group) => {
        const isGroupActive = activeGroup && activeGroup.id === group.id;

        const headerParts = [
          group.lineName ? `Line ${group.lineName}` : null,
          group.tableName ? `Table ${group.tableName}` : null,
          group.colorName ? `Color ${group.colorName}` : null
        ].filter(Boolean);

        const headerLabel =
          headerParts.length > 0
            ? headerParts.join(" / ")
            : "Inspection Session";

        const stats = calculateGroupStats(group.measurements);

        return (
          <div key={group.id} className="space-y-4">
            {/* Group Header */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center gap-3 pb-3 border-b-2 ${
                isGroupActive
                  ? "border-green-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`p-2 rounded-lg ${
                    isGroupActive
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4
                    className={`text-sm font-bold ${
                      isGroupActive
                        ? "text-green-700 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {headerLabel}
                  </h4>
                  {group.qcUser && (
                    <p className="text-xs text-gray-500">
                      QC: {group.qcUser.eng_name}
                    </p>
                  )}
                </div>
              </div>
              {isGroupActive ? (
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded font-bold w-fit">
                  Active Session
                </span>
              ) : (
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded font-bold flex items-center gap-1 w-fit">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>

            {/* Measurement Summary Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Measurement Summary
                </h3>
                <p className="text-white/70 text-xs mt-1">
                  All measurement data for this inspection context
                </p>
              </div>

              <div className="p-3 sm:p-4 space-y-4">
                {/* Stats Cards */}
                {renderStatsCard(stats)}

                {/* Legend */}
                {renderLegend()}

                {/* Table */}
                <div className="mt-4">
                  {renderSummaryTable(group.measurements)}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Render Legacy / No Context Measurements */}
      {groupedMeasurements.noContext.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300">
              General Measurements (No Context)
            </h4>
          </div>

          {/* Measurement Summary Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Measurement Summary
              </h3>
              <p className="text-white/70 text-xs mt-1">
                All measurement data without specific context
              </p>
            </div>

            <div className="p-3 sm:p-4 space-y-4">
              {/* Stats Cards */}
              {renderStatsCard(
                calculateGroupStats(groupedMeasurements.noContext)
              )}

              {/* Legend */}
              {renderLegend()}

              {/* Table */}
              <div className="mt-4">
                {renderSummaryTable(groupedMeasurements.noContext)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YPivotQAInspectionMeasurementSummary;
