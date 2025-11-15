import React, { useMemo, useState } from "react";
import {
  BarChart3,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { getDefectRateColor } from "./utils";

const ModernButton = ({ label, active, onClick }) => {
  const baseClasses =
    "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105";
  const variantClasses = active
    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";

  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses}`}>
      {label}
    </button>
  );
};

const DetailsToggleButton = ({ showDetails, onToggle }) => {
  const baseClasses =
    "flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200";
  const variantClasses = showDetails
    ? "bg-white/20 text-white hover:bg-white/30"
    : "bg-white/10 text-indigo-200 hover:bg-white/20";

  return (
    <button onClick={onToggle} className={`${baseClasses} ${variantClasses}`}>
      {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
      <span>{showDetails ? "Hide Details" : "Show Details"}</span>
    </button>
  );
};

const SortButton = ({ sortType, currentSort, order, onSort }) => {
  const isActive = currentSort === sortType;
  const baseClasses =
    "flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105";
  const variantClasses = isActive
    ? "bg-white text-indigo-600 shadow-lg"
    : "bg-white/10 text-white hover:bg-white/20";

  const getSortIcon = () => {
    if (!isActive) return <ArrowUpDown size={16} />;
    return order === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };

  const getSortLabel = () => {
    const labels = {
      date: "Date",
      "date-line": "Date-Line",
      "date-mo": "Date-MO",
      defect: "Defect Rate"
    };
    return labels[sortType] || sortType;
  };

  return (
    <button
      onClick={() => onSort(sortType)}
      className={`${baseClasses} ${variantClasses}`}
    >
      {getSortIcon()}
      <span>{getSortLabel()}</span>
      {isActive && (
        <span className="text-xs opacity-75">
          ({order === "asc" ? "ASC" : "DESC"})
        </span>
      )}
    </button>
  );
};

const SummaryTable = ({ data, activeView, setActiveView, filters }) => {
  const [showDetails, setShowDetails] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    type: "date",
    order: "asc"
  });

  const handleSort = (sortType) => {
    setSortConfig((prev) => ({
      type: sortType,
      order: prev.type === sortType && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  const tableData = useMemo(() => {
    let items = [];

    const sourceMap = {
      "Line-MO": "daily_line_MO_summary",
      Line: "daily_line_summary",
      MO: "daily_mo_summary",
      Buyer: "daily_buyer_summary"
    };
    const sourceKey = sourceMap[activeView];

    data.forEach((day) => {
      (day[sourceKey] || []).forEach((item) => {
        if (
          (!filters.lineNo || item.lineNo === filters.lineNo.value) &&
          (!filters.moNo || item.MONo === filters.moNo.value) &&
          (!filters.buyer || item.Buyer === filters.buyer.value)
        ) {
          const checkedQty = Math.max(item.CheckedQtyT38, item.CheckedQtyT39);
          const defectRate =
            checkedQty > 0 ? (item.totalDefectsQty / checkedQty) * 100 : 0;
          items.push({
            ...item,
            date: day.inspectionDate.split("T")[0],
            checkedQty,
            defectRate
          });
        }
      });
    });

    // Apply sorting based on sortConfig
    const sortedItems = [...items].sort((a, b) => {
      const order = sortConfig.order === "asc" ? 1 : -1;

      switch (sortConfig.type) {
        case "date":
          // Sort by date only
          return order * a.date.localeCompare(b.date);

        case "date-line":
          // Sort by date first, then by line number
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return order * dateCompare;

          const lineA = parseInt(a.lineNo) || 0;
          const lineB = parseInt(b.lineNo) || 0;
          return order * (lineA - lineB);

        case "date-mo":
          // Sort by date first, then by MO number
          const dateCompareMO = a.date.localeCompare(b.date);
          if (dateCompareMO !== 0) return order * dateCompareMO;

          return order * (a.MONo || "").localeCompare(b.MONo || "");

        case "defect":
          // Sort by defect rate only (highest to lowest for DESC)
          return order * (b.defectRate - a.defectRate);

        default:
          return 0;
      }
    });

    return sortedItems;
  }, [data, activeView, filters, sortConfig]);

  const headers = useMemo(() => {
    const baseHeaders = {
      "Line-MO": [
        "Date",
        "Line",
        "MO",
        "Checked",
        "Inside",
        "Outside",
        "Defects",
        "Rate"
      ],
      Line: ["Date", "Line", "Checked", "Inside", "Outside", "Defects", "Rate"],
      MO: ["Date", "MO", "Checked", "Inside", "Outside", "Defects", "Rate"],
      Buyer: [
        "Date",
        "Buyer",
        "Checked",
        "Inside",
        "Outside",
        "Defects",
        "Rate"
      ]
    };

    if (showDetails) {
      Object.keys(baseHeaders).forEach((key) => {
        baseHeaders[key].push("Details");
      });
    }

    return baseHeaders;
  }, [showDetails]);

  // Determine which sort buttons to show based on active view
  const getAvailableSorts = () => {
    const commonSorts = ["date", "defect"];

    if (activeView.includes("Line")) {
      return ["date", "date-line", "defect"];
    }
    if (activeView.includes("MO")) {
      return ["date", "date-mo", "defect"];
    }
    return commonSorts;
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Daily Summary View</h2>
          </div>

          {/* Sort Options - Placed before view buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {getAvailableSorts().map((sortType) => (
              <SortButton
                key={sortType}
                sortType={sortType}
                currentSort={sortConfig.type}
                order={sortConfig.order}
                onSort={handleSort}
              />
            ))}

            {/* Divider */}
            <div className="w-px h-8 bg-white/20 mx-1"></div>

            {/* View Buttons */}
            {["Line-MO", "Line", "MO", "Buyer"].map((view) => (
              <ModernButton
                key={view}
                label={view}
                active={activeView === view}
                onClick={() => setActiveView(view)}
              />
            ))}

            {/* Details Toggle */}
            <DetailsToggleButton
              showDetails={showDetails}
              onToggle={() => setShowDetails((prev) => !prev)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
            <tr>
              {headers[activeView].map((h) => (
                <th
                  key={h}
                  className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tableData.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors duration-150"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {row.date}
                </td>
                {activeView.includes("Line") && (
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md font-medium">
                      {row.lineNo}
                    </span>
                  </td>
                )}
                {activeView.includes("MO") && (
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md font-medium">
                      {row.MONo}
                    </span>
                  </td>
                )}
                {activeView.includes("Buyer") && (
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md font-medium">
                      {row.Buyer}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900 dark:text-gray-100">
                  {row.checkedQty}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                  {row.CheckedQtyT39}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                  {row.CheckedQtyT38}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-bold">
                    {row.totalDefectsQty}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span
                    className={`px-3 py-1 rounded-full font-bold text-xs ${getDefectRateColor(
                      row.defectRate
                    )}`}
                  >
                    {row.defectRate.toFixed(2)}%
                  </span>
                </td>

                {showDetails && (
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {(row.DefectArray || []).map((d) => {
                        const individualRate =
                          row.checkedQty > 0
                            ? (d.defectQty / row.checkedQty) * 100
                            : 0;
                        return (
                          <div
                            key={d.defectCode}
                            className="flex items-center justify-between gap-2 text-xs bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded"
                          >
                            <span className="text-gray-700 dark:text-gray-300">
                              {d.defectName}{" "}
                              <span className="font-semibold">
                                (×{d.defectQty})
                              </span>
                            </span>
                            <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                              {individualRate.toFixed(2)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryTable;
