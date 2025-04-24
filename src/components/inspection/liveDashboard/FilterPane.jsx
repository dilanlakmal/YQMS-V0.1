import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const FilterPane = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  moNo,
  setMoNo,
  color,
  setColor,
  size,
  setSize,
  department,
  setDepartment,
  empId,
  setEmpId,
  buyer,
  setBuyer,
  lineNo,
  setLineNo,
  appliedFilters,
  setAppliedFilters,
  onApplyFilters,
  onResetFilters,
  dataSource = "qc2-inspection-pass-bundle"
}) => {
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [empIdOptions, setEmpIdOptions] = useState([]);
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [lineNoOptions, setLineNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [showEmpIdDropdown, setShowEmpIdDropdown] = useState(false);
  const moNoRef = useRef(null);
  const empIdRef = useRef(null);

  // Fetch filter options based on dataSource
  const fetchFilterOptions = async () => {
    try {
      const endpoint =
        dataSource === "qc2-orderdata"
          ? `${API_BASE_URL}/api/qc2-orderdata/filter-options`
          : `${API_BASE_URL}/api/qc2-inspection-pass-bundle/filter-options`;
      const response = await axios.get(endpoint);
      const data = response.data;

      setMoNoOptions(data.moNo || []);
      setColorOptions(data.color || []);
      setSizeOptions(data.size || []);
      setDepartmentOptions(data.department || []);
      setEmpIdOptions(
        dataSource === "qc2-orderdata"
          ? data.empId || []
          : data.emp_id_inspection || []
      );
      setBuyerOptions(data.buyer || []);
      setLineNoOptions(data.lineNo || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, [dataSource]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moNoRef.current && !moNoRef.current.contains(event.target)) {
        setShowMoNoDropdown(false);
      }
      if (empIdRef.current && !empIdRef.current.contains(event.target)) {
        setShowEmpIdDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMoNoInput = (e) => {
    const value = e.target.value;
    setMoNo(value);
    setShowMoNoDropdown(true);
  };

  const handleEmpIdInput = (e) => {
    const value = e.target.value;
    setEmpId(value);
    setShowEmpIdDropdown(true);
  };

  const handleFilterChange = (key, value) => {
    switch (key) {
      case "moNo":
        setMoNo(value);
        setShowMoNoDropdown(false);
        break;
      case "empId":
        setEmpId(value);
        setShowEmpIdDropdown(false);
        break;
      case "startDate":
        setStartDate(value);
        break;
      case "endDate":
        setEndDate(value);
        break;
      case "color":
        setColor(value);
        break;
      case "size":
        setSize(value);
        break;
      case "department":
        setDepartment(value);
        break;
      case "buyer":
        setBuyer(value);
        break;
      case "lineNo":
        setLineNo(value);
        break;
      default:
        break;
    }
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setMoNo("");
    setColor("");
    setSize("");
    setDepartment("");
    setEmpId("");
    setBuyer("");
    setLineNo("");
    setAppliedFilters({});
    setShowMoNoDropdown(false);
    setShowEmpIdDropdown(false);
    onResetFilters();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-sm font-semibold mb-4">Filters</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-2 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <DatePicker
            selected={startDate}
            onChange={(date) => handleFilterChange("startDate", date)}
            dateFormat="MM/dd/yyyy"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholderText="Start Date"
            popperPlacement="bottom-start"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <DatePicker
            selected={endDate}
            onChange={(date) => handleFilterChange("endDate", date)}
            dateFormat="MM/dd/yyyy"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholderText="End Date"
            popperPlacement="bottom-start"
          />
        </div>
        <div ref={moNoRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MO No
          </label>
          <input
            type="text"
            value={moNo}
            onChange={handleMoNoInput}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="MO No"
          />
          {showMoNoDropdown && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
              {moNoOptions
                .filter((mo) => mo.toLowerCase().includes(moNo.toLowerCase()))
                .map((mo) => (
                  <li
                    key={mo}
                    onClick={() => handleFilterChange("moNo", mo)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {mo}
                  </li>
                ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <select
            value={color}
            onChange={(e) => handleFilterChange("color", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select Color</option>
            {colorOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Size
          </label>
          <select
            value={size}
            onChange={(e) => handleFilterChange("size", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select Size</option>
            {sizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => handleFilterChange("department", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select Department</option>
            {departmentOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div ref={empIdRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emp ID
          </label>
          <input
            type="text"
            value={empId}
            onChange={handleEmpIdInput}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Emp ID"
          />
          {showEmpIdDropdown && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
              {empIdOptions
                .filter((emp) =>
                  emp.toLowerCase().includes(empId.toLowerCase())
                )
                .map((emp) => (
                  <li
                    key={emp}
                    onClick={() => handleFilterChange("empId", emp)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {emp}
                  </li>
                ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buyer
          </label>
          <select
            value={buyer}
            onChange={(e) => handleFilterChange("buyer", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select Buyer</option>
            {buyerOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Line No
          </label>
          <select
            value={lineNo}
            onChange={(e) => handleFilterChange("lineNo", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select Line No</option>
            {lineNoOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 whitespace-nowrap text-sm"
          >
            Clear
          </button>
          <button
            onClick={onApplyFilters}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 whitespace-nowrap text-sm"
          >
            Apply
          </button>
        </div>
      </div>
      {Object.keys(appliedFilters).length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Applied Filters:
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(appliedFilters).map(([key, value]) => (
              <div
                key={key}
                className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs"
              >
                {key}: {value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPane;
