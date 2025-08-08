import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import {
  Loader2,
  AlertTriangle,
  Search,
  BarChart,
  CheckCircle,
  XCircle,
  Percent,
  Star,
  FileText
} from "lucide-react";
import QCAccuracyResultsPopup from "./QCAccuracyResultsPopup";

// --- StatCard is updated to display sub-details ---
const StatCard = ({
  icon,
  label,
  value,
  colorClass = "text-gray-800 dark:text-gray-200",
  children
}) => (
  <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg flex flex-col justify-between">
    <div className="flex items-center">
      <div
        className={`p-2 mr-3 rounded-full ${colorClass.replace(
          "text-",
          "bg-"
        )}/10`}
      >
        {React.cloneElement(icon, { size: 20, className: colorClass })}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
      </div>
    </div>
    {children && <div className="mt-2">{children}</div>}
  </div>
);

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

const QAAccuracyResults = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
    endDate: new Date(),
    qaId: null,
    qcId: null,
    reportType: null,
    moNo: null,
    lineNo: null,
    tableNo: null,
    // --- ADD OVERALL GRADE TO THE FILTER STATE ---
    overallGrade: null
  });
  // --- NEW STATE FOR FILTER OPTIONS ---
  const [filterOptions, setFilterOptions] = useState({
    qaIds: [],
    qcIds: [],
    moNos: [],
    lineNos: [],
    tableNos: []
  });

  const [resultsData, setResultsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedQcData, setSelectedQcData] = useState(null);

  // --- State to manage the active defect filter for each card ---
  const [activeDefectFilter, setActiveDefectFilter] = useState("All");

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/qa-accuracy/filter-options`
        );
        const formatOptions = (arr) =>
          arr.map((item) => ({ value: item, label: item }));
        setFilterOptions({
          qaIds: formatOptions(response.data.qaIds),
          qcIds: formatOptions(response.data.qcIds),
          moNos: formatOptions(response.data.moNos),
          lineNos: formatOptions(response.data.lineNos),
          tableNos: formatOptions(response.data.tableNos)
        });
      } catch (err) {
        console.error("Failed to fetch filter options", err);
      }
    };
    fetchOptions();
  }, []);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        startDate: filters.startDate.toISOString().split("T")[0],
        endDate: filters.endDate.toISOString().split("T")[0],
        qaId: filters.qaId?.value,
        qcId: filters.qcId?.value,
        reportType: filters.reportType?.value,
        moNo: filters.moNo?.value,
        lineNo: filters.lineNo?.value,
        tableNo: filters.tableNo?.value
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-accuracy/results`,
        { params }
      );
      setResultsData(response.data);
    } catch (err) {
      setError("Failed to fetch results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Auto-fetch on initial load
  useEffect(() => {
    fetchResults();
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters((f) => ({ ...f, [name]: value }));
    // Special handling for reportType to clear conflicting fields
    if (name === "reportType") {
      setFilters((f) => ({ ...f, lineNo: null, tableNo: null }));
    }
  };

  const getGradeAndColor = (accuracy) => {
    if (accuracy >= 100)
      return {
        grade: "A",
        color:
          "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
      };
    if (accuracy >= 95)
      return {
        grade: "B",
        color:
          "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
      };
    if (accuracy >= 92.5)
      return {
        grade: "C",
        color:
          "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400"
      };
    return {
      grade: "D",
      color: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
    };
  };

  const reportTypeOptions = [
    { value: "First Output", label: "First Output" },
    { value: "Inline Sewing", label: "Inline Sewing" },
    { value: "Inline Finishing", label: "Inline Finishing" }
  ];

  // --- DEFINE GRADE OPTIONS FOR THE DROPDOWN ---
  const gradeOptions = [
    { value: "A", label: "Grade A" },
    { value: "B", label: "Grade B" },
    { value: "C", label: "Grade C" },
    { value: "D", label: "Grade D" }
  ];

  // --- FILTER THE DISPLAYED DATA BASED ON THE SELECTED GRADE ---
  const filteredDisplayData = resultsData.filter((qc) => {
    if (!filters.overallGrade) {
      return true; // If "All" or null, show everything
    }
    const { grade } = getGradeAndColor(qc.stats.accuracy);
    return grade === filters.overallGrade.value;
  });

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* ---ADD GRADE FILTER AND ADJUST GRID --- */}
      {/* --- REPLACED INPUTS WITH SELECTS --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6 p-4 border rounded-lg dark:border-gray-700">
        <DatePicker
          selected={filters.startDate}
          onChange={(date) => handleFilterChange("startDate", date)}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          portalId="root-portal"
          popperClassName="react-datepicker-popper-z-50" // High z-index for the calendar
        />
        <DatePicker
          selected={filters.endDate}
          onChange={(date) => handleFilterChange("endDate", date)}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          portalId="root-portal"
          popperClassName="react-datepicker-popper-z-50" // High z-index for the calendar
        />
        <Select
          placeholder="QA ID"
          options={filterOptions.qaIds}
          value={filters.qaId}
          onChange={(val) => handleFilterChange("qaId", val)}
          isClearable
          styles={reactSelectStyles}
        />
        <Select
          placeholder="QC ID"
          options={filterOptions.qcIds}
          value={filters.qcId}
          onChange={(val) => handleFilterChange("qcId", val)}
          isClearable
          styles={reactSelectStyles}
        />
        <Select
          placeholder="MO No"
          options={filterOptions.moNos}
          value={filters.moNo}
          onChange={(val) => handleFilterChange("moNo", val)}
          isClearable
          styles={reactSelectStyles}
        />
        <Select
          placeholder="Report Type"
          options={reportTypeOptions}
          value={filters.reportType}
          onChange={(val) => handleFilterChange("reportType", val)}
          isClearable
          styles={reactSelectStyles}
        />
        <Select
          placeholder="Line No"
          options={filterOptions.lineNos}
          value={filters.lineNo}
          onChange={(val) => handleFilterChange("lineNo", val)}
          isDisabled={filters.reportType?.value === "Inline Finishing"}
          isClearable
          styles={reactSelectStyles}
        />
        <Select
          placeholder="Table No"
          options={filterOptions.tableNos}
          value={filters.tableNo}
          onChange={(val) => handleFilterChange("tableNo", val)}
          isDisabled={
            filters.reportType?.value &&
            filters.reportType.value !== "Inline Finishing"
          }
          isClearable
          styles={reactSelectStyles}
        />
        <Select
          placeholder="Overall Grade"
          options={gradeOptions}
          value={filters.overallGrade}
          onChange={(val) => handleFilterChange("overallGrade", val)}
          isClearable
          styles={reactSelectStyles}
        />

        <button
          onClick={fetchResults}
          disabled={isLoading}
          className="lg:col-span-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Search />} Search
        </button>
      </div>
      {/* Results Display */}
      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 size={40} className="animate-spin" />
        </div>
      )}
      {error && (
        <div className="text-center p-8 text-red-500">
          <AlertTriangle className="mx-auto mb-2" />
          {error}
        </div>
      )}
      {/* --- FIX #2: MAP OVER `filteredDisplayData` INSTEAD OF `resultsData` --- */}{" "}
      {/*// old condtion:  !isLoading && !error && resultsData.length*/}
      {!isLoading && !error && filteredDisplayData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDisplayData.map((qc) => {
            // old mapping: resultsData.map

            const { grade, color } = getGradeAndColor(qc.stats.accuracy);
            // --- Logic to filter and sort top defects based on the active filter ---
            const getTopDefects = () => {
              const allDefects = qc.reports.flatMap((r) => r.defects);
              const filteredDefects =
                activeDefectFilter === "All"
                  ? allDefects
                  : allDefects.filter(
                      (d) => d && d.standardStatus === activeDefectFilter
                    );

              const defectCounts = filteredDefects.reduce((acc, defect) => {
                if (defect) {
                  acc[defect.defectNameEng] =
                    (acc[defect.defectNameEng] || 0) + defect.qty;
                }
                return acc;
              }, {});

              return Object.entries(defectCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3);
            };
            const topDefects = getTopDefects();

            return (
              <div
                key={qc.qcId}
                className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border dark:border-gray-700 overflow-hidden flex flex-col"
              >
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
                <div className="p-4 grid grid-cols-2 gap-3 grow">
                  <StatCard
                    icon={<FileText />}
                    label="Checked Qty"
                    value={qc.stats.totalChecked}
                  />
                  <StatCard
                    icon={<XCircle />}
                    label="Reject Pcs"
                    value={qc.stats.totalRejectedPcs}
                    colorClass="text-red-500"
                  />
                  {/* --- Updated Total Defects Card --- */}
                  <StatCard
                    icon={<AlertTriangle />}
                    label="Total Defects"
                    value={qc.stats.totalDefects}
                    colorClass="text-orange-500"
                  >
                    <div className="flex items-center justify-around gap-2 text-xs">
                      <div className="flex items-center gap-1 bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-md font-semibold">
                        <span>MI:</span>
                        <span>{qc.stats.minorCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-orange-200 text-orange-800 px-2 py-0.5 rounded-md font-semibold">
                        <span>MA:</span>
                        <span>{qc.stats.majorCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-red-200 text-red-800 px-2 py-0.5 rounded-md font-semibold">
                        <span>CR:</span>
                        <span>{qc.stats.criticalCount || 0}</span>
                      </div>
                    </div>
                  </StatCard>

                  <StatCard
                    icon={<CheckCircle />}
                    label="Results"
                    value={`P: ${qc.stats.passCount} / F: ${qc.stats.failCount}`}
                    colorClass="text-blue-500"
                  />
                  <div
                    className={`col-span-2 p-3 rounded-lg flex justify-between items-center ${color}`}
                  >
                    <div>
                      <p className="text-xs font-medium">Pass Rate / Grade</p>
                      <p className="text-2xl font-bold">
                        {qc.stats.accuracy.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-4xl font-black opacity-80">
                      {grade}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t dark:border-gray-700 mt-auto">
                  {/* --- Defect Filter Buttons --- */}
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold">
                      Top {activeDefectFilter} Defects
                    </h4>
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-full text-xs">
                      {["All", "Minor", "Major", "Critical"].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setActiveDefectFilter(filter)}
                          className={`px-2 py-0.5 rounded-full transition-colors duration-200 ${
                            activeDefectFilter === filter
                              ? "bg-indigo-600 text-white"
                              : "hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs space-y-1 min-h-[45px]">
                    {topDefects.length > 0 ? (
                      topDefects.map(([name, qty]) => (
                        <div key={name} className="flex justify-between">
                          <span>{name}</span>
                          <span className="font-bold">{qty}</span>
                        </div>
                      ))
                    ) : (
                      <p className="italic text-gray-500">
                        No {activeDefectFilter.toLowerCase()} defects recorded
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedQcData(qc)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-3"
                  >
                    See more details...
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!isLoading && !error && resultsData.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          No results found for the selected filters.
        </p>
      )}
      {selectedQcData && (
        <QCAccuracyResultsPopup
          qcData={selectedQcData}
          onClose={() => setSelectedQcData(null)}
        />
      )}
    </div>
  );
};

export default QAAccuracyResults;
