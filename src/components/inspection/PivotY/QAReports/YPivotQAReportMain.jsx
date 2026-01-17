import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "react";
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
  Loader2,
  RefreshCw,
  Building2,
  Globe,
  Clock,
  X,
  MoreVertical,
  Eye,
  Trash2,
  Factory,
  EyeOff,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Check,
  GripVertical,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle
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
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
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
    </div>,
    document.body
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

  useEffect(() => {
    if (!value) setSearchTerm("");
  }, [value]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm && searchTerm !== value && searchTerm.length >= 1) {
        setLoading(true);
        try {
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
        if (value) onChange("");
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelect = (user) => {
    setSearchTerm(user.emp_id);
    onChange(user.emp_id);
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
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
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

      {showDropdown && results.length > 0 && (
        <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map((u) => (
            <button
              key={u.emp_id}
              onClick={() => handleSelect(u)}
              className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-3 transition-colors group"
            >
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
// Sub-Component: Autocomplete Input (For Order No & Cust Style)
// =============================================================================
const AutocompleteInput = ({ value, onChange, placeholder, apiEndpoint }) => {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!value) setSearchTerm("");
  }, [value]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm && searchTerm.length >= 2) {
        setLoading(true);
        try {
          const res = await axios.get(
            `${API_BASE_URL}${apiEndpoint}?term=${searchTerm}`
          );
          if (res.data.success) {
            setResults(res.data.data || []);
            setShowDropdown(true);
          }
        } catch (error) {
          console.error("Autocomplete error", error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, apiEndpoint]);

  const handleSelect = (item) => {
    setSearchTerm(item);
    onChange(item);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
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
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-8"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          ) : searchTerm ? (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {results.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
            >
              {item}
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

    const fetchPhoto = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/user-details?empId=${data.empId}`
        );
        if (isMounted && res.data && res.data.face_photo) {
          let url = res.data.face_photo;
          if (!url.startsWith("http") && !url.startsWith("data:")) {
            const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
              ? PUBLIC_ASSET_URL
              : `${PUBLIC_ASSET_URL}/`;
            const cleanPath = url.startsWith("/") ? url.substring(1) : url;
            url = `${baseUrl}${cleanPath}`;
          }
          setPhotoUrl(url);
        }
      } catch (err) {
        // Silent fail
      }
    };

    if (data && data.empId) {
      fetchPhoto();
    }

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [data, onClose]);

  if (!data) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px] animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 min-w-[200px] max-w-[280px] transform scale-100 transition-all relative">
        <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tighter">
          {data.empId}
        </h3>

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

        <div className="text-center">
          <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
            {data.empName || "Unknown Name"}
          </p>
          <p className="text-[10px] text-gray-500 uppercase mt-1">Inspector</p>
        </div>

        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 animate-shrinkWidth w-full rounded-b-2xl opacity-50"></div>
      </div>
    </div>,
    document.body
  );
};

// =============================================================================
// Helper: Report QR Code Modal (Manual Close)
// =============================================================================
const ReportQRModal = ({ report, onClose }) => {
  if (!report) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full p-2 border border-gray-200 dark:border-gray-700 transform scale-100 transition-all">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 p-2 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:text-red-500 rounded-full shadow-lg border border-gray-100 dark:border-gray-600 transition-colors z-50"
        >
          <X className="w-5 h-5" />
        </button>

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
// Column Customize Modal
// =============================================================================

const ColumnCustomizeModal = ({
  columns,
  visibleColumns,
  savedFilters, // <--- Received from parent
  onApplyColumns,
  onApplyFilter, // <--- Function to apply a filter
  onDeleteFilter, // <--- Function to delete
  onClose
}) => {
  const [selected, setSelected] = useState([...visibleColumns]);
  const [activeTab, setActiveTab] = useState("columns"); // 'columns' or 'filters'

  const toggleColumn = (colId) => {
    setSelected((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
    );
  };

  const handleApply = () => {
    onApplyColumns(selected);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header with Tabs */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-500" /> Settings
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-xl">
            <button
              onClick={() => setActiveTab("columns")}
              className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                activeTab === "columns"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Columns
            </button>
            <button
              onClick={() => setActiveTab("filters")}
              className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                activeTab === "filters"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Favorite Filters
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "columns" ? (
            <div className="grid grid-cols-2 gap-2">
              {/* ... (Existing Column list logic here) ... */}
              {columns.map((col) => {
                const isSelected = selected.includes(col.id);
                return (
                  <button
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {col.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {savedFilters.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Filter className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No saved filters found.</p>
                  <p className="text-xs mt-1">
                    Save filters from the main screen.
                  </p>
                </div>
              ) : (
                savedFilters.map((sf) => (
                  <div
                    key={sf._id}
                    className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all"
                  >
                    <button
                      onClick={() => {
                        onApplyFilter(sf);
                        onClose();
                      }}
                      className="flex-1 text-left"
                    >
                      <p className="font-bold text-gray-800 dark:text-gray-200">
                        {sf.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(sf.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      onClick={() => onDeleteFilter(sf._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer (Only show Apply for columns) */}
        {activeTab === "columns" && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-lg"
            >
              Apply Columns
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// =============================================================================
// Helper: Auto Dismiss Modal (Success/Error)
// =============================================================================
const AutoDismissModal = ({ isOpen, onClose, type, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => onClose(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const isSuccess = type === "success";

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 min-w-[250px] transform scale-100 transition-all">
        <div
          className={`p-3 rounded-full ${
            isSuccess
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">
          {isSuccess ? "Success" : "Error"}
        </h3>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
          {message}
        </p>
      </div>
    </div>,
    document.body
  );
};

// =============================================================================
// Pagination Component
// =============================================================================
const PaginationControls = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  loading
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Record Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing{" "}
        <span className="font-bold text-gray-800 dark:text-white">
          {startRecord}
        </span>{" "}
        to{" "}
        <span className="font-bold text-gray-800 dark:text-white">
          {endRecord}
        </span>{" "}
        of{" "}
        <span className="font-bold text-indigo-600 dark:text-indigo-400">
          {totalCount.toLocaleString()}
        </span>{" "}
        records
      </div>

      {/* Page Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || loading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-gray-400 font-medium"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={loading}
                className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-bold transition-all ${
                  currentPage === page
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// COLUMN DEFINITIONS
// =============================================================================
const ALL_COLUMNS = [
  { id: "date", label: "Date", required: true },
  { id: "reportId", label: "Report ID", requiresPermission: true },
  { id: "orderNo", label: "Order No", required: true },
  { id: "custStyle", label: "Cust. Style" },
  { id: "customer", label: "Customer" },
  { id: "reportType", label: "Report Name", required: true },
  { id: "product", label: "Product" },
  { id: "orderType", label: "Type" },
  { id: "method", label: "Method" },
  { id: "wash", label: "Wash" },
  { id: "qaId", label: "QA ID" },
  { id: "supplier", label: "Supplier" },
  { id: "external", label: "External" },
  { id: "factory", label: "Factory" },
  { id: "finishedQty", label: "Finished #" },
  { id: "sampleSize", label: "Sample Size" },
  { id: "createdDate", label: "Created Date" },
  { id: "updatedDate", label: "Updated Date" },
  { id: "action", label: "Action", required: true }
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const YPivotQAReportMain = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [canViewReportId, setCanViewReportId] = useState(false);
  const [reports, setReports] = useState([]);
  const [viewingReportQR, setViewingReportQR] = useState(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [viewingInspector, setViewingInspector] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);

  // --- State for Preferences ---
  const [savedFiltersList, setSavedFiltersList] = useState([]);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Visible Columns State
  const [visibleColumns, setVisibleColumns] = useState([
    "date",
    "reportId",
    "orderNo",
    "custStyle",
    "customer",
    "reportType",
    "product",
    "qaId",
    "factory",
    "finishedQty",
    "sampleSize",
    "createdDate",
    "updatedDate",
    "action"
  ]);

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

  // Menu State
  const [openMenuId, setOpenMenuId] = useState(null);

  // Action column dropdown handller
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  // --- SWAL FIRE STATE ---
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    message: ""
  });

  // --- 1. Fetch Preferences on Load ---
  useEffect(() => {
    if (user?.emp_id) {
      fetchUserPreferences();
    }
  }, [user?.emp_id]);

  const fetchUserPreferences = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-reports/preferences/get?empId=${user.emp_id}`
      );
      if (res.data.success) {
        setSavedFiltersList(res.data.data.savedFilters || []);
        if (
          res.data.data.favoriteColumns &&
          res.data.data.favoriteColumns.length > 0
        ) {
          setVisibleColumns(res.data.data.favoriteColumns);
        }
      }
    } catch (error) {
      console.error("Error fetching preferences", error);
    }
  };

  // --- 2. Handle Save Filter ---
  const handleSaveFilterClick = () => {
    setNewFilterName("");
    setShowSaveFilterModal(true);
  };

  const confirmSaveFilter = async () => {
    if (!newFilterName.trim()) {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Please enter a name"
      });
      return;
    }
    if (newFilterName.length > 25) {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Name too long (max 25 chars)"
      });
      return;
    }

    try {
      // Logic for Dynamic Date
      const filtersToSave = { ...filters };
      const today = new Date().toISOString().split("T")[0];

      // If End Date is selected and equals Today, save as dynamic tag
      if (filtersToSave.endDate === today) {
        filtersToSave.endDate = "DYNAMIC_TODAY";
      }

      // If Start Date is NOT selected or empty, ensure it's not saved as a specific date if you want logic there too
      // But prompt specifically mentioned End Date logic.
      // Note: If no dates selected, the state holds Today's date by default in your code.
      // We only save DYNAMIC_TODAY if it matches today.

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-reports/preferences/save`,
        {
          empId: user.emp_id,
          type: "filter",
          data: {
            name: newFilterName,
            filters: filtersToSave
          }
        }
      );

      if (res.data.success) {
        setSavedFiltersList(res.data.data.savedFilters);
        setShowSaveFilterModal(false);
        setStatusModal({
          isOpen: true,
          type: "success",
          message: "Filter saved successfully!"
        });
      }
    } catch (error) {
      // 3. Error Modal
      setStatusModal({
        isOpen: true,
        type: "error",
        message: error.response?.data?.message || "Failed to save filter"
      });
    }
  };

  // --- 3. Apply Favorite Filter ---
  const applySavedFilter = (savedItem) => {
    const loadedFilters = { ...savedItem.filters };

    // Logic to restore Dynamic Date
    if (loadedFilters.endDate === "DYNAMIC_TODAY") {
      loadedFilters.endDate = new Date().toISOString().split("T")[0];
    }

    // If Start Date was saved as a specific date, it applies as is.
    // If you want Start Date to also be dynamic if it was today, you would need similar logic above.

    setFilters(loadedFilters);
  };

  // --- 4. Delete Filter ---
  const handleDeleteFilter = async (filterId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-reports/preferences/delete-filter`,
        {
          empId: user.emp_id,
          filterId
        }
      );
      if (res.data.success) {
        setSavedFiltersList(res.data.data.savedFilters);
        setStatusModal({
          isOpen: true,
          type: "success",
          message: "Filter deleted successfully"
        });
      }
    } catch (error) {
      console.error("Delete failed", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Failed to delete filter"
      });
    }
  };

  // --- 5. Save Column Preferences ---
  const handleColumnChangeAndSave = async (newColumns) => {
    setVisibleColumns(newColumns);
    // Save to DB
    try {
      await axios.post(
        `${API_BASE_URL}/api/fincheck-reports/preferences/save`,
        {
          empId: user.emp_id,
          type: "columns",
          data: newColumns
        }
      );
    } catch (error) {
      console.error("Failed to save column preference", error);
    }
  };

  // --- Helper: Get Local Today String (YYYY-MM-DD) ---
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // --- Fetch Filter Options ---
  const fetchFilterOptions = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-reports/filter-options`,
        {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate
          }
        }
      );
      if (res.data.success) {
        setOptions(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // --- Fetch Data ---
  const fetchReports = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "All") params.append(key, value);
      });
      params.append("page", page);
      params.append("limit", pageSize);

      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-reports/list?${params}`
      );

      if (res.data.success) {
        setReports(res.data.data);
        setTotalCount(res.data.totalCount || 0);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || 1);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
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

  // Fetch options when date range changes
  useEffect(() => {
    fetchFilterOptions();
  }, [filters.startDate, filters.endDate]);

  // Initial Load & Debounced Fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports(1);
      setCurrentPage(1);
    }, 500);
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

  // Hard Reset (New): Resets EVERYTHING to default
  const handleResetAll = () => {
    setFilters({
      startDate: "", // ← Change from getTodayString() to empty string
      endDate: "", // ← Change from getTodayString() to empty string
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

  const handleMenuToggle = (e, id, index) => {
    e.stopPropagation();

    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const totalRows = reports.length;

      // Logic: If table > 6 rows AND this is one of the last 3 rows
      const shouldOpenUpwards = totalRows > 6 && index >= totalRows - 3;

      // Approximate menu height is ~130px (3 items * ~40px + dividers)
      const menuHeight = 135;

      setMenuPos({
        // If upwards: Top of button - menu height - spacing
        // If downwards: Bottom of button + spacing
        top: shouldOpenUpwards ? rect.top - menuHeight - 5 : rect.bottom + 5,
        left: rect.right - 160
      });
      setOpenMenuId(id);
    }
  };

  const handleViewReport = (report) => {
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
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      fetchReports(page);
    }
  };

  // Available columns for modal (excluding permission-required if no permission)
  const availableColumnsForModal = useMemo(() => {
    return ALL_COLUMNS.filter((col) => {
      if (col.id === "reportId" && !canViewReportId) return false;
      return true;
    });
  }, [canViewReportId]);

  // Helper for column visibility check (for detailed view columns)
  const isColumnVisible = (colId) => {
    if (
      ["orderType", "method", "wash", "supplier", "external"].includes(colId)
    ) {
      return showDetailedView && visibleColumns.includes(colId);
    }
    return visibleColumns.includes(colId);
  };

  // Helper to construct full image URL
  const getProductImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
      ? PUBLIC_ASSET_URL.slice(0, -1)
      : PUBLIC_ASSET_URL;
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}${path}`;
  };

  // --- Helper for Date/Time Formatting ---
  const formatDateTime = (isoString) => {
    if (!isoString) return { date: "-", time: "-" };
    const dateObj = new Date(isoString);
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    return { date, time };
  };

  // NEW: Filter by Order Number - Clears all other filters
  const handleFilterByOrderNo = (orderNosString) => {
    // Close the menu
    setOpenMenuId(null);

    // Extract the first order number from the string
    // orderNosString might be "ORDER1, ORDER2, ORDER3"
    const firstOrderNo = orderNosString.split(",")[0].trim();

    // Reset ALL filters and only set orderNo
    setFilters({
      startDate: "",
      endDate: "",
      reportId: "",
      reportType: "All",
      orderType: "All",
      orderNo: firstOrderNo, // ← Set only the Order No
      productType: "All",
      empId: "",
      subConFactory: "All",
      custStyle: "",
      buyer: "All",
      supplier: "All",
      sortOrder: "asc"
    });

    // Reset to page 1
    setCurrentPage(1);

    // Optional: Show a toast notification
    setStatusModal({
      isOpen: true,
      type: "success",
      message: `Filtering all reports for Order: ${firstOrderNo}`
    });
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* --- 1. FILTER PANE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 relative z-40">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Filter className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white">
              Report Filters
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Save Filters Button */}
            <button
              onClick={handleSaveFilterClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
            >
              <Save className="w-3.5 h-3.5" /> Save Filter
            </button>

            {/* Standard Reset (Soft) */}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-green-200 dark:border-green-500"
              title="Reset fields (keep dates)"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset/Default
            </button>

            {/* Reset All (Hard) */}
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-400 dark:border-red-900/30"
              title="Reset ALL fields & dates"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-x-4 gap-y-4">
          {/* Date Range */}
          <FilterWrapper label="Start Date" icon={Calendar}>
            <input
              type="date"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              placeholder="MM/DD/YYYY"
            />
          </FilterWrapper>

          <FilterWrapper label="End Date" icon={Calendar}>
            <input
              type="date"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              placeholder="MM/DD/YYYY"
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

          {/* Order No with Autocomplete */}
          <FilterWrapper label="Order No" icon={Search}>
            <AutocompleteInput
              value={filters.orderNo}
              onChange={(val) => handleFilterChange("orderNo", val)}
              placeholder="Search Order..."
              apiEndpoint="/api/fincheck-reports/autocomplete/order-no"
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

          {/* Cust Style with Autocomplete */}
          <FilterWrapper label="Cust. Style" icon={Search}>
            <AutocompleteInput
              value={filters.custStyle}
              onChange={(val) => handleFilterChange("custStyle", val)}
              placeholder="Search Style..."
              apiEndpoint="/api/fincheck-reports/autocomplete/cust-style"
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

      {/* --- 2. DATA TABLE CONTAINER --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Table Header / Toolbar - FIXED */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col gap-4 sticky top-0 z-30">
          {/* Top Row: Title and Actions */}
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shadow-md">
                <FileText className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                Inspection Results
              </h3>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300">
                {totalCount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Customize View Button */}
              <button
                onClick={() => setShowColumnModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95 border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
              >
                <Settings2 className="w-4 h-4" /> Customize
              </button>

              {/* View Details Toggle */}
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

              {/* Export Button */}
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg transition-transform active:scale-95">
                <Download className="w-4 h-4" /> Export Excel
              </button>
            </div>
          </div>

          {/* Pagination Controls - FIXED */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </div>

        {/* Table Content - Scrollable */}
        <div
          className="overflow-auto flex-1"
          style={{ maxHeight: "calc(100vh - 400px)" }}
        >
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-900 dark:bg-gray-950 text-xs uppercase font-bold text-gray-100 sticky top-0 z-20">
              <tr>
                {isColumnVisible("date") && (
                  <th className="px-5 py-4 whitespace-nowrap">Date</th>
                )}
                {isColumnVisible("reportId") && canViewReportId && (
                  <th className="px-5 py-4 whitespace-nowrap">Report ID</th>
                )}
                {isColumnVisible("orderNo") && (
                  <th className="px-5 py-4 whitespace-nowrap">Order No</th>
                )}
                {isColumnVisible("custStyle") && (
                  <th className="px-5 py-4 whitespace-nowrap">Cust. Style</th>
                )}
                {isColumnVisible("customer") && (
                  <th className="px-5 py-4 whitespace-nowrap">Customer</th>
                )}
                {isColumnVisible("reportType") && (
                  <th className="px-5 py-4 whitespace-nowrap">Report Name</th>
                )}
                {isColumnVisible("product") && (
                  <th className="px-5 py-4 whitespace-nowrap">Product</th>
                )}
                {showDetailedView && isColumnVisible("orderType") && (
                  <th className="px-5 py-4 whitespace-nowrap">Type</th>
                )}
                {showDetailedView && isColumnVisible("method") && (
                  <th className="px-5 py-4 whitespace-nowrap">Method</th>
                )}
                {showDetailedView && isColumnVisible("wash") && (
                  <th className="px-5 py-4 whitespace-nowrap">Wash</th>
                )}
                {isColumnVisible("qaId") && (
                  <th className="px-5 py-4 whitespace-nowrap">QA ID</th>
                )}
                {showDetailedView && isColumnVisible("supplier") && (
                  <th className="px-5 py-4 whitespace-nowrap">Supplier</th>
                )}
                {showDetailedView && isColumnVisible("external") && (
                  <th className="px-5 py-4 whitespace-nowrap">External</th>
                )}
                {isColumnVisible("factory") && (
                  <th className="px-5 py-4 whitespace-nowrap">Factory</th>
                )}
                {isColumnVisible("finishedQty") && (
                  <th className="px-5 py-4 text-right whitespace-nowrap">
                    Finished #
                  </th>
                )}
                {isColumnVisible("sampleSize") && (
                  <th className="px-5 py-4 text-right whitespace-nowrap">
                    Sample Size
                  </th>
                )}
                {isColumnVisible("createdDate") && (
                  <th className="px-5 py-4 whitespace-nowrap">Created Date</th>
                )}
                {isColumnVisible("updatedDate") && (
                  <th className="px-5 py-4 whitespace-nowrap">Updated Date</th>
                )}
                {isColumnVisible("action") && (
                  <th className="px-5 py-4 text-center whitespace-nowrap">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={20} className="px-6 py-20 text-center">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      Loading reports...
                    </p>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={20} className="px-6 py-20 text-center">
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
                reports.map((report, index) => {
                  const details = report.inspectionDetails || {};
                  const config = report.inspectionConfig || {};
                  const isSubCon = details.isSubCon;
                  const isAQL = report.inspectionMethod === "AQL";

                  const created = formatDateTime(report.createdAt);
                  const updated = formatDateTime(report.updatedAt);

                  const finishedQtyDisplay =
                    isAQL && details.inspectedQty > 0
                      ? details.inspectedQty.toLocaleString()
                      : "";

                  let sampleSizeDisplay = 0;
                  if (isAQL) {
                    sampleSizeDisplay = details.aqlSampleSize || 0;
                  } else {
                    sampleSizeDisplay = config.sampleSize || 0;
                  }

                  const productImage = report.productTypeId?.imageURL;

                  return (
                    <tr
                      key={report.reportId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                    >
                      {/* Date */}
                      {isColumnVisible("date") && (
                        <td className="px-5 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(
                              report.inspectionDate
                            ).toLocaleDateString()}
                          </div>
                        </td>
                      )}

                      {/* Report ID */}
                      {isColumnVisible("reportId") && canViewReportId && (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                              {report.reportId}
                            </span>
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
                      {isColumnVisible("orderNo") && (
                        <td className="px-5 py-4 max-w-[200px]">
                          <p
                            className="truncate font-medium text-gray-800 dark:text-gray-200"
                            title={report.orderNosString}
                          >
                            {report.orderNosString}
                          </p>
                        </td>
                      )}

                      {/* Cust. Style */}
                      {isColumnVisible("custStyle") && (
                        <td className="px-5 py-4 max-w-[120px]">
                          <p className="text-[12px] leading-tight text-gray-600 dark:text-gray-400 break-words font-medium">
                            {details.custStyle || "-"}
                          </p>
                        </td>
                      )}

                      {/* Customer (Buyer) */}
                      {isColumnVisible("customer") && (
                        <td className="px-5 py-4 text-xs font-bold text-gray-700 dark:text-gray-300 capitalize">
                          {report.buyer ? report.buyer.toLowerCase() : "-"}
                        </td>
                      )}

                      {/* Report Name */}
                      {isColumnVisible("reportType") && (
                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300 text-[12px] break-words">
                          {report.reportType}
                        </td>
                      )}

                      {/* Product */}
                      {isColumnVisible("product") && (
                        <td className="px-5 py-4">
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
                      )}

                      {/* Order Type */}
                      {showDetailedView && isColumnVisible("orderType") && (
                        <td className="px-5 py-4">
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
                      )}

                      {/* Method */}
                      {showDetailedView && isColumnVisible("method") && (
                        <td className="px-5 py-4">
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
                      )}

                      {/* Wash */}
                      {showDetailedView && isColumnVisible("wash") && (
                        <td className="px-5 py-4">
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
                      )}

                      {/* QA ID */}
                      {isColumnVisible("qaId") && (
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                                {report.empId}
                              </span>
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
                      )}

                      {/* Supplier */}
                      {showDetailedView && isColumnVisible("supplier") && (
                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300 font-medium">
                          {details.supplier || "YM"}
                        </td>
                      )}

                      {/* External */}
                      {showDetailedView && isColumnVisible("external") && (
                        <td className="px-5 py-4">
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
                      )}

                      {/* Factory */}
                      {isColumnVisible("factory") && (
                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300 text-xs">
                          {isSubCon
                            ? details.subConFactory || "Unknown"
                            : details.factory || "N/A"}
                        </td>
                      )}

                      {/* Finished Qty */}
                      {isColumnVisible("finishedQty") && (
                        <td className="px-5 py-4 text-right font-mono text-xs text-gray-800 dark:text-gray-200">
                          {finishedQtyDisplay}
                        </td>
                      )}

                      {/* Sample Size */}
                      {isColumnVisible("sampleSize") && (
                        <td className="px-5 py-4 text-right">
                          {sampleSizeDisplay > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded">
                              {sampleSizeDisplay}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      )}

                      {/* Created At */}
                      {isColumnVisible("createdDate") && (
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {created.date}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded w-fit">
                              <Clock className="w-3 h-3" />
                              {created.time}
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Updated At */}
                      {isColumnVisible("updatedDate") && (
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {updated.date}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded w-fit">
                              <Clock className="w-3 h-3" /> {updated.time}
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Action */}
                      {isColumnVisible("action") && (
                        <td className="px-5 py-4 text-center relative">
                          <button
                            onClick={(e) =>
                              handleMenuToggle(e, report.reportId, index)
                            }
                            className={`p-2 rounded-full transition-colors ${
                              openMenuId === report.reportId
                                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
                                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600"
                            }`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- FLOATING ACTION MENU PORTAL --- */}
      {openMenuId &&
        (() => {
          // Find the report data for the currently open menu
          const activeReport = reports.find((r) => r.reportId === openMenuId);
          if (!activeReport) return null;

          return createPortal(
            <div
              className="fixed z-[9999] w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fadeIn"
              style={{
                top: menuPos.top,
                left: menuPos.left
              }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <div className="flex flex-col">
                <button
                  onClick={() => {
                    setOpenMenuId(null); // Close menu
                    handleViewReport(activeReport);
                  }}
                  className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  View Report
                </button>

                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

                <button
                  onClick={() => {
                    setOpenMenuId(null);
                    handleFilterByOrderNo(activeReport.orderNosString);
                  }}
                  className="px-4 py-3 text-left text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2 transition-colors"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filter All Reports
                </button>

                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

                <button
                  onClick={() => {
                    setOpenMenuId(null);
                    handleDeleteReport(activeReport);
                  }}
                  className="px-4 py-3 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>,
            document.body
          );
        })()}

      {/* --- MODALS --- */}
      {previewImage && (
        <ProductImageModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {viewingInspector && (
        <InspectorAutoCloseModal
          data={viewingInspector}
          onClose={() => setViewingInspector(null)}
        />
      )}

      {viewingReportQR && (
        <ReportQRModal
          report={viewingReportQR}
          onClose={() => setViewingReportQR(null)}
        />
      )}

      {showColumnModal && (
        <ColumnCustomizeModal
          columns={availableColumnsForModal}
          visibleColumns={visibleColumns}
          savedFilters={savedFiltersList} // <--- Pass List
          onApplyColumns={handleColumnChangeAndSave} // <--- Use new handler
          onApplyFilter={applySavedFilter} // <--- Pass Apply Function
          onDeleteFilter={handleDeleteFilter} // <--- Pass Delete Function
          onClose={() => setShowColumnModal(false)}
        />
      )}

      {/* Save Filter Name Modal */}
      {showSaveFilterModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Save Current Filter
              </h3>

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Filter Name
                </label>
                <input
                  type="text"
                  maxLength={25}
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  placeholder="e.g. My Monthly AQL"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
                <p className="text-[10px] text-gray-400 text-right mt-1">
                  {newFilterName.length}/25
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSaveFilterModal(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSaveFilter}
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* --- Auto dismisaal Modal --- */}
      <AutoDismissModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        message={statusModal.message}
      />

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
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
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-shrinkWidth {
          animation: shrinkWidth 3s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default YPivotQAReportMain;
