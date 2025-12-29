import React, { useState } from "react";
import WeeklySummaryTrend from "./WeeklySummaryTrend";
import WeeklyDefectTrend from "./WeeklyDefectTrend";
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  Activity,
  Zap,
  Star,
  Moon,
  Sun
} from "lucide-react";

// Dark mode hook
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark(!isDark);

  return [isDark, toggleDark];
};

const WeeklySummary = ({ filters }) => {
  const [activeTab, setActiveTab] = useState("Summary");
  const [isDark, toggleDark] = useDarkMode();

  // Enhanced tab configuration with modern styling
  const tabs = [
    {
      id: "Summary",
      label: "Weekly Overview",
      shortLabel: "Overview",
      icon: <BarChart3 size={20} />,
      description: "Summary Statistics",
      color: "blue",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      id: "Trend",
      label: "Performance Trends",
      shortLabel: "Trends",
      icon: <TrendingUp size={20} />,
      description: "Weekly Analysis",
      color: "green",
      gradient: "from-green-500 to-green-600"
    },
    {
      id: "DefectTrend",
      label: "Defect Analysis",
      shortLabel: "Defects",
      icon: <AlertTriangle size={20} />,
      description: "Quality Metrics",
      color: "red",
      gradient: "from-red-500 to-red-600"
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  // Enhanced Tab Renderer with Modern Design
  const renderTabs = () => (
    <div className="mb-8">
      {/* Mobile Tab Layout - Horizontal Scroll */}
      <div className="lg:hidden">
        <div className="relative">
          <div className="overflow-x-auto scrollbar-hide pb-2">
            <div className="flex space-x-3 px-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex-shrink-0 flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 min-w-[90px] ${
                      isActive
                        ? `bg-gradient-to-br ${tab.gradient} text-white shadow-lg shadow-${tab.color}-500/25`
                        : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`mb-2 transition-all duration-300 ${
                      isActive ? 'transform scale-110' : 'group-hover:scale-105'
                    }`}>
                      {React.cloneElement(tab.icon, { 
                        className: `w-6 h-6 ${isActive ? 'text-white' : `text-${tab.color}-500 dark:text-${tab.color}-400`}` 
                      })}
                    </div>
                    
                    {/* Label */}
                    <span className={`text-xs font-semibold text-center leading-tight transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {tab.shortLabel}
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
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-2xl shadow-inner">
          <div className="flex space-x-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center space-x-4 px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex-1 ${
                    isActive
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg shadow-${tab.color}-500/25`
                      : "bg-transparent hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {/* Icon Container */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : `bg-${tab.color}-100 dark:bg-${tab.color}-900/30 group-hover:bg-${tab.color}-200 dark:group-hover:bg-${tab.color}-800/50`
                  }`}>
                    {React.cloneElement(tab.icon, { 
                      className: `w-6 h-6 transition-colors duration-300 ${
                        isActive ? 'text-white' : `text-${tab.color}-600 dark:text-${tab.color}-400`
                      }` 
                    })}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 text-left">
                    <div className={`font-bold text-base transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {tab.label}
                    </div>
                    <div className={`text-sm transition-colors duration-300 ${
                      isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {tab.description}
                    </div>
                  </div>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-yellow-300 fill-current" />
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
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center space-x-3 px-6 py-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
            <Zap className={`w-5 h-5 text-${activeTabData?.color || 'blue'}-500`} />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {activeTabData?.description || 'Weekly Analysis'}
            </span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 dark:from-gray-800 dark:via-slate-800 dark:to-gray-900 rounded-2xl shadow-2xl p-6 transition-colors duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl shadow-lg">
                  <Calendar size={28} className="text-white dark:text-gray-200" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-black text-white dark:text-gray-100 tracking-tight">
                    Weekly Analysis Dashboard
                  </h1>
                  <p className="text-indigo-100 dark:text-gray-300 font-medium">
                    Comprehensive weekly performance insights
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleDark}
                  className="p-3 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl transition-all duration-200 hover:bg-white/20 dark:hover:bg-gray-600/50 shadow-lg"
                  title="Toggle Dark Mode"
                >
                  {isDark ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-white" />}
                </button>
                
                <div className="flex items-center space-x-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl px-4 py-3">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400 dark:bg-green-500"></span>
                  </div>
                  <div>
                    <p className="text-white dark:text-gray-100 font-bold text-sm leading-tight">
                      {activeTabData?.label || 'Weekly Overview'}
                    </p>
                    <p className="text-indigo-200 dark:text-gray-300 text-xs font-medium leading-tight">
                      Active Module
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        {renderTabs()}

        {/* Tab Content with Enhanced Styling */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          {activeTab === "Summary" && (
            <div className="p-8">
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <BarChart3 size={40} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Weekly Summary Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-lg">
                  Comprehensive weekly summary statistics and insights will be available here soon.
                </p>
                <div className="mt-8 flex items-center justify-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Feature in development
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Trend" && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Weekly Performance Trends
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Analyze weekly performance patterns and trends
                    </p>
                  </div>
                </div>
              </div>
              <WeeklySummaryTrend filters={filters} />
            </div>
          )}

          {activeTab === "DefectTrend" && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Weekly Defect Analysis
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Track defect patterns and quality metrics over time
                    </p>
                  </div>
                </div>
              </div>
              <WeeklyDefectTrend filters={filters} />
            </div>
          )}
        </div>
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

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }

        /* Glassmorphism effects */
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        @media (prefers-color-scheme: dark) {
          .glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
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

export default WeeklySummary;
