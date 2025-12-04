import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  Search,
  XCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Edit3
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQATemplatesImageEditor from "./YPivotQATemplatesImageEditor";

const YPivotQATemplatesPhotos = ({ allowedSectionIds = [] }) => {
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [deviceType, setDeviceType] = useState("desktop");

  // Image editor state
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [currentEditContext, setCurrentEditContext] = useState(null);

  // Store complete image data: { sectionId_itemNo_index: { url, history, imgSrc } }
  const [capturedImages, setCapturedImages] = useState({});

  // Device detection
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 768) return "mobile";
      if (width < 1024) return "tablet";
      return "desktop";
    };
    setDeviceType(detectDevice());
    const handleResize = () => setDeviceType(detectDevice());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = sections;

    // 1. Filter by Report Type Configuration (if allowedSectionIds is provided)
    if (allowedSectionIds && allowedSectionIds.length > 0) {
      result = result.filter((section) =>
        allowedSectionIds.includes(section._id)
      );
    }

    // 2. Filter by Search Query
    if (searchQuery.trim() === "") {
      const query = searchQuery.toLowerCase();
      result = result
        .map((section) => ({
          ...section,
          itemList: section.itemList.filter((item) =>
            item.itemName.toLowerCase().includes(query)
          )
        }))
        .filter((section) => section.itemList.length > 0);
    }

    setFilteredSections(result);
  }, [searchQuery, sections, allowedSectionIds]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-photos`
      );
      setSections(response.data.data);
      //setFilteredSections(response.data.data);
    } catch (error) {
      console.error("Error fetching photo sections:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const openImageEditor = (
    mode,
    sectionId,
    itemNo,
    imageIndex,
    existingData = null
  ) => {
    setCurrentEditContext({
      mode,
      sectionId,
      itemNo,
      imageIndex,
      existingData // { imgSrc, history } for re-editing
    });
    setShowImageEditor(true);
  };

  const handleImageEditorClose = () => {
    setShowImageEditor(false);
    setCurrentEditContext(null);
  };

  const handleImageSave = (imageDataUrl, editHistory, originalImgSrc) => {
    if (currentEditContext) {
      const { sectionId, itemNo, imageIndex } = currentEditContext;
      const key = `${sectionId}_${itemNo}_${imageIndex}`;

      setCapturedImages((prev) => ({
        ...prev,
        [key]: {
          url: imageDataUrl, // Final rendered image with annotations
          history: editHistory, // Edit history for re-editing
          imgSrc: originalImgSrc // Original image source
        }
      }));

      handleImageEditorClose();
    }
  };

  const removeImage = (sectionId, itemNo, imageIndex) => {
    const key = `${sectionId}_${itemNo}_${imageIndex}`;
    setCapturedImages((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const editExistingImage = (e, sectionId, itemNo, imageIndex) => {
    e.stopPropagation();
    const key = `${sectionId}_${itemNo}_${imageIndex}`;
    const imageData = capturedImages[key];

    if (imageData) {
      openImageEditor("edit", sectionId, itemNo, imageIndex, {
        imgSrc: imageData.imgSrc,
        history: imageData.history
      });
    }
  };

  // Memoized function to get images for an item
  const getImagesForItem = useMemo(() => {
    return (sectionId, itemNo) => {
      const images = [];
      let index = 0;
      while (images.length < 20) {
        const key = `${sectionId}_${itemNo}_${index}`;
        if (capturedImages[key]) {
          images.push({
            key,
            data: capturedImages[key],
            index
          });
        } else {
          break;
        }
        index++;
      }
      return images;
    };
  }, [capturedImages]);

  const getNextImageIndex = (sectionId, itemNo) => {
    let index = 0;
    while (capturedImages[`${sectionId}_${itemNo}_${index}`]) {
      index++;
    }
    return index;
  };

  // Grid columns based on device
  const getGridCols = () => {
    if (deviceType === "mobile") return "grid-cols-1";
    if (deviceType === "tablet") return "grid-cols-2";
    return "grid-cols-3";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Compact Header with Search Only */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-4 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search photo sections..."
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white dark:bg-gray-800 border-2 border-transparent focus:border-white focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm text-gray-800 dark:text-white placeholder-gray-400 shadow-md"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sections List */}
      {filteredSections.length > 0 ? (
        <div className="space-y-3">
          {filteredSections.map((section) => {
            const isExpanded = expandedSections.has(section._id);

            return (
              <div
                key={section._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Main Section Header - Clickable */}
                <button
                  onClick={() => toggleSection(section._id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                      <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                        {section.sectionName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {section.itemList.length} items
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Sub-cards Grid - Expandable */}
                {isExpanded && (
                  <div
                    className={`grid ${getGridCols()} gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700`}
                  >
                    {section.itemList.map((item) => {
                      const images = getImagesForItem(section._id, item.no);
                      const canAddMore = images.length < item.maxCount;

                      return (
                        <div
                          key={item.no}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Sub-card Title */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded text-xs font-bold">
                                {item.no}
                              </span>
                              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                                {item.itemName}
                              </h4>
                            </div>
                            <span className="flex-shrink-0 text-xs font-bold text-gray-500 dark:text-gray-400 ml-2">
                              {images.length}/{item.maxCount}
                            </span>
                          </div>

                          {/* Images Container - Horizontal Scroll */}
                          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                            {/* Existing Images - Click to Edit */}
                            {images.map(({ key, data, index }) => (
                              <div
                                key={key}
                                className="relative flex-shrink-0 w-20 h-20 group cursor-pointer"
                                onClick={(e) =>
                                  editExistingImage(
                                    e,
                                    section._id,
                                    item.no,
                                    index
                                  )
                                }
                              >
                                <img
                                  src={data.url}
                                  alt={`Photo ${index + 1}`}
                                  className="w-full h-full object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600 group-hover:border-indigo-400 transition-colors"
                                />

                                {/* Edit Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <Edit3 className="w-5 h-5 text-white" />
                                </div>

                                {/* Delete Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(section._id, item.no, index);
                                  }}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                >
                                  <X className="w-3 h-3" />
                                </button>

                                {/* Number Badge */}
                                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm font-bold">
                                  #{index + 1}
                                </div>
                              </div>
                            ))}

                            {/* Add New Image - Combined Rectangle */}
                            {canAddMore && (
                              <div className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                                {/* Camera Button - Top Half */}
                                <button
                                  onClick={() =>
                                    openImageEditor(
                                      "camera",
                                      section._id,
                                      item.no,
                                      getNextImageIndex(section._id, item.no)
                                    )
                                  }
                                  className="w-full h-1/2 flex flex-col items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group border-b border-gray-300 dark:border-gray-600"
                                >
                                  <Camera className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                                </button>

                                {/* Upload Button - Bottom Half */}
                                <button
                                  onClick={() =>
                                    openImageEditor(
                                      "upload",
                                      section._id,
                                      item.no,
                                      getNextImageIndex(section._id, item.no)
                                    )
                                  }
                                  className="w-full h-1/2 flex flex-col items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group"
                                >
                                  <Upload className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
                                </button>
                              </div>
                            )}

                            {/* Max Reached Indicator */}
                            {!canAddMore && (
                              <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center border-2 border-green-300 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
                                <div className="text-center">
                                  <div className="w-6 h-6 mx-auto mb-1 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">
                                      ✓
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-bold text-green-600 dark:text-green-400">
                                    Max
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Empty State
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">
            No Results Found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Try different search terms
          </p>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-semibold transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

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
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur-sm z-40 border border-gray-700 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="font-semibold">Preview Mode</span>
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

export default YPivotQATemplatesPhotos;
