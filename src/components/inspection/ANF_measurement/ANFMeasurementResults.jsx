import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { useAuth } from "../../authentication/AuthContext";
import { API_BASE_URL } from "../../../../config";
import { subDays } from "date-fns";
import {
  Loader2,
  AlertTriangle,
  MoreVertical,
  FileText,
  Trash2,
  Send,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import ANFMeasurementResultsViewFullReport from "./ANFMeasurementResultsViewFullReport";

// A reusable component for the status badge
const StatusBadge = ({ status }) => {
  const isCompleted = status === "Completed";
  const baseClasses = "px-3 py-1 text-xs font-bold rounded-full inline-block";
  const completedClasses =
    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
  const inProgressClasses =
    "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";

  return (
    <span
      className={`${baseClasses} ${
        isCompleted ? completedClasses : inProgressClasses
      }`}
    >
      {status}
    </span>
  );
};

// A reusable component for the action menu
const ActionMenu = ({ item, onViewReport }) => {
  const handleAction = (action) => {
    alert(`${action} clicked for MO: ${item.moNo}, Size: ${item.size}`);
    // In a real app, you would implement the logic for each action here
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
          <MoreVertical className="w-5 h-5" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1 ">
            <Menu.Item>
              {({ active }) => (
                <button
                  // --- MODIFIED: onClick handler ---
                  onClick={() => onViewReport(item)}
                  className={`${
                    active
                      ? "bg-indigo-500 text-white"
                      : "text-gray-900 dark:text-gray-200"
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  View Full Report
                </button>
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
                  onClick={() => handleAction("Delete")}
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

const ANFMeasurementResults = ({ dataProcessor = (data) => data }) => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    buyer: { value: "All", label: "All Buyers" },
    moNo: { value: "All", label: "All MOs" },
    color: { value: "All", label: "All Colors" },
    qcID: { value: "All", label: "All QCs" }
  });

  const [filterOptions, setFilterOptions] = useState({
    buyers: [],
    moNos: [],
    colors: [],
    qcIDs: []
  });

  // ---State for pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // --- NEW: State for modal control ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // --- filter options fetch and data fetch useEffects ---
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/anf-measurement/results/filters`
        );
        setFilterOptions({
          buyers: [
            { value: "All", label: "All Buyers" },
            ...res.data.buyerOptions.map((b) => ({ value: b, label: b }))
          ],
          moNos: [
            { value: "All", label: "All MOs" },
            ...res.data.moOptions.map((m) => ({ value: m, label: m }))
          ],
          colors: [
            { value: "All", label: "All Colors" },
            ...res.data.colorOptions.map((c) => ({ value: c, label: c }))
          ],
          qcIDs: [
            { value: "All", label: "All QCs" },
            ...res.data.qcOptions.map((q) => ({ value: q, label: q }))
          ]
        });
      } catch (err) {
        console.error("Failed to fetch filter options", err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/anf-measurement/results/summary`,
          {
            params: {
              startDate: filters.startDate.toISOString().split("T")[0],
              endDate: filters.endDate.toISOString().split("T")[0]
            }
          }
        );
        setData(res.data);
      } catch (err) {
        setError("Failed to fetch summary data. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (filters.startDate && filters.endDate) {
      fetchData();
    }
  }, [filters.startDate, filters.endDate]);

  // --- MODIFIED: Apply the dataProcessor function here ---
  const processedData = useMemo(() => {
    // The prop function is called here.
    // If not provided, it defaults to (data) => data, returning the original data.
    return dataProcessor(data);
  }, [data, dataProcessor]);

  // --- filteredData logic ---
  const filteredData = useMemo(() => {
    return processedData.filter((item) => {
      const buyerMatch =
        filters.buyer.value === "All" || item.buyer === filters.buyer.value;
      const moMatch =
        filters.moNo.value === "All" || item.moNo === filters.moNo.value;
      const qcMatch =
        filters.qcID.value === "All" || item.qcID === filters.qcID.value;
      const colorMatch =
        filters.color.value === "All" ||
        item.colors.includes(filters.color.value);
      return buyerMatch && moMatch && qcMatch && colorMatch;
    });
  }, [processedData, filters.buyer, filters.moNo, filters.color, filters.qcID]);

  // Reset to page 1 when filters change ---
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData]);

  // Logic for calculating paginated data ---
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  // --- NEW: Handler functions for modal ---
  const handleViewReport = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
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
        <h1 className="text-lg font-bold mb-2">ANF Measurement Results</h1>

        {/* --- FILTERS SECTION --- */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <DatePicker
                selected={filters.startDate}
                onChange={(date) =>
                  setFilters((f) => ({ ...f, startDate: date }))
                }
                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <DatePicker
                selected={filters.endDate}
                onChange={(date) =>
                  setFilters((f) => ({ ...f, endDate: date }))
                }
                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Buyer</label>
              <Select
                options={filterOptions.buyers}
                value={filters.buyer}
                onChange={(val) => setFilters((f) => ({ ...f, buyer: val }))}
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">MO No</label>
              <Select
                options={filterOptions.moNos}
                value={filters.moNo}
                onChange={(val) => setFilters((f) => ({ ...f, moNo: val }))}
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <Select
                options={filterOptions.colors}
                value={filters.color}
                onChange={(val) => setFilters((f) => ({ ...f, color: val }))}
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">QC ID</label>
              <Select
                options={filterOptions.qcIDs}
                value={filters.qcID}
                onChange={(val) => setFilters((f) => ({ ...f, qcID: val }))}
                styles={selectStyles}
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* --- Record count display --- */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Found{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                {filteredData.length}
              </span>{" "}
              records.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              {/* --- TABLE HEAD --- */}

              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    rowSpan="2"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    MO No
                  </th>
                  <th
                    rowSpan="2"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Color(s)
                  </th>
                  <th
                    rowSpan="2"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    QC ID
                  </th>
                  <th
                    rowSpan="2"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Total Ord. Qty
                  </th>
                  <th
                    rowSpan="2"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Ord. Qty (Size)
                  </th>
                  <th
                    rowSpan="2"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Size
                  </th>
                  <th
                    rowSpan="2"
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    colSpan="3"
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-l border-r border-gray-200 dark:border-gray-600"
                  >
                    Garment Details
                  </th>
                  <th
                    colSpan="5"
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600"
                  >
                    Measurement Details
                  </th>
                  <th
                    rowSpan="2"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Pass % (Garment)
                  </th>
                  <th
                    rowSpan="2"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Pass % (Points)
                  </th>
                  <th
                    rowSpan="2"
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Action
                  </th>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-600">
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-l border-gray-200 dark:border-gray-600">
                    Checked
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    OK
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                    Reject
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pass
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Issues
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    TOL+
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                    TOL-
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="17" className="text-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="17" className="text-center p-8 text-red-500">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      {error}
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? ( // Check paginatedData
                  <tr>
                    <td colSpan="17" className="text-center p-8 text-gray-500">
                      No data available for the selected filters.
                    </td>
                  </tr>
                ) : (
                  // Map over paginatedData instead of filteredData ---
                  paginatedData.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      {/* TABLE ROW CONTENT --- */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        {item.moNo}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {item.colors.join(", ")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.qcID}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        {item.orderQty_style}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        {item.orderQty_color}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-center">
                        {item.size}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-center">
                        {item.summary.checkedQty}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-green-600 dark:text-green-400 text-center">
                        {item.summary.okGarment}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-red-600 dark:text-red-400 text-center">
                        {item.summary.rejectedGarment}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-center">
                        {item.summary.totalPoints}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-green-600 dark:text-green-400 text-center">
                        {item.summary.passPoints}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-red-600 dark:text-red-400 text-center">
                        {item.summary.issuePoints}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-rose-500 text-center">
                        {item.summary.tolPlus}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-red-500 text-center">
                        {item.summary.tolNeg}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-center">
                        {item.summary.checkedQty > 0
                          ? (
                              (item.summary.okGarment /
                                item.summary.checkedQty) *
                              100
                            ).toFixed(2) + "%"
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-center">
                        {item.summary.totalPoints > 0
                          ? (
                              (item.summary.passPoints /
                                item.summary.totalPoints) *
                              100
                            ).toFixed(2) + "%"
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                        <ActionMenu
                          item={item}
                          onViewReport={handleViewReport}
                        />
                      </td>
                    </tr>
                  ))
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
      {/* --- NEW: Render the modal conditionally --- */}
      {selectedItem && (
        <ANFMeasurementResultsViewFullReport
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          itemData={selectedItem}
          dateRange={{ startDate: filters.startDate, endDate: filters.endDate }}
        />
      )}
    </div>
  );
};

export default ANFMeasurementResults;
