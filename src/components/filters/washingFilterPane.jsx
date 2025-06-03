// File: d:/Yash/Projects/YQMS/YQMS-V0.1/src/components/filters/AdvancedFilterPane.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaFilter, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const WashingFilterPane = ({
  initialFilters,
  onApplyFilters,
}) => {
  const { t } = useTranslation();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [localFilters, setLocalFilters] = useState({
    dateFrom: '',
    dateTo: '',
    packageNo: '',
    moNo: '',
    taskNo: '',
  });

  useEffect(() => {
    // Update local state if initialFilters prop changes
    if (initialFilters) {
      setLocalFilters(initialFilters);
    }
  }, [initialFilters]);

  const handleChange = (name, value) => {
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    const dateString = date ? date.toISOString().split('T')[0] : '';
    handleChange(name, dateString);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onApplyFilters) {
      onApplyFilters(localFilters);
    }
  };

  const handleReset = () => {
    const resetState = {
      dateFrom: '',
      dateTo: '',
      packageNo: '',
      moNo: '',
      taskNo: '',
    };
    setLocalFilters(resetState);
    if (onApplyFilters) {
      onApplyFilters(resetState); // Notify parent to reset/apply empty filters
    }
  };

  const parseDateForPicker = (dateString) => {
    if (!dateString) return null;
    // Check if it's already a Date object (e.g., from initial state)
    if (dateString instanceof Date) return dateString;
    const parts = dateString.split('-');
    if (parts.length === 3) {
      // Ensure parts are numbers before creating date
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-xl shadow-xl p-4 mb-6 ${!showAdvancedFilters ? "pb-1" : ""}`}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base md:text-lg font-semibold text-gray-700 flex items-center">
          <FaFilter className="mr-2 text-indigo-600" /> {t("bundle.filters", "Filters")}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center text-xs md:text-sm text-indigo-600 hover:text-indigo-800 font-medium p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
          >
            {showAdvancedFilters ? t("bundle.hide_filters", "Hide Filters") : t("bundle.show_filters", "Show Filters")}
          </button>
          {showAdvancedFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-100 transition-colors"
              title={t("bundle.clear_filters", "Clear Filters")}
            >
              <FaTimes size={14} />
            </button>
          )}
        </div>
      </div>

      {showAdvancedFilters && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-1 transition-all duration-300 ease-in-out">
          {/* Date From */}
          <div className="flex flex-col">
            <label htmlFor="advancedDateFrom" className="text-xs font-medium text-gray-600 mb-1 flex items-center">
              <FaCalendarAlt className="mr-1.5 text-gray-400" />
              {t('filters.date_from', 'Date From')}
            </label>
            <DatePicker
              selected={parseDateForPicker(localFilters.dateFrom)}
              onChange={(date) => handleDateChange('dateFrom', date)}
              dateFormat="MM/dd/yyyy"
              className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              id="advancedDateFrom"
              autoComplete="off"
              placeholderText={t('filters.select_date', 'Select date')}
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col">
            <label htmlFor="advancedDateTo" className="text-xs font-medium text-gray-600 mb-1 flex items-center">
              <FaCalendarAlt className="mr-1.5 text-gray-400" />
              {t('filters.date_to', 'Date To')}
            </label>
            <DatePicker
              selected={parseDateForPicker(localFilters.dateTo)}
              onChange={(date) => handleDateChange('dateTo', date)}
              dateFormat="MM/dd/yyyy"
              className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              id="advancedDateTo"
              autoComplete="off"
              placeholderText={t('filters.select_date', 'Select date')}
            />
          </div>

          {/* Package No */}
          <div className="flex flex-col">
            <label htmlFor="advancedPackageNo" className="text-xs font-medium text-gray-600 mb-1">
              {t('filters.package_no', 'Package No')}
            </label>
            <input
              type="text"
              name="packageNo"
              id="advancedPackageNo"
              value={localFilters.packageNo}
              onChange={(e) => handleChange('packageNo', e.target.value)}
              placeholder={t('filters.enter_package_no', 'Enter Package No')}
              className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              autoComplete="off"
            />
          </div>

          {/* Task No */}
          <div className="flex flex-col">
            <label htmlFor="advancedTaskNo" className="text-xs font-medium text-gray-600 mb-1">
              {t('filters.task_no', 'Task No')}
            </label>
            <input
              type="text"
              name="taskNo"
              id="advancedTaskNo"
              value={localFilters.taskNo}
              onChange={(e) => handleChange('taskNo', e.target.value)}
              placeholder={t('filters.enter_task_no', 'Enter Task No')}
              className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              autoComplete="off"
            />
          </div>

          {/* MO No */}
          <div className="flex flex-col">
            <label htmlFor="advancedMoNo" className="text-xs font-medium text-gray-600 mb-1">
              {t('filters.mo_no', 'MO No')}
            </label>
            <input
              type="text"
              name="moNo"
              id="advancedMoNo"
              value={localFilters.moNo}
              onChange={(e) => handleChange('moNo', e.target.value)}
              placeholder={t('filters.enter_mo_no', 'Enter MO No')}
              className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              autoComplete="off"
            />
          </div>
          
          <div className="sm:col-span-2 md:col-span-2 lg:col-span-4 flex justify-end items-end pt-2">
             <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t('filters.apply_filters', 'Apply Filters')}
              </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default WashingFilterPane;
