// ===== SummaryTable.jsx =====
import React, { useMemo } from "react";
import { BarChart3 } from "lucide-react";
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

const SummaryTable = ({ data, activeView, setActiveView, filters }) => {
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

    return items.sort((a, b) => b.defectRate - a.defectRate);
  }, [data, activeView, filters]);

  const headers = {
    "Line-MO": [
      "Date",
      "Line",
      "MO",
      "Checked",
      "Inside",
      "Outside",
      "Defects",
      "Rate",
      "Details"
    ],
    Line: [
      "Date",
      "Line",
      "Checked",
      "Inside",
      "Outside",
      "Defects",
      "Rate",
      "Details"
    ],
    MO: [
      "Date",
      "MO",
      "Checked",
      "Inside",
      "Outside",
      "Defects",
      "Rate",
      "Details"
    ],
    Buyer: [
      "Date",
      "Buyer",
      "Checked",
      "Inside",
      "Outside",
      "Defects",
      "Rate",
      "Details"
    ]
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Daily Summary View</h2>
          </div>
          <div className="flex items-center gap-2">
            {["Line-MO", "Line", "MO", "Buyer"].map((view) => (
              <ModernButton
                key={view}
                label={view}
                active={activeView === view}
                onClick={() => setActiveView(view)}
              />
            ))}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryTable;
