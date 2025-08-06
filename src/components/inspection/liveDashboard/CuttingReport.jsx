import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MoreVertical,
  Search,
  XCircle,
  Archive,
  ClipboardCheck,
  FileSearch,
  Scaling,
  PackageCheck,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Bug,
  ClipboardList,
  Edit,
  MessageSquare
} from "lucide-react";
import React, { useCallback, useEffect, useState, useRef } from "react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import CuttingReportDetailView from "../cutting/report/CuttingReportDetailView";
import CuttingReportFollowUp from "../cutting/CuttingReportFollowUp";

// --- START: NEW SEARCHABLE DROPDOWN COMPONENT ---
const customStyles = {
  control: (provided) => ({
    ...provided,
    minHeight: "42px",
    height: "42px",
    border: "1px solid #d1d5db",
    borderRadius: "0.5rem",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: "42px",
    padding: "0 8px"
  }),
  input: (provided) => ({
    ...provided,
    margin: "0px"
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: "42px"
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 20
  })
};

const SearchableFilterDropdown = ({
  name,
  label,
  options,
  value,
  onChange,
  placeholder,
  isMulti = false
}) => {
  const formattedOptions = options.map((opt) =>
    typeof opt === "object" &&
    opt.hasOwnProperty("value") &&
    opt.hasOwnProperty("label")
      ? opt
      : { value: opt, label: opt }
  );

  const selectedValue =
    formattedOptions.find((opt) => opt.value === value) || null;

  const handleChange = (selectedOption) => {
    onChange(name, selectedOption ? selectedOption.value : "");
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <Select
        name={name}
        options={formattedOptions}
        value={selectedValue}
        onChange={handleChange}
        placeholder={placeholder || `Search...`}
        isClearable
        isMulti={isMulti}
        className="mt-1 text-sm"
        styles={customStyles}
      />
    </div>
  );
};
// --- END: NEW SEARCHABLE DROPDOWN COMPONENT ---

// Function to determine result status (remains the same)
const getResultStatus = (
  totalInspectionQty,
  sumTotalReject,
  sumTotalPcs,
  t
) => {
  if (sumTotalPcs < totalInspectionQty) {
    return {
      status: t("common.pending"),
      color: "bg-yellow-100 text-yellow-700"
    };
  }
  if (totalInspectionQty >= 315) {
    if (sumTotalReject > 7)
      return { status: t("common.fail"), color: "bg-red-100 text-red-600" };
    return { status: t("common.pass"), color: "bg-green-100 text-green-600" };
  } else if (totalInspectionQty >= 210) {
    if (sumTotalReject > 5)
      return { status: t("common.fail"), color: "bg-red-100 text-red-600" };
    return { status: t("common.pass"), color: "bg-green-100 text-green-600" };
  } else if (totalInspectionQty >= 135) {
    if (sumTotalReject > 3)
      return { status: t("common.fail"), color: "bg-red-100 text-red-600" };
    return { status: t("common.pass"), color: "bg-green-100 text-green-600" };
  } else if (totalInspectionQty >= 90) {
    if (sumTotalReject > 2)
      return { status: t("common.fail"), color: "bg-red-100 text-red-600" };
    return { status: t("common.pass"), color: "bg-green-100 text-green-600" };
  } else if (totalInspectionQty >= 60) {
    if (sumTotalReject > 1)
      return { status: t("common.fail"), color: "bg-red-100 text-red-600" };
    return { status: t("common.pass"), color: "bg-green-100 text-green-600" };
  } else if (totalInspectionQty >= 30) {
    if (sumTotalReject > 0)
      return { status: t("common.fail"), color: "bg-red-100 text-red-600" };
    return { status: t("common.pass"), color: "bg-green-100 text-green-600" };
  }
  return {
    status: t("common.pending"),
    color: "bg-yellow-100 text-yellow-700"
  };
};

const CuttingReport = () => {
  const { t, i18n } = useTranslation();

  const initialFilters = {
    startDate: new Date(),
    endDate: new Date(),
    buyer: "",
    moNo: "",
    tableNo: "",
    color: "",
    garmentType: "",
    spreadTable: "",
    material: "",
    qcId: ""
  };

  const [filters, setFilters] = useState(initialFilters);
  const [reports, setReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const [filterOptions, setFilterOptions] = useState({
    buyers: ["MWW", "Costco", "Aritzia", "Reitmans", "ANF", "STORI", "Other"],
    moNos: [],
    tableNos: [],
    colors: [],
    garmentTypes: [],
    spreadTables: [],
    materials: [],
    qcInspectors: []
  });

  // --- START: NEW STATE FOR ACTIONS ---
  const [activeActionMenu, setActiveActionMenu] = useState(null); // Holds the ID of the report whose menu is open
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedReportForFollowUp, setSelectedReportForFollowUp] =
    useState(null);
  const actionMenuRef = useRef(null);
  // --- END: NEW STATE FOR ACTIONS ---

  const fetchFilterOptions = useCallback(async (currentFilters) => {
    try {
      const params = {
        ...currentFilters,
        startDate: currentFilters.startDate
          ? currentFilters.startDate.toLocaleDateString("en-CA")
          : null,
        endDate: currentFilters.endDate
          ? currentFilters.endDate.toLocaleDateString("en-CA")
          : null
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/cutting-report-filter-options`,
        { params }
      );
      setFilterOptions((prev) => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const qcResponse = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections/qc-inspectors`
        );
        setFilterOptions((prev) => ({
          ...prev,
          qcInspectors: qcResponse.data
        }));
      } catch (error) {
        console.error("Error fetching initial QC data:", error);
      }
    };
    fetchInitialData();
  }, []);

  const fetchReports = useCallback(
    async (pageToFetch = 1, currentFilters = filters) => {
      setLoading(true);
      try {
        const params = {
          ...currentFilters,
          startDate: currentFilters.startDate
            ? currentFilters.startDate.toLocaleDateString("en-US")
            : null,
          endDate: currentFilters.endDate
            ? currentFilters.endDate.toLocaleDateString("en-US")
            : null,
          page: pageToFetch,
          limit: 15
        };
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspections-report`,
          { params, withCredentials: true }
        );
        setReports(response.data.reports);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.currentPage);
        setTotalReports(response.data.totalReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text:
            error.response?.data?.message || t("cutting.failedToFetchReports")
        });
        setReports([]);
        setTotalPages(0);
        setTotalReports(0);
      } finally {
        setLoading(false);
      }
    },
    [filters, t]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchFilterOptions(filters);
    }, 500); // Debounce
    return () => clearTimeout(handler);
  }, [filters, fetchFilterOptions]);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // --- 2. NEW HANDLER FOR REACT-SELECT ---
  // This handler receives the name and value directly from our wrapper component
  const handleSelectChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    if (
      name === "endDate" &&
      date &&
      filters.startDate &&
      date < filters.startDate
    ) {
      Swal.fire({
        icon: "warning",
        title: t("common.invalidDateRange"),
        text: t("common.endDateCannotBeBeforeStartDate")
      });
      return;
    }
    setFilters((prev) => ({ ...prev, [name]: date }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    fetchReports(1, initialFilters);
  };

  const handleSearch = () => {
    fetchReports(1);
  };

  // --- START: NEW HANDLERS FOR ACTIONS ---
  const handleActionClick = (reportId) => {
    setActiveActionMenu(activeActionMenu === reportId ? null : reportId);
  };

  const handleOpenFollowUp = (report) => {
    setSelectedReportForFollowUp(report);
    setIsFollowUpModalOpen(true);
    setActiveActionMenu(null); // Close the action menu
  };

  // Click outside handler to close the action menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setActiveActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // --- END: NEW HANDLERS FOR ACTIONS ---

  const handleViewReport = (reportId) => setSelectedReportId(reportId);
  const handleBackFromDetail = () => setSelectedReportId(null);

  const renderFilterDropdown = (name, label, options) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        name={name}
        value={filters[name]}
        onChange={handleFilterChange}
        className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm text-sm"
      >
        <option value="">{t("common.all")}</option>
        {options.map((opt, index) =>
          typeof opt === "object" ? (
            <option key={`${opt.value}-${index}`} value={opt.value}>
              {opt.label}
            </option>
          ) : (
            <option key={`${opt}-${index}`} value={opt}>
              {opt}
            </option>
          )
        )}
      </select>
    </div>
  );

  if (selectedReportId) {
    return (
      <CuttingReportDetailView
        reportId={selectedReportId}
        onBack={handleBackFromDetail}
      />
    );
  }

  return (
    <div className="p-1 sm:p-2 bg-gray-50 min-h-screen">
      <div className="max-w-8xl mx-auto bg-white p-3 sm:p-4 rounded-xl shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-4 mb-1 p-1 border border-gray-200 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("common.startDate")}
            </label>
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleDateChange("startDate", date)}
              dateFormat="MM/dd/yyyy"
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("common.endDate")}
            </label>
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleDateChange("endDate", date)}
              dateFormat="MM/dd/yyyy"
              minDate={filters.startDate}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm"
              isClearable
            />
          </div>
          <SearchableFilterDropdown
            name="buyer"
            label={t("cutting.buyer")}
            options={filterOptions.buyers}
            value={filters.buyer}
            onChange={handleSelectChange}
            placeholder={t("cutting.selectBuyer")}
          />

          <SearchableFilterDropdown
            name="moNo"
            label={t("cutting.moNo")}
            options={filterOptions.moNos}
            value={filters.moNo}
            onChange={handleSelectChange}
            placeholder={t("cutting.selectMoNo")}
          />

          <SearchableFilterDropdown
            name="tableNo"
            label={t("cutting.tableNo")}
            options={filterOptions.tableNos}
            value={filters.tableNo}
            onChange={handleSelectChange}
            placeholder={t("cutting.selectTableNo")}
          />

          <SearchableFilterDropdown
            name="color"
            label={t("cutting.color")}
            options={filterOptions.colors}
            value={filters.color}
            onChange={handleSelectChange}
            placeholder={t("cutting.selectColor")}
          />

          <SearchableFilterDropdown
            name="garmentType"
            label={t("cutting.garmentType")}
            options={filterOptions.garmentTypes}
            value={filters.garmentType}
            onChange={handleSelectChange}
            placeholder={t("cutting.selectGarmentType")}
          />

          <SearchableFilterDropdown
            name="spreadTable"
            label={t("cutting.spreadTable")}
            options={filterOptions.spreadTables}
            value={filters.spreadTable}
            onChange={handleSelectChange}
            placeholder={t("cutting.selectSpreadTable")}
          />

          <SearchableFilterDropdown
            name="material"
            label={t("cutting.material")}
            options={filterOptions.materials}
            value={filters.material}
            onChange={handleSelectChange}
            placeholder={t("cutting.selectMaterial")}
          />
          {/* Special handling for QC ID as it's an object array */}
          <SearchableFilterDropdown
            name="qcId"
            label={t("cutting.qcId")}
            options={filterOptions.qcInspectors.map((qc) => ({
              value: qc.emp_id,
              label: `${qc.emp_id} - ${
                i18n.language === "km" && qc.kh_name ? qc.kh_name : qc.eng_name
              }`
            }))}
            value={filters.qcId}
            onChange={handleSelectChange}
            placeholder={t("cutting.selectQcId")}
          />

          <div className="flex items-end col-span-1 xl:col-span-2 space-x-2">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search size={20} />
              )}
              <span className="ml-2">{t("common.search")}</span>
            </button>
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center shadow-sm"
              disabled={loading}
            >
              <XCircle size={20} />
              <span className="ml-2">{t("common.clear")}</span>
            </button>
          </div>
        </div>

        {totalReports > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            {t("common.showing")} {reports.length} {t("common.of")}{" "}
            {totalReports} {t("common.reports")}.
          </div>
        )}

        {/* --- NEW LEGEND BLOCK --- */}
        <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50 text-sm">
          <h4 className="font-semibold text-sm mb-2">
            {t("common.headerIconLegend")}:
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <Archive size={16} className="text-blue-600" />
              <span>{t("cutting.totalQty")}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-blue-600" />
              <span>{t("cutting.qtyChecked")}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileSearch size={16} className="text-blue-600" />
              <span>{t("cutting.inspectedQty")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Scaling size={16} className="text-blue-600" />
              <span>{t("cutting.inspectedSizes")}</span>
            </div>
            <div className="flex items-center gap-2">
              <PackageCheck size={16} className="text-green-600" />
              <span>{t("cutting.totalCompleted")}</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp size={16} className="text-green-600" />
              <span>{t("cutting.pass")}</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsDown size={16} className="text-red-600" />
              <span>{t("cutting.reject")}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-600" />
              <span>{t("cutting.rejectMeasurements")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bug size={16} className="text-purple-600" />
              <span>{t("cutting.rejectDefects")}</span>
            </div>
          </div>
        </div>

        {loading && reports.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="ml-2">{t("common.loadingData")}</p>
          </div>
        ) : !loading && reports.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {t("cutting.noReportsFound")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300 text-xs sm:text-sm">
              <thead className="bg-gray-100">
                <tr className="text-left font-semibold text-gray-600">
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.inspectionDate")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.buyer")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.moNo")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.tableNo")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.custStyle")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.spreadTable")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.material")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.lotNos")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.qcId")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.color")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.garmentType")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.mackerNo")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 border-r border-b align-middle"
                  >
                    {t("cutting.mackerRatio")}
                  </th>
                  <th
                    colSpan="3"
                    className="px-3 py-2 text-center border-r border-b"
                  >
                    {t("cutting.layerDetails")}
                  </th>
                  <th
                    colSpan="4"
                    className="px-3 py-2 text-center border-r border-b"
                  >
                    {t("cutting.bundleDetails")}
                  </th>
                  <th
                    colSpan="5"
                    className="px-3 py-2 text-center border-r border-b"
                  >
                    {t("cutting.inspectionDetails")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 text-right border-r border-b align-middle"
                  >
                    {t("cutting.passRate")} (%)
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 text-center border-r border-b align-middle"
                  >
                    {t("cutting.results")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 text-center border-r border-b align-middle"
                  >
                    {t("cutting.report")}
                  </th>
                  <th
                    rowSpan="2"
                    className="px-3 py-2 text-center border-b align-middle"
                  >
                    {t("common.action")}
                  </th>
                </tr>
                <tr className="text-right font-semibold text-gray-600">
                  <th className="px-3 py-2 border-r border-b">
                    {t("cutting.plan")}
                  </th>
                  <th className="px-3 py-2 border-r border-b">
                    {t("cutting.actual")}
                  </th>
                  <th className="px-3 py-2 border-r border-b">
                    {t("cutting.totalPcs")}
                  </th>
                  {/* Bundle Details (with icons) */}
                  <th
                    className="px-3 py-2 border-r border-b"
                    title={t("cutting.totalQty")}
                  >
                    <Archive size={16} className="mx-auto" />
                  </th>
                  <th
                    className="px-3 py-2 border-r border-b"
                    title={t("cutting.qtyChecked")}
                  >
                    <ClipboardCheck size={16} className="mx-auto" />
                  </th>
                  <th
                    className="px-3 py-2 border-r border-b"
                    title={t("cutting.inspectedQty")}
                  >
                    <FileSearch size={16} className="mx-auto" />
                  </th>
                  <th
                    className="px-3 py-2 border-r border-b"
                    title={t("cutting.inspectedSizes")}
                  >
                    <Scaling size={16} className="mx-auto" />
                  </th>
                  <th
                    className="px-3 py-2 border-r border-b"
                    title={t("cutting.totalCompleted")}
                  >
                    <PackageCheck size={16} className="mx-auto" />
                  </th>
                  <th
                    className="px-3 py-2 border-r border-b"
                    title={t("cutting.pass")}
                  >
                    <ThumbsUp size={16} className="mx-auto" />
                  </th>
                  <th
                    className="px-3 py-2 border-r border-b"
                    title={t("cutting.reject")}
                  >
                    <ThumbsDown size={16} className="mx-auto" />
                  </th>
                  <th
                    className="px-3 py-2 border-r border-b"
                    title={t("cutting.rejectMeasurements")}
                  >
                    <AlertTriangle size={16} className="mx-auto" />
                  </th>
                  <th
                    className="px-3 py-2 border-r border-b"
                    title={t("cutting.rejectDefects")}
                  >
                    <Bug size={16} className="mx-auto" />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => {
                  const { status, color } = getResultStatus(
                    report.totalInspectionQty,
                    report.sumTotalReject,
                    report.sumTotalPcs,
                    t
                  );
                  return (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap border-r">
                        {report.inspectionDate}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap border-r">
                        {report.buyer}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap border-r">
                        {report.moNo}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap border-r">
                        {report.tableNo}
                      </td>
                      <td className="px-3 py-2 border-r break-words min-w-[150px]">
                        {report.buyerStyle}
                      </td>
                      <td className="px-3 py-2 border-r break-words">
                        {report.cuttingTableDetails?.spreadTable}
                      </td>
                      <td className="px-3 py-2 border-r break-words min-w-[150px]">
                        {report.fabricDetails?.material}
                      </td>
                      <td className="px-3 py-2 border-r max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {report.lotNo?.map((lot, idx) => (
                            <span
                              key={idx}
                              className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full"
                            >
                              {lot}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap border-r">
                        {report.cutting_emp_id}
                      </td>
                      <td className="px-3 py-2 border-r break-words">
                        {report.color}
                      </td>
                      <td className="px-3 py-2 border-r break-words">
                        {report.garmentType}
                      </td>
                      <td className="px-3 py-2 text-center border-r">
                        {report.cuttingTableDetails?.mackerNo}
                      </td>
                      <td className="px-3 py-2 border-r min-w-[150px]">
                        {report.mackerRatio &&
                          report.mackerRatio.length > 0 && (
                            <table className="text-xs w-full">
                              <tbody>
                                <tr>
                                  {report.mackerRatio.map((mr) => (
                                    <td
                                      key={`${mr.index}-size`}
                                      className="px-1 text-center font-bold"
                                    >
                                      {mr.markerSize}
                                    </td>
                                  ))}
                                </tr>
                                <tr>
                                  {report.mackerRatio.map((mr) => (
                                    <td
                                      key={`${mr.index}-ratio`}
                                      className="px-1 pt-1 text-center"
                                    >
                                      <span className="bg-amber-600 text-white font-semibold rounded px-1.5 py-0.5">
                                        {mr.ratio}
                                      </span>
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          )}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap bg-yellow-100">
                        {report.cuttingTableDetails?.planLayers}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap bg-gray-100">
                        {report.cuttingTableDetails?.actualLayers}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap bg-gray-100">
                        {report.cuttingTableDetails?.totalPcs}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap bg-yellow-100">
                        {report.totalBundleQty}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap bg-orange-200 font-bold">
                        {report.bundleQtyCheck}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap bg-blue-100">
                        {report.totalInspectionQty}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap bg-gray-100">
                        {report.numberOfInspectedSizes}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap bg-blue-100 font-bold">
                        {report.sumTotalPcs}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap bg-green-100 font-bold">
                        {report.sumTotalPass}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap bg-red-300 font-bold">
                        {report.sumTotalReject}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap bg-red-100 font-bold">
                        {report.sumTotalRejectMeasurement}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap bg-red-100 font-bold">
                        {report.sumTotalRejectDefects}
                      </td>
                      <td className="px-3 py-2 text-right border-r whitespace-nowrap font-bold">
                        {report.overallPassRate?.toFixed(2)}
                      </td>
                      <td
                        className={`px-3 py-2 text-center border-r font-semibold ${color}`}
                      >
                        {status}
                      </td>
                      <td className="px-3 py-2 text-center border-r">
                        <button
                          onClick={() => handleViewReport(report._id)}
                          className="text-blue-600 hover:text-blue-800"
                          title={t("cutting.viewReport")}
                        >
                          <Eye size={18} />
                        </button>
                      </td>

                      {/* --- MODIFIED ACTION COLUMN --- */}
                      <td className="px-3 py-2 text-center relative">
                        <button
                          onClick={() => handleActionClick(report._id)}
                          className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeActionMenu === report._id && (
                          <div
                            ref={actionMenuRef}
                            className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20"
                          >
                            <ul className="py-1 text-sm text-gray-700">
                              <li>
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleOpenFollowUp(report);
                                  }}
                                  className="flex items-center px-4 py-2 hover:bg-gray-100"
                                >
                                  <ClipboardList size={16} className="mr-3" />
                                  {t("common.followUp")}
                                </a>
                              </li>
                              <li>
                                <a
                                  href="#"
                                  onClick={(e) => e.preventDefault()}
                                  className="flex items-center px-4 py-2 hover:bg-gray-100 text-gray-400 cursor-not-allowed"
                                >
                                  <Edit size={16} className="mr-3" />
                                  {t("common.editFollowUp")}
                                </a>
                              </li>
                              <li>
                                <a
                                  href="#"
                                  onClick={(e) => e.preventDefault()}
                                  className="flex items-center px-4 py-2 hover:bg-gray-100 text-gray-400 cursor-not-allowed"
                                >
                                  <MessageSquare size={16} className="mr-3" />
                                  {t("common.comments")}
                                </a>
                              </li>
                            </ul>
                          </div>
                        )}
                      </td>

                      {/* <td className="px-3 py-2 text-center">
                        <button className="text-gray-500 hover:text-gray-700">
                          <MoreVertical size={18} />
                        </button>
                      </td> */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center text-sm">
            <button
              onClick={() => fetchReports(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 flex items-center"
            >
              <ChevronLeft size={16} className="mr-1" /> {t("common.previous")}
            </button>
            <span>
              {t("common.page")} {currentPage} {t("common.of")} {totalPages}
            </span>
            <button
              onClick={() => fetchReports(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 flex items-center"
            >
              {t("common.next")} <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        )}
      </div>
      {/* --- ADD MODAL RENDER AT THE END --- */}
      {isFollowUpModalOpen && (
        <CuttingReportFollowUp
          report={selectedReportForFollowUp}
          onClose={() => setIsFollowUpModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CuttingReport;
