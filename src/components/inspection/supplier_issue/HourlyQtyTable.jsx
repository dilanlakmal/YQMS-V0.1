import React, { useMemo } from "react";

// This component is now for DISPLAY ONLY.
// remove `setHourlyQtys` from the props because this component should not modify state.
const HourlyQtyTable = ({ hourlyQtys }) => {
  // The hours array is correct.
  const hours = Array.from({ length: 8 }, (_, i) => i + 1);

  // The total calculation is also correct.
  const totalCheckedQty = useMemo(() => {
    // The `hourlyQtys` prop is now an object like { 1: 5, 2: 3 }, so the logic is simpler.
    return Object.values(hourlyQtys).reduce(
      (sum, qty) => sum + (Number(qty) || 0),
      0
    );
  }, [hourlyQtys]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
        Checked Quantity By Hour
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
              {hours.map((h) => (
                <th key={h} className="p-2 text-center">
                  Hour {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {hours.map((h) => (
                <td key={h} className="p-1">
                  {/*
                    The input is now for display.
                    1. make it `readOnly` so the user can't type in it.
                    2. remove the `onChange` handler completely.
                    3. The `value` is simply the quantity for that hour.
                  */}
                  <input
                    type="number"
                    readOnly
                    value={hourlyQtys[h] || ""}
                    className="w-full text-center p-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-0 cursor-default"
                    placeholder="0"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-right">
        <span className="text-gray-600 dark:text-gray-300 font-semibold">
          Total Defect Qty:{" "}
        </span>
        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
          {totalCheckedQty}
        </span>
      </div>
    </div>
  );
};

export default HourlyQtyTable;
