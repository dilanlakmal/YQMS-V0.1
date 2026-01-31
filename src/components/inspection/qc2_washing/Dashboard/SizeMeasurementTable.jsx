import React, { useState, useMemo } from "react";
import { Ruler, ChevronDown, ChevronRight, ChevronLeft, Box, Palette, Layers, Hash } from "lucide-react";

const SizeMeasurementTable = ({ data = [] }) => {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Expansion States
  const [expandedOrders, setExpandedOrders] = useState({});
  const [expandedColors, setExpandedColors] = useState({});

  // 1. Transform flat data into nested hierarchy
  const hierarchy = useMemo(() => {
    return data.reduce((acc, curr) => {
      const { orderNo, color } = curr;
      if (!acc[orderNo]) acc[orderNo] = { colors: {}, totals: { pcs: 0, pts: 0, pass: 0, fail: 0 } };
      if (!acc[orderNo].colors[color]) acc[orderNo].colors[color] = { sizes: [], totals: { pcs: 0, pts: 0, pass: 0, fail: 0 } };

      acc[orderNo].colors[color].sizes.push(curr);

      // Accumulate Totals
      const updateTotals = (obj) => {
        obj.pcs += curr.totalCheckedPcs || 0;
        obj.pts += curr.totalCheckedPoints || 0;
        obj.pass += curr.totalPass || 0;
        obj.fail += curr.totalFail || 0;
      };

      updateTotals(acc[orderNo].colors[color].totals);
      updateTotals(acc[orderNo].totals);

      return acc;
    }, {});
  }, [data]);

  // 2. Pagination Logic (Paginate by OrderNo)
  const orderKeys = Object.keys(hierarchy);
  const totalPages = Math.ceil(orderKeys.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrderKeys = orderKeys.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const toggleOrder = (orderNo) => setExpandedOrders(prev => ({ ...prev, [orderNo]: !prev[orderNo] }));
  const toggleColor = (id) => setExpandedColors(prev => ({ ...prev, [id]: !prev[id] }));
  
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="max-w-[1600px] mx-auto mt-8 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800 transition-all">
      
      {/* Header with Pagination Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 dark:text-white uppercase">
            <Ruler className="text-indigo-600" /> Measurement Breakdown By Style
          </h3>
          <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-widest ml-9">
            Order ➔ Colorway ➔ Size Breakdown
          </p>
        </div>

        {/* Pagination UI */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-800 p-1.5 rounded-2xl border border-slate-100 dark:border-gray-700">
          <button 
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="p-2 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-20 rounded-xl transition-all text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Page {currentPage} <span className="text-slate-300 mx-1">/</span> {totalPages || 1}
          </div>
          <button 
            onClick={goToNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-20 rounded-xl transition-all text-slate-600 dark:text-slate-400"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-6 py-3 text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-gray-800 mb-4">
          <div className="col-span-4">Production Item</div>
          <div className="col-span-1 text-center">Pcs</div>
          <div className="col-span-1 text-center">Points</div>
          <div className="col-span-1 text-center">Pass</div>
          <div className="col-span-1 text-center">Fail</div>
          <div className="col-span-1 text-center text-orange-500">(+)</div>
          <div className="col-span-1 text-center text-blue-500">(-)</div>
          <div className="col-span-2 text-right">Accuracy</div>
        </div>

        {/* Nested Rows */}
        {currentOrderKeys.map((orderNo, idx) => {
          const order = hierarchy[orderNo];
          const isOrderExpanded = expandedOrders[orderNo];

          return (
            <div key={orderNo} className="mb-2">
              {/* LEVEL 1: ORDER ROW */}
              <div 
                onClick={() => toggleOrder(orderNo)}
                className="grid grid-cols-12 items-center px-6 py-4 bg-slate-50 dark:bg-gray-800/50 rounded-2xl cursor-pointer hover:bg-indigo-50/50 transition-all border border-transparent hover:border-indigo-100"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-300 w-4">{startIndex + idx + 1}</span>
                  {isOrderExpanded ? <ChevronDown size={18} className="text-indigo-600"/> : <ChevronRight size={18} className="text-slate-400"/>}
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600"><Box size={16}/></div>
                  <span className="font-black text-slate-800 dark:text-white uppercase truncate">{orderNo}</span>
                </div>
                <div className="col-span-1 text-center font-bold text-slate-500">{order.totals.pcs}</div>
                <div className="col-span-1 text-center font-bold text-slate-500">{order.totals.pts}</div>
                <div className="col-span-1 text-center font-black text-emerald-600">{order.totals.pass}</div>
                <div className="col-span-1 text-center font-black text-rose-500">{order.totals.fail}</div>
                <div className="col-span-2"></div>
                <div className="col-span-2 text-right">
                  <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-lg text-[10px] font-black shadow-sm border border-slate-100 dark:border-gray-600">
                    {((order.totals.pass / (order.totals.pts || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* LEVEL 2: COLOR ROWS */}
              {isOrderExpanded && Object.keys(order.colors).map((colorName) => {
                const color = order.colors[colorName];
                const colorId = `${orderNo}-${colorName}`;
                const isColorExpanded = expandedColors[colorId];

                return (
                  <div key={colorName} className="ml-8 mt-1">
                    <div 
                      onClick={() => toggleColor(colorId)}
                      className="grid grid-cols-12 items-center px-6 py-3 bg-white dark:bg-gray-900 rounded-xl cursor-pointer border border-slate-100 dark:border-gray-800 hover:border-emerald-200 transition-all shadow-sm"
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        {isColorExpanded ? <ChevronDown size={14} className="text-emerald-600"/> : <ChevronRight size={14} className="text-slate-400"/>}
                        <Palette size={14} className="text-emerald-500" />
                        <span className="text-xs font-bold text-slate-600 dark:text-gray-300 uppercase truncate">{colorName}</span>
                      </div>
                      <div className="col-span-1 text-center text-xs text-slate-400">{color.totals.pcs}</div>
                      <div className="col-span-1 text-center text-xs text-slate-400">{color.totals.pts}</div>
                      <div className="col-span-1 text-center text-xs font-bold text-emerald-500">{color.totals.pass}</div>
                      <div className="col-span-1 text-center text-xs font-bold text-rose-400">{color.totals.fail}</div>
                      <div className="col-span-2"></div>
                      <div className="col-span-2 text-right text-[10px] font-bold text-slate-400">
                        {((color.totals.pass / (color.totals.pts || 1)) * 100).toFixed(1)}%
                      </div>
                    </div>

                    {/* LEVEL 3: SIZE ROWS */}
                    {isColorExpanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {color.sizes.map((sizeData, sIdx) => (
                          <div key={sIdx} className="grid grid-cols-12 items-center px-6 py-2 bg-slate-50/30 dark:bg-gray-800/20 rounded-lg border-l-2 border-indigo-400 group hover:bg-indigo-50/30 transition-colors">
                            <div className="col-span-4 flex items-center gap-3">
                              <Layers size={12} className="text-slate-300 group-hover:text-indigo-400" />
                              <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">Size {sizeData.size}</span>
                            </div>
                            <div className="col-span-1 text-center text-xs font-medium">{sizeData.totalCheckedPcs}</div>
                            <div className="col-span-1 text-center text-xs font-medium">{sizeData.totalCheckedPoints}</div>
                            <div className="col-span-1 text-center text-xs font-bold text-emerald-600">{sizeData.totalPass}</div>
                            <div className="col-span-1 text-center text-xs font-bold text-rose-500">{sizeData.totalFail}</div>
                            <div className="col-span-1 text-center text-xs text-orange-400 font-bold">{sizeData.totalPlusFail}</div>
                            <div className="col-span-1 text-center text-xs text-blue-400 font-bold">{sizeData.totalMinusFail}</div>
                            <div className="col-span-2 text-right font-black text-xs text-slate-600 dark:text-gray-400">
                              {sizeData.accuracy.toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest gap-4 border-t border-slate-50 dark:border-gray-800 pt-6">
        <div>Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, orderKeys.length)} of {orderKeys.length} Unique Orders</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          Precision Grading Live System
        </div>
      </div>
    </div>
  );
};

export default SizeMeasurementTable;