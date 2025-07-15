import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Minus, Trash2, RotateCcw, Eye, EyeOff } from "lucide-react";
import Select from "react-select";
import QAImageUpload from "./QAImageUpload";

// This is a helper component for styling each row within the card
const CardRow = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-4 border-b border-gray-200 dark:border-gray-700 py-2.5 last:border-b-0">
    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 col-span-1 flex items-center">
      {label}
    </dt>
    <dd className="text-sm text-gray-900 dark:text-gray-100 col-span-2">
      {children}
    </dd>
  </div>
);

const QADefectCard = ({
  defect,
  rowIndex,
  availableDefects,
  standardDefects,
  buyer,
  onUpdate,
  onDelete,
  uploadMetadata
}) => {
  const { t, i18n } = useTranslation();

  // --- FIX #1: ADD STATE FOR VISIBILITY ---
  const [isBodyVisible, setIsBodyVisible] = useState(true);

  const getDefectNameForDisplay = (d) => {
    if (!d) return "N/A";
    const lang = i18n.language;
    if (lang.startsWith("kh")) return d.khmer || d.english;
    if (lang.startsWith("ch") || lang.startsWith("zh"))
      return d.chinese || d.english;
    return d.english;
  };

  const defectOptions = useMemo(() => {
    return availableDefects.map((d) => ({
      value: d.code,
      label: `${d.code} - ${getDefectNameForDisplay(d)}`,
      ...d
    }));
  }, [availableDefects, i18n.language]);

  const selectedDefectOption = defect.defectCode
    ? defectOptions.find((opt) => opt.value === defect.defectCode)
    : null;

  const typeOptions = useMemo(() => {
    if (!selectedDefectOption) return [];
    const buyerStatus = selectedDefectOption.statusByBuyer?.find(
      (s) => s.buyerName === buyer
    );
    return (
      buyerStatus?.defectStatus.map((status) => ({
        value: status,
        label: t(`classifications.${status.toLowerCase()}`, status)
      })) || []
    );
  }, [selectedDefectOption, buyer, t]);

  const handleDefectChange = (selectedOption) => {
    const fullDefect = availableDefects.find(
      (d) => d.code === selectedOption.value
    );
    const buyerStatus = fullDefect.statusByBuyer?.find(
      (s) => s.buyerName === buyer
    );
    const initialType =
      buyerStatus?.isCommon &&
      buyerStatus.defectStatus.includes(buyerStatus.isCommon)
        ? buyerStatus.isCommon
        : buyerStatus?.defectStatus?.[0] || "Major";
    onUpdate(rowIndex, "defect", { ...fullDefect, selectedType: initialType });
  };

  const clearDefect = () => onUpdate(rowIndex, "clear", null);

  const standardDefectInfo = useMemo(() => {
    if (!defect.defectCode) return null;
    return standardDefects.find((sd) => sd.code === defect.defectCode);
  }, [defect.defectCode, standardDefects]);

  const decisionOptions = useMemo(() => {
    if (!standardDefectInfo) return [];
    return standardDefectInfo.decisions.map((d) => {
      const label = i18n.language.startsWith("kh")
        ? d.decisionKhmer || d.decisionEng
        : d.decisionEng;
      return { value: d.decisionEng, label };
    });
  }, [standardDefectInfo, i18n.language]);

  const handleDecisionChange = (e) => {
    const newDecisionEng = e.target.value;
    const selectedDecision = standardDefectInfo?.decisions.find(
      (d) => d.decisionEng === newDecisionEng
    );
    if (selectedDecision) {
      onUpdate(rowIndex, "decision", newDecisionEng);
      onUpdate(rowIndex, "standardStatus", selectedDecision.status);
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
        return "";
    }
  };

  const handleImageChange = (imageUrl) =>
    onUpdate(rowIndex, "imageUrl", imageUrl);

  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)",
      boxShadow: "none",
      "&:hover": { borderColor: "var(--color-border-hover)" }
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      zIndex: 50
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "var(--color-bg-accent-active)"
        : isFocused
        ? "var(--color-bg-accent)"
        : "var(--color-bg-secondary)",
      color: "var(--color-text-primary)",
      ":active": { backgroundColor: "var(--color-bg-accent-active)" }
    }),
    placeholder: (base) => ({ ...base, color: "var(--color-text-secondary)" })
  };

  return (
    <div className="border bg-white dark:bg-gray-800 rounded-lg shadow-md flex-shrink-0 w-full sm:w-full md:w-[48.5%] lg:w-[49%]">
      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-t-lg flex justify-between items-center">
        <h4 className="font-bold text-gray-800 dark:text-gray-200">
          Garment {defect.pcsNo} - Defect {defect.defectInPcs || 1}
        </h4>
        {/* --- FIX #2: ADD THE TOGGLE BUTTON --- */}
        <button
          onClick={() => setIsBodyVisible(!isBodyVisible)}
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          title={isBodyVisible ? "Hide Details" : "Show Details"}
        >
          {isBodyVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button
          onClick={() => onDelete(rowIndex)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 size={18} />
        </button>
      </div>
      {isBodyVisible && (
        <dl className="p-4">
          <CardRow label={t("qcAccuracy.defectName", "Defect Name")}>
            <div className="flex items-center">
              <Select
                value={selectedDefectOption}
                onChange={handleDefectChange}
                options={defectOptions}
                placeholder={t("qcAccuracy.selectDefect", "Select Defect...")}
                className="react-select-container flex-grow"
                classNamePrefix="react-select"
                styles={reactSelectStyles}
                menuPortalTarget={document.body}
              />
              {selectedDefectOption && (
                <button
                  onClick={clearDefect}
                  className="p-2 text-gray-500 hover:text-red-500 ml-2"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </CardRow>

          <CardRow label={t("qcAccuracy.decision", "Decision")}>
            {standardDefectInfo && decisionOptions.length > 1 ? (
              <select
                value={defect.decision || ""}
                onChange={handleDecisionChange}
                className="w-full p-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {decisionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="px-2 text-gray-500">
                {defect.decision || "N/A"}
              </span>
            )}
          </CardRow>

          <CardRow label={t("qcAccuracy.qty", "Qty")}>
            <div className="flex items-center">
              <button
                onClick={() =>
                  onUpdate(rowIndex, "qty", Math.max(1, defect.qty - 1))
                }
                className="p-1 text-gray-400 hover:text-white hover:bg-red-500 rounded-full"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center font-semibold">
                {defect.qty}
              </span>
              <button
                onClick={() => onUpdate(rowIndex, "qty", defect.qty + 1)}
                className="p-1 text-gray-400 hover:text-white hover:bg-green-500 rounded-full"
              >
                <Plus size={16} />
              </button>
            </div>
          </CardRow>

          <CardRow label={t("qcAccuracy.buyerStatus", "Buyer Status")}>
            <select
              value={defect.type || ""}
              onChange={(e) => onUpdate(rowIndex, "type", e.target.value)}
              disabled={!selectedDefectOption || typeOptions.length <= 1}
              className="w-full p-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {typeOptions.length === 0 && (
                <option value="">
                  {t("qcAccuracy.selectADefectFirst", "Select a defect")}
                </option>
              )}
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </CardRow>

          <CardRow label={t("qcAccuracy.standardStatus", "Standard Status")}>
            <span className={statusColorClass(defect.standardStatus)}>
              {defect.standardStatus}
            </span>
          </CardRow>

          <CardRow label={t("qcAccuracy.image", "Image")}>
            <QAImageUpload
              imageUrl={defect.imageUrl || ""}
              onImageChange={handleImageChange}
              uploadMetadata={uploadMetadata}
            />
          </CardRow>
        </dl>
      )}
    </div>
  );
};

export default QADefectCard;
