import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { AlertTriangle, Settings2, Target, Hash, Plus, Minus, Sigma } from "lucide-react";

const AnalyticsTables = ({ dbData, defectLimit, setDefectLimit }) => {
  const [pointLimit, setPointLimit] = useState(5);
  const [manualPointLimit, setManualPointLimit] = useState("");

  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setDefectLimit(val);
    } else if (e.target.value === "") {
      setDefectLimit("");
    }
  };

  const handlePointLimitChange = (e) => {
    const val = e.target.value;
    setManualPointLimit(val);
    if (val && !isNaN(val) && parseInt(val) > 0) {
      setPointLimit(parseInt(val));
    }
  };

  const topFailingPoints = dbData?.pointFailureSummary?.slice(0, pointLimit) || [];

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-stretch">
      {/* 1. LEFT SECTION: TOP DEFECTS (7 Columns) */}
      <div className="lg:col-span-12 xl:col-span-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <h3 className="text-xl font-black flex items-center gap-2 text-rose-600 uppercase tracking-tight">
            <AlertTriangle size={24} /> Top Defects
          </h3>

          <div className="flex items-center gap-3 bg-slate-100 dark:bg-gray-800 p-1.5 rounded-2xl ring-1 ring-slate-200 dark:ring-gray-700">
            <div className="flex items-center px-3 gap-2 border-r border-slate-200 dark:border-gray-700 mr-1">
              <Settings2 size={14} className="text-slate-400" />
              <input
                type="number"
                min="1"
                value={defectLimit}
                onChange={handleInputChange}
                className="w-12 bg-transparent text-xs font-black text-rose-600 focus:outline-none"
                placeholder="Qty"
              />
            </div>
            {[5, 10, 20].map((num) => (
              <button
                key={num}
                onClick={() => setDefectLimit(num)}
                className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${
                  defectLimit === num
                    ? "bg-white dark:bg-gray-700 text-rose-600 shadow-lg"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                TOP {num}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-[350px]">
            {dbData?.defectSummary && (
              <Bar
                data={{
                  labels: dbData.defectSummary.map((d) => d._id),
                  datasets: [
                    {
                      label: "Instances",
                      data: dbData.defectSummary.map((d) => d.totalDefectQty),
                      backgroundColor: "#fb7185",
                      borderRadius: 10,
                      barThickness: 20,
                    },
                  ],
                }}
                options={{
                  indexAxis: "y",
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10, weight: "bold" } } },
                    y: { grid: { display: false }, ticks: { font: { size: 10, weight: "bold" } } },
                  },
                }}
              />
            )}
          </div>

          <div className="overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            <table className="w-full">
              <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                <tr className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
                  <th className="pb-3 text-left">Defect</th>
                  <th className="pb-3 text-center">Pcs</th>
                  <th className="pb-3 text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
                {dbData?.defectSummary.map((d, i) => (
                  <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 text-sm font-bold text-slate-700 dark:text-gray-300">{d._id}</td>
                    <td className="py-4 text-center">
                      <span className="text-sm font-black bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                        {d.affectedPieces}
                      </span>
                    </td>
                    <td className="py-4 text-right text-sm font-black text-rose-600">{d.totalDefectQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. RIGHT SECTION: CRITICAL POINTS (5 Columns) */}
      <div className="lg:col-span-12 xl:col-span-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800 flex flex-col">
        <div className="flex flex-col gap-4 mb-8">
          <h3 className="text-xl font-black flex items-center gap-3 text-indigo-600 uppercase tracking-tight">
            <Target size={24} /> Measurement Points (Fails)
          </h3>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-gray-800 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-gray-700 shadow-inner">
            <div className="flex items-center px-2 gap-2 border-r border-slate-200 dark:border-gray-700 mr-1">
              <Hash size={14} className="text-slate-400" />
              <input
                type="number"
                value={manualPointLimit || pointLimit}
                onChange={handlePointLimitChange}
                className="w-10 bg-transparent text-xs font-black text-indigo-600 focus:outline-none"
                placeholder="Qty"
              />
            </div>
            {[5, 10, 15].map((num) => (
              <button
                key={num}
                onClick={() => { setPointLimit(num); setManualPointLimit(""); }}
                className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${
                  pointLimit === num 
                    ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-md"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                TOP {num}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
              <tr className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
                <th className="pb-3 text-left">Measurement Point</th>
                <th className="pb-3 text-center px-1"><Plus size={10} className="inline mr-1" />Plus</th>
                <th className="pb-3 text-center px-1"><Minus size={10} className="inline mr-1" />Min</th>
                <th className="pb-3 text-right"><Sigma size={10} className="inline mr-1" />Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
              {topFailingPoints.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="py-4 text-sm font-black text-slate-700 dark:text-gray-300">
                    <span className="block truncate max-w-[150px]" title={p._id}>{p._id}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.affectedSizes?.slice(0, 4).map((sz) => (
                        <span key={sz} className="text-sm bg-slate-100 dark:bg-gray-800 px-1 rounded text-slate-400 font-bold">{sz}</span>
                      ))}
                    </div>
                  </td>
                  
                  {/* Plus Fails */}
                  <td className="py-4 text-center">
                    <span className="text-sm font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                      {p.plusFail}
                    </span>
                  </td>

                  {/* Minus Fails */}
                  <td className="py-4 text-center">
                     <span className="text-sm font-black text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
                      {p.minusFail}
                    </span>
                  </td>

                  {/* Total Fails */}
                  <td className="py-4 text-right">
                    <span className="text-sm font-black text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-900">
                      {p.totalFail}
                    </span>
                  </td>
                </tr>
              ))}
              {topFailingPoints.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-300 text-xs italic">No measurement failures found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTables;