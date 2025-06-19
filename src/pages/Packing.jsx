import { AlertCircle, QrCode, Table, CalendarDays, Clock, Shirt, Package, Palette } from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import QrCodeScanner from "../components/forms/QRCodeScanner";
import { useTranslation } from 'react-i18next';
import DynamicFilterPane from "../components/filters/DynamicFilterPane";
import StatCard from "../components/card/StateCard";
import UserStatsCard from '../components/card/UserStatsCard';

const PACKING_TASK_OPTIONS = [
  { value: 63, label: "Good garment (For all buyers)" },
  { value: 66, label: "Attach sticker (Costco, Riteman, A & F)" },
  { value: 67, label: "Paring (Costco, Riteman)" },
  { value: 68, label: "Checking the label and hang tag (A & F)" },
];

const GOOD_TO_DEFECT_PACKING_TASK_MAP = {
  63: 106,
  66: 107,
  67: 108,
  68: 109,
};

const PackingPage = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const [packingRecords, setPackingRecords] = useState([]);
  const [scannedData, setScannedData] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [isAdding, setIsAdding] = useState(false);
  const [autoAdd, setAutoAdd] = useState(true);
  const [passQtyPacking, setPassQtyPacking] = useState(0);
  const [packingRecordId, setPackingRecordId] = useState(1);
  const [selectedPackingTaskNo, setSelectedPackingTaskNo] = useState(PACKING_TASK_OPTIONS[0].value);
  const [isDefectCard, setIsDefectCard] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filters, setFilters] = useState({
    filterDate: new Date().toISOString().split('T')[0], 
    qcId: "",
    packageNo: "",
    moNo: "",
    taskNo: "",
    department: "",
    custStyle: "",
    lineNo: ""
  });

  useEffect(() => {
    if (user && user.emp_id) {
      setFilters(prevFilters => ({
        ...prevFilters,
        qcId: user.emp_id, // Set default QC ID from logged-in user
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchInitialRecordId = async () => {
      if (user && user.emp_id) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/last-packing-record-id/${user.emp_id}`
          );
          if (!response.ok)
            throw new Error("Failed to fetch last Packing record ID");
          const data = await response.json();
          setPackingRecordId(data.lastRecordId + 1);
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
      console.log("Scanned QR Code:", trimmedId);

      let response = await fetch(
        `${API_BASE_URL}/api/bundle-by-random-id/${trimmedId}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Order card data fetched:", data);

        const countResponse = await fetch(
          `${API_BASE_URL}/api/check-packing-exists/${data.bundle_id}-${selectedPackingTaskNo}`
        );
        if (!countResponse.ok) throw new Error(`Failed to check Packing scan count for bundle ${data.bundle_id} with task ${selectedPackingTaskNo}`);
        const countData = await countResponse.json();

        if (countData.count >= 3) { // Assuming max 3 scans rule applies to packing too
          const taskLabel = PACKING_TASK_OPTIONS.find(opt => opt.value === selectedPackingTaskNo)?.label || selectedPackingTaskNo;
          throw new Error(`Bundle ID ${data.bundle_id} for task '${taskLabel}' has already been scanned ${countData.count} times (max 3).`);
        }
        setScannedData({ ...data, bundle_random_id: trimmedId });
        setPassQtyPacking(data.count);
      } else {
        const defectResponse = await fetch(
          `${API_BASE_URL}/api/check-defect-card-packing/${trimmedId}` // Ensure this endpoint exists for packing
        );
        const defectResponseText = await defectResponse.text();
        console.log("Defect card response:", defectResponseText);

        if (!defectResponse.ok) {
          const errorData = defectResponseText
            ? JSON.parse(defectResponseText)
            : {};
          throw new Error(errorData.message || "Defect card not found");
        }

        const defectData = JSON.parse(defectResponseText);
        console.log("Defect card data fetched:", defectData);

        const defectSpecificTaskNo = GOOD_TO_DEFECT_PACKING_TASK_MAP[selectedPackingTaskNo];
        if (!defectSpecificTaskNo) {
          console.error("Invalid selectedPackingTaskNo for defect mapping:", selectedPackingTaskNo);
          throw new Error(`Internal error: No defect task mapping for selected Packing task ${selectedPackingTaskNo}.`);
        }

        const countResponse = await fetch(
          `${API_BASE_URL}/api/check-packing-exists/${trimmedId}-${defectSpecificTaskNo}`
        );
        if (!countResponse.ok) throw new Error(`Failed to check Packing scan count for defect card ${trimmedId} with task ${defectSpecificTaskNo}`);
        const countData = await countResponse.json();

        if (countData.count >= 3) { // Assuming max 3 scans rule applies to packing too
          const originalTaskLabel = PACKING_TASK_OPTIONS.find(opt => opt.value === selectedPackingTaskNo)?.label || selectedPackingTaskNo;
          throw new Error(`Defect Card ID ${trimmedId} for task ${defectSpecificTaskNo} (derived from selected task '${originalTaskLabel}') has already been scanned ${countData.count} times (max 3).`);
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
        setPassQtyPacking(defectData.totalRejectGarmentCount);
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
      let taskNoPacking;

      if (isDefectCard) {
        taskNoPacking = GOOD_TO_DEFECT_PACKING_TASK_MAP[selectedPackingTaskNo];
        if (!taskNoPacking) {
          throw new Error(`Internal error: Could not determine defect task number for selected Packing task ${selectedPackingTaskNo}.`);
        }
      } else {
        taskNoPacking = selectedPackingTaskNo;
      }

      const newRecord = {
        packing_record_id: isDefectCard ? 0 : packingRecordId,
        task_no_packing: taskNoPacking,
        packing_bundle_id: isDefectCard
          ? `${scannedData.defect_print_id}-${taskNoPacking}`
          : `${scannedData.bundle_id}-${taskNoPacking}`,
        packing_updated_date: now.toLocaleDateString("en-US", {
          month: "2-digit", day: "2-digit", year: "numeric"
        }),
        packing_update_time: now.toLocaleTimeString("en-US", {
          hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"
        }),
        package_no: scannedData.package_no,
        passQtyPacking,
        emp_id_packing: user.emp_id,
        eng_name_packing: user.eng_name,
        kh_name_packing: user.kh_name,
        job_title_packing: user.job_title,
        dept_name_packing: user.dept_name,
        sect_name_packing: user.sect_name,

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
        emp_id_inspection: isDefectCard ? scannedData.emp_id_inspection : undefined,
        inspection_date: isDefectCard ? scannedData.inspection_date : undefined,
        inspection_time: isDefectCard ? scannedData.inspection_time : undefined,
        sub_con: isDefectCard ? scannedData.sub_con : (scannedData.sub_con || "No"),
        sub_con_factory: isDefectCard
          ? scannedData.sub_con_factory
          : (scannedData.sub_con_factory || "N/A"),
      };
      console.log("New Record to be saved:", newRecord);

      const response = await fetch(`${API_BASE_URL}/api/save-packing`, { // Ensure this endpoint exists
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord)
      });
      if (!response.ok) throw new Error(t("pack.error.failed_to_save", "Failed to save Packing record"));

      const inspectionType = isDefectCard ? "defect" : "first";
      const updateData = {
        inspectionType,
        process: "packing", // Updated process type
        data: {
          task_no: taskNoPacking,
          passQty: newRecord.passQtyPacking,
          updated_date: newRecord.packing_updated_date,
          update_time: newRecord.packing_update_time,
          emp_id: newRecord.emp_id_packing,
          eng_name: newRecord.eng_name_packing,
          kh_name: newRecord.kh_name_packing,
          job_title: newRecord.job_title_packing,
          dept_name: newRecord.dept_name_packing,
          sect_name: newRecord.sect_name_packing,
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

      setPackingRecords((prev) => [...prev, newRecord]);
      setScannedData(null);
      setIsAdding(false);
      setCountdown(5);
      if (!isDefectCard) setPackingRecordId((prev) => prev + 1);
    } catch (err) {
      setError(err.message);
    }
  }, [isDefectCard, packingRecordId, scannedData, passQtyPacking, user, selectedPackingTaskNo, t]);

  useEffect(() => {
    let timer;
    if (autoAdd && isAdding && countdown > 0) {
      timer = setInterval(() => { setCountdown((prev) => prev - 1); }, 1000);
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

  const handlePassQtyChange = (value) => {
    const maxQty = isDefectCard
      ? scannedData.totalRejectGarmentCount
      : scannedData.count;
    if (value >= 0 && value <= maxQty) {
      setPassQtyPacking(value);
    }
  };

  const fetchPackingRecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/packing-records`); // Ensure this endpoint exists
      if (!response.ok) throw new Error("Failed to fetch Packing records");
      const data = await response.json();
      setPackingRecords(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchPackingRecords();
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const PageTitle = useCallback(
    () => (
      <div className="text-center">
        <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
          {t("pack.header", "Packing Process")} {/* Translation key for Packing */}
          {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap justify-center items-center">
          <span className="mx-1.5 text-slate-400">|</span>
          <CalendarDays className="w-3.5 h-3.5 mr-1 text-slate-500" />
          <span className="text-slate-700">{currentTime.toLocaleDateString()}</span>
          <span className="mx-1.5 text-slate-400">|</span>
          <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
          <span className="text-slate-700">{currentTime.toLocaleTimeString()}</span>
        </p>
      </div>
    ),
    [t, user, currentTime]
  );

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const filteredPackingRecords = useMemo(() => {
    if (!packingRecords) return [];

    const parseToLocalDate = (dateStr) => {
      if (!dateStr) return null;
      let year, month, day;
      if (dateStr.includes('-')) {
        [year, month, day] = dateStr.split('-').map(Number);
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      } else {
        return null;
      }
      if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
      return new Date(year, month - 1, day);
    };

    const filterDateSelected = filters.filterDate ? parseToLocalDate(filters.filterDate) : null;

    return packingRecords.filter(record => {
      const recordDate = parseToLocalDate(record.packing_updated_date);

      // Date filter: if filterDateSelected is set, recordDate must match it
      if (filters.filterDate) { // Check if filterDate is actually set
        if (!recordDate || !filterDateSelected || recordDate.getTime() !== filterDateSelected.getTime()) {
          return false;
        }
      }

      // QC ID filter
      if (filters.qcId && String(record.emp_id_packing ?? '').toLowerCase() !== String(filters.qcId).toLowerCase()) {
        return false;
      }
      if (filters.packageNo && String(record.package_no ?? '').toLowerCase() !== String(filters.packageNo).toLowerCase()) return false;
      if (filters.moNo && String(record.selectedMono || record.moNo || '').toLowerCase() !== String(filters.moNo).toLowerCase()) return false;
      if (filters.taskNo && String(record.task_no_packing ?? '').toLowerCase() !== String(filters.taskNo).toLowerCase()) return false;
      if (filters.department && String(record.department ?? '').toLowerCase() !== String(filters.department).toLowerCase()) return false;
      if (filters.custStyle && String(record.custStyle ?? '').toLowerCase() !== String(filters.custStyle).toLowerCase()) return false;
      if (
        filters.lineNo &&
        String(record.lineNo ?? "").toLowerCase() !==
          String(filters.lineNo).toLowerCase()
      )
        return false;

      return true;
    });
  }, [packingRecords, filters, user]);

  const packingStats = useMemo(() => {
    if (!filteredPackingRecords || filteredPackingRecords.length === 0) {
      return { totalGarmentsPacking: 0, totalBundlesProcessed: 0, totalStyles: 0, task63Garments: 0, task66Garments: 0, task67Garments: 0, task68Garments: 0 };
    }

    let totalGarments = 0;
    const uniqueStyles = new Set();
    let task63 = 0, task66 = 0, task67 = 0, task68 = 0;

    filteredPackingRecords.forEach(record => {
      const qty = Number(record.passQtyPacking) || 0;
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
      task68Garments: task68,
    };
  }, [filteredPackingRecords]);

  const userTodayStats = useMemo(() => {
    if (loading || !user || !user.emp_id) {
      return { task63: 0, task66: 0, task67: 0, task68: 0, total: 0 };
    }

    // Ensure 'today' format matches 'packing_updated_date' (MM/DD/YYYY)
    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    let t63 = 0, t66 = 0, t67 = 0, t68 = 0, t106 = 0, t107 = 0, t108 = 0, t109 = 0, total = 0;

    packingRecords.forEach(record => {
      if (record.emp_id_packing === user.emp_id && record.packing_updated_date === today) {
        const qty = Number(record.passQtyPacking) || 0;
        total += qty;
        const taskNo = String(record.task_no_packing);
        if (taskNo === "63") t63 += qty;
        else if (taskNo === "66") t66 += qty;
        else if (taskNo === "67") t67 += qty;
        else if (taskNo === "68") t68 += qty;
        else if (taskNo === "106") t106 += qty;
        else if (taskNo === "107") t107 += qty;
        else if (taskNo === "108") t108 += qty;
        else if (taskNo === "109") t109 += qty;
      }
    });
    return { task63: t63, task66: t66, task67: t67, task68: t68, task106: t106, task107: t107, task108: t108, task109: t109, total: total };
  }, [packingRecords, user, loading]);


  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <PageTitle />

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("scan")}
              className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150
                ${activeTab === "scan" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              <QrCode className="w-5 h-5" />
              {t("iro.qr_scan")}
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150
                ${activeTab === "data" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              <Table className="w-5 h-5" />
              {t("bundle.data_records", "Data Records")}
            </button>
          </nav>
        </div>
        {error && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 shadow-md">
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
                     // Good Tasks
                    { label: t("pack.stats.card.task63", "Task (T63)"), value: userTodayStats.task63},
                    { label: t("pack.stats.card.task66", "Task (T66)"), value: userTodayStats.task66},
                    { label: t("pack.stats.card.task67", "Task (T67)"), value: userTodayStats.task67},
                    { label: t("pack.stats.card.task68", "Task (T68)"), value: userTodayStats.task68},
                    // Defect Tasks
                    { label: t("pack.stats.card.task106", "Defect Task (T106)"), value: userTodayStats.task106},
                    { label: t("pack.stats.card.task107", "Defect Task (T107)"), value: userTodayStats.task107},
                    { label: t("pack.stats.card.task108", "Defect Task (T108)"), value: userTodayStats.task108},
                    { label: t("pack.stats.card.task109", "Defect Task (T109)"), value: userTodayStats.task109},
                  ],
                  totalValue: userTodayStats.total,
                  totalUnit: t("pack.stats.card.garments", "garments"),
                  totalLabel: t("pack.stats.card.total_scanned_today", "Total Scanned (Today)"),
                }}
                // className="max-w-sm ml-auto"
                 className="w-full"
              />
            )}
            <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 flex items-center justify-between">
              <div className="flex items-center">
                <label htmlFor="autoAddCheckboxPacking" className="text-sm font-medium text-gray-700 mr-2">
                  {t("iro.auto_add_record", "Auto Add")}:
                </label>
                <input
                  id="autoAddCheckboxPacking"
                  type="checkbox"
                  checked={autoAdd}
                  onChange={(e) => setAutoAdd(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center">
                <label htmlFor="packingTaskSelector" className="text-sm font-medium text-gray-700 mr-2">
                  {t("pack.select_task", "Packing Task")}:
                </label>
                <select
                  id="packingTaskSelector"
                  value={selectedPackingTaskNo}
                  onChange={(e) => setSelectedPackingTaskNo(Number(e.target.value))}
                  className="h-8 text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 px-2 py-1"
                >
                  {PACKING_TASK_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.value}</option>
                  ))}
                </select>
                {selectedPackingTaskNo && (
                  <span
                    className="ml-2 text-xs sm:text-sm text-gray-600 truncate max-w-[100px] sm:max-w-[200px]"
                    title={PACKING_TASK_OPTIONS.find(opt => opt.value === selectedPackingTaskNo)?.label}
                  >
                   ({PACKING_TASK_OPTIONS.find(opt => opt.value === selectedPackingTaskNo)?.label})
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white shadow-xl rounded-xl p-4 sm:p-6">
              <QrCodeScanner
                onScanSuccess={handleScanSuccess}
                onScanError={(err) => setError(err)}
                autoAdd={autoAdd}
                isAdding={isAdding}
                countdown={countdown}
                handleAddRecord={handleAddRecord}
                handleReset={handleReset}
                scannedData={scannedData}
                loadingData={loadingData}
                passQtyPacking={passQtyPacking}
                handlePassQtyChange={handlePassQtyChange}
                isPackingPage={true}
                isDefectCard={isDefectCard}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-lg flex items-stretch border-l-4 border-blue-500">
                <div className="flex-1 flex items-center space-x-3 pr-3">
                  <div className="p-3 rounded-full bg-opacity-20 bg-blue-500">
                    <Shirt className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      {t("pack.stats.total_garments", "Total Garments Packed")}
                    </p>
                    <p className="text-xl font-semibold text-gray-700">
                      {loadingData ? "..." : packingStats.totalGarmentsPacking.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col justify-around pl-3 border-l border-gray-200 space-y-1 min-w-[120px]">
                  <div><p className="text-xs text-gray-500 font-medium">{t("pack.stats.task63", "Task 63")}</p><p className="text-base font-semibold text-gray-700">{loadingData ? "..." : packingStats.task63Garments.toLocaleString()}</p></div>
                  <div><p className="text-xs text-gray-500 font-medium">{t("pack.stats.task66", "Task 66")}</p><p className="text-base font-semibold text-gray-700">{loadingData ? "..." : packingStats.task66Garments.toLocaleString()}</p></div>
                  <div><p className="text-xs text-gray-500 font-medium">{t("pack.stats.task67", "Task 67")}</p><p className="text-base font-semibold text-gray-700">{loadingData ? "..." : packingStats.task67Garments.toLocaleString()}</p></div>
                  <div><p className="text-xs text-gray-500 font-medium">{t("pack.stats.task68", "Task 68")}</p><p className="text-base font-semibold text-gray-700">{loadingData ? "..." : packingStats.task68Garments.toLocaleString()}</p></div>
                </div>
              </div>
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
              distinctFiltersEndpoint="/api/packing-records/distinct-filters" // Ensure this endpoint exists
            />
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm relative mt-6">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("pack.packing_id", "Packing ID")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("iro.task_no")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("bundle.package_no")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("bundle.department")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("iro.updated_date")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("iro.updated_time")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("bundle.mono")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("bundle.customer_style")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("bundle.buyer")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("bundle.country")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("bundle.factory")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("bundle.line_no")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("bundle.color")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("bundle.size")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("bundle.count")}</th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{t("pack.pass_qty", "Pass Qty")}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPackingRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.packing_record_id}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.task_no_packing}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.package_no}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.department}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.packing_updated_date}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.packing_update_time}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.selectedMono || record.moNo}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.custStyle}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.buyer}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.country}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.factory}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.lineNo}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.color}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.size}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.count || record.totalRejectGarmentCount}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">{record.passQtyPacking}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackingPage;