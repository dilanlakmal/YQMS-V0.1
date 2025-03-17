import React from "react";
import SummaryCard from "./SummaryCard"; // Adjust path as needed
import { CheckCircle, CheckSquare, XCircle, AlertCircle } from "lucide-react";

const DailyTrendPop = ({ date, data }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-4 w-[500px] border">
      {/* Date Header */}
      <h3 className="text-base font-bold mb-1">{date}</h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <SummaryCard
          title="Checked Qty"
          value={data.checkedQty}
          size="small"
          className="text-xs"
          icon={<CheckCircle className="w-4 h-4 text-blue-500" />}
        />
        <SummaryCard
          title="Total Pass"
          value={data.totalPass}
          size="small"
          className="text-xs"
          icon={<CheckSquare className="w-4 h-4 text-green-500" />}
        />
        <SummaryCard
          title="Reject Garments"
          value={data.totalRejects}
          size="small"
          className="text-xs"
          icon={<XCircle className="w-4 h-4 text-red-500" />}
        />
        <SummaryCard
          title="Defects Qty"
          value={data.defectsQty}
          size="small"
          className="text-xs"
          icon={<AlertCircle className="w-4 h-4 text-orange-500" />}
        />
      </div>

      {/* Top 5 Defects */}
      <h4 className="text-sm font-semibold mb-2">Top 5 Defects</h4>
      <ul className="text-xs">
        {data.topDefects.map((defect, index) => (
          <li key={index} className="flex justify-between py-1">
            <span>{defect.name}</span>
            <span>
              {defect.count} ({defect.defectRate.toFixed(2)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DailyTrendPop;
