import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Settings,
  Ruler,
  Camera,
  FileCheck,
  Palette,
  Layers,
  Table2,
  GitBranch,
  Plus,
  X,
  Info,
  Building2,
  ShoppingBag,
  Tag
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config";
import YPivotQAInspectionBuyerDetermination from "./YPivotQAInspectionBuyerDetermination";

// ============================================================
// Specification Badge Component
// ============================================================
const SpecBadge = ({ type }) => {
  const config = {
    Before: {
      label: "Before Wash",
      bgClass: "bg-blue-100 dark:bg-blue-900/30",
      textClass: "text-blue-600 dark:text-blue-400",
      icon: Ruler
    },
    After: {
      label: "After Wash",
      bgClass: "bg-green-100 dark:bg-green-900/30",
      textClass: "text-green-600 dark:text-green-400",
      icon: Ruler
    },
    No: {
      label: "No Measurement",
      bgClass: "bg-gray-100 dark:bg-gray-800",
      textClass: "text-gray-500 dark:text-gray-400",
      icon: Ruler
    }
  };

  const specConfig = config[type] || config.No;
  const Icon = specConfig.icon;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${specConfig.bgClass}`}
    >
      <Icon className={`w-3.5 h-3.5 ${specConfig.textClass}`} />
      <span className={`text-xs font-bold ${specConfig.textClass}`}>
        {specConfig.label}
      </span>
    </div>
  );
};

// ============================================================
// Section Toggle Badge
// ============================================================
const SectionBadge = ({ label, enabled, icon: Icon }) => {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
        enabled
          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
      }`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
      {enabled ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <X className="w-3 h-3" />
      )}
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
      border: "border-indigo-200 dark:border-indigo-800",
      hover: "hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-800",
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

  const handleRemove = (value) => {
    onSelectionChange(selectedValues.filter((v) => v !== value));
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
        {label}
      </label>

      {/* Selected Items Chips */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedValues.map((value) => {
            const option = options.find((opt) => opt[valueKey] === value);
            return (
              <div
                key={value}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}
              >
                <span>{option ? option[displayKey] : value}</span>
                <button
                  onClick={() => handleRemove(value)}
                  className={`p-0.5 rounded-full ${colors.hover} transition-colors`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropdown */}
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
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
            {/* Select All Option */}
            <button
              onClick={handleSelectAll}
              className={`w-full px-3 py-2 text-left text-sm font-bold border-b border-gray-200 dark:border-gray-700 ${colors.hover} transition-colors flex items-center justify-between`}
            >
              <span className={colors.text}>
                {selectedValues.length === options.length
                  ? "Deselect All"
                  : "Select All"}
              </span>
              {selectedValues.length === options.length && (
                <CheckCircle2 className={`w-4 h-4 ${colors.text}`} />
              )}
            </button>

            {/* Options */}
            {options.map((option) => {
              const isSelected = selectedValues.includes(option[valueKey]);
              return (
                <button
                  key={option[valueKey]}
                  onClick={() => handleToggle(option[valueKey])}
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
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
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

  // Selection State
  const [selectedLines, setSelectedLines] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);

  // Loading States
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingColors, setLoadingColors] = useState(false);
  const [error, setError] = useState(null);

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
    if (!selectedOrders || selectedOrders.length === 0) {
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

  // Initial Load
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Fetch lines/tables when template requires them
  useEffect(() => {
    if (selectedTemplate?.Line === "Yes") {
      fetchLines();
    }
    if (selectedTemplate?.Table === "Yes") {
      fetchTables();
    }
    if (selectedTemplate?.Colors === "Yes") {
      fetchOrderColors();
    }
  }, [selectedTemplate, fetchLines, fetchTables, fetchOrderColors]);

  // Reset selections when template changes
  useEffect(() => {
    setSelectedLines([]);
    setSelectedTables([]);
    setSelectedColors([]);
  }, [selectedTemplate?._id]);

  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    const template = reportTemplates.find((t) => t._id === templateId);
    setSelectedTemplate(template || null);
  };

  // Prepare dropdown options
  const lineOptions = useMemo(() => {
    return lines.map((line) => ({
      value: line._id,
      label: `Line ${line.LineNo}`,
      description: line.Description,
      type: line.Type
    }));
  }, [lines]);

  const tableOptions = useMemo(() => {
    return tables.map((table) => ({
      value: table._id,
      label: `Table ${table.TableNo}`,
      description: table.Description,
      type: table.Type
    }));
  }, [tables]);

  const colorOptions = useMemo(() => {
    return orderColors.map((color) => ({
      value: color.color,
      label: color.color,
      colorCode: color.colorCode
    }));
  }, [orderColors]);

  // If no orders selected, show message
  if (!selectedOrders || selectedOrders.length === 0) {
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
      {/* Buyer Determination */}
      <YPivotQAInspectionBuyerDetermination
        selectedOrders={selectedOrders}
        orderData={orderData}
        orderType={orderType}
      />

      {/* Report Type Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Report Type Configuration
          </h3>
          {selectedTemplate && (
            <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
              {selectedTemplate.ReportType}
            </span>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Report Type Dropdown */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-purple-500" />
              Select Report Type
            </label>
            <select
              value={selectedTemplate?._id || ""}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              disabled={loadingTemplates}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="">-- Select Report Type --</option>
              {reportTemplates.map((template) => (
                <option key={template._id} value={template._id}>
                  {template.ReportType}
                </option>
              ))}
            </select>
          </div>

          {/* Template Configuration Display */}
          {selectedTemplate && (
            <div className="space-y-4 animate-fadeIn">
              {/* Measurement Spec */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Measurement Specification
                </p>
                <SpecBadge type={selectedTemplate.Measurement} />
              </div>

              {/* Section Toggles */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Available Sections
                </p>
                <div className="flex flex-wrap gap-2">
                  <SectionBadge
                    label="Header"
                    enabled={selectedTemplate.Header === "Yes"}
                    icon={FileText}
                  />
                  <SectionBadge
                    label="Photos"
                    enabled={selectedTemplate.Photos === "Yes"}
                    icon={Camera}
                  />
                  <SectionBadge
                    label="Line"
                    enabled={selectedTemplate.Line === "Yes"}
                    icon={GitBranch}
                  />
                  <SectionBadge
                    label="Table"
                    enabled={selectedTemplate.Table === "Yes"}
                    icon={Table2}
                  />
                  <SectionBadge
                    label="Colors"
                    enabled={selectedTemplate.Colors === "Yes"}
                    icon={Palette}
                  />
                  <SectionBadge
                    label="Quality Plan"
                    enabled={selectedTemplate.QualityPlan === "Yes"}
                    icon={Settings}
                  />
                  <SectionBadge
                    label="Conclusion"
                    enabled={selectedTemplate.Conclusion === "Yes"}
                    icon={CheckCircle2}
                  />
                </div>
              </div>

              {/* Inspected Qty Method */}
              {selectedTemplate.InspectedQtyMethod !== "NA" && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                        Inspected Qty Method:{" "}
                        {selectedTemplate.InspectedQtyMethod}
                      </p>
                      {selectedTemplate.InspectedQtyMethod === "Fixed" && (
                        <p className="text-xs text-blue-600 dark:text-blue-500">
                          Fixed Qty: {selectedTemplate.InspectedQty} pcs
                        </p>
                      )}
                    </div>
                    <Info className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Line, Table, Color Selections */}
      {selectedTemplate && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Inspection Selection
            </h3>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Line Selection */}
              {selectedTemplate.Line === "Yes" && (
                <MultiSelectDropdown
                  label="Production Lines"
                  icon={GitBranch}
                  options={lineOptions}
                  selectedValues={selectedLines}
                  onSelectionChange={setSelectedLines}
                  placeholder="Select lines..."
                  loading={loadingLines}
                  displayKey="label"
                  valueKey="value"
                  color="indigo"
                />
              )}

              {/* Table Selection */}
              {selectedTemplate.Table === "Yes" && (
                <MultiSelectDropdown
                  label="Inspection Tables"
                  icon={Table2}
                  options={tableOptions}
                  selectedValues={selectedTables}
                  onSelectionChange={setSelectedTables}
                  placeholder="Select tables..."
                  loading={loadingTables}
                  displayKey="label"
                  valueKey="value"
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
                  displayKey="label"
                  valueKey="value"
                  color="emerald"
                />
              )}
            </div>

            {/* No Selection Options Message */}
            {selectedTemplate.Line === "No" &&
              selectedTemplate.Table === "No" &&
              selectedTemplate.Colors === "No" && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No Line, Table, or Color selection required for this report
                    type.
                  </p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedTemplate && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Configuration Summary
            </h3>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Report Type
                </p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                  {selectedTemplate.ReportType}
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Lines
                </p>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedTemplate.Line === "Yes"
                    ? selectedLines.length
                    : "N/A"}
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Tables
                </p>
                <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {selectedTemplate.Table === "Yes"
                    ? selectedTables.length
                    : "N/A"}
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Colors
                </p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedTemplate.Colors === "Yes"
                    ? selectedColors.length
                    : "N/A"}
                </p>
              </div>
            </div>
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
