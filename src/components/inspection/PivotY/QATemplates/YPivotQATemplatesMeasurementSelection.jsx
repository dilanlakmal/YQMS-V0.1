import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Search,
  ClipboardList,
  Ruler,
  Check,
  Loader2,
  X,
  Plus,
  Minus,
  Maximize2,
  Save,
  AlertCircle
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// Import your existing Number Pad
// Adjust path as needed based on your project structure
import MeasurementNumPad from "../../cutting/MeasurementNumPad";

// --- SUB-COMPONENT: Measurement Grid Modal ---
const MeasurementGridModal = ({
  isOpen,
  onClose,
  specsData,
  selectedSize,
  selectedKValue,
  initialQty = 3,
  onSave
}) => {
  if (!isOpen) return null;

  // --- Local State ---
  const [qty, setQty] = useState(initialQty);
  // Measurements State: { [specIndex]: { [sampleIndex]: { decimal: 0, fraction: "0" } } }
  const [measurements, setMeasurements] = useState({});
  // NumPad State
  const [activeCell, setActiveCell] = useState(null); // { specIndex, sampleIndex }

  // --- Handlers ---

  // Helper to check tolerance
  const checkTolerance = (spec, value) => {
    if (value === 0) return true; // Default 0 is green/neutral as per requirement

    const baseVal =
      spec.Specs.find((s) => s.size === selectedSize)?.decimal || 0;
    const tolMinus = spec.TolMinus?.decimal || 0;
    const tolPlus = spec.TolPlus?.decimal || 0;

    // Tolerance Logic: (Base - TolMinus) <= Value <= (Base + TolPlus)
    // Note: TolMinus usually stored as positive number in DB, so subtract it.
    const min = baseVal - Math.abs(tolMinus);
    const max = baseVal + Math.abs(tolPlus);

    return value >= min && value <= max;
  };

  const handleCellClick = (specIndex, sampleIndex) => {
    setActiveCell({ specIndex, sampleIndex });
  };

  const handleNumPadInput = (decimal, fraction) => {
    if (activeCell) {
      setMeasurements((prev) => ({
        ...prev,
        [activeCell.specIndex]: {
          ...(prev[activeCell.specIndex] || {}),
          [activeCell.sampleIndex]: { decimal, fraction }
        }
      }));
    }
  };

  const handleSave = () => {
    // Format data for saving
    const result = {
      size: selectedSize,
      kValue: selectedKValue,
      qty: qty,
      measurements: measurements
    };
    onSave(result);
    onClose();
  };

  // Render Table Rows
  const renderRows = () => {
    // Filter specs based on K Value if provided (for Before Wash)
    const filteredSpecs = selectedKValue
      ? specsData.filter(
          (s) => s.kValue === selectedKValue || s.kValue === "NA"
        )
      : specsData;

    return filteredSpecs.map((spec, specIndex) => {
      const specValueObj = spec.Specs.find((s) => s.size === selectedSize);
      const specValueDisplay =
        specValueObj?.fraction || specValueObj?.decimal || "-";
      const tolMinus = spec.TolMinus?.fraction || "-";
      const tolPlus = spec.TolPlus?.fraction || "-";

      return (
        <tr
          key={specIndex}
          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {/* Fixed Info Columns */}
          <td className="p-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
            {spec.MeasurementPointEngName}
            {spec.MeasurementPointChiName && (
              <div className="text-xs text-gray-500">
                {spec.MeasurementPointChiName}
              </div>
            )}
          </td>
          <td className="p-2 text-center text-xs text-red-500 font-mono border-r border-gray-200 dark:border-gray-700">
            -{tolMinus}
          </td>
          <td className="p-2 text-center text-xs font-bold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700">
            {specValueDisplay}
          </td>
          <td className="p-2 text-center text-xs text-green-500 font-mono border-r border-gray-200 dark:border-gray-700">
            +{tolPlus}
          </td>

          {/* Dynamic Qty Columns */}
          {Array.from({ length: qty }).map((_, i) => {
            const currentVal = measurements[specIndex]?.[i];
            const displayVal = currentVal?.fraction || "0";
            const numVal = currentVal?.decimal || 0;

            // Determine Color
            const isPass = checkTolerance(spec, numVal);
            const cellClass = isPass
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";

            return (
              <td
                key={i}
                className="p-1 border-r border-gray-200 dark:border-gray-700 min-w-[80px]"
              >
                <button
                  onClick={() => handleCellClick(specIndex, i)}
                  className={`w-full h-10 rounded border flex items-center justify-center text-sm font-bold transition-all hover:shadow-md ${cellClass}`}
                >
                  {displayVal}
                </button>
              </td>
            );
          })}
        </tr>
      );
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col h-[100dvh] animate-fadeIn">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-indigo-600 flex justify-between items-center shadow-md safe-area-top">
        <div>
          <h2 className="text-white font-bold text-xl">Measurement Grid</h2>
          <div className="text-indigo-200 text-xs flex gap-3 mt-1">
            <span className="bg-indigo-700 px-2 py-0.5 rounded">
              Size: {selectedSize}
            </span>
            {selectedKValue && (
              <span className="bg-indigo-700 px-2 py-0.5 rounded">
                K: {selectedKValue}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Sample Qty:
          </span>
          <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-r border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-12 text-center font-bold text-gray-800 dark:text-white">
              {qty}
            </div>
            <button
              onClick={() => setQty(qty + 1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-l border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Measurements
        </button>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 shadow-sm">
            <tr>
              <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r dark:border-gray-700 min-w-[200px]">
                Measurement Point
              </th>
              <th className="p-2 text-center text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 w-16">
                Tol -
              </th>
              <th className="p-2 text-center text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 w-16">
                Spec
              </th>
              <th className="p-2 text-center text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 w-16">
                Tol +
              </th>
              {Array.from({ length: qty }).map((_, i) => (
                <th
                  key={i}
                  className="p-2 text-center text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 min-w-[80px]"
                >
                  #{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900">{renderRows()}</tbody>
        </table>
      </div>

      {/* NumPad Overlay */}
      {activeCell && (
        <MeasurementNumPad
          onClose={() => setActiveCell(null)}
          onInput={handleNumPadInput}
          initialValue={
            measurements[activeCell.specIndex]?.[activeCell.sampleIndex]
              ?.decimal
          }
        />
      )}
    </div>,
    document.body
  );
};

// --- MAIN COMPONENT ---
const YPivotQATemplatesMeasurementSelection = () => {
  // Global Tabs
  const [activeTab, setActiveTab] = useState("orders"); // 'orders', 'type', 'specs'

  // --- TAB 1: Orders ---
  const [searchTerm, setSearchTerm] = useState("");
  const [ordersResults, setOrdersResults] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderSizes, setOrderSizes] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // --- TAB 2: Report Type ---
  const [reportTypes, setReportTypes] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [measConfig, setMeasConfig] = useState("No"); // No, Before, After

  // --- TAB 3: Specs ---
  const [specsData, setSpecsData] = useState(null); // The full specs array from API
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedKValue, setSelectedKValue] = useState(""); // Only for Before Wash
  const [kValuesList, setKValuesList] = useState([]);

  // Modal State
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [savedMeasurements, setSavedMeasurements] = useState([]);

  // --- Fetch Report Types on Mount ---
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/qa-sections-templates`
        );
        if (res.data.success) setReportTypes(res.data.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchReports();
  }, []);

  // --- Search Order ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 3) {
        setLoadingOrders(true);
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/search-mono?term=${searchTerm}`
          );
          setOrdersResults(res.data); // Returns array of strings [MO1, MO2]
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setLoadingOrders(false);
        }
      } else {
        setOrdersResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelectOrder = async (moNo) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/order-details/${moNo}`);
      setSelectedOrder({ ...res.data, moNo }); // Store basic details + MO

      // Extract Sizes List from response
      // The endpoint returns colorSizeMap, we extract unique sizes
      const allSizes = new Set();
      if (res.data.colorSizeMap) {
        Object.values(res.data.colorSizeMap).forEach((c) => {
          if (c.sizes) c.sizes.forEach((s) => allSizes.add(s));
        });
      }
      setOrderSizes(Array.from(allSizes));
      setActiveTab("type");
    } catch (error) {
      alert("Failed to load order details");
    }
  };

  // --- Handle Report Selection ---
  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setMeasConfig(report.Measurement); // "Before" or "After" or "No"

    if (report.Measurement === "No") {
      alert("This report type does not require measurements.");
      return;
    }

    setActiveTab("specs");
    fetchMeasurementSpecs(report.Measurement);
  };

  const fetchMeasurementSpecs = async (type) => {
    setLoadingSpecs(true);
    const endpoint =
      type === "Before"
        ? `/api/qa-sections/measurement-specs/${selectedOrder.moNo}`
        : `/api/qa-sections/measurement-specs-aw/${selectedOrder.moNo}`;

    try {
      const res = await axios.get(`${API_BASE_URL}${endpoint}`);
      const data =
        type === "Before"
          ? res.data.data.AllBeforeWashSpecs
          : res.data.data.AllAfterWashSpecs;
      setSpecsData(data);

      // If Before Wash, extract K Values
      if (type === "Before") {
        const kSet = new Set(
          data.map((s) => s.kValue).filter((k) => k && k !== "NA")
        );
        setKValuesList(Array.from(kSet));
      }
    } catch (error) {
      console.error("Fetch Specs Error", error);
      alert("Specs not found or not configured for this order.");
      setSpecsData(null);
    } finally {
      setLoadingSpecs(false);
    }
  };

  // --- Renders ---

  const renderOrderTab = () => (
    <div className="max-w-xl mx-auto mt-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
          <Search className="w-5 h-5 text-indigo-500" /> Search Order
        </h3>
        <input
          type="text"
          placeholder="Type MO Number (e.g. 12345)..."
          className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {loadingOrders && (
          <div className="mt-4 flex justify-center">
            <Loader2 className="animate-spin text-indigo-500" />
          </div>
        )}

        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {ordersResults.map((mo) => (
            <button
              key={mo}
              onClick={() => handleSelectOrder(mo)}
              className="w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg border border-transparent hover:border-indigo-200 transition-all flex justify-between items-center group"
            >
              <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">
                {mo}
              </span>
              <Check className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTypeTab = () => (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Select Report Type
            </h3>
            <p className="text-sm text-gray-500">
              Order: {selectedOrder?.moNo}
            </p>
          </div>
          <button
            onClick={() => setActiveTab("orders")}
            className="text-sm text-indigo-500 hover:underline"
          >
            Change Order
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <button
              key={report._id}
              onClick={() => handleSelectReport(report)}
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <ClipboardList className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
                <span
                  className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                    report.Measurement === "No"
                      ? "bg-gray-200 text-gray-500"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {report.Measurement === "No"
                    ? "No Specs"
                    : `${report.Measurement} Wash`}
                </span>
              </div>
              <h4 className="font-bold text-gray-800 dark:text-white">
                {report.ReportType}
              </h4>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSpecsTab = () => (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-gray-800 dark:text-white">
            Measurement Specs
          </h3>
          <p className="text-xs text-gray-500">
            Order: {selectedOrder?.moNo} • Mode:{" "}
            <span className="text-indigo-500 font-bold">{measConfig} Wash</span>
          </p>
        </div>
        <button
          onClick={() => setActiveTab("type")}
          className="text-sm text-gray-500 hover:text-indigo-500"
        >
          Change Report
        </button>
      </div>

      {loadingSpecs ? (
        <div className="text-center py-20">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
        </div>
      ) : !specsData ? (
        <div className="text-center py-20 text-red-500">
          <AlertCircle className="w-10 h-10 mx-auto mb-2" />
          No specs data found.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Size Selector */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Select Size
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Size --</option>
                {orderSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* K Value Selector (Only for Before Wash) */}
            {measConfig === "Before" && kValuesList.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Select K Value
                </label>
                <select
                  value={selectedKValue}
                  onChange={(e) => setSelectedKValue(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose K Value --</option>
                  {kValuesList.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => setIsGridOpen(true)}
            disabled={
              !selectedSize ||
              (measConfig === "Before" &&
                kValuesList.length > 0 &&
                !selectedKValue)
            }
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Maximize2 className="w-5 h-5" />
            Open Measurement Grid
          </button>

          {/* Saved List Preview */}
          {savedMeasurements.length > 0 && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-4">
                Saved Measurements
              </h4>
              <div className="space-y-2">
                {savedMeasurements.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {m.size}
                      </span>
                      {m.kValue && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({m.kValue})
                        </span>
                      )}
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Saved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20 animate-fadeIn">
      {/* Tabs Nav */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-center p-2 gap-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              activeTab === "orders"
                ? "bg-indigo-600 text-white"
                : "text-gray-500"
            }`}
          >
            1. Orders
          </button>
          <button
            disabled={!selectedOrder}
            onClick={() => setActiveTab("type")}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              activeTab === "type"
                ? "bg-indigo-600 text-white"
                : "text-gray-500 disabled:opacity-30"
            }`}
          >
            2. Report Type
          </button>
          <button
            disabled={!selectedReport}
            onClick={() => setActiveTab("specs")}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              activeTab === "specs"
                ? "bg-indigo-600 text-white"
                : "text-gray-500 disabled:opacity-30"
            }`}
          >
            3. Measurements
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "orders" && renderOrderTab()}
      {activeTab === "type" && renderTypeTab()}
      {activeTab === "specs" && renderSpecsTab()}

      {/* Grid Modal */}
      <MeasurementGridModal
        isOpen={isGridOpen}
        onClose={() => setIsGridOpen(false)}
        specsData={specsData}
        selectedSize={selectedSize}
        selectedKValue={selectedKValue}
        onSave={(data) => setSavedMeasurements([...savedMeasurements, data])}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </div>
  );
};

export default YPivotQATemplatesMeasurementSelection;
