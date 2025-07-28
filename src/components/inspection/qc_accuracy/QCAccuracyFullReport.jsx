import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  Loader2,
  AlertTriangle,
  Search,
  FileDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit,
  FileText,
  Share2
} from "lucide-react";

import QCAccuracyFullReportPDF from "./QCAccuracyFullReportPDF";
import useClickOutside from "./useClickOutside";

// react-select styles (can be moved to a separate file if used elsewhere)
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

const QCAccuracyFullReport = () => {
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
    grade: null
    //overallGrade: null
  });

  const [filterOptions, setFilterOptions] = useState({
    qaIds: [],
    qcIds: [],
    moNos: [],
    lineNos: [],
    tableNos: []
  });

  const [reportData, setReportData] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // State to manage which dropdown is open
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // --- CREATE A REF FOR THE DROPDOWN CONTAINER ---
  const dropdownRef = useRef(null);

  // --- USE THE HOOK TO CLOSE THE DROPDOWN ---
  // When a click happens outside the element referenced by dropdownRef,
  // it will call the handler, which sets the openDropdownId to null.
  useClickOutside(dropdownRef, () => setOpenDropdownId(null));

  const fetchFullReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        startDate: filters.startDate?.toISOString().split("T")[0],
        endDate: filters.endDate?.toISOString().split("T")[0],
        qaId: filters.qaId?.value,
        qcId: filters.qcId?.value,
        reportType: filters.reportType?.value,
        moNo: filters.moNo?.value,
        lineNo: filters.lineNo?.value,
        tableNo: filters.tableNo?.value,
        grade: filters.grade?.value, // Use the corrected state key
        //grade: filters.overallGrade?.value,
        page: currentPage,
        limit: rowsPerPage
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-accuracy/full-report`,
        { params }
      );
      setReportData(response.data.reports);
      setPagination(response.data.pagination);
    } catch (err) {
      setError("Failed to fetch the full report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, rowsPerPage]);

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

  useEffect(() => {
    fetchFullReport();
  }, [fetchFullReport]);

  const handleFilterChange = (name, value) => {
    setFilters((f) => ({ ...f, [name]: value }));
    setCurrentPage(1); // Reset to first page on any filter change
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on manual search
    fetchFullReport();
  };

  // --- UPDATE GRADE OPTIONS ---
  const gradeOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" }
  ];

  const reportTypeOptions = [
    { value: "First Output", label: "First Output" },
    { value: "Inline Sewing", label: "Inline Sewing" },
    { value: "Inline Finishing", label: "Inline Finishing" }
  ];

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit"
    });

  const getStatusPillClass = (status) => {
    switch (status) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      case "Major":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
      case "Minor":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Filter Pane */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* --- ADD `popperClassName` --- */}
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
            placeholder="Grade"
            options={gradeOptions}
            value={filters.grade} // Use the corrected state key
            onChange={(val) => handleFilterChange("grade", val)} // Use the corrected handler key
            isClearable
            styles={reactSelectStyles}
          />

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Search />}{" "}
            Search
          </button>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
            <span className="font-semibold">Active Filters:</span>
            {Object.entries(filters)
              .filter(([, value]) => value)
              .map(([key, value]) => (
                <span
                  key={key}
                  className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md text-xs"
                >
                  {`${key}: ${
                    value.label ||
                    (value instanceof Date ? value.toLocaleDateString() : value)
                  }`}
                </span>
              ))}
          </div>
          <PDFDownloadLink
            document={
              <QCAccuracyFullReportPDF data={reportData} filters={filters} />
            }
            fileName={`QC_Accuracy_Full_Report_${Date.now()}.pdf`}
          >
            {({ loading }) => (
              <button
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-white ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={loading}
              >
                <FileDown size={16} />{" "}
                {loading ? "Generating..." : "Download PDF"}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Table Area - Scrollable */}
      <div className="flex-grow overflow-auto">
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
          </div>
        )}
        {error && (
          <div className="text-center p-8 text-red-500">
            <AlertTriangle className="mx-auto mb-2" />
            {error}
          </div>
        )}
        {!isLoading && !error && reportData.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
              <tr className="text-xs font-medium text-gray-500 uppercase">
                <th className="p-2 text-left">QA</th>
                <th className="p-2 text-left">QC</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Report Type</th>
                <th className="p-2 text-left">MO No</th>
                <th className="p-2 text-center">Line/Table</th>
                <th className="p-2 text-center">Checked</th>
                <th className="p-2 text-center">Reject Pcs</th>
                <th className="p-2 text-center">Defects</th>
                <th className="p-2 text-left">Defect Details</th>
                <th className="p-2 text-center">Result</th>
                <th className="p-2 text-center">Grade</th>
                {/* --- ADD ACTION HEADER --- */}
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {reportData.map((report) => (
                <tr
                  key={report._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="p-2 whitespace-nowrap">
                    {report.qcInspector.empId}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {report.scannedQc.empId}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {formatDate(report.reportDate)}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {formatTime(report.createdAt)}
                  </td>
                  <td className="p-2 whitespace-nowrap">{report.reportType}</td>
                  <td className="p-2 whitespace-nowrap font-mono">
                    {report.moNo}
                  </td>
                  <td className="p-2 text-center">
                    {report.lineNo !== "NA" ? report.lineNo : report.tableNo}
                  </td>
                  <td className="p-2 text-center">{report.totalCheckedQty}</td>
                  <td className="p-2 text-center font-semibold text-red-500">
                    {
                      report.defects.filter(
                        (v, i, a) =>
                          a.findIndex((t) => t.pcsNo === v.pcsNo) === i
                      ).length
                    }
                  </td>
                  <td className="p-2 text-center font-semibold text-orange-500">
                    {report.defects.reduce((sum, d) => sum + (d.qty || 0), 0)}
                  </td>
                  {/* --- ENHANCED DEFECT DETAILS CELL --- */}
                  <td className="p-2 align-top">
                    {report.defects?.length > 0 &&
                    report.defects[0]?.defectCode ? (
                      <ul className="space-y-1.5">
                        {report.defects.map((d, i) => (
                          <li key={i}>
                            <div className="font-medium text-xs">
                              {d.defectNameEng} (x{d.qty})
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getStatusPillClass(
                                  d.standardStatus
                                )}`}
                              >
                                {d.standardStatus}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                ({d.decision})
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 italic">No Defects</span>
                    )}
                  </td>

                  <td
                    className={`p-2 text-center font-bold ${
                      report.result === "Pass"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {report.result}
                  </td>
                  <td className="p-2 text-center font-bold">{report.grade}</td>
                  {/* --- ADD ACTION DROPDOWN --- */}
                  <td className="p-2 text-center">
                    <div
                      className="relative"
                      ref={openDropdownId === report._id ? dropdownRef : null}
                    >
                      <button
                        onClick={() =>
                          setOpenDropdownId(
                            openDropdownId === report._id ? null : report._id
                          )
                        }
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openDropdownId === report._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-md shadow-lg z-20">
                          <ul className="py-1">
                            <li>
                              {/* --- USE A STANDARD <a> TAG --- */}
                              {/* This ensures the browser opens a true new tab */}
                              <a
                                href={`/qc-accuracy/view-report/${report._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <FileText size={14} className="mr-2" /> View
                                Report
                              </a>
                            </li>

                            <li>
                              <a
                                href="#"
                                className="flex items-center px-4 py-2 text-sm ..."
                              >
                                <Edit size={14} className="mr-2" /> Edit
                              </a>
                            </li>
                            <li>
                              <a
                                href="#"
                                className="flex items-center px-4 py-2 text-sm ..."
                              >
                                <Share2 size={14} className="mr-2" /> Follow Up
                              </a>
                            </li>
                            <li>
                              <a
                                href="#"
                                className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 ..."
                              >
                                <Trash2 size={14} className="mr-2" /> Delete
                              </a>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && !error && reportData.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            No data found for the selected filters.
          </p>
        )}
      </div>

      {/* Pagination Controls - Fixed */}
      <div className="p-2 border-t dark:border-gray-700 flex justify-between items-center text-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            {[50, 100, 150, 200].map((val) => (
              <option key={val} value={val}>
                Show {val}
              </option>
            ))}
          </select>
          <span className="text-gray-600 dark:text-gray-400">
            Total Records: {pagination.total || 0}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1 || isLoading}
            className="p-1 disabled:opacity-50"
          >
            <ChevronLeft />
          </button>
          <span>
            Page {pagination.page || 1} of {pagination.totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === pagination.totalPages || isLoading}
            className="p-1 disabled:opacity-50"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QCAccuracyFullReport;
