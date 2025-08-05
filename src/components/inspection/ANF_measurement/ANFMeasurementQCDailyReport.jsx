import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { useAuth } from "../../authentication/AuthContext";
import { API_BASE_URL } from "../../../../config";
import { subDays, format } from "date-fns";
import {
  Loader2,
  AlertTriangle,
  MoreVertical,
  FileText as ReportIcon,
  Trash2,
  Send,
  ChevronLeft,
  ChevronRight,
  FileDown
} from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ANFMeasurementQCViewPDF from "./ANFMeasurementQCViewPDF";

// Helper function to create a URL-safe ID
const createPageId = (date, qcId, moNo) => {
  const dateStr = format(new Date(date), "yyyy-MM-dd");
  // Replace any characters that are not letters, numbers, or hyphens
  const safeQcId = qcId.replace(/[^a-zA-Z0-9-]/g, "");
  const safeMoNo = moNo.replace(/[^a-zA-Z0-9-]/g, "");
  return `${dateStr}-${safeQcId}-${safeMoNo}`;
};

// Reusable Action Menu
const ActionMenu = ({ item }) => {
  const pageId = createPageId(item.inspectionDate, item.qcID, item.moNo);
  const reportUrl = `/anf-washing/qc-full-report/${pageId}`;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
        <MoreVertical className="w-5 h-5" />
      </Menu.Button>
      <Transition as={Fragment} /* ... */>
        <Menu.Items className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                // Use an <a> tag to open in a new tab
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${
                    active
                      ? "bg-indigo-500 text-white"
                      : "text-gray-900 dark:text-gray-200"
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <ReportIcon className="w-5 h-5 mr-2" />
                  View Full Report
                </a>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleAction("Follow Up")}
                  className={`${
                    active
                      ? "bg-indigo-500 text-white"
                      : "text-gray-900 dark:text-gray-200"
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Follow Up
                </button>
              )}
            </Menu.Item>
          </div>
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active
                      ? "bg-red-500 text-white"
                      : "text-red-600 dark:text-red-400"
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const ANFMeasurementQCDailyReport = () => {
  const { user } = useAuth();
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    buyer: null,
    moNo: null,
    color: null,
    qcID: null
  });

  const [filterOptions, setFilterOptions] = useState({
    buyers: [],
    moNos: [],
    colors: [],
    qcIDs: [],
    moToColorsMap: {}
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch master data based on date range
  useEffect(() => {
    const fetchMasterData = async () => {
      if (!filters.startDate || !filters.endDate) return;
      setIsLoading(true);
      setError(null);
      try {
        const [dataRes, optionsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/anf-measurement/qc-daily-reports`, {
            params: {
              startDate: filters.startDate.toISOString().split("T")[0],
              endDate: filters.endDate.toISOString().split("T")[0]
            }
          }),
          axios.get(
            `${API_BASE_URL}/api/anf-measurement/qc-daily-reports/filters`,
            {
              params: {
                startDate: filters.startDate.toISOString().split("T")[0],
                endDate: filters.endDate.toISOString().split("T")[0]
              }
            }
          )
        ]);
        setAllData(dataRes.data);

        const {
          buyerOptions,
          moOptions,
          colorOptions,
          qcOptions,
          moToColorsMap
        } = optionsRes.data;
        setFilterOptions({
          buyers: [
            { value: "All", label: "All Buyers" },
            ...buyerOptions.map((b) => ({ value: b, label: b }))
          ],
          moNos: [
            { value: "All", label: "All MOs" },
            ...moOptions.map((m) => ({ value: m, label: m }))
          ],
          colors: [
            { value: "All", label: "All Colors" },
            ...colorOptions.map((c) => ({ value: c, label: c }))
          ],
          qcIDs: [
            { value: "All", label: "All QCs" },
            ...qcOptions.map((q) => ({ value: q, label: q }))
          ],
          moToColorsMap: moToColorsMap
        });
      } catch (err) {
        setError("Failed to fetch daily reports.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMasterData();
  }, [filters.startDate, filters.endDate]);

  // Derived color options based on selected MO
  const derivedColorOptions = useMemo(() => {
    if (!filters.moNo || filters.moNo.value === "All") {
      return filterOptions.colors;
    }
    const relevantColors =
      filterOptions.moToColorsMap[filters.moNo.value] || [];
    return [
      { value: "All", label: "All Colors" },
      ...relevantColors.map((c) => ({ value: c, label: c }))
    ];
  }, [filters.moNo, filterOptions.colors, filterOptions.moToColorsMap]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    return allData.filter((item) => {
      const buyerMatch =
        !filters.buyer ||
        filters.buyer.value === "All" ||
        item.buyer === filters.buyer.value;
      const moMatch =
        !filters.moNo ||
        filters.moNo.value === "All" ||
        item.moNo === filters.moNo.value;
      const qcMatch =
        !filters.qcID ||
        filters.qcID.value === "All" ||
        item.qcID === filters.qcID.value;
      const colorMatch =
        !filters.color ||
        filters.color.value === "All" ||
        item.color.includes(filters.color.value);
      return buyerMatch && moMatch && qcMatch && colorMatch;
    });
  }, [allData, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    if (name === "moNo") {
      newFilters.color = null; // Reset color when MO changes
    }
    setFilters(newFilters);
  };

  const selectStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border-primary)"
    }),
    singleValue: (styles) => ({
      ...styles,
      color: "var(--color-text-primary)"
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: "var(--color-bg-secondary)"
    }),
    option: (styles, { isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: isSelected ? "white" : "var(--color-text-primary)"
    })
  };

  return (
    <div className="p-2 sm:p-3 lg:p-3 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="max-w-screen-2xl mx-auto">
        <h1 className="text-lg font-bold mb-2">QC Daily Measurement Report</h1>

        {/* --- FILTERS SECTION --- */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => handleFilterChange("startDate", date)}
                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1">End Date</label>
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => handleFilterChange("endDate", date)}
                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1">Buyer</label>
              <Select
                options={filterOptions.buyers}
                value={filters.buyer}
                onChange={(val) => handleFilterChange("buyer", val)}
                styles={selectStyles}
                isClearable
                placeholder="All Buyers"
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1">MO No</label>
              <Select
                options={filterOptions.moNos}
                value={filters.moNo}
                onChange={(val) => handleFilterChange("moNo", val)}
                styles={selectStyles}
                isClearable
                placeholder="All MOs"
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1">Color</label>
              <Select
                options={derivedColorOptions}
                value={filters.color}
                onChange={(val) => handleFilterChange("color", val)}
                styles={selectStyles}
                isClearable
                placeholder="All Colors"
                isDisabled={!filters.moNo || filters.moNo.value === "All"}
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1">QC ID</label>
              <Select
                options={filterOptions.qcIDs}
                value={filters.qcID}
                onChange={(val) => handleFilterChange("qcID", val)}
                styles={selectStyles}
                isClearable
                placeholder="All QCs"
              />
            </div>
            <div className="lg:col-span-1">
              <PDFDownloadLink
                document={<ANFMeasurementQCViewPDF data={filteredData} />}
                fileName={`ANF_QC_Report_${format(
                  new Date(),
                  "yyyy-MM-dd"
                )}.pdf`}
              >
                {({ loading }) => (
                  <button
                    disabled={loading || filteredData.length === 0}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <FileDown className="h-5 w-5" />
                    )}
                  </button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </div>

        {/* --- TABLE SECTION --- */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Found{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                {filteredData.length}
              </span>{" "}
              reports.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              {/* ... Table Header ... */}
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase">
                <tr>
                  <th
                    rowSpan="2"
                    className="px-3 py-3 text-left tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-3 text-left tracking-wider"
                  >
                    QC
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-3 text-left tracking-wider"
                  >
                    MO No
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-3 text-left tracking-wider"
                  >
                    Colors
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-3 text-center tracking-wider"
                  >
                    Ord. Qty
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-3 text-center tracking-wider"
                  >
                    Sizes
                  </th>
                  <th
                    colSpan="3"
                    className="px-3 py-3 text-center tracking-wider border-l border-r dark:border-gray-600"
                  >
                    Garment Details
                  </th>
                  <th
                    colSpan="5"
                    className="px-3 py-3 text-center tracking-wider border-r dark:border-gray-600"
                  >
                    Measurement Details
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-3 text-center tracking-wider"
                  >
                    Pass% (G)
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-3 text-center tracking-wider"
                  >
                    Pass% (P)
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-3 text-center tracking-wider"
                  >
                    Action
                  </th>
                </tr>
                <tr className="border-t dark:border-gray-600">
                  <th className="px-2 py-2 text-center tracking-wider border-l dark:border-gray-600">
                    Checked
                  </th>
                  <th className="px-2 py-2 text-center tracking-wider">OK</th>
                  <th className="px-2 py-2 text-center tracking-wider border-r dark:border-gray-600">
                    Reject
                  </th>
                  <th className="px-2 py-2 text-center tracking-wider">
                    Points
                  </th>
                  <th className="px-2 py-2 text-center tracking-wider">Pass</th>
                  <th className="px-2 py-2 text-center tracking-wider">
                    Issues
                  </th>
                  <th className="px-2 py-2 text-center tracking-wider">T+</th>
                  <th className="px-2 py-2 text-center tracking-wider border-r dark:border-gray-600">
                    T-
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan="16" className="text-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="16" className="text-center p-8 text-gray-500">
                      No reports found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => {
                    const summary = item.overallMeasurementSummary;
                    const passRateGarment =
                      summary?.garmentDetailsCheckedQty > 0
                        ? (
                            (summary.garmentDetailsOKGarment /
                              summary.garmentDetailsCheckedQty) *
                            100
                          ).toFixed(2) + "%"
                        : "N/A";
                    const passRatePoints =
                      summary?.measurementDetailsPoints > 0
                        ? (
                            (summary.measurementDetailsPass /
                              summary.measurementDetailsPoints) *
                            100
                          ).toFixed(2) + "%"
                        : "N/A";
                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          {format(new Date(item.inspectionDate), "yyyy-MM-dd")}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {item.qcID}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {item.moNo}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {item.color.join(", ")}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.orderDetails.orderQty_style}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.measurementDetails.length}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {summary?.garmentDetailsCheckedQty || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-green-600 dark:text-green-400">
                          {summary?.garmentDetailsOKGarment || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-red-600 dark:text-red-400">
                          {summary?.garmentDetailsRejected || 0}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {summary?.measurementDetailsPoints || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-green-600 dark:text-green-400">
                          {summary?.measurementDetailsPass || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-red-600 dark:text-red-400">
                          {summary?.measurementDetailsTotalIssues || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-rose-500">
                          {summary?.measurementDetailsTolPositive || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-red-500">
                          {summary?.measurementDetailsTolNegative || 0}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold">
                          {passRateGarment}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold">
                          {passRatePoints}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <ActionMenu item={item} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls --- */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-md transition-colors ${
                        currentPage === page
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ANFMeasurementQCDailyReport;
