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

const InspectionDataSection = ({
  inspectionData,
  setInspectionData,
  defectData,
  isVisible = false,
  onToggle,
  ironingQty,
  setDefectData,
  recordId,
  checkpointInspectionData, // This is the transactional data
  setCheckpointInspectionData,
  checkpointDefinitions // This is the master list of checkpoints
}) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [isEditing, setIsEditing] = useState(true);
  const { t, i18n  } = useTranslation();
  const getCurrentLanguageCode = (i18n) => {
  return i18n?.language || 'en';
};
// Helper function to get remark in current language from database
const getRemarkInCurrentLanguage = (remarkObject, i18n) => {
  if (!remarkObject) return '';
  
  const currentLang = getCurrentLanguageCode(i18n);
  
  switch (currentLang) {
    case 'kh': // Khmer (your code)
      return remarkObject.khmer || remarkObject.english || '';
    case 'ch': // Chinese (your code)
      return remarkObject.chinese || remarkObject.english || '';
    case 'en': // English
    default:
      return remarkObject.english || '';
  }
};

// Helper function to check failure impact and determine main point decision
const evaluateFailureImpact = (checkpoint, subPointDecisions) => {
    if (!checkpoint?.subPoints || checkpoint.subPoints.length === 0) {
      return null; // No sub-points, no auto-change needed
    }
    
    const failureImpact = checkpoint.failureImpact || 'any';
    const failedSubPoints = subPointDecisions.filter(decision => {
      const option = checkpoint.subPoints
        .flatMap(sp => sp.options)
        .find(opt => opt.name === decision);
      return option && option.isFail;
    });
    
    switch (failureImpact) {
      case 'any':
        // If any sub-point fails, main point should fail
        return failedSubPoints.length > 0 ? 'fail' : 'pass';
      case 'all':
        // Only if all sub-points fail, main point should fail
        return failedSubPoints.length === checkpoint.subPoints.length ? 'fail' : 'pass';
      case 'majority':
        // If majority of sub-points fail, main point should fail
        return failedSubPoints.length > checkpoint.subPoints.length / 2 ? 'fail' : 'pass';
      default:
        return null;
    }
  };

  // Update remarks when language changes - only for items with multilingual remarks
  useEffect(() => {
    if (!i18n?.language || checkpointInspectionData.length === 0) return;
    
    setCheckpointInspectionData(prev =>
      prev.map(item => {
        if (item.decision) {
          const selectedOption = item.options.find(opt => opt.name === item.decision);
          // Only update if the option has a multilingual remark object
          if (selectedOption?.hasRemark && selectedOption?.remark && 
              typeof selectedOption.remark === 'object' && 
              (selectedOption.remark.english || selectedOption.remark.khmer || selectedOption.remark.chinese)) {
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
    setInspectionData(prevData =>
      prevData.map(item => {
        if (item.checkedList === CHECKED_LIST_FIBER && item.decision && ["1", "2", "3"].includes(item.decision)) {
          // First, get the canonical English remark based on the decision
          const englishRemark = getFiberRemarkInEnglish(item.decision);
          // Then, translate that English remark to the current language
          return { ...item, remark: convertEnglishToCurrentLanguage(englishRemark, t) };
        }
        return item;
      })
    );
  }, [i18n.language, t]);

  

  // Rest of existing useEffects...
  useEffect(() => {
    const qty = Number(ironingQty);
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
              checkedQty: item.checkedQty && item.checkedQty !== 0 ? item.checkedQty : qty
            }
          : item
      )
    );
  }, [ironingQty, defectData.length]);

  useEffect(() => {
    if (recordId && inspectionData.length > 0) {
      const hasEmptyDecisions = inspectionData.every(item => !item.decision || item.decision === "");
      
      if (hasEmptyDecisions) {
        setInspectionData(prev => 
          prev.map(item => ({
            ...item,
            decision: "ok"
          }))
        );
      }
    }
  }, [recordId, inspectionData.length]);

  // Checkpoint-specific handlers
const handleCheckpointDecisionChange = (index, value) => {
    setCheckpointInspectionData(prev => {
      const newData = [...prev];
      const currentItem = newData[index];

      // If the user tries to change a main point that is auto-calculated, do nothing.
      if (currentItem.type === 'main') {
        const mainCheckpointDef = checkpointDefinitions.find(cp => cp._id === currentItem.checkpointId);
        if (mainCheckpointDef && mainCheckpointDef.failureImpact !== 'customize') {
          return prev; // Abort state update for non-customizable main points
        }
      }
      
      // Find the selected option to get its remark
      const selectedOption = currentItem.options.find(opt => opt.name === value);
      
      // Get remark in current language
      let remarkText = '';
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
      if (currentItem.type === 'sub') {
        const mainPointIndex = newData.findIndex(item => 
          item.type === 'main' && item.checkpointId === currentItem.checkpointId
        );
        
        if (mainPointIndex !== -1) {
          const mainPoint = newData[mainPointIndex];
          const checkpoint = checkpointDefinitions.find(cp => cp._id === currentItem.checkpointId);
          
          if (checkpoint) {
            // Get all sub-point decisions for this checkpoint
            const subPointDecisions = newData
              .filter(item => 
                item.type === 'sub' && 
                item.checkpointId === currentItem.checkpointId
              )
              .map(item => item.decision);
            
            // Evaluate failure impact
            const autoDecision = evaluateFailureImpact(checkpoint, subPointDecisions);
            
            if (autoDecision) {
              // Find the appropriate option for the main point
              const targetOption = mainPoint.options.find(opt => 
                (autoDecision === 'fail' && opt.isFail) || 
                (autoDecision === 'pass' && !opt.isFail)
              );
              
              if (targetOption) {
                // Get main point remark in current language
                let mainRemarkText = '';
                if (targetOption.hasRemark && targetOption.remark) {
                  mainRemarkText = getRemarkInCurrentLanguage(targetOption.remark, i18n);
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
    setCheckpointInspectionData(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, remark: value } : item
      )
    );
  };

  const handleCheckpointImageChange = (index, files) => {
    const fileArr = Array.from(files).slice(0, 2);
    const images = fileArr.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    setCheckpointInspectionData(prev =>
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
    setCheckpointInspectionData(prev =>
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
        const qty = Number(ironingQty) || 0;
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
                      const checkpointDefinition = checkpointDefinitions.find(cp => cp._id === item.checkpointId);
                      const isMainPointAuto = item.type === 'main' && checkpointDefinition && checkpointDefinition.failureImpact !== 'customize';
                      
                      return (
                        <tr key={item.id} className={item.type === 'sub' ? 'bg-gray-50 dark:bg-gray-700' : ''}>
                          <td className="border px-4 py-2 dark:text-white">
                            <div className={`${item.type === 'sub' ? 'ml-6 text-sm text-gray-600 dark:text-gray-300' : 'font-medium'}`}>
                              {item.type === 'sub' && '└─ '}
                              {item.name}
                              {item.type === 'sub' && (
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
                                    const selectedOption = item.options.find(opt => opt.name === item.decision);
                                    const textColorClass = selectedOption?.isFail 
                                      ? 'text-red-600 dark:text-red-400' 
                                      : 'text-green-600 dark:text-green-400';
                                    return (
                                      <span className={`font-bold text-sm ${textColorClass}`}>
                                        {item.decision}
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className="text-sm text-gray-500 italic">Auto</span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-4 justify-left">
                                {item.options.map((option) => (
                                  <label key={option.id} className="flex items-center space-x-1 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      name={`checkpoint-decision-${idx}`} 
                                      checked={item.decision === option.name} 
                                      onChange={() => handleCheckpointDecisionChange(idx, option.name)} 
                                      disabled={!isEditing} 
                                      className={`w-4 h-4 rounded focus:ring-2 ${
                                        option.isFail 
                                          ? 'text-red-600 focus:ring-red-500' 
                                          : 'text-green-600 focus:ring-green-500'
                                      }`} 
                                    />
                                    <span className={`text-sm font-medium ${
                                      option.isFail 
                                        ? 'text-red-600 dark:text-red-400' 
                                        : 'text-green-600 dark:text-green-400'
                                    }`}>
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
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.multiple = true;
                                  input.onchange = (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      handleCheckpointImageChange(idx, e.target.files, 'upload');
                                    }
                                  };
                                  input.click();
                                }}
                                disabled={
                                  !isEditing ||
                                  (item.comparisonImages || []).filter(img => img.source === 'upload').length >= 5
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
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.capture = 'environment';
                                  input.onchange = (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      handleCheckpointImageChange(idx, e.target.files, 'capture');
                                    }
                                  };
                                  input.click();
                                }}
                                disabled={
                                  !isEditing ||
                                  (item.comparisonImages || []).filter(img => img.source === 'capture').length >= 5
                                }
                                title="Capture"
                              >
                                <FaCamera className="mr-1" />
                                <span className="hidden sm:inline">Capture</span>
                              </button>

                              {/* Thumbnails */}
                              <div className="flex mt-1 col-span-2">
                                {(item.comparisonImages || []).map((img, imgIdx) => (
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
                                      onClick={() => handleCheckpointRemoveImage(idx, imgIdx)}
                                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center disabled:bg-gray-400"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>

                          <td className="border px-4 py-2 dark:text-white">
                            <input
                              type="text"
                              value={item.remark}
                              onChange={(e) => handleCheckpointRemarkChange(idx, e.target.value)}
                              className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 disabled:bg-gray-400"
                              disabled={!isEditing}
                              placeholder={
                                item.decision && item.options.find(opt => opt.name === item.decision)?.hasRemark
                                  ? `Auto-filled (${getCurrentLanguageCode(i18n).toUpperCase()})...`
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
                                value={item.checkedQty || (ironingQty || 0)}
                                placeholder={ironingQty || "0"}
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
          </>
        )}
      </div>
    </>
  );
};

InspectionDataSection.propTypes = {
  inspectionData: PropTypes.array.isRequired,
  setInspectionData: PropTypes.func.isRequired,
  defectData: PropTypes.array.isRequired,
  isVisible: PropTypes.bool.isRequired,
  onToggle: PropTypes.func,
  machineType: PropTypes.string,
  setMachineType: PropTypes.func,
  ironingQty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setDefectData: PropTypes.func.isRequired,
  recordId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  activateNextSection: PropTypes.func,
  onLoadSavedDataById: PropTypes.func,
  washType: PropTypes.string,
  checkpointInspectionData: PropTypes.array.isRequired,
  setCheckpointInspectionData: PropTypes.func.isRequired,
  checkpointDefinitions: PropTypes.array.isRequired,
};

export default InspectionDataSection;


 