import {
  AlertCircle,
  QrCode,
  Table,
  CalendarDays,
  Clock,
  Shirt,
  Package,
  Palette,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  User,
  Scan,
  Database,
  PackageCheck,
  Camera,
  Upload
} from "lucide-react";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import QrCodeScanner from "../components/forms/QRCodeScanner";
import QRCodeUpload from "../components/forms/QRCodeUpload";
import { useTranslation } from "react-i18next";
import DynamicFilterPane from "../components/filters/DynamicFilterPane";
import StatCard from "../components/card/StateCard";
import UserStatsCard from "../components/card/UserStatsCard";

const PACKING_TASK_OPTIONS = [
  { value: 63, label: "Good garment (For all buyers)" },
  { value: 66, label: "Attach sticker (Costco, Riteman, A & F)" },
  { value: 67, label: "Paring (Costco, Riteman)" },
  { value: 68, label: "Checking the label and hang tag (A & F)" }
];

const PackingPage = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const [packingRecords, setPackingRecords] = useState([]);
  const [scannedData, setScannedData] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [isAdding, setIsAdding] = useState(false);
  const [autoAdd, setAutoAdd] = useState(true);
  const [passQtyPacking, setPassQtyPacking] = useState(0);
  const [selectedPackingTaskNo, setSelectedPackingTaskNo] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scanMethod, setScanMethod] = useState("camera");
  
  // Add new state variables for task management
  const [userAssignedTasks, setUserAssignedTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [filters, setFilters] = useState({
    filterDate: new Date().toISOString().split("T")[0],
    qcId: "",
    packageNo: "",
    moNo: "",
    taskNo: "",
    department: "",
    lineNo: ""
  });

  // Define tabs with modern icons
  const tabs = useMemo(() => [
    {
      id: "scan",
      label: t("iro.qr_scan"),
      icon: <Scan size={20} />,
      description: "QR Code Scanner"
    },
    {
      id: "data",
      label: t("bundle.data_records", "Data Records"),
      icon: <Database size={20} />,
      description: "View Packing Records"
    }
  ], [t]);

  const activeTabData = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [activeTab, tabs]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Fetch user's assigned Packing tasks
  const fetchUserAssignedTasks = useCallback(async () => {
    if (!user?.emp_id) return;

    try {
      setLoadingTasks(true);
      const response = await fetch(
        `${API_BASE_URL}/api/packing-records/user-packing-tasks/${user.emp_id}`
      );

      if (!response.ok) {
        setUserAssignedTasks([]);
        setSelectedPackingTaskNo(null);
        return;
      }

      const data = await response.json();
      setUserAssignedTasks(data.assignedTasks || []);
      
      if (data.assignedTasks && data.assignedTasks.length > 0) {
        const validPackingTasks = data.assignedTasks.filter(task => 
          PACKING_TASK_OPTIONS.some(option => option.value === task)
        );
        
        if (validPackingTasks.length > 0) {
          setSelectedPackingTaskNo(validPackingTasks[0]);
        } else {
          setSelectedPackingTaskNo(null);
        }
      } else {
        setSelectedPackingTaskNo(null);
      }
    } catch (err) {
      console.error("Error fetching user assigned tasks:", err);
      setUserAssignedTasks([]);
      setSelectedPackingTaskNo(null);
    } finally {
      setLoadingTasks(false);
    }
  }, [user]);

  // Get available task options based on user's assigned tasks
  const availableTaskOptions = useMemo(() => {
    if (userAssignedTasks.length === 0) {
      return [];
    }
    return PACKING_TASK_OPTIONS.filter(option => 
      userAssignedTasks.includes(option.value)
    );
  }, [userAssignedTasks]);

  // Check if user has valid Packing tasks assigned
  const hasValidPackingTasks = useMemo(() => {
    return availableTaskOptions.length > 0;
  }, [availableTaskOptions]);

  useEffect(() => {
    fetchUserAssignedTasks();
  }, [fetchUserAssignedTasks]);

  useEffect(() => {
    if (user && user.emp_id) {
      setFilters((prevFilters) => ({ ...prevFilters, qcId: user.emp_id }));
    }
  }, [user]);

  const fetchPackingRecords = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/packing/get-all-records`
      );
      if (!response.ok) throw new Error("Failed to fetch Packing records");
      const data = await response.json();
      setPackingRecords(data);
    } catch (err) {
      console.error("Error fetching packing records:", err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchPackingRecords();
  }, [fetchPackingRecords]);

  const fetchScanData = async (decodedText) => {
    // Block scanning if user doesn't have valid Packing tasks
    if (!hasValidPackingTasks || !selectedPackingTaskNo) {
      setError("You don't have permission to scan. No valid Packing tasks assigned.");
      return;
    }

    const randomId = decodedText.trim();
    if (!randomId) return;

    setLoadingData(true);
    setError(null);
    setScannedData(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/packing/get-scan-data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ randomId, taskNo: selectedPackingTaskNo })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      setScannedData(data);
      setPassQtyPacking(data.passQtyPacking);
      setIsAdding(true);
      setCountdown(5);
    } catch (err) {
      setError(err.message);
      setScannedData(null);
      setIsAdding(false);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddRecord = useCallback(async () => {
    if (!scannedData || !user) return;

    try {
      const now = new Date();
      const cardId = scannedData.isDefectCard
        ? scannedData.defect_print_id
        : scannedData.bundle_random_id;
      const packingRecordId = scannedData.isDefectCard ? 0 : 1;

      const newRecord = {
        packing_record_id: packingRecordId,
        task_no_packing: selectedPackingTaskNo,
        packing_bundle_id: `${cardId}-${selectedPackingTaskNo}`,
        packing_updated_date: now.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric"
        }),
        packing_update_time: now.toLocaleTimeString("en-US", { hour12: false }),
        passQtyPack: passQtyPacking,
        emp_id_packing: user.emp_id,
        eng_name_packing: user.eng_name,
        kh_name_packing: user.kh_name,
        job_title_packing: user.job_title,
        dept_name_packing: user.dept_name,
        sect_name_packing: user.sect_name,
        package_no: scannedData.package_no,
        moNo: scannedData.moNo,
        custStyle: scannedData.custStyle,
        buyer: scannedData.buyer,
        color: scannedData.color,
        size: scannedData.size,
        lineNo: scannedData.lineNo,
        department: scannedData.department,
        factory: scannedData.factory,
        country: scannedData.country,
        sub_con: scannedData.sub_con,
        sub_con_factory: scannedData.sub_con_factory,
        bundle_id: scannedData.bundle_id,
        bundle_random_id: scannedData.bundle_random_id,
        count: scannedData.count,
        totalBundleQty: 1
      };

      const response = await fetch(`${API_BASE_URL}/api/packing/save-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to save Packing record");
      }

      setPackingRecords((prev) => [result.data, ...prev]);
      handleReset();
    } catch (err) {
      setError(err.message);
    }
  }, [scannedData, user, selectedPackingTaskNo, passQtyPacking]);

  useEffect(() => {
    let timer;
    if (autoAdd && isAdding && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (autoAdd && isAdding && countdown === 0) {
      handleAddRecord();
    }
    return () => clearInterval(timer);
  }, [autoAdd, isAdding, countdown, handleAddRecord]);

  const handleReset = () => {
    setScannedData(null);
    setIsAdding(false);
    setCountdown(5);
  };

  // Handle QR scan success from both camera and upload
  const handleScanSuccess = (decodedText) => {
    if (!isAdding) {
      fetchScanData(decodedText);
    }
  };

  // Handle QR scan error from both camera and upload
  const handleScanError = (err) => {
    setError(err.message || "Failed to process QR code");
  };

  const handlePassQtyChange = (value) => {
    const maxQty = scannedData?.count || 0;
    const newQty = Number(value);
    if (!isNaN(newQty) && newQty >= 0 && newQty <= maxQty) {
      setPassQtyPacking(newQty);
    } else if (newQty > maxQty) {
      setPassQtyPacking(maxQty);
    }
  };

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const filteredPackingRecords = useMemo(() => {
    if (!packingRecords) return [];

    const parseToLocalDate = (dateStr) => {
      if (!dateStr) return null;
      let year, month, day;
      if (dateStr.includes("-")) {
        [year, month, day] = dateStr.split("-").map(Number);
      } else if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      } else {
        return null;
      }
      if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
      return new Date(year, month - 1, day);
    };

    const filterDateSelected = filters.filterDate
      ? parseToLocalDate(filters.filterDate)
      : null;

    return packingRecords.filter((record) => {
      if (filters.filterDate) {
        const recordDate = parseToLocalDate(record.packing_updated_date);
        if (
          !recordDate ||
          !filterDateSelected ||
          recordDate.getTime() !== filterDateSelected.getTime()
        ) {
          return false;
        }
      }

      if (
        filters.qcId &&
        String(record.emp_id_packing ?? "").toLowerCase() !==
          String(filters.qcId).toLowerCase()
      ) {
        return false;
      }

      if (
        filters.packageNo &&
        String(record.package_no ?? "").toLowerCase() !==
          String(filters.packageNo).toLowerCase()
      ) {
        return false;
      }

      if (
        filters.moNo &&
        String(record.moNo ?? "").toLowerCase() !==
          String(filters.moNo).toLowerCase()
      ) {
        return false;
      }

      if (
        filters.taskNo &&
        String(record.task_no_packing ?? "").toLowerCase() !==
          String(filters.taskNo).toLowerCase()
      ) {
        return false;
      }

      if (
        filters.department &&
        String(record.department ?? "").toLowerCase() !==
          String(filters.department).toLowerCase()
      ) {
        return false;
      }

      if (
        filters.lineNo &&
        String(record.lineNo ?? "").toLowerCase() !==
          String(filters.lineNo).toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [packingRecords, filters]);

  const packingStats = useMemo(() => {
    if (!filteredPackingRecords || filteredPackingRecords.length === 0) {
      return {
        totalGarmentsPacking: 0,
        totalBundlesProcessed: 0,
        totalStyles: 0,
        task63Garments: 0,
        task66Garments: 0,
        task67Garments: 0,
        task68Garments: 0
      };
    }

    let totalGarments = 0;
    const uniqueStyles = new Set();
    let task63 = 0, task66 = 0, task67 = 0, task68 = 0;

    filteredPackingRecords.forEach((record) => {
      const qty = Number(record.passQtyPack) || 0;
      totalGarments += qty;
      if (record.custStyle) uniqueStyles.add(record.custStyle);

      const taskNo = String(record.task_no_packing);
      if (taskNo === "63") task63 += qty;
      else if (taskNo === "66") task66 += qty;
      else if (taskNo === "67") task67 += qty;
      else if (taskNo === "68") task68 += qty;
    });

    return {
      totalGarmentsPacking: totalGarments,
      totalBundlesProcessed: filteredPackingRecords.length,
      totalStyles: uniqueStyles.size,
      task63Garments: task63,
      task66Garments: task66,
      task67Garments: task67,
      task68Garments: task68
    };
  }, [filteredPackingRecords]);

  const userTodayStats = useMemo(() => {
    if (authLoading || !user || !user.emp_id) {
      return { task63: 0, task66: 0, task67: 0, task68: 0, total: 0 };
    }

    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    });

    let stats = { task63: 0, task66: 0, task67: 0, task68: 0, total: 0 };

    packingRecords.forEach((record) => {
      if (
        record.emp_id_packing === user.emp_id &&
        record.packing_updated_date === today
      ) {
        const qty = Number(record.passQtyPack) || 0;
        stats.total += qty;
        const taskKey = `task${record.task_no_packing}`;
        if (stats.hasOwnProperty(taskKey)) {
          stats[taskKey] += qty;
        }
      }
    });

    return stats;
  }, [packingRecords, user, authLoading]);

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
                  <PackageCheck size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                      {t("pack.header", "Packing Process")}
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        QC
                      </span>
                    </div>
                  </div>
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
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <PackageCheck size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        {t("pack.header", "Packing Process")}
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={12} className="text-yellow-300" />
                        <span className="text-xs font-bold text-white">
                          QC
                        </span>
                                              </div>
                    </div>
                    <p className="text-sm text-indigo-100 font-medium">
                      Yorkmars (Cambodia) Garment MFG Co., LTD
                    </p>
                  </div>
                </div>

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
        <div className="animate-fadeIn">
          {error && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 shadow-md mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {activeTab === "scan" ? (
            <div className="space-y-6">
              {!authLoading && user && (
                <UserStatsCard
                  user={user}
                  apiBaseUrl={API_BASE_URL}
                  stats={{
                    tasks: [
                      {
                        label: t("pack.stats.card.task63", "Task 63"),
                        value: userTodayStats.task63
                      },
                      {
                        label: t("pack.stats.card.task66", "Task 66"),
                        value: userTodayStats.task66
                      },
                      {
                        label: t("pack.stats.card.task67", "Task 67"),
                        value: userTodayStats.task67
                      },
                      {
                        label: t("pack.stats.card.task68", "Task 68"),
                        value: userTodayStats.task68
                      }
                    ],
                    totalValue: userTodayStats.total,
                    totalUnit: t("pack.stats.card.garments", "garments"),
                    totalLabel: t(
                      "pack.stats.card.total_scanned_today",
                      "Total Scanned (Today)"
                    )
                  }}
                  className="w-full"
                />
              )}

              <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Left Part: Auto Add Checkbox */}
                <div className="flex items-center">
                  <label
                    htmlFor="autoAddCheckboxPacking"
                    className="text-sm font-medium text-gray-700 mr-2"
                  >
                    {t("iro.auto_add_record", "Auto Add")}:
                  </label>
                  <input
                    id="autoAddCheckboxPacking"
                    type="checkbox"
                    checked={autoAdd}
                    onChange={(e) => setAutoAdd(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={!hasValidPackingTasks}
                  />
                </div>

                {/* Right Part: Task Selector */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <label
                    htmlFor="packingTaskSelector"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t("pack.select_task", "Packing Task")}:
                  </label>
                  
                  {loadingTasks ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      <span className="text-sm text-gray-500">Loading tasks...</span>
                    </div>
                  ) : !hasValidPackingTasks ? (
                    <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded border border-orange-200">
                      No Packing tasks assigned
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        id="packingTaskSelector"
                        value={selectedPackingTaskNo || ""}
                        onChange={(e) => setSelectedPackingTaskNo(Number(e.target.value))}
                        className="h-8 text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 px-2 py-1"
                        disabled={!hasValidPackingTasks}
                      >
                        {availableTaskOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.value}
                          </option>
                        ))}
                      </select>
                      
                      {selectedPackingTaskNo && (
                        <span
                          className="text-xs sm:text-sm text-gray-600 truncate max-w-[150px] sm:max-w-[250px]"
                          title={
                            availableTaskOptions.find(
                              (opt) => opt.value === selectedPackingTaskNo
                            )?.label
                          }
                        >
                          (
                          {
                            availableTaskOptions.find(
                              (opt) => opt.value === selectedPackingTaskNo
                            )?.label
                          }
                          )
                        </span>
                      )}
                      
                      {userAssignedTasks.length > 0 && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                          Assigned: {userAssignedTasks.filter(task => 
                            [63, 66, 67, 68].includes(task)
                          ).join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Scan Method Selection - Only show if user has valid tasks */}
              {!loadingTasks && hasValidPackingTasks && selectedPackingTaskNo && (
                <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6">
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

                  {/* Conditional Rendering based on scan method */}
                  {scanMethod === "camera" ? (
                    <QrCodeScanner
                      onScanSuccess={handleScanSuccess}
                      onScanError={handleScanError}
                      autoAdd={autoAdd}
                      isAdding={isAdding}
                      countdown={countdown}
                      handleAddRecord={handleAddRecord}
                      handleReset={handleReset}
                      scannedData={scannedData}
                      loadingData={loadingData}
                      passQtyPack={passQtyPacking}
                      handlePassQtyChange={handlePassQtyChange}
                      isPackingPage={true}
                      isDefectCard={scannedData?.isDefectCard || false}
                    />
                  ) : (
                    <div className="space-y-6">
                      <QRCodeUpload
                        onScanSuccess={handleScanSuccess}
                        onScanError={handleScanError}
                        disabled={isAdding || loadingData}
                      />
                      
                      {/* Show the same data display as camera scanner when QR is processed */}
                      {scannedData && (
                        <QrCodeScanner
                          onScanSuccess={handleScanSuccess}
                          onScanError={handleScanError}
                          autoAdd={autoAdd}
                          isAdding={isAdding}
                          countdown={countdown}
                          handleAddRecord={handleAddRecord}
                          handleReset={handleReset}
                          scannedData={scannedData}
                          loadingData={loadingData}
                          passQtyPack={passQtyPacking}
                          handlePassQtyChange={handlePassQtyChange}
                          isPackingPage={true}
                          isDefectCard={scannedData?.isDefectCard || false}
                          hideScanner={true} // Hide the camera part, show only data
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Show message if no tasks assigned */}
              {!loadingTasks && !hasValidPackingTasks && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-8 text-center shadow-lg">
                  <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-full mx-auto mb-6 shadow-inner">
                    <PackageCheck className="w-10 h-10 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-orange-800 mb-3">
                    Access Restricted
                  </h3>
                  <p className="text-orange-700 mb-4 max-w-md mx-auto leading-relaxed">
                    You don't have any Packing tasks (63, 66, 67, 68) assigned to your account. 
                    Scanning is currently disabled for your user profile.
                  </p>
                  <div className="bg-white/60 rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-orange-600 font-medium">
                      📞 Please contact your supervisor or administrator to assign the appropriate Packing tasks to your account.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xl p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                  title={t("pack.stats.total_garments", "Total Garments Packed")}
                  value={packingStats.totalGarmentsPacking.toLocaleString()}
                  icon={<Shirt />}
                  colorClass="border-l-blue-500 text-blue-500 bg-blue-500"
                  loading={loadingData}
                />
                <StatCard
                  title={t("pack.stats.total_bundles", "Total Bundles Processed")}
                  value={packingStats.totalBundlesProcessed.toLocaleString()}
                  icon={<Package />}
                  colorClass="border-l-green-500 text-green-500 bg-green-500"
                  loading={loadingData}
                />
                <StatCard
                  title={t("pack.stats.total_styles", "Total Styles")}
                  value={packingStats.totalStyles.toLocaleString()}
                  icon={<Palette />}
                  colorClass="border-l-purple-500 text-purple-500 bg-purple-500"
                  loading={loadingData}
                />
              </div>

              <DynamicFilterPane
                initialFilters={filters}
                onApplyFilters={handleApplyFilters}
                distinctFiltersEndpoint="/api/packing-records/distinct-filters"
              />

              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm relative mt-6">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("pack.packing_id", "Card Type")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("iro.task_no")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.package_no")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.department")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("iro.updated_date")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("iro.updated_time")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.mono")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.customer_style")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.buyer")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.country")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.factory")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.line_no")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.color")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.size")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.count")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("pack.pass_qty", "Pass Qty")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPackingRecords.map((record, index) => (
                      <tr
                        key={record._id || index}
                        className="hover:bg-slate-50 transition-colors duration-150"
                      >
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {record.packing_record_id === 0 ? (
                              <>
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span>Defect</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Order</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.task_no_packing}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.package_no}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.department}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.packing_updated_date}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.packing_update_time}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.moNo}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.custStyle}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.buyer}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.country}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.factory}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.lineNo}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.color}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.size}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.count}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.passQtyPack}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

export default PackingPage;

                      
