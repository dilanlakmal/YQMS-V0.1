import { Minus, Plus, X } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const DefectBox = ({
  defects,
  onClose,
  onAddDefect,
  onRemoveDefect,
  onUpdateDefectCount,
  fabricDefects, // New prop
}) => {
  const { t, i18n } = useTranslation();
  const [newDefect, setNewDefect] = useState("");

  const handleDefectSelect = (value) => {
    if (value) {
      onAddDefect(value);
      setNewDefect("");
    }
  };

  const getDefectName = (defect) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-8 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {t("cutting.defectBoxTitle")}
          </h3>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
          >
            {t("cutting.close")}
          </button>
        </div>
        <div className="space-y-4">
          {defects.map((defect, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg"
            >
              <button
                onClick={() => onUpdateDefectCount(index, defect.count - 1)}
                className="p-2 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={defect.count}
                readOnly
                className="w-16 p-2 text-center border border-gray-300 rounded-lg text-sm bg-white"
              />
              <button
                onClick={() => onUpdateDefectCount(index, defect.count + 1)}
                className="p-2 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
              </button>
              <select
                value={defect.defectName}
                onChange={(e) => {
                  const newDefectData = fabricDefects.find(
                    (d) => d.defectName === e.target.value
                  );
                  const updatedDefect = {
                    ...newDefectData,
                    count: defect.count,
                  };
                  const updatedDefects = [...defects];
                  updatedDefects[index] = updatedDefect;
                  onUpdateDefectCount(index, defect.count, updatedDefect);
                }}
                className="p-2 border border-gray-300 rounded-lg text-sm flex-1 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {fabricDefects.map((d, i) => (
                  <option key={i} value={d.defectName}>
                    {getDefectName(d)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onRemoveDefect(index)}
                className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="mt-4">
            <select
              value={newDefect}
              onChange={(e) => handleDefectSelect(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg w-full text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">{t("cutting.addDefect")}</option>
              {fabricDefects.map((defect, index) => (
                <option key={index} value={defect.defectName}>
                  {getDefectName(defect)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefectBox;
