import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, Plus } from "lucide-react";
import MeasurementNumPad from "./MeasurementNumPad";
import { cuttingDefects } from "../../../constants/cuttingdefect";

// Helper function to convert decimal to fraction for display
const decimalToFraction = (value) => {
  if (value === 0) return "0";
  const sign = value < 0 ? "-" : "";
  const absValue = Math.abs(value);
  const whole = Math.floor(absValue);
  const decimal = absValue - whole;

  if (decimal === 0) return `${sign}${whole || 0}`;

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
  tab, // "Top", "Middle", or "Bottom"
  measurementPoints, // Array of measurement points for the selected panel
  numColumns, // Number of columns (from Col dropdown)
  tolerance, // Tolerance range, e.g., { min: -0.125, max: 0.125 }
  onUpdate, // Callback to update parent with table data for summary calculations
  tableData, // Table data passed from parent
  setTableData // Function to update table data in parent
}) => {
  // State to manage numpad visibility and cell position
  const [showNumPad, setShowNumPad] = useState(false);
  const [currentCell, setCurrentCell] = useState({
    rowIndex: null,
    colIndex: null
  });
  // State to manage defect selection for each row
  const [selectedDefect, setSelectedDefect] = useState(
    Array(measurementPoints.length).fill("")
  );
  const [showDefectDropdown, setShowDefectDropdown] = useState(
    Array(measurementPoints.length).fill(false)
  );

  // Initialize table data with both decimal, fraction values, and defects
  useEffect(() => {
    if (tableData.length === 0 && measurementPoints.length > 0) {
      const initialData = measurementPoints.map((point, index) => ({
        no: index + 1,
        measurementPoint: point.pointName,
        values: Array(numColumns).fill({ decimal: 0, fraction: "0" }), // Store both decimal and fraction
        isUsed: true, // Default to "used" (✔ icon)
        defects: [] // Initialize defects array for each row
      }));
      setTableData(initialData);
      calculateSummary(initialData);
    } else if (
      tableData.length > 0 &&
      tableData[0].values.length !== numColumns
    ) {
      // Adjust the number of columns if numColumns changes
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
      calculateSummary(updatedData);
    }
  }, [measurementPoints, numColumns, tableData, setTableData]);

  // Handle cell value change
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
    calculateSummary(updatedData);
  };

  // Toggle row usage (✔ or X)
  const toggleRowUsage = (rowIndex) => {
    const updatedData = [...tableData];
    updatedData[rowIndex].isUsed = !updatedData[rowIndex].isUsed;
    setTableData(updatedData);
    calculateSummary(updatedData);
  };

  // Calculate summary (Total Points, Total Pass, Total Fail, Pass Rate)
  const calculateSummary = (data) => {
    // Only count rows that are "used"
    const usedRows = data.filter((row) => row.isUsed);
    const totalPoints = usedRows.length * numColumns;
    let totalFail = 0;

    usedRows.forEach((row) => {
      row.values.forEach((value) => {
        const numValue = parseFloat(value.decimal);
        if (
          !isNaN(numValue) &&
          (numValue < tolerance.min || numValue > tolerance.max)
        ) {
          totalFail += 1;
        }
      });
    });

    const totalPass = totalPoints - totalFail;
    const passRate =
      totalPoints > 0 ? ((totalPass / totalPoints) * 100).toFixed(2) : 0;

    // Pass summary to parent
    onUpdate({
      totalPoints,
      totalPass,
      totalFail,
      passRate
    });
  };

  // Generate column headers based on tab and numColumns
  const getColumnHeaders = () => {
    const prefix = tab === "Top" ? "T" : tab === "Middle" ? "M" : "B";
    const headers = ["No", "Measurement Point"];
    for (let i = 1; i <= numColumns; i++) {
      headers.push(`${prefix}${i}`);
    }
    headers.push("Use");
    headers.push("Defects"); // Add Defects column
    return headers;
  };

  // Handle cell click to show numpad
  const handleCellClick = (rowIndex, colIndex) => {
    if (!tableData[rowIndex].isUsed) return; // Don't show numpad if row is not used
    setCurrentCell({ rowIndex, colIndex });
    setShowNumPad(true);
  };

  // Handle defect selection
  const handleDefectSelect = (rowIndex, value) => {
    const newSelectedDefect = [...selectedDefect];
    newSelectedDefect[rowIndex] = value;
    setSelectedDefect(newSelectedDefect);
  };

  // Toggle defect dropdown visibility
  const toggleDefectDropdown = (rowIndex) => {
    const newShowDefectDropdown = [...showDefectDropdown];
    newShowDefectDropdown[rowIndex] = !newShowDefectDropdown[rowIndex];
    setShowDefectDropdown(newShowDefectDropdown);
  };

  // Add a defect to the row
  const addDefect = (rowIndex) => {
    if (!selectedDefect[rowIndex]) return; // Don't add if no defect is selected
    const updatedData = [...tableData];
    const defect = cuttingDefects.find(
      (d) => d.defectName === selectedDefect[rowIndex]
    );
    updatedData[rowIndex].defects.push({
      defectName: defect.defectName,
      defectNameEng: defect.defectNameEng,
      defectNameKhmer: defect.defectNameKhmer,
      defectCode: defect.defectCode,
      quantity: 1 // Default quantity
    });
    setTableData(updatedData);
    // Reset dropdown
    const newSelectedDefect = [...selectedDefect];
    newSelectedDefect[rowIndex] = "";
    setSelectedDefect(newSelectedDefect);
    toggleDefectDropdown(rowIndex);
  };

  // Update defect quantity
  const updateDefectQuantity = (rowIndex, defectIndex, change) => {
    const updatedData = [...tableData];
    const currentQty = updatedData[rowIndex].defects[defectIndex].quantity;
    const newQty = Math.max(1, currentQty + change); // Minimum quantity is 1
    updatedData[rowIndex].defects[defectIndex].quantity = newQty;
    setTableData(updatedData);
  };

  // Remove a defect
  const removeDefect = (rowIndex, defectIndex) => {
    const updatedData = [...tableData];
    updatedData[rowIndex].defects.splice(defectIndex, 1);
    setTableData(updatedData);
  };

  return (
    <div className="mt-4">
      {/* Summary Box */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg flex justify-around items-center">
        <div className="text-sm">
          <strong>Total Points:</strong>{" "}
          {tableData.filter((row) => row.isUsed).length * numColumns}
        </div>
        <div className="text-sm">
          <strong>Total Pass:</strong>{" "}
          {tableData.filter((row) => row.isUsed).length * numColumns -
            tableData
              .filter((row) => row.isUsed)
              .reduce((failCount, row) => {
                return (
                  failCount +
                  row.values.filter((value) => {
                    const numValue = parseFloat(value.decimal);
                    return (
                      !isNaN(numValue) &&
                      (numValue < tolerance.min || numValue > tolerance.max)
                    );
                  }).length
                );
              }, 0)}
        </div>
        <div className="text-sm">
          <strong>Total Fail:</strong>{" "}
          {tableData
            .filter((row) => row.isUsed)
            .reduce((failCount, row) => {
              return (
                failCount +
                row.values.filter((value) => {
                  const numValue = parseFloat(value.decimal);
                  return (
                    !isNaN(numValue) &&
                    (numValue < tolerance.min || numValue > tolerance.max)
                  );
                }).length
              );
            }, 0)}
        </div>
        <div className="text-sm">
          <strong>Pass Rate:</strong>{" "}
          {tableData.filter((row) => row.isUsed).length * numColumns > 0
            ? (
                ((tableData.filter((row) => row.isUsed).length * numColumns -
                  tableData
                    .filter((row) => row.isUsed)
                    .reduce((failCount, row) => {
                      return (
                        failCount +
                        row.values.filter((value) => {
                          const numValue = parseFloat(value.decimal);
                          return (
                            !isNaN(numValue) &&
                            (numValue < tolerance.min ||
                              numValue > tolerance.max)
                          );
                        }).length
                      );
                    }, 0)) /
                  (tableData.filter((row) => row.isUsed).length * numColumns)) *
                100
              ).toFixed(2)
            : 0}
          %
        </div>
      </div>

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
            {tableData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${
                  row.isUsed ? "bg-green-50" : "bg-red-50 opacity-50"
                }`}
              >
                <td className="border border-gray-300 p-2 text-center bg-white text-sm">
                  {row.no}
                </td>
                <td className="border border-gray-300 p-2 bg-white text-sm">
                  {row.measurementPoint}
                </td>
                {row.values.map((value, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-gray-300 p-0 text-center text-sm min-w-[48px] sm:min-w-[80px]"
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    <input
                      type="text"
                      value={value.fraction}
                      readOnly
                      className={`w-full h-full p-0 m-0 text-center border-none focus:outline-none ${
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
                    onClick={() => toggleRowUsage(rowIndex)}
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
                {/* Defects Column */}
                <td className="border border-gray-300 p-2 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    {/* Display existing defects */}
                    {row.defects.map((defect, defectIndex) => (
                      <div
                        key={defectIndex}
                        className="flex items-center space-x-2"
                      >
                        <span className="text-sm">
                          {defect.defectNameEng} ({defect.defectNameKhmer})
                        </span>
                        <button
                          onClick={() =>
                            updateDefectQuantity(rowIndex, defectIndex, -1)
                          }
                          className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          <span className="text-lg">-</span>
                        </button>
                        <input
                          type="text"
                          value={defect.quantity}
                          readOnly
                          className="w-12 text-center border border-gray-300 rounded"
                        />
                        <button
                          onClick={() =>
                            updateDefectQuantity(rowIndex, defectIndex, 1)
                          }
                          className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          <span className="text-lg">+</span>
                        </button>
                        <button
                          onClick={() => removeDefect(rowIndex, defectIndex)}
                          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {/* Add new defect */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleDefectDropdown(rowIndex)}
                        className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                      >
                        <AlertCircle className="w-5 h-5" />
                      </button>
                      {showDefectDropdown[rowIndex] && (
                        <select
                          value={selectedDefect[rowIndex]}
                          onChange={(e) =>
                            handleDefectSelect(rowIndex, e.target.value)
                          }
                          className="p-1 border border-gray-300 rounded"
                        >
                          <option value="">Select Defect</option>
                          {cuttingDefects.map((defect, index) => (
                            <option key={index} value={defect.defectName}>
                              {defect.defectNameEng} ({defect.defectNameKhmer})
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => addDefect(rowIndex)}
                        className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600"
                        disabled={!selectedDefect[rowIndex]}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show MeasurementNumPad when a cell is clicked */}
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
