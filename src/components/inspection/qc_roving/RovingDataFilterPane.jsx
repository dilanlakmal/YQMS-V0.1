import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import PropTypes from 'prop-types';
import 'react-datepicker/dist/react-datepicker.css';

const RovingFilterPlane = ({
  onFilterChange,
  initialFilters,
  uniqueQcIds = [],
  uniqueOperatorIds = [],
  uniqueLineNos = [],
  uniqueMoNos = [],
}) => {
  const [filters, setFilters] = useState(() => {
    let initialDateForPicker;
    if (initialFilters && initialFilters.date && typeof initialFilters.date === 'string') {
      const parts = initialFilters.date.split('/');
      if (parts.length === 3) {
        const year = parseInt(parts[2], 10);
        const month = parseInt(parts[0], 10) - 1; 
        const day = parseInt(parts[1], 10);
       if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const parsedDate = new Date(year, month, day);
          if (parsedDate.getFullYear() === year &&
              parsedDate.getMonth() === month &&
              parsedDate.getDate() === day &&
              !isNaN(parsedDate.getTime())) {
            initialDateForPicker = parsedDate;
          } else {
            initialDateForPicker = new Date();
          }
        } else {
          initialDateForPicker = new Date();
        }
      } else {
        initialDateForPicker = new Date();
      }
    } else {
        if (initialFilters && initialFilters.hasOwnProperty('date') && (initialFilters.date !== null && initialFilters.date !== undefined)) {
          console.warn(`RovingDataFilterPane: initialFilters.date was provided but not a string or was null/undefined: ${typeof initialFilters.date}, value: ${initialFilters.date}. Defaulting to today.`);
      }
      initialDateForPicker = new Date();
    }
    return {
      date: initialDateForPicker,
      qcId: initialFilters?.qcId || '',
      operatorId: initialFilters?.operatorId || '',
      lineNo: initialFilters?.lineNo || '',
      moNo: initialFilters?.moNo || '',
    };
  });

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    let dateString = '';
    if (filters.date instanceof Date && !isNaN(filters.date.getTime())) {
      const d = filters.date;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateString = `${month}/${day}/${year}`;
      } else if (filters.date === null || filters.date === '') { // Handle cleared date
      dateString = '';
    }

    const formattedFilters = {
      ...filters,
      date: dateString,
    };


    onFilterChange(formattedFilters);
  }, [filters, onFilterChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFilters(prev => ({ ...prev, date: date }));
  };

  const handleResetFilters = () => {
    const resetValues = {
      date: new Date(),
      qcId: '',
      operatorId: '',
      lineNo: '',
      moNo: '',
    };
    setFilters(resetValues);
  };

  return (
    <div className="p-4 mb-6 bg-gray-50 rounded-lg shadow-md border border-gray-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <DatePicker
            selected={filters.date}
            onChange={handleDateChange}
            dateFormat="MM/dd/yyyy"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholderText="Select Date"
          />
        </div>
        <div>
          <label htmlFor="qcId" className="block text-sm font-medium text-gray-700 mb-1">QC ID</label>
          <select
            name="qcId"
            id="qcId"
            value={filters.qcId}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All QC IDs</option>
            {uniqueQcIds.map(id => (
              <option key={String(id)} value={String(id)}>{id}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="operatorId" className="block text-sm font-medium text-gray-700 mb-1">Operator ID</label>
          <select
            name="operatorId"
            id="operatorId"
            value={filters.operatorId}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Operator IDs</option>
            {uniqueOperatorIds.map(id => (
              <option key={String(id)} value={String(id)}>{id}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lineNo" className="block text-sm font-medium text-gray-700 mb-1">Line No</label>
          <select
            name="lineNo"
            id="lineNo"
            value={filters.lineNo}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Line Nos</option>
            {uniqueLineNos.map(line => (
              <option key={String(line)} value={String(line)}>{line}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="moNo" className="block text-sm font-medium text-gray-700 mb-1">MO No</label>
          <select
            name="moNo"
            id="moNo"
            value={filters.moNo}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All MO Nos</option>
            {uniqueMoNos.map(mo => (
              <option key={String(mo)} value={String(mo)}>{mo}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end space-x-3">
        <button onClick={handleResetFilters} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">Reset</button>
      </div>
    </div>
  );
};

RovingFilterPlane.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  initialFilters: PropTypes.shape({
    date: PropTypes.string, // Expecting 'MM/DD/YYYY' string initially
    qcId: PropTypes.string,
    operatorId: PropTypes.string,
    lineNo: PropTypes.string,
    moNo: PropTypes.string,
  }),
  uniqueQcIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  uniqueOperatorIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  uniqueLineNos: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  uniqueMoNos: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
};

export default RovingFilterPlane;
