import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";

const BGradeStockFilterPane = ({ onFilterChange }) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    moNo: "",
    lineNo: "",
    packageNo: "",
    color: "",
    size: "",
    department: ""
  });
  const [options, setOptions] = useState({
    moNos: [],
    lineNos: [],
    packageNos: [],
    colors: [],
    sizes: [],
    departments: []
  });
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Fetch new dropdown options whenever the date changes
  useEffect(() => {
    const fetchOptions = async () => {
      if (!filters.date) return;
      setLoadingOptions(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/b-grade-stock/filter-options?date=${filters.date}`
        );
        if (!response.ok) throw new Error("Failed to fetch filter options");
        const data = await response.json();
        setOptions({
          moNos: data.moNos.map((o) => ({ value: o, label: o })),
          lineNos: data.lineNos.map((o) => ({ value: o, label: o })),
          packageNos: data.packageNos.map((o) => ({ value: o, label: o })),
          colors: data.colors.map((o) => ({ value: o, label: o })),
          sizes: data.sizes.map((o) => ({ value: o, label: o })),
          departments: data.departments.map((o) => ({ value: o, label: o }))
        });
      } catch (error) {
        console.error("Error fetching filter options:", error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [filters.date]);

  // Handle filter changes and propagate to parent
  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };

    // If date changes, reset other filters
    if (name === "date") {
      newFilters.moNo = "";
      newFilters.lineNo = "";
      newFilters.packageNo = "";
      newFilters.color = "";
      newFilters.size = "";
      newFilters.department = "";
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      date: new Date().toISOString().split("T")[0],
      moNo: "",
      lineNo: "",
      packageNo: "",
      color: "",
      size: "",
      department: ""
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const selectStyles = {
    /* ... your custom styles ... */
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
        {/* Date Picker */}
        <div>
          <label className="text-sm font-medium text-gray-700">Date</label>
          <DatePicker
            selected={filters.date ? new Date(filters.date) : null}
            onChange={(date) =>
              handleFilterChange("date", date.toISOString().split("T")[0])
            }
            dateFormat="yyyy-MM-dd"
            className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        {/* Other Filters */}
        <FilterSelect
          label="MO No"
          name="moNo"
          value={filters.moNo}
          options={options.moNos}
          onChange={handleFilterChange}
          isLoading={loadingOptions}
        />
        <FilterSelect
          label="Line No"
          name="lineNo"
          value={filters.lineNo}
          options={options.lineNos}
          onChange={handleFilterChange}
          isLoading={loadingOptions}
        />
        <FilterSelect
          label="Package No"
          name="packageNo"
          value={filters.packageNo}
          options={options.packageNos}
          onChange={handleFilterChange}
          isLoading={loadingOptions}
        />
        <FilterSelect
          label="Color"
          name="color"
          value={filters.color}
          options={options.colors}
          onChange={handleFilterChange}
          isLoading={loadingOptions}
        />
        <FilterSelect
          label="Size"
          name="size"
          value={filters.size}
          options={options.sizes}
          onChange={handleFilterChange}
          isLoading={loadingOptions}
        />
        <FilterSelect
          label="Department"
          name="department"
          value={filters.department}
          options={options.departments}
          onChange={handleFilterChange}
          isLoading={loadingOptions}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

// Helper component for select dropdowns
const FilterSelect = ({ label, name, value, options, onChange, isLoading }) => (
  <div>
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <Select
      name={name}
      value={options.find((o) => o.value === value) || null}
      onChange={(selected) => onChange(name, selected ? selected.value : "")}
      options={options}
      isClearable
      isSearchable
      isLoading={isLoading}
      className="mt-1"
      classNamePrefix="react-select"
    />
  </div>
);

export default BGradeStockFilterPane;
