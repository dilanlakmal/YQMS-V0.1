import React, { useState } from 'react';

const FilterField = ({ 
  label, 
  type = 'input', 
  value, 
  onChange, 
  placeholder, 
  options = [], 
  icon,
  datalistId 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const baseInputClasses = `
    w-full px-4 py-3 border rounded-lg text-sm transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    hover:border-gray-400 bg-white
    ${isFocused ? 'border-blue-500 shadow-md' : 'border-gray-300'}
  `;

  return (
    <div className="relative group">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        {label}
      </label>
      
      <div className="relative">
        {type === 'select' ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={baseInputClasses}
          >
            <option value="">All {label}</option>
            {type === 'select' && label === 'Approval Status' && (
              <>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </>
            )}
          </select>
        ) : (
          <>
            <input
              list={datalistId}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={baseInputClasses}
            />
            {options.length > 0 && (
              <datalist id={datalistId}>
                {options.map(option => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            )}
          </>
        )}
        
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

const FilterPanel = ({ filters, onFilterChange, options }) => {
  const hasActiveFilters = Object.values(filters).some(value => value !== '');
  const activeFilterCount = Object.values(filters).filter(value => value !== '').length;

  const clearAllFilters = () => {
    Object.keys(filters).forEach(key => {
      onFilterChange(key, '');
    });
  };

  const filterFields = [
    {
      key: 'inspector',
      label: 'Inspector',
      placeholder: 'Search inspector...',
      icon: '👤',
      options: options.inspector || []
    },
    {
      key: 'approvalStatus',
      label: 'Approval Status',
      type: 'select',
      icon: '✅',
    },
    {
      key: 'reportType',
      label: 'Report Type',
      placeholder: 'Search report type...',
      icon: '📋',
      options: options.reportType || []
    },
    {
      key: 'supplier',
      label: 'Supplier',
      placeholder: 'Search supplier...',
      icon: '🏢',
      options: options.supplier || []
    },
    {
      key: 'project',
      label: 'Project',
      placeholder: 'Search project...',
      icon: '🏗️',
      options: options.project || []
    },
    {
      key: 'poNumbers',
      label: 'PO #',
      placeholder: 'Search PO #...',
      icon: '🏷️',
      options: options.poNumbers || []
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Filter Inspections</h3>
              <p className="text-sm text-gray-600">
                {hasActiveFilters 
                  ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied`
                  : ''
                }
              </p>
            </div>
          </div>
          
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Fields */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {filterFields.map((field) => (
            <FilterField
              key={field.key}
              label={field.label}
              type={field.type}
              value={filters[field.key]}
              onChange={(value) => onFilterChange(field.key, value)}
              placeholder={field.placeholder}
              options={field.options}
              icon={field.icon}
              datalistId={`${field.key}-options`}
            />
          ))}
        </div>

        {/* Quick Filter Chips */}
        {hasActiveFilters && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-600">Active filters:</span>
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                const field = filterFields.find(f => f.key === key);
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    <span className="text-xs">{field?.icon}</span>
                    <span className="font-medium">{field?.label}:</span>
                    <span>{value}</span>
                    <button
                      onClick={() => onFilterChange(key, '')}
                      className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
