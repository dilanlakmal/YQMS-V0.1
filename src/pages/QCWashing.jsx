import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import { API_BASE_URL } from "../../config";
import OrderDetailsSection from "../components/inspection/qc2_washing/Home/OrderDetailsSection";
import InspectionDataSection from "../components/inspection/qc2_washing/Home/InspectionDataSection";
import DefectDetailsSection from "../components/inspection/qc2_washing/Home/DefectDetailsSection";
import MeasurementDetailsSection from "../components/inspection/qc2_washing/Home/MeasurementDetailsSection";
import OverAllSummaryCard from "../components/inspection/qc2_washing/Home/OverAllSummaryCard";
import Swal from "sweetalert2";
import imageCompression from "browser-image-compression";
import SubmittedWashingDataPage from "../components/inspection/qc2_washing/Home/SubmittedWashingData";
import { useTranslation } from "react-i18next";
import SubConEdit from "../components/inspection/qc2_washing/Home/SubConEdit";
import WashingDashboard from "../components/inspection/qc2_washing/Dashboard/QCWashingDashboard";
import { encodeColorForUrl } from "../utils/colorUtils";
import { Shield, Sparkles, User, ClipboardList, Edit, BarChart3, Monitor } from 'lucide-react';

const normalizeImageSrc = (src) => {    
  if (!src) return "";

  // If it's already a data URL, return as is
  if (typeof src === "string" && src.startsWith("data:")) return src;

  // If it's a blob URL, return as is
  if (typeof src === "string" && src.startsWith("blob:")) return src;

  // Handle paths starting with ./public (backend format) - convert to /public
  if (typeof src === "string" && src.startsWith("./public/")) {
    return `${API_BASE_URL}${src.replace("./public", "")}`;
  }

  // Handle paths starting with /public - this is what we have in the database
  if (typeof src === "string" && src.startsWith("/public/")) {
    return `${API_BASE_URL}${src}`;
  }

  // Handle paths starting with /storage, add /public prefix
  if (typeof src === "string" && src.startsWith("/storage/")) {
    return `${API_BASE_URL}/public${src}`;
  }

  // If it's already a full URL, return as is
  if (
    typeof src === "string" &&
    (src.startsWith("http://") || src.startsWith("https://"))
  ) {
    return src;
  }

  // If it's a base64 string without data: prefix
  if (
    typeof src === "string" &&
    /^[A-Za-z0-9+/=]+$/.test(src) &&
    src.length > 100
  ) {
    return `data:image/jpeg;base64,${src}`;
  }

  return src;
};

function transformDefectsByPc(savedDefectsByPc) {
  if (Array.isArray(savedDefectsByPc)) {
    return savedDefectsByPc.reduce((acc, pcData) => {
      const pcNumber = pcData.pcNumber;
      if (pcNumber) {
        acc[pcNumber] = (pcData.pcDefects || []).map((defect, index) => ({
          id: index + 1,
          selectedDefect: defect.defectId || defect.selectedDefect || "",
          defectName: defect.defectName || "", // Add this line
          defectQty: defect.defectQty || "",
          isBodyVisible: true,
          defectImages: (defect.defectImages || []).map((imgStr) => ({
            file: null,
            preview: normalizeImageSrc(imgStr),
            name: "image.jpg"
          }))
        }));
      }
      return acc;
    }, {});
  }

  if (typeof savedDefectsByPc === "object" && savedDefectsByPc !== null) {
    const result = {};
    Object.keys(savedDefectsByPc).forEach((pc) => {
      result[pc] = (savedDefectsByPc[pc] || []).map((defect, index) => ({
        id: defect.id || index + 1,
        selectedDefect: defect.defectId || defect.selectedDefect || "",
        defectName: defect.defectName || "", // Add this line
        defectQty: defect.defectQty || "",
        isBodyVisible:
          defect.isBodyVisible !== undefined ? defect.isBodyVisible : true,
        defectImages: (defect.defectImages || []).map((imgStr) => ({
          file: null,
          preview: normalizeImageSrc(imgStr),
          name: "image.jpg"
        }))
      }));
    });
    return result;
  }
  return {};
}

// Helper function to initialize default checkpoint data
const initializeDefaultCheckpointData = async () => {
  try {
    const checkpointResponse = await fetch(`${API_BASE_URL}/api/qc-washing-checklist`);
    const checkpointResult = await checkpointResponse.json();
    
    if (Array.isArray(checkpointResult)) {
      const initialCheckpointData = [];
      
      checkpointResult.forEach(checkpoint => {
        // Add main checkpoint
        const defaultOption = checkpoint.options.find(opt => opt.isDefault);
        let defaultRemark = '';
        
        if (defaultOption?.hasRemark && defaultOption?.remark) {
          defaultRemark = typeof defaultOption.remark === 'object'
            ? defaultOption.remark.english || ''
            : defaultOption.remark || '';
        }
        
        initialCheckpointData.push({
          id: `main_${checkpoint._id}`,
          checkpointId: checkpoint._id,
          type: 'main',
          name: checkpoint.name,
          optionType: checkpoint.optionType,
          options: checkpoint.options,
          decision: defaultOption?.name || '',
          remark: defaultRemark,
          comparisonImages: []
        });
        
        // Add subpoints
        checkpoint.subPoints?.forEach(subPoint => {
          const defaultSubOption = subPoint.options.find(opt => opt.isDefault);
          let defaultSubRemark = '';
          
          if (defaultSubOption?.hasRemark && defaultSubOption?.remark) {
            defaultSubRemark = typeof defaultSubOption.remark === 'object'
              ? defaultSubOption.remark.english || ''
              : defaultSubOption.remark || '';
          }
          
          initialCheckpointData.push({
            id: `sub_${checkpoint._id}_${subPoint.id}`,
            checkpointId: checkpoint._id,
            subPointId: subPoint.id,
            type: 'sub',
            name: subPoint.name,
            parentName: checkpoint.name,
            optionType: subPoint.optionType,
            options: subPoint.options,
            decision: defaultSubOption?.name || '',
            remark: defaultSubRemark,
            comparisonImages: []
          });
        });
      });
      
      setCheckpointInspectionData(initialCheckpointData);
    }
  } catch (error) {
    console.error("Error initializing checkpoint data:", error);
  }
};

// function normalizeImagePreview(img) {
//   if (!img) return "";
//   if (typeof img === "string") return img;
//   if (typeof img === "object" && img.preview) {
//     return typeof img.preview === "string"
//       ? img.preview
//       : img.preview.preview || "";
//   }
//   return "";
// }


function calculateSummaryData(currentFormData) {
  const currentDefectDetails = currentFormData.defectDetails;
  const currentMeasurementDetails = currentFormData.measurementDetails;

  let measurementArray = [];
  if (
    currentMeasurementDetails &&
    typeof currentMeasurementDetails === "object"
  ) {
    measurementArray = currentMeasurementDetails.measurement || [];
  } else if (Array.isArray(currentMeasurementDetails)) {
    measurementArray = currentMeasurementDetails;
  }

  // 1. Calculate totalCheckedPcs from measurement data qty (FIXED)
  let totalCheckedPcs = 0;
  measurementArray.forEach((data) => {
    // Use qty field which represents the number of pieces checked for each size
    if (typeof data.qty === "number" && data.qty > 0) {
      totalCheckedPcs += data.qty;
    }
  });

  // If no measurement data, fallback to checkedQty from form
  const checkedQty = parseInt(currentFormData.checkedQty, 10) || 0;
  if (totalCheckedPcs === 0) {
    totalCheckedPcs = parseInt(currentFormData.checkedQty, 10) || 0;
  }

  // 2. Calculate measurement points and passes using measurementSizeSummary if available
  let measurementPoints = 0;
  let measurementPass = 0;

  // Check if measurementSizeSummary exists (same as backend logic)
  if (currentMeasurementDetails?.measurementSizeSummary?.length > 0) {
    currentMeasurementDetails.measurementSizeSummary.forEach(sizeData => {
      measurementPoints += (sizeData.checkedPoints || 0);
      measurementPass += (sizeData.totalPass || 0);
    });
  } else {
    // Fallback: Calculate from measurement array
    measurementArray.forEach((data) => {
      if (Array.isArray(data.pcs)) {
        data.pcs.forEach((pc) => {
          if (Array.isArray(pc.measurementPoints)) {
            pc.measurementPoints.forEach((point) => {
              if (point.result === "pass" || point.result === "fail") {
                measurementPoints++;
                if (point.result === "pass") measurementPass++;
              }
            });
          }
        });
      }
    });
  }

  // 3. Defect calculations
  const rejectedDefectPcs = Array.isArray(currentDefectDetails?.defectsByPc)
    ? currentDefectDetails.defectsByPc.length
    : 0;

  const defectCount = currentDefectDetails?.defectsByPc
    ? currentDefectDetails.defectsByPc.reduce((sum, pc) => {
        return (
          sum +
          (Array.isArray(pc.pcDefects)
            ? pc.pcDefects.reduce(
                (defSum, defect) =>
                  defSum + (parseInt(defect.defectQty, 10) || 0),
                0
              )
            : 0)
        );
      }, 0)
    : 0;

  // 4. Defect rate and ratio (use totalCheckedPcs, not measurementPoints)
  const defectRate =
    totalCheckedPcs > 0
      ? Number(((defectCount / totalCheckedPcs) * 100).toFixed(1))
      : 0;

  const defectRatio =
    totalCheckedPcs > 0
      ? Number(((rejectedDefectPcs / totalCheckedPcs) * 100).toFixed(1))
      : 0;

  // 5. SIMPLIFIED LOGIC - only consider defectDetails.result and pass rate >= 95%
  let overallResult = "Pending";
  const savedDefectResult = currentDefectDetails?.result || "Pending";

  // Calculate measurement pass rate - default to 100% when no measurement points
  const measurementPassRate =
    measurementPoints > 0 ? (measurementPass / measurementPoints) * 100 : 100;

  // Overall result: Pass only if defect result is Pass AND pass rate >= 95%
  if (savedDefectResult === "Pass" && measurementPassRate >= 95.0) {
    overallResult = "Pass";
  } else if (savedDefectResult === "Fail" || (measurementPoints > 0 && measurementPassRate < 95.0)) {
    overallResult = "Fail";
  } else {
    overallResult = "Pending";
  }

  return {
    checkedQty: checkedQty, // Ensure checkedQty is a number
    totalCheckedPcs: totalCheckedPcs || 0, // This should be the sum of qty from each size
    rejectedDefectPcs: rejectedDefectPcs || 0,
    totalDefectCount: defectCount || 0,
    defectRate,
    defectRatio,
    overallFinalResult: overallResult || "Pending",
    overallResult,
    // Additional fields for measurement statistics
    measurementPoints: measurementPoints || 0,
    measurementPass: measurementPass || 0
  };
}

function machineProcessesToObject(machineProcesses) {
  const obj = {};
  (machineProcesses || []).forEach((proc) => {
    if (proc.machineType === "Washing Machine") {
      obj[proc.machineType] = {
        temperature: proc.temperature || "",
        time: proc.time || "",
        silicon: proc.silicon || "",
        softener: proc.softener || ""
      };
    } else if (proc.machineType === "Tumble Dry") {
      obj[proc.machineType] = {
        temperature: proc.temperature || "",
        timeCool: proc.timeCool || "",
        timeHot: proc.timeHot || ""
      };
    }
  });
  return obj;
}

const QCWashingPage = () => {
  // Hooks
  const { user } = useAuth();
  const { t } = useTranslation();
  const dateValue = new Date().toISOString().split("T")[0];

  // State: Form Data
  const [formData, setFormData] = useState({
    date: dateValue,
    orderNo: "",
    style: "",
    orderQty: "",
    checkedQty: "",
    color: "",
    washQty: "",
    washType: "Normal Wash",
    firstOutput: "",
    inline: "",
    reportType: "",
    buyer: "",
    factoryName: "YM",
    before_after_wash: "After Wash",
    result: "",
    aql: [
      {
        sampleSize: "",
        acceptedDefect: "",
        rejectedDefect: "",
        levelUsed: ""
      }
    ],

    inspectionDetails: {},
    defectDetails: {
      checkedQty: "",
      washQty: "",
      result: "",
      defectsByPc: [],
      additionalImages: [],
      comment: ""
    },
    measurementDetails: [],

    totalCheckedPcs: 0,
    rejectedDefectPcs: 0,
    totalDefectCount: 0,
    defectRate: 0,
    defectRatio: 0,
    overallFinalResult: "Pending"
  });

  // State: Data Lists
  const [subFactories, setSubFactories] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [orderNoSuggestions, setOrderNoSuggestions] = useState([]);
  const [showOrderNoSuggestions, setShowOrderNoSuggestions] = useState(false);
  const [orderNumbers, setOrderNumbers] = useState([]);
  const [styleSuggestions, setStyleSuggestions] = useState([]);
  const [filteredOrderNumbers, setFilteredOrderNumbers] = useState([]);
  const [masterChecklist, setMasterChecklist] = useState([]);
  const [defectOptions, setDefectOptions] = useState([]);
  const [activeTab, setActiveTab] = useState("newInspection");
  const [overallSummary, setOverallSummary] = useState(null);
  const [colorOrderQty, setColorOrderQty] = useState(null);
  //   const [sectionVisibility, setSectionVisibility] = useState({
  const [orderSectionSaved, setOrderSectionSaved] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const aql = formData.aql && formData.aql[0];

  const fetchOverallSummary = async (recordId) => {
    if (!recordId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/overall-summary-by-id/${recordId}`
      );
      const data = await response.json();
      if (data.success) {
        setOverallSummary(data.summary);
      } else {
        setOverallSummary(null);
      }
    } catch (error) {
      setOverallSummary(null);
      console.error("Error fetching overall summary:", error);
    }
  };

  // State: Inspection, Defect, Measurement
  const [inspectionData, setInspectionData] = useState([]);
  const [processData, setProcessData] = useState({
    "Washing Machine": { temperature: "", time: "", silicon: "", softener: "" },
    "Tumble Dry": { temperature: "", timeCool: "", timeHot: "" }
  });
  const defaultDefectData = [
    {
      parameter: "Color Shade 01",
      ok: true,
      no: false,
      checkedQty: 0,
      failedQty: 0,
      result: "Pass",
      remark: ""
    },
    {
      parameter: "Appearance",
      ok: true,
      no: false,
      checkedQty: 0,
      failedQty: 0,
      result: "Pass",
      remark: ""
    }
  ];
  const [defectData, setDefectData] = useState(
    normalizeDefectData(defaultDefectData)
  );
  function normalizeDefectData(data) {
    return (data || []).map((param) => ({
      ...param,
      parameter: param.parameter || param.parameterName || "",
      ok: param.ok !== undefined ? param.ok : true,
      no: param.no !== undefined ? param.no : false,
      checkedQty: param.checkedQty || 0,
      failedQty: param.failedQty || 0,
      remark: param.remark || "",
      acceptedDefect: param.aqlAcceptedDefect || "",
      checkboxes: param.checkboxes || {}
    }));
  }
  const [addedDefects, setAddedDefects] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [comment, setComment] = useState("");
  const [savedSizes, setSavedSizes] = useState([]);
  const [measurementData, setMeasurementData] = useState({
    beforeWash: [],
    afterWash: []
  });
  const [showMeasurementTable, setShowMeasurementTable] = useState(true);
  const [machineType, setMachineType] = useState("Washing Machine");
  const [isDataLoading, setIsDataLoading] = useState(false);

  // State: Auto-save
  const [autoSaveId, setAutoSaveId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimeoutRef = useRef(null);
  const [defectsByPc, setDefectsByPc] = useState({});

  // State: Cache for color-specific data to prevent data loss on switching
  const [colorDataCache, setColorDataCache] = useState({});
  const [orderSectionVisible, setOrderSectionVisible] = useState(true);
  const [defectSectionVisible, setDefectSectionVisible] = useState(false);
  const [inspectionSectionVisible, setInspectionSectionVisible] =
    useState(false);
  const [measurementSectionVisible, setMeasurementSectionVisible] =
    useState(false);
  const activateAllSections = () => {
    setDefectSectionVisible(true);
    setInspectionSectionVisible(true);
    setMeasurementSectionVisible(true);
    setInspectionContentVisible(false);
    setDefectContentVisible(false);
    setMeasurementContentVisible(false);
  };
  const [inspectionContentVisible, setInspectionContentVisible] =
    useState(false);
  const [defectContentVisible, setDefectContentVisible] = useState(false);
  const [measurementContentVisible, setMeasurementContentVisible] =
    useState(false);

  const toggleOrderSection = () => setOrderSectionVisible(!orderSectionVisible);
  const toggleInspectionSection = () =>
    setInspectionContentVisible(!inspectionContentVisible);
  const toggleDefectSection = () =>
    setDefectContentVisible(!defectContentVisible);
  const toggleMeasurementSection = () =>
    setMeasurementContentVisible(!measurementContentVisible);

  const [checkpointInspectionData, setCheckpointInspectionData] = useState([]);
  const [timeCoolEnabled, setTimeCoolEnabled] = useState(false);
  const [timeHotEnabled, setTimeHotEnabled] = useState(false);
  const [checkpointDefinitions, setCheckpointDefinitions] = useState([]);

  const [standardValues, setStandardValues] = useState({
    "Washing Machine": { temperature: "", time: "", silicon: "", softener: "" },
    "Tumble Dry": { temperature: "", timeCool: "", timeHot: "" }
  });

  const [actualValues, setActualValues] = useState({
    "Washing Machine": { temperature: "", time: "", silicon: "", softener: "" },
    "Tumble Dry": { temperature: "", timeCool: "", timeHot: "" }
  });

  const [machineStatus, setMachineStatus] = useState({
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
  const [referenceSampleApproveDate, setReferenceSampleApproveDate] = useState(() => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); 
  return now.toISOString().split('T')[0];
});

  // Helper function to convert English fiber remarks to current language
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

  const imageToBase64 = (imageObject) => {
    if (!imageObject) {
      return Promise.resolve(null);
    }

    if (imageObject.file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        if (!(imageObject.file instanceof Blob)) {
          reject(new Error("Invalid file object provided."));
          return;
        }
        reader.readAsDataURL(imageObject.file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    } else if (imageObject.preview) {
      return Promise.resolve(imageObject.preview);
    }
    return Promise.resolve(null);
  };

  // --- useEffect: Initial Data Fetch ---
  useEffect(() => {
    fetchSubFactories();
    fetchWashingDefects();
    fetchOrderNumbers();
    fetchChecklist();
  }, []);

  // --- useEffect: Calculate Checked Qty ---
  useEffect(() => {
    const aql = formData.aql && formData.aql[0];
    if (
      (formData.inline === "Inline" || formData.reportType === "Inline") &&
      aql?.sampleSize &&
      formData.washQty
    ) {
      const newCheckedQty = Math.min(
        parseInt(formData.washQty, 10),
        parseInt(aql.sampleSize, 10)
      ).toString();
      if (formData.checkedQty !== newCheckedQty) {
        setFormData((prev) => ({
          ...prev,
          checkedQty: newCheckedQty
        }));
      }
    }
  }, [formData.aql, formData.washQty, formData.inline, formData.reportType]);

  useEffect(() => {
    if (recordId) {
      fetchOverallSummary(recordId);
    }
  }, [recordId, lastSaved]);

  // --- useEffect: Calculate AQL Status ---
  useEffect(() => {
    const aql = formData.aql && formData.aql[0];
    if (
      (formData.inline === "Inline" ||
        formData.reportType === "Inline" ||
        formData.firstOutput === "First Output" ||
        formData.reportType === "First Output" || formData.reportType === "SOP") &&
      aql?.acceptedDefect !== undefined
    ) {
      const defectCheckedQty = parseInt(formData.checkedQty, 10) || 0;
      if (defectCheckedQty === 0) {
        if (formData.result !== "") {
          setFormData((prev) => ({ ...prev, result: "" }));
        }
        return;
      }

      const totalDefects = Object.values(defectsByPc)
        .flat()
        .reduce(
          (sum, defect) => sum + (parseInt(defect.defectQty, 10) || 0),
          0
        );

      const acceptedDefectCount = parseInt(aql.acceptedDefect, 10);
      if (!isNaN(acceptedDefectCount)) {
        const newStatus = totalDefects <= acceptedDefectCount ? "Pass" : "Fail";
        if (newStatus !== formData.result) {
          setFormData((prev) => ({ ...prev, result: newStatus }));
        }
      }
    } else {
      if (formData.result) {
        setFormData((prev) => ({ ...prev, result: "" }));
      }
    }
  }, [
    defectsByPc,
    formData.aql,
    formData.inline,
    formData.reportType,
    formData.firstOutput,
    formData.result,
    formData.checkedQty
  ]);

  useEffect(() => {
    const fetchColorOrderQty = async () => {
      if (!formData.orderNo || !formData.color) {
        setColorOrderQty(null);
        return;
      }
      try {
        // Clean and encode the color parameter properly
        const encodedColor = encodeColorForUrl(formData.color);
        
        const response = await fetch(
          `${API_BASE_URL}/api/qc-washing/order-color-qty/${formData.orderNo}/${encodedColor}`
        );
        
        if (!response.ok) {
          setColorOrderQty(null);
          return;
        }
        
        const data = await response.json();
        if (data.success) {
          setColorOrderQty(data.colorOrderQty);
        } else {
          console.warn('Color order qty fetch unsuccessful:', data.message);
          setColorOrderQty(null);
        }
      } catch (error) {
        console.error('Error fetching color order qty:', error);
        setColorOrderQty(null);
      }
    };
    fetchColorOrderQty();
  }, [formData.orderNo, formData.color]);

  // Add useEffect to handle language changes for fiber remarks
  useEffect(() => {
    // Update existing fiber remarks when language changes OR when inspection data is loaded
    setInspectionData((prev) =>
      prev.map((item) => {
        if (item.checkedList === "Fiber" && item.remark) {
          // First, try to convert English remarks to current language
          const translatedRemark = convertEnglishToCurrentLanguage(
            item.remark,
            t
          );

          // If it was translated (different from original), use the translation
          if (translatedRemark !== item.remark) {
            return { ...item, remark: translatedRemark };
          }

          // If it's a decision-based remark, update based on decision
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
                newRemark = item.remark; // Keep existing remark for other cases
            }
            return { ...item, remark: newRemark };
          }
        }
        return item;
      })
    );
  }, [t, inspectionData.length]); // Add inspectionData.length as dependency

  useEffect(() => {
  const fetchCheckpointDefinitions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing-checklist`);
      const result = await response.json();
      if (Array.isArray(result)) {
        setCheckpointDefinitions(result);
      }
    } catch (error) {
      console.error('Error fetching checkpoint definitions:', error);
    }
  };

  fetchCheckpointDefinitions();
}, []);

  // --- Helper Functions ---
  const processMeasurementData = (loadedMeasurements) => {
    if (Array.isArray(loadedMeasurements)) {
      const measurements = loadedMeasurements
        .map((m) => m.measurement)
        .filter(Boolean);

      const beforeWash = measurements.filter(
        (m) => m.before_after_wash === "beforeWash"
      );
      const afterWash = measurements.filter(
        (m) => m.before_after_wash === "afterWash"
      );
      return { beforeWash, afterWash };
    }
    return { beforeWash: [], afterWash: [] };
  };

  const initializeInspectionData = (checklist = []) => {
    if (!Array.isArray(checklist)) return [];
    return checklist.map((item) => ({
      checkedList: item.name,
      approvedDate: "",
      na: false,
      remark: ""
    }));
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // --- Data Fetch Functions ---
  const fetchChecklist = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing-checklist`);
      const data = await response.json();
      setMasterChecklist(data);
      setInspectionData(initializeInspectionData(data));
    } catch (error) {
      console.error("Error fetching washing checklist:", error);
    }
  };

  const fetchSubFactories = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supplier-issues/defects/Washing`
      );
      const data = await response.json();
      if (data && Array.isArray(data.factoryList)) {
        setSubFactories(data.factoryList);
        setFormData((prev) => ({
          ...prev,
          factoryName: data.factoryList.includes("YM")
            ? "YM"
            : data.factoryList[0] || ""
        }));
      } else {
        setSubFactories([]);
        setFormData((prev) => ({ ...prev, factoryName: "" }));
      }
    } catch (error) {
      setSubFactories([]);
      setFormData((prev) => ({ ...prev, factoryName: "" }));
    }
  };

  const fetchWashingDefects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing-defects`);
      const data = await response.json();
      setDefectOptions(data);
    } catch (error) {
      console.error("Error fetching washing defects:", error);
    }
  };

  // Renamed and updated to use /api/search-mono for order number suggestions
  const fetchOrderNoSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOrderNoSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/search-mono?term=${searchTerm}`
      );
      if (response.ok) {
        const data = await response.json();
        setOrderNoSuggestions(data || []);
      } else {
        setOrderNoSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching order number suggestions:", error);
      setOrderNoSuggestions([]);
    }
  };

  const fetchOrderNumbers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/order-numbers`
      );
      const data = await response.json();
      if (data.success) {
        setOrderNumbers(data.orderNumbers || []);
        setFilteredOrderNumbers(data.orderNumbers || []);
      }
    } catch (error) {
      console.error("Error fetching order numbers:", error);
    }
  };

  const filterOrderNumbers = (searchTerm) => {
    if (!searchTerm) {
      setFilteredOrderNumbers(orderNumbers);
      return;
    }
    const filtered = orderNumbers.filter((orderNo) =>
      orderNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOrderNumbers(filtered);
  };

  const fetchMatchingStyles = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setStyleSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/styles/search/${searchTerm}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStyleSuggestions(data.styles || []);
        } else {
          setStyleSuggestions([]);
        }
      }
    } catch (error) {
      console.error("Error fetching matching styles:", error);
      setStyleSuggestions([]);
    }
  };

  const fetchOrderDetailsByStyle = async (orderNo) => {
    if (!orderNo) {
      setColorOptions([]);
      setFormData((prev) => ({
        ...prev,
        color: "",
        orderQty: "",
        buyer: ""
      }));
      setStyleSuggestions([]);
      return;
    }

    try {
      setIsDataLoading(true);

      // 1. Check if the record has already been submitted
      // const submittedResponse = await fetch(
      //   `${API_BASE_URL}/api/qc-washing/load-submitted/${orderNo}`
      // );

      // if (submittedResponse.ok) {
      //   const submittedData = await submittedResponse.json();
      //   if (submittedData.success && submittedData.data) {
      //     Swal.fire(
      //       "Record Submitted",
      //       `The record for Order No '${orderNo}' has already been submitted and cannot be edited.`,
      //       "info"
      //     );
      //     setFormData((prev) => ({ ...prev, orderNo: "", style: "" }));
      //     return;
      //   }
      // }

      // 3. If not submitted, fetch order details from dt_orders
      let response = await fetch(
        `${API_BASE_URL}/api/qc-washing/order-details-by-style/${orderNo}`
      );
      let orderData = await response.json();

      if (!orderData.success) {
        response = await fetch(
          `${API_BASE_URL}/api/qc-washing/order-details-by-order/${orderNo}`
        );
        orderData = await response.json();
      }

      if (orderData.success) {
        setColorOptions(orderData.colors || []);
        setFormData((prev) => ({
          ...prev,
          orderQty: orderData.orderQty || "",
          buyer: orderData.buyer || "",
          color:""
      }));
      } else {
        throw new Error(
          orderData.message || "Style/Order not found in master records."
        );
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      Swal.fire(
        "Error",
        `Could not fetch details for: ${orderNo}. Please check the Style No or Order No.`,
        "error"
      );
      setColorOptions([]);
      setFormData((prev) => ({ ...prev, color: "", orderQty: "", buyer: "" }));
    } finally {
      setIsDataLoading(false);
    }
  };
const loadSavedDataById = async (id) => {
  if (!id) return;

  setIsDataLoading(true);
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/qc-washing/load-saved-by-id/${id}`
    );
    const data = await response.json();

    if (!data.success || !data.savedData) {
      Swal.fire("No saved data found", "", "info");
      setIsDataLoading(false);
      return;
    }

    const saved = data.savedData;

    // Set form data
    setFormData((prev) => ({
      ...prev,
      ...saved,
      date: saved.date ? saved.date.split("T")[0] : prev.date,
      before_after_wash: saved.before_after_wash || prev.before_after_wash,
      orderQty: saved.orderQty || prev.orderQty,
      buyer: saved.buyer || prev.buyer,
      aql: saved.aql && saved.aql.length > 0 ? saved.aql : prev.aql
    }));

    // Handle checkpoint inspection data - CORRECTED LOGIC
if (
  saved.inspectionDetails?.checkpointInspectionData &&
  saved.inspectionDetails.checkpointInspectionData.length > 0
) {
  try {
    // First, fetch the checkpoint definitions to get the options
    const checkpointResponse = await fetch(`${API_BASE_URL}/api/qc-washing-checklist`);
    const checkpointDefinitions = await checkpointResponse.json();
    
    if (Array.isArray(checkpointDefinitions)) {
      const flattenedCheckpointData = [];
      
      // Process the saved checkpoint data
      saved.inspectionDetails.checkpointInspectionData.forEach(savedCheckpoint => {
        // Find the checkpoint definition
        const checkpointDef = checkpointDefinitions.find(cp => cp._id === savedCheckpoint.checkpointId);
        
        if (checkpointDef) {
          // Add main checkpoint
          flattenedCheckpointData.push({
            id: savedCheckpoint.id || `main_${savedCheckpoint.checkpointId}`,
            checkpointId: savedCheckpoint.checkpointId,
            type: 'main',
            name: savedCheckpoint.name || checkpointDef.name,
            optionType: checkpointDef.optionType,
            options: checkpointDef.options || [],
            decision: savedCheckpoint.decision || '',
            remark: savedCheckpoint.remark || '',
            comparisonImages: (savedCheckpoint.comparisonImages || []).map(img => ({
              file: null,
              preview: normalizeImageSrc(img),
              name: typeof img === 'string' ? img.split('/').pop() : 'image.jpg',
              source: 'upload'
            }))
          });
          
          // Add sub-points if they exist in the saved data
          if (savedCheckpoint.subPoints && savedCheckpoint.subPoints.length > 0) {
            savedCheckpoint.subPoints.forEach(savedSubPoint => {
              const subPointDef = checkpointDef.subPoints?.find(sp => sp.id === savedSubPoint.subPointId);
              
              if (subPointDef) {
                flattenedCheckpointData.push({
                  id: savedSubPoint.id || `sub_${savedCheckpoint.checkpointId}_${savedSubPoint.subPointId}`,
                  checkpointId: savedCheckpoint.checkpointId,
                  subPointId: savedSubPoint.subPointId,
                  type: 'sub',
                  name: savedSubPoint.name || subPointDef.name,
                  parentName: savedCheckpoint.name || checkpointDef.name,
                  optionType: subPointDef.optionType,
                  options: subPointDef.options || [],
                  decision: savedSubPoint.decision || '',
                  remark: savedSubPoint.remark || '',
                  comparisonImages: (savedSubPoint.comparisonImages || []).map(img => ({
                    file: null,
                    preview: normalizeImageSrc(img),
                    name: typeof img === 'string' ? img.split('/').pop() : 'image.jpg',
                    source: 'upload'
                  }))
                });
              }
            });
          } else {
            // If no saved sub-points but definition has sub-points, add them with defaults
            checkpointDef.subPoints?.forEach(subPointDef => {
              const defaultSubOption = subPointDef.options.find(opt => opt.isDefault);
              let defaultSubRemark = '';
              
              if (defaultSubOption?.hasRemark && defaultSubOption?.remark) {
                defaultSubRemark = typeof defaultSubOption.remark === 'object'
                  ? defaultSubOption.remark.english || ''
                  : defaultSubOption.remark || '';
              }
              
              flattenedCheckpointData.push({
                id: `sub_${savedCheckpoint.checkpointId}_${subPointDef.id}`,
                checkpointId: savedCheckpoint.checkpointId,
                subPointId: subPointDef.id,
                type: 'sub',
                name: subPointDef.name,
                parentName: savedCheckpoint.name || checkpointDef.name,
                optionType: subPointDef.optionType,
                options: subPointDef.options || [],
                decision: defaultSubOption?.name || '',
                remark: defaultSubRemark,
                comparisonImages: []
              });
            });
          }
        }
      });
      
      // Also add any checkpoints that exist in definitions but not in saved data
      checkpointDefinitions.forEach(checkpointDef => {
        const existsInSaved = saved.inspectionDetails.checkpointInspectionData.find(
          saved => saved.checkpointId === checkpointDef._id
        );
        
        if (!existsInSaved) {
          // Add main checkpoint with defaults
          const defaultOption = checkpointDef.options.find(opt => opt.isDefault);
          let defaultRemark = '';
          
          if (defaultOption?.hasRemark && defaultOption?.remark) {
            defaultRemark = typeof defaultOption.remark === 'object'
              ? defaultOption.remark.english || ''
              : defaultOption.remark || '';
          }
          
          flattenedCheckpointData.push({
            id: `main_${checkpointDef._id}`,
            checkpointId: checkpointDef._id,
            type: 'main',
            name: checkpointDef.name,
            optionType: checkpointDef.optionType,
            options: checkpointDef.options || [],
            decision: defaultOption?.name || '',
            remark: defaultRemark,
            comparisonImages: []
          });
          
          // Add sub-points with defaults
          checkpointDef.subPoints?.forEach(subPointDef => {
            const defaultSubOption = subPointDef.options.find(opt => opt.isDefault);
            let defaultSubRemark = '';
            
            if (defaultSubOption?.hasRemark && defaultSubOption?.remark) {
              defaultSubRemark = typeof defaultSubOption.remark === 'object'
                ? defaultSubOption.remark.english || ''
                : defaultSubOption.remark || '';
            }
            
            flattenedCheckpointData.push({
              id: `sub_${checkpointDef._id}_${subPointDef.id}`,
              checkpointId: checkpointDef._id,
              subPointId: subPointDef.id,
              type: 'sub',
              name: subPointDef.name,
              parentName: checkpointDef.name,
              optionType: subPointDef.optionType,
              options: subPointDef.options || [],
              decision: defaultSubOption?.name || '',
              remark: defaultSubRemark,
              comparisonImages: []
            });
          });
        }
      });
      
      // Set the flattened checkpoint data
      setCheckpointInspectionData(flattenedCheckpointData);
    }
  } catch (error) {
    console.error("Error loading checkpoint data:", error);
    // Fallback to initialize with defaults
    initializeDefaultCheckpointData();
  }
} else {
  // Initialize with default checkpoint data if no saved checkpoint data
  initializeDefaultCheckpointData();
}


    // Handle machine processes - FIXED LOGIC
if (
  saved.inspectionDetails?.machineProcesses &&
  saved.inspectionDetails.machineProcesses.length > 0
) {
  // Process saved machine data
  saved.inspectionDetails.machineProcesses.forEach((machine) => {
    const machineType = machine.machineType;
    const parameters =
      machineType === "Washing Machine"
        ? ["temperature", "time", "silicon", "softener"]
        : ["temperature", "timeCool", "timeHot"];
    
    parameters.forEach((param) => {
      if (machine[param]) {
        const standardValue = machine[param].standardValue;
        const standardStr =
          standardValue === null || standardValue === undefined
            ? ""
            : String(standardValue);
        const actualValue = machine[param].actualValue;
        const actualStr =
          actualValue === null || actualValue === undefined
            ? ""
            : String(actualValue);
        
        setStandardValues((prev) => ({
          ...prev,
          [machineType]: {
            ...prev[machineType],
            [param]: standardStr
          }
        }));
        
        setActualValues((prev) => ({
          ...prev,
          [machineType]: {
            ...prev[machineType],
            [param]: actualStr
          }
        }));
        
        setMachineStatus((prev) => ({
          ...prev,
          [machineType]: {
            ...prev[machineType],
            [param]: {
              ok: machine[param].status?.ok || false,
              no: machine[param].status?.no || false
            }
          }
        }));
      }
    });
  });

  // Set timeCool and timeHot enabled states based on saved data
  const tumbleDryMachine = saved.inspectionDetails.machineProcesses.find(
    m => m.machineType === "Tumble Dry"
  );
  
  if (tumbleDryMachine) {
    // Check if timeCool has actual values or status
    const timeCoolHasData = tumbleDryMachine.timeCool && 
      (tumbleDryMachine.timeCool.actualValue !== undefined && 
       tumbleDryMachine.timeCool.actualValue !== null && 
       tumbleDryMachine.timeCool.actualValue !== "");
    
    // Check if timeHot has actual values or status  
    const timeHotHasData = tumbleDryMachine.timeHot && 
      (tumbleDryMachine.timeHot.actualValue !== undefined && 
       tumbleDryMachine.timeHot.actualValue !== null && 
       tumbleDryMachine.timeHot.actualValue !== "");
    
    setTimeCoolEnabled(timeCoolHasData || saved.inspectionDetails.timeCoolEnabled || false);
    setTimeHotEnabled(timeHotHasData || saved.inspectionDetails.timeHotEnabled || false);
  } else {
    // Set from saved inspection details if available
    setTimeCoolEnabled(saved.inspectionDetails.timeCoolEnabled || false);
    setTimeHotEnabled(saved.inspectionDetails.timeHotEnabled || false);
  }
} else {
  // Initialize with default machine values if no saved machine data
  setStandardValues({
    "Washing Machine": {
      temperature: "",
      time: "",
      silicon: "",
      softener: ""
    },
    "Tumble Dry": { temperature: "", timeCool: "", timeHot: "" }
  });
  
  setActualValues({
    "Washing Machine": {
      temperature: "",
      time: "",
      silicon: "",
      softener: ""
    },
    "Tumble Dry": { temperature: "", timeCool: "", timeHot: "" }
  });
  
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
  
  // Set default enabled states
  setTimeCoolEnabled(saved.inspectionDetails?.timeCoolEnabled || false);
  setTimeHotEnabled(saved.inspectionDetails?.timeHotEnabled || false);
}

// Handle reference sample approve date
if (saved.inspectionDetails?.referenceSampleApproveDate) {
  const savedDate = new Date(saved.inspectionDetails.referenceSampleApproveDate);
  savedDate.setHours(0, 0, 0, 0); // Normalize to midnight
  setReferenceSampleApproveDate(savedDate.toISOString().split('T')[0]);
} else {
  // Set to current date at midnight
  const dateAtMidnight = new Date();
  dateAtMidnight.setHours(0, 0, 0, 0);
  setReferenceSampleApproveDate(dateAtMidnight.toISOString().split('T')[0]);
}


    // Handle defect data
    if (
      saved.inspectionDetails?.parameters &&
      saved.inspectionDetails.parameters.length > 0
    ) {
      setDefectData(
        saved.inspectionDetails.parameters.map((param) => ({
          parameter: param.parameterName || param.parameter || "",
          checkedQty: param.checkedQty || 0,
          failedQty: param.defectQty || param.failedQty || 0,
          passRate: param.passRate || "",
          result: param.result || "",
          remark: param.remark || "",
          ok: param.ok !== undefined ? param.ok : true,
          no: param.no !== undefined ? param.no : false,
          acceptedDefect: param.aqlAcceptedDefect || "",
          checkboxes: param.checkboxes || {}
        }))
      );
    } else {
      // Initialize with default defect data if no saved defect data
      setDefectData(normalizeDefectData(defaultDefectData));
    }

    // Continue with other data loading...
    setAddedDefects(saved.addedDefects || []);
    setDefectsByPc(
      transformDefectsByPc(saved.defectDetails?.defectsByPc || {})
    );

    setUploadedImages(
      (saved.defectDetails?.additionalImages || [])
        .filter(Boolean)
        .map((img) => {
          if (typeof img === "object" && img !== null) {
            return {
              file: null,
              preview: normalizeImageSrc(img.preview || img),
              name: img.name || "image.jpg"
            };
          }
          if (typeof img === "string") {
            return {
              file: null,
              preview: normalizeImageSrc(img),
              name: img.split("/").pop() || "image.jpg"
            };
          }
          return {
            file: null,
            preview: "",
            name: "image.jpg"
          };
        })
    );

    setComment(saved.defectDetails?.comment || "");

    setMeasurementData({
      beforeWash: (saved.measurementDetails?.measurement || []).filter(
        (m) => m.before_after_wash === "beforeWash"
      ),
      afterWash: (saved.measurementDetails?.measurement || []).filter(
        (m) => m.before_after_wash === "afterWash"
      )
    });

    let sizes = [];
    if (saved.measurementDetails) {
      if (Array.isArray(saved.measurementDetails)) {
        sizes = saved.measurementDetails.map((m) => m.size);
      } else if (
        typeof saved.measurementDetails === "object" &&
        Array.isArray(saved.measurementDetails.measurement)
      ) {
        sizes = saved.measurementDetails.measurement.map((m) => m.size);
      }
    }

    setSavedSizes(sizes);
    setRecordId(saved._id);
    if (saved.savedAt) setLastSaved(new Date(saved.savedAt));

    Swal.fire({
      icon: "success",
      title: "Saved data loaded!",
      timer: 1200,
      toast: true,
      position: "top-end",
      showConfirmButton: false
    });

  } catch (error) {
    Swal.fire("Error loading saved data", error.message, "error");
    console.error("Error loading saved data:", error);
  } finally {
    setIsDataLoading(false);
  }
};

  // --- Form Handlers ---
  const handleInputChange = (field, value) => {
    if (field === "orderNo") {
      fetchOrderNoSuggestions(value);
      setShowOrderNoSuggestions(true);
    }

    // --- Cache state before changing color ---
    if (field === "color" && value !== formData.color && formData.color) {
      const outgoingColor = formData.color;
      const currentStateForColor = {
        inspectionData,
        processData,
        defectData,
        addedDefects,
        comment,
        measurementData,
        uploadedImages,
        savedSizes,
        defectsByPc,
        referenceSampleApproveDate,
        formData: {
          washQty: formData.washQty,
          checkedQty: formData.checkedQty,
          before_after_wash: formData.before_after_wash
        }
      };
      setColorDataCache((prevCache) => ({
        ...prevCache,
        [outgoingColor]: currentStateForColor
      }));
    }

    setFormData((prev) => {
      const newState = { ...prev, [field]: value };
      if (field === "firstOutput") {
        newState.inline = "";
        newState.reportType = value;
        newState.washQty = "";
        newState.checkedQty = "";
        if (value === "First Output") {
          fetchFirstOutputDetails();
        }
      } else if (field === "inline") {
        newState.firstOutput = "";
        newState.reportType = value;
        newState.washQty = "";
        newState.checkedQty = "";
      } else if (field === "reportType") {
        if (value === "First Output") {
          newState.firstOutput = "First Output";
          newState.inline = "";
          newState.washQty = "";
          newState.checkedQty = "";
          fetchFirstOutputDetails();
        } else if (value === "Inline") {
          newState.inline = "Inline";
          newState.firstOutput = "";
          newState.washQty = "";
          newState.checkedQty = "";
        }
      }

      if (field === "reportType" && value === "Inline" && formData.washQty) {
        fetchAQLData(formData.washQty);
        calculateCheckedQty(formData.washQty);
      }

      if (field === "color" && value !== prev.color) {
        if (value && (prev.orderNo || prev.style)) {
          setTimeout(
            () => loadColorSpecificData(prev.orderNo || prev.style, value),
            100
          );
        }
      }

      return newState;
    });

    if (
      field === "inline" &&
      value &&
      (formData.orderNo || formData.style) &&
      formData.washQty
    ) {
      setTimeout(() => fetchAQLData(formData.washQty), 100);
    }
    if (field === "washQty" && value) {
      setTimeout(() => {
        if (formData.inline === "Inline" || formData.reportType === "Inline") {
          fetchAQLData(value);
          calculateCheckedQty(value);
        }
      }, 100);
    }
  };
  // --- AQL & Checked Qty ---
  const fetchFirstOutputDetails = async () => {
    const orderNo = formData.orderNo || formData.style;
    if (!orderNo) {
      Swal.fire(
        "Missing Order No",
        "Please enter an Order No before selecting First Output.",
        "warning"
      );
      setFormData((prev) => ({ ...prev, firstOutput: "", reportType: "" }));
      return;
    }
    try {
      setIsDataLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/first-output-details`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNo: orderNo })
        }
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setFormData((prev) => ({
          ...prev,
          checkedQty: data.checkedQty,
          aql: [
            {
              sampleSize: data.aqlData.sampleSize,
              acceptedDefect: data.aqlData.acceptedDefect,
              rejectedDefect: data.aqlData.rejectedDefect,
              levelUsed: data.aqlData.levelUsed
            }
          ],
          washQty: data.checkedQty
        }));
      } else {
        Swal.fire({
          icon: "error",
          title: "Could not fetch First Output data",
          text: data.message || "An unknown error occurred."
        });
        // Clear relevant fields on failure
        setFormData((prev) => ({
          ...prev,
          checkedQty: "",
          washQty: "",
          aql: [
            {
              sampleSize: "",
              acceptedDefect: "",
              rejectedDefect: "",
              levelUsed: ""
            }
          ]
        }));
      }
    } catch (error) {
      console.error("Error fetching First Output details:", error);
      Swal.fire(
        "Error",
        "A network error occurred while fetching First Output details.",
        "error"
      );
    } finally {
      setIsDataLoading(false);
    }
  };

  // --- AQL & Checked Qty ---
  // Fetch AQL data for inline reportType field
  const fetchAQLData = async (washQty) => {
    if (!washQty) return;
    const orderNo = formData.orderNo || formData.style;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/aql-chart/find`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lotSize: parseInt(washQty) || 0,
            orderNo: orderNo
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Request failed with status ${response.status}`
        }));
        setFormData((prev) => ({
          ...prev,
          aql: [
            {
              sampleSize: "",
              acceptedDefect: "",
              rejectedDefect: "",
              levelUsed: ""
            }
          ]
        }));
        return;
      }

      const data = await response.json();
      if (data.success && data.aqlData) {
        setFormData((prev) => ({
          ...prev,
          aql: [
            {
              sampleSize: data.aqlData.sampleSize,
              acceptedDefect: data.aqlData.acceptedDefect,
              rejectedDefect: data.aqlData.rejectedDefect,
              levelUsed: data.aqlData.levelUsed
            }
          ]
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          aql: [
            {
              sampleSize: "",
              acceptedDefect: "",
              rejectedDefect: "",
              levelUsed: ""
            }
          ]
        }));
      }
    } catch (error) {
      console.error("Error fetching AQL data:", error);
    }
  };

  // Calculate checked qty based on wash qty and AQL data
  const calculateCheckedQty = (washQty) => {
    setTimeout(() => {
      setFormData((prev) => {
        const aql = prev.aql && prev.aql[0];
        if (aql?.sampleSize && washQty) {
          const checkedQty = Math.min(
            parseInt(washQty),
            parseInt(aql.sampleSize)
          );
          return { ...prev, checkedQty: checkedQty };
        }
        return prev;
      });
    }, 100);
  };

  // --- Measurement ---
  // Calculate totals from Measurement Data to match the Summary Card
  const getMeasurementStats = () => {
    let totalCheckedPoints = 0;
    let totalPass = 0;

    if (measurementData && typeof measurementData === "object") {
      const allMeasurements = [
        ...(measurementData.beforeWash || []),
        ...(measurementData.afterWash || [])
      ];

      allMeasurements.forEach((data) => {
        if (data.pcs && Array.isArray(data.pcs)) {
          data.pcs.forEach((pc) => {
            if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
              pc.measurementPoints.forEach((point) => {
                if (point.result === "pass" || point.result === "fail") {
                  totalCheckedPoints++;
                  if (point.result === "pass") {
                    totalPass++;
                  }
                }
              });
            }
          });
        }
      });
    }

    const totalFail = totalCheckedPoints - totalPass;
    const passRate =
      totalCheckedPoints > 0
        ? Math.round((totalPass / totalCheckedPoints) * 100)
        : 0;
    return {
      totalCheckedPoint: totalCheckedPoints,
      totalPass,
      totalFail,
      passRate
    };
  };

  // Handle measurement size save with nested structure
  const handleSizeSubmit = async (transformedSizeData) => {
    try {
      const before_after_wash =
        formData.before_after_wash === "Before Wash"
          ? "beforeWash"
          : "afterWash";

      // Check if this size+kvalue combination already exists
      const currentArray = measurementData[before_after_wash] || [];
      const existingRecord = currentArray.find(
        (item) => item.size === transformedSizeData.size && item.kvalue === transformedSizeData.kvalue
      );

      // 1. Update local measurement data and saved sizes
      setMeasurementData((prev) => {
        const currentArray = prev[before_after_wash];
        const existingIndex = currentArray.findIndex(
          (item) => item.size === transformedSizeData.size && item.kvalue === transformedSizeData.kvalue
        );
        if (existingIndex >= 0) {
          // Update existing record
          const updated = [...currentArray];
          updated[existingIndex] = transformedSizeData;
          return { ...prev, [before_after_wash]: updated };
        } else {
          // Add new record
          return {
            ...prev,
            [before_after_wash]: [...currentArray, transformedSizeData]
          };
        }
      });

      setSavedSizes((prev) => {
        if (!prev.includes(transformedSizeData.size)) {
          return [...prev, transformedSizeData.size];
        }
        return prev;
      });

      // 2. Remove the just-saved size from selectedSizes to hide its input table
      if (typeof setSelectedSizes === "function") {
        setSelectedSizes((prev) =>
          prev.filter((s) => s.size !== transformedSizeData.size)
        );
      }

      setShowMeasurementTable(true);

      // 3. Save to backend
      if (!recordId) {
        Swal.fire("Order details must be saved first!", "", "warning");
        return;
      }

      const measurementDetail = { 
        ...transformedSizeData, 
        before_after_wash,
        isUpdate: !!existingRecord // Flag to indicate if this is an update
      };

      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/measurement-save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordId,
            measurementDetail
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        const action = existingRecord ? "updated" : "saved";
        Swal.fire("Success", `Size data ${action} to database!`, "success");
      } else {
        Swal.fire(
          "Error",
          result.message || "Failed to save measurement data",
          "error"
        );
      }
    } catch (error) {
      console.error("Error saving size:", error);
      Swal.fire("Error", "Failed to save size data", "error");
    }
  };

  // Handle measurement data edit
  const handleMeasurementEdit = (size = null, kvalue = null) => {
    setShowMeasurementTable(true);
    if (size) {
      const before_after_wash =
        formData.before_after_wash === "Before Wash"
          ? "beforeWash"
          : "afterWash";
      
      if (kvalue) {
        // Remove specific size+kvalue combination
        setMeasurementData((prev) => ({
          ...prev,
          [before_after_wash]: prev[before_after_wash].filter(
            (item) => !(item.size === size && item.kvalue === kvalue)
          )
        }));
        
        // Only remove from savedSizes if no other k-values exist for this size
        const remainingRecords = measurementData[before_after_wash].filter(
          (item) => item.size === size && item.kvalue !== kvalue
        );
        if (remainingRecords.length === 0) {
          setSavedSizes((prev) => prev.filter((s) => s !== size));
        }
      } else {
        // Remove all records for this size (legacy behavior)
        setSavedSizes((prev) => prev.filter((s) => s !== size));
        setMeasurementData((prev) => ({
          ...prev,
          [before_after_wash]: prev[before_after_wash].filter(
            (item) => item.size !== size
          )
        }));
      }
    }
  };

  // Handle measurement value changes for auto-save
  const handleMeasurementChange = (newMeasurementValues) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  };

  // --- Image Upload ---
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 5) {
      Swal.fire(
        "Limit Exceeded",
        "You can only upload a maximum of 5 images.",
        "warning"
      );
      return;
    }

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true
    };

    Swal.fire({
      title: "Compressing images...",
      text: "Please wait.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    for (const file of files) {
      try {
        const compressedFile = await imageCompression(file, options);
        const preview = URL.createObjectURL(compressedFile);
        setUploadedImages((prev) => [
          ...prev,
          { file: compressedFile, preview, name: compressedFile.name }
        ]);
      } catch (error) {
        console.error("Image compression failed:", error);
        Swal.fire("Error", "Failed to compress image.", "error");
      }
    }
    Swal.close();
  };

  const autoSaveSummary = async (summary, recordId) => {
    if (!recordId || !summary) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/save-summary/${recordId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary })
      });
      
      if (!response.ok) {
        console.error('Failed to save summary:', response.status, response.statusText);
      }
    } catch (error) {
      console.error("Failed to auto-save summary:", error);
    }
  };

  const autoSaveOverallSummary = async (summary, recordId) => {
    if (!recordId || !summary) return;
    try {
      await fetch(
        `${API_BASE_URL}/api/qc-washing/measurement-summary-autosave/${recordId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary })
        }
      );
    } catch (error) {
      console.error("Failed to auto-save overall summary:", error);
    }
  };

  // Function to calculate and update summary data (NEW/MODIFIED)
  const updateSummaryData = (currentFormData) => {
    const summary = calculateSummaryData(currentFormData);
    setFormData((prevData) => ({
      ...prevData,
      ...summary
    }));
    if (recordId) {
      autoSaveSummary(summary, recordId);
    }
  };


  const clearFormData = () => {
    // Reset form data to initial state
    setFormData({
      date: new Date().toISOString().split("T")[0],
      orderNo: "",
      style: "",
      orderQty: "",
      checkedQty: "",
      color: "",
      washQty: "",
      washType: "Normal Wash",
      firstOutput: "",
      inline: "",
      reportType: "",
      buyer: "",
      factoryName: subFactories.includes("YM") ? "YM" : subFactories[0] || "",
      before_after_wash: "After Wash",
      result: "",
      aql: [
        {
          sampleSize: "",
          acceptedDefect: "",
          rejectedDefect: "",
          levelUsed: ""
        }
      ],

      inspectionDetails: {},
      defectDetails: {
        checkedQty: "",
        washQty: "",
        result: "",
        defectsByPc: [],
        additionalImages: [],
        comment: ""
      },
      measurementDetails: [],

      totalCheckedPcs: 0,
      rejectedDefectPcs: 0,
      totalDefectCount: 0,
      defectRate: 0,
      defectRatio: 0,
      overallFinalResult: "Pending"
    });

    // Reset all other states
    setOrderNoSuggestions([]);
    setShowOrderNoSuggestions(false);
    setStyleSuggestions([]);

    // Re-initialize inspection data with master checklist
    if (masterChecklist && masterChecklist.length > 0) {
      setInspectionData(initializeInspectionData(masterChecklist));
    } else {
      setInspectionData([]);
    }

    setProcessData({
      "Washing Machine": {
        temperature: "",
        time: "",
        silicon: "",
        softener: ""
      },
      "Tumble Dry": { temperature: "", timeCool: "", timeHot: "" }
    });
    setDefectData(normalizeDefectData(defaultDefectData));
    setAddedDefects([]);
    setUploadedImages([]);
    setComment("");
    setSavedSizes([]);
    setMeasurementData({ beforeWash: [], afterWash: [] });
    setDefectsByPc({});
    setColorDataCache({});
    setRecordId(null);
    setAutoSaveId(null);
    setLastSaved(null);
    setOverallSummary(null);
    setColorOrderQty(null);

    // Reset section visibility
    setOrderSectionVisible(true);
    setDefectSectionVisible(false);
    setInspectionSectionVisible(false);
    setMeasurementSectionVisible(false);
    setInspectionContentVisible(false);
    setDefectContentVisible(false);
    setMeasurementContentVisible(false);
    setOrderSectionSaved(false);

    // Reset machine values
    setStandardValues({
      "Washing Machine": {
        temperature: "",
        time: "",
        silicon: "",
        softener: ""
      },
      "Tumble Dry": { temperature: "", timeCool: "", timeHot: "" }
    });
    setActualValues({
      "Washing Machine": {
        temperature: "",
        time: "",
        silicon: "",
        softener: ""
      },
      "Tumble Dry": { temperature: "", timeCool: "", timeHot: "" }
    });
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

    setReferenceSampleApproveDate(new Date().toISOString().split('T')[0]);

    // Reset loading state
    setIsDataLoading(false);

    // Clear colorOptions after a small delay to ensure form is ready
    setTimeout(() => {
      setColorOptions([]);
    }, 100);
  };

  useEffect(() => {
    // Debounce the calculation to prevent multiple rapid calls
    const timeoutId = setTimeout(() => {
      const defectDetails = {
        ...formData.defectDetails,
        checkedQty: formData.checkedQty,
        washQty: formData.washQty,
        result: formData.result,
        defectsByPc: Object.entries(defectsByPc).map(
          ([pcNumber, pcDefects]) => ({
            pcNumber,
            pcDefects
          })
        )
      };

      

      const measurementDetails = {
        measurement: [
          ...measurementData.beforeWash.map((item) => ({
            ...item,
            before_after_wash: "beforeWash"
          })),
          ...measurementData.afterWash.map((item) => ({
            ...item,
            before_after_wash: "afterWash"
          }))
        ]
      };

      // Calculate summary from the latest data
      const summary = calculateSummaryData({
        ...formData,
        defectDetails,
        measurementDetails
      });


      setFormData((prev) => ({
        ...prev,
        defectDetails,
        measurementDetails,
        ...summary
      }));

      if (recordId) {
        autoSaveSummary(summary, recordId);
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    defectsByPc,
    measurementData.beforeWash,
    measurementData.afterWash,
    formData.checkedQty,
    formData.washQty,
    formData.result,
    recordId
  ]);

  // Load color-specific data
  const loadColorSpecificData = async (orderNo, color) => {
    // 1. Check client-side cache first to avoid data loss and unnecessary API calls
    if (colorDataCache[color]) {
      const cachedData = colorDataCache[color];
      setInspectionData(cachedData.inspectionData);
      setProcessData(cachedData.processData);
      setDefectData(cachedData.defectData);
      setAddedDefects(cachedData.addedDefects);
      setComment(cachedData.comment);
      setMeasurementData(cachedData.measurementData);
      setUploadedImages(cachedData.uploadedImages);
      setSavedSizes(cachedData.savedSizes);
      setDefectsByPc(cachedData.defectsByPc || {});
      if (cachedData.referenceSampleApproveDate) {
        setReferenceSampleApproveDate(cachedData.referenceSampleApproveDate);
      }
      setFormData((prev) => ({
        ...prev,
        ...(cachedData.formData || {})
      }));
      return;
    }

    // 2. If not in cache, fetch from the server
    setIsDataLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/load-color-data/${orderNo}/${color}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.colorData) {
          const colorData = data.colorData;

          if (colorData.orderDetails) {
            setFormData((prev) => {
              const newColor = colorData.orderDetails.color || color;
              const updatedColor =
                prev.color === newColor ? prev.color : newColor;

              return {
                ...prev,
                ...colorData.orderDetails,
                color: updatedColor,
                before_after_wash:
                  colorData.orderDetails.before_after_wash ||
                  prev.before_after_wash,
                washQty: colorData.defectDetails?.washQty || prev.washQty,
                checkedQty:
                  colorData.defectDetails?.checkedQty || prev.checkedQty,
                aql: [
                  {
                    sampleSize:
                      colorData.orderDetails.aqlSampleSize ||
                      colorData.inspectionDetails?.aqlSampleSize ||
                      prev.aqlSampleSize,
                    acceptedDefect:
                      colorData.orderDetails.aqlAcceptedDefect ||
                      colorData.inspectionDetails?.aqlAcceptedDefect ||
                      prev.aqlAcceptedDefect,
                    rejectedDefect:
                      colorData.orderDetails.aqlRejectedDefect ||
                      colorData.inspectionDetails?.aqlRejectedDefect ||
                      prev.aqlRejectedDefect,
                    levelUsed:
                      colorData.orderDetails.aqlLevelUsed ||
                      colorData.inspectionDetails?.aqlLevelUsed ||
                      prev.aqlLevelUsed
                  }
                ]
              };
            });
          }
          // In loadColorSpecificData function, replace the setInspectionData call with:
          const loadedInspectionData =
            colorData.inspectionDetails?.checkedPoints?.map((point) => ({
              checkedList: point.pointName,
              decision:
                point.decision === true
                  ? "ok"
                  : point.decision === false
                  ? "no"
                  : point.decision || "",
              comparisonImages: (point.comparison || [])
                .filter(Boolean)
                .map((img) => ({
                  file: null,
                  preview: normalizeImageSrc(img),
                  name:
                    typeof img === "string" ? img.split("/").pop() : "image.jpg"
                })),
              approvedDate: point.approvedDate || "",
              na: point.condition === "N/A",
              remark: point.remark || ""
            })) || initializeInspectionData(masterChecklist);

          // Convert English fiber remarks to current language immediately after loading
          const translatedInspectionData = loadedInspectionData.map((item) => {
            if (item.checkedList === "Fiber" && item.remark) {
              const translatedRemark = convertEnglishToCurrentLanguage(
                item.remark,
                t
              );
              if (translatedRemark !== item.remark) {
                return { ...item, remark: translatedRemark };
              }

              // Handle decision-based remarks
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
          });

          setInspectionData(translatedInspectionData);

          const colorOrderQty = colorData.orderDetails?.colorOrderQty || null;
          setColorOrderQty(colorOrderQty);

          setProcessData(
            machineProcessesToObject(
              colorData.inspectionDetails?.machineProcesses
            )
          );

          if (
            colorData.inspectionDetails?.parameters &&
            colorData.inspectionDetails.parameters.length > 0
          ) {
            setDefectData(
              normalizeDefectData(colorData.inspectionDetails.parameters)
            );
          } else {
            setDefectData(normalizeDefectData(defaultDefectData));
          }

          setAddedDefects(
            colorData.defectDetails?.defects?.map((d) => ({
              defectId: d.defectId,
              defectName: d.defectName,
              qty: d.defectQty
            })) || []
          );

          if (colorData.defectDetails?.defectsByPc) {
            setDefectsByPc(
              transformDefectsByPc(colorData.defectDetails.defectsByPc)
            );
          } else {
            setDefectsByPc({});
          }
          if (colorData.defectDetails?.additionalImages) {
            setUploadedImages(
              (colorData.defectDetails.additionalImages || []).map((img) => {
                if (typeof img === "string") {
                  return {
                    file: null,
                    preview: normalizeImageSrc(img),
                    name: img.split("/").pop() || "image.jpg"
                  };
                } else if (typeof img === "object" && img !== null) {
                  return {
                    file: null,
                    preview: normalizeImageSrc(img.preview || img),
                    name: img.name || "image.jpg"
                  };
                }
                return {
                  file: null,
                  preview: "",
                  name: "image.jpg"
                };
              })
            );
          }

          setComment(colorData.defectDetails?.comment || "");
          setMeasurementData(
            processMeasurementData(colorData.measurementDetails || [])
          );
          setSavedSizes(
            colorData.measurementDetails
              ? [
                  ...new Set([
                    ...(colorData.measurementDetails.beforeWash || []).map(
                      (m) => m.size
                    ),
                    ...(colorData.measurementDetails.afterWash || []).map(
                      (m) => m.size
                    )
                  ])
                ]
              : []
          );
          setShowMeasurementTable(true);

          if (
            !colorData.inspectionDetails ||
            colorData.inspectionDetails.checkedPoints.length === 0
          ) {
            setInspectionData(initializeInspectionData(masterChecklist));
          }
        } else {
          setInspectionData(initializeInspectionData(masterChecklist));
          setProcessData({
            machineType: "",
            temperature: "",
            time: "",
            chemical: ""
          });
          setDefectData(normalizeDefectData(defaultDefectData));

          setAddedDefects([]);
          setDefectsByPc({});
          setUploadedImages([]);
          setComment("");
          setMeasurementData({ beforeWash: [], afterWash: [] });
          setSavedSizes([]);
          setShowMeasurementTable(true);
        }
      }
    } catch (error) {
      console.error("Error loading color-specific data:", error);
      Swal.fire({
        icon: "error",
        title: "Load Failed",
        text: `Could not load data for color "${color}". Please try again.`
      });
    } finally {
      setIsDataLoading(false);
    }
  };

  // Load saved measurement sizes
  const loadSavedSizes = async (orderNo, color) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc-washing/saved-sizes/${orderNo}/${color}`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSavedSizes(data.savedSizes || []);
      }
    } catch (error) {
      console.error("Error loading saved sizes:", error);
      setSavedSizes([]);
    }
  };

  useEffect(() => {
    if (formData.orderNo && formData.color)
      loadSavedSizes(formData.orderNo, formData.color);
  }, [formData.orderNo, formData.color]);

  useEffect(() => {
    if (recordId && masterChecklist.length > 0) {
      // Ensure inspection data is properly initialized if it's empty
      if (!inspectionData || inspectionData.length === 0) {
        setInspectionData(initializeInspectionData(masterChecklist));
      }

      // Ensure defect data is properly initialized if it's empty
      if (!defectData || defectData.length === 0) {
        setDefectData(normalizeDefectData(defaultDefectData));
      }
    }
  }, [recordId, masterChecklist.length]);

  // const PageTitle = () => (
  //   <div className="text-center">
  //     <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
  //       Yorkmars (Cambodia) Garment MFG Co., LTD
  //     </h1>
  //     <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
  //       QC Washing
  //       {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
  //     </p>
  //   </div>
  // );

  const tabs = [
    {
      id: "newInspection",
      label: "New Inspection",
      icon: <ClipboardList size={20} />,
      description: "Create New QC Inspection"
    },
    {
      id: "subConEditQty",
      label: "Sub_Con Edit",
      icon: <Edit size={20} />,
      description: "Edit Sub Contractor Data"
    },
    {
      id: "submittedData",
      label: "Daily View",
      icon: <BarChart3 size={20} />,
      description: "View Daily Reports"
    },
    {
      id: "washingDashboard",
      label: "Dashboard",
      icon: <Monitor size={20} />,
      description: "Overall Summary"
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

     return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          
          {/* MOBILE/TABLET LAYOUT (< lg) */}
          <div className="lg:hidden space-y-3">
            {/* Top Row: Title + User */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <Shield size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                      QC Washing System
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        PRO
                      </span>
                    </div>
                  </div>
                  {/* Active Tab Indicator - Inline with title */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                    </div>
                    <p className="text-[10px] text-indigo-100 font-medium truncate">
                      {activeTabData?.label} • Active
                    </p>
                  </div>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-1.5 shadow-xl flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white font-bold text-xs leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tab Navigation - Mobile */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 min-w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`group relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white shadow-lg scale-105"
                          : "bg-transparent hover:bg-white/20 hover:scale-102"
                      }`}
                    >
                      <div
                        className={`transition-colors duration-300 ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {React.cloneElement(tab.icon, { className: "w-4 h-4" })}
                      </div>
                      <span
                        className={`text-[10px] font-bold transition-colors duration-300 whitespace-nowrap ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DESKTOP LAYOUT (>= lg) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-1">
                {/* Logo Area */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Shield size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        QC Washing System
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={12} className="text-yellow-300" />
                        <span className="text-xs font-bold text-white">
                          PRO
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-100 font-medium">
                      Quality Control & Inspection Management Dashboard
                    </p>
                  </div>
                </div>

                {/* Tab Navigation - Desktop */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`group relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 ${
                            isActive
                              ? "bg-white shadow-lg scale-105"
                              : "bg-transparent hover:bg-white/20 hover:scale-102"
                          }`}
                        >
                          <div
                            className={`transition-colors duration-300 ${
                              isActive ? "text-indigo-600" : "text-white"
                            }`}
                          >
                            {React.cloneElement(tab.icon, {
                              className: "w-5 h-5"
                            })}
                          </div>
                          <span
                            className={`text-xs font-bold transition-colors duration-300 ${
                              isActive ? "text-indigo-600" : "text-white"
                            }`}
                          >
                            {tab.label}
                          </span>
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">
                        {activeTabData?.label}
                      </p>
                      <p className="text-indigo-200 text-xs font-medium leading-tight">
                        {activeTabData?.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 shadow-xl">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 text-xs font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="animate-fadeIn">
          {/* Tab Content */}
            <main
              className={`mx-auto py-6 space-y-6 dark:bg-slate-900 ${
                activeTab === "submittedData" || activeTab === "subConEditQty" || activeTab === "washingDashboard"
                  ? "max-w-none px-2 sm:px-4 lg:px-6"
                  : "max-w-7xl px-4 sm:px-6 lg:px-8"
              }`}
            >
              {activeTab === "newInspection" && (
                <>
                  <OverAllSummaryCard summary={formData} />

                  <OrderDetailsSection
                    onLoadSavedDataById={loadSavedDataById}
                    setSavedSizes={setSavedSizes}
                    formData={formData}
                    setFormData={setFormData}
                    handleInputChange={handleInputChange}
                    fetchOrderDetailsByStyle={fetchOrderDetailsByStyle}
                    colorOptions={colorOptions}
                    subFactories={subFactories}
                    user={user}
                    isVisible={orderSectionVisible}
                    onToggle={toggleOrderSection}
                    activateNextSection={activateAllSections}
                    styleSuggestions={styleSuggestions}
                    fetchMatchingStyles={fetchMatchingStyles}
                    setStyleSuggestions={setStyleSuggestions}
                    orderNumbers={filteredOrderNumbers}
                    filterOrderNumbers={filterOrderNumbers}
                    orderNoSuggestions={orderNoSuggestions}
                    showOrderNoSuggestions={showOrderNoSuggestions}
                    setShowOrderNoSuggestions={setShowOrderNoSuggestions}
                    colorOrderQty={colorOrderQty}
                    inspectionData={inspectionData}
                    processData={processData}
                    defectData={defectData}
                    addedDefects={addedDefects}
                    comment={comment}
                    measurementData={measurementData}
                    uploadedImages={uploadedImages}
                    setRecordId={setRecordId}
                    isSaved={orderSectionSaved}
                    setIsSaved={setOrderSectionSaved}
                  />

                  {inspectionSectionVisible && formData.before_after_wash === "After Wash" && (
                    <InspectionDataSection
                      onLoadSavedDataById={loadSavedDataById}
                      inspectionData={inspectionData}
                      setInspectionData={setInspectionData}
                      processData={processData}
                      setProcessData={setProcessData}
                      defectData={defectData}
                      isVisible={inspectionContentVisible}
                      onToggle={toggleInspectionSection}
                      machineType={machineType}
                      setMachineType={setMachineType}
                      washQty={formData.washQty}
                      setDefectData={setDefectData}
                      recordId={recordId}
                      washType={formData.washType}
                      standardValues={standardValues}
                      setStandardValues={setStandardValues}
                      actualValues={actualValues}
                      setActualValues={setActualValues}
                      machineStatus={machineStatus}
                      setMachineStatus={setMachineStatus}
                      normalizeImageSrc={normalizeImageSrc}
                      checkpointInspectionData={checkpointInspectionData}
                      setCheckpointInspectionData={setCheckpointInspectionData}
                      timeCoolEnabled={timeCoolEnabled}
                      setTimeCoolEnabled={setTimeCoolEnabled}
                      timeHotEnabled={timeHotEnabled}
                      setTimeHotEnabled={setTimeHotEnabled}
                      checkpointDefinitions={checkpointDefinitions}
                      referenceSampleApproveDate={referenceSampleApproveDate}
                      setReferenceSampleApproveDate={setReferenceSampleApproveDate}
                      formData={formData}
                      setFormData={setFormData} 
                    />
                  )}

                  {defectSectionVisible && (
                    <DefectDetailsSection
                      onLoadSavedDataById={loadSavedDataById}
                      formData={formData}
                      handleInputChange={handleInputChange}
                      defectOptions={defectOptions}
                      addedDefects={addedDefects}
                      setAddedDefects={setAddedDefects}
                      uploadedImages={uploadedImages}
                      setUploadedImages={setUploadedImages}
                      isVisible={defectContentVisible}
                      onToggle={toggleDefectSection}
                      defectStatus={formData.result}
                      recordId={recordId}
                      defectsByPc={defectsByPc}
                      setDefectsByPc={setDefectsByPc}
                      comment={comment}
                      setComment={setComment}
                      normalizeImageSrc={normalizeImageSrc}
                    />
                  )}

                  {measurementSectionVisible && (
                    <MeasurementDetailsSection
                      onLoadSavedDataById={loadSavedDataById}
                      orderNo={formData.orderNo || formData.style}
                      color={formData.color}
                      before_after_wash={formData.before_after_wash}
                      isVisible={measurementContentVisible}
                      onToggle={toggleMeasurementSection}
                      savedSizes={savedSizes}
                      setSavedSizes={setSavedSizes}
                      onSizeSubmit={handleSizeSubmit}
                      measurementData={measurementData}
                      showMeasurementTable={showMeasurementTable}
                      onMeasurementEdit={handleMeasurementEdit}
                      onMeasurementChange={handleMeasurementChange}
                      recordId={recordId}
                    />
                  )}

            <div className="flex justify-end space-x-4">
              <button
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                onClick={async () => {
                  // Show confirmation dialog first
                  const result = await Swal.fire({
                    title: "Are you sure?",
                    text: "Do you want to submit this QC Washing data?",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Yes, Submit!",
                    cancelButtonText: "No, Cancel",
                    reverseButtons: true
                  });

                  // If user clicked "No" or closed the dialog, return early
                  if (!result.isConfirmed) {
                    return;
                  }

                  try {
                    // --- 1. Recalculate summary with the latest state ---
                    const defectDetails = {
                      ...formData.defectDetails,
                      checkedQty: formData.checkedQty,
                      washQty: formData.washQty,
                      result: formData.result,
                      defectsByPc: Object.entries(defectsByPc).map(
                        ([pcNumber, pcDefects]) => ({
                          pcNumber,
                          pcDefects
                        })
                      )
                    };

                    const measurementDetails = {
                      measurement: [
                        ...measurementData.beforeWash.map((item) => ({
                          ...item,
                          before_after_wash: "beforeWash"
                        })),
                        ...measurementData.afterWash.map((item) => ({
                          ...item,
                          before_after_wash: "afterWash"
                        }))
                      ]
                    };

                    const summary = calculateSummaryData({
                      ...formData,
                      defectDetails,
                      measurementDetails
                    });

                    // --- 2. Build the submitData payload ---
                    const {
                      totalCheckedPoint,
                      totalPass,
                      totalFail,
                      passRate
                    } = getMeasurementStats();
                    const aql = formData.aql && formData.aql[0];

                    const submitAql = [
                      {
                        sampleSize: Number(aql?.sampleSize) || 0,
                        acceptedDefect: Number(aql?.acceptedDefect) || 0,
                        rejectedDefect: Number(aql?.rejectedDefect) || 0,
                        levelUsed: Number(aql?.levelUsed) || 0
                      }
                    ];

                    const submitData = {
                      orderNo: formData.orderNo || formData.style,
                      date: formData.date,
                      colorName: formData.color,
                      before_after_wash: formData.before_after_wash,
                      washQty: formData.washQty,
                      checkedQty: formData.checkedQty,
                      totalCheckedPoint,
                      totalPass,
                      totalFail,
                      passRate,
                      submitAql,
                      totalCheckedPcs: summary.totalCheckedPcs,
                      rejectedDefectPcs: summary.rejectedDefectPcs,
                      totalDefectCount: summary.totalDefectCount,
                      defectRate: summary.defectRate,
                      defectRatio: summary.defectRatio,
                      overallFinalResult: summary.overallFinalResult,
                      submittedAt: new Date().toISOString(),
                      userId: user?.emp_id,

                      color: {
                        orderDetails: {
                          ...formData,
                          inspector: {
                            empId: user?.emp_id,
                            name: user?.username
                          }
                        },
                        inspectionDetails: {
                          temp: processData.temperature,
                          time: processData.time,
                          chemical: processData.chemical,
                          checkedPoints: inspectionData.map((item) => ({
                            pointName: item.checkedList,
                            approvedDate: item.approvedDate,
                            condition: item.na ? "N/A" : "Active",
                            remark: item.remark
                          })),
                          parameters: defectData.map((item) => {
                            const checkedQty = Number(item.checkedQty) || 0;
                            const failedQty = Number(item.failedQty) || 0;
                            const passRate =
                              checkedQty > 0
                                ? (
                                    ((checkedQty - failedQty) / checkedQty) *
                                    100
                                  ).toFixed(2)
                                : "0.00";
                            const result =
                              item.aqlAcceptedDefect !== undefined &&
                              checkedQty > 0
                                ? failedQty <= item.aqlAcceptedDefect
                                  ? "Pass"
                                  : "Fail"
                                : "";
                            return {
                              parameterName: item.parameter,
                              checkedQty: item.checkedQty || 0,
                              failedQty: item.failedQty || 0,
                              passRate,
                              result,
                              remark: item.remark,
                              ok: item.ok,
                              no: item.no,
                              checkboxes: item.checkboxes || {}
                            };
                          })
                        },
                        defectDetails: {
                          washQty: formData.washQty,
                          checkedQty: formData.checkedQty,
                          result: formData.result,
                          defectsByPc: await Promise.all(
                            Object.entries(defectsByPc).map(
                              async ([pcKey, pcDefects]) => ({
                                pcNumber: pcKey,
                                pcDefects: await Promise.all(
                                  (Array.isArray(pcDefects)
                                    ? pcDefects
                                    : []
                                  ).map(async (defect) => ({
                                    defectName: defect.selectedDefect,
                                    defectQty: defect.defectQty,
                                    defectImages: await Promise.all(
                                      (defect.defectImages || []).map((img) =>
                                        imageToBase64(img)
                                      )
                                    )
                                  }))
                                )
                              })
                            )
                          ),
                          comment: comment,
                          additionalImages: await Promise.all(
                            uploadedImages.map((img) => imageToBase64(img))
                          )
                        },
                        measurementDetails: {
                          measurement: [
                            ...measurementData.beforeWash.map((item) => ({
                              ...item,
                              before_after_wash: "beforeWash"
                            })),
                            ...measurementData.afterWash.map((item) => ({
                              ...item,
                              before_after_wash: "afterWash"
                            }))
                          ]
                        }
                      }
                    };

                    // --- 3. Submit to the server ---
                    const response = await fetch(
                      `${API_BASE_URL}/api/qc-washing/submit`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(submitData)
                      }
                    );

                    const submitResult = await response.json();
                    if (submitResult.success) {
                      // Show success message
                      await Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "QC Washing data submitted successfully!",
                        confirmButtonText: "OK"
                      });

                      // Clear form data and reset states
                      clearFormData();

                      // Optional: Reload the page after a short delay
                      // setTimeout(() => {
                      //   window.location.reload();
                      // }, 500);
                    } else {
                      Swal.fire({
                        icon: "error",
                        title: "Submission Failed",
                        text: submitResult.message || "Failed to submit data"
                      });
                    }
                  } catch (error) {
                    console.error("Submit error:", error);
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: "Failed to submit data. Please try again."
                    });
                  }
                }}
              >
                Submit
              </button>
            </div>
          </>
        )}

        {activeTab === "submittedData" && <SubmittedWashingDataPage />}
        {activeTab === "subConEditQty" && <SubConEdit />}
        {activeTab === "washingDashboard" && <WashingDashboard />}
      
      </main>
     </div>
  </div>
  <style >{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .bg-grid-white {
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            );
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default QCWashingPage;
