import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Bug,
  Search,
  Plus,
  X,
  Camera,
  Upload,
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
  RefreshCw,
  Layers,
  MessageSquare,
  Images,
  BarChart3,
  User
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// Sub-components
import YPivotQATemplatesDefectLocationSelection from "../QATemplates/YPivotQATemplatesDefectLocationSelection";
import YPivotQATemplatesImageEditor from "../QATemplates/YPivotQATemplatesImageEditor";
// Import buyer determination function
import { determineBuyerFromOrderNo } from "./YPivotQAInspectionBuyerDetermination";
import YPivotQAInspectionDefectSummary from "./YPivotQAInspectionDefectSummary";

const MAX_IMAGES_PER_DEFECT = 5;

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
    return result.buyer; // Returns: "Costco", "Aritzia", "Reitmans", "ANF", "MWW", "STORI", or "Unknown"
  }, [selectedOrders]);

  // --- State ---
  const [activeTab, setActiveTab] = useState("list");
  const [savedDefects, setSavedDefects] = useState(
    reportData?.defectData?.savedDefects || []
  );
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
    images: [],
    isNoLocation: false
  });

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageEditorContext, setImageEditorContext] = useState(null);

  // --- Sync to Parent ---
  const updateParent = (newDefects) => {
    if (onUpdateDefectData) {
      onUpdateDefectData({ savedDefects: newDefects });
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
      // Default fallback when no buyer or no statusByBuyer data
      return {
        statuses: ["Minor", "Major", "Critical"],
        defaultStatus: "Major"
      };
    }

    // Find matching buyer rule using the DETERMINED buyer name (case-insensitive)
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

    // Fallback if no matching buyer found - check for "Default" or "All" buyer
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

    // Ultimate fallback
    return {
      statuses: ["Minor", "Major", "Critical"],
      defaultStatus: "Major"
    };
  };

  // --- Handlers ---

  const handleOpenModal = (defectTemplate, index = null) => {
    // Get available statuses based on DETERMINED buyer
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
        images: existing.images || [],
        isNoLocation: existing.isNoLocation || false,
        selectedQC: existing.qcUser || activeGroup?.activeQC || null // <--- ADD THIS
      });
      setEditingIndex(index);
    } else {
      // New Mode
      setCurrentDefectTemplate(defectTemplate);
      setConfigForm({
        status: defaultStatus,
        qty: 1,
        locations: [],
        images: [],
        isNoLocation: false,
        selectedQC: activeGroup?.activeQC || null // <--- ADD THIS (Default to active, but allow change)
      });
      setEditingIndex(null);
    }
    setIsConfigOpen(true);
  };

  const handleSaveDefect = () => {
    if (!configForm.status) return alert("Select a status");
    if (!configForm.isNoLocation && configForm.locations.length === 0) {
      return alert("Select defect locations or check 'No Location Required'");
    }

    // --- MODIFICATION: QC Validation ---
    const isQCRequired = reportData?.selectedTemplate?.isQCScan === "Yes";
    // Check if we have assignments available to pick from
    const hasQCAssignments = activeGroup?.assignments?.some((a) => a.qcUser);

    if (isQCRequired && hasQCAssignments && !configForm.selectedQC) {
      return alert("Please select a QC / Inspector for this defect.");
    }
    // -----------------------------------

    const defectEntry = {
      ...configForm,
      defectId: currentDefectTemplate._id,
      defectName: currentDefectTemplate.english,
      defectCode: currentDefectTemplate.code,
      categoryName: currentDefectTemplate.CategoryNameEng,
      groupId: activeGroup?.id,
      line: activeGroup?.line,
      table: activeGroup?.table,
      color: activeGroup?.color,

      // --- MODIFICATION: Save Selected QC ---
      qcUser: configForm.selectedQC,
      // -------------------------------------

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

  // --- Image Handlers (Updated for multi-image) ---

  const getAvailableImageSlots = () => {
    return MAX_IMAGES_PER_DEFECT - configForm.images.length;
  };

  const openImageEditorForNew = (mode) => {
    const availableSlots = getAvailableImageSlots();
    if (availableSlots <= 0) {
      alert(`Maximum ${MAX_IMAGES_PER_DEFECT} images allowed!`);
      return;
    }

    setImageEditorContext({
      mode,
      isEditing: false,
      maxImages: availableSlots,
      existingData: null
    });
    setShowImageEditor(true);
  };

  const openImageEditorForEdit = (imageIndex) => {
    const imageData = configForm.images[imageIndex];
    if (imageData) {
      setImageEditorContext({
        mode: "edit",
        isEditing: true,
        imageIndex,
        maxImages: 1,
        existingData: [
          {
            imgSrc: imageData.imgSrc || imageData.url,
            history: imageData.history || []
          }
        ]
      });
      setShowImageEditor(true);
    }
  };

  const handleImagesSave = (savedImages) => {
    if (!savedImages || savedImages.length === 0) {
      setShowImageEditor(false);
      setImageEditorContext(null);
      return;
    }

    setConfigForm((prev) => {
      let newImages = [...prev.images];

      if (
        imageEditorContext?.isEditing &&
        imageEditorContext?.imageIndex !== undefined
      ) {
        const img = savedImages[0];
        newImages[imageEditorContext.imageIndex] = {
          url: img.editedImgSrc,
          imgSrc: img.imgSrc,
          history: img.history || []
        };
      } else {
        const availableSlots = MAX_IMAGES_PER_DEFECT - newImages.length;
        const imagesToAdd = savedImages.slice(0, availableSlots);

        imagesToAdd.forEach((img) => {
          newImages.push({
            url: img.editedImgSrc,
            imgSrc: img.imgSrc,
            history: img.history || []
          });
        });

        if (savedImages.length > availableSlots) {
          setTimeout(() => {
            alert(
              `Only ${availableSlots} image(s) were added. Maximum ${MAX_IMAGES_PER_DEFECT} images per defect.`
            );
          }, 100);
        }
      }

      return { ...prev, images: newImages };
    });

    setShowImageEditor(false);
    setImageEditorContext(null);
  };

  const removeImage = (index, e) => {
    if (e) e.stopPropagation();
    setConfigForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleCategory = (cat) => {
    setExpandedCategories((p) => ({ ...p, [cat]: !p[cat] }));
  };

  // --- Helper: Get remarks as comma-separated string for display ---
  const getRemarksDisplay = (locations) => {
    if (!locations || locations.length === 0) return null;
    const remarks = locations
      .filter((loc) => loc.remark && loc.remark.trim())
      .map((loc) => loc.remark.trim());
    if (remarks.length === 0) return null;
    return remarks.join(", ");
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
                  const remarksDisplay = getRemarksDisplay(item.locations);

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
                                    <span className="text-[8px] text-gray-400 bg-white px-1 rounded">
                                      {loc.position}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Remarks section - comma separated display */}
                            {remarksDisplay && (
                              <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1.5 border border-amber-200 dark:border-amber-800">
                                <MessageSquare className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-[9px] text-amber-700 dark:text-amber-400 break-words leading-relaxed">
                                  {remarksDisplay}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer with images and actions */}
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          {item.images.length > 0 ? (
                            <div className="flex gap-1.5">
                              {item.images.slice(0, 4).map((img, i) => (
                                <img
                                  key={i}
                                  src={img.url}
                                  className="w-7 h-7 rounded-md border-2 border-white object-cover shadow-sm"
                                  alt="thumb"
                                />
                              ))}
                              {item.images.length > 4 && (
                                <span className="text-[9px] text-gray-500 flex items-center">
                                  +{item.images.length - 4}
                                </span>
                              )}
                            </div>
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
  const renderConfigModal = () =>
    createPortal(
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Section - Dynamic based on DETERMINED buyer */}
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
              {(!determinedBuyer || determinedBuyer === "Unknown") && (
                <p className="text-[10px] text-amber-500 mt-2">
                  No buyer detected - showing default statuses
                </p>
              )}
            </section>

            {/* Quantity Section */}
            <section className="col-span-1 md:col-span-1">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                Quantity & Inspector
              </h3>

              {/* Flex Container: Mobile (Col), Desktop (Row) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* 1. Quantity Stepper */}
                <div className="flex items-center gap-2 flex-shrink-0">
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
                </div>

                {/* 2. QC Selection Cards (Only if QC Required & Available) */}
                {reportData?.selectedTemplate?.isQCScan === "Yes" &&
                  activeGroup?.assignments?.some((a) => a.qcUser) && (
                    <div className="flex-1 w-full sm:w-auto overflow-x-auto pb-1">
                      <div className="flex items-center gap-2">
                        {/* Divider for Desktop */}
                        <div className="hidden sm:block w-px h-10 bg-gray-200 mx-2"></div>

                        <div className="flex gap-2">
                          {activeGroup.assignments
                            .filter((a) => a.qcUser) // Only show slots with users
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
                                  {/* Top: Emp ID */}
                                  <span
                                    className={`text-[9px] font-bold mb-1 ${
                                      isSelected
                                        ? "text-indigo-700"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {qc.emp_id}
                                  </span>

                                  {/* Middle: Photo or Icon */}
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

                                  {/* Bottom: Name */}
                                  <span
                                    className={`text-[8px] font-medium mt-1 truncate w-full text-center ${
                                      isSelected
                                        ? "text-indigo-800"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {qc.eng_name}
                                  </span>

                                  {/* Checkmark Badge */}
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

          {/* Locations */}
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
                      locations: []
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
                onSelectionChange={(locs) =>
                  setConfigForm((prev) => ({ ...prev, locations: locs }))
                }
              />
            )}
          </section>

          {/* Images - Updated for multi-image support */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Images className="w-4 h-4" />
                Images
              </h3>
              <span className="text-xs text-gray-400">
                {configForm.images.length}/{MAX_IMAGES_PER_DEFECT}
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {/* Existing Images */}
              {configForm.images.map((img, i) => (
                <div
                  key={i}
                  className="relative w-24 h-24 flex-shrink-0 group cursor-pointer"
                  onClick={() => openImageEditorForEdit(i)}
                >
                  <img
                    src={img.url}
                    className="w-full h-full object-cover rounded-lg border-2 border-gray-300 group-hover:border-indigo-500 transition-colors"
                    alt={`Defect ${i + 1}`}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  <button
                    onClick={(e) => removeImage(i, e)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                    #{i + 1}
                  </div>
                </div>
              ))}

              {/* Add New Images Button */}
              {configForm.images.length < MAX_IMAGES_PER_DEFECT && (
                <div className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col overflow-hidden hover:border-indigo-400 transition-colors">
                  <button
                    onClick={() => openImageEditorForNew("camera")}
                    className="flex-1 w-full flex items-center justify-center hover:bg-indigo-50 border-b border-gray-200 transition-colors group"
                    title={`Take photos (${getAvailableImageSlots()} slots available)`}
                  >
                    <Camera className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </button>
                  <button
                    onClick={() => openImageEditorForNew("upload")}
                    className="flex-1 w-full flex items-center justify-center hover:bg-emerald-50 transition-colors group"
                    title={`Upload images (${getAvailableImageSlots()} slots available)`}
                  >
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                  </button>
                </div>
              )}

              {/* Slots indicator */}
              {configForm.images.length > 0 &&
                configForm.images.length < MAX_IMAGES_PER_DEFECT && (
                  <div className="flex-shrink-0 flex items-center justify-center px-2">
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      +{getAvailableImageSlots()} slots
                    </span>
                  </div>
                )}
            </div>

            {/* Empty state hint */}
            {configForm.images.length === 0 && (
              <p className="text-[10px] text-gray-400 mt-2 text-center flex items-center justify-center gap-1">
                <Images className="w-3 h-3" />
                You can add up to {MAX_IMAGES_PER_DEFECT} images
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white dark:bg-gray-800 safe-area-bottom">
          <button
            onClick={handleSaveDefect}
            // --- MODIFICATION: Disable button logic ---
            disabled={
              reportData?.selectedTemplate?.isQCScan === "Yes" &&
              activeGroup?.assignments?.some((a) => a.qcUser) &&
              !configForm.selectedQC
            }
            className={`w-full py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
              reportData?.selectedTemplate?.isQCScan === "Yes" &&
              activeGroup?.assignments?.some((a) => a.qcUser) &&
              !configForm.selectedQC
                ? "bg-gray-300 text-gray-500 cursor-not-allowed" // Disabled Style
                : "bg-indigo-600 text-white hover:bg-indigo-700" // Active Style
            }`}
          >
            <Save className="w-5 h-5" />{" "}
            {editingIndex !== null ? "Update Defect" : "Add Defect"}
          </button>
        </div>

        {/* Image Editor */}
        {showImageEditor && (
          <YPivotQATemplatesImageEditor
            autoStartMode={
              imageEditorContext?.isEditing ? null : imageEditorContext?.mode
            }
            existingData={imageEditorContext?.existingData}
            maxImages={imageEditorContext?.maxImages || 1}
            onSave={handleImagesSave}
            onCancel={() => {
              setShowImageEditor(false);
              setImageEditorContext(null);
            }}
          />
        )}
      </div>,
      document.body
    );

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
