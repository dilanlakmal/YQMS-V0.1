import React, { useState } from "react";
import DailySummaryTrend from "./DailySummaryTrend";
import DailyDefectTrend from "./DailyDefectTrend";
import { 
  BarChart3, 
  TrendingUp, 
  Bug, 
  Calendar,
  Filter,
  ChevronRight
} from "lucide-react";

const DailySummary = ({ filters }) => {
  const [activeTab, setActiveTab] = useState("Summary");
  const [showFilters, setShowFilters] = useState(false);

  // Tab configuration with icons and descriptions
  const tabs = [
    {
      id: "Summary",
      label: "Summary",
      icon: BarChart3,
      description: "Overview of daily performance metrics",
      color: "blue"
    },
    {
      id: "Trend",
      label: "Trend Analysis",
      icon: TrendingUp,
      description: "Daily trend analysis and patterns",
      color: "green"
    },
    {
      id: "DefectTrend",
      label: "Defect Trends",
      icon: Bug,
      description: "Defect analysis and trending",
      color: "red"
    }
  ];

  const getTabStyles = (tabId, color) => {
    const isActive = activeTab === tabId;
    
    const colorClasses = {
      blue: {
        active: "bg-blue-500 dark:bg-blue-600 text-white border-blue-500 dark:border-blue-600",
        inactive: "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      },
      green: {
        active: "bg-green-500 dark:bg-green-600 text-white border-green-500 dark:border-green-600",
        inactive: "bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
      },
      red: {
        active: "bg-red-500 dark:bg-red-600 text-white border-red-500 dark:border-red-600",
        inactive: "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
      }
    };

    return isActive ? colorClasses[color].active : colorClasses[color].inactive;
  };

  // Format applied filters for display
  const formatFilters = () => {
    if (!filters || Object.keys(filters).length === 0) {
      return "No filters applied";
    }
    
    return Object.entries(filters)
      .filter(([key, value]) => value && value !== "")
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Daily Summary Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive daily performance analysis
                  </p>
                </div>
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
              >
                <Filter size={16} />
                <span className="text-sm">Filters</span>
                <ChevronRight 
                  size={16} 
                  className={`transform transition-transform ${showFilters ? 'rotate-90' : ''}`} 
                />
              </button>
            </div>

            {/* Applied Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Filter className="text-blue-600 dark:text-blue-400" size={16} />
                  <span className="text-blue-800 dark:text-blue-200 text-sm font-medium">
                    Applied Filters:
                  </span>
                </div>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  {formatFilters()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <nav className="flex space-x-1" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group relative flex items-center px-6 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800
                      ${getTabStyles(tab.id, tab.color)}
                    `}
                  >
                    <Icon 
                      size={18} 
                      className={`mr-2 ${isActive ? 'text-white' : ''}`} 
                    />
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{tab.label}</span>
                      <span className={`text-xs mt-1 ${
                        isActive 
                          ? 'text-white/80' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {tab.description}
                      </span>
                    </div>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Content Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {(() => {
                const currentTab = tabs.find(tab => tab.id === activeTab);
                const Icon = currentTab?.icon || BarChart3;
                return (
                  <>
                    <div className={`p-2 rounded-lg ${
                      activeTab === "Summary" ? "bg-blue-100 dark:bg-blue-900/50" :
                      activeTab === "Trend" ? "bg-green-100 dark:bg-green-900/50" :
                      "bg-red-100 dark:bg-red-900/50"
                    }`}>
                      <Icon className={`${
                        activeTab === "Summary" ? "text-blue-600 dark:text-blue-400" :
                        activeTab === "Trend" ? "text-green-600 dark:text-green-400" :
                        "text-red-600 dark:text-red-400"
                      }`} size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {currentTab?.label || "Summary"}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentTab?.description || "Overview of daily performance metrics"}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6">
            {activeTab === "Summary" && (
              <div className="text-center py-12">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="text-blue-600 dark:text-blue-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Summary Dashboard
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  This section will contain comprehensive daily performance metrics, 
                  key indicators, and summary statistics.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-lg mx-auto">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    <strong>Coming Soon:</strong> Interactive charts, performance metrics, 
                    and daily KPI summaries will be available here.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "Trend" && (
              <div className="animate-fadeIn">
                <DailySummaryTrend filters={filters} />
              </div>
            )}

            {activeTab === "DefectTrend" && (
              <div className="animate-fadeIn">
                <DailyDefectTrend filters={filters} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySummary;
