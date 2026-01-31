import React from "react";
import { Line } from "react-chartjs-2";
import { TrendingUp, Percent } from "lucide-react";

const ProductionCharts = ({ dbData, summary }) => (
  <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
    <div className="lg:col-span-8 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
      <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-800 dark:text-white"><TrendingUp className="text-blue-600" /> DAILY WASHING QTY TREND</h3>
      <div className="h-[400px]">
        {dbData && <Line 
          data={{
            labels: dbData.trendData.map(t => t._id),
            datasets: [{ 
              label: 'Washed Output', 
              data: dbData.trendData.map(t => t.washQty), 
              borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', fill: true, tension: 0.4, pointRadius: 6, pointBackgroundColor: '#fff', pointBorderWidth: 3
            }]
          }} 
          options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
        />}
      </div>
    </div>

    <div className="lg:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
       <div>
         <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><Percent size={20}/> Measurement Quality </h3>
         <p className="text-blue-100 text-sm">Overall Pass Rate for selected period</p>
       </div>
       <div className="flex flex-col items-center py-8">
          <div className="text-7xl font-black mb-2">{summary.avgPassRate?.toFixed(1)}%</div>
          <div className="text-xs font-bold bg-white/20 px-4 py-1.5 rounded-full uppercase tracking-widest">Global Accuracy</div>
       </div>
       <div className="space-y-4">
          <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-2"><span>TOTAL DEFECTS</span><span className="text-amber-400">{summary.totalDefects?.toLocaleString()} PCS</span></div>
          <div className="flex justify-between text-xs font-bold"><span>INSPECTION COUNT</span><span>{summary.numberOfWashings} Batches</span></div>
       </div>
    </div>
  </div>
);

export default ProductionCharts;