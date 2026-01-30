import React from "react";
import { Ruler, AlertTriangle, TrendingUp } from "lucide-react";

const SkuQualityMatrices = ({ dbData }) => {
  return (
    <div className="max-w-[1600px] mx-auto mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8 pb-12">
      
      {/* Table: Style & Color Measurement Matrix */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 dark:text-white uppercase">
            <Ruler className="text-blue-600" /> Measurement Accuracy Matrix
          </h3>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">
            Worst Performing SKUs
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
                <th className="pb-4">Style / Order No</th>
                <th className="pb-4">Order Qty</th>
                <th className="pb-4">Colorway</th>
                <th className="pb-4 text-center">Reports</th>
                <th className="pb-4 text-right">Precision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
              {dbData?.styleColorMeasurement?.map((row, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-4 text-sm font-black text-slate-700 dark:text-gray-200">{row.style}</td>
                  <td className="py-4">
                    <span className="text-xs font-bold text-slate-500 bg-slate-50 dark:bg-gray-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-gray-700">
                      {(row.orderQty || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 text-xs font-bold text-slate-500 uppercase tracking-tighter">{row.color}</td>
                  
                  <td className="py-4 text-center">
                    <span className="bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-[10px] font-black">
                      {row.reports}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-sm font-black ${row.accuracy < 90 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {row.accuracy.toFixed(1)}%
                      </span>
                      <div className="w-20 h-1 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${row.accuracy < 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${row.accuracy}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table: Style & Color Defect Matrix */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 dark:text-white uppercase">
            <AlertTriangle className="text-rose-600" /> Defect Severity Matrix
          </h3>
          <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-3 py-1 rounded-full uppercase tracking-widest">
            SKU Performance
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
                <th className="pb-4">Style / Order No</th>
                <th className="pb-4">Colorway</th>
                <th className="pb-4 text-center">Total Defects</th>
                <th className="pb-4 text-right">Defect Rate (%)</th> {/* Changed Label */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
              {dbData?.styleColorDefects?.map((row, i) => (
                <tr key={i} className="group hover:bg-rose-50/10 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-4 text-sm font-black text-slate-700 dark:text-gray-200">{row.style}</td>
                  <td className="py-4 text-xs font-bold text-slate-500 uppercase tracking-tighter">{row.color}</td>
                  <td className="py-4 text-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 dark:text-gray-300">{row.defectQty}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">In {row.inspectedQty} Checked Pcs</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    {/* This now shows the (totalDefects/totalPiecesChecked)*100 value */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs ${row.defectRate > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      <TrendingUp size={12} /> {row.defectRate.toFixed(2)}%
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                      Total {row.reports} Reports
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SkuQualityMatrices;