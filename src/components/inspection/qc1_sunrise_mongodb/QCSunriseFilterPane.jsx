import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { format } from "date-fns";

const QCSunriseFilterPane = ({ onFilterChange }) => {
  // Get today's date in YYYY-MM-DD format for max date validation
  const today = format(new Date(), "yyyy-MM-dd");

  // State for filters
  const [filters, setFilters] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    lineNo: "",
    MONo: "",
    Color: "",
    Size: "",
    Buyer: "",
    defectName: ""
  });

  // State for filter options (for dropdowns)
  const [filterOptions, setFilterOptions] = useState({
    lineNos: [],
    MONos: [],
    Colors: [],
    Sizes: [],
    Buyers: [],
    defectNames: []
  });

  // State for loading and error handling
  const [error, setError] = useState(null);

  // Fetch filter options with cross-filtering
  const fetchFilterOptions = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/sunrise/qc1-filters`,
        {
          params: filters
        }
      );
      setFilterOptions(response.data);
    } catch (error) {
      console.error("Error fetching filter options:", error);
      setError("Failed to load filter options. Please try again.");
    }
  }, [filters]);

  // Fetch filter options on mount and when filters change
  useEffect(() => {
    fetchFilterOptions();
    onFilterChange(filters); // Notify parent of filter changes immediately
  }, [filters, fetchFilterOptions, onFilterChange]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Clear button click
  const handleClearFilters = () => {
    setFilters((prev) => ({
      startDate: prev.startDate, // Preserve Start Date
      endDate: prev.endDate, // Preserve End Date
      lineNo: "",
      MONo: "",
      Color: "",
      Size: "",
      Buyer: "",
      defectName: ""
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
          Clear
        </button>
      </div>
      {error && <div className="text-center text-red-600 mb-4">{error}</div>}
      <div className="grid grid-cols-8 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            max={today} // Disable future dates
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            min={filters.startDate} // End Date cannot be earlier than Start Date
            max={today} // Disable future dates
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* Line No */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Line No
          </label>
          <select
            name="lineNo"
            value={filters.lineNo}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            {filterOptions.lineNos.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>
        </div>

        {/* MO No */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            MO No
          </label>
          <select
            name="MONo"
            value={filters.MONo}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            {filterOptions.MONos.map((mo) => (
              <option key={mo} value={mo}>
                {mo}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Color
          </label>
          <select
            name="Color"
            value={filters.Color}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            {filterOptions.Colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Size
          </label>
          <select
            name="Size"
            value={filters.Size}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            {filterOptions.Sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Buyer */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Buyer
          </label>
          <select
            name="Buyer"
            value={filters.Buyer}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            {filterOptions.Buyers.map((buyer) => (
              <option key={buyer} value={buyer}>
                {buyer}
              </option>
            ))}
          </select>
        </div>

        {/* Defect Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Defect Name
          </label>
          <select
            name="defectName"
            value={filters.defectName}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            {filterOptions.defectNames.map((defect) => (
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

export default QCSunriseFilterPane;
