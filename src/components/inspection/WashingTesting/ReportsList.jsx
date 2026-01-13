import React from "react";
import { RotateCw, RefreshCw, Search, Calendar, X, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config.js";
import ReportCard from "./ReportCard";

const ReportsList = ({
  reports,
  isLoadingReports,
  onRefresh,
  expandedReports,
  onToggleReport,
  onPrintPDF,
  onDownloadPDF,
  onExportExcel,
  onEdit,
  onDelete,
  onShowQRCode,
  printingReportId,
  savedImageRotations,
  openImageViewer,
  setActiveTab,
  onEditInitialImages,
  onEditReceivedImages,
  onEditCompletionImages,
  // Filter props
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  filterSearch,
  setFilterSearch,
  filterColor,
  setFilterColor,
  filterFactory,
  setFilterFactory,
  filterStatus,
  setFilterStatus,
  filterPage,
  setFilterPage,
  filterLimit,
  setFilterLimit,
  pagination,
  factories, // Add factories prop
  activeTab,
}) => {
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
      console.error("Error fetching color suggestions:", error);
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
          {activeTab === "warehouse_reports" ? "Wherehouse Report" : "Reports"}
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
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
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
              { value: "completed", label: "Completed" }
            ]}
            placeholder="Filter Status..."
            isClearable
            isSearchable={false}
            styles={customStyles}
            className="text-sm"
          />
        </div>

        {/* Start Date */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="date"
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border"
            placeholder="Start Date"
            value={filterStartDate || ""}
            onChange={(e) => setFilterStartDate && setFilterStartDate(e.target.value)}
          />
        </div>

        {/* End Date */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="date"
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border"
            placeholder="End Date"
            value={filterEndDate || ""}
            onChange={(e) => setFilterEndDate && setFilterEndDate(e.target.value)}
          />
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
                onShowQRCode={onShowQRCode}
                printingReportId={printingReportId}
                savedImageRotations={savedImageRotations}
                openImageViewer={openImageViewer}
                onEditInitialImages={onEditInitialImages}
                onEditReceivedImages={onEditReceivedImages}
                onEditCompletionImages={onEditCompletionImages}
              />
            );
          })}

        </div>
      )}
    </div>
  );
};

export default ReportsList;

