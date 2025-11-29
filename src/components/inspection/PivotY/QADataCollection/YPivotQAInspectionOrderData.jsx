import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Search,
  Package,
  Loader2,
  Building2,
  User,
  MapPin,
  Truck,
  Users,
  Hash,
  Globe,
  Tag,
  Shirt,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config";

// Sub-component for displaying Color/Size breakdown table
const ColorSizeBreakdownTable = ({ data }) => {
  if (!data || !data.colors || data.colors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No color/size data available</p>
      </div>
    );
  }

  const { sizeList, colors, sizeTotals, grandTotal } = data;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <th className="px-3 py-2.5 text-left font-bold text-xs uppercase tracking-wide sticky left-0 bg-indigo-600 z-10">
              Color
            </th>
            {sizeList.map((size) => (
              <th
                key={size}
                className="px-2 py-2.5 text-center font-bold text-xs uppercase tracking-wide min-w-[60px]"
              >
                {size}
              </th>
            ))}
            <th className="px-3 py-2.5 text-center font-bold text-xs uppercase tracking-wide bg-indigo-700 min-w-[80px]">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {colors.map((row, index) => (
            <tr
              key={index}
              className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${
                index % 2 === 0
                  ? "bg-white dark:bg-gray-800"
                  : "bg-gray-50 dark:bg-gray-800/50"
              } hover:bg-indigo-50 dark:hover:bg-indigo-900/20`}
            >
              <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200 sticky left-0 bg-inherit z-10">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: row.colorCode || "#ccc" }}
                  />
                  <span className="truncate max-w-[120px]">{row.color}</span>
                </div>
              </td>
              {sizeList.map((size) => (
                <td
                  key={size}
                  className={`px-2 py-2 text-center font-medium ${
                    row.sizes[size]
                      ? "text-gray-800 dark:text-gray-200"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  {row.sizes[size] || "-"}
                </td>
              ))}
              <td className="px-3 py-2 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30">
                {row.total.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 font-bold">
            <td className="px-3 py-2.5 text-gray-800 dark:text-gray-200 sticky left-0 bg-gray-200 dark:bg-gray-700 z-10">
              Total
            </td>
            {sizeList.map((size) => (
              <td
                key={size}
                className="px-2 py-2.5 text-center text-gray-800 dark:text-gray-200"
              >
                {sizeTotals[size]?.toLocaleString() || "-"}
              </td>
            ))}
            <td className="px-3 py-2.5 text-center text-white bg-gradient-to-r from-indigo-600 to-purple-600">
              {grandTotal.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// Sub-component for SKU Data Table
const SKUDataTable = ({ skuData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!skuData || skuData.length === 0) {
    return null;
  }

  const displayData = isExpanded ? skuData : skuData.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <th className="px-3 py-2 text-left font-bold text-xs uppercase">
                SKU
              </th>
              <th className="px-3 py-2 text-left font-bold text-xs uppercase">
                PO Line
              </th>
              <th className="px-3 py-2 text-left font-bold text-xs uppercase">
                Color
              </th>
              <th className="px-3 py-2 text-center font-bold text-xs uppercase">
                ETD
              </th>
              <th className="px-3 py-2 text-center font-bold text-xs uppercase">
                ETA
              </th>
              <th className="px-3 py-2 text-right font-bold text-xs uppercase">
                Qty
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((sku, index) => (
              <tr
                key={index}
                className={`border-b border-gray-200 dark:border-gray-700 ${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800/50"
                } hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors`}
              >
                <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                  {sku.sku || "N/A"}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                  {sku.POLine || "N/A"}
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  {sku.Color || "N/A"}
                </td>
                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs">
                  {sku.ETD || "-"}
                </td>
                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs">
                  {sku.ETA || "-"}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {sku.Qty?.toLocaleString() || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {skuData.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show All ({skuData.length} SKUs)
            </>
          )}
        </button>
      )}
    </div>
  );
};

// Info Card Component
const InfoCard = ({ icon: Icon, label, value, color = "indigo" }) => {
  const colorClasses = {
    indigo:
      "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    purple:
      "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    orange:
      "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    pink: "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800"
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border ${colorClasses[color]} transition-all hover:shadow-md`}
    >
      <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
};

// Main Component
const YPivotQAInspectionOrderData = () => {
  // State
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [error, setError] = useState(null);

  // Search orders
  const searchOrders = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-inspection/search-orders?term=${term}`
      );
      if (res.data.success) {
        setSearchResults(res.data.data);
        setShowSearchDropdown(true);
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchOrders(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchOrders]);

  // Fetch order details
  const fetchOrderDetails = async (moNo) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-inspection/order-details/${moNo}`
      );
      if (res.data.success) {
        setOrderData(res.data.data);
        setSelectedOrder(moNo);
        setShowSearchDropdown(false);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.message || "Failed to fetch order details");
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle order selection
  const handleSelectOrder = (order) => {
    // 1. Close dropdown immediately
    setShowSearchDropdown(false);
    // 2. Clear results to prevent it popping back up
    setSearchResults([]);
    // 3. Update text
    setSearchTerm(order.Order_No);
    // 4. Fetch data
    fetchOrderDetails(order.Order_No);
  };

  // Clear selection
  const handleClearOrder = () => {
    setSelectedOrder(null);
    setOrderData(null);
    setSearchTerm("");
    setSearchResults([]);
    setError(null);
  };

  // Format fabric content
  const formatFabricContent = (fabricContent) => {
    if (!fabricContent || fabricContent.length === 0) return "N/A";
    return fabricContent
      .map((fc) => `${fc.fabricName} ${fc.percentageValue}%`)
      .join(", ");
  };

  return (
    <div className="space-y-4">
      {/* Selection Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 relative z-20">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Package className="w-4 h-4" />
            Order Selection
          </h2>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inspection Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Inspection Date
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Order Search */}
            <div className="relative" style={{ zIndex: 60 }}>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-500" />
                Order No
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() =>
                    searchResults.length > 0 && setShowSearchDropdown(true)
                  }
                  placeholder="Search MO Number..."
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
                )}
                {selectedOrder && !searchLoading && (
                  <button
                    onClick={handleClearOrder}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Search Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div
                  className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto"
                  style={{ position: "absolute", top: "100%", left: 0 }}
                >
                  {searchResults.map((order, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectOrder(order)}
                      className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                            {order.Order_No}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {order.CustStyle || "N/A"} •{" "}
                            {order.EngName || "N/A"}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                          {order.TotalQty?.toLocaleString() || 0} pcs
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Order Badge */}
          {selectedOrder && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-green-700 dark:text-green-400">
                  Order Selected: {selectedOrder}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Inspection Date:{" "}
                  {new Date(inspectionDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => fetchOrderDetails(selectedOrder)}
                className="p-2 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4 text-green-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading order details...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-700 dark:text-red-400">
              Error Loading Order
            </p>
            <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
          </div>
        </div>
      )}

      {/* Order Data Display */}
      {orderData && !loading && (
        <div className="space-y-4 animate-fadeIn">
          {/* DT Order Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Order Information
              </h3>
              <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                {orderData.dtOrder.orderNo}
              </span>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <InfoCard
                  icon={Tag}
                  label="Cust. Style"
                  value={orderData.dtOrder.custStyle}
                  color="indigo"
                />
                <InfoCard
                  icon={User}
                  label="Customer"
                  value={orderData.dtOrder.customer}
                  color="purple"
                />
                <InfoCard
                  icon={Building2}
                  label="Factory"
                  value={orderData.dtOrder.factory}
                  color="blue"
                />
                <InfoCard
                  icon={Hash}
                  label="Total Qty"
                  value={orderData.dtOrder.totalQty?.toLocaleString()}
                  color="emerald"
                />
                <InfoCard
                  icon={Globe}
                  label="Origin"
                  value={orderData.dtOrder.origin}
                  color="orange"
                />
                <InfoCard
                  icon={Truck}
                  label="Mode"
                  value={orderData.dtOrder.mode}
                  color="pink"
                />
                <InfoCard
                  icon={Users}
                  label="Sales Team"
                  value={orderData.dtOrder.salesTeamName}
                  color="indigo"
                />
                <InfoCard
                  icon={MapPin}
                  label="Country"
                  value={orderData.dtOrder.country}
                  color="purple"
                />
              </div>
            </div>
          </div>

          {/* Yorksys Order Info (if available) */}
          {orderData.yorksysOrder && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Additional Order Details
                </h3>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  <InfoCard
                    icon={Tag}
                    label="SKU Description"
                    value={orderData.yorksysOrder.skuDescription}
                    color="purple"
                  />
                  <InfoCard
                    icon={MapPin}
                    label="Destination"
                    value={orderData.yorksysOrder.destination}
                    color="blue"
                  />
                  <InfoCard
                    icon={Calendar}
                    label="Season"
                    value={orderData.yorksysOrder.season}
                    color="orange"
                  />
                  <InfoCard
                    icon={Shirt}
                    label="Product Type"
                    value={orderData.yorksysOrder.productType}
                    color="pink"
                  />
                </div>

                {/* Fabric Content */}
                {orderData.yorksysOrder.fabricContent &&
                  orderData.yorksysOrder.fabricContent.length > 0 && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                        Fabric Content
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {formatFabricContent(
                          orderData.yorksysOrder.fabricContent
                        )}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Color/Size Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Qty by Color & Size
              </h3>
              <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                {orderData.colorSizeBreakdown.colors.length} Colors •{" "}
                {orderData.colorSizeBreakdown.sizeList.length} Sizes
              </span>
            </div>
            <div className="p-4">
              <ColorSizeBreakdownTable data={orderData.colorSizeBreakdown} />
            </div>
          </div>

          {/* SKU Data Table */}
          {orderData.yorksysOrder?.skuData &&
            orderData.yorksysOrder.skuData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Order Data by SKU
                  </h3>
                  <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                    {orderData.yorksysOrder.skuData.length} SKUs
                  </span>
                </div>
                <div className="p-4">
                  <SKUDataTable skuData={orderData.yorksysOrder.skuData} />
                </div>
              </div>
            )}
        </div>
      )}

      {/* Empty State */}
      {!selectedOrder && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
            <Search className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
            Search for an Order
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Enter an MO Number in the search box above to load order details for
            inspection.
          </p>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
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
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionOrderData;
