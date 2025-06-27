import React, { useEffect, useState, useCallback, useRef } from "react";
import { API_BASE_URL } from "../../../config";
import { useTranslation } from "react-i18next";
import { FaFilter, FaTimes, FaChevronDown, FaChevronUp, FaCalendarAlt } from "react-icons/fa";
import EditModal from "../forms/EditInspectionData";
import { useAuth } from "../authentication/AuthContext"; 
import DatePicker from "react-datepicker"; 
import "react-datepicker/dist/react-datepicker.css";

const QC2Data = () => {
  const {t} = useTranslation();
  const { user } = useAuth();
  const [dataCards, setDataCards] = useState([]);
  const [searchMoNo, setSearchMoNo] = useState("");
  const getTodayDateString = () => new Date().toISOString().split("T")[0];
  const [searchPackageNo, setSearchPackageNo] = useState("");
  const [searchEmpId, setSearchEmpId] = useState("");
  const [searchLineNo, setSearchLineNo] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [packageNoOptions, setPackageNoOptions] = useState([]);
  const [empIdOptions, setEmpIdOptions] = useState([]);
  const [lineNoOptions, setLineNoOptions] = useState([]);
  const [searchDate, setSearchDate] = useState(getTodayDateString());
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDataForEdit, setSelectedDataForEdit] = useState(null);
  const [showFilters, setShowFilters] = useState(true); 
  const isFirstRender = useRef(true); 
  const [masterDefects, setMasterDefects] = useState([]); // New state for master defect list
  const [empIdPreFocusValue, setEmpIdPreFocusValue] = useState(null);
  const justFocusedEmpId = useRef(false);

const fetchDataCards = async (page, limit, filters = {}) => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/qc2-inspection-pass-bundle/search?page=${page}&limit=${limit}`;
      const hasSearchParams =
        filters.moNo || filters.packageNo || filters.empId || filters.lineNo; // Date filter is now handled on the client-side

      if (hasSearchParams) {
        const params = new URLSearchParams();
        if (filters.moNo) params.append("moNo", filters.moNo);
        if (filters.packageNo) {
          const packageNo = Number(filters.packageNo);
          if (isNaN(packageNo)) {
            alert("Package No must be a number");
            setLoading(false);
            return;
          }
          params.append("package_no", packageNo.toString());
        }
        if (filters.empId) params.append("emp_id_inspection", filters.empId);
        if (filters.lineNo) params.append("lineNo", filters.lineNo); // Added lineNo to params
        url += `&${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch data cards");
      const responseData = await response.json();

      let fetchedData = Array.isArray(responseData.data) ? responseData.data : [];

      // Per your request, filtering for the date is now done on the client-side.
      // This avoids sending the date to the backend API.
      if (filters.date) {
        const [year, month, day] = filters.date.split('-');
        const formattedSearchDate = `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
        fetchedData = fetchedData.filter(card => card.inspection_date && card.inspection_date === formattedSearchDate);
      }

      setDataCards(fetchedData);
      setTotalRecords(Number.isInteger(responseData.total) ? responseData.total : 0);
    } catch (error) {
      console.error("Error fetching data cards:", error);
      setDataCards([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle/filter-options`
      );
      if (!response.ok) throw new Error("Failed to fetch filter options");
      const data = await response.json();
      setMoNoOptions(Array.isArray(data.moNo) ? data.moNo : []);
      setPackageNoOptions(Array.isArray(data.package_no) ? data.package_no : []);
      setEmpIdOptions(Array.isArray(data.emp_id_inspection) ? data.emp_id_inspection : []);
      setLineNoOptions(Array.isArray(data.lineNo) ? data.lineNo : []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
      setMoNoOptions([]);
      setPackageNoOptions([]);
      setEmpIdOptions([]);
      setLineNoOptions([]);
    }
  };

  // New function to fetch master defect list
  const fetchMasterDefects = async () => {
    try {
      // Assuming an API endpoint that returns a list of all defects with their codes
      const response = await fetch(`${API_BASE_URL}/api/qc2-defects`);
      if (!response.ok) throw new Error("Failed to fetch master defects");
      const data = await response.json();
      setMasterDefects(data);
    } catch (error) {
      console.error("Error fetching master defects:", error);
      // Optionally, display an error message to the user
    }
  };

  // Debounce utility function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  const applyFiltersAndFetch = useCallback(() => {
    const filtersToApply = {
      moNo: searchMoNo.trim(),
      packageNo: searchPackageNo.trim(),
      empId: searchEmpId.trim(),
      lineNo: searchLineNo.trim(),
      date: searchDate,
    };

    if (currentPage !== 1) {
      setCurrentPage(1); // This will trigger the pagination useEffect
    } else {
      // If already on page 1, fetch directly
      fetchDataCards(1, recordsPerPage, filtersToApply);
    }
 }, [searchMoNo, searchPackageNo, searchEmpId, searchLineNo, searchDate, currentPage, recordsPerPage, setCurrentPage]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedApplyFilters = useCallback(debounce(applyFiltersAndFetch, 700), [applyFiltersAndFetch]);

  // Effect for initial load and filter options
  useEffect(() => {
    fetchFilterOptions();
    if (user?.emp_id) {
      setSearchEmpId(user.emp_id); // Set default empId
    }
    // Initial fetch with default values
    fetchDataCards(1, recordsPerPage, {
      moNo: "",
      packageNo: "",
      empId: user?.emp_id || "",
      lineNo: "",
      date: getTodayDateString(),
    });
    fetchMasterDefects(); // Fetch master defects on initial load
  }, [user, recordsPerPage]);

  // Effect for filter input changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false; // Set to false after first render
      return; // Skip applying filters on initial mount
    }
    debouncedApplyFilters();
   }, [searchMoNo, searchPackageNo, searchEmpId, searchLineNo, searchDate, debouncedApplyFilters]);

  // Effect for pagination
  useEffect(() => {
    if (isFirstRender.current && currentPage === 1) return;
    const filtersToApply = {
      moNo: searchMoNo.trim(),
      packageNo: searchPackageNo.trim(),
      empId: searchEmpId.trim(),
      lineNo: searchLineNo.trim(),
      date: searchDate,
    };
    fetchDataCards(currentPage, recordsPerPage, filtersToApply);
  }, [currentPage, recordsPerPage, searchMoNo, searchPackageNo, searchEmpId, searchLineNo, searchDate]);

  const handleResetFilters = () => {
    setSearchMoNo("");
    setSearchPackageNo("");
    if (user?.emp_id) { // Reset to default logged-in user ID
      setSearchEmpId(user.emp_id);
    } else {
      setSearchEmpId("");
    }
    setSearchLineNo("");
    setSearchDate(getTodayDateString());
    setCurrentPage(1); // Reset page to 1
    // Explicitly call fetchDataCards with reset filters to ensure immediate update
    fetchDataCards(1, recordsPerPage, {
      moNo: "",
      packageNo: "",
      empId: user?.emp_id || "",
      lineNo: "",
      date: getTodayDateString(),
    });
  };

  // Handlers for Emp ID input to show all datalist options on focus
  const handleEmpIdFocus = (event) => {
    // Only clear and store if there's a value, otherwise ensure preFocus is null
    if (event.target.value !== "") {
      setEmpIdPreFocusValue(event.target.value);
      setSearchEmpId(""); // Clear the input to show all datalist options
      justFocusedEmpId.current = true; // Mark that focus handler initiated the clear
    } else {
      setEmpIdPreFocusValue(null); // Ensure no stale preFocusValue if field is already empty
      justFocusedEmpId.current = false; // Not a focus-initiated clear
    }
  };

  const handleEmpIdChange = (e) => {
    justFocusedEmpId.current = false; // User is typing/selecting, overrides focus-initiated clear
    setSearchEmpId(e.target.value);
  };

  const handleEmpIdBlur = () => {
    // If:
    // 1. The input is currently empty.
    // 2. The emptiness was due to the onFocus handler clearing it (justFocusedEmpId.current is true).
    // 3. There was a value before focus (empIdPreFocusValue is not null).
    // Then, restore the pre-focus value.
    if (searchEmpId === "" && justFocusedEmpId.current && empIdPreFocusValue) {
      setSearchEmpId(empIdPreFocusValue);
    }
    justFocusedEmpId.current = false; // Reset flag for next interaction
    setEmpIdPreFocusValue(null);    // Clear stored pre-focus value
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A"; // Check if date is valid
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch (error) {
      return "N/A";
    }
  };

  const parseDateForPicker = (dateString) => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString; // Already a Date object
    // Expect YYYY-MM-DD
    const parts = dateString.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) return new Date(year, month, day);
    }
    return null; // Invalid date string
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    };

  const handleEdit = (cardData) => {
    setSelectedDataForEdit(cardData);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDataForEdit(null);
  };

  const handleSaveEdit = async (updatedData) => {
    if (!selectedDataForEdit) return;
    try {
      setLoading(true);

      const totalDefectCount = updatedData.rejectGarments.reduce(
        (total, garment) =>
          total +
          garment.defects.reduce((sum, defect) => sum + defect.count, 0),
        0
      );
  
      // Build a robust, case-insensitive lookup map for defect codes.
      const defectCodeLookup = new Map();

      // 1. Populate from masterDefects (most authoritative source)
      masterDefects.forEach(d => {
        if (d.name && d.code) { // Use 'name' for lookup key (assuming API returns 'name' for English)
          defectCodeLookup.set(d.name.trim().toLowerCase(), d.code);
        }
      });
  
      // 2. Populate from selectedDataForEdit.defectArray (for any custom or older defects not in master, but present in the original bundle data)
      selectedDataForEdit.defectArray?.forEach(d => {
        if (d.defectName && d.defectCode) {
          const key = d.defectName.trim().toLowerCase();
          if (!defectCodeLookup.has(key)) { // Only add if not already present from master
            defectCodeLookup.set(key, d.defectCode);
          }
        }
      });

      // 3. Populate from selectedDataForEdit.rejectGarments (similar to above, for individual garment defects)
      selectedDataForEdit.rejectGarments?.forEach(g => g.defects.forEach(d => {
        if (d.name && d.code) {
          const key = d.name.trim().toLowerCase();
          if (!defectCodeLookup.has(key)) { // Only add if not already present from master or defectArray
            defectCodeLookup.set(key, d.code);
          }
        }
      }));

      // Patch rejectGarments and build the summary `defectArray` correctly.
      const defectSummary = {};
      let validationError = null;
      updatedData.rejectGarments.forEach((garment) => {
        garment.defects.forEach((defect) => {
          if (validationError || !defect.name) return; // Stop if error found or no defect name
          const trimmedDefectName = defect.name.trim();

          // If code is missing, try to add it from our lookup.
          if (!defect.code) {
            defect.code = defectCodeLookup.get(trimmedDefectName.toLowerCase());
          }

          // If code is still missing, it's a new defect we can't resolve. Stop the process.
          if (!defect.code) {
            validationError = `Cannot save: Defect "${trimmedDefectName}" is missing a required code.`;
            return;
          }

          // Aggregate defects for the summary array, preserving the code.
          if (!defectSummary[trimmedDefectName]) {
            defectSummary[trimmedDefectName] = { totalCount: 0, defectCode: defect.code };
          }
          defectSummary[trimmedDefectName].totalCount += defect.count;
        });
      });

      if (validationError) throw new Error(validationError);
  
      const defectArray = Object.entries(defectSummary).map(
        ([defectName, { totalCount, defectCode }]) => ({ defectName, totalCount, defectCode })
      );

      // Destructure selectedDataForEdit to exclude IDs, as they are used in the URL
      // and should not be sent in the request body for an update.
      const { _id, bundle_id, bundle_random_id, ...restOfSelectedData } = selectedDataForEdit;

      // Start with all original data to ensure all fields are present,
      // then apply updates from the modal, and finally add calculated fields.
      const dataToUpdate = {
        ...restOfSelectedData, // Include all original fields except the IDs
        ...updatedData, // Override with updated fields from the modal
        defectQty: totalDefectCount,
        defectArray,
        totalRejects: updatedData.rejectGarments.length,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${selectedDataForEdit.bundle_random_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToUpdate),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save data");
      }

      
      handleCloseEditModal(); // Close the modal first

      // Re-fetch data with the currently applied filters
      const currentFilters = {
        moNo: searchMoNo.trim(),
        packageNo: searchPackageNo.trim(),
        empId: searchEmpId.trim(),
        lineNo: searchLineNo.trim(),
        date: searchDate,
      };
      fetchDataCards(currentPage, recordsPerPage, currentFilters); // Refresh data for the current view
    } catch (error) {
      console.error("Error saving data:", error);
      alert(error.message || "Failed to save data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordsPerPageChange = (e) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  return (
    <div className="p-6 h-full flex flex-col bg-gray-100">
      <div className={`bg-white rounded-xl shadow-xl p-4 mb-6 ${!showFilters ? "pb-1" : ""}`}>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base md:text-lg font-semibold text-gray-700 flex items-center">
            <FaFilter className="mr-2 text-indigo-600" />
            {t("qc2Data.filtersTitle", "Filters")} 
          </h2>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-xs md:text-sm text-indigo-600 hover:text-indigo-800 font-medium p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
              aria-label={
                showFilters
                  ? t("qc2Data.hideFilters", "Hide Filters")
                  : t("qc2Data.showFilters", "Show Filters")
              }
            >
              {showFilters ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
              <span className="ml-1">
                {showFilters
                  ? t("qc2Data.hideFilters", "Hide Filters")
                  : t("qc2Data.showFilters", "Show Filters")}
              </span>
            </button>
            {showFilters && ( 
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-1.5 text-gray-800  bg-red-100 hover:text-gary-900 brder rounded-md hover:bg-red-400 transition-colors"
                title={t("defectPrint.clearFilters", "Clear Filters")}
              >
                Clear
              </button> 
            )}
          </div>
        </div>

        {showFilters && (
           <form onSubmit={(e) => { e.preventDefault();  }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-1 transition-all duration-300 ease-in-out">
           
            <div className="flex flex-col">
              <label htmlFor="filterDateQC2" className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                <FaCalendarAlt className="mr-1.5 text-gray-400" />
                {t("filters.date", "Date")} 
              </label>
              <DatePicker
                selected={parseDateForPicker(searchDate)} 
                onChange={(date) => {
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth is 0-indexed
                    const day = String(date.getDate()).padStart(2, '0');
                    setSearchDate(`${year}-${month}-${day}`);
                  } else {
                    setSearchDate("");
                  }
                }}
                dateFormat="MM/dd/yyyy"
                className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                id="filterDateQC2"
                placeholderText={t("filters.select_date", "Select date")}
                popperClassName="datepicker-popper-above-header z-50"
              />
            </div>
            
            <div className="flex flex-col">
              <label htmlFor="moNoFilterQC2" className="text-xs font-medium text-gray-600 mb-1">
               {t("bundle.mono")}
              </label>
              <input
                id="moNoFilterQC2"
                type="text"
                value={searchMoNo}
                onChange={(e) => setSearchMoNo(e.target.value)}
                placeholder={t("bundle.search_mono")}
                list="moNoListQC2"
                className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
              <datalist id="moNoListQC2">
                {moNoOptions.map((option) => (
                  <option key={`mo-${option}`} value={option} />
                ))}
              </datalist>
            </div>
           
            <div className="flex flex-col">
              <label htmlFor="packageNoFilterQC2" className="text-xs font-medium text-gray-600 mb-1">
              {t("bundle.package_no")}
              </label>
              <input
                id="packageNoFilterQC2"
                type="text"
                value={searchPackageNo}
                onChange={(e) => setSearchPackageNo(e.target.value)}
                placeholder={t("defectPrint.search_package")}
                list="packageNoListQC2"
                className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
              <datalist id="packageNoListQC2">
                {packageNoOptions.map((option) => (
                  <option key={`pkg-${option}`} value={option} />
                ))}
              </datalist>
            </div>
          
            <div className="flex flex-col">
              <label htmlFor="empIdFilterQC2" className="text-xs font-medium text-gray-600 mb-1">
              {t("bundle.emp_id")}
              </label>
              <input
                id="empIdFilterQC2"
                type="text"
                value={searchEmpId}
                onChange={handleEmpIdChange}
                onFocus={handleEmpIdFocus}
                onBlur={handleEmpIdBlur}
                placeholder={t("set.search_emp_id")}
                list="empIdListQC2"
                className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
              <datalist id="empIdListQC2">
                {empIdOptions.map((option) => (
                  <option key={`emp-${option}`} value={option} />
                ))}
              </datalist>
            </div>
          
            <div className="flex flex-col">
              <label htmlFor="lineNoFilterQC2" className="text-xs font-medium text-gray-600 mb-1">
              {t("bundle.line_no")}
              </label>
              <input
                id="lineNoFilterQC2"
                type="text"
                value={searchLineNo}
                onChange={(e) => setSearchLineNo(e.target.value)}
                placeholder={t("bundle.search_line_no", "Search Line No")}
                list="lineNoListQC2"
                className="w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
              <datalist id="lineNoListQC2">
                {lineNoOptions.map((option) => (
                  <option key={`ln-${option}`} value={option} />
                ))}
              </datalist>
            </div>
          </form>
        )}
      </div>

      <div className="mb-4 text-sm text-gray-700">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <label className="font-semibold">{t("downDa.record_per")}:</label>
            <select
              value={recordsPerPage}
              onChange={handleRecordsPerPageChange}
              className="p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[50, 100, 200, 500].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>{t("downDa.total_record")}: {totalRecords}</div>
        </div>
        <div className="flex justify-between items-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            <select
              value={currentPage}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <option key={page} value={page}>
                    Page {page}
                  </option>
                )
              )}
            </select>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(
                  Math.max(0, currentPage - 3),
                  Math.min(totalPages, currentPage + 2)
                )
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md transition duration-200 ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                ))}
            </div>
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {t("userL.next")}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : dataCards.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
         {t("previewMode.no_data_card")}
        </div>
      ) : (
        <div className="flex-grow overflow-auto bg-white rounded-lg shadow-md">
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead className="bg-gray-200 sticky top-0 z-10">
                <tr>
                   <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                    {t("userL.action")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.mono")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.customer_style")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.color")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.size")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.package_no")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                    {t("qc2In.taskNo", "Task No")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.line_no")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("bundle.emp_id")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("previewMode.emp_name")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("previewMode.inspection_time")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("previewMode.inspection_date")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("ana.checked_qty")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("dash.total_pass")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("dash.total_rejects")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("dash.defects_qty")}
                  </th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-sm text-gray-700">
                  {t("preview.defect_details")}
                  </th>
                </tr>
              </thead>
              <tbody className="overflow-y-auto">
                {dataCards.map((card) => (
                  <tr key={card.bundle_id || card._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      <button
                        onClick={() => handleEdit(card)}
                        className="px-2 py-1.5 text-xs font-medium text-gray-700 border border-blue-800 bg-blue-200 rounded-md hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      >
                        {t("bundle.edit")}
                      </button>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.moNo}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.custStyle}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.color}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.size}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.package_no}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.taskNo || "N/A"}
                    </td>
                     <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.lineNo}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.emp_id_inspection}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.eng_name_inspection}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.inspection_time}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {formatDateForDisplay(card.inspection_date)}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.checkedQty}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.totalPass}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.totalRejects}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.defectQty}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      {card.defectArray.map((defect) => (
                        <div
                          key={defect.defectName}
                          className="flex justify-between text-sm"
                        >
                          <span>{defect.defectName}:</span>
                          <span>{defect.totalCount}</span>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {isEditModalOpen && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          data={selectedDataForEdit}
          masterDefects={masterDefects}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default QC2Data;
