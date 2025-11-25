import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Camera,
  UploadCloud,
  Image as ImageIcon,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

const YPivotQATemplatesPhotos = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  // Stores local image previews: { [sectionId_itemNo_index]: previewUrl }
  const [imagePreviews, setImagePreviews] = useState({});

  // Stores the current count of active slots per item: { [sectionId_itemNo]: count }
  const [slotCounts, setSlotCounts] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-photos`
      );
      setSections(response.data.data);

      // Initialize slot counts to 1 for every item
      const initialCounts = {};
      response.data.data.forEach((sec) => {
        sec.itemList.forEach((item) => {
          initialCounts[`${sec._id}_${item.no}`] = 1;
        });
      });
      setSlotCounts(initialCounts);
    } catch (error) {
      console.error("Error fetching photo sections:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  // --- Slot Management ---
  const addSlot = (sectionId, itemNo, maxCount) => {
    const key = `${sectionId}_${itemNo}`;
    setSlotCounts((prev) => {
      const current = prev[key] || 1;
      if (current < maxCount) {
        return { ...prev, [key]: current + 1 };
      }
      return prev;
    });
  };

  // --- Image Handling ---
  const handleImageUpload = (e, sectionId, itemNo, index) => {
    const file = e.target.files[0];
    if (file) {
      const key = `${sectionId}_${itemNo}_${index}`;
      const url = URL.createObjectURL(file);
      setImagePreviews((prev) => ({ ...prev, [key]: url }));
    }
  };

  // --- Remove Logic with Shifting ---
  const removeImage = (sectionId, itemNo, indexToRemove) => {
    const itemKey = `${sectionId}_${itemNo}`;
    const currentCount = slotCounts[itemKey] || 1;

    // If it's the only slot (Slot 1), just clear the image, keep the slot
    if (currentCount <= 1) {
      const key = `${itemKey}_0`;
      setImagePreviews((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      return;
    }

    // If multiple slots exist: Remove image, Shift others up, Reduce count
    setImagePreviews((prev) => {
      const nextPreviews = { ...prev };

      // 1. Delete target image
      delete nextPreviews[`${itemKey}_${indexToRemove}`];

      // 2. Shift any images at higher indices down by 1
      for (let i = indexToRemove + 1; i < currentCount; i++) {
        const oldKey = `${itemKey}_${i}`;
        const newKey = `${itemKey}_${i - 1}`;

        if (nextPreviews[oldKey]) {
          nextPreviews[newKey] = nextPreviews[oldKey];
          delete nextPreviews[oldKey];
        }
      }
      return nextPreviews;
    });

    // 3. Reduce the slot count
    setSlotCounts((prev) => ({
      ...prev,
      [itemKey]: currentCount - 1
    }));
  };

  // Helper to remove an empty extra slot (if user clicked + but didn't add image)
  const removeEmptySlot = (sectionId, itemNo) => {
    const itemKey = `${sectionId}_${itemNo}`;
    setSlotCounts((prev) => {
      const current = prev[itemKey] || 1;
      if (current > 1) {
        return { ...prev, [itemKey]: current - 1 };
      }
      return prev;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Photo Configuration Preview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Visualize inspection photo capture workflow.
          </p>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSection === section._id;

          return (
            <div
              key={section._id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section._id)}
                className={`
                  w-full flex items-center justify-between p-4 text-left transition-colors
                  ${
                    isExpanded
                      ? "bg-indigo-50 dark:bg-indigo-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isExpanded
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-200"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">
                      {section.sectionName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {section.itemList?.length || 0} Sub-sections
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Items Grid */}
              {isExpanded && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="grid grid-cols-1 gap-4">
                    {section.itemList.map((item) => {
                      const currentSlots =
                        slotCounts[`${section._id}_${item.no}`] || 1;
                      const isMaxReached = currentSlots >= item.maxCount;

                      return (
                        <div
                          key={item.no}
                          className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                        >
                          {/* Item Header */}
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                              <span className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-extrabold">
                                {item.no}
                              </span>
                              {item.itemName}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                {currentSlots} / {item.maxCount}
                              </span>
                            </div>
                          </div>

                          {/* Horizontal Scrolling Image List */}
                          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                            {/* Render Active Slots */}
                            {Array.from({ length: currentSlots }).map(
                              (_, idx) => {
                                const key = `${section._id}_${item.no}_${idx}`;
                                const hasImage = imagePreviews[key];

                                return (
                                  <div
                                    key={idx}
                                    className="flex-shrink-0 w-24 h-24 relative group"
                                  >
                                    {hasImage ? (
                                      <>
                                        <img
                                          src={hasImage}
                                          alt="Preview"
                                          className="w-full h-full object-cover rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm"
                                        />
                                        <button
                                          onClick={() =>
                                            removeImage(
                                              section._id,
                                              item.no,
                                              idx
                                            )
                                          }
                                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md transform hover:scale-110"
                                          title="Remove image & slot"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 rounded backdrop-blur-sm">
                                          #{idx + 1}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="relative w-full h-full">
                                        <label className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
                                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full group-hover:scale-110 transition-transform">
                                            <Camera className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                                          </div>
                                          <span className="text-[10px] mt-1 text-gray-400 group-hover:text-indigo-500 font-medium">
                                            Add Photo
                                          </span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) =>
                                              handleImageUpload(
                                                e,
                                                section._id,
                                                item.no,
                                                idx
                                              )
                                            }
                                          />
                                        </label>

                                        {/* Remove Empty Slot Button (Only if not the first slot) */}
                                        {idx > 0 && (
                                          <button
                                            onClick={() =>
                                              removeEmptySlot(
                                                section._id,
                                                item.no
                                              )
                                            }
                                            className="absolute -top-2 -right-2 bg-gray-400 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
                                            title="Remove empty slot"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            )}

                            {/* Add Slot Button */}
                            {!isMaxReached && (
                              <button
                                onClick={() =>
                                  addSlot(section._id, item.no, item.maxCount)
                                }
                                className="flex-shrink-0 w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
                              >
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                                  <Plus className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                </div>
                                <span className="text-xs text-gray-400 font-medium mt-1">
                                  Add Slot
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sections.length === 0 && !loading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
            No Photo Sections Found
          </h3>
        </div>
      )}

      {/* Mobile Note */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur-sm z-50 pointer-events-none whitespace-nowrap">
        Preview Mode Only
      </div>
    </div>
  );
};

export default YPivotQATemplatesPhotos;
