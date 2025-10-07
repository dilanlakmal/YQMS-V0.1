// src/components/inspection/cutting/CuttingDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE_URL } from "../../../../config";
import CuttingDashboardCard from "./CuttingDashboardCard";
import HorizontalBarChart from "./HorizontalBarChart";
import TrendLineChart from "./TrendLineChart";
import CuttingDashboardGarmentTypeChart from "./CuttingDashboardGarmentTypeChart";
import CuttingDashboardFilter from "./CuttingDashboardFilter";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Beaker,
  Scissors,
  Package,
  Percent,
  FileCheck,
  Scan,
  Layers,
  FileText, // New Icon for reports
  FlaskConical, // New Icon for AQL
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

const CuttingDashboard = ({ onBackToCuttingLive }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
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

  // --- NEW: Define KPI groups for the three main cards ---

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
          value: "N/A", // As requested, this is a placeholder
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
        className={`mb-6 text-md ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        Cutting Inspection Dashboard - Version 1.0
      </p>

      <CuttingDashboardFilter
        filters={filters}
        setFilters={setFilters}
        onApply={handleApplyFilters}
      />

      {/* --- NEW: KPI Cards layout with 3 main sections --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <CuttingDashboardCard title="Bundle Data" stats={bundleDataKpis} />
        <CuttingDashboardCard
          title="Inspection Data"
          stats={inspectionDataKpis}
        />
        <CuttingDashboardCard title="Results Section" stats={resultsKpis} />
      </div>

      {/* Charts section remains the same, matching the 3-column layout */}
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
    </div>
  );
};

export default CuttingDashboard;
