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
  Layers
} from "lucide-react";
import { useAuth } from "../../authentication/AuthContext";

// *** THE FIX: A timezone-safe date formatting helper function ***
const formatDateForApi = (date) => {
  if (!date) return ""; // Return empty string if date is null or undefined
  const year = date.getFullYear();
  // getMonth() is 0-indexed, so add 1. Pad with '0' to ensure two digits.
  const month = String(date.getMonth() + 1).padStart(2, "0");
  // Pad day with '0' to ensure two digits.
  const day = String(date.getDate()).padStart(2, "0");
  // Return the robust YYYY-MM-DD format
  return `${year}-${month}-${day}`;
};

const CuttingDashboard = () => {
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
  const [topN, setTopN] = useState(5); // Add state for Top N selection
  const [sortOrder, setSortOrder] = useState("top"); // NEW: State for sort order

  const fetchDashboardData = useCallback(
    async (currentFilters, currentTopN, currentSortOrder) => {
      setLoading(true);
      try {
        // *** THE FIX: Use the new helper function here ***
        const params = {
          ...currentFilters,
          startDate: formatDateForApi(currentFilters.startDate),
          endDate: formatDateForApi(currentFilters.endDate),
          topN: currentTopN, // Pass topN to the API
          sortOrder: currentSortOrder // NEW: Pass sortOrder to the API
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

  // Initial data load
  useEffect(() => {
    // Set default date range for the last 7 days for better user experience
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 6); // 7 days including today

    const initialFilters = {
      ...filters,
      startDate: lastWeek,
      endDate: today
    };
    setFilters(initialFilters);
    fetchDashboardData(initialFilters, topN, sortOrder); // Fetch data with initial filters and Top N
  }, []); // Runs only once on component mount

  const handleApplyFilters = (newFilters) => {
    fetchDashboardData(newFilters, topN, sortOrder);
  };

  // New handler for when the Top N dropdown changes
  const handleTopNChange = (e) => {
    const newTopN = parseInt(e.target.value, 10);
    setTopN(newTopN);
    fetchDashboardData(filters, newTopN, sortOrder); // Re-fetch data with the new Top N value
  };

  // NEW: Handler for changing between Top and Bottom N
  const handleSortOrderChange = (newOrder) => {
    setSortOrder(newOrder);
    fetchDashboardData(filters, topN, newOrder);
  };

  const kpis = data?.kpis;
  const charts = data?.charts;

  const kpiConfig = [
    {
      title: "Total Inspection Qty",
      value: kpis?.totalInspectionQty,
      icon: <ClipboardList size={24} />,
      colorRule: "default"
    },
    {
      title: "Total Pcs",
      value: kpis?.totalPcs,
      icon: <Scan size={24} />,
      colorRule: "default"
    },
    {
      title: "Total Pass",
      value: kpis?.totalPass,
      icon: <CheckCircle size={24} />,
      colorRule: "pass"
    },
    {
      title: "Total Reject",
      value: kpis?.totalReject,
      icon: <XCircle size={24} />,
      colorRule: "reject"
    },
    {
      title: "Reject Measurements",
      value: kpis?.rejectMeasurements,
      icon: <Beaker size={24} />,
      colorRule: "reject"
    },
    {
      title: "Reject Defects",
      value: kpis?.rejectDefects,
      icon: <Scissors size={24} />,
      colorRule: "reject"
    },
    {
      title: "Pass Rate",
      value: kpis?.passRate,
      unit: "%",
      icon: <Percent size={24} />,
      colorRule: "passRate"
    },
    {
      title: "Total Bundle Qty",
      value: kpis?.totalBundleQty,
      icon: <Package size={24} />,
      colorRule: "default"
    },
    {
      title: "Bundle Qty Check",
      value: kpis?.bundleQtyCheck,
      icon: <FileCheck size={24} />,
      colorRule: "default"
    },
    {
      title: "Total Inspected Sizes",
      value: kpis?.totalInspectedSizes,
      icon: <Layers size={24} />,
      colorRule: "default"
    }
  ];

  if (loading && !data) {
    // Show loading overlay only on initial load
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
      {/* Loading indicator for subsequent fetches */}
      {loading && (
        <div className="absolute top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-white text-xl animate-pulse">Updating...</div>
        </div>
      )}

      {/* <h1
        className={`text-3xl font-bold mb-2 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        Cutting Inspection Dashboard
      </h1> */}
      <p
        className={`mb-6 text-md ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        Version 1.0
      </p>

      <CuttingDashboardFilter
        filters={filters}
        setFilters={setFilters}
        onApply={handleApplyFilters}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-10 gap-6 mb-8">
        {kpiConfig.map((kpi) => (
          <CuttingDashboardCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Charts */}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="lg:col-span-1 xl:col-span-1">
          {/* NEW HORIZONTAL BAR CHART */}
          <HorizontalBarChart
            data={charts?.passRateByMo || []}
            title="Pass Rate by MO No"
            onTopNChange={handleTopNChange}
            topN={topN}
            sortOrder={sortOrder} // NEW: Pass state down
            onSortOrderChange={handleSortOrderChange} // NEW: Pass handler down
          />
        </div>

        {/* NEW GARMENT TYPE CHART */}
        <div className="lg:col-span-1 xl:col-span-1">
          <CuttingDashboardGarmentTypeChart
            data={charts?.passRateByGarmentType || []}
            title="Pass Rate by Garment Type"
          />
        </div>

        {/* <div className="lg:col-span-1 xl:col-span-1">
          <CuttingDashboardChart
            data={charts?.passRateByGarmentType || []}
            dataKey="passRate"
            nameKey="name"
            title="Pass Rate by Garment Type"
          />
        </div> */}
        {/* NEW TREND LINE CHART */}
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
