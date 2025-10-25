import {
  AlertTriangle,
  CheckCircle,
  ListOrdered,
  Target,
  XCircle
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

// A small, reusable KPI card component (Unchanged)
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

// --- NEW: Detailed Issues Table Component ---
const IssuesTable = ({ issues, theme }) => {
  // Predefined sort order for fraction columns
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

  // Dynamically generate table headers based on available data
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
      // Handle cases where a key might not be in the sort order array
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

// --- NEW: Display Component that handles the table ---
const IssuesDisplay = ({ data, topN, theme }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-4">
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
          No measurement issues recorded for this selection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
      {data.map((group) => (
        <div key={group.garmentType}>
          <p
            className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
              theme === "dark" ? "text-blue-300" : "text-blue-700"
            }`}
          >
            {group.garmentType}
          </p>
          <IssuesTable issues={group.issues.slice(0, topN)} theme={theme} />
        </div>
      ))}
    </div>
  );
};

// --- MODIFIED: The main card component with new aggregation logic ---
const StyleCard = ({ styleData }) => {
  const { theme } = useTheme();
  const [topN, setTopN] = useState(5);
  const [activeTab, setActiveTab] = useState("All");

  const getDefectRateColor = (rate) => {
    if (rate < 1) return "text-green-500";
    if (rate < 3) return "text-yellow-500";
    return "text-red-500";
  };

  const allTablesData = useMemo(() => {
    const aggregatedIssues = {};
    styleData.issuesByTable.forEach((table) => {
      table.issuesByGarmentType.forEach((garmentGroup) => {
        if (!aggregatedIssues[garmentGroup.garmentType]) {
          aggregatedIssues[garmentGroup.garmentType] = {};
        }
        garmentGroup.issues.forEach((issue) => {
          const point = issue.measurementPoint;
          if (!aggregatedIssues[garmentGroup.garmentType][point]) {
            aggregatedIssues[garmentGroup.garmentType][point] = {
              measurementPoint: point,
              total: 0,
              tol_plus: 0,
              tol_minus: 0,
              fractionCounts: {}
            };
          }
          const currentPoint =
            aggregatedIssues[garmentGroup.garmentType][point];
          currentPoint.total += issue.total;
          currentPoint.tol_plus += issue.tol_plus;
          currentPoint.tol_minus += issue.tol_minus;
          for (const key in issue.fractionCounts) {
            currentPoint.fractionCounts[key] =
              (currentPoint.fractionCounts[key] || 0) +
              issue.fractionCounts[key];
          }
        });
      });
    });

    return Object.keys(aggregatedIssues).map((garmentType) => ({
      garmentType,
      issues: Object.values(aggregatedIssues[garmentType]).sort(
        (a, b) => b.total - a.total
      )
    }));
  }, [styleData.issuesByTable]);

  const displayedData =
    activeTab === "All"
      ? allTablesData
      : styleData.issuesByTable.find((t) => t.tableNo === activeTab)
          ?.issuesByGarmentType || [];

  const getTabClass = (tabName) => {
    const base =
      "px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200";
    if (tabName === activeTab) {
      return `${base} bg-blue-600 text-white`;
    }
    return `${base} ${
      theme === "dark"
        ? "bg-gray-600/50 text-gray-300 hover:bg-gray-600"
        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
    }`;
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
          {styleData.moNo}
        </h3>
        <p
          className={`text-xs font-mono tracking-wider mb-4 ${
            theme === "dark" ? "text-blue-400" : "text-blue-600"
          }`}
        >
          {styleData.tableNos.sort().join(" | ")}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Target size={20} className="text-blue-500" />}
          title="Total Points"
          value={styleData.totalPoints.toLocaleString()}
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-green-500" />}
          title="Total Pass"
          value={styleData.totalPass.toLocaleString()}
        />
        <StatCard
          icon={<XCircle size={20} className="text-red-500" />}
          title="Total Rejects"
          value={styleData.totalRejects.toLocaleString()}
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          title="Defect Rate"
          value={styleData.defectRate.toFixed(2)}
          unit="%"
          colorClass={getDefectRateColor(styleData.defectRate)}
        />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h4
            className={`text-sm font-bold flex items-center gap-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <ListOrdered size={16} />
            Top {topN} Measurement Issues
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

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setActiveTab("All")}
            className={getTabClass("All")}
          >
            All
          </button>
          {styleData.tableNos.sort().map((table) => (
            <button
              key={table}
              onClick={() => setActiveTab(table)}
              className={getTabClass(table)}
            >
              {table}
            </button>
          ))}
        </div>

        <div className="flex-grow">
          <IssuesDisplay data={displayedData} topN={topN} theme={theme} />
        </div>
      </div>
    </div>
  );
};

// The main wrapper component (Unchanged)
const CuttingDashboardMeasurementIssuesStyleCard = ({ data, title }) => {
  const { theme } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div
        className={`p-4 mt-6 rounded-lg shadow-md h-40 flex items-center justify-center ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
          No style-specific measurement data to display for the selected
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((styleData) => (
          <StyleCard key={styleData.moNo} styleData={styleData} />
        ))}
      </div>
    </div>
  );
};

export default CuttingDashboardMeasurementIssuesStyleCard;
