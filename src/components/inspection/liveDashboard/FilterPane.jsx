import React, { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import DateSelector from "../../forms/DateSelector";

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
  dataSource = "qc2-inspection-pass-bundle" // Default to original data source
}) => {
  const [showFilters, setShowFilters] = useState(true);
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [empIdOptions, setEmpIdOptions] = useState([]);
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [lineNoOptions, setLineNoOptions] = useState([]);

  // Format Date to "MM/DD/YYYY"
  const formatDate = (date) => {
    if (!date) return "";
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

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
  }, [dataSource]); // Re-fetch when dataSource changes

  return (
    <>
      <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow mb-2">
        <div className="flex items-center space-x-2">
          <Filter className="text-blue-500" size={20} />
          <h2 className="text-lg font-medium text-gray-700">Filters</h2>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-blue-500 flex items-center hover:text-blue-600"
        >
          {showFilters ? "Hide" : "Show"}
        </button>
      </div>
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <DateSelector
                selectedDate={startDate}
                hideLabel={true}
                onChange={(date) => setStartDate(date)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <DateSelector
                selectedDate={endDate}
                hideLabel={true}
                onChange={(date) => setEndDate(date)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                MO No
              </label>
              <input
                type="text"
                value={moNo}
                onChange={(e) => setMoNo(e.target.value)}
                list="moNoOptions"
                placeholder="Search MO No"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <datalist id="moNoOptions">
                {moNoOptions
                  .filter(
                    (opt) =>
                      opt && opt.toLowerCase().includes(moNo.toLowerCase())
                  )
                  .map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
              </datalist>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Color</option>
                {colorOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Size</option>
                {sizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Department</option>
                {departmentOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Emp ID
              </label>
              <input
                type="text"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                list="empIdOptions"
                placeholder="Search Emp ID"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <datalist id="empIdOptions">
                {empIdOptions
                  .filter(
                    (opt) =>
                      opt && opt.toLowerCase().includes(empId.toLowerCase())
                  )
                  .map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
              </datalist>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Buyer
              </label>
              <select
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Buyer</option>
                {buyerOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Line No
              </label>
              <select
                value={lineNo}
                onChange={(e) => setLineNo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Line No</option>
                {lineNoOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={onApplyFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Apply
            </button>
            <button
              onClick={onResetFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      )}
      {Object.keys(appliedFilters).length > 0 && (
        <div className="mb-4">
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
    </>
  );
};

export default FilterPane;
