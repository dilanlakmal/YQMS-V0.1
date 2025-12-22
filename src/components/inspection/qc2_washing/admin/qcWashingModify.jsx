import React, { useState } from "react";
import QCWashingDefectsTab from "./QCWashingDefectsTab";
import QCWashingFirstOutputTab from "./QCWashingFirstOutputTab";
import QCWashingCheckpointsTab from "./QCWashingCheckpointsTab";
import QCWashingStandardTable from "./QCWashingStanderd";
import { 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Settings, 
  Cog,
  Database,
  Activity,
  BarChart3,
  Zap
} from "lucide-react";

const QcWashingModify = () => {
  const [activeTab, setActiveTab] = useState("defects");

  const tabsConfig = [
    {
      value: "defects",
      label: "Defect Management",
      icon: <AlertTriangle className="h-5 w-5" />,
      description: "Manage washing defects and quality issues",
      gradient: "from-red-500 to-pink-500",
      component: <QCWashingDefectsTab />
    },
    {
      value: "firstOutput",
      label: "First Output Check",
      icon: <CheckCircle className="h-5 w-5" />,
      description: "Configure first output inspection standards",
      gradient: "from-green-500 to-emerald-500",
      component: <QCWashingFirstOutputTab />
    },
    {
      value: "checkpoints",
      label: "Checkpoint Management",
      icon: <Target className="h-5 w-5" />,
      description: "Set up inspection checkpoints and criteria",
      gradient: "from-blue-500 to-indigo-500",
      component: <QCWashingCheckpointsTab />
    },
    {
      value: "standards",
      label: "Standard Values",
      icon: <Settings className="h-5 w-5" />,
      description: "Define washing machine parameters and standards",
      gradient: "from-purple-500 to-violet-500",
      component: <QCWashingStandardTable />
    }
  ];

  const getActiveTabConfig = () => {
    return tabsConfig.find(tab => tab.value === activeTab) || tabsConfig[0];
  };

  const handleTabClick = (tabValue) => {
    setActiveTab(tabValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full shadow-lg">
              <Cog className="h-10 w-10 text-white animate-spin-slow" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            QC Washing Management
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Comprehensive quality control configuration and management system
          </p>
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Custom Tab Navigation */}
          <div className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-2">
              {tabsConfig.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTabClick(tab.value)}
                  className={`flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 ${
                    activeTab === tab.value
                      ? 'bg-white dark:bg-gray-800 shadow-lg scale-105'
                      : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${tab.gradient} text-white shadow-md`}>
                    {tab.icon}
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">
                      {tab.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {tab.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab Header */}
          <div className={`bg-gradient-to-r ${getActiveTabConfig().gradient} px-6 py-4`}>
            <div className="flex items-center space-x-3 text-white">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                {getActiveTabConfig().icon}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{getActiveTabConfig().label}</h2>
                <p className="text-white/90 text-sm">{getActiveTabConfig().description}</p>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <div className={`bg-gradient-to-br ${
              activeTab === 'defects' ? 'from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 border-red-200 dark:border-red-800' :
              activeTab === 'firstOutput' ? 'from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800' :
              activeTab === 'checkpoints' ? 'from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800' :
              'from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 border-purple-200 dark:border-purple-800'
            } rounded-xl p-6 border`}>
              {getActiveTabConfig().component}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default QcWashingModify;
