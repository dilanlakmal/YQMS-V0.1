import React, { useState, useEffect, useMemo, Fragment } from "react";
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
  FileText as ReportIcon,
  Send,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Menu, Transition } from "@headlessui/react";

//className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"

// Reusable Action Menu for Style View
const ActionMenu = ({ item, isLastRow, stage }) => {
  const reportUrl = `/anf-washing/style-full-report/${item.moNo}?stage=${
    stage?.value || "M1"
  }`;
  const handleAction = (action) => {
    alert(`${action} clicked for MO: ${item.moNo}`);
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
        <MoreVertical className="w-5 h-5" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none
            ${
              isLastRow
                ? "bottom-full mb-2 origin-bottom-right"
                : "origin-top-right"
            }
          `}
        >
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
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const ANFStyleView = () => {
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [stage, setStage] = useState({ value: "M1", label: "M1 - 5 Points" });

  const stageOptions = [
    { value: "M1", label: "M1 - 5 Points" },
    { value: "M2", label: "M2 - 2 Points" }
  ];

  const getApiPrefix = () => {
    return stage.value === "M2"
      ? `${API_BASE_URL}/api/anf-measurement-packing`
      : `${API_BASE_URL}/api/anf-measurement`;
  };

  const [filters, setFilters] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    buyer: null,
    moNo: null
  });

  const [filterOptions, setFilterOptions] = useState({
    buyers: [],
    moNos: []
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch data and filter options based on date range
  /* ------------------------------------------------------------------
     FIX 3: Update Data Fetching logic
  ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchData = async () => {
      if (!filters.startDate || !filters.endDate) return;
      setIsLoading(true);
      setError(null);

      const prefix = getApiPrefix(); // <--- Dynamic Prefix

      try {
        // Fetch main data using dynamic route
        const dataRes = await axios.get(
          `${prefix}/style-view-summary`, // Use prefix
          {
            params: {
              startDate: filters.startDate.toISOString().split("T")[0],
              endDate: filters.endDate.toISOString().split("T")[0]
            }
          }
        );
        setAllData(dataRes.data);

        // Derive filter options from the fetched data
        const buyers = [...new Set(dataRes.data.map((item) => item.buyer))];
        const moNos = [...new Set(dataRes.data.map((item) => item.moNo))];
        setFilterOptions({
          buyers: [
            { value: "All", label: "All Buyers" },
            ...buyers.map((b) => ({ value: b, label: b }))
          ],
          moNos: [
            { value: "All", label: "All MOs" },
            ...moNos.map((m) => ({ value: m, label: m }))
          ]
        });
      } catch (err) {
        setError("Failed to fetch style reports.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filters.startDate, filters.endDate, stage]);

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
      return buyerMatch && moMatch;
    });
  }, [allData, filters.buyer, filters.moNo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

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
        <h1 className="text-lg font-bold mb-2">ANF Measurement - Style View</h1>

        {/* --- FILTERS SECTION --- */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-3">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
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
              <label className="block text-sm font-medium mb-1">Stage</label>
              <Select
                options={stageOptions}
                value={stage}
                onChange={setStage}
                styles={selectStyles}
                isSearchable={false}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Buyer</label>
              <Select
                options={filterOptions.buyers}
                value={filters.buyer}
                onChange={(val) => setFilters((f) => ({ ...f, buyer: val }))}
                styles={selectStyles}
                isClearable
                placeholder="All Buyers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">MO No</label>
              <Select
                options={filterOptions.moNos}
                value={filters.moNo}
                onChange={(val) => setFilters((f) => ({ ...f, moNo: val }))}
                styles={selectStyles}
                isClearable
                placeholder="All MOs"
              />
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
              styles.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase">
                <tr>
                  <th
                    rowSpan="2"
                    className="px-3 py-3 text-left tracking-wider"
                  >
                    MO No
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-3 text-center tracking-wider"
                  >
                    Order Qty
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-3 text-center tracking-wider"
                  >
                    Total Colors
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
                    <td colSpan="14" className="text-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="text-center p-8 text-gray-500">
                      No styles found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => {
                    const summary = item.summary;
                    const passRateGarment =
                      summary?.checkedQty > 0
                        ? (
                            (summary.okGarment / summary.checkedQty) *
                            100
                          ).toFixed(2) + "%"
                        : "N/A";
                    const passRatePoints =
                      summary?.totalPoints > 0
                        ? (
                            (summary.passPoints / summary.totalPoints) *
                            100
                          ).toFixed(2) + "%"
                        : "N/A";

                    // --- Find the last row ---
                    const isLastRow = index === paginatedData.length - 1;
                    return (
                      <tr
                        key={item.moNo}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-3 py-2 whitespace-nowrap font-semibold">
                          {item.moNo}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.orderQty_style}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.totalColors}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {summary?.checkedQty || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-green-600 dark:text-green-400">
                          {summary?.okGarment || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-red-600 dark:text-red-400">
                          {summary?.rejectedGarment || 0}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {summary?.totalPoints || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-green-600 dark:text-green-400">
                          {summary?.passPoints || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-red-600 dark:text-red-400">
                          {summary?.issuePoints || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-rose-500">
                          {summary?.tolPlus || 0}
                        </td>
                        <td className="px-2 py-2 text-center text-red-500">
                          {summary?.tolNeg || 0}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold">
                          {passRateGarment}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold">
                          {passRatePoints}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <ActionMenu
                            item={item}
                            isLastRow={isLastRow}
                            stage={stage}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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

export default ANFStyleView;
