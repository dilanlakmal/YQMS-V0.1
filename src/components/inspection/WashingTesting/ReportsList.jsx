import React from "react";
import { RotateCw, RefreshCw, Search, Calendar, X, ChevronLeft, ChevronRight, ClipboardList, Bell, CheckCircle } from "lucide-react";
import Select from "react-select";
import { DatePicker as AntDatePicker } from "antd";
import dayjs from "dayjs";
import { API_BASE_URL } from "../../../../config.js";
import ReportCard from "./ReportCard";
import { getReportTypeOptions } from "./constants/reportTypes";
import { useAuth } from "../../authentication/AuthContext";
import {
  useWashingFilterStore,
  useWashingReportsStore,
  useOrderDataStore,
  useAssignControlStore,
  computeUserRoles,
  useFormStore,
} from "../../../stores/washing";

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
  const setFilterStartDate = (v) => setFilter(tab, "startDate", v);
  const setFilterEndDate = (v) => setFilter(tab, "endDate", v);
  const setFilterSearch = (v) => setFilter(tab, "search", v);
  const setFilterColor = (v) => setFilter(tab, "color", v);
  const setFilterFactory = (v) => setFilter(tab, "factory", v);
  const setFilterStatus = (v) => setFilter(tab, "status", v);
  const setFilterPage = (v) => setPage(tab, v);
  const setFilterLimit = (v) => setFilter(tab, "limit", v);
  const setFilterReportType = (v) => setFilter(tab, "reportType", v);

  // Read report data directly from store
  const {
    [tab]: { reports, isLoading: isLoadingReports, expandedReports, printingReportId, pagination },
    fetchReports: _fetchReports,
    toggleReport: _toggleReport,
  } = useWashingReportsStore();

  const onRefresh = React.useCallback(() => _fetchReports(tab, filters), [_fetchReports, tab, filters]);
  const onToggleReport = React.useCallback((id) => _toggleReport(tab, id), [_toggleReport, tab]);
  const [notificationReport, setNotificationReport] = React.useState(null);

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
      console.error("Error fetching color suggestions:", error);cur
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
          {activeTab === "warehouse_reports" ? "Warehouse Report" : "Reports"}
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

      {reports.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No reports submitted yet.</p>
          <p className="text-sm mt-2">
            Go to the <button onClick={() => setActiveTab("form")} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">New Report</button> tab to submit a report.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const reportId = report._id || report.id;
            const empId = user?.emp_id || user?.id;
            const isReporter = empId && (String(report.reporter_emp_id) === String(empId));
            const notYetAssignedReport = !report.receiver_emp_id && (report.status === "pending" || report.status === "" || !report.status);
            const reportHasColorEdit = !!(report.colorEditedByWarehouseAt && report.colorEditedByWarehouseBy);
            // Reporter or admin can see alert when warehouse edited colors
            const hasNotification = reportHasColorEdit && (isReporter || isAdminUser);
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

            {notificationReport.colorEditedByWarehouseAt ? (
              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3 space-y-2">
                  <p className="font-semibold text-amber-800 dark:text-amber-200 text-xs uppercase tracking-wide">Color update</p>
                  <div className="grid gap-1.5">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">User:</span>{" "}
                      {notificationReport.colorEditedByWarehouseName || notificationReport.colorEditedByWarehouseBy || "Warehouse"}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">When:</span>{" "}
                      {new Date(notificationReport.colorEditedByWarehouseAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", hour12: true })}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Colors:</span>{" "}
                      You sent {(notificationReport.colorUncheckedByWarehouse?.length || 0) + (notificationReport.color?.length || 0)} → now {notificationReport.color?.length || 0}
                    </p>
                    {notificationReport.colorUncheckedByWarehouse?.length > 0 && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">RejectColor:</span>{" "}
                        <span className="text-amber-700 dark:text-amber-300 font-medium">{notificationReport.colorUncheckedByWarehouse.join(", ")}</span>
                      </p>
                    )}
                  </div>
                </div>
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
    </div>
  );
};

export default ReportsList;

