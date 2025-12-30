import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import FilterPane from "../liveDashboard/FilterPane";
import OrderChart from "./OrderChart";
import {
  Table,
  BarChart2,
  Package,
  Shirt,
  Palette,
  Ruler,
  ShoppingBag,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Search,
  Filter,
  Calendar,
  Users,
  Star,
  Zap,
  ArrowUp,
  ArrowDown,
  Info
} from "lucide-react";

const OrderData = () => {
  const [summary, setSummary] = useState({
    totalRegisteredBundleQty: 0,
    totalGarmentsQty: 0,
    totalMO: 0,
    totalColors: 0,
    totalSizes: 0,
    totalOrderQty: 0
  });

  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;
  const [activeTab, setActiveTab] = useState("Summary");
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Filter states
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

  const filtersRef = useRef({});

  // Enhanced summary cards data
  const summaryCards = [
    {
      title: "Total Bundle Qty",
      value: summary.totalRegisteredBundleQty || 0,
      icon: Package,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-500",
      textColor: "text-emerald-600",
      change: "+12.5%",
      changeType: "increase"
    },
    {
      title: "Total Order Qty",
      value: summary.totalOrderQty || 0,
      icon: ShoppingBag,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-500",
      textColor: "text-blue-600",
      change: "+8.3%",
      changeType: "increase"
    },
    {
      title: "Total Garments",
      value: summary.totalGarmentsQty || 0,
      icon: Shirt,
      color: "from-purple-500 to-violet-600",
      bgColor: "bg-purple-500",
      textColor: "text-purple-600",
      change: "+15.2%",
      changeType: "increase"
    },
    {
      title: "Unique MOs",
      value: summary.totalMO || 0,
      icon: Activity,
      color: "from-orange-500 to-red-600",
      bgColor: "bg-orange-500",
      textColor: "text-orange-600",
      change: "+5.7%",
      changeType: "increase"
    },
    {
      title: "Unique Colors",
      value: summary.totalColors || 0,
      icon: Palette,
      color: "from-pink-500 to-rose-600",
      bgColor: "bg-pink-500",
      textColor: "text-pink-600",
      change: "+3.1%",
      changeType: "increase"
    },
    {
      title: "Unique Sizes",
      value: summary.totalSizes || 0,
      icon: Ruler,
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-500",
      textColor: "text-cyan-600",
      change: "+2.8%",
      changeType: "increase"
    }
  ];

  // Enhanced tabs configuration
  const tabs = [
    {
      id: "Summary",
      label: "Data Summary",
      icon: Table,
      description: "Detailed table view",
      color: "blue"
    },
    {
      id: "Chart",
      label: "Visual Analytics",
      icon: BarChart2,
      description: "Chart visualization",
      color: "green"
    }
  ];

  // Format Date to "MM/DD/YYYY"
  const formatDate = (date) => {
    if (!date) return "";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Fetch order data
  const fetchOrderData = async (filters = {}, currentPage = page) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-orderdata-summary`,
        {
          params: { ...filters, page: currentPage, limit }
        }
      );
      setSummary(response.data.summary);
      setTableData(response.data.tableData);
      setTotalRecords(response.data.total);
    } catch (error) {
      console.error("Error fetching order data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply Filters
  const handleApplyFilters = async () => {
    const filters = {};
    if (moNo) filters.moNo = moNo;
    if (color) filters.color = color;
    if (size) filters.size = size;
    if (department) filters.department = department;
    if (empId) filters.empId = empId;
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
    setPage(1);
    await fetchOrderData(filters, 1);
  };

  // Reset Filters
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
    filtersRef.current = {};
    setPage(1);
    await fetchOrderData({}, 1);
  };

  // Handle Pagination
  const handlePageChange = async (newPage) => {
    setPage(newPage);
    await fetchOrderData(filtersRef.current, newPage);
  };

  // Handle sorting
  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    
    const sortedData = [...tableData].sort((a, b) => {
      if (direction === 'asc') {
        return a[field] > b[field] ? 1 : -1;
      } else {
        return a[field] < b[field] ? 1 : -1;
      }
    });
    setTableData(sortedData);
  };

  // Initial Fetch and Auto-Refresh
  useEffect(() => {
    fetchOrderData();
    const intervalId = setInterval(async () => {
      await fetchOrderData(filtersRef.current);
    }, 30000); // Increased to 30 seconds for better UX

    return () => clearInterval(intervalId);
  }, []);

  // Update filtersRef
  useEffect(() => {
    filtersRef.current = {
      moNo,
      color,
      size,
      department,
      empId,
      startDate: startDate ? formatDate(startDate) : null,
      endDate: endDate ? formatDate(endDate) : null,
      buyer,
      lineNo
    };
  }, [moNo, color, size, department, empId, startDate, endDate, buyer, lineNo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Enhanced Header */}
        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-gray-800 dark:via-slate-800 dark:to-gray-900 px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl">
                  <Package className="w-8 h-8 text-white dark:text-gray-200" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white dark:text-gray-100">
                    Order Data Management
                  </h1>
                  <p className="text-blue-100 dark:text-gray-300 text-sm">
                    Comprehensive order tracking and analytics
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fetchOrderData(filtersRef.current)}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/30"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">Live Data</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Pane */}
          <div className="p-6">
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
              dataSource="qc2_orderdata"
            />
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 p-2 rounded-2xl shadow-inner">
              <div className="flex space-x-2">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group relative flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex-1 shadow-lg hover:shadow-xl ${
                        isActive
                          ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-${tab.color}-500/30`
                          : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-white/20 backdrop-blur-sm' 
                          : `bg-${tab.color}-100 dark:bg-${tab.color}-900/30 group-hover:bg-${tab.color}-200 dark:group-hover:bg-${tab.color}-800/50`
                      }`}>
                        <tab.icon className={`w-5 h-5 transition-colors duration-300 ${
                          isActive ? 'text-white' : `text-${tab.color}-600 dark:text-${tab.color}-400`
                        }`} />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className={`font-bold text-sm transition-colors duration-300 ${
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

                      {isActive && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-300 fill-current" />
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "Summary" && (
          <div className="space-y-6">
            {/* Enhanced Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {summaryCards.map((card, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold ${
                        card.changeType === 'increase' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {card.changeType === 'increase' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        <span>{card.change}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        {card.title}
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {card.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`h-1 bg-gradient-to-r ${card.color}`}></div>
                </div>
              ))}
            </div>

            {/* Enhanced Table */}
            <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Table className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Order Details
                    </h2>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                      {totalRecords.toLocaleString()} records
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {loading && (
                      <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden">
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-10">
                      <tr>
                        {[
                          { key: 'lineNo', label: 'Line No', width: 'w-20' },
                          { key: 'moNo', label: 'MO No', width: 'w-24' },
                          { key: 'custStyle', label: 'Customer Style', width: 'w-40' },
                          { key: 'country', label: 'Country', width: 'w-24' },
                          { key: 'buyer', label: 'Buyer', width: 'w-28' },
                          { key: 'color', label: 'Color', width: 'w-24' },
                          { key: 'size', label: 'Size', width: 'w-20' },
                          { key: 'totalRegisteredBundleQty', label: 'Bundle Qty', width: 'w-28' },
                          { key: 'totalGarments', label: 'Garments', width: 'w-24' }
                        ].map((column) => (
                          <th
                            key={column.key}
                            className={`px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors duration-200 ${column.width}`}
                            onClick={() => handleSort(column.key)}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{column.label}</span>
                              {sortField === column.key && (
                                sortDirection === 'asc' ? 
                                <ArrowUp className="w-3 h-3" /> : 
                                <ArrowDown className="w-3 h-3" />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {tableData.map((row, index) => (
                        <tr
                          key={index}
                          className={`transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-800 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {row.lineNo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                              {row.moNo}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {row.custStyle}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {row.country}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {row.buyer}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                              {row.color}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              {row.size}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                            {row.totalRegisteredBundleQty.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                            {row.totalGarments.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Enhanced Pagination */}
              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <Info className="w-4 h-4" />
                    <span>
                      Showing <strong>{((page - 1) * limit) + 1}</strong> to{" "}
                      <strong>{Math.min(page * limit, totalRecords)}</strong> of{" "}
                      <strong>{totalRecords.toLocaleString()}</strong> results
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, Math.ceil(totalRecords / limit)) }, (_, i) => {
                        let pageNum;
                        const totalPages = Math.ceil(totalRecords / limit);
                        
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              page === pageNum
                                ? "bg-blue-500 text-white shadow-lg"
                                : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= Math.ceil(totalRecords / limit)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Chart" && (
          <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <BarChart2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Visual Analytics
                </h2>
              </div>
            </div>
            <div className="p-6">
              <OrderChart filters={filtersRef.current} />
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
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
      `}</style>
    </div>
  );
};

export default OrderData;

