import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  MapPin,
  Loader,
  Search,
  Check,
  AlertCircle,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  MessageSquare,
  Camera,
  Upload,
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";
import YPivotQATemplatesImageEditor from "./YPivotQATemplatesImageEditor";

const YPivotQATemplatesDefectLocationSelection = ({
  forcedProductTypeId = null,
  onSelectionChange = null,
  initialSelections = []
}) => {
  // --- State ---
  const [configurations, setConfigurations] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [currentConfig, setCurrentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // View State: 'Front' or 'Back'
  const [activeView, setActiveView] = useState("Front");

  // Selected Locations State
  const [selectedLocations, setSelectedLocations] = useState([]);

  // Image Editor State
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageEditorMode, setImageEditorMode] = useState(null);
  const [editingLocationId, setEditingLocationId] = useState(null);

  // Expanded cards state (for mobile view)
  const [expandedCards, setExpandedCards] = useState({});

  // Comment Modal State
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [editingComment, setEditingComment] = useState({
    locationId: null,
    pcsNo: null,
    comment: ""
  });

  const hasInitializedRef = useRef(false);

  // --- Initialization ---
  useEffect(() => {
    fetchConfigurations();
  }, []);

  // Handle Forced Product Type (From Parent)
  useEffect(() => {
    if (forcedProductTypeId && configurations.length > 0) {
      const match = configurations.find(
        (c) =>
          c.productTypeId._id === forcedProductTypeId ||
          c.productTypeId === forcedProductTypeId
      );
      if (match) {
        setSelectedConfigId(match._id);
        setCurrentConfig(match);
      }
    }
  }, [forcedProductTypeId, configurations]);

  // Handle Initial Selections (For Editing)
  useEffect(() => {
    if (!hasInitializedRef.current) {
      // Only populate if we have initial selections (edit mode)
      if (initialSelections && initialSelections.length > 0) {
        const transformedSelections = initialSelections.map((sel) => ({
          ...sel,
          qty: sel.qty || 1,
          positions: sel.positions || [
            { pcsNo: 1, position: sel.position || "Outside", comment: "" }
          ],
          images: sel.images || []
        }));
        setSelectedLocations(transformedSelections);
      }
      // IMPORTANT: Always mark as initialized, even if no initial selections
      // This allows onSelectionChange to work for new defects
      hasInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify Parent on Change - Skip if not initialized yet
  useEffect(() => {
    // Only notify parent after initial mount (not during initialization)
    if (hasInitializedRef.current && onSelectionChange) {
      onSelectionChange(selectedLocations);
    }
  }, [selectedLocations]); // Remove onSelectionChange from deps to avoid recreate issues

  const fetchConfigurations = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-product-location`
      );
      if (response.data.success) {
        setConfigurations(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleConfigChange = async (e) => {
    const configId = e.target.value;
    setSelectedConfigId(configId);
    setSelectedLocations([]);
    setActiveView("Front");

    if (!configId) {
      setCurrentConfig(null);
      return;
    }

    setLoadingConfig(true);
    try {
      const config = configurations.find((c) => c._id === configId);
      setCurrentConfig(config);
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const toggleLocationSelection = (location, viewType) => {
    const uniqueId = `${viewType}_${location._id || location.tempId}`;
    const exists = selectedLocations.find((item) => item.uniqueId === uniqueId);

    if (exists) {
      setSelectedLocations((prev) =>
        prev.filter((item) => item.uniqueId !== uniqueId)
      );
    } else {
      setSelectedLocations((prev) => [
        ...prev,
        {
          uniqueId,
          locationId: location._id || location.tempId,
          locationNo: location.LocationNo,
          locationName: location.LocationName,
          view: viewType,
          qty: 1,
          positions: [{ pcsNo: 1, position: "Outside", comment: "" }],
          images: []
        }
      ]);
      setExpandedCards((prev) => ({ ...prev, [uniqueId]: true }));
    }
  };

  // Update Qty for a location
  const updateLocationQty = (uniqueId, newQty) => {
    const qty = Math.max(1, Math.min(99, newQty));
    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === uniqueId) {
          let newPositions = [...(item.positions || [])];

          if (qty > newPositions.length) {
            for (let i = newPositions.length; i < qty; i++) {
              newPositions.push({
                pcsNo: i + 1,
                position: "Outside",
                comment: ""
              });
            }
          } else if (qty < newPositions.length) {
            newPositions = newPositions.slice(0, qty);
          }

          return { ...item, qty, positions: newPositions };
        }
        return item;
      })
    );
  };

  // Update position for a specific piece
  const updatePiecePosition = (uniqueId, pcsNo, newPosition) => {
    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === uniqueId) {
          const newPositions = item.positions.map((pos) =>
            pos.pcsNo === pcsNo ? { ...pos, position: newPosition } : pos
          );
          return { ...item, positions: newPositions };
        }
        return item;
      })
    );
  };

  // Open comment modal for a specific piece
  const openCommentModal = (uniqueId, pcsNo) => {
    const location = selectedLocations.find(
      (item) => item.uniqueId === uniqueId
    );
    const piece = location?.positions?.find((pos) => pos.pcsNo === pcsNo);

    setEditingComment({
      locationId: uniqueId,
      pcsNo: pcsNo,
      comment: piece?.comment || ""
    });
    setShowCommentModal(true);
  };

  // Save comment for a specific piece
  const saveComment = () => {
    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === editingComment.locationId) {
          const newPositions = item.positions.map((pos) =>
            pos.pcsNo === editingComment.pcsNo
              ? { ...pos, comment: editingComment.comment }
              : pos
          );
          return { ...item, positions: newPositions };
        }
        return item;
      })
    );
    setShowCommentModal(false);
    setEditingComment({ locationId: null, pcsNo: null, comment: "" });
  };

  // Cancel comment modal
  const cancelCommentModal = () => {
    setShowCommentModal(false);
    setEditingComment({ locationId: null, pcsNo: null, comment: "" });
  };

  // Open image editor
  const openImageEditor = (uniqueId, mode) => {
    setEditingLocationId(uniqueId);
    setImageEditorMode(mode);
    setShowImageEditor(true);
  };

  // Handle images from editor
  const handleImageEditorSave = (savedImages) => {
    if (!editingLocationId) return;

    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === editingLocationId) {
          const existingImages = item.images || [];
          const newImages = savedImages.map((img) => ({
            id: img.id,
            imgSrc: img.imgSrc,
            editedImgSrc: img.editedImgSrc,
            history: img.history
          }));
          return { ...item, images: [...existingImages, ...newImages] };
        }
        return item;
      })
    );

    setShowImageEditor(false);
    setEditingLocationId(null);
    setImageEditorMode(null);
  };

  // Handle image editor cancel
  const handleImageEditorCancel = () => {
    setShowImageEditor(false);
    setEditingLocationId(null);
    setImageEditorMode(null);
  };

  // Remove a specific image from location
  const removeImageFromLocation = (uniqueId, imageId) => {
    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === uniqueId) {
          return {
            ...item,
            images: item.images.filter((img) => img.id !== imageId)
          };
        }
        return item;
      })
    );
  };

  const removeSelection = (uniqueId) => {
    setSelectedLocations((prev) =>
      prev.filter((item) => item.uniqueId !== uniqueId)
    );
  };

  const handleClearAll = () => {
    if (window.confirm("Clear all selected locations?")) {
      setSelectedLocations([]);
    }
  };

  const toggleCardExpand = (uniqueId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [uniqueId]: !prev[uniqueId]
    }));
  };

  // Calculate if images are missing
  const getImageWarning = (item) => {
    const requiredImages = item.qty;
    const currentImages = item.images?.length || 0;
    if (currentImages < requiredImages) {
      const missing = requiredImages - currentImages;
      return `${missing} image${missing > 1 ? "s" : ""} required`;
    }
    return null;
  };

  // Get comment for a piece
  const getPieceComment = (item, pcsNo) => {
    const piece = item.positions?.find((pos) => pos.pcsNo === pcsNo);
    return piece?.comment || "";
  };

  // --- Render Helpers ---

  const renderMarkers = (locations, viewType) => {
    return locations.map((loc) => {
      const uniqueId = `${viewType}_${loc._id || loc.tempId}`;
      const isSelected = selectedLocations.some(
        (item) => item.uniqueId === uniqueId
      );

      const baseColorClass =
        viewType === "Front" ? "bg-red-500" : "bg-blue-500";
      const selectedClass = isSelected
        ? "ring-4 ring-green-400 scale-125 z-10 shadow-xl"
        : "opacity-80 hover:opacity-100 hover:scale-110";

      return (
        <button
          key={uniqueId}
          onClick={() => toggleLocationSelection(loc, viewType)}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-200 border-2 border-white ${baseColorClass} ${selectedClass}`}
          style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
          title={loc.LocationName}
        >
          {isSelected && (
            <Check className="w-3 h-3 absolute -top-1 -right-1 bg-green-500 rounded-full text-white p-0.5" />
          )}
          {loc.LocationNo}
        </button>
      );
    });
  };

  const renderImageView = (viewData, viewType) => {
    if (!viewData || !viewData.imagePath) return null;

    const imageUrl = `${PUBLIC_ASSET_URL}/api/qa-sections-product-location/image/${viewData.imagePath
      .split("/")
      .pop()}`;

    return (
      <div className="flex flex-col h-full animate-fadeIn">
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center p-4 min-h-[400px] overflow-hidden shadow-inner">
          <div className="relative inline-block">
            <img
              src={imageUrl}
              alt={`${viewType} View`}
              className="max-h-[400px] sm:max-h-[500px] w-auto max-w-full object-contain block"
            />
            {renderMarkers(viewData.locations, viewType)}
          </div>
        </div>
      </div>
    );
  };

  // Render Location Card
  const renderLocationCard = (item) => {
    const isExpanded = expandedCards[item.uniqueId] !== false;
    const imageWarning = getImageWarning(item);

    return (
      <div
        key={item.uniqueId}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden animate-fadeIn bg-white dark:bg-gray-800 shadow-sm"
      >
        {/* Card Header */}
        <div
          className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
            imageWarning
              ? "bg-amber-50 dark:bg-amber-900/20"
              : "bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          onClick={() => toggleCardExpand(item.uniqueId)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 ${
                item.view === "Front" ? "bg-red-500" : "bg-blue-500"
              }`}
            >
              {item.locationNo}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {item.locationName}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                  {item.view} View
                </p>
                {imageWarning && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {imageWarning}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSelection(item.uniqueId);
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Card Content (Expandable) */}
        {isExpanded && (
          <div className="p-3 space-y-4 border-t border-gray-100 dark:border-gray-700">
            {/* Qty Control + Positions Row */}
            <div className="space-y-3">
              {/* Qty Control */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Quantity
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateLocationQty(item.uniqueId, item.qty - 1)
                    }
                    disabled={item.qty <= 1}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-gray-800 dark:text-white text-sm">
                    {item.qty}
                  </span>
                  <button
                    onClick={() =>
                      updateLocationQty(item.uniqueId, item.qty + 1)
                    }
                    disabled={item.qty >= 99}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Position Toggles for each Piece */}
              <div className="space-y-2">
                {item.positions.map((pos) => {
                  const hasComment = pos.comment && pos.comment.trim() !== "";
                  return (
                    <div
                      key={pos.pcsNo}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-2"
                    >
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Pcs#{pos.pcsNo}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Comment Button */}
                        <button
                          onClick={() =>
                            openCommentModal(item.uniqueId, pos.pcsNo)
                          }
                          className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors relative ${
                            hasComment
                              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                          title={hasComment ? "Edit Comment" : "Add Comment"}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {hasComment && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
                          )}
                        </button>

                        {/* Position Toggle */}
                        <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-lg p-0.5">
                          <button
                            onClick={() =>
                              updatePiecePosition(
                                item.uniqueId,
                                pos.pcsNo,
                                "Outside"
                              )
                            }
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                              pos.position === "Outside"
                                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                          >
                            Outside
                          </button>
                          <button
                            onClick={() =>
                              updatePiecePosition(
                                item.uniqueId,
                                pos.pcsNo,
                                "Inside"
                              )
                            }
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                              pos.position === "Inside"
                                ? "bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm"
                                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                          >
                            Inside
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Images Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3 text-gray-400" />
                  <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Images
                  </label>
                </div>
                <span
                  className={`text-[9px] ${
                    (item.images?.length || 0) < item.qty
                      ? "text-amber-500"
                      : "text-green-500"
                  }`}
                >
                  {item.images?.length || 0}/{item.qty}
                </span>
              </div>

              {/* Image Upload Box */}
              <div className="flex gap-2 flex-wrap">
                {/* Existing Images */}
                {item.images?.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 group"
                  >
                    <img
                      src={img.editedImgSrc || img.imgSrc}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() =>
                        removeImageFromLocation(item.uniqueId, img.id)
                      }
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5">
                      {idx + 1}
                    </span>
                  </div>
                ))}

                {/* Add Image Box - Only show if less than qty */}
                {(item.images?.length || 0) < item.qty && (
                  <div className="relative w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 bg-gray-50 dark:bg-gray-900 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openImageEditor(item.uniqueId, "camera")}
                        className="p-1.5 rounded-md bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 transition-all"
                        title="Take Photo"
                      >
                        <Camera className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500" />
                      </button>
                      <button
                        onClick={() => openImageEditor(item.uniqueId, "upload")}
                        className="p-1.5 rounded-md bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 transition-all"
                        title="Upload Image"
                      >
                        <Upload className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500" />
                      </button>
                    </div>
                    <span className="text-[8px] text-gray-400 font-medium">
                      Add
                    </span>
                  </div>
                )}
              </div>

              {/* Image Warning */}
              {imageWarning && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md px-2 py-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[10px] font-medium">
                    {imageWarning}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* 1. Header - HIDE if forcedProductTypeId is present (embedded mode) */}
      {!forcedProductTypeId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-row items-end gap-3 w-full">
            <div className="flex-1 min-w-0">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Select Product
              </label>
              <select
                value={selectedConfigId}
                onChange={handleConfigChange}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="">-- Choose --</option>
                {configurations.map((config) => (
                  <option key={config._id} value={config._id}>
                    {config.productTypeName}
                  </option>
                ))}
              </select>
            </div>

            {selectedLocations.length > 0 && (
              <div className="flex-shrink-0">
                <div className="h-[26px] mb-2 hidden sm:block"></div>
                <div className="flex items-center gap-3 bg-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-md h-[42px]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span className="font-bold text-lg leading-none">
                      {selectedLocations.length}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-white/30"></div>
                  <button
                    onClick={handleClearAll}
                    className="hover:text-red-200 transition-colors"
                    title="Clear All"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {currentConfig ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 2. Left Side: Image Viewer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gray-200 dark:bg-gray-700/50 p-1 rounded-lg flex items-center relative">
              <button
                onClick={() => setActiveView("Front")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-md transition-all duration-300 ${
                  activeView === "Front"
                    ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-[1.02]"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    activeView === "Front" ? "bg-red-500" : "bg-gray-400"
                  }`}
                ></div>
                Front View
              </button>
              <button
                onClick={() => setActiveView("Back")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-md transition-all duration-300 ${
                  activeView === "Back"
                    ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-[1.02]"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    activeView === "Back" ? "bg-blue-500" : "bg-gray-400"
                  }`}
                ></div>
                Back View
              </button>
            </div>

            <div className="min-h-[450px]">
              {activeView === "Front"
                ? renderImageView(currentConfig.frontView, "Front")
                : renderImageView(currentConfig.backView, "Back")}
            </div>
          </div>

          {/* 3. Right Side: Selection List - NO scroll container, cards display naturally */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 border-b border-gray-700 flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Selected Locations
                </h3>
                <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full font-mono">
                  {selectedLocations.length}
                </span>
              </div>

              {/* Cards Container - No max-height, no overflow scroll */}
              <div className="p-3">
                {selectedLocations.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No locations selected.</p>
                    <p className="text-xs mt-1">
                      Toggle views and click markers to add.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedLocations.map((item) => renderLocationCard(item))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        !forcedProductTypeId && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              Select a Product Type
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Choose a product type from the dropdown above to view location
              diagrams.
            </p>
          </div>
        )
      )}

      {/* Show special loading if forced product type is present but config not loaded yet */}
      {forcedProductTypeId && !currentConfig && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <AlertCircle className="w-12 h-12 mb-2" />
          <p>No location diagram configured for this product type.</p>
          <p className="text-xs">Please configure "Product Location" first.</p>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/60 z-[9998] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                    Add Comment
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Pcs#{editingComment.pcsNo}
                  </p>
                </div>
              </div>
              <button
                onClick={cancelCommentModal}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Comment
                  </label>
                  <span
                    className={`text-[10px] ${
                      (editingComment.comment?.length || 0) >= 500
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                  >
                    {editingComment.comment?.length || 0}/500
                  </span>
                </div>
                <textarea
                  value={editingComment.comment}
                  onChange={(e) =>
                    setEditingComment((prev) => ({
                      ...prev,
                      comment: e.target.value.slice(0, 500)
                    }))
                  }
                  placeholder="Enter your comment for this piece..."
                  maxLength={500}
                  rows={4}
                  autoFocus
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
              <button
                onClick={cancelCommentModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveComment}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Save Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      {showImageEditor && (
        <YPivotQATemplatesImageEditor
          autoStartMode={imageEditorMode}
          existingData={null}
          onSave={handleImageEditorSave}
          onCancel={handleImageEditorCancel}
        />
      )}

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
      `}</style>
    </div>
  );
};

export default YPivotQATemplatesDefectLocationSelection;
