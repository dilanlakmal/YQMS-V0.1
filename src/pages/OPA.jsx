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
  Settings,
  Camera,
  Upload
} from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import QrCodeScanner from "../components/forms/QRCodeScanner";
import QRCodeUpload from "../components/forms/QRCodeUpload"; // Import the new component
import { useTranslation } from "react-i18next";
import DynamicFilterPane from "../components/filters/DynamicFilterPane";
import StatCard from "../components/card/StateCard";
import UserStatsCard from "../components/card/UserStatsCard";

const OPA_TASK_OPTIONS = [
  { value: 60, label: "Good garment" },
  { value: 61, label: "Garment with thread sucking cleaning" },
  { value: 62, label: "Garment with fabric cover zipper" }
];

const GOOD_TO_DEFECT_OPA_TASK_MAP = {
  60: 103,
  61: 104,
  62: 105
};

const OPAPage = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const [opaRecords, setOpaRecords] = useState([]);
  const [scannedData, setScannedData] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [isAdding, setIsAdding] = useState(false);
  const [autoAdd, setAutoAdd] = useState(true);
  const [passQtyOPA, setPassQtyOPA] = useState(0);
  const [opaRecordId, setOpaRecordId] = useState(1);
  const [selectedOpaTaskNo, setSelectedOpaTaskNo] = useState(null);
  const [isDefectCard, setIsDefectCard] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userAssignedTasks, setUserAssignedTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [scanMethod, setScanMethod] = useState("camera"); // "camera" or "upload"
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
      description: "View OPA Records"
    }
  ], [t]);

  const activeTabData = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [activeTab, tabs]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Fetch user's assigned OPA tasks
  const fetchUserAssignedTasks = useCallback(async () => {
    if (!user?.emp_id) return;

    try {
      setLoadingTasks(true);
      const response = await fetch(
        `${API_BASE_URL}/api/opa-records/user-opa-tasks/${user.emp_id}`
      );

      if (!response.ok) {
        setUserAssignedTasks([]);
        setSelectedOpaTaskNo(null);
        return;
      }

      const data = await response.json();
      setUserAssignedTasks(data.assignedTasks || []);

      if (data.assignedTasks && data.assignedTasks.length > 0) {
        const validOPATasks = data.assignedTasks.filter(task => 
          OPA_TASK_OPTIONS.some(option => option.value === task)
        );
        
        if (validOPATasks.length > 0) {
          setSelectedOpaTaskNo(validOPATasks[0]);
        } else {
          setSelectedOpaTaskNo(null);
        }
      } else {
        setSelectedOpaTaskNo(null);
      }
    } catch (err) {
      console.error("Error fetching user assigned tasks:", err);
      setUserAssignedTasks([]);
      setSelectedOpaTaskNo(null);
    } finally {
      setLoadingTasks(false);
    }
  }, [user]);

  // Get available task options based on user's assigned tasks
  const availableTaskOptions = useMemo(() => {
    if (userAssignedTasks.length === 0) {
      return [];
    }

    return OPA_TASK_OPTIONS.filter(option => 
      userAssignedTasks.includes(option.value)
    );
  }, [userAssignedTasks]);

  // Check if user has valid OPA tasks assigned
  const hasValidOPATasks = useMemo(() => {
    return availableTaskOptions.length > 0;
  }, [availableTaskOptions]);

  useEffect(() => {
    fetchUserAssignedTasks();
  }, [fetchUserAssignedTasks]);

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
            `${API_BASE_URL}/api/last-opa-record-id/${user.emp_id}`
          );
          if (!response.ok)
            throw new Error("Failed to fetch last OPA record ID");
          const data = await response.json();
          setOpaRecordId(data.lastRecordId + 1);
        } catch (err) {
          console.error("Error fetching initial record ID:", err);
          setError(err.message);
        }
      }
    };

    fetchInitialRecordId();
  }, [user]);

  const fetchBundleData = async (randomId) => {
    // Block scanning if user doesn't have valid OPA tasks
    if (!hasValidOPATasks || !selectedOpaTaskNo) {
      setError("You don't have permission to scan. No valid OPA tasks assigned.");
      return;
    }

    try {
      const trimmedId = randomId.trim();
      setLoadingData(true);
      setIsDefectCard(false);

      let response = await fetch(
        `${API_BASE_URL}/api/bundle-by-random-id/${trimmedId}`
      );

      if (response.ok) {
        const data = await response.json();

        const countResponse = await fetch(
          `${API_BASE_URL}/api/check-opa-exists/${data.bundle_id}-${selectedOpaTaskNo}`
        );
        if (!countResponse.ok)
          throw new Error(
            `Failed to check OPA scan count for bundle ${data.bundle_id} with task ${selectedOpaTaskNo}`
          );

        const countData = await countResponse.json();

        if (countData.count >= 3) {
          const taskLabel =
            OPA_TASK_OPTIONS.find((opt) => opt.value === selectedOpaTaskNo)
              ?.label || selectedOpaTaskNo;
          throw new Error(
            `Bundle ID ${data.bundle_id} for task '${taskLabel}' has already been scanned ${countData.count} times (max 3).`
          );
        }

        setScannedData({ ...data, bundle_random_id: trimmedId });
        setPassQtyOPA(data.count);
      } else {
        const defectResponse = await fetch(
          `${API_BASE_URL}/api/check-defect-card-opa/${trimmedId}`
        );
        const defectResponseText = await defectResponse.text();

        if (!defectResponse.ok) {
          const errorData = defectResponseText
            ? JSON.parse(defectResponseText)
            : {};
          throw new Error(errorData.message || "Defect card not found");
        }

        const defectData = JSON.parse(defectResponseText);
        

        const defectSpecificTaskNo =
          GOOD_TO_DEFECT_OPA_TASK_MAP[selectedOpaTaskNo];
        if (!defectSpecificTaskNo) {
          throw new Error(
            `Internal error: No defect task mapping for selected OPA task ${selectedOpaTaskNo}.`
          );
        }

        const countResponse = await fetch(
          `${API_BASE_URL}/api/check-opa-exists/${trimmedId}-${defectSpecificTaskNo}`
        );
        if (!countResponse.ok)
          throw new Error(
            `Failed to check OPA scan count for defect card ${trimmedId} with task ${defectSpecificTaskNo}`
          );

        const countData = await countResponse.json();

        if (countData.count >= 3) {
          const originalTaskLabel =
            OPA_TASK_OPTIONS.find((opt) => opt.value === selectedOpaTaskNo)
              ?.label || selectedOpaTaskNo;
          throw new Error(
            `Defect Card ID ${trimmedId} for task ${defectSpecificTaskNo} (derived from selected task '${originalTaskLabel}') has already been scanned ${countData.count} times (max 3).`
          );
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
        setPassQtyOPA(defectData.totalRejectGarmentCount);
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

  // Handle QR scan success from both camera and upload
  const handleScanSuccess = (decodedText) => {
    if (!isAdding) fetchBundleData(decodedText);
  };

  // Handle QR scan error from both camera and upload
  const handleScanError = (err) => {
    setError(err.message || "Failed to process QR code");
  };

  // Rest of your existing methods remain the same...
  const handleAddRecord = useCallback(async () => {
    try {
      const now = new Date();
      let taskNoOPA;
      if (isDefectCard) {
        taskNoOPA = GOOD_TO_DEFECT_OPA_TASK_MAP[selectedOpaTaskNo];
        if (!taskNoOPA) {
          throw new Error(
            `Internal error: Could not determine defect task number for selected OPA task ${selectedOpaTaskNo}.`
          );
        }
      } else {
        taskNoOPA = selectedOpaTaskNo;
      }

      const newRecord = {
        opa_record_id: isDefectCard ? 0 : opaRecordId,
        task_no_opa: taskNoOPA,
        opa_bundle_id: isDefectCard
          ? `${scannedData.defect_print_id}-${taskNoOPA}`
          : `${scannedData.bundle_id}-${taskNoOPA}`,
        opa_updated_date: now.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric"
        }),
        opa_update_time: now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }),
        package_no: scannedData.package_no,
        passQtyOPA,
        emp_id_opa: user.emp_id,
        eng_name_opa: user.eng_name,
        kh_name_opa: user.kh_name,
        job_title_opa: user.job_title,
        dept_name_opa: user.dept_name,
        sect_name_opa: user.sect_name,
        moNo: scannedData.moNo,
        selectedMono: scannedData.selectedMono || scannedData.moNo,
        custStyle: scannedData.custStyle,
        buyer: scannedData.buyer,
        color: scannedData.color,
        size: scannedData.size,
        factory: scannedData.factory,
        country: scannedData.country,
        lineNo: scannedData.lineNo,
        department: scannedData.department,
        count: scannedData.count,
        bundle_id: scannedData.bundle_id,
        bundle_random_id: scannedData.bundle_random_id,
        totalBundleQty: scannedData.totalBundleQty || 1,
        defect_print_id: isDefectCard ? scannedData.defect_print_id : undefined,
        emp_id_inspection: isDefectCard
          ? scannedData.emp_id_inspection
          : undefined,
        inspection_date: isDefectCard ? scannedData.inspection_date : undefined,
        inspection_time: isDefectCard ? scannedData.inspection_time : undefined,
        sub_con: isDefectCard
          ? scannedData.sub_con
          : scannedData.sub_con || "No",
        sub_con_factory: isDefectCard
          ? scannedData.sub_con_factory
          : scannedData.sub_con_factory || "N/A"
      };


      const response = await fetch(`${API_BASE_URL}/api/save-opa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord)
      });

      if (!response.ok)
        throw new Error(
          t("opa.error.failed_to_save", "Failed to save OPA record")
        );

      const inspectionType = isDefectCard ? "defect" : "first";
      const updateData = {
        inspectionType,
        process: "opa",
        data: {
          task_no: taskNoOPA,
          passQty: newRecord.passQtyOPA,
          updated_date: newRecord.opa_updated_date,
          update_time: newRecord.opa_update_time,
          emp_id: newRecord.emp_id_opa,
          eng_name: newRecord.eng_name_opa,
          kh_name: newRecord.kh_name_opa,
          job_title: newRecord.job_title_opa,
          dept_name: newRecord.dept_name_opa,
          sect_name: newRecord.sect_name_opa,
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

      setOpaRecords((prev) => [...prev, newRecord]);
      setScannedData(null);
      setIsAdding(false);
      setCountdown(5);
      if (!isDefectCard) setOpaRecordId((prev) => prev + 1);
    } catch (err) {
      setError(err.message);
    }
  }, [
    isDefectCard,
    opaRecordId,
    scannedData,
    passQtyOPA,
    user,
    selectedOpaTaskNo,
    t
  ]);

  // ... (rest of your existing useEffects and methods remain the same)

  useEffect(() => {
    let timer;
    if (autoAdd && isAdding && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
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

  const handlePassQtyChange = (value) => {
    const maxQty = isDefectCard
      ? scannedData.totalRejectGarmentCount
      : scannedData.count;
    if (value >= 0 && value <= maxQty) {
      setPassQtyOPA(value);
    }
  };

  const fetchOpaRecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/opa-records`);
      if (!response.ok) throw new Error("Failed to fetch OPA records");
      const data = await response.json();
      setOpaRecords(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchOpaRecords();
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // ... (rest of your existing useMemo hooks for filtering and stats remain the same)

  const filteredOpaRecords = useMemo(() => {
    if (!opaRecords) return [];

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

    return opaRecords.filter((record) => {
      const recordDate = parseToLocalDate(record.opa_updated_date);

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
        String(record.emp_id_opa ?? "").toLowerCase() !==
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
        String(record.task_no_opa ?? "").toLowerCase() !==
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
  }, [opaRecords, filters]);

  const opaStats = useMemo(() => {
    if (!filteredOpaRecords || filteredOpaRecords.length === 0) {
      return {
        totalGarmentsOPA: 0,
        totalBundlesProcessed: 0,
        totalStyles: 0,
        task60Garments: 0,
        task61Garments: 0,
        task62Garments: 0
      };
    }

    let totalGarments = 0;
    const uniqueStyles = new Set();
    let task60 = 0,
      task61 = 0,
      task62 = 0;

    filteredOpaRecords.forEach((record) => {
      const qty = Number(record.passQtyOPA) || 0;
      totalGarments += qty;

      if (record.custStyle) uniqueStyles.add(record.custStyle);

      const taskNo = String(record.task_no_opa);
      if (taskNo === "60") task60 += qty;
      else if (taskNo === "61") task61 += qty;
      else if (taskNo === "62") task62 += qty;
    });

    return {
      totalGarmentsOPA: totalGarments,
      totalBundlesProcessed: filteredOpaRecords.length,
      totalStyles: uniqueStyles.size,
      task60Garments: task60,
            task61Garments: task61,
      task62Garments: task62
    };
  }, [filteredOpaRecords]);

  const userTodayStats = useMemo(() => {
    if (loading || !user || !user.emp_id) {
      return {
        task60: 0,
        task61: 0,
        task62: 0,
        task103: 0,
        task104: 0,
        task105: 0,
        total: 0
      };
    }

    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    });

    let t60 = 0,
      t61 = 0,
      t62 = 0,
      t103 = 0,
      t104 = 0,
      t105 = 0,
      total = 0;

    opaRecords.forEach((record) => {
      if (
        record.emp_id_opa === user.emp_id &&
        record.opa_updated_date === today
      ) {
        const qty = Number(record.passQtyOPA) || 0;
        total += qty;
        const taskNo = String(record.task_no_opa);
        if (taskNo === "60") t60 += qty;
        else if (taskNo === "61") t61 += qty;
        else if (taskNo === "62") t62 += qty;
        else if (taskNo === "103") t103 += qty;
        else if (taskNo === "104") t104 += qty;
        else if (taskNo === "105") t105 += qty;
      }
    });

    return {
      task60: t60,
      task61: t61,
      task62: t62,
      task103: t103,
      task104: t104,
      task105: t105,
      total: total
    };
  }, [opaRecords, user, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Section - Same as before */}
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
                  <Settings size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                      {t("opa.header")}
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

          {/* DESKTOP LAYOUT (>= lg) - Same as before */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Settings size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        {t("opa.header")}
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
              {!loading && user && (
                <UserStatsCard
                  user={user}
                  apiBaseUrl={API_BASE_URL}
                  stats={{
                    tasks: [
                      {
                        label: t("opa.stats.card.task60", "OPA Task (T60)"),
                        value: userTodayStats.task60
                      },
                      {
                        label: t("opa.stats.card.task61", "OPA Task (T61)"),
                        value: userTodayStats.task61
                      },
                      {
                        label: t("opa.stats.card.task62", "OPA Task (T62)"),
                        value: userTodayStats.task62
                      },
                      {
                        label: t("opa.stats.card.task103", "Defect OPA (T103)"),
                        value: userTodayStats.task103
                      },
                      {
                        label: t("opa.stats.card.task104", "Defect OPA (T104)"),
                        value: userTodayStats.task104
                      },
                      {
                        label: t("opa.stats.card.task105", "Defect OPA (T105)"),
                        value: userTodayStats.task105
                      }
                    ],
                    totalValue: userTodayStats.total,
                    totalUnit: t("opa.stats.card.garments", "garments"),
                    totalLabel: t(
                      "opa.stats.card.total_scanned_today",
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
                    htmlFor="autoAddCheckboxOpa"
                    className="text-sm font-medium text-gray-700 mr-2"
                  >
                    {t("iro.auto_add_record", "Auto Add")}:
                  </label>
                  <input
                    id="autoAddCheckboxOpa"
                    type="checkbox"
                    checked={autoAdd}
                    onChange={(e) => setAutoAdd(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={!hasValidOPATasks}
                  />
                </div>

                {/* Right Part: Task Selector */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <label
                    htmlFor="opaTaskSelector"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t("opa.select_task", "OPA Task")}:
                  </label>
                  
                  {loadingTasks ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      <span className="text-sm text-gray-500">Loading tasks...</span>
                    </div>
                  ) : !hasValidOPATasks ? (
                    <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded border border-orange-200">
                      No OPA tasks assigned
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        id="opaTaskSelector"
                        value={selectedOpaTaskNo || ""}
                        onChange={(e) => setSelectedOpaTaskNo(Number(e.target.value))}
                        className="h-8 text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 px-2 py-1"
                        disabled={!hasValidOPATasks}
                      >
                        {availableTaskOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.value}
                          </option>
                        ))}
                      </select>
                      
                      {selectedOpaTaskNo && (
                        <span
                          className="text-xs sm:text-sm text-gray-600 truncate max-w-[150px] sm:max-w-[250px]"
                          title={
                            availableTaskOptions.find(
                              (opt) => opt.value === selectedOpaTaskNo
                            )?.label
                          }
                        >
                          (
                          {
                            availableTaskOptions.find(
                              (opt) => opt.value === selectedOpaTaskNo
                            )?.label
                          }
                          )
                        </span>
                      )}
                      
                      {userAssignedTasks.length > 0 && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                          Assigned: {userAssignedTasks.filter(task => 
                            [60, 61, 62].includes(task)
                          ).join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* NEW: Scan Method Selection */}
              {!loadingTasks && hasValidOPATasks && selectedOpaTaskNo && (
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
                        <span className="font-medium">Upload QR Code</span>
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
                      passQtyOPA={passQtyOPA}
                      handlePassQtyChange={handlePassQtyChange}
                      isOPAPage={true}
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
                          passQtyOPA={passQtyOPA}
                          handlePassQtyChange={handlePassQtyChange}
                          isOPAPage={true}
                          isDefectCard={isDefectCard}
                          hideScanner={true} // Hide the camera part, show only data
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Show message if no tasks assigned */}
              {!loadingTasks && !hasValidOPATasks && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-8 text-center shadow-lg">
                  <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-full mx-auto mb-6 shadow-inner">
                    <Settings className="w-10 h-10 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-orange-800 mb-3">
                    Access Restricted
                  </h3>
                  <p className="text-orange-700 mb-4 max-w-md mx-auto leading-relaxed">
                    You don't have any OPA tasks (60, 61, 62) assigned to your account. 
                    Scanning is currently disabled for your user profile.
                  </p>
                  <div className="bg-white/60 rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-orange-600 font-medium">
                      📞 Please contact your supervisor or administrator to assign the appropriate OPA tasks to your account.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Data tab content remains the same
            <div className="bg-white rounded-xl shadow-xl p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-lg flex items-stretch border-l-4 border-blue-500">
                  <div className="flex-1 flex items-center space-x-3 pr-3">
                    <div className="p-3 rounded-full bg-opacity-20 bg-blue-500">
                      <Shirt className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                        {t("opa.stats.total_garments", "Total Garments OPA")}
                      </p>
                      <p className="text-xl font-semibold text-gray-700">
                        {loadingData
                          ? "..."
                          : opaStats.totalGarmentsOPA.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-around pl-3 border-l border-gray-200 space-y-1 min-w-[120px]">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        {t("opa.stats.task60", "Task 60")}
                      </p>
                      <p className="text-base font-semibold text-gray-700">
                        {loadingData
                          ? "..."
                          : opaStats.task60Garments.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        {t("opa.stats.task61", "Task 61")}
                      </p>
                      <p className="text-base font-semibold text-gray-700">
                        {loadingData
                          ? "..."
                          : opaStats.task61Garments.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        {t("opa.stats.task62", "Task 62")}
                      </p>
                      <p className="text-base font-semibold text-gray-700">
                        {loadingData
                          ? "..."
                          : opaStats.task62Garments.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <StatCard
                  title={t("opa.stats.total_bundles", "Total Bundles Processed")}
                  value={opaStats.totalBundlesProcessed.toLocaleString()}
                  icon={<Package />}
                  colorClass="border-l-green-500 text-green-500 bg-green-500"
                  loading={loadingData}
                />

                <StatCard
                  title={t("opa.stats.total_styles", "Total Styles")}
                  value={opaStats.totalStyles.toLocaleString()}
                  icon={<Palette />}
                  colorClass="border-l-purple-500 text-purple-500 bg-purple-500"
                  loading={loadingData}
                />
              </div>

              <DynamicFilterPane
                initialFilters={filters}
                onApplyFilters={handleApplyFilters}
                distinctFiltersEndpoint="/api/opa-records/distinct-filters"
              />

              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm relative mt-6">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {t("opa.opa_id")}
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
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
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
                        {t("opa.pass_qty")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOpaRecords.map((record, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50 transition-colors duration-150"
                      >
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.opa_record_id}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.task_no_opa}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.package_no}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.department}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.opa_updated_date}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.opa_update_time}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.selectedMono || record.moNo}
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
                          {record.count || record.totalRejectGarmentCount}
                        </td>
                        <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                          {record.passQtyOPA}
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

export default OPAPage;


