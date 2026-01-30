import React from "react";
import { Bar } from "react-chartjs-2";
import { AlertTriangle, Ruler, Settings2 } from "lucide-react";

const AnalyticsTables = ({ dbData, defectLimit, setDefectLimit }) => {
  
  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    // Ensure value is at least 1, or empty string handling
    if (!isNaN(val) && val > 0) {
      setDefectLimit(val);
    } else if (e.target.value === "") {
      setDefectLimit(""); // Allow clearing to type
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
      {/* Critical Defects Section */}
      <div className="lg:col-span-12 xl:col-span-7 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <h3 className="text-xl font-black flex items-center gap-2 text-rose-600 uppercase">
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
                  labels: dbData.defectSummary.map(d => d._id), 
                  datasets: [{ 
                    label: 'Instances', 
                    data: dbData.defectSummary.map(d => d.totalDefectQty), 
                    backgroundColor: '#fb7185', 
                    borderRadius: 10, 
                    barThickness: 20 
                  }] 
                }} 
                options={{ 
                  indexAxis: 'y', 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } },
                    y: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }
                  }
                }} 
              />
            )}
          </div>
          
          <div className="overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            <table className="w-full">
              <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
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
                      <span className="text-[10px] font-black bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                        {d.affectedPieces}
                      </span>
                    </td>
                    <td className="py-4 text-right text-sm font-black text-rose-600">
                      {d.totalDefectQty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Precision Heatmap Section */}
      <div className="lg:col-span-12 xl:col-span-5 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
        <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-800 dark:text-white uppercase">
          <Ruler className="text-indigo-600" /> Size Precision Heatmap
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
                <th className="pb-4">Size</th>
                <th className="pb-4 text-center">Checked</th>
                <th className="pb-4 text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
              {dbData?.measurementSummary.map((m) => {
                const accuracy = ((m.passPoints / m.totalPoints) * 100) || 0;
                return (
                  <tr key={m._id} className="text-slate-700 dark:text-gray-300 group">
                    <td className="py-5 font-black">{m._id}</td>
                    <td className="py-5 text-center font-bold text-xs">{m.pcsChecked} Pcs</td>
                    <td className="py-5">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex w-32 h-2.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              accuracy > 95 ? 'bg-green-500' : accuracy > 85 ? 'bg-amber-500' : 'bg-rose-500'
                            }`} 
                            style={{ width: `${accuracy}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-black">{accuracy.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTables;