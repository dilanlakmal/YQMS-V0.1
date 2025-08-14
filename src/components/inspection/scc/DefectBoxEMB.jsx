import React, { useState, useMemo } from "react";
import { X, Plus, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import Select from "react-select"; // --- ADDED: Import react-select

// --- ADDED: Custom styles to make react-select match your UI
const customStyles = {
  control: (provided) => ({
    ...provided,
    minHeight: "42px",
    border: "1px solid #d1d5db", // border-gray-300
    borderRadius: "0.375rem", // rounded-md
    boxShadow: "none",
    "&:hover": {
      borderColor: "#a5b4fc" // hover:border-indigo-300
    }
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 50 // Ensure dropdown appears above other elements if needed
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#6b7280" // text-gray-500
  })
};

const DefectBoxEMB = ({
  defects,
  availableDefects,
  onClose,
  onAddDefect,
  onRemoveDefect,
  onUpdateDefectCount
}) => {
  const { t, i18n } = useTranslation();

  // --- MODIFIED: State now holds the entire selected object, not just the 'no'
  const [selectedDefect, setSelectedDefect] = useState(null);

  const getLocalizedDefectName = (defect) => {
    switch (i18n.language) {
      case "kh":
        return defect.defectNameKhmer;
      case "zh":
        return defect.defectNameChine || defect.defectNameChinese;
      default:
        return defect.defectNameEng;
    }
  };

  // --- ADDED: Memoize the formatted options for performance
  // This formats your defect list into the { value, label } structure react-select needs
  const formattedAvailableDefects = useMemo(() => {
    return availableDefects
      .filter(
        (availDefect) =>
          !defects.some((addedDefect) => addedDefect.no === availDefect.no)
      )
      .map((d) => ({
        value: d.no, // The unique value for the option
        label: getLocalizedDefectName(d), // The text displayed to the user
        originalDefect: d // Keep the original object for easy access
      }));
  }, [availableDefects, defects, i18n.language]);

  // --- MODIFIED: handleAddClick now uses the selected object from state
  const handleAddClick = () => {
    if (selectedDefect) {
      // The full defect object is already in our formatted option
      onAddDefect(selectedDefect.originalDefect);
      setSelectedDefect(null); // Reset the select component
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("sccEMBReport.defectBoxTitle", "Manage Defect Details")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* This part for displaying selected defects remains the same */}
        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
          {defects.map((defect, index) => (
            <div
              key={defect.no || index}
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
                  }
                  className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300"
                  disabled={defect.count <= 1}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={defect.count}
                  readOnly
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
              {t(
                "sccEMBReport.noDefectsRecorded",
                "No defects have been recorded."
              )}
            </p>
          )}
        </div>

        {/* --- MODIFIED: This is the new searchable dropdown section --- */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Select
              options={formattedAvailableDefects}
              value={selectedDefect}
              onChange={setSelectedDefect}
              placeholder={t(
                "sccEMBReport.searchOrSelectDefect",
                "Search or select a defect..."
              )}
              isClearable
              className="flex-1 text-sm"
              styles={customStyles}
            />
            <button
              onClick={handleAddClick}
              disabled={!selectedDefect}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-indigo-300 transition-colors"
            >
              {t("scc.add", "Add")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefectBoxEMB;
