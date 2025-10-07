import {
  AlertTriangle,
  CheckCircle,
  ListOrdered,
  Target,
  XCircle
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

// --- The Summary Table Component ---
// It will now receive pre-filtered data, so its own sorting logic will work as expected.
const SpreadTableSummary = ({ data, theme }) => {
  const [selectedGarmentType, setSelectedGarmentType] = useState(null);

  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return { garmentTypes: [], tableHeaders: [], pivotData: {} };
    }

    const garmentTypes = new Set();
    const tableHeaders = new Set();
    const pivotData = {};

    data.forEach((table) => {
      if (table && table.spreadTable) {
        tableHeaders.add(table.spreadTable);
        table.issuesByGarmentType.forEach((gt) => {
          garmentTypes.add(gt.garmentType);
          if (!pivotData[gt.garmentType]) {
            pivotData[gt.garmentType] = {};
          }
          gt.issues.forEach((issue) => {
            if (!pivotData[gt.garmentType][issue.measurementPoint]) {
              pivotData[gt.garmentType][issue.measurementPoint] = {};
            }
            pivotData[gt.garmentType][issue.measurementPoint][
              table.spreadTable
            ] = issue.total;
          });
        });
      }
    });

    const sortedGarmentTypes = Array.from(garmentTypes).sort();

    // This custom sort ensures 'A', 'B', 'C' order and handles any non-letter names gracefully
    const sortedTableHeaders = Array.from(tableHeaders).sort((a, b) => {
      const isALetter = /^[A-Z]$/.test(a);
      const isBLetter = /^[A-Z]$/.test(b);
      if (isALetter && isBLetter) return a.localeCompare(b);
      if (isALetter) return -1;
      if (isBLetter) return 1;
      return a.localeCompare(b);
    });

    return {
      garmentTypes: sortedGarmentTypes,
      tableHeaders: sortedTableHeaders,
      pivotData: pivotData
    };
  }, [data]);

  if (!selectedGarmentType && processedData.garmentTypes.length > 0) {
    setSelectedGarmentType(processedData.garmentTypes[0]);
  }

  useEffect(() => {
    const availableGarmentTypes = processedData.garmentTypes;
    if (availableGarmentTypes.length > 0) {
      if (
        !selectedGarmentType ||
        !availableGarmentTypes.includes(selectedGarmentType)
      ) {
        setSelectedGarmentType(availableGarmentTypes[0]);
      }
    } else {
      setSelectedGarmentType(null); // Clear selection if no data
    }
  }, [processedData.garmentTypes, selectedGarmentType]);

  const getHighlightClass = (value, rowData) => {
    if (!value || value === 0) return "";
    const rowValues = Object.values(rowData).filter(
      (v) => typeof v === "number" && v > 0
    );
    const sortedUniqueValues = [...new Set(rowValues)].sort((a, b) => b - a);
    if (value === sortedUniqueValues[0])
      return theme === "dark" ? "bg-red-800/70" : "bg-red-200";
    if (value === sortedUniqueValues[1])
      return theme === "dark" ? "bg-red-900/50" : "bg-red-100";
    if (value === sortedUniqueValues[2])
      return theme === "dark" ? "bg-orange-900/60" : "bg-orange-100";
    return "";
  };

  const getTabClass = (garmentType) => {
    const base =
      "px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200";
    if (garmentType === selectedGarmentType)
      return `${base} bg-blue-600 text-white`;
    return `${base} ${
      theme === "dark"
        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
    }`;
  };

  const currentTableData = processedData.pivotData[selectedGarmentType] || {};
  const measurementPoints = Object.keys(currentTableData).sort();

  // Handle case where no garment types are available for the selected filters
  if (processedData.garmentTypes.length === 0) {
    return (
      <div
        className={`p-4 rounded-lg shadow-md text-center ${
          theme === "dark"
            ? "bg-[#1f2937] text-gray-400"
            : "bg-white text-gray-600"
        }`}
      >
        No summary data available for the current filter selection.
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg shadow-md ${
        theme === "dark" ? "bg-[#1f2937]" : "bg-white"
      }`}
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {processedData.garmentTypes.map((gt) => (
          <button
            key={gt}
            onClick={() => setSelectedGarmentType(gt)}
            className={getTabClass(gt)}
          >
            {gt}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table
          className={`w-full text-left text-xs border-collapse ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          <thead
            className={`uppercase ${
              theme === "dark"
                ? "bg-gray-800 text-gray-400"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <tr>
              <th className="sticky left-0 z-10 py-2 px-3 border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-800">
                Measurement Point
              </th>
              {processedData.tableHeaders.map((header) => (
                <th
                  key={header}
                  className="py-2 px-3 text-center border border-gray-300 dark:border-gray-600"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {measurementPoints.map((point) => (
              <tr
                key={point}
                className={`border-b ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <td className="sticky left-0 z-10 py-2 px-3 font-medium border-x border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1f2937]">
                  {point}
                </td>
                {processedData.tableHeaders.map((table) => {
                  const value = currentTableData[point]?.[table] || 0;
                  const highlightClass = getHighlightClass(
                    value,
                    currentTableData[point]
                  );
                  return (
                    <td
                      key={table}
                      className={`py-2 px-3 text-center border border-gray-300 dark:border-gray-600 ${highlightClass}`}
                    >
                      {value > 0 ? value : ""}
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

// Reusable KPI card component
const StatCard = ({ icon, title, value, unit = "", colorClass = "" }) => {
  const { theme } = useTheme();
  return (
    <div
      className={`p-3 rounded-lg flex flex-col justify-between h-24 ${
        theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between">
        <h4
          className={`text-xs font-semibold uppercase tracking-wider ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {title}
        </h4>
        <span className={colorClass}>{icon}</span>
      </div>
      <p
        className={`text-2xl font-bold ${
          theme === "dark" ? "text-gray-100" : "text-gray-800"
        } ${colorClass}`}
      >
        {value}
        <span className="text-lg ml-1 font-medium">{unit}</span>
      </p>
    </div>
  );
};

// Reusable detailed Issues Table Component
const IssuesTable = ({ issues, theme }) => {
  const fractionSortOrder = [
    "-1",
    "-15/16",
    "-7/8",
    "-13/16",
    "-3/4",
    "-11/16",
    "-5/8",
    "-9/16",
    "-1/2",
    "-7/16",
    "-3/8",
    "-5/16",
    "-1/4",
    "-3/16",
    "-1/8",
    "-1/16",
    "1/16",
    "1/8",
    "3/16",
    "1/4",
    "5/16",
    "3/8",
    "7/16",
    "1/2",
    "9/16",
    "5/8",
    "11/16",
    "3/4",
    "13/16",
    "7/8",
    "15/16",
    "1"
  ];

  const headers = useMemo(() => {
    const fractionKeys = new Set();
    issues.forEach((issue) => {
      Object.keys(issue.fractionCounts || {}).forEach((key) =>
        fractionKeys.add(key)
      );
    });
    const sortedFractionKeys = Array.from(fractionKeys).sort((a, b) => {
      const indexA = fractionSortOrder.indexOf(a);
      const indexB = fractionSortOrder.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    return [
      "Measurement Point",
      "Total",
      "TOL+",
      "TOL-",
      ...sortedFractionKeys
    ];
  }, [issues]);

  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full text-left text-xs ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}
      >
        <thead
          className={`uppercase ${
            theme === "dark"
              ? "bg-gray-700 text-gray-400"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          <tr>
            {headers.map((header) => (
              <th key={header} className="py-2 px-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, index) => (
            <tr
              key={index}
              className={`border-b ${
                theme === "dark"
                  ? "border-gray-700 hover:bg-gray-700/50"
                  : "border-gray-200 hover:bg-gray-100"
              }`}
            >
              <td className="py-2 px-3 font-medium">
                {issue.measurementPoint}
              </td>
              <td className="py-2 px-3 text-center font-bold">{issue.total}</td>
              <td className="py-2 px-3 text-center text-yellow-500">
                {issue.tol_plus}
              </td>
              <td className="py-2 px-3 text-center text-orange-500">
                {issue.tol_minus}
              </td>
              {headers.slice(4).map((headerKey) => (
                <td
                  key={headerKey}
                  className="py-2 px-3 text-center text-red-500"
                >
                  {issue.fractionCounts?.[headerKey] || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Main card component for a single Spread Table
const SpreadTableOverallCard = ({ tableData }) => {
  const { theme } = useTheme();
  const [topN, setTopN] = useState(5);

  const getDefectRateColor = (rate) => {
    if (rate < 1) return "text-green-500";
    if (rate < 3) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div
      className={`rounded-xl shadow-lg p-4 flex flex-col h-full ${
        theme === "dark" ? "bg-[#1f2937]" : "bg-white"
      }`}
    >
      <div>
        <h3
          className={`text-lg font-bold ${
            theme === "dark" ? "text-gray-200" : "text-gray-900"
          }`}
        >
          Spread Table: {tableData.spreadTable}
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        <StatCard
          icon={<Target size={20} className="text-blue-500" />}
          title="Total Points"
          value={tableData.totalPoints.toLocaleString()}
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-green-500" />}
          title="Total Pass"
          value={tableData.totalPass.toLocaleString()}
        />
        <StatCard
          icon={<XCircle size={20} className="text-red-500" />}
          title="Total Rejects"
          value={tableData.totalRejects.toLocaleString()}
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          title="Defect Rate"
          value={tableData.defectRate.toFixed(2)}
          unit="%"
          colorClass={getDefectRateColor(tableData.defectRate)}
        />
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h4
            className={`text-sm font-bold flex items-center gap-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <ListOrdered size={16} />
            Top Measurement Issues
          </h4>
          <select
            value={topN}
            onChange={(e) => setTopN(parseInt(e.target.value, 10))}
            className={`p-1 rounded-md text-xs focus:ring-2 focus:ring-blue-500 ${
              theme === "dark"
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-gray-50 text-black border-gray-300"
            }`}
          >
            <option value={3}>Top 3</option>
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
          </select>
        </div>
        <div className="flex-grow space-y-4 max-h-96 overflow-y-auto pr-2">
          {tableData.issuesByGarmentType.length > 0 ? (
            tableData.issuesByGarmentType.map((group) => (
              <div key={group.garmentType}>
                <p
                  className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                    theme === "dark" ? "text-blue-300" : "text-blue-700"
                  }`}
                >
                  {group.garmentType}
                </p>
                <IssuesTable
                  issues={group.issues.slice(0, topN)}
                  theme={theme}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p
                className={theme === "dark" ? "text-gray-400" : "text-gray-600"}
              >
                No measurement issues recorded for this spread table.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Wrapper Component with Filtering Logic ---
const CuttingDashboardSpreadTableOverallIssues = ({ data, title }) => {
  const { theme } = useTheme();

  // Memoize the filtering of the raw data. This will run only when 'data' prop changes.
  const filteredData = useMemo(() => {
    if (!data) return [];
    // The filter condition: test if `spreadTable` is a single uppercase letter from A to Z.
    // This will effectively remove items like "CHANNA" or any other invalid entries.
    return data.filter(
      (item) => item && item.spreadTable && /^[A-Z]$/.test(item.spreadTable)
    );
  }, [data]);

  // Now, check the length of the *filtered* data to decide whether to render.
  if (!filteredData || filteredData.length === 0) {
    return (
      <div
        className={`p-4 mt-6 rounded-lg shadow-md h-40 flex items-center justify-center ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
          No valid overall spread table data (A-Z) to display for the selected
          filters.
        </p>
      </div>
    );
  }
  return (
    <div className="mt-6">
      <h2
        className={`text-xl font-bold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        {title}
      </h2>

      {/* Pass the newly filteredData to the summary table */}
      <div className="mb-6 relative z-0">
        <SpreadTableSummary data={filteredData} theme={theme} />
      </div>

      {/* Map over the newly filteredData to render the cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredData.map((tableData) => (
          <SpreadTableOverallCard
            key={tableData.spreadTable}
            tableData={tableData}
          />
        ))}
      </div>
    </div>
  );
};

export default CuttingDashboardSpreadTableOverallIssues;
