import React, { useState, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaFilter, FaTimes, FaCalendarAlt } from "react-icons/fa";
import Select from "react-select";
import { API_BASE_URL } from "../../../config";
import { useTranslation } from "react-i18next";

const DynamicFilterPane = ({
  initialFilters,
  onApplyFilters,
  distinctFiltersEndpoint
}) => {
  const { t } = useTranslation();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  // --- MODIFIED: localFilters state ---
  const [localFilters, setLocalFilters] = useState({
    filterDate: "",
    qcId: "",
    packageNo: "",
    moNo: "",
    taskNo: "",
    department: "",
    lineNo: "" // ADDED
    // custStyle: "" // REMOVED
  });

  // --- MODIFIED: Options state ---
  const [taskNoOptions, setTaskNoOptions] = useState([]);
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [packageNoOptions, setPackageNoOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [lineNoOptions, setLineNoOptions] = useState([]); // ADDED
  // const [custStyleOptions, setCustStyleOptions] = useState([]); // REMOVED
  const [qcIdOptions, setQcIdOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (initialFilters) {
      // --- MODIFIED: Update local state from props ---
      setLocalFilters({
        filterDate:
          initialFilters.filterDate || new Date().toISOString().split("T")[0],
        qcId: initialFilters.qcId || "",
        packageNo: initialFilters.packageNo || "",
        moNo: initialFilters.moNo || "",
        taskNo: initialFilters.taskNo || "",
        department: initialFilters.department || "",
        lineNo: initialFilters.lineNo || "" // ADDED
        // custStyle: initialFilters.custStyle || "" // REMOVED
      });
    }
  }, [initialFilters]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingOptions(true);
      if (!distinctFiltersEndpoint) {
        setLoadingOptions(false);
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}${distinctFiltersEndpoint}`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch filter options from ${distinctFiltersEndpoint}`
          );
        }
        const data = await response.json();

        // --- MODIFIED: Set options from API response ---
        setTaskNoOptions(
          data.taskNos?.map((tn) => ({ value: tn, label: tn })) || []
        );
        setMoNoOptions(
          data.moNos?.map((mo) => ({ value: mo, label: mo })) || []
        );
        setPackageNoOptions(
          data.packageNos?.map((pn) => ({ value: pn, label: pn })) || []
        );
        setDepartmentOptions(
          data.departments?.map((dept) => ({ value: dept, label: dept })) || []
        );
        setLineNoOptions(
          data.lineNos?.map((ln) => ({ value: ln, label: ln })) || []
        ); // ADDED
        // setCustStyleOptions(data.custStyles?.map((style) => ({ value: style, label: style })) || []); // REMOVED
        setQcIdOptions(
          data.qcIds?.map((id) => ({ value: id, label: id })) || []
        );
      } catch (error) {
        console.error("Error fetching filter options:", error);
        // Set empty options in case of an error
        setTaskNoOptions([]);
        setMoNoOptions([]);
        setPackageNoOptions([]);
        setDepartmentOptions([]);
        setLineNoOptions([]); // ADDED
        // setCustStyleOptions([]); // REMOVED
        setQcIdOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchFilterOptions();
  }, [distinctFiltersEndpoint]);

  const handleChange = (name, value) => {
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };
  const handleDateChange = (name, date) => {
    const dateString = date ? date.toISOString().split("T")[0] : "";
    handleChange(name, dateString);
  };
  const handleSelectChange = (name, selectedOption) => {
    setLocalFilters((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : ""
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onApplyFilters) onApplyFilters(localFilters);
  };

  const handleReset = () => {
    // --- MODIFIED: Reset state ---
    const resetState = {
      filterDate:
        initialFilters?.filterDate || new Date().toISOString().split("T")[0],
      qcId: initialFilters?.qcId || "",
      packageNo: initialFilters?.packageNo || "",
      moNo: initialFilters?.moNo || "",
      taskNo: initialFilters?.taskNo || "",
      department: initialFilters?.department || "",
      lineNo: initialFilters?.lineNo || "" // ADDED
      // custStyle: initialFilters?.custStyle || "" // REMOVED
    };
    setLocalFilters(resetState);
    if (onApplyFilters) onApplyFilters(resetState);
  };

  const parseDateForPicker = (dateString) => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    const parts = dateString.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10),
        month = parseInt(parts[1], 10) - 1,
        day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day))
        return new Date(year, month, day);
    }
    return null;
  };

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "38px",
      height: "38px",
      boxShadow: "none",
      borderColor: "rgb(209 213 219)",
      "&:hover": { borderColor: "rgb(167 139 250)" },
      fontSize: "0.875rem",
      borderRadius: "0.375rem"
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: "38px",
      padding: "0 8px"
    }),
    input: (provided) => ({ ...provided, margin: "0px", padding: "0px" }),
    indicatorSeparator: () => ({ display: "none" }),
    indicatorsContainer: (provided) => ({ ...provided, height: "38px" }),
    menu: (provided) => ({ ...provided, zIndex: 20 }),
    placeholder: (provided) => ({ ...provided, color: "rgb(107 114 128)" })
  };

  const qcIdValueForSelect = useMemo(() => {
    if (!localFilters.qcId) return null;
    const foundOption = qcIdOptions.find(
      (option) => option.value === localFilters.qcId
    );
    if (foundOption) return foundOption;
    return { value: localFilters.qcId, label: localFilters.qcId };
  }, [localFilters.qcId, qcIdOptions]);

  return (
    <div
      className={`bg-white rounded-xl shadow-xl p-4 mb-6 ${
        !showAdvancedFilters ? "pb-1" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base md:text-lg font-semibold text-gray-700 flex items-center">
          <FaFilter className="mr-2 text-indigo-600" />{" "}
          {t("bundle.filters", "Filters")}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center text-xs md:text-sm text-indigo-600 hover:text-indigo-800 font-medium p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
          >
            {showAdvancedFilters
              ? t("bundle.hide_filters", "Hide Filters")
              : t("bundle.show_filters", "Show Filters")}
          </button>
          {showAdvancedFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-100 transition-colors"
              title={t("bundle.clear_filters", "Clear Filters")}
            >
              <FaTimes size={14} />
            </button>
          )}
        </div>
      </div>
      {showAdvancedFilters && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-4 mb-1 transition-all duration-300 ease-in-out"
        >
          {/* Date Filter */}
          <div className="flex flex-col">
            <label
              htmlFor="filterDate"
              className="text-xs font-medium text-gray-600 mb-1 flex items-center"
            >
              <FaCalendarAlt className="mr-1.5 text-gray-400" />
              {t("filters.date", "Date")}
            </label>
            <DatePicker
              selected={parseDateForPicker(localFilters.filterDate)}
              onChange={(date) => handleDateChange("filterDate", date)}
              dateFormat="MM/dd/yyyy"
              className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              id="filterDate"
              autoComplete="off"
              placeholderText={t("filters.select_date", "Select date")}
            />
          </div>
          {/* Package No */}
          <div className="flex flex-col">
            <label
              htmlFor="packageNoFilter"
              className="text-xs font-medium text-gray-600 mb-1"
            >
              {t("filters.package_no", "Package No")}
            </label>
            <Select
              id="packageNoFilter"
              options={packageNoOptions}
              value={
                packageNoOptions.find(
                  (option) => option.value === localFilters.packageNo
                ) || null
              }
              onChange={(selectedOption) =>
                handleSelectChange("packageNo", selectedOption)
              }
              isClearable
              isSearchable
              placeholder={t("filters.enter_package_no", "Package...")}
              styles={selectStyles}
              isLoading={loadingOptions}
            />
          </div>
          {/* Task No */}
          <div className="flex flex-col">
            <label
              htmlFor="taskNoFilter"
              className="text-xs font-medium text-gray-600 mb-1"
            >
              {t("filters.task_no", "Task No.")}
            </label>
            <Select
              id="taskNoFilter"
              options={taskNoOptions}
              value={
                taskNoOptions.find(
                  (option) => option.value === localFilters.taskNo
                ) || null
              }
              onChange={(selectedOption) =>
                handleSelectChange("taskNo", selectedOption)
              }
              isClearable
              isSearchable
              placeholder={t("filters.enter_task_no", "Task...")}
              styles={selectStyles}
              isLoading={loadingOptions}
            />
          </div>
          {/* MO No */}
          <div className="flex flex-col">
            <label
              htmlFor="moNoFilter"
              className="text-xs font-medium text-gray-600 mb-1"
            >
              {t("filters.mo_no", "MO No")}
            </label>
            <Select
              id="moNoFilter"
              options={moNoOptions}
              value={
                moNoOptions.find(
                  (option) => option.value === localFilters.moNo
                ) || null
              }
              onChange={(selectedOption) =>
                handleSelectChange("moNo", selectedOption)
              }
              isClearable
              isSearchable
              placeholder={t("filters.enter_mo_no", "MONo...")}
              styles={selectStyles}
              isLoading={loadingOptions}
            />
          </div>
          {/* Department */}
          <div className="flex flex-col">
            <label
              htmlFor="departmentFilter"
              className="text-xs font-medium text-gray-600 mb-1"
            >
              {t("filters.department", "Department")}
            </label>
            <Select
              id="departmentFilter"
              options={departmentOptions}
              value={
                departmentOptions.find(
                  (option) => option.value === localFilters.department
                ) || null
              }
              onChange={(selectedOption) =>
                handleSelectChange("department", selectedOption)
              }
              isClearable
              isSearchable
              placeholder={t("filters.select_department", "Department")}
              styles={selectStyles}
              isLoading={loadingOptions}
            />
          </div>

          {/* --- MODIFIED: Replaced Style No with Line No --- */}
          {/* Line No Filter (ADDED) */}
          <div className="flex flex-col">
            <label
              htmlFor="lineNoFilter"
              className="text-xs font-medium text-gray-600 mb-1"
            >
              {t("filters.line_no", "Line No")}
            </label>
            <Select
              id="lineNoFilter"
              options={lineNoOptions}
              value={
                lineNoOptions.find(
                  (option) => option.value === localFilters.lineNo
                ) || null
              }
              onChange={(selectedOption) =>
                handleSelectChange("lineNo", selectedOption)
              }
              isClearable
              isSearchable
              placeholder={t("filters.select_line_no", "Line No")}
              styles={selectStyles}
              isLoading={loadingOptions}
            />
          </div>

          {/* QC ID Filter */}
          <div className="flex flex-col">
            <label
              htmlFor="qcIdFilter"
              className="text-xs font-medium text-gray-600 mb-1"
            >
              {t("filters.qc_id", "QC ID")}
            </label>
            <Select
              id="qcIdFilter"
              options={qcIdOptions}
              value={qcIdValueForSelect}
              onChange={(selectedOption) =>
                handleSelectChange("qcId", selectedOption)
              }
              isClearable
              isSearchable
              placeholder={t("filters.select_qc_id", "QC ID")}
              styles={selectStyles}
              isLoading={loadingOptions}
            />
          </div>
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-7 flex justify-end items-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {t("filters.apply_filters", "Apply Filters")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DynamicFilterPane;
