import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Loader2,
  AlertCircle,
  FileText,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

const OrderNoSummaryDashboard = ({
  startDate,
  endDate,
  orderFilter,
  reportType,
  buyer,
  qaFilter,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);

  // Carousel State
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-dashboard/order-performance`,
          {
            params: { startDate, endDate, reportType, buyer, qaFilter },
          },
        );
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching Order stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate, reportType, buyer, qaFilter]);

  // Filter Logic
  useEffect(() => {
    if (!orderFilter) {
      setFilteredData(data);
    } else {
      const lowerFilter = orderFilter.toLowerCase();
      const filtered = data.filter((o) =>
        o.orderNo.toLowerCase().includes(lowerFilter),
      );
      setFilteredData(filtered);
    }
  }, [data, orderFilter]);

  // Auto Scroll Logic
  useEffect(() => {
    if (loading || filteredData.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      handleScroll("right");
    }, 12000); // 12 Seconds (slightly slower than QA to desync visual movement)

    return () => clearInterval(interval);
  }, [filteredData, loading, isPaused]);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 340;

      if (direction === "left") {
        current.scrollLeft -= scrollAmount;
      } else {
        if (
          Math.ceil(current.scrollLeft + current.clientWidth) >=
          current.scrollWidth
        ) {
          current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          current.scrollLeft += scrollAmount;
        }
      }
    }
  };

  const getRateColor = (rate) => {
    const val = parseFloat(rate);
    if (val === 0) return "text-emerald-500 bg-emerald-50 border-emerald-200";
    if (val < 2.5) return "text-indigo-500 bg-indigo-50 border-indigo-200";
    if (val < 5) return "text-orange-500 bg-orange-50 border-orange-200";
    return "text-red-500 bg-red-50 border-red-200";
  };

  return (
    <div className="w-full relative group/container bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Package className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Order Summary Feed
        </h3>
        {filteredData.length > 0 && (
          <span className="bg-purple-100 text-purple-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {filteredData.length} Orders
          </span>
        )}
      </div>

      {/* Controls */}
      <button
        onClick={() => handleScroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 shadow-lg rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 hover:text-purple-600 transition-all opacity-0 group-hover/container:opacity-100 -ml-4"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => handleScroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 shadow-lg rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 hover:text-purple-600 transition-all opacity-0 group-hover/container:opacity-100 -mr-4"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Content */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
          <p className="text-sm text-gray-400 font-medium">
            Loading Order Data...
          </p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <Layers className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">
            No orders found for this selection
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{ scrollSnapType: "x mandatory" }}
        >
          {filteredData.map((order, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>

              {/* Order Header */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Order No
                    </p>
                    <h4
                      className="text-base font-black text-gray-800 dark:text-white truncate w-32"
                      title={order.orderNo}
                    >
                      {order.orderNo}
                    </h4>
                  </div>
                </div>
                <div
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getRateColor(order.stats.defectRate)}`}
                >
                  {order.stats.defectRate}%
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 text-center border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-center mb-1">
                    <FileText className="w-3 h-3 text-gray-400" />
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">
                    Reports
                  </p>
                  <p className="text-sm font-black text-gray-700 dark:text-gray-200">
                    {order.stats.reports}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 text-center border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-center mb-1">
                    <Layers className="w-3 h-3 text-gray-400" />
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">
                    Sample
                  </p>
                  <p className="text-sm font-black text-gray-700 dark:text-gray-200">
                    {order.stats.sample.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 text-center border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-center mb-1">
                    <AlertTriangle className="w-3 h-3 text-gray-400" />
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">
                    Defects
                  </p>
                  <p className="text-sm font-black text-gray-700 dark:text-gray-200">
                    {order.stats.defects}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex h-1.5 w-full rounded-full overflow-hidden mb-2 bg-gray-100 dark:bg-gray-700">
                {order.stats.minor > 0 && (
                  <div
                    className="bg-green-400"
                    style={{
                      width: `${(order.stats.minor / order.stats.defects) * 100}%`,
                    }}
                  />
                )}
                {order.stats.major > 0 && (
                  <div
                    className="bg-orange-400"
                    style={{
                      width: `${(order.stats.major / order.stats.defects) * 100}%`,
                    }}
                  />
                )}
                {order.stats.critical > 0 && (
                  <div
                    className="bg-red-500"
                    style={{
                      width: `${(order.stats.critical / order.stats.defects) * 100}%`,
                    }}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-5 px-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>{" "}
                  Min: {order.stats.minor}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>{" "}
                  Maj: {order.stats.major}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{" "}
                  Crit: {order.stats.critical}
                </span>
              </div>

              {/* Top 5 Findings */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">
                  Top 5 Defects
                </p>
                {order.topDefects.length > 0 ? (
                  order.topDefects.map((def, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center group/item hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded p-1 -mx-1 transition-colors"
                    >
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate w-40 flex items-center gap-1.5">
                        <span className="text-[9px] text-gray-400 font-mono w-3">
                          {i + 1}.
                        </span>{" "}
                        {def.name}
                      </span>
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                        {def.qty}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 bg-green-50 dark:bg-green-900/10 rounded border border-dashed border-green-200">
                    <span className="text-xs text-green-600 font-bold">
                      No Defects Found
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default OrderNoSummaryDashboard;
