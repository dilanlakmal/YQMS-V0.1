import React, { useState } from "react";
import {
  BarChart3,
  Users,
  Layers,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import FincheckAnalyticsQASummary from "./FincheckAnalyticsQASummary";

// Placeholder for Style Summary (can be implemented later)
const StyleSummaryPlaceholder = () => (
  <div className="flex flex-col items-center justify-center h-96 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
    <Layers className="w-16 h-16 mb-4 opacity-20" />
    <h3 className="text-lg font-bold">Style Summary Analytics</h3>
    <p className="text-sm">This module is under development.</p>
  </div>
);

const FincheckAnalyticsReport = () => {
  const [activeView, setActiveView] = useState("qa-summary");

  const menuItems = [
    {
      id: "qa-summary",
      label: "QA Summary",
      icon: Users,
      component: <FincheckAnalyticsQASummary />,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      id: "style-summary",
      label: "Style Summary",
      icon: Layers,
      component: <StyleSummaryPlaceholder />,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    },
  ];

  const ActiveComponent = menuItems.find(
    (item) => item.id === activeView,
  )?.component;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-100px)] animate-fadeIn">
      {/* 1. Left Navigation Panel */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sticky top-24">
          <div className="flex items-center gap-2 mb-6 px-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-md">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">
              Total Analytics
            </h2>
          </div>

          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group ${
                  activeView === item.id
                    ? "bg-gray-100 dark:bg-gray-700 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      activeView === item.id
                        ? item.color
                        : "text-gray-400 bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      activeView === item.id
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {activeView === item.id && (
                  <ChevronRight className="w-4 h-4 text-gray-400 animate-slideRight" />
                )}
              </button>
            ))}
          </div>

          {/* Info Card */}
          <div className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-indigo-100 dark:border-gray-600">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
              Select a module to view detailed performance metrics and defect
              analysis.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 min-w-0">{ActiveComponent}</div>

      <style jsx>{`
        @keyframes slideRight {
          from {
            transform: translateX(-5px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideRight {
          animation: slideRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FincheckAnalyticsReport;
