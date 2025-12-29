import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../config";
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  AlertCircle,
  QrCode,
  Table,
  CalendarDays,
  Clock,
  Shirt,
  Package,
  Palette,
  Sparkles,
  User,
  Scan,
  Database,
  Settings,
  Camera,
  Upload,
  BarChart3,
  TrendingUp,
  Users,
  Home,
  Activity,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  Zap,
  Star
} from "lucide-react";

// Import all your components (keeping the same imports)
import LiveStyleCard from "../components/inspection/liveDashboard/LiveStyleCard";
import LineCard from "../components/inspection/liveDashboard/LineCard";
import TrendAnalysisMO from "../components/inspection/liveDashboard/TrendAnalysisMO";
import TrendAnalysisLine from "../components/inspection/liveDashboard/TrendAnalysisLine";
import TrendAnalysisLineDefects from "../components/inspection/liveDashboard/TrendAnalysisLineDefects";
import NavigationPanel from "../components/inspection/liveDashboard/NavigationPanel";
import LiveSummary from "../components/inspection/liveDashboard/LiveSummary";
import SummaryCard from "../components/inspection/liveDashboard/SummaryCard";
import DefectBarChart from "../components/inspection/liveDashboard/DefectBarChart";
import MOBarChart from "../components/inspection/liveDashboard/MOBarChart";
import LineBarChart from "../components/inspection/liveDashboard/LineBarChart";
import FilterPane from "../components/inspection/liveDashboard/FilterPane";
import OrderData from "../components/inspection/liveDashboard/OrderData";
import WashingLive from "../components/inspection/liveDashboard/WashingLive";
import IroningLive from "../components/inspection/liveDashboard/IroningLive";
import OPALive from "../components/inspection/liveDashboard/OPALive";
import PackingLive from "../components/inspection/liveDashboard/PackingLive";
import CuttingLive from "../components/inspection/liveDashboard/CuttingLive";
import DailySummary from "../components/inspection/liveDashboard/DailySummary";
import WeeklySummary from "../components/inspection/liveDashboard/WeeklySummary";
import InspectorCard from "../components/inspection/liveDashboard/InspectorCard";
import RovingReport from "../components/inspection/liveDashboard/RovingReport";
import CuttingReport from "../components/inspection/liveDashboard/CuttingReport";
import CuttingGarmentTypeTrendAnalysis from "../components/inspection/cutting/report/CuttingGarmentTypeTrendAnalysis";
import HomeMenu from "../components/inspection/liveDashboard/HomeMenu";
import CuttingMenu from "../components/inspection/liveDashboard/CuttingMenu";
import QCSunriseDashboard from "../components/inspection/liveDashboard/QCSunriseDashboard";
import DigitalMeasurement from "../components/inspection/liveDashboard/DigitalMeasurement";
import DigitalMeasurementCPK from "../components/inspection/liveDashboard/DigitalMeasurement-CPK";
import DigitalMeasurementBuyerSpec from "../components/inspection/digital_measurement/DigitalMeasurementBuyerSpec";
import { useAuth } from "../components/authentication/AuthContext";
import CuttingDashboard from "../components/inspection/cutting/CuttingDashboard";

// Dark mode hook
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDark = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return [isDark, toggleDark];
};

const LiveDashboard = () => {
  const [activeSection, setActiveSection] = useState("Home");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeMoTab, setActiveMoTab] = useState("MO Summary");
  const [activeLineTab, setActiveLineTab] = useState("Line Summary");
  const [activeDashboardTab, setActiveDashboardTab] = useState("Bar Chart");
  const [isDark, toggleDark] = useDarkMode();
  const { user } = useAuth();

  // Add current time state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filter states (keeping all your existing filter states)
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [moNo, setMoNo] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [department, setDepartment] = useState("");
  const [empId, setEmpId] = useState("");
  const [buyer, setBuyer] = useState("");
  const [lineNo, setLineNo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});

  // Data states (keeping all your existing data states)
  const [summaryData, setSummaryData] = useState({
    checkedQty: 0,
    totalPass: 0,
    totalRejects: 0,
    totalRepair: 0,
    bGradeQty: 0,
    defectsQty: 0,
    totalBundles: 0,
    defectRate: 0,
    defectRatio: 0
  });
  const [defectRates, setDefectRates] = useState([]);
  const [moSummaries, setMoSummaries] = useState([]);
  const [hourlyDefectRates, setHourlyDefectRates] = useState({});
  const [lineDefectRates, setLineDefectRates] = useState({});
  const [inspectors, setInspectors] = useState([]);

  const filtersRef = useRef({});

  // Enhanced tabs with better styling and descriptions
  const dashboardTabs = useMemo(() => [
    {
      id: "Bar Chart",
      label: "Charts",
      shortLabel: "Charts",
      icon: <BarChart3 size={20} />,
      description: "Visual Analytics",
      color: "blue",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      id: "Summary Table",
      label: "Data Table",
      shortLabel: "Table",
      icon: <Table size={20} />,
      description: "Detailed View",
      color: "green",
      gradient: "from-green-500 to-green-600"
    },
    {
      id: "Inspector Data",
      label: "Inspectors",
      shortLabel: "Staff",
      icon: <Users size={20} />,
      description: "Performance",
      color: "purple",
      gradient: "from-purple-500 to-purple-600"
    }
  ], []);

  const moAnalysisTabs = useMemo(() => [
    {
      id: "MO Summary",
      label: "MO Overview",
      shortLabel: "Overview",
      icon: <Package size={20} />,
      description: "Summary Stats",
      color: "indigo",
      gradient: "from-indigo-500 to-indigo-600"
    },
    {
      id: "MO Trend",
      label: "Hourly Trends",
      shortLabel: "Trends",
      icon: <TrendingUp size={20} />,
      description: "Time Analysis",
      color: "orange",
      gradient: "from-orange-500 to-orange-600"
    }
  ], []);

  const lineTrendTabs = useMemo(() => [
    {
      id: "Line Summary",
      label: "Line Overview",
      shortLabel: "Overview",
      icon: <Activity size={20} />,
      description: "Line Stats",
      color: "emerald",
      gradient: "from-emerald-500 to-emerald-600"
    },
    {
      id: "Line Trend",
      label: "Line-MO Analysis",
      shortLabel: "Analysis",
      icon: <TrendingUp size={20} />,
      description: "Trend Data",
      color: "rose",
      gradient: "from-rose-500 to-rose-600"
    },
    {
      id: "Line Rate",
      label: "Hourly Rates",
      shortLabel: "Rates",
      icon: <Clock size={20} />,
      description: "Time Rates",
      color: "cyan",
      gradient: "from-cyan-500 to-cyan-600"
    }
  ], []);

  // Get active tab data based on current section
  const getActiveTabData = () => {
    switch (activeSection) {
      case "Live Dashboard":
        return dashboardTabs.find(tab => tab.id === activeDashboardTab);
      case "MO Analysis":
        return moAnalysisTabs.find(tab => tab.id === activeMoTab);
      case "Line Hr Trend":
        return lineTrendTabs.find(tab => tab.id === activeLineTab);
      default:
        return { label: activeSection, icon: <Home size={20} /> };
    }
  };

  const activeTabData = getActiveTabData();

  // Update current time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // All your existing functions (keeping them unchanged)
  const formatDate = (date) => {
    if (!date) return "";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const fetchSummaryData = async (filters = {}) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-inspection-summary`,
        { params: filters }
      );
      setSummaryData(response.data);
    } catch (error) {
      console.error("Error fetching summary data:", error);
      setSummaryData({
        totalGarments: 0,
        totalPass: 0,
        totalRejects: 0,
        totalRepair: 0,
        bGradeQty: 0,
        defectsQty: 0,
        totalBundles: 0,
        defectRate: 0,
        defectRatio: 0
      });
    }
  };

  const fetchDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-defect-rates`, {
        params: filters
      });
      const sorted = response.data.sort((a, b) => b.defectRate - a.defectRate);
      let rank = 1;
      let previousRate = null;
      const ranked = sorted.map((item, index) => {
        if (item.defectRate !== previousRate) {
          rank = index + 1;
          previousRate = item.defectRate;
        }
        return { ...item, rank };
      });
      setDefectRates(ranked);
    } catch (error) {
      console.error("Error fetching defect rates:", error);
    }
  };

  const fetchMoSummaries = async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc2-mo-summaries`, {
        params: { ...filters, groupByMO: "true" }
      });
      setMoSummaries(response.data);
    } catch (error) {
      console.error("Error fetching MO summaries:", error);
    }
  };

  const fetchHourlyDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-defect-rates-by-hour`,
        { params: filters }
      );
      setHourlyDefectRates(response.data);
    } catch (error) {
      console.error("Error fetching hourly defect rates:", error);
    }
  };

  const fetchLineDefectRates = async (filters = {}) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-defect-rates-by-line`,
        { params: filters }
      );
      setLineDefectRates(response.data);
    } catch (error) {
      console.error("Error fetching line defect rates:", error);
    }
  };

  const fetchInspectors = async (filters = {}) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle/filter-options`
      );
      const empIds = response.data.emp_id_inspection || [];
      if (filters.emp_id_inspection) {
        setInspectors(empIds.filter((id) => id === filters.emp_id_inspection));
      } else {
        setInspectors(empIds);
      }
    } catch (error) {
      console.error("Error fetching inspectors:", error);
      setInspectors([]);
    }
  };

  const handleApplyFilters = async () => {
    const filters = {};
    if (moNo && moNo.trim()) filters.moNo = moNo;
    if (color) filters.color = color;
    if (size) filters.size = size;
    if (department) filters.department = department;
    if (empId) filters.emp_id_inspection = empId;
    if (startDate) filters.startDate = formatDate(startDate);
    if (endDate) filters.endDate = formatDate(endDate);
    if (buyer) filters.buyer = buyer;
    if (lineNo) filters.lineNo = lineNo;

    const applied = {};
    if (startDate) applied["Start Date"] = formatDate(startDate);
    if (endDate) applied["End Date"] = formatDate(endDate);
    if (moNo) applied["MO No"] = moNo;
    if (color) applied["Color"] = color;
    if (size) applied["Size"] = size;
    if (department) applied["Department"] = department;
    if (empId) applied["Emp ID"] = empId;
    if (buyer) applied["Buyer"] = buyer;
    if (lineNo) applied["Line No"] = lineNo;

    setAppliedFilters(applied);
    filtersRef.current = filters;

    await Promise.all([
      fetchSummaryData(filters),
      fetchDefectRates(filters),
      fetchMoSummaries(filters),
      fetchHourlyDefectRates(filters),
      fetchLineDefectRates(filters),
      fetchInspectors(filters)
    ]);
  };

  const handleResetFilters = async () => {
    setStartDate(null);
    setEndDate(null);
    setMoNo("");
    setColor("");
    setSize("");
    setDepartment("");
    setEmpId("");
    setBuyer("");
    setLineNo("");
    setAppliedFilters({});

    await Promise.all([
      fetchSummaryData(),
      fetchDefectRates(),
      fetchMoSummaries(),
      fetchHourlyDefectRates(),
      fetchLineDefectRates(),
      fetchInspectors()
    ]);
  };

  // Initial data fetch and socket connection (keeping your existing useEffect hooks)
  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([
        fetchSummaryData(),
        fetchDefectRates(),
        fetchMoSummaries(),
        fetchHourlyDefectRates(),
        fetchLineDefectRates(),
        fetchInspectors()
      ]);
    };

    fetchInitialData();

    const intervalId = setInterval(async () => {
      const currentFilters = filtersRef.current;
      await Promise.all([
        fetchSummaryData(currentFilters),
        fetchDefectRates(currentFilters),
        fetchMoSummaries(currentFilters),
        fetchHourlyDefectRates(currentFilters),
        fetchLineDefectRates(currentFilters),
        fetchInspectors(currentFilters)
      ]);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const filters = {};
    if (moNo && moNo.trim()) filters.moNo = moNo;
    if (color && color.trim()) filters.color = color;
    if (size && size.trim()) filters.size = size;
    if (department && department.trim()) filters.department = department;
    if (empId && empId.trim()) filters.emp_id_inspection = empId;
    if (startDate) filters.startDate = formatDate(startDate);
    if (endDate) filters.endDate = formatDate(endDate);
    if (buyer && buyer.trim()) filters.buyer = buyer;
    if (lineNo && lineNo.trim()) filters.lineNo = lineNo;

    filtersRef.current = filters;
  }, [moNo, color, size, department, empId, startDate, endDate, buyer, lineNo]);

  useEffect(() => {
    const socket = io(`${API_BASE_URL}`, {
      path: "/socket.io",
      transports: ["websocket"]
    });

    socket.on("qc2_data_updated", async () => {
      console.log("Data updated event received");
      const currentFilters = filtersRef.current;
      await Promise.all([
        fetchSummaryData(currentFilters),
        fetchDefectRates(currentFilters),
        fetchMoSummaries(currentFilters),
        fetchHourlyDefectRates(currentFilters),
        fetchLineDefectRates(currentFilters),
        fetchInspectors(currentFilters)
      ]);
    });

    return () => socket.disconnect();
  }, []);

  // Summary Cards Component (keeping your existing component)
  const SummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4 mb-6">
      <SummaryCard
        title="Total Garments"
        value={summaryData.totalGarments}
        icon="checkCircle"
      />
      <SummaryCard
        title="Total Pass"
        value={summaryData.totalPass}
        icon="checkCircle"
      />
      <SummaryCard
        title="Initial Rejects"
        value={summaryData.totalRejects}
        icon="xCircle"
      />
      <SummaryCard
        title="Repair Left"
        value={summaryData.totalRepair}
        icon="wrench"
      />
      <SummaryCard
        title="B Grade Qty"
        value={summaryData.bGradeQty}
        icon="alertTriangle"
      />
      <SummaryCard
        title="Defects Qty"
        value={summaryData.defectsQty}
        icon="list"
      />
      <SummaryCard
        title="Total Bundles"
        value={summaryData.totalBundles}
        icon="archive"
      />
      <SummaryCard
        title="Defect Rate"
        value={summaryData.defectRate * 100}
        icon="pieChart"
      />
      <SummaryCard
        title="Defect Ratio"
        value={summaryData.defectRatio * 100}
        icon="trendingDown"
      />
    </div>
  );

  // MO Card Summaries Component (keeping your existing component)
  const MoCardSummaries = () => {
    return (
      <div className="mt-6">
        <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          MO No Summaries
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-4">
          {moSummaries
            .sort((a, b) => b.defectRate - a.defectRate)
            .map((summary) => (
              <LiveStyleCard
                key={summary.moNo}
                moNo={summary.moNo}
                summaryData={summary}
              />
            ))}
        </div>
      </div>
    );
  };

  // Enhanced Tab Renderer with Modern Design
  const renderTabs = (tabs, activeTab, setActiveTab) => (
    <div className="mb-6">
      {/* Mobile Tab Layout - Horizontal Scroll */}
      <div className="lg:hidden">
        <div className="relative">
          <div className="overflow-x-auto scrollbar-hide pb-2">
            <div className="flex space-x-2 px-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 min-w-[80px] ${
                      isActive
                        ? `bg-gradient-to-br ${tab.gradient} text-white shadow-lg shadow-${tab.color}-500/25`
                        : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`mb-1.5 transition-all duration-300 ${
                      isActive ? 'transform scale-110' : 'group-hover:scale-105'
                    }`}>
                      {React.cloneElement(tab.icon, { 
                        className: `w-5 h-5 ${isActive ? 'text-white' : `text-${tab.color}-500 dark:text-${tab.color}-400`}` 
                      })}
                    </div>
                    
                    {/* Label */}
                    <span className={`text-xs font-semibold text-center leading-tight transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {tab.shortLabel || tab.label}
                    </span>
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 dark:bg-yellow-300 rounded-full shadow-lg animate-pulse">
                        <div className="absolute inset-0 w-3 h-3 bg-yellow-400 dark:bg-yellow-300 rounded-full animate-ping"></div>
                      </div>
                    )}
                    
                    {/* Hover Effect */}
                    <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                      isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-10 bg-gradient-to-br ' + tab.gradient
                    }`}></div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Scroll Indicators */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-4 h-full bg-gradient-to-r from-gray-50 dark:from-gray-900 to-transparent pointer-events-none opacity-50"></div>
          <div className="absolute top-1/2 -translate-y-1/2 right-0 w-4 h-full bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent pointer-events-none opacity-50"></div>
        </div>
      </div>

      {/* Desktop Tab Layout */}
      <div className="hidden lg:block">
        <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl shadow-inner">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex-1 ${
                    isActive
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg shadow-${tab.color}-500/25`
                      : "bg-transparent hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {/* Icon Container */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : `bg-${tab.color}-100 dark:bg-${tab.color}-900/30 group-hover:bg-${tab.color}-200 dark:group-hover:bg-${tab.color}-800/50`
                  }`}>
                    {React.cloneElement(tab.icon, { 
                      className: `w-5 h-5 transition-colors duration-300 ${
                        isActive ? 'text-white' : `text-${tab.color}-600 dark:text-${tab.color}-400`
                      }` 
                    })}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 text-left">
                    <div className={`font-semibold text-sm transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {tab.label}
                    </div>
                    <div className={`text-xs transition-colors duration-300 ${
                      isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {tab.description}
                    </div>
                  </div>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-300 fill-current" />
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                      
                      {/* Glow Effect */}
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.gradient} opacity-20 blur-xl -z-10`}></div>
                    </>
                  )}
                  
                  {/* Hover Glow */}
                  <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
                    isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-10 bg-gradient-to-r ' + tab.gradient + ' blur-xl -z-10'
                  }`}></div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Tab Description Bar */}
        <div className="mt-3 flex items-center justify-center">
          <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
            <Zap className={`w-4 h-4 text-${activeTabData?.color || 'blue'}-500`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {activeTabData?.description || 'Dashboard View'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation Panel */}
      <NavigationPanel
        isOpen={isNavOpen}
        toggleNav={() => setIsNavOpen(!isNavOpen)}
        setActiveSection={setActiveSection}
        activeSection={activeSection}
      />

      {/* Main Content */}
      <div
        className={`flex-1 p-4 transition-all duration-300 ${
          isNavOpen ? "ml-72" : "ml-0"
        }`}
      >
        {/* Enhanced Header Section */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 dark:from-gray-800 dark:via-slate-800 dark:to-gray-900 shadow-2xl transition-colors duration-300 rounded-lg mb-6">
                    <div className="absolute inset-0 bg-black/10 dark:bg-black/20 rounded-lg"></div>
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px] rounded-lg"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
            {/* MOBILE/TABLET LAYOUT (< lg) */}
            <div className="lg:hidden space-y-3">
              {/* Top Row: Title + User + Dark Mode Toggle */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                    <Settings size={20} className="text-white dark:text-gray-200" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h1 className="text-sm sm:text-base font-black text-white dark:text-gray-100 tracking-tight truncate">
                        QC2 Live Dashboard
                      </h1>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-full flex-shrink-0">
                        <Sparkles size={10} className="text-yellow-300 dark:text-yellow-400" />
                        <span className="text-[10px] font-bold text-white dark:text-gray-200">
                          QC
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400 dark:bg-green-500"></span>
                      </div>
                      <p className="text-[10px] text-indigo-100 dark:text-gray-300 font-medium truncate">
                        {activeTabData?.label} • Active
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Dark Mode Toggle */}
                  <button
                    onClick={toggleDark}
                    className="p-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-lg transition-all duration-200 hover:bg-white/20 dark:hover:bg-gray-600/50"
                    title="Toggle Dark Mode"
                  >
                    {isDark ? <Sun size={16} className="text-white" /> : <Moon size={16} className="text-white" />}
                  </button>

                  {user && (
                    <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-lg px-2.5 py-1.5 shadow-xl flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-md shadow-lg">
                        <User size={16} className="text-white" />
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-white dark:text-gray-100 font-bold text-xs leading-tight">
                          {user.job_title || "Operator"}
                        </p>
                        <p className="text-indigo-200 dark:text-gray-300 text-[10px] font-medium leading-tight">
                          ID: {user.emp_id}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Date and Time Info */}
              <div className="flex items-center justify-center gap-4 text-white/80 dark:text-gray-300 text-xs">
                <div className="flex items-center gap-1">
                  <CalendarDays size={14} />
                  <span>{currentTime.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{currentTime.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {/* DESKTOP LAYOUT (>= lg) */}
            <div className="hidden lg:flex lg:flex-col lg:gap-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-6 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl shadow-lg">
                      <Settings size={24} className="text-white dark:text-gray-200" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-black text-white dark:text-gray-100 tracking-tight">
                          QC2 Live Dashboard
                        </h1>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-full">
                          <Sparkles size={12} className="text-yellow-300 dark:text-yellow-400" />
                          <span className="text-xs font-bold text-white dark:text-gray-200">
                            QC
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-indigo-100 dark:text-gray-300 font-medium">
                        Yorkmars (Cambodia) Garment MFG Co., LTD
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-white/80 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      <span>{currentTime.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{currentTime.toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl px-4 py-2.5">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400 dark:bg-green-500"></span>
                    </div>
                    <div>
                      <p className="text-white dark:text-gray-100 font-bold text-sm leading-tight">
                        {activeTabData?.label}
                      </p>
                      <p className="text-indigo-200 dark:text-gray-300 text-xs font-medium leading-tight">
                        Active Module
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Dark Mode Toggle */}
                  <button
                    onClick={toggleDark}
                    className="p-3 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl transition-all duration-200 hover:bg-white/20 dark:hover:bg-gray-600/50 shadow-lg"
                    title="Toggle Dark Mode"
                  >
                    {isDark ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-white" />}
                  </button>

                  {user && (
                    <div className="flex items-center gap-3 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl px-4 py-2.5 shadow-xl">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-lg shadow-lg">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white dark:text-gray-100 font-bold text-sm leading-tight">
                          {user.job_title || "Operator"}
                        </p>
                        <p className="text-indigo-200 dark:text-gray-300 text-xs font-medium leading-tight">
                          ID: {user.emp_id}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Common Filter Pane for QC2 Sections */}
        {[
          "Live Dashboard",
          "MO Analysis",
          "Line Hr Trend",
          "Daily Summary",
          "Weekly Analysis",
          "Monthly Analysis"
        ].includes(activeSection) && (
          <FilterPane
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            moNo={moNo}
            setMoNo={setMoNo}
            color={color}
            setColor={setColor}
            size={size}
            setSize={setSize}
            department={department}
            setDepartment={setDepartment}
            empId={empId}
            setEmpId={setEmpId}
            buyer={buyer}
            setBuyer={setBuyer}
            lineNo={lineNo}
            setLineNo={setLineNo}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />
        )}

        {/* Section Content */}
        {activeSection === "Home" && (
          <HomeMenu setActiveSection={setActiveSection} />
        )}

        {activeSection === "Cutting" && (
          <CuttingMenu setActiveSection={setActiveSection} />
        )}

        {activeSection === "Roving Report" && <RovingReport />}

        {activeSection === "Cutting Dashboard" && (
          <CuttingDashboard
            onBackToCuttingLive={() => setActiveSection("Cutting")}
          />
        )}

        {activeSection === "Cutting Reports" && (
          <CuttingReport
            onBackToCuttingLive={() => setActiveSection("Cutting")}
          />
        )}

        {activeSection === "Cutting Trend" && (
          <CuttingGarmentTypeTrendAnalysis
            onBackToCuttingLive={() => setActiveSection("Cutting")}
          />
        )}

        {activeSection === "Buyer Specs" && <DigitalMeasurementBuyerSpec />}

        {activeSection === "Measurement Summary" && <DigitalMeasurement />}

        {activeSection === "Measurement Summary - CPK" && (
          <DigitalMeasurementCPK />
        )}

        {activeSection === "Daily Analysis" && <QCSunriseDashboard />}

        {activeSection === "Order Data" && <OrderData />}

        {activeSection === "Washing" && <WashingLive />}

        {activeSection === "Ironing" && <IroningLive />}

        {activeSection === "OPA" && <OPALive />}

        {activeSection === "Cutting" && <CuttingLive setActiveSection={setActiveSection} />}

        {activeSection === "Packing" && <PackingLive />}

        {activeSection === "Live Dashboard" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            {/* Summary Cards (Common for all tabs) */}
            <SummaryCards />

            {/* Enhanced Tabs for Live Dashboard */}
            {renderTabs(dashboardTabs, activeDashboardTab, setActiveDashboardTab)}

            {/* Tab Content */}
            {activeDashboardTab === "Bar Chart" && (
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                      <BarChart3 size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        QC2 Defect Rate by Defect Name
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Visual analysis of defect patterns
                      </p>
                    </div>
                  </div>
                  <DefectBarChart defectRates={defectRates} />
                </div>

                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                      <Package size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        QC2 Defect Rate by MO No
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manufacturing order performance
                      </p>
                    </div>
                  </div>
                  <MOBarChart filters={filtersRef.current} />
                </div>

                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                      <Activity size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        QC2 Defect Rate by Line No
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Production line analysis
                      </p>
                    </div>
                  </div>
                  <LineBarChart filters={filtersRef.current} />
                </div>
              </div>
            )}

            {activeDashboardTab === "Summary Table" && (
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                    <Table size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Live Summary Data
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Detailed tabular view of all metrics
                    </p>
                  </div>
                </div>
                <LiveSummary filters={filtersRef.current} />
              </div>
            )}

            {activeDashboardTab === "Inspector Data" && (
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <Users size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Inspector Performance
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Individual inspector analytics
                    </p>
                  </div>
                </div>
                {inspectors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inspectors.map((inspectorId) => (
                      <InspectorCard
                        key={inspectorId}
                        inspectorId={inspectorId}
                        filters={filtersRef.current}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Users size={32} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Inspectors Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      No inspectors found for the selected filters. Try adjusting your filter criteria.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSection === "MO Analysis" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            {/* Enhanced Tabs for MO Analysis */}
            {renderTabs(moAnalysisTabs, activeMoTab, setActiveMoTab)}

            {activeMoTab === "MO Summary" && (
              <>
                <SummaryCards />
                <MoCardSummaries />
              </>
            )}

            {activeMoTab === "MO Trend" && (
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      MO Hourly Trend Analysis
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Time-based manufacturing order trends
                    </p>
                  </div>
                </div>
                <TrendAnalysisMO data={hourlyDefectRates} />
              </div>
            )}
          </div>
        )}

        {activeSection === "Line Hr Trend" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            {/* Enhanced Tabs for Line Trend */}
            {renderTabs(lineTrendTabs, activeLineTab, setActiveLineTab)}

            {activeLineTab === "Line Summary" && (
              <>
                <SummaryCards />
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                      <Activity size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Line Summaries
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Production line performance overview
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-6">
                    {Object.keys(lineDefectRates)
                      .filter((key) => key !== "total" && key !== "grand")
                      .filter((lineNum) => !lineNo || lineNum === lineNo)
                      .map((lineNum) => ({
                        lineNo: lineNum,
                        defectRate: (() => {
                          const moData = lineDefectRates[lineNum] || {};
                          let totalCheckedQty = 0;
                          let totalDefectsQty = 0;
                          Object.keys(moData).forEach((moNum) => {
                            if (moNum !== "totalRate") {
                              Object.keys(moData[moNum]).forEach((hour) => {
                                if (hour !== "totalRate") {
                                  const hourData = moData[moNum][hour];
                                  totalCheckedQty += hourData.checkedQty || 0;
                                  totalDefectsQty += hourData.defects.reduce(
                                    (sum, defect) => sum + defect.count,
                                    0
                                  );
                                }
                              });
                            }
                          });
                          return totalCheckedQty > 0
                            ? totalDefectsQty / totalCheckedQty
                            : 0;
                        })()
                      }))
                      .sort((a, b) => b.defectRate - a.defectRate)
                      .map(({ lineNo }) => (
                        <LineCard
                          key={lineNo}
                          lineNo={lineNo}
                          lineDefectRates={lineDefectRates}
                        />
                      ))}
                  </div>
                </div>
              </>
            )}

            {activeLineTab === "Line Trend" && (
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Line-MO Trend Analysis
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Combined line and manufacturing order trends
                    </p>
                  </div>
                </div>
                <TrendAnalysisLine data={lineDefectRates} lineNoFilter={lineNo} />
              </div>
            )}

            {activeLineTab === "Line Rate" && (
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg">
                    <Clock size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Line Hourly Defect Trends
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Hour-by-hour defect rate analysis
                    </p>
                  </div>
                </div>
                <TrendAnalysisLineDefects
                  data={lineDefectRates}
                  lineNo={lineNo}
                />
              </div>
            )}
          </div>
        )}

        {activeSection === "Daily Summary" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <CalendarDays size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Daily Summary Report
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Comprehensive daily performance metrics
                </p>
              </div>
            </div>
            <DailySummary filters={filtersRef.current} />
          </div>
        )}

        {activeSection === "Weekly Analysis" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <CalendarDays size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Weekly Analysis Report
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Weekly performance trends and insights
                </p>
              </div>
            </div>
            <WeeklySummary filters={filtersRef.current} />
          </div>
        )}

        {["Packing"].includes(activeSection) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Package size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Coming Soon
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                This feature is currently under development and will be available soon.
              </p>
            </div>
          </div>
        )}

        {["Monthly Analysis"].includes(activeSection) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div className="text-center">
                            <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <CalendarDays size={32} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Coming Soon
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Monthly analysis feature is currently under development and will be available soon.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Custom Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Enhanced animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            transform: translate3d(0, -8px, 0);
          }
          70% {
            transform: translate3d(0, -4px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }

        .animate-bounce-gentle {
          animation: bounce 2s infinite;
        }

        /* Grid background */
        .bg-grid-white {
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            );
        }

        /* Custom hover effects */
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }

        .hover\\:rotate-1:hover {
          transform: rotate(1deg);
        }

        .hover\\:rotate-minus-1:hover {
          transform: rotate(-1deg);
        }

        /* Gradient text */
        .text-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .text-gradient-blue {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .text-gradient-green {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .text-gradient-purple {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Enhanced shadows */
        .shadow-glow {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }

        .shadow-glow-green {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }

        .shadow-glow-purple {
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
        }

        .shadow-glow-orange {
          box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
        }

        /* Glassmorphism effects */
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .glass-dark {
          background: rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Tab specific animations */
        .tab-enter {
          animation: slideInLeft 0.3s ease-out;
        }

        .tab-exit {
          animation: slideInRight 0.3s ease-out reverse;
        }

        /* Delay classes */
        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        /* Dark mode specific styles */
        @media (prefers-color-scheme: dark) {
          .bg-grid-white {
            background-image: linear-gradient(
                to right,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
              ),
              linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
              );
          }

          .glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        }

        /* Custom scrollbar for better UX */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6b7280;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        /* Tab indicator animations */
        .tab-indicator {
          position: relative;
          overflow: hidden;
        }

        .tab-indicator::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s;
        }

        .tab-indicator:hover::before {
          left: 100%;
        }

        /* Responsive text sizing */
        @media (max-width: 640px) {
          .text-responsive-sm {
            font-size: 0.75rem;
          }
          .text-responsive-base {
            font-size: 0.875rem;
          }
          .text-responsive-lg {
            font-size: 1rem;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .text-responsive-sm {
            font-size: 0.875rem;
          }
          .text-responsive-base {
            font-size: 1rem;
          }
          .text-responsive-lg {
            font-size: 1.125rem;
          }
        }

        @media (min-width: 1025px) {
          .text-responsive-sm {
            font-size: 1rem;
          }
          .text-responsive-base {
            font-size: 1.125rem;
          }
          .text-responsive-lg {
            font-size: 1.25rem;
          }
        }

        /* Loading states */
        .loading-shimmer {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        .dark .loading-shimmer {
          background: linear-gradient(
            90deg,
            #374151 25%,
            #4b5563 50%,
            #374151 75%
          );
          background-size: 200% 100%;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* Focus states for accessibility */
        .focus-ring:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .dark .focus-ring:focus {
          outline-color: #60a5fa;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .tab-button {
            border: 2px solid currentColor;
          }
          
          .tab-button.active {
            background: currentColor;
            color: white;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveDashboard;


