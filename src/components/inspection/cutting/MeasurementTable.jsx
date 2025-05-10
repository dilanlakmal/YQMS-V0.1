//Old Code

// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { X, Check, Plus, Minus } from "lucide-react";
// import MeasurementNumPad from "./MeasurementNumPad";
// import { useTranslation } from "react-i18next";
// import { cuttingDefects } from "../../../constants/cuttingdefect";
// import DefectBox from "./DefectBox";

// // Helper function to convert decimal to fraction for display
// const decimalToFraction = (value) => {
//   if (value === null || value === undefined) return "";
//   if (value === 0) return "0";
//   const sign = value < 0 ? "-" : "";
//   const absValue = Math.abs(value);
//   const whole = Math.floor(absValue);
//   const decimal = absValue - whole;

//   if (decimal === 0) return `${sign}${whole}`;

//   const fractions = [
//     { fraction: "1/16", value: 1 / 16 },
//     { fraction: "1/8", value: 1 / 8 },
//     { fraction: "3/16", value: 3 / 16 },
//     { fraction: "1/4", value: 1 / 4 },
//     { fraction: "5/16", value: 5 / 16 },
//     { fraction: "3/8", value: 3 / 8 },
//     { fraction: "7/16", value: 7 / 16 },
//     { fraction: "1/2", value: 1 / 2 },
//     { fraction: "9/16", value: 9 / 16 },
//     { fraction: "5/8", value: 5 / 8 },
//     { fraction: "11/16", value: 11 / 16 },
//     { fraction: "3/4", value: 3 / 4 },
//     { fraction: "13/16", value: 13 / 16 },
//     { fraction: "7/8", value: 7 / 8 },
//     { fraction: "15/16", value: 15 / 16 },
//     { fraction: "1", value: 1 }
//   ];

//   const fraction = fractions.find(
//     (f) => Math.abs(f.value - decimal) < 0.001
//   )?.fraction;

//   if (!fraction) return `${sign}${absValue.toFixed(3)}`;

//   const [numerator, denominator] = fraction.split("/").map(Number);
//   return whole > 0
//     ? `${sign}${whole} ${numerator}/${denominator}`
//     : `${sign}${numerator}/${denominator}`;
// };

// const MeasurementTable = ({
//   tab,
//   measurementPoints,
//   numColumns,
//   tolerance,
//   onUpdate,
//   tableData,
//   setTableData,
//   filters,
//   defects,
//   setDefects
// }) => {
//   const [showNumPad, setShowNumPad] = useState(false);
//   const [currentCell, setCurrentCell] = useState({
//     rowIndex: null,
//     colIndex: null
//   });
//   const [showDefectBox, setShowDefectBox] = useState(false);
//   const [currentDefectCell, setCurrentDefectCell] = useState({
//     colIndex: null,
//     panelIndex: null
//   });
//   const { t, i18n } = useTranslation();
//   const prevMeasurementPoints = useRef(measurementPoints);

//   const calculateSummary = (data, currentDefects) => {
//     const usedPanelIndices = [
//       ...new Set(data.filter((row) => row.isUsed).map((row) => row.panelIndex))
//     ];
//     const totalParts = numColumns * usedPanelIndices.length;

//     let rejectMeasurement = 0;
//     let rejectDefects = 0;
//     const rejectSet = new Set();

//     usedPanelIndices.forEach((panelIndex) => {
//       for (let colIndex = 0; colIndex < numColumns; colIndex++) {
//         const hasDefects = currentDefects[colIndex][panelIndex - 1]?.length > 0;
//         const measurements = data
//           .filter((row) => row.isUsed && row.panelIndex === panelIndex)
//           .map((row) => row.values[colIndex].decimal);

//         const anyMeasurementOutOfTolerance = measurements.some(
//           (value) =>
//             value !== null &&
//             (value < tolerance.min ||
//               value > tolerance.max ||
//               value === -1 ||
//               value === 1)
//         );

//         if (hasDefects || anyMeasurementOutOfTolerance) {
//           const partKey = `${colIndex}-${panelIndex}`;
//           rejectSet.add(partKey);
//           if (hasDefects) rejectDefects++;
//           if (anyMeasurementOutOfTolerance) rejectMeasurement++;
//         }
//       }
//     });

//     const totalReject = rejectSet.size;
//     const totalPass = totalParts - totalReject;
//     const passRate =
//       totalParts > 0 ? ((totalPass / totalParts) * 100).toFixed(2) : 0;

//     onUpdate({
//       totalParts,
//       totalPass,
//       totalReject,
//       rejectMeasurement,
//       rejectDefects,
//       passRate
//     });
//   };

//   useEffect(() => {
//     if (tableData.length === 0) {
//       const initialData = measurementPoints.map((point, index) => ({
//         no: index + 1,
//         measurementPoint: point.pointName,
//         pointNameKhmer: point.pointNameKhmer,
//         panelName: point.panelName,
//         panelSide: point.panelSide,
//         panelDirection: point.panelDirection,
//         measurementSide: point.measurementSide,
//         panelIndex: point.panelIndex,
//         panelIndexName: point.panelIndexName,
//         panelIndexNameKhmer: point.panelIndexNameKhmer,
//         values: Array(numColumns).fill({ decimal: 0, fraction: "0" }),
//         isUsed: true
//       }));
//       setTableData(initialData);
//     } else if (tableData[0].values.length !== numColumns) {
//       const updatedData = tableData.map((row) => {
//         const currentValues = row.values;
//         const newValues =
//           currentValues.length < numColumns
//             ? [
//                 ...currentValues,
//                 ...Array(numColumns - currentValues.length).fill({
//                   decimal: 0,
//                   fraction: "0"
//                 })
//               ]
//             : currentValues.slice(0, numColumns);
//         return { ...row, values: newValues };
//       });
//       setTableData(updatedData);
//     }
//   }, [measurementPoints, numColumns]);

//   const handleCellChange = (
//     rowIndex,
//     colIndex,
//     decimalValue,
//     fractionValue
//   ) => {
//     const updatedData = [...tableData];
//     updatedData[rowIndex].values[colIndex] = {
//       decimal: Number(decimalValue),
//       fraction: fractionValue
//     };
//     setTableData(updatedData);
//     calculateSummary(updatedData, defects);
//   };

//   const toggleRowUsage = (rowIndex) => {
//     const updatedData = [...tableData];
//     updatedData[rowIndex].isUsed = !updatedData[rowIndex].isUsed;
//     setTableData(updatedData);
//     calculateSummary(updatedData, defects);
//   };

//   const togglePanelIndexUsage = (panelIndex) => {
//     const currentIsUsed = tableData.find(
//       (row) => row.panelIndex === panelIndex
//     )?.isUsed;
//     const newIsUsed = !currentIsUsed;
//     const updatedData = tableData.map((row) => {
//       if (row.panelIndex === panelIndex) {
//         return { ...row, isUsed: newIsUsed };
//       }
//       return row;
//     });
//     setTableData(updatedData);
//     calculateSummary(updatedData, defects);
//   };

//   const getColumnHeaders = () => {
//     const prefix = tab === "Top" ? "T" : tab === "Middle" ? "M" : "B";
//     const headers = ["No", "Panel Index", "Measurement Point"];
//     for (let i = 1; i <= numColumns; i++) {
//       headers.push(`${prefix}${i}`);
//     }
//     headers.push("Use");
//     return headers;
//   };

//   const handleCellClick = (filteredRowIndex, colIndex) => {
//     const row = filteredTableData[filteredRowIndex];
//     if (!row.isUsed) return;

//     const originalRowIndex = tableData.findIndex(
//       (r) =>
//         r.no === row.no &&
//         r.measurementPoint === row.measurementPoint &&
//         r.panelIndex === row.panelIndex
//     );

//     if (originalRowIndex !== -1) {
//       setCurrentCell({ rowIndex: originalRowIndex, colIndex });
//       setShowNumPad(true);
//     }
//   };

//   const handleDefectCellClick = (colIndex, panelIndex) => {
//     const isPanelUsed = tableData.some(
//       (row) => row.panelIndex === panelIndex && row.isUsed
//     );
//     if (!isPanelUsed) return;
//     setCurrentDefectCell({ colIndex, panelIndex });
//     setShowDefectBox(true);
//   };

//   const handleDefectSelect = (colIndex, panelIndex, value) => {
//     if (!value) return;
//     const updatedDefects = defects.map((col) => col.map((panel) => [...panel]));
//     const defect = cuttingDefects.find((d) => d.defectName === value);
//     updatedDefects[colIndex][panelIndex - 1] =
//       updatedDefects[colIndex][panelIndex - 1] || [];
//     updatedDefects[colIndex][panelIndex - 1].push({
//       defectName: defect.defectName,
//       defectNameEng: defect.defectNameEng,
//       defectNameKhmer: defect.defectNameKhmer,
//       defectCode: defect.defectCode,
//       count: 1
//     });
//     setDefects(updatedDefects);
//     calculateSummary(tableData, updatedDefects);
//   };

//   const removeDefect = (colIndex, panelIndex, defectIndex) => {
//     const updatedDefects = defects.map((col) => col.map((panel) => [...panel]));
//     updatedDefects[colIndex][panelIndex - 1].splice(defectIndex, 1);
//     setDefects(updatedDefects);
//     calculateSummary(tableData, updatedDefects);
//   };

//   const updateDefectCount = (colIndex, panelIndex, defectIndex, newCount) => {
//     const updatedDefects = defects.map((col) => col.map((panel) => [...panel]));
//     updatedDefects[colIndex][panelIndex - 1][defectIndex].count = Math.max(
//       1,
//       newCount
//     );
//     setDefects(updatedDefects);
//     calculateSummary(tableData, updatedDefects);
//   };

//   const filteredTableData = tableData.filter((row) => {
//     return (
//       (filters.panelName === "" || row.panelName === filters.panelName) &&
//       (filters.side === "" || row.panelSide === filters.side) &&
//       (filters.direction === "" || row.panelDirection === filters.direction) &&
//       (filters.lw === "" || row.measurementSide === filters.lw)
//     );
//   });

//   const allPanelIndices = Array.from({ length: 6 }, (_, i) => i + 1);

//   return (
//     <div className="mt-4">
//       {/* Measurement Table */}
//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse border border-gray-300">
//           <thead>
//             <tr className="bg-gray-200">
//               {getColumnHeaders().map((header, index) => (
//                 <th
//                   key={index}
//                   className="border border-gray-300 p-2 text-center text-sm"
//                 >
//                   {header}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {filteredTableData.map((row, filteredRowIndex) => (
//               <tr
//                 key={filteredRowIndex}
//                 className={`${
//                   row.isUsed ? "bg-green-50" : "bg-red-50 opacity-50"
//                 }`}
//               >
//                 <td className="border border-gray-300 p-2 text-center bg-white text-sm">
//                   {row.no}
//                 </td>
//                 <td className="border border-gray-300 p-2 bg-white flex flex-col items-center justify-center">
//                   <div className="flex items-center text-sm">
//                     {row.panelIndex}
//                     <button
//                       onClick={() => togglePanelIndexUsage(row.panelIndex)}
//                       className="ml-2 text-red-600 hover:text-red-800"
//                     >
//                       <X className="w-4 h-4" />
//                     </button>
//                   </div>
//                   <div className="text-xs">
//                     (
//                     {i18n.language === "kh"
//                       ? row.panelIndexNameKhmer
//                       : row.panelIndexName}
//                     )
//                   </div>
//                 </td>
//                 <td className="border border-gray-300 p-2 bg-white text-xs min-w-[50px]">
//                   {i18n.language === "kh"
//                     ? row.pointNameKhmer
//                     : row.measurementPoint}
//                 </td>
//                 {row.values.map((value, colIndex) => (
//                   <td
//                     key={colIndex}
//                     className="border border-gray-300 p-0 text-center text-sm min-w-[48px] sm:min-w-[80px]"
//                     onClick={() => handleCellClick(filteredRowIndex, colIndex)}
//                   >
//                     <input
//                       type="text"
//                       value={value.fraction || ""}
//                       readOnly
//                       className={`w-full h-full p-0 m-0 text-center border-none focus:outline-none ${
//                         value.decimal !== null &&
//                         typeof value.decimal === "number" &&
//                         (Number(value.decimal.toFixed(4)) < tolerance.min ||
//                           Number(value.decimal.toFixed(4)) > tolerance.max)
//                           ? "bg-red-100"
//                           : "bg-green-100"
//                       } ${
//                         !row.isUsed ? "cursor-not-allowed" : "cursor-pointer"
//                       }`}
//                     />
//                   </td>
//                 ))}
//                 <td className="border border-gray-300 p-2 text-center">
//                   <button
//                     onClick={() => toggleRowUsage(filteredRowIndex)}
//                     className={`${
//                       row.isUsed
//                         ? "text-green-600 hover:text-green-800"
//                         : "text-red-600 hover:text-red-800"
//                     }`}
//                   >
//                     {row.isUsed ? (
//                       <Check className="w-5 h-5" />
//                     ) : (
//                       <X className="w-5 h-5" />
//                     )}
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Defect Table */}
//       <hr className="my-4 border-gray-300" />
//       <h3 className="text-sm font-medium text-gray-600 mb-2">
//         {t("cutting.defectDetailsAcrossPanel")}
//       </h3>
//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse border border-gray-300">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="border border-gray-300 p-2 text-center text-sm min-w-[150px]">
//                 {t("cutting.panelIndex")}
//               </th>
//               {Array.from({ length: numColumns }, (_, i) => (
//                 <th
//                   key={i}
//                   className="border border-gray-300 p-2 text-center text-sm min-w-[100px]"
//                 >
//                   {tab[0]}
//                   {i + 1}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {allPanelIndices.map((panelIndex) => {
//               const isPanelUsed = tableData.some(
//                 (row) => row.panelIndex === panelIndex && row.isUsed
//               );
//               const panelRow = tableData.find(
//                 (row) => row.panelIndex === panelIndex
//               );
//               return (
//                 <tr
//                   key={panelIndex}
//                   className={`${
//                     isPanelUsed ? "bg-white" : "bg-gray-200 opacity-50"
//                   }`}
//                 >
//                   <td className="border border-gray-300 p-2 text-center text-sm">
//                     {panelIndex} (
//                     {panelRow
//                       ? i18n.language === "kh"
//                         ? panelRow.panelIndexNameKhmer
//                         : panelRow.panelIndexName
//                       : "N/A"}
//                     )
//                   </td>
//                   {Array.from({ length: numColumns }, (_, colIndex) => {
//                     const defectsForPanel =
//                       defects[colIndex][panelIndex - 1] || [];
//                     return (
//                       <td
//                         key={colIndex}
//                         className={`border border-gray-300 p-2 text-center text-xs cursor-pointer ${
//                           defectsForPanel.length > 0
//                             ? "bg-red-100"
//                             : "bg-green-100"
//                         } ${!isPanelUsed ? "cursor-not-allowed" : ""}`}
//                         onClick={() =>
//                           handleDefectCellClick(colIndex, panelIndex)
//                         }
//                       >
//                         {defectsForPanel.map((defect, index) => (
//                           <div key={index} className="leading-tight">
//                             {i18n.language === "kh"
//                               ? defect.defectNameKhmer
//                               : defect.defectNameEng}
//                           </div>
//                         ))}
//                       </td>
//                     );
//                   })}
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* Defect Box Popup */}
//       {showDefectBox && currentDefectCell.colIndex !== null && (
//         <DefectBox
//           defects={
//             defects[currentDefectCell.colIndex][
//               currentDefectCell.panelIndex - 1
//             ] || []
//           }
//           onClose={() => setShowDefectBox(false)}
//           onAddDefect={(value) =>
//             handleDefectSelect(
//               currentDefectCell.colIndex,
//               currentDefectCell.panelIndex,
//               value
//             )
//           }
//           onRemoveDefect={(defectIndex) =>
//             removeDefect(
//               currentDefectCell.colIndex,
//               currentDefectCell.panelIndex,
//               defectIndex
//             )
//           }
//           onUpdateDefectCount={(defectIndex, newCount) =>
//             updateDefectCount(
//               currentDefectCell.colIndex,
//               currentDefectCell.panelIndex,
//               defectIndex,
//               newCount
//             )
//           }
//         />
//       )}

//       {/* Measurement NumPad */}
//       {showNumPad && currentCell.rowIndex !== null && (
//         <MeasurementNumPad
//           onClose={() => setShowNumPad(false)}
//           onInput={(decimalValue, fractionValue) =>
//             handleCellChange(
//               currentCell.rowIndex,
//               currentCell.colIndex,
//               decimalValue,
//               fractionValue
//             )
//           }
//           initialValue={
//             tableData[currentCell.rowIndex].values[currentCell.colIndex].decimal
//           }
//         />
//       )}
//     </div>
//   );
// };

// export default MeasurementTable;

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { X, Check } from "lucide-react";
import MeasurementNumPad from "./MeasurementNumPad";
import { useTranslation } from "react-i18next";
import { cuttingDefects } from "../../../constants/cuttingdefect";
import DefectBox from "./DefectBox";

const decimalToFraction = (value) => {
  if (value === null || value === undefined) return "";
  if (value === 0) return "0";
  const sign = value < 0 ? "-" : "";
  const absValue = Math.abs(value);
  const whole = Math.floor(absValue);
  const decimal = absValue - whole;

  if (decimal === 0) return `${sign}${whole}`;

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
    { fraction: "3/4", value: 3 / 4 }, // Corrected 1/4 to 3/4
    { fraction: "13/16", value: 13 / 16 },
    { fraction: "7/8", value: 7 / 8 },
    { fraction: "15/16", value: 15 / 16 },
    { fraction: "1", value: 1 }
  ];

  const fraction = fractions.find(
    (f) => Math.abs(f.value - decimal) < 0.001
  )?.fraction;

  return fraction
    ? whole > 0
      ? `${sign}${whole} ${fraction}`
      : `${sign}${fraction}`
    : `${sign}${absValue.toFixed(3)}`;
};

const MeasurementTable = ({
  tab,
  measurementPoints,
  numColumns,
  tolerance,
  onUpdate,
  tableData,
  setTableData,
  filters,
  defects,
  setDefects,
  bundleIndex,
  selectedParts
}) => {
  const [showNumPad, setShowNumPad] = useState(false);
  const [currentCell, setCurrentCell] = useState({
    rowIndex: null,
    colIndex: null
  });
  const [showDefectBox, setShowDefectBox] = useState(false);
  const [currentDefectCell, setCurrentDefectCell] = useState({
    colIndex: null,
    panelIndex: null
  });
  const { t, i18n } = useTranslation();

  // Define memoized values that are used by other hooks or functions first.
  const getColumnHeaders = useMemo(() => {
    const prefix = tab === "Top" ? "T" : tab === "Middle" ? "M" : "B";
    const headers = [
      "No",
      t("cutting.panelIndex"),
      t("cutting.measurementPoint")
    ];
    for (let i = 1; i <= numColumns; i++) {
      headers.push(`${prefix}${i}`);
    }
    headers.push(t("cutting.use"));
    return headers;
  }, [tab, numColumns, t]);

  const panelIndicesForDefectTable = useMemo(() => {
    return [
      ...new Set(
        measurementPoints
          .filter((point) => selectedParts.includes(point.panelIndexName))
          .map((point) => point.panelIndex)
      )
    ].sort((a, b) => a - b);
  }, [measurementPoints, selectedParts]);

  // **IMPORTANT: Define filteredTableData before callbacks that depend on it.**
  const filteredTableData = useMemo(() => {
    if (!tableData) return [];
    return tableData.filter((row) => {
      return (
        (filters.panelName === "" || row.panelName === filters.panelName) &&
        (filters.side === "" || row.panelSide === filters.side) &&
        (filters.direction === "" ||
          row.panelDirection === filters.direction) &&
        (filters.lw === "" || row.measurementSide === filters.lw)
      );
    });
  }, [tableData, filters]);

  const calculateSummary = useCallback(
    (currentMeasurementData, currentDefectsData) => {
      if (!currentMeasurementData) {
        onUpdate({
          totalParts: 0,
          totalPass: 0,
          totalReject: 0,
          rejectMeasurement: 0,
          rejectDefects: 0,
          passRate: 0,
          bundleIndex
        });
        return;
      }

      const usedPanelIndices = [
        ...new Set(
          currentMeasurementData
            .filter((row) => row.isUsed)
            .map((row) => row.panelIndex)
        )
      ];
      const totalParts = numColumns * usedPanelIndices.length;

      let finalRejectMeasurement = 0;
      let finalRejectDefects = 0;
      const rejectSet = new Set();

      usedPanelIndices.forEach((panelIndex) => {
        for (let colIndex = 0; colIndex < numColumns; colIndex++) {
          const hasDefects =
            currentDefectsData &&
            currentDefectsData[colIndex] &&
            currentDefectsData[colIndex][panelIndex - 1]?.length > 0;

          const measurementsForPartInColumn = currentMeasurementData
            .filter((row) => row.isUsed && row.panelIndex === panelIndex)
            .map((row) => row.values[colIndex]?.decimal);

          const anyMeasurementOutOfTolerance = measurementsForPartInColumn.some(
            (value) =>
              value !== null && (value < tolerance.min || value > tolerance.max)
          );

          if (hasDefects || anyMeasurementOutOfTolerance) {
            const partKey = `${colIndex}-${panelIndex}`;
            rejectSet.add(partKey);
          }
        }
      });

      rejectSet.forEach((partKey) => {
        const [colStr, panelIdxStr] = partKey.split("-");
        const colIndex = parseInt(colStr);
        const panelIndex = parseInt(panelIdxStr);

        const measurementsForRejectedPart = currentMeasurementData
          .filter((row) => row.isUsed && row.panelIndex === panelIndex)
          .map((row) => row.values[colIndex]?.decimal);

        if (
          measurementsForRejectedPart.some(
            (val) =>
              val !== null && (val < tolerance.min || val > tolerance.max)
          )
        ) {
          finalRejectMeasurement++;
        }
        if (
          currentDefectsData &&
          currentDefectsData[colIndex] &&
          currentDefectsData[colIndex][panelIndex - 1]?.length > 0
        ) {
          finalRejectDefects++;
        }
      });

      const totalReject = rejectSet.size;
      const totalPass = totalParts - totalReject;
      const passRate =
        totalParts > 0
          ? parseFloat(((totalPass / totalParts) * 100).toFixed(2))
          : 0;

      onUpdate({
        totalParts,
        totalPass,
        totalReject,
        rejectMeasurement: finalRejectMeasurement,
        rejectDefects: finalRejectDefects,
        passRate,
        bundleIndex
      });
    },
    [numColumns, tolerance, onUpdate, bundleIndex]
  );

  useEffect(() => {
    let newConstructedData = [];
    let currentNo = 1;

    selectedParts.forEach((selectedPartName) => {
      const pointsForThisPart = measurementPoints.filter(
        (mp) => mp.panelIndexName === selectedPartName
      );

      pointsForThisPart.forEach((point) => {
        const existingRow = tableData.find(
          (r) =>
            r.panelIndexName === point.panelIndexName &&
            r.measurementPoint === point.pointName
        );

        let rowValues;
        if (existingRow) {
          rowValues = Array(numColumns).fill({ decimal: 0, fraction: "0" });
          for (
            let i = 0;
            i < Math.min(existingRow.values.length, numColumns);
            i++
          ) {
            rowValues[i] = existingRow.values[i];
          }
        } else {
          rowValues = Array(numColumns).fill({ decimal: 0, fraction: "0" });
        }

        newConstructedData.push({
          no: currentNo++,
          measurementPoint: point.pointName,
          pointNameKhmer: point.pointNameKhmer,
          panelName: point.panelName,
          panelSide: point.panelSide,
          panelDirection: point.panelDirection,
          measurementSide: point.measurementSide,
          panelIndex: point.panelIndex,
          panelIndexName: point.panelIndexName,
          panelIndexNameKhmer: point.panelIndexNameKhmer,
          values: rowValues,
          isUsed: existingRow
            ? existingRow.isUsed !== undefined
              ? existingRow.isUsed
              : true
            : true
        });
      });
    });

    if (JSON.stringify(tableData) !== JSON.stringify(newConstructedData)) {
      setTableData(newConstructedData);
      // calculateSummary will be called in the next render cycle if tableData changes, or can be called here.
      // To ensure summary is updated with the newConstructedData immediately:
      calculateSummary(newConstructedData, defects);
    } else {
      // If data structure is same, but values or defects might have changed, ensure summary is current.
      calculateSummary(tableData, defects);
    }
  }, [
    selectedParts,
    measurementPoints,
    numColumns,
    tableData,
    defects,
    setTableData,
    calculateSummary
  ]);

  const handleCellChange = useCallback(
    (decimalValue, fractionValue) => {
      if (currentCell.rowIndex === null || currentCell.colIndex === null)
        return;

      const updatedData = [...tableData];
      if (!updatedData[currentCell.rowIndex]) return;

      updatedData[currentCell.rowIndex].values[currentCell.colIndex] = {
        decimal: Number(decimalValue),
        fraction: fractionValue
      };
      setTableData(updatedData);
      // Summary will be recalculated by useEffect due to tableData change.
    },
    [tableData, setTableData, currentCell.rowIndex, currentCell.colIndex]
  );

  const toggleRowUsage = useCallback(
    (filteredRowIndex) => {
      const clickedRowObject = filteredTableData[filteredRowIndex]; // Uses filteredTableData
      if (!clickedRowObject) return;

      const originalRowIndexInProp = tableData.findIndex(
        (r) =>
          r.panelIndexName === clickedRowObject.panelIndexName &&
          r.measurementPoint === clickedRowObject.measurementPoint
      );
      if (originalRowIndexInProp === -1) return;

      const updatedData = [...tableData];
      updatedData[originalRowIndexInProp].isUsed =
        !updatedData[originalRowIndexInProp].isUsed;
      setTableData(updatedData);
      // Summary will be recalculated by useEffect due to tableData change.
    },
    [tableData, setTableData, filteredTableData]
  ); // filteredTableData is a dependency here.

  const handleDefectSelect = useCallback(
    (colIndex, panelIndex, value) => {
      if (!value) return;

      const maxPIndex =
        panelIndicesForDefectTable.length > 0
          ? Math.max(0, ...panelIndicesForDefectTable)
          : 0;

      let updatedDefectsCopy;
      if (
        defects &&
        defects.length === numColumns &&
        defects.every(
          (col) =>
            col &&
            col.length >= (panelIndex > maxPIndex ? panelIndex : maxPIndex)
        )
      ) {
        updatedDefectsCopy = JSON.parse(JSON.stringify(defects));
      } else {
        updatedDefectsCopy = Array(numColumns)
          .fill(null)
          .map(() =>
            Array(maxPIndex > 0 ? maxPIndex : panelIndex > 0 ? panelIndex : 1)
              .fill(null)
              .map(() => [])
          );
        if (defects) {
          for (let c = 0; c < Math.min(numColumns, defects.length); c++) {
            if (defects[c]) {
              for (
                let p_idx = 0;
                p_idx <
                Math.min(updatedDefectsCopy[c].length, defects[c].length);
                p_idx++
              ) {
                if (Array.isArray(defects[c][p_idx])) {
                  updatedDefectsCopy[c][p_idx] = [...defects[c][p_idx]];
                }
              }
            }
          }
        }
      }

      const defectDetail = cuttingDefects.find((d) => d.defectName === value);
      if (!defectDetail) return;

      if (!updatedDefectsCopy[colIndex])
        updatedDefectsCopy[colIndex] = Array(
          maxPIndex > 0 ? maxPIndex : panelIndex > 0 ? panelIndex : 1
        )
          .fill(null)
          .map(() => []);
      while (updatedDefectsCopy[colIndex].length < panelIndex) {
        updatedDefectsCopy[colIndex].push([]);
      }
      if (!updatedDefectsCopy[colIndex][panelIndex - 1])
        updatedDefectsCopy[colIndex][panelIndex - 1] = [];

      updatedDefectsCopy[colIndex][panelIndex - 1].push({
        defectName: defectDetail.defectName,
        defectNameEng: defectDetail.defectNameEng,
        defectNameKhmer: defectDetail.defectNameKhmer,
        defectCode: defectDetail.defectCode,
        count: 1
      });
      setDefects(updatedDefectsCopy);
      // Summary will be recalculated by useEffect due to defects change.
    },
    [defects, setDefects, numColumns, panelIndicesForDefectTable]
  );

  const removeDefect = useCallback(
    (colIndex, panelIndex, defectIndex) => {
      if (!defects || !defects[colIndex] || !defects[colIndex][panelIndex - 1])
        return;
      const updatedDefectsCopy = JSON.parse(JSON.stringify(defects));
      updatedDefectsCopy[colIndex][panelIndex - 1].splice(defectIndex, 1);
      setDefects(updatedDefectsCopy);
    },
    [defects, setDefects]
  );

  const updateDefectCount = useCallback(
    (colIndex, panelIndex, defectIndex, newCount) => {
      if (
        !defects ||
        !defects[colIndex] ||
        !defects[colIndex][panelIndex - 1] ||
        !defects[colIndex][panelIndex - 1][defectIndex]
      )
        return;
      const updatedDefectsCopy = JSON.parse(JSON.stringify(defects));
      updatedDefectsCopy[colIndex][panelIndex - 1][defectIndex].count =
        Math.max(1, newCount);
      setDefects(updatedDefectsCopy);
    },
    [defects, setDefects]
  );

  // Regular functions
  const handleCellClick = (filteredRowIndex, colIndex) => {
    const clickedRowObject = filteredTableData[filteredRowIndex];
    if (!clickedRowObject || !clickedRowObject.isUsed) return;

    const originalRowIndexInProp = tableData.findIndex(
      (r) =>
        r.panelIndexName === clickedRowObject.panelIndexName &&
        r.measurementPoint === clickedRowObject.measurementPoint
    );

    if (originalRowIndexInProp !== -1) {
      setCurrentCell({ rowIndex: originalRowIndexInProp, colIndex });
      setShowNumPad(true);
    }
  };

  const handleDefectCellClick = (colIndex, panelIndex) => {
    const isPanelUsed = tableData.some(
      (row) => row.panelIndex === panelIndex && row.isUsed
    );
    if (!isPanelUsed) return;
    setCurrentDefectCell({ colIndex, panelIndex });
    setShowDefectBox(true);
  };

  // Render guard
  if (!tableData || !defects || !selectedParts) {
    if (selectedParts && selectedParts.length === 0) {
      return (
        <div className="mt-4 p-4 text-center text-gray-500">
          {t("cutting.noPartsSelectedForBundle")}
        </div>
      );
    }
    return <div>{t("cutting.loadingMeasurementData")}</div>;
  }

  return (
    <div className="mt-4">
      {/* Measurement Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              {getColumnHeaders.map((header, index) => (
                <th
                  key={index}
                  className="border border-gray-300 p-2 text-center text-xs sm:text-sm"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTableData.map((row, filteredRowIndex) => (
              <tr
                key={`${row.panelIndexName}-${row.measurementPoint}-${row.no}`}
                className={`${
                  row.isUsed ? "bg-green-50" : "bg-red-50 opacity-50"
                }`}
              >
                <td className="border border-gray-300 p-2 text-center bg-white text-xs sm:text-sm">
                  {row.no}
                </td>
                <td className="border border-gray-300 p-2 bg-white text-xs sm:text-sm">
                  {i18n.language === "kh"
                    ? row.panelIndexNameKhmer
                    : row.panelIndexName}
                </td>
                <td className="border border-gray-300 p-2 bg-white text-xs sm:text-sm min-w-[50px]">
                  {i18n.language === "kh"
                    ? row.pointNameKhmer
                    : row.measurementPoint}
                </td>
                {row.values.map((valueObj, colIdx) => (
                  <td
                    key={colIdx}
                    className="border border-gray-300 p-0 text-center text-xs sm:text-sm min-w-[48px] sm:min-w-[80px]"
                    onClick={() => handleCellClick(filteredRowIndex, colIdx)}
                  >
                    <input
                      type="text"
                      value={valueObj?.fraction || ""}
                      readOnly
                      className={`w-full h-full p-1 m-0 text-center border-none focus:outline-none text-xs sm:text-sm ${
                        valueObj?.decimal !== null &&
                        typeof valueObj?.decimal === "number" &&
                        (Number(valueObj.decimal.toFixed(4)) < tolerance.min ||
                          Number(valueObj.decimal.toFixed(4)) > tolerance.max)
                          ? "bg-red-100"
                          : "bg-green-100"
                      } ${
                        !row.isUsed ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    />
                  </td>
                ))}
                <td className="border border-gray-300 p-2 text-center">
                  <button
                    onClick={() => toggleRowUsage(filteredRowIndex)}
                    className={`${
                      row.isUsed
                        ? "text-green-600 hover:text-green-800"
                        : "text-red-600 hover:text-red-800"
                    }`}
                  >
                    {row.isUsed ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Defect Table */}

      <hr className="my-4 border-gray-300" />
      <h3 className="text-sm font-medium text-gray-600 mb-2">
        {t("cutting.defectDetailsAcrossPanel")}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 p-2 text-center text-xs sm:text-sm min-w-[120px] sm:min-w-[150px]">
                {t("cutting.panelIndex")}
              </th>
              {Array.from({ length: numColumns }, (_, i) => (
                <th
                  key={i}
                  className="border border-gray-300 p-2 text-center text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]"
                >
                  {tab[0]}
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {panelIndicesForDefectTable.map((panelIndex) => {
              const isPanelUsed = tableData.some(
                (row) => row.panelIndex === panelIndex && row.isUsed
              );
              const panelRowInfo = measurementPoints.find(
                (row) =>
                  row.panelIndex === panelIndex &&
                  selectedParts.includes(row.panelIndexName)
              );
              return (
                <tr
                  key={panelIndex}
                  className={`${
                    isPanelUsed ? "bg-white" : "bg-gray-200 opacity-50"
                  }`}
                >
                  <td className="border border-gray-300 p-2 text-center text-xs sm:text-sm">
                    {panelRowInfo
                      ? i18n.language === "kh"
                        ? panelRowInfo.panelIndexNameKhmer
                        : panelRowInfo.panelIndexName
                      : `${t("cutting.panel")} ${panelIndex}`}
                  </td>
                  {Array.from({ length: numColumns }, (_, colIndex) => {
                    const defectsForCell =
                      defects[colIndex]?.[panelIndex - 1] || [];
                    return (
                      <td
                        key={colIndex}
                        className={`border border-gray-300 p-2 text-center text-xs cursor-pointer ${
                          defectsForCell.length > 0
                            ? "bg-red-100"
                            : "bg-green-100"
                        } ${!isPanelUsed ? "cursor-not-allowed" : ""}`}
                        onClick={() =>
                          isPanelUsed &&
                          handleDefectCellClick(colIndex, panelIndex)
                        }
                      >
                        {defectsForCell.map((defect, defectIdx) => (
                          <div key={defectIdx} className="leading-tight">
                            {i18n.language === "kh"
                              ? defect.defectNameKhmer
                              : defect.defectNameEng}
                            {defect.count > 1 ? ` (${defect.count})` : ""}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Defect Box Popup */}
      {showDefectBox &&
        currentDefectCell.colIndex !== null &&
        currentDefectCell.panelIndex !== null && (
          <DefectBox
            defects={
              defects[currentDefectCell.colIndex]?.[
                currentDefectCell.panelIndex - 1
              ] || []
            }
            onClose={() => setShowDefectBox(false)}
            onAddDefect={(value) =>
              handleDefectSelect(
                currentDefectCell.colIndex,
                currentDefectCell.panelIndex,
                value
              )
            }
            onRemoveDefect={(defectIndex) =>
              removeDefect(
                currentDefectCell.colIndex,
                currentDefectCell.panelIndex,
                defectIndex
              )
            }
            onUpdateDefectCount={(defectIndex, newCount) =>
              updateDefectCount(
                currentDefectCell.colIndex,
                currentDefectCell.panelIndex,
                defectIndex,
                newCount
              )
            }
          />
        )}

      {/* Measurement NumPad */}

      {showNumPad &&
        currentCell.rowIndex !== null &&
        tableData[currentCell.rowIndex] && (
          <MeasurementNumPad
            onClose={() => setShowNumPad(false)}
            onInput={(decimalValue, fractionValue) =>
              handleCellChange(decimalValue, fractionValue)
            }
            initialValue={
              tableData[currentCell.rowIndex].values[currentCell.colIndex]
                ?.decimal
            }
          />
        )}
    </div>
  );
};

export default MeasurementTable;
