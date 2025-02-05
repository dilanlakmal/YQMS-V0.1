import { useState, useEffect } from "react";
import {
  ArrowDownAZ,
  ArrowDownZA,
  ArrowDownWideNarrow,
  Minus,
  Plus,
  Upload,
  Info,
} from "lucide-react";
import { ImageUploadDialog } from "./ImageUploadDialog";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import {
  defectsList,
  commonDefects,
  TypeOneDefects,
  TypeTwoDefects,
  FabricDefects,
  WorkmanshipDefects,
  CleanlinessDefects,
  EmbellishmentDefects,
  MeasurementDefects,
  WashingDefects,
  FinishingDefects,
  MiscellaneousDefects,
} from "../../constants/QC Inspection/defects";
import { defectImages, defaultDefectImage } from "../../constants/QC Inspection/defectimages";

function DefectsList({
  view,
  language,
  defects,
  onDefectUpdate,
  onLogEntry,
  isPlaying,
  onDefectSelect,
  currentDefectCount,
  onCurrentDefectUpdate,
  isReturnView = false,
}) {
  const defectItems = defectsList[language];
  const [activeCell, setActiveCell] = useState(null);
  const [sortType, setSortType] = useState("none");
  const [selectedLetters, setSelectedLetters] = useState(new Set());
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isCommonSelected, setIsCommonSelected] = useState(false);
  const [isTypeOneSelected, setIsTypeOneSelected] = useState(false);
  const [isTypeTwoSelected, setIsTypeTwoSelected] = useState(false);
  const [isFabricSelected, setIsFabricSelected] = useState(false);
  const [isWorkmanshipSelected, setIsWorkmanshipSelected] = useState(false);
  const [isCleanlinessSelected, setIsCleanlinessSelected] = useState(false);
  const [isEmbellishmentSelected, setIsEmbellishmentSelected] = useState(false);
  const [isMeasurementSelected, setIsMeasurementSelected] = useState(false);
  const [isWashingSelected, setIsWashingSelected] = useState(false);
  const [isFinishingSelected, setIsFinishingSelected] = useState(false);
  const [isMiscellaneousSelected, setIsMiscellaneousSelected] = useState(false);
  const [selectedDefectIndex, setSelectedDefectIndex] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showLetterDropdown, setShowLetterDropdown] = useState(false); // State for letter dropdown
  const [defectImages, setDefectImages] = useState({});

  // Get unique first letters from defect names
  let uniqueLetters = [];
  if (language === "all") {
    // Extract the first letter of the English part (before the first backslash)
    uniqueLetters = [
      ...new Set(
        defectItems
          .filter((item) => item.name && item.name.length > 0)
          .map((item) => item.name.split(" \\ ")[0].charAt(0).toUpperCase())
      ),
    ].sort();
  } else {
    // For other languages, use the first letter of the defect name
    uniqueLetters = [
      ...new Set(
        defectItems
          .filter((item) => item.name && item.name.length > 0)
          .map((item) => item.name.charAt(0).toUpperCase())
      ),
    ].sort();
  }

  // Handle letter filter selection
  const handleLetterFilter = (letter) => {
    setSelectedLetters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(letter)) {
        newSet.delete(letter);
      } else {
        newSet.add(letter);
      }
      return newSet;
    });
    setIsCommonSelected(false);
    setIsTypeOneSelected(false);
    setIsTypeTwoSelected(false);
    setIsFabricSelected(false);
    setIsWorkmanshipSelected(false);
    setIsCleanlinessSelected(false);
    setIsEmbellishmentSelected(false);
    setIsMeasurementSelected(false);
    setIsWashingSelected(false);
    setIsFinishingSelected(false);
    setIsMiscellaneousSelected(false);
  };

  // Handle Common filter
  const handleCommonFilter = () => {
    setIsCommonSelected((prev) => {
      const newValue = !prev;
      if (newValue) clearAllTypeSelections();
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  // Handle Type 1 filter
  const handleTypeOneFilter = () => {
    setIsTypeOneSelected((prev) => {
      const newValue = !prev;
      if (newValue) clearAllTypeSelections();
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  // Handle Type 2 filter
  const handleTypeTwoFilter = () => {
    setIsTypeTwoSelected((prev) => {
      const newValue = !prev;
      if (newValue) clearAllTypeSelections();
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  // Handle Fabric filter
  const handleFabricFilter = () => {
    setIsFabricSelected((prev) => {
      const newValue = !prev;
      if (newValue) clearAllTypeSelections();
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  // Handle Workmanship filter
  const handleWorkmanshipFilter = () => {
    setIsWorkmanshipSelected((prev) => {
      const newValue = !prev;
      if (newValue) clearAllTypeSelections();
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  // Handle Cleanliness filter
  const handleCleanlinessFilter = () => {
    setIsCleanlinessSelected((prev) => {
      const newValue = !prev;
      if (newValue) clearAllTypeSelections();
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  // Handle Embellishment filter
  const handleEmbellishmentFilter = () => {
    setIsEmbellishmentSelected((prev) => {
      const newValue = !prev;
      if (newValue) clearAllTypeSelections();
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  // Handle Measurement filter
  const handleMeasurementFilter = () => {
    setIsMeasurementSelected((prev) => {
      const newValue = !prev;
      if (newValue) clearAllTypeSelections();
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  // Handle Washing filter
  const handleWashingFilter = () => {
    setIsWashingSelected((prev) => {
      const newValue = !prev;
      if (newValue) clearAllTypeSelections();
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  // Handle Finishing filter
  const handleFinishingFilter = () => {
    setIsFinishingSelected((prev) => {
      const newValue = !prev;
      if (newValue) clearAllTypeSelections();
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  // Handle Miscellaneous filter
  const handleMiscellaneousFilter = () => {
    setIsMiscellaneousSelected((prev) => {
      const newValue = !prev;
      if (newValue) clearAllTypeSelections();
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  // Clear all type selections
  const clearAllTypeSelections = () => {
    setIsCommonSelected(false);
    setIsTypeOneSelected(false);
    setIsTypeTwoSelected(false);
    setIsFabricSelected(false);
    setIsWorkmanshipSelected(false);
    setIsCleanlinessSelected(false);
    setIsEmbellishmentSelected(false);
    setIsMeasurementSelected(false);
    setIsWashingSelected(false);
    setIsFinishingSelected(false);
    setIsMiscellaneousSelected(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedLetters(new Set());
    clearAllTypeSelections();
  };

  // Get processed defects based on filters and sorting
  const getProcessedDefects = () => {
    let indices = Array.from({ length: defectItems.length }, (_, i) => i);

    if (isCommonSelected) {
      indices = indices.filter((i) => commonDefects[language].includes(i));
    } else if (isTypeOneSelected) {
      indices = indices.filter((i) => TypeOneDefects[language].includes(i));
    } else if (isTypeTwoSelected) {
      indices = indices.filter((i) => TypeTwoDefects[language].includes(i));
    } else if (isFabricSelected) {
      indices = indices.filter((i) => FabricDefects[language].includes(i));
    } else if (isWorkmanshipSelected) {
      indices = indices.filter((i) => WorkmanshipDefects[language].includes(i));
    } else if (isCleanlinessSelected) {
      indices = indices.filter((i) => CleanlinessDefects[language].includes(i));
    } else if (isEmbellishmentSelected) {
      indices = indices.filter((i) =>
        EmbellishmentDefects[language].includes(i)
      );
    } else if (isMeasurementSelected) {
      indices = indices.filter((i) => MeasurementDefects[language].includes(i));
    } else if (isWashingSelected) {
      indices = indices.filter((i) => WashingDefects[language].includes(i));
    } else if (isFinishingSelected) {
      indices = indices.filter((i) => FinishingDefects[language].includes(i));
    } else if (isMiscellaneousSelected) {
      indices = indices.filter((i) =>
        MiscellaneousDefects[language].includes(i)
      );
    } else if (selectedLetters.size > 0) {
      indices = indices.filter((i) => {
        const defectName =
          language === "all"
            ? defectItems[i].name.split(" \\ ")[0] // Extract English part for "All" language
            : defectItems[i].name;
        return selectedLetters.has(defectName.charAt(0).toUpperCase());
      });
    }
    switch (sortType) {
      case "alpha-asc":
        indices.sort((a, b) =>
          defectItems[a].name.localeCompare(defectItems[b].name)
        );
        break;
      case "alpha-desc":
        indices.sort((a, b) =>
          defectItems[b].name.localeCompare(defectItems[a].name)
        );
        break;
      case "count-desc":
        indices.sort((a, b) => (defects[b] || 0) - (defects[a] || 0));
        break;
      default:
        break;
    }

    return indices.filter(
      (index) => !currentDefectCount[index] || currentDefectCount[index] > 0
    );
  };

  useEffect(() => {
    const hasActiveDefects = Object.values(currentDefectCount).some(
      (count) => count > 0
    );
    onDefectSelect(hasActiveDefects);
  }, [currentDefectCount, onDefectSelect]);

  const handleDefectChange = (index, isIncrement) => {
    if (!isPlaying) return;

    const currentValue = currentDefectCount[index] || 0;
    if (!isIncrement && currentValue === 0) return;

    const newValue = isIncrement
      ? currentValue + 1
      : Math.max(0, currentValue - 1);

    onCurrentDefectUpdate(index, newValue);
    onLogEntry?.({
      type: isIncrement ? "defect-add" : "defect-remove",
      defectName: defectItems[index].name,
      count: isIncrement ? 1 : -1,
      timestamp: new Date().getTime(),
    });
  };

  // Update the handleImageUpload function
  const handleImageUpload = (index, images) => {
    setDefectImages((prev) => ({
      ...prev,
      [index]: images,
    }));
  };

  // Style for defect items based on selection
  const getDefectItemStyle = (index) => {
    const isSelected = currentDefectCount[index] > 0;
    return {
      border: isSelected ? "2px solid #ef4444" : "1px solid #e5e7eb",
      transition: "all 0.2s ease-in-out",
    };
  };

  // Render the sort dropdown
  const renderSortDropdown = () => (
    <div className="relative">
      <button
        onClick={() => setShowSortDropdown(!showSortDropdown)}
        className="px-4 py-1 bg-indigo-700 text-white rounded hover:bg-indigo-600 flex items-center space-x-2"
      >
        {sortType === "count-desc" ? (
          <ArrowDownWideNarrow size={20} />
        ) : sortType === "alpha-desc" ? (
          <ArrowDownZA size={20} />
        ) : (
          <ArrowDownAZ size={20} />
        )}
      </button>
      {showSortDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => {
                setSortType("alpha-asc");
                setShowSortDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              A to Z
            </button>
            <button
              onClick={() => {
                setSortType("alpha-desc");
                setShowSortDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Z to A
            </button>
            <button
              onClick={() => {
                setSortType("count-desc");
                setShowSortDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              By Count (High to Low)
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render the letter filter dropdown
  const renderLetterDropdown = () => (
    <div className="relative">
      <button
        onClick={() => setShowLetterDropdown(!showLetterDropdown)}
        className={`px-4 py-0.5 bg-indigo-700 text-white rounded hover:bg-indigo-600 flex items-center space-x-2 ${
          selectedLetters.size > 0
            ? "bg-green-600 text-white" // Green background if any letter is selected
            : "bg-indigo-700 text-white" // Default indigo background
        } hover:bg-indigo-600`} // Hover color remains indigo
      >
        A..Z
      </button>
      {showLetterDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-50 p-4">
          <div className="grid grid-cols-7 gap-2">
            {uniqueLetters.map((letter) => (
              <button
                key={letter}
                onClick={() => handleLetterFilter(letter)}
                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium tracking-wide ${
                  selectedLetters.has(letter)
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render the controls (sort dropdown, letter dropdown, and other filters)
  const renderControls = () => (
    <div className="flex gap-4 mb-4">
      <div className="flex-none">{renderSortDropdown()}</div>
      <div className="flex-none">{renderLetterDropdown()}</div>
      <div className="flex-1">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={clearFilters}
            className={`px-3 py-1 rounded text-sm ${
              selectedLetters.size === 0 &&
              !isCommonSelected &&
              !isTypeOneSelected &&
              !isTypeTwoSelected &&
              !isFabricSelected &&
              !isWorkmanshipSelected &&
              !isCleanlinessSelected &&
              !isEmbellishmentSelected &&
              !isMeasurementSelected &&
              !isWashingSelected &&
              !isFinishingSelected &&
              !isMiscellaneousSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={handleCommonFilter}
            className={`px-3 py-1 rounded text-sm ${
              isCommonSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Common
          </button>
          <button
            onClick={handleTypeOneFilter}
            className={`px-3 py-1 rounded text-sm ${
              isTypeOneSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Type 1
          </button>
          <button
            onClick={handleTypeTwoFilter}
            className={`px-3 py-1 rounded text-sm ${
              isTypeTwoSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Type 2
          </button>
          <button
            onClick={handleFabricFilter}
            className={`px-3 py-1 rounded text-sm ${
              isFabricSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Fabric
          </button>
          <button
            onClick={handleWorkmanshipFilter}
            className={`px-3 py-1 rounded text-sm ${
              isWorkmanshipSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Workmanship
          </button>
          <button
            onClick={handleCleanlinessFilter}
            className={`px-3 py-1 rounded text-sm ${
              isCleanlinessSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Cleanliness
          </button>
          <button
            onClick={handleEmbellishmentFilter}
            className={`px-3 py-1 rounded text-sm ${
              isEmbellishmentSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Embellishment
          </button>
          <button
            onClick={handleMeasurementFilter}
            className={`px-3 py-1 rounded text-sm ${
              isMeasurementSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Measurement
          </button>
          <button
            onClick={handleWashingFilter}
            className={`px-3 py-1 rounded text-sm ${
              isWashingSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Washing
          </button>
          <button
            onClick={handleFinishingFilter}
            className={`px-3 py-1 rounded text-sm ${
              isFinishingSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Finishing
          </button>
          <button
            onClick={handleMiscellaneousFilter}
            className={`px-3 py-1 rounded text-sm ${
              isMiscellaneousSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Miscellaneous
          </button>
        </div>
      </div>
    </div>
  );

  // Render the grid view
  const renderGridItem = (index) => (
    <div
      key={index}
      style={getDefectItemStyle(index)}
      className={`relative flex flex-col h-64 rounded-lg bg-white shadow-sm hover:shadow-md transition-all ${
        !isPlaying ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={() => isPlaying && handleDefectChange(index, true)}
    >
      {/* Top section with image and controls */}
      <div className="relative flex-1">
        {/* Image Container */}
        <div className="w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
          <img
            src={defectItems[index].imageUrl}
            alt={defectItems[index].name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Control Icons - Always visible */}
        <div className="absolute top-2 left-2 flex space-x-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDefectChange(index, false);
            }}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
            disabled={!isPlaying || !currentDefectCount[index]}
          >
            <Minus size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDefectChange(index, true);
            }}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow hover:bg-gray-100"
            disabled={!isPlaying}
          >
            <Plus size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDefectIndex(index);
              setShowUploadDialog(true);
            }}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow hover:bg-gray-100"
            disabled={!isPlaying}
          >
            <Upload size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDefectIndex(index);
              setShowPreviewDialog(true);
            }}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow hover:bg-gray-100"
          >
            <Info size={16} />
          </button>
        </div>

        {/* Defect count badge */}
        {defects[index] > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
            {defects[index]}
          </div>
        )}
      </div>

      {/* Bottom section with defect name and current count */}
      <div className="p-3 border-t min-h-[64px] flex flex-col justify-between bg-white">
        <div className="text-sm font-medium line-clamp-2">
          {defectItems[index].name}
        </div>
        {currentDefectCount[index] > 0 && (
          <div className="text-sm font-medium text-right text-blue-600">
            Count: {currentDefectCount[index]}
          </div>
        )}
      </div>
    </div>
  );

  const processedIndices = getProcessedDefects();

  if (view === "grid") {
    return (
      <div className="space-y-4">
        {renderControls()}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {processedIndices.map((index) => renderGridItem(index))}
        </div>
        <ImageUploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleImageUpload}
          selectedDefectIndex={selectedDefectIndex}
        />
        <ImagePreviewDialog
          isOpen={showPreviewDialog}
          onClose={() => setShowPreviewDialog(false)}
          imageUrl={
            selectedDefectIndex !== null
              ? defectItems[selectedDefectIndex].imageUrl
              : ""
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderControls()}
      <div className="space-y-2">
        {processedIndices.map((index) => (
          <div
            key={index}
            style={getDefectItemStyle(index)}
            className={`flex justify-between items-center p-4 bg-white rounded-lg shadow-sm ${
              !isPlaying ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <span className="text-sm flex-grow">{defectItems[index].name}</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  disabled={!isPlaying || !currentDefectCount[index]}
                  onClick={() => handleDefectChange(index, false)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  -
                </button>
                <input
                  type="text"
                  value={currentDefectCount[index] || 0}
                  readOnly
                  className="w-16 text-center border rounded p-1"
                />
                <button
                  disabled={!isPlaying}
                  onClick={() => handleDefectChange(index, true)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <div className="w-16 text-center">{defects[index] || 0}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DefectsList;