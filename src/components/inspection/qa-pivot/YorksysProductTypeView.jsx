import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  FilterX,
  Loader,
  Search,
  Edit,
  Save,
  XCircle
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../../../../config";
import { useDebounce, SearchableSelect } from "./YorksysOrdersView";

// Helper to calculate total quantity
const calculateTotalQty = (countryArray) => {
  if (!countryArray || countryArray.length === 0) return 0;
  return countryArray.reduce((sum, country) => sum + country.TotalQty, 0);
};

const YorksysProductTypeView = () => {
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
  const [productTypeList, setProductTypeList] = useState([]);

  // Editing State
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [selectedProductType, setSelectedProductType] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Filter State (same as YorksysOrdersView)
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

  const fetchProductTypes = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qa-sections-product-type`
      );
      const result = await response.json();
      if (result.success) {
        setProductTypeList(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch product types:", err);
    }
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: currentPage,
      limit: PAGE_LIMIT,
      ...Object.fromEntries(
        Object.entries({
          ...filters,
          moNo: debouncedMoNo,
          style: debouncedStyle
        }).filter(([, v]) => v)
      )
    });

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
  }, [currentPage, filters, debouncedMoNo, debouncedStyle]);

  useEffect(() => {
    fetchFilterOptions();
    fetchProductTypes();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- Event Handlers ---
  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const handleEdit = (order) => {
    setEditingOrderId(order._id);
    setSelectedProductType(order.productType || "Top");
  };

  const handleCancel = () => {
    setEditingOrderId(null);
    setSelectedProductType("");
  };

  const handleSave = async (orderId) => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/yorksys-orders/${orderId}/product-type`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productType: selectedProductType })
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      // Update local state to reflect change without re-fetching
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? { ...order, productType: selectedProductType }
            : order
        )
      );
      handleCancel(); // Exit editing mode
    } catch (err) {
      alert(`Error saving: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
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

  // --- UI ---
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Assign Product Type
      </h2>

      {/* Filter Pane */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        {/* ... (Filter pane JSX is the same as YorksysOrdersView) ... */}
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-md font-semibold text-gray-700">
            Filter Options
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <SearchableSelect
            name="factory"
            value={filters.factory}
            onChange={handleFilterChange}
            options={filterOptions.factories}
            placeholder="All Factories"
          />
          <SearchableSelect
            name="buyer"
            value={filters.buyer}
            onChange={handleFilterChange}
            options={filterOptions.buyers}
            placeholder="All Buyers"
          />
          <SearchableSelect
            name="season"
            value={filters.season}
            onChange={handleFilterChange}
            options={filterOptions.seasons}
            placeholder="All Seasons"
          />
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
          <button
            onClick={clearFilters}
            className="w-full flex items-center justify-center gap-2 p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium transition-colors"
          >
            <FilterX className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
          <AlertTriangle className="w-5 h-5 mr-2" /> <span>Error: {error}</span>
        </div>
      )}

      {/* Table Section */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10">
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
                "Destination",
                "Ship Mode",
                "Season",
                "Total Order Qty",
                "Product Type",
                "Action"
              ].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50 align-middle">
                <td className="px-6 py-4 font-semibold">{order.factory}</td>
                <td className="px-6 py-4 font-medium text-indigo-700">
                  {order.moNo}
                </td>
                <td className="px-6 py-4">{order.style}</td>
                <td className="px-6 py-4 font-semibold">{order.buyer}</td>
                <td className="px-6 py-4 max-w-xs truncate">
                  {order.destination}
                </td>
                <td className="px-6 py-4">{order.shipMode}</td>
                <td className="px-6 py-4">{order.season}</td>
                <td className="px-6 py-4 font-semibold text-right">
                  {calculateTotalQty(order.OrderQtyByCountry).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  {editingOrderId === order._id ? (
                    <select
                      value={selectedProductType}
                      onChange={(e) => setSelectedProductType(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      {productTypeList.map((pt) => (
                        <option key={pt._id} value={pt.EnglishProductName}>
                          {pt.EnglishProductName}
                        </option>
                      ))}
                    </select>
                  ) : order.productType ? (
                    <span className="font-medium text-gray-700">
                      {order.productType}
                    </span>
                  ) : (
                    <span className="italic text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingOrderId === order._id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSave(order._id)}
                        disabled={isSaving}
                        className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-full py-1.5 px-3"
                      >
                        {isSaving ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-2 text-gray-500 hover:bg-gray-200 rounded-full"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(order)}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full py-1.5 px-3"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
    </div>
  );
};

export default YorksysProductTypeView;
