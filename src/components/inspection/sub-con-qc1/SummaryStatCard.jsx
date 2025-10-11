import React from "react";

const SummaryStatCard = ({
  title,
  value,
  icon,
  colorClass = "text-indigo-500"
}) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center gap-4">
      <div
        className={`p-3 rounded-full bg-gray-100 dark:bg-gray-700 ${colorClass}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </div>
    </div>
  );
};

export default SummaryStatCard;
