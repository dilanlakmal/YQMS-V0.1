import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Ruler,
  Palette,
  Layers,
  Table2,
  GitBranch,
  X,
  Hash,
  ClipboardList,
  BarChart3
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config";
import YPivotQAInspectionBuyerDetermination, {
  determineBuyerFromOrderNo
} from "./YPivotQAInspectionBuyerDetermination";

// ============================================================
// Report Type Card Component
// ============================================================
const ReportTypeCard = ({ template, isSelected, onSelect }) => {
  const getMeasurementLabel = (measurement) => {
    switch (measurement) {
      case "Before":
        return { label: "Before", color: "bg-blue-500" };
      case "After":
        return { label: "After", color: "bg-green-500" };
      default:
        return { label: "N/A", color: "bg-gray-400" };
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case "Fixed":
        return { label: "Fixed", color: "bg-purple-500" };
      case "AQL":
        return { label: "AQL", color: "bg-orange-500" };
      default:
        return { label: "N/A", color: "bg-gray-400" };
    }
  };

  const measurement = getMeasurementLabel(template.Measurement);
  const method = getMethodLabel(template.InspectedQtyMethod);

  return (
    <button
      onClick={() => onSelect(template)}
      className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
        isSelected
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg scale-[1.02]"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 hover:shadow-md"
      }`}
    >
      {/* Report Name */}
      <p
        className={`text-sm font-bold mb-2 truncate ${
          isSelected
            ? "text-indigo-700 dark:text-indigo-300"
            : "text-gray-800 dark:text-gray-200"
        }`}
        title={template.ReportType}
      >
        {template.ReportType}
      </p>

      {/* Labels */}
      <div className="flex flex-wrap gap-1">
        <span
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${measurement.color}`}
        >
          {measurement.label}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${method.color}`}
        >
          {method.label}
        </span>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-1 right-1">
          <CheckCircle2 className="w-4 h-4 text-indigo-500" />
        </div>
      )}
    </button>
  );
};

// ============================================================
// Single Select Dropdown Component
// ============================================================
const SingleSelectDropdown = ({
  label,
  icon: Icon,
  options,
  selectedValue,
  onSelectionChange,
  placeholder,
  loading = false,
  displayKey = "label",
  valueKey = "value",
  color = "indigo"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const colorClasses = {
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-200 dark:border-indigo-800"
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800"
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-800"
    }
  };

  const colors = colorClasses[color] || colorClasses.indigo;
  const selectedOption = options.find((opt) => opt[valueKey] === selectedValue);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
        {label}
      </label>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className={`w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <span className={!selectedValue ? "text-gray-400" : ""}>
            {loading
              ? "Loading..."
              : selectedOption
              ? selectedOption[displayKey]
              : placeholder}
          </span>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>

        {isOpen && !loading && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
              {options.map((option) => {
                const isSelected = option[valueKey] === selectedValue;
                return (
                  <button
                    key={option[valueKey]}
                    onClick={() => {
                      onSelectionChange(option[valueKey]);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                      isSelected
                        ? `${colors.bg} ${colors.text}`
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span>{option[displayKey]}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                );
              })}
              {options.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No options available
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Multi-Select Dropdown Component
// ============================================================
const MultiSelectDropdown = ({
  label,
  icon: Icon,
  options,
  selectedValues,
  onSelectionChange,
  placeholder,
  loading = false,
  displayKey = "label",
  valueKey = "value",
  color = "indigo"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const colorClasses = {
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
      text: "text-indigo-600 dark:text-indigo-400",
      hover: "hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      text: "text-emerald-600 dark:text-emerald-400",
      hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      hover: "hover:bg-purple-100 dark:hover:bg-purple-900/50"
    }
  };

  const colors = colorClasses[color] || colorClasses.indigo;

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(options.map((opt) => opt[valueKey]));
    }
  };

  const handleToggle = (value) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
        {label}
      </label>

      {/* Selected Chips */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedValues.map((value) => {
            const option = options.find((opt) => opt[valueKey] === value);
            return (
              <span
                key={value}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}
              >
                {option ? option[displayKey] : value}
                <button
                  onClick={() =>
                    onSelectionChange(selectedValues.filter((v) => v !== value))
                  }
                  className={`p-0.5 rounded-full ${colors.hover}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className={`w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <span className={selectedValues.length === 0 ? "text-gray-400" : ""}>
            {loading
              ? "Loading..."
              : selectedValues.length === 0
              ? placeholder
              : `${selectedValues.length} selected`}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && !loading && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
              <button
                onClick={handleSelectAll}
                className={`w-full px-3 py-2 text-left text-sm font-bold border-b border-gray-200 dark:border-gray-700 ${colors.hover} flex items-center justify-between`}
              >
                <span className={colors.text}>
                  {selectedValues.length === options.length
                    ? "Deselect All"
                    : "Select All"}
                </span>
              </button>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option[valueKey]);
                return (
                  <button
                    key={option[valueKey]}
                    onClick={() => handleToggle(option[valueKey])}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${
                      isSelected
                        ? `${colors.bg} ${colors.text}`
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <span>{option[displayKey]}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================
// AQL Config Table Component
// ============================================================
const AQLConfigTable = ({ aqlConfigs, inspectedQty, buyer }) => {
  if (!aqlConfigs || aqlConfigs.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
        <p className="text-sm text-gray-500">
          No AQL configuration found for {buyer}
        </p>
      </div>
    );
  }

  // Find matching sample data based on inspected qty
  const findMatchingSample = (config) => {
    if (!config?.SampleData || !inspectedQty) return null;
    return config.SampleData.find(
      (sample) => inspectedQty >= sample.Min && inspectedQty <= sample.Max
    );
  };

  const minorConfig = aqlConfigs.find((c) => c.Status === "Minor");
  const majorConfig = aqlConfigs.find((c) => c.Status === "Major");
  const criticalConfig = aqlConfigs.find((c) => c.Status === "Critical");

  const minorSample = findMatchingSample(minorConfig);
  const majorSample = findMatchingSample(majorConfig);
  const criticalSample = findMatchingSample(criticalConfig);

  // Use first config for common info
  const baseConfig = minorConfig || majorConfig || criticalConfig;

  if (!baseConfig) return null;

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-center">
          <p className="text-[9px] text-gray-500 uppercase">Type</p>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {baseConfig.InspectionType}
          </p>
        </div>
        <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-center">
          <p className="text-[9px] text-gray-500 uppercase">Level</p>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {baseConfig.Level}
          </p>
        </div>
        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
          <p className="text-[9px] text-blue-600 uppercase">Minor AQL</p>
          <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
            {minorConfig?.AQLLevel || "N/A"}
          </p>
        </div>
        <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-center">
          <p className="text-[9px] text-orange-600 uppercase">Major AQL</p>
          <p className="text-xs font-bold text-orange-700 dark:text-orange-300">
            {majorConfig?.AQLLevel || "N/A"}
          </p>
        </div>
        <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-center">
          <p className="text-[9px] text-red-600 uppercase">Critical AQL</p>
          <p className="text-xs font-bold text-red-700 dark:text-red-300">
            {criticalConfig?.AQLLevel || "N/A"}
          </p>
        </div>
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-center">
          <p className="text-[9px] text-indigo-600 uppercase">Inspected Qty</p>
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
            {inspectedQty || 0}
          </p>
        </div>
      </div>

      {/* Sample Info */}
      {(minorSample || majorSample || criticalSample) && (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-center">
            <p className="text-[9px] text-purple-600 uppercase">Batch</p>
            <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
              {minorSample?.BatchName || majorSample?.BatchName || "N/A"}
            </p>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-center">
            <p className="text-[9px] text-emerald-600 uppercase">
              Sample Letter
            </p>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {minorSample?.SampleLetter || majorSample?.SampleLetter || "N/A"}
            </p>
          </div>
          <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg text-center">
            <p className="text-[9px] text-cyan-600 uppercase">Sample Size</p>
            <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
              {minorSample?.SampleSize || majorSample?.SampleSize || "N/A"}
            </p>
          </div>
        </div>
      )}

      {/* Ac/Re Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-center text-xs font-bold uppercase">
                Accept (Ac)
              </th>
              <th className="px-3 py-2 text-center text-xs font-bold uppercase">
                Reject (Re)
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Minor */}
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
              <td className="px-3 py-2 font-semibold text-blue-700 dark:text-blue-400">
                Minor
              </td>
              <td className="px-3 py-2 text-center font-bold text-green-600 dark:text-green-400">
                {minorSample?.Ac ?? "—"}
              </td>
              <td className="px-3 py-2 text-center font-bold text-red-600 dark:text-red-400">
                {minorSample?.Re ?? "—"}
              </td>
            </tr>
            {/* Major */}
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-orange-50/50 dark:bg-orange-900/10">
              <td className="px-3 py-2 font-semibold text-orange-700 dark:text-orange-400">
                Major
              </td>
              <td className="px-3 py-2 text-center font-bold text-green-600 dark:text-green-400">
                {majorSample?.Ac ?? "—"}
              </td>
              <td className="px-3 py-2 text-center font-bold text-red-600 dark:text-red-400">
                {majorSample?.Re ?? "—"}
              </td>
            </tr>
            {/* Critical */}
            <tr className="bg-red-50/50 dark:bg-red-900/10">
              <td className="px-3 py-2 font-semibold text-red-700 dark:text-red-400">
                Critical
              </td>
              <td className="px-3 py-2 text-center font-bold text-green-600 dark:text-green-400">
                {criticalSample?.Ac ?? "—"}
              </td>
              <td className="px-3 py-2 text-center font-bold text-red-600 dark:text-red-400">
                {criticalSample?.Re ?? "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {!minorSample && !majorSample && !criticalSample && inspectedQty > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            No matching batch found for inspected qty: {inspectedQty}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
const YPivotQAInspectionReportType = ({
  selectedOrders = [],
  orderData = null,
  orderType = "single"
}) => {
  // State
  const [reportTemplates, setReportTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [lines, setLines] = useState([]);
  const [tables, setTables] = useState([]);
  const [orderColors, setOrderColors] = useState([]);
  const [aqlConfigs, setAqlConfigs] = useState([]);

  // Selection State
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedColors, setSelectedColors] = useState([]);
  const [inspectedQty, setInspectedQty] = useState("");

  // Loading States
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingColors, setLoadingColors] = useState(false);
  const [loadingAql, setLoadingAql] = useState(false);
  const [error, setError] = useState(null);

  // Determine buyer
  const buyer = useMemo(() => {
    if (!selectedOrders?.length) return null;
    return determineBuyerFromOrderNo(selectedOrders[0]).buyer;
  }, [selectedOrders]);

  // Fetch Report Templates
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/qa-sections-templates`);
      if (res.data.success) {
        setReportTemplates(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load report templates");
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  // Fetch Lines
  const fetchLines = useCallback(async () => {
    setLoadingLines(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/qa-sections-lines`);
      if (res.data.success) {
        setLines(res.data.data.filter((line) => line.Active));
      }
    } catch (err) {
      console.error("Error fetching lines:", err);
    } finally {
      setLoadingLines(false);
    }
  }, []);

  // Fetch Tables
  const fetchTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/qa-sections-tables`);
      if (res.data.success) {
        setTables(res.data.data.filter((table) => table.Active));
      }
    } catch (err) {
      console.error("Error fetching tables:", err);
    } finally {
      setLoadingTables(false);
    }
  }, []);

  // Fetch Order Colors
  const fetchOrderColors = useCallback(async () => {
    if (!selectedOrders?.length) {
      setOrderColors([]);
      return;
    }
    setLoadingColors(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/order-colors`,
        { orderNos: selectedOrders }
      );
      if (res.data.success) {
        setOrderColors(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching colors:", err);
    } finally {
      setLoadingColors(false);
    }
  }, [selectedOrders]);

  // Fetch AQL Config
  const fetchAqlConfig = useCallback(async () => {
    if (!buyer || buyer === "Unknown") {
      setAqlConfigs([]);
      return;
    }
    setLoadingAql(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-inspection/aql-config?buyer=${buyer}`
      );
      if (res.data.success) {
        setAqlConfigs(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching AQL config:", err);
      setAqlConfigs([]);
    } finally {
      setLoadingAql(false);
    }
  }, [buyer]);

  // Initial Load
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Fetch AQL when buyer changes
  useEffect(() => {
    fetchAqlConfig();
  }, [fetchAqlConfig]);

  // Fetch data when template changes
  useEffect(() => {
    if (selectedTemplate?.Line === "Yes") fetchLines();
    if (selectedTemplate?.Table === "Yes") fetchTables();
    if (selectedTemplate?.Colors === "Yes") fetchOrderColors();
  }, [selectedTemplate, fetchLines, fetchTables, fetchOrderColors]);

  // Reset selections when template changes
  useEffect(() => {
    setSelectedLine(null);
    setSelectedTable(null);
    setSelectedColors([]);
    // Set inspected qty from template if Fixed
    if (selectedTemplate?.InspectedQtyMethod === "Fixed") {
      setInspectedQty(selectedTemplate.InspectedQty?.toString() || "");
    } else {
      setInspectedQty("");
    }
  }, [selectedTemplate?._id]);

  // Prepare dropdown options
  const lineOptions = useMemo(
    () =>
      lines.map((line) => ({
        value: line._id,
        label: `Line ${line.LineNo}`,
        lineNo: line.LineNo
      })),
    [lines]
  );

  const tableOptions = useMemo(
    () =>
      tables.map((table) => ({
        value: table._id,
        label: `Table ${table.TableNo}`,
        tableNo: table.TableNo
      })),
    [tables]
  );

  const colorOptions = useMemo(
    () =>
      orderColors.map((color) => ({
        value: color.color,
        label: color.color,
        colorCode: color.colorCode
      })),
    [orderColors]
  );

  // Check if selections are required
  const needsLineOrTable =
    selectedTemplate?.Line === "Yes" || selectedTemplate?.Table === "Yes";
  const needsColors = selectedTemplate?.Colors === "Yes";

  // Handle inspected qty change
  const handleInspectedQtyChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setInspectedQty(value);
  };

  // If no orders selected
  if (!selectedOrders?.length) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center">
          <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
            No Order Selected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Please select an order in the "Order" tab first to configure the
            report type.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Customer Info */}
      <YPivotQAInspectionBuyerDetermination
        selectedOrders={selectedOrders}
        orderData={orderData}
        orderType={orderType}
      />

      {/* Report Type Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Report Type
          </h3>
        </div>

        <div className="p-4">
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {reportTemplates.map((template) => (
                <ReportTypeCard
                  key={template._id}
                  template={template}
                  isSelected={selectedTemplate?._id === template._id}
                  onSelect={setSelectedTemplate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Line, Table, Color Selections */}
      {selectedTemplate && (needsLineOrTable || needsColors) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Inspection Selection
            </h3>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Line Selection */}
              {selectedTemplate.Line === "Yes" && (
                <SingleSelectDropdown
                  label="Production Line"
                  icon={GitBranch}
                  options={lineOptions}
                  selectedValue={selectedLine}
                  onSelectionChange={setSelectedLine}
                  placeholder="Select line..."
                  loading={loadingLines}
                  color="indigo"
                />
              )}

              {/* Table Selection */}
              {selectedTemplate.Table === "Yes" && (
                <SingleSelectDropdown
                  label="Inspection Table"
                  icon={Table2}
                  options={tableOptions}
                  selectedValue={selectedTable}
                  onSelectionChange={setSelectedTable}
                  placeholder="Select table..."
                  loading={loadingTables}
                  color="purple"
                />
              )}

              {/* Color Selection */}
              {selectedTemplate.Colors === "Yes" && (
                <MultiSelectDropdown
                  label="Colors"
                  icon={Palette}
                  options={colorOptions}
                  selectedValues={selectedColors}
                  onSelectionChange={setSelectedColors}
                  placeholder="Select colors..."
                  loading={loadingColors}
                  color="emerald"
                />
              )}
            </div>

            {/* Inspected Qty Input */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-500" />
                Inspected Qty
                {selectedTemplate.InspectedQtyMethod === "Fixed" && (
                  <span className="text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 px-1.5 py-0.5 rounded ml-1">
                    Fixed
                  </span>
                )}
                {selectedTemplate.InspectedQtyMethod === "AQL" && (
                  <span className="text-[9px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-1.5 py-0.5 rounded ml-1">
                    AQL
                  </span>
                )}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inspectedQty}
                onChange={handleInspectedQtyChange}
                placeholder="Enter inspected qty..."
                className="w-full sm:w-48 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {selectedTemplate.InspectedQtyMethod === "Fixed" &&
                selectedTemplate.InspectedQty > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Default: {selectedTemplate.InspectedQty} pcs
                  </p>
                )}
            </div>
          </div>
        </div>
      )}

      {/* AQL Configuration Table */}
      {selectedTemplate && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              AQL Configuration
            </h3>
          </div>

          <div className="p-4">
            {loadingAql ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : (
              <AQLConfigTable
                aqlConfigs={aqlConfigs}
                inspectedQty={parseInt(inspectedQty) || 0}
                buyer={buyer}
              />
            )}
          </div>
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
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionReportType;
