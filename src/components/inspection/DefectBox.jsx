// import { useState } from "react";
// import {
//   ArrowDownAZ,
//   ArrowDownZA,
//   ArrowDownWideNarrow,
//   Minus,
//   Plus,
//   Info,
// } from "lucide-react";
// import {
//   defectsList,
//   commonDefects,
//   TypeOneDefects,
//   TypeTwoDefects,
//   FabricDefects,
//   WorkmanshipDefects,
//   CleanlinessDefects,
//   EmbellishmentDefects,
//   MeasurementDefects,
//   WashingDefects,
//   FinishingDefects,
//   MiscellaneousDefects,
// } from "../../constants/defects";

// const DefectBox = ({
//   language = "en",
//   currentDefectCount,
//   onDefectUpdate,
//   onLanguageChange,
// }) => {
//   const [sortType, setSortType] = useState("none");
//   const [selectedLetters, setSelectedLetters] = useState(new Set());
//   const [showSortDropdown, setShowSortDropdown] = useState(false);
//   const [activeFilters, setActiveFilters] = useState({
//     common: false,
//     typeOne: false,
//     typeTwo: false,
//     fabric: false,
//     workmanship: false,
//     cleanliness: false,
//     embellishment: false,
//     measurement: false,
//     washing: false,
//     finishing: false,
//     miscellaneous: false,
//   });

//   // Add null check for defectsList and fallback to English
//   const defectItems = defectsList[language] || defectsList.en || [];

//   // Filtering and sorting logic
//   const getProcessedDefects = () => {
//     if (!defectItems || defectItems.length === 0) return [];

//     let indices = Array.from({ length: defectItems.length }, (_, i) => i);

//     // Apply category filters
//     if (activeFilters.common) {
//       indices = indices.filter((i) => commonDefects[language].includes(i));
//     } else if (activeFilters.typeOne) {
//       indices = indices.filter((i) => TypeOneDefects[language].includes(i));
//     } else if (activeFilters.typeTwo) {
//       indices = indices.filter((i) => TypeTwoDefects[language].includes(i));
//     } else if (activeFilters.fabric) {
//       indices = indices.filter((i) => FabricDefects[language].includes(i));
//     } else if (activeFilters.workmanship) {
//       indices = indices.filter((i) => WorkmanshipDefects[language].includes(i));
//     } else if (activeFilters.cleanliness) {
//       indices = indices.filter((i) => CleanlinessDefects[language].includes(i));
//     } else if (activeFilters.embellishment) {
//       indices = indices.filter((i) =>
//         EmbellishmentDefects[language].includes(i)
//       );
//     } else if (activeFilters.measurement) {
//       indices = indices.filter((i) => MeasurementDefects[language].includes(i));
//     } else if (activeFilters.washing) {
//       indices = indices.filter((i) => WashingDefects[language].includes(i));
//     } else if (activeFilters.finishing) {
//       indices = indices.filter((i) => FinishingDefects[language].includes(i));
//     } else if (activeFilters.miscellaneous) {
//       indices = indices.filter((i) =>
//         MiscellaneousDefects[language].includes(i)
//       );
//     }

//     // Apply letter filters
//     if (selectedLetters.size > 0) {
//       indices = indices.filter((i) => {
//         const defectName = defectItems[i].name;
//         return selectedLetters.has(defectName.charAt(0).toUpperCase());
//       });
//     }

//     // Apply sorting
//     switch (sortType) {
//       case "alpha-asc":
//         indices.sort((a, b) =>
//           defectItems[a].name.localeCompare(defectItems[b].name)
//         );
//         break;
//       case "alpha-desc":
//         indices.sort((a, b) =>
//           defectItems[b].name.localeCompare(defectItems[a].name)
//         );
//         break;
//       case "count-desc":
//         indices.sort(
//           (a, b) => (currentDefectCount[b] || 0) - (currentDefectCount[a] || 0)
//         );
//         break;
//       default:
//         break;
//     }

//     return indices;
//   };

//   const handleDefectChange = (index, isIncrement) => {
//     const currentValue = currentDefectCount[index] || 0;
//     const newValue = isIncrement
//       ? currentValue + 1
//       : Math.max(0, currentValue - 1);
//     onDefectUpdate({ ...currentDefectCount, [index]: newValue });
//   };

//   const toggleFilter = (filterName) => {
//     setActiveFilters((prev) => ({
//       ...Object.fromEntries(Object.keys(prev).map((k) => [k, false])),
//       [filterName]: !prev[filterName],
//     }));
//     setSelectedLetters(new Set());
//   };

//   const toggleLetterFilter = (letter) => {
//     setSelectedLetters((prev) => {
//       const newSet = new Set(prev);
//       newSet.has(letter) ? newSet.delete(letter) : newSet.add(letter);
//       return newSet;
//     });
//     setActiveFilters(
//       Object.fromEntries(Object.keys(activeFilters).map((k) => [k, false]))
//     );
//   };

//   return (
//     <div className="space-y-4 mt-6">
//       {/* Controls */}
//       <div className="flex gap-4 flex-wrap">
//         <div className="relative">
//           <select
//             value={language}
//             onChange={(e) => onLanguageChange(e.target.value)}
//             className="px-4 py-2 bg-indigo-700 text-white rounded"
//           >
//             <option value="en">English</option>
//             <option value="es">Spanish</option>
//             <option value="fr">French</option>
//           </select>
//         </div>

//         <div className="relative">
//           <button
//             onClick={() => setShowSortDropdown(!showSortDropdown)}
//             className="px-4 py-2 bg-indigo-700 text-white rounded flex items-center gap-2"
//           >
//             {sortType === "count-desc" ? (
//               <ArrowDownWideNarrow size={20} />
//             ) : sortType === "alpha-desc" ? (
//               <ArrowDownZA size={20} />
//             ) : (
//               <ArrowDownAZ size={20} />
//             )}
//           </button>
//           {showSortDropdown && (
//             <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
//               <div className="py-1">
//                 <button
//                   onClick={() => setSortType("alpha-asc")}
//                   className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
//                 >
//                   A to Z
//                 </button>
//                 <button
//                   onClick={() => setSortType("alpha-desc")}
//                   className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
//                 >
//                   Z to A
//                 </button>
//                 <button
//                   onClick={() => setSortType("count-desc")}
//                   className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
//                 >
//                   By Count
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="flex flex-wrap gap-2">
//           {Object.keys(activeFilters).map((filter) => (
//             <button
//               key={filter}
//               onClick={() => toggleFilter(filter)}
//               className={`px-3 py-1 rounded capitalize ${
//                 activeFilters[filter]
//                   ? "bg-indigo-600 text-white"
//                   : "bg-gray-200"
//               }`}
//             >
//               {filter.replace(/([A-Z])/g, " $1").trim()}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Defect Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {getProcessedDefects().map((index) => (
//           <div key={index} className="bg-white p-4 rounded-lg shadow-md">
//             <div className="flex justify-between items-start">
//               <div>
//                 <h3 className="font-medium">{defectItems[index].name}</h3>
//                 <p className="text-sm text-gray-600">
//                   {defectItems[index].description}
//                 </p>
//               </div>
//               <button
//                 onClick={() => setSelectedDefectIndex(index)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <Info size={16} />
//               </button>
//             </div>

//             <div className="mt-4 flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <button
//                   onClick={() => handleDefectChange(index, false)}
//                   className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
//                   disabled={!currentDefectCount[index]}
//                 >
//                   <Minus size={20} />
//                 </button>
//                 <span className="w-8 text-center font-medium">
//                   {currentDefectCount[index] || 0}
//                 </span>
//                 <button
//                   onClick={() => handleDefectChange(index, true)}
//                   className="p-1 rounded hover:bg-gray-100"
//                 >
//                   <Plus size={20} />
//                 </button>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default DefectBox;

// import { useState, useEffect } from "react";
// import { Minus, Plus } from "lucide-react";
// import {
//   defectsList,
//   commonDefects,
//   TypeOneDefects,
//   TypeTwoDefects,
//   FabricDefects,
//   WorkmanshipDefects,
//   CleanlinessDefects,
//   EmbellishmentDefects,
//   MeasurementDefects,
//   WashingDefects,
//   FinishingDefects,
//   MiscellaneousDefects,
// } from "../../constants/defects";

// const DefectBox = ({
//   language = "english",
//   currentDefectCount,
//   onDefectUpdate,
//   onLanguageChange,
// }) => {
//   const [sortType, setSortType] = useState("none");
//   const [activeFilter, setActiveFilter] = useState("all");

//   const defectItems = defectsList[language] || [];
//   const totalDefects = defectItems.length;

//   const getFilteredDefects = () => {
//     let indices = Array.from({ length: totalDefects }, (_, i) => i);

//     switch (activeFilter) {
//       case "common":
//         return indices.filter((i) => commonDefects[language].includes(i));
//       case "type1":
//         return indices.filter((i) => TypeOneDefects[language].includes(i));
//       case "type2":
//         return indices.filter((i) => TypeTwoDefects[language].includes(i));
//       case "fabric":
//         return indices.filter((i) => FabricDefects[language].includes(i));
//       case "workmanship":
//         return indices.filter((i) => WorkmanshipDefects[language].includes(i));
//       case "cleanliness":
//         return indices.filter((i) => CleanlinessDefects[language].includes(i));
//       case "embellishment":
//         return indices.filter((i) =>
//           EmbellishmentDefects[language].includes(i)
//         );
//       case "measurement":
//         return indices.filter((i) => MeasurementDefects[language].includes(i));
//       case "washing":
//         return indices.filter((i) => WashingDefects[language].includes(i));
//       case "finishing":
//         return indices.filter((i) => FinishingDefects[language].includes(i));
//       case "miscellaneous":
//         return indices.filter((i) =>
//           MiscellaneousDefects[language].includes(i)
//         );
//       default:
//         return indices;
//     }
//   };

//   const handleDefectChange = (index, increment) => {
//     const newCount = Math.max(
//       0,
//       (currentDefectCount[index] || 0) + (increment ? 1 : -1)
//     );
//     onDefectUpdate({ ...currentDefectCount, [index]: newCount });
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex flex-wrap gap-4 items-center">
//         <select
//           value={language}
//           onChange={(e) => onLanguageChange(e.target.value)}
//           className="px-4 py-2 border rounded bg-white"
//         >
//           <option value="english">English</option>
//           <option value="khmer">Khmer</option>
//           <option value="chinese">Chinese</option>
//           <option value="all">All Languages</option>
//         </select>

//         <div className="flex flex-wrap gap-2">
//           <button
//             onClick={() => setActiveFilter("all")}
//             className={`px-3 py-1 rounded ${
//               activeFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"
//             }`}
//           >
//             All
//           </button>
//           <button
//             onClick={() => setActiveFilter("common")}
//             className={`px-3 py-1 rounded ${
//               activeFilter === "common"
//                 ? "bg-blue-600 text-white"
//                 : "bg-gray-200"
//             }`}
//           >
//             Common
//           </button>
//           <button
//             onClick={() => setActiveFilter("type1")}
//             className={`px-3 py-1 rounded ${
//               activeFilter === "type1"
//                 ? "bg-blue-600 text-white"
//                 : "bg-gray-200"
//             }`}
//           >
//             Type 1
//           </button>
//           <button
//             onClick={() => setActiveFilter("type2")}
//             className={`px-3 py-1 rounded ${
//               activeFilter === "type2"
//                 ? "bg-blue-600 text-white"
//                 : "bg-gray-200"
//             }`}
//           >
//             Type 2
//           </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//         {getFilteredDefects().map((index) => (
//           <div
//             key={index}
//             className="relative bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all"
//             style={{
//               borderColor: currentDefectCount[index] ? "#ef4444" : "#e5e7eb",
//             }}
//           >
//             <div className="h-40 bg-gray-100 overflow-hidden">
//               <img
//                 src={defectItems[index]?.imageUrl}
//                 alt="Defect"
//                 className="w-full h-full object-cover"
//               />
//             </div>

//             <div className="p-3">
//               <div className="flex justify-between items-center mb-2">
//                 <h3 className="font-medium text-sm line-clamp-2">
//                   {defectItems[index]?.name}
//                 </h3>
//                 {currentDefectCount[index] > 0 && (
//                   <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
//                     {currentDefectCount[index]}
//                   </span>
//                 )}
//               </div>

//               <div className="flex items-center justify-between">
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handleDefectChange(index, false);
//                   }}
//                   className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
//                   disabled={!currentDefectCount[index]}
//                 >
//                   <Minus className="w-5 h-5" />
//                 </button>

//                 <span className="mx-2">{currentDefectCount[index] || 0}</span>

//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handleDefectChange(index, true);
//                   }}
//                   className="p-1 rounded hover:bg-gray-100"
//                 >
//                   <Plus className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default DefectBox;

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
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

const DefectBox = ({
  language = "english",
  currentDefectCount,
  onDefectUpdate,
  activeFilter,
  confirmedDefects,
}) => {
  const defectItems = defectsList[language] || [];
  const totalDefects = defectItems.length;

  const getFilteredDefects = () => {
    let indices = Array.from({ length: totalDefects }, (_, i) => i);

    switch (activeFilter) {
      case "common":
        return indices.filter((i) => commonDefects[language].includes(i));
      case "type1":
        return indices.filter((i) => TypeOneDefects[language].includes(i));
      case "type2":
        return indices.filter((i) => TypeTwoDefects[language].includes(i));
      case "fabric":
        return indices.filter((i) => FabricDefects[language].includes(i));
      case "workmanship":
        return indices.filter((i) => WorkmanshipDefects[language].includes(i));
      case "cleanliness":
        return indices.filter((i) => CleanlinessDefects[language].includes(i));
      case "embellishment":
        return indices.filter((i) =>
          EmbellishmentDefects[language].includes(i)
        );
      case "measurement":
        return indices.filter((i) => MeasurementDefects[language].includes(i));
      case "washing":
        return indices.filter((i) => WashingDefects[language].includes(i));
      case "finishing":
        return indices.filter((i) => FinishingDefects[language].includes(i));
      case "miscellaneous":
        return indices.filter((i) =>
          MiscellaneousDefects[language].includes(i)
        );
      default:
        return indices;
    }
  };

  const handleDefectChange = (index, increment) => {
    const currentTotal = confirmedDefects[index] || 0;
    const currentTemp = currentDefectCount[index] || 0;
    const newValue = increment
      ? currentTemp + 1
      : Math.max(currentTotal, currentTemp - 1);

    onDefectUpdate({
      ...currentDefectCount,
      [index]: newValue,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {getFilteredDefects().map((index) => {
        const totalCount = confirmedDefects[index] || 0;
        const tempCount = currentDefectCount[index] || 0;
        const showTemp = tempCount > totalCount;

        return (
          <div
            key={index}
            onClick={(e) => {
              if (e.target.closest("button")) return;
              handleDefectChange(index, true);
            }}
            className="relative bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all cursor-pointer"
            style={{ borderColor: totalCount > 0 ? "#ef4444" : "#e5e7eb" }}
          >
            <div className="h-40 bg-gray-100 overflow-hidden">
              <img
                src={defectItems[index]?.imageUrl}
                alt="Defect"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-sm line-clamp-2">
                  {defectItems[index]?.name}
                </h3>
                {totalCount > 0 && (
                  <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {totalCount}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDefectChange(index, false);
                  }}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  disabled={tempCount <= totalCount}
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {showTemp && (
                    <span className="text-sm text-gray-500">
                      +{tempCount - totalCount}
                    </span>
                  )}
                  <span className="mx-2">{tempCount}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDefectChange(index, true);
                  }}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DefectBox;
