import React, { useState, useEffect } from "react";
import { format, parse, isValid } from "date-fns";

// Helper to format date and time parts for input fields
const formatForInput = (date) => {
  if (!date || !isValid(date)) return { date: "", time: "" };
  return {
    date: format(date, "yyyy-MM-dd"),
    time: format(date, "HH:mm:ss")
  };
};

function PreviewMasterList({ initialData, onCancel }) {
  const [editedData, setEditedData] = useState([]);

  useEffect(() => {
    // We process the initial data to convert date strings into actual Date objects
    const processedData = initialData.map((row) => {
      const newRow = { ...row };
      // Attempt to parse various date formats. This can be made more robust if needed.
      const parseDate = (val) => {
        if (!val) return null;
        if (val instanceof Date) return val;
        // Try parsing '2024-03-19 9:10:56' or '3/19/2024 9:10:56 AM'
        let parsed = parse(String(val), "yyyy-MM-dd HH:mm:ss", new Date());
        if (!isValid(parsed)) {
          parsed = parse(String(val), "M/d/yyyy h:mm:ss a", new Date());
        }
        return isValid(parsed) ? parsed : null;
      };

      newRow["Created At"] = parseDate(row["Created At"]);
      newRow["Update Date"] = parseDate(row["Update Date"]);
      newRow["Approv Date"] = parseDate(row["Approv Date"]);
      return newRow;
    });
    setEditedData(processedData);
  }, [initialData]);

  const handleCellChange = (rowIndex, columnKey, value) => {
    const updatedData = [...editedData];
    updatedData[rowIndex] = { ...updatedData[rowIndex], [columnKey]: value };
    setEditedData(updatedData);
  };

  const handleDateChange = (rowIndex, columnKey, newDateValue) => {
    const updatedData = [...editedData];
    const originalDate = updatedData[rowIndex][columnKey] || new Date(); // Use new Date() if original is null

    // Combine new date with original time and set current time
    const newDate = new Date(newDateValue);
    const now = new Date();

    newDate.setHours(now.getHours());
    newDate.setMinutes(now.getMinutes());
    newDate.setSeconds(now.getSeconds());

    updatedData[rowIndex][columnKey] = newDate;
    setEditedData(updatedData);
  };

  const handleTimeChange = (rowIndex, columnKey, newTimeValue) => {
    const updatedData = [...editedData];
    const originalDate = updatedData[rowIndex][columnKey] || new Date(); // Fallback to now
    const [hours, minutes, seconds] = newTimeValue.split(":");

    const newDate = new Date(originalDate);
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));
    newDate.setSeconds(parseInt(seconds || 0, 10));

    updatedData[rowIndex][columnKey] = newDate;
    setEditedData(updatedData);
  };

  const headers = initialData.length > 0 ? Object.keys(initialData[0]) : [];
  const readOnlyColumns = ["No.", "Code"];
  const dateColumns = ["Created At", "Update Date", "Approv Date"];

  if (editedData.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">No data to preview.</div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Preview & Edit Master List
        </h3>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
        >
          Back to Upload
        </button>
      </div>
      <div className="overflow-x-auto max-h-[70vh] relative">
        <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-4 py-3 border border-gray-200 dark:border-gray-600 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {headers.map((header) => {
                  const cellValue = row[header];
                  if (readOnlyColumns.includes(header)) {
                    return (
                      <td
                        key={header}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-600 font-mono bg-gray-100 dark:bg-gray-700"
                      >
                        {cellValue}
                      </td>
                    );
                  }
                  if (dateColumns.includes(header)) {
                    const { date, time } = formatForInput(cellValue);
                    return (
                      <td
                        key={header}
                        className="px-2 py-1 border border-gray-200 dark:border-gray-600 whitespace-nowrap"
                      >
                        <div className="flex items-center space-x-1">
                          <input
                            type="date"
                            value={date}
                            onChange={(e) =>
                              handleDateChange(rowIndex, header, e.target.value)
                            }
                            className="p-1 w-32 border border-gray-300 rounded-md bg-white dark:bg-gray-900 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="time"
                            step="1"
                            value={time}
                            onChange={(e) =>
                              handleTimeChange(rowIndex, header, e.target.value)
                            }
                            className="p-1 w-28 border border-gray-300 rounded-md bg-white dark:bg-gray-900 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={header}
                      className="px-1 py-1 border border-gray-200 dark:border-gray-600"
                    >
                      <input
                        type="text"
                        value={cellValue}
                        onChange={(e) =>
                          handleCellChange(rowIndex, header, e.target.value)
                        }
                        className="w-full p-1 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-[3px]"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PreviewMasterList;
