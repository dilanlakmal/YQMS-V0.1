import React, { useState, useEffect, useRef } from 'react';
import { Filter, Check } from 'lucide-react';

const FilterDropdown = ({ field, options, filters, handleFilterChange, sortOrder, handleSort, activeFilters, toggleHeaderDropdown, headerDropdownStates }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const dropdownRef = useRef(null);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      toggleHeaderDropdown(field);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => toggleHeaderDropdown(field)}
        className="flex items-center space-x-1 focus"
      >
        {activeFilters[field] ? <Check className="h-4 w-4 text-blue-500" /> : <Filter className="h-4 w-4" />}
      </button>
      {headerDropdownStates[field] && (
        <div className="fixed z-50 w-48 mt-2 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-1 border rounded"
            />
          </div>
          <div className="p-2">
            <button onClick={() => handleSort(field)} className="w-full text-left">
              Sort {sortOrder.field === field && sortOrder.order === 'asc' ? '↓' : '↑'}
            </button>
          </div>
          {filteredOptions.map((option, idx) => (
            <div key={idx} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters[field].includes(option)}
                  onChange={(e) => {
                    const newFilters = e.target.checked
                      ? [...filters[field], option]
                      : filters[field].filter((item) => item !== option);
                    handleFilterChange(field, newFilters);
                  }}
                />
                <span>{option}</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
