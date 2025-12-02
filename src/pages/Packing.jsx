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
  AlertTriangle
} from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import QrCodeScanner from "../components/forms/QRCodeScanner";
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
  const [selectedPackingTaskNo, setSelectedPackingTaskNo] = useState(
    PACKING_TASK_OPTIONS[0].value
  );
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
        totalBundleQty: 1 // As per original logic
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

  const handleScanSuccess = (decodedText) => {
    if (!isAdding) {
      fetchScanData(decodedText);
    }
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

  const PageTitle = useCallback(
    () => (
      <div className="text-center">
        <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
          {t("pack.header", "Packing Process")}
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
    let task63 = 0,
      task66 = 0,
      task67 = 0,
      task68 = 0;
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
    <div className="min-h-screen bg-gray-100 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <PageTitle />
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("scan")}
              className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150 ${
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
              className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150 ${
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
            <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 flex items-center justify-between">
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
                />
              </div>
              <div className="flex items-center">
                <label
                  htmlFor="packingTaskSelector"
                  className="text-sm font-medium text-gray-700 mr-2"
                >
                  {t("pack.select_task", "Packing Task")}:
                </label>
                <select
                  id="packingTaskSelector"
                  value={selectedPackingTaskNo}
                  onChange={(e) =>
                    setSelectedPackingTaskNo(Number(e.target.value))
                  }
                  className="h-8 text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 px-2 py-1"
                >
                  {PACKING_TASK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>
                {selectedPackingTaskNo && (
                  <span
                    className="ml-2 text-xs sm:text-sm text-gray-600 truncate max-w-[100px] sm:max-w-[200px]"
                    title={
                      PACKING_TASK_OPTIONS.find(
                        (opt) => opt.value === selectedPackingTaskNo
                      )?.label
                    }
                  >
                    (
                    {
                      PACKING_TASK_OPTIONS.find(
                        (opt) => opt.value === selectedPackingTaskNo
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
                onScanError={(err) => setError(err.message || "Scanner error")}
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
            </div>
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
  );
};

export default PackingPage;
