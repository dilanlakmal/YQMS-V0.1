import { Eye, Printer } from "lucide-react";
import {
  FaFilter,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaCalendarAlt
} from "react-icons/fa"; // Added FaCalendarAlt
import React, { useEffect, useState, useCallback, useRef } from "react";
import { API_BASE_URL } from "../../../config";
import QRCodePreview from "../forms/QRCodePreview";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DefectPrint = ({ bluetoothRef, printMethod }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState("bundle"); //  "bundle"
  const [defectCards, setDefectCards] = useState([]);
  const [searchMoNo, setSearchMoNo] = useState("");
  const [searchPackageNo, setSearchPackageNo] = useState("");
  const [searchRepairGroup, setSearchRepairGroup] = useState("");
  const getTodayDateString = () => new Date().toISOString().split("T")[0];
  const [searchDate, setSearchDate] = useState(getTodayDateString());
  const [searchTaskNo, setSearchTaskNo] = useState("");
  const [searchStatus, setSearchStatus] = useState("both");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [packageNoOptions, setPackageNoOptions] = useState([]);
  const [repairGroupOptions, setRepairGroupOptions] = useState([]);
  const [taskNoOptions, setTaskNoOptions] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [showFilters, setShowFilters] = useState(true); // State for filter pane visibility
  const [loading, setLoading] = useState(false);
  const [printDisabled, setPrintDisabled] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [repairTrackingDetails, setRepairTrackingDetails] = useState({});
  const isInitialOrModeChange = useRef(true); // To manage initial fetches and mode changes

  const fetchDefectCards = async (page, limit, filters = {}) => {
    try {
      setLoading(true);
      let url =
        mode === "repair"
          ? `${API_BASE_URL}/api/qc2-defect-print/search?page=${page}&limit=${limit}`
          : `${API_BASE_URL}/api/qc2-inspection-pass-bundle/search?page=${page}&limit=${limit}`;
      const hasSearchParams =
        filters.moNo ||
        filters.packageNo ||
        filters.repair ||
        filters.status ||
        filters.date ||
        filters.taskNo;

      if (hasSearchParams) {
        const params = new URLSearchParams();
        if (filters.moNo) params.append("moNo", filters.moNo);
        if (filters.packageNo) {
          const packageNo = Number(filters.packageNo);
          if (isNaN(packageNo)) {
            alert("Package No must be a number");
            setLoading(false);
            return;
          }
          params.append("package_no", packageNo.toString());
        }
        if (filters.repair) params.append("repair", filters.repair);
        if (filters.date) params.append("date", filters.date);
        if (filters.taskNo) params.append("taskNo", filters.taskNo);
        url += `&${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${mode} cards`);
      const responseData = await response.json();

      const data = Array.isArray(responseData.data) ? responseData.data : [];
      const total = Number.isInteger(responseData.total)
        ? responseData.total
        : 0;

      if (mode === "repair") {
        setDefectCards(data);
        setTotalRecords(total);
      } else if (mode === "garment") {
        setDefectCards(data);
        setTotalRecords(total);
      } else if (mode === "bundle") {
        const bundleQrCards = data.flatMap(
          (bundle) =>
            bundle.printArray
              ?.filter((print) => print.method === "bundle")
              .map((print) => ({
                package_no: bundle.package_no,
                moNo: bundle.moNo,
                custStyle: bundle.custStyle,
                color: bundle.color,
                size: bundle.size,
                checkedQty: bundle.checkedQty,
                defectQty: bundle.defectQty,
                totalRejectGarments: print.totalRejectGarmentCount || 0,
                totalPrintDefectCount: print.totalPrintDefectCount || 0,
                printData: print.printData || [],
                defect_print_id: print.defect_print_id,
                isCompleted: print.isCompleted || false,
                rejectGarmentsLength: bundle.rejectGarments?.length || 0,
                taskNo: bundle.taskNo, // Assuming taskNo is available on bundle
                inspection_date: bundle.inspection_date // Assuming inspection_date is available on bundle
              }))
              .filter((card) =>
                filters.status === "both"
                  ? true
                  : filters.status === "inProgress"
                  ? card.totalRejectGarments > 0
                  : card.totalRejectGarments === 0
              ) || []
        );
        setDefectCards(bundleQrCards);
        setTotalRecords(bundleQrCards.length);
        // Fetch repair tracking details for each bundle card

        bundleQrCards.forEach((card) => {
          fetchRepairTracking(card.defect_print_id);
        });
      }
    } catch (error) {
      console.error(`Error fetching ${mode} cards:`, error);
      setDefectCards([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const url =
        mode === "repair"
          ? `${API_BASE_URL}/api/qc2-defect-print/filter-options`
          : `${API_BASE_URL}/api/qc2-inspection-pass-bundle/filter-options`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${mode} options`);
      const data = await response.json();

      setMoNoOptions(Array.isArray(data.moNo) ? data.moNo : []);
      setPackageNoOptions(
        Array.isArray(data.package_no) ? data.package_no : []
      );
      setTaskNoOptions(Array.isArray(data.taskNo) ? data.taskNo : []);
      setRepairGroupOptions(
        mode === "repair" && Array.isArray(data.repair) ? data.repair : []
      );
    } catch (error) {
      console.error(`Error fetching ${mode} search options:`, error);
      setMoNoOptions([]);
      setTaskNoOptions([]);
      setPackageNoOptions([]);
      setRepairGroupOptions([]);
    }
  };

  async function fetchRepairTracking(defect_print_id) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/defect-track/${defect_print_id}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      // console.log(data);
      setRepairTrackingDetails((prev) => ({
        ...prev,
        [defect_print_id]: data
      }));
    } catch (error) {
      console.error("Error fetching repair tracking:", error);
      setRepairTrackingDetails((prev) => ({
        ...prev,
        [defect_print_id]: null
      }));
    }
  }

  // Debounce utility function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  const applyFiltersAndFetch = useCallback(
    (isModeChange = false) => {
      const filtersToApply = {
        moNo: searchMoNo.trim(),
        packageNo: searchPackageNo.trim(),
        repair: mode === "repair" ? searchRepairGroup.trim() : undefined,
        date: searchDate,
        taskNo: searchTaskNo.trim(),
        status: mode === "bundle" ? searchStatus : undefined
      };

      if (currentPage !== 1) {
        setCurrentPage(1); // This will trigger the pagination useEffect
      } else {
        // If already on page 1, fetch directly
        fetchDefectCards(1, recordsPerPage, filtersToApply);
      }
      // If it's a mode change, the pagination useEffect needs to know not to fetch again for page 1
      if (isModeChange) {
        isInitialOrModeChange.current = true;
      }
    },
    [
      searchMoNo,
      searchPackageNo,
      searchRepairGroup,
      searchDate,
      searchTaskNo,
      searchStatus,
      mode,
      currentPage,
      recordsPerPage,
      setCurrentPage /* fetchDefectCards could be added if it were stable */
    ]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedApplyFilters = useCallback(
    debounce(applyFiltersAndFetch, 700),
    [applyFiltersAndFetch]
  );

  // Effect for mode change
  useEffect(() => {
    fetchFilterOptions();
    applyFiltersAndFetch(true); // true indicates it's a mode change
  }, [mode]); // applyFiltersAndFetch is not added here to avoid re-triggering if its internals change due to other state updates. Mode is the primary trigger.

  // Effect for filter input changes (excluding mode, currentPage, recordsPerPage)
  useEffect(() => {
    if (isInitialOrModeChange.current) {
      // Skip the very first run or run immediately after mode change, as applyFiltersAndFetch was called by mode useEffect
      // isInitialOrModeChange.current will be set to false by pagination useEffect after it runs once post-mode-change
      return;
    }
    debouncedApplyFilters();
  }, [
    searchMoNo,
    searchPackageNo,
    searchRepairGroup,
    searchDate,
    searchTaskNo,
    searchStatus,
    debouncedApplyFilters
  ]);

  // Effect for pagination (currentPage or recordsPerPage changes)
  useEffect(() => {
    if (isInitialOrModeChange.current && currentPage === 1) {
      isInitialOrModeChange.current = false; // Allow subsequent pagination/filter effects
      return; // Skip if mode/filter change just fetched for page 1
    }
    isInitialOrModeChange.current = false; // Reset flag if it was true for some other reason

    const filtersToApply = {
      moNo: searchMoNo.trim(),
      packageNo: searchPackageNo.trim(),
      repair: mode === "repair" ? searchRepairGroup.trim() : undefined,
      date: searchDate,
      taskNo: searchTaskNo.trim(),
      status: mode === "bundle" ? searchStatus : undefined
    };
    fetchDefectCards(currentPage, recordsPerPage, filtersToApply);
  }, [currentPage, recordsPerPage]); // search states are implicitly used by constructing filtersToApply

  const handleResetFilters = () => {
    setSearchMoNo("");
    setSearchPackageNo("");
    setSearchRepairGroup("");
    setSearchDate(getTodayDateString());
    setSearchTaskNo("");
    setSearchStatus("both");
    // After resetting states, trigger a search which will reset to page 1 and fetch with empty filters
    // We call applyFiltersAndFetch directly here, not the debounced one, for immediate reset.
    isInitialOrModeChange.current = true; // Signal that a reset is happening
    applyFiltersAndFetch(true); // Treat reset like a mode change for fetch logic
  };
  const formatTime12Hour = (timeString) => {
    if (!timeString) return "N/A"; // Handle empty cases

    const [hours, minutes] = timeString.split(":").map(Number); // Convert to numbers
    const ampm = hours >= 12 ? "PM" : "AM"; // Determine AM/PM
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for AM/PM format

    return `${formattedHours}:${String(minutes).padStart(2, "0")} ${ampm}`; // Format properly
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A"; // Check if date is valid
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "N/A";
    }
  };

  const parseDateForPicker = (dateString) => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString; // Already a Date object
    // Expect YYYY-MM-DD
    const parts = dateString.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day))
        return new Date(year, month, day);
    }
    return null; // Invalid date string
  };
  const handlePreviewQR = (card) => {
    setSelectedCard(card);
    setShowQRPreview(true);
  };

  const handlePrintQR = async (card) => {
    if (!bluetoothRef.current?.isConnected) {
      alert("Please connect to a printer first");
      return;
    }

    try {
      setPrintDisabled(true);
      setTimeout(() => setPrintDisabled(false), 5000);
      if (mode === "bundle") {
        await bluetoothRef.current.printBundleDefectData(card);
      }
      alert("QR code printed successfully!");
    } catch (error) {
      console.error("Print error:", error);
      alert(`Failed to print QR code: ${error.message}`);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRecordsPerPageChange = (e) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  return (
    <div className="p-6 h-full flex flex-col bg-gray-100">
      <div
        className={`bg-white rounded-xl shadow-xl p-4 mb-6 ${
          !showFilters ? "pb-1" : ""
        }`}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base md:text-lg font-semibold text-gray-700 flex items-center">
            <FaFilter className="mr-2 text-indigo-600" />
            {t("defectPrint.filtersTitle", "Filters")}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              type="button" // Specify type for button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-xs md:text-sm text-indigo-600 hover:text-indigo-800 font-medium p-1.5 rounded-md hover:bg-indigo-50 transition-colors" // Styled like DynamicFilterPane toggle
              aria-label={
                showFilters
                  ? t("defectPrint.hideFilters", "Hide Filters")
                  : t("defectPrint.showFilters", "Show Filters")
              }
            >
              {showFilters ? (
                <FaChevronUp size={14} />
              ) : (
                <FaChevronDown size={14} />
              )}
              <span className="ml-1">
                {showFilters
                  ? t("defectPrint.hideFilters", "Hide Filters")
                  : t("defectPrint.showFilters", "Show Filters")}
              </span>
            </button>
            {showFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-1.5 text-gray-800  bg-red-100 hover:text-gary-900 brder rounded-md hover:bg-red-500 transition-colors"
                title={t("defectPrint.clearFilters", "Clear Filters")}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-1 transition-all duration-300 ease-in-out"
          >
            <div className="flex flex-col">
              <label
                htmlFor="filterDate"
                className="text-xs font-medium text-gray-600 mb-1 flex items-center"
              >
                <FaCalendarAlt className="mr-1.5 text-gray-400" />
                {t("filters.date", "Date")}
              </label>
              <DatePicker
                selected={parseDateForPicker(searchDate)}
                onChange={(date) =>
                  setSearchDate(date ? date.toISOString().split("T")[0] : "")
                }
                dateFormat="yyyy-MM-dd"
                className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                id="filterDate"
                placeholderText={t("filters.select_date", "Select date")}
                popperClassName="datepicker-popper-above-header z-50"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="moNoFilter"
                className="text-xs font-medium text-gray-600 mb-1"
              >
                {t("bundle.mono")}
              </label>
              <input
                id="moNoFilter"
                type="text"
                value={searchMoNo}
                onChange={(e) => setSearchMoNo(e.target.value)}
                placeholder={t("bundle.search_mono")}
                list="moNoList"
                className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" // Styled input
              />
              <datalist id="moNoList">
                {moNoOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="packageNoFilter"
                className="text-xs font-medium text-gray-600 mb-1"
              >
                {t("bundle.package_no")}
              </label>
              <input
                id="packageNoFilter" // Added ID for label association
                type="text"
                value={searchPackageNo}
                onChange={(e) => setSearchPackageNo(e.target.value)}
                placeholder={t("defectPrint.search_package")}
                list="packageNoList"
                className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" // Styled input
              />
              <datalist id="packageNoList">
                {packageNoOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="taskNoFilter"
                className="text-xs font-medium text-gray-600 mb-1"
              >
                {t("qc2In.taskNo", "Task No")}
              </label>
              <input
                id="taskNoFilter"
                type="text"
                value={searchTaskNo}
                onChange={(e) => setSearchTaskNo(e.target.value)}
                placeholder={t("filters.enter_task_no", "Task No...")}
                list="taskNoList"
                className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
              <datalist id="taskNoList">
                {taskNoOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            {mode === "bundle" && (
              <div className="flex flex-col">
                <label
                  htmlFor="statusFilter"
                  className="text-xs font-medium text-gray-600 mb-1"
                >
                  {" "}
                  {/* Styled label and added htmlFor */}
                  {t("defectPrint.status")}
                </label>
                <select
                  value={searchStatus}
                  id="statusFilter"
                  onChange={(e) => setSearchStatus(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" // Styled select
                >
                  <option value="both">{t("defectPrint.both", "Both")}</option>
                  <option value="inProgress">
                    {t("defectPrint.in_progress", "In Progress")}
                  </option>
                  <option value="completed">
                    {t("defectPrint.completed", "Completed")}
                  </option>
                </select>
              </div>
            )}
          </form>
        )}
      </div>

      <div className="mb-4 text-sm text-gray-700">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <label className="font-semibold">{t("downDa.record_per")}:</label>
            <select
              value={recordsPerPage}
              onChange={handleRecordsPerPageChange}
              className="p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[50, 100, 200, 500].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            {t("downDa.total_record")}: {totalRecords}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {t("userL.previous")}
          </button>
          <div className="flex items-center gap-2">
            <select
              value={currentPage}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <option key={page} value={page}>
                    Page {page}
                  </option>
                )
              )}
            </select>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(
                  Math.max(0, currentPage - 3),
                  Math.min(totalPages, currentPage + 2)
                )
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md transition duration-200 ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                ))}
            </div>
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {t("userL.next")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : !Array.isArray(defectCards) || defectCards.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No{" "}
          {mode === "repair"
            ? "defect"
            : mode === "garment"
            ? "garment"
            : "bundle"}{" "}
          cards found
        </div>
      ) : (
        <div className="flex-grow overflow-auto bg-white rounded-lg shadow-md">
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead className="bg-gray-200 sticky top-0 z-10">
                <tr>
                  {mode === "bundle" ? (
                    <>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        {t("bundle.package_no")}
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        {t("qc2In.taskNo", "Task No")}
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        {t("qc2In.date", "Date")}
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        {t("defectPrint.status")}
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        {t("bundle.action")}
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        {t("bundle.mono")}
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        {t("bundle.customer_style")}
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        {t("bundle.color")}
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        {t("bundle.size")}
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        {t("defectPrint.checked")}
                      </th>
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        {t("defectPrint.defectsN")}
                      </th>
                      <th className="py-3 px-2 border-b border-gray-300 font-semibold text-sm text-gray-700 break-words">
                        {t("defectPrint.rejectN")}
                      </th>
                      {/* <th className="py-3 px-2 border-b border-gray-300 font-semibold text-sm text-gray-700 break-words">
                        {t("defectPrint.reworking")}
                      </th> */}
                      <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                        {t("preview.defect_details")}
                        <div className="flex justify-between text-xs mt-1 border-t border-gray-300 pt-1">
                          <span className="w-1/6 border-r border-l border-gray-300 font-semibold text-sm text-gray-700">
                            Station
                          </span>
                          <span className="w-1/6 border-r border-gray-300 font-semibold text-sm text-gray-700">
                            Defect name
                          </span>
                          <span className="w-1/6 border-r border-gray-300 font-semibold text-sm text-gray-700">
                            Count
                          </span>
                          <span className="w-1/6 border-r border-gray-300 font-semibold text-sm text-gray-700">
                            Status
                          </span>
                          <span className="w-1/6 border-r border-gray-300 font-semibold text-sm text-gray-700">
                            Repair Date
                          </span>
                          <span className="w-1/6 border-r border-gray-300 font-semibold text-sm text-gray-700">
                            Repair Time
                          </span>
                        </div>
                      </th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody className="overflow-y-auto">
                {mode === "bundle"
                  ? defectCards.map((card) => (
                      <tr
                        key={card.defect_print_id}
                        className="hover:bg-gray-50"
                      >
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.package_no || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.taskNo || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {formatDateForDisplay(card.inspection_date) || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-white text-sm ${
                              card.totalRejectGarments > 0
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                          >
                            {card.totalRejectGarments > 0
                              ? "In Progress"
                              : "Completed"}
                          </span>
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          <button
                            onClick={() => handlePreviewQR(card)}
                            className="text-blue-500 hover:text-blue-700 mr-2"
                          >
                            <Eye className="inline" />
                          </button>
                          <button
                            onClick={() => handlePrintQR(card)}
                            disabled={printDisabled}
                            className={`text-blue-500 hover:text-blue-700 ${
                              printDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <Printer className="inline" />
                          </button>
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.moNo || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.custStyle || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.color || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.size || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.checkedQty || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.defectQty || "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.rejectGarmentsLength || "N/A"}
                        </td>
                        {/* <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {card.totalRejectGarments === 0
                            ? "0"
                            : card.totalRejectGarments || "N/A"}
                        </td> */}
                        <td className="py-2 px-4 border-b border-gray-200 text-sm">
                          {repairTrackingDetails[card.defect_print_id] ===
                          undefined ? (
                            <div>Loading...</div>
                          ) : repairTrackingDetails[card.defect_print_id] ===
                            null ? (
                            <div>Error loading details</div>
                          ) : repairTrackingDetails[card.defect_print_id]
                              .garments &&
                            repairTrackingDetails[card.defect_print_id].garments
                              .length > 0 ? (
                            repairTrackingDetails[
                              card.defect_print_id
                            ].garments.map((garment, garmentIndex) =>
                              garment.defects.map((defect, defectIndex) => (
                                <div
                                  key={`${garmentIndex}-${defectIndex}`}
                                  className={`flex justify-between text-xs mb-1 py-2 px-4 rounded-md 
                                      ${
                                        defect.status === "OK"
                                          ? "bg-green-100" // Light Green background
                                          : defect.status === "Not Repaired"
                                          ? "bg-yellow-100" // Light Yellow background
                                          : "bg-red-100" // Light Red background
                                      }`}
                                >
                                  <span className="w-1/6 py-2 px-4 border-r border-l border-gray-200 text-sm">
                                    {defect.repair || "N/A"}
                                  </span>
                                  <span className="w-1/6 py-2 px-4 border-r border-gray-200 text-sm">
                                    {defect.name || "N/A"}
                                  </span>
                                  <span className="w-1/6 py-2 px-4 border-r border-gray-200 text-sm text-center">
                                    {defect.count || "N/A"}
                                  </span>
                                  <span
                                    className={`w-1/6 py-2 px-4 inline-block items-center text-xs font-medium text-center rounded-md ${
                                      defect.status === "OK"
                                        ? "bg-green-400"
                                        : defect.status === "Not Repaired"
                                        ? "bg-yellow-400"
                                        : "bg-red-400"
                                    }`}
                                  >
                                    {defect.status || "N/A"}
                                  </span>
                                  <span className="w-1/6 py-2 px-4 border-r border-gray-200 text-sm">
                                    {defect.repair_date || "N/A"}
                                  </span>
                                  <span className="w-1/6 py-2 px-4 border-r border-gray-200 text-sm">
                                    {formatTime12Hour(defect.repair_time) ||
                                      "N/A"}
                                  </span>
                                </div>
                              ))
                            )
                          ) : (
                            <div>No details</div>
                          )}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <QRCodePreview
        isOpen={showQRPreview}
        onClose={() => setShowQRPreview(false)}
        qrData={selectedCard ? [selectedCard] : []}
        onPrint={handlePrintQR}
        mode={mode === "repair" ? "inspection" : "bundle"}
      />
    </div>
  );
};

export default DefectPrint;
