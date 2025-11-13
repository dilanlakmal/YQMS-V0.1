import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const getDefectRateColorClasses = (rate) => {
  if (rate === null || rate === undefined) return "from-blue-500 to-blue-600";
  if (rate > 5) return "from-red-500 to-red-600";
  if (rate >= 3) return "from-orange-500 to-orange-600";
  return "from-green-500 to-green-600";
};

const DashboardStatCard = ({ title, value, rate, subValue, icon: Icon }) => {
  const gradientClasses = getDefectRateColorClasses(rate);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientClasses} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}
      ></div>

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${gradientClasses} shadow-lg`}
          >
            {Icon && <Icon className="w-6 h-6 text-white" />}
          </div>
          {rate !== null && rate !== undefined && (
            <div className="flex items-center gap-1">
              {rate > 3 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
            </div>
          )}
        </div>

        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
          {title}
        </p>
        <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardStatCard;
