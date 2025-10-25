import React, { useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";

// --- MODIFIED: Reusable Trend Matrix Table Component ---
const TrendMatrixTable = ({
  title,
  data,
  rowKey,
  rowTitle,
  inspectionQtyByDate,
  theme,
  getColoringClass // New optional prop for custom cell coloring
}) => {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return { dateHeaders: [], tableData: [], inspectionQtyMap: {} };
    }

    const dateHeaders = new Set();
    data.forEach((item) => {
      Object.keys(item.dateBreakdown).forEach((date) => dateHeaders.add(date));
    });

    const sortedDateHeaders = Array.from(dateHeaders).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    const inspectionQtyMap = (inspectionQtyByDate || []).reduce((acc, item) => {
      acc[item.inspectionDate] = item.totalInspectionQty;
      return acc;
    }, {});

    return {
      dateHeaders: sortedDateHeaders,
      tableData: data,
      inspectionQtyMap
    };
  }, [data, inspectionQtyByDate]);

  if (!processedData.tableData || processedData.tableData.length === 0) {
    return (
      <div
        className={`p-4 mt-6 rounded-lg shadow-md h-60 flex flex-col items-center justify-center ${
          theme === "dark" ? "bg-[#1f2937]" : "bg-white"
        }`}
      >
        <h3
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          {title}
        </h3>
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
          No data available for the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-4 mt-6 rounded-lg shadow-md ${
        theme === "dark" ? "bg-[#1f2937]" : "bg-white"
      }`}
    >
      <h3
        className={`text-lg font-bold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        {title}
      </h3>
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
                {rowTitle}
              </th>
              {processedData.dateHeaders.map((header) => (
                <th
                  key={header}
                  className="py-2 px-3 text-center border border-gray-300 dark:border-gray-600"
                >
                  {new Date(header).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric"
                  })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.tableData.map((item) => (
              <tr
                key={item[rowKey]}
                className={`border-b ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <td className="sticky left-0 z-10 py-2 px-3 font-medium border-x border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1f2937]">
                  {item[rowKey]}
                </td>
                {processedData.dateHeaders.map((date) => {
                  const value = item.dateBreakdown[date] || 0;
                  const totalInspected =
                    processedData.inspectionQtyMap[date] || 0;
                  const rate =
                    totalInspected > 0 ? (value / totalInspected) * 100 : 0;

                  let cellClass = "";
                  let cellContent = "";

                  if (value > 0) {
                    // Check if a custom coloring function was provided
                    if (getColoringClass) {
                      cellClass = getColoringClass(value, theme);
                      cellContent = <span>{value}</span>;
                    } else {
                      // Default rendering for Fabric and Cutting tables
                      cellClass = "bg-red-500/10";
                      cellContent = (
                        <div>
                          <span className="font-bold text-red-500">
                            {value}
                          </span>
                          {inspectionQtyByDate && (
                            <span className="text-gray-500 dark:text-gray-400 block text-[10px]">
                              ({rate.toFixed(2)}%)
                            </span>
                          )}
                        </div>
                      );
                    }
                  }

                  return (
                    <td
                      key={date}
                      className={`py-2 px-3 text-center border border-gray-300 dark:border-gray-600 ${cellClass}`}
                    >
                      {cellContent}
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

// --- The main component now defines and passes the coloring function ---
const CuttingDashboardTrendAnalysis = ({
  measurementData,
  fabricData,
  cuttingData,
  inspectionQtyByDate,
  title
}) => {
  const { theme } = useTheme();

  const hasMeasurementData = measurementData && measurementData.length > 0;
  const hasFabricData = fabricData && fabricData.length > 0;
  const hasCuttingData = cuttingData && cuttingData.length > 0;

  // --- NEW: Define the custom coloring logic for the measurement table ---
  const getMeasurementColoringClass = (value, theme) => {
    if (value > 10) {
      return theme === "dark"
        ? "bg-red-800/70 text-white font-bold"
        : "bg-red-200 text-red-900 font-bold";
    }
    if (value >= 6) {
      return theme === "dark"
        ? "bg-orange-800/80 text-white font-bold"
        : "bg-orange-200 text-orange-900 font-bold";
    }
    if (value >= 1) {
      return theme === "dark"
        ? "bg-yellow-800/80 text-white font-bold"
        : "bg-yellow-200 text-yellow-900 font-bold";
    }
    return "";
  };

  if (!hasMeasurementData && !hasFabricData && !hasCuttingData) {
    return (
      <div
        className={`p-4 mt-6 rounded-lg shadow-md h-96 flex items-center justify-center ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
          No trend data available for the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 relative z-0">
      <h2
        className={`text-xl font-bold mb-4 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        {title}
      </h2>

      {/* Measurement Failure Trend Table now receives the custom coloring function */}
      <TrendMatrixTable
        title="Measurement Failure Trend Analysis"
        data={measurementData}
        rowKey="measurementPoint"
        rowTitle="Measurement Point"
        theme={theme}
        getColoringClass={getMeasurementColoringClass}
      />

      {/* Fabric Defect Trend Table - No coloring function passed, so it uses the default */}
      <TrendMatrixTable
        title="Fabric Defect Trend Analysis"
        data={fabricData}
        rowKey="defectName"
        rowTitle="Fabric Defect Name"
        inspectionQtyByDate={inspectionQtyByDate}
        theme={theme}
      />

      {/* Cutting Defect Trend Table - No coloring function passed, so it uses the default */}
      <TrendMatrixTable
        title="Cutting Defect Trend Analysis"
        data={cuttingData}
        rowKey="cuttingDefectName"
        rowTitle="Cutting Defect Name"
        inspectionQtyByDate={inspectionQtyByDate}
        theme={theme}
      />
    </div>
  );
};

export default CuttingDashboardTrendAnalysis;
