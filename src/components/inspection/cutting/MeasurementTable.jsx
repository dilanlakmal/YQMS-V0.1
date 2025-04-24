import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, Plus, Minus } from "lucide-react";
import MeasurementNumPad from "./MeasurementNumPad";
import { cuttingDefects } from "../../../constants/cuttingdefect";

// Helper function to convert decimal to fraction for display
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
    { fraction: "3/4", value: 3 / 4 },
    { fraction: "13/16", value: 13 / 16 },
    { fraction: "7/8", value: 7 / 8 },
    { fraction: "15/16", value: 15 / 16 },
    { fraction: "1", value: 1 }
  ];

  const fraction = fractions.find(
    (f) => Math.abs(f.value - decimal) < 0.001
  )?.fraction;

  if (!fraction) return `${sign}${absValue.toFixed(3)}`;

  const [numerator, denominator] = fraction.split("/").map(Number);
  return whole > 0
    ? `${sign}${whole} ${numerator}/${denominator}`
    : `${sign}${numerator}/${denominator}`;
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
  setDefects
}) => {
  const [showNumPad, setShowNumPad] = useState(false);
  const [currentCell, setCurrentCell] = useState({
    rowIndex: null,
    colIndex: null
  });
  const [showDefectDropdown, setShowDefectDropdown] = useState(
    Array(numColumns)
      .fill()
      .map(() => Array(5).fill(false))
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (tableData.length === 0) {
      const initialData = measurementPoints.map((point, index) => ({
        no: index + 1,
        measurementPoint: point.pointName,
        panelName: point.panelName,
        panelSide: point.panelSide,
        panelDirection: point.panelDirection,
        measurementSide: point.measurementSide,
        panelIndex: point.panelIndex,
        values: Array(numColumns).fill({ decimal: 0, fraction: "0" }),
        isUsed: true
      }));
      setTableData(initialData);
      calculateSummary(initialData, defects);
    } else if (tableData[0].values.length !== numColumns) {
      const updatedData = tableData.map((row) => {
        const currentValues = row.values;
        const newValues =
          currentValues.length < numColumns
            ? [
                ...currentValues,
                ...Array(numColumns - currentValues.length).fill({
                  decimal: 0,
                  fraction: "0"
                })
              ]
            : currentValues.slice(0, numColumns);
        return { ...row, values: newValues };
      });
      setTableData(updatedData);
      calculateSummary(updatedData, defects);
    } else {
      calculateSummary(tableData, defects);
    }
  }, [measurementPoints, numColumns, filters, defects]);

  const handleCellChange = (
    rowIndex,
    colIndex,
    decimalValue,
    fractionValue
  ) => {
    const updatedData = [...tableData];
    updatedData[rowIndex].values[colIndex] = {
      decimal: decimalValue,
      fraction: fractionValue
    };
    setTableData(updatedData);
    calculateSummary(updatedData, defects);
  };

  const toggleRowUsage = (rowIndex) => {
    const updatedData = [...tableData];
    updatedData[rowIndex].isUsed = !updatedData[rowIndex].isUsed;
    setTableData(updatedData);
    calculateSummary(updatedData, defects);
  };

  const togglePanelIndexUsage = (panelIndex) => {
    const currentIsUsed = tableData.find(
      (row) => row.panelIndex === panelIndex
    )?.isUsed;
    const newIsUsed = !currentIsUsed;
    const updatedData = tableData.map((row) => {
      if (row.panelIndex === panelIndex) {
        return { ...row, isUsed: newIsUsed };
      }
      return row;
    });
    setTableData(updatedData);
    calculateSummary(updatedData, defects);
  };

  const calculateSummary = (data, currentDefects) => {
    const usedPanelIndices = [
      ...new Set(data.filter((row) => row.isUsed).map((row) => row.panelIndex))
    ];
    const totalParts = numColumns * usedPanelIndices.length;

    let rejectMeasurement = 0;
    let rejectDefects = 0;
    const rejectSet = new Set();

    usedPanelIndices.forEach((panelIndex) => {
      for (let colIndex = 0; colIndex < numColumns; colIndex++) {
        const hasDefects = currentDefects[colIndex][panelIndex - 1]?.length > 0;
        const measurements = data
          .filter((row) => row.isUsed && row.panelIndex === panelIndex)
          .map((row) => row.values[colIndex].decimal);

        const anyMeasurementOutOfTolerance = measurements.some(
          (value) =>
            value !== null && (value < tolerance.min || value > tolerance.max)
        );

        if (hasDefects || anyMeasurementOutOfTolerance) {
          const partKey = `${colIndex}-${panelIndex}`;
          rejectSet.add(partKey);
          if (hasDefects) rejectDefects++;
          if (anyMeasurementOutOfTolerance) rejectMeasurement++;
        }
      }
    });

    const totalReject = rejectSet.size;
    const totalPass = totalParts - totalReject;
    const passRate =
      totalParts > 0 ? ((totalPass / totalParts) * 100).toFixed(2) : 0;

    onUpdate({
      totalParts,
      totalPass,
      totalReject,
      rejectMeasurement,
      rejectDefects,
      passRate
    });
  };

  const getColumnHeaders = () => {
    const prefix = tab === "Top" ? "T" : tab === "Middle" ? "M" : "B";
    const headers = [
      "No",
      "Panel Index",
      "Measurement Point",
      "Panel Name",
      "Side",
      "Direction",
      "L/W"
    ];
    for (let i = 1; i <= numColumns; i++) {
      headers.push(`${prefix}${i}`);
    }
    headers.push("Use");
    return headers;
  };

  const handleCellClick = (filteredRowIndex, colIndex) => {
    const row = filteredTableData[filteredRowIndex];
    if (!row.isUsed) return;

    // Find the original index in tableData
    const originalRowIndex = tableData.findIndex(
      (r) =>
        r.no === row.no &&
        r.measurementPoint === row.measurementPoint &&
        r.panelIndex === row.panelIndex
    );

    if (originalRowIndex !== -1) {
      setCurrentCell({ rowIndex: originalRowIndex, colIndex });
      setShowNumPad(true);
    }
  };

  const toggleDefectDropdown = (colIndex, panelIndex) => {
    setShowDefectDropdown((prev) => {
      const newShowDefectDropdown = prev.map((col) => [...col]);
      newShowDefectDropdown[colIndex][panelIndex - 1] =
        !newShowDefectDropdown[colIndex][panelIndex - 1];
      return newShowDefectDropdown;
    });
  };

  const handleDefectSelect = (colIndex, panelIndex, value) => {
    const updatedDefects = defects.map((col) => col.map((panel) => [...panel]));
    const defect = cuttingDefects.find((d) => d.defectName === value);
    updatedDefects[colIndex][panelIndex - 1] =
      updatedDefects[colIndex][panelIndex - 1] || [];
    updatedDefects[colIndex][panelIndex - 1].push({
      defectName: defect.defectName,
      defectNameEng: defect.defectNameEng,
      defectNameKhmer: defect.defectNameKhmer,
      defectCode: defect.defectCode,
      count: 1
    });
    setDefects(updatedDefects);
    toggleDefectDropdown(colIndex, panelIndex);
    calculateSummary(tableData, updatedDefects);
  };

  const removeDefect = (colIndex, panelIndex, defectIndex) => {
    const updatedDefects = defects.map((col) => col.map((panel) => [...panel]));
    updatedDefects[colIndex][panelIndex - 1].splice(defectIndex, 1);
    setDefects(updatedDefects);
    calculateSummary(tableData, updatedDefects);
  };

  const updateDefectCount = (colIndex, panelIndex, defectIndex, newCount) => {
    const updatedDefects = defects.map((col) => col.map((panel) => [...panel]));
    updatedDefects[colIndex][panelIndex - 1][defectIndex].count = Math.max(
      1,
      newCount
    );
    setDefects(updatedDefects);
    calculateSummary(tableData, updatedDefects);
  };

  const filteredTableData = tableData.filter((row) => {
    return (
      (filters.panelName === "" || row.panelName === filters.panelName) &&
      (filters.side === "" || row.panelSide === filters.side) &&
      (filters.direction === "" || row.panelDirection === filters.direction) &&
      (filters.lw === "" || row.measurementSide === filters.lw)
    );
  });

  const visiblePanelIndices = [
    ...new Set(
      filteredTableData.filter((row) => row.isUsed).map((row) => row.panelIndex)
    )
  ].sort((a, b) => a - b);

  const allPanelIndices = Array.from({ length: 5 }, (_, i) => i + 1);
  const defectPanelIndices =
    filters.panelName === "" &&
    filters.side === "" &&
    filters.direction === "" &&
    filters.lw === ""
      ? allPanelIndices
      : visiblePanelIndices;
  const totalDefectPages = defectPanelIndices.length; // One page per panel index
  const paginatedPanelIndices = [defectPanelIndices[currentPage - 1]]; // Show only one panel index per page

  return (
    <div className="mt-4">
      {/* Measurement Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              {getColumnHeaders().map((header, index) => (
                <th
                  key={index}
                  className="border border-gray-300 p-2 text-center text-sm"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTableData.map((row, filteredRowIndex) => (
              <tr
                key={filteredRowIndex}
                className={`${
                  row.isUsed ? "bg-green-50" : "bg-red-50 opacity-50"
                }`}
              >
                <td className="border border-gray-300 p-2 text-center bg-white text-sm">
                  {row.no}
                </td>
                <td className="border border-gray-300 p-2 text-center bg-white text-sm">
                  {row.panelIndex}
                  <button
                    onClick={() => togglePanelIndexUsage(row.panelIndex)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </td>
                <td className="border border-gray-300 p-2 bg-white text-sm">
                  {row.measurementPoint}
                </td>
                <td className="border border-gray-300 p-2 text-center bg-white text-sm">
                  {row.panelName}
                </td>
                <td className="border border-gray-300 p-2 text-center bg-white text-sm">
                  {row.panelSide}
                </td>
                <td className="border border-gray-300 p-2 text-center bg-white text-sm">
                  {row.panelDirection}
                </td>
                <td className="border border-gray-300 p-2 text-center bg-white text-sm">
                  {row.measurementSide}
                </td>
                {row.values.map((value, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-gray-300 p-0 text-center text-sm min-w-[48px] sm:min-w-[80px]"
                    onClick={() => handleCellClick(filteredRowIndex, colIndex)}
                  >
                    <input
                      type="text"
                      value={value.fraction || ""}
                      readOnly
                      className={`w-full h-full p-0 m-0 text-center border-none focus:outline-none ${
                        value.decimal !== null &&
                        !isNaN(parseFloat(value.decimal)) &&
                        (parseFloat(value.decimal) < tolerance.min ||
                          parseFloat(value.decimal) > tolerance.max)
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
                      <Check className="w-5 h-5" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Defect Details */}
      <hr className="my-4 border-gray-300" />
      <h3 className="text-sm font-medium text-gray-600 mb-2">
        Defect Details Across Panel
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {paginatedPanelIndices.map((panelIndex) =>
          Array.from({ length: numColumns }, (_, colIndex) => {
            const colName = `${
              tab === "Top" ? "T" : tab === "Middle" ? "M" : "B"
            }${colIndex + 1}`;
            const defectsForPanel = defects[colIndex][panelIndex - 1] || [];
            const isPanelUsed = tableData.some(
              (row) => row.panelIndex === panelIndex && row.isUsed
            );
            return (
              <div
                key={`${colIndex}-${panelIndex}`}
                className={`p-2 rounded-lg ${
                  isPanelUsed ? "bg-gray-100" : "bg-gray-300 opacity-50"
                }`}
                //className="p-2 bg-gray-100 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">
                    {colName} - Panel {panelIndex}
                  </span>
                  <button
                    onClick={() => toggleDefectDropdown(colIndex, panelIndex)}
                    className={`p-1 rounded-full ${
                      isPanelUsed
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-400 text-gray-600 cursor-not-allowed"
                    }`}
                    disabled={!isPanelUsed}
                    //className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
                {defectsForPanel.map((defect, defectIndex) => (
                  <div
                    key={defectIndex}
                    className="flex items-center space-x-2 mb-1"
                  >
                    <button
                      onClick={() =>
                        updateDefectCount(
                          colIndex,
                          panelIndex,
                          defectIndex,
                          defect.count - 1
                        )
                      }
                      className={`p-1 rounded-full ${
                        isPanelUsed
                          ? "bg-gray-500 text-white hover:bg-gray-600"
                          : "bg-gray-400 text-gray-600 cursor-not-allowed"
                      }`}
                      disabled={!isPanelUsed}
                      //className="p-1 bg-gray-500 text-white rounded-full hover:bg-gray-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={defect.count}
                      readOnly
                      className="w-12 p-1 text-center border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() =>
                        updateDefectCount(
                          colIndex,
                          panelIndex,
                          defectIndex,
                          defect.count + 1
                        )
                      }
                      className={`p-1 rounded-full ${
                        isPanelUsed
                          ? "bg-gray-500 text-white hover:bg-gray-600"
                          : "bg-gray-400 text-gray-600 cursor-not-allowed"
                      }`}
                      disabled={!isPanelUsed}
                      //className="p-1 bg-gray-500 text-white rounded-full hover:bg-gray-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <select
                      value={defect.defectName}
                      onChange={(e) => {
                        const updatedDefects = defects.map((col) =>
                          col.map((panel) => [...panel])
                        );
                        const newDefect = cuttingDefects.find(
                          (d) => d.defectName === e.target.value
                        );
                        updatedDefects[colIndex][panelIndex - 1][defectIndex] =
                          { ...newDefect, count: defect.count };
                        setDefects(updatedDefects);
                        calculateSummary(tableData, updatedDefects);
                      }}
                      className={`p-1 border border-gray-300 rounded text-sm flex-1 ${
                        !isPanelUsed ? "cursor-not-allowed bg-gray-200" : ""
                      }`}
                      disabled={!isPanelUsed}
                      //className="p-1 border border-gray-300 rounded text-sm flex-1"
                    >
                      {cuttingDefects.map((d, i) => (
                        <option key={i} value={d.defectName}>
                          {d.defectNameEng} ({d.defectNameKhmer})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        removeDefect(colIndex, panelIndex, defectIndex)
                      }
                      className={`p-1 rounded-full ${
                        isPanelUsed
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-gray-400 text-gray-600 cursor-not-allowed"
                      }`}
                      disabled={!isPanelUsed}
                      //className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {showDefectDropdown[colIndex][panelIndex - 1] && (
                  <select
                    onChange={(e) =>
                      handleDefectSelect(colIndex, panelIndex, e.target.value)
                    }
                    className={`mt-1 p-1 border border-gray-300 rounded w-full text-sm ${
                      !isPanelUsed ? "cursor-not-allowed bg-gray-200" : ""
                    }`}
                    disabled={!isPanelUsed}
                    //className="mt-1 p-1 border border-gray-300 rounded w-full text-sm"
                  >
                    <option value="">Select Defect</option>
                    {cuttingDefects.map((defect, index) => (
                      <option key={index} value={defect.defectName}>
                        {defect.defectNameEng} ({defect.defectNameKhmer})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalDefectPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalDefectPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalDefectPages))
            }
            disabled={currentPage === totalDefectPages}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Measurement NumPad */}
      {showNumPad && currentCell.rowIndex !== null && (
        <MeasurementNumPad
          onClose={() => setShowNumPad(false)}
          onInput={(decimalValue, fractionValue) =>
            handleCellChange(
              currentCell.rowIndex,
              currentCell.colIndex,
              decimalValue,
              fractionValue
            )
          }
          initialValue={
            tableData[currentCell.rowIndex].values[currentCell.colIndex].decimal
          }
        />
      )}
    </div>
  );
};

export default MeasurementTable;
