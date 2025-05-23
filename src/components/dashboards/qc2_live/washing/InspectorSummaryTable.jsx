import React, { useState, useMemo } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Helper to parse M/D/YYYY or MM/DD/YYYY into a Date object
const parseSimpleDate = (dateString) => {
  if (!dateString || typeof dateString !== "string") return null;
  // Append T00:00:00 to help JS Date parser treat it as local date at midnight
  const date = new Date(dateString + "T00:00:00");
  // Check if parsing was successful
  if (isNaN(date.getTime())) {
    // Fallback for potential M/D/YYYY parsing issues if new Date() is picky
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1; // month is 0-indexed
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
        const potentiallyCorrectedDate = new Date(year, month, day);
        if (!isNaN(potentiallyCorrectedDate.getTime()))
          return potentiallyCorrectedDate;
      }
    }
    console.warn("Could not parse date string:", dateString);
    return null;
  }
  return date;
};

const getUniqueSortedDates = (data) => {
  if (!data || data.length === 0) return [];
  const allDateStrings = new Set();
  data.forEach((inspector) => {
    if (inspector.dailyStats) {
      inspector.dailyStats.forEach((stat) => {
        if (stat.date) allDateStrings.add(stat.date);
      });
    }
  });

  return Array.from(allDateStrings)
    .map((dateStr) => ({ original: dateStr, parsed: parseSimpleDate(dateStr) }))
    .filter((d) => d.parsed !== null) // Filter out unparseable dates
    .sort((a, b) => a.parsed - b.parsed) // Sort by parsed Date objects
    .map((d) => d.original); // Return original strings in sorted order
};

const InspectorSummaryTable = ({ inspectorData }) => {
  const [visibleSubCols, setVisibleSubCols] = useState({
    totalBundles: true,
    washingQty: true,
    rewashQty: true
  });

  // uniqueDates will now be an array of original date strings, sorted chronologically
  const uniqueDates = useMemo(
    () => getUniqueSortedDates(inspectorData),
    [inspectorData]
  );

  const toggleSubCol = (colName) => {
    setVisibleSubCols((prev) => ({ ...prev, [colName]: !prev[colName] }));
  };

  if (!inspectorData)
    return <div className="text-center py-4">Loading inspector summary...</div>;
  if (inspectorData.length === 0)
    return (
      <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
        No inspector data found.
      </div>
    );

  const subColHeaders = [
    { key: "totalBundles", label: "Bundles" },
    { key: "washingQty", label: "Wash Qty" },
    { key: "rewashQty", label: "Rewash Qty" }
  ];
  const activeSubCols = subColHeaders.filter((sc) => visibleSubCols[sc.key]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">
          Inspector Daily Summary
        </h3>
        <div className="flex items-center space-x-2 text-sm">
          <span className="font-medium mr-2">Toggle Columns:</span>
          {subColHeaders.map((sc) => (
            <button
              key={sc.key}
              onClick={() => toggleSubCol(sc.key)}
              className={`px-2 py-1 rounded text-xs flex items-center transition-colors duration-150 ease-in-out
                ${
                  visibleSubCols[sc.key]
                    ? "bg-indigo-500 text-white hover:bg-indigo-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              {visibleSubCols[sc.key] ? (
                <FaEye className="mr-1" />
              ) : (
                <FaEyeSlash className="mr-1" />
              )}
              {sc.label}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
        <table className="min-w-full table-fixed">
          <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32 whitespace-nowrap sticky left-0 bg-gray-100 z-20">
                Emp ID
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-48 whitespace-nowrap sticky left-32 bg-gray-100 z-20 border-r">
                Inspector Name
              </th>
              {uniqueDates.map((dateStr) => {
                const displayDate = parseSimpleDate(dateStr);
                return (
                  <th
                    key={dateStr}
                    className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-l border-gray-200"
                    style={{
                      minWidth: `${Math.max(activeSubCols.length * 55, 70)}px`
                    }}
                  >
                    {displayDate
                      ? displayDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        })
                      : "Invalid Date"}
                    {activeSubCols.length > 0 && (
                      <div className="flex justify-around text-xxs mt-1 border-t border-gray-300 pt-1">
                        {activeSubCols.map((sc) => (
                          <span key={sc.key} className="w-1/3 px-0.5">
                            {sc.label.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {inspectorData.map((inspector) => (
              <tr key={inspector.empId} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap w-32 sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                  {inspector.empId}
                </td>
                <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap w-48 sticky left-32 bg-white group-hover:bg-gray-50 z-10 border-r">
                  {inspector.empName || "N/A"}
                </td>
                {uniqueDates.map((dateStr) => {
                  const statForDate = inspector.dailyStats?.find(
                    (s) => s.date === dateStr
                  );
                  return (
                    <td
                      key={dateStr}
                      className="px-1 py-2 text-sm text-gray-600 border-l border-gray-200"
                    >
                      {statForDate && activeSubCols.length > 0 ? (
                        <div className="flex justify-around text-center">
                          {activeSubCols.map((sc) => (
                            <span key={sc.key} className="w-1/3 text-xs px-0.5">
                              {(statForDate[sc.key] || 0).toLocaleString()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-around text-center">
                          {activeSubCols.map((sc) => (
                            <span
                              key={sc.key}
                              className="w-1/3 text-xs text-gray-400 px-0.5"
                            >
                              -
                            </span>
                          ))}
                        </div>
                      )}
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
};

export default InspectorSummaryTable;
