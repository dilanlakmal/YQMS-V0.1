// d:\Yash\Projects\YQMS\YQMS-V0.1\src\components\inspection\qc1_sunrise_mongodb\MonthlyFilterPane.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from "../../../../config";
import { format, subMonths, parse, startOfMonth, endOfMonth, isValid } from "date-fns";

// --- Helper Functions ---
// Keep this helper as it parses the initial YYYY-MM-DD from the parent
const parseYYYYMMDD = (dateStr) => {
    if (!dateStr) return null;
    // Ensure we parse as UTC to avoid timezone shifts if needed, or keep local time if consistent
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    // Return the start of the day for consistency if parsed successfully
    return isValid(parsed) ? parsed : null;
};
// --- End Helper Functions ---

// Default to last 12 months (inclusive of current month)
const getDefaultDates = () => {
    const today = new Date();
    // Use startOfMonth for consistency, DatePicker will handle display
    const endDate = startOfMonth(today);
    const startDate = startOfMonth(subMonths(today, 1));
    return { startDate, endDate };
};

// Ensure component name is MonthlyFilterPane
const MonthlyFilterPane = ({ onFilterChange, initialFilters }) => {
  const defaultDates = useMemo(() => getDefaultDates(), []);

  // Parse initial YYYY-MM-DD, but use startOfMonth for the state
  const initialStartDate = useMemo(() => {
      const parsed = parseYYYYMMDD(initialFilters?.startDate);
      return parsed ? startOfMonth(parsed) : defaultDates.startDate;
  }, [initialFilters, defaultDates]);
  const initialEndDate = useMemo(() => {
      const parsed = parseYYYYMMDD(initialFilters?.endDate);
      // Use startOfMonth here too, DatePicker displays it as the month
      return parsed ? startOfMonth(parsed) : defaultDates.endDate;
  }, [initialFilters, defaultDates]);

  // State holds Date objects, representing the start of the selected month
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const [otherFilters, setOtherFilters] = useState({
    lineNo: initialFilters?.lineNo || "", MONo: initialFilters?.MONo || "",
    Color: initialFilters?.Color || "", Size: initialFilters?.Size || "",
    Buyer: initialFilters?.Buyer || "", defectName: initialFilters?.defectName || ""
  });
  const [filterOptions, setFilterOptions] = useState({
    lineNos: [], MONos: [], Colors: [], Sizes: [], Buyers: [], defectNames: []
  });
  const [error, setError] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  // Max date can be the end of the current month for selection purposes
  const maxDate = useMemo(() => endOfMonth(new Date()), []);

  // --- Derived Ranges ---
  // 1. Range for fetching filter options (using YYYY-MM format)
  const derivedMonthRangeForOptions = useMemo(() => {
    const validStartDate = isValid(startDate) ? startDate : defaultDates.startDate;
    const validEndDate = isValid(endDate) ? endDate : defaultDates.endDate;
    // Format directly to YYYY-MM
    const startMonthStr = format(validStartDate, "yyyy-MM");
    const endMonthStr = format(validEndDate, "yyyy-MM");
    return { startMonth: startMonthStr, endMonth: endMonthStr };
  }, [startDate, endDate, defaultDates]);

  // 2. Full date range (YYYY-MM-DD) for notifying the parent component
  const derivedFullDateRangeForParent = useMemo(() => {
    const validStartDate = isValid(startDate) ? startDate : defaultDates.startDate;
    const validEndDate = isValid(endDate) ? endDate : defaultDates.endDate;
    // Calculate start of the first month and end of the last month
    const startStr = format(startOfMonth(validStartDate), "yyyy-MM-dd");
    const endStr = format(endOfMonth(validEndDate), "yyyy-MM-dd");
    return { startDate: startStr, endDate: endStr };
  }, [startDate, endDate, defaultDates]);
  // --- End Derived Ranges ---

  const fetchFilterOptions = useCallback(async () => {
    setLoadingOptions(true);
    setError(null);
    try {
      // Use the YYYY-MM range for parameters
      const params = {
          startMonth: derivedMonthRangeForOptions.startMonth, // Use month format
          endMonth: derivedMonthRangeForOptions.endMonth,     // Use month format
          ...otherFilters
      };
      Object.keys(params).forEach(key => { if (params[key] === '' || params[key] === null) delete params[key]; });

      const url = `${API_BASE_URL}/api/sunrise/qc1-monthly-filters`; 
      const response = await axios.get(url, { params });

      setFilterOptions(response.data || { lineNos: [], MONos: [], Colors: [], Sizes: [], Buyers: [], defectNames: [] });
    } catch (err) {
      console.error("Error fetching monthly filter options:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to load monthly filter options.";
      setError(errorMsg);
      setFilterOptions({ lineNos: [], MONos: [], Colors: [], Sizes: [], Buyers: [], defectNames: [] });
    } finally {
      setLoadingOptions(false);
    }
    // Update dependency array to use the correct derived range
  }, [derivedMonthRangeForOptions, otherFilters]);

  useEffect(() => { fetchFilterOptions(); }, [fetchFilterOptions]);

  // Effect to notify the parent component
  useEffect(() => {
    // Use the full YYYY-MM-DD range for the parent
    const filtersToSend = { ...derivedFullDateRangeForParent, ...otherFilters };
    if (typeof onFilterChange === 'function') {
        onFilterChange(filtersToSend);
    } else {
        console.error("MonthlyFilterPane: onFilterChange is not a function!", onFilterChange);
    }
    // Update dependency array to use the correct derived range
  }, [derivedFullDateRangeForParent, otherFilters, onFilterChange]);

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    // Ensure start is not after end
    const newStart = start && end && start > end ? end : start;
    const newEnd = start && end && end < start ? start : end;
    // Set state with the Date objects returned by the picker
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const handleOtherFilterChange = (e) => {
    const { name, value } = e.target;
    setOtherFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    const defaults = getDefaultDates();
    setStartDate(defaults.startDate);
    setEndDate(defaults.endDate);
    setOtherFilters({ lineNo: "", MONo: "", Color: "", Size: "", Buyer: "", defectName: "" });
  };

  // --- JSX ---
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        {/* Title and Clear Button */}
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Filter Options</h2>
            <button onClick={handleClearFilters} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out text-sm">
                Clear Selections
            </button>
        </div>
        {error && <div className="text-center text-red-600 mb-4">{error}</div>}
        {/* Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
            {/* Month Range Picker - Configuration remains the same */}
            <div className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Month Range</label>
                <DatePicker
                    selected={startDate} // Use the state Date object
                    onChange={handleDateChange}
                    startDate={startDate} // Use the state Date object
                    endDate={endDate}     // Use the state Date object
                    selectsRange
                    dateFormat="MMM yyyy" // Display format
                    showMonthYearPicker   // Enable month selection UI
                    showFullMonthYearPicker // Enhance month selection UI
                    maxDate={maxDate}       // Limit future selection
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    wrapperClassName="w-full"
                    popperPlacement="bottom-start"
                />
                {/* Style tag remains the same */}
                <style>{`.react-datepicker-wrapper { width: 100%; } .react-datepicker__input-container input { width: 100%; padding: 0.5rem 0.75rem; line-height: 1.5; }`}</style>
            </div>
            {/* Other Filters (remain the same) */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Line No</label>
                <select name="lineNo" value={otherFilters.lineNo} onChange={handleOtherFilterChange} disabled={loadingOptions} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100">
                    <option value="">All</option> {filterOptions.lineNos?.map((line) => <option key={line} value={line}>{line}</option>)}
                </select>
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">MO No</label>
                <select name="MONo" value={otherFilters.MONo} onChange={handleOtherFilterChange} disabled={loadingOptions} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100">
                    <option value="">All</option> {filterOptions.MONos?.map((mo) => <option key={mo} value={mo}>{mo}</option>)}
                </select>
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <select name="Color" value={otherFilters.Color} onChange={handleOtherFilterChange} disabled={loadingOptions} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100">
                    <option value="">All</option> {filterOptions.Colors?.map((color) => <option key={color} value={color}>{color}</option>)}
                </select>
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Size</label>
                <select name="Size" value={otherFilters.Size} onChange={handleOtherFilterChange} disabled={loadingOptions} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100">
                    <option value="">All</option> {filterOptions.Sizes?.map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Buyer</label>
                <select name="Buyer" value={otherFilters.Buyer} onChange={handleOtherFilterChange} disabled={loadingOptions} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100">
                    <option value="">All</option> {filterOptions.Buyers?.map((buyer) => <option key={buyer} value={buyer}>{buyer}</option>)}
                </select>
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Defect Name</label>
                <select name="defectName" value={otherFilters.defectName} onChange={handleOtherFilterChange} disabled={loadingOptions} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100">
                    <option value="">All</option> {filterOptions.defectNames?.map((defect) => <option key={defect} value={defect}>{defect}</option>)}
                </select>
            </div>
        </div>
    </div>
  );
};

export default MonthlyFilterPane;
