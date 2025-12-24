import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import {
  Loader2,
  AlertTriangle,
  Search,
  Percent,
  Package,
  AlertCircle,
  X
} from "lucide-react";
import { API_BASE_URL } from "../../../../config";

// --- Reusable Components ---
const StatCard = ({
  icon,
  label,
  value,
  colorClass = "text-gray-800 dark:text-gray-200"
}) => (
  <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg flex items-start">
    <div
      className={`p-3 mr-4 rounded-full ${colorClass.replace(
        "text-",
        "bg-"
      )}/10`}
    >
      {React.cloneElement(icon, { size: 24, className: colorClass })}
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  </div>
);

// --- Theme-aware styles for react-select, using CSS variables ---
const reactSelectStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: "var(--color-bg-secondary)",
    borderColor: "var(--color-border)",
    boxShadow: "none",
    "&:hover": { borderColor: "var(--color-border-hover)" }
  }),
  singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
  input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-bg-secondary)",
    zIndex: 30
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected
      ? "var(--color-bg-accent-active)"
      : isFocused
      ? "var(--color-bg-accent)"
      : "var(--color-bg-secondary)",
    color: "var(--color-text-primary)"
  }),
  placeholder: (base) => ({ ...base, color: "var(--color-text-secondary)" })
};

// --- Helper component for consistent filter field layout ---
const FilterField = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    {children}
  </div>
);

const QCWorkersQCInspection = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
    endDate: new Date(),
    reportType: { value: "QC1-Inside", label: "QC1-Inside (Seq 39)" },
    qcId: null,
    // --- Add new state for selected defects. It's an array for multi-select. ---
    selectedDefects: []
  });

  const [defectNameOptions, setDefectNameOptions] = useState([]);
  const [qcIdOptions, setQcIdOptions] = useState([]);
  const [resultsData, setResultsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topN, setTopN] = useState(5);

  const reportTypeOptions = [
    { value: "QC1-Inside", label: "QC1-Inside (Seq 39)" },
    { value: "QC1-Outside", label: "QC1-Outside (Seq 38)" },
    { value: "QC2", label: "QC2 (Seq 54)" }
  ];

  const topNOptions = [3, 5, 7, 10];

  // Create a memoized Set for quick filtering of selected defects ---
  const selectedDefectNames = useMemo(() => {
    // Create a Set of the selected defect values (e.g., ['Uneven Seam', 'Broken Stitch']) for fast lookups.
    return new Set(filters.selectedDefects.map((d) => d.value));
  }, [filters.selectedDefects]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const params = {
        startDate: filters.startDate.toISOString().split("T")[0],
        endDate: filters.endDate.toISOString().split("T")[0],
        reportType: filters.reportType?.value
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/qc-output/filters`,
        { params }
      );
      //  Set options for both QC ID and Defect Name dropdowns ---
      setQcIdOptions(
        response.data.qcIds.map((id) => ({ value: id, label: id }))
      );
      setDefectNameOptions(
        response.data.defectNames.map((name) => ({ value: name, label: name }))
      );
    } catch (err) {
      console.error("Failed to fetch filter options", err);
    }
  }, [filters.startDate, filters.endDate, filters.reportType]);

  useEffect(() => {
    if (filters.startDate && filters.endDate && filters.reportType) {
      //  Call the renamed function ---
      fetchFilterOptions();
    }
  }, [fetchFilterOptions]);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      //  Transform the selectedDefects array into a comma-separated string for the API query ---
      const defectNamesParam = filters.selectedDefects
        .map((d) => d.value)
        .join(",");

      const params = {
        startDate: filters.startDate.toISOString().split("T")[0],
        endDate: filters.endDate.toISOString().split("T")[0],
        reportType: filters.reportType?.value,
        qcId: filters.qcId?.value,
        //  Add the new parameter to the request if it exists ---
        ...(defectNamesParam && { defectNames: defectNamesParam })
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/qc-output/inspection-data`,
        { params }
      );
      setResultsData(response.data);
    } catch (err) {
      setError("Failed to fetch results. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters((f) => ({
      ...f,
      [name]: value,
      //  Reset dependent filters when a primary filter changes ---
      ...(name === "reportType" && { qcId: null, selectedDefects: [] })
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
      endDate: new Date(),
      reportType: { value: "QC1-Inside", label: "QC1-Inside (Seq 39)" },
      qcId: null,
      //  Reset the new defect filter state as well ---
      selectedDefects: []
    });
    setResultsData([]);
  };

  const buildSeeMoreLink = (qcId) => {
    const params = new URLSearchParams({
      startDate: filters.startDate.toISOString().split("T")[0],
      endDate: filters.endDate.toISOString().split("T")[0],
      reportType: filters.reportType.value,
      qcId: qcId
    });
    return `/qc-output/full-report?${params.toString()}`;
  };

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Filter Pane */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 p-4 border rounded-lg dark:border-gray-700">
        <FilterField label="Start Date">
          <DatePicker
            selected={filters.startDate}
            onChange={(date) => handleFilterChange("startDate", date)}
            className="w-full p-2 border rounded-md bg-[var(--color-bg-secondary)] border-[var(--color-border)]"
            portalId="root-portal"
            popperClassName="react-datepicker-popper-z-50" // Ensures calendar appears on top
          />
        </FilterField>
        <FilterField label="End Date">
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => handleFilterChange("endDate", date)}
            className="w-full p-2 border rounded-md bg-[var(--color-bg-secondary)] border-[var(--color-border)]"
            portalId="root-portal"
            popperClassName="react-datepicker-popper-z-50"
          />
        </FilterField>
        <FilterField label="Report Type">
          <Select
            options={reportTypeOptions}
            value={filters.reportType}
            onChange={(val) => handleFilterChange("reportType", val)}
            styles={reactSelectStyles}
          />
        </FilterField>
        <FilterField label="QC ID">
          <Select
            placeholder="All QC"
            options={qcIdOptions}
            value={filters.qcId}
            onChange={(val) => handleFilterChange("qcId", val)}
            isClearable
            styles={reactSelectStyles}
          />
        </FilterField>
        {/*  Add new multi-select filter for Defect Names --- */}
        <FilterField label="Defect Name">
          <Select
            isMulti
            placeholder="Filter by Defect..."
            options={defectNameOptions}
            value={filters.selectedDefects}
            onChange={(val) => handleFilterChange("selectedDefects", val)}
            styles={reactSelectStyles}
            closeMenuOnSelect={false}
          />
        </FilterField>
        <div className="flex items-end gap-2">
          <button
            onClick={fetchResults}
            disabled={isLoading}
            className="flex-grow flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 h-[42px]"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Search />}{" "}
            Search
          </button>
          <button
            onClick={clearFilters}
            title="Clear Filters"
            className="p-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 h-[42px]"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Results Display */}
      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 size={40} className="animate-spin text-indigo-500" />
        </div>
      )}
      {error && (
        <div className="text-center p-8 text-red-500">
          <AlertTriangle className="mx-auto mb-2" />
          {error}
        </div>
      )}

      {!isLoading && !error && resultsData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {resultsData.map((qc) => {
            // Filter the defects for display based on the filter selection ---
            const defectsToDisplay =
              selectedDefectNames.size > 0
                ? qc.topDefects.filter((defect) =>
                    selectedDefectNames.has(defect.defectName)
                  )
                : qc.topDefects;

            return (
              <div
                key={qc.qcId}
                className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border dark:border-gray-700 flex flex-col"
              >
                {/* Header */}
                <div className="p-4 flex items-center border-b dark:border-gray-700">
                  <img
                    src={
                      qc.facePhoto ||
                      `https://ui-avatars.com/api/?name=${qc.qcName}&background=random`
                    }
                    alt={qc.qcName}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{qc.qcName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {qc.qcId}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    icon={<Package />}
                    label="Total Output"
                    value={qc.totalOutput.toLocaleString()}
                  />
                  <StatCard
                    icon={<AlertCircle />}
                    label="Total Defects"
                    value={qc.totalDefect.toLocaleString()}
                    colorClass="text-orange-500"
                  />
                  <StatCard
                    icon={<Percent />}
                    label="Defect Rate"
                    value={`${qc.defectRate.toFixed(2)}%`}
                    colorClass="text-red-500"
                  />
                </div>

                {/* Top Defects */}
                <div className="p-4 border-t dark:border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-semibold">Top Defects</h4>
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-full text-xs">
                      {topNOptions.map((n) => (
                        <button
                          key={n}
                          onClick={() => setTopN(n)}
                          className={`px-3 py-1 rounded-full transition-colors duration-200 ${
                            topN === n
                              ? "bg-indigo-600 text-white"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        onClick={() => setTopN(Infinity)}
                        className={`px-3 py-1 rounded-full transition-colors duration-200 ${
                          topN === Infinity
                            ? "bg-indigo-600 text-white"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        All
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase">
                        <tr>
                          <th className="p-2 text-left">Defect Name</th>
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-gray-700">
                        {defectsToDisplay.slice(0, topN).map((defect) => (
                          <tr key={defect.defectName}>
                            <td className="p-2 whitespace-nowrap">
                              {defect.defectName}
                            </td>
                            <td className="p-2 text-center font-semibold">
                              {defect.qty}
                            </td>
                            <td className="p-2 text-right font-mono text-red-500">
                              {defect.defectRate.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Link
                    to={buildSeeMoreLink(qc.qcId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-4"
                  >
                    See more details...
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!isLoading && !error && resultsData.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">
          No results found for the selected filters.
        </p>
      )}
    </div>
  );
};

export default QCWorkersQCInspection;
