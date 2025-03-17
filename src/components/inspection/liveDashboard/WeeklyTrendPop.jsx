import React from "react";
import SummaryCard from "./SummaryCard";
import { CheckCircle, CheckSquare, XCircle, AlertCircle } from "lucide-react";
import "./WeeklyTrendPop.css";

const WeeklyTrendPop = ({ weekLabel, data }) => {
  return (
    <div
      className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-xl rounded-2xl p-6 w-[500px] border border-gray-100 weekly-trend-pop"
      style={{ position: "relative", zIndex: 1001 }}
    >
      <h3 className="text-lg font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 animate-pulse-slow">
        {weekLabel}
      </h3>

      <div className="grid grid-cols-4 gap-2 mb-6">
        <SummaryCard
          title="Checked Qty"
          value={data.checkedQty}
          icon="checkCircle"
          className="p-2 custom-card-stack"
        />
        <SummaryCard
          title="Total Pass"
          value={data.totalPass}
          icon="checkSquare"
          className="p-2 custom-card-stack"
        />
        <SummaryCard
          title="Total Rejects"
          value={data.totalRejects}
          icon="xCircle"
          className="p-2 custom-card-stack"
        />
        <SummaryCard
          title="Defects Qty"
          value={data.defectsQty}
          icon="trendingDown"
          className="p-2 custom-card-stack"
        />
      </div>

      <h4 className="text-sm font-semibold mb-3 text-gray-800 border-b-2 border-dashed border-purple-300 pb-1">
        Top 5 Defects
      </h4>
      <ul className="text-xs space-y-2">
        {data.topDefects.map((defect, index) => (
          <li
            key={index}
            className="defect-item flex justify-between items-center py-2 px-4 bg-white bg-opacity-90 rounded-lg shadow-md transition-all duration-200"
          >
            <span className="font-medium text-gray-700">{defect.name}</span>
            <span className="font-semibold text-gray-900 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
              {defect.count} ({defect.defectRate.toFixed(2)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WeeklyTrendPop;
