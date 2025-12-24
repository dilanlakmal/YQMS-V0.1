import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Bug,
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Save,
  Edit,
  Trash2,
  Minus,
  Play,
  CheckCircle2,
  MapPinOff,
  MapPin,
  Lock,
  Layers,
  MessageSquare,
  Images,
  BarChart3,
  User,
  AlertTriangle,
  FileText,
  FilePenLine
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// Sub-components
import YPivotQATemplatesDefectLocationSelection from "../QATemplates/YPivotQATemplatesDefectLocationSelection";
import YPivotQATemplatesImageEditor from "../QATemplates/YPivotQATemplatesImageEditor";
// Import buyer determination function
import { determineBuyerFromOrderNo } from "./YPivotQAInspectionBuyerDetermination";
import YPivotQAInspectionDefectSummary from "./YPivotQAInspectionDefectSummary";
import YPivotQAInspectionManualDefect from "./YPivotQAInspectionManualDefect";

const YPivotQAInspectionDefectConfig = ({
  selectedOrders,
  orderData,
  reportData,
  onUpdateDefectData,
  activeGroup
}) => {
  // --- Derived Data ---
  const activeProductTypeId = reportData?.config?.productTypeId;

  // Get DETERMINED buyer name from order number (NOT from orderData.dtOrder.customer)
  const determinedBuyer = useMemo(() => {
    if (!selectedOrders || selectedOrders.length === 0) return "Unknown";
    const result = determineBuyerFromOrderNo(selectedOrders[0]);
    return result.buyer;
  }, [selectedOrders]);

  // --- State ---
  const [activeTab, setActiveTab] = useState("list");
  const [savedDefects, setSavedDefects] = useState(
    reportData?.defectData?.savedDefects || []
  );
  // Retrieve saved manual data from parent state or initialize empty
  const currentManualData = useMemo(() => {
    // Get the dictionary of all manual data
    const allManualData = reportData?.defectData?.manualDataByGroup || {};

    // Determine current key (fallback to 'general' if no group selected)
    const groupId = activeGroup?.id || "general";

    // Return specific data for this group, or empty defaults
    return allManualData[groupId] || { remarks: "", images: [] };
  }, [reportData?.defectData?.manualDataByGroup, activeGroup]);

  const [allDefects, setAllDefects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [currentDefectTemplate, setCurrentDefectTemplate] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  // Available statuses for current defect (based on buyer)
  const [availableStatuses, setAvailableStatuses] = useState([]);

  // Form State
  const [configForm, setConfigForm] = useState({
    status: "",
    qty: 1,
    locations: [],
    isNoLocation: false,
    additionalRemark: "",
    selectedQC: null
  });

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageEditorContext, setImageEditorContext] = useState(null);

  // --- Calculated Qty based on locations ---
  const calculatedQty = useMemo(() => {
    if (configForm.isNoLocation) {
      return configForm.qty; // User controlled when no location required
    }
    if (configForm.locations.length === 0) {
      return 0;
    }
    // Sum up qty from all selected locations
    return configForm.locations.reduce((sum, loc) => sum + (loc.qty || 1), 0);
  }, [configForm.locations, configForm.isNoLocation, configForm.qty]);

  // --- Validation for images per location ---
  const locationImageValidation = useMemo(() => {
    if (configForm.isNoLocation) {
      return { isValid: true, errors: [] };
    }

    if (configForm.locations.length === 0) {
      return { isValid: false, errors: [], noLocations: true };
    }

    const errors = [];
    configForm.locations.forEach((loc) => {
      const requiredImages = loc.qty || 1;
      const currentImages = loc.images?.length || 0;
      if (currentImages < requiredImages) {
        errors.push({
          uniqueId: loc.uniqueId,
          locationName: loc.locationName,
          locationNo: loc.locationNo,
          view: loc.view,
          required: requiredImages,
          current: currentImages,
          missing: requiredImages - currentImages
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      noLocations: false
    };
  }, [configForm.locations, configForm.isNoLocation]);

  // --- Check if form is valid for submission ---
  const isFormValid = useMemo(() => {
    // Must have status
    if (!configForm.status) return false;

    // Must have location or no-location checked
    if (!configForm.isNoLocation && configForm.locations.length === 0) {
      return false;
    }

    // If locations are selected, all must have required images
    if (!configForm.isNoLocation && !locationImageValidation.isValid) {
      return false;
    }

    // QC validation if required
    const isQCRequired = reportData?.selectedTemplate?.isQCScan === "Yes";
    const hasQCAssignments = activeGroup?.assignments?.some((a) => a.qcUser);
    if (isQCRequired && hasQCAssignments && !configForm.selectedQC) {
      return false;
    }

    return true;
  }, [
    configForm.status,
    configForm.isNoLocation,
    configForm.locations,
    configForm.selectedQC,
    locationImageValidation.isValid,
    reportData?.selectedTemplate?.isQCScan,
    activeGroup?.assignments
  ]);

  // --- Get validation messages for display ---
  const getValidationMessages = () => {
    const messages = [];

    if (!configForm.status) {
      messages.push({ type: "error", text: "Please select a status" });
    }

    if (!configForm.isNoLocation && configForm.locations.length === 0) {
      messages.push({
        type: "error",
        text: "Select defect locations or check 'No Location Required'"
      });
    }

    if (!configForm.isNoLocation && locationImageValidation.errors.length > 0) {
      locationImageValidation.errors.forEach((err) => {
        messages.push({
          type: "warning",
          text: `Location #${err.locationNo} (${err.locationName}): ${
            err.missing
          } image${err.missing > 1 ? "s" : ""} required`
        });
      });
    }

    const isQCRequired = reportData?.selectedTemplate?.isQCScan === "Yes";
    const hasQCAssignments = activeGroup?.assignments?.some((a) => a.qcUser);
    if (isQCRequired && hasQCAssignments && !configForm.selectedQC) {
      messages.push({
        type: "error",
        text: "Please select a QC / Inspector for this defect"
      });
    }

    return messages;
  };

  // --- Sync to Parent ---
  const updateParent = (newDefects) => {
    if (onUpdateDefectData) {
      // Pass back the existing DICTIONARY
      const existingManualDataMap =
        reportData?.defectData?.manualDataByGroup || {};

      onUpdateDefectData({
        savedDefects: newDefects,
        manualDataByGroup: existingManualDataMap // Save the whole map
      });
    }
  };

  // // --- Sync to Parent ---
  // const updateParent = (newDefects) => {
  //   if (onUpdateDefectData) {
  //     onUpdateDefectData({ savedDefects: newDefects });
  //   }
  // };

  // --- New Handler for Manual Data ---
  const handleManualDataUpdate = (newManualDataForActiveGroup) => {
    if (onUpdateDefectData) {
      const groupId = activeGroup?.id || "general";
      const existingManualDataMap =
        reportData?.defectData?.manualDataByGroup || {};

      // Create a new map: Keep other groups' data + Update current group
      const updatedMap = {
        ...existingManualDataMap,
        [groupId]: newManualDataForActiveGroup
      };

      onUpdateDefectData({
        savedDefects: savedDefects,
        manualDataByGroup: updatedMap // Send updated map to parent
      });
    }
  };

  // --- Initial Fetch ---
  useEffect(() => {
    const fetchDefects = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/qa-sections-defect-list`
        );
        if (res.data.success) {
          setAllDefects(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching defects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDefects();
  }, []);

  // --- Computed: Filtered Defects ---
  const filteredDefectsGrouped = useMemo(() => {
    if (!allDefects.length) return {};

    const reportCategories =
      reportData?.selectedTemplate?.DefectCategoryList?.map(
        (c) => c.CategoryCode
      );

    const filtered = allDefects.filter((d) => {
      const matchesSearch =
        d.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase());

      const isAllowed =
        !reportCategories ||
        reportCategories.length === 0 ||
        reportCategories.includes(d.CategoryCode);

      return matchesSearch && isAllowed;
    });

    const groups = filtered.reduce((acc, curr) => {
      const cat = curr.CategoryNameEng || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(curr);
      return acc;
    }, {});

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => parseFloat(a.code) - parseFloat(b.code));
    });

    return groups;
  }, [allDefects, searchTerm, reportData?.selectedTemplate]);

  // --- Computed: Active Session Stats ---
  const activeSessionStats = useMemo(() => {
    const relevantDefects = activeGroup
      ? savedDefects.filter((d) => d.groupId === activeGroup.id)
      : [];

    let total = 0,
      critical = 0,
      major = 0,
      minor = 0;

    relevantDefects.forEach((d) => {
      total += d.qty;
      if (d.status === "Critical") critical += d.qty;
      else if (d.status === "Major") major += d.qty;
      else if (d.status === "Minor") minor += d.qty;
    });

    return { total, critical, major, minor };
  }, [savedDefects, activeGroup]);

  // --- Helper: Get statuses for a defect based on DETERMINED buyer ---
  const getStatusesForDefect = (defectTemplate) => {
    if (
      !defectTemplate?.statusByBuyer ||
      !determinedBuyer ||
      determinedBuyer === "Unknown"
    ) {
      return {
        statuses: ["Minor", "Major", "Critical"],
        defaultStatus: "Major"
      };
    }

    const buyerRule = defectTemplate.statusByBuyer.find(
      (r) =>
        r.buyerName?.toLowerCase().trim() ===
        determinedBuyer.toLowerCase().trim()
    );

    if (
      buyerRule &&
      buyerRule.defectStatus &&
      buyerRule.defectStatus.length > 0
    ) {
      return {
        statuses: buyerRule.defectStatus,
        defaultStatus: buyerRule.commonStatus || buyerRule.defectStatus[0]
      };
    }

    const defaultRule = defectTemplate.statusByBuyer.find(
      (r) =>
        r.buyerName?.toLowerCase() === "default" ||
        r.buyerName?.toLowerCase() === "all" ||
        r.buyerName?.toLowerCase() === "*"
    );

    if (
      defaultRule &&
      defaultRule.defectStatus &&
      defaultRule.defectStatus.length > 0
    ) {
      return {
        statuses: defaultRule.defectStatus,
        defaultStatus: defaultRule.commonStatus || defaultRule.defectStatus[0]
      };
    }

    return {
      statuses: ["Minor", "Major", "Critical"],
      defaultStatus: "Major"
    };
  };

  // --- Handlers ---

  const handleOpenModal = (defectTemplate, index = null) => {
    const { statuses, defaultStatus } = getStatusesForDefect(defectTemplate);
    setAvailableStatuses(statuses);

    if (index !== null) {
      // Edit Mode
      const existing = savedDefects[index];
      setCurrentDefectTemplate(defectTemplate);
      setConfigForm({
        status: existing.status,
        qty: existing.qty,
        locations: existing.locations || [],
        isNoLocation: existing.isNoLocation || false,
        additionalRemark: existing.additionalRemark || "",
        selectedQC: existing.qcUser || activeGroup?.activeQC || null
      });
      setEditingIndex(index);
    } else {
      // New Mode
      setCurrentDefectTemplate(defectTemplate);
      setConfigForm({
        status: defaultStatus,
        qty: 1,
        locations: [],
        isNoLocation: false,
        additionalRemark: "",
        selectedQC: activeGroup?.activeQC || null
      });
      setEditingIndex(null);
    }
    setIsConfigOpen(true);
  };

  const handleSaveDefect = () => {
    // Form validation is already checked via isFormValid
    if (!isFormValid) return;

    const defectEntry = {
      ...configForm,
      qty: calculatedQty, // Use calculated qty
      defectId: currentDefectTemplate._id,
      defectName: currentDefectTemplate.english,
      defectCode: currentDefectTemplate.code,
      categoryName: currentDefectTemplate.CategoryNameEng,
      groupId: activeGroup?.id,
      line: activeGroup?.line,
      table: activeGroup?.table,
      color: activeGroup?.color,
      qcUser: configForm.selectedQC,
      lineName: activeGroup?.lineName,
      tableName: activeGroup?.tableName,
      colorName: activeGroup?.colorName,
      determinedBuyer: determinedBuyer,
      timestamp: new Date().toISOString()
    };

    let updatedList;
    if (editingIndex !== null) {
      updatedList = [...savedDefects];
      updatedList[editingIndex] = defectEntry;
    } else {
      updatedList = [...savedDefects, defectEntry];
    }

    setSavedDefects(updatedList);
    updateParent(updatedList);
    setIsConfigOpen(false);
  };

  const handleDeleteDefect = (index) => {
    if (window.confirm("Delete this defect entry?")) {
      const updatedList = [...savedDefects];
      updatedList.splice(index, 1);
      setSavedDefects(updatedList);
      updateParent(updatedList);
    }
  };

  // Memoized handler to prevent recreation on every render
  const handleLocationSelectionChange = useCallback((locs) => {
    setConfigForm((prev) => ({ ...prev, locations: locs }));
  }, []);

  const toggleCategory = (cat) => {
    setExpandedCategories((p) => ({ ...p, [cat]: !p[cat] }));
  };

  // --- Helper: Get all comments from positions as comma-separated string ---
  const getCommentsDisplay = (locations) => {
    if (!locations || locations.length === 0) return null;
    const comments = [];
    locations.forEach((loc) => {
      if (loc.positions) {
        loc.positions.forEach((pos) => {
          if (pos.comment && pos.comment.trim()) {
            comments.push(
              `#${loc.locationNo} Pcs${pos.pcsNo}: ${pos.comment.trim()}`
            );
          }
        });
      }
    });
    if (comments.length === 0) return null;
    return comments.join(" | ");
  };

  // --- Helper: Get total images count from locations ---
  const getTotalImagesCount = (locations) => {
    if (!locations || locations.length === 0) return 0;
    return locations.reduce((sum, loc) => sum + (loc.images?.length || 0), 0);
  };

  // ================= RENDER =================

  // --- Top Banner ---
  const renderActiveBanner = () => {
    if (!activeGroup) {
      return (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-bold text-amber-700 dark:text-amber-400">
              No Active Inspection Context
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Please go back to the <strong>Info</strong> tab and click "Start"
              on a specific card to add defects.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-xl flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-green-600 dark:text-green-400 fill-current" />
          <div className="text-sm font-bold text-green-800 dark:text-green-300 flex flex-wrap gap-1">
            <span className="mr-1">Active:</span>
            {activeGroup.lineName && (
              <span className="bg-white/50 px-1.5 rounded border border-green-200">
                Line {activeGroup.lineName}
              </span>
            )}
            {activeGroup.tableName && (
              <span className="bg-white/50 px-1.5 rounded border border-green-200">
                Table {activeGroup.tableName}
              </span>
            )}
            {activeGroup.colorName && (
              <span className="bg-white/50 px-1.5 rounded border border-green-200">
                Color {activeGroup.colorName}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- List Tab ---
  const renderListTab = () => {
    if (!activeGroup) return null;

    return (
      <div className="space-y-4 pb-20">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search defects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <button
            onClick={() => alert("Marked session as 'No Defects Found'")}
            className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold text-sm rounded-lg flex items-center gap-2 hover:bg-emerald-200 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> No Defects Found
          </button>
        </div>

        {Object.entries(filteredDefectsGrouped).map(([category, items]) => (
          <div
            key={category}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-4 py-3 font-bold text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <span>
                {category}{" "}
                <span className="text-xs font-normal opacity-70">
                  ({items.length})
                </span>
              </span>
              {expandedCategories[category] ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expandedCategories[category] && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700 animate-fadeIn">
                {items.map((defect) => (
                  <div
                    key={defect._id}
                    className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 flex justify-between items-center group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 w-10 text-center">
                          {defect.code}
                        </span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {defect.english}
                        </span>
                      </div>
                      {defect.khmer && (
                        <p className="text-xs text-gray-500 mt-0.5 ml-12">
                          {defect.khmer}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleOpenModal(defect)}
                      className="p-2 bg-white dark:bg-gray-700 border border-indigo-200 dark:border-indigo-800 text-indigo-600 rounded-lg shadow-sm hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // --- Results Tab ---
  const renderResultsTab = () => {
    const grouped = savedDefects.reduce((acc, curr) => {
      const gId = curr.groupId || "legacy";
      if (!acc[gId]) {
        acc[gId] = {
          id: gId,
          line: curr.lineName || curr.line,
          table: curr.tableName || curr.table,
          color: curr.colorName || curr.color,
          items: []
        };
      }
      acc[gId].items.push(curr);
      return acc;
    }, {});

    return (
      <div className="space-y-6 pb-20">
        {/* Active Session Summary */}
        {activeGroup && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-5 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-3xl font-black">
                  {activeSessionStats.total}
                </h2>
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Active Session Defects
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center px-3 py-1 bg-red-500/20 rounded-lg border border-red-500/30">
                  <p className="text-xl font-bold text-red-400">
                    {activeSessionStats.critical}
                  </p>
                  <p className="text-[10px] uppercase opacity-70">Critical</p>
                </div>
                <div className="text-center px-3 py-1 bg-orange-500/20 rounded-lg border border-orange-500/30">
                  <p className="text-xl font-bold text-orange-400">
                    {activeSessionStats.major}
                  </p>
                  <p className="text-[10px] uppercase opacity-70">Major</p>
                </div>
                <div className="text-center px-3 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
                  <p className="text-xl font-bold text-green-400">
                    {activeSessionStats.minor}
                  </p>
                  <p className="text-[10px] uppercase opacity-70">Minor</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Groups */}
        {Object.values(grouped).map((group) => {
          const isActive = activeGroup && activeGroup.id === group.id;
          return (
            <div key={group.id} className="space-y-3">
              <div
                className={`flex items-center gap-3 pb-2 border-b-2 ${
                  isActive
                    ? "border-green-500"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    isActive
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4
                    className={`text-sm font-bold ${
                      isActive
                        ? "text-green-700 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {group.line && `Line ${group.line}`}
                    {group.table && ` • Table ${group.table}`}
                    {group.color && ` • ${group.color}`}
                  </h4>
                </div>
                {isActive ? (
                  <span className="ml-auto text-xs bg-green-500 text-white px-2 py-1 rounded font-bold">
                    Active
                  </span>
                ) : (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.items.map((item) => {
                  const masterIndex = savedDefects.indexOf(item);
                  const commentsDisplay = getCommentsDisplay(item.locations);
                  const totalImages = getTotalImagesCount(item.locations);

                  return (
                    <div
                      key={masterIndex}
                      className={`bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all ${
                        isActive
                          ? "border-gray-200 hover:border-indigo-500"
                          : "border-gray-300 opacity-70 grayscale-[0.5]"
                      }`}
                    >
                      <div className="px-4 py-3 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1.5 rounded text-gray-600 dark:text-gray-400">
                              {item.defectCode}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                item.status === "Critical"
                                  ? "bg-red-100 text-red-700"
                                  : item.status === "Major"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-800 dark:text-white text-sm">
                            {item.defectName}
                          </h4>
                        </div>
                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                          {item.qty}
                        </span>
                      </div>

                      {/* Locations Section */}
                      <div className="px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                        {item.isNoLocation ? (
                          <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 flex items-center gap-1">
                            <MapPinOff className="w-3 h-3" />
                            No Location Marked
                          </span>
                        ) : (
                          <div className="space-y-1.5">
                            {/* Location chips */}
                            <div className="flex flex-wrap gap-1">
                              {item.locations.map((loc, i) => (
                                <div
                                  key={i}
                                  className={`px-1.5 py-0.5 rounded border ${
                                    loc.view === "Front"
                                      ? "bg-red-50 border-red-200"
                                      : "bg-blue-50 border-blue-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`text-[8px] font-bold ${
                                        loc.view === "Front"
                                          ? "text-red-600"
                                          : "text-blue-600"
                                      }`}
                                    >
                                      {loc.view}
                                    </span>
                                    <span className="text-[9px] text-gray-700 font-medium">
                                      #{loc.locationNo} - {loc.locationName}
                                    </span>
                                    <span className="text-[8px] text-gray-500 bg-white px-1 rounded">
                                      Qty: {loc.qty || 1}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Comments section */}
                            {commentsDisplay && (
                              <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1.5 border border-amber-200 dark:border-amber-800">
                                <MessageSquare className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-[9px] text-amber-700 dark:text-amber-400 break-words leading-relaxed">
                                  {commentsDisplay}
                                </p>
                              </div>
                            )}

                            {/* Additional Remark */}
                            {item.additionalRemark && (
                              <div className="flex items-start gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded px-2 py-1.5 border border-indigo-200 dark:border-indigo-800">
                                <FileText className="w-3 h-3 text-indigo-500 mt-0.5 flex-shrink-0" />
                                <p className="text-[9px] text-indigo-700 dark:text-indigo-400 break-words leading-relaxed">
                                  {item.additionalRemark}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer with images and actions */}
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          {totalImages > 0 ? (
                            <span className="text-[9px] text-gray-500 flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                              <Images className="w-3 h-3" />
                              {totalImages} image{totalImages > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-400 flex items-center gap-1">
                              <Images className="w-3 h-3" />
                              No images
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              isActive &&
                              handleOpenModal(
                                allDefects.find(
                                  (d) => d._id === item.defectId
                                ) || {
                                  _id: item.defectId,
                                  english: item.defectName,
                                  code: item.defectCode,
                                  CategoryNameEng: item.categoryName,
                                  statusByBuyer: []
                                },
                                masterIndex
                              )
                            }
                            disabled={!isActive}
                            className={`p-1.5 rounded transition-colors ${
                              isActive
                                ? "bg-white border text-indigo-600 hover:text-blue-600 hover:border-blue-300"
                                : "bg-transparent text-gray-400 cursor-not-allowed"
                            }`}
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              isActive && handleDeleteDefect(masterIndex)
                            }
                            disabled={!isActive}
                            className={`p-1.5 rounded transition-colors ${
                              isActive
                                ? "bg-white border text-red-500 hover:text-red-700 hover:border-red-300"
                                : "bg-transparent text-gray-400 cursor-not-allowed"
                            }`}
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {savedDefects.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <Bug className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No defects recorded yet.</p>
            <p className="text-sm">
              Select a defect from the list to add entries.
            </p>
          </div>
        )}
      </div>
    );
  };

  // --- 4. MODAL ---
  const renderConfigModal = () => {
    const validationMessages = getValidationMessages();

    return createPortal(
      <div className="fixed inset-0 z-[100] h-[100dvh] bg-white dark:bg-gray-900 overflow-y-auto animate-fadeIn flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center shadow-lg safe-area-top">
          <div className="min-w-0 flex-1">
            <h2 className="text-white font-bold text-lg line-clamp-1">
              {currentDefectTemplate.english}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-indigo-100 text-xs font-mono">
                {currentDefectTemplate.code}
              </span>
              {determinedBuyer && determinedBuyer !== "Unknown" && (
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {determinedBuyer}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsConfigOpen(false)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Section */}
            <section>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                Status
              </h3>
              <div className="flex gap-2 flex-wrap">
                {availableStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setConfigForm((p) => ({ ...p, status }))}
                    className={`flex-1 min-w-[80px] py-3 rounded-xl font-bold border-2 transition-all shadow-sm text-sm
                      ${
                        configForm.status === status
                          ? status === "Critical"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : status === "Major"
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              {determinedBuyer && determinedBuyer !== "Unknown" && (
                <p className="text-[10px] text-gray-400 mt-2">
                  Status options for buyer:{" "}
                  <span className="font-medium text-gray-600">
                    {determinedBuyer}
                  </span>
                </p>
              )}
            </section>

            {/* Quantity & Inspector Section */}
            <section className="col-span-1 md:col-span-1">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                Quantity & Inspector
              </h3>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Quantity Display/Stepper */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {configForm.isNoLocation ? (
                    // Editable Qty when No Location Required
                    <>
                      <button
                        onClick={() =>
                          setConfigForm((p) => ({
                            ...p,
                            qty: Math.max(1, p.qty - 1)
                          }))
                        }
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="w-16 h-10 flex items-center justify-center bg-white border-2 border-indigo-100 rounded-xl">
                        <span className="text-xl font-bold text-indigo-600">
                          {configForm.qty}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setConfigForm((p) => ({ ...p, qty: p.qty + 1 }))
                        }
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    // Auto-calculated Qty when Locations are selected
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-10 flex items-center justify-center bg-gray-100 border-2 border-gray-200 rounded-xl">
                        <span className="text-xl font-bold text-gray-600">
                          {calculatedQty}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase">
                          Auto
                        </span>
                        <span className="text-[9px] text-gray-500">
                          From locations
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* QC Selection Cards */}
                {reportData?.selectedTemplate?.isQCScan === "Yes" &&
                  activeGroup?.assignments?.some((a) => a.qcUser) && (
                    <div className="flex-1 w-full sm:w-auto overflow-x-auto pb-1">
                      <div className="flex items-center gap-2">
                        <div className="hidden sm:block w-px h-10 bg-gray-200 mx-2"></div>

                        <div className="flex gap-2">
                          {activeGroup.assignments
                            .filter((a) => a.qcUser)
                            .map((assign) => {
                              const qc = assign.qcUser;
                              const isSelected =
                                configForm.selectedQC?.emp_id === qc.emp_id;

                              return (
                                <div
                                  key={qc.emp_id}
                                  onClick={() =>
                                    setConfigForm((p) => ({
                                      ...p,
                                      selectedQC: qc
                                    }))
                                  }
                                  className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg border-2 transition-all cursor-pointer w-20 h-20 flex-shrink-0 ${
                                    isSelected
                                      ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                      : "border-gray-200 bg-white hover:border-gray-300"
                                  }`}
                                >
                                  <span
                                    className={`text-[9px] font-bold mb-1 ${
                                      isSelected
                                        ? "text-indigo-700"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {qc.emp_id}
                                  </span>

                                  {qc.face_photo ? (
                                    <img
                                      src={qc.face_photo}
                                      alt="qc"
                                      className="w-8 h-8 rounded-full object-cover border border-white shadow-sm"
                                    />
                                  ) : (
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        isSelected
                                          ? "bg-indigo-200 text-indigo-700"
                                          : "bg-gray-100 text-gray-400"
                                      }`}
                                    >
                                      <User className="w-4 h-4" />
                                    </div>
                                  )}

                                  <span
                                    className={`text-[8px] font-medium mt-1 truncate w-full text-center ${
                                      isSelected
                                        ? "text-indigo-800"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {qc.eng_name}
                                  </span>

                                  {isSelected && (
                                    <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5">
                                      <CheckCircle2 className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </section>
          </div>

          {/* Locations Section */}
          <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Locations
              </h3>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={configForm.isNoLocation}
                  onChange={(e) =>
                    setConfigForm((p) => ({
                      ...p,
                      isNoLocation: e.target.checked,
                      locations: [],
                      qty: 1 // Reset qty to 1 when switching to no location
                    }))
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span
                  className={configForm.isNoLocation ? "text-indigo-600" : ""}
                >
                  No Location Required
                </span>
              </label>
            </div>

            {configForm.isNoLocation ? (
              <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300">
                <MapPinOff className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Location selection skipped for this defect.
                </p>
              </div>
            ) : (
              <YPivotQATemplatesDefectLocationSelection
                forcedProductTypeId={activeProductTypeId}
                initialSelections={configForm.locations}
                onSelectionChange={handleLocationSelectionChange}
              />
            )}
          </section>

          {/* Additional Remark Section */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Additional Remark
              </h3>
              <span
                className={`text-[10px] ${
                  (configForm.additionalRemark?.length || 0) >= 250
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
              >
                {configForm.additionalRemark?.length || 0}/250
              </span>
            </div>
            <textarea
              value={configForm.additionalRemark || ""}
              onChange={(e) =>
                setConfigForm((prev) => ({
                  ...prev,
                  additionalRemark: e.target.value.slice(0, 250)
                }))
              }
              placeholder="Add any additional remarks for this defect entry..."
              maxLength={250}
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
            />
          </section>

          {/* Validation Messages */}
          {validationMessages.length > 0 && (
            <section className="space-y-2">
              {validationMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border ${
                    msg.type === "error"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {msg.type === "error" ? (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <p
                    className={`text-sm font-medium ${
                      msg.type === "error"
                        ? "text-red-700 dark:text-red-400"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {msg.text}
                  </p>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white dark:bg-gray-800 safe-area-bottom">
          <button
            onClick={handleSaveDefect}
            disabled={!isFormValid}
            className={`w-full py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
              isFormValid
                ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Save className="w-5 h-5" />{" "}
            {editingIndex !== null ? "Update Defect" : "Add Defect"}
          </button>

          {/* Helpful hint when button is disabled */}
          {!isFormValid && (
            <p className="text-center text-xs text-gray-400 mt-2">
              Please fix the issues above to continue
            </p>
          )}
        </div>

        {/* Image Editor - Kept for potential direct usage */}
        {showImageEditor && (
          <YPivotQATemplatesImageEditor
            autoStartMode={
              imageEditorContext?.isEditing ? null : imageEditorContext?.mode
            }
            existingData={imageEditorContext?.existingData}
            maxImages={imageEditorContext?.maxImages || 1}
            onSave={(savedImages) => {
              setShowImageEditor(false);
              setImageEditorContext(null);
            }}
            onCancel={() => {
              setShowImageEditor(false);
              setImageEditorContext(null);
            }}
          />
        )}
      </div>,
      document.body
    );
  };

  // ================= MAIN RETURN =================

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Bug className="w-5 h-5 text-indigo-500" /> Defect Entry
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Record defects for the active inspection session.
            {determinedBuyer && determinedBuyer !== "Unknown" && (
              <span className="ml-2 text-indigo-500 font-medium">
                Buyer: {determinedBuyer}
              </span>
            )}
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === "manual"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600"
                : "text-gray-500"
            }`}
          >
            <FilePenLine className="w-3.5 h-3.5" />
            Manual
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "list"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600"
                : "text-gray-500"
            }`}
          >
            Select Defects
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === "results"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600"
                : "text-gray-500"
            }`}
          >
            Results{" "}
            {savedDefects.length > 0 && (
              <span className="bg-indigo-500 text-white text-[9px] px-1.5 rounded-full">
                {savedDefects.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("summary")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === "summary"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600"
                : "text-gray-500"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Summary
          </button>
        </div>
      </div>

      {renderActiveBanner()}

      {activeTab === "manual" && (
        <YPivotQAInspectionManualDefect
          data={currentManualData}
          onUpdate={handleManualDataUpdate}
        />
      )}
      {activeTab === "list" && renderListTab()}
      {activeTab === "results" && renderResultsTab()}

      {activeTab === "summary" && (
        <YPivotQAInspectionDefectSummary
          savedDefects={savedDefects}
          activeGroup={activeGroup}
          reportData={reportData}
          selectedOrders={selectedOrders}
        />
      )}

      {isConfigOpen && currentDefectTemplate && renderConfigModal()}

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
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 2px;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionDefectConfig;

// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import { createPortal } from "react-dom";
// import axios from "axios";
// import {
//   Bug,
//   Search,
//   Plus,
//   X,
//   ChevronDown,
//   ChevronUp,
//   AlertCircle,
//   Save,
//   Edit,
//   Trash2,
//   Minus,
//   Play,
//   CheckCircle2,
//   MapPinOff,
//   MapPin,
//   Lock,
//   Layers,
//   MessageSquare,
//   Images,
//   BarChart3,
//   User,
//   AlertTriangle,
//   FileText,
//   FilePenLine,
//   Check,
//   MoreHorizontal,
//   Camera,
//   Upload
// } from "lucide-react";
// import { API_BASE_URL } from "../../../../../config";

// // Sub-components
// import YPivotQATemplatesDefectLocationSelection from "../QATemplates/YPivotQATemplatesDefectLocationSelection";
// import YPivotQATemplatesImageEditor from "../QATemplates/YPivotQATemplatesImageEditor";
// import { determineBuyerFromOrderNo } from "./YPivotQAInspectionBuyerDetermination";
// import YPivotQAInspectionDefectSummary from "./YPivotQAInspectionDefectSummary";
// import YPivotQAInspectionManualDefect from "./YPivotQAInspectionManualDefect";

// const YPivotQAInspectionDefectConfig = ({
//   selectedOrders,
//   orderData,
//   reportData,
//   onUpdateDefectData,
//   activeGroup
// }) => {
//   // --- Derived Data ---
//   const activeProductTypeId = reportData?.config?.productTypeId;

//   const determinedBuyer = useMemo(() => {
//     if (!selectedOrders || selectedOrders.length === 0) return "Unknown";
//     const result = determineBuyerFromOrderNo(selectedOrders[0]);
//     return result.buyer;
//   }, [selectedOrders]);

//   // --- State ---
//   const [activeTab, setActiveTab] = useState("list");
//   const [savedDefects, setSavedDefects] = useState(
//     reportData?.defectData?.savedDefects || []
//   );

//   const currentManualData = useMemo(() => {
//     const allManualData = reportData?.defectData?.manualDataByGroup || {};
//     const groupId = activeGroup?.id || "general";
//     return allManualData[groupId] || { remarks: "", images: [] };
//   }, [reportData?.defectData?.manualDataByGroup, activeGroup]);

//   const [allDefects, setAllDefects] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Multi-select state
//   const [selectedDefectIds, setSelectedDefectIds] = useState(new Set());

//   // Modal State
//   const [isConfigOpen, setIsConfigOpen] = useState(false);
//   const [selectedDefectsForModal, setSelectedDefectsForModal] = useState([]);
//   const [activeDefectIndex, setActiveDefectIndex] = useState(0);
//   const [editingDefectId, setEditingDefectId] = useState(null); // For editing existing aggregated defect

//   // Available statuses for current defect
//   const [availableStatuses, setAvailableStatuses] = useState([]);
//   const [defaultStatus, setDefaultStatus] = useState("Major");

//   // Form State for each defect in modal
//   const [defectForms, setDefectForms] = useState({});

//   // UI State
//   const [searchTerm, setSearchTerm] = useState("");
//   const [expandedCategories, setExpandedCategories] = useState({});
//   const [showImageEditor, setShowImageEditor] = useState(false);
//   const [imageEditorContext, setImageEditorContext] = useState(null);

//   // Expanded defect cards in results
//   const [expandedResultCards, setExpandedResultCards] = useState({});

//   // Get available QCs from active group
//   const availableQCs = useMemo(() => {
//     if (!activeGroup?.assignments) return [];
//     return activeGroup.assignments.filter((a) => a.qcUser).map((a) => a.qcUser);
//   }, [activeGroup]);

//   const defaultQC = useMemo(() => {
//     return (
//       activeGroup?.activeQC ||
//       (availableQCs.length > 0 ? availableQCs[0] : null)
//     );
//   }, [activeGroup, availableQCs]);

//   // --- Sync to Parent ---
//   const updateParent = (newDefects) => {
//     if (onUpdateDefectData) {
//       const existingManualDataMap =
//         reportData?.defectData?.manualDataByGroup || {};
//       onUpdateDefectData({
//         savedDefects: newDefects,
//         manualDataByGroup: existingManualDataMap
//       });
//     }
//   };

//   const handleManualDataUpdate = (newManualDataForActiveGroup) => {
//     if (onUpdateDefectData) {
//       const groupId = activeGroup?.id || "general";
//       const existingManualDataMap =
//         reportData?.defectData?.manualDataByGroup || {};
//       const updatedMap = {
//         ...existingManualDataMap,
//         [groupId]: newManualDataForActiveGroup
//       };
//       onUpdateDefectData({
//         savedDefects: savedDefects,
//         manualDataByGroup: updatedMap
//       });
//     }
//   };

//   // --- Initial Fetch ---
//   useEffect(() => {
//     const fetchDefects = async () => {
//       try {
//         const res = await axios.get(
//           `${API_BASE_URL}/api/qa-sections-defect-list`
//         );
//         if (res.data.success) {
//           setAllDefects(res.data.data);
//         }
//       } catch (err) {
//         console.error("Error fetching defects:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchDefects();
//   }, []);

//   // --- Computed: Filtered Defects ---
//   const filteredDefectsGrouped = useMemo(() => {
//     if (!allDefects.length) return {};

//     const reportCategories =
//       reportData?.selectedTemplate?.DefectCategoryList?.map(
//         (c) => c.CategoryCode
//       );

//     const filtered = allDefects.filter((d) => {
//       const matchesSearch =
//         d.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         d.code.toLowerCase().includes(searchTerm.toLowerCase());

//       const isAllowed =
//         !reportCategories ||
//         reportCategories.length === 0 ||
//         reportCategories.includes(d.CategoryCode);

//       return matchesSearch && isAllowed;
//     });

//     const groups = filtered.reduce((acc, curr) => {
//       const cat = curr.CategoryNameEng || "Uncategorized";
//       if (!acc[cat]) acc[cat] = [];
//       acc[cat].push(curr);
//       return acc;
//     }, {});

//     Object.keys(groups).forEach((key) => {
//       groups[key].sort((a, b) => parseFloat(a.code) - parseFloat(b.code));
//     });

//     return groups;
//   }, [allDefects, searchTerm, reportData?.selectedTemplate]);

//   // --- Computed: Aggregated Defects for Results ---
//   const aggregatedDefects = useMemo(() => {
//     const aggregated = {};

//     savedDefects.forEach((defect, originalIndex) => {
//       const key = `${defect.groupId}_${defect.defectId}`;

//       if (!aggregated[key]) {
//         aggregated[key] = {
//           defectId: defect.defectId,
//           defectName: defect.defectName,
//           defectCode: defect.defectCode,
//           categoryName: defect.categoryName,
//           groupId: defect.groupId,
//           lineName: defect.lineName,
//           tableName: defect.tableName,
//           colorName: defect.colorName,
//           determinedBuyer: defect.determinedBuyer,
//           entries: []
//         };
//       }

//       aggregated[key].entries.push({
//         ...defect,
//         originalIndex
//       });
//     });

//     // Calculate totals and stats for each aggregated defect
//     Object.values(aggregated).forEach((agg) => {
//       agg.totalQty = agg.entries.reduce((sum, e) => sum + (e.qty || 0), 0);
//       agg.criticalCount = agg.entries.reduce((sum, e) => {
//         if (e.isNoLocation) {
//           return sum + (e.status === "Critical" ? e.qty : 0);
//         }
//         return (
//           sum +
//           (e.locations || []).reduce((locSum, loc) => {
//             return (
//               locSum +
//               (loc.positions || []).filter((p) => p.status === "Critical")
//                 .length
//             );
//           }, 0)
//         );
//       }, 0);
//       agg.majorCount = agg.entries.reduce((sum, e) => {
//         if (e.isNoLocation) {
//           return sum + (e.status === "Major" ? e.qty : 0);
//         }
//         return (
//           sum +
//           (e.locations || []).reduce((locSum, loc) => {
//             return (
//               locSum +
//               (loc.positions || []).filter((p) => p.status === "Major").length
//             );
//           }, 0)
//         );
//       }, 0);
//       agg.minorCount = agg.entries.reduce((sum, e) => {
//         if (e.isNoLocation) {
//           return sum + (e.status === "Minor" ? e.qty : 0);
//         }
//         return (
//           sum +
//           (e.locations || []).reduce((locSum, loc) => {
//             return (
//               locSum +
//               (loc.positions || []).filter((p) => p.status === "Minor").length
//             );
//           }, 0)
//         );
//       }, 0);
//     });

//     return aggregated;
//   }, [savedDefects]);

//   // --- Computed: Active Session Stats ---
//   const activeSessionStats = useMemo(() => {
//     const relevantDefects = activeGroup
//       ? savedDefects.filter((d) => d.groupId === activeGroup.id)
//       : [];

//     let total = 0,
//       critical = 0,
//       major = 0,
//       minor = 0;

//     relevantDefects.forEach((d) => {
//       if (d.isNoLocation) {
//         total += d.qty;
//         if (d.status === "Critical") critical += d.qty;
//         else if (d.status === "Major") major += d.qty;
//         else if (d.status === "Minor") minor += d.qty;
//       } else {
//         (d.locations || []).forEach((loc) => {
//           (loc.positions || []).forEach((pos) => {
//             total += 1;
//             if (pos.status === "Critical") critical += 1;
//             else if (pos.status === "Major") major += 1;
//             else if (pos.status === "Minor") minor += 1;
//           });
//         });
//       }
//     });

//     return { total, critical, major, minor };
//   }, [savedDefects, activeGroup]);

//   // --- Helper: Get statuses for a defect based on buyer ---
//   const getStatusesForDefect = (defectTemplate) => {
//     if (
//       !defectTemplate?.statusByBuyer ||
//       !determinedBuyer ||
//       determinedBuyer === "Unknown"
//     ) {
//       return {
//         statuses: ["Minor", "Major", "Critical"],
//         defaultStatus: "Major"
//       };
//     }

//     const buyerRule = defectTemplate.statusByBuyer.find(
//       (r) =>
//         r.buyerName?.toLowerCase().trim() ===
//         determinedBuyer.toLowerCase().trim()
//     );

//     if (buyerRule?.defectStatus?.length > 0) {
//       return {
//         statuses: buyerRule.defectStatus,
//         defaultStatus: buyerRule.commonStatus || buyerRule.defectStatus[0]
//       };
//     }

//     const defaultRule = defectTemplate.statusByBuyer.find((r) =>
//       ["default", "all", "*"].includes(r.buyerName?.toLowerCase())
//     );

//     if (defaultRule?.defectStatus?.length > 0) {
//       return {
//         statuses: defaultRule.defectStatus,
//         defaultStatus: defaultRule.commonStatus || defaultRule.defectStatus[0]
//       };
//     }

//     return { statuses: ["Minor", "Major", "Critical"], defaultStatus: "Major" };
//   };

//   // --- Handlers ---

//   const toggleDefectSelection = (defectId) => {
//     setSelectedDefectIds((prev) => {
//       const newSet = new Set(prev);
//       if (newSet.has(defectId)) {
//         newSet.delete(defectId);
//       } else {
//         newSet.add(defectId);
//       }
//       return newSet;
//     });
//   };

//   const handleOpenModalForSelected = () => {
//     if (selectedDefectIds.size === 0) return;

//     const selectedDefects = allDefects.filter((d) =>
//       selectedDefectIds.has(d._id)
//     );

//     // Initialize forms for each defect
//     const forms = {};
//     selectedDefects.forEach((defect) => {
//       const { statuses, defaultStatus: defStatus } =
//         getStatusesForDefect(defect);
//       forms[defect._id] = {
//         status: defStatus,
//         qty: 1,
//         locations: [],
//         isNoLocation: false,
//         additionalRemark: "",
//         selectedQC: defaultQC,
//         availableStatuses: statuses,
//         defaultStatus: defStatus
//       };
//     });

//     setSelectedDefectsForModal(selectedDefects);
//     setDefectForms(forms);
//     setActiveDefectIndex(0);
//     setEditingDefectId(null);

//     if (selectedDefects.length > 0) {
//       const firstDefect = selectedDefects[0];
//       const { statuses, defaultStatus: defStatus } =
//         getStatusesForDefect(firstDefect);
//       setAvailableStatuses(statuses);
//       setDefaultStatus(defStatus);
//     }

//     setIsConfigOpen(true);
//     setSelectedDefectIds(new Set());
//   };

//   const handleOpenModalForEdit = (aggregatedDefect) => {
//     const defectTemplate = allDefects.find(
//       (d) => d._id === aggregatedDefect.defectId
//     ) || {
//       _id: aggregatedDefect.defectId,
//       english: aggregatedDefect.defectName,
//       code: aggregatedDefect.defectCode,
//       CategoryNameEng: aggregatedDefect.categoryName,
//       statusByBuyer: []
//     };

//     const { statuses, defaultStatus: defStatus } =
//       getStatusesForDefect(defectTemplate);

//     // Combine all entries' locations into the form
//     const combinedLocations = [];
//     aggregatedDefect.entries.forEach((entry) => {
//       if (!entry.isNoLocation && entry.locations) {
//         entry.locations.forEach((loc) => {
//           combinedLocations.push({
//             ...loc,
//             entryId: entry.originalIndex
//           });
//         });
//       }
//     });

//     const forms = {
//       [defectTemplate._id]: {
//         status: defStatus,
//         qty: aggregatedDefect.totalQty,
//         locations: combinedLocations,
//         isNoLocation: aggregatedDefect.entries.some((e) => e.isNoLocation),
//         additionalRemark: "",
//         selectedQC: defaultQC,
//         availableStatuses: statuses,
//         defaultStatus: defStatus,
//         existingEntries: aggregatedDefect.entries
//       }
//     };

//     setSelectedDefectsForModal([defectTemplate]);
//     setDefectForms(forms);
//     setActiveDefectIndex(0);
//     setEditingDefectId(aggregatedDefect.defectId);
//     setAvailableStatuses(statuses);
//     setDefaultStatus(defStatus);
//     setIsConfigOpen(true);
//   };

//   const handleRemoveDefectFromModal = (defectId) => {
//     const newDefects = selectedDefectsForModal.filter(
//       (d) => d._id !== defectId
//     );
//     setSelectedDefectsForModal(newDefects);

//     const newForms = { ...defectForms };
//     delete newForms[defectId];
//     setDefectForms(newForms);

//     if (newDefects.length === 0) {
//       setIsConfigOpen(false);
//     } else if (activeDefectIndex >= newDefects.length) {
//       setActiveDefectIndex(newDefects.length - 1);
//     }
//   };

//   const handleSelectDefectInModal = (index) => {
//     setActiveDefectIndex(index);
//     const defect = selectedDefectsForModal[index];
//     if (defect) {
//       const form = defectForms[defect._id];
//       if (form) {
//         setAvailableStatuses(form.availableStatuses);
//         setDefaultStatus(form.defaultStatus);
//       }
//     }
//   };

//   const updateDefectForm = (defectId, updates) => {
//     setDefectForms((prev) => ({
//       ...prev,
//       [defectId]: { ...prev[defectId], ...updates }
//     }));
//   };

//   const handleLocationSelectionChange = useCallback((defectId, locations) => {
//     updateDefectForm(defectId, { locations });
//   }, []);

//   // Calculate qty for a defect form
//   const getCalculatedQty = (form) => {
//     if (form.isNoLocation) {
//       return form.qty;
//     }
//     if (form.locations.length === 0) {
//       return 0;
//     }
//     return form.locations.reduce((sum, loc) => sum + (loc.qty || 1), 0);
//   };

//   // Check if a defect form is valid
//   const isDefectFormValid = (form) => {
//     if (form.isNoLocation) {
//       return form.qty > 0;
//     }
//     if (form.locations.length === 0) return false;

//     // Check if all locations have required images
//     const allImagesOk = form.locations.every((loc) => {
//       const required = loc.qty || 1;
//       const current = loc.images?.length || 0;
//       return current >= required;
//     });

//     return allImagesOk;
//   };

//   // Count valid defects
//   const validDefectsCount = useMemo(() => {
//     return selectedDefectsForModal.filter((d) => {
//       const form = defectForms[d._id];
//       return form && isDefectFormValid(form);
//     }).length;
//   }, [selectedDefectsForModal, defectForms]);

//   const handleSaveDefects = () => {
//     let updatedList = [...savedDefects];

//     // If editing, remove existing entries for this defect
//     if (editingDefectId) {
//       updatedList = updatedList.filter(
//         (d) =>
//           !(d.defectId === editingDefectId && d.groupId === activeGroup?.id)
//       );
//     }

//     // Add new entries
//     selectedDefectsForModal.forEach((defect) => {
//       const form = defectForms[defect._id];
//       if (!form || !isDefectFormValid(form)) return;

//       const defectEntry = {
//         defectId: defect._id,
//         defectName: defect.english,
//         defectCode: defect.code,
//         categoryName: defect.CategoryNameEng,
//         groupId: activeGroup?.id,
//         line: activeGroup?.line,
//         table: activeGroup?.table,
//         color: activeGroup?.color,
//         lineName: activeGroup?.lineName,
//         tableName: activeGroup?.tableName,
//         colorName: activeGroup?.colorName,
//         determinedBuyer: determinedBuyer,
//         timestamp: new Date().toISOString(),
//         isNoLocation: form.isNoLocation,
//         qty: getCalculatedQty(form),
//         status: form.isNoLocation ? form.status : null,
//         qcUser: form.isNoLocation ? form.selectedQC : null,
//         additionalRemark: form.isNoLocation ? form.additionalRemark : "",
//         locations: form.isNoLocation ? [] : form.locations
//       };

//       updatedList.push(defectEntry);
//     });

//     setSavedDefects(updatedList);
//     updateParent(updatedList);
//     setIsConfigOpen(false);
//     setSelectedDefectsForModal([]);
//     setDefectForms({});
//   };

//   const handleDeleteDefect = (originalIndex) => {
//     if (window.confirm("Delete this defect entry?")) {
//       const updatedList = [...savedDefects];
//       updatedList.splice(originalIndex, 1);
//       setSavedDefects(updatedList);
//       updateParent(updatedList);
//     }
//   };

//   const handleDeleteAggregatedDefect = (aggregatedKey) => {
//     const agg = aggregatedDefects[aggregatedKey];
//     if (!agg) return;

//     if (
//       window.confirm(
//         `Delete all ${agg.entries.length} entries for "${agg.defectName}"?`
//       )
//     ) {
//       const indicesToRemove = new Set(agg.entries.map((e) => e.originalIndex));
//       const updatedList = savedDefects.filter(
//         (_, idx) => !indicesToRemove.has(idx)
//       );
//       setSavedDefects(updatedList);
//       updateParent(updatedList);
//     }
//   };

//   const toggleCategory = (cat) => {
//     setExpandedCategories((p) => ({ ...p, [cat]: !p[cat] }));
//   };

//   const toggleResultCard = (key) => {
//     setExpandedResultCards((p) => ({ ...p, [key]: !p[key] }));
//   };

//   // --- Helper: Get status badge classes ---
//   const getStatusBadgeClasses = (status) => {
//     switch (status) {
//       case "Critical":
//         return "bg-red-100 text-red-700 border-red-200";
//       case "Major":
//         return "bg-orange-100 text-orange-700 border-orange-200";
//       case "Minor":
//         return "bg-green-100 text-green-700 border-green-200";
//       default:
//         return "bg-gray-100 text-gray-700 border-gray-200";
//     }
//   };

//   const getStatusColorClasses = (status, isSelected) => {
//     if (!isSelected)
//       return "border-gray-200 bg-white text-gray-500 hover:border-gray-400";
//     switch (status) {
//       case "Critical":
//         return "border-red-500 bg-red-50 text-red-700";
//       case "Major":
//         return "border-orange-500 bg-orange-50 text-orange-700";
//       case "Minor":
//         return "border-green-500 bg-green-50 text-green-700";
//       default:
//         return "border-gray-500 bg-gray-50 text-gray-700";
//     }
//   };

//   // --- Helper: Get comments display ---
//   const getCommentsDisplay = (locations) => {
//     if (!locations || locations.length === 0) return null;
//     const comments = [];
//     locations.forEach((loc) => {
//       if (loc.positions) {
//         loc.positions.forEach((pos) => {
//           if (pos.comment && pos.comment.trim()) {
//             comments.push(
//               `#${loc.locationNo} Pcs${pos.pcsNo}: ${pos.comment.trim()}`
//             );
//           }
//         });
//       }
//     });
//     if (comments.length === 0) return null;
//     return comments.join(" | ");
//   };

//   const getTotalImagesCount = (locations) => {
//     if (!locations || locations.length === 0) return 0;
//     return locations.reduce((sum, loc) => sum + (loc.images?.length || 0), 0);
//   };

//   // ================= RENDER =================

//   const renderActiveBanner = () => {
//     if (!activeGroup) {
//       return (
//         <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-xl flex items-start gap-2 mb-4">
//           <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
//           <div>
//             <p className="font-bold text-amber-700 dark:text-amber-400 text-sm">
//               No Active Inspection Context
//             </p>
//             <p className="text-xs text-amber-600 dark:text-amber-500">
//               Go to <strong>Info</strong> tab and click "Start" to add defects.
//             </p>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-2.5 rounded-xl flex items-center justify-between mb-4">
//         <div className="flex items-center gap-2">
//           <Play className="w-3.5 h-3.5 text-green-600 fill-current" />
//           <div className="text-xs font-bold text-green-800 dark:text-green-300 flex flex-wrap gap-1">
//             <span>Active:</span>
//             {activeGroup.lineName && (
//               <span className="bg-white/50 px-1.5 rounded border border-green-200">
//                 Line {activeGroup.lineName}
//               </span>
//             )}
//             {activeGroup.tableName && (
//               <span className="bg-white/50 px-1.5 rounded border border-green-200">
//                 Table {activeGroup.tableName}
//               </span>
//             )}
//             {activeGroup.colorName && (
//               <span className="bg-white/50 px-1.5 rounded border border-green-200">
//                 {activeGroup.colorName}
//               </span>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // --- List Tab ---
//   const renderListTab = () => {
//     if (!activeGroup) return null;

//     return (
//       <div className="space-y-3 pb-24">
//         {/* Search and Actions */}
//         <div className="flex gap-2">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search defects..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
//             />
//           </div>
//         </div>

//         {/* Selection Info Bar */}
//         {selectedDefectIds.size > 0 && (
//           <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-3 rounded-xl flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <Check className="w-4 h-4 text-indigo-600" />
//               <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
//                 {selectedDefectIds.size} defect
//                 {selectedDefectIds.size > 1 ? "s" : ""} selected
//               </span>
//             </div>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setSelectedDefectIds(new Set())}
//                 className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
//               >
//                 Clear
//               </button>
//               <button
//                 onClick={handleOpenModalForSelected}
//                 className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 shadow-md"
//               >
//                 <Plus className="w-4 h-4" />
//                 Add Selected
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Defect Categories */}
//         {Object.entries(filteredDefectsGrouped).map(([category, items]) => (
//           <div
//             key={category}
//             className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
//           >
//             <button
//               onClick={() => toggleCategory(category)}
//               className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2.5 font-bold text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
//             >
//               <span>
//                 {category}{" "}
//                 <span className="text-xs font-normal opacity-70">
//                   ({items.length})
//                 </span>
//               </span>
//               {expandedCategories[category] ? (
//                 <ChevronUp className="w-4 h-4" />
//               ) : (
//                 <ChevronDown className="w-4 h-4" />
//               )}
//             </button>

//             {expandedCategories[category] && (
//               <div className="divide-y divide-gray-100 dark:divide-gray-700">
//                 {items.map((defect) => {
//                   const isSelected = selectedDefectIds.has(defect._id);
//                   return (
//                     <div
//                       key={defect._id}
//                       onClick={() => toggleDefectSelection(defect._id)}
//                       className={`p-2.5 flex justify-between items-center cursor-pointer transition-colors ${
//                         isSelected
//                           ? "bg-indigo-50 dark:bg-indigo-900/20"
//                           : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
//                       }`}
//                     >
//                       <div className="flex items-center gap-2">
//                         <div
//                           className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
//                             isSelected
//                               ? "bg-indigo-600 border-indigo-600"
//                               : "border-gray-300 bg-white"
//                           }`}
//                         >
//                           {isSelected && (
//                             <Check className="w-3 h-3 text-white" />
//                           )}
//                         </div>
//                         <div>
//                           <div className="flex items-center gap-2">
//                             <span className="font-mono text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
//                               {defect.code}
//                             </span>
//                             <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
//                               {defect.english}
//                             </span>
//                           </div>
//                           {defect.khmer && (
//                             <p className="text-[10px] text-gray-500 mt-0.5 ml-7">
//                               {defect.khmer}
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         ))}

//         {/* Floating Add Button */}
//         {selectedDefectIds.size > 0 && (
//           <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
//             <button
//               onClick={handleOpenModalForSelected}
//               className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full shadow-xl hover:shadow-2xl flex items-center gap-2 animate-bounce"
//             >
//               <Plus className="w-5 h-5" />
//               Add {selectedDefectIds.size} Defect
//               {selectedDefectIds.size > 1 ? "s" : ""}
//             </button>
//           </div>
//         )}
//       </div>
//     );
//   };

//   // --- Results Tab ---
//   const renderResultsTab = () => {
//     const groupedByContext = {};

//     Object.entries(aggregatedDefects).forEach(([key, agg]) => {
//       const contextKey = agg.groupId || "legacy";
//       if (!groupedByContext[contextKey]) {
//         groupedByContext[contextKey] = {
//           id: contextKey,
//           line: agg.lineName,
//           table: agg.tableName,
//           color: agg.colorName,
//           defects: []
//         };
//       }
//       groupedByContext[contextKey].defects.push({ key, ...agg });
//     });

//     return (
//       <div className="space-y-4 pb-20">
//         {/* Active Session Summary */}
//         {activeGroup && (
//           <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-4 text-white">
//             <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
//               <div className="text-center sm:text-left">
//                 <h2 className="text-2xl font-black">
//                   {activeSessionStats.total}
//                 </h2>
//                 <p className="text-[10px] text-slate-400 uppercase tracking-wider">
//                   Active Session Defects
//                 </p>
//               </div>
//               <div className="flex gap-3">
//                 <div className="text-center px-2 py-1 bg-red-500/20 rounded-lg border border-red-500/30">
//                   <p className="text-lg font-bold text-red-400">
//                     {activeSessionStats.critical}
//                   </p>
//                   <p className="text-[9px] uppercase opacity-70">Critical</p>
//                 </div>
//                 <div className="text-center px-2 py-1 bg-orange-500/20 rounded-lg border border-orange-500/30">
//                   <p className="text-lg font-bold text-orange-400">
//                     {activeSessionStats.major}
//                   </p>
//                   <p className="text-[9px] uppercase opacity-70">Major</p>
//                 </div>
//                 <div className="text-center px-2 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
//                   <p className="text-lg font-bold text-green-400">
//                     {activeSessionStats.minor}
//                   </p>
//                   <p className="text-[9px] uppercase opacity-70">Minor</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Grouped Results */}
//         {Object.values(groupedByContext).map((group) => {
//           const isActive = activeGroup && activeGroup.id === group.id;

//           return (
//             <div key={group.id} className="space-y-2">
//               {/* Group Header */}
//               <div
//                 className={`flex items-center gap-2 pb-2 border-b-2 ${
//                   isActive
//                     ? "border-green-500"
//                     : "border-gray-200 dark:border-gray-700"
//                 }`}
//               >
//                 <div
//                   className={`p-1.5 rounded-lg ${
//                     isActive
//                       ? "bg-green-100 text-green-600"
//                       : "bg-gray-100 text-gray-500"
//                   }`}
//                 >
//                   <Layers className="w-4 h-4" />
//                 </div>
//                 <div className="flex-1">
//                   <h4
//                     className={`text-xs font-bold ${
//                       isActive ? "text-green-700" : "text-gray-600"
//                     }`}
//                   >
//                     {group.line && `Line ${group.line}`}
//                     {group.table && ` • Table ${group.table}`}
//                     {group.color && ` • ${group.color}`}
//                   </h4>
//                 </div>
//                 {isActive ? (
//                   <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded font-bold">
//                     Active
//                   </span>
//                 ) : (
//                   <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold flex items-center gap-1">
//                     <Lock className="w-3 h-3" /> Locked
//                   </span>
//                 )}
//               </div>

//               {/* Defect Cards */}
//               <div className="grid grid-cols-1 gap-3">
//                 {group.defects.map((agg) => {
//                   const isExpanded = expandedResultCards[agg.key];

//                   return (
//                     <div
//                       key={agg.key}
//                       className={`bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all ${
//                         isActive
//                           ? "border-gray-200 hover:border-indigo-400"
//                           : "border-gray-300 opacity-70"
//                       }`}
//                     >
//                       {/* Card Header */}
//                       <div
//                         className="px-3 py-2.5 flex justify-between items-start cursor-pointer"
//                         onClick={() => toggleResultCard(agg.key)}
//                       >
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-center gap-2 mb-1 flex-wrap">
//                             <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 px-1.5 rounded">
//                               {agg.defectCode}
//                             </span>
//                             {agg.criticalCount > 0 && (
//                               <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
//                                 {agg.criticalCount} Critical
//                               </span>
//                             )}
//                             {agg.majorCount > 0 && (
//                               <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
//                                 {agg.majorCount} Major
//                               </span>
//                             )}
//                             {agg.minorCount > 0 && (
//                               <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
//                                 {agg.minorCount} Minor
//                               </span>
//                             )}
//                           </div>
//                           <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">
//                             {agg.defectName}
//                           </h4>
//                           <p className="text-[10px] text-gray-500 mt-0.5">
//                             {agg.entries.length} entr
//                             {agg.entries.length > 1 ? "ies" : "y"}
//                           </p>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <span className="text-xl font-bold text-indigo-600">
//                             {agg.totalQty}
//                           </span>
//                           {isExpanded ? (
//                             <ChevronUp className="w-4 h-4 text-gray-400" />
//                           ) : (
//                             <ChevronDown className="w-4 h-4 text-gray-400" />
//                           )}
//                         </div>
//                       </div>

//                       {/* Expanded Content */}
//                       {isExpanded && (
//                         <div className="border-t border-gray-100 dark:border-gray-700">
//                           {/* Entries List */}
//                           <div className="p-2 space-y-2 max-h-80 overflow-y-auto">
//                             {agg.entries.map((entry, idx) => (
//                               <div
//                                 key={idx}
//                                 className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 border border-gray-100 dark:border-gray-700"
//                               >
//                                 <div className="flex justify-between items-start mb-2">
//                                   <span className="text-[10px] font-bold text-gray-500">
//                                     Entry #{idx + 1}
//                                   </span>
//                                   <span className="text-xs font-bold text-indigo-600">
//                                     Qty: {entry.qty}
//                                   </span>
//                                 </div>

//                                 {entry.isNoLocation ? (
//                                   <div className="flex items-center gap-2 flex-wrap">
//                                     <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
//                                       <MapPinOff className="w-3 h-3" /> No
//                                       Location
//                                     </span>
//                                     {entry.status && (
//                                       <span
//                                         className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClasses(
//                                           entry.status
//                                         )}`}
//                                       >
//                                         {entry.status}
//                                       </span>
//                                     )}
//                                   </div>
//                                 ) : (
//                                   <div className="space-y-1">
//                                     {(entry.locations || []).map(
//                                       (loc, locIdx) => (
//                                         <div
//                                           key={locIdx}
//                                           className="bg-white dark:bg-gray-800 rounded p-1.5 border border-gray-200 dark:border-gray-600"
//                                         >
//                                           <div className="flex items-center gap-1 flex-wrap">
//                                             <span
//                                               className={`text-[8px] font-bold px-1 rounded ${
//                                                 loc.view === "Front"
//                                                   ? "bg-red-100 text-red-600"
//                                                   : "bg-blue-100 text-blue-600"
//                                               }`}
//                                             >
//                                               {loc.view}
//                                             </span>
//                                             <span className="text-[9px] font-medium">
//                                               #{loc.locationNo} -{" "}
//                                               {loc.locationName}
//                                             </span>
//                                           </div>
//                                           {loc.positions &&
//                                             loc.positions.length > 0 && (
//                                               <div className="mt-1 flex flex-wrap gap-1">
//                                                 {loc.positions.map(
//                                                   (pos, posIdx) => (
//                                                     <span
//                                                       key={posIdx}
//                                                       className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${getStatusBadgeClasses(
//                                                         pos.status
//                                                       )}`}
//                                                     >
//                                                       Pcs{pos.pcsNo}:{" "}
//                                                       {pos.status}
//                                                     </span>
//                                                   )
//                                                 )}
//                                               </div>
//                                             )}
//                                         </div>
//                                       )
//                                     )}
//                                   </div>
//                                 )}
//                               </div>
//                             ))}
//                           </div>

//                           {/* Actions */}
//                           <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700">
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 if (isActive) handleOpenModalForEdit(agg);
//                               }}
//                               disabled={!isActive}
//                               className={`p-1.5 rounded transition-colors ${
//                                 isActive
//                                   ? "bg-white border text-indigo-600 hover:bg-indigo-50"
//                                   : "bg-transparent text-gray-400 cursor-not-allowed"
//                               }`}
//                             >
//                               <Edit className="w-3.5 h-3.5" />
//                             </button>
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 if (isActive)
//                                   handleDeleteAggregatedDefect(agg.key);
//                               }}
//                               disabled={!isActive}
//                               className={`p-1.5 rounded transition-colors ${
//                                 isActive
//                                   ? "bg-white border text-red-500 hover:bg-red-50"
//                                   : "bg-transparent text-gray-400 cursor-not-allowed"
//                               }`}
//                             >
//                               <Trash2 className="w-3.5 h-3.5" />
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           );
//         })}

//         {Object.keys(aggregatedDefects).length === 0 && (
//           <div className="text-center py-10 text-gray-400">
//             <Bug className="w-10 h-10 mx-auto mb-2 opacity-50" />
//             <p className="font-medium text-sm">No defects recorded yet.</p>
//             <p className="text-xs">Select defects from the list to add.</p>
//           </div>
//         )}
//       </div>
//     );
//   };

//   // --- Modal ---
//   const renderConfigModal = () => {
//     if (!isConfigOpen || selectedDefectsForModal.length === 0) return null;

//     const currentDefect = selectedDefectsForModal[activeDefectIndex];
//     const currentForm = defectForms[currentDefect?._id];

//     if (!currentDefect || !currentForm) return null;

//     const calculatedQty = getCalculatedQty(currentForm);
//     const isCurrentFormValid = isDefectFormValid(currentForm);

//     return createPortal(
//       <div className="fixed inset-0 z-[100] h-[100dvh] bg-white dark:bg-gray-900 overflow-hidden flex flex-col animate-fadeIn">
//         {/* Header */}
//         <div className="flex-shrink-0 px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg safe-area-top">
//           <div className="flex justify-between items-center mb-2">
//             <div className="flex items-center gap-2">
//               <Bug className="w-5 h-5 text-white" />
//               <h2 className="text-white font-bold text-sm">
//                 Configure Defects ({selectedDefectsForModal.length})
//               </h2>
//             </div>
//             <button
//               onClick={() => setIsConfigOpen(false)}
//               className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white"
//             >
//               <X className="w-4 h-4" />
//             </button>
//           </div>

//           {/* Buyer Info */}
//           {determinedBuyer && determinedBuyer !== "Unknown" && (
//             <div className="text-[10px] text-indigo-200 mb-2">
//               Buyer:{" "}
//               <span className="font-bold text-white">{determinedBuyer}</span>
//             </div>
//           )}

//           {/* Defect Tabs */}
//           <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
//             {selectedDefectsForModal.map((defect, idx) => {
//               const form = defectForms[defect._id];
//               const isValid = form && isDefectFormValid(form);
//               const isActive = idx === activeDefectIndex;

//               return (
//                 <div
//                   key={defect._id}
//                   className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all flex-shrink-0 ${
//                     isActive
//                       ? "bg-white text-indigo-700 shadow-md"
//                       : "bg-white/20 text-white hover:bg-white/30"
//                   }`}
//                   onClick={() => handleSelectDefectInModal(idx)}
//                 >
//                   <div className="flex flex-col">
//                     <span className="text-[9px] font-mono opacity-70">
//                       {defect.code}
//                     </span>
//                     <span className="text-[10px] font-bold truncate max-w-[100px]">
//                       {defect.english}
//                     </span>
//                   </div>
//                   {isValid && (
//                     <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
//                   )}
//                   {!editingDefectId && (
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleRemoveDefectFromModal(defect._id);
//                       }}
//                       className="p-0.5 hover:bg-red-100 rounded-full text-red-400 hover:text-red-600"
//                     >
//                       <X className="w-3 h-3" />
//                     </button>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Body */}
//         <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 pb-24">
//           {/* Current Defect Info */}
//           <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-200 dark:border-indigo-800">
//             <div className="flex items-center justify-between">
//               <div>
//                 <span className="text-[10px] font-mono text-indigo-600">
//                   {currentDefect.code}
//                 </span>
//                 <h3 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">
//                   {currentDefect.english}
//                 </h3>
//               </div>
//               <div className="text-right">
//                 <span className="text-[10px] text-gray-500">Total Qty</span>
//                 <p className="text-2xl font-black text-indigo-600">
//                   {calculatedQty}
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* No Location Checkbox */}
//           <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={currentForm.isNoLocation}
//                 onChange={(e) =>
//                   updateDefectForm(currentDefect._id, {
//                     isNoLocation: e.target.checked,
//                     locations: [],
//                     qty: 1
//                   })
//                 }
//                 className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
//               />
//               <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
//                 No Location Required
//               </span>
//             </label>
//             <MapPinOff className="w-4 h-4 text-gray-400" />
//           </div>

//           {/* No Location Mode Content */}
//           {currentForm.isNoLocation && (
//             <div className="space-y-4">
//               {/* Status Selection */}
//               <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
//                 <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">
//                   Status
//                 </h4>
//                 <div className="flex gap-2 flex-wrap">
//                   {currentForm.availableStatuses.map((status) => (
//                     <button
//                       key={status}
//                       onClick={() =>
//                         updateDefectForm(currentDefect._id, { status })
//                       }
//                       className={`flex-1 min-w-[70px] py-2.5 rounded-lg font-bold border-2 transition-all text-xs ${getStatusColorClasses(
//                         status,
//                         currentForm.status === status
//                       )}`}
//                     >
//                       {status}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Quantity Control */}
//               <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
//                 <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">
//                   Quantity
//                 </h4>
//                 <div className="flex items-center justify-center gap-3">
//                   <button
//                     onClick={() =>
//                       updateDefectForm(currentDefect._id, {
//                         qty: Math.max(1, currentForm.qty - 1)
//                       })
//                     }
//                     className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600"
//                   >
//                     <Minus className="w-5 h-5" />
//                   </button>
//                   <div className="w-20 h-12 flex items-center justify-center bg-indigo-50 border-2 border-indigo-200 rounded-xl">
//                     <span className="text-2xl font-bold text-indigo-600">
//                       {currentForm.qty}
//                     </span>
//                   </div>
//                   <button
//                     onClick={() =>
//                       updateDefectForm(currentDefect._id, {
//                         qty: currentForm.qty + 1
//                       })
//                     }
//                     className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600"
//                   >
//                     <Plus className="w-5 h-5" />
//                   </button>
//                 </div>
//               </div>

//               {/* QC Selection */}
//               {availableQCs.length > 0 && (
//                 <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
//                   <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">
//                     QC / Inspector
//                   </h4>
//                   <div className="flex gap-2 overflow-x-auto pb-1">
//                     {availableQCs.map((qc) => {
//                       const isSelected =
//                         currentForm.selectedQC?.emp_id === qc.emp_id;
//                       return (
//                         <div
//                           key={qc.emp_id}
//                           onClick={() =>
//                             updateDefectForm(currentDefect._id, {
//                               selectedQC: qc
//                             })
//                           }
//                           className={`relative flex flex-col items-center p-2 rounded-lg border-2 cursor-pointer transition-all min-w-[60px] ${
//                             isSelected
//                               ? "border-indigo-500 bg-indigo-50"
//                               : "border-gray-200 bg-white hover:border-gray-300"
//                           }`}
//                         >
//                           <span
//                             className={`text-[8px] font-bold ${
//                               isSelected ? "text-indigo-600" : "text-gray-400"
//                             }`}
//                           >
//                             {qc.emp_id}
//                           </span>
//                           {qc.face_photo ? (
//                             <img
//                               src={qc.face_photo}
//                               alt="qc"
//                               className="w-8 h-8 rounded-full object-cover border-2 border-white shadow"
//                             />
//                           ) : (
//                             <div
//                               className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                                 isSelected
//                                   ? "bg-indigo-200 text-indigo-700"
//                                   : "bg-gray-100 text-gray-400"
//                               }`}
//                             >
//                               <User className="w-4 h-4" />
//                             </div>
//                           )}
//                           <span
//                             className={`text-[8px] font-medium truncate w-full text-center mt-1 ${
//                               isSelected ? "text-indigo-800" : "text-gray-600"
//                             }`}
//                           >
//                             {qc.eng_name?.split(" ")[0]}
//                           </span>
//                           {isSelected && (
//                             <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5">
//                               <Check className="w-2.5 h-2.5" />
//                             </div>
//                           )}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               )}

//               {/* Additional Remark */}
//               <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
//                 <div className="flex items-center justify-between mb-2">
//                   <h4 className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
//                     <FileText className="w-3 h-3" /> Additional Remark
//                   </h4>
//                   <span
//                     className={`text-[9px] ${
//                       (currentForm.additionalRemark?.length || 0) >= 250
//                         ? "text-red-500"
//                         : "text-gray-400"
//                     }`}
//                   >
//                     {currentForm.additionalRemark?.length || 0}/250
//                   </span>
//                 </div>
//                 <textarea
//                   value={currentForm.additionalRemark || ""}
//                   onChange={(e) =>
//                     updateDefectForm(currentDefect._id, {
//                       additionalRemark: e.target.value.slice(0, 250)
//                     })
//                   }
//                   placeholder="Add remark..."
//                   maxLength={250}
//                   rows={2}
//                   className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
//                 />
//               </div>
//             </div>
//           )}

//           {/* Location Mode Content */}
//           {!currentForm.isNoLocation && (
//             <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
//               <div className="flex items-center justify-between mb-3">
//                 <h4 className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
//                   <MapPin className="w-3.5 h-3.5" /> Locations & Pieces
//                 </h4>
//                 <span className="text-[10px] text-gray-500">
//                   {currentForm.locations.length} location
//                   {currentForm.locations.length !== 1 ? "s" : ""} selected
//                 </span>
//               </div>

//               <YPivotQATemplatesDefectLocationSelection
//                 forcedProductTypeId={activeProductTypeId}
//                 initialSelections={currentForm.locations}
//                 onSelectionChange={(locs) =>
//                   handleLocationSelectionChange(currentDefect._id, locs)
//                 }
//                 availableStatuses={currentForm.availableStatuses}
//                 defaultStatus={currentForm.defaultStatus}
//                 availableQCs={availableQCs}
//                 defaultQC={defaultQC}
//               />
//             </div>
//           )}

//           {/* Validation Messages */}
//           {!isCurrentFormValid && (
//             <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
//               <div className="flex items-start gap-2">
//                 <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
//                 <div className="text-xs text-amber-700 dark:text-amber-400">
//                   {currentForm.isNoLocation ? (
//                     <p>Please set quantity greater than 0</p>
//                   ) : currentForm.locations.length === 0 ? (
//                     <p>Please select at least one location</p>
//                   ) : (
//                     <p>Please add required images for all locations</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white dark:bg-gray-800 safe-area-bottom">
//           <button
//             onClick={handleSaveDefects}
//             disabled={validDefectsCount === 0}
//             className={`w-full py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
//               validDefectsCount > 0
//                 ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
//                 : "bg-gray-300 text-gray-500 cursor-not-allowed"
//             }`}
//           >
//             <Save className="w-5 h-5" />
//             {editingDefectId
//               ? "Update Defect"
//               : `Add Defects (${validDefectsCount})`}
//           </button>

//           {validDefectsCount === 0 && (
//             <p className="text-center text-[10px] text-gray-400 mt-2">
//               Complete at least one defect configuration to continue
//             </p>
//           )}
//         </div>
//       </div>,
//       document.body
//     );
//   };

//   // ================= MAIN RETURN =================

//   return (
//     <div className="space-y-3 animate-fadeIn">
//       {/* Header */}
//       <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//         <div>
//           <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
//             <Bug className="w-4 h-4 text-indigo-500" /> Defect Entry
//           </h3>
//           <p className="text-[10px] text-gray-500 mt-0.5">
//             Record defects for inspection.
//             {determinedBuyer && determinedBuyer !== "Unknown" && (
//               <span className="ml-1 text-indigo-500 font-medium">
//                 Buyer: {determinedBuyer}
//               </span>
//             )}
//           </p>
//         </div>
//         <div className="flex bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg">
//           <button
//             onClick={() => setActiveTab("manual")}
//             className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
//               activeTab === "manual"
//                 ? "bg-white dark:bg-gray-600 shadow text-indigo-600"
//                 : "text-gray-500"
//             }`}
//           >
//             <FilePenLine className="w-3 h-3" />
//             Manual
//           </button>
//           <button
//             onClick={() => setActiveTab("list")}
//             className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
//               activeTab === "list"
//                 ? "bg-white dark:bg-gray-600 shadow text-indigo-600"
//                 : "text-gray-500"
//             }`}
//           >
//             Select
//           </button>
//           <button
//             onClick={() => setActiveTab("results")}
//             className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
//               activeTab === "results"
//                 ? "bg-white dark:bg-gray-600 shadow text-indigo-600"
//                 : "text-gray-500"
//             }`}
//           >
//             Results
//             {savedDefects.length > 0 && (
//               <span className="bg-indigo-500 text-white text-[8px] px-1 rounded-full">
//                 {savedDefects.length}
//               </span>
//             )}
//           </button>
//           <button
//             onClick={() => setActiveTab("summary")}
//             className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
//               activeTab === "summary"
//                 ? "bg-white dark:bg-gray-600 shadow text-indigo-600"
//                 : "text-gray-500"
//             }`}
//           >
//             <BarChart3 className="w-3 h-3" />
//             Summary
//           </button>
//         </div>
//       </div>

//       {renderActiveBanner()}

//       {activeTab === "manual" && (
//         <YPivotQAInspectionManualDefect
//           data={currentManualData}
//           onUpdate={handleManualDataUpdate}
//         />
//       )}
//       {activeTab === "list" && renderListTab()}
//       {activeTab === "results" && renderResultsTab()}
//       {activeTab === "summary" && (
//         <YPivotQAInspectionDefectSummary
//           savedDefects={savedDefects}
//           activeGroup={activeGroup}
//           reportData={reportData}
//           selectedOrders={selectedOrders}
//         />
//       )}

//       {renderConfigModal()}

//       <style jsx>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//             transform: translateY(5px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.3s ease-out;
//         }
//         .scrollbar-thin::-webkit-scrollbar {
//           height: 4px;
//         }
//         .scrollbar-thin::-webkit-scrollbar-track {
//           background: transparent;
//         }
//         .scrollbar-thin::-webkit-scrollbar-thumb {
//           background: rgba(255, 255, 255, 0.3);
//           border-radius: 2px;
//         }
//         .safe-area-top {
//           padding-top: env(safe-area-inset-top);
//         }
//         .safe-area-bottom {
//           padding-bottom: env(safe-area-inset-bottom);
//         }
//       `}</style>
//     </div>
//   );
// };

// export default YPivotQAInspectionDefectConfig;
