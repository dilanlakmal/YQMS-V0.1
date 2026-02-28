import React from "react";
import { RotateCw, RefreshCw, Search, Calendar, X, ChevronLeft, ChevronRight, ClipboardList, Bell, CheckCircle, Copy } from "lucide-react";
import Select from "react-select";
import { DatePicker as AntDatePicker } from "antd";
import dayjs from "dayjs";
import { QRCodeCanvas } from "qrcode.react";
import { API_BASE_URL, QR_CODE_BASE_URL } from "../../../../config.js";
import ReportCard from "./ReportCard";
import { getReportTypeOptions } from "./constants/reportTypes";
import { getQRCodeBaseURL } from "./helpers/qrHelpers";
import showToast from "../../../utils/toast.js";
import { useAuth } from "../../authentication/AuthContext";
import {
  useWashingFilterStore,
  useWashingReportsStore,
  useOrderDataStore,
  useAssignControlStore,
  computeUserRoles,
  useFormStore,
} from "./stores";

const ReportsList = ({
  tab, // "standard" | "warehouse"
  onPrintPDF,
  onDownloadPDF,
  onExportExcel,
  onEdit,
  onDelete,
  onReject,
  openRejectModal,
  onAcceptReceived,
  savedImageRotations,
  openImageViewer,
  onEditInitialImages,
  onEditReceivedImages,
  onEditCompletionImages,
  restrictDeleteStatuses = [],
  restrictEditStatuses = [],
  enableRoleLocking,
}) => {
  const { user } = useAuth();
  const { factories } = useOrderDataStore();
  const { users, causeAssignHistory } = useAssignControlStore();
  const { isAdminUser, isWarehouseUser } = computeUserRoles(user, causeAssignHistory);
  const { activeTab, setActiveTab } = useFormStore();
  // Read filter state directly from store using the tab key
  const { [tab]: filters, setFilter, setPage } = useWashingFilterStore();
  const filterStartDate = filters.startDate;
  const filterEndDate = filters.endDate;
  const filterSearch = filters.search;
  const filterColor = filters.color;
  const filterFactory = filters.factory;
  const filterStatus = filters.status;
  const filterPage = filters.page;
  const filterLimit = filters.limit;
  const filterReportType = filters.reportType;
  const filterIdOrQr = filters.idOrQr ?? "";
  const setFilterStartDate = (v) => setFilter(tab, "startDate", v);
  const setFilterEndDate = (v) => setFilter(tab, "endDate", v);
  const setFilterSearch = (v) => setFilter(tab, "search", v);
  const setFilterColor = (v) => setFilter(tab, "color", v);
  const setFilterFactory = (v) => setFilter(tab, "factory", v);
  const setFilterStatus = (v) => setFilter(tab, "status", v);
  const setFilterPage = (v) => setPage(tab, v);
  const setFilterLimit = (v) => setFilter(tab, "limit", v);
  const setFilterReportType = (v) => setFilter(tab, "reportType", v);
  const setFilterIdOrQr = (v) => setFilter(tab, "idOrQr", v);

  // Read report data directly from store
  const {
    [tab]: { reports, isLoading: isLoadingReports, expandedReports, printingReportId, pagination },
    fetchReports: _fetchReports,
    toggleReport: _toggleReport,
  } = useWashingReportsStore();

  const onRefresh = React.useCallback(() => _fetchReports(tab, filters), [_fetchReports, tab, filters]);
  const onToggleReport = React.useCallback((id) => _toggleReport(tab, id), [_toggleReport, tab]);
  const [notificationReport, setNotificationReport] = React.useState(null);
  const [easyScanQRPopupId, setEasyScanQRPopupId] = React.useState(null);

  const storageKey = React.useMemo(
    () => (user?.emp_id || user?.id ? `yqms_washing_notification_read_${user.emp_id || user.id}` : null),
    [user?.emp_id, user?.id]
  );
  const [readNotificationReportIds, setReadNotificationReportIds] = React.useState(() => new Set());

  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const arr = JSON.parse(raw);
      setReadNotificationReportIds(new Set(Array.isArray(arr) ? arr : []));
    } catch {
      // ignore
    }
  }, [storageKey]);

  const markNotificationRead = React.useCallback((reportId) => {
    setReadNotificationReportIds((prev) => {
      const next = new Set(prev).add(reportId);
      if (storageKey && typeof localStorage !== "undefined") {
        try {
          const arr = [...next];
          const max = 200;
          const toStore = arr.length > max ? arr.slice(-max) : arr;
          localStorage.setItem(storageKey, JSON.stringify(toStore));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, [storageKey]);

  const [styleSuggestions, setStyleSuggestions] = React.useState([]);
  const [colorSuggestions, setColorSuggestions] = React.useState([]);
  const [isLoadingStyles, setIsLoadingStyles] = React.useState(false);
  const [isLoadingColors, setIsLoadingColors] = React.useState(false);

  // Separate input values from filter values to prevent filtering while typing
  const [styleInputValue, setStyleInputValue] = React.useState("");
  const [colorInputValue, setColorInputValue] = React.useState("");

  // Fetch style suggestions
  const fetchStyleSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setStyleSuggestions([]);
      return;
    }

    setIsLoadingStyles(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/report-washing/autocomplete/styles?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStyleSuggestions(result.data.map(s => ({ value: s, label: s })));
        }
      }
    } catch (error) {
      console.error("Error fetching style suggestions:", error);
    } finally {
      setIsLoadingStyles(false);
    }
  };

  // Fetch color suggestions
  const fetchColorSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      setColorSuggestions([]);
      return;
    }

    setIsLoadingColors(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/report-washing/autocomplete/colors?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setColorSuggestions(result.data.map(c => ({ value: c, label: c })));
        }
      }
    } catch (error) {
      console.error("Error fetching color suggestions:", error); cur
    } finally {
      setIsLoadingColors(false);
    }
  };

  // Debounce timers
  const styleTimerRef = React.useRef(null);
  const colorTimerRef = React.useRef(null);

  const handleStyleInputChange = (inputValue) => {
    setStyleInputValue(inputValue);
    if (styleTimerRef.current) clearTimeout(styleTimerRef.current);
    styleTimerRef.current = setTimeout(() => {
      fetchStyleSuggestions(inputValue);
    }, 300);
  };

  const handleColorInputChange = (inputValue) => {
    setColorInputValue(inputValue);
    if (colorTimerRef.current) clearTimeout(colorTimerRef.current);
    colorTimerRef.current = setTimeout(() => {
      fetchColorSuggestions(inputValue);
    }, 300);
  };

  // Custom styles for react-select to handle dark mode visibility
  // Custom styles for react-select to handle dark mode visibility
  const customStyles = {
    control: (base, state) => ({
      ...base,
      background: "white",
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      color: "black",
      minHeight: "42px",
      cursor: "pointer",
      "&::placeholder": {
        color: "gray"
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#e5e7eb" : "white", // Gray-200 on hover, white otherwise
      color: "black", // Force black text
      cursor: "pointer",
      "&:active": {
        backgroundColor: "#d1d5db" // Gray-300 on click
      }
    }),
    dropdownIndicator: (base) => ({
      ...base,
      cursor: "pointer",
    }),
    clearIndicator: (base) => ({
      ...base,
      cursor: "pointer",
    }),
    singleValue: (base) => ({
      ...base,
      color: "black",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "white",
      zIndex: 50
    }),
    input: (base) => ({
      ...base,
      color: "black"
    })
  };

  const factoryOptions = [
    { value: "", label: "All Factories" },
    ...(factories && factories.length > 0
      ? factories.map(f => ({ value: f.name, label: f.name }))
      : [
        { value: "Newy", label: "Newy" },
        { value: "Newy2", label: "Newy2" },
        { value: "Vina", label: "Vina" },
        { value: "Vina2", label: "Vina2" },
        { value: "Bautex", label: "Bautex" },
        { value: "Bautex2", label: "Bautex2" },
        { value: "JC", label: "JC" }
      ]
    )
  ];

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          {/* <ClipboardList className="w-6 h-6 text-blue-600" /> */}
          {tab === "easy_scan"
            ? "Userwarehouse Easy Scan"
            : activeTab === "warehouse_reports"
              ? "Warehouse Report"
              : "Reports"}
          {isLoadingReports && <RotateCw className="w-5 h-5 animate-spin text-blue-600" />}
        </h2>

        <div className="flex items-center rounded-lg h-10 px-1">
          {/* Page Size Select */}
          <div className="w-[70px]">
            <Select
              value={{ value: filterLimit, label: filterLimit }}
              onChange={(option) => setFilterLimit && setFilterLimit(option.value)}
              options={[
                { value: 10, label: "10" },
                { value: 25, label: "25" },
                { value: 50, label: "50" },
                { value: 75, label: "75" },
                { value: 100, label: "100" }
              ]}
              isSearchable={false}
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "30px",
                  height: "30px",
                  background: "transparent",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  boxShadow: "none",
                  cursor: "pointer",
                  "&:hover": { borderColor: "#d1d5db" }
                }),
                valueContainer: (base) => ({ ...base, padding: "0 8px" }),
                indicatorsContainer: (base) => ({ ...base, height: "30px" }),
                dropdownIndicator: (base) => ({ ...base, padding: "2px", color: "#94a3b8" }),
                indicatorSeparator: () => ({ display: "none" }),
                singleValue: (base) => ({ ...base, color: "#1f2937", fontWeight: "500", fontSize: "14px" }),
                menuPortal: base => ({ ...base, zIndex: 9999 }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#f3f4f6" : "white",
                  color: state.isSelected ? "white" : "#1f2937",
                  fontSize: "13px",
                  cursor: "pointer",
                  "&:active": {
                    backgroundColor: state.isSelected ? "#3b82f6" : "#e5e7eb"
                  }
                })
              }}
              className="text-sm"
              classNamePrefix="react-select"
            />
          </div>

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

          {/* Range Indicator */}
          {pagination && (
            <div className="text-sm font-semibold text-slate-700 dark:text-gray-200 whitespace-nowrap px-2">
              {Math.min((pagination.currentPage - 1) * pagination.limit + 1, pagination.totalRecords)} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of {pagination.totalRecords}
            </div>
          )}

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

          <div className="flex items-center">
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoadingReports}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 disabled:opacity-30 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingReports ? "animate-spin" : ""}`} />
            </button>

            {/* Pagination Controls */}
            <button
              onClick={() => setFilterPage && setFilterPage(prev => Math.max(1, prev - 1))}
              disabled={!pagination || pagination.currentPage === 1 || isLoadingReports}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-400 disabled:opacity-30 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setFilterPage && setFilterPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={!pagination || pagination.currentPage === pagination.totalPages || isLoadingReports}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 disabled:opacity-30 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {tab === "easy_scan" ? (
        <div className="mb-6 flex flex-col sm:flex-row gap-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-200/60 dark:border-amber-700/40">

          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">ID / QR</label>
              <input
                type="text"
                value={filterIdOrQr}
                onChange={(e) => setFilterIdOrQr(e.target.value)}
                placeholder="Scan or enter report ID / QR..."
                className="w-full px-4 py-2.5 rounded-lg border-2 border-amber-300 dark:border-amber-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Style</label>
              <Select
                value={filterSearch ? { value: filterSearch, label: filterSearch } : null}
                onChange={(option) => setFilterSearch && setFilterSearch(option ? option.value : "")}
                onInputChange={handleStyleInputChange}
                options={styleSuggestions}
                placeholder="Search Style..."
                isClearable
                isLoading={isLoadingStyles}
                styles={customStyles}
                className="text-sm"
                noOptionsMessage={() => "Type to search..."}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
          {/* Style Search with Autocomplete */}
          <div className="relative">
            <Select
              value={filterSearch ? { value: filterSearch, label: filterSearch } : null}
              onChange={(option) => setFilterSearch && setFilterSearch(option ? option.value : "")}
              onInputChange={handleStyleInputChange}
              options={styleSuggestions}
              placeholder="Search Style..."
              isClearable
              isLoading={isLoadingStyles}
              styles={customStyles}
              className="text-sm"
              noOptionsMessage={() => "Type to search..."}
            />
          </div>

          {/* Color Search with Autocomplete */}
          <div className="relative">
            <Select
              value={filterColor ? { value: filterColor, label: filterColor } : null}
              onChange={(option) => setFilterColor && setFilterColor(option ? option.value : "")}
              onInputChange={handleColorInputChange}
              options={colorSuggestions}
              placeholder="Filter Color..."
              isClearable
              isLoading={isLoadingColors}
              styles={customStyles}
              className="text-sm"
              noOptionsMessage={() => "Type to search..."}
            />
          </div>

          {/* Report Type Filter */}
          <div>
            <Select
              value={filterReportType ? { value: filterReportType, label: filterReportType } : null}
              onChange={(option) => setFilterReportType && setFilterReportType(option ? option.value : "")}
              options={[
                { value: "", label: "All Report Types" },
                ...getReportTypeOptions()
              ]}
              placeholder="Filter Report Type..."
              isClearable
              isSearchable={false}
              styles={customStyles}
              className="text-sm"
            />
          </div>

          {/* Factory */}
          <div>
            <Select
              value={filterFactory ? { value: filterFactory, label: filterFactory } : null}
              onChange={(selectedOption) => setFilterFactory && setFilterFactory(selectedOption ? selectedOption.value : "")}
              options={[
                { value: "", label: "All Factories" },
                ...(factories && factories.length > 0
                  ? factories.map(f => ({ value: f.name || f.factory, label: f.name || f.factory }))
                  : [
                    { value: "Newy", label: "Newy" },
                    { value: "Newy2", label: "Newy2" },
                    { value: "Vina", label: "Vina" },
                    { value: "Vina2", label: "Vina2" },
                    { value: "Bautex", label: "Bautex" },
                    { value: "Bautex2", label: "Bautex2" },
                    { value: "JC", label: "JC" }
                  ]
                )
              ]}
              placeholder="Filter Factory..."
              isSearchable={true}
              isClearable={true}
              className="react-select-container text-sm"
              classNamePrefix="react-select"
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                  minHeight: '42px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: '#3b82f6',
                  },
                }),
                menu: (baseStyles) => ({
                  ...baseStyles,
                  zIndex: 9999,
                }),
                option: (baseStyles, state) => ({
                  ...baseStyles,
                  backgroundColor: state.isSelected
                    ? '#3b82f6'
                    : state.isFocused
                      ? '#eff6ff'
                      : '#ffffff',
                  color: state.isSelected ? '#ffffff' : '#1f2937',
                  cursor: 'pointer',
                  '&:active': {
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                  },
                }),
                indicatorSeparator: () => ({
                  display: 'none',
                }),
                dropdownIndicator: (baseStyles) => ({
                  ...baseStyles,
                  cursor: 'pointer',
                }),
                clearIndicator: (baseStyles) => ({
                  ...baseStyles,
                  cursor: 'pointer',
                }),
                input: (base) => ({
                  ...base,
                  color: '#1f2937'
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#1f2937'
                })
              }}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: '#3b82f6',
                  primary25: '#eff6ff',
                  primary50: '#dbeafe',
                  primary75: '#93c5fd',
                },
              })}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={filterStatus ? { value: filterStatus, label: filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1) } : null}
              onChange={(option) => setFilterStatus && setFilterStatus(option ? option.value : "")}
              options={[
                { value: "", label: "All Status" },
                { value: "pending", label: "Pending" },
                { value: "received", label: "Received" },
                { value: "completed", label: "Completed" },
                { value: "rejected", label: "Rejected" }
              ]}
              placeholder="Filter Status..."
              isClearable
              isSearchable={false}
              styles={customStyles}
              className="text-sm"
            />
          </div>

          {/* Date Range Picker */}
          <div className="relative group sm:col-span-2 md:col-span-2 lg:col-span-2 ant-datepicker-container">
            <AntDatePicker.RangePicker
              value={filterStartDate && filterEndDate ? [dayjs(filterStartDate), dayjs(filterEndDate)] : null}
              onChange={(dates, dateStrings) => {
                if (dates && dates[0] && dates[1]) {
                  setFilterStartDate && setFilterStartDate(dates[0].format('YYYY-MM-DD'));
                  setFilterEndDate && setFilterEndDate(dates[1].format('YYYY-MM-DD'));
                } else {
                  setFilterStartDate && setFilterStartDate('');
                  setFilterEndDate && setFilterEndDate('');
                }
              }}
              format="MM/DD/YYYY"
              placeholder={["Start Date", "End Date"]}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white h-[42px]"
              suffixIcon={null}
              allowClear
              inputReadOnly={true}
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10" />
          </div>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>{tab === "easy_scan" ? "No non-completed reports." : "No reports submitted yet."}</p>
          {/* <p className="text-sm mt-2">
            Go to the <button onClick={() => setActiveTab("form")} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">New Report</button> tab to submit a report.
          </p> */}
        </div>
      ) : tab === "easy_scan" ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-amber-200/60 dark:border-amber-700/40 bg-white dark:bg-gray-800 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 whitespace-nowrap">
              <thead className="bg-amber-50 dark:bg-amber-900/20">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider w-0">
                    Scan
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                    ID (QR)
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                    Style
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {reports.map((report) => {
                  const reportId = report._id || report.id;
                  const idQr = report.qrId || reportId;
                  const style = report.ymStyle || report.buyerStyle || "—";
                  const status = report.status || "pending";
                  const scanUrl = `${getQRCodeBaseURL(QR_CODE_BASE_URL)}/Launch-washing-machine-test?scan=${reportId}`;
                  const statusClass =
                    status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : status === "received"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : status === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
                  return (
                    <tr key={reportId} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                      <td className="px-3 py-2 align-middle">
                        <button
                          type="button"
                          onClick={() => setEasyScanQRPopupId(reportId)}
                          className="inline-flex items-center justify-center rounded border border-gray-200 dark:border-gray-600 bg-white p-1 cursor-pointer hover:border-amber-400 hover:ring-2 hover:ring-amber-200 dark:hover:ring-amber-800 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
                          title="Click to show large QR for scanning"
                        >
                          <QRCodeCanvas value={scanUrl} size={56} level="M" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        <span className="inline-flex items-center gap-2">
                          <span>{String(idQr)}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(String(idQr));
                                showToast.success("ID copied to clipboard");
                              } catch {
                                showToast.error("Could not copy ID");
                              }
                            }}
                            className="p-1 rounded text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:text-gray-400 dark:hover:text-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                            title="Copy ID"
                          >
                            <Copy size={16} />
                          </button>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                        {style}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${statusClass}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-4">
            {reports.map((report) => {
              const reportId = report._id || report.id;
              const idQr = report.qrId || reportId;
              const style = report.ymStyle || report.buyerStyle || "—";
              const status = report.status || "pending";
              const scanUrl = `${getQRCodeBaseURL(QR_CODE_BASE_URL)}/Launch-washing-machine-test?scan=${reportId}`;
              const statusClass =
                status === "completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : status === "received"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : status === "rejected"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

              return (
                <div key={reportId} className="bg-white dark:bg-gray-800 border border-amber-200/60 dark:border-amber-700/40 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-3">
                    <div className="flex flex-col flex-1 pr-3">
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">ID (QR)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-gray-900 dark:text-white break-all">{String(idQr)}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(String(idQr));
                              showToast.success("ID copied to clipboard");
                            } catch {
                              showToast.error("Could not copy ID");
                            }
                          }}
                          className="p-1 rounded bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shrink-0"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded shrink-0 ${statusClass}`}>
                      {status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30 rounded-lg p-1.5">
                    <div className="flex flex-col pl-2">
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-0.5">Style</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{style}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEasyScanQRPopupId(reportId)}
                      className="inline-flex items-center justify-center rounded border border-gray-200 dark:border-gray-600 bg-white p-1 shadow-sm cursor-pointer hover:border-amber-400 hover:ring-2 hover:ring-amber-200 transition-all ml-2"
                      title="Click to show large QR for scanning"
                    >
                      <QRCodeCanvas value={scanUrl} size={50} level="M" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const reportId = report._id || report.id;
            const empId = user?.emp_id || user?.id;
            const isReporter = empId && (String(report.reporter_emp_id) === String(empId));
            const notYetAssignedReport = !report.receiver_emp_id && (report.status === "pending" || report.status === "" || !report.status);
            const reportHasColorEdit = !!(report.colorEditedByWarehouseAt && report.colorEditedByWarehouseBy);
            const reportHasAdminEdit = !!report.editedByAdminAt || !!(report.notificationHistory?.length && report.notificationHistory.some((e) => e.type === "ADMIN_EDIT"));
            const hasWarehouseNotification = reportHasColorEdit && (isReporter || isAdminUser);
            const hasAdminNotification = reportHasAdminEdit && (isReporter || isAdminUser || isWarehouseUser);
            const hasNotification = hasWarehouseNotification || hasAdminNotification;
            const notificationParts = [];
            if (notYetAssignedReport) {
              if (isReporter) notificationParts.push("Not yet assigned by warehouse.");
              else if (isWarehouseUser || isAdminUser) notificationParts.push("Not yet assigned – scan QR to receive.");
            }
            if (reportHasColorEdit && (isReporter || isAdminUser)) {
              const name = report.colorEditedByWarehouseName || report.colorEditedByWarehouseBy || "Warehouse user";
              const prevN = (report.colorUncheckedByWarehouse && report.colorUncheckedByWarehouse.length) || 0;
              const currentN = (report.color && report.color.length) || 0;
              const totalPrev = prevN + currentN;
              const removed = report.colorUncheckedByWarehouse?.length ? ` Removed: ${report.colorUncheckedByWarehouse.join(", ")}.` : "";
              const msg = isReporter
                ? `${name} edited colors: you sent ${totalPrev} color(s), now ${currentN}.${removed}`
                : `${name} edited colors: sent ${totalPrev} → now ${currentN}.${removed}`;
              notificationParts.push(msg);
            }
            if (reportHasAdminEdit) {
              const name = report.editedByAdminName || report.editedByAdminBy || "Admin";
              notificationParts.push(`Admin edit by ${name}.`);
            }
            const notificationTitle = hasNotification ? notificationParts.join(" ") : "Notification";

            // Show notification button for submitter/admin only; hide for warehouse user
            const showNotificationButton = !isWarehouseUser;

            return (
              <ReportCard
                key={reportId}
                report={report}
                isExpanded={expandedReports.has(reportId)}
                onToggle={onToggleReport}
                onPrintPDF={onPrintPDF}
                onDownloadPDF={onDownloadPDF}
                onExportExcel={onExportExcel}
                onEdit={onEdit}
                onDelete={onDelete}
                onReject={onReject}
                openRejectModal={openRejectModal}
                onAcceptReceived={onAcceptReceived}
                printingReportId={printingReportId}
                savedImageRotations={savedImageRotations}
                openImageViewer={openImageViewer}
                onEditInitialImages={onEditInitialImages}
                onEditReceivedImages={onEditReceivedImages}
                onEditCompletionImages={onEditCompletionImages}
                // onEditCompletionImages={onEditCompletionImages}
                restrictDeleteStatuses={restrictDeleteStatuses}
                restrictEditStatuses={restrictEditStatuses}
                enableRoleLocking={enableRoleLocking}
                hasNotification={hasNotification}
                hasWarehouseNotification={hasWarehouseNotification}
                hasAdminNotification={hasAdminNotification}
                notificationRead={readNotificationReportIds.has(reportId)}
                showNotificationButton={showNotificationButton}
                notificationTitle={notificationTitle}
                onNotificationClick={() => {
                  setNotificationReport(report);
                  markNotificationRead(reportId);
                }}
                isAdminUser={isAdminUser}
                isWarehouseUser={isWarehouseUser}
                users={users}
              />
            );
          })}

        </div>
      )}

      {/* Report notification detail modal – quick-scan layout, no "not yet assigned" text */}
      {notificationReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setNotificationReport(null)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-5 border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-400">
              <Bell className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report notification</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Style:</span>{" "}
              <span className="font-semibold uppercase tracking-wide text-gray-800 dark:text-white">{notificationReport.ymStyle || "—"}</span>
            </p>

            {(notificationReport.notificationHistory?.length > 0 || notificationReport.colorEditedByWarehouseAt || notificationReport.editedByAdminAt) ? (
              <div className="space-y-3 text-sm">
                {/* Show full history (newest first); fallback to single latest for older reports */}
                {(notificationReport.notificationHistory?.length > 0
                  ? [...notificationReport.notificationHistory].reverse()
                  : notificationReport.editedByAdminAt
                    ? [{
                      type: "ADMIN_EDIT",
                      at: notificationReport.editedByAdminAt,
                      userName: notificationReport.editedByAdminName,
                      userId: notificationReport.editedByAdminBy,
                      previousColorCount: notificationReport.color?.length || 0,
                      newColorCount: notificationReport.color?.length || 0,
                      rejectedColors: [],
                    }]
                    : [{
                      type: "COLOR_UPDATE",
                      at: notificationReport.colorEditedByWarehouseAt,
                      userName: notificationReport.colorEditedByWarehouseName,
                      userId: notificationReport.colorEditedByWarehouseBy,
                      previousColorCount: (notificationReport.colorUncheckedByWarehouse?.length || 0) + (notificationReport.color?.length || 0),
                      newColorCount: notificationReport.color?.length || 0,
                      rejectedColors: notificationReport.colorUncheckedByWarehouse || [],
                    }]
                ).map((entry, idx) => {
                  const isAdminEdit = entry.type === "ADMIN_EDIT";
                  const boxClass = isAdminEdit
                    ? "rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 p-3 space-y-2"
                    : "rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3 space-y-2";
                  const titleClass = isAdminEdit
                    ? "font-semibold text-violet-800 dark:text-violet-200 text-xs uppercase tracking-wide"
                    : "font-semibold text-amber-800 dark:text-amber-200 text-xs uppercase tracking-wide";
                  return (
                    <div key={entry.at ? new Date(entry.at).getTime() : idx} className={boxClass}>
                      <p className={titleClass}>
                        {entry.type === "COLOR_UPDATE" ? "Color update" : entry.type === "ADMIN_EDIT" ? "Admin edit" : entry.type || "Update"}
                      </p>
                      <div className="grid gap-1.5">
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">User:</span>{" "}
                          {entry.userName || entry.userId || (isAdminEdit ? "Admin" : "Warehouse")}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">When:</span>{" "}
                          {entry.at ? new Date(entry.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", hour12: true }) : "—"}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">Colors:</span>{" "}
                          You sent {entry.previousColorCount ?? ((notificationReport.colorUncheckedByWarehouse?.length || 0) + (notificationReport.color?.length || 0))} → now {entry.newColorCount ?? (notificationReport.color?.length || 0)}
                        </p>
                        {(entry.rejectedColors?.length > 0) && (
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">RejectColor:</span>{" "}
                            <span className="text-amber-700 dark:text-amber-300 font-medium">{entry.rejectedColors.join(", ")}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 text-center">
                <CheckCircle className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" strokeWidth={1.5} />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No new notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                  {notificationReport.status ? String(notificationReport.status).charAt(0).toUpperCase() + String(notificationReport.status).slice(1) : ""}
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setNotificationReport(null)}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Easy Scan: large QR popup for scanning */}
      {tab === "easy_scan" && easyScanQRPopupId && (() => {
        const report = reports.find((r) => (r._id || r.id) === easyScanQRPopupId);
        if (!report) return null;

        const reportId = report._id || report.id;
        const scanUrl = `${getQRCodeBaseURL(QR_CODE_BASE_URL)}/Launch-washing-machine-test?scan=${reportId}`;

        const dateStr = report.createdAt || report.reportDate
          ? new Date(report.createdAt || report.reportDate).toLocaleDateString("en-GB")
          : "N/A";
        const styleStr = report.ymStyle || "N/A";
        const colorStr = Array.isArray(report.color)
          ? report.color.join(", ")
          : (report.color || "N/A");
        const sizeStr = Array.isArray(report.size) ? report.size.join(", ") : (report.size || "N/A");
        const qtyStr = report.qty || "N/A";
        const buyerStyleStr = report.buyerStyle || "N/A";
        const reportTypeStr = report.reportType || "Garment Wash Report";

        return (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-2 bg-black/60 overflow-y-auto"
            onClick={() => setEasyScanQRPopupId(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Scan QR code"
          >
            <div
              className="bg-white dark:bg-gray-900 shadow-2xl relative overflow-hidden flex flex-col my-auto"
              style={{ width: "100%", maxWidth: "340px", borderRadius: "8px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setEasyScanQRPopupId(null)}
                className="absolute top-1.5 right-1.5 z-10 p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>

              {/* Blue Header */}
              <div className="bg-[#2563eb] text-center pt-4 pb-3 px-3">
                <h2 className="text-white text-base font-bold tracking-wide uppercase m-0 leading-tight">
                  Washing Machine Test
                </h2>
                <h3 className="text-white/90 text-[11px] font-light mt-0.5 uppercase tracking-wider m-0">
                  Quality Report
                </h3>
              </div>

              {/* Content Body */}
              <div className="px-5 py-3 flex-1 flex flex-col bg-white dark:bg-gray-900">

                {/* ID Section */}
                <div className="text-center mb-3">
                  <h1 className="text-lg sm:text-xl font-extrabold text-[#111827] dark:text-white m-0 tracking-tight break-all">
                    {reportId}
                  </h1>
                  <p className="text-[#6b7280] dark:text-gray-400 text-[10px] font-medium mt-0.5 uppercase tracking-[0.15em]">
                    Report ID
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-1 rounded border border-gray-100 dark:border-gray-800">
                    <QRCodeCanvas value={scanUrl} size={120} level="M" />
                  </div>
                </div>

                {/* Details List */}
                <div className="flex flex-col text-xs border-t border-gray-100 dark:border-gray-800 mb-1">
                  {[
                    { label: "Date:", value: dateStr },
                    { label: "Style:", value: styleStr },
                    { label: "Color:", value: colorStr },
                    { label: "Size:", value: sizeStr },
                    { label: "Qty:", value: qtyStr },
                    { label: "Buyer Style:", value: buyerStyleStr },
                    { label: "Report Type:", value: reportTypeStr },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex border-b border-gray-100 dark:border-gray-800 py-1.5"
                    >
                      <div className="w-[35%] text-gray-500 dark:text-gray-400 font-bold">
                        {row.label}
                      </div>
                      <div className="w-[65%] text-gray-900 dark:text-gray-100 font-bold break-words pr-1">
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Footer */}
              <div className="bg-white dark:bg-gray-900 pb-3 pt-0 text-center border-t-0">
                <p className="text-gray-400 dark:text-gray-500 italic text-[10px]">
                  Generated by YQMS System
                </p>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ReportsList;

