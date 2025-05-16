// import React, { useCallback, useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import DefectBox from "./DefectBox"; // Reusing
// import MeasurementNumPad from "./MeasurementNumPad"; // Reusing

// const MeasurementTableModify = ({
//   initialBundleInspectionData, // Array of bundle data for the current size
//   measurementPoints,
//   panelIndexNames,
//   fabricDefectsList,
//   tolerance,
//   onUpdate, // Callback to send the fully updated bundleInspectionData array back
//   garmentType, // Or selectedPanel from parent
//   moNo,
//   activeMeasurementTab,
//   setActiveMeasurementTab,
//   pcsPerLocationInitial, // [{t:5, m:5, b:5}, ...]
// }) => {
//   const { t, i18n } = useTranslation();
//   const [localBundleData, setLocalBundleData] = useState([]);

//   // State for Numpad/DefectBox
//   const [showNumPad, setShowNumPad] = useState(false);
//   const [currentCellForNumPad, setCurrentCellForNumPad] = useState(null); // {bundleIdx, partIdx, mpIdxActual, locTab, valueIdx } - mpIdxActual is index in filtered MP list for rendering
//   const [showDefectBox, setShowDefectBox] = useState(false);
//   const [currentCellForDefectBox, setCurrentCellForDefectBox] = useState(null); // {bundleIdx, partIdx, locTab, pcsNameIdx }

//   useEffect(() => {
//     // Deep copy initial data to local state for editing
//     // Also, ensure the structure for measurementPointsData and fabricDefects is initialized if missing
//     const structuredData = initialBundleInspectionData.map(
//       (bundle, bundleIdx) => {
//         const newBundle = JSON.parse(JSON.stringify(bundle));
//         newBundle.measurementInsepctionData = (
//           newBundle.measurementInsepctionData || []
//         ).map((part) => {
//           const newPart = { ...part };
//           if (!newPart.measurementPointsData)
//             newPart.measurementPointsData = [];
//           if (!newPart.fabricDefects) {
//             newPart.fabricDefects = [
//               { location: "Top", defectData: [] },
//               { location: "Middle", defectData: [] },
//               { location: "Bottom", defectData: [] },
//             ];
//           }
//           // Further initialization for measurementValues within measurementPointsData can be done here
//           // based on measurementPoints prop and pcsPerLocationInitial if needed.
//           // This part is complex for full pre-initialization.
//           return newPart;
//         });
//         return newBundle;
//       }
//     );
//     setLocalBundleData(structuredData);
//   }, [
//     initialBundleInspectionData,
//     measurementPoints,
//     pcsPerLocationInitial,
//     moNo,
//     garmentType,
//   ]);

//   const getPcsCountForLocation = (bundleIndex, location) => {
//     const bundlePcsConfig = pcsPerLocationInitial[bundleIndex] || {
//       t: 5,
//       m: 5,
//       b: 5,
//     };
//     if (location === "Top") return bundlePcsConfig.t;
//     if (location === "Middle") return bundlePcsConfig.m;
//     if (location === "Bottom") return bundlePcsConfig.b;
//     return 5; // Default
//   };

//   // IMPORTANT: This function needs to be robust.
//   // It takes the current localBundleData, formats it, and sends it up.
//   const triggerUpdate = useCallback(() => {
//     if (onUpdate && localBundleData) {
//       // Perform any final calculations or summarizations on localBundleData if needed
//       // e.g., update totalPcs, pass, reject fields for each bundle in localBundleData
//       const processedData = localBundleData.map((bundle) => {
//         let bundleTotalPcs = 0;
//         let bundleTotalPass = 0;
//         let bundleTotalReject = 0;
//         let bundleRejectMeasurement = 0;
//         let bundleRejectDefect = 0; // For defect-only rejects

//         const bundleAggregatesByLocation = {
//           Top: {
//             pcs: 0,
//             pass: 0,
//             reject: 0,
//             rejectMeasurement: 0,
//             rejectDefect: 0,
//           },
//           Middle: {
//             pcs: 0,
//             pass: 0,
//             reject: 0,
//             rejectMeasurement: 0,
//             rejectDefect: 0,
//           },
//           Bottom: {
//             pcs: 0,
//             pass: 0,
//             reject: 0,
//             rejectMeasurement: 0,
//             rejectDefect: 0,
//           },
//         };

//         (bundle.measurementInsepctionData || []).forEach((part) => {
//           (part.measurementPointsData || []).forEach((mpData) => {
//             (mpData.measurementValues || []).forEach((locValue) => {
//               const location = locValue.location; // "Top", "Middle", "Bottom"
//               (locValue.measurements || []).forEach((m) => {
//                 bundleAggregatesByLocation[location].pcs++;
//                 bundleTotalPcs++;
//                 if (m.status === "Pass") {
//                   bundleAggregatesByLocation[location].pass++;
//                   // bundleTotalPass++; // This will be calculated later by summing location passes IF no defect reject for this piece
//                 } else {
//                   bundleAggregatesByLocation[location].reject++;
//                   // bundleTotalReject++; // Same as above
//                   if (
//                     Number(m.valuedecimal) < tolerance.min ||
//                     Number(m.valuedecimal) > tolerance.max
//                   ) {
//                     bundleAggregatesByLocation[location].rejectMeasurement++;
//                     bundleRejectMeasurement++;
//                   }
//                 }
//               });
//             });
//           });
//           // Aggregate defects for this part
//           (part.fabricDefects || []).forEach((locDefect) => {
//             const location = locDefect.location;
//             (locDefect.defectData || []).forEach((pcsDefect) => {
//               if (pcsDefect.totalDefects > 0) {
//                 // If a piece has defects, it's a reject for that piece
//                 // Need to ensure we don't double-count if already rejected by measurement for the same piece
//                 const pcsName = pcsDefect.pcsName;
//                 const correspondingMeasurement = part.measurementPointsData
//                   .flatMap(
//                     (mp) =>
//                       mp.measurementValues.find(
//                         (mv) => mv.location === location
//                       )?.measurements || []
//                   )
//                   .find((m) => m.pcsName === pcsName);

//                 if (
//                   !correspondingMeasurement ||
//                   correspondingMeasurement.status === "Pass"
//                 ) {
//                   bundleAggregatesByLocation[location].reject++; // Increment reject for this location
//                   bundleAggregatesByLocation[location].rejectDefect++;
//                   bundleRejectDefect++;
//                 } else if (correspondingMeasurement.status === "Fail") {
//                   // Already rejected by measurement, but we can still count it as a defect reject type
//                   bundleAggregatesByLocation[location].rejectDefect++;
//                   bundleRejectDefect++;
//                 }
//               }
//             });
//           });
//         });

//         // Final aggregation for bundle totals based on location totals
//         // A piece is "Pass" only if all its measurements are pass AND it has no defects.
//         ["Top", "Middle", "Bottom"].forEach((loc) => {
//           // For each piece in this location, check its overall status
//           const numPcsInLoc =
//             bundleAggregatesByLocation[loc].pcs /
//             ((bundle.measurementInsepctionData || []).reduce(
//               (acc, part) => acc + (part.measurementPointsData || []).length,
//               0
//             ) || 1); //Approximate

//           // This simplified sum might not be fully accurate for pass/reject if a single piece can have multiple measurement points.
//           // A more robust way is to iterate piece by piece (T1, T2, etc.) across all parts.
//           bundleTotalPass +=
//             bundleAggregatesByLocation[loc].pcs -
//             bundleAggregatesByLocation[loc].reject;
//           bundleTotalReject += bundleAggregatesByLocation[loc].reject;
//         });

//         return {
//           ...bundle,
//           totalPcs: bundleTotalPcs,
//           pcs: {
//             total: bundleTotalPcs,
//             top: bundleAggregatesByLocation.Top.pcs,
//             middle: bundleAggregatesByLocation.Middle.pcs,
//             bottom: bundleAggregatesByLocation.Bottom.pcs,
//           },
//           pass: {
//             total: bundleTotalPass,
//             top:
//               bundleAggregatesByLocation.Top.pcs -
//               bundleAggregatesByLocation.Top.reject,
//             middle:
//               bundleAggregatesByLocation.Middle.pcs -
//               bundleAggregatesByLocation.Middle.reject,
//             bottom:
//               bundleAggregatesByLocation.Bottom.pcs -
//               bundleAggregatesByLocation.Bottom.reject,
//           },
//           reject: {
//             total: bundleTotalReject,
//             top: bundleAggregatesByLocation.Top.reject,
//             middle: bundleAggregatesByLocation.Middle.reject,
//             bottom: bundleAggregatesByLocation.Bottom.reject,
//           },
//           rejectMeasurement: {
//             total: bundleRejectMeasurement,
//             top: bundleAggregatesByLocation.Top.rejectMeasurement,
//             middle: bundleAggregatesByLocation.Middle.rejectMeasurement,
//             bottom: bundleAggregatesByLocation.Bottom.rejectMeasurement,
//           },
//           // Add rejectDefect similarly if your schema supports it explicitly at bundle level
//           // rejectGarment might be the sum of rejectMeasurement and rejectDefect (non-overlapping)
//           passrate:
//             bundleTotalPcs > 0
//               ? {
//                   total: parseFloat(
//                     ((bundleTotalPass / bundleTotalPcs) * 100).toFixed(2)
//                   ),
//                   top:
//                     bundleAggregatesByLocation.Top.pcs > 0
//                       ? parseFloat(
//                           (
//                             ((bundleAggregatesByLocation.Top.pcs -
//                               bundleAggregatesByLocation.Top.reject) /
//                               bundleAggregatesByLocation.Top.pcs) *
//                             100
//                           ).toFixed(2)
//                         )
//                       : 0,
//                   middle:
//                     bundleAggregatesByLocation.Middle.pcs > 0
//                       ? parseFloat(
//                           (
//                             ((bundleAggregatesByLocation.Middle.pcs -
//                               bundleAggregatesByLocation.Middle.reject) /
//                               bundleAggregatesByLocation.Middle.pcs) *
//                             100
//                           ).toFixed(2)
//                         )
//                       : 0,
//                   bottom:
//                     bundleAggregatesByLocation.Bottom.pcs > 0
//                       ? parseFloat(
//                           (
//                             ((bundleAggregatesByLocation.Bottom.pcs -
//                               bundleAggregatesByLocation.Bottom.reject) /
//                               bundleAggregatesByLocation.Bottom.pcs) *
//                             100
//                           ).toFixed(2)
//                         )
//                       : 0,
//                 }
//               : { total: 0, top: 0, middle: 0, bottom: 0 },
//         };
//       });
//       onUpdate(processedData);
//     }
//   }, [localBundleData, onUpdate, tolerance]);

//   const handleMeasurementInputChange = (
//     bundleIdx,
//     partIdx,
//     mpIdxData,
//     locIdxData,
//     valueIdx,
//     decimal,
//     fraction
//   ) => {
//     setLocalBundleData((prevLocalBundleData) => {
//       const updatedBundles = JSON.parse(JSON.stringify(prevLocalBundleData));
//       // Ensure path exists
//       if (
//         updatedBundles[bundleIdx]?.measurementInsepctionData[partIdx]
//           ?.measurementPointsData[mpIdxData]?.measurementValues[locIdxData]
//           ?.measurements[valueIdx]
//       ) {
//         const measurement =
//           updatedBundles[bundleIdx].measurementInsepctionData[partIdx]
//             .measurementPointsData[mpIdxData].measurementValues[locIdxData] // Use direct index from mpData // Use direct index from locValueData
//             .measurements[valueIdx];
//         measurement.valuedecimal = decimal;
//         measurement.valuefraction = fraction;
//         measurement.status =
//           Number(decimal) < tolerance.min || Number(decimal) > tolerance.max
//             ? "Fail"
//             : "Pass";
//       } else {
//         console.warn("Path to measurement cell not found for update:", {
//           bundleIdx,
//           partIdx,
//           mpIdxData,
//           locIdxData,
//           valueIdx,
//         });
//       }
//       return updatedBundles;
//     });
//   };

//   const handleDefectChange = (
//     bundleIdx,
//     partIdx,
//     locTab,
//     pcsNameIdx,
//     newDefectsForPcs
//   ) => {
//     setLocalBundleData((prevLocalBundleData) => {
//       const updatedBundles = JSON.parse(JSON.stringify(prevLocalBundleData));
//       const bundle = updatedBundles[bundleIdx];
//       if (
//         !bundle ||
//         !bundle.measurementInsepctionData ||
//         !bundle.measurementInsepctionData[partIdx]
//       ) {
//         console.warn("Path to defect bundle/part not found:", {
//           bundleIdx,
//           partIdx,
//         });
//         return prevLocalBundleData;
//       }

//       let part = bundle.measurementInsepctionData[partIdx];
//       if (!part.fabricDefects) part.fabricDefects = [];
//       let fabricDefectForLocation = part.fabricDefects.find(
//         (fd) => fd.location === locTab
//       );
//       if (!fabricDefectForLocation) {
//         fabricDefectForLocation = { location: locTab, defectData: [] };
//         part.fabricDefects.push(fabricDefectForLocation);
//       }
//       if (!fabricDefectForLocation.defectData)
//         fabricDefectForLocation.defectData = [];

//       // Find by pcsName, which is `${locTab[0]}${pcsNameIdx + 1}`
//       const targetPcsName = `${locTab[0]}${pcsNameIdx + 1}`;
//       let pcsDefectContainer = fabricDefectForLocation.defectData.find(
//         (dd) => dd.pcsName === targetPcsName
//       );

//       if (!pcsDefectContainer) {
//         pcsDefectContainer = {
//           pcsName: targetPcsName,
//           totalDefects: 0,
//           defects: [],
//         };
//         fabricDefectForLocation.defectData.push(pcsDefectContainer);
//         // Sort defectData by pcsName to maintain order if new ones are added out of sequence
//         fabricDefectForLocation.defectData.sort((a, b) => {
//           const aNum = parseInt(a.pcsName.substring(1));
//           const bNum = parseInt(b.pcsName.substring(1));
//           return aNum - bNum;
//         });
//       }

//       pcsDefectContainer.defects = newDefectsForPcs;
//       pcsDefectContainer.totalDefects = newDefectsForPcs.reduce(
//         (sum, d) => sum + (d.defectQty || 0),
//         0
//       );

//       return updatedBundles;
//     });
//   };

//   if (!localBundleData || localBundleData.length === 0) {
//     return (
//       <div className="p-4 text-center text-gray-500">
//         {t("cutting.noBundleDataForSize")}
//       </div>
//     );
//   }

//   return (
//     <div className="mt-4">
//       <div className="flex justify-center mb-4">
//         {["Top", "Middle", "Bottom"].map((tab) => (
//           <button
//             key={tab}
//             onClick={() => setActiveMeasurementTab(tab)}
//             className={`px-4 py-2 ${
//               activeMeasurementTab === tab
//                 ? "bg-blue-600 text-white"
//                 : "bg-gray-200"
//             } rounded-lg mx-1`}
//           >
//             {t(`cutting.${tab.toLowerCase()}`)}
//           </button>
//         ))}
//       </div>

//       {localBundleData.map((bundle, bundleIdx) => (
//         <div
//           key={bundle.bundleNo || bundleIdx}
//           className="mb-6 p-4 border rounded-md"
//         >
//           <h5 className="text-md font-semibold text-gray-600 mb-2">
//             {t("cutting.bundleNo")}: {bundle.bundleNo} ({bundle.serialLetter})
//           </h5>
//           {(bundle.measurementInsepctionData || []).map((partData, partIdx) => (
//             <div key={partData.partName || partIdx} className="mb-4">
//               <h6 className="text-sm font-medium text-gray-800 bg-gray-100 p-2 rounded">
//                 {t("cutting.part")}:{" "}
//                 {i18n.language === "km"
//                   ? partData.partNameKhmer
//                   : partData.partName}
//               </h6>

//               {/* Measurement Table for this part */}
//               <div className="overflow-x-auto mt-2">
//                 <table className="w-full border-collapse border">
//                   <thead>
//                     <tr className="bg-gray-50">
//                       <th className="border p-1 text-xs">
//                         {t("cutting.measurementPoint")}
//                       </th>
//                       {Array.from(
//                         {
//                           length: getPcsCountForLocation(
//                             bundleIdx,
//                             activeMeasurementTab
//                           ),
//                         },
//                         (_, i) => (
//                           <th key={i} className="border p-1 text-xs">
//                             {activeMeasurementTab[0]}
//                             {i + 1}
//                           </th>
//                         )
//                       )}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {measurementPoints // This is the full list of available MPs
//                       .filter(
//                         (mp) =>
//                           mp.panelIndexName === partData.partName &&
//                           (mp.moNo === moNo || mp.moNo === "Common")
//                       )
//                       .map((mpDefinition, mpIdxActual) => {
//                         // mpIdxActual is for rendering loop

//                         // Find or initialize measurementPointsData FOR THIS SPECIFIC mpDefinition within partData
//                         let mpDataFromState = (
//                           partData.measurementPointsData || []
//                         ).findIndex(
//                           (storedMp) =>
//                             storedMp.measurementPointName ===
//                               mpDefinition.pointNameEng &&
//                             storedMp.panelName === mpDefinition.panelName &&
//                             storedMp.side === mpDefinition.panelSide &&
//                             storedMp.direction ===
//                               mpDefinition.panelDirection &&
//                             storedMp.property === mpDefinition.measurementSide
//                         );
//                         let mpDataForRendering;

//                         if (mpDataFromState === -1) {
//                           // If not found in state, create a temporary structure for rendering
//                           mpDataForRendering = {
//                             measurementPointName: mpDefinition.pointNameEng,
//                             measurementPointNameKhmer:
//                               mpDefinition.pointNameKhmer,
//                             panelName: mpDefinition.panelName,
//                             side: mpDefinition.panelSide,
//                             direction: mpDefinition.panelDirection,
//                             property: mpDefinition.measurementSide,
//                             measurementValues: [
//                               {
//                                 // Initialize for the current tab
//                                 location: activeMeasurementTab,
//                                 measurements: Array(
//                                   getPcsCountForLocation(
//                                     bundleIdx,
//                                     activeMeasurementTab
//                                   )
//                                 )
//                                   .fill(null)
//                                   .map((_, i) => ({
//                                     pcsName: `${activeMeasurementTab[0]}${
//                                       i + 1
//                                     }`,
//                                     valuedecimal: 0,
//                                     valuefraction: "0",
//                                     status: "Pass",
//                                   })),
//                               },
//                             ],
//                           };
//                         } else {
//                           mpDataForRendering =
//                             partData.measurementPointsData[mpDataFromState];
//                         }

//                         const currentLocValues = (
//                           mpDataForRendering.measurementValues || []
//                         ).find((val) => val.location === activeMeasurementTab);
//                         let measurementsToRender =
//                           currentLocValues?.measurements;
//                         if (!measurementsToRender) {
//                           // If no measurements for current tab, create dummy for rendering
//                           measurementsToRender = Array(
//                             getPcsCountForLocation(
//                               bundleIdx,
//                               activeMeasurementTab
//                             )
//                           )
//                             .fill(null)
//                             .map((_, i) => ({
//                               pcsName: `${activeMeasurementTab[0]}${i + 1}`,
//                               valuedecimal: 0,
//                               valuefraction: "0",
//                               status: "Pass",
//                             }));
//                         }

//                         return (
//                           <tr
//                             key={`${mpDefinition.pointNameEng}-${mpIdxActual}`}
//                           >
//                             <td className="border p-1 text-xs min-w-[150px]">
//                               {i18n.language === "km"
//                                 ? mpDefinition.pointNameKhmer
//                                 : mpDefinition.pointNameEng}
//                             </td>
//                             {measurementsToRender.map((val, valIdx) => (
//                               <td
//                                 key={valIdx}
//                                 className="border p-0 text-xs text-center"
//                                 onClick={() => {
//                                   // To open Numpad, we need the correct indices into localBundleData.measurementPointsData and its measurementValues
//                                   const actualMpDataIndex = (
//                                     localBundleData[bundleIdx]
//                                       ?.measurementInsepctionData[partIdx]
//                                       ?.measurementPointsData || []
//                                   ).findIndex(
//                                     (storedMp) =>
//                                       storedMp.measurementPointName ===
//                                         mpDefinition.pointNameEng &&
//                                       storedMp.panelName ===
//                                         mpDefinition.panelName &&
//                                       storedMp.side ===
//                                         mpDefinition.panelSide &&
//                                       storedMp.direction ===
//                                         mpDefinition.panelDirection &&
//                                       storedMp.property ===
//                                         mpDefinition.measurementSide
//                                   );

//                                   if (actualMpDataIndex === -1) {
//                                     // This MP is not yet in the state for this part, we need to add it first.
//                                     // This requires modifying localBundleData to include this new MP structure.
//                                     // This is complex, for now, we assume if user clicks, it should exist or be added.
//                                     // A better approach: pre-populate all possible MPs when parts are selected.
//                                     console.warn(
//                                       "Measurement point not found in state. Consider pre-populating or adding on first interaction."
//                                     );
//                                     // For demonstration, let's assume it gets added (this part needs robust logic)
//                                     // For now, we'll prevent numpad if it's not found.
//                                     return;
//                                   }

//                                   const actualLocIndex = (
//                                     localBundleData[bundleIdx]
//                                       ?.measurementInsepctionData[partIdx]
//                                       ?.measurementPointsData[actualMpDataIndex]
//                                       ?.measurementValues || []
//                                   ).findIndex(
//                                     (locVal) =>
//                                       locVal.location === activeMeasurementTab
//                                   );

//                                   if (actualLocIndex === -1) {
//                                     console.warn(
//                                       "Location data for MP not found in state."
//                                     );
//                                     return;
//                                   }

//                                   setCurrentCellForNumPad({
//                                     bundleIdx,
//                                     partIdx,
//                                     mpIdxData: actualMpDataIndex,
//                                     locIdxData: actualLocIndex,
//                                     valueIdx: valIdx,
//                                   });
//                                   setShowNumPad(true);
//                                 }}
//                               >
//                                 <input
//                                   type="text"
//                                   readOnly
//                                   value={val.valuefraction}
//                                   className={`w-full h-full p-1 m-0 text-center border-none focus:outline-none text-xs
//                                        ${
//                                          Number(val.valuedecimal) <
//                                            tolerance.min ||
//                                          Number(val.valuedecimal) >
//                                            tolerance.max
//                                            ? "bg-red-100"
//                                            : "bg-green-100"
//                                        }`}
//                                 />
//                               </td>
//                             ))}
//                           </tr>
//                         );
//                       })}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Fabric Defect Table for this part */}
//               <div className="overflow-x-auto mt-4">
//                 <h6 className="text-xs font-medium text-gray-700 mb-1">
//                   {t("cutting.fabricDefects")} ({activeMeasurementTab})
//                 </h6>
//                 <table className="w-full border-collapse border">
//                   <thead>
//                     <tr className="bg-gray-50">
//                       <th className="border p-1 text-xs">
//                         {t("cutting.panelName")}
//                       </th>
//                       {Array.from(
//                         {
//                           length: getPcsCountForLocation(
//                             bundleIdx,
//                             activeMeasurementTab
//                           ),
//                         },
//                         (_, i) => (
//                           <th key={i} className="border p-1 text-xs">
//                             {activeMeasurementTab[0]}
//                             {i + 1}
//                           </th>
//                         )
//                       )}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     <tr>
//                       <td className="border p-1 text-xs bg-gray-100">
//                         {i18n.language === "km"
//                           ? partData.partNameKhmer
//                           : partData.partName}
//                       </td>
//                       {Array.from(
//                         {
//                           length: getPcsCountForLocation(
//                             bundleIdx,
//                             activeMeasurementTab
//                           ),
//                         },
//                         (_, pcsIdx) => {
//                           const targetPcsName = `${activeMeasurementTab[0]}${
//                             pcsIdx + 1
//                           }`;
//                           const fabricDefectLocationData = (
//                             partData.fabricDefects || []
//                           ).find((fd) => fd.location === activeMeasurementTab);
//                           const pcsDefectData =
//                             fabricDefectLocationData?.defectData?.find(
//                               (dd) => dd.pcsName === targetPcsName
//                             );
//                           const defectsForCell = pcsDefectData?.defects || [];
//                           return (
//                             <td
//                               key={pcsIdx}
//                               className={`border p-1 text-xs text-center cursor-pointer ${
//                                 defectsForCell.length > 0
//                                   ? "bg-red-100"
//                                   : "bg-green-100"
//                               }`}
//                               onClick={() => {
//                                 setCurrentCellForDefectBox({
//                                   bundleIdx,
//                                   partIdx,
//                                   locTab: activeMeasurementTab,
//                                   pcsNameIdx: pcsIdx,
//                                 });
//                                 setShowDefectBox(true);
//                               }}
//                             >
//                               {defectsForCell
//                                 .map((d) => d.defectNameEng || d.defectName)
//                                 .join(", ")}{" "}
//                               {/* Display Eng name as fallback */}
//                             </td>
//                           );
//                         }
//                       )}
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           ))}
//           <div className="flex justify-end mt-2">
//             <button
//               onClick={triggerUpdate}
//               className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
//             >
//               {t("cutting.applyBundleChanges")}
//             </button>
//           </div>
//         </div>
//       ))}

//       {showNumPad && currentCellForNumPad && (
//         <MeasurementNumPad
//           onClose={() => {
//             setShowNumPad(false);
//             triggerUpdate();
//           }}
//           onInput={(decimal, fraction) => {
//             const { bundleIdx, partIdx, mpIdxData, locIdxData, valueIdx } =
//               currentCellForNumPad;
//             handleMeasurementInputChange(
//               bundleIdx,
//               partIdx,
//               mpIdxData,
//               locIdxData,
//               valueIdx,
//               decimal,
//               fraction
//             );
//           }}
//           initialValue={
//             localBundleData[currentCellForNumPad.bundleIdx]
//               ?.measurementInsepctionData[currentCellForNumPad.partIdx]
//               ?.measurementPointsData[currentCellForNumPad.mpIdxData]
//               ?.measurementValues[currentCellForNumPad.locIdxData]
//               ?.measurements[currentCellForNumPad.valueIdx]?.valuedecimal
//           }
//         />
//       )}

//       {showDefectBox && currentCellForDefectBox && (
//         <DefectBox
//           defects={
//             (
//               localBundleData[
//                 currentCellForDefectBox.bundleIdx
//               ]?.measurementInsepctionData[
//                 currentCellForDefectBox.partIdx
//               ]?.fabricDefects
//                 ?.find((fd) => fd.location === currentCellForDefectBox.locTab)
//                 ?.defectData?.find(
//                   (dd) =>
//                     dd.pcsName ===
//                     `${currentCellForDefectBox.locTab[0]}${
//                       currentCellForDefectBox.pcsNameIdx + 1
//                     }`
//                 )?.defects || []
//             ).map((d) => ({ ...d, defectName: d.defectName })) // Ensure defectName key is present for DefectBox value prop
//           }
//           onClose={() => {
//             setShowDefectBox(false);
//             triggerUpdate();
//           }}
//           onAddDefect={(defectNameKey) => {
//             const { bundleIdx, partIdx, locTab, pcsNameIdx } =
//               currentCellForDefectBox;
//             const targetPcsName = `${locTab[0]}${pcsNameIdx + 1}`;

//             let existingDefects =
//               localBundleData[bundleIdx]?.measurementInsepctionData[
//                 partIdx
//               ]?.fabricDefects
//                 ?.find((fd) => fd.location === locTab)
//                 ?.defectData?.find((dd) => dd.pcsName === targetPcsName)
//                 ?.defects || [];

//             const newDefectDetail = fabricDefectsList.find(
//               (d) => d.defectName === defectNameKey
//             );

//             if (
//               newDefectDetail &&
//               !existingDefects.some(
//                 (d) => d.defectName === newDefectDetail.defectName
//               )
//             ) {
//               const defectToAdd = { ...newDefectDetail, defectQty: 1 }; // defectNameKey is the key
//               const updated = [...existingDefects, defectToAdd];
//               handleDefectChange(
//                 bundleIdx,
//                 partIdx,
//                 locTab,
//                 pcsNameIdx,
//                 updated
//               );
//             }
//           }}
//           onRemoveDefect={(defectIdx) => {
//             const { bundleIdx, partIdx, locTab, pcsNameIdx } =
//               currentCellForDefectBox;
//             const targetPcsName = `${locTab[0]}${pcsNameIdx + 1}`;
//             let existingDefects =
//               localBundleData[bundleIdx]?.measurementInsepctionData[
//                 partIdx
//               ]?.fabricDefects
//                 ?.find((fd) => fd.location === locTab)
//                 ?.defectData?.find((dd) => dd.pcsName === targetPcsName)
//                 ?.defects || [];
//             existingDefects = existingDefects.filter((_, i) => i !== defectIdx);
//             handleDefectChange(
//               bundleIdx,
//               partIdx,
//               locTab,
//               pcsNameIdx,
//               existingDefects
//             );
//           }}
//           onUpdateDefectCount={(defectIdx, newCount) => {
//             const { bundleIdx, partIdx, locTab, pcsNameIdx } =
//               currentCellForDefectBox;
//             const targetPcsName = `${locTab[0]}${pcsNameIdx + 1}`;
//             let existingDefects = JSON.parse(
//               JSON.stringify(
//                 localBundleData[bundleIdx]?.measurementInsepctionData[
//                   partIdx
//                 ]?.fabricDefects
//                   ?.find((fd) => fd.location === locTab)
//                   ?.defectData?.find((dd) => dd.pcsName === targetPcsName)
//                   ?.defects || []
//               )
//             );
//             if (existingDefects[defectIdx]) {
//               existingDefects[defectIdx].defectQty = Math.max(0, newCount);
//             }
//             handleDefectChange(
//               bundleIdx,
//               partIdx,
//               locTab,
//               pcsNameIdx,
//               existingDefects
//             );
//           }}
//           fabricDefects={fabricDefectsList}
//         />
//       )}
//     </div>
//   );
// };

// export default MeasurementTableModify;

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DefectBox from "./DefectBox"; // Reusing
import MeasurementNumPad from "./MeasurementNumPad"; // Reusing

const MeasurementTableModify = ({
  initialBundleInspectionData, // Array of bundle data for the current size
  measurementPoints,
  panelIndexNames,
  fabricDefectsList,
  tolerance,
  onUpdate, // Callback to send the fully updated bundleInspectionData array back
  garmentType, // Or selectedPanel from parent
  moNo,
  activeMeasurementTab,
  setActiveMeasurementTab,
  pcsPerLocationInitial // [{t:5, m:5, b:5}, ...]
}) => {
  const { t, i18n } = useTranslation();
  const [localBundleData, setLocalBundleData] = useState([]);

  // State for Numpad/DefectBox
  const [showNumPad, setShowNumPad] = useState(false);
  // Store enough info to uniquely identify the cell for update
  const [currentCellForNumPad, setCurrentCellForNumPad] = useState(null);
  // { bundleIdx, partName (key), mpDefinitionKey (identifying object for MP), locTab (Top/Mid/Bot), valueIdx (0-4 for T1-T5 etc) }
  const [showDefectBox, setShowDefectBox] = useState(false);
  const [currentCellForDefectBox, setCurrentCellForDefectBox] = useState(null); // {bundleIdx, partIdx, locTab, pcsNameIdx }

  // Helper function from your original MeasurementTable.jsx
  const decimalToFractionDisplay = useCallback((value) => {
    if (value === null || value === undefined) return "";
    if (value === 0) return "0";
    const sign = value < 0 ? "-" : "";
    const absValue = Math.abs(value);
    const whole = Math.floor(absValue);
    const decimal = absValue - whole;

    if (decimal === 0) return `${sign}${whole || 0}`; // Ensure 0 shows as "0"

    const fractions = [
      { fraction: "1/16", value: 1 / 16 },
      { fraction: "1/8", value: 1 / 8 },
      { fraction: "3/16", value: 3 / 16 },
      { fraction: "1/4", value: 1 / 4 },
      { fraction: "5/16", value: 5 / 16 },
      { fraction: "3/8", value: 3 / 8 },
      { fraction: "7/16", value: 7 / 16 },
      { fraction: "1/2", value: 1 / 2 },
      { fraction: "9/16", value: 9 / 16 },
      { fraction: "5/8", value: 5 / 8 },
      { fraction: "11/16", value: 11 / 16 },
      { fraction: "3/4", value: 3 / 4 },
      { fraction: "13/16", value: 13 / 16 },
      { fraction: "7/8", value: 7 / 8 },
      { fraction: "15/16", value: 15 / 16 },
      { fraction: "1", value: 1 }
    ];
    const found = fractions.find((f) => Math.abs(f.value - decimal) < 0.001);
    return found
      ? whole > 0
        ? `${sign}${whole} ${found.fraction}`
        : `${sign}${found.fraction}`
      : `${sign}${absValue.toFixed(3)}`;
  }, []);

  const getPcsCountForLocation = useCallback(
    (bundleIndex, location) => {
      const bundlePcsConfig = pcsPerLocationInitial[bundleIndex] || {
        t: 5,
        m: 5,
        b: 5
      };
      if (location === "Top") return bundlePcsConfig.t;
      if (location === "Middle") return bundlePcsConfig.m;
      if (location === "Bottom") return bundlePcsConfig.b;
      return 5;
    },
    [pcsPerLocationInitial]
  );

  useEffect(() => {
    const structuredData = initialBundleInspectionData.map(
      (bundle, bundleIdx) => {
        const newBundle = JSON.parse(JSON.stringify(bundle));
        newBundle.measurementInsepctionData = (
          newBundle.measurementInsepctionData || []
        ).map((part) => {
          const newPart = { ...part };
          if (!newPart.measurementPointsData)
            newPart.measurementPointsData = [];

          const partMPs = measurementPoints.filter(
            (mp) =>
              mp.panelIndexName === newPart.partName &&
              (mp.moNo === moNo || mp.moNo === "Common")
          );

          partMPs.forEach((mpDef) => {
            let existingMpData = newPart.measurementPointsData.find(
              (storedMp) =>
                storedMp.measurementPointName === mpDef.pointNameEng &&
                storedMp.panelName === mpDef.panelName &&
                storedMp.side === mpDef.panelSide &&
                storedMp.direction === mpDef.panelDirection &&
                storedMp.property === mpDef.measurementSide
            );
            if (!existingMpData) {
              existingMpData = {
                measurementPointName: mpDef.pointNameEng,
                measurementPointNameKhmer: mpDef.pointNameKhmer,
                panelName: mpDef.panelName,
                side: mpDef.panelSide,
                direction: mpDef.panelDirection,
                property: mpDef.measurementSide,
                measurementValues: []
              };
              newPart.measurementPointsData.push(existingMpData);
            }

            ["Top", "Middle", "Bottom"].forEach((locTab) => {
              let locMeasurements = existingMpData.measurementValues.find(
                (mv) => mv.location === locTab
              );
              const expectedPcsCount = getPcsCountForLocation(
                bundleIdx,
                locTab
              );
              if (!locMeasurements) {
                locMeasurements = {
                  location: locTab,
                  measurements: Array(expectedPcsCount)
                    .fill(null)
                    .map((_, i) => ({
                      pcsName: `${locTab[0]}${i + 1}`,
                      valuedecimal: 0,
                      valuefraction: "0",
                      status: "Pass"
                    }))
                };
                existingMpData.measurementValues.push(locMeasurements);
              } else {
                if (locMeasurements.measurements.length < expectedPcsCount) {
                  for (
                    let i = locMeasurements.measurements.length;
                    i < expectedPcsCount;
                    i++
                  ) {
                    locMeasurements.measurements.push({
                      pcsName: `${locTab[0]}${i + 1}`,
                      valuedecimal: 0,
                      valuefraction: "0",
                      status: "Pass"
                    });
                  }
                } else if (
                  locMeasurements.measurements.length > expectedPcsCount
                ) {
                  locMeasurements.measurements =
                    locMeasurements.measurements.slice(0, expectedPcsCount);
                }
                locMeasurements.measurements.forEach(
                  (m, i) => (m.pcsName = `${locTab[0]}${i + 1}`)
                );
              }
            });
          });

          if (!newPart.fabricDefects) {
            newPart.fabricDefects = [
              { location: "Top", defectData: [] },
              { location: "Middle", defectData: [] },
              { location: "Bottom", defectData: [] }
            ];
          }
          return newPart;
        });
        return newBundle;
      }
    );
    setLocalBundleData(structuredData);
  }, [
    initialBundleInspectionData,
    measurementPoints,
    pcsPerLocationInitial,
    moNo,
    garmentType,
    getPcsCountForLocation
  ]);

  const triggerUpdate = useCallback(() => {
    if (onUpdate && localBundleData) {
      const processedData = localBundleData.map((bundle, bundleIdx) => {
        // Pass bundleIdx for getPcsCountForLocation
        let bundleTotalPcs = 0;
        let bundleTotalPass = 0;
        let bundleTotalReject = 0;
        let bundleRejectMeasurement = 0;
        let bundleRejectDefect = 0;

        const bundleAggregatesByLocation = {
          Top: {
            pcs: 0,
            pass: 0,
            reject: 0,
            rejectMeasurement: 0,
            rejectDefect: 0
          },
          Middle: {
            pcs: 0,
            pass: 0,
            reject: 0,
            rejectMeasurement: 0,
            rejectDefect: 0
          },
          Bottom: {
            pcs: 0,
            pass: 0,
            reject: 0,
            rejectMeasurement: 0,
            rejectDefect: 0
          }
        };

        const numSelectedParts = bundle.measurementInsepctionData?.length || 0;

        ["Top", "Middle", "Bottom"].forEach((locString) => {
          const numPcsConfiguredForLoc = getPcsCountForLocation(
            bundleIdx,
            locString
          );
          bundleAggregatesByLocation[locString].pcs =
            numPcsConfiguredForLoc * numSelectedParts;
          bundleTotalPcs += bundleAggregatesByLocation[locString].pcs;

          for (let i = 0; i < numPcsConfiguredForLoc; i++) {
            // Iterate T1, T2...
            const pcsName = `${locString[0]}${i + 1}`;
            let pieceIsRejectedOverall = false;
            let pieceRejectedByMeasurementCount = 0;
            let pieceRejectedByDefectCount = 0;

            (bundle.measurementInsepctionData || []).forEach((part) => {
              // Check measurements for this pcsName in this part
              const mpForPcs = part.measurementPointsData
                ?.flatMap(
                  (mp) =>
                    mp.measurementValues.find((mv) => mv.location === locString)
                      ?.measurements
                )
                .find((m) => m.pcsName === pcsName);

              if (mpForPcs && mpForPcs.status === "Fail") {
                pieceIsRejectedOverall = true;
                if (
                  Number(mpForPcs.valuedecimal) < tolerance.min ||
                  Number(mpForPcs.valuedecimal) > tolerance.max
                ) {
                  pieceRejectedByMeasurementCount++;
                }
              }
              // Check defects for this pcsName in this part
              const defectForPcs = part.fabricDefects
                ?.find((fd) => fd.location === locString)
                ?.defectData.find((dd) => dd.pcsName === pcsName);
              if (defectForPcs && defectForPcs.totalDefects > 0) {
                pieceIsRejectedOverall = true;
                pieceRejectedByDefectCount++;
              }
            });

            if (pieceIsRejectedOverall) {
              bundleAggregatesByLocation[locString].reject += numSelectedParts; // If one part of T1 is reject, all T1s for that bundle are "affected"
              bundleTotalReject += numSelectedParts;
              if (pieceRejectedByMeasurementCount > 0) {
                bundleAggregatesByLocation[locString].rejectMeasurement +=
                  numSelectedParts;
                bundleRejectMeasurement += numSelectedParts;
              }
              if (pieceRejectedByDefectCount > 0) {
                bundleAggregatesByLocation[locString].rejectDefect +=
                  numSelectedParts;
                bundleRejectDefect += numSelectedParts;
              }
            } else {
              bundleAggregatesByLocation[locString].pass += numSelectedParts;
              bundleTotalPass += numSelectedParts;
            }
          }
        });

        return {
          ...bundle,
          totalPcs: bundleTotalPcs,
          pcs: {
            total: bundleTotalPcs,
            top: bundleAggregatesByLocation.Top.pcs,
            middle: bundleAggregatesByLocation.Middle.pcs,
            bottom: bundleAggregatesByLocation.Bottom.pcs
          },
          pass: {
            total: bundleTotalPass,
            top: bundleAggregatesByLocation.Top.pass,
            middle: bundleAggregatesByLocation.Middle.pass,
            bottom: bundleAggregatesByLocation.Bottom.pass
          },
          reject: {
            total: bundleTotalReject,
            top: bundleAggregatesByLocation.Top.reject,
            middle: bundleAggregatesByLocation.Middle.reject,
            bottom: bundleAggregatesByLocation.Bottom.reject
          },
          rejectMeasurement: {
            total: bundleRejectMeasurement,
            top: bundleAggregatesByLocation.Top.rejectMeasurement,
            middle: bundleAggregatesByLocation.Middle.rejectMeasurement,
            bottom: bundleAggregatesByLocation.Bottom.rejectMeasurement
          },
          passrate:
            bundleTotalPcs > 0
              ? {
                  total: parseFloat(
                    ((bundleTotalPass / bundleTotalPcs) * 100).toFixed(2)
                  ),
                  top:
                    bundleAggregatesByLocation.Top.pcs > 0
                      ? parseFloat(
                          (
                            (bundleAggregatesByLocation.Top.pass /
                              bundleAggregatesByLocation.Top.pcs) *
                            100
                          ).toFixed(2)
                        )
                      : 0,
                  middle:
                    bundleAggregatesByLocation.Middle.pcs > 0
                      ? parseFloat(
                          (
                            (bundleAggregatesByLocation.Middle.pass /
                              bundleAggregatesByLocation.Middle.pcs) *
                            100
                          ).toFixed(2)
                        )
                      : 0,
                  bottom:
                    bundleAggregatesByLocation.Bottom.pcs > 0
                      ? parseFloat(
                          (
                            (bundleAggregatesByLocation.Bottom.pass /
                              bundleAggregatesByLocation.Bottom.pcs) *
                            100
                          ).toFixed(2)
                        )
                      : 0
                }
              : { total: 0, top: 0, middle: 0, bottom: 0 }
        };
      });
      onUpdate(processedData);
    }
  }, [localBundleData, onUpdate, tolerance, getPcsCountForLocation]);

  const handleMeasurementInputChange = (
    bundleIdx,
    partName,
    mpDefinitionKey,
    locTab,
    valueIdx,
    decimal,
    fractionFromNumpad
  ) => {
    setLocalBundleData((prevLocalBundleData) => {
      const updatedBundles = JSON.parse(JSON.stringify(prevLocalBundleData));
      const bundle = updatedBundles[bundleIdx];
      if (!bundle) return prevLocalBundleData;

      const part = bundle.measurementInsepctionData?.find(
        (p) => p.partName === partName
      );
      if (!part) return prevLocalBundleData;

      let mpData = part.measurementPointsData?.find(
        (storedMp) =>
          storedMp.measurementPointName ===
            mpDefinitionKey.measurementPointName &&
          storedMp.panelName === mpDefinitionKey.panelName &&
          storedMp.side === mpDefinitionKey.side &&
          storedMp.direction === mpDefinitionKey.direction &&
          storedMp.property === mpDefinitionKey.property
      );

      if (!mpData) {
        mpData = { ...mpDefinitionKey, measurementValues: [] };
        if (!part.measurementPointsData) part.measurementPointsData = [];
        part.measurementPointsData.push(mpData);
      }

      let locValueData = mpData.measurementValues?.find(
        (mv) => mv.location === locTab
      );
      if (!locValueData) {
        locValueData = { location: locTab, measurements: [] };
        if (!mpData.measurementValues) mpData.measurementValues = [];
        mpData.measurementValues.push(locValueData);
      }

      const pcsCount = getPcsCountForLocation(bundleIdx, locTab);
      while (locValueData.measurements.length < pcsCount) {
        locValueData.measurements.push({
          pcsName: `${locTab[0]}${locValueData.measurements.length + 1}`,
          valuedecimal: 0,
          valuefraction: "0",
          status: "Pass"
        });
      }

      if (locValueData.measurements[valueIdx]) {
        const measurement = locValueData.measurements[valueIdx];
        measurement.valuedecimal = Number(decimal);
        measurement.valuefraction = fractionFromNumpad; // Use the direct fraction string from numpad
        measurement.status =
          Number(decimal) < tolerance.min || Number(decimal) > tolerance.max
            ? "Fail"
            : "Pass";
      } else {
        console.warn("Path to measurement cell not found for update:", {
          bundleIdx,
          partName,
          mpDefinitionKey,
          locTab,
          valueIdx
        });
      }
      return updatedBundles;
    });
  };

  const handleDefectChange = (
    bundleIdx,
    partIdx,
    locTab,
    pcsNameIdx,
    newDefectsForPcs
  ) => {
    setLocalBundleData((prevLocalBundleData) => {
      const updatedBundles = JSON.parse(JSON.stringify(prevLocalBundleData));
      const bundle = updatedBundles[bundleIdx];
      if (
        !bundle ||
        !bundle.measurementInsepctionData ||
        !bundle.measurementInsepctionData[partIdx]
      ) {
        console.warn("Path to defect bundle/part not found:", {
          bundleIdx,
          partIdx
        });
        return prevLocalBundleData;
      }

      let part = bundle.measurementInsepctionData[partIdx];
      if (!part.fabricDefects) part.fabricDefects = [];
      let fabricDefectForLocation = part.fabricDefects.find(
        (fd) => fd.location === locTab
      );
      if (!fabricDefectForLocation) {
        fabricDefectForLocation = { location: locTab, defectData: [] };
        part.fabricDefects.push(fabricDefectForLocation);
      }
      if (!fabricDefectForLocation.defectData)
        fabricDefectForLocation.defectData = [];

      const targetPcsName = `${locTab[0]}${pcsNameIdx + 1}`;
      let pcsDefectContainer = fabricDefectForLocation.defectData.find(
        (dd) => dd.pcsName === targetPcsName
      );

      if (!pcsDefectContainer) {
        pcsDefectContainer = {
          pcsName: targetPcsName,
          totalDefects: 0,
          defects: []
        };
        fabricDefectForLocation.defectData.push(pcsDefectContainer);
        fabricDefectForLocation.defectData.sort((a, b) => {
          const aNum = parseInt(a.pcsName.substring(1));
          const bNum = parseInt(b.pcsName.substring(1));
          return aNum - bNum;
        });
      }

      pcsDefectContainer.defects = newDefectsForPcs;
      pcsDefectContainer.totalDefects = newDefectsForPcs.reduce(
        (sum, d) => sum + (d.defectQty || 0),
        0
      );

      return updatedBundles;
    });
  };

  if (!localBundleData || localBundleData.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        {t("cutting.noBundleDataForSize")}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex justify-center mb-4">
        {["Top", "Middle", "Bottom"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveMeasurementTab(tab)}
            className={`px-4 py-2 ${
              activeMeasurementTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            } rounded-lg mx-1`}
          >
            {t(`cutting.${tab.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {localBundleData.map((bundle, bundleIdx) => (
        <div
          key={bundle.bundleNo || bundleIdx}
          className="mb-6 p-4 border rounded-md"
        >
          <h5 className="text-md font-semibold text-gray-600 mb-2">
            {t("cutting.bundleNo")}: {bundle.bundleNo} ({bundle.serialLetter})
          </h5>
          {(bundle.measurementInsepctionData || []).map((partData, partIdx) => (
            <div key={partData.partName || partIdx} className="mb-4">
              <h6 className="text-sm font-medium text-gray-800 bg-gray-100 p-2 rounded">
                {t("cutting.part")}:{" "}
                {i18n.language === "km"
                  ? partData.partNameKhmer
                  : partData.partName}
              </h6>

              <div className="overflow-x-auto mt-2">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-1 text-xs">
                        {t("cutting.measurementPoint")}
                      </th>
                      {Array.from(
                        {
                          length: getPcsCountForLocation(
                            bundleIdx,
                            activeMeasurementTab
                          )
                        },
                        (_, i) => (
                          <th key={i} className="border p-1 text-xs">
                            {activeMeasurementTab[0]}
                            {i + 1}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {measurementPoints
                      .filter(
                        (mp) =>
                          mp.panelIndexName === partData.partName &&
                          (mp.moNo === moNo || mp.moNo === "Common")
                      )
                      .map((mpDefinition, mpRenderIdx) => {
                        const mpDataInState = (
                          partData.measurementPointsData || []
                        ).find(
                          (storedMp) =>
                            storedMp.measurementPointName ===
                              mpDefinition.pointNameEng &&
                            storedMp.panelName === mpDefinition.panelName &&
                            storedMp.side === mpDefinition.panelSide &&
                            storedMp.direction ===
                              mpDefinition.panelDirection &&
                            storedMp.property === mpDefinition.measurementSide
                        );

                        const currentLocValues =
                          mpDataInState?.measurementValues?.find(
                            (val) => val.location === activeMeasurementTab
                          );
                        let measurementsToRender =
                          currentLocValues?.measurements;

                        if (
                          !measurementsToRender ||
                          measurementsToRender.length !==
                            getPcsCountForLocation(
                              bundleIdx,
                              activeMeasurementTab
                            )
                        ) {
                          measurementsToRender = Array(
                            getPcsCountForLocation(
                              bundleIdx,
                              activeMeasurementTab
                            )
                          )
                            .fill(null)
                            .map((_, i) => {
                              const existingM = measurementsToRender?.find(
                                (m) =>
                                  m.pcsName ===
                                  `${activeMeasurementTab[0]}${i + 1}`
                              );
                              return (
                                existingM || {
                                  pcsName: `${activeMeasurementTab[0]}${i + 1}`,
                                  valuedecimal: 0,
                                  valuefraction: "0", // This will be overridden by decimalToFractionDisplay
                                  status: "Pass"
                                }
                              );
                            });
                        }

                        return (
                          <tr
                            key={`${mpDefinition.measurementPointName}-${mpRenderIdx}`}
                          >
                            <td className="border p-1 text-xs min-w-[150px]">
                              {i18n.language === "km"
                                ? mpDefinition.pointNameKhmer
                                : mpDefinition.pointNameEng}
                            </td>
                            {measurementsToRender.map((val, valIdx) => (
                              <td
                                key={valIdx}
                                className="border p-0 text-xs text-center"
                                onClick={() => {
                                  const mpKey = {
                                    measurementPointName:
                                      mpDefinition.pointNameEng,
                                    panelName: mpDefinition.panelName,
                                    side: mpDefinition.panelSide,
                                    direction: mpDefinition.panelDirection,
                                    property: mpDefinition.measurementSide
                                  };
                                  setCurrentCellForNumPad({
                                    bundleIdx,
                                    partName: partData.partName,
                                    mpDefinitionKey: mpKey,
                                    locTab: activeMeasurementTab,
                                    valueIdx: valIdx
                                  });
                                  setShowNumPad(true);
                                }}
                              >
                                <input
                                  type="text"
                                  readOnly
                                  value={decimalToFractionDisplay(
                                    val.valuedecimal
                                  )}
                                  className={`w-full h-full p-1 m-0 text-center border-none focus:outline-none text-xs
                                       ${
                                         Number(val.valuedecimal) <
                                           tolerance.min ||
                                         Number(val.valuedecimal) >
                                           tolerance.max
                                           ? "bg-red-100"
                                           : "bg-green-100"
                                       }`}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto mt-4">
                <h6 className="text-xs font-medium text-gray-700 mb-1">
                  {t("cutting.fabricDefects")} ({activeMeasurementTab})
                </h6>
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-1 text-xs">
                        {t("cutting.panelName")}
                      </th>
                      {Array.from(
                        {
                          length: getPcsCountForLocation(
                            bundleIdx,
                            activeMeasurementTab
                          )
                        },
                        (_, i) => (
                          <th key={i} className="border p-1 text-xs">
                            {activeMeasurementTab[0]}
                            {i + 1}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-1 text-xs bg-gray-100">
                        {i18n.language === "km"
                          ? partData.partNameKhmer
                          : partData.partName}
                      </td>
                      {Array.from(
                        {
                          length: getPcsCountForLocation(
                            bundleIdx,
                            activeMeasurementTab
                          )
                        },
                        (_, pcsIdx) => {
                          const targetPcsName = `${activeMeasurementTab[0]}${
                            pcsIdx + 1
                          }`;
                          const fabricDefectLocationData = (
                            partData.fabricDefects || []
                          ).find((fd) => fd.location === activeMeasurementTab);
                          const pcsDefectData =
                            fabricDefectLocationData?.defectData?.find(
                              (dd) => dd.pcsName === targetPcsName
                            );
                          const defectsForCell = pcsDefectData?.defects || [];
                          return (
                            <td
                              key={pcsIdx}
                              className={`border p-1 text-xs text-center cursor-pointer ${
                                defectsForCell.length > 0
                                  ? "bg-red-100"
                                  : "bg-green-100"
                              }`}
                              onClick={() => {
                                setCurrentCellForDefectBox({
                                  bundleIdx,
                                  partIdx,
                                  locTab: activeMeasurementTab,
                                  pcsNameIdx: pcsIdx
                                });
                                setShowDefectBox(true);
                              }}
                            >
                              {defectsForCell
                                .map((d) => d.defectNameEng || d.defectName)
                                .join(", ")}
                            </td>
                          );
                        }
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <div className="flex justify-end mt-2">
            <button
              onClick={triggerUpdate}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              {t("cutting.applyBundleChanges")}
            </button>
          </div>
        </div>
      ))}

      {showNumPad && currentCellForNumPad && (
        <MeasurementNumPad
          onClose={() => {
            setShowNumPad(false);
            triggerUpdate();
          }}
          onInput={(decimal, fractionFromNumpad) => {
            const { bundleIdx, partName, mpDefinitionKey, locTab, valueIdx } =
              currentCellForNumPad;
            handleMeasurementInputChange(
              bundleIdx,
              partName,
              mpDefinitionKey,
              locTab,
              valueIdx,
              decimal,
              fractionFromNumpad
            );
          }}
          initialValue={
            localBundleData[
              currentCellForNumPad.bundleIdx
            ]?.measurementInsepctionData
              ?.find((p) => p.partName === currentCellForNumPad.partName)
              ?.measurementPointsData?.find(
                (storedMp) =>
                  storedMp.measurementPointName ===
                    currentCellForNumPad.mpDefinitionKey.measurementPointName &&
                  storedMp.panelName ===
                    currentCellForNumPad.mpDefinitionKey.panelName &&
                  storedMp.side === currentCellForNumPad.mpDefinitionKey.side &&
                  storedMp.direction ===
                    currentCellForNumPad.mpDefinitionKey.direction &&
                  storedMp.property ===
                    currentCellForNumPad.mpDefinitionKey.property
              )
              ?.measurementValues?.find(
                (mv) => mv.location === currentCellForNumPad.locTab
              )?.measurements[currentCellForNumPad.valueIdx]?.valuedecimal
          }
        />
      )}

      {showDefectBox && currentCellForDefectBox && (
        <DefectBox
          defects={(
            localBundleData[
              currentCellForDefectBox.bundleIdx
            ]?.measurementInsepctionData[
              currentCellForDefectBox.partIdx
            ]?.fabricDefects
              ?.find((fd) => fd.location === currentCellForDefectBox.locTab)
              ?.defectData?.find(
                (dd) =>
                  dd.pcsName ===
                  `${currentCellForDefectBox.locTab[0]}${
                    currentCellForDefectBox.pcsNameIdx + 1
                  }`
              )?.defects || []
          ).map((d) => ({ ...d, defectName: d.defectName }))}
          onClose={() => {
            setShowDefectBox(false);
            triggerUpdate();
          }}
          onAddDefect={(defectNameKey) => {
            const { bundleIdx, partIdx, locTab, pcsNameIdx } =
              currentCellForDefectBox;
            const targetPcsName = `${locTab[0]}${pcsNameIdx + 1}`;

            let existingDefects =
              localBundleData[bundleIdx]?.measurementInsepctionData[
                partIdx
              ]?.fabricDefects
                ?.find((fd) => fd.location === locTab)
                ?.defectData?.find((dd) => dd.pcsName === targetPcsName)
                ?.defects || [];

            const newDefectDetail = fabricDefectsList.find(
              (d) => d.defectName === defectNameKey
            );

            if (
              newDefectDetail &&
              !existingDefects.some(
                (d) => d.defectName === newDefectDetail.defectName
              )
            ) {
              const defectToAdd = { ...newDefectDetail, defectQty: 1 };
              const updated = [...existingDefects, defectToAdd];
              handleDefectChange(
                bundleIdx,
                partIdx,
                locTab,
                pcsNameIdx,
                updated
              );
            }
          }}
          onRemoveDefect={(defectIdx) => {
            const { bundleIdx, partIdx, locTab, pcsNameIdx } =
              currentCellForDefectBox;
            const targetPcsName = `${locTab[0]}${pcsNameIdx + 1}`;
            let existingDefects =
              localBundleData[bundleIdx]?.measurementInsepctionData[
                partIdx
              ]?.fabricDefects
                ?.find((fd) => fd.location === locTab)
                ?.defectData?.find((dd) => dd.pcsName === targetPcsName)
                ?.defects || [];
            existingDefects = existingDefects.filter((_, i) => i !== defectIdx);
            handleDefectChange(
              bundleIdx,
              partIdx,
              locTab,
              pcsNameIdx,
              existingDefects
            );
          }}
          onUpdateDefectCount={(defectIdx, newCount) => {
            const { bundleIdx, partIdx, locTab, pcsNameIdx } =
              currentCellForDefectBox;
            const targetPcsName = `${locTab[0]}${pcsNameIdx + 1}`;
            let existingDefects = JSON.parse(
              JSON.stringify(
                localBundleData[bundleIdx]?.measurementInsepctionData[
                  partIdx
                ]?.fabricDefects
                  ?.find((fd) => fd.location === locTab)
                  ?.defectData?.find((dd) => dd.pcsName === targetPcsName)
                  ?.defects || []
              )
            );
            if (existingDefects[defectIdx]) {
              existingDefects[defectIdx].defectQty = Math.max(0, newCount);
            }
            handleDefectChange(
              bundleIdx,
              partIdx,
              locTab,
              pcsNameIdx,
              existingDefects
            );
          }}
          fabricDefects={fabricDefectsList}
        />
      )}
    </div>
  );
};

export default MeasurementTableModify;
