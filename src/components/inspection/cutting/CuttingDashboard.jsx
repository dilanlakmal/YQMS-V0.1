import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../../../config";
import { useTheme } from "../../context/ThemeContext";
import CuttingDashboardCuttingDefectIssues from "./CuttingDashbaordCuttingDefectIssues";
import CuttingDashboardMeasurementIssuesStyleCard from "./CuttingDashbaordMeasurementIssuesStyleCard";
import CuttingDashboardCard from "./CuttingDashboardCard";
import CuttingDashboardFilter from "./CuttingDashboardFilter";
import CuttingDashboardGarmentTypeChart from "./CuttingDashboardGarmentTypeChart";
import CuttingDashboardMeasurementIssues from "./CuttingDashboardMeasurementIssues";
import CuttingDashboardSpreadTableOverallIssues from "./CuttingDashboardSpreadTableOverallIssues";
import CuttingDashboardSpreadTableStyleCard from "./CuttingDashboardSpreadTableStyleCard";
import CuttingDashboardTrendAnalysis from "./CuttingDashboardTrendAnalysis";
import CuttingDashboardFabricIssues from "./CutttingDashboardFabricIssues";
import HorizontalBarChart from "./HorizontalBarChart";
import TrendLineChart from "./TrendLineChart";

import {
  Beaker,
  Bug,
  CheckCircle,
  ClipboardList,
  FileCheck,
  FileText,
  FlaskConical,
  Grid,
  Layers,
  LayoutDashboard,
  Package,
  Percent,
  Scan,
  Scissors,
  ScissorsIcon,
  Table,
  TrendingUp,
  View,
  XCircle,
  ArrowLeft,
  Activity,
  RefreshCw,
  Settings,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { useAuth } from "../../authentication/AuthContext";

const formatDateForApi = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Enhanced Navigation Button Component
const NavButton = ({ icon, label, isActive, onClick, theme, description }) => {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center p-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 min-h-[120px] w-full ${
        isActive
          ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-500/25"
          : theme === "dark"
          ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
          : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
      }`}
    >
      <div className={`p-3 rounded-lg mb-2 ${
        isActive 
          ? "bg-white/20" 
          : theme === "dark" 
          ? "bg-gray-700 group-hover:bg-gray-600" 
          : "bg-gray-100 group-hover:bg-gray-200"
      }`}>
        {React.cloneElement(icon, { 
          size: 24, 
          className: isActive ? "text-white" : theme === "dark" ? "text-gray-300" : "text-gray-600"
        })}
      </div>
      <span className="text-sm font-semibold text-center leading-tight px-2">
        {label}
      </span>
      {description && (
        <span className="text-xs opacity-75 text-center mt-1 px-2">
          {description}
        </span>
      )}
      {isActive && (
        <div className="absolute inset-0 rounded-xl border-2 border-blue-300 pointer-events-none"></div>
      )}
    </button>
  );
};

// Loading Component
const LoadingSpinner = ({ theme }) => (
  <div className={`flex flex-col items-center justify-center h-64 ${
    theme === "dark" ? "text-gray-300" : "text-gray-600"
  }`}>
    <RefreshCw className="w-8 h-8 animate-spin mb-4" />
    <p className="text-lg font-medium">Loading dashboard data...</p>
    <p className="text-sm opacity-75">Please wait while we fetch the latest information</p>
  </div>
);

const CuttingDashboard = ({ onBackToCuttingLive }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [activeView, setActiveView] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    buyer: "",
    moNo: "",
    tableNo: "",
    garmentType: "",
    qcId: "",
    color: ""
  });
  const [topN, setTopN] = useState(5);
  const [sortOrder, setSortOrder] = useState("top");

  // Navigation items configuration
  const navigationItems = [
    {
      id: "overview",
      icon: <LayoutDashboard />,
      label: "Overview",
      description: "Main dashboard"
    },
    {
      id: "style_ie_table",
      icon: <Table />,
      label: "Style & IE Table",
      description: "Measurement failures"
    },
    {
      id: "style_spread_table",
      icon: <Grid />,
      label: "Style & Spread",
      description: "Spread table analysis"
    },
    {
      id: "spread_table_overall",
      icon: <View />,
      label: "Spread Table",
      description: "Overall analysis"
    },
    {
      id: "fabric_defects",
      icon: <Bug />,
      label: "Fabric Defects",
      description: "Defect analysis"
    },
    {
      id: "cutting_defects",
      icon: <ScissorsIcon />,
      label: "Cutting Defects",
      description: "Cutting issues"
    },
    {
      id: "trend_analysis",
      icon: <TrendingUp />,
      label: "Trend Analysis",
      description: "Historical trends"
    }
  ];

  const fetchDashboardData = useCallback(
    async (currentFilters, currentTopN, currentSortOrder) => {
      setLoading(true);
      try {
        const params = {
          ...currentFilters,
          startDate: formatDateForApi(currentFilters.startDate),
          endDate: formatDateForApi(currentFilters.endDate),
          topN: currentTopN,
          sortOrder: currentSortOrder
        };

        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-dashboard-data`,
          { params }
        );
        setData(response.data);
      } catch (error) {
        console.error("Error fetching cutting dashboard data:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 6);

    const initialFilters = {
      ...filters,
      startDate: lastWeek,
      endDate: today
    };

    setFilters(initialFilters);
    fetchDashboardData(initialFilters, topN, sortOrder);
  }, []);

  const handleApplyFilters = (newFilters) => {
    fetchDashboardData(newFilters, topN, sortOrder);
  };

  const handleTopNChange = (e) => {
    const newTopN = parseInt(e.target.value, 10);
    setTopN(newTopN);
    fetchDashboardData(filters, newTopN, sortOrder);
  };

  const handleSortOrderChange = (newOrder) => {
    setSortOrder(newOrder);
    fetchDashboardData(filters, topN, newOrder);
  };

  const kpis = data?.kpis;
  const charts = data?.charts;

  const sortedStyleData = useMemo(() => {
    if (!charts?.measurementIssuesByMo) return [];
    return [...charts.measurementIssuesByMo].sort(
      (a, b) => b.defectRate - a.defectRate
    );
  }, [charts?.measurementIssuesByMo]);

  const sortedSpreadTableData = useMemo(() => {
    if (!charts?.measurementIssuesBySpreadTable) return [];
    return [...charts.measurementIssuesBySpreadTable].sort(
      (a, b) => b.defectRate - a.defectRate
    );
  }, [charts?.measurementIssuesBySpreadTable]);

  const sortedSpreadTableOverallData = useMemo(() => {
    if (!charts?.measurementIssuesBySpreadTableOverall) return [];
    return [...charts.measurementIssuesBySpreadTableOverall].sort(
      (a, b) => b.defectRate - a.defectRate
    );
  }, [charts?.measurementIssuesBySpreadTableOverall]);

  const bundleDataKpis = kpis
    ? [
        {
          title: "Total Inspected Reports",
          value: kpis.totalInspectedReports,
          icon: <FileText size={24} />,
          colorRule: "default"
        },
        {
          title: "Total Bundle Qty",
          value: kpis.totalBundleQty,
          icon: <Package size={24} />,
          colorRule: "default"
        },
        {
          title: "Bundle Qty Check",
          value: kpis.bundleQtyCheck,
          icon: <FileCheck size={24} />,
          colorRule: "default"
        },
        {
          title: "Total Inspected Sizes",
          value: kpis.totalInspectedSizes,
          icon: <Layers size={24} />,
          colorRule: "default"
        }
      ]
    : [];

  const inspectionDataKpis = kpis
    ? [
        {
          title: "Total Inspection Qty",
          value: kpis.totalInspectionQty,
          icon: <ClipboardList size={24} />,
          colorRule: "default"
        },
        {
          title: "Total Pcs",
          value: kpis.totalPcs,
          icon: <Scan size={24} />,
          colorRule: "default"
        },
        {
          title: "Total Pass",
          value: kpis.totalPass,
          icon: <CheckCircle size={24} />,
          colorRule: "pass"
        },
        {
          title: "AQL Results",
          value: "N/A",
          icon: <FlaskConical size={24} />,
          colorRule: "default"
        }
      ]
    : [];

  const resultsKpis = kpis
    ? [
        {
          title: "Total Reject",
          value: kpis.totalReject,
          icon: <XCircle size={24} />,
          colorRule: "reject"
        },
        {
          title: "Reject Measurements",
          value: kpis.rejectMeasurements,
          icon: <Beaker size={24} />,
          colorRule: "reject"
        },
        {
          title: "Reject Defects",
          value: kpis.rejectDefects,
          icon: <Scissors size={24} />,
          colorRule: "reject"
        },
        {
          title: "Pass Rate",
          value: kpis.passRate,
          unit: "%",
          icon: <Percent size={24} />,
          colorRule: "passRate"
        }
      ]
    : [];

  const currentNavItem = navigationItems.find(item => item.id === activeView);

  if (loading && !data) {
    return (
      <div className={`min-h-screen ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className="container mx-auto px-6 py-8">
          <LoadingSpinner theme={theme} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "dark" ? "bg-gray-900" : "bg-gray-50"
    }`}>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {onBackToCuttingLive && (
              <button
                onClick={onBackToCuttingLive}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-md transition-all duration-200 group ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="font-medium">Back to Cutting Home</span>
              </button>
            )}
            
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"
              }`}>
                <BarChart3 className={`w-8 h-8 ${
                  theme === "dark" ? "text-blue-400" : "text-blue-600"
                }`} />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Cutting Dashboard
                </h1>
                <p className={`${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  Comprehensive cutting inspection analytics - Version 1.0
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className={`mb-8 p-6 rounded-xl shadow-lg ${
          theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <Settings className={`w-5 h-5 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`} />
            <h3 className={`font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Dashboard Views
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {navigationItems.map((item) => (
              <NavButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                description={item.description}
                isActive={activeView === item.id}
                onClick={() => setActiveView(item.id)}
                theme={theme}
              />
            ))}
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && data && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-xl shadow-xl ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span className={`text-lg font-medium ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Updating dashboard...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="space-y-8">
          {activeView === "overview" && (
            <>
              <CuttingDashboardFilter
                filters={filters}
                setFilters={setFilters}
                onApply={handleApplyFilters}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <CuttingDashboardCard title="Bundle Data" stats={bundleDataKpis} />
                <CuttingDashboardCard title="Inspection Data" stats={inspectionDataKpis} />
                <CuttingDashboardCard title="Results Section" stats={resultsKpis} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="lg:col-span-1 xl:col-span-1">
                  <HorizontalBarChart
                    data={charts?.passRateByMo || []}
                    title="Pass Rate by MO No"
                    onTopNChange={handleTopNChange}
                    topN={topN}
                    sortOrder={sortOrder}
                    onSortOrderChange={handleSortOrderChange}
                  />
                </div>
                <div className="lg:col-span-1 xl:col-span-1">
                  <CuttingDashboardGarmentTypeChart
                    data={charts?.passRateByGarmentType || []}
                    title="Pass Rate by Garment Type"
                  />
                </div>
                <div className="lg:col-span-2 xl:col-span-1">
                  <TrendLineChart
                    data={charts?.passRateByDate || []}
                    title="Pass Rate by Date"
                  />
                </div>
              </div>

              <CuttingDashboardMeasurementIssues
                data={charts?.measurementIssues || []}
                title="Measurement Point Failure Analysis by Garment Type (Total)"
              />
            </>
          )}

          {activeView === "style_ie_table" && (
            <>
              <CuttingDashboardFilter
                filters={filters}
                setFilters={setFilters}
                onApply={handleApplyFilters}
              />
              <CuttingDashboardMeasurementIssuesStyleCard
                data={sortedStyleData}
                title="Measurement Point Failure by MO and Table"
              />
            </>
          )}

          {activeView === "style_spread_table" && (
            <>
              <CuttingDashboardFilter
                filters={filters}
                setFilters={setFilters}
                onApply={handleApplyFilters}
              />
              <CuttingDashboardSpreadTableStyleCard
                data={sortedSpreadTableData}
                title="Measurement Point Failure by MO and Spread Table"
              />
            </>
          )}

          {activeView === "spread_table_overall" && (
            <>
              <CuttingDashboardFilter
                filters={filters}
                setFilters={setFilters}
                onApply={handleApplyFilters}
              />
              <CuttingDashboardSpreadTableOverallIssues
                data={sortedSpreadTableOverallData}
                title="Measurement Point Failure by Spread Table"
              />
            </>
          )}

          {activeView === "fabric_defects" && (
            <>
              <CuttingDashboardFilter
                filters={filters}
                setFilters={setFilters}
                onApply={handleApplyFilters}
              />
              <CuttingDashboardFabricIssues
                data={charts?.fabricDefectAnalysis || []}
                totalInspectionQty={kpis?.totalInspectionQty || 0}
                inspectionQtyByMo={charts?.inspectionQtyByMo || []}
                title="Fabric Defect Analysis"
              />
            </>
          )}

          {activeView === "cutting_defects" && (
            <>
              <CuttingDashboardFilter
                filters={filters}
                setFilters={setFilters}
                onApply={handleApplyFilters}
              />
              <CuttingDashboardCuttingDefectIssues
                data={charts?.cuttingDefectAnalysis}
                title="Cutting Defect Analysis"
              />
            </>
          )}

          {activeView === "trend_analysis" && (
            <>
              <CuttingDashboardFilter
                filters={filters}
                setFilters={setFilters}
                onApply={handleApplyFilters}
              />
              <CuttingDashboardTrendAnalysis
                measurementData={charts?.trendAnalysisData || []}
                fabricData={charts?.fabricDefectTrendData || []}
                cuttingData={charts?.cuttingDefectTrendData || []}
                inspectionQtyByDate={charts?.inspectionQtyByDate || []}
                title="Overall Trend Analysis"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CuttingDashboard;
