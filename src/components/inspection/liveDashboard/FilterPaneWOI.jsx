import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";

const FilterPaneWOI = ({
  module,
  empIdField,
  filters,
  setFilters,
  fetchData,
  setPage
}) => {
  const [showFilters, setShowFilters] = useState(false);

  // Autocomplete suggestions
  const [moNoSuggestions, setMoNoSuggestions] = useState([]);
  const [custStyleSuggestions, setCustStyleSuggestions] = useState([]);
  const [empIdSuggestions, setEmpIdSuggestions] = useState([]);

  // Dropdown options
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [filteredBuyerOptions, setFilteredBuyerOptions] = useState([]);
  const [filteredColorOptions, setFilteredColorOptions] = useState([]);
  const [filteredSizeOptions, setFilteredSizeOptions] = useState([]);

  // Dropdown visibility
  const [isBuyerOpen, setIsBuyerOpen] = useState(false);
  const [isColorOpen, setIsColorOpen] = useState(false);
  const [isSizeOpen, setIsSizeOpen] = useState(false);

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (field, query, setSuggestions) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/${module}-autocomplete`,
        {
          params: { field, query }
        }
      );
      setSuggestions(response.data);
    } catch (error) {
      console.error(`Error fetching suggestions for ${field}:`, error);
    }
  };

  // Fetch dropdown options on mount
  const fetchDropdownOptions = async () => {
    try {
      const [buyerRes, colorRes, sizeRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/${module}-autocomplete`, {
          params: { field: "buyer" }
        }),
        axios.get(`${API_BASE_URL}/api/${module}-autocomplete`, {
          params: { field: "color" }
        }),
        axios.get(`${API_BASE_URL}/api/${module}-autocomplete`, {
          params: { field: "size" }
        })
      ]);
      setBuyerOptions(buyerRes.data);
      setColorOptions(colorRes.data);
      setSizeOptions(sizeRes.data);
      setFilteredBuyerOptions(buyerRes.data);
      setFilteredColorOptions(colorRes.data);
      setFilteredSizeOptions(sizeRes.data);
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
    }
  };

  // Handle input change with autocomplete
  const handleInputChange = (field, value, setValue, setSuggestions) => {
    setValue(value);
    if (value.length > 0) {
      fetchSuggestions(field, value, setSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  // Handle dropdown search
  const handleDropdownSearch = (value, options, setFilteredOptions) => {
    const filtered = options.filter((option) =>
      option.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOptions(filtered);
  };

  // Apply filters
  const handleApplyFilters = async () => {
    setPage(1);
    await fetchData(filters, 1);
  };

  // Reset filters
  const handleResetFilters = async () => {
    const resetFilters = {
      moNo: "",
      custStyle: "",
      buyer: "",
      color: "",
      size: "",
      empId: ""
    };
    setFilters(resetFilters);
    setMoNoSuggestions([]);
    setCustStyleSuggestions([]);
    setEmpIdSuggestions([]);
    setFilteredBuyerOptions(buyerOptions);
    setFilteredColorOptions(colorOptions);
    setFilteredSizeOptions(sizeOptions);
    setIsBuyerOpen(false);
    setIsColorOpen(false);
    setIsSizeOpen(false);
    setPage(1);
    await fetchData({}, 1);
  };

  // Fetch dropdown options on mount
  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const filterPane = document.querySelector(".filter-pane");
      if (filterPane && !filterPane.contains(event.target)) {
        setIsBuyerOpen(false);
        setIsColorOpen(false);
        setIsSizeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Filter Pane Toggle Button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="text-blue-500 mr-2">📋</span>
          <h2 className="text-2xl font-semibold text-gray-800">
            {module.charAt(0).toUpperCase() + module.slice(1)} Live Data
          </h2>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
        >
          <span className="mr-2">🔍</span>
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Filter Pane */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 filter-pane">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            {/* MO No */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">
                MO No
              </label>
              <input
                type="text"
                value={filters.moNo}
                onChange={(e) =>
                  handleInputChange(
                    "selectedMono",
                    e.target.value,
                    (value) => setFilters({ ...filters, moNo: value }),
                    setMoNoSuggestions
                  )
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {moNoSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {moNoSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setFilters({ ...filters, moNo: suggestion });
                        setMoNoSuggestions([]);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 cursor-pointer"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Cust. Style */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">
                Cust. Style
              </label>
              <input
                type="text"
                value={filters.custStyle}
                onChange={(e) =>
                  handleInputChange(
                    "custStyle",
                    e.target.value,
                    (value) => setFilters({ ...filters, custStyle: value }),
                    setCustStyleSuggestions
                  )
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {custStyleSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {custStyleSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setFilters({ ...filters, custStyle: suggestion });
                        setCustStyleSuggestions([]);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 cursor-pointer"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Buyer */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">
                Buyer
              </label>
              <input
                type="text"
                value={filters.buyer}
                onChange={(e) => {
                  setFilters({ ...filters, buyer: e.target.value });
                  handleDropdownSearch(
                    e.target.value,
                    buyerOptions,
                    setFilteredBuyerOptions
                  );
                }}
                onFocus={() => setIsBuyerOpen(true)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isBuyerOpen && filteredBuyerOptions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredBuyerOptions.map((option, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setFilters({ ...filters, buyer: option });
                        setIsBuyerOpen(false);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 cursor-pointer"
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Color */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">
                Color
              </label>
              <input
                type="text"
                value={filters.color}
                onChange={(e) => {
                  setFilters({ ...filters, color: e.target.value });
                  handleDropdownSearch(
                    e.target.value,
                    colorOptions,
                    setFilteredColorOptions
                  );
                }}
                onFocus={() => setIsColorOpen(true)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isColorOpen && filteredColorOptions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredColorOptions.map((option, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setFilters({ ...filters, color: option });
                        setIsColorOpen(false);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 cursor-pointer"
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Size */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">
                Size
              </label>
              <input
                type="text"
                value={filters.size}
                onChange={(e) => {
                  setFilters({ ...filters, size: e.target.value });
                  handleDropdownSearch(
                    e.target.value,
                    sizeOptions,
                    setFilteredSizeOptions
                  );
                }}
                onFocus={() => setIsSizeOpen(true)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isSizeOpen && filteredSizeOptions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredSizeOptions.map((option, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setFilters({ ...filters, size: option });
                        setIsSizeOpen(false);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 cursor-pointer"
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Emp ID */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">
                Emp ID
              </label>
              <input
                type="text"
                value={filters.empId}
                onChange={(e) =>
                  handleInputChange(
                    empIdField,
                    e.target.value,
                    (value) => setFilters({ ...filters, empId: value }),
                    setEmpIdSuggestions
                  )
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {empIdSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {empIdSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setFilters({ ...filters, empId: suggestion });
                        setEmpIdSuggestions([]);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 cursor-pointer"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="mt-4 flex space-x-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200"
            >
              Apply Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterPaneWOI;
