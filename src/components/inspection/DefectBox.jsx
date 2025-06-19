import React, { useMemo } from "react";
import { Minus, Plus, X } from "lucide-react";
import { API_BASE_URL } from "../../../config";

const DefectBox = ({
  language,
  tempDefects,
  onDefectUpdate,
  activeFilter,
  confirmedDefects,
  sortOption,
  defectsData
}) => {
  const handleDefectChange = (index, change) => {
    const newCount = (tempDefects[index] || 0) + change;
    onDefectUpdate({
      ...tempDefects,
      [index]: Math.max(0, newCount)
    });
  };

  const handleClearDefect = (index, event) => {
    // --- FIX 2b: Stop event propagation ---
    // This prevents the click from bubbling up to the main div and incrementing the count.
    event.stopPropagation();
    const newTempDefects = { ...tempDefects };
    delete newTempDefects[index];
    onDefectUpdate(newTempDefects);
  };

  // --- FIX 1: Corrected Language Switching Logic ---
  // This function now correctly uses the `language` prop to select the right field
  // from the defect object. It falls back to the English name if a translation is missing.
  const getDefectName = (defect) => {
    return defect[language] || defect.english;
  };

  const filteredAndSortedDefects = useMemo(() => {
    // ... (This logic is correct and remains unchanged) ...
    if (!defectsData) return [];
    let filtered = [...defectsData];
    if (activeFilter && activeFilter !== "all") {
      if (activeFilter === "common") {
        filtered = filtered.filter((d) => d.isCommon === "yes");
      } else if (activeFilter === "type1") {
        filtered = filtered.filter((d) => d.type === 1);
      } else if (activeFilter === "type2") {
        filtered = filtered.filter((d) => d.type === 2);
      } else {
        filtered = filtered.filter(
          (d) => d.categoryEnglish.toLowerCase() === activeFilter.toLowerCase()
        );
      }
    }
    if (sortOption === "alphaAsc") {
      filtered.sort((a, b) => a.english.localeCompare(b.english));
    } else if (sortOption === "alphaDesc") {
      filtered.sort((a, b) => b.english.localeCompare(a.english));
    } else if (sortOption === "countDesc") {
      filtered.sort((a, b) => {
        const indexA = defectsData.findIndex((d) => d._id === a._id);
        const indexB = defectsData.findIndex((d) => d._id === b._id);
        const countA =
          (confirmedDefects[indexA] || 0) + (tempDefects[indexA] || 0);
        const countB =
          (confirmedDefects[indexB] || 0) + (tempDefects[indexB] || 0);
        return countB - countA;
      });
    }
    return filtered;
  }, [defectsData, activeFilter, sortOption, tempDefects, confirmedDefects]);

  const imageBaseUrl = API_BASE_URL.endsWith("/api")
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 p-2">
      {filteredAndSortedDefects.map((defect) => {
        const originalIndex = defectsData.findIndex(
          (d) => d._id === defect._id
        );
        if (originalIndex === -1) return null;

        const count = tempDefects[originalIndex] || 0;
        const confirmedCount = confirmedDefects[originalIndex] || 0;
        const totalCount = count + confirmedCount;
        const isActive = count > 0;

        return (
          // --- FIX 2a: Add onClick to the main div ---
          <div
            key={defect._id}
            onClick={() => handleDefectChange(originalIndex, 1)} // Increment on click
            className={`relative border rounded-lg p-2 flex flex-col items-center justify-between transition-all duration-200 shadow-sm cursor-pointer ${
              // Add cursor-pointer
              isActive
                ? "bg-red-100 border-red-400"
                : "bg-white border-gray-200 hover:bg-gray-50" // Add hover effect
            }`}
          >
            <div className="w-full h-24 bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden pointer-events-none">
              {" "}
              {/* Prevent clicks on image area */}
              {defect.image ? (
                <img
                  src={`${imageBaseUrl}${defect.image}`}
                  alt={defect.english}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-400 text-xs">No Image</span>
              )}
            </div>
            <p className="text-center text-xs sm:text-sm font-medium text-gray-800 flex-grow pointer-events-none">
              {" "}
              {/* Prevent clicks on text */}
              {getDefectName(defect)}
            </p>
            <div className="mt-2 w-full flex items-center justify-center space-x-2">
              <button
                // --- FIX 2b: Stop event propagation ---
                onClick={(e) => {
                  e.stopPropagation();
                  handleDefectChange(originalIndex, -1);
                }}
                className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50"
                disabled={count === 0}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-bold w-8 text-center tabular-nums pointer-events-none">
                {" "}
                {/* Prevent clicks on number */}
                {count}
              </span>
              <button
                // --- FIX 2b: Stop event propagation ---
                onClick={(e) => {
                  e.stopPropagation();
                  handleDefectChange(originalIndex, 1);
                }}
                className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {totalCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center pointer-events-none">
                {" "}
                {/* Prevent clicks on badge */}
                {totalCount}
              </div>
            )}
            {count > 0 && (
              <button
                onClick={(e) => handleClearDefect(originalIndex, e)} // Pass event to handler
                className="absolute -top-2 -left-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full p-0.5"
                title="Clear unsaved count"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DefectBox;
