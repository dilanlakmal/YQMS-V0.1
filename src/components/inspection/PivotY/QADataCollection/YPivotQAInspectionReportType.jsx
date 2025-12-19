import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  X,
  Hash,
  BarChart3,
  Box,
  Building,
  Factory,
  Truck,
  MessageSquare,
  Layers
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config";
import YPivotQAInspectionBuyerDetermination, {
  determineBuyerFromOrderNo
} from "./YPivotQAInspectionBuyerDetermination";

// ReportTypeCard (Unchanged)
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

// SearchableSingleSelect (Unchanged)
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
    amber: {
      bg: "bg-amber-50 dark:bg-amber-900/30",
      text: "text-amber-600 dark:text-amber-400"
    }
  };

  const colors = colorClasses[color] || colorClasses.indigo;

  const sortedOptions = useMemo(() => {
    let filtered = options;
    if (searchTerm) {
      filtered = options.filter((opt) =>
        String(opt[displayKey]).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [options, searchTerm, displayKey]);

  const selectedOption = options.find((opt) => opt[valueKey] === selectedValue);

  const handleSelect = (option, e) => {
    e.stopPropagation();
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
          onClick={(e) => {
            e.stopPropagation();
            if (!isOpen) {
              setIsOpen(true);
              setSearchTerm("");
            }
          }}
          placeholder={placeholder}
          disabled={loading}
          readOnly={!isOpen && !!selectedOption}
          className={`w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer ${
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
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                setSearchTerm("");
              }}
            />
            <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
              {sortedOptions.length > 0 ? (
                sortedOptions.map((option) => {
                  const isSelected = option[valueKey] === selectedValue;
                  return (
                    <button
                      key={option[valueKey]}
                      onClick={(e) => handleSelect(option, e)}
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

// AQLConfigTable (Unchanged)
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
  onReportDataChange,
  savedState = {},
  shippingStages = []
}) => {
  const [reportTemplates, setReportTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(
    savedState?.selectedTemplate || null
  );

  // Configuration State
  const [inspectedQty, setInspectedQty] = useState(
    savedState?.config?.inspectedQty || ""
  );
  const [cartonQty, setCartonQty] = useState(
    savedState?.config?.cartonQty || ""
  );
  const [shippingStage, setShippingStage] = useState(
    savedState?.config?.shippingStage || null
  );
  const [remarks, setRemarks] = useState(savedState?.config?.remarks || "");

  // Supplier State
  const [isSubCon, setIsSubCon] = useState(
    savedState?.config?.isSubCon || false
  );
  const [selectedSubConFactory, setSelectedSubConFactory] = useState(
    savedState?.config?.selectedSubConFactory || null
  );

  // Product Type State
  const [selectedProductTypeId, setSelectedProductTypeId] = useState(
    savedState?.config?.productTypeId || null
  );

  // Data State
  const [aqlConfigs, setAqlConfigs] = useState([]);
  const [subConFactories, setSubConFactories] = useState([]);

  // Loading States
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingAql, setLoadingAql] = useState(false);
  const [loadingSubConFactories, setLoadingSubConFactories] = useState(false);
  const [error, setError] = useState(null);

  // Determine buyer
  const buyer = useMemo(() => {
    if (!selectedOrders?.length) return null;
    return determineBuyerFromOrderNo(selectedOrders[0]).buyer;
  }, [selectedOrders]);

  // Determine Total Order Qty for Validation
  const maxOrderQty = useMemo(() => {
    return orderData?.dtOrder?.totalQty || 0;
  }, [orderData]);

  // --- Calculations ---

  // Calculate the actual AQL Sample Size based on the Inspected Qty (Lot Size)
  const aqlSampleSize = useMemo(() => {
    if (!aqlConfigs || aqlConfigs.length === 0 || !inspectedQty) return 0;

    // Usually standardizing on one config (e.g., Major) to get sample size from the table
    // Adjust logic if your AQL config structure differs
    const majorConfig =
      aqlConfigs.find((c) => c.Status === "Major") ||
      aqlConfigs.find((c) => c.Status === "Minor");
    if (!majorConfig?.SampleData) return 0;

    const qty = parseInt(inspectedQty);
    const sample = majorConfig.SampleData.find(
      (s) => qty >= s.Min && qty <= s.Max
    );

    return sample ? sample.SampleSize : 0;
  }, [aqlConfigs, inspectedQty]);

  // --- Effects ---

  // Fetch Report Templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/qa-sections-templates`
        );
        if (res.data.success) {
          setReportTemplates(res.data.data);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load report templates");
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // Fetch Sub-Con Factories
  useEffect(() => {
    const fetchSubConFactories = async () => {
      setLoadingSubConFactories(true);
      try {
        // Use the sub con sewing old management endpoint
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage`
        );

        if (Array.isArray(res.data)) {
          setSubConFactories(res.data);
        }
      } catch (err) {
        console.error("Error fetching subcon factories", err);
      } finally {
        setLoadingSubConFactories(false);
      }
    };
    fetchSubConFactories();
  }, []);

  // Fetch AQL Config
  useEffect(() => {
    if (!buyer || buyer === "Unknown") {
      setAqlConfigs([]);
      return;
    }
    const fetchAqlConfig = async () => {
      setLoadingAql(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/aql-config?buyer=${buyer}`
        );
        if (res.data.success) {
          setAqlConfigs(res.data.data);
        }
      } catch (err) {
        console.error(err);
        setAqlConfigs([]);
      } finally {
        setLoadingAql(false);
      }
    };
    fetchAqlConfig();
  }, [buyer]);

  // Reset factory if not subcon
  useEffect(() => {
    if (!isSubCon) setSelectedSubConFactory(null);
  }, [isSubCon]);

  // Logic: Reset and Auto-fill Inputs based on Template
  useEffect(() => {
    if (!selectedTemplate) return;

    const savedId = savedState?.selectedTemplate?._id;
    const currentId = selectedTemplate._id;
    const isRestoring = savedId === currentId;

    if (selectedTemplate.InspectedQtyMethod === "AQL") {
      // If switching TO an AQL template (not restoring), clear the input.
      if (!isRestoring) {
        setInspectedQty("");
      }
    } else {
      // Fixed / NA Method
      if (!isRestoring) {
        setInspectedQty(selectedTemplate.InspectedQty?.toString() || "");
      } else {
        if (inspectedQty === "" && selectedTemplate.InspectedQty) {
          setInspectedQty(selectedTemplate.InspectedQty.toString());
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?._id]);

  // --- NEW: Calculate Full AQL Configuration Object ---
  const calculatedAqlConfig = useMemo(() => {
    // Return null if not AQL or no configs loaded
    if (!aqlConfigs || aqlConfigs.length === 0 || !inspectedQty) return null;

    const qty = parseInt(inspectedQty);
    if (isNaN(qty) || qty <= 0) return null;

    // Helper to find sample row for a config
    const getSampleRow = (config) => {
      if (!config?.SampleData) return null;
      return config.SampleData.find((s) => qty >= s.Min && qty <= s.Max);
    };

    const minorConfig = aqlConfigs.find((c) => c.Status === "Minor");
    const majorConfig = aqlConfigs.find((c) => c.Status === "Major");
    const criticalConfig = aqlConfigs.find((c) => c.Status === "Critical");

    const minorSample = getSampleRow(minorConfig);
    const majorSample = getSampleRow(majorConfig);
    const criticalSample = getSampleRow(criticalConfig);

    // If no matching batch found (e.g. qty too high or low), return null
    if (!minorSample && !majorSample && !criticalSample) return null;

    // Use one of the found samples for common data (Batch, Letter, Size)
    const baseSample = minorSample || majorSample || criticalSample;
    const baseConfig = minorConfig || majorConfig || criticalConfig;

    const items = [];
    if (minorConfig && minorSample) {
      items.push({
        status: "Minor",
        ac: minorSample.Ac,
        re: minorSample.Re,
        aqlLevel: minorConfig.AQLLevel
      });
    }
    if (majorConfig && majorSample) {
      items.push({
        status: "Major",
        ac: majorSample.Ac,
        re: majorSample.Re,
        aqlLevel: majorConfig.AQLLevel
      });
    }
    if (criticalConfig && criticalSample) {
      items.push({
        status: "Critical",
        ac: criticalSample.Ac,
        re: criticalSample.Re,
        aqlLevel: criticalConfig.AQLLevel
      });
    }

    return {
      inspectionType: baseConfig?.InspectionType || "General",
      level: baseConfig?.Level || "II",

      // Top level Float values
      minorAQL: minorConfig?.AQLLevel || 0,
      majorAQL: majorConfig?.AQLLevel || 0,
      criticalAQL: criticalConfig?.AQLLevel || 0,

      inspectedQty: qty,
      batch: baseSample?.BatchName || "",
      sampleLetter: baseSample?.SampleLetter || "",
      sampleSize: baseSample?.SampleSize || 0,

      items: items
    };
  }, [aqlConfigs, inspectedQty]);

  // Pass data to parent including calculated AQL Sample Size
  useEffect(() => {
    if (onReportDataChange) {
      onReportDataChange({
        selectedTemplate,
        config: {
          inspectedQty, // This is user input Lot Size
          aqlConfig: calculatedAqlConfig,
          aqlSampleSize: calculatedAqlConfig?.sampleSize || 0,
          //aqlSampleSize, // This is the calculated Sample Size for AQL
          cartonQty,
          isSubCon,
          selectedSubConFactory,
          shippingStage,
          remarks,
          productTypeId: selectedProductTypeId // <--- FIX 4: Pass ID to parent config
        }
      });
    }
  }, [
    selectedTemplate,
    inspectedQty,
    calculatedAqlConfig,
    aqlSampleSize,
    cartonQty,
    isSubCon,
    selectedSubConFactory,
    shippingStage,
    remarks,
    selectedProductTypeId, // Dependency
    onReportDataChange
  ]);

  const subConFactoryOptions = useMemo(() => {
    return subConFactories.map((factory) => ({
      value: factory._id, // This ID is what gets saved into config.selectedSubConFactory
      label: factory.factory_second_name
        ? `${factory.factory} (${factory.factory_second_name})`
        : factory.factory
    }));
  }, [subConFactories]);

  const shippingStageOptions = useMemo(() => {
    // Sort by 'no' to ensure correct order
    const sorted = [...shippingStages].sort((a, b) => a.no - b.no);

    return sorted.map((stage) => ({
      value: stage.ShippingStage, // Value to store
      label: stage.ShippingStage // Label to display
    }));
  }, [shippingStages]);

  // Visibility Flags
  const isAQL = selectedTemplate?.InspectedQtyMethod === "AQL";
  const showShippingStage = selectedTemplate?.ShippingStage === "Yes";
  const showCarton = selectedTemplate?.isCarton === "Yes";
  const showConfigurationSection = selectedTemplate !== null;

  // Handle input changes with VALIDATION
  const handleInspectedQtyChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    const val = parseInt(rawVal) || 0;

    if (maxOrderQty > 0 && val > maxOrderQty) {
      // Cap at max qty
      setInspectedQty(maxOrderQty.toString());
    } else {
      setInspectedQty(rawVal);
    }
  };

  const handleCartonQtyChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setCartonQty(value);
  };

  const handleRemarksChange = (e) => {
    const value = e.target.value.slice(0, 250);
    setRemarks(value);
  };

  // <--- FIX 5: Callback to update local state from child
  const handleProductTypeUpdate = useCallback((id) => {
    setSelectedProductTypeId(id);
  }, []);

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
        onProductTypeUpdate={handleProductTypeUpdate} // <--- FIX 6: Pass callback
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
      {showConfigurationSection && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Box className="w-4 h-4" />
              Inspection Details
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
                      External
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
                      label="Factory"
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

            {/* Carton Qty */}
            {showCarton && (
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

            {/* Inspected Qty & Shipping Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Inspected Qty - Hidden if Fixed */}
              {isAQL && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-500" />
                    Inspected Qty (Lot Size)
                    <span className="text-[9px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-1.5 py-0.5 rounded ml-1">
                      AQL
                    </span>
                    {maxOrderQty > 0 && (
                      <span className="text-[9px] text-gray-400 ml-auto">
                        (Max: {maxOrderQty})
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={inspectedQty}
                    onChange={handleInspectedQtyChange}
                    placeholder="Enter Lot Size..."
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Shipping Stage */}
              {showShippingStage && (
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
                      {/* Map over the dynamic options */}
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
      {selectedTemplate && isAQL && (
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
