import {
  AlertCircle,
  QrCode,
  Table,
  CalendarDays,
  Clock,
  Shirt,
  Package,
  Palette
} from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import QrCodeScanner from "../components/forms/QRCodeScanner";
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
  const [selectedOpaTaskNo, setSelectedOpaTaskNo] = useState(
    OPA_TASK_OPTIONS[0].value
  );
  const [isDefectCard, setIsDefectCard] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filters, setFilters] = useState({
    filterDate: new Date().toISOString().split("T")[0],
    qcId: "",
    packageNo: "",
    moNo: "",
    taskNo: "",
    department: "",
    lineNo: ""
  });

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
          `${API_BASE_URL}/api/check-opa-exists/${data.bundle_id}-${selectedOpaTaskNo}`
        );
        if (!countResponse.ok)
          throw new Error(
            `Failed to check OPA scan count for bundle ${data.bundle_id} with task ${selectedOpaTaskNo}`
          );
        const countData = await countResponse.json(); // Expects { count: number }

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
        console.log("Defect card response:", defectResponseText);

        if (!defectResponse.ok) {
          const errorData = defectResponseText
            ? JSON.parse(defectResponseText)
            : {};
          throw new Error(errorData.message || "Defect card not found");
        }

        const defectData = JSON.parse(defectResponseText);
        console.log("Defect card data fetched:", defectData);

        // For a defect card, check against the mapped defect-specific OPA task number
        const defectSpecificTaskNo =
          GOOD_TO_DEFECT_OPA_TASK_MAP[selectedOpaTaskNo];
        if (!defectSpecificTaskNo) {
          console.error(
            "Invalid selectedOpaTaskNo for defect mapping:",
            selectedOpaTaskNo
          );
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
        const countData = await countResponse.json(); // Expects { count: number }

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
        // ...scannedData,
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
      console.log("New Record to be saved:", newRecord);

      const response = await fetch(`${API_BASE_URL}/api/save-opa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord)
      });
      if (!response.ok)
        throw new Error(
          t("opa.error.failed_to_save", "Failed to save OPA record")
        );

      // Update qc2_orderdata
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

  const handleScanSuccess = (decodedText) => {
    if (!isAdding) fetchBundleData(decodedText);
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
    }, 1000); // Update every second
    return () => clearInterval(timerId); // Cleanup interval on component unmount
  }, []);

  const PageTitle = useCallback(
    () => (
      <div className="text-center">
        <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
          {t("opa.header")}
          {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap justify-center items-center">
          <span className="mx-1.5 text-slate-400">|</span>
          <CalendarDays className="w-3.5 h-3.5 mr-1 text-slate-500" />
          <span className="text-slate-700">
            {currentTime.toLocaleDateString()}
          </span>
          <span className="mx-1.5 text-slate-400">|</span>
          <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
          <span className="text-slate-700">
            {currentTime.toLocaleTimeString()}
          </span>
        </p>
      </div>
    ),
    [t, user, currentTime]
  );

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const filteredOpaRecords = useMemo(() => {
    if (!opaRecords) return [];

    const parseToLocalDate = (dateStr) => {
      if (!dateStr) return null;
      let year, month, day;
      if (dateStr.includes("-")) {
        // YYYY-MM-DD from date input
        [year, month, day] = dateStr.split("-").map(Number);
      } else if (dateStr.includes("/")) {
        // MM/DD/YYYY from record
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

      // Date filter: if filterDateSelected is set, recordDate must match it
      if (filters.filterDate) {
        if (
          !recordDate ||
          !filterDateSelected ||
          recordDate.getTime() !== filterDateSelected.getTime()
        ) {
          return false;
        }
      }

      // QC ID filter
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
    <div className="min-h-screen bg-gray-100 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <PageTitle />

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("scan")}
              className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150
                ${
                  activeTab === "scan"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <QrCode className="w-5 h-5" />
              {t("iro.qr_scan")}
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150
                ${
                  activeTab === "data"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
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
          // <QrCodeScanner
          //   onScanSuccess={handleScanSuccess}
          //   onScanError={(err) => setError(err)}
          //   autoAdd={autoAdd}
          //   isAdding={isAdding}
          //   countdown={countdown}
          //   handleAddRecord={handleAddRecord}
          //   handleReset={handleReset}
          //   scannedData={scannedData}
          //   loadingData={loadingData}
          //   passQtyOPA={passQtyOPA}
          //   handlePassQtyChange={handlePassQtyChange}
          //   isIroningPage={false}
          //   isWashingPage={false}
          //   isPackingPage={false}
          //   isOPAPage={true}
          //   isDefectCard={isDefectCard}
          // />
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
                    // Defect Tasks
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
                // className="max-w-sm ml-auto"
                className="w-full"
              />
            )}
            <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 flex items-center justify-between">
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
                />
              </div>

              {/* Right Part: Task Selector */}
              <div className="flex items-center">
                <label
                  htmlFor="opaTaskSelector"
                  className="text-sm font-medium text-gray-700 mr-2"
                >
                  {t("opa.select_task", "OPA Task")}:
                </label>
                <select
                  id="opaTaskSelector"
                  value={selectedOpaTaskNo}
                  onChange={(e) => setSelectedOpaTaskNo(Number(e.target.value))}
                  className="h-8 text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 px-2 py-1"
                >
                  {OPA_TASK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>
                {selectedOpaTaskNo && (
                  <span
                    className="ml-2 text-xs sm:text-sm text-gray-600 truncate max-w-[150px] sm:max-w-[250px]"
                    title={
                      OPA_TASK_OPTIONS.find(
                        (opt) => opt.value === selectedOpaTaskNo
                      )?.label
                    }
                  >
                    (
                    {
                      OPA_TASK_OPTIONS.find(
                        (opt) => opt.value === selectedOpaTaskNo
                      )?.label
                    }
                    )
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
                passQtyOPA={passQtyOPA} // Pass correct prop name
                handlePassQtyChange={handlePassQtyChange}
                isOPAPage={true} // Specific prop for OPA
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
  );
};

export default OPAPage;
