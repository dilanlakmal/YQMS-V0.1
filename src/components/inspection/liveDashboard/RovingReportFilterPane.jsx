import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  Calendar, 
  Filter, 
  X, 
  ChevronDown, 
  Search,
  RefreshCw,
  Settings,
  Building,
  User,
  Hash,
  Briefcase
} from "lucide-react";

const RovingReportFilterPane = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  lineNo,
  setLineNo,
  lineNos,
  buyer,
  setBuyer,
  buyers,
  operation,
  setOperation,
  operations,
  qcId,
  setQcId,
  qcIds,
  moNo,
  setMoNo,
  moNos,
  onClearFilters,
  lastUpdated,
  formatTimestamp
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Count active filters
  React.useEffect(() => {
    let count = 0;
    if (startDate) count++;
    if (endDate) count++;
    if (lineNo) count++;
    if (buyer) count++;
    if (operation) count++;
    if (qcId) count++;
    if (moNo) count++;
    setActiveFiltersCount(count);
  }, [startDate, endDate, lineNo, buyer, operation, qcId, moNo]);

  const CustomDatePicker = ({ selected, onChange, placeholder, minDate }) => (
    <div className="relative">
      <DatePicker
        selected={selected}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        dateFormat="MM/dd/yyyy"
        placeholderText={placeholder}
        isClearable
        minDate={minDate}
      />
      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
    </div>
  );

  const CustomSelect = ({ value, onChange, options, placeholder, icon: Icon }) => (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-10 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option} className="bg-white dark:bg-gray-800">
            {option}
          </option>
        ))}
      </select>
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />}
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filter Reports
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeFiltersCount > 0 ? (
                  <span className="flex items-center gap-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {activeFiltersCount} active
                    </span>
                    filters applied
                  </span>
                ) : (
                  "No filters applied"
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                <div className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Last Updated
                </div>
                <div className="font-medium">{formatTimestamp(lastUpdated)}</div>
              </div>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              title={isExpanded ? "Collapse filters" : "Expand filters"}
            >
              <Settings className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content - All Fields in One Section */}
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="p-6">
          {/* All Filters in One Unified Section */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-700/50 dark:to-blue-900/10 rounded-xl p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Report Filters
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Start Date
                </label>
                <CustomDatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  placeholder="Select start date"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  End Date
                </label>
                <CustomDatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  placeholder="Select end date"
                  minDate={startDate}
                />
              </div>

              {/* Line Number */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Line Number
                </label>
                <CustomSelect
                  value={lineNo}
                  onChange={(e) => setLineNo(e.target.value)}
                  options={lineNos}
                  placeholder="All Lines"
                  icon={Hash}
                />
              </div>

              {/* MO Number */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  MO Number
                </label>
                <CustomSelect
                  value={moNo}
                  onChange={(e) => setMoNo(e.target.value)}
                  options={moNos}
                  placeholder="All MO Numbers"
                  icon={Briefcase}
                />
              </div>

              {/* Buyer Name */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Buyer Name
                </label>
                <CustomSelect
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                  options={buyers}
                  placeholder="All Buyers"
                  icon={Building}
                />
              </div>

              {/* Operation */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Operation
                </label>
                <CustomSelect
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                  options={operations}
                  placeholder="All Operations"
                  icon={Settings}
                />
              </div>

              {/* QC Inspector ID */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  QC Inspector ID
                </label>
                <CustomSelect
                  value={qcId}
                  onChange={(e) => setQcId(e.target.value)}
                  options={qcIds}
                  placeholder="All QC IDs"
                  icon={User}
                />
              </div>

              {/* Clear Filters Button - Aligned with other fields */}
              <div className="space-y-2 flex flex-col justify-end">
                <label className="block text-xs font-semibold text-transparent uppercase tracking-wide">
                  Actions
                </label>
                <button
                  onClick={onClearFilters}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200 font-medium text-sm border border-red-200 dark:border-red-800"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">{activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active</span>
                </div>
              )}
              {activeFiltersCount === 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>No filters applied - showing all results</span>
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Results update automatically as you change filters
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RovingReportFilterPane;
