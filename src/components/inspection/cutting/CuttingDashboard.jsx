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
  FlaskConical, // Icon for IE Table
  Grid,
  Layers,
  LayoutDashboard,
  Package,
  Percent,
  Scan,
  Scissors,
  ScissorsIcon, // Icon for Overview
  Table,
  TrendingUp,
  View,
  XCircle,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "../../authentication/AuthContext";

const formatDateForApi = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// --- NEW: Navigation Button Component ---
const NavButton = ({ icon, label, isActive, onClick, theme }) => {
  const activeClasses =
    theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-600 text-white";
  const inactiveClasses =
    theme === "dark"
      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
      : "bg-white text-gray-600 hover:bg-gray-100";

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center text-center p-3 rounded-lg shadow-md transition-all duration-200 w-32 h-24 ${
        isActive ? activeClasses : inactiveClasses
      }`}
    >
      {icon}
      <span className="text-xs font-semibold mt-2 leading-tight max-w-full">
        {label}
      </span>
    </button>
  );
};

const CuttingDashboard = ({ onBackToCuttingLive }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  // --- NEW: State to manage the active view ---
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

  // --- NEW: Memoized sorting for the overall spread table data ---
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

  if (loading && !data) {
    return (
      <div
        className={`flex justify-center items-center h-screen ${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100"
        }`}
      >
        Loading dashboard...
      </div>
    );
  }

  return (
    <div
      className={`p-6 min-h-screen relative ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      {onBackToCuttingLive && (
        <div className="mb-4">
          <button
            onClick={onBackToCuttingLive}
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Cutting Home
          </button>
        </div>
      )}
      {loading && (
        <div className="absolute top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-white text-xl animate-pulse">Updating...</div>
        </div>
      )}

      <p
        className={`mb-4 text-md ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        Cutting Inspection Dashboard - Version 1.0
      </p>

      {/* --- NEW: Navigation Section --- */}
      <div className="flex items-center gap-4 mb-6">
        <NavButton
          icon={<LayoutDashboard size={32} />}
          label="Overview"
          isActive={activeView === "overview"}
          onClick={() => setActiveView("overview")}
          theme={theme}
        />
        <NavButton
          icon={<Table size={32} />}
          label="Measurement Failure - By Style & IE Table"
          isActive={activeView === "style_ie_table"}
          onClick={() => setActiveView("style_ie_table")}
          theme={theme}
        />
        <NavButton
          icon={<Grid size={32} />}
          label="Measurement Failure - By Style & Spread Table"
          isActive={activeView === "style_spread_table"}
          onClick={() => setActiveView("style_spread_table")}
          theme={theme}
        />
        <NavButton
          icon={<View size={32} />}
          label="Measurement Failure by Spread Table"
          isActive={activeView === "spread_table_overall"}
          onClick={() => setActiveView("spread_table_overall")}
          theme={theme}
        />
        <NavButton
          icon={<Bug size={32} />}
          label="Fabric Defect Analysis"
          isActive={activeView === "fabric_defects"}
          onClick={() => setActiveView("fabric_defects")}
          theme={theme}
        />
        <NavButton
          icon={<ScissorsIcon size={32} />}
          label="Cutting Defect Analysis"
          isActive={activeView === "cutting_defects"}
          onClick={() => setActiveView("cutting_defects")}
          theme={theme}
        />
        <NavButton
          icon={<TrendingUp size={32} />}
          label="Overall Trend Analysis"
          isActive={activeView === "trend_analysis"}
          onClick={() => setActiveView("trend_analysis")}
          theme={theme}
        />
      </div>

      {/* --- NEW: Conditional Rendering based on activeView --- */}

      {activeView === "overview" && (
        <>
          <CuttingDashboardFilter
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <CuttingDashboardCard title="Bundle Data" stats={bundleDataKpis} />
            <CuttingDashboardCard
              title="Inspection Data"
              stats={inspectionDataKpis}
            />
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
          <div className="mt-6">
            <CuttingDashboardMeasurementIssues
              data={charts?.measurementIssues || []}
              title="Measurement Point Failure Analysis by Garment Type (Total)"
            />
          </div>
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
          {/* --- MODIFIED: Pass all three data props to the component --- */}
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
  );
};

export default CuttingDashboard;
