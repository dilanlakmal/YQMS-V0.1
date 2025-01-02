// import { useState, useEffect } from "react";
// import {
//   defectsList,
//   commonDefects,
//   TypeOneDefects,
// } from "../../constants/defects";
// import { ArrowDownAZ, ArrowDownZA, ArrowDownWideNarrow } from "lucide-react";

// function DefectsList({
//   view,
//   language,
//   defects,
//   onDefectUpdate,
//   onLogEntry,
//   isPlaying,
//   onDefectSelect,
//   currentDefectCount,
//   onCurrentDefectUpdate,
//   isReturnView = false,
// }) {
//   const defectItems = defectsList[language];
//   const [activeCell, setActiveCell] = useState(null);
//   const [sortType, setSortType] = useState("none");
//   const [selectedLetters, setSelectedLetters] = useState(new Set());
//   const [showSortDropdown, setShowSortDropdown] = useState(false);
//   const [isCommonSelected, setIsCommonSelected] = useState(false);
//   const [isTypeOneSelected, setIsTypeOneSelected] = useState(false);

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
} from "../../constants/defects";

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
  const [selectedDefectIndex, setSelectedDefectIndex] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Get unique first letters from defect names
  const uniqueLetters = [
    ...new Set(defectItems.map((name) => name.charAt(0).toUpperCase())),
  ].sort();

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
  };

  // const handleLetterFilter = (letter) => {
  //   setSelectedLetters((prev) => {
  //     const newSet = new Set(prev);
  //     if (newSet.has(letter)) {
  //       newSet.delete(letter);
  //     } else {
  //       newSet.add(letter);
  //     }
  //     return newSet;
  //   });
  //   setIsCommonSelected(false);
  //   setIsTypeOneSelected(false);
  // };

  const handleCommonFilter = () => {
    setIsCommonSelected((prev) => {
      const newValue = !prev;
      if (newValue) setIsTypeOneSelected(false);
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  const handleTypeOneFilter = () => {
    setIsTypeOneSelected((prev) => {
      const newValue = !prev;
      if (newValue) setIsCommonSelected(false);
      return newValue;
    });
    setSelectedLetters(new Set());
  };

  const clearFilters = () => {
    setSelectedLetters(new Set());
    setIsCommonSelected(false);
    setIsTypeOneSelected(false);
  };

  const getProcessedDefects = () => {
    let indices = Array.from({ length: defectItems.length }, (_, i) => i);

    if (isCommonSelected) {
      indices = indices.filter((i) => commonDefects[language].includes(i));
    } else if (isTypeOneSelected) {
      indices = indices.filter((i) => TypeOneDefects[language].includes(i));
    } else if (selectedLetters.size > 0) {
      indices = indices.filter((i) =>
        selectedLetters.has(defectItems[i].charAt(0).toUpperCase())
      );
    }

    switch (sortType) {
      case "alpha-asc":
        indices.sort((a, b) => defectItems[a].localeCompare(defectItems[b]));
        break;
      case "alpha-desc":
        indices.sort((a, b) => defectItems[b].localeCompare(defectItems[a]));
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

  // const handleDefectChange = (index, isIncrement) => {
  //   if (!isPlaying) return;

  //   const currentValue = currentDefectCount[index] || 0;
  //   if (!isIncrement && currentValue === 0) return;

  //   const newValue = isIncrement
  //     ? currentValue + 1
  //     : Math.max(0, currentValue - 1);

  //   onCurrentDefectUpdate(index, newValue);
  //   onLogEntry?.({
  //     type: isIncrement ? "defect-add" : "defect-remove",
  //     defectName: defectItems[index],
  //     count: isIncrement ? 1 : -1,
  //     timestamp: new Date().getTime(),
  //   });
  // };

  const handleImageUpload = (images) => {
    // Handle the uploaded images
    console.log("Uploaded images for defect:", selectedDefectIndex, images);
    // You can implement the database storage logic here later
  };

  const getDefectItemStyle = (index) => {
    const isSelected = currentDefectCount[index] > 0;
    return {
      border: isSelected ? "2px solid #ef4444" : "1px solid #e5e7eb",
      transition: "all 0.2s ease-in-out",
    };
  };

  const renderSortDropdown = () => (
    <div className="relative">
      <button
        onClick={() => setShowSortDropdown(!showSortDropdown)}
        className="px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-600 flex items-center space-x-2"
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

  const renderControls = () => (
    <div className="flex gap-4 mb-4">
      <div className="flex-none">{renderSortDropdown()}</div>
      <div className="flex-1">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={clearFilters}
            className={`px-3 py-1 rounded text-sm ${
              selectedLetters.size === 0 &&
              !isCommonSelected &&
              !isTypeOneSelected
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          {uniqueLetters.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterFilter(letter)}
              className={`px-3 py-1 rounded text-sm ${
                selectedLetters.has(letter)
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {letter}
            </button>
          ))}
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
        </div>
      </div>
    </div>
  );

  const renderGridItem = (index) => (
    <div
      key={index}
      style={getDefectItemStyle(index)}
      className={`relative flex flex-col h-64 rounded-lg bg-white shadow-sm hover:shadow-md transition-all ${
        !isPlaying ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
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

      {/* Image Container */}
      <div className="flex-1 w-full bg-gray-100 rounded-t-lg overflow-hidden">
        <img
          src={defectItems[index].imageUrl}
          alt={defectItems[index].name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Defect Name and Count */}
      <div className="p-3 border-t">
        <div className="text-sm font-medium">{defectItems[index].name}</div>
        {currentDefectCount[index] > 0 && (
          <div className="absolute bottom-2 right-2 text-sm font-medium">
            {currentDefectCount[index]}
          </div>
        )}
      </div>

      {defects[index] > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
          {defects[index]}
        </div>
      )}
    </div>
  );

  const processedIndices = getProcessedDefects();

  if (view === "grid") {
    return (
      <div className="space-y-4">
        {renderControls()}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {getProcessedDefects().map(renderGridItem)}
        </div>

        <ImageUploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleImageUpload}
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

  // if (view === "grid") {
  //   return (
  //     <div className="space-y-4">
  //       {renderControls()}
  //       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  //         {processedIndices.map((index) => (
  //           <div
  //             key={index}
  //             style={getDefectItemStyle(index)}
  //             className={`relative flex flex-col h-48 rounded-lg bg-white shadow-sm cursor-pointer select-none hover:shadow-md transition-all ${
  //               !isPlaying ? "opacity-50 cursor-not-allowed" : ""
  //             }`}
  //             onClick={() => isPlaying && handleDefectChange(index, true)}
  //             onMouseEnter={() => setActiveCell(index)}
  //             onMouseLeave={() => setActiveCell(null)}
  //           >
  //             {/* Image Container */}
  //             <div className="flex-1 w-full bg-gray-100 rounded-t-lg">
  //               {/* Image will be added here */}
  //               <img
  //                 src={
  //                   defectItems[index].imageUrl ||
  //                   "https://via.placeholder.com/150"
  //                 }
  //                 alt={defectItems[index]}
  //                 className="w-full h-full object-cover rounded-t-lg"
  //               />
  //             </div>

  //             {/* Defect Name and Controls Container */}
  //             <div className="relative p-3 border-t">
  //               <div className="text-sm font-medium">{defectItems[index]}</div>

  //               {currentDefectCount[index] > 0 && (
  //                 <div className="absolute bottom-2 left-2 text-sm font-medium">
  //                   {currentDefectCount[index]}
  //                 </div>
  //               )}

  //               {defects[index] > 0 && (
  //                 <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
  //                   {defects[index]}
  //                 </div>
  //               )}

  //               {activeCell === index && isPlaying && (
  //                 <div className="absolute top-2 right-2 flex space-x-1">
  //                   <button
  //                     onClick={(e) => {
  //                       e.stopPropagation();
  //                       handleDefectChange(index, false);
  //                     }}
  //                     className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
  //                     disabled={!currentDefectCount[index]}
  //                   >
  //                     -
  //                   </button>
  //                   <button
  //                     onClick={(e) => {
  //                       e.stopPropagation();
  //                       handleDefectChange(index, true);
  //                     }}
  //                     className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
  //                   >
  //                     +
  //                   </button>
  //                 </div>
  //               )}
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   );
  // }

  // original grid view
  // if (view === "grid") {
  //   return (
  //     <div className="space-y-4">
  //       {renderControls()}
  //       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  //         {processedIndices.map((index) => (
  //           <div
  //             key={index}
  //             style={getDefectItemStyle(index)}
  //             className={`relative flex flex-col h-48 rounded-lg bg-white shadow-sm cursor-pointer select-none hover:shadow-md transition-all ${
  //               !isPlaying ? "opacity-50 cursor-not-allowed" : ""
  //             }`}
  //             onClick={() => isPlaying && handleDefectChange(index, true)}
  //             onMouseEnter={() => setActiveCell(index)}
  //             onMouseLeave={() => setActiveCell(null)}
  //           >
  //             {defects[index] > 0 && (
  //               <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
  //                 {defects[index]}
  //               </div>
  //             )}

  //             <div className="mb-2 text-sm">{defectItems[index]}</div>

  //             {currentDefectCount[index] > 0 && (
  //               <div className="absolute bottom-2 left-2 text-sm font-medium">
  //                 {currentDefectCount[index]}
  //               </div>
  //             )}

  //             {activeCell === index && isPlaying && (
  //               <div className="absolute top-2 right-2 flex space-x-1">
  //                 <button
  //                   onClick={(e) => {
  //                     e.stopPropagation();
  //                     handleDefectChange(index, false);
  //                   }}
  //                   className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
  //                   disabled={!currentDefectCount[index]}
  //                 >
  //                   -
  //                 </button>
  //                 <button
  //                   onClick={(e) => {
  //                     e.stopPropagation();
  //                     handleDefectChange(index, true);
  //                   }}
  //                   className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
  //                 >
  //                   +
  //                 </button>
  //               </div>
  //             )}
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   );
  // }

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
            <span className="text-sm flex-grow">{defectItems[index]}</span>
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
