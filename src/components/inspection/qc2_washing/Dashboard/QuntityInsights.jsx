import React from "react";
import { Package, ClipboardList, TrendingUp } from "lucide-react";

const QualityInsights = ({ dbData }) => (
  <section className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
    {/* Pass Rate by Order No */}
    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white">
          <Package size={20} className="text-blue-500" /> MEASUREMENT PASS RATE
          BY ORDER
        </h3>
        <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded-lg uppercase">
          Lowest 5
        </span>
      </div>
      <div className="space-y-4">
        {dbData?.passRateByOrder?.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700"
          >
            <div>
              <p className="text-sm font-black text-slate-700 dark:text-gray-200">
                {item._id}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                {item.totalBatches} Reports
              </p>
            </div>
            <div
              className={`text-lg font-black ${item.avgPassRate < 90 ? "text-rose-500" : "text-emerald-500"}`}
            >
              {item.avgPassRate?.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Pass Rate by Report Type */}
    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
      <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
        <ClipboardList size={20} className="text-purple-500" /> MEASUREMENT PASS
        RATE BY REPORT
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {dbData?.passRateByReportType?.map((item, idx) => (
          <div
            key={idx}
            className="p-4 border border-slate-100 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center text-center bg-white dark:bg-gray-900 shadow-sm"
          >
            <div className="relative w-16 h-16 flex items-center justify-center mb-3">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-slate-100 dark:text-gray-800"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={175}
                  strokeDashoffset={175 - (175 * item.avgPassRate) / 100}
                  // Updated logic: Green if >= 95
                  className={
                    item.avgPassRate >= 95
                      ? "text-emerald-500"
                      : "text-rose-500"
                  }
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-black text-slate-700 dark:text-white">
                {item.avgPassRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase leading-tight">
              {item._id}
            </p>

            {/* Added: Pass Count / Total Count Display */}
            <p className="text-[10px] font-bold text-slate-400 mt-1">
              {item.passReports}/{item.totalReports}{" "}
              <span className="text-[8px]">PASS</span>
            </p>
          </div>
        ))}
      </div>
    </div>

    {/* Pass Rate by Date */}
    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
      <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
        <TrendingUp size={20} className="text-emerald-500" /> MEASUREMENT DAILY
        PASS RATE
      </h3>
      <div className="space-y-3">
        {dbData?.passRateByDate?.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className="text-[11px] font-black text-slate-400 w-24">
              {item._id}
            </div>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${item.avgPassRate > 95 ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${item.avgPassRate}%` }}
              />
            </div>
            <div className="text-[11px] font-black text-slate-700 dark:text-gray-300 w-10 text-right">
              {Math.round(item.avgPassRate)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default QualityInsights;
