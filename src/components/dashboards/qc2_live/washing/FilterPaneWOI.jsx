import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config"; // Adjust path if needed
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaSearch, FaTimes } from "react-icons/fa";

const FilterInput = ({
  label,
  value,
  onChange,
  onFocus,
  placeholder,
  options,
  onSelect,
  showDropdown,
  inputRef,
  name
}) => (
  <div className="relative" ref={inputRef}>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}
    </label>
    <input
      type="text"
      name={name}
      value={value || ""} // Ensure value is not null/undefined for input
      onChange={onChange}
      onFocus={onFocus}
      // onBlur is tricky with dropdowns, handled by click outside
      placeholder={placeholder || `Search ${label}`}
      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
      autoComplete="off"
    />
    {showDropdown && options.length > 0 && (
      <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
        {options.map((opt) => (
          <li
            key={opt}
            onMouseDown={() => onSelect(opt)} // Use onMouseDown to ensure it fires before a potential onBlur
            className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm"
          >
            {opt}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const FilterPaneWOI = ({
  filters: parentFilters, // Renamed to avoid confusion with localFilters
  onApply,
  module = "washing",
  empIdField = "emp_id_washing"
}) => {
  const [localFilters, setLocalFilters] = useState(parentFilters);
  const [options, setOptions] = useState({
    moNo: [],
    custStyle: [],
    buyer: [],
    color: [],
    size: [],
    empId: []
  });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const inputRefs = {
    moNo: useRef(null),
    custStyle: useRef(null),
    buyer: useRef(null),
    color: useRef(null),
    size: useRef(null),
    empId: useRef(null)
  };

  const formatDateForAPI = (date) => {
    // Consistent with WashingLive
    if (!date) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  };

  const apiAutocompleteEndpoint = `${API_BASE_URL}/api/${module}-autocomplete`;
  const apiFilterOptionsEndpoint = `${API_BASE_URL}/api/${module}-filter-options`;

  const fetchOptionsForField = useCallback(
    async (fieldName, query = "") => {
      const dbFieldMap = {
        moNo: "selectedMono",
        custStyle: "custStyle",
        buyer: "buyer",
        color: "color",
        size: "size",
        empId: empIdField
      };
      const dbField = dbFieldMap[fieldName];
      if (!dbField) return;

      const currentActiveFiltersForBackend = {
        moNo: localFilters.moNo,
        custStyle: localFilters.custStyle,
        buyer: localFilters.buyer,
        color: localFilters.color,
        size: localFilters.size,
        empId: localFilters.empId,
        startDate: formatDateForAPI(localFilters.startDate),
        endDate: formatDateForAPI(localFilters.endDate)
      };

      const endpoint = query
        ? apiAutocompleteEndpoint
        : apiFilterOptionsEndpoint;
      const params = query
        ? { ...currentActiveFiltersForBackend, field: dbField, query }
        : { ...currentActiveFiltersForBackend, field: dbField };

      // Don't filter by the field we are fetching options for
      delete params[fieldName === "empId" ? "empId" : fieldName];
      if (params.field === dbFieldMap.moNo) delete params.moNo;
      if (params.field === dbFieldMap.custStyle) delete params.custStyle;
      if (params.field === dbFieldMap.buyer) delete params.buyer;
      if (params.field === dbFieldMap.color) delete params.color;
      if (params.field === dbFieldMap.size) delete params.size;
      if (params.field === dbFieldMap.empId) delete params.empId;

      try {
        const response = await axios.get(endpoint, { params });
        setOptions((prev) => ({
          ...prev,
          [fieldName]: response.data.filter((opt) => opt != null)
        }));
      } catch (error) {
        console.error(`Error fetching options for ${fieldName}:`, error);
        setOptions((prev) => ({ ...prev, [fieldName]: [] }));
      }
    },
    [
      localFilters,
      apiAutocompleteEndpoint,
      apiFilterOptionsEndpoint,
      empIdField
    ]
  ); // formatDateForAPI is stable

  useEffect(() => {
    setLocalFilters(parentFilters); // Sync with parent if parentFilters change externally
  }, [parentFilters]);

  useEffect(() => {
    const fieldsToFetch = [
      "moNo",
      "custStyle",
      "buyer",
      "color",
      "size",
      "empId"
    ];
    fieldsToFetch.forEach((field) =>
      fetchOptionsForField(field, localFilters[field] || "")
    );
  }, [localFilters.startDate, localFilters.endDate, fetchOptionsForField]); // fetchOptionsForField depends on localFilters

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
    fetchOptionsForField(name, value); // Fetch options as user types
    setActiveDropdown(name); // Keep dropdown open while typing
  };

  const handleDateChange = (name, date) => {
    setLocalFilters((prev) => ({ ...prev, [name]: date }));
    // Dates changing should refetch options for other fields
    const fieldsToUpdate = [
      "moNo",
      "custStyle",
      "buyer",
      "color",
      "size",
      "empId"
    ];
    fieldsToUpdate.forEach((f) =>
      fetchOptionsForField(f, localFilters[f] || "")
    );
  };

  const handleSelectOption = (fieldName, value) => {
    setLocalFilters((prev) => ({ ...prev, [fieldName]: value }));
    setActiveDropdown(null);
    // After selecting, refetch options for other fields based on this new selection
    const fieldsToUpdate = [
      "moNo",
      "custStyle",
      "buyer",
      "color",
      "size",
      "empId"
    ].filter((f) => f !== fieldName);
    fieldsToUpdate.forEach((f) =>
      fetchOptionsForField(f, localFilters[f] || "")
    );
  };

  const handleFocus = (fieldName) => {
    setActiveDropdown(fieldName);
    fetchOptionsForField(fieldName, localFilters[fieldName] || "");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      let clickedInside = false;
      for (const key in inputRefs) {
        if (
          inputRefs[key].current &&
          inputRefs[key].current.contains(event.target)
        ) {
          clickedInside = true;
          break;
        }
      }
      if (!clickedInside) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputRefs]);

  const handleApply = () => {
    onApply(localFilters);
    setActiveDropdown(null); // Close any open dropdowns
  };

  const handleReset = () => {
    const resetState = {
      startDate: null,
      endDate: null,
      moNo: "",
      custStyle: "",
      buyer: "",
      color: "",
      size: "",
      empId: ""
    };
    setLocalFilters(resetState);
    onApply(resetState);
    setActiveDropdown(null);
    // Refetch all options with empty filters
    const fieldsToFetch = [
      "moNo",
      "custStyle",
      "buyer",
      "color",
      "size",
      "empId"
    ];
    fieldsToFetch.forEach((field) => fetchOptionsForField(field, ""));
  };

  return (
    <div className="bg-white p-3 md:p-4 rounded-lg shadow mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Start Date
          </label>
          <DatePicker
            selected={localFilters.startDate}
            onChange={(date) => handleDateChange("startDate", date)}
            dateFormat="MM/dd/yyyy"
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholderText="Start Date"
            isClearable
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            End Date
          </label>
          <DatePicker
            selected={localFilters.endDate}
            onChange={(date) => handleDateChange("endDate", date)}
            dateFormat="MM/dd/yyyy"
            minDate={localFilters.startDate}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholderText="End Date"
            isClearable
          />
        </div>

        <FilterInput
          name="moNo"
          label="MO No"
          value={localFilters.moNo}
          onChange={handleInputChange}
          onFocus={() => handleFocus("moNo")}
          options={options.moNo}
          onSelect={(val) => handleSelectOption("moNo", val)}
          showDropdown={activeDropdown === "moNo"}
          inputRef={inputRefs.moNo}
        />
        <FilterInput
          name="custStyle"
          label="Cust. Style"
          value={localFilters.custStyle}
          onChange={handleInputChange}
          onFocus={() => handleFocus("custStyle")}
          options={options.custStyle}
          onSelect={(val) => handleSelectOption("custStyle", val)}
          showDropdown={activeDropdown === "custStyle"}
          inputRef={inputRefs.custStyle}
        />
        <FilterInput
          name="buyer"
          label="Buyer"
          value={localFilters.buyer}
          onChange={handleInputChange}
          onFocus={() => handleFocus("buyer")}
          options={options.buyer}
          onSelect={(val) => handleSelectOption("buyer", val)}
          showDropdown={activeDropdown === "buyer"}
          inputRef={inputRefs.buyer}
        />
        <FilterInput
          name="color"
          label="Color"
          value={localFilters.color}
          onChange={handleInputChange}
          onFocus={() => handleFocus("color")}
          options={options.color}
          onSelect={(val) => handleSelectOption("color", val)}
          showDropdown={activeDropdown === "color"}
          inputRef={inputRefs.color}
        />
        <FilterInput
          name="size"
          label="Size"
          value={localFilters.size}
          onChange={handleInputChange}
          onFocus={() => handleFocus("size")}
          options={options.size}
          onSelect={(val) => handleSelectOption("size", val)}
          showDropdown={activeDropdown === "size"}
          inputRef={inputRefs.size}
        />
        <FilterInput
          name="empId"
          label="Emp ID"
          value={localFilters.empId}
          onChange={handleInputChange}
          onFocus={() => handleFocus("empId")}
          options={options.empId}
          onSelect={(val) => handleSelectOption("empId", val)}
          showDropdown={activeDropdown === "empId"}
          inputRef={inputRefs.empId}
        />

        <div className="flex space-x-2 col-span-full sm:col-span-2 md:col-span-1 lg:col-span-1 xl:col-span-2 justify-start sm:justify-end pt-2 xl:pt-0 items-center">
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm flex items-center min-w-[80px] justify-center"
          >
            <FaTimes className="mr-1" /> Clear
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center min-w-[80px] justify-center"
          >
            <FaSearch className="mr-1" /> Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPaneWOI;
