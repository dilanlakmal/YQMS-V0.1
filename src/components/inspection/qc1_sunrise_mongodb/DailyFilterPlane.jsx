import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { format } from "date-fns";

const getTodayString = () => format(new Date(), "yyyy-MM-dd");

const DailyFilterPane = ({ onFilterChange, initialFilters }) => {
  const today = getTodayString();

  const [filters, setFilters] = useState(() => {

    const defaultDate = getTodayString();
    return {
      startDate: initialFilters?.startDate || defaultDate,
      endDate: initialFilters?.endDate || defaultDate,
      lineNo: initialFilters?.lineNo || "",
      MONo: initialFilters?.MONo || "",
      Color: initialFilters?.Color || "",
      Size: initialFilters?.Size || "",
      Buyer: initialFilters?.Buyer || "",
      defectName: initialFilters?.defectName || "",
    };
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

  // Fetch filter options with cross-filtering
  const fetchFilterOptions = useCallback(async () => {
    const paramsToFetch = { ...filters };
    if (!paramsToFetch.startDate) paramsToFetch.startDate = getTodayString();
    if (!paramsToFetch.endDate) paramsToFetch.endDate = getTodayString();

    try {
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/sunrise/qc1-filters`,
        {
          params: paramsToFetch, 
        },
      );
      setFilterOptions(response.data);
    } catch (error) {
      console.error("Error fetching filter options:", error);
      setError("Failed to load filter options. Please try again.");
    }
  }, [filters]); 


  useEffect(() => {
    fetchFilterOptions();
    if (typeof onFilterChange === 'function') {
        onFilterChange(filters);
    } else {
        console.error("DailyFilterPane: onFilterChange is not a function!");
    }
  }, [filters, fetchFilterOptions, onFilterChange]);

  // Handle filter changes from inputs/selects
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };
      if (name === "startDate" && newFilters.endDate < value) {
        newFilters.endDate = value;
      }
      if (name === "endDate" && newFilters.startDate > value) {
        newFilters.startDate = value;
      }
      return newFilters;
    });
  };

  // Handle Clear button click - Preserves dates as per original logic
  const handleClearFilters = () => {
    setFilters((prev) => ({
      startDate: prev.startDate, 
      endDate: prev.endDate,
      lineNo: "",
      MONo: "",
      Color: "",
      Size: "",
      Buyer: "",
      defectName: "",
    }));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Filter Options</h2>
        <button
          onClick={handleClearFilters}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
        >
          Clear Non-Date Filters
        </button>
      </div>
      {error && <div className="text-center text-red-600 mb-4">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700"
          >
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            max={today} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700"
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            min={filters.startDate} 
            max={today} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

      
        <div>
          <label
            htmlFor="lineNo"
            className="block text-sm font-medium text-gray-700"
          >
            Line No
          </label>
          <select
            id="lineNo"
            name="lineNo"
            value={filters.lineNo}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            {filterOptions.lineNos?.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>
        </div>

      
        <div>
          <label
            htmlFor="MONo"
            className="block text-sm font-medium text-gray-700"
          >
            MO No
          </label>
          <select
            id="MONo"
            name="MONo"
            value={filters.MONo}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            {filterOptions.MONos?.map((mo) => (
              <option key={mo} value={mo}>
                {mo}
              </option>
            ))}
          </select>
        </div>

     
        <div>
          <label
            htmlFor="Color"
            className="block text-sm font-medium text-gray-700"
          >
            Color
          </label>
          <select
            id="Color"
            name="Color"
            value={filters.Color}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            {filterOptions.Colors?.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>

   
        <div>
          <label
            htmlFor="Size"
            className="block text-sm font-medium text-gray-700"
          >
            Size
          </label>
          <select
            id="Size"
            name="Size"
            value={filters.Size}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            {filterOptions.Sizes?.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

   
        <div>
          <label
            htmlFor="Buyer"
            className="block text-sm font-medium text-gray-700"
          >
            Buyer
          </label>
          <select
            id="Buyer"
            name="Buyer"
            value={filters.Buyer}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            {filterOptions.Buyers?.map((buyer) => (
              <option key={buyer} value={buyer}>
                {buyer}
              </option>
            ))}
          </select>
        </div>

    
        <div>
          <label
            htmlFor="defectName"
            className="block text-sm font-medium text-gray-700"
          >
            Defect Name
          </label>
          <select
            id="defectName"
            name="defectName"
            value={filters.defectName}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
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

export default DailyFilterPane;
