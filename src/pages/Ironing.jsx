import { AlertCircle, QrCode, Table, CalendarDays, Clock, Shirt, Package, Palette } from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import QrCodeScanner from "../components/forms/QRCodeScanner";
import { useTranslation } from 'react-i18next';
import DynamicFilterPane from "../components/filters/DynamicFilterPane";
import StatCard from "../components/card/StateCard";
import UserStatsCard from '../components/card/UserStatsCard';

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
  const [filters, setFilters] = useState({
    filterDate: new Date().toISOString().split('T')[0], 
    qcId: "",
    packageNo: "",
    moNo: "",
    taskNo: "",
    department: "",
    custStyle: "",
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
      console.log("Scanned QR Code:", trimmedId);

      let response = await fetch(
        `${API_BASE_URL}/api/bundle-by-random-id/${trimmedId}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Order card data fetched:", data);
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
        console.log("Defect card response:", defectResponseText);

        if (!defectResponse.ok) {
          const errorData = defectResponseText
            ? JSON.parse(defectResponseText)
            : {};
          throw new Error(errorData.message || "Defect card not found");
        }

        const defectData = JSON.parse(defectResponseText);
        console.log("Defect card data fetched:", defectData);

        const existsResponse = await fetch(
          `${API_BASE_URL}/api/check-ironing-exists/${trimmedId}-84`
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
      const taskNoIroning = isDefectCard ? 84 : 53;

      const newRecord = {
        ironing_record_id: isDefectCard ? 0 : ironingRecordId,
        task_no_ironing: taskNoIroning,
        ironing_bundle_id: isDefectCard
          ? `${scannedData.defect_print_id}-84`
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
      console.log("New Record to be saved:", newRecord);

      const response = await fetch(`${API_BASE_URL}/api/save-ironing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord)
      });
      if (!response.ok) throw new Error("Failed to save ironing record");

      // Update qc2_orderdata
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
   }, [
    isDefectCard,
    ironingRecordId,
    scannedData,
    passQtyIron,
    user,
    // t // t is stable, but if it were not, it should be included if used inside
  ]);

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
    }, 1000); // Update every second

    return () => {
      clearInterval(timerId); // Cleanup interval on component unmount
    };
  }, []);

  const PageTitle = useCallback(
    () => (
      <div className="text-center">
        <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
          {t("iro.header")}
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

  const filteredIroningRecords = useMemo(() => {
    if (!ironingRecords) return [];

    const parseToLocalDate = (dateStr) => {
      if (!dateStr) return null;
      let year, month, day;
      if (dateStr.includes('-')) { // YYYY-MM-DD from date input
        [year, month, day] = dateStr.split('-').map(Number);
      } else if (dateStr.includes('/')) { // MM/DD/YYYY from record
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

    return ironingRecords.filter(record => {
      const recordDate = parseToLocalDate(record.ironing_updated_date);

     // Date filter: if filterDateSelected is set, recordDate must match it
      if (filters.filterDate) { // Check if filterDate is actually set
        if (!recordDate || !filterDateSelected || recordDate.getTime() !== filterDateSelected.getTime()) {
          return false;
        }
      }

      // QC ID filter
      if (filters.qcId && String(record.emp_id_ironing ?? '').toLowerCase() !== String(filters.qcId).toLowerCase()) {
        return false;
      }

      if (filters.packageNo && String(record.package_no ?? '').toLowerCase() !== String(filters.packageNo).toLowerCase()) return false;
      if (filters.moNo && String(record.selectedMono || record.moNo || '').toLowerCase() !== String(filters.moNo).toLowerCase()) return false;
      if (filters.taskNo && String(record.task_no_ironing ?? '').toLowerCase() !== String(filters.taskNo).toLowerCase()) return false;
      if (filters.department && String(record.department ?? '').toLowerCase() !== String(filters.department).toLowerCase()) return false;
      if (filters.custStyle && String(record.custStyle ?? '').toLowerCase() !== String(filters.custStyle).toLowerCase()) return false;

      return true;
    });
  }, [ironingRecords, filters, user]);

  const ironingStats = useMemo(() => {
    if (!filteredIroningRecords || filteredIroningRecords.length === 0) {
      return { totalGarmentsIroned: 0, totalBundlesProcessed: 0, totalStyles: 0, task53Garments: 0, task84Garments: 0 };
    }

    let totalGarments = 0;
    const uniqueStyles = new Set();
    let task53Garments = 0;
    let task84Garments = 0;

    filteredIroningRecords.forEach(record => {
      const qty = Number(record.passQtyIron) || 0;
      totalGarments += qty;
      if (record.custStyle) {
        uniqueStyles.add(record.custStyle);
      }
      if (String(record.task_no_ironing) === "53") {
        task53Garments += qty;
      } else if (String(record.task_no_ironing) === "84") {
        task84Garments += qty;
      }
    });

    return {
      totalGarmentsIroned: totalGarments,
      totalBundlesProcessed: filteredIroningRecords.length,
      totalStyles: uniqueStyles.size,
      task53Garments: task53Garments,
      task84Garments: task84Garments,
    };
  }, [filteredIroningRecords]);

  const userTodayStats = useMemo(() => {
    if (loading || !user || !user.emp_id) {
      return { task53: 0, task84: 0, total: 0 };
    }

    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    let task53Count = 0;
    let task84Count = 0;
    let totalCount = 0;

    ironingRecords.forEach(record => {
      if (record.emp_id_ironing === user.emp_id &&
          record.ironing_updated_date === today) {
        const qty = Number(record.passQtyIron) || 0;
        totalCount += qty;
        if (String(record.task_no_ironing) === "53") {
          task53Count += qty;
        } else if (String(record.task_no_ironing) === "84") {
          task84Count += qty;
        }
      }
    });

    return { task53: task53Count, task84: task84Count, total: totalCount };
  }, [ironingRecords, user, loading]);

  // Placeholder for Day Target - this should ideally come from config or API
  const DAY_TARGET = 500; // Example target

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
            // onScanSuccess={handleScanSuccess}
            // onScanError={(err) => setError(err)}
            // autoAdd={autoAdd}
            // isAdding={isAdding}
            // countdown={countdown}
            // handleAddRecord={handleAddRecord}
            // handleReset={handleReset}
            // scannedData={scannedData}
            // loadingData={loadingData}
            // passQtyIron={passQtyIron}
            // handlePassQtyChange={handlePassQtyChange}
            // isIroningPage={true}
            // isWashingPage={false}
            // isPackingPage={false}
            // isOPAPage={false}
            // isDefectCard={isDefectCard}
          // />
          <div className="space-y-6">
            {!loading && user && (
              <UserStatsCard
                user={user}
                apiBaseUrl={API_BASE_URL}
                stats={{
                  tasks: [
                    { label: t("iro.stats.card.normal_iron", "Normal Iron (T53)"), value: userTodayStats.task53},
                    { label: t("iro.stats.card.defect_iron", "Defect Iron (T84)"), value: userTodayStats.task84}
                  ],
                  totalValue: userTodayStats.total,
                  totalUnit: t("iro.stats.card.garments", "garments"),
                  totalLabel: t("iro.stats.card.total_scanned_today", "Total Scanned (Today)"),
                }}
                // className="max-w-sm ml-auto"
                 className="w-full"
              />
            )}
            <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 flex items-center justify-between">
              <label htmlFor="autoAddCheckbox" className="text-sm font-medium text-gray-700 flex items-center">
                {t("iro.auto_add_record", "Auto Add")}:
              </label>
              <input
                id="autoAddCheckbox"
                type="checkbox"
                checked={autoAdd}
                onChange={(e) => setAutoAdd(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
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
                passQtyIron={passQtyIron}
                handlePassQtyChange={handlePassQtyChange}
                isIroningPage={true}
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
                      {t("iro.stats.total_garments", "Total Garments Ironed")}
                    </p>
                    <p className="text-xl font-semibold text-gray-700">
                      {loadingData ? "..." : ironingStats.totalGarmentsIroned.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col justify-around pl-3 border-l border-gray-200 space-y-1 min-w-[120px]">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{t("iro.stats.normal_iron", "Normal (T53)")}</p>
                    <p className="text-base font-semibold text-gray-700">{loadingData ? "..." : ironingStats.task53Garments.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{t("iro.stats.defect_iron", "Defect (T84)")}</p>
                    <p className="text-base font-semibold text-gray-700">{loadingData ? "..." : ironingStats.task84Garments.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <StatCard
                title={t("iro.stats.total_bundles", "Total Bundles Processed")}
                value={ironingStats.totalBundlesProcessed.toLocaleString()}
                icon={<Package />}
                colorClass="border-l-green-500 text-green-500 bg-green-500"
                loading={loadingData}
              />
              <StatCard
                title={t("iro.stats.total_styles", "Total Styles")}
                value={ironingStats.totalStyles.toLocaleString()}
                icon={<Palette />}
                colorClass="border-l-purple-500 text-purple-500 bg-purple-500"
                loading={loadingData}
              />
            </div>
            <DynamicFilterPane
              initialFilters={filters}
              onApplyFilters={handleApplyFilters}
              distinctFiltersEndpoint="/api/ironing-records/distinct-filters" // Ensure this endpoint exists or will be created
            />
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm relative mt-6">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {t("iro.ironing_id")}
                    </th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {t("iro.task_no")}
                    </th>
                    <th className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Package No
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
                    {t("iro.pass_qty")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIroningRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                        {record.ironing_record_id}
                      </td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                        {record.task_no_ironing}
                      </td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                        {record.package_no}
                      </td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                        {record.department}
                      </td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                        {record.ironing_updated_date}
                      </td>
                      <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                        {record.ironing_update_time}
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
  );
};

export default IroningPage;
