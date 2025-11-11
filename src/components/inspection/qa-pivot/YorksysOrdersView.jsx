import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  FilterX,
  Loader,
  Eye,
  Search
} from "lucide-react";
import React, { useCallback, useRef, useEffect, useState } from "react";
import { API_BASE_URL } from "../../../../config";
import AdditionalInfoModal from "./AdditionalInfoModal";

// --- Custom Hook for Debouncing text input ---
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- Reusable Searchable Select Component
export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange({ target: { name, value: option } });
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={ref}>
      <div
        className="w-full p-2 pl-3 pr-8 flex items-center justify-between border border-gray-300 rounded-md text-sm shadow-sm bg-white cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-gray-800" : "text-gray-500"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <ul>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer"
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-gray-500">
                No results found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- Helper Functions ---
const formatFabricContent = (fabricArray) => {
  if (!fabricArray || fabricArray.length === 0) return "N/A";
  return fabricArray
    .map((f) => `${f.fabricName}: ${f.percentageValue}%`)
    .join(", ");
};

const calculateTotalQty = (countryArray) => {
  if (!countryArray || countryArray.length === 0) return 0;
  return countryArray.reduce((sum, country) => sum + country.TotalQty, 0);
};

// 🔄 MODIFIED: Returns an object for a two-line display with the correct date format
const formatTimestamp = (isoString) => {
  if (!isoString) return { date: "N/A", time: "" };
  try {
    const date = new Date(isoString);
    date.setHours(date.getHours() + 7); // Add +7 hours

    const datePart = date.toLocaleDateString("en-US", {
      // MM/DD/YYYY format
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    return { date: datePart, time: timePart };
  } catch (error) {
    return { date: "Invalid Date", time: "" };
  }
};

const YorksysOrdersView = () => {
  const PAGE_LIMIT = 10;
  // --- State Management ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalRecords: 0,
    limit: PAGE_LIMIT
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filter State
  const initialFilters = {
    factory: "",
    moNo: "",
    style: "",
    buyer: "",
    season: ""
  };
  const [filters, setFilters] = useState(initialFilters);
  const [filterOptions, setFilterOptions] = useState({
    factories: [],
    buyers: [],
    seasons: []
  });

  const debouncedMoNo = useDebounce(filters.moNo, 500);
  const debouncedStyle = useDebounce(filters.style, 500);

  // --- Data Fetching ---
  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/yorksys-orders/filters`
      );
      const result = await response.json();
      if (result.success) setFilterOptions(result.data);
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: currentPage,
      limit: PAGE_LIMIT
    });
    // Add active filters to the request parameters
    if (filters.factory) params.append("factory", filters.factory);
    if (filters.buyer) params.append("buyer", filters.buyer);
    if (filters.season) params.append("season", filters.season);
    if (debouncedMoNo) params.append("moNo", debouncedMoNo);
    if (debouncedStyle) params.append("style", debouncedStyle);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/yorksys-orders?${params.toString()}`
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to fetch orders.");
      setOrders(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    filters.factory,
    filters.buyer,
    filters.season,
    debouncedMoNo,
    debouncedStyle
  ]);

  // Initial load for filter dropdowns
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Re-fetch orders when page or filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- Event Handlers ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // CRITICAL: Reset to first page on any filter change
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.totalPages &&
      newPage !== currentPage
    ) {
      setCurrentPage(newPage);
    }
  };

  // --- UI Rendering Logic ---
  const generatePageNumbers = () => {
    const { totalPages } = pagination;
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      if (currentPage > 2) pages.push(currentPage - 1);
      if (currentPage > 1 && currentPage < totalPages) pages.push(currentPage);
      if (currentPage < totalPages - 1) pages.push(currentPage + 1);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const startRecord =
    pagination.totalRecords > 0 ? (currentPage - 1) * pagination.limit + 1 : 0;
  const endRecord = Math.min(
    startRecord + pagination.limit - 1,
    pagination.totalRecords
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Yorksys Orders</h2>

      {/* --- Filter Pane --- */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-md font-semibold text-gray-700">
            Filter Options
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Factory
            </label>
            <SearchableSelect
              name="factory"
              value={filters.factory}
              onChange={handleFilterChange}
              options={filterOptions.factories}
              placeholder="All Factories"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Buyer
            </label>
            <SearchableSelect
              name="buyer"
              value={filters.buyer}
              onChange={handleFilterChange}
              options={filterOptions.buyers}
              placeholder="All Buyers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Season
            </label>
            <SearchableSelect
              name="season"
              value={filters.season}
              onChange={handleFilterChange}
              options={filterOptions.seasons}
              placeholder="All Seasons"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              MO No
            </label>
            <div className="relative">
              <input
                type="text"
                name="moNo"
                placeholder="Search MO..."
                value={filters.moNo}
                onChange={handleFilterChange}
                className="w-full p-2 pl-8 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Cust. Style
            </label>
            <div className="relative">
              <input
                type="text"
                name="style"
                placeholder="Search Style..."
                value={filters.style}
                onChange={handleFilterChange}
                className="w-full p-2 pl-8 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="self-end">
            <button
              onClick={clearFilters}
              className="w-full flex items-center justify-center gap-2 p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium transition-colors"
            >
              <FilterX className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
          <AlertTriangle className="w-5 h-5 mr-2" /> <span>Error: {error}</span>
        </div>
      )}

      {/* --- Table Section --- */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10 rounded-lg">
              <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                {[
                  "Factory",
                  "MO No",
                  "Cust.Style",
                  "Buyer",
                  "Currency",
                  "Destination",
                  "Ship Mode",
                  "Season",
                  "Fabric Content",
                  "Total Order Qty",
                  "Created At",
                  "Updated At",
                  "SKU Details"
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const createdAt = formatTimestamp(order.createdAt);
                const updatedAt = formatTimestamp(order.updatedAt);
                return (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 transition-colors align-middle"
                  >
                    <td className="text-sm px-6 py-4 font-semibold whitespace-nowrap">
                      {order.factory}
                    </td>
                    <td className="text-sm px-6 py-4 font-semibold whitespace-nowrap font-medium text-indigo-700">
                      {order.moNo}
                    </td>
                    <td className="text-xs px-6 py-4 whitespace-nowrap">
                      {order.style}
                    </td>
                    <td className="text-sm px-6 py-4 font-semibold whitespace-nowrap">
                      {order.buyer}
                    </td>
                    <td className="text-sm px-6 py-4 whitespace-nowrap text-center">
                      {order.currency}
                    </td>
                    <td className="text-xs px-6 py-4 ">{order.destination}</td>
                    <td className="text-sm px-6 py-4 whitespace-nowrap">
                      {order.shipMode}
                    </td>
                    <td className="text-xs px-6 py-4 whitespace-nowrap text-center">
                      {order.season}
                    </td>
                    <td
                      className="text-xs px-6 py-4 bg-blue-50 font-semibold max-w-xs truncate"
                      title={formatFabricContent(order.FabricContent)}
                    >
                      {formatFabricContent(order.FabricContent)}
                    </td>
                    <td className="text-xs px-6 py-4 whitespace-nowrap text-right font-semibold bg-amber-100 text-gray-800">
                      {calculateTotalQty(
                        order.OrderQtyByCountry
                      ).toLocaleString()}
                    </td>
                    <td className="text-xs px-6 py-4 whitespace-nowrap text-gray-600">
                      <div className="flex flex-col">
                        <span>{createdAt.date}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          {createdAt.time}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs px-6 py-4 whitespace-nowrap text-gray-600">
                      <div className="flex flex-col">
                        <span>{updatedAt.date}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          {updatedAt.time}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full py-1.5 px-4 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan="13" className="text-center py-10 text-gray-500">
                    No orders found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Pagination Controls --- */}
      {pagination.totalRecords > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startRecord}</span> to{" "}
            <span className="font-medium">{endRecord}</span> of{" "}
            <span className="font-medium">{pagination.totalRecords}</span>{" "}
            results
          </p>
          <nav className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {generatePageNumbers().map((page, index) =>
              page === "..." ? (
                <span key={index} className="px-4 py-2 text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  key={index}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    page === currentPage
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </nav>
        </div>
      )}

      {/* Modal */}
      <AdditionalInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default YorksysOrdersView;
