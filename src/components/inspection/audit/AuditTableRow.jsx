import {
  Check,
  FileText,
  Minus, // --- NEW: Import Minus icon ---
  Plus, // --- NEW: Import Plus icon ---
  Table as TableIcon,
  X as XIcon
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AuditImageUpload from "./AuditImageUpload";
import ObservationModal from "./ObservationModal";

const AuditTableRow = ({
  item,
  index,
  onUpdate,
  sectionEnabled,
  currentLang
}) => {
  const { t } = useTranslation();

  // No changes needed to state management
  const [status, setStatus] = useState({
    ok: item.ok,
    toImprove: item.toImprove,
    na: item.na
  });
  const [observationData, setObservationData] = useState(item.observationData);
  const [images, setImages] = useState(item.images);
  const [mustHaveToggle, setMustHaveToggle] = useState(item.mustHave);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setStatus({ ok: item.ok, toImprove: item.toImprove, na: item.na });
    setObservationData(item.observationData);
    setImages(item.images);
    setMustHaveToggle(item.mustHave);
  }, [item]);

  const handleObservationSave = (newObservationData) => {
    setObservationData(newObservationData);
    // You're updating the whole item, which is fine, but let's just update the specific property
    const updatedItem = { ...item, observationData: newObservationData };
    onUpdate(index, updatedItem);
    setIsModalOpen(false);
  };

  // --- MODIFIED: `handleStatusClick` to handle initial score for "To Improve" ---
  const handleStatusClick = (statusField) => {
    if (!sectionEnabled) return;

    const newItem = { ...item }; // Create a mutable copy of the item
    newItem.ok = false;
    newItem.toImprove = false;
    newItem.na = false;
    newItem[statusField] = true;

    const levelScore = parseInt(item.staticData.levelValue, 10) || 0;

    if (statusField === "ok") {
      newItem.score = levelScore;
      newItem.naScore = 0;
    } else if (statusField === "na") {
      newItem.score = 0;
      newItem.naScore = levelScore;
    } else if (statusField === "toImprove") {
      // When switching to "To Improve", the score becomes 0.
      // The user can then adjust it.
      newItem.score = 0;
      newItem.naScore = 0;
    }

    onUpdate(index, newItem);
  };

  // --- NEW: Handlers for Incrementing and Decrementing Score ---
  const handleScoreChange = (change) => {
    if (!sectionEnabled || !item.toImprove) return;

    const currentScore = item.score || 0;
    const levelValue = parseInt(item.staticData.levelValue, 10) || 0;
    const maxScore = Math.max(0, levelValue - 1); // Max score is level - 1

    let newScore = currentScore + change;

    // Clamp the new score between 0 and the maximum allowed score
    newScore = Math.max(0, Math.min(newScore, maxScore));

    const updatedItem = { ...item, score: newScore };
    onUpdate(index, updatedItem);
  };

  const handleMustHaveClick = () => {
    if (!sectionEnabled || item.staticData.mustHave === true) return;
    const newMustHaveState = !mustHaveToggle;
    setMustHaveToggle(newMustHaveState);
    onUpdate(index, { ...item, mustHave: newMustHaveState });
  };

  const handleImagesChange = (newImages) => {
    if (!sectionEnabled) return;
    setImages(newImages); // This is local state, need to propagate up
    onUpdate(index, { ...item, images: newImages });
  };

  // Other helper functions remain the same
  const hasObservations = () =>
    observationData.isTable ||
    (observationData.text && observationData.text.trim() !== "");
  const getStatusCellStyle = (statusField) => {
    if (!sectionEnabled) return "bg-gray-100 cursor-not-allowed";
    if (status[statusField]) {
      if (statusField === "ok") return "bg-green-100 hover:bg-green-200";
      if (statusField === "toImprove") return "bg-red-100 hover:bg-red-200";
      if (statusField === "na") return "bg-gray-200 hover:bg-gray-300";
    }
    return "hover:bg-gray-50";
  };
  const getDisplayText = (dataObject, fieldPrefix, lang) => {
    const effectiveLang =
      typeof lang === "string" && lang.trim() !== ""
        ? lang.toLowerCase()
        : "en";
    const khmerField = `${fieldPrefix}Khmer`;
    const chineseField = `${fieldPrefix}Chinese`;
    const engField = `${fieldPrefix}Eng`;
    if (!dataObject) return t("common.notAvailableShort", "N/A");
    let textToDisplay;
    if (effectiveLang === "km") textToDisplay = dataObject[khmerField];
    else if (effectiveLang === "zh") textToDisplay = dataObject[chineseField];
    else textToDisplay = dataObject[engField];
    if (typeof textToDisplay === "string" && textToDisplay.trim() !== "")
      return textToDisplay;
    const fallbackToEng = dataObject[engField];
    return typeof fallbackToEng === "string" && fallbackToEng.trim() !== ""
      ? fallbackToEng
      : t("common.notAvailableShort", "N/A");
  };

  const staticItemData = item.staticData || {};
  const { no: itemNo, levelValue, mustHave: mustHaveFromDB } = staticItemData;
  const mainTopicDisplay = getDisplayText(
    staticItemData,
    "mainTopic",
    currentLang
  );
  const pointTitleDisplay = getDisplayText(
    staticItemData,
    "pointTitle",
    currentLang
  );
  const pointDescriptionDisplay = getDisplayText(
    staticItemData,
    "pointDescription",
    currentLang
  );

  // --- NEW: Variables for score adjustment logic ---
  const isScoreAdjustable = sectionEnabled && item.toImprove;
  const maxAdjustableScore = Math.max(0, (parseInt(levelValue, 10) || 0) - 1);

  return (
    <>
      <tr className={`${!sectionEnabled ? "opacity-70" : ""}`}>
        {/* All other cells remain unchanged */}
        <td className="border p-1.5 align-top text-xs w-[15%]">
          {mainTopicDisplay}
        </td>
        <td className="border p-1.5 align-top text-xs text-center w-[5%]">
          {itemNo}
        </td>
        <td className="border p-1.5 align-top text-xs w-[30%]">
          <strong className="font-medium">{pointTitleDisplay}:</strong>{" "}
          {pointDescriptionDisplay}
        </td>
        {["ok", "toImprove", "na"].map((statusKey) => (
          <td
            key={statusKey}
            className={`border p-1.5 align-middle text-center cursor-pointer w-[5%] ${getStatusCellStyle(
              statusKey
            )}`}
            onClick={() => handleStatusClick(statusKey)}
          >
            {status[statusKey] && (
              <Check size={16} className="mx-auto text-gray-700" />
            )}
          </td>
        ))}
        <td
          className={`border p-1.5 align-top text-xs w-[20%] transition-colors ${
            hasObservations() ? "bg-amber-50" : ""
          } ${
            sectionEnabled
              ? "cursor-pointer hover:bg-gray-100"
              : "cursor-not-allowed"
          }`}
          onClick={() => sectionEnabled && setIsModalOpen(true)}
          title={t("auditTable.editObservations", "Edit Observations")}
        >
          {hasObservations() ? (
            observationData.isTable ? (
              <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                <TableIcon size={14} />
                <span>
                  {t("auditTable.tableDataAdded", "Table Data Added")}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-1.5 text-gray-700">
                <FileText size={14} className="mt-0.5 shrink-0" />
                <p className="line-clamp-4 text-ellipsis">
                  {observationData.text}
                </p>
              </div>
            )
          ) : (
            <p className="text-gray-400 italic">
              {t("auditTable.addObservationPrompt", "Click to add...")}
            </p>
          )}
        </td>
        <td className="border p-1.5 align-top text-xs w-[10%]">
          <AuditImageUpload
            images={images}
            onImagesChange={handleImagesChange}
            requirementId={`${item.staticData?.mainTopicEng}_${itemNo}`}
            maxImages={5}
          />
        </td>
        <td className="border p-1.5 align-middle text-center text-xs w-[5%]">
          {levelValue}
        </td>
        <td
          className={`border p-1.5 align-middle text-center w-[5%] ${
            mustHaveFromDB
              ? "bg-blue-100 cursor-not-allowed"
              : sectionEnabled
              ? "cursor-pointer hover:bg-blue-50"
              : "cursor-not-allowed"
          } ${mustHaveToggle && !mustHaveFromDB ? "bg-blue-200" : ""}`}
          onClick={handleMustHaveClick}
        >
          {(mustHaveFromDB || mustHaveToggle) && (
            <XIcon size={16} className="mx-auto text-gray-700" />
          )}
        </td>

        {/* --- MODIFIED: The Score Cell --- */}
        <td className="border p-1.5 align-middle text-center text-xs w-[5%]">
          {isScoreAdjustable ? (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => handleScoreChange(-1)}
                disabled={item.score <= 0}
                className="p-0.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <Minus size={12} />
              </button>
              <span className="font-bold text-sm w-4 text-center">
                {item.score}
              </span>
              <button
                onClick={() => handleScoreChange(1)}
                disabled={item.score >= maxAdjustableScore}
                className="p-0.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <span className="font-bold text-sm">{item.score}</span>
          )}
        </td>

        <td className="border p-1.5 align-middle text-center text-xs w-[5%]">
          {item.naScore}
        </td>
      </tr>

      <ObservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleObservationSave}
        initialData={observationData}
        sectionEnabled={sectionEnabled}
      />
    </>
  );
};

export default AuditTableRow;
