import { Table as TableIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// This input table is now specific to the comments section.
const CommentsTableInput = ({
  rows,
  cols,
  data = [],
  onChange,
  sectionEnabled
}) => {
  const [tableData, setTableData] = useState(data);
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
    onChange(newData);
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
                        className={`w-full p-0.5 text-xs bg-white ${
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

const AdditionalComments = ({ sectionEnabled, mainTitle }) => {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [isTable, setIsTable] = useState(false);
  const [tableRows, setTableRows] = useState(2);
  const [tableCols, setTableCols] = useState(2);
  const [tableData, setTableData] = useState([]);

  const handleTextChange = (e) => {
    if (!sectionEnabled) return;
    const newText = e.target.value;
    if (newText.length <= 1000) {
      setText(newText);
      if (isTable) setIsTable(false);
    }
  };

  const toggleTable = () => {
    if (!sectionEnabled) return;
    setIsTable(!isTable);
  };

  const handleDimensionChange = (dim, value) => {
    if (!sectionEnabled) return;
    const numValue = Math.max(1, Math.min(10, parseInt(value, 10) || 1));
    if (dim === "rows") setTableRows(numValue);
    if (dim === "cols") setTableCols(numValue);
  };

  return (
    <div
      className={`mx-4 sm:mx-6 my-4 p-3 border rounded-lg shadow ${
        !sectionEnabled ? "opacity-60 bg-gray-50" : "bg-white"
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <label
          htmlFor={`additionalComments-${mainTitle}`}
          className="text-sm font-semibold text-gray-700"
        >
          {t("auditTable.additionalComments")}
        </label>
        <button
          onClick={toggleTable}
          title={t("auditTable.insertTable")}
          className={`p-1 rounded ${
            isTable ? "bg-indigo-100 text-indigo-600" : "hover:bg-gray-100"
          } ${!sectionEnabled ? "cursor-not-allowed" : ""}`}
          disabled={!sectionEnabled}
        >
          <TableIcon size={16} />
        </button>
      </div>
      {isTable && sectionEnabled && (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            value={tableRows}
            onChange={(e) => handleDimensionChange("rows", e.target.value)}
            min="1"
            max="10"
            className="w-12 text-xs p-1 border rounded"
            title={t("auditTable.rows")}
            disabled={!sectionEnabled}
          />
          <span className="text-xs">x</span>
          <input
            type="number"
            value={tableCols}
            onChange={(e) => handleDimensionChange("cols", e.target.value)}
            min="1"
            max="10"
            className="w-12 text-xs p-1 border rounded"
            title={t("auditTable.cols")}
            disabled={!sectionEnabled}
          />
        </div>
      )}
      {isTable && sectionEnabled ? (
        <CommentsTableInput
          rows={tableRows}
          cols={tableCols}
          data={tableData}
          onChange={setTableData}
          sectionEnabled={sectionEnabled}
        />
      ) : (
        <textarea
          id={`additionalComments-${mainTitle}`}
          value={text}
          onChange={handleTextChange}
          rows="4"
          maxLength={1000}
          className={`w-full p-2 text-sm border rounded ${
            !sectionEnabled
              ? "bg-gray-100 cursor-not-allowed"
              : "focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          }`}
          disabled={!sectionEnabled}
        />
      )}
      {!isTable && (
        <div className="text-right text-xs text-gray-400 mt-0.5">
          {text.length}/1000
        </div>
      )}
    </div>
  );
};

export default AdditionalComments;
