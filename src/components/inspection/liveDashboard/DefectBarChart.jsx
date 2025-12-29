import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { 
  BarChart, 
  Table as TableIcon, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  Search,
  Eye,
  Grid,
  List,
  RefreshCw,
  Info,
  ArrowUpDown,
  ChevronDown
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const DefectBarChart = ({ defectRates }) => {
  const [viewMode, setViewMode] = useState("chart");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rank");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Enhanced filtering with status filter
  const filteredData = defectRates
    .filter(item => {
      const matchesSearch = item.defectName.toLowerCase().includes(searchTerm.toLowerCase());
      const rate = item.defectRate * 100;
      let matchesStatus = true;
      
      if (selectedStatus === "critical") matchesStatus = rate > 5;
      else if (selectedStatus === "warning") matchesStatus = rate >= 1 && rate <= 5;
      else if (selectedStatus === "good") matchesStatus = rate < 1;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = sortBy === 'defectRate' ? a.defectRate : 
                    sortBy === 'totalCount' ? a.totalCount : a.rank;
      const bValue = sortBy === 'defectRate' ? b.defectRate : 
                    sortBy === 'totalCount' ? b.totalCount : b.rank;
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const maxDefectRateValue = defectRates.length > 0
    ? Math.max(...defectRates.map((item) => item.defectRate * 100)) + 2
    : 10;

  // Calculate statistics
  const stats = {
    total: defectRates.length,
    critical: defectRates.filter(item => item.defectRate * 100 > 5).length,
    warning: defectRates.filter(item => {
      const rate = item.defectRate * 100;
      return rate >= 1 && rate <= 5;
    }).length,
    good: defectRates.filter(item => item.defectRate * 100 < 1).length,
    avgRate: defectRates.length > 0 
      ? (defectRates.reduce((sum, item) => sum + item.defectRate, 0) / defectRates.length * 100).toFixed(2)
      : 0
  };

  // Enhanced chart options with better dark mode support
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    scales: {
      x: {
        ticks: { 
          color: document.documentElement.classList.contains('dark') ? "#E5E7EB" : "#4B5563", 
          autoSkip: false,
          maxRotation: 45,
          font: { size: 12 }
        },
        grid: { display: false },
        border: { 
          color: document.documentElement.classList.contains('dark') ? "#6B7280" : "#D1D5DB" 
        }
      },
      y: {
        max: maxDefectRateValue,
        grid: { 
          color: document.documentElement.classList.contains('dark') ? "#4B5563" : "#E5E7EB",
          drawBorder: false
        },
        ticks: { 
          color: document.documentElement.classList.contains('dark') ? "#E5E7EB" : "#4B5563",
          font: { size: 12 },
          callback: function(value) {
            return value + '%';
          }
        },
        beginAtZero: true,
        border: { display: false }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? "rgba(17, 24, 39, 0.95)" : "rgba(255, 255, 255, 0.95)",
        titleColor: document.documentElement.classList.contains('dark') ? "#F9FAFB" : "#111827",
        bodyColor: document.documentElement.classList.contains('dark') ? "#F9FAFB" : "#111827",
        borderColor: document.documentElement.classList.contains('dark') ? "#4B5563" : "#D1D5DB",
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => [
            `Defect Rate: ${context.parsed.y}%`,
            `Total Count: ${defectRates.find(item => item.defectName === context.label)?.totalCount || 0}`,
            `Rank: #${defectRates.find(item => item.defectName === context.label)?.rank || 0}`
          ]
        }
      },
      datalabels: { 
        display: "auto",
        color: document.documentElement.classList.contains('dark') ? "#F3F4F6" : "#1F2937",
        font: { weight: "bold", size: 10 },
        formatter: (value) => `${value}%`
      }
    }
  };

  const chartData = {
    labels: filteredData.map((item) => item.defectName),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: filteredData.map((item) => (item.defectRate * 100).toFixed(2)),
        backgroundColor: filteredData.map((item) => {
          const rate = item.defectRate * 100;
          if (rate > 5) return "rgba(239, 68, 68, 0.8)";
          if (rate >= 1 && rate <= 5) return "rgba(245, 158, 11, 0.8)";
          return "rgba(34, 197, 94, 0.8)";
        }),
        borderColor: filteredData.map((item) => {
          const rate = item.defectRate * 100;
          if (rate > 5) return "rgba(239, 68, 68, 1)";
          if (rate >= 1 && rate <= 5) return "rgba(245, 158, 11, 1)";
          return "rgba(34, 197, 94, 1)";
        }),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: filteredData.map((item) => {
          const rate = item.defectRate * 100;
          if (rate > 5) return "rgba(239, 68, 68, 0.9)";
          if (rate >= 1 && rate <= 5) return "rgba(245, 158, 11, 0.9)";
          return "rgba(34, 197, 94, 0.9)";
        }),
      }
    ]
  };

  const getLevelBadge = (rate) => {
    const percentage = rate * 100;
    if (percentage > 5) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border border-red-200 dark:border-red-700">
          <AlertTriangle className="w-3 h-3 mr-1.5" />
          Critical
        </span>
      );
    } else if (percentage >= 1 && percentage <= 5) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
          <TrendingUp className="w-3 h-3 mr-1.5" />
          Warning
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border border-green-200 dark:border-green-700">
          <CheckCircle className="w-3 h-3 mr-1.5" />
          Good
        </span>
      );
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Defect Name', 'Rank', 'Total Count', 'Defect Rate (%)', 'Status'],
      ...filteredData.map(item => [
        item.defectName,
        item.rank,
        item.totalCount,
        (item.defectRate * 100).toFixed(2),
        item.defectRate * 100 > 5 ? 'Critical' : 
        item.defectRate * 100 >= 1 ? 'Warning' : 'Good'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'defect-analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
      {/* Enhanced Header with Stats Cards */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 px-6 py-6 border-b border-gray-200 dark:border-gray-600">
        {/* Title and Description */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-xl">
                <BarChart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Defect Analysis Dashboard
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Comprehensive defect tracking and analysis with real-time insights and actionable metrics
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={exportData}
              className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                showFilters 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Grid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Critical</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.critical}</p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Warning</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.warning}</p>
              </div>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Good</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.good}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg Rate</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.avgRate}%</p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced View Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-lg border border-gray-200 dark:border-gray-600">
            <div className="flex space-x-1">
              <button
                onClick={() => setViewMode("chart")}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  viewMode === "chart"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <BarChart className="w-4 h-4 mr-2" />
                Chart View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  viewMode === "table"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <TableIcon className="w-4 h-4 mr-2" />
                Table View
              </button>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Showing <strong className="text-gray-900 dark:text-white">{filteredData.length}</strong> of <strong className="text-gray-900 dark:text-white">{defectRates.length}</strong> defects</span>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Panel */}
        {showFilters && (
          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Search Defects
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Type to search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Filter by Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="critical">Critical (&gt;5%)</option>
                  <option value="warning">Warning (1-5%)</option>
                  <option value="good">Good (&lt;1%)</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Sort Options
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [column, order] = e.target.value.split('-');
                    setSortBy(column);
                    setSortOrder(order);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                >
                  <option value="rank-asc">Rank (Low to High)</option>
                  <option value="rank-desc">Rank (High to Low)</option>
                  <option value="defectRate-desc">Rate (High to Low)</option>
                  <option value="defectRate-asc">Rate (Low to High)</option>
                  <option value="totalCount-desc">Count (High to Low)</option>
                  <option value="totalCount-asc">Count (Low to High)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Content Area */}
      <div className="p-6">
        {viewMode === "chart" ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 shadow-inner">
            <div style={{ height: "500px", width: "100%" }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                  <tr>
                    <th 
                      onClick={() => handleSort('defectName')}
                      className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-2">
                        <span>Defect Name</span>
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {sortBy === 'defectName' && (
                          <span className="text-blue-500 dark:text-blue-400 font-bold">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('rank')}
                      className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-2">
                        <span>Rank</span>
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {sortBy === 'rank' && (
                          <span className="text-blue-500 dark:text-blue-400 font-bold">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('totalCount')}
                      className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-2">
                        <span>Defect Qty</span>
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {sortBy === 'totalCount' && (
                          <span className="text-blue-500 dark:text-blue-400 font-bold">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('defectRate')}
                      className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-2">
                        <span>Defect Rate</span>
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {sortBy === 'defectRate' && (
                          <span className="text-blue-500 dark:text-blue-400 font-bold">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.map((item, index) => (
                    <tr 
                      key={item.defectName} 
                      className={`hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer group ${
                        index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.defectName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-800 dark:text-blue-300 text-sm font-bold border-2 border-blue-200 dark:border-blue-700">
                          {item.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.totalCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[3rem]">
                            {(item.defectRate * 100).toFixed(2)}%
                          </span>
                          <div className="flex-1 max-w-[6rem]">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                  item.defectRate * 100 > 5
                                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                                    : item.defectRate * 100 >= 1
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                                    : 'bg-gradient-to-r from-green-500 to-green-600'
                                }`}
                                style={{ width: `${Math.min((item.defectRate * 100) * 10, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getLevelBadge(item.defectRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Enhanced Empty State */}
            {filteredData.length === 0 && (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No defects found</div>
                <div className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                  Try adjusting your search criteria or filters
                </div>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("all");
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Footer with Legend and Additional Info */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-5 border-t border-gray-200 dark:border-gray-600">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Status Legend */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Good (&lt;1%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Warning (1-5%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Critical (&gt;5%)</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Info className="w-3 h-3" />
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>•</span>
              <span>Real-time data</span>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        {stats.total > 0 && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Performance Insights
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Quality Score: </span>
                    <span className={`font-bold ${
                      stats.avgRate < 1 ? 'text-green-600 dark:text-green-400' :
                      stats.avgRate <= 5 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {stats.avgRate < 1 ? 'Excellent' : stats.avgRate <= 5 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Critical Issues: </span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {((stats.critical / stats.total) * 100).toFixed(1)}% of total
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Healthy Items: </span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {((stats.good / stats.total) * 100).toFixed(1)}% of total
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DefectBarChart;

