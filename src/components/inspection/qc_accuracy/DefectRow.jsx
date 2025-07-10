import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Minus, Trash2, RotateCcw } from "lucide-react";
import Select from "react-select";
import QAImageUpload from "./QAImageUpload";

const DefectRow = ({
  defect,
  rowIndex,
  availableDefects,
  standardDefects, // <-- Receive standard defects
  buyer,
  onUpdate,
  onDelete,
  uploadMetadata // Pass metadata for uploads
}) => {
  const { t, i18n } = useTranslation();

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
      label: getDefectNameForDisplay(d),
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

  const clearDefect = () => {
    onUpdate(rowIndex, "clear", null);
  };

  // --- FIX #6: NEW LOGIC FOR STANDARD DECISIONS & STATUS ---
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

  const handleImageChange = (imageUrl) => {
    onUpdate(rowIndex, "imageUrl", imageUrl);
  };

  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)",
      boxShadow: "none",
      "&:hover": {
        borderColor: "var(--color-border-hover)"
      }
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)", // Sets the main dropdown background
      zIndex: 50
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      // This logic correctly sets the background for each option state
      backgroundColor: isSelected
        ? "var(--color-bg-accent-active)"
        : isFocused
        ? "var(--color-bg-accent)"
        : "var(--color-bg-secondary)", // Use the menu's background color by default
      color: "var(--color-text-primary)",
      ":active": {
        backgroundColor: "var(--color-bg-accent-active)"
      }
    }),
    placeholder: (base) => ({ ...base, color: "var(--color-text-secondary)" })
  };

  // const reactSelectStyles = {
  //   control: (base) => ({
  //     ...base,
  //     backgroundColor: "var(--color-bg-secondary)",
  //     borderColor: "var(--color-border)",
  //     boxShadow: "none"
  //   }),
  //   singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
  //   input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
  //   menu: (base) => ({
  //     ...base,
  //     backgroundColor: "var(--color-bg-secondary)",
  //     zIndex: 50
  //   }),
  //   menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  //   option: (base, state) => ({
  //     ...base,
  //     backgroundColor: state.isFocused
  //       ? "var(--color-bg-accent)"
  //       : "transparent",
  //     color: "var(--color-text-primary)",
  //     "&:active": { backgroundColor: "var(--color-bg-accent-active)" }
  //   })
  // };

  return (
    <tr className="dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
      {/* Pcs No */}
      <td className="p-2 border-x dark:border-gray-600 font-mono text-center">
        {defect.pcsNo}
      </td>
      {/* Defect Name */}
      <td className="p-2 border-r dark:border-gray-600 min-w-[250px]">
        <div className="flex items-center">
          <Select
            value={selectedDefectOption}
            onChange={handleDefectChange}
            options={defectOptions}
            placeholder={t("qcAccuracy.selectDefect", "Select Defect...")}
            className="react-select-container flex-grow"
            classNamePrefix="react-select"
            styles={reactSelectStyles}
            menuPortalTarget={document.body} // Fix for dropdown clipping
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
      </td>
      {/* --- FIX #6: NEW DECISION CELL --- */}
      <td className="p-2 border-r dark:border-gray-600 min-w-[200px]">
        {standardDefectInfo && decisionOptions.length > 1 ? (
          <select
            value={defect.decision || ""}
            onChange={handleDecisionChange}
            className="w-full p-2 bg-transparent border ... "
          >
            {decisionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="px-2 text-gray-500">{defect.decision || "N/A"}</span>
        )}
      </td>
      {/* Qty */}
      <td className="p-2 border-r dark:border-gray-600 text-center">
        <div className="flex items-center justify-center">
          <button
            onClick={() =>
              onUpdate(rowIndex, "qty", Math.max(1, defect.qty - 1))
            }
            className="p-1 text-gray-400 hover:text-white hover:bg-red-500 rounded-full"
          >
            <Minus size={16} />
          </button>
          <span className="w-10 text-center font-semibold">{defect.qty}</span>
          <button
            onClick={() => onUpdate(rowIndex, "qty", defect.qty + 1)}
            className="p-1 text-gray-400 hover:text-white hover:bg-green-500 rounded-full"
          >
            <Plus size={16} />
          </button>
        </div>
      </td>
      {/* Buyer Status (previously Type) */}
      <td className="p-2 border-r dark:border-gray-600 min-w-[150px]">
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
      </td>

      {/* --- FIX #6: NEW STANDARD STATUS CELL --- */}
      <td className="p-2 border-r dark:border-gray-600 text-center">
        <span className={statusColorClass(defect.standardStatus)}>
          {defect.standardStatus}
        </span>
      </td>

      {/* --- NEW IMAGE COLUMN --- */}
      <td className="p-2 border-r dark:border-gray-600 w-24 text-center">
        <QAImageUpload
          imageUrl={defect.imageUrl || ""}
          onImageChange={handleImageChange}
          uploadMetadata={uploadMetadata}
        />
      </td>

      {/* Action */}

      <td className="p-2 text-center">
        <button
          onClick={() => onDelete(rowIndex)}
          className="text-red-500 hover:text-red-400"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
};

export default DefectRow;
