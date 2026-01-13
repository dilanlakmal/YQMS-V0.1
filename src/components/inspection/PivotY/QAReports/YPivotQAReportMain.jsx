import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FileText,
  Filter,
  Search,
  Download,
  Calendar,
  Hash,
  Box,
  Layers,
  User,
  Shield,
  Loader2,
  RefreshCw,
  Building2,
  Globe,
  Briefcase,
  Clock,
  X,
  MoreVertical,
  Eye,
  Trash2,
  Factory,
  EyeOff,
  Info
} from "lucide-react";
import { createPortal } from "react-dom";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import YPivotQAInspectionQRCode from "../QADataCollection/YPivotQAInspectionQRCode";

// =============================================================================
// Helper: Filter Input Wrapper
// =============================================================================
const FilterWrapper = ({ label, icon: Icon, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wide">
      <Icon className="w-3.5 h-3.5 text-indigo-500" />
      {label}
    </label>
    {children}
  </div>
);

// =============================================================================
// Helper: Status Badge
// =============================================================================
const StatusBadge = ({ status }) => {
  const styles = {
    completed: "bg-green-100 text-green-700 border-green-200",
    draft: "bg-amber-100 text-amber-700 border-amber-200",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-red-100 text-red-700 border-red-200"
  };

  const label = status ? status.replace("_", " ") : "Unknown";

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {label}
    </span>
  );
};

// =============================================================================
// Helper: Product Image Modal
// =============================================================================
const ProductImageModal = ({ src, alt, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div className="relative max-w-lg w-full bg-white rounded-xl overflow-hidden shadow-2xl p-2">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-contain rounded-lg"
        />
        <div className="p-3 text-center">
          <p className="font-bold text-gray-800">{alt}</p>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Sub-Component: Async Inspector Search (ID & Name)
// =============================================================================
const InspectorSearchFilter = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync internal input if parent clears filter
  useEffect(() => {
    if (!value) setSearchTerm("");
  }, [value]);

  // Debounced Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Only search if typing and not just the exact ID we already selected
      if (searchTerm && searchTerm !== value && searchTerm.length >= 1) {
        setLoading(true);
        try {
          // Uses existing User Search API
          const res = await axios.get(
            `${API_BASE_URL}/api/users/search?term=${searchTerm}`
          );
          setResults(res.data || []);
          setShowDropdown(true);
        } catch (error) {
          console.error("User search error", error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else if (!searchTerm) {
        setResults([]);
        setShowDropdown(false);
        // If cleared, notify parent
        if (value) onChange("");
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelect = (user) => {
    setSearchTerm(user.emp_id); // Show ID in box
    onChange(user.emp_id); // Update Parent Filter
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    onChange("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Type ID or Name..."
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay to allow click
        />
        {/* Right Icon: Loader or Clear */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          ) : searchTerm ? (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map((u) => (
            <button
              key={u.emp_id}
              onClick={() => handleSelect(u)}
              className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-3 transition-colors group"
            >
              {/* Avatar / Icon */}
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-500 overflow-hidden">
                {u.face_photo ? (
                  <img
                    src={u.face_photo}
                    alt="user"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                )}
              </div>

              {/* Text Info */}
              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  {u.emp_id}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {u.eng_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Helper: Inspector Detail Modal (Auto-Close)
// =============================================================================
const InspectorAutoCloseModal = ({ data, onClose }) => {
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Fetch User Details to get Photo
    const fetchPhoto = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/user-details?empId=${data.empId}`
        );
        if (isMounted && res.data && res.data.face_photo) {
          // Resolve URL logic
          let url = res.data.face_photo;
          if (!url.startsWith("http") && !url.startsWith("data:")) {
            // Handle relative paths
            const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
              ? PUBLIC_ASSET_URL
              : `${PUBLIC_ASSET_URL}/`;
            const cleanPath = url.startsWith("/") ? url.substring(1) : url;
            url = `${baseUrl}${cleanPath}`;
          }
          setPhotoUrl(url);
        }
      } catch (err) {
        // Silent fail - will show icon
      }
    };

    if (data && data.empId) {
      fetchPhoto();
    }

    // 2. Auto Close Timer (3 Seconds)
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [data, onClose]);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px] animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 min-w-[200px] max-w-[280px] transform scale-100 transition-all relative">
        {/* QA ID */}
        <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tighter">
          {data.empId}
        </h3>

        {/* Photo or Fallback */}
        <div className="w-24 h-24 rounded-full border-4 border-gray-100 dark:border-gray-700 overflow-hidden shadow-inner bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Inspector"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-gray-400" />
          )}
        </div>

        {/* Name */}
        <div className="text-center">
          <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
            {data.empName || "Unknown Name"}
          </p>
          <p className="text-[10px] text-gray-500 uppercase mt-1">Inspector</p>
        </div>

        {/* Progress Bar for Timer Visual (Optional but nice) */}
        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 animate-[width_3s_linear_forwards] w-full rounded-b-2xl opacity-50"></div>
      </div>
    </div>
  );
};

// =============================================================================
// Helper: Report QR Code Modal (Manual Close)
// =============================================================================
const ReportQRModal = ({ report, onClose }) => {
  if (!report) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full p-2 border border-gray-200 dark:border-gray-700 transform scale-100 transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 p-2 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:text-red-500 rounded-full shadow-lg border border-gray-100 dark:border-gray-600 transition-colors z-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Reuse the existing QR Component */}
        <div className="overflow-hidden rounded-2xl">
          <YPivotQAInspectionQRCode
            reportId={report.reportId}
            inspectionDate={report.inspectionDate}
            orderNos={report.orderNos}
            reportType={report.reportType}
            inspectionType={report.inspectionType}
            empId={report.empId}
          />
        </div>

        <p className="text-center text-xs text-gray-400 py-2">
          Scan this code to load report details instantly.
        </p>
      </div>
    </div>,
    document.body
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const YPivotQAReportMain = () => {
  // --- State ---
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  // State for Report ID Visibility
  const [canViewReportId, setCanViewReportId] = useState(false);
  const [reports, setReports] = useState([]);
  // State to track which report's QR is being viewed
  const [viewingReportQR, setViewingReportQR] = useState(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [viewingInspector, setViewingInspector] = useState(null);

  // Filter State
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reportId: "",
    reportType: "All",
    orderType: "All",
    orderNo: "",
    productType: "All",
    empId: "",
    subConFactory: "All",
    custStyle: "",
    buyer: "All",
    supplier: "All"
  });

  // Dynamic Options (for Dropdowns)
  const [options, setOptions] = useState({
    reportTypes: [],
    productTypes: [],
    subConFactories: [],
    buyers: [],
    suppliers: []
  });

  // Product Image Modal State
  const [previewImage, setPreviewImage] = useState(null);

  // --- MENU STATE ---
  const [openMenuId, setOpenMenuId] = useState(null);

  // --- Fetch Data ---
  const fetchReports = async () => {
    setLoading(true);
    try {
      // Clean filters (remove empty strings)
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "All") params.append(key, value);
      });

      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-reports/list?${params}`
      );

      if (res.data.success) {
        setReports(res.data.data);
        extractOptions(res.data.data); // Extract unique values for dropdowns
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique options from data for dropdowns
  const extractOptions = (data) => {
    const rTypes = new Set();
    const pTypes = new Set();
    const factories = new Set();
    const buyers = new Set();
    const suppliers = new Set();

    data.forEach((item) => {
      if (item.reportType) rTypes.add(item.reportType);
      if (item.productType) pTypes.add(item.productType);
      if (item.buyer) buyers.add(item.buyer);

      if (item.inspectionDetails) {
        // Only add factory if it exists and is not empty
        if (item.inspectionDetails.subConFactory) {
          factories.add(item.inspectionDetails.subConFactory);
        }
        if (item.inspectionDetails.supplier) {
          suppliers.add(item.inspectionDetails.supplier);
        }
      }
    });

    setOptions({
      reportTypes: Array.from(rTypes).sort(),
      productTypes: Array.from(pTypes).sort(),
      subConFactories: Array.from(factories).sort(),
      buyers: Array.from(buyers).sort(),
      suppliers: Array.from(suppliers).sort()
    });
  };

  // Check Permission on Mount
  useEffect(() => {
    const checkPermission = async () => {
      if (user?.emp_id) {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/fincheck-reports/check-permission?empId=${user.emp_id}`
          );
          if (res.data && res.data.isAdmin) {
            setCanViewReportId(true);
          } else {
            setCanViewReportId(false);
          }
        } catch (error) {
          console.error("Failed to check permission", error);
          setCanViewReportId(false);
        }
      }
    };
    checkPermission();
  }, [user]);

  // Initial Load & Debounced Fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 500); // 500ms delay for typing
    return () => clearTimeout(timer);
  }, [filters]);

  // Close menu when clicking anywhere else
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Handle Input Change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Reset Filters
  const handleReset = () => {
    setFilters({
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      reportId: "",
      reportType: "All",
      orderType: "All",
      orderNo: "",
      productType: "All",
      empId: "",
      subConFactory: "All",
      custStyle: "",
      buyer: "All",
      supplier: "All"
    });
  };

  const handleMenuToggle = (e, id) => {
    e.stopPropagation(); // Prevent window click from firing immediately
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleViewReport = (report) => {
    // Open in new tab
    const url = `/fincheck-reports/view/${report.reportId}`;
    window.open(url, "_blank");
  };

  const handleDeleteReport = (report) => {
    if (
      window.confirm(
        `Are you sure you want to delete Report #${report.reportId}?`
      )
    ) {
      console.log("Delete Report:", report.reportId);
      // Add your delete API call logic here
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* --- 1. FILTER PANE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Filter className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white">
              Report Filters
            </h2>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-x-4 gap-y-4">
          {/* Date Range */}
          <FilterWrapper label="Start Date" icon={Calendar}>
            <input
              type="date"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </FilterWrapper>

          <FilterWrapper label="End Date" icon={Calendar}>
            <input
              type="date"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </FilterWrapper>

          {/* IDs */}
          <FilterWrapper label="Report ID" icon={Hash}>
            <input
              type="number"
              placeholder="10-digit ID..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.reportId}
              onChange={(e) => handleFilterChange("reportId", e.target.value)}
            />
          </FilterWrapper>

          <FilterWrapper label="QA ID" icon={User}>
            <InspectorSearchFilter
              value={filters.empId}
              onChange={(val) => handleFilterChange("empId", val)}
            />
          </FilterWrapper>

          {/* Types & Orders */}
          <FilterWrapper label="Order No" icon={Search}>
            <input
              type="text"
              placeholder="Search Order..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.orderNo}
              onChange={(e) => handleFilterChange("orderNo", e.target.value)}
            />
          </FilterWrapper>

          <FilterWrapper label="Report Name" icon={FileText}>
            <select
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.reportType}
              onChange={(e) => handleFilterChange("reportType", e.target.value)}
            >
              <option value="All">All Reports</option>
              {options.reportTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FilterWrapper>

          <FilterWrapper label="Order Type" icon={Layers}>
            <select
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.orderType}
              onChange={(e) => handleFilterChange("orderType", e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Single">Single</option>
              <option value="Multi">Multi</option>
              <option value="Batch">Batch</option>
            </select>
          </FilterWrapper>

          <FilterWrapper label="Product Type" icon={Box}>
            <select
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.productType}
              onChange={(e) =>
                handleFilterChange("productType", e.target.value)
              }
            >
              <option value="All">All Products</option>
              {options.productTypes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FilterWrapper>

          <FilterWrapper label="Cust. Style" icon={Search}>
            <input
              type="text"
              placeholder="Search Style..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.custStyle}
              onChange={(e) => handleFilterChange("custStyle", e.target.value)}
            />
          </FilterWrapper>

          <FilterWrapper label="Buyer" icon={User}>
            <select
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.buyer}
              onChange={(e) => handleFilterChange("buyer", e.target.value)}
            >
              <option value="All">All Buyers</option>
              {options.buyers.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </FilterWrapper>

          <FilterWrapper label="Supplier" icon={Building2}>
            <select
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.supplier}
              onChange={(e) => handleFilterChange("supplier", e.target.value)}
            >
              <option value="All">All Suppliers</option>
              {options.suppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FilterWrapper>

          <FilterWrapper label="Ext. Factory" icon={Factory}>
            {" "}
            {/* Import Factory icon */}
            <select
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.subConFactory}
              onChange={(e) =>
                handleFilterChange("subConFactory", e.target.value)
              }
            >
              <option value="All">All Factories</option>
              {options.subConFactories.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </FilterWrapper>
        </div>
      </div>

      {/* --- 2. DATA TABLE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header / Toolbar */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shadow-md">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-gray-800 dark:text-white text-lg">
              Inspection Results
            </h3>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300">
              {reports.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* NEW: View Details Toggle Button */}
            <button
              onClick={() => setShowDetailedView(!showDetailedView)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95 border ${
                showDetailedView
                  ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
              }`}
            >
              {showDetailedView ? (
                <>
                  <EyeOff className="w-4 h-4" /> Hide Details
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" /> View Details
                </>
              )}
            </button>

            {/*Export Button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg transition-transform active:scale-95">
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase font-bold text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Date</th>
                {/* CONDITIONAL HEADER */}
                {canViewReportId && <th className="px-6 py-4">Report ID</th>}

                <th className="px-6 py-4">Order No</th>
                <th className="px-6 py-4">Cust. Style</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Report Name</th>
                <th className="px-6 py-4">Product</th>
                {showDetailedView && (
                  <>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Wash</th>
                  </>
                )}
                <th className="px-6 py-4">QA ID</th>
                {showDetailedView && (
                  <>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">External</th>
                  </>
                )}
                <th className="px-6 py-4 rounded-tr-lg">Factory</th>
                <th className="px-6 py-4 text-right">Finished #</th>
                <th className="px-6 py-4 text-right">Sample Size</th>
                <th className="px-6 py-4 rounded-tr-lg">Created Date</th>
                <th className="px-6 py-4 rounded-tr-lg">Updated Date</th>
                <th className="px-6 py-4 text-center rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-20 text-center">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      Loading reports...
                    </p>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-800 dark:text-white font-bold text-lg">
                      No Reports Found
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Try adjusting your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const details = report.inspectionDetails || {};
                  const config = report.inspectionConfig || {};
                  const isSubCon = details.isSubCon;
                  const isAQL = report.inspectionMethod === "AQL";

                  // --- Helper for Date/Time Formatting ---
                  const formatDateTime = (isoString) => {
                    if (!isoString) return { date: "-", time: "-" };
                    const dateObj = new Date(isoString);
                    // Add 7 hours
                    dateObj.setHours(dateObj.getHours() + 0);

                    const date = dateObj.toLocaleDateString();
                    const time = dateObj.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    });
                    return { date, time };
                  };

                  const created = formatDateTime(report.createdAt);
                  const updated = formatDateTime(report.updatedAt);

                  // Logic for Finished Qty (Only show if AQL and > 0)
                  const finishedQtyDisplay =
                    isAQL && details.inspectedQty > 0
                      ? details.inspectedQty.toLocaleString()
                      : "";

                  // Logic for Sample Size
                  let sampleSizeDisplay = 0;
                  if (isAQL) {
                    sampleSizeDisplay = details.aqlSampleSize || 0;
                  } else {
                    // If Fixed, get from config.sampleSize (which sums up fixed groups)
                    sampleSizeDisplay = config.sampleSize || 0;
                  }

                  // Helper to construct full image URL
                  const getProductImageUrl = (url) => {
                    if (!url) return null;
                    if (url.startsWith("http")) return url;
                    // Ensure PUBLIC_ASSET_URL ends with / if url doesn't start with /
                    const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
                      ? PUBLIC_ASSET_URL.slice(0, -1)
                      : PUBLIC_ASSET_URL;
                    const path = url.startsWith("/") ? url : `/${url}`;
                    return `${baseUrl}${path}`;
                  };

                  // If populate failed/null: report.productTypeId might be null or just an ID
                  const productImage = report.productTypeId?.imageURL;

                  return (
                    <tr
                      key={report.reportId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                    >
                      {/* Date */}
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(report.inspectionDate).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Report ID */}
                      {canViewReportId && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                              {report.reportId}
                            </span>

                            {/* NEW: Info Icon Trigger */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingReportQR(report);
                              }}
                              className="p-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="View Report QR"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Order No */}
                      <td className="px-6 py-4 max-w-[200px]">
                        <p
                          className="truncate font-medium text-gray-800 dark:text-gray-200"
                          title={report.orderNosString}
                        >
                          {report.orderNosString}
                        </p>
                      </td>

                      {/* --- CUST. STYLE --- */}
                      <td className="px-6 py-4 max-w-[120px]">
                        <p className="text-[12px] leading-tight text-gray-600 dark:text-gray-400 break-words font-medium">
                          {details.custStyle || "-"}
                        </p>
                      </td>

                      {/* --- CUSTOMER (Buyer) --- */}
                      <td className="px-6 py-4 text-xs font-bold text-gray-700 dark:text-gray-300 capitalize">
                        {report.buyer ? report.buyer.toLowerCase() : "-"}
                      </td>

                      {/* Report Name */}
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-[12px] break-words">
                        {report.reportType}
                      </td>

                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {productImage ? (
                            <div
                              className="w-8 h-8 rounded border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 bg-white cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                              onClick={() =>
                                setPreviewImage({
                                  src: getProductImageUrl(productImage),
                                  alt: report.productType
                                })
                              }
                            >
                              <img
                                src={getProductImageUrl(productImage)}
                                alt={report.productType}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-400 text-[8px] font-bold">
                              NO IMG
                            </div>
                          )}

                          <span className="text-gray-600 dark:text-gray-300 font-medium">
                            {report.productType}
                          </span>
                        </div>
                      </td>

                      {/* CONDITIONAL CELLS: Type, Method, Wash */}
                      {showDetailedView && (
                        <>
                          {/* Order Type */}
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                                report.orderType === "single"
                                  ? "bg-blue-50 text-blue-600 border-blue-100"
                                  : report.orderType === "multi"
                                  ? "bg-purple-50 text-purple-600 border-purple-100"
                                  : "bg-orange-50 text-orange-600 border-orange-100"
                              }`}
                            >
                              {report.orderType}
                            </span>
                          </td>

                          {/* Method */}
                          <td className="px-6 py-4">
                            {report.inspectionMethod === "AQL" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                AQL
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                {report.inspectionMethod || "Fixed"}
                              </span>
                            )}
                          </td>

                          {/* Wash */}
                          <td className="px-6 py-4">
                            {report.measurementMethod === "Before" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                Before
                              </span>
                            ) : report.measurementMethod === "After" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                After
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs font-medium">
                                N/A
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {/* QA ID */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col">
                            {/* Line 1: ID */}
                            <span className="font-mono font-bold text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                              {report.empId}
                            </span>

                            {/* Subsequent Lines: Name split by space */}
                            {(report.empName || "-")
                              .split(" ")
                              .map((namePart, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-bold text-gray-400 dark:text-gray-500 leading-3"
                                >
                                  {namePart}
                                </span>
                              ))}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingInspector({
                                empId: report.empId,
                                empName: report.empName
                              });
                            }}
                            className="p-1.5 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 dark:bg-gray-800 dark:hover:bg-indigo-900/50 transition-colors mt-1"
                            title="View Inspector Info"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* CONDITIONAL CELLS: Supplier, External, Factory */}
                      {showDetailedView && (
                        <>
                          {/* Supplier */}
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                            {details.supplier || "YM"}
                          </td>

                          {/* External */}
                          <td className="px-6 py-4">
                            {isSubCon ? (
                              <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs">
                                <Globe className="w-3.5 h-3.5" /> Yes
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                <Building2 className="w-3.5 h-3.5" /> No
                              </div>
                            )}
                          </td>
                        </>
                      )}

                      {/* Factory */}
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">
                        {isSubCon
                          ? details.subConFactory || "Unknown"
                          : details.factory || "N/A"}
                      </td>

                      {/* --- FINISHED QTY --- */}
                      <td className="px-6 py-4 text-right font-mono text-xs text-gray-800 dark:text-gray-200">
                        {finishedQtyDisplay}
                      </td>

                      {/* --- SAMPLE SIZE --- */}
                      <td className="px-6 py-4 text-right">
                        {sampleSizeDisplay > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded">
                            {sampleSizeDisplay}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>

                      {/* --- CREATED AT COLUMN --- */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {created.date}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded w-fit">
                            <Clock className="w-3 h-3" />{" "}
                            {/* Ensure Clock is imported from lucide-react */}
                            {created.time}
                          </div>
                        </div>
                      </td>

                      {/* --- UPDATED AT COLUMN --- */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {updated.date}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded w-fit">
                            <Clock className="w-3 h-3" /> {updated.time}
                          </div>
                        </div>
                      </td>

                      {/* --- ACTION COLUMN --- */}
                      <td className="px-6 py-4 text-center relative">
                        <button
                          onClick={(e) => handleMenuToggle(e, report.reportId)}
                          className={`p-2 rounded-full transition-colors ${
                            openMenuId === report.reportId
                              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
                              : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600"
                          }`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* DROPDOWN MENU */}
                        {openMenuId === report.reportId && (
                          <div className="absolute right-8 top-8 z-50 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fadeIn origin-top-right">
                            <div className="flex flex-col">
                              <button
                                onClick={() => handleViewReport(report)}
                                className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                View Report
                              </button>
                              <div className="h-px bg-gray-100 dark:bg-gray-700"></div>
                              <button
                                onClick={() => handleDeleteReport(report)}
                                className="px-4 py-3 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewImage && (
        <ProductImageModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Inspector Auto-Close Modal */}
      {viewingInspector && (
        <InspectorAutoCloseModal
          data={viewingInspector}
          onClose={() => setViewingInspector(null)}
        />
      )}

      {/* Report QR Code Modal */}
      {viewingReportQR && (
        <ReportQRModal
          report={viewingReportQR}
          onClose={() => setViewingReportQR(null)}
        />
      )}

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes width {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default YPivotQAReportMain;
