import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import { CalendarDays, Clock, Table, BarChart2 } from "lucide-react";
import BGradeStockData from "../components/inspection/qc2/BGradeStockData";
import BGradeStockFilterPane from "../components/inspection/qc2/BGradeStockFilterPane";
// import BGradeStockSummary from '../components/inspection/qc2/BGradeStockSummary'; // For later

const BGradeStock = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("data");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filters state will be managed here and passed down
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    moNo: "",
    lineNo: "",
    packageNo: "",
    color: "",
    size: "",
    department: ""
  });

  // Update clock every second
  React.useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const PageTitle = useCallback(
    () => (
      <div className="text-center">
        <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
          {t("bGradeStock.header", "B-Grade Stock Report")}
          {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap justify-center items-center">
          <span className="mx-1.5 text-slate-400">|</span>
          <CalendarDays className="w-3.5 h-3.5 mr-1 text-slate-500" />
          <span className="text-slate-700">
            {currentTime.toLocaleDateString()}
          </span>
          <span className="mx-1.5 text-slate-400">|</span>
          <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
          <span className="text-slate-700">
            {currentTime.toLocaleTimeString()}
          </span>
        </p>
      </div>
    ),
    [t, user, currentTime]
  );

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <PageTitle />

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("data")}
              className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150 ${
                activeTab === "data"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Table className="w-5 h-5" /> Data
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150 ${
                activeTab === "summary"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BarChart2 className="w-5 h-5" /> Summary
            </button>
          </nav>
        </div>

        <BGradeStockFilterPane onFilterChange={setFilters} />

        {activeTab === "data" && <BGradeStockData filters={filters} />}
        {/* {activeTab === 'summary' && <BGradeStockSummary filters={filters} />} */}
        {activeTab === "summary" && (
          <div className="text-center p-8 bg-white rounded-lg shadow">
            Summary Tab - To be built
          </div>
        )}
      </div>
    </div>
  );
};

export default BGradeStock;
