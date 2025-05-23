import React from "react";
import { FaCheckCircle, FaRedoAlt, FaUsers, FaBoxOpen } from "react-icons/fa"; // Example icons

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-4 rounded-lg shadow flex items-center">
    <div className={`p-3 rounded-full mr-4 ${color}`}>
      {React.createElement(icon, { className: "text-white text-xl" })}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-800">
        {value !== undefined && value !== null ? value.toLocaleString() : "0"}
      </p>
    </div>
  </div>
);

const CardVisuals = ({ stats }) => {
  if (!stats) return <div className="text-center py-4">Loading stats...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Good Qty"
        value={stats.totalGoodQty}
        icon={FaCheckCircle}
        color="bg-green-500"
      />
      <StatCard
        title="Total Good Bundles"
        value={stats.totalGoodBundles}
        icon={FaBoxOpen}
        color="bg-blue-500"
      />
      <StatCard
        title="Total Rewash Qty"
        value={stats.totalRewashQty}
        icon={FaRedoAlt}
        color="bg-yellow-500"
      />
      <StatCard
        title="Total Inspectors"
        value={stats.totalInspectors}
        icon={FaUsers}
        color="bg-purple-500"
      />
    </div>
  );
};

export default CardVisuals;
