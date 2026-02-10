import React, { useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const FilterBox = ({ label, options, value, onChange, icon, placeholder }) => (
  <div className="flex flex-col gap-2">
    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
      {icon && <span className="text-blue-500 dark:text-blue-400">{icon}</span>}
      {label}
    </label>
    <Select
      isClearable
      placeholder={placeholder || `Select ${label.toLowerCase()}...`}
      options={options?.map(o => ({ value: o, label: o }))}
      value={value}
      onChange={onChange}
      classNamePrefix="react-select"
      styles={{
        control: (base, state) => ({
          ...base,
          borderRadius: '12px',
          border: state.isFocused 
            ? '2px solid #3b82f6' 
            : '1px solid #e2e8f0',
          boxShadow: state.isFocused 
            ? '0 0 0 3px rgba(59, 130, 246, 0.1)' 
            : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '4px 8px',
          fontSize: '13px',
          minHeight: '44px',
          backgroundColor: 'white',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: '#94a3b8'
          }
        }),
        menu: (base) => ({
          ...base,
          borderRadius: '12px',
          zIndex: 1000,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0'
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected 
            ? '#3b82f6' 
            : state.isFocused 
              ? '#eff6ff' 
              : 'white',
          color: state.isSelected ? 'white' : '#374151',
          fontSize: '13px',
          padding: '10px 12px',
          '&:hover': {
            backgroundColor: state.isSelected ? '#3b82f6' : '#eff6ff'
          }
        }),
        placeholder: (base) => ({
          ...base,
          color: '#9ca3af',
          fontSize: '13px'
        }),
        singleValue: (base) => ({
          ...base,
          color: '#374151',
          fontSize: '13px'
        })
      }}
      theme={(theme) => ({
        ...theme,
        colors: {
          ...theme.colors,
          primary: '#3b82f6',
          primary75: '#60a5fa',
          primary50: '#93c5fd',
          primary25: '#dbeafe'
        }
      })}
    />
  </div>
);

const DateRangeBox = ({ label, startDate, endDate, onStartChange, onEndChange, icon }) => (
  <div className="flex flex-col gap-2">
    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
      {icon && <span className="text-blue-500 dark:text-blue-400">{icon}</span>}
      {label}
    </label>
    <div className="flex gap-2">
      <div className="flex-1">
        <DatePicker
          selected={startDate}
          onChange={onStartChange}
          placeholderText="Start date"
          className="w-full text-sm p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
          dateFormat="MMM dd, yyyy"
        />
      </div>
      <div className="flex items-center justify-center px-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <div className="flex-1">
        <DatePicker
          selected={endDate}
          onChange={onEndChange}
          placeholderText="End date"
          className="w-full text-sm p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
          dateFormat="MMM dd, yyyy"
        />
      </div>
    </div>
  </div>
);

const DashboardFilters = ({ filters, setFilters, filterOptions }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Count active filters
  React.useEffect(() => {
    const count = Object.values(filters).filter(value => 
      value && (typeof value === 'string' || value.value || (value instanceof Date))
    ).length;
    setActiveFiltersCount(count);
  }, [filters]);

  const clearAllFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      buyer: null,
      orderNo: null,
      color: null,
      reportType: null,
      washType: null,
      factoryName: null
    });
  };

  return (
    <section className="max-w-[1600px] mx-auto mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            Filters
          </h2>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {activeFiltersCount} active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
          >
            {isCollapsed ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Expand
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Collapse
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters Container */}
      <div className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-xl transition-all duration-300 ${
        isCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-none opacity-100'
      }`}>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-6">
            {/* Date Range */}
            <div className="lg:col-span-2">
              <DateRangeBox
                label="Date Range"
                startDate={filters.startDate}
                endDate={filters.endDate}
                onStartChange={(d) => setFilters(f => ({...f, startDate: d}))}
                onEndChange={(d) => setFilters(f => ({...f, endDate: d}))}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>

              {/* Factory */}
            <FilterBox
              label="Factory"
              options={filterOptions?.factoryName}
              value={filters.factoryName}
              onChange={(v) => setFilters(f => ({...f, factoryName: v}))}
              placeholder="Factory..."
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />

            {/* Buyer */}
            <FilterBox
              label="Buyer"
              options={filterOptions?.buyers}
              value={filters.buyer}
              onChange={(v) => setFilters(f => ({...f, buyer: v}))}
              placeholder="Buyer..."
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            {/* Order No */}
            <FilterBox
              label="Order No"
              options={filterOptions?.orders}
              value={filters.orderNo}
              onChange={(v) => setFilters(f => ({...f, orderNo: v}))}
              placeholder="Order..."
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />

            {/* Color */}
            <FilterBox
              label="Color"
              options={filterOptions?.colors}
              value={filters.color}
              onChange={(v) => setFilters(f => ({...f, color: v}))}
              placeholder="Color..."
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              }
            />

            {/* Report Type */}
            <FilterBox
              label="Report Type"
              options={filterOptions?.reportTypes}
              value={filters.reportType}
              onChange={(v) => setFilters(f => ({...f, reportType: v}))}
              placeholder="Report type..."
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />

            {/* Wash Type */}
            <FilterBox
              label="Wash Type"
              options={filterOptions?.washTypes}
              value={filters.washType}
              onChange={(v) => setFilters(f => ({...f, washType: v}))}
              placeholder="Wash type..."
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              }
            />
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Quick filters:</span>
              
              <button
                onClick={() => setFilters(f => ({...f, startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate: new Date()}))}
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-200"
              >
                Last 7 days
              </button>
              
              <button
                onClick={() => setFilters(f => ({...f, startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: new Date()}))}
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-200"
              >
                Last 30 days
              </button>
              
              <button
                onClick={() => setFilters(f => ({...f, startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), endDate: new Date()}))}
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-200"
              >
                This month
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardFilters;
