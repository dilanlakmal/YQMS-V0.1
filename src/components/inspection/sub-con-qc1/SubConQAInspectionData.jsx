import axios from "axios";
import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  Download,
  Factory,
  FileText,
  Filter,
  Hash,
  List,
  Loader2,
  MoreVertical,
  Palette,
  Percent,
  TrendingUp,
  User,
  Users,
  XCircle
} from "lucide-react";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";
import QAInspectionSummaryCard from "./QAInspectionSummaryCard";

const SubConQAInspectionData = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: new Date(),
    reportType: null,
    factory: null,
    lineNo: null,
    moNo: null,
    color: null,
    qaId: null,
    qcId: null,
    result: null
  });

  const [data, setData] = useState({
    reports: [],
    summary: {
      totalCheckedQty: 0,
      totalRejectPcs: 0,
      totalDefectQty: 0,
      totalMinorCount: 0,
      totalMajorCount: 0,
      totalCriticalCount: 0,
      defectRate: 0,
      defectRatio: 0
    },
    filterOptions: {
      reportTypes: [],
      factories: [],
      lineNos: [],
      moNos: [],
      colors: [],
      qaIds: [],
      qcIds: [],
      results: []
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const actionMenuRef = React.useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const params = {
        startDate: format(filters.startDate, "yyyy-MM-dd"),
        endDate: format(filters.endDate, "yyyy-MM-dd"),
        reportType: filters.reportType?.value,
        factory: filters.factory?.value,
        lineNo: filters.lineNo?.value,
        moNo: filters.moNo?.value,
        color: filters.color?.value,
        qaId: filters.qaId?.value,
        qcId: filters.qcId?.value,
        result: filters.result?.value
      };

      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-qa-inspection-data`,
          { params }
        );
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch inspection data:", err);
        setError("Could not load inspection data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [filterName]: value };

      // Cascading logic
      if (filterName === "startDate" || filterName === "endDate") {
        // Reset all other filters when date changes
        return {
          ...newFilters,
          reportType: null,
          factory: null,
          lineNo: null,
          moNo: null,
          color: null,
          qaId: null,
          qcId: null,
          result: null
        };
      }
      if (filterName === "reportType") {
        newFilters.factory = null;
        newFilters.lineNo = null;
        newFilters.moNo = null;
        newFilters.color = null;
        newFilters.qaId = null;
        newFilters.qcId = null;
        newFilters.result = null;
      }
      if (filterName === "factory") {
        newFilters.lineNo = null;
        newFilters.moNo = null;
        newFilters.color = null;
        newFilters.qaId = null;
        newFilters.qcId = null;
        newFilters.result = null;
      }
      if (filterName === "lineNo") {
        newFilters.moNo = null;
        newFilters.color = null;
        newFilters.qaId = null;
        newFilters.qcId = null;
        newFilters.result = null;
      }
      if (filterName === "moNo") {
        newFilters.color = null;
        newFilters.qaId = null;
        newFilters.qcId = null;
        newFilters.result = null;
      }
      if (filterName === "color") {
        newFilters.qaId = null;
        newFilters.qcId = null;
        newFilters.result = null;
      }

      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      startDate: new Date(),
      endDate: new Date(),
      reportType: null,
      factory: null,
      lineNo: null,
      moNo: null,
      color: null,
      qaId: null,
      qcId: null,
      result: null
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setActionMenuOpen(null);
      }
    };

    if (actionMenuOpen !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionMenuOpen]);

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

  const getResultBadgeClass = (result) => {
    switch (result) {
      case "A":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700";
      case "B":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700";
      case "C":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700";
      case "D":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Minor":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "Major":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
      case "Critical":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        QA Inspection Data Report
      </h1>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
        </div>

        <div className="p-4 space-y-4">
          {/* Row 1: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-5 lg:grid-cols-10 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Start Date
              </label>
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => handleFilterChange("startDate", date)}
                maxDate={filters.endDate}
                dateFormat="MM/dd/yyyy"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                popperClassName="react-datepicker-popper-z-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-indigo-500" />
                End Date
              </label>
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => handleFilterChange("endDate", date)}
                minDate={filters.startDate}
                dateFormat="MM/dd/yyyy"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                popperClassName="react-datepicker-popper-z-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <FileText className="w-4 h-4 text-indigo-500" />
                Report Type
              </label>
              <Select
                options={data.filterOptions.reportTypes.map((rt) => ({
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
                <Factory className="w-4 h-4 text-indigo-500" />
                Factory
              </label>
              <Select
                options={data.filterOptions.factories.map((f) => ({
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
                <List className="w-4 h-4 text-indigo-500" />
                Line No
              </label>
              <Select
                options={data.filterOptions.lineNos.map((l) => ({
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
                <Hash className="w-4 h-4 text-indigo-500" />
                MO No
              </label>
              <Select
                options={data.filterOptions.moNos.map((m) => ({
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
                <Palette className="w-4 h-4 text-indigo-500" />
                Color
              </label>
              <Select
                options={data.filterOptions.colors.map((c) => ({
                  value: c,
                  label: c
                }))}
                value={filters.color}
                onChange={(val) => handleFilterChange("color", val)}
                styles={reactSelectStyles}
                isClearable
                placeholder="All"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <User className="w-4 h-4 text-indigo-500" />
                QA ID
              </label>
              <Select
                options={data.filterOptions.qaIds.map((qa) => ({
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
                <Users className="w-4 h-4 text-indigo-500" />
                QC ID
              </label>
              <Select
                options={data.filterOptions.qcIds.map((qc) => ({
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
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Result
              </label>
              <Select
                options={data.filterOptions.results.map((r) => ({
                  value: r,
                  label: r
                }))}
                value={filters.result}
                onChange={(val) => handleFilterChange("result", val)}
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
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold text-sm"
            >
              <XCircle size={16} />
              Clear Filters
            </button>
            <button className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <QAInspectionSummaryCard
          title="QA Sample Size"
          icon={<CheckSquare size={20} />}
          value={data.summary.totalCheckedQty}
          gradientFrom="from-blue-500"
          gradientTo="to-cyan-500"
        />
        <QAInspectionSummaryCard
          title="Reject Pieces"
          icon={<AlertTriangle size={20} />}
          value={data.summary.totalRejectPcs}
          gradientFrom="from-red-500"
          gradientTo="to-pink-500"
        />
        <QAInspectionSummaryCard
          title="Defect Qty"
          icon={<AlertTriangle size={20} />}
          value={data.summary.totalDefectQty}
          minorCount={data.summary.totalMinorCount}
          majorCount={data.summary.totalMajorCount}
          criticalCount={data.summary.totalCriticalCount}
          gradientFrom="from-orange-500"
          gradientTo="to-amber-500"
          showSeverityBreakdown
        />
        <QAInspectionSummaryCard
          title="Defect Rate"
          icon={<Percent size={20} />}
          value={`${data.summary.defectRate.toFixed(2)}%`}
          gradientFrom="from-purple-500"
          gradientTo="to-indigo-500"
        />
        <QAInspectionSummaryCard
          title="Defect Ratio"
          icon={<Percent size={20} />}
          value={`${data.summary.defectRatio.toFixed(2)}%`}
          gradientFrom="from-pink-500"
          gradientTo="to-rose-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Factory</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Line</th>
                <th className="px-4 py-3 text-left font-semibold">MO No</th>
                <th className="px-4 py-3 text-left font-semibold">Color</th>
                <th className="px-4 py-3 text-left font-semibold">QA ID</th>
                <th className="px-4 py-3 text-left font-semibold">QC ID</th>
                <th className="px-4 py-3 text-center font-semibold">SPI</th>
                <th className="px-4 py-3 text-center font-semibold">
                  Measurement
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  Labelling
                </th>
                <th className="px-4 py-3 text-center font-semibold">Checked</th>
                <th className="px-4 py-3 text-center font-semibold">Reject</th>
                <th className="px-4 py-3 text-center font-semibold">Defects</th>
                <th className="px-4 py-3 text-center font-semibold">
                  Defect Rate
                </th>
                <th className="px-4 py-3 text-left font-semibold min-w-[250px]">
                  Defect Details
                </th>
                <th className="px-4 py-3 text-center font-semibold">Result</th>
                <th className="px-4 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {isLoading ? (
                <tr>
                  <td colSpan={17} className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={17} className="text-center py-12 text-red-500">
                    {error}
                  </td>
                </tr>
              ) : data.reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={17}
                    className="text-center py-12 text-gray-500 dark:text-gray-400"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                data.reports.map((report, index) => (
                  <tr
                    key={`${report._id}-${index}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 py-3">
                      {format(new Date(report.inspectionDate), "MM/dd/yyyy")}
                    </td>
                    <td className="px-4 py-3">{report.factory}</td>
                    <td className="px-4 py-3">{report.reportType}</td>
                    <td className="px-4 py-3">{report.lineNo}</td>
                    <td className="px-4 py-3">{report.moNo}</td>
                    <td className="px-4 py-3">{report.color}</td>
                    <td className="px-4 py-3">{report.preparedBy.empId}</td>
                    <td className="px-4 py-3 font-semibold">
                      {report.qcData.qcID}
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-semibold ${
                        report.qcData.spi.status === "Pass"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700"
                      }`}
                    >
                      {report.qcData.spi.status}
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-semibold ${
                        report.qcData.measurement.status === "Pass"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700"
                      }`}
                    >
                      {report.qcData.measurement.status}
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-semibold ${
                        report.qcData.labelling.status === "Correct"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700"
                      }`}
                    >
                      {report.qcData.labelling.status}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {report.qcData.checkedQty}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {report.qcData.rejectPcs}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {report.qcData.totalDefectQty}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {report.defectRate.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {report.qcData.defectList.map((defect, idx) => {
                          const defectRate =
                            report.qcData.checkedQty > 0
                              ? (defect.qty / report.qcData.checkedQty) * 100
                              : 0;
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {defect.defectName}
                              </span>
                              <span className="font-bold text-gray-900 dark:text-gray-100">
                                : {defect.qty}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                ({defectRate.toFixed(2)}%)
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-semibold ${getStatusBadgeClass(
                                  defect.standardStatus
                                )}`}
                              >
                                {defect.standardStatus}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg font-bold text-sm border-2 ${getResultBadgeClass(
                          report.result
                        )}`}
                      >
                        {report.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div
                        className="relative inline-block"
                        ref={actionMenuOpen === index ? actionMenuRef : null}
                      >
                        <button
                          onClick={() =>
                            setActionMenuOpen(
                              actionMenuOpen === index ? null : index
                            )
                          }
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {actionMenuOpen === index && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50">
                            <a
                              href={`/subcon-qa-inspection/view-report/${report._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                            >
                              <FileText size={16} />
                              View Full Report
                            </a>
                            <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2">
                              <CheckSquare size={16} />
                              Follow Up
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubConQAInspectionData;
