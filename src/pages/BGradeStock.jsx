import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import {
  CalendarDays,
  Clock,
  Table,
  BarChart2,
  Sparkles,
  User,
  Database,
  TrendingUp,
  Package2,
  Scan,
  Camera,
  Upload
} from "lucide-react";
import BGradeStockData from "../components/inspection/qc2/BGradeStockData";
import BGradeStockFilterPane from "../components/inspection/qc2/BGradeStockFilterPane";
import QrCodeScannerRepair from "../components/forms/QrCodeScannerRepair";
import QRCodeUpload from "../components/forms/QRCodeUpload";

const BGradeStock = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("data");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scanMethod, setScanMethod] = useState("camera"); // "camera" or "upload"

  // Filters state will be managed here and passed down
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    moNo: "",
    lineNo: "",
    packageNo: "",
    color: "",
    size: "",
    department: ""
  });

  // Define tabs with modern icons
  const tabs = useMemo(
    () => [
      {
        id: "scan",
        label: t("bGradeStock.tabs.scan", "QR Scan"),
        icon: <Scan size={20} />,
        description: "Scan QR Code for Quick Search"
      },
      {
        id: "data",
        label: t("bGradeStock.tabs.data", "Data"),
        icon: <Database size={20} />,
        description: "B-Grade Stock Data"
      },
      {
        id: "summary",
        label: t("bGradeStock.tabs.summary", "Summary"),
        icon: <TrendingUp size={20} />,
        description: "Stock Summary Report"
      }
    ],
    [t]
  );

  const activeTabData = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [activeTab, tabs]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // QR Code scan handlers
  const handleScanSuccess = useCallback((decodedText) => {
    try {
      // Extract information from QR code and update filters
      // This assumes the QR code contains relevant information like package number, MO number, etc.

      // You can customize this logic based on your QR code format
      // For example, if QR code contains package number:
      if (decodedText) {
        setFilters((prevFilters) => ({
          ...prevFilters,
          packageNo: decodedText.trim()
        }));

        // Switch to data tab to show results
        setActiveTab("data");

        // Show success message (optional)
        console.log("QR Code scanned successfully:", decodedText);
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
    }
  }, []);

  const handleScanError = useCallback((error) => {
    console.error("QR Scan Error:", error);
  }, []);

  // Update clock every second
  React.useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          {/* MOBILE/TABLET LAYOUT (< lg) */}
          <div className="lg:hidden space-y-3">
            {/* Top Row: Title + User */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <Package2 size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                      {t("bGradeStock.header", "B-Grade Stock Report")}
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        QC
                      </span>
                    </div>
                  </div>
                  {/* Active Tab Indicator - Inline with title */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                    </div>
                    <p className="text-[10px] text-indigo-100 font-medium truncate">
                      {activeTabData?.label} • Active
                    </p>
                  </div>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-1.5 shadow-xl flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="hidden sm:block">
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

            {/* Date and Time Info */}
            <div className="flex items-center justify-center gap-4 text-white/80 text-xs">
              <div className="flex items-center gap-1">
                <CalendarDays size={14} />
                <span>{currentTime.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Main Tabs - Scrollable */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 min-w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`group relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white shadow-lg scale-105"
                          : "bg-transparent hover:bg-white/20 hover:scale-102"
                      }`}
                    >
                      <div
                        className={`transition-colors duration-300 ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {React.cloneElement(tab.icon, { className: "w-4 h-4" })}
                      </div>
                      <span
                        className={`text-[10px] font-bold transition-colors duration-300 whitespace-nowrap ${
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
          </div>

          {/* DESKTOP LAYOUT (>= lg) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-1">
                {/* Logo Area */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Package2 size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        {t("bGradeStock.header", "B-Grade Stock Report")}
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={12} className="text-yellow-300" />
                        <span className="text-xs font-bold text-white">QC</span>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-100 font-medium">
                      Yorkmars (Cambodia) Garment MFG Co., LTD
                    </p>
                  </div>
                </div>

                {/* Date and Time Info */}
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} />
                    <span>{currentTime.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{currentTime.toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Navigation Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`group relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 ${
                            isActive
                              ? "bg-white shadow-lg scale-105"
                              : "bg-transparent hover:bg-white/20 hover:scale-102"
                          }`}
                        >
                          <div
                            className={`transition-colors duration-300 ${
                              isActive ? "text-indigo-600" : "text-white"
                            }`}
                          >
                            {React.cloneElement(tab.icon, {
                              className: "w-5 h-5"
                            })}
                          </div>
                          <span
                            className={`text-xs font-bold transition-colors duration-300 ${
                              isActive ? "text-indigo-600" : "text-white"
                            }`}
                          >
                            {tab.label}
                          </span>
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">
                        {activeTabData?.label}
                      </p>
                      <p className="text-indigo-200 text-xs font-medium leading-tight">
                        Active Module
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 shadow-xl">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 text-xs font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="animate-fadeIn space-y-6">
          {/* Filter Pane - Show on all tabs except scan */}
          {activeTab !== "scan" && (
            <BGradeStockFilterPane onFilterChange={setFilters} />
          )}

          {/* QR Scan Tab */}
          {activeTab === "scan" && (
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {t("bGradeStock.scan.title", "QR Code Scanner")}
                  </h2>
                  <p className="text-gray-600">
                    {t(
                      "bGradeStock.scan.description",
                      "Scan a QR code to quickly search B-Grade stock data"
                    )}
                  </p>
                </div>

                {/* Scan Method Selection */}
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setScanMethod("camera")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
                        scanMethod === "camera"
                          ? "bg-white shadow-md text-indigo-600"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      <Camera size={18} />
                      <span className="font-medium">Camera Scan</span>
                    </button>
                    <button
                      onClick={() => setScanMethod("upload")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
                        scanMethod === "upload"
                          ? "bg-white shadow-md text-indigo-600"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      <Upload size={18} />
                      <span className="font-medium">Upload Image</span>
                    </button>
                  </div>
                </div>

                {/* Scanner Component */}
                <div className="text-center max-w-md mx-auto">
                  {scanMethod === "camera" ? (
                    <QrCodeScannerRepair
                      onScanSuccess={handleScanSuccess}
                      onScanError={handleScanError}
                    />
                  ) : (
                    <QRCodeUpload
                      onScanSuccess={handleScanSuccess}
                      onScanError={handleScanError}
                    />
                  )}
                </div>

                {/* Current Filters Display */}
                {filters.packageNo && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-800 mb-2">
                      {t(
                        "bGradeStock.scan.currentFilter",
                        "Current Search Filter:"
                      )}
                    </h3>
                    <p className="text-green-700">
                      Package No:{" "}
                      <span className="font-mono">{filters.packageNo}</span>
                    </p>
                    <button
                      onClick={() => setActiveTab("data")}
                      className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      {t("bGradeStock.scan.viewResults", "View Results")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === "data" && <BGradeStockData filters={filters} />}

          {/* Summary Tab */}
          {activeTab === "summary" && (
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Summary Report
                </h3>
                <p className="text-gray-600">
                  Summary functionality is coming soon. This will provide
                  comprehensive analytics and insights for B-Grade stock data.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles */}
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
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .bg-grid-white {
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            );
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default BGradeStock;
