import axios from "axios";
import { Minus, Plus, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";
import ImageUpload from "./ImageUpload";

const CardRow = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-4 items-center py-2.5 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 col-span-1">
      {label}
    </dt>
    <dd className="text-sm text-gray-900 dark:text-gray-100 col-span-2">
      {children}
    </dd>
  </div>
);

const SubConQADefectCard = ({
  defect,
  onUpdate,
  onDelete,
  uploadMetadata,
  existingDefectCodes,
  standardDefects
}) => {
  // --- NEW: State for defect search ---
  const [defectSearchTerm, setDefectSearchTerm] = useState("");
  const [defectOptions, setDefectOptions] = useState([]);

  // --- NEW: Debounce helper function ---
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // --- NEW: Debounced search logic (restored and corrected) ---
  const debouncedDefectSearch = useCallback(
    debounce(async (term) => {
      if (term.length < 1) {
        setDefectOptions([]);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/api/qa-standard-defects`, {
          params: { searchTerm: term }
        });

        // Get codes of defects already used IN THIS GARMENT
        const currentDefectCodes = new Set(
          existingDefectCodes.map((d) => d.defectCode)
        );

        const filteredOptions = res.data
          // Allow the current defect to still show in its own dropdown, but filter others
          .filter(
            (d) =>
              !currentDefectCodes.has(d.code) || d.code === defect.defectCode
          )
          .map((d) => ({
            value: d.code,
            label: `${d.code} - ${d.english}`,
            defect: d // Pass the full object for handleDefectSelect
          }));
        setDefectOptions(filteredOptions);
      } catch (error) {
        console.error("Error searching defects:", error);
      }
    }, 300),
    [existingDefectCodes, defect.defectCode] // Dependencies for the callback
  );

  // --- NEW: Effect to trigger the search ---
  useEffect(() => {
    debouncedDefectSearch(defectSearchTerm);
  }, [defectSearchTerm, debouncedDefectSearch]);

  // Find the full information for the currently selected defect code
  const standardDefectInfo = useMemo(() => {
    if (!defect.defectCode || !standardDefects) return null;
    return standardDefects.find((sd) => sd.code === defect.defectCode);
  }, [defect.defectCode, standardDefects]);

  // Create options for the decision dropdown
  const decisionOptions = useMemo(() => {
    if (!standardDefectInfo || !standardDefectInfo.decisions) return [];
    return standardDefectInfo.decisions.map((d) => ({
      value: d.decisionEng,
      label: d.decisionEng
    }));
  }, [standardDefectInfo]);

  const handleDefectSelect = (selectedOption) => {
    if (selectedOption) {
      const { defect: selectedDefect } = selectedOption;
      const fullDefectInfo = standardDefects.find(
        (d) => d.code === selectedDefect.code
      );
      const initialDecision = fullDefectInfo?.decisions?.[0];

      onUpdate(defect.tempId, {
        defectCode: selectedDefect.code,
        defectName: selectedDefect.english,
        khmerName: selectedDefect.khmer,
        chineseName: selectedDefect.chinese,
        decision: initialDecision?.decisionEng || "N/A",
        standardStatus: initialDecision?.status || "Major"
      });
    }
  };

  const handleDecisionChange = (e) => {
    const newDecisionEng = e.target.value;
    const selectedDecision = standardDefectInfo?.decisions.find(
      (d) => d.decisionEng === newDecisionEng
    );
    if (selectedDecision) {
      onUpdate(defect.tempId, {
        decision: newDecisionEng,
        standardStatus: selectedDecision.status
      });
    }
  };

  const statusColorClass = (status) => {
    switch (status) {
      case "Critical":
        return "text-red-600 dark:text-red-400 font-bold";
      case "Major":
        return "text-orange-600 dark:text-orange-400 font-semibold";
      case "Minor":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-gray-500";
    }
  };

  const selectedDefectData = useMemo(() => {
    if (!defect.defectCode) return null;
    return {
      value: defect.defectCode,
      label: `${defect.defectCode} - ${defect.defectName}`
    };
  }, [defect.defectCode, defect.defectName]);

  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)"
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      zIndex: 50
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: isSelected ? "white" : "var(--color-text-primary)"
    })
  };

  return (
    <div className="border bg-white dark:bg-gray-800 rounded-lg shadow-md w-full">
      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-t-lg flex justify-between items-center">
        <h4 className="font-bold text-gray-800 dark:text-gray-200">
          Garment #{defect.pcsNo} - Defect #{defect.defectInPcs}
        </h4>
        <button
          onClick={() => onDelete(defect.tempId)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 size={18} />
        </button>
      </div>
      <dl className="p-4">
        <CardRow label="Defect Name">
          <Select
            options={defectOptions}
            value={selectedDefectData}
            onInputChange={setDefectSearchTerm}
            onChange={handleDefectSelect}
            styles={reactSelectStyles}
            placeholder="Type to search defect..."
            noOptionsMessage={() =>
              defectSearchTerm.length < 1
                ? "Type to search..."
                : "No defects found"
            }
          />
        </CardRow>

        <CardRow label="Decision">
          {standardDefectInfo && decisionOptions.length > 0 ? (
            <select
              value={defect.decision || ""}
              onChange={handleDecisionChange}
              className="w-full p-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              disabled={decisionOptions.length <= 1}
            >
              {decisionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="px-2 text-gray-500">
              {defect.defectCode ? defect.decision || "N/A" : "Select a defect"}
            </span>
          )}
        </CardRow>

        <CardRow label="Standard Status">
          <span className={statusColorClass(defect.standardStatus)}>
            {defect.standardStatus || "N/A"}
          </span>
        </CardRow>

        <CardRow label="Qty">
          <div className="flex items-center">
            <button
              onClick={() =>
                onUpdate(defect.tempId, { qty: Math.max(1, defect.qty - 1) })
              }
              className="p-1 text-gray-500 hover:text-white hover:bg-red-500 rounded-full"
            >
              <Minus size={16} />
            </button>
            <span className="w-12 text-center font-semibold">{defect.qty}</span>
            <button
              onClick={() => onUpdate(defect.tempId, { qty: defect.qty + 1 })}
              className="p-1 text-gray-500 hover:text-white hover:bg-green-500 rounded-full"
            >
              <Plus size={16} />
            </button>
          </div>
        </CardRow>

        <CardRow label="Images">
          <ImageUpload
            imageUrls={defect.images}
            onImageChange={(newImages) =>
              onUpdate(defect.tempId, { images: newImages })
            }
            uploadMetadata={uploadMetadata}
            maxImages={5}
            imageType="defect"
          />
        </CardRow>
      </dl>
    </div>
  );
};

export default SubConQADefectCard;
