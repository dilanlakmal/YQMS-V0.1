import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { API_BASE_URL } from "../../../../config";
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  ShoppingBag,
  Activity,
  RefreshCw,
  Download,
  Maximize2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Star,
  Zap,
  Info,
  Filter,
  Calendar
} from "lucide-react";

// Register ChartJS components and plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const OrderChart = ({ filters }) => {
  const [moData, setMoData] = useState({ labels: [], data: [] });
  const [empData, setEmpData] = useState({ labels: [], data: [] });
  const [buyerData, setBuyerData] = useState({ labels: [], data: [] });
  const [buyerTableData, setBuyerTableData] = useState([]);
  const [chartDataReady, setChartDataReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeChart, setActiveChart] = useState("all");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chartStats, setChartStats] = useState({
    totalMOs: 0,
    totalEmployees: 0,
    totalBuyers: 0,
    totalBundleQty: 0
  });

  const chartRefs = useRef({ mo: null, emp: null, buyer: null });

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addListener(checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeListener(checkDarkMode);
    };
  }, []);

  // Chart configurations with enhanced styling
  const chartConfigs = [
    {
      id: "mo",
      title: "Manufacturing Orders Analysis",
      subtitle: "Top 10 MOs by Bundle Quantity",
      icon: Package,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-500",
      data: moData,
      description: "Analysis of manufacturing orders by bundle quantity"
    },
    {
      id: "emp",
      title: "Employee Performance",
      subtitle: "Top 10 Employees by Bundle Quantity",
      icon: Users,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-500",
      data: empData,
      description: "Employee performance based on registered bundles"
    },
    {
      id: "buyer",
      title: "Buyer Distribution",
      subtitle: "Orders by Buyer with Detailed Breakdown",
      icon: ShoppingBag,
      color: "from-purple-500 to-violet-600",
      bgColor: "bg-purple-500",
      data: buyerData,
      description: "Comprehensive buyer analysis with order quantities"
    }
  ];

  // Fetch chart data
  const fetchChartData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-orderdata-summary`,
        {
          params: { ...filters, page: 1, limit: 1000 }
        }
      );

      const tableData = response.data.tableData;

      // MO Chart Data
      const moMap = {};
      tableData.forEach((item) => {
        if (moMap[item.moNo]) {
          moMap[item.moNo] += item.totalRegisteredBundleQty || 0;
        } else {
          moMap[item.moNo] = item.totalRegisteredBundleQty || 0;
        }
      });

      const sortedMo = Object.entries(moMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      setMoData({
        labels: sortedMo.map(([mo]) => mo),
        data: sortedMo.map(([, qty]) => qty)
      });

      // Employee Chart Data
      const empMap = {};
      tableData.forEach((item) => {
        const empId = item.empId || "Unknown";
        if (empMap[empId]) {
          empMap[empId] += item.totalRegisteredBundleQty || 0;
        } else {
          empMap[empId] = item.totalRegisteredBundleQty || 0;
        }
      });

      const sortedEmp = Object.entries(empMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      setEmpData({
        labels: sortedEmp.map(([emp]) => emp),
        data: sortedEmp.map(([, qty]) => qty)
      });

      // Buyer Chart Data and Table
      const buyerBundleMap = {};
      const buyerOrderMap = {};
      const moToBuyerMap = new Map();

      tableData.forEach((item) => {
        if (buyerBundleMap[item.buyer]) {
          buyerBundleMap[item.buyer] += item.totalRegisteredBundleQty || 0;
        } else {
          buyerBundleMap[item.buyer] = item.totalRegisteredBundleQty || 0;
        }

        if (!moToBuyerMap.has(item.moNo)) {
          moToBuyerMap.set(item.moNo, item.buyer);
          if (buyerOrderMap[item.buyer]) {
            buyerOrderMap[item.buyer] += item.orderQty || 0;
          } else {
            buyerOrderMap[item.buyer] = item.orderQty || 0;
          }
        }
      });

      const sortedBuyerBundles = Object.entries(buyerBundleMap).sort(
        ([, a], [, b]) => b - a
      );

      const sortedBuyerOrders = Object.entries(buyerOrderMap).sort(
        ([, a], [, b]) => b - a
      );

      setBuyerData({
        labels: sortedBuyerBundles.map(([buyer]) => buyer),
        data: sortedBuyerBundles.map(([, qty]) => qty)
      });

      setBuyerTableData(sortedBuyerOrders);

      // Calculate stats
      setChartStats({
        totalMOs: Object.keys(moMap).length,
        totalEmployees: Object.keys(empMap).length,
        totalBuyers: Object.keys(buyerBundleMap).length,
        totalBundleQty: Object.values(moMap).reduce((sum, qty) => sum + qty, 0)
      });

      setChartDataReady(true);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [filters]);

  // Enhanced chart options with proper dark mode support
  const getChartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        font: { 
          size: 16, 
          weight: 'bold',
          family: 'Inter, system-ui, sans-serif'
        },
        color: isDarkMode ? '#F9FAFB' : '#111827',
        padding: 20
      },
      datalabels: {
        anchor: "end",
        align: "top",
        color: isDarkMode ? '#F9FAFB' : '#111827',
        font: { 
          weight: "bold", 
          size: 11,
          family: 'Inter, system-ui, sans-serif'
        },
        formatter: (value) => value.toLocaleString(),
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
        borderWidth: 1,
        borderRadius: 6,
        padding: {
          top: 4,
          bottom: 4,
          left: 6,
          right: 6
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#F9FAFB' : '#111827',
        bodyColor: isDarkMode ? '#D1D5DB' : '#374151',
        borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
        borderWidth: 1,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: { 
            size: 12,
            family: 'Inter, system-ui, sans-serif',
            weight: '500'
          },
          color: isDarkMode ? '#E5E7EB' : '#4B5563',
          maxRotation: 45,
          minRotation: 0
        },
        grid: { 
          display: false 
        },
        border: {
          color: isDarkMode ? '#4B5563' : '#D1D5DB',
          width: 1
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: isDarkMode ? '#374151' : '#F3F4F6',
          lineWidth: 1
        },
        border: {
          color: isDarkMode ? '#4B5563' : '#D1D5DB',
          width: 1
        },
        ticks: {
          font: { 
            size: 12,
            family: 'Inter, system-ui, sans-serif',
            weight: '500'
          },
          color: isDarkMode ? '#E5E7EB' : '#4B5563',
          callback: (value) => value.toLocaleString(),
          padding: 8
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    elements: {
      bar: {
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0
        }
      }
    }
  });

  // Enhanced gradient creation
  const createGradient = (ctx, chartArea, colorStart, colorEnd) => {
    if (!chartArea) return colorStart;
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(0.5, colorEnd);
    gradient.addColorStop(1, colorStart);
    return gradient;
  };

  // Chart data with enhanced styling and dark mode support
  const getChartData = (labels, data, chartRef, colors) => ({
    labels,
    datasets: [
      {
        label: "Bundle Quantity",
        data,
        backgroundColor: (context) => {
          const chart = chartRef && chartRef.current;
          if (!chart) return colors.primary;
          const { ctx, chartArea } = chart;
          return createGradient(ctx, chartArea, colors.primary, colors.secondary);
        },
        borderWidth: 0,
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderSkipped: false,
        barThickness: 'flex',
        maxBarThickness: 60,
        hoverBackgroundColor: colors.hover,
        hoverBorderWidth: 2,
        hoverBorderColor: colors.border,
        hoverBorderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0
        }
      }
    ]
  });

  const moChartData = chartDataReady
    ? getChartData(moData.labels, moData.data, chartRefs.current.mo, {
        primary: '#3B82F6',
        secondary: '#1D4ED8',
        hover: '#2563EB',
        border: '#1E40AF'
      })
    : { labels: [], datasets: [] };

  const empChartData = chartDataReady
    ? getChartData(empData.labels, empData.data, chartRefs.current.emp, {
        primary: '#10B981',
        secondary: '#059669',
        hover: '#0D9488',
        border: '#047857'
      })
    : { labels: [], datasets: [] };

  const buyerChartData = chartDataReady
    ? getChartData(buyerData.labels, buyerData.data, chartRefs.current.buyer, {
        primary: '#8B5CF6',
        secondary: '#7C3AED',
        hover: '#7C3AED',
        border: '#6D28D9'
      })
    : { labels: [], datasets: [] };

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Stats */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-gray-800 dark:via-slate-800 dark:to-gray-900 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl">
                <BarChart3 className="w-8 h-8 text-white dark:text-gray-200" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white dark:text-gray-100">
                  Order Analytics Dashboard
                </h1>
                <p className="text-blue-100 dark:text-gray-300 text-sm">
                  Comprehensive visual analysis of order data
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={fetchChartData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total MOs", value: chartStats.totalMOs, icon: Package },
              { label: "Employees", value: chartStats.totalEmployees, icon: Users },
              { label: "Buyers", value: chartStats.totalBuyers, icon: ShoppingBag },
              { label: "Bundle Qty", value: chartStats.totalBundleQty, icon: Activity }
            ].map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-medium">{stat.label}</p>
                    <p className="text-white text-lg font-bold">{stat.value.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Filter Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setActiveChart("all")}
            className={`inline-flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
              activeChart === "all"
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Eye className="w-4 h-4 mr-2" />
            Show All
          </button>
          {chartConfigs.map((config) => (
            <button
              key={config.id}
              onClick={() => setActiveChart(config.id)}
              className={`inline-flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeChart === config.id
                  ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <config.icon className="w-4 h-4 mr-2" />
              {config.title.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Charts */}
      {(activeChart === "all" || activeChart === "mo") && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-xl">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Manufacturing Orders Analysis
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Top 10 MOs by Bundle Quantity
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                  {moData.labels.length} MOs
                </span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading chart data...</p>
                </div>
              </div>
            ) : (
              <div className={`h-96 rounded-2xl p-4 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200'
              }`}>
                <Bar
                  ref={(ref) => (chartRefs.current.mo = ref)}
                  data={moChartData}
                  options={getChartOptions("Top Manufacturing Orders by Bundle Quantity")}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {(activeChart === "all" || activeChart === "emp") && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500 rounded-xl">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Employee Performance Analysis
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Top 10 Employees by Bundle Quantity
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-medium">
                  {empData.labels.length} Employees
                </span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading chart data...</p>
                </div>
              </div>
            ) : (
              <div className={`h-96 rounded-2xl p-4 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200'
              }`}>
                <Bar
                  ref={(ref) => (chartRefs.current.emp = ref)}
                  data={empChartData}
                  options={getChartOptions("Top Employees by Bundle Quantity")}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {(activeChart === "all" || activeChart === "buyer") && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Buyer Distribution Analysis
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Orders by Buyer with Detailed Breakdown
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                  {buyerData.labels.length} Buyers
                </span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading chart data...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Enhanced Table */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-purple-500 to-violet-600 px-4 py-3">
                      <h3 className="text-white font-bold text-sm">Order Quantities by Buyer</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      <table className="min-w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Buyer
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Order Qty
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                          {buyerTableData.map(([buyer, qty], index) => (
                            <tr
                              key={index}
                              className="hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors duration-200"
                            >
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                {buyer}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-bold text-purple-600 dark:text-purple-400">
                                {qty.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Enhanced Chart */}
                <div className="lg:col-span-2">
                  <div className={`h-96 rounded-2xl p-4 ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200'
                  }`}>
                    <Bar
                      ref={(ref) => (chartRefs.current.buyer = ref)}
                      data={buyerChartData}
                      options={getChartOptions("Orders by Buyer (Bundle Quantity)")}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <Info className="w-4 h-4" />
            <span>Charts auto-refresh every 30 seconds</span>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Data</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#374151' : '#f1f5f9'};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#6b7280' : '#cbd5e1'};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#9ca3af' : '#94a3b8'};
        }
      `}</style>
    </div>
  );
};

export default OrderChart;

