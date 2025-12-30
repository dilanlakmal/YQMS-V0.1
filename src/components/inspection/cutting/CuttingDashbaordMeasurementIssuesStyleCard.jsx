import {
  AlertTriangle,
  CheckCircle,
  ListOrdered,
  Target,
  XCircle,
  TrendingUp,
  Package,
  Eye,
  Filter
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

// Enhanced StatCard with better visual design
const StatCard = ({ icon, title, value, unit = "", colorClass = "", trend = null }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
        theme === "dark" 
          ? "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600" 
          : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${
          theme === "dark" ? "bg-gray-600/50" : "bg-gray-100"
        }`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center text-xs ${
            trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-gray-500"
          }`}>
            <TrendingUp size={12} className="mr-1" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h4
        className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {title}
      </h4>
      <p
        className={`text-2xl font-bold ${
          theme === "dark" ? "text-gray-100" : "text-gray-800"
        } ${colorClass}`}
      >
        {value}
        <span className="text-sm ml-1 font-medium opacity-75">{unit}</span>
      </p>
    </div>
  );
};

// Enhanced Issues Table with better styling
const IssuesTable = ({ issues, theme }) => {
  const fractionSortOrder = [
    "-1", "-15/16", "-7/8", "-13/16", "-3/4", "-11/16", "-5/8", "-9/16",
    "-1/2", "-7/16", "-3/8", "-5/16", "-1/4", "-3/16", "-1/8", "-1/16",
    "1/16", "1/8", "3/16", "1/4", "5/16", "3/8", "7/16", "1/2",
    "9/16", "5/8", "11/16", "3/4", "13/16", "7/8", "15/16", "1"
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
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className={`w-full text-left text-xs ${
        theme === "dark" ? "text-gray-300" : "text-gray-700"
      }`}>
        <thead className={`${
          theme === "dark"
            ? "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300"
            : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600"
        }`}>
          <tr>
            {headers.map((header, index) => (
              <th key={header} className={`py-3 px-4 font-semibold ${
                index === 0 ? "text-left" : "text-center"
              }`}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, index) => (
            <tr
              key={index}
              className={`border-b transition-colors duration-150 ${
                theme === "dark"
                  ? "border-gray-700 hover:bg-gray-700/30"
                  : "border-gray-200 hover:bg-blue-50/50"
              } ${index % 2 === 0 ? (theme === "dark" ? "bg-gray-800/30" : "bg-gray-50/30") : ""}`}
            >
              <td className="py-3 px-4 font-medium">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    issue.total > 10 ? "bg-red-500" : 
                    issue.total > 5 ? "bg-yellow-500" : "bg-green-500"
                  }`}></div>
                  {issue.measurementPoint}
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`font-bold px-2 py-1 rounded-full text-xs ${
                  issue.total > 10 ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
                  issue.total > 5 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" :
                  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                }`}>
                  {issue.total}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                  {issue.tol_plus}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="text-orange-600 dark:text-orange-400 font-semibold">
                  {issue.tol_minus}
                </span>
              </td>
              {headers.slice(4).map((headerKey) => (
                <td
                  key={headerKey}
                  className="py-3 px-4 text-center"
                >
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    {issue.fractionCounts?.[headerKey] || ""}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Enhanced Issues Display with better empty state
const IssuesDisplay = ({ data, topN, theme }) => {
  if (data.length === 0) {
    return (
      <div className={`text-center py-8 rounded-lg border-2 border-dashed ${
        theme === "dark" ? "border-gray-600 bg-gray-800/30" : "border-gray-300 bg-gray-50/30"
      }`}>
        <Package className={`mx-auto mb-3 ${
          theme === "dark" ? "text-gray-500" : "text-gray-400"
        }`} size={32} />
        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          No measurement issues recorded for this selection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
      {data.map((group) => (
        <div key={group.garmentType} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={`w-1 h-6 rounded-full ${
              theme === "dark" ? "bg-blue-400" : "bg-blue-600"
            }`}></div>
            <h5 className={`text-sm font-bold uppercase tracking-wider ${
              theme === "dark" ? "text-blue-300" : "text-blue-700"
            }`}>
              {group.garmentType}
            </h5>
            <span className={`text-xs px-2 py-1 rounded-full ${
              theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"
            }`}>
              {group.issues.length} issues
            </span>
          </div>
          <IssuesTable issues={group.issues.slice(0, topN)} theme={theme} />
        </div>
      ))}
    </div>
  );
};

// Enhanced Style Card with better layout and interactions
const StyleCard = ({ styleData }) => {
  const { theme } = useTheme();
  const [topN, setTopN] = useState(5);
  const [activeTab, setActiveTab] = useState("All");
  const [isExpanded, setIsExpanded] = useState(false);

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
          const currentPoint = aggregatedIssues[garmentGroup.garmentType][point];
          currentPoint.total += issue.total;
          currentPoint.tol_plus += issue.tol_plus;
          currentPoint.tol_minus += issue.tol_minus;
          for (const key in issue.fractionCounts) {
            currentPoint.fractionCounts[key] =
              (currentPoint.fractionCounts[key] || 0) + issue.fractionCounts[key];
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
    const base = "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 border";
    if (tabName === activeTab) {
      return `${base} bg-blue-600 text-white border-blue-600 shadow-md`;
    }
    return `${base} ${
      theme === "dark"
        ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
    }`;
  };

  return (
    <div
      className={`rounded-2xl shadow-xl border transition-all duration-300 hover:shadow-2xl ${
        theme === "dark" 
          ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" 
          : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
      } ${isExpanded ? "col-span-full" : ""}`}
    >
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${
              theme === "dark" ? "text-gray-100" : "text-gray-900"
            }`}>
              <Package className="text-blue-500" size={20} />
              {styleData.moNo}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                theme === "dark" ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"
              }`}>
                Tables: {styleData.tableNos.sort().join(" | ")}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            <Eye size={18} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Target size={18} className="text-blue-500" />}
            title="Total Points"
            value={styleData.totalPoints.toLocaleString()}
          />
          <StatCard
            icon={<CheckCircle size={18} className="text-green-500" />}
            title="Total Pass"
            value={styleData.totalPass.toLocaleString()}
          />
          <StatCard
            icon={<XCircle size={18} className="text-red-500" />}
            title="Total Rejects"
            value={styleData.totalRejects.toLocaleString()}
          />
          <StatCard
            icon={<AlertTriangle size={18} />}
            title="Defect Rate"
            value={styleData.defectRate.toFixed(2)}
            unit="%"
            colorClass={getDefectRateColor(styleData.defectRate)}
          />
        </div>
      </div>

      {/* Issues Section */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h4 className={`text-lg font-bold flex items-center gap-2 ${
            theme === "dark" ? "text-gray-200" : "text-gray-800"
          }`}>
            <ListOrdered size={18} />
            Top {topN} Measurement Issues
          </h4>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className={theme === "dark" ? "text-gray-400" : "text-gray-600"} />
              <select
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value, 10))}
                className={`px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                <option value={3}>Top 3</option>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab("All")}
            className={getTabClass("All")}
          >
            All Tables
          </button>
          {styleData.tableNos.sort().map((table) => (
            <button
              key={table}
              onClick={() => setActiveTab(table)}
              className={getTabClass(table)}
            >
              Table {table}
            </button>
          ))}
        </div>

        {/* Issues Display */}
        <IssuesDisplay data={displayedData} topN={topN} theme={theme} />
      </div>
    </div>
  );
};

// Enhanced Main Component
const CuttingDashboardMeasurementIssuesStyleCard = ({ data, title }) => {
  const { theme } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className={`p-8 mt-6 rounded-2xl shadow-lg border-2 border-dashed ${
        theme === "dark" 
          ? "bg-gray-800 border-gray-600" 
          : "bg-white border-gray-300"
      }`}>
        <div className="text-center">
          <Package className={`mx-auto mb-4 ${
            theme === "dark" ? "text-gray-500" : "text-gray-400"
          }`} size={48} />
          <h3 className={`text-lg font-semibold mb-2 ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}>
            No Data Available
          </h3>
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            No style-specific measurement data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${
          theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"
        }`}>
          <ListOrdered className={`${
            theme === "dark" ? "text-blue-400" : "text-blue-600"
          }`} size={24} />
        </div>
        <h2 className={`text-2xl font-bold ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}>
          {title}
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"
        }`}>
          {data.length} styles
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        {data.map((styleData) => (
          <StyleCard key={styleData.moNo} styleData={styleData} />
        ))}
      </div>
    </div>
  );
};

export default CuttingDashboardMeasurementIssuesStyleCard;
