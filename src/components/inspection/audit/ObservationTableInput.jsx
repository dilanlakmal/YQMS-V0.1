import React, { useEffect, useState } from "react";

const ObservationTableInput = ({
  rows,
  cols,
  data = [],
  onChange,
  sectionEnabled
}) => {
  const [tableData, setTableData] = useState(data);

  // This effect ensures the table data resets if the props change (e.g., clearing the modal)
  useEffect(() => {
    const initialData = Array(rows)
      .fill(null)
      .map((_, rIndex) =>
        Array(cols)
          .fill(null)
          .map((__, cIndex) => (data[rIndex] && data[rIndex][cIndex]) || "")
      );
    setTableData(initialData);
  }, [rows, cols, data]);

  const handleCellChange = (rIndex, cIndex, value) => {
    if (!sectionEnabled) return;
    const newData = tableData.map((row, rowIndex) =>
      rowIndex === rIndex
        ? row.map((cell, colIndex) => (colIndex === cIndex ? value : cell))
        : row
    );
    setTableData(newData);
    onChange(newData); // Propagate changes up to the modal
  };

  if (rows < 1 || cols < 1) return null;

  return (
    <div className="overflow-x-auto my-1">
      <table className="min-w-full border-collapse text-xs">
        <tbody>
          {Array(rows)
            .fill(null)
            .map((_, rIndex) => (
              <tr key={rIndex}>
                {Array(cols)
                  .fill(null)
                  .map((_, cIndex) => (
                    <td key={cIndex} className="border border-gray-300 p-0.5">
                      <input
                        type="text"
                        value={tableData[rIndex]?.[cIndex] || ""}
                        onChange={(e) =>
                          handleCellChange(rIndex, cIndex, e.target.value)
                        }
                        className={`w-full p-1 text-xs bg-white ${
                          !sectionEnabled
                            ? "cursor-not-allowed bg-gray-100"
                            : "focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                        }`}
                        disabled={!sectionEnabled}
                      />
                    </td>
                  ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ObservationTableInput;
