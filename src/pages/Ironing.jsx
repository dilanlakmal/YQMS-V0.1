import {
  AlertCircle,
  QrCode,
  Table,
  CalendarDays,
  Clock,
  Shirt,
  Package,
  Palette,
  Sparkles,
  User,
  Scan,
  Database,
  Zap,
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

const IroningPage = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const [ironingRecords, setIroningRecords] = useState([]);
  const [scannedData, setScannedData] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [isAdding, setIsAdding] = useState(false);
  const [autoAdd, setAutoAdd] = useState(true);
  const [passQtyIron, setPassQtyIron] = useState(0);
  const [ironingRecordId, setIroningRecordId] = useState(1);
  const [isDefectCard, setIsDefectCard] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scanMethod, setScanMethod] = useState("camera");
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
  const tabs = useMemo(
    () => [
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
        description: "View Ironing Records"
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

  useEffect(() => {
    if (user && user.emp_id) {
      setFilters((prevFilters) => ({
        ...prevFilters,
        qcId: user.emp_id
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchInitialRecordId = async () => {
      if (user && user.emp_id) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/last-ironing-record-id/${user.emp_id}`
          );
          if (!response.ok)
            throw new Error("Failed to fetch last ironing record ID");
          const data = await response.json();
          setIroningRecordId(data.lastRecordId + 1);
        } catch (err) {
          console.error("Error fetching initial record ID:", err);
          setError(err.message);
        }
      }
    };
    fetchInitialRecordId();
  }, [user]);

  const fetchBundleData = async (randomId) => {
    try {
      const trimmedId = randomId.trim();
      setLoadingData(true);
      setIsDefectCard(false);
      let response = await fetch(
        `${API_BASE_URL}/api/bundle-by-random-id/${trimmedId}`
      );
      if (response.ok) {
        const data = await response.json();
        const existsResponse = await fetch(
          `${API_BASE_URL}/api/check-ironing-exists/${data.bundle_id}-53`
        );
        const existsData = await existsResponse.json();
        if (existsData.exists) {
          throw new Error("This order data already exists in ironing");
        }
        setScannedData({ ...data, bundle_random_id: trimmedId });
        setPassQtyIron(data.count);
      } else {
        const defectResponse = await fetch(
          `${API_BASE_URL}/api/check-defect-card/${trimmedId}`
        );
        const defectResponseText = await defectResponse.text();
        if (!defectResponse.ok) {
          const errorData = defectResponseText
            ? JSON.parse(defectResponseText)
            : {};
          throw new Error(errorData.message || "Defect card not found");
        }
        const defectData = JSON.parse(defectResponseText);
        const existsResponse = await fetch(
          `${API_BASE_URL}/api/check-ironing-exists/${trimmedId}-85`
        );
        const existsData = await existsResponse.json();
        if (existsData.exists) {
          throw new Error("This defect card already scanned");
        }
        const formattedData = {
          defect_print_id: defectData.defect_print_id,
          totalRejectGarmentCount: defectData.totalRejectGarmentCount,
          package_no: defectData.package_no,
          moNo: defectData.moNo,
          selectedMono: defectData.moNo,
          custStyle: defectData.custStyle,
          buyer: defectData.buyer,
          color: defectData.color,
          size: defectData.size,
          factory: defectData.factory || "N/A",
          country: defectData.country || "N/A",
          lineNo: defectData.lineNo,
          department: defectData.department,
          count: defectData.totalRejectGarmentCount,
          totalBundleQty: 1,
          emp_id_inspection: defectData.emp_id_inspection,
          inspection_date: defectData.inspection_date,
          inspection_time: defectData.inspection_time,
          sub_con: defectData.sub_con,
          sub_con_factory: defectData.sub_con_factory,
          bundle_id: defectData.bundle_id,
          bundle_random_id: defectData.bundle_random_id
        };
        setScannedData(formattedData);
        setPassQtyIron(defectData.totalRejectGarmentCount);
        setIsDefectCard(true);
      }
      setIsAdding(true);
      setCountdown(5);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err.message);
      setError(err.message);
      setScannedData(null);
      setIsAdding(false);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddRecord = useCallback(async () => {
    try {
      const now = new Date();
      const taskNoIroning = isDefectCard ? 85 : 53;
      const newRecord = {
        ironing_record_id: isDefectCard ? 0 : ironingRecordId,
        task_no_ironing: taskNoIroning,
        ironing_bundle_id: isDefectCard
          ? `${scannedData.defect_print_id}-85`
          : `${scannedData.bundle_id}-53`,
        ironing_updated_date: now.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric"
        }),
        ironing_update_time: now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }),
        package_no: scannedData.package_no,
        ...scannedData,
        passQtyIron,
        emp_id_ironing: user.emp_id,
        eng_name_ironing: user.eng_name,
        kh_name_ironing: user.kh_name,
        job_title_ironing: user.job_title,
        dept_name_ironing: user.dept_name,
        sect_name_ironing: user.sect_name
      };
      const response = await fetch(`${API_BASE_URL}/api/save-ironing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord)
      });
      if (!response.ok) throw new Error("Failed to save ironing record");
      const inspectionType = isDefectCard ? "defect" : "first";
      const updateData = {
        inspectionType,
        process: "ironing",
        data: {
          task_no: taskNoIroning,
          passQty: newRecord.passQtyIron,
          updated_date: newRecord.ironing_updated_date,
          update_time: newRecord.ironing_update_time,
          emp_id: newRecord.emp_id_ironing,
          eng_name: newRecord.eng_name_ironing,
          kh_name: newRecord.kh_name_ironing,
          job_title: newRecord.job_title_ironing,
          dept_name: newRecord.dept_name_ironing,
          sect_name: newRecord.sect_name_ironing,
          ...(isDefectCard && { defect_print_id: scannedData.defect_print_id })
        }
      };
      const updateResponse = await fetch(
        `${API_BASE_URL}/api/update-qc2-orderdata/${scannedData.bundle_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData)
        }
      );
      if (!updateResponse.ok) throw new Error("Failed to update qc2_orderdata");
      setIroningRecords((prev) => [...prev, newRecord]);
      setScannedData(null);
      setIsAdding(false);
      setCountdown(5);
      if (!isDefectCard) setIroningRecordId((prev) => prev + 1);
    } catch (err) {
      setError(err.message);
    }
  }, [isDefectCard, ironingRecordId, scannedData, passQtyIron, user]);

  useEffect(() => {
    let timer;
    if (autoAdd && isAdding && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    } else if (autoAdd && isAdding && countdown === 0) {
      handleAddRecord();
    }
    return () => clearInterval(timer);
  }, [autoAdd, isAdding, countdown, handleAddRecord]);

  const handleReset = () => {
    setScannedData(null);
    setIsAdding(false);
    setCountdown(5);
    setIsDefectCard(false);
  };

  const handleScanSuccess = (decodedText) => {
    if (!isAdding) fetchBundleData(decodedText);
  };

  const handleScanError = (err) => {
    setError(err.message || "Failed to process QR code");
  };

  const handlePassQtyChange = (value) => {
    const maxQty = isDefectCard
      ? scannedData.totalRejectGarmentCount
      : scannedData.count;
    if (value >= 0 && value <= maxQty) {
      setPassQtyIron(value);
    }
  };

  const fetchIroningRecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ironing-records`);
      if (!response.ok) throw new Error("Failed to fetch ironing records");
      const data = await response.json();
      setIroningRecords(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchIroningRecords();
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      clearInterval(timerId);
    };
  }, []);

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const filteredIroningRecords = useMemo(() => {
    if (!ironingRecords) return [];
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
    return ironingRecords.filter((record) => {
      const recordDate = parseToLocalDate(record.ironing_updated_date);
      if (filters.filterDate) {
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
        String(record.emp_id_ironing ?? "").toLowerCase() !==
          String(filters.qcId).toLowerCase()
      ) {
        return false;
      }
      if (
        filters.packageNo &&
        String(record.package_no ?? "").toLowerCase() !==
          String(filters.packageNo).toLowerCase()
      )
        return false;
      if (
        filters.moNo &&
        String(record.selectedMono || record.moNo || "").toLowerCase() !==
          String(filters.moNo).toLowerCase()
      )
        return false;
      if (
        filters.taskNo &&
        String(record.task_no_ironing ?? "").toLowerCase() !==
          String(filters.taskNo).toLowerCase()
      )
        return false;
      if (
        filters.department &&
        String(record.department ?? "").toLowerCase() !==
          String(filters.department).toLowerCase()
      )
        return false;
      if (
        filters.lineNo &&
        String(record.lineNo ?? "").toLowerCase() !==
          String(filters.lineNo).toLowerCase()
      )
        return false;
      return true;
    });
  }, [ironingRecords, filters, user]);

  const ironingStats = useMemo(() => {
    if (!filteredIroningRecords || filteredIroningRecords.length === 0) {
      return {
        totalGarmentsIroned: 0,
        totalBundlesProcessed: 0,
        totalStyles: 0,
        task53Garments: 0,
        task85Garments: 0
      };
    }
    let totalGarments = 0;
    const uniqueStyles = new Set();
    let task53Garments = 0;
    let task85Garments = 0;
    filteredIroningRecords.forEach((record) => {
      const qty = Number(record.passQtyIron) || 0;
      totalGarments += qty;
      if (record.custStyle) {
        uniqueStyles.add(record.custStyle);
      }
      if (String(record.task_no_ironing) === "53") {
        task53Garments += qty;
      } else if (String(record.task_no_ironing) === "85") {
        task85Garments += qty;
      }
    });
    return {
      totalGarmentsIroned: totalGarments,
      totalBundlesProcessed: filteredIroningRecords.length,
      totalStyles: uniqueStyles.size,
      task53Garments: task53Garments,
      task85Garments: task85Garments
    };
  }, [filteredIroningRecords]);

  const userTodayStats = useMemo(() => {
    if (loading || !user || !user.emp_id) {
      return { task53: 0, task85: 0, total: 0 };
    }
    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    });
    let task53Count = 0;
    let task85Count = 0;
    let totalCount = 0;
    ironingRecords.forEach((record) => {
      if (
        record.emp_id_ironing === user.emp_id &&
        record.ironing_updated_date === today
      ) {
        const qty = Number(record.passQtyIron) || 0;
        totalCount += qty;
        if (String(record.task_no_ironing) === "53") {
          task53Count += qty;
        } else if (String(record.task_no_ironing) === "85") {
          task85Count += qty;
        }
      }
    });
    return { task53: task53Count, task85: task85Count, total: totalCount };
  }, [ironingRecords, user, loading]);

  const DAY_TARGET = 500;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 dark:from-gray-800 dark:via-slate-800 dark:to-gray-900 shadow-2xl transition-colors duration-300">
        <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          {/* MOBILE/TABLET LAYOUT (< lg) */}
          <div className="lg:hidden space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <Zap size={20} className="text-white dark:text-gray-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white dark:text-gray-100 tracking-tight truncate">
                      {t("iro.header")}
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles
                        size={10}
                        className="text-yellow-300 dark:text-yellow-400"
                      />
                      <span className="text-[10px] font-bold text-white dark:text-gray-200">
                        QC
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400 dark:bg-green-500"></span>
                    </div>
                    <p className="text-[10px] text-indigo-100 dark:text-gray-300 font-medium truncate">
                      {activeTabData?.label} • Active
                    </p>
                  </div>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-lg px-2.5 py-1.5 shadow-xl flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-md shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white dark:text-gray-100 font-bold text-xs leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 dark:text-gray-300 text-[10px] font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-4 text-white/80 dark:text-gray-300 text-xs">
              <div className="flex items-center gap-1">
                <CalendarDays size={14} />
                <span>{currentTime.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl p-1.5 min-w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`group relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white dark:bg-gray-700 shadow-lg scale-105"
                          : "bg-transparent hover:bg-white/20 dark:hover:bg-gray-600/30 hover:scale-102"
                      }`}
                    >
                      <div
                        className={`transition-colors duration-300 ${
                          isActive
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-white dark:text-gray-200"
                        }`}
                      >
                        {React.cloneElement(tab.icon, { className: "w-4 h-4" })}
                      </div>
                      <span
                        className={`text-[10px] font-bold transition-colors duration-300 whitespace-nowrap ${
                          isActive
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-white dark:text-gray-200"
                        }`}
                      >
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 dark:bg-green-500 rounded-full shadow-lg animate-pulse"></div>
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
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl shadow-lg">
                    <Zap size={24} className="text-white dark:text-gray-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white dark:text-gray-100 tracking-tight">
                        {t("iro.header")}
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm rounded-full">
                        <Sparkles
                          size={12}
                          className="text-yellow-300 dark:text-yellow-400"
                        />
                        <span className="text-xs font-bold text-white dark:text-gray-200">
                          QC
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-100 dark:text-gray-300 font-medium">
                      Yorkmars (Cambodia) Garment MFG Co., LTD
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-white/80 dark:text-gray-300 text-sm">
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
                  <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl p-2">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`group relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 ${
                            isActive
                              ? "bg-white dark:bg-gray-700 shadow-lg scale-105"
                              : "bg-transparent hover:bg-white/20 dark:hover:bg-gray-600/30 hover:scale-102"
                          }`}
                        >
                          <div
                            className={`transition-colors duration-300 ${
                              isActive
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-white dark:text-gray-200"
                            }`}
                          >
                            {React.cloneElement(tab.icon, {
                              className: "w-5 h-5"
                            })}
                          </div>
                          <span
                            className={`text-xs font-bold transition-colors duration-300 ${
                              isActive
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-white dark:text-gray-200"
                            }`}
                          >
                            {tab.label}
                          </span>
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 dark:bg-green-500 rounded-full shadow-lg animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl px-4 py-2.5">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400 dark:bg-green-500"></span>
                    </div>
                    <div>
                      <p className="text-white dark:text-gray-100 font-bold text-sm leading-tight">
                        {activeTabData?.label}
                      </p>
                      <p className="text-indigo-200 dark:text-gray-300 text-xs font-medium leading-tight">
                        Active Module
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-3 bg-white/10 dark:bg-gray-700/30 backdrop-blur-md border border-white/20 dark:border-gray-600/30 rounded-xl px-4 py-2.5 shadow-xl">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-lg shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white dark:text-gray-100 font-bold text-sm leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 dark:text-gray-300 text-xs font-medium leading-tight">
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
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700/50 rounded-lg flex items-center gap-3 shadow-md mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {activeTab === "scan" ? (
            <div className="space-y-6">
              {!loading && user && (
                <UserStatsCard
                  user={user}
                  apiBaseUrl={API_BASE_URL}
                  stats={{
                    tasks: [
                      {
                        label: t(
                          "iro.stats.card.normal_iron",
                          "Normal Iron (T53)"
                        ),
                        value: userTodayStats.task53
                      },
                      {
                        label: t(
                          "iro.stats.card.defect_iron",
                          "Defect Iron (T85)"
                        ),
                        value: userTodayStats.task85
                      }
                    ],
                    totalValue: userTodayStats.total,
                    totalUnit: t("iro.stats.card.garments", "garments"),
                    totalLabel: t(
                      "iro.stats.card.total_scanned_today",
                      "Total Scanned (Today)"
                    )
                  }}
                  className="w-full"
                />
              )}

              {/* Auto Add Toggle */}
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6 flex items-center justify-between border dark:border-gray-700 transition-colors duration-300">
                <label
                  htmlFor="autoAddCheckbox"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"
                >
                  {t("iro.auto_add_record", "Auto Add")}:
                </label>
                <input
                  id="autoAddCheckbox"
                  type="checkbox"
                  checked={autoAdd}
                  onChange={(e) => setAutoAdd(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 dark:text-indigo-400 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700"
                />
              </div>

              {/* Scan Method Selection */}
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6 border dark:border-gray-700 transition-colors duration-300">
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setScanMethod("camera")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
                        scanMethod === "camera"
                          ? "bg-white dark:bg-gray-600 shadow-md text-indigo-600 dark:text-indigo-400"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                      }`}
                    >
                      <Camera size={18} />
                      <span className="font-medium">Camera Scan</span>
                    </button>
                    <button
                      onClick={() => setScanMethod("upload")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
                        scanMethod === "upload"
                          ? "bg-white dark:bg-gray-600 shadow-md text-indigo-600 dark:text-indigo-400"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
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
                    passQtyIron={passQtyIron}
                    handlePassQtyChange={handlePassQtyChange}
                    isIroningPage={true}
                    isDefectCard={isDefectCard}
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
                        passQtyIron={passQtyIron}
                        handlePassQtyChange={handlePassQtyChange}
                        isIroningPage={true}
                        isDefectCard={isDefectCard}
                        hideScanner={true} // Hide the camera part, show only data
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 md:p-6 border dark:border-gray-700 transition-colors duration-300">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Modified Total Garments Card */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex items-stretch border-l-4 border-blue-500 dark:border-blue-400 dark:border-gray-700 transition-colors duration-300">
                  <div className="flex-1 flex items-center space-x-3 pr-3">
                    <div className="p-3 rounded-full bg-opacity-20 bg-blue-500 dark:bg-blue-400/20">
                      <Shirt className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                        {t("iro.stats.total_garments", "Total Garments Ironed")}
                      </p>
                      <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                        {loadingData
                          ? "..."
                          : ironingStats.totalGarmentsIroned.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-around pl-3 border-l border-gray-200 dark:border-gray-600 space-y-1 min-w-[120px]">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {t("iro.stats.normal_iron", "Normal (T53)")}
                      </p>
                      <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                        {loadingData
                          ? "..."
                          : ironingStats.task53Garments.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {t("iro.stats.defect_iron", "Defect (T85)")}
                      </p>
                      <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                        {loadingData
                          ? "..."
                          : ironingStats.task85Garments.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <StatCard
                  title={t(
                    "iro.stats.total_bundles",
                    "Total Bundles Processed"
                  )}
                  value={ironingStats.totalBundlesProcessed.toLocaleString()}
                  icon={<Package />}
                  colorClass="border-l-green-500 dark:border-l-green-400 text-green-500 dark:text-green-400 bg-green-500 dark:bg-green-400"
                  loading={loadingData}
                />

                <StatCard
                  title={t("iro.stats.total_styles", "Total Styles")}
                  value={ironingStats.totalStyles.toLocaleString()}
                  icon={<Palette />}
                  colorClass="border-l-purple-500 dark:border-l-purple-400 text-purple-500 dark:text-purple-400 bg-purple-500 dark:bg-purple-400"
                  loading={loadingData}
                />
              </div>

              <DynamicFilterPane
                initialFilters={filters}
                onApplyFilters={handleApplyFilters}
                distinctFiltersEndpoint="/api/ironing-records/distinct-filters"
              />

              {/* Data Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm relative mt-6">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 border border-gray-200 dark:border-gray-600">
                  <thead className="bg-slate-100 dark:bg-gray-700 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("iro.ironing_id")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("iro.task_no")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        Package No
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.department")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("iro.updated_date")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("iro.updated_time")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.mono")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.customer_style")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.buyer")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.country")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.factory")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.line_no")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.color")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.size")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("bundle.count")}
                      </th>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                        {t("iro.pass_qty")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredIroningRecords.map((record, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors duration-150"
                      >
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.ironing_record_id}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.task_no_ironing}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.package_no}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.department}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.ironing_updated_date}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.ironing_update_time}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.selectedMono || record.moNo}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.custStyle}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.buyer}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.country}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.factory}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.lineNo}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.color}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.size}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.count || record.totalRejectGarmentCount}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.passQtyIron}
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

      {/* Enhanced Custom Styles for Dark Mode */}
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
        
        /* Dark mode specific styles */
        @media (prefers-color-scheme: dark) {
          .bg-grid-white {
            background-image: linear-gradient(
                to right,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
              ),
              linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
              );
          }
        }
        
        /* Custom scrollbar for dark mode */
        .dark .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }
        .dark .overflow-x-auto::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 4px;
        }
        .dark .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 4px;
        }
        .dark .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default IroningPage;
