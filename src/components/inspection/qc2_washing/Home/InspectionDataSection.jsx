import { useState, useRef, useEffect } from "react";
import {
  FaThermometerHalf,
  FaClock,
  FaFlask,
  FaPlus,
  FaTrash,
  FaMinus,
  FaUpload,
  FaCamera,
  FaTint
} from "react-icons/fa";
import { API_BASE_URL } from "../../../../../config";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const PARAM_APPEARANCE = "Appearance";
const PARAM_COLOR_SHADE = "Color Shade";
const CHECKED_LIST_FIBER = "Fiber";

function getColorShadeName(index) {
  return `${PARAM_COLOR_SHADE} ${String(index + 1).padStart(2, "0")}`;
}

const machineTypes = [
  {
    value: "Washing Machine",
    label: "Washing Machine",
    parameters: [
      { key: "temperature", label: "Temp", unit: "°C" },
      { key: "time", label: "Time", unit: "min" },
      { key: "silicon", label: "Silicon", unit: "gram" },
      { key: "softener", label: "Softener", unit: "gram" }
    ]
  },
  {
    value: "Tumble Dry",
    label: "Tumble Dry",
    parameters: [
      { key: "temperature", label: "Temp", unit: "°C" },
      { key: "timeCool", label: "Time Cool", unit: "min" },
      { key: "timeHot", label: "Time Hot", unit: "min" }
    ]
  }
];

const InspectionDataSection = ({
  inspectionData,
  setInspectionData,
  processData,
  setProcessData,
  defectData,
  isVisible = false,
  onToggle,
  machineType,
  setMachineType,
  washQty,
  setDefectData,
  recordId,
  activateNextSection,
  onLoadSavedDataById,
  washType,
  standardValues,
  setStandardValues,
  actualValues,
  setActualValues,
  machineStatus,
  setMachineStatus,
  checkpointInspectionData, // This is the transactional data
  setCheckpointInspectionData,
  timeCoolEnabled, // Prop from parent
  setTimeCoolEnabled, // Prop from parent
  timeHotEnabled, // Prop from parent
  setTimeHotEnabled, // Prop from parent
  checkpointDefinitions // This is the master list of checkpoints
}) => {
  const uploadRefs = useRef([]);
  const captureRefs = useRef([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const { t, i18n } = useTranslation();
  const [referenceSampleApproveDate, setReferenceSampleApproveDate] = useState(
    () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to 00:00:00.000
      return now.toISOString().split("T")[0];
    }
  );
  const getCurrentLanguageCode = (i18n) => {
    return i18n?.language || "en";
  };
  // Helper function to get remark in current language from database
  const getRemarkInCurrentLanguage = (remarkObject, i18n) => {
    if (!remarkObject) return "";

    const currentLang = getCurrentLanguageCode(i18n);

    switch (currentLang) {
      case "kh": // Khmer (your code)
        return remarkObject.khmer || remarkObject.english || "";
      case "ch": // Chinese (your code)
        return remarkObject.chinese || remarkObject.english || "";
      case "en": // English
      default:
        return remarkObject.english || "";
    }
  };
  // Helper function to get English remark for saving
  const getEnglishRemark = (
    currentRemark,
    checkpointInspectionData,
    itemIndex
  ) => {
    if (!currentRemark || !checkpointInspectionData[itemIndex])
      return currentRemark;

    const item = checkpointInspectionData[itemIndex];
    const selectedOption = item.options.find(
      (opt) => opt.name === item.decision
    );

    // If we have the option with remark object, return English version
    if (selectedOption?.remark?.english) {
      return selectedOption.remark.english;
    }

    return currentRemark;
  };

  // Helper function to get current language code

  // Helper function to check failure impact and determine main point decision
  const evaluateFailureImpact = (checkpoint, subPointDecisions) => {
    if (!checkpoint?.subPoints || checkpoint.subPoints.length === 0) {
      return null; // No sub-points, no auto-change needed
    }

    const failureImpact = checkpoint.failureImpact || "any";
    const failedSubPoints = subPointDecisions.filter((decision) => {
      const option = checkpoint.subPoints
        .flatMap((sp) => sp.options)
        .find((opt) => opt.name === decision);
      return option && option.isFail;
    });

    switch (failureImpact) {
      case "any":
        // If any sub-point fails, main point should fail
        return failedSubPoints.length > 0 ? "fail" : "pass";
      case "all":
        // Only if all sub-points fail, main point should fail
        return failedSubPoints.length === checkpoint.subPoints.length
          ? "fail"
          : "pass";
      case "majority":
        // If majority of sub-points fail, main point should fail
        return failedSubPoints.length > checkpoint.subPoints.length / 2
          ? "fail"
          : "pass";
      default:
        return null;
    }
  };

  // Update remarks when language changes - only for items with multilingual remarks
  useEffect(() => {
    if (!i18n?.language || checkpointInspectionData.length === 0) return;

    setCheckpointInspectionData((prev) =>
      prev.map((item) => {
        if (item.decision) {
          const selectedOption = item.options.find(
            (opt) => opt.name === item.decision
          );
          // Only update if the option has a multilingual remark object
          if (
            selectedOption?.hasRemark &&
            selectedOption?.remark &&
            typeof selectedOption.remark === "object" &&
            (selectedOption.remark.english ||
              selectedOption.remark.khmer ||
              selectedOption.remark.chinese)
          ) {
            return {
              ...item,
              remark: getRemarkInCurrentLanguage(selectedOption.remark, i18n)
            };
          }
        }
        return item;
      })
    );
  }, [i18n, i18n.language]);

  // This useEffect handles translation for hardcoded inspection points like "Fiber"
  useEffect(() => {
    setInspectionData((prevData) =>
      prevData.map((item) => {
        if (
          item.checkedList === CHECKED_LIST_FIBER &&
          item.decision &&
          ["1", "2", "3"].includes(item.decision)
        ) {
          // First, get the canonical English remark based on the decision
          const englishRemark = getFiberRemarkInEnglish(item.decision);
          // Then, translate that English remark to the current language
          return {
            ...item,
            remark: convertEnglishToCurrentLanguage(englishRemark, t)
          };
        }
        return item;
      })
    );
  }, [i18n.language, t]);

  // Existing useEffects remain the same...
  useEffect(() => {
    const fetchStandardValues = async () => {
      if (!washType) return; // Exit if no washType is selected
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/qc-washing/standards`
        );
        const data = await response.json();
        if (data.success) {
          const standardRecord = data.data.find(
            (record) => record.washType === washType
          );
          if (standardRecord) {
            const washingMachineValues = { ...standardRecord.washingMachine };
            const tumbleDryValues = { ...standardRecord.tumbleDry };

            // Always set the standard values for display
            setStandardValues({
              "Washing Machine": washingMachineValues,
              "Tumble Dry": tumbleDryValues
            });

            // Only set actual values to standard if it's a new record (no recordId)
            // This prevents overwriting loaded data for existing records.
            if (!recordId) {
              setActualValues({
                "Washing Machine": { ...washingMachineValues },
                "Tumble Dry": { ...tumbleDryValues }
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching standard values:", error);
      }
    };
    fetchStandardValues();
  }, [washType, recordId, setStandardValues, setActualValues]);

  // Rest of existing useEffects...
  useEffect(() => {
    const qty = Number(washQty);
    if (!qty || isNaN(qty)) return;

    const colorShadeRows = defectData.filter(
      (d) => d.parameter && d.parameter.startsWith(PARAM_COLOR_SHADE)
    );

    if (colorShadeRows.length === 1) {
      setDefectData((prev) =>
        prev.map((item) =>
          item.parameter && item.parameter.startsWith(PARAM_COLOR_SHADE)
            ? { ...item, checkedQty: qty }
            : item
        )
      );
    } else if (colorShadeRows.length > 1) {
      setDefectData((prev) =>
        prev.map((item) =>
          item.parameter && item.parameter.startsWith(PARAM_COLOR_SHADE)
            ? { ...item, checkedQty: 0 }
            : item
        )
      );
    }

    setDefectData((prev) =>
      prev.map((item) =>
        item.parameter === PARAM_APPEARANCE
          ? {
              ...item,
              checkedQty:
                item.checkedQty && item.checkedQty !== 0 ? item.checkedQty : qty
            }
          : item
      )
    );
  }, [washQty, defectData.length]);

  useEffect(() => {
    if (recordId && inspectionData.length > 0) {
      const hasEmptyDecisions = inspectionData.every(
        (item) => !item.decision || item.decision === ""
      );

      if (hasEmptyDecisions) {
        setInspectionData((prev) =>
          prev.map((item) => ({
            ...item,
            decision: "ok"
          }))
        );
      }
    }
  }, [recordId, inspectionData.length]);

  useEffect(() => {
    if (recordId) {
      const hasAnyStatus =
        Object.keys(machineStatus).length > 0 &&
        Object.values(machineStatus).some(
          (machine) => Object.keys(machine).length > 0
        );

      if (!hasAnyStatus) {
        setMachineStatus({
          "Washing Machine": {
            temperature: { ok: true, no: false },
            time: { ok: true, no: false },
            silicon: { ok: true, no: false },
            softener: { ok: true, no: false }
          },
          "Tumble Dry": {
            temperature: { ok: true, no: false },
            timeCool: { ok: true, no: false },
            timeHot: { ok: true, no: false }
          }
        });
      }
    }
  }, [recordId]);

  // Checkpoint-specific handlers
  const handleCheckpointDecisionChange = (index, value) => {
    setCheckpointInspectionData((prev) => {
      const newData = [...prev];
      const currentItem = newData[index];

      // If the user tries to change a main point that is auto-calculated, do nothing.
      if (currentItem.type === "main") {
        const mainCheckpointDef = checkpointDefinitions.find(
          (cp) => cp._id === currentItem.checkpointId
        );
        if (
          mainCheckpointDef &&
          mainCheckpointDef.failureImpact !== "customize"
        ) {
          return prev; // Abort state update for non-customizable main points
        }
      }

      // Find the selected option to get its remark
      const selectedOption = currentItem.options.find(
        (opt) => opt.name === value
      );

      // Get remark in current language
      let remarkText = "";
      if (selectedOption?.hasRemark && selectedOption?.remark) {
        remarkText = getRemarkInCurrentLanguage(selectedOption.remark, i18n);
      }

      // Update the current item
      newData[index] = {
        ...currentItem,
        decision: value,
        remark: remarkText
      };

      // If this is a sub-point, check if we need to update the main point
      if (currentItem.type === "sub") {
        const mainPointIndex = newData.findIndex(
          (item) =>
            item.type === "main" &&
            item.checkpointId === currentItem.checkpointId
        );

        if (mainPointIndex !== -1) {
          const mainPoint = newData[mainPointIndex];
          const checkpoint = checkpointDefinitions.find(
            (cp) => cp._id === currentItem.checkpointId
          );

          if (checkpoint) {
            // Get all sub-point decisions for this checkpoint
            const subPointDecisions = newData
              .filter(
                (item) =>
                  item.type === "sub" &&
                  item.checkpointId === currentItem.checkpointId
              )
              .map((item) => item.decision);

            // Evaluate failure impact
            const autoDecision = evaluateFailureImpact(
              checkpoint,
              subPointDecisions
            );

            if (autoDecision) {
              // Find the appropriate option for the main point
              const targetOption = mainPoint.options.find(
                (opt) =>
                  (autoDecision === "fail" && opt.isFail) ||
                  (autoDecision === "pass" && !opt.isFail)
              );

              if (targetOption) {
                // Get main point remark in current language
                let mainRemarkText = "";
                if (targetOption.hasRemark && targetOption.remark) {
                  mainRemarkText = getRemarkInCurrentLanguage(
                    targetOption.remark,
                    i18n
                  );
                }

                newData[mainPointIndex] = {
                  ...mainPoint,
                  decision: targetOption.name,
                  remark: mainRemarkText
                };
              }
            }
          }
        }
      }

      return newData;
    });
  };

  const handleCheckpointRemarkChange = (index, value) => {
    setCheckpointInspectionData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, remark: value } : item))
    );
  };

  const handleCheckpointImageChange = (index, files) => {
    const fileArr = Array.from(files).slice(0, 2);
    const images = fileArr.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    setCheckpointInspectionData((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              comparisonImages: [
                ...(item.comparisonImages || []),
                ...images
              ].slice(0, 2)
            }
          : item
      )
    );
  };

  const handleCheckpointRemoveImage = (index, imgIdx) => {
    setCheckpointInspectionData((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              comparisonImages: (item.comparisonImages || []).filter(
                (_, j) => j !== imgIdx
              )
            }
          : item
      )
    );
  };

  // Existing handlers remain the same...
  const handleParamInputChange = (rowIdx, field, value) => {
    setDefectData((prev) => {
      const isColorShade =
        prev[rowIdx].parameter &&
        prev[rowIdx].parameter.startsWith(PARAM_COLOR_SHADE);

      if (isColorShade && field === "checkedQty") {
        const qty = Number(washQty) || 0;
        let newValue = Math.max(0, Math.min(Number(value), qty));

        const otherSum = prev.reduce(
          (sum, item, i) =>
            i !== rowIdx &&
            item.parameter &&
            item.parameter.startsWith(PARAM_COLOR_SHADE)
              ? sum + (Number(item.checkedQty) || 0)
              : sum,
          0
        );

        if (otherSum + newValue > qty) {
          newValue = Math.max(0, qty - otherSum);
        }

        return prev.map((item, i) =>
          i === rowIdx ? { ...item, checkedQty: newValue } : item
        );
      } else {
        return prev.map((item, i) =>
          i === rowIdx
            ? {
                ...item,
                [field]:
                  field === "checkedQty" || field === "failedQty"
                    ? value === ""
                      ? 0
                      : Math.max(0, Number(value))
                    : value
              }
            : item
        );
      }
    });
  };

  const handleAddColorShade = () => {
    const colorShadeRows = defectData.filter(
      (d) => d.parameter && d.parameter.startsWith(PARAM_COLOR_SHADE)
    );
    const nextIndex = colorShadeRows.length;

    setDefectData((prev) => {
      const newRows = [
        ...prev,
        {
          parameter: getColorShadeName(nextIndex),
          checkedQty: 0,
          failedQty: 0,
          result: "",
          remark: ""
        }
      ];

      return newRows.map((item) =>
        item.parameter && item.parameter.startsWith(PARAM_COLOR_SHADE)
          ? { ...item, checkedQty: 0 }
          : item
      );
    });
  };

  const getFiberRemarkInEnglish = (decision) => {
    const englishRemarks = {
      1: "Cleaning must be done by fabric mill.",
      2: "YM doing the cleaning, front & back side.",
      3: "Randomly 2-3 pcs back side hairly can acceptable."
    };
    return englishRemarks[decision] || "";
  };

  const convertEnglishToCurrentLanguage = (englishRemark, t) => {
    const englishToDecisionMap = {
      "Cleaning must be done by fabric mill.": "1",
      "YM doing the cleaning, front & back side.": "2",
      "Randomly 2-3 pcs back side hairly can acceptable.": "3"
    };

    const decision = englishToDecisionMap[englishRemark];
    if (decision) {
      switch (decision) {
        case "1":
          return t("qcWashing.fiber 01");
        case "2":
          return t("qcWashing.fiber 02");
        case "3":
          return t("qcWashing.fiber 03");
        default:
          return englishRemark;
      }
    }
    return englishRemark;
  };

  const handleStatusChange = (machineType, param, status) => {
    // Check if the parameter is enabled before allowing changes
    if (param === "timeCool" && !timeCoolEnabled) return;
    if (param === "timeHot" && !timeHotEnabled) return;

    setMachineStatus((prev) => ({
      ...prev,
      [machineType]: {
        ...prev[machineType],
        [param]: {
          ok: status === "ok",
          no: status === "no"
        }
      }
    }));

    if (status === "ok") {
      const standardVal = standardValues[machineType][param];
      if (param === "temperature") {
        const valueToSet =
          standardVal === null || standardVal === undefined
            ? ""
            : String(standardVal);
        setActualValues((prev) => ({
          ...prev,
          [machineType]: {
            ...prev[machineType],
            [param]: valueToSet
          }
        }));
      } else {
        const valueToSet =
          standardVal === null || standardVal === undefined
            ? ""
            : String(standardVal);
        setActualValues((prev) => ({
          ...prev,
          [machineType]: {
            ...prev[machineType],
            [param]: valueToSet
          }
        }));
      }
    } else if (status === "no") {
      setActualValues((prev) => ({
        ...prev,
        [machineType]: {
          ...prev[machineType],
          [param]: ""
        }
      }));
    }
  };

  const evaluateExpression = (expression) => {
    if (!expression || typeof expression !== "string") return null;

    try {
      const cleaned = expression.trim();
      if (/^\d+(\.\d+)?$/.test(cleaned)) {
        return parseFloat(cleaned);
      }

      const match = cleaned.match(/^$([^)]+)$$/);
      if (match) {
        const innerExpression = match[1];
        if (/^[\d+\-\s\.]+$/.test(innerExpression)) {
          const sanitized = innerExpression.replace(/\s/g, "");
          return Function('"use strict"; return (' + sanitized + ")")();
        }
      }

      if (/^[\d+\-\s\.]+$/.test(cleaned)) {
        const sanitized = cleaned.replace(/\s/g, "");
        return Function('"use strict"; return (' + sanitized + ")")();
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const handleActualValueChange = (machineType, param, value) => {
    // Check if the parameter is enabled before allowing changes
    if (param === "timeCool" && !timeCoolEnabled) return;
    if (param === "timeHot" && !timeHotEnabled) return;

    const processedValue = value === 0 || value === "0" ? "0" : value;
    setActualValues((prev) => ({
      ...prev,
      [machineType]: {
        ...prev[machineType],
        [param]: processedValue
      }
    }));

    const standardValue = standardValues[machineType][param];
    const standardStr =
      standardValue === null || standardValue === undefined
        ? ""
        : String(standardValue).trim();
    const actualStr =
      value === null || value === undefined ? "" : String(value).trim();

    if (
      (param === "timeCool" || param === "timeHot") &&
      actualStr !== "" &&
      standardStr !== ""
    ) {
      const standardNum = parseFloat(standardStr);
      let actualNum = evaluateExpression(actualStr);

      if (actualNum === null) {
        actualNum = parseFloat(actualStr);
      }

      if (!isNaN(standardNum) && !isNaN(actualNum)) {
        if (actualNum === standardNum) {
          setMachineStatus((prev) => ({
            ...prev,
            [machineType]: {
              ...prev[machineType],
              [param]: {
                ok: true,
                no: false
              }
            }
          }));
        } else {
          setMachineStatus((prev) => ({
            ...prev,
            [machineType]: {
              ...prev[machineType],
              [param]: {
                ok: false,
                no: true
              }
            }
          }));
        }
        return;
      }
    }

    if (param === "temperature" && actualStr !== "" && standardStr !== "") {
      const standardNum = parseFloat(standardStr);
      const actualNum = parseFloat(actualStr);

      if (!isNaN(standardNum) && !isNaN(actualNum)) {
        const difference = Math.abs(standardNum - actualNum);
        if (difference <= 5) {
          setMachineStatus((prev) => ({
            ...prev,
            [machineType]: {
              ...prev[machineType],
              [param]: {
                ok: true,
                no: false
              }
            }
          }));
        } else {
          setMachineStatus((prev) => ({
            ...prev,
            [machineType]: {
              ...prev[machineType],
              [param]: {
                ok: false,
                no: true
              }
            }
          }));
        }
        return;
      }
    }

    if (actualStr !== "" && actualStr === standardStr) {
      setMachineStatus((prev) => ({
        ...prev,
        [machineType]: {
          ...prev[machineType],
          [param]: {
            ok: true,
            no: false
          }
        }
      }));
    } else if (actualStr !== "" && actualStr !== standardStr) {
      setMachineStatus((prev) => ({
        ...prev,
        [machineType]: {
          ...prev[machineType],
          [param]: {
            ok: false,
            no: true
          }
        }
      }));
    }
  };

  const convertImagePathToUrl = (imagePath) => {
    if (!imagePath || imagePath.startsWith("blob:")) return imagePath;
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    if (imagePath.startsWith("./public/storage/")) {
      const relativePath = imagePath.replace("./public/storage/", "");
      return `${API_BASE_URL}/storage/${relativePath}`;
    } else if (imagePath.startsWith("./public/")) {
      const relativePath = imagePath.replace("./public/", "");
      return `${API_BASE_URL}/public/${relativePath}`;
    } else if (imagePath.startsWith("/storage/")) {
      return `${API_BASE_URL}${imagePath}`;
    } else if (imagePath.startsWith("storage/")) {
      return `${API_BASE_URL}/${imagePath}`;
    } else if (imagePath.startsWith("/public/")) {
      return `${API_BASE_URL}${imagePath}`;
    } else if (imagePath.startsWith("public/")) {
      return `${API_BASE_URL}/${imagePath}`;
    } else {
      const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
      return `${API_BASE_URL}${cleanPath}`;
    }
  };

  const handleSaveInspection = async () => {
    if (!recordId) {
      alert("Order details must be saved first!");
      return;
    }

    try {
      const defectDataWithPassRate = defectData.map((item) => {
        const checkedQty = Number(item.checkedQty) || 0;
        const failedQty = Number(item.failedQty) || 0;
        const passRate =
          checkedQty > 0
            ? (((checkedQty - failedQty) / checkedQty) * 100).toFixed(2)
            : "0.00";
        const result =
          passRate >= 95 ? "Pass" : passRate >= 90 ? "Pass" : "Fail";
        return {
          ...item,
          passRate,
          result
        };
      });

      const processedActualValues = {};
      Object.keys(actualValues).forEach((machineType) => {
        processedActualValues[machineType] = {};
        Object.keys(actualValues[machineType]).forEach((param) => {
          const value = actualValues[machineType][param];
          if (value === "") {
            processedActualValues[machineType][param] = null;
          } else if (value === "0" || value === 0) {
            processedActualValues[machineType][param] = 0;
          } else {
            processedActualValues[machineType][param] = value;
          }
        });
      });

      const inspectionDataForSave = inspectionData.map((item) => {
        if (
          item.checkedList === CHECKED_LIST_FIBER &&
          item.decision &&
          ["1", "2", "3"].includes(item.decision)
        ) {
          return {
            ...item,
            remark: getFiberRemarkInEnglish(item.decision)
          };
        }
        return item;
      });

      // Convert checkpoint remarks to English for saving
      const checkpointDataForSave = checkpointInspectionData.map((item) => {
        // If the item has a selected option with remark object, use English version
        if (item.decision) {
          const selectedOption = item.options.find(
            (opt) => opt.name === item.decision
          );
          if (selectedOption?.hasRemark && selectedOption?.remark?.english) {
            return {
              ...item,
              remark: selectedOption.remark.english
            };
          }
        }
        // Otherwise keep the current remark as is
        return item;
      });

      const formData = new FormData();
      formData.append("recordId", recordId);
      formData.append("inspectionData", JSON.stringify(inspectionDataForSave));
      formData.append("processData", JSON.stringify(processData));
      formData.append("defectData", JSON.stringify(defectDataWithPassRate));
      formData.append("standardValues", JSON.stringify(standardValues));
      formData.append("actualValues", JSON.stringify(processedActualValues));
      formData.append("machineStatus", JSON.stringify(machineStatus));
      formData.append(
        "checkpointInspectionData",
        JSON.stringify(checkpointDataForSave)
      );
      formData.append("timeCoolEnabled", JSON.stringify(timeCoolEnabled));
      formData.append("timeHotEnabled", JSON.stringify(timeHotEnabled));

      inspectionData.forEach((item, idx) => {
        (item.comparisonImages || []).forEach((img, imgIdx) => {
          if (img.file) {
            formData.append(`comparisonImages_${idx}_${imgIdx}`, img.file);
          }
        });
      });

      // Add checkpoint images
      checkpointInspectionData.forEach((item, idx) => {
        (item.comparisonImages || []).forEach((img, imgIdx) => {
          if (img.file) {
            formData.append(`checkpointImages_${idx}_${imgIdx}`, img.file);
          }
        });
      });

      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/inspection-save`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();
      if (result.success) {
        if (
          result.data &&
          result.data.inspectionDetails &&
          result.data.inspectionDetails.checkedPoints
        ) {
          setInspectionData((prev) =>
            prev.map((item) => {
              const savedPoint =
                result.data.inspectionDetails.checkedPoints.find(
                  (p) => p.pointName === item.checkedList
                );

              if (
                savedPoint &&
                savedPoint.comparison &&
                savedPoint.comparison.length > 0
              ) {
                const updatedImages = savedPoint.comparison.map((imgPath) => ({
                  file: null,
                  preview: convertImagePathToUrl(imgPath),
                  name:
                    typeof imgPath === "string"
                      ? imgPath.split("/").pop()
                      : "image.jpg"
                }));

                return { ...item, comparisonImages: updatedImages };
              }

              return item;
            })
          );
        }

        Swal.fire({
          icon: "success",
          title: "Inspection data saved!",
          showConfirmButton: false,
          timer: 1000,
          timerProgressBar: true,
          position: "top-end",
          toast: true
        });

        setIsSaved(true);
        setIsEditing(false);
        if (activateNextSection) activateNextSection();

        // After saving, reload the data to ensure the UI is in sync with the database
        if (onLoadSavedDataById && recordId) {
          await onLoadSavedDataById(recordId);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: result.message || "Failed to save inspection data",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          position: "top-end",
          toast: true
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error saving inspection data",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: "top-end",
        toast: true
      });
    }
  };

  const handleUpdateInspection = async () => {
    if (!recordId) {
      alert("Order details must be saved first!");
      return;
    }

    try {
      const defectDataWithPassRate = defectData.map((item) => {
        const checkedQty = Number(item.checkedQty) || 0;
        const failedQty = Number(item.failedQty) || 0;
        const passRate =
          checkedQty > 0
            ? (((checkedQty - failedQty) / checkedQty) * 100).toFixed(2)
            : "0.00";
        const result =
          passRate >= 95 ? "Pass" : passRate >= 90 ? "Pass" : "Fail";

        return {
          ...item,
          passRate,
          result
        };
      });

      const processedActualValues = {};
      Object.keys(actualValues).forEach((machineType) => {
        processedActualValues[machineType] = {};
        Object.keys(actualValues[machineType]).forEach((param) => {
          const value = actualValues[machineType][param];
          if (value === "") {
            processedActualValues[machineType][param] = null;
          } else if (value === "0" || value === 0) {
            processedActualValues[machineType][param] = 0;
          } else {
            processedActualValues[machineType][param] = value;
          }
        });
      });

      const inspectionDataForSave = inspectionData.map((item) => {
        if (
          item.checkedList === CHECKED_LIST_FIBER &&
          item.decision &&
          ["1", "2", "3"].includes(item.decision)
        ) {
          return {
            ...item,
            remark: getFiberRemarkInEnglish(item.decision)
          };
        }
        return item;
      });

      const formData = new FormData();
      formData.append("recordId", recordId);
      formData.append("inspectionData", JSON.stringify(inspectionDataForSave));
      formData.append("processData", JSON.stringify(processData));
      formData.append("defectData", JSON.stringify(defectDataWithPassRate));
      formData.append("standardValues", JSON.stringify(standardValues));
      formData.append("actualValues", JSON.stringify(processedActualValues));
      formData.append("machineStatus", JSON.stringify(machineStatus));
      formData.append(
        "checkpointInspectionData",
        JSON.stringify(checkpointInspectionData)
      );
      formData.append("timeCoolEnabled", JSON.stringify(timeCoolEnabled));
      formData.append("timeHotEnabled", JSON.stringify(timeHotEnabled));

      inspectionData.forEach((item, idx) => {
        (item.comparisonImages || []).forEach((img, imgIdx) => {
          if (img.file) {
            formData.append(`comparisonImages_${idx}_${imgIdx}`, img.file);
          }
        });
      });

      // Add checkpoint images
      checkpointInspectionData.forEach((item, idx) => {
        (item.comparisonImages || []).forEach((img, imgIdx) => {
          if (img.file) {
            formData.append(`checkpointImages_${idx}_${imgIdx}`, img.file);
          }
        });
      });

      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/inspection-update`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();
      if (result.success) {
        if (
          result.data &&
          result.data.inspectionDetails &&
          result.data.inspectionDetails.checkedPoints
        ) {
          setInspectionData((prev) =>
            prev.map((item) => {
              const savedPoint =
                result.data.inspectionDetails.checkedPoints.find(
                  (p) => p.pointName === item.checkedList
                );

              if (
                savedPoint &&
                savedPoint.comparison &&
                savedPoint.comparison.length > 0
              ) {
                const updatedImages = savedPoint.comparison.map((imgPath) => ({
                  file: null,
                  preview: convertImagePathToUrl(imgPath),
                  name:
                    typeof imgPath === "string"
                      ? imgPath.split("/").pop()
                      : "image.jpg"
                }));

                return { ...item, comparisonImages: updatedImages };
              }

              return item;
            })
          );
        }

        Swal.fire({
          icon: "success",
          title: "Inspection data updated!",
          showConfirmButton: false,
          timer: 1000,
          timerProgressBar: true,
          position: "top-end",
          toast: true
        });

        setIsSaved(true);
        setIsEditing(false);

        // After updating, reload the data to ensure the UI is in sync
        if (onLoadSavedDataById && recordId) {
          await onLoadSavedDataById(recordId);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: result.message || "Failed to update inspection data",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          position: "top-end",
          toast: true
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error updating inspection data",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: "top-end",
        toast: true
      });
      console.error(err);
    }
  };

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function stripFileFromImagesAsync(inspectionData) {
    return Promise.all(
      inspectionData.map(async (item) => ({
        ...item,
        comparisonImages: await Promise.all(
          (item.comparisonImages || []).map(async (img) => {
            if (img && typeof img === "object" && img.file) {
              const base64 = await fileToBase64(img.file);
              return { preview: base64, name: img.name || "image.jpg" };
            }

            if (img && typeof img === "object" && img.preview) {
              return { preview: img.preview, name: img.name || "image.jpg" };
            }

            if (typeof img === "string") {
              return { preview: img, name: "image.jpg" };
            }

            return { preview: "", name: "image.jpg" };
          })
        )
      }))
    );
  }

  const handleDecisionChange = (index, value) => {
    setInspectionData((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          let autoRemark = item.remark;

          if (item.checkedList === CHECKED_LIST_FIBER) {
            switch (value) {
              case "1":
                autoRemark = t("qcWashing.fiber 01");
                break;
              case "2":
                autoRemark = t("qcWashing.fiber 02");
                break;
              case "3":
                autoRemark = t("qcWashing.fiber 03");
                break;
              default:
                autoRemark = "";
            }
          }

          return {
            ...item,
            decision: value,
            remark: autoRemark
          };
        }
        return item;
      })
    );
  };

  const handleImageChange = (index, files) => {
    const fileArr = Array.from(files).slice(0, 2);
    const images = fileArr.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    setInspectionData((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              comparisonImages: [
                ...(item.comparisonImages || []),
                ...images
              ].slice(0, 2)
            }
          : item
      )
    );
  };

  useEffect(() => {
    if (recordId) {
      setInspectionData((prev) =>
        prev.map((item) => {
          if (item.comparisonImages && item.comparisonImages.length > 0) {
            const updatedImages = item.comparisonImages.map((img) => {
              const preview =
                typeof img === "string" ? img : img && img.preview;

              if (
                preview &&
                !preview.startsWith("http") &&
                !preview.startsWith("blob:")
              ) {
                const newPreview = convertImagePathToUrl(preview);
                if (typeof img === "string") {
                  return {
                    file: null,
                    preview: newPreview,
                    name: preview.split("/").pop() || "image.jpg"
                  };
                }

                return { ...img, preview: newPreview };
              }

              return img;
            });

            return { ...item, comparisonImages: updatedImages };
          }

          return item;
        })
      );
    }
  }, [recordId]);

  const handleRemoveImage = (index, imgIdx) => {
    setInspectionData((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              comparisonImages: (item.comparisonImages || []).filter(
                (_, j) => j !== imgIdx
              )
            }
          : item
      )
    );
  };

  const colorShadeRows = defectData.filter(
    (d) => d.parameter && d.parameter.startsWith(PARAM_COLOR_SHADE)
  );
  const appearanceRow = defectData.find(
    (d) => d.parameter === PARAM_APPEARANCE
  );

  const handleRemoveColorShade = (idx) => {
    setDefectData((prev) => {
      const newData = prev.filter((d, i) => {
        if (d.parameter && d.parameter.startsWith(PARAM_COLOR_SHADE)) {
          const shadeIdx = prev
            .filter(
              (x) => x.parameter && x.parameter.startsWith(PARAM_COLOR_SHADE)
            )
            .indexOf(d);
          return shadeIdx !== idx;
        }

        return true;
      });

      let shadeCount = 0;
      return newData.map((d) =>
        d.parameter && d.parameter.startsWith(PARAM_COLOR_SHADE)
          ? { ...d, parameter: getColorShadeName(shadeCount++) }
          : d
      );
    });
  };

  const getPassRate = (checkedQty, failedQty) => {
    const c = Number(checkedQty) || 0;
    const f = Number(failedQty) || 0;
    if (c === 0) return 0;
    return ((c - f) / c) * 100;
  };

  const getResult = (passRate) => {
    if (passRate >= 95) return { text: "Pass", color: "green" };
    if (passRate >= 90) return { text: "Pass", color: "yellow" };
    return { text: "Fail", color: "red" };
  };

  const rows = [...colorShadeRows, ...(appearanceRow ? [appearanceRow] : [])];

  const imageModal = previewImage && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      onClick={() => setPreviewImage(null)}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <img
          src={previewImage}
          alt="Preview"
          className="max-w-full max-h-[80vh] rounded shadow-lg"
        />
        <button
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          ×
        </button>
      </div>
    </div>
  );

  return (
    <>
      {imageModal}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Inspection Data
          </h2>
          <button
            onClick={onToggle}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {isVisible ? "Hide" : "Show"}
          </button>
        </div>

        {isVisible && (
          <>
            {/* Database Checkpoints Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 pb-2">
                Standard Inspection Points
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead className="dark:bg-gray-700">
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="border px-4 py-2 text-left dark:text-white">
                        Checkpoint
                      </th>
                      <th className="border px-4 py-2 text-center dark:text-white">
                        Decision
                      </th>
                      <th className="border px-4 py-2 text-center dark:text-white">
                        Comparison
                      </th>
                      <th className="border px-4 py-2 text-left dark:text-white">
                        Remark
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkpointInspectionData.map((item, idx) => {
                      const checkpointDefinition = checkpointDefinitions.find(
                        (cp) => cp._id === item.checkpointId
                      );
                      const isMainPointAuto =
                        item.type === "main" &&
                        checkpointDefinition &&
                        checkpointDefinition.failureImpact !== "customize";

                      return (
                        <tr
                          key={item.id}
                          className={
                            item.type === "sub"
                              ? "bg-gray-50 dark:bg-gray-700"
                              : ""
                          }
                        >
                          <td className="border px-4 py-2 dark:text-white">
                            <div
                              className={`${
                                item.type === "sub"
                                  ? "ml-6 text-sm text-gray-600 dark:text-gray-300"
                                  : "font-medium"
                              }`}
                            >
                              {item.type === "sub" && "└─ "}
                              {item.name}
                              {item.type === "sub" && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                  {/* (under {item.parentName}) */}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-2 p-1 border border-gray-200 text-center">
                            {isMainPointAuto ? (
                              <div className="flex items-center justify-center px-2 py-1">
                                {item.decision ? (
                                  (() => {
                                    const selectedOption = item.options.find(
                                      (opt) => opt.name === item.decision
                                    );
                                    const textColorClass =
                                      selectedOption?.isFail
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-green-600 dark:text-green-400";
                                    return (
                                      <span
                                        className={`font-bold text-sm ${textColorClass}`}
                                      >
                                        {item.decision}
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className="text-sm text-gray-500 italic">
                                    Auto
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-4 justify-left">
                                {item.options.map((option) => (
                                  <label
                                    key={option.id}
                                    className="flex items-center space-x-1 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      name={`checkpoint-decision-${idx}`}
                                      checked={item.decision === option.name}
                                      onChange={() =>
                                        handleCheckpointDecisionChange(
                                          idx,
                                          option.name
                                        )
                                      }
                                      disabled={!isEditing}
                                      className={`w-4 h-4 rounded focus:ring-2 ${
                                        option.isFail
                                          ? "text-red-600 focus:ring-red-500"
                                          : "text-green-600 focus:ring-green-500"
                                      }`}
                                    />
                                    <span
                                      className={`text-sm font-medium ${
                                        option.isFail
                                          ? "text-red-600 dark:text-red-400"
                                          : "text-green-600 dark:text-green-400"
                                      }`}
                                    >
                                      {option.name}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="border px-4 py-2 text-center">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {/* Upload Button */}
                              <button
                                type="button"
                                className="flex items-center justify-center px-2 py-1 bg-blue-500 text-white rounded mr-2 disabled:bg-gray-400"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept = "image/*";
                                  input.multiple = true;
                                  input.onchange = (e) => {
                                    if (
                                      e.target.files &&
                                      e.target.files.length > 0
                                    ) {
                                      handleCheckpointImageChange(
                                        idx,
                                        e.target.files,
                                        "upload"
                                      );
                                    }
                                  };
                                  input.click();
                                }}
                                disabled={
                                  !isEditing ||
                                  (item.comparisonImages || []).filter(
                                    (img) => img.source === "upload"
                                  ).length >= 5
                                }
                                title="Upload"
                              >
                                <FaUpload className="mr-1" />
                                <span className="hidden sm:inline">Upload</span>
                              </button>

                              {/* Capture Button */}
                              <button
                                type="button"
                                className="flex items-center justify-center px-2 py-1 bg-green-500 text-white rounded disabled:bg-gray-400"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept = "image/*";
                                  input.capture = "environment";
                                  input.onchange = (e) => {
                                    if (
                                      e.target.files &&
                                      e.target.files.length > 0
                                    ) {
                                      handleCheckpointImageChange(
                                        idx,
                                        e.target.files,
                                        "capture"
                                      );
                                    }
                                  };
                                  input.click();
                                }}
                                disabled={
                                  !isEditing ||
                                  (item.comparisonImages || []).filter(
                                    (img) => img.source === "capture"
                                  ).length >= 5
                                }
                                title="Capture"
                              >
                                <FaCamera className="mr-1" />
                                <span className="hidden sm:inline">
                                  Capture
                                </span>
                              </button>

                              {/* Thumbnails */}
                              <div className="flex mt-1 col-span-2">
                                {(item.comparisonImages || []).map(
                                  (img, imgIdx) => (
                                    <div key={imgIdx} className="relative mr-2">
                                      <img
                                        src={img.preview}
                                        alt="comparison"
                                        width={50}
                                        className="border cursor-pointer"
                                        onClick={() =>
                                          setPreviewImage(img.preview)
                                        }
                                      />
                                      <button
                                        type="button"
                                        disabled={!isEditing}
                                        onClick={() =>
                                          handleCheckpointRemoveImage(
                                            idx,
                                            imgIdx
                                          )
                                        }
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center disabled:bg-gray-400"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="border px-4 py-2 dark:text-white">
                            <input
                              type="text"
                              value={item.remark}
                              onChange={(e) =>
                                handleCheckpointRemarkChange(
                                  idx,
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 disabled:bg-gray-400"
                              disabled={!isEditing}
                              placeholder={
                                item.decision &&
                                item.options.find(
                                  (opt) => opt.name === item.decision
                                )?.hasRemark
                                  ? `Auto-filled (${getCurrentLanguageCode(
                                      i18n
                                    ).toUpperCase()})...`
                                  : ""
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Machine Parameters Section - Keep existing code */}
            <div className="mb-4 mt-4 grid gap-4 grid-cols-1 md:grid-cols-2">
              {machineTypes.map((type) => (
                <div
                  key={type.value}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow p-3 flex flex-col"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg font-semibold dark:text-white">
                      {type.label}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {type.parameters.map((param) => {
                      const isOk = machineStatus[type.value]?.[param.key]?.ok;
                      const isNo = machineStatus[type.value]?.[param.key]?.no;
                      const actualValue =
                        actualValues[type.value]?.[param.key] || "";
                      const standardValue =
                        standardValues[type.value]?.[param.key] || "";

                      return (
                        <div
                          key={param.key}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            isOk
                              ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                              : isNo
                              ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                              : "border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {param.key === "temperature" && (
                                <FaThermometerHalf className="text-blue-500" />
                              )}
                              {param.key === "time" && (
                                <FaClock className="text-yellow-500" />
                              )}
                              {param.key === "silicon" && (
                                <FaFlask className="text-purple-500" />
                              )}
                              {param.key === "softener" && (
                                <FaTint className="text-pink-500" />
                              )}
                              {param.key === "timeCool" && (
                                <FaClock className="text-cyan-500" />
                              )}
                              {param.key === "timeHot" && (
                                <FaClock className="text-red-500" />
                              )}
                              <span className="font-medium dark:text-white">
                                {param.label}
                              </span>
                              {(param.key === "timeCool" ||
                                param.key === "timeHot") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isCurrentlyEnabled =
                                      param.key === "timeCool"
                                        ? timeCoolEnabled
                                        : timeHotEnabled;
                                    const newEnabledState = !isCurrentlyEnabled;
                                    const standardVal =
                                      standardValues[type.value]?.[param.key] ||
                                      "";

                                    // Update the parent state for the switch itself
                                    if (param.key === "timeCool") {
                                      setTimeCoolEnabled(newEnabledState);
                                    } else {
                                      setTimeHotEnabled(newEnabledState);
                                    }

                                    if (newEnabledState) {
                                      // --- Turning ON ---
                                      // Set actual value to standard value
                                      setActualValues((prev) => ({
                                        ...prev,
                                        [type.value]: {
                                          ...prev[type.value],
                                          [param.key]: String(standardVal)
                                        }
                                      }));
                                      // Set status to OK since actual now matches standard
                                      setMachineStatus((prev) => ({
                                        ...prev,
                                        [type.value]: {
                                          ...prev[type.value],
                                          [param.key]: { ok: true, no: false }
                                        }
                                      }));
                                    } else {
                                      // --- Turning OFF ---
                                      // Clear the actual value
                                      setActualValues((prev) => ({
                                        ...prev,
                                        [type.value]: {
                                          ...prev[type.value],
                                          [param.key]: ""
                                        }
                                      }));
                                      // Reset status to neutral (neither OK nor No)
                                      setMachineStatus((prev) => ({
                                        ...prev,
                                        [type.value]: {
                                          ...prev[type.value],
                                          [param.key]: { ok: false, no: false }
                                        }
                                      }));
                                    }
                                  }}
                                  disabled={!isEditing}
                                  className={`ml-2 px-2 py-1 text-xs rounded ${
                                    (
                                      param.key === "timeCool"
                                        ? timeCoolEnabled
                                        : timeHotEnabled
                                    )
                                      ? "bg-green-500 text-white"
                                      : "bg-blue-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                                  } disabled:opacity-50`}
                                >
                                  {(
                                    param.key === "timeCool"
                                      ? timeCoolEnabled
                                      : timeHotEnabled
                                  )
                                    ? "ON"
                                    : "OFF"}
                                </button>
                              )}
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-100">
                              {param.unit}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
                            <div className="text-center">
                              <label className="block text-xs text-gray-600 dark:text-gray-100 mb-1">
                                Standard
                              </label>
                              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm dark:text-white">
                                {standardValue === null ||
                                standardValue === undefined
                                  ? ""
                                  : String(standardValue)}
                              </div>
                            </div>

                            <div className="text-center">
                              <label className="block text-xs text-gray-600 dark:text-gray-100 mb-1">
                                Actual
                              </label>
                              <input
                                type="text"
                                value={
                                  actualValue === null ||
                                  actualValue === undefined
                                    ? ""
                                    : String(actualValue)
                                }
                                onChange={(e) =>
                                  handleActualValueChange(
                                    type.value,
                                    param.key,
                                    e.target.value
                                  )
                                }
                                disabled={
                                  !isEditing ||
                                  (param.key === "timeCool" &&
                                    !timeCoolEnabled) ||
                                  (param.key === "timeHot" && !timeHotEnabled)
                                }
                                className="w-full px-3 py-2 text-sm border rounded text-center font-mono dark:bg-gray-600 dark:text-white dark:border-gray-500 disabled:bg-gray-200 dark:disabled:bg-gray-700"
                                placeholder="Enter value"
                              />
                            </div>

                            <div className="text-center">
                              <label className="block text-xs text-gray-600 dark:text-gray-100 mb-1">
                                Status
                              </label>
                              <div className="flex justify-center space-x-4">
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`${type.value}-${param.key}`}
                                    checked={isOk}
                                    onChange={() =>
                                      handleStatusChange(
                                        type.value,
                                        param.key,
                                        "ok"
                                      )
                                    }
                                    disabled={
                                      !isEditing ||
                                      (param.key === "timeCool" &&
                                        !timeCoolEnabled) ||
                                      (param.key === "timeHot" &&
                                        !timeHotEnabled)
                                    }
                                    className="mr-1 text-green-500"
                                  />
                                  <span className="text-sm text-green-600 dark:text-green-400">
                                    OK
                                  </span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`${type.value}-${param.key}`}
                                    checked={isNo}
                                    onChange={() =>
                                      handleStatusChange(
                                        type.value,
                                        param.key,
                                        "no"
                                      )
                                    }
                                    disabled={
                                      !isEditing ||
                                      (param.key === "timeCool" &&
                                        !timeCoolEnabled) ||
                                      (param.key === "timeHot" &&
                                        !timeHotEnabled)
                                    }
                                    className="mr-1 text-red-500"
                                  />
                                  <span className="text-sm text-red-600 dark:text-red-400">
                                    No
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Defect Analysis Section - Keep existing code */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Defect Analysis
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left dark:text-white">
                        Parameter
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">
                        Checked QTY
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">
                        Defect QTY
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">
                        Pass Rate (%)
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">
                        Result
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left dark:text-white">
                        Remark
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item, idx) => {
                      const rowIdx = defectData.findIndex((d) => d === item);
                      const passRate = getPassRate(
                        item.checkedQty,
                        item.failedQty
                      );
                      const result = getResult(passRate);
                      return (
                        <tr key={item.parameter}>
                          <td className="border border-gray-300 px-4 py-2 font-medium dark:bg-gray-700 dark:text-white dark:border-gray-600 flex items-center">
                            {item.parameter}
                            {item.parameter.startsWith(PARAM_COLOR_SHADE) && (
                              <>
                                {idx === 0 && (
                                  <button
                                    type="button"
                                    disabled={!isEditing}
                                    className="ml-2 px-2 py-1 bg-green-500 text-white rounded disabled:bg-gray-400"
                                    onClick={handleAddColorShade}
                                    title="Add Color Shade"
                                  >
                                    <FaPlus />
                                  </button>
                                )}
                                {colorShadeRows.length > 1 && (
                                  <button
                                    type="button"
                                    disabled={!isEditing}
                                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded disabled:bg-gray-400"
                                    onClick={() => handleRemoveColorShade(idx)}
                                    title="Remove"
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                              </>
                            )}
                          </td>

                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                disabled={!isEditing}
                                className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded disabled:bg-gray-400"
                                onClick={() =>
                                  handleParamInputChange(
                                    rowIdx,
                                    "checkedQty",
                                    Math.max(
                                      (Number(item.checkedQty) || 0) - 1,
                                      0
                                    )
                                  )
                                }
                              >
                                <FaMinus />
                              </button>
                              <input
                                type="number"
                                min={0}
                                value={item.checkedQty}
                                placeholder="0"
                                onChange={(e) =>
                                  handleParamInputChange(
                                    rowIdx,
                                    "checkedQty",
                                    e.target.value === "" ? 0 : e.target.value
                                  )
                                }
                                className="w-16 px-2 py-1 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 text-center disabled:bg-gray-400"
                                disabled={!isEditing}
                              />
                              <button
                                type="button"
                                disabled={!isEditing}
                                className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded disabled:bg-gray-400"
                                onClick={() =>
                                  handleParamInputChange(
                                    rowIdx,
                                    "checkedQty",
                                    (Number(item.checkedQty) || 0) + 1
                                  )
                                }
                              >
                                <FaPlus />
                              </button>
                            </div>
                          </td>

                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                disabled={!isEditing}
                                className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded disabled:bg-gray-400"
                                onClick={() =>
                                  handleParamInputChange(
                                    rowIdx,
                                    "failedQty",
                                    Math.max(
                                      (Number(item.failedQty) || 0) - 1,
                                      0
                                    )
                                  )
                                }
                              >
                                <FaMinus />
                              </button>
                              <input
                                type="number"
                                min={0}
                                value={item.failedQty}
                                placeholder="0"
                                onChange={(e) =>
                                  handleParamInputChange(
                                    rowIdx,
                                    "failedQty",
                                    e.target.value === "" ? 0 : e.target.value
                                  )
                                }
                                className="w-16 px-2 py-1 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 text-center disabled:bg-gray-400"
                                disabled={!isEditing}
                              />
                              <button
                                type="button"
                                disabled={!isEditing}
                                className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded disabled:bg-gray-400"
                                onClick={() =>
                                  handleParamInputChange(
                                    rowIdx,
                                    "failedQty",
                                    (Number(item.failedQty) || 0) + 1
                                  )
                                }
                              >
                                <FaPlus />
                              </button>
                            </div>
                          </td>

                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">
                            {isNaN(passRate) ? "0.00" : passRate.toFixed(2)}
                          </td>

                          <td
                            className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-bold ${
                              result.color === "green"
                                ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
                                : result.color === "yellow"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200"
                                : "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200"
                            }`}
                          >
                            {result.text}
                          </td>

                          <td className="border border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 px-4 py-2">
                            <input
                              type="text"
                              value={item.remark}
                              onChange={(e) =>
                                handleParamInputChange(
                                  rowIdx,
                                  "remark",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 disabled:bg-gray-400"
                              disabled={!isEditing}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reference Sample Approve Date Section - NEW SECTION */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Reference Sample
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Approve Date:
                  </label>
                  <input
                    type="date"
                    value={referenceSampleApproveDate}
                    onChange={(e) =>
                      setReferenceSampleApproveDate(e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-700"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* Save/Edit Buttons */}
            <div className="flex justify-end mt-6">
              <button
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                onClick={
                  isSaved ? handleUpdateInspection : handleSaveInspection
                }
                disabled={isSaved && !isEditing}
                style={{
                  display: isSaved && !isEditing ? "none" : "inline-block"
                }}
              >
                Save
              </button>
              {isSaved && !isEditing && (
                <button
                  className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

InspectionDataSection.propTypes = {
  inspectionData: PropTypes.array.isRequired,
  setInspectionData: PropTypes.func.isRequired,
  processData: PropTypes.object.isRequired,
  setProcessData: PropTypes.func.isRequired,
  defectData: PropTypes.array.isRequired,
  isVisible: PropTypes.bool.isRequired,
  onToggle: PropTypes.func,
  machineType: PropTypes.string,
  setMachineType: PropTypes.func,
  washQty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setDefectData: PropTypes.func.isRequired,
  recordId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  activateNextSection: PropTypes.func,
  onLoadSavedDataById: PropTypes.func,
  washType: PropTypes.string,
  standardValues: PropTypes.object.isRequired,
  setStandardValues: PropTypes.func.isRequired,
  actualValues: PropTypes.object.isRequired,
  setActualValues: PropTypes.func.isRequired,
  machineStatus: PropTypes.object.isRequired,
  setMachineStatus: PropTypes.func.isRequired,
  checkpointInspectionData: PropTypes.array.isRequired,
  setCheckpointInspectionData: PropTypes.func.isRequired,
  timeCoolEnabled: PropTypes.bool.isRequired,
  setTimeCoolEnabled: PropTypes.func.isRequired,
  timeHotEnabled: PropTypes.bool.isRequired,
  setTimeHotEnabled: PropTypes.func.isRequired,
  checkpointDefinitions: PropTypes.array.isRequired
};

export default InspectionDataSection;
