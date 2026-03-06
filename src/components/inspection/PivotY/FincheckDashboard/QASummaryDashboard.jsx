import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

const QASummaryDashboard = ({
  startDate,
  endDate,
  qaFilter,
  reportType,
  buyer,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);

  // Carousel State
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-dashboard/qa-performance`,
          {
            params: { startDate, endDate, reportType, buyer },
          },
        );
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching QA Dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate, reportType, buyer]); // Added reportType dependency

  // 2. Filter Logic
  useEffect(() => {
    if (!qaFilter) {
      setFilteredData(data);
    } else {
      const lowerFilter = qaFilter.toLowerCase();
      const filtered = data.filter(
        (qa) =>
          qa.name.toLowerCase().includes(lowerFilter) ||
          qa.empId.toLowerCase().includes(lowerFilter),
      );
      setFilteredData(filtered);
    }
  }, [data, qaFilter]);

  // 3. Auto Scroll Logic
  useEffect(() => {
    if (loading || filteredData.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      handleScroll("right");
    }, 10000); // 10 Seconds

    return () => clearInterval(interval);
  }, [filteredData, loading, isPaused]);

  // Scroll Handler
  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 336;

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

  const getPhotoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const cleanPath = url.startsWith("/") ? url.substring(1) : url;
    const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
      ? PUBLIC_ASSET_URL
      : `${PUBLIC_ASSET_URL}/`;
    return `${baseUrl}${cleanPath}`;
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
      {/* Header Label */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Trophy className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          QA Performance Feed
        </h3>
        {filteredData.length > 0 && (
          <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {filteredData.length} Active
          </span>
        )}
      </div>

      {/* Controls */}
      <button
        onClick={() => handleScroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 shadow-lg rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 hover:text-indigo-600 transition-all opacity-0 group-hover/container:opacity-100 -ml-4 lg:-ml-6"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => handleScroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 shadow-lg rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 hover:text-indigo-600 transition-all opacity-0 group-hover/container:opacity-100 -mr-4 lg:-mr-6"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Main Content Area */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
          <p className="text-sm text-gray-400 font-medium">
            Analyzing Performance...
          </p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">
            No QA data found for this selection
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
          {filteredData.map((qa) => (
            <div
              key={qa.empId}
              className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>

              {/* QA Profile Header */}
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700 shadow-sm overflow-hidden bg-gray-100 flex-shrink-0">
                  {qa.photo ? (
                    <img
                      src={getPhotoUrl(qa.photo)}
                      alt={qa.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4
                    className="text-sm font-black text-gray-800 dark:text-white truncate"
                    title={qa.name}
                  >
                    {qa.name}
                  </h4>
                  <p className="text-xs text-gray-500 font-mono">{qa.empId}</p>
                </div>
                <div
                  className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-lg border ${getRateColor(qa.stats.defectRate)}`}
                >
                  {qa.stats.defectRate}%
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-400">
                    Reports
                  </p>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    {qa.stats.reports}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-400">
                    Inspected
                  </p>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    {qa.stats.sample.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Defect Breakdown Bar */}
              <div className="flex h-2 w-full rounded-full overflow-hidden mb-4 bg-gray-100 dark:bg-gray-700">
                {qa.stats.minor > 0 && (
                  <div
                    className="bg-green-400"
                    style={{
                      width: `${(qa.stats.minor / qa.stats.defects) * 100}%`,
                    }}
                    title={`Minor: ${qa.stats.minor}`}
                  />
                )}
                {qa.stats.major > 0 && (
                  <div
                    className="bg-orange-400"
                    style={{
                      width: `${(qa.stats.major / qa.stats.defects) * 100}%`,
                    }}
                    title={`Major: ${qa.stats.major}`}
                  />
                )}
                {qa.stats.critical > 0 && (
                  <div
                    className="bg-red-500"
                    style={{
                      width: `${(qa.stats.critical / qa.stats.defects) * 100}%`,
                    }}
                    title={`Critical: ${qa.stats.critical}`}
                  />
                )}
              </div>

              {/* Defect Counts Row */}
              <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-4 px-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>{" "}
                  Minor: {qa.stats.minor}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>{" "}
                  Major: {qa.stats.major}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{" "}
                  Crit: {qa.stats.critical}
                </span>
              </div>

              {/* Top Defects */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Top Findings
                </p>
                {qa.topDefects.length > 0 ? (
                  qa.topDefects.map((def, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 px-2 py-1.5 rounded border border-gray-100 dark:border-gray-700"
                    >
                      <span
                        className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-32"
                        title={def.name}
                      >
                        {idx + 1}. {def.name}
                      </span>
                      <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 rounded">
                        {def.qty}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 bg-green-50 dark:bg-green-900/10 rounded border border-dashed border-green-200">
                    <span className="text-xs text-green-600 font-medium">
                      No Defects Found
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Styles for hiding scrollbar */}
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

export default QASummaryDashboard;
