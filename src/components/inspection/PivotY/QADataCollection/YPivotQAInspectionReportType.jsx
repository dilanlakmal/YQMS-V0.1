import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Palette,
  Layers,
  Table2,
  GitBranch,
  X,
  Hash,
  BarChart3,
  Box,
  Building,
  Factory,
  Truck,
  MessageSquare,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config";
import YPivotQAInspectionBuyerDetermination, {
  determineBuyerFromOrderNo
} from "./YPivotQAInspectionBuyerDetermination";

// ============================================================
// Smart Sorting Function for Line/Table Numbers
// ============================================================
const smartSort = (a, b) => {
  const aVal = a.label || a;
  const bVal = b.label || b;

  // Check if both are pure numbers
  const aNum = parseFloat(aVal);
  const bNum = parseFloat(bVal);

  if (!isNaN(aNum) && !isNaN(bNum)) {
    return aNum - bNum;
  }

  // Check if both are pure letters (single or multiple)
  const aIsLetter = /^[A-Za-z]+$/.test(aVal);
  const bIsLetter = /^[A-Za-z]+$/.test(bVal);

  if (aIsLetter && bIsLetter) {
    return aVal.localeCompare(bVal);
  }

  // Alphanumeric sorting (e.g., CK1, CK2, CK10)
  const aMatch = aVal.match(/^([A-Za-z]*)(\d*)$/);
  const bMatch = bVal.match(/^([A-Za-z]*)(\d*)$/);

  if (aMatch && bMatch) {
    const aPrefix = aMatch[1];
    const bPrefix = bMatch[1];
    const aNumPart = parseInt(aMatch[2]) || 0;
    const bNumPart = parseInt(bMatch[2]) || 0;

    if (aPrefix !== bPrefix) {
      return aPrefix.localeCompare(bPrefix);
    }
    return aNumPart - bNumPart;
  }

  // Default string comparison
  return String(aVal).localeCompare(String(bVal));
};

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
      className={`relative w-full p-3 rounded-xl border-2 transition-all text-left ${
        isSelected
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg scale-[1.02]"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 hover:shadow-md"
      }`}
    >
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
      {isSelected && (
        <div className="absolute top-1 right-1">
          <CheckCircle2 className="w-4 h-4 text-indigo-500" />
        </div>
      )}
    </button>
  );
};

// ============================================================
// Searchable Multi Select Dropdown Component
// ============================================================
const SearchableMultiSelect = ({
  label,
  icon: Icon,
  options,
  selectedValues,
  onSelectionChange,
  placeholder,
  loading = false,
  disabled = false,
  displayKey = "label",
  valueKey = "value",
  color = "indigo"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Sort and filter options
  const sortedAndFilteredOptions = useMemo(() => {
    let filtered = options;
    if (searchTerm) {
      filtered = options.filter((opt) =>
        String(opt[displayKey]).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return [...filtered].sort((a, b) => smartSort(a, b));
  }, [options, searchTerm, displayKey]);

  const handleSelectAll = () => {
    if (selectedValues.length === sortedAndFilteredOptions.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(sortedAndFilteredOptions.map((opt) => opt[valueKey]));
    }
  };

  const handleToggle = (value) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const handleRemove = (value, e) => {
    e.stopPropagation();
    onSelectionChange(selectedValues.filter((v) => v !== value));
  };

  // Get display labels for selected values (sorted)
  const selectedLabels = useMemo(() => {
    return selectedValues
      .map((val) => {
        const opt = options.find((o) => o[valueKey] === val);
        return opt ? opt[displayKey] : val;
      })
      .sort(smartSort);
  }, [selectedValues, options, displayKey, valueKey]);

  if (disabled) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-gray-400" />
          {label}
        </label>
        <div className="px-3 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-400">
          N/A
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
        {label}
      </label>

      {/* Selected Chips */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLabels.map((label, idx) => {
            const value = selectedValues.find((v) => {
              const opt = options.find((o) => o[valueKey] === v);
              return opt && opt[displayKey] === label;
            });
            return (
              <span
                key={idx}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}
              >
                {label}
                <button
                  onClick={(e) => handleRemove(value, e)}
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
        <div
          onClick={() => !loading && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer ${
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
        </div>

        {isOpen && !loading && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="max-h-48 overflow-y-auto">
                {/* Select All */}
                <button
                  onClick={handleSelectAll}
                  className={`w-full px-3 py-2 text-left text-sm font-bold border-b border-gray-200 dark:border-gray-700 ${colors.hover} flex items-center justify-between`}
                >
                  <span className={colors.text}>
                    {selectedValues.length === sortedAndFilteredOptions.length
                      ? "Deselect All"
                      : "Select All"}
                  </span>
                  {selectedValues.length ===
                    sortedAndFilteredOptions.length && (
                    <CheckCircle2 className={`w-4 h-4 ${colors.text}`} />
                  )}
                </button>

                {sortedAndFilteredOptions.map((option) => {
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

                {sortedAndFilteredOptions.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? "No matches found" : "No options available"}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Searchable Single Select Dropdown Component
// ============================================================
const SearchableSingleSelect = ({
  label,
  icon: Icon,
  options,
  selectedValue,
  onSelectionChange,
  placeholder,
  loading = false,
  disabled = false,
  displayKey = "label",
  valueKey = "value",
  color = "indigo"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const colorClasses = {
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
      text: "text-indigo-600 dark:text-indigo-400"
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400"
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-900/30",
      text: "text-amber-600 dark:text-amber-400"
    }
  };

  const colors = colorClasses[color] || colorClasses.indigo;

  // Sort and filter options
  const sortedAndFilteredOptions = useMemo(() => {
    let filtered = options;
    if (searchTerm) {
      filtered = options.filter((opt) =>
        String(opt[displayKey]).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return [...filtered].sort((a, b) => smartSort(a, b));
  }, [options, searchTerm, displayKey]);

  const selectedOption = options.find((opt) => opt[valueKey] === selectedValue);

  const handleSelect = (option) => {
    onSelectionChange(option[valueKey]);
    setSearchTerm("");
    setIsOpen(false);
  };

  if (disabled) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-gray-400" />
          {label}
        </label>
        <div className="px-3 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-400">
          N/A
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
        {label}
      </label>

      {/* Selected Chip */}
      {selectedOption && !isOpen && (
        <div className="flex items-center gap-1">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}
          >
            {selectedOption[displayKey]}
            <button
              onClick={() => onSelectionChange(null)}
              className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={
            isOpen
              ? searchTerm
              : selectedOption
              ? selectedOption[displayKey]
              : ""
          }
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          placeholder={placeholder}
          disabled={loading}
          className={`w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        ) : (
          <ChevronDown
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform pointer-events-none ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}

        {isOpen && !loading && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setIsOpen(false);
                setSearchTerm("");
              }}
            />
            <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
              {sortedAndFilteredOptions.length > 0 ? (
                sortedAndFilteredOptions.map((option) => {
                  const isSelected = option[valueKey] === selectedValue;
                  return (
                    <button
                      key={option[valueKey]}
                      onClick={() => handleSelect(option)}
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
                })
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  {searchTerm ? "No matches found" : "No options available"}
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
// Toggle Switch Component
// ============================================================
const ToggleSwitch = ({ label, value, onChange, disabled = false }) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${value ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
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

  const baseConfig = minorConfig || majorConfig || criticalConfig;

  if (!baseConfig) return null;

  return (
    <div className="space-y-4">
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
  orderType = "single",
  onReportDataChange
}) => {
  // State
  const [reportTemplates, setReportTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [lines, setLines] = useState([]);
  const [tables, setTables] = useState([]);
  const [orderColors, setOrderColors] = useState([]);
  const [aqlConfigs, setAqlConfigs] = useState([]);
  const [subConFactories, setSubConFactories] = useState([]);

  // Selection State
  const [selectedLines, setSelectedLines] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [inspectedQty, setInspectedQty] = useState("");
  const [cartonQty, setCartonQty] = useState("");

  // Supplier State
  const [isSubCon, setIsSubCon] = useState(false);
  const [selectedSubConFactory, setSelectedSubConFactory] = useState(null);

  // Shipping Stage (only for AQL)
  const [shippingStage, setShippingStage] = useState(null);

  // Remarks
  const [remarks, setRemarks] = useState("");

  // Loading States
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingColors, setLoadingColors] = useState(false);
  const [loadingAql, setLoadingAql] = useState(false);
  const [loadingSubConFactories, setLoadingSubConFactories] = useState(false);
  const [error, setError] = useState(null);

  // Shipping Stage Options
  const shippingStageOptions = [
    { value: "D1", label: "D1" },
    { value: "D2", label: "D2" },
    { value: "D3", label: "D3" },
    { value: "D4", label: "D4" },
    { value: "D5", label: "D5" }
  ];

  // Check if this is First output Carton report
  const isFirstOutputCarton = useMemo(() => {
    return selectedTemplate?.ReportType?.toLowerCase().includes(
      "first output carton"
    );
  }, [selectedTemplate]);

  // Check if AQL method
  const isAQLMethod = useMemo(() => {
    return selectedTemplate?.InspectedQtyMethod === "AQL";
  }, [selectedTemplate]);

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

  // Fetch Lines (YM Lines)
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

  // Fetch Sub-Con Factories
  const fetchSubConFactories = useCallback(async () => {
    setLoadingSubConFactories(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-inspection/subcon-factories`
      );
      if (res.data.success) {
        setSubConFactories(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching sub-con factories:", err);
    } finally {
      setLoadingSubConFactories(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchTemplates();
    fetchSubConFactories();
  }, [fetchTemplates, fetchSubConFactories]);

  // Fetch AQL when buyer changes
  useEffect(() => {
    fetchAqlConfig();
  }, [fetchAqlConfig]);

  // Fetch data when template changes
  useEffect(() => {
    if (selectedTemplate?.Line === "Yes" && !isSubCon) fetchLines();
    if (selectedTemplate?.Table === "Yes" && !isSubCon) fetchTables();
    if (selectedTemplate?.Colors === "Yes") fetchOrderColors();
  }, [selectedTemplate, isSubCon, fetchLines, fetchTables, fetchOrderColors]);

  // Reset selections when template changes
  useEffect(() => {
    setSelectedLines([]);
    setSelectedTables([]);
    setSelectedColors([]);
    setCartonQty("");
    setShippingStage(null);
    setRemarks("");
    if (selectedTemplate?.InspectedQtyMethod === "Fixed") {
      setInspectedQty(selectedTemplate.InspectedQty?.toString() || "");
    } else {
      setInspectedQty("");
    }
  }, [selectedTemplate?._id]);

  // Reset line selection when sub-con changes
  useEffect(() => {
    setSelectedLines([]);
    setSelectedTables([]);
    if (!isSubCon) {
      setSelectedSubConFactory(null);
      if (selectedTemplate?.Line === "Yes") fetchLines();
      if (selectedTemplate?.Table === "Yes") fetchTables();
    }
  }, [isSubCon, selectedTemplate, fetchLines, fetchTables]);

  useEffect(() => {
    if (onReportDataChange) {
      onReportDataChange({
        selectedTemplate,
        // You can pass other derived state here if needed for other tabs
        config: {
          selectedLines,
          selectedTables,
          selectedColors,
          inspectedQty,
          cartonQty,
          isSubCon,
          selectedSubConFactory,
          shippingStage,
          remarks
        }
      });
    }
  }, [
    selectedTemplate,
    selectedLines,
    selectedTables,
    selectedColors,
    inspectedQty,
    cartonQty,
    isSubCon,
    selectedSubConFactory,
    shippingStage,
    remarks,
    onReportDataChange
  ]);

  // Prepare dropdown options
  const lineOptions = useMemo(() => {
    if (isSubCon && selectedSubConFactory) {
      const factory = subConFactories.find(
        (f) => f._id === selectedSubConFactory
      );
      if (factory?.lineList) {
        return factory.lineList.map((line) => ({
          value: line,
          label: line
        }));
      }
      return [];
    }
    return lines.map((line) => ({
      value: line._id,
      label: line.LineNo
    }));
  }, [lines, isSubCon, selectedSubConFactory, subConFactories]);

  const tableOptions = useMemo(() => {
    return tables.map((table) => ({
      value: table._id,
      label: table.TableNo
    }));
  }, [tables]);

  const colorOptions = useMemo(() => {
    return orderColors.map((color) => ({
      value: color.color,
      label: color.color,
      colorCode: color.colorCode
    }));
  }, [orderColors]);

  const subConFactoryOptions = useMemo(() => {
    return subConFactories.map((factory) => ({
      value: factory._id,
      label: factory.factory_second_name
        ? `${factory.factory} (${factory.factory_second_name})`
        : factory.factory
    }));
  }, [subConFactories]);

  // Check if selections are required
  const needsLineOrTable =
    selectedTemplate?.Line === "Yes" || selectedTemplate?.Table === "Yes";
  const needsColors = selectedTemplate?.Colors === "Yes";

  // Handle input changes
  const handleInspectedQtyChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setInspectedQty(value);
  };

  const handleCartonQtyChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setCartonQty(value);
  };

  const handleRemarksChange = (e) => {
    const value = e.target.value.slice(0, 250);
    setRemarks(value);
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

      {/* Inspection Selection */}
      {selectedTemplate && (needsLineOrTable || needsColors) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Inspection Selection
            </h3>
          </div>

          <div className="p-4 space-y-6">
            {/* Supplier Section */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Supplier
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Supplier (YM - Fixed) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Supplier
                  </label>
                  <div className="px-3 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-bold text-indigo-700 dark:text-indigo-300">
                    YM
                  </div>
                </div>

                {/* Sub-Con Toggle */}
                <div className="flex items-end pb-1">
                  <div className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Sub-Con
                    </span>
                    <button
                      onClick={() => setIsSubCon(!isSubCon)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isSubCon
                          ? "bg-indigo-600"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isSubCon ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-xs font-bold ${
                        isSubCon ? "text-indigo-600" : "text-gray-500"
                      }`}
                    >
                      {isSubCon ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {/* Sub-Con Factory Selection */}
                {isSubCon && (
                  <div className="sm:col-span-2">
                    <SearchableSingleSelect
                      label="Sub-Con Factory"
                      icon={Factory}
                      options={subConFactoryOptions}
                      selectedValue={selectedSubConFactory}
                      onSelectionChange={setSelectedSubConFactory}
                      placeholder="Select factory..."
                      loading={loadingSubConFactories}
                      color="amber"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Line, Table, Color Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Line Selection - Multi Select */}
              {selectedTemplate.Line === "Yes" && (
                <SearchableMultiSelect
                  label="Production Line(s)"
                  icon={GitBranch}
                  options={lineOptions}
                  selectedValues={selectedLines}
                  onSelectionChange={setSelectedLines}
                  placeholder={
                    isSubCon && !selectedSubConFactory
                      ? "Select factory first..."
                      : "Select lines..."
                  }
                  loading={loadingLines}
                  disabled={isSubCon && !selectedSubConFactory}
                  color="indigo"
                />
              )}

              {/* Table Selection - Multi Select (Disabled if Sub-Con) */}
              {selectedTemplate.Table === "Yes" && (
                <SearchableMultiSelect
                  label="Inspection Table(s)"
                  icon={Table2}
                  options={tableOptions}
                  selectedValues={selectedTables}
                  onSelectionChange={setSelectedTables}
                  placeholder="Select tables..."
                  loading={loadingTables}
                  disabled={isSubCon}
                  color="purple"
                />
              )}

              {/* Color Selection - Multi Select */}
              {selectedTemplate.Colors === "Yes" && (
                <SearchableMultiSelect
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

            {/* Carton Qty - Only for First output Carton */}
            {isFirstOutputCarton && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-amber-500" />
                  Carton Qty
                  <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-1.5 py-0.5 rounded ml-1">
                    Required
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={cartonQty}
                  onChange={handleCartonQtyChange}
                  placeholder="Enter carton qty..."
                  className="w-full sm:w-48 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Inspected Qty Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
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
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {selectedTemplate.InspectedQtyMethod === "Fixed" &&
                  selectedTemplate.InspectedQty > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Default: {selectedTemplate.InspectedQty} pcs
                    </p>
                  )}
              </div>

              {/* Shipping Stage - Only for AQL */}
              {isAQLMethod && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-cyan-500" />
                    Shipping Stage
                  </label>
                  <div className="relative">
                    <select
                      value={shippingStage || ""}
                      onChange={(e) => setShippingStage(e.target.value || null)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none"
                    >
                      <option value="">Select stage...</option>
                      {shippingStageOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Remarks Section */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                Remarks
                <span className="text-[9px] text-gray-400 ml-1">
                  ({remarks.length}/250)
                </span>
              </label>
              <textarea
                value={remarks}
                onChange={handleRemarksChange}
                placeholder="Enter any remarks or notes..."
                maxLength={250}
                rows={3}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
              />
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
