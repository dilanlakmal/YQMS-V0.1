import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Camera, Upload, X, Edit3, Loader, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQATemplatesImageEditor from "./YPivotQATemplatesImageEditor";

const YPivotQATemplatesHeader = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState({}); // { sectionId: optionName }

  // Image Editor State
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [currentEditContext, setCurrentEditContext] = useState(null);

  // Store complete image data
  const [capturedImages, setCapturedImages] = useState({});

  // --- Fetch Header Configuration ---
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/qa-sections-home`
        );
        setSections(response.data.data);

        // Initialize default selections: ALWAYS SELECT THE FIRST OPTION
        const initialSelections = {};
        response.data.data.forEach((section) => {
          if (section.Options && section.Options.length > 0) {
            initialSelections[section._id] = section.Options[0].Name;
          }
        });
        setSelectedOptions(initialSelections);
      } catch (error) {
        console.error("Failed to load header sections:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

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

      setCapturedImages((prev) => ({
        ...prev,
        [key]: {
          url: imageDataUrl,
          history: editHistory,
          imgSrc: originalImgSrc
        }
      }));

      handleImageEditorClose();
    }
  };

  const removeImage = (sectionId, imageIndex) => {
    const key = `${sectionId}_${imageIndex}`;
    setCapturedImages((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
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
    setSelectedOptions((prev) => ({ ...prev, [sectionId]: optionName }));
  };

  // Helper for option styling - Updated for Light/Dark themes
  const getOptionStyle = (optionName, isSelected) => {
    // Base style for unselected: Light Gray (Light Mode) / Dark Gray (Dark Mode)
    const baseStyle =
      "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700";

    if (!isSelected) return baseStyle;

    // Selected Styles (Keep colorful for both themes)
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

        return (
          <div
            key={section._id}
            // Card Container: White in Light Mode, Dark Gray in Dark Mode
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-md overflow-hidden transition-all hover:border-gray-300 dark:hover:border-gray-700"
          >
            {/* --- TOP ROW: Title | Actions | Options --- */}
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Title + Actions */}
              <div className="flex items-center gap-4 flex-1">
                {/* Title */}
                <div className="min-w-[120px]">
                  <h4 className="text-gray-800 dark:text-gray-100 font-bold text-sm">
                    {section.MainTitle}
                  </h4>
                </div>

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

                {/* Actions: Camera & Upload */}
                <div className="flex items-center gap-2">
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
                        ? "bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500"
                        : "bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-100 dark:border-gray-800"
                    }`}
                    title="Take Photo"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">
                      Camera
                    </span>
                  </button>

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
                        ? "bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500"
                        : "bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-100 dark:border-gray-800"
                    }`}
                    title="Upload Image"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">
                      Upload
                    </span>
                  </button>

                  {/* Counter */}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono ml-1">
                    {sectionImages.length}/5
                  </span>
                </div>
              </div>

              {/* Right: Options */}
              <div className="flex items-center gap-2 justify-end">
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

            {/* --- BOTTOM ROW: Images (Only shows if images exist) --- */}
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

                      {/* Edit Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                        <Edit3 className="w-4 h-4 text-white" />
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(section._id, index);
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* Number Badge */}
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

      {/* Image Editor Modal */}
      {showImageEditor && currentEditContext && (
        <YPivotQATemplatesImageEditor
          autoStartMode={currentEditContext.mode}
          existingData={currentEditContext.existingData}
          onSave={handleImageSave}
          onCancel={handleImageEditorClose}
        />
      )}

      {/* Preview Badge */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur-sm z-40 border border-gray-700 flex items-center gap-2 pointer-events-none">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="font-semibold">Header Data Preview</span>
      </div>

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
          animation: fadeIn 0.5s ease-out;
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
