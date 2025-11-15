// ===== TopDefectsTable.jsx =====
import React, { useState } from "react";
import { AlertCircle } from "lucide-react";

const TopDefectsTable = ({ topDefects }) => {
  const [topN, setTopN] = useState(3);
  const topNOptions = [3, 5, 7, 10, Infinity];

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden h-full">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Top Defects</h2>
          </div>
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg p-1">
            {topNOptions.map((n) => (
              <button
                key={n}
                onClick={() => setTopN(n)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  topN === n
                    ? "bg-white text-red-600 shadow-lg"
                    : "text-white hover:bg-white/20"
                }`}
              >
                {n === Infinity ? "All" : n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {topDefects.slice(0, topN).map((defect, index) => (
            <div
              key={defect.name}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {defect.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Quantity:{" "}
                      <span className="font-bold text-red-600 dark:text-red-400">
                        {defect.qty}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {defect.rate.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopDefectsTable;
