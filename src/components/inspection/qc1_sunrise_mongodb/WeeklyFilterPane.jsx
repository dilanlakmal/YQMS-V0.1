import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from "../../../../config";
import {
  format, parse, isValid, startOfWeek, endOfWeek, subWeeks, addDays,
  getISOWeek, getISOWeekYear
} from "date-fns";


const DATE_FORMAT_API = "yyyy-MM-dd"; 
const DATE_FORMAT_DISPLAY = "dd MMM yyyy"; 

const getMonday = (date) => startOfWeek(date, { weekStartsOn: 1 });

const getSunday = (date) => endOfWeek(date, { weekStartsOn: 1 });


const formatRangeForDisplay = (start, end) => {
  if (!start || !end) return "";
  const mon = getMonday(start);
  const sun = getSunday(end);
  return `${format(mon, DATE_FORMAT_DISPLAY)} - ${format(sun, DATE_FORMAT_DISPLAY)}`;
};


const getDefaultDates = () => {
    const today = new Date();
    const lastSunday = getSunday(today); 
    const fourWeeksAgoMonday = getMonday(subWeeks(lastSunday, 3)); 
    return { startDate: fourWeeksAgoMonday, endDate: lastSunday };
};


const WeeklyFilterPane = ({ onFilterChange, initialFilters }) => {
  const defaultDates = useMemo(() => getDefaultDates(), []);


  const initialStartDate = useMemo(() => {
      const parsed = initialFilters?.startDate ? parse(initialFilters.startDate, DATE_FORMAT_API, new Date()) : null;
      return parsed && isValid(parsed) ? getMonday(parsed) : defaultDates.startDate;
  }, [initialFilters, defaultDates]);
  const initialEndDate = useMemo(() => {
      const parsed = initialFilters?.endDate ? parse(initialFilters.endDate, DATE_FORMAT_API, new Date()) : null;
   
      return parsed && isValid(parsed) ? parsed : defaultDates.endDate;
  }, [initialFilters, defaultDates]);

  
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
  const maxDate = useMemo(() => getSunday(new Date()), []); 

  
  const derivedApiDateRange = useMemo(() => {
    const validStartDate = isValid(startDate) ? startDate : defaultDates.startDate;
    
    const validEndDate = isValid(endDate) ? endDate : (isValid(startDate) ? startDate : defaultDates.endDate);

    const startMon = getMonday(validStartDate);
    const endSun = getSunday(validEndDate);

   
    const finalStart = startMon <= endSun ? startMon : endSun;
    const finalEnd = endSun >= startMon ? endSun : startMon;

    return {
      startDate: format(finalStart, DATE_FORMAT_API),
      endDate: format(finalEnd, DATE_FORMAT_API),
    };
  }, [startDate, endDate, defaultDates]);



  const fetchFilterOptions = useCallback(async () => {
    setLoadingOptions(true); setError(null);
    try {
      const params = {
          startDate: derivedApiDateRange.startDate,
          endDate: derivedApiDateRange.endDate,
          ...otherFilters
      };
      Object.keys(params).forEach(key => { if (params[key] === '' || params[key] === null) delete params[key]; });

  
      const url = `${API_BASE_URL}/api/sunrise/qc1-weekly-filters`;
      const response = await axios.get(url, { params });

      setFilterOptions(response.data || { lineNos: [], MONos: [], Colors: [], Sizes: [], Buyers: [], defectNames: [] });
    } catch (err) {
      console.error("Error fetching weekly filter options:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to load weekly filter options.";
      setError(errorMsg);
      setFilterOptions({ lineNos: [], MONos: [], Colors: [], Sizes: [], Buyers: [], defectNames: [] });
    } finally {
      setLoadingOptions(false);
    }
  }, [derivedApiDateRange, otherFilters]); 

  useEffect(() => { fetchFilterOptions(); }, [fetchFilterOptions]);


  useEffect(() => {
    const filtersToSend = { ...derivedApiDateRange, ...otherFilters };
    if (typeof onFilterChange === 'function') {
        onFilterChange(filtersToSend);
    } else {
        console.error("WeeklyFilterPane: onFilterChange is not a function!", onFilterChange);
    }
  }, [derivedApiDateRange, otherFilters, onFilterChange]); 

  
  const handleDateChange = (dates) => {
    const [start, end] = dates;
    
    setStartDate(start);
    setEndDate(end);
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

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Filter Options (Weekly)</h2>
            <button onClick={handleClearFilters} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm">
                Clear Selections
            </button>
        </div>
        {error && <div className="text-center text-red-600 mb-4">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
          
            <div className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Week Range (Mon-Sun)</label>
                <DatePicker
                    selected={startDate}
                    onChange={handleDateChange}
                    startDate={startDate}
                    endDate={endDate}
                    selectsRange
                    dateFormat={DATE_FORMAT_DISPLAY}
                    placeholderText="Select week range"
                    showWeekNumbers 
                    maxDate={maxDate} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    wrapperClassName="w-full"
                    popperPlacement="bottom-start"
                  
                    formatWeekDay={(nameOfDay) => nameOfDay.substring(0, 1)}
                    calendarStartDay={1} 
                >
             
                   <div className="text-xs text-center text-gray-500 p-1">
                       Selected: {formatRangeForDisplay(startDate, endDate)}
                   </div>
                </DatePicker>
                <style>{`.react-datepicker-wrapper { width: 100%; } .react-datepicker__input-container input { width: 100%; padding: 0.5rem 0.75rem; line-height: 1.5; }`}</style>
            </div>

            
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

export default WeeklyFilterPane;
