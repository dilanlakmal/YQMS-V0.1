import React, { useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaAngleLeft,
  FaAngleRight,
  FaArchive,
  FaBarcode,
  FaBoxes,
  FaCalendarAlt,
  FaFilter,
  FaHashtag,
  FaListOl,
  FaProjectDiagram,
  FaTasks,
  FaTimes,
  FaUserCheck,
  FaUserTie
} from "react-icons/fa";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";

const normalizeDateString = (dateStr) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const partsMMDDYYYY = dateStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (partsMMDDYYYY) {
        let month = parseInt(partsMMDDYYYY[1], 10);
        let day = parseInt(partsMMDDYYYY[2], 10);
        const year = parseInt(partsMMDDYYYY[3], 10);
        if (month > 12 && day <= 12) {
          [month, day] = [day, month];
        }
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${String(month).padStart(2, "0")}/${String(day).padStart(
            2,
            "0"
          )}/${year}`;
        }
      }
      const partsYYYYMMDD = dateStr.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      if (partsYYYYMMDD) {
        const year = parseInt(partsYYYYMMDD[1], 10);
        const month = parseInt(partsYYYYMMDD[2], 10);
        const day = parseInt(partsYYYYMMDD[3], 10);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${String(month).padStart(2, "0")}/${String(day).padStart(
            2,
            "0"
          )}/${year}`;
        }
      }
      console.warn(
        "Could not normalize date string, returning as is:",
        dateStr
      );
      return dateStr;
    }
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (e) {
    console.error("Error normalizing date string:", dateStr, e);
    return dateStr;
  }
};

function BundleRegistrationRecordData({ handleEdit }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMobileDevice =
    typeof navigator !== "undefined" &&
    /Mobi|Android/i.test(navigator.userAgent);

  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    totalGarmentQty: 0,
    totalBundles: 0,
    totalStyles: 0,
    garmentQtyByTask: {},
    bundleCountByTask: {}
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  // Filters State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTaskNo, setSelectedTaskNo] = useState(null);
  const [selectedLineNo, setSelectedLineNo] = useState(null);
  const [selectedMono, setSelectedMono] = useState(null);
  const [packageNoInput, setPackageNoInput] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [selectedQcId, setSelectedQcId] = useState(null);

  // Filter Options State
  const [taskNoOptions, setTaskNoOptions] = useState([]);
  const [lineNoOptions, setLineNoOptions] = useState([]);
  const [monoOptions, setMonoOptions] = useState([]);
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [qcIdOptions, setQcIdOptions] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 15;

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/bundle-data/distinct-filters`
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setTaskNoOptions(data.taskNos.map((tn) => ({ value: tn, label: tn })));
        setLineNoOptions(data.lineNos.map((ln) => ({ value: ln, label: ln })));
        setMonoOptions(data.monos.map((mo) => ({ value: mo, label: mo })));
        setBuyerOptions(data.buyers.map((b) => ({ value: b, label: b })));
        setQcIdOptions(data.qcIds.map((id) => ({ value: id, label: id })));
        if (user && user.emp_id && data.qcIds.includes(user.emp_id)) {
          setSelectedQcId({ value: user.emp_id, label: user.emp_id });
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchFilterOptions();
  }, [user]);

  const [debouncedPackageNo, setDebouncedPackageNo] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPackageNo(packageNoInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [packageNoInput]);

  const fetchFilteredData = useCallback(
    async (pageToFetch = 1) => {
      setLoading(true);
      setCurrentPage(pageToFetch);
      const params = new URLSearchParams();
      if (selectedDate)
        params.append("date", selectedDate.toISOString().split("T")[0]);
      if (selectedTaskNo) params.append("task_no", selectedTaskNo.value);
      if (selectedLineNo) params.append("lineNo", selectedLineNo.value);
      if (selectedMono) params.append("selectedMono", selectedMono.value);
      if (debouncedPackageNo) params.append("packageNo", debouncedPackageNo);
      if (selectedBuyer) params.append("buyer", selectedBuyer.value);
      if (selectedQcId) params.append("emp_id", selectedQcId.value);

      params.append("page", pageToFetch.toString());
      params.append("limit", recordsPerPage.toString());

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/filtered-bundle-data?${params.toString()}`
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setRecords(data.records || []);
        setStats(
          data.stats || {
            totalGarmentQty: 0,
            totalBundles: 0,
            totalStyles: 0,
            garmentQtyByTask: {},
            bundleCountByTask: {}
          }
        );
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalRecords(data.pagination.totalRecords);
        } else {
          setTotalPages(0);
          setTotalRecords(0);
        }
      } catch (error) {
        console.error("Error fetching filtered bundle data:", error);
        setRecords([]);
        setStats({
          totalGarmentQty: 0,
          totalBundles: 0,
          totalStyles: 0,
          garmentQtyByTask: {},
          bundleCountByTask: {}
        });
        setTotalPages(0);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    },
    [
      selectedDate,
      selectedTaskNo,
      selectedLineNo,
      selectedMono,
      debouncedPackageNo,
      selectedBuyer,
      selectedQcId,
      recordsPerPage
    ]
  );

  useEffect(() => {
    fetchFilteredData(1);
  }, [
    selectedDate,
    selectedTaskNo,
    selectedLineNo,
    selectedMono,
    debouncedPackageNo,
    selectedBuyer,
    selectedQcId
  ]);

  const clearFilters = () => {
    setSelectedDate(new Date());
    setSelectedTaskNo(null);
    setSelectedLineNo(null);
    setSelectedMono(null);
    setPackageNoInput("");
    setSelectedBuyer(null);
    if (
      user &&
      user.emp_id &&
      qcIdOptions.find((opt) => opt.value === user.emp_id)
    ) {
      setSelectedQcId({ value: user.emp_id, label: user.emp_id });
    } else {
      setSelectedQcId(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      fetchFilteredData(newPage);
    }
  };

  const headers = [
    "record_id",
    "package_no",
    "task_no",
    "date",
    "modify",
    "time",
    "department",
    "emp_id",
    "eng_name",
    "kh_name",
    "mono",
    "customer_style",
    "buyer",
    "country",
    "total_order_qty",
    "factory",
    "line_no",
    "color",
    "color_chi",
    "size",
    "order_cut_qty",
    "plan_cut_qty",
    "count",
    "total_bundle_qty",
    "sub_con",
    "sub_con_factory"
  ];

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "38px",
      height: "38px",
      boxShadow: "none",
      "&:hover": { borderColor: "#a0aec0" },
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
    menu: (provided) => ({ ...provided, zIndex: 100 })
  };

  const formatTaskBreakdown = (taskData) => {
    if (!selectedQcId || !taskData || Object.keys(taskData).length === 0)
      return "";
    const breakdown = Object.entries(taskData)
      .map(
        ([task, count]) =>
          `${t("task", "Task")} ${task}: ${count.toLocaleString()}`
      )
      .join(", ");
    return breakdown ? `(${breakdown})` : "";
  };

  const StatCard = ({ title, value, icon, colorClass, breakdown }) => (
    <div
      className={`bg-white p-4 rounded-xl shadow-lg flex items-center space-x-3 border-l-4 ${colorClass}`}
    >
      <div
        className={`p-3 rounded-full bg-opacity-20 ${colorClass
          .replace("border-l-4", "")
          .replace("border-", "bg-")}`}
      >
        {React.cloneElement(icon, {
          className: `h-6 w-6 ${colorClass
            .replace("border-l-4", "")
            .replace("border-", "text-")}`
        })}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
          {title}
        </p>
        <p className="text-xl font-semibold text-gray-700">{value}</p>
        {breakdown && <p className="text-xs text-gray-500 mt-1">{breakdown}</p>}
      </div>
    </div>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const maxPagesToShow = isMobile ? 3 : 5;

    let startPage, endPage;
    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - Math.floor(maxPagesToShow / 2);
        endPage = currentPage + Math.floor(maxPagesToShow / 2);
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <nav className="mt-6 flex items-center justify-between border-t border-gray-200 px-2 sm:px-0">
        <div className="flex flex-1 justify-between sm:justify-start space-x-1">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaAngleDoubleLeft
              className="h-4 w-4 sm:h-5 sm:w-5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline ml-1">
              {t("pagination.first", "First")}
            </span>
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaAngleLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            <span className="hidden sm:inline ml-1">
              {t("pagination.previous", "Prev")}
            </span>
          </button>
        </div>
        <div className="hidden sm:flex sm:items-center sm:justify-center">
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                1
              </button>
              {startPage > 2 && (
                <span className="relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700">
                  ...
                </span>
              )}
            </>
          )}
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              className={`relative inline-flex items-center px-3 py-2 mx-0.5 text-xs sm:text-sm font-medium border rounded-md ${
                currentPage === number
                  ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {number}
            </button>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700">
                  ...
                </span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        <div className="flex flex-1 justify-between sm:justify-end space-x-1">
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline mr-1">
              {t("pagination.next", "Next")}
            </span>
            <FaAngleRight
              className="h-4 w-4 sm:h-5 sm:w-5"
              aria-hidden="true"
            />
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline mr-1">
              {t("pagination.last", "Last")}
            </span>
            <FaAngleDoubleRight
              className="h-4 w-4 sm:h-5 sm:w-5"
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>
    );
  };

  return (
    <>
      <div
        className={`bg-white rounded-xl shadow-xl p-4 mb-4 ${
          !showFilters ? "pb-1" : ""
        }`}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base md:text-lg font-semibold text-gray-700 flex items-center">
            <FaFilter className="mr-2 text-indigo-600" />
            {t("bundle.filters", "Filters")}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-xs md:text-sm text-indigo-600 hover:text-indigo-800 font-medium p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
            >
              {showFilters
                ? t("bundle.hide_filters")
                : t("bundle.show_filters")}
            </button>
            {showFilters && (
              <button
                onClick={clearFilters}
                className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-100 transition-colors"
                title={t("bundle.clear_filters")}
              >
                <FaTimes size={14} />
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 mb-4 transition-all duration-300 ease-in-out">
            <div className="flex flex-col relative z-[60]">
              <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                <FaCalendarAlt className="mr-1.5 text-gray-400" />
                {t("bundle.date")}
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                dateFormat="MM/dd/yyyy"
                popperPlacement="bottom-start"
                readOnly={isMobileDevice} // PREVENT KEYBOARD ON MOBILE
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                <FaTasks className="mr-1.5 text-gray-400" />
                {t("bundle.task_no")}
              </label>
              <Select
                options={taskNoOptions}
                value={selectedTaskNo}
                onChange={setSelectedTaskNo}
                isClearable
                placeholder={t("bundle.select_task_no", "Task...")}
                styles={selectStyles}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                <FaListOl className="mr-1.5 text-gray-400" />
                {t("bundle.line_no")}
              </label>
              <Select
                options={lineNoOptions}
                value={selectedLineNo}
                onChange={setSelectedLineNo}
                isClearable
                placeholder={t("bundle.select_line_no", "Line...")}
                styles={selectStyles}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                <FaHashtag className="mr-1.5 text-gray-400" />
                {t("bundle.mono")}
              </label>
              <Select
                options={monoOptions}
                value={selectedMono}
                onChange={setSelectedMono}
                isClearable
                placeholder={t("bundle.select_mono", "MONo...")}
                styles={selectStyles}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                <FaBarcode className="mr-1.5 text-gray-400" />
                {t("bundle.package_no")}
              </label>
              <input
                type="text"
                value={packageNoInput}
                onChange={(e) => setPackageNoInput(e.target.value)}
                placeholder={t("bundle.enter_package_no", "Package No...")}
                className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                <FaUserTie className="mr-1.5 text-gray-400" />
                {t("bundle.buyer")}
              </label>
              <Select
                options={buyerOptions}
                value={selectedBuyer}
                onChange={setSelectedBuyer}
                isClearable
                placeholder={t("bundle.select_buyer", "Buyer...")}
                styles={selectStyles}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                <FaUserCheck className="mr-1.5 text-gray-400" />
                {t("bundle.qc_id", "QC ID")}
              </label>
              <Select
                options={qcIdOptions}
                value={selectedQcId}
                onChange={setSelectedQcId}
                isClearable
                placeholder={t("bundle.select_qc_id", "QC ID...")}
                styles={selectStyles}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          title={t("bundle.total_garment_qty_card", "Total Garments")}
          value={loading ? "..." : stats.totalGarmentQty.toLocaleString()}
          breakdown={formatTaskBreakdown(stats.garmentQtyByTask)}
          icon={<FaArchive />}
          colorClass="border-l-blue-500 text-blue-500 bg-blue-500"
        />
        <StatCard
          title={t("bundle.total_bundles_card", "Total Bundles")}
          value={loading ? "..." : stats.totalBundles.toLocaleString()}
          breakdown={formatTaskBreakdown(stats.bundleCountByTask)}
          icon={<FaBoxes />}
          colorClass="border-l-green-500 text-green-500 bg-green-500"
        />
        <StatCard
          title={t("bundle.total_styles_card", "Total Styles (MONo)")}
          value={loading ? "..." : stats.totalStyles.toLocaleString()}
          icon={<FaProjectDiagram />}
          colorClass="border-l-purple-500 text-purple-500 bg-purple-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-xl p-0 md:p-4">
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm relative">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-200 sticky top-0 z-10">
              <tr>
                {headers.map((headerKey) => (
                  <th
                    key={headerKey}
                    scope="col"
                    className="px-3 md:px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                  >
                    {t(`bundle.${headerKey}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="text-center py-10 text-gray-500"
                  >
                    {t("bundle.loading_data", "Loading data...")}
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="text-center py-10 text-gray-500"
                  >
                    {t(
                      "bundle.no_records_found",
                      "No records found for the selected filters."
                    )}
                  </td>
                </tr>
              ) : (
                records.map((batch, index) => (
                  <tr
                    key={batch._id || index}
                    className="hover:bg-slate-50 transition-colors duration-150"
                  >
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {(currentPage - 1) * recordsPerPage + index + 1}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.package_no}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap font-semibold">
                      {batch.task_no}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.updated_date_seperator}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(batch._id)}
                        className="px-2.5 py-1 md:px-3.5 md:py-1.5 text-xs md:text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors shadow-sm"
                      >
                        {t("bundle.edit")}
                      </button>
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.updated_time_seperator}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.department}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.emp_id}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.eng_name}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.kh_name}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.selectedMono}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.custStyle}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.buyer}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.country}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.orderQty}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.factory}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.lineNo}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.color}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.chnColor}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.size}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.sizeOrderQty}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.planCutQty}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.count}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.bundleQty}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.sub_con}
                    </td>
                    <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-gray-700 whitespace-nowrap">
                      {batch.sub_con === "Yes" ? batch.sub_con_factory : "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination />
        <div className="mt-4 md:mt-6 text-xs md:text-sm text-gray-500">
          {t("bundle.showing_records_paginated", {
            start:
              records.length > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0,
            end:
              records.length > 0
                ? Math.min(currentPage * recordsPerPage, totalRecords)
                : 0,
            total: totalRecords
          })}
        </div>
      </div>
    </>
  );
}

export default BundleRegistrationRecordData;
