import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Camera,
  Upload,
  X,
  Edit3,
  Loader,
  ChevronRight,
  MessageSquare,
  Trash2,
  Save,
  AlertCircle
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQATemplatesImageEditor from "./YPivotQATemplatesImageEditor";

// ==============================================================================
// INTERNAL COMPONENT: REMARK MODAL
// ==============================================================================
const RemarkModal = ({ isOpen, onClose, onSave, initialText, title }) => {
  const [text, setText] = useState(initialText || "");

  useEffect(() => {
    if (isOpen) setText(initialText || "");
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            {title || "Add Remark"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <textarea
            className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 dark:text-gray-200 resize-none"
            placeholder="Type your remark here (max 250 chars)..."
            maxLength={250}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <span
              className={`text-xs ${
                text.length >= 250 ? "text-red-500" : "text-gray-400"
              }`}
            >
              {text.length}/250
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(text)}
            disabled={!text.trim()}
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================
const YPivotQATemplatesHeader = ({ headerData, onUpdateHeaderData }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // -- State for Selections (Initialize from props or empty) --
  const [selectedOptions, setSelectedOptions] = useState(
    headerData?.selectedOptions || {}
  );

  // -- State for Remarks (Initialize from props or empty) --
  const [remarks, setRemarks] = useState(headerData?.remarks || {});
  const [remarkModalState, setRemarkModalState] = useState({
    isOpen: false,
    sectionId: null,
    sectionTitle: ""
  });

  // -- State for Images (Initialize from props or empty) --
  const [capturedImages, setCapturedImages] = useState(
    headerData?.capturedImages || {}
  );

  const [showImageEditor, setShowImageEditor] = useState(false);
  const [currentEditContext, setCurrentEditContext] = useState(null);

  // --- Helper to Sync with Parent ---
  const updateParent = (updates) => {
    if (onUpdateHeaderData) {
      onUpdateHeaderData({
        selectedOptions,
        remarks,
        capturedImages,
        ...updates
      });
    }
  };

  // --- Fetch Header Configuration ---
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/qa-sections-home`
        );
        setSections(response.data.data);

        // Initialize default selections ONLY if no saved data exists
        // (i.e., this is the first load)
        if (
          !headerData ||
          Object.keys(headerData?.selectedOptions || {}).length === 0
        ) {
          const initialSelections = {};
          response.data.data.forEach((section) => {
            if (section.Options && section.Options.length > 0) {
              initialSelections[section._id] = section.Options[0].Name;
            }
          });
          setSelectedOptions(initialSelections);
          // We don't call updateParent here immediately to avoid render loops,
          // the state will sync on first user interaction or we can sync separately if needed.
          if (onUpdateHeaderData) {
            onUpdateHeaderData({ selectedOptions: initialSelections });
          }
        }
      } catch (error) {
        console.error("Failed to load header sections:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []); // Only run once on mount

  // --- Remark Logic ---
  const openRemarkModal = (section) => {
    setRemarkModalState({
      isOpen: true,
      sectionId: section._id,
      sectionTitle: section.MainTitle
    });
  };

  const handleSaveRemark = (text) => {
    const { sectionId } = remarkModalState;
    if (sectionId) {
      const newRemarks = { ...remarks, [sectionId]: text };
      setRemarks(newRemarks);
      updateParent({ remarks: newRemarks });
    }
    setRemarkModalState({ isOpen: false, sectionId: null, sectionTitle: "" });
  };

  const clearRemark = (sectionId) => {
    if (window.confirm("Are you sure you want to clear this remark?")) {
      const newRemarks = { ...remarks };
      delete newRemarks[sectionId];
      setRemarks(newRemarks);
      updateParent({ remarks: newRemarks });
    }
  };

  // --- Image Handling Logic ---
  const getImagesForSection = useMemo(() => {
    return (sectionId) => {
      return Object.keys(capturedImages)
        .filter((k) => k.startsWith(`${sectionId}_`))
        .map((k) => {
          const idx = parseInt(k.split("_")[1]);
          return {
            key: k,
            data: capturedImages[k],
            index: idx
          };
        })
        .sort((a, b) => a.index - b.index);
    };
  }, [capturedImages]);

  const getNextImageIndex = (sectionId) => {
    let index = 0;
    while (capturedImages[`${sectionId}_${index}`]) {
      index++;
    }
    return index;
  };

  const openImageEditor = (
    mode,
    sectionId,
    imageIndex,
    existingData = null
  ) => {
    setCurrentEditContext({
      mode,
      sectionId,
      imageIndex,
      existingData
    });
    setShowImageEditor(true);
  };

  const handleImageEditorClose = () => {
    setShowImageEditor(false);
    setCurrentEditContext(null);
  };

  const handleImageSave = (imageDataUrl, editHistory, originalImgSrc) => {
    if (currentEditContext) {
      const { sectionId, imageIndex } = currentEditContext;
      const key = `${sectionId}_${imageIndex}`;

      const newImages = {
        ...capturedImages,
        [key]: {
          url: imageDataUrl,
          history: editHistory,
          imgSrc: originalImgSrc
        }
      };

      setCapturedImages(newImages);
      updateParent({ capturedImages: newImages });
      handleImageEditorClose();
    }
  };

  const removeImage = (sectionId, imageIndex) => {
    const key = `${sectionId}_${imageIndex}`;
    const newImages = { ...capturedImages };
    delete newImages[key];
    setCapturedImages(newImages);
    updateParent({ capturedImages: newImages });
  };

  const editExistingImage = (e, sectionId, imageIndex) => {
    e.stopPropagation();
    const key = `${sectionId}_${imageIndex}`;
    const imageData = capturedImages[key];

    if (imageData) {
      openImageEditor("edit", sectionId, imageIndex, {
        imgSrc: imageData.imgSrc,
        history: imageData.history
      });
    }
  };

  // --- Option Handling ---
  const handleOptionSelect = (sectionId, optionName) => {
    const newOptions = { ...selectedOptions, [sectionId]: optionName };
    setSelectedOptions(newOptions);
    updateParent({ selectedOptions: newOptions });
  };

  // Helper for option styling
  const getOptionStyle = (optionName, isSelected) => {
    const baseStyle =
      "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700";

    if (!isSelected) return baseStyle;

    switch (optionName) {
      case "Conform":
      case "Yes":
      case "New Order":
        return "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/30";
      case "Non-Conform":
      case "No":
        return "bg-red-600 border-red-500 text-white shadow-md shadow-red-500/30";
      case "N/A":
        return "bg-orange-500 border-orange-400 text-white shadow-md shadow-orange-500/30";
      default:
        return "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn pb-20 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-3 shadow-lg mb-6">
        <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <ChevronRight className="w-4 h-4" />
          Header Inspection Data
        </h2>
      </div>

      {sections.map((section) => {
        const sectionImages = getImagesForSection(section._id);
        const canAddMore = sectionImages.length < 5;
        const currentRemark = remarks[section._id];

        return (
          <div
            key={section._id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-md overflow-hidden transition-all hover:border-gray-300 dark:hover:border-gray-700"
          >
            {/* --- TOP ROW: Title | Actions | Options --- */}
            <div className="p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              {/* 1. Left: Title */}
              <div className="min-w-[150px]">
                <h4 className="text-gray-800 dark:text-gray-100 font-bold text-sm">
                  {section.MainTitle}
                </h4>
              </div>

              {/* 2. Middle: Actions (Camera + Upload + Remark) */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Camera */}
                <button
                  onClick={() =>
                    canAddMore &&
                    openImageEditor(
                      "camera",
                      section._id,
                      getNextImageIndex(section._id)
                    )
                  }
                  disabled={!canAddMore}
                  className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${
                    canAddMore
                      ? "bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-gray-200 dark:border-gray-700 hover:border-indigo-500"
                      : "bg-gray-50 dark:bg-gray-800/50 text-gray-400 cursor-not-allowed border-gray-100 dark:border-gray-800"
                  }`}
                  title="Take Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Upload */}
                <button
                  onClick={() =>
                    canAddMore &&
                    openImageEditor(
                      "upload",
                      section._id,
                      getNextImageIndex(section._id)
                    )
                  }
                  disabled={!canAddMore}
                  className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${
                    canAddMore
                      ? "bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-gray-200 dark:border-gray-700 hover:border-emerald-500"
                      : "bg-gray-50 dark:bg-gray-800/50 text-gray-400 cursor-not-allowed border-gray-100 dark:border-gray-800"
                  }`}
                  title="Upload Image"
                >
                  <Upload className="w-4 h-4" />
                </button>

                {/* Counter */}
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mr-2">
                  {sectionImages.length}/5
                </span>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

                {/* Remark Button Logic */}
                {currentRemark ? (
                  // State: Remark Exists
                  <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden h-[34px]">
                    <button
                      onClick={() => openRemarkModal(section)}
                      className="px-3 h-full text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center gap-2"
                      title="Edit Remark"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-current" />
                      Remark Added
                    </button>
                    <div className="w-px h-4 bg-amber-200 dark:bg-amber-800"></div>
                    <button
                      onClick={() => openRemarkModal(section)}
                      className="px-2 h-full text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-amber-200 dark:bg-amber-800"></div>
                    <button
                      onClick={() => clearRemark(section._id)}
                      className="px-2 h-full text-amber-600 dark:text-amber-500 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 transition-colors"
                      title="Clear"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  // State: No Remark
                  <button
                    onClick={() => openRemarkModal(section)}
                    className="h-[34px] px-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all flex items-center gap-2 text-xs font-medium"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Add Remark
                  </button>
                )}
              </div>

              {/* 3. Right: Options */}
              <div className="flex flex-wrap items-center gap-2 justify-end flex-1">
                {section.Options.map((option) => {
                  const isSelected =
                    selectedOptions[section._id] === option.Name;
                  return (
                    <button
                      key={option.OptionNo}
                      onClick={() =>
                        handleOptionSelect(section._id, option.Name)
                      }
                      className={`
                        px-4 py-1.5 rounded-md text-xs font-bold border transition-all duration-200 
                        ${getOptionStyle(option.Name, isSelected)}
                      `}
                    >
                      {option.Name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* --- BOTTOM ROW: Images Preview (Only shows if images exist) --- */}
            {sectionImages.length > 0 && (
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800/50 pt-3 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                  {sectionImages.map(({ key, data, index }) => (
                    <div
                      key={key}
                      className="relative flex-shrink-0 w-16 h-16 group cursor-pointer"
                      onClick={(e) => editExistingImage(e, section._id, index)}
                    >
                      <img
                        src={data.url}
                        alt="Captured"
                        className="w-full h-full object-cover rounded-md border border-gray-300 dark:border-gray-600 group-hover:border-indigo-500 transition-colors shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                        <Edit3 className="w-4 h-4 text-white" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(section._id, index);
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] px-1 rounded-sm font-bold">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* --- MODALS & OVERLAYS --- */}

      {/* Image Editor */}
      {showImageEditor && currentEditContext && (
        <YPivotQATemplatesImageEditor
          autoStartMode={currentEditContext.mode}
          existingData={currentEditContext.existingData}
          onSave={handleImageSave}
          onCancel={handleImageEditorClose}
        />
      )}

      {/* Remark Modal */}
      <RemarkModal
        isOpen={remarkModalState.isOpen}
        onClose={() =>
          setRemarkModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onSave={handleSaveRemark}
        initialText={remarks[remarkModalState.sectionId]}
        title={remarkModalState.sectionTitle}
      />

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
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #4a5568;
        }
      `}</style>
    </div>
  );
};

export default YPivotQATemplatesHeader;
