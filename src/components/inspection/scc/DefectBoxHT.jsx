import React, { useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

const DefectBoxHT = ({
  defects, // Array of { defectNameEng, defectNameKhmer, defectNameChinese, count, no }
  availableDefects, // Array from sccdefects collection { no, defectNameEng, defectNameKhmer, defectNameChinese }
  onClose,
  onAddDefect, // Passes the full defect object from availableDefects
  onRemoveDefect, // Passes the index
  onUpdateDefectCount // Passes (index, newCount)
}) => {
  const { t, i18n } = useTranslation();
  const [selectedDefectNo, setSelectedDefectNo] = useState("");

  const handleAddClick = () => {
    if (selectedDefectNo) {
      const defectToAdd = availableDefects.find(
        (d) => d.no === parseInt(selectedDefectNo)
      );
      if (defectToAdd && !defects.some((d) => d.no === defectToAdd.no)) {
        // Prevent adding duplicates
        onAddDefect(defectToAdd);
      }
      setSelectedDefectNo(""); // Reset dropdown
    }
  };

  const getLocalizedDefectName = (defect) => {
    switch (i18n.language) {
      case "kh":
        return defect.defectNameKhmer;
      case "zh":
        return defect.defectNameChinese;
      case "en":
      default:
        return defect.defectNameEng;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
      {" "}
      {/* Increased z-index */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("sccHTInspection.defectBoxTitle", "Manage Defect Details")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
          {defects.map((defect, index) => (
            <div
              key={defect.no || index} // Use defect.no if available, otherwise index
              className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-md"
            >
              <span
                className="flex-1 text-sm text-gray-700 truncate"
                title={getLocalizedDefectName(defect)}
              >
                {getLocalizedDefectName(defect)}
              </span>
              <div className="flex items-center">
                <button
                  onClick={() =>
                    onUpdateDefectCount(index, Math.max(1, defect.count - 1))
                  } // Ensure count doesn't go below 1
                  className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300"
                  disabled={defect.count <= 1}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={defect.count}
                  readOnly // Count is changed by buttons
                  className="w-12 p-1.5 text-center border-y border-gray-300 text-sm bg-white"
                />
                <button
                  onClick={() => onUpdateDefectCount(index, defect.count + 1)}
                  className="p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => onRemoveDefect(index)}
                className="p-1.5 text-red-500 hover:text-red-700"
              >
                <X size={18} />
              </button>
            </div>
          ))}
          {defects.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              {t("sccHTInspection.noDefectsAdded", "No defects added yet.")}
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <select
              value={selectedDefectNo}
              onChange={(e) => setSelectedDefectNo(e.target.value)}
              className="p-2 border border-gray-300 rounded-md text-sm flex-1 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">
                {t(
                  "sccHTInspection.selectDefectToAdd",
                  "-- Select Defect to Add --"
                )}
              </option>
              {availableDefects
                .filter(
                  (availDefect) =>
                    !defects.some(
                      (addedDefect) => addedDefect.no === availDefect.no
                    )
                ) // Filter out already added defects
                .map((d) => (
                  <option key={d.no} value={d.no}>
                    {getLocalizedDefectName(d)}
                  </option>
                ))}
            </select>
            <button
              onClick={handleAddClick}
              disabled={!selectedDefectNo}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-indigo-300"
            >
              {t("scc.add", "Add")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefectBoxHT;
