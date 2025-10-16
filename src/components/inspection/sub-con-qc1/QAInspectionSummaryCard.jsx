import React from "react";

const QAInspectionSummaryCard = ({
  title,
  icon,
  value,
  minorCount,
  majorCount,
  criticalCount,
  gradientFrom,
  gradientTo,
  showSeverityBreakdown = false
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
      <div
        className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} p-4 flex items-center justify-between`}
      >
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
          {icon}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-black text-white drop-shadow-lg">
            {value}
          </p>
        </div>
      </div>

      {showSeverityBreakdown &&
        (minorCount > 0 || majorCount > 0 || criticalCount > 0) && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 space-y-2">
            {minorCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Minor
                </span>
                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-md text-xs font-bold">
                  {minorCount}
                </span>
              </div>
            )}
            {majorCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Major
                </span>
                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-md text-xs font-bold">
                  {majorCount}
                </span>
              </div>
            )}
            {criticalCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Critical
                </span>
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-xs font-bold">
                  {criticalCount}
                </span>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default QAInspectionSummaryCard;
