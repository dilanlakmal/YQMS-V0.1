import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import MeasurementNumPad from "./MeasurementNumPad";

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

  // Initialize table data with both decimal and fraction values
  useEffect(() => {
    if (tableData.length === 0 && measurementPoints.length > 0) {
      const initialData = measurementPoints.map((point, index) => ({
        no: index + 1,
        measurementPoint: point.pointName,
        values: Array(numColumns).fill({ decimal: 0, fraction: "0" }), // Store both decimal and fraction
        isUsed: true // Default to "used" (✔ icon)
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
    headers.push("Use"); // Column for toggling usage
    return headers;
  };

  // Handle cell click to show numpad
  const handleCellClick = (rowIndex, colIndex) => {
    if (!tableData[rowIndex].isUsed) return; // Don't show numpad if row is not used
    setCurrentCell({ rowIndex, colIndex });
    setShowNumPad(true);
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
                  className="border border-gray-300 p-2 text-center"
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
                <td className="border border-gray-300 p-2 text-center bg-white">
                  {row.no}
                </td>
                <td className="border border-gray-300 p-2 bg-white">
                  {row.measurementPoint}
                </td>
                {row.values.map((value, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-gray-300 p-0 text-center"
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
