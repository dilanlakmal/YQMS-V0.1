import React, { useState, useMemo, useEffect } from "react";
import { AlertTriangle, Factory, Hash, Layers } from "lucide-react";

const FactoryDefectTable = ({ data = [] }) => {
  // Default to 5
  const [limit, setLimit] = useState(5);
  const [manualLimit, setManualLimit] = useState("");

  const tableData = useMemo(() => {
    if (!data || data.length === 0) return { factories: [], rows: [] };

    // 1. Group defects by factory
    const factoryGroups = data.reduce((acc, item) => {
      const fName = item?._id?.factory || "Unknown";
      if (!acc[fName]) acc[fName] = [];
      acc[fName].push({
        name: item?._id?.defect || "Unknown Defect",
        qty: item?.totalQty || 0,
        pcs: item?.totalPcs || 0,
      });
      return acc;
    }, {});

    // 2. Sort each factory's defects by count descending
    const factories = Object.keys(factoryGroups).sort();
    factories.forEach((f) => {
      factoryGroups[f].sort((a, b) => b.qty - a.qty);
    });

    // 3. Create rows based on Rank Limit
    const rows = [];
    const displayLimit = parseInt(limit) || 5;

    for (let i = 0; i < displayLimit; i++) {
      const row = { rank: i + 1 };
      factories.forEach((f) => {
        row[f] = factoryGroups[f][i] || null;
      });
      rows.push(row);
    }

    return { factories, rows };
  }, [data, limit]);

  const { factories, rows } = tableData;

  const handleManualChange = (e) => {
    const val = e.target.value;
    setManualLimit(val);
    if (val && !isNaN(val) && parseInt(val) > 0) {
      setLimit(parseInt(val));
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto mb-8 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-gray-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-200">
            <Layers size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
              YM & External Factory Top N Defects
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Displaying top N defects by factory
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-inner border border-slate-200">
          <div className="flex items-center gap-1 border-r pr-3 border-slate-100">
            {[5, 10, 20].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setLimit(n);
                  setManualLimit("");
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  limit === n && manualLimit === ""
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pl-1">
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Custom Rank:
            </span>
            <div className="relative">
              <Hash
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="number"
                value={manualLimit}
                onChange={handleManualChange}
                placeholder="Enter..."
                className="w-24 pl-8 pr-3 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b w-24">
                Rank
              </th>
              {factories.map((factory) => (
                <th
                  key={factory}
                  className="px-6 py-5 border-b border-l border-slate-100 dark:border-gray-800 bg-slate-50/30"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Factory size={16} className="text-blue-600 mb-1" />
                    <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      {factory}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className="group hover:bg-slate-50/80 transition-colors"
              >
                {/* Rank # */}
                <td className="px-6 py-4 text-center border-r border-slate-50 bg-slate-50/20 font-black text-slate-400">
                  #{row.rank}
                </td>

                {/* Data Cells */}
                {factories.map((factory) => (
                  <td
                    key={factory}
                    className="px-6 py-5 border-l border-slate-100 dark:border-gray-800"
                  >
                    {row[factory] ? (
                      <div className="flex flex-col items-center text-center">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 mb-2 group-hover:text-blue-600 transition-colors">
                          {row[factory].name}
                        </span>
                        <div className="flex gap-2">
                          <div className="flex flex-col items-center px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100">
                            <span className="text-[9px] font-black text-blue-400 uppercase leading-none mb-1">
                              Qty
                            </span>
                            <span className="text-xs font-black text-blue-700 dark:text-blue-300">
                              {row[factory].qty}
                            </span>
                          </div>
                          <div className="flex flex-col items-center px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100">
                            <span className="text-[9px] font-black text-emerald-400 uppercase leading-none mb-1">
                              Pcs
                            </span>
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                              {row[factory].pcs}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-200 font-medium italic text-[10px] uppercase tracking-widest">
                        ---
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {factories.length === 0 && (
        <div className="p-20 text-center bg-slate-50/30">
          <AlertTriangle className="mx-auto text-slate-200 mb-2" size={40} />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
            No defect ranking available
          </p>
        </div>
      )}
    </div>
  );
};

export default FactoryDefectTable;
