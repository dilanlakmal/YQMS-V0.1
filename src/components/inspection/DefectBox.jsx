import { Minus, Plus } from "lucide-react";

import {
  CleanlinessDefects,
  EmbellishmentDefects,
  FabricDefects,
  FinishingDefects,
  MeasurementDefects,
  MiscellaneousDefects,
  TypeOneDefects,
  TypeTwoDefects,
  WashingDefects,
  WorkmanshipDefects,
  commonDefects,
  defectsList,
} from "../../constants/QC Inspection/defects";

const DefectBox = ({
  language = "english",
  tempDefects,
  onDefectUpdate,
  activeFilter,
  confirmedDefects,
  sortOption,
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
    const currentDelta = tempDefects[index] || 0;
    const newDelta = increment
      ? currentDelta + 1
      : Math.max(0, currentDelta - 1);
    const newTempDefects = { ...tempDefects, [index]: newDelta };

    // Automatically change the defect status to "Pass" if the defect count is removed
    if (newDelta === 0) {
      const defectName = defectItems[index].name;
      onDefectUpdate(newTempDefects, defectName, "OK");
    } else {
      onDefectUpdate(newTempDefects, defectItems[index].name, "Fail");
    }
  };

  // Total count is the sum of confirmed and temporary defects.
  const getCurrentCount = (index) => {
    return (confirmedDefects[index] || 0) + (tempDefects[index] || 0);
  };

  let filteredDefects = getFilteredDefects();

  if (sortOption) {
    if (sortOption === "alphaAsc") {
      filteredDefects = filteredDefects.slice().sort((a, b) => {
        const nameA = (defectItems[a]?.name || "").toLowerCase();
        const nameB = (defectItems[b]?.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sortOption === "alphaDesc") {
      filteredDefects = filteredDefects.slice().sort((a, b) => {
        const nameA = (defectItems[a]?.name || "").toLowerCase();
        const nameB = (defectItems[b]?.name || "").toLowerCase();
        return nameB.localeCompare(nameA);
      });
    } else if (sortOption === "countDesc") {
      filteredDefects = filteredDefects.slice().sort((a, b) => {
        return getCurrentCount(b) - getCurrentCount(a);
      });
    }
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {filteredDefects.map((index) => {
        const totalCount = getCurrentCount(index);
        const tempCount = tempDefects[index] || 0;
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
            <div className="h-16 md:h-40 bg-gray-100 overflow-hidden">
              <img
                src={defectItems[index]?.imageUrl}
                alt="Defect"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-2">
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
              <div className="flex items-center justify-between ">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDefectChange(index, false);
                  }}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  disabled={tempCount <= 0}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
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
