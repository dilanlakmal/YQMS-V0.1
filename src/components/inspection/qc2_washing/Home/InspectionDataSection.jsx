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
      { key: "time", label: "Time", unit: "min" }
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
  setMachineStatus
}) => {
  const uploadRefs = useRef([]);
  const captureRefs = useRef([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStandardValues = async () => {
      if (!washType) return;

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
            const washingMachineDefaults = {
              temperature: "",
              time: "",
              silicon: "",
              softener: ""
            };
            const tumbleDryDefaults = { temperature: "", time: "" };

            const washingMachineValues = {
              ...washingMachineDefaults,
              ...standardRecord.washingMachine
            };
            const tumbleDryValues = {
              ...tumbleDryDefaults,
              ...standardRecord.tumbleDry
            };

            // Properly handle 0 values - keep them as "0" string, not empty
            Object.keys(washingMachineValues).forEach((key) => {
              if (
                washingMachineValues[key] === null ||
                washingMachineValues[key] === undefined
              ) {
                washingMachineValues[key] = "";
              } else {
                washingMachineValues[key] = String(washingMachineValues[key]);
              }
            });

            Object.keys(tumbleDryValues).forEach((key) => {
              if (
                tumbleDryValues[key] === null ||
                tumbleDryValues[key] === undefined
              ) {
                tumbleDryValues[key] = "";
              } else {
                tumbleDryValues[key] = String(tumbleDryValues[key]);
              }
            });

            setStandardValues({
              "Washing Machine": washingMachineValues,
              "Tumble Dry": tumbleDryValues
            });

            setActualValues({
              "Washing Machine": washingMachineValues,
              "Tumble Dry": tumbleDryValues
            });
          }
        }
      } catch (error) {
        console.error("Error fetching standard values:", error);
      }
    };
    fetchStandardValues();
  }, [washType, setStandardValues, setActualValues]);

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

  const handleParamInputChange = (rowIdx, field, value) => {
    setDefectData((prev) => {
      const isColorShade =
        prev[rowIdx].parameter &&
        prev[rowIdx].parameter.startsWith(PARAM_COLOR_SHADE);
      if (isColorShade && field === "checkedQty") {
        const qty = Number(washQty) || 0;
        let newValue = Math.max(0, Math.min(Number(value), qty));

        // Calculate sum of other color shade checkedQtys
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
                      ? ""
                      : Math.max(0, Number(value))
                    : value
              }
            : item
        );
      }
    });
  };
  const handleAddColorShade = () => {
    const nextIndex = colorShadeRows.length;
    setDefectData((prev) => {
      // Add new row
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

  // Helper function to get English fiber remarks
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

    return englishRemark; // Return original if not a fiber remark
  };

  const handleStatusChange = (machineType, param, status) => {
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
      // Ensure 0 values are preserved as "0" string
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

  const handleActualValueChange = (machineType, param, value) => {
    // Update the actual value - keep 0 as "0" string, not empty
    setActualValues((prev) => ({
      ...prev,
      [machineType]: {
        ...prev[machineType],
        [param]: value
      }
    }));

    const standardValue = standardValues[machineType][param];

    const standardStr =
      standardValue === null || standardValue === undefined
        ? ""
        : String(standardValue).trim();
    const actualStr =
      value === null || value === undefined ? "" : String(value).trim();

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

  const handleSaveInspection = async () => {
    if (!recordId) {
      alert("Order details must be saved first!");
      return;
    }

    try {
      // 1. Calculate passRate/result for each defect
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

      // Process actualValues to ensure 0 values are preserved
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

      // Convert fiber remarks to English before saving
      const inspectionDataForSave = inspectionData.map((item) => {
        if (
          item.checkedList === "Fiber" &&
          item.decision &&
          ["1", "2", "3"].includes(item.decision)
        ) {
          return {
            ...item,
            remark: getFiberRemarkInEnglish(item.decision) // Use English version
          };
        }
        return item;
      });

      // 2. Build FormData
      const formData = new FormData();
      formData.append("recordId", recordId);
      formData.append("inspectionData", JSON.stringify(inspectionDataForSave)); // Use converted data
      formData.append("processData", JSON.stringify(processData));
      formData.append("defectData", JSON.stringify(defectDataWithPassRate));
      formData.append("standardValues", JSON.stringify(standardValues));
      formData.append("actualValues", JSON.stringify(processedActualValues));
      formData.append("machineStatus", JSON.stringify(machineStatus));

      // 3. Append images
      inspectionData.forEach((item, idx) => {
        (item.comparisonImages || []).forEach((img, imgIdx) => {
          if (img.file) {
            formData.append(`comparisonImages_${idx}_${imgIdx}`, img.file);
          }
        });
      });

      // 4. Send to backend
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/inspection-save`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();
      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Inspection data saved!",
          showConfirmButton: false,
          timer: 1000,
          timerProgressBar: true,
          position: "top-end",
          toast: true
        });
        if (onLoadSavedDataById) onLoadSavedDataById(recordId);
        setIsSaved(true);
        setIsEditing(false);
        if (activateNextSection) activateNextSection();
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
      // 1. Calculate passRate/result for each defect
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

      // Process actualValues to ensure 0 values are preserved
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

      // Convert fiber remarks to English before saving
      const inspectionDataForSave = inspectionData.map((item) => {
        if (
          item.checkedList === "Fiber" &&
          item.decision &&
          ["1", "2", "3"].includes(item.decision)
        ) {
          return {
            ...item,
            remark: getFiberRemarkInEnglish(item.decision) // Use English version
          };
        }
        return item;
      });

      // 2. Build FormData
      const formData = new FormData();
      formData.append("recordId", recordId);
      formData.append("inspectionData", JSON.stringify(inspectionDataForSave)); // Use converted data
      formData.append("processData", JSON.stringify(processData));
      formData.append("defectData", JSON.stringify(defectDataWithPassRate));
      formData.append("standardValues", JSON.stringify(standardValues));
      formData.append("actualValues", JSON.stringify(processedActualValues));
      formData.append("machineStatus", JSON.stringify(machineStatus));

      // 3. Append images
      inspectionData.forEach((item, idx) => {
        (item.comparisonImages || []).forEach((img, imgIdx) => {
          if (img.file) {
            formData.append(`comparisonImages_${idx}_${imgIdx}`, img.file);
          }
        });
      });

      // 4. Send to backend
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/inspection-update`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();
      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Inspection data updated!",
          showConfirmButton: false,
          timer: 1000,
          timerProgressBar: true,
          position: "top-end",
          toast: true
        });
        if (onLoadSavedDataById) onLoadSavedDataById(recordId);
        setIsSaved(true);
        setIsEditing(false);
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
              // Convert file to base64
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

  // Handle decision change
  // Handle decision change with auto-fill remark only for Fiber
  const handleDecisionChange = (index, value) => {
    setInspectionData((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          let autoRemark = item.remark; // Keep existing remark by default

          // Auto-fill remark ONLY when checkedList is "Fiber"
          if (item.checkedList === "Fiber") {
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
          // For all other checkedList items, remark remains unchanged

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

  // Handle image upload/capture
  const handleImageChange = (index, files) => {
    const fileArr = Array.from(files).slice(0, 2); // max 2 images
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

  // Add this useEffect after your existing useEffects

  useEffect(() => {
    setInspectionData((prev) =>
      prev.map((item) => {
        if (item.checkedList === "Fiber" && item.remark) {
          const translatedRemark = convertEnglishToCurrentLanguage(
            item.remark,
            t
          );

          if (translatedRemark !== item.remark) {
            return { ...item, remark: translatedRemark };
          }

          if (item.decision && item.decision !== "ok") {
            let newRemark = "";
            switch (item.decision) {
              case "1":
                newRemark = t("qcWashing.fiber 01");
                break;
              case "2":
                newRemark = t("qcWashing.fiber 02");
                break;
              case "3":
                newRemark = t("qcWashing.fiber 03");
                break;
              default:
                newRemark = item.remark;
            }
            return { ...item, remark: newRemark };
          }
        }
        return item;
      })
    );
  }, [t]);

  // Remove image
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

  // Only show Color Shade and Appearance rows
  const colorShadeRows = defectData.filter(
    (d) => d.parameter && d.parameter.startsWith(PARAM_COLOR_SHADE)
  );
  const appearanceRow = defectData.find(
    (d) => d.parameter === PARAM_APPEARANCE
  );

  // Remove a Color Shade row
  const handleRemoveColorShade = (idx) => {
    setDefectData((prev) => {
      // Remove the row at idx among color shade rows
      const newData = prev.filter((d, i) => {
        if (d.parameter && d.parameter.startsWith(PARAM_COLOR_SHADE)) {
          // Find the index among color shade rows
          const shadeIdx = prev
            .filter(
              (x) => x.parameter && x.parameter.startsWith(PARAM_COLOR_SHADE)
            )
            .indexOf(d);
          return shadeIdx !== idx;
        }
        return true;
      });
      // Re-number color shade rows
      let shadeCount = 0;
      return newData.map((d) =>
        d.parameter && d.parameter.startsWith(PARAM_COLOR_SHADE)
          ? { ...d, parameter: getColorShadeName(shadeCount++) }
          : d
      );
    });
  };

  // Calculate pass rate and result
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

  // Only show Color Shade and Appearance rows
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
            <div className="overflow-x-auto dark:overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                <thead className="dark:bg-gray-700">
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="border px-4 py-2 text-left dark:text-white">
                      Checked List
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
                  {(Array.isArray(inspectionData) ? inspectionData : []).map(
                    (item, idx) => (
                      <tr key={idx}>
                        <td className="border px-4 py-2 dark:text-white">
                          {item.checkedList}
                        </td>
                        <td className="px-2 p-1 border border-gray-200">
                          {item.checkedList === "Fiber" ? (
                            <div className="flex flex-wrap gap-3">
                              <label className="flex space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  name={`decision-${idx}`}
                                  checked={item.decision === "ok"}
                                  onChange={() =>
                                    handleDecisionChange(idx, "ok")
                                  }
                                  disabled={!isEditing}
                                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                />
                                <span className="text-sm font-medium text-green-600">
                                  OK
                                </span>
                              </label>
                              {[1, 2, 3].map((num) => (
                                <label
                                  key={num}
                                  className="flex i space-x-2 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    name={`decision-${idx}`}
                                    checked={item.decision === String(num)}
                                    onChange={() =>
                                      handleDecisionChange(idx, String(num))
                                    }
                                    disabled={!isEditing}
                                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                  />
                                  <span className="text-sm font-medium dark:text-white">
                                    {num}
                                  </span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <label className="flex space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  name={`decision-${idx}`}
                                  checked={item.decision === "ok"}
                                  onChange={() =>
                                    handleDecisionChange(idx, "ok")
                                  }
                                  disabled={!isEditing}
                                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                />
                                <span className="text-sm font-medium text-green-600">
                                  OK
                                </span>
                              </label>
                              <label className="flex space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  name={`decision-${idx}`}
                                  checked={item.decision === "no"}
                                  onChange={() =>
                                    handleDecisionChange(idx, "no")
                                  }
                                  disabled={!isEditing}
                                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                />
                                <span className="text-sm font-medium text-red-600">
                                  NO
                                </span>
                              </label>
                            </div>
                          )}
                        </td>

                        <td className="border px-4 py-2 text-center grid grid-cols-1 md:grid-cols-2 gap-2">
                          {/* Upload Button */}
                          <button
                            type="button"
                            className="flex items-center justify-center px-2 py-1 bg-blue-500 text-white rounded mr-2 disabled:bg-gray-400"
                            onClick={() => uploadRefs.current[idx].click()}
                            disabled={
                              !isEditing ||
                              (item.comparisonImages || []).length >= 2
                            }
                            title="Upload"
                          >
                            <FaUpload className="mr-1" />
                            <span className="hidden sm:inline">Upload</span>
                          </button>
                          <input
                            type="file"
                            accept="image/*"
                            className=" disabled:bg-gray-400"
                            style={{ display: "none" }}
                            ref={(el) => (uploadRefs.current[idx] = el)}
                            onChange={(e) => {
                              handleImageChange(idx, e.target.files);
                              e.target.value = null; // allow re-upload of same file
                            }}
                            disabled={!isEditing}
                          />

                          {/* Capture Button */}
                          <button
                            type="button"
                            className="flex items-center justify-center px-2 py-1 bg-green-500 text-white rounded disabled:bg-gray-400"
                            onClick={() => captureRefs.current[idx].click()}
                            disabled={
                              !isEditing ||
                              (item.comparisonImages || []).length >= 2
                            }
                            title="Capture"
                          >
                            <FaCamera className="mr-1" />
                            <span className="hidden sm:inline">Capture</span>
                          </button>
                          <input
                            type="file"
                            accept="image/*"
                            className=" disabled:bg-gray-400"
                            capture="environment"
                            style={{ display: "none" }}
                            ref={(el) => (captureRefs.current[idx] = el)}
                            onChange={(e) => {
                              handleImageChange(idx, e.target.files);
                              e.target.value = null;
                            }}
                            disabled={!isEditing}
                          />
                          {/* Thumbnails */}
                          <div className="flex mt-1">
                            {(item.comparisonImages || []).map(
                              (img, imgIdx) => (
                                <div key={imgIdx} className="relative mr-2">
                                  <img
                                    src={img.preview}
                                    alt="comparison"
                                    width={50}
                                    className="border cursor-pointer"
                                    onClick={() => setPreviewImage(img.preview)}
                                  />
                                  <button
                                    type="button"
                                    disabled={!isEditing}
                                    onClick={() =>
                                      handleRemoveImage(idx, imgIdx)
                                    }
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center disabled:bg-gray-400"
                                  >
                                    ×
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </td>
                        <td className="border px-4 py-2 dark:text-white">
                          <input
                            type="text"
                            value={item.remark}
                            onChange={(e) =>
                              setInspectionData((prev) =>
                                prev.map((it, i) =>
                                  i === idx
                                    ? { ...it, remark: e.target.value }
                                    : it
                                )
                              )
                            }
                            className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 disabled:bg-gray-400"
                            disabled={!isEditing}
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
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
                              <span className="font-medium dark:text-white">
                                {param.label}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-100">
                              {param.unit}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
                            {/* Standard Value */}
                            <div className="text-center">
                              <label className="block text-xs text-gray-600 dark:text-gray-100 mb-1">
                                Standard
                              </label>
                              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm dark:text-white">
                                {standardValue === "" ||
                                standardValue === null ||
                                standardValue === undefined
                                  ? ""
                                  : standardValue}
                              </div>
                            </div>

                            {/* Actual Value */}
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
                                disabled={!isEditing}
                                className="w-full px-3 py-2 text-sm border rounded text-center font-mono dark:bg-gray-600 dark:text-white dark:border-gray-500 disabled:bg-gray-200 dark:disabled:bg-gray-700"
                                placeholder="Enter value"
                              />
                            </div>

                            {/* Status */}
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
                                    disabled={!isEditing}
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
                                    disabled={!isEditing}
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
            <div className="mt-8 pt-6 border-t border-gray-200">
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
                          {/* Parameter Name and Add/Remove */}
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
                          {/* Checked QTY */}
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
                                // type="number"
                                min={0}
                                value={
                                  item.checkedQty === 0 ? "" : item.checkedQty
                                }
                                placeholder="0"
                                onFocus={(e) => {
                                  if (e.target.value === "0")
                                    e.target.value = "";
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === "")
                                    handleParamInputChange(
                                      rowIdx,
                                      "checkedQty",
                                      0
                                    );
                                }}
                                onChange={(e) =>
                                  handleParamInputChange(
                                    rowIdx,
                                    "checkedQty",
                                    e.target.value
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
                          {/* Failed QTY */}
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
                                // type="number"
                                min={0}
                                value={
                                  item.failedQty === 0 ? "" : item.failedQty
                                }
                                placeholder="0"
                                onFocus={(e) => {
                                  if (e.target.value === "0")
                                    e.target.value = "";
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === "")
                                    handleParamInputChange(
                                      rowIdx,
                                      "failedQty",
                                      0
                                    );
                                }}
                                onChange={(e) =>
                                  handleParamInputChange(
                                    rowIdx,
                                    "failedQty",
                                    e.target.value
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
                          {/* Pass Rate */}
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">
                            {isNaN(passRate) ? "0.00" : passRate.toFixed(2)}
                          </td>
                          {/* Result */}
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
                          {/* Remark */}
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
  setMachineStatus: PropTypes.func.isRequired
};

export default InspectionDataSection;
