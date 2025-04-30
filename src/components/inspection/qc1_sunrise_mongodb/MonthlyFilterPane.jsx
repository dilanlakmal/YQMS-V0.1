import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from "../../../../config";
import {
  format,
  subMonths,
  parse,
  startOfMonth,
  endOfMonth,
  isValid,
} from "date-fns";
import { FaCalendarAlt } from "react-icons/fa"; // Import the icon

const parseYYYYMMDD = (dateStr) => {
  if (!dateStr) return null;
  const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : null;
};

const getDefaultDates = () => {
  const today = new Date();
  // Default to the start of the previous month and the start of the current month
  const endDate = startOfMonth(today);
  const startDate = startOfMonth(subMonths(today, 11));
  return { startDate, endDate };
};

const MonthlyFilterPane = ({ onFilterChange, initialFilters }) => {
  const defaultDates = useMemo(() => getDefaultDates(), []);

  const initialStartDate = useMemo(() => {
    const parsed = parseYYYYMMDD(initialFilters?.startDate);
    return parsed ? startOfMonth(parsed) : defaultDates.startDate;
  }, [initialFilters, defaultDates]);
  const initialEndDate = useMemo(() => {
    const parsed = parseYYYYMMDD(initialFilters?.endDate);
    return parsed ? startOfMonth(parsed) : defaultDates.endDate;
  }, [initialFilters, defaultDates]);

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const [otherFilters, setOtherFilters] = useState({
    lineNo: initialFilters?.lineNo || "",
    MONo: initialFilters?.MONo || "",
    Color: initialFilters?.Color || "",
    Size: initialFilters?.Size || "",
    Buyer: initialFilters?.Buyer || "",
    defectName: initialFilters?.defectName || "",
  });
  const [filterOptions, setFilterOptions] = useState({
    lineNos: [],
    MONos: [],
    Colors: [],
    Sizes: [],
    Buyers: [],
    defectNames: [],
  });
  const [error, setError] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const maxDate = useMemo(() => endOfMonth(new Date()), []); // Max date is end of current month

  const derivedMonthRangeForOptions = useMemo(() => {
    const validStartDate = isValid(startDate)
      ? startDate
      : defaultDates.startDate;
    const validEndDate = isValid(endDate) ? endDate : defaultDates.endDate;
    const startMonthStr = format(validStartDate, "yyyy-MM");
    const endMonthStr = format(validEndDate, "yyyy-MM");
    return { startMonth: startMonthStr, endMonth: endMonthStr };
  }, [startDate, endDate, defaultDates]);

  const derivedFullDateRangeForParent = useMemo(() => {
    const validStartDate = isValid(startDate)
      ? startDate
      : defaultDates.startDate;
    const validEndDate = isValid(endDate) ? endDate : defaultDates.endDate;
    const startStr = format(startOfMonth(validStartDate), "yyyy-MM-dd");
    const endStr = format(endOfMonth(validEndDate), "yyyy-MM-dd"); // Use endOfMonth for the parent
    return { startDate: startStr, endDate: endStr };
  }, [startDate, endDate, defaultDates]);

  const fetchFilterOptions = useCallback(async () => {
    setLoadingOptions(true);
    setError(null);
    try {
      const params = {
        startMonth: derivedMonthRangeForOptions.startMonth,
        endMonth: derivedMonthRangeForOptions.endMonth,
        ...otherFilters,
      };
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null) delete params[key];
      });

      const url = `${API_BASE_URL}/api/sunrise/qc1-monthly-filters`;
      const response = await axios.get(url, { params });

      setFilterOptions(
        response.data || {
          lineNos: [],
          MONos: [],
          Colors: [],
          Sizes: [],
          Buyers: [],
          defectNames: [],
        },
      );
    } catch (err) {
      console.error("Error fetching monthly filter options:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load monthly filter options.";
      setError(errorMsg);
      setFilterOptions({
        lineNos: [],
        MONos: [],
        Colors: [],
        Sizes: [],
        Buyers: [],
        defectNames: [],
      });
    } finally {
      setLoadingOptions(false);
    }
  }, [derivedMonthRangeForOptions, otherFilters]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    const filtersToSend = { ...derivedFullDateRangeForParent, ...otherFilters };
    if (typeof onFilterChange === "function") {
      onFilterChange(filtersToSend);
    } else {
      console.error(
        "MonthlyFilterPane: onFilterChange is not a function!",
        onFilterChange,
      );
    }
  }, [derivedFullDateRangeForParent, otherFilters, onFilterChange]);

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    // Ensure start is always before or same as end
    const newStart = start && end && start > end ? end : start;
    const newEnd = start && end && end < start ? start : end;
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
    setOtherFilters({
      lineNo: "",
      MONo: "",
      Color: "",
      Size: "",
      Buyer: "",
      defectName: "",
    });
  };

  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Filter Options</h2>
        <button
          onClick={handleClearFilters}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Clear
        </button>
      </div>
      {error && <div className="mb-4 text-center text-red-600">{error}</div>}
      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        {/* Date Picker Column */}
        <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Month Range
          </label>
          {/* Add relative positioning */}
          <div className="relative mt-1">
            <DatePicker
              selected={startDate}
              onChange={handleDateChange}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              dateFormat="MMM yyyy"
              showMonthYearPicker
              showFullMonthYearPicker // Use this for month-only selection
              maxDate={maxDate}
              // Add right padding (pr-10) and keep existing classes
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10"
              wrapperClassName="w-full"
              popperPlacement="bottom-start"
              // Add popperClassName for z-index control
              popperClassName="react-datepicker-popper-high-z"
            />
            {/* Absolutely positioned icon */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <FaCalendarAlt
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
          </div>
          {/* Style block for z-index */}
          <style>{`
            .react-datepicker-wrapper { width: 100%; }
            .react-datepicker-popper, .react-datepicker-popper-high-z {
              z-index: 50 !important; /* Ensure popup is above other elements */
            }
          `}</style>
        </div>

        {/* Other filter selects */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Line No
          </label>
          <select
            name="lineNo"
            value={otherFilters.lineNo}
            onChange={handleOtherFilterChange}
            disabled={loadingOptions}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 sm:text-sm"
          >
            <option value="">All</option>{" "}
            {filterOptions.lineNos?.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            MO No
          </label>
          <select
            name="MONo"
            value={otherFilters.MONo}
            onChange={handleOtherFilterChange}
            disabled={loadingOptions}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 sm:text-sm"
          >
            <option value="">All</option>{" "}
            {filterOptions.MONos?.map((mo) => (
              <option key={mo} value={mo}>
                {mo}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Color
          </label>
          <select
            name="Color"
            value={otherFilters.Color}
            onChange={handleOtherFilterChange}
            disabled={loadingOptions}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 sm:text-sm"
          >
            <option value="">All</option>{" "}
            {filterOptions.Colors?.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Size
          </label>
          <select
            name="Size"
            value={otherFilters.Size}
            onChange={handleOtherFilterChange}
            disabled={loadingOptions}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 sm:text-sm"
          >
            <option value="">All</option>{" "}
            {filterOptions.Sizes?.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Buyer
          </label>
          <select
            name="Buyer"
            value={otherFilters.Buyer}
            onChange={handleOtherFilterChange}
            disabled={loadingOptions}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 sm:text-sm"
          >
            <option value="">All</option>{" "}
            {filterOptions.Buyers?.map((buyer) => (
              <option key={buyer} value={buyer}>
                {buyer}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Defect Name
          </label>
          <select
            name="defectName"
            value={otherFilters.defectName}
            onChange={handleOtherFilterChange}
            disabled={loadingOptions}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 sm:text-sm"
          >
            <option value="">All</option>{" "}
            {filterOptions.defectNames?.map((defect) => (
              <option key={defect} value={defect}>
                {defect}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default MonthlyFilterPane;
