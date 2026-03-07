import React, { useState, useMemo } from "react";
import { AlertTriangle, Factory, Hash, Layers, Percent } from "lucide-react";

const FactoryDefectTable = ({ data = [] }) => {
  const [limit, setLimit] = useState(5);
  const [manualLimit, setManualLimit] = useState("");

  const tableData = useMemo(() => {
    if (!data || data.length === 0) {
      return { factories: [], rows: [], grandTotalPcs: 0 };
    }

    const factoryGroups = {};
    const factoryPcsTotals = {};
    let grandTotalPcs = 0;

    // 1. Group data and calculate total pieces for the whole dashboard
    data.forEach((item) => {
      const fName = item?._id?.factory || "Unknown";
      const pcs = Number(item?.totalPcs) || 0;
      const qty = Number(item?.totalQty) || 0;

      if (!factoryGroups[fName]) factoryGroups[fName] = [];

      factoryPcsTotals[fName] = (factoryPcsTotals[fName] || 0) + pcs;
      grandTotalPcs += pcs;

      factoryGroups[fName].push({
        name: item?._id?.defect || "Unknown",
        qty: qty,
        pcs: pcs,
      });
    });

    // 2. Prepare Factory Metadata (the red badges)
    const factoryNames = Object.keys(factoryGroups).sort();
    const factories = factoryNames.map((fName) => {
      // Sort defects within each factory by PCS descending
      factoryGroups[fName].sort((a, b) => b.pcs - a.pcs);

      return {
        name: fName,
        // Overall contribution: (This Factory Pcs / Total Dashboard Pcs)
        share:
          grandTotalPcs > 0
            ? ((factoryPcsTotals[fName] / grandTotalPcs) * 100).toFixed(1)
            : "0.0",
        totalPcs: factoryPcsTotals[fName],
      };
    });

    // 3. Create rows based on Rank Limit
    const rows = [];
    const displayLimit = parseInt(limit) || 5;

    for (let i = 0; i < displayLimit; i++) {
      const row = { rank: i + 1 };
      factories.forEach((factoryObj) => {
        const fName = factoryObj.name;
        const defectAtRank = factoryGroups[fName][i];

        if (defectAtRank) {
          // Internal Row Percentage: (This Defect Pcs / Total Factory Pcs)
          const internalPercent =
            factoryPcsTotals[fName] > 0
              ? ((defectAtRank.pcs / factoryPcsTotals[fName]) * 100).toFixed(1)
              : "0.0";

          row[fName] = { ...defectAtRank, percentage: internalPercent };
        } else {
          row[fName] = null;
        }
      });
      rows.push(row);
    }

    return { factories, rows, grandTotalPcs };
  }, [data, limit]);

  const { factories, rows, grandTotalPcs } = tableData;

  const handleManualChange = (e) => {
    const val = e.target.value;
    setManualLimit(val);
    if (val && !isNaN(val) && parseInt(val) > 0) {
      setLimit(parseInt(val));
    }
  };

  return (
    <div className="max-w-8xl mx-auto mb-8 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-gray-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-200">
            <Layers size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
              Factory Top N Defects
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              % Based on Total Defect Pieces (PCS)
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
              Rank:
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
                placeholder="#"
                className="w-20 pl-8 pr-3 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b w-20">
                Rank
              </th>
              {factories.map((factory) => (
                <th
                  key={factory.name}
                  className="px-4 py-4 border-b border-l border-slate-100 dark:border-gray-800 bg-slate-50/30 min-w-[220px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Factory size={14} className="text-blue-600" />
                      <span className="text-sm font-black text-slate-800 dark:text-white uppercase">
                        {factory.name}
                      </span>
                    </div>
                    {/* Red Badge now uses the calculated share from grandTotalPcs */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full">
                      <Percent size={10} className="text-white" />
                      <span className="text-xs font-black text-white">
                        {factory.share}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1 mt-3 text-[10px] font-bold text-slate-400 uppercase">
                    <div className="text-center">Defect</div>
                    <div className="text-center">Qty</div>
                    <div className="text-center font-black text-blue-500">
                      Pcs
                    </div>
                    <div className="text-center">%</div>
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
                <td className="px-4 py-4 text-center border-r border-slate-50 bg-slate-50/20 font-black text-slate-400">
                  #{row.rank}
                </td>

                {factories.map((factory) => (
                  <td
                    key={factory.name}
                    className="px-4 py-4 border-l border-slate-100 dark:border-gray-800"
                  >
                    {row[factory.name] ? (
                      <div className="grid grid-cols-4 gap-1 items-center text-center">
                        <div
                          className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate"
                          title={row[factory.name].name}
                        >
                          {row[factory.name].name}
                        </div>
                        <div className="text-xs font-medium text-slate-400">
                          {row[factory.name].qty}
                        </div>
                        <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                          {row[factory.name].pcs}
                        </div>
                        <div className="text-sm font-black text-purple-700 dark:text-purple-300">
                          {row[factory.name].percentage}%
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-200 font-medium italic text-xs py-3">
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
            No defect data available
          </p>
        </div>
      )}
    </div>
  );
};

export default FactoryDefectTable;
