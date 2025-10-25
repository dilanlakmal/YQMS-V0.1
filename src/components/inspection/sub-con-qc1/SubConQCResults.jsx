import axios from "axios";
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Loader2,
  Search,
  UserCheck,
  XCircle
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";
import SubConQCResultsPopup from "./SubConQCResultsPopup";

// StatCard Component
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

const SubConQCResults = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
    endDate: new Date(),
    reportType: null,
    factory: null,
    lineNo: null,
    moNo: null,
    color: null,
    qaId: null,
    qcId: null,
    overallGrade: null
  });

  const [filterOptions, setFilterOptions] = useState({
    reportTypes: [],
    factories: [],
    lineNos: [],
    moNos: [],
    colors: [],
    qaIds: [],
    qcIds: []
  });

  const [resultsData, setResultsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedQcData, setSelectedQcData] = useState(null);
  const [activeDefectFilter, setActiveDefectFilter] = useState("All");

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        startDate: filters.startDate.toISOString().split("T")[0],
        endDate: filters.endDate.toISOString().split("T")[0],
        reportType: filters.reportType?.value,
        factory: filters.factory?.value,
        lineNo: filters.lineNo?.value,
        moNo: filters.moNo?.value,
        color: filters.color?.value,
        qaId: filters.qaId?.value,
        qcId: filters.qcId?.value
      };

      const response = await axios.get(
        `${API_BASE_URL}/api/subcon-qa-inspection-data`,
        { params }
      );

      // Group reports by QC ID
      const qcMap = {};
      response.data.reports.forEach((report) => {
        const qcId = report.qcData.qcID;
        if (!qcMap[qcId]) {
          qcMap[qcId] = {
            qcId: qcId,
            qcName: report.qcData.qcName,
            factories: new Set(),
            reports: [],
            stats: {
              totalChecked: 0,
              totalRejectedPcs: 0,
              totalDefects: 0,
              minorCount: 0,
              majorCount: 0,
              criticalCount: 0,
              passCount: 0,
              failCount: 0,
              accuracy: 0
            }
          };
        }
        qcMap[qcId].factories.add(report.factory);
        qcMap[qcId].reports.push(report);
        qcMap[qcId].stats.totalChecked += report.qcData.checkedQty;
        qcMap[qcId].stats.totalRejectedPcs += report.qcData.rejectPcs;
        qcMap[qcId].stats.totalDefects += report.qcData.totalDefectQty;
        qcMap[qcId].stats.minorCount += report.minorCount || 0;
        qcMap[qcId].stats.majorCount += report.majorCount || 0;
        qcMap[qcId].stats.criticalCount += report.criticalCount || 0;

        // Count pass/fail based on grade
        if (report.result === "A" || report.result === "B") {
          qcMap[qcId].stats.passCount++;
        } else {
          qcMap[qcId].stats.failCount++;
        }
      });

      // Calculate accuracy for each QC
      Object.values(qcMap).forEach((qc) => {
        if (qc.reports.length > 0) {
          qc.stats.accuracy =
            qc.reports.reduce((sum, r) => sum + (r.passRatePercent || 0), 0) /
            qc.reports.length;
        }
        qc.factories = Array.from(qc.factories);
      });

      setResultsData(Object.values(qcMap));
      setFilterOptions(response.data.filterOptions);
    } catch (err) {
      setError("Failed to fetch results. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleFilterChange = (name, value) => {
    setFilters((f) => ({ ...f, [name]: value }));
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

  const gradeOptions = [
    { value: "A", label: "Grade A" },
    { value: "B", label: "Grade B" },
    { value: "C", label: "Grade C" },
    { value: "D", label: "Grade D" }
  ];

  const filteredDisplayData = resultsData.filter((qc) => {
    if (!filters.overallGrade) {
      return true;
    }
    const { grade } = getGradeAndColor(qc.stats.accuracy);
    return grade === filters.overallGrade.value;
  });

  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)",
      minHeight: "38px"
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      zIndex: 50
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: isSelected ? "white" : "var(--color-text-primary)"
    })
  };

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Filter Panel - Replace the existing filter div */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filters
          </h2>
        </div>

        <div className="p-4 space-y-4">
          {/* Row 1: Dates and Main Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <FileText className="w-4 h-4 text-indigo-500" />
                Start Date
              </label>
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => handleFilterChange("startDate", date)}
                maxDate={filters.endDate}
                dateFormat="MM/dd/yyyy"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                portalId="root-portal"
                popperClassName="react-datepicker-popper-z-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <FileText className="w-4 h-4 text-indigo-500" />
                End Date
              </label>
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => handleFilterChange("endDate", date)}
                minDate={filters.startDate}
                dateFormat="MM/dd/yyyy"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                portalId="root-portal"
                popperClassName="react-datepicker-popper-z-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <FileText className="w-4 h-4 text-indigo-500" />
                Report Type
              </label>
              <Select
                options={filterOptions.reportTypes.map((rt) => ({
                  value: rt,
                  label: rt
                }))}
                value={filters.reportType}
                onChange={(val) => handleFilterChange("reportType", val)}
                styles={reactSelectStyles}
                isClearable
                placeholder="All"
                menuPortalTarget={document.body}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <FileText className="w-4 h-4 text-indigo-500" />
                Factory
              </label>
              <Select
                options={filterOptions.factories.map((f) => ({
                  value: f,
                  label: f
                }))}
                value={filters.factory}
                onChange={(val) => handleFilterChange("factory", val)}
                styles={reactSelectStyles}
                isClearable
                placeholder="All"
                menuPortalTarget={document.body}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <FileText className="w-4 h-4 text-indigo-500" />
                Line No
              </label>
              <Select
                options={filterOptions.lineNos.map((l) => ({
                  value: l,
                  label: l
                }))}
                value={filters.lineNo}
                onChange={(val) => handleFilterChange("lineNo", val)}
                styles={reactSelectStyles}
                isClearable
                placeholder="All"
                menuPortalTarget={document.body}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <FileText className="w-4 h-4 text-indigo-500" />
                MO No
              </label>
              <Select
                options={filterOptions.moNos.map((m) => ({
                  value: m,
                  label: m
                }))}
                value={filters.moNo}
                onChange={(val) => handleFilterChange("moNo", val)}
                styles={reactSelectStyles}
                isClearable
                placeholder="All"
                menuPortalTarget={document.body}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <FileText className="w-4 h-4 text-indigo-500" />
                Color
              </label>
              <Select
                options={filterOptions.colors.map((c) => ({
                  value: c,
                  label: c
                }))}
                value={filters.color}
                onChange={(val) => handleFilterChange("color", val)}
                styles={reactSelectStyles}
                isClearable
                placeholder="All"
                menuPortalTarget={document.body}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                QA ID
              </label>
              <Select
                options={filterOptions.qaIds.map((qa) => ({
                  value: qa,
                  label: qa
                }))}
                value={filters.qaId}
                onChange={(val) => handleFilterChange("qaId", val)}
                styles={reactSelectStyles}
                isClearable
                placeholder="All"
                menuPortalTarget={document.body}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                QC ID
              </label>
              <Select
                options={filterOptions.qcIds.map((qc) => ({
                  value: qc,
                  label: qc
                }))}
                value={filters.qcId}
                onChange={(val) => handleFilterChange("qcId", val)}
                styles={reactSelectStyles}
                isClearable
                placeholder="All"
                menuPortalTarget={document.body}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-indigo-500" />
                Overall Grade
              </label>
              <Select
                options={gradeOptions}
                value={filters.overallGrade}
                onChange={(val) => handleFilterChange("overallGrade", val)}
                styles={reactSelectStyles}
                isClearable
                placeholder="All"
                menuPortalTarget={document.body}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={fetchResults}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold text-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Search
            </button>
            <button
              onClick={() => {
                setFilters({
                  startDate: new Date(
                    new Date().setDate(new Date().getDate() - 6)
                  ),
                  endDate: new Date(),
                  reportType: null,
                  factory: null,
                  lineNo: null,
                  moNo: null,
                  color: null,
                  qaId: null,
                  qcId: null,
                  overallGrade: null
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold text-sm"
            >
              <XCircle size={16} />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 size={40} className="animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center p-8 text-red-500">
          <AlertTriangle className="mx-auto mb-2" />
          {error}
        </div>
      )}

      {/* Results Display */}
      {!isLoading && !error && filteredDisplayData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredDisplayData.map((qc) => {
            const { grade, color } = getGradeAndColor(qc.stats.accuracy);

            const getTopDefects = () => {
              const allDefects = qc.reports.flatMap(
                (r) => r.qcData.defectList || []
              );
              const filteredDefects =
                activeDefectFilter === "All"
                  ? allDefects
                  : allDefects.filter(
                      (d) => d && d.standardStatus === activeDefectFilter
                    );

              const defectCounts = filteredDefects.reduce((acc, defect) => {
                if (defect) {
                  acc[defect.defectName] =
                    (acc[defect.defectName] || 0) + defect.qty;
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
                {/* QC Header */}
                <div className="p-4 flex items-center border-b dark:border-gray-700">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-4">
                    <UserCheck
                      size={32}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {" "}
                      {qc.factories.join(", ")} | {qc.qcName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {qc.qcId}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
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

                  {/* Pass Rate & Grade */}
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

                {/* Top Defects Section */}
                <div className="p-4 border-t dark:border-gray-700 mt-auto">
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

      {/* No Results State */}
      {!isLoading && !error && filteredDisplayData.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          No results found for the selected filters.
        </p>
      )}

      {/* Popup */}
      {selectedQcData && (
        <SubConQCResultsPopup
          qcData={selectedQcData}
          onClose={() => setSelectedQcData(null)}
        />
      )}
    </div>
  );
};

export default SubConQCResults;
