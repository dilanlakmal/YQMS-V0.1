import {
  Scissors,
  TrendingUp,
  Layers,
  User,
  Shield,
  Sparkles,
  Factory,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import FCMarkerRatio from "../components/inspection/FC/FCMarkerRatio";

const PlaceholderComponent = ({ title, icon: Icon }) => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[400px] flex flex-col justify-center items-center">
      <div className="mb-4 text-indigo-500 dark:text-indigo-400">
        <Icon size={64} strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        Under Development
      </p>
    </div>
  );
};

const FCSystem = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("marker-ratio");

  const tabs = useMemo(
    () => [
      {
        id: "marker-ratio",
        label: "Marker Ratio",
        icon: <Scissors size={20} />,
        component: <FCMarkerRatio />,
        gradient: "from-blue-500 to-cyan-500",
        description: "View and search marker ratio data",
      },
      {
        id: "shrinkage-test",
        label: "Shrinkage Test",
        icon: <TrendingUp size={20} />,
        component: (
          <PlaceholderComponent title="Shrinkage Test" icon={TrendingUp} />
        ),
        gradient: "from-purple-500 to-pink-500",
        description: "Shrinkage test reports",
      },
      {
        id: "density-test",
        label: "Density Test",
        icon: <Layers size={20} />,
        component: <PlaceholderComponent title="Density Test" icon={Layers} />,
        gradient: "from-green-500 to-emerald-500",
        description: "Density test reports",
      },
    ],
    [],
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  const activeTabData = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200 flex flex-col">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* FIXED Header Section */}
      <div className="fixed top-12 lg:top-16 left-0 right-0 z-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-2 lg:py-3">
          {/* MOBILE LAYOUT */}
          <div className="lg:hidden space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <Factory size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm font-black text-white tracking-tight truncate">
                      FC System
                    </h1>
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={8} className="text-yellow-300" />
                      <span className="text-[8px] font-bold text-white">
                        PRO
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-indigo-100 font-medium truncate">
                    View Reports
                  </p>
                </div>
              </div>

              {user && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2 py-1 shadow-xl flex-shrink-0">
                  <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow-lg">
                    <User size={14} className="text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white font-bold text-[10px] leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 text-[9px] font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Tabs */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 min-w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group relative flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition-all duration-300 min-w-[80px] ${
                        isActive
                          ? "bg-white shadow-lg scale-105"
                          : "bg-transparent hover:bg-white/20"
                      }`}
                    >
                      <div
                        className={`transition-colors duration-300 ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {React.cloneElement(tab.icon, {
                          className: "w-3.5 h-3.5",
                        })}
                      </div>
                      <span
                        className={`text-[9px] font-bold transition-colors duration-300 whitespace-nowrap ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </div>
              <div>
                <p className="text-white font-bold text-xs leading-tight">
                  {activeTabData?.label}
                </p>
                <p className="text-indigo-200 text-[9px] font-medium leading-tight">
                  Active Section
                </p>
              </div>
            </div>
          </div>

          {/* DESKTOP LAYOUT */}
          <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <Factory size={20} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h1 className="text-lg font-black text-white tracking-tight">
                      FC System
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        PRO
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-100 font-medium">
                    System Reports & Data
                  </p>
                </div>
              </div>

              {/* Desktop Tabs */}
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white shadow-lg scale-105"
                          : "bg-transparent hover:bg-white/20"
                      }`}
                    >
                      <div
                        className={`transition-colors duration-300 ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {React.cloneElement(tab.icon, {
                          className: "w-4 h-4",
                        })}
                      </div>
                      <span
                        className={`text-[10px] font-bold transition-colors duration-300 ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 min-w-[120px]">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </div>
                <div>
                  <p className="text-white font-bold text-xs leading-tight">
                    {activeTabData?.label}
                  </p>
                  <p className="text-indigo-200 text-[9px] font-medium leading-tight">
                    Active Section
                  </p>
                </div>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 shadow-xl">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                  <User size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs leading-tight">
                    {user.job_title || "Operator"}
                  </p>
                  <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                    ID: {user.emp_id}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative max-w-8xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 pt-[180px] lg:pt-[130px]">
        <div className="animate-fadeIn">
          <div className="transform transition-all duration-500 ease-out">
            {activeComponent}
          </div>
        </div>
      </div>

      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
          .bg-grid-white { background-image: linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px); }
          .delay-1000 { animation-delay: 1s; }
        `}
      </style>
    </div>
  );
};

export default FCSystem;
