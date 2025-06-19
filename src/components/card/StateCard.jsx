import React from 'react';

const StatCard = ({ title, value, icon, colorClass, loading }) => (
  <div
    className={`bg-white p-4 rounded-xl shadow-lg flex items-center space-x-3 border-l-4 ${colorClass}`}
  >
    <div
      className={`p-3 rounded-full bg-opacity-20 ${colorClass
        .replace("border-l-4", "")
        .replace("border-", "bg-")}`}
    >
      {React.cloneElement(icon, {
        className: `h-6 w-6 ${colorClass
          .replace("border-l-4", "")
          .replace("border-", "text-")}`,
      })}
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
        {title}
      </p>
      <p className="text-xl font-semibold text-gray-700">
        {loading ? "..." : value}
      </p>
    </div>
  </div>
);

export default StatCard;
