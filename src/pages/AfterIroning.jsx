import React, { useState, useEffect, useRef, useMemo  } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import { API_BASE_URL } from "../../config";
import OrderDetailsSection from "../components/inspection/After_Ironing/Home/OrderDetailsSection";
import InspectionDataSection from "../components/inspection/After_Ironing/Home/InspectionDataSection";
import DefectDetailsSection from "../components/inspection/After_Ironing/Home/DefectDetailsSection";
import MeasurementDetailsSection from "../components/inspection/After_Ironing/Home/MeasurementDetailsSection";
import OverAllSummaryCard from "../components/inspection/After_Ironing/Home/OverAllSummaryCard";
import Swal from "sweetalert2";
import SubmittedDataPage from "../components/inspection/After_Ironing/Home/SubmittedIroningData";
import { useTranslation } from "react-i18next";
import { calculateOverallSummary } from "../utils/afterIroningHelperFunction.js";
// import SubConEdit from "../components/inspection/After_Ironing/Home/SubConEdit";
import {
  Shield,
  Sparkles,
  User,
  ClipboardCheck, // For New Inspection
  Database, // For Daily View
  FileText, // For After Ironing
  Calendar
} from "lucide-react";

const normalizeImageSrc = (src) => {
  if (!src) return "";
  
  // Handle data URLs and blob URLs
  if (typeof src === "string" && src.startsWith("data:")) return src;
  if (typeof src === "string" && src.startsWith("blob:")) return src;
  
  // Handle full HTTP URLs
  if (typeof src === "string" && (src.startsWith("http://") || src.startsWith("https://"))) {
    return src;
  }
  
  // Handle relative paths starting with ./public/
  if (typeof src === "string" && src.startsWith("./public/")) {
    return `${API_BASE_URL}${src.replace("./public", "")}`;
  }
  
  // Handle paths starting with /public/
  if (typeof src === "string" && src.startsWith("/public/")) {
    return `${API_BASE_URL}${src}`;
  }
  
  // Handle storage paths - FIXED
  if (typeof src === "string" && src.startsWith("/storage/")) {
    return `${API_BASE_URL}${src}`;  // Remove the /public prefix
  }
  
  // Handle storage paths without leading slash
  if (typeof src === "string" && src.startsWith("storage/")) {
    return `${API_BASE_URL}/${src}`;
  }
  
  // Handle base64 encoded images
  if (typeof src === "string" && /^[A-Za-z0-9+/=]+$/.test(src) && src.length > 100) {
    return `data:image/jpeg;base64,${src}`;
  }
  
  // Default case - assume it's a relative path that needs the API base URL
  if (typeof src === "string" && src.trim() !== "") {
    const cleanPath = src.startsWith("/") ? src : `/${src}`;
    return `${API_BASE_URL}${cleanPath}`;
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
          defectName: defect.defectName || "",
          defectQty: defect.defectQty || "",
          isBodyVisible: true,
          defectImages: (defect.defectImages || []).map((imgStr) => ({
            file: null,
            preview: normalizeImageSrc(imgStr),
            name: "image.jpg",
            isExisting: true // Mark as existing to preserve during save
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
        defectName: defect.defectName || "",
        defectQty: defect.defectQty || "",
        isBodyVisible:
          defect.isBodyVisible !== undefined ? defect.isBodyVisible : true,
        defectImages: (defect.defectImages || []).map((imgStr) => ({
          file: null,
          preview: normalizeImageSrc(imgStr),
          name: "image.jpg",
          isExisting: true // Mark as existing to preserve during save
        }))
      }));
    });
    return result;
  }
  return {};
}

const initializeDefaultCheckpointData = async (setCheckpointInspectionData) => {
  try {
    const checkpointResponse = await fetch(`${API_BASE_URL}/api/qc-washing-checklist`);
    const checkpointResult = await checkpointResponse.json();
    
    if (Array.isArray(checkpointResult)) {
      const initialCheckpointData = [];
      
      checkpointResult.forEach(checkpoint => {
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

const AfterIroning = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const dateValue = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    date: dateValue,
    orderNo: "",
    style: "",
    orderQty: "",
    checkedQty: "",
    color: "",
    ironingQty: "30", // Set default value for SOP
    washQty: "30", // Set default wash qty for SOP
    firstOutput: "",
    inline: "",
    reportType: "SOP",
    buyer: "",
    factoryName: "YM",
    before_after_wash: "After Ironing",
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
      ironingQty: "",
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

  const [recordId, setRecordId] = useState(null);
  const aql = formData.aql && formData.aql[0];

  const fetchOverallSummary = async (recordId) => {
    if (!recordId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/after-ironing/overall-summary-by-id/${recordId}`
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

  const [inspectionData, setInspectionData] = useState([]);
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
    beforeIroning: [],
    afterIroning: []
  });
  const [showMeasurementTable, setShowMeasurementTable] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const [lastSaved, setLastSaved] = useState(null);
  const [defectsByPc, setDefectsByPc] = useState({});

  const [colorDataCache, setColorDataCache] = useState({});
  const [orderSectionVisible, setOrderSectionVisible] = useState(true);
  const [defectSectionVisible, setDefectSectionVisible] = useState(false);
  const [inspectionSectionVisible, setInspectionSectionVisible] = useState(
    false
  );
  const [measurementSectionVisible, setMeasurementSectionVisible] = useState(false);
  const activateAllSections = () => {
    setDefectSectionVisible(true);
    setInspectionSectionVisible(true);
    setMeasurementSectionVisible(true);
    setInspectionContentVisible(false);
    setDefectContentVisible(false);
    setMeasurementContentVisible(false);
  };

  const hideAllSections = () => {
    setDefectSectionVisible(false);
    setInspectionSectionVisible(false);
    setMeasurementSectionVisible(false);
  };
  const [inspectionContentVisible, setInspectionContentVisible] =
    useState(true);
  const [defectContentVisible, setDefectContentVisible] = useState(true);
  const [measurementContentVisible, setMeasurementContentVisible] =
    useState(true);
  const [washingValidationPassed, setWashingValidationPassed] = useState(false);
  
  const handleWashingValidationChange = (isValid, isExisting) => {
    // If it's an existing record, we bypass the washing validation check.
    const validationResult = isExisting ? true : isValid;
    setWashingValidationPassed(validationResult);
    if (validationResult) {
      activateAllSections();
    } else {
      hideAllSections();
    }
  };

  const toggleOrderSection = () => setOrderSectionVisible(!orderSectionVisible);
  const toggleInspectionSection = () =>
    setInspectionContentVisible(!inspectionContentVisible);
  const toggleDefectSection = () =>
    setDefectContentVisible(!defectContentVisible);
  const toggleMeasurementSection = () =>
    setMeasurementContentVisible(!measurementContentVisible);

  const [checkpointInspectionData, setCheckpointInspectionData] = useState([]);
  const [checkpointDefinitions, setCheckpointDefinitions] = useState([]);

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

  useEffect(() => {
    fetchSubFactories();
    fetchAfterIroningDefects();
    fetchOrderNumbers();
    fetchChecklist();
    // Initialize checkpoint inspection data on component mount
    initializeDefaultCheckpointData(setCheckpointInspectionData);
  }, []);

  useEffect(() => {
    // Set default ironingQty for SOP on initial load and when switching to SOP
    if (formData.reportType === "SOP" && formData.ironingQty !== "30") {
      setFormData((prev) => ({
        ...prev,
        ironingQty: "30",
      }));
    }
  }, [formData.reportType]);

  useEffect(() => {
    const aql = formData.aql && formData.aql[0];
    if (
      (formData.inline === "Inline" || formData.reportType === "Inline") &&
      aql?.sampleSize &&
      formData.ironingQty
    ) {
      const newCheckedQty = Math.min(
        parseInt(formData.ironingQty, 10),
        parseInt(aql.sampleSize, 10)
      ).toString();
      if (formData.checkedQty !== newCheckedQty) {
        setFormData((prev) => ({
          ...prev,
          checkedQty: newCheckedQty
        }));
      }
    }
  }, [formData.aql, formData.ironingQty, formData.inline, formData.reportType]);

  useEffect(() => {
    if (recordId) {
      fetchOverallSummary(recordId);
    }
  }, [recordId, lastSaved]);

  useEffect(() => {
    const aql = formData.aql && formData.aql[0];
    if (
      (formData.inline === "Inline" ||
        formData.reportType === "Inline" ||
        formData.firstOutput === "First Output" ||
        formData.reportType === "First Output" ||
       formData.reportType === "SOP") &&
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
        const response = await fetch(
          `${API_BASE_URL}/api/after-ironing/order-color-qty/${
            formData.orderNo
          }/${encodeURIComponent(formData.color)}`
        );
        const data = await response.json();
        if (data.success) {
          setColorOrderQty(data.colorOrderQty);
        } else {
          setColorOrderQty(null);
        }
      } catch (error) {
        setColorOrderQty(null);
      }
    };
    fetchColorOrderQty();
  }, [formData.orderNo, formData.color]);

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
  }, [t, inspectionData.length]);

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

  const initializeInspectionData = (checklist = []) => {
    if (!Array.isArray(checklist)) return [];
    return checklist.map((item) => ({
      checkedList: item.name,
      approvedDate: "",
      na: false,
      remark: "",
      decision: "ok" // Set default decision to "ok"
    }));
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  const fetchChecklist = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing-checklist`);
      const data = await response.json();
      setMasterChecklist(data);
      setInspectionData(initializeInspectionData(data));
    } catch (error) {
      console.error("Error fetching after ironing checklist:", error);
    }
  };

  const fetchSubFactories = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supplier-issues/defects/Washing` // Assuming same factories
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

  const fetchAfterIroningDefects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing-defects`);
      const data = await response.json();
      setDefectOptions(data);
    } catch (error) {
      console.error("Error fetching after ironing defects:", error);
    }
  };

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
        `${API_BASE_URL}/api/after-ironing/order-numbers`
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
        `${API_BASE_URL}/api/after-ironing/styles/search/${searchTerm}`
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
    let response = await fetch(
      `${API_BASE_URL}/api/after-ironing/order-details-by-style/${orderNo}`
    );

    let orderData = await response.json();

    if (!orderData.success) {
      response = await fetch(
        `${API_BASE_URL}/api/after-ironing/order-details-by-order/${orderNo}`
      );
      orderData = await response.json();
    }

    if (orderData.success) {
      setColorOptions(orderData.colors || []);
      
      // NEW: Check for QC Washing SOP record to get default color
      let defaultColor = "";
      try {
        const washingResponse = await fetch(`${API_BASE_URL}/api/after-ironing/check-qc-washing-record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNo: orderNo,
            reportType: "SOP"
          })
        });
        
        const washingData = await washingResponse.json();
        if (washingData.success && washingData.exists && washingData.record) {
          defaultColor = washingData.record.color;
        }
      } catch (washingError) {
        console.log('No QC Washing SOP record found, using first available color');
      }

      // Set form data with default color from washing record or first available color
      setFormData((prev) => ({
        ...prev,
        orderQty: orderData.orderQty || "",
        buyer: orderData.buyer || "",
        color: defaultColor || 
               (orderData.colors && orderData.colors.length > 0 ? orderData.colors[0] : "")
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
      `${API_BASE_URL}/api/after-ironing/load-saved-by-id/${id}`
    );
    const data = await response.json();

    if (!data.success || !data.savedData) {
      Swal.fire("No saved data found", "", "info");
      setIsDataLoading(false);
      return;
    }

    const saved = data.savedData;

    // Force washing validation to pass for existing data
    setWashingValidationPassed(true);
    activateAllSections();
    
    // Ensure the validation change is propagated
    setTimeout(() => {
      setWashingValidationPassed(true);
    }, 100); 

    setFormData((prev) => ({
      ...prev,
      ...saved,
      date: saved.date ? saved.date.split("T")[0] : prev.date,
      before_after_wash: saved.before_after_wash || prev.before_after_wash,
      orderQty: saved.orderQty || prev.orderQty,
      buyer: saved.buyer || prev.buyer,
      aql: saved.aql && saved.aql.length > 0 ? saved.aql : prev.aql,
      isExistingData: true
    }));

    if (
      saved.inspectionDetails?.checkpointInspectionData &&
      saved.inspectionDetails.checkpointInspectionData.length > 0
    ) {
      
      const transformedCheckpointData = [];
      
      saved.inspectionDetails.checkpointInspectionData.forEach(checkpoint => {
        // Process main checkpoint comparison images
        const mainComparisonImages = (checkpoint.comparisonImages || []).map(img => {
          
          if (typeof img === 'string') {
            return {
              file: null,
              preview: normalizeImageSrc(img),
              name: img.split("/").pop() || "comparison.jpg"
            };
          } else if (typeof img === 'object' && img !== null) {
            // Handle object format
            const imageUrl = img.preview || img.url || img.src || img;
            return {
              file: null,
              preview: normalizeImageSrc(imageUrl),
              name: img.name || imageUrl.split("/").pop() || "comparison.jpg"
            };
          }
          return null;
        }).filter(Boolean);


        // Add main checkpoint
        transformedCheckpointData.push({
          id: `main_${checkpoint.checkpointId}`,
          checkpointId: checkpoint.checkpointId,
          type: 'main',
          name: checkpoint.name,
          optionType: checkpoint.optionType,
          options: checkpoint.options || [],
          decision: checkpoint.decision || '',
          remark: checkpoint.remark || '',
          comparisonImages: mainComparisonImages
        });

        // Add sub-points if they exist
        if (checkpoint.subPoints && Array.isArray(checkpoint.subPoints)) {
          checkpoint.subPoints.forEach(subPoint => {
            // Process sub-point comparison images
            const subComparisonImages = (subPoint.comparisonImages || []).map(img => {
              
              if (typeof img === 'string') {
                return {
                  file: null,
                  preview: normalizeImageSrc(img),
                  name: img.split("/").pop() || "comparison.jpg"
                };
              } else if (typeof img === 'object' && img !== null) {
                const imageUrl = img.preview || img.url || img.src || img;
                return {
                  file: null,
                  preview: normalizeImageSrc(imageUrl),
                  name: img.name || imageUrl.split("/").pop() || "comparison.jpg"
                };
              }
              return null;
            }).filter(Boolean);


            transformedCheckpointData.push({
              id: `sub_${checkpoint.checkpointId}_${subPoint.subPointId}`,
              checkpointId: checkpoint.checkpointId,
              subPointId: subPoint.subPointId,
              type: 'sub',
              name: subPoint.name,
              parentName: checkpoint.name,
              optionType: subPoint.optionType,
              options: subPoint.options || [],
              decision: subPoint.decision || '',
              remark: subPoint.remark || '',
              comparisonImages: subComparisonImages
            });
          });
        }
      });

      // Merge with checkpoint definitions to get complete options
      const mergedCheckpointData = transformedCheckpointData.map(savedItem => {
        const definition = checkpointDefinitions.find(def => def._id === savedItem.checkpointId);
        
        if (definition) {
          if (savedItem.type === 'main') {
            return {
              ...savedItem,
              options: definition.options || savedItem.options || []
            };
          } else if (savedItem.type === 'sub') {
            const subPointDef = definition.subPoints?.find(sp => sp.id === savedItem.subPointId);
            return {
              ...savedItem,
              options: subPointDef?.options || savedItem.options || []
            };
          }
        }
        
        return savedItem;
      });

      setCheckpointInspectionData(mergedCheckpointData);
    } else {
      initializeDefaultCheckpointData(setCheckpointInspectionData);
    }

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
      // Initialize with default defect data
      setDefectData(normalizeDefectData(defaultDefectData));
    }

    setAddedDefects(saved.addedDefects || []);

    setDefectsByPc(
      transformDefectsByPc(saved.defectDetails?.defectsByPc || {})
    );

    // Preserve existing additional images properly
    const existingAdditionalImages = (saved.defectDetails?.additionalImages || [])
      .filter(Boolean)
      .map((img) => {
        if (typeof img === "object" && img !== null) {
          return {
            file: null,
            preview: normalizeImageSrc(img.preview || img),
            name: img.name || "image.jpg",
            isExisting: true
          };
        }

        if (typeof img === "string") {
          return {
            file: null,
            preview: normalizeImageSrc(img),
            name: img.split("/").pop() || "image.jpg",
            isExisting: true
          };
        }

        return { file: null, preview: "", name: "image.jpg", isExisting: true };
      });

    setUploadedImages(existingAdditionalImages);
    setComment(saved.defectDetails?.comment || "");

    setMeasurementData({
      beforeIroning: (saved.measurementDetails?.measurement || []).filter(
        (m) => m.before_after_wash === "beforeIroning"
      ),
      afterIroning: (saved.measurementDetails?.measurement || []).filter(
        (m) => m.before_after_wash === "afterIroning"
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

const loadColorSpecificData = async (orderNo, color) => {
    if (colorDataCache[color]) {
      const cached = colorDataCache[color];
      setInspectionData(cached.inspectionData);
      setDefectData(cached.defectData);
      setAddedDefects(cached.addedDefects);
      setComment(cached.comment);
      setMeasurementData(cached.measurementData);
      setUploadedImages(cached.uploadedImages);
      setSavedSizes(cached.savedSizes);
      setDefectsByPc(cached.defectsByPc);
      setFormData((prev) => ({
        ...prev,
        ...cached.formData
      }));
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/after-ironing/load-saved-by-color/${orderNo}/${encodeURIComponent(
          color
        )}`
      );
      const data = await response.json();
      if (data.success && data.savedData) {
        loadSavedDataById(data.savedData._id);
      } else {
        // No saved data for this color, reset relevant fields
        setInspectionData(initializeInspectionData(masterChecklist));
        setDefectData(normalizeDefectData(defaultDefectData));
        setAddedDefects([]);
        setComment("");
        setMeasurementData({ beforeIroning: [], afterIroning: [] });
        setUploadedImages([]);
        setSavedSizes([]);
        setDefectsByPc({});
      }
    } catch (error) {
      console.error("Error loading color-specific data:", error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === "orderNo") {
      fetchOrderNoSuggestions(value);
      setShowOrderNoSuggestions(true);
    }

    if (field === "color" && value !== formData.color && formData.color) {
      const outgoingColor = formData.color;
      const currentStateForColor = {
        inspectionData,
        defectData,
        addedDefects,
        comment,
        measurementData,
        uploadedImages,
        savedSizes,
        defectsByPc,
        formData: {
          ironingQty: formData.ironingQty,
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
        newState.ironingQty = "";
        newState.checkedQty = "";
        if (value === "First Output") {
          fetchFirstOutputDetails();
        }
      } else if (field === "inline") {
        newState.firstOutput = "";
        newState.reportType = value;
        newState.ironingQty = "";
        newState.checkedQty = "";
      } else if (field === "reportType") {
        if (value === "First Output") {
          newState.firstOutput = "First Output";
          newState.inline = "";
          newState.ironingQty = "";
          newState.checkedQty = "";
          fetchFirstOutputDetails();
        } else if (value === "Inline") {
          newState.inline = "Inline";
          newState.firstOutput = "";
          newState.ironingQty = "";
          newState.checkedQty = "";
        }
      }

      if (field === "reportType" && value === "Inline" && formData.ironingQty) {
        fetchAQLData(formData.ironingQty);
        calculateCheckedQty(formData.ironingQty);
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
      formData.ironingQty
    ) {
      setTimeout(() => fetchAQLData(formData.ironingQty), 100);
    }
    if (field === "ironingQty" && value) {
      setTimeout(() => {
        if (formData.inline === "Inline" || formData.reportType === "Inline") {
          fetchAQLData(value);
          calculateCheckedQty(value);
        }
      }, 100);
    }
  };

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
        `${API_BASE_URL}/api/after-ironing/first-output-details`,
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
          ironingQty: data.checkedQty
        }));
      } else {
        Swal.fire({
          icon: "error",
          title: "Could not fetch First Output data",
          text: data.message || "An unknown error occurred."
        });
        setFormData((prev) => ({
          ...prev,
          checkedQty: "",
          ironingQty: "",
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

  const fetchAQLData = async (ironingQty) => {
    if (!ironingQty) return;
    const orderNo = formData.orderNo || formData.style;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/after-ironing/aql-chart/find`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lotSize: parseInt(ironingQty) || 0,
            orderNo: orderNo
          })
        }
      );

      if (!response.ok) {
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

  const calculateCheckedQty = (ironingQty) => {
    setTimeout(() => {
      setFormData((prev) => {
        const aql = prev.aql && prev.aql[0];
        if (aql?.sampleSize && ironingQty) {
          const checkedQty = Math.min(
            parseInt(ironingQty),
            parseInt(aql.sampleSize)
          );
          return { ...prev, checkedQty: checkedQty };
        }
        return prev;
      });
    }, 100);
  };

  const getMeasurementStats = () => {
    let totalCheckedPoints = 0;
    let totalPass = 0;

    if (measurementData && typeof measurementData === "object") {
      const allMeasurements = [
        ...(measurementData.beforeIroning || []),
        ...(measurementData.afterIroning || [])
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

  const handleSizeSubmit = async (transformedSizeData,  newRecordId) => {

      if (newRecordId && !recordId) {
        setRecordId(newRecordId);
      }

      // Save complete order data to the newly created record
    try {
      const completeOrderData = {
        ...formData,
        colorOrderQty,
        _id: newRecordId, // Update existing record
        // Ensure all required fields are included
        date: formData.date || new Date().toISOString().split("T")[0],
        reportType: formData.reportType || 'SOP',
        factoryName: formData.factoryName || 'YM',
        buyer: formData.buyer || '',
        orderQty: formData.orderQty || 0,
        checkedQty: formData.checkedQty || 30,
        ironingQty: formData.ironingQty || 30,
        washQty: formData.washQty || 30,
        aql: formData.aql || []
      };


      const response = await fetch(`${API_BASE_URL}/api/after-ironing/orderData-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: completeOrderData,
          userId: user?.emp_id || 'system',
          savedAt: new Date().toISOString()
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to update record with order data:', result.message);
      } else {
        console.log('Successfully updated record with order data');
      }
    } catch (error) {
      console.error('Failed to update record with order data:', error);
    }
      
      // If transformedSizeData is null, it means we're just updating the recordId
      if (!transformedSizeData) {
        return;
      }
    const before_after_wash =
      formData.before_after_wash === "Before Ironing"
        ? "beforeIroning"
        : "afterIroning";

    setMeasurementData((prev) => {
      const currentArray = prev[before_after_wash];
      const existingIndex = currentArray.findIndex(
        (item) => item.size === transformedSizeData.size && item.kvalue === transformedSizeData.kvalue
      );

      let updatedArray;

      if (existingIndex >= 0) {
      updatedArray = [...currentArray];
      updatedArray[existingIndex] = transformedSizeData;
    } else {
      updatedArray = [...currentArray, transformedSizeData];
    }

    const measurementSizeSummary = updatedArray.map(measurement => {
      if (measurement.summaryData) {
        return measurement.summaryData;
      }
      
      // Fallback calculation if summaryData is missing
      let checkedPcs = measurement.pcs?.length || 0;
      let checkedPoints = 0;
      let totalPass = 0;
      let totalFail = 0;
      let plusToleranceFailCount = 0;
      let minusToleranceFailCount = 0;

      measurement.pcs?.forEach((pc) => {
        (pc.measurementPoints || []).forEach((point) => {
          checkedPoints++;
          if (point.result === "pass") totalPass++;
          if (point.result === "fail") {
            totalFail++;
            const value = typeof point.measured_value_decimal === "number"
              ? point.measured_value_decimal
              : parseFloat(point.measured_value_decimal);
            
            if (!isNaN(value)) {
              if (value > point.tolerancePlus) plusToleranceFailCount++;
              if (value < point.toleranceMinus) minusToleranceFailCount++;
            }
          }
        });
   });

      return {
        size: measurement.size,
        kvalue: measurement.kvalue,
        checkedPcs,
        checkedPoints,
        totalPass,
        totalFail,
        plusToleranceFailCount,
        minusToleranceFailCount,
        before_after_wash: measurement.before_after_wash
      };
    });

    // Update formData with complete measurement details including summary
    setFormData(prevFormData => ({
      ...prevFormData,
      measurementDetails: {
        measurement: updatedArray,
        measurementSizeSummary: measurementSizeSummary
      }
    }));

    return { ...prev, [before_after_wash]: updatedArray };
  });

    setSavedSizes((prev) => {
      if (!prev.includes(transformedSizeData.size)) {
        return [...prev, transformedSizeData.size];
      }
      return prev;
    });

    setShowMeasurementTable(true);
  };

  const handleMeasurementEdit = (size = null, kvalue = null) => {
    setShowMeasurementTable(true);
    if (size) {
      const before_after_wash =
        formData.before_after_wash === "Before Ironing"
          ? "beforeIroning"
          : "afterIroning";
      
      if (kvalue) {
        setMeasurementData((prev) => ({
          ...prev,
          [before_after_wash]: prev[before_after_wash].filter(
            (item) => !(item.size === size && item.kvalue === kvalue)
          )
        }));
        
        const remainingRecords = measurementData[before_after_wash].filter(
          (item) => item.size === size && item.kvalue !== kvalue
        );
        if (remainingRecords.length === 0) {
          setSavedSizes((prev) => prev.filter((s) => s !== size));
        }
      } else {
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

  const clearFormData = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      orderNo: "",
      style: "",
      orderQty: "",
      checkedQty: "",
      color: "",
      ironingQty: "30", // Set default value for SOP
      washQty: "30", // Set default wash qty for SOP
      firstOutput: "",
      inline: "",
      reportType: "SOP", // Set default to SOP
      buyer: "",
      factoryName: subFactories.includes("YM") ? "YM" : subFactories[0] || "",
      before_after_wash: "After Ironing",
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
        ironingQty: "",
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

    setOrderNoSuggestions([]);
    setShowOrderNoSuggestions(false);
    setStyleSuggestions([]);

    if (masterChecklist && masterChecklist.length > 0) {
      setInspectionData(initializeInspectionData(masterChecklist));
    } else {
      setInspectionData([]);
    }

    setDefectData(normalizeDefectData(defaultDefectData));
    setAddedDefects([]);
    setUploadedImages([]);
    setComment("");
    setSavedSizes([]);
    setMeasurementData({ beforeIroning: [], afterIroning: [] });
    setDefectsByPc({});
    setColorDataCache({});
    setRecordId(null);
    setLastSaved(null);
    setOverallSummary(null);
    setColorOrderQty(null);

    setOrderSectionVisible(true);
    setDefectSectionVisible(false);
    setInspectionSectionVisible(false);
    setMeasurementSectionVisible(false);
    setWashingValidationPassed(false);
    setInspectionContentVisible(false);
    setDefectContentVisible(false);
    setMeasurementContentVisible(false);

    setIsDataLoading(false);

    setTimeout(() => {
      setColorOptions([]);
    }, 100);
  };

  useEffect(() => {
  const timeoutId = setTimeout(() => {
    const defectDetails = {
      ...formData.defectDetails,
      checkedQty: formData.checkedQty,
      ironingQty: formData.ironingQty,
      result: formData.result,
      defectsByPc: Object.entries(defectsByPc).map(
        ([pcNumber, pcDefects]) => ({
          pcNumber,
          pcDefects
        })
      )
    };

    const measurementDetails = formData.measurementDetails || {
      measurement: [
        ...measurementData.beforeIroning.map((item) => ({
          ...item,
          before_after_wash: "beforeIroning"
        })),
        ...measurementData.afterIroning.map((item) => ({
          ...item,
          before_after_wash: "afterIroning"
        }))
      ],
      measurementSizeSummary: []
    };

    // If measurementSizeSummary is empty, calculate it from measurement data
    if (!measurementDetails.measurementSizeSummary || measurementDetails.measurementSizeSummary.length === 0) {
      const measurementSizeSummary = [];
      // FIX: Ensure measurementDetails.measurement is an array before using forEach
      const measurements = Array.isArray(measurementDetails.measurement) ? measurementDetails.measurement : [];

      measurements.forEach(measurement => {
        if (measurement.pcs && Array.isArray(measurement.pcs)) {
          let checkedPcs = measurement.pcs.length;
          let checkedPoints = 0;
          let totalPass = 0;
          let totalFail = 0;
          let plusToleranceFailCount = 0;
          let minusToleranceFailCount = 0;

          measurement.pcs.forEach((pc) => {
            (pc.measurementPoints || []).forEach((point) => {
              checkedPoints++;
              if (point.result === "pass") totalPass++;
              if (point.result === "fail") {
                totalFail++;
                const value = typeof point.measured_value_decimal === "number"
                  ? point.measured_value_decimal
                  : parseFloat(point.measured_value_decimal);
                
                if (!isNaN(value)) {
                  if (value > point.tolerancePlus) plusToleranceFailCount++;
                  if (value < point.toleranceMinus) minusToleranceFailCount++;
                }
              }
            });
          });

          measurementSizeSummary.push({
            size: measurement.size,
            kvalue: measurement.kvalue,
            checkedPcs,
            checkedPoints,
            totalPass,
            totalFail,
            plusToleranceFailCount,
            minusToleranceFailCount
          });
        }
      });
      measurementDetails.measurementSizeSummary = measurementSizeSummary;
    }

    // USE SINGLE CALCULATION FUNCTION
    const summary = calculateOverallSummary({
      defectDetails,
      measurementDetails,
      checkedQty: formData.checkedQty,
      ironingQty: formData.ironingQty,
      washQty: formData.washQty
    });


    setFormData((prev) => ({
      ...prev,
      defectDetails,
      measurementDetails,
      ...summary
    }));

  }, 100);

  return () => clearTimeout(timeoutId);
}, [
  defectsByPc,
  measurementData.beforeIroning,
  measurementData.afterIroning,
  formData.checkedQty,
  formData.ironingQty,
  formData.result,
  recordId
]);



  const loadSavedSizes = async (orderNo, color) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/after-ironing/saved-sizes/${orderNo}/${color}`
      );

      if (!response.ok) return;

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
      if (!inspectionData || inspectionData.length === 0) {
        setInspectionData(initializeInspectionData(masterChecklist));
      }
      if (!defectData || defectData.length === 0) {
        setDefectData(normalizeDefectData(defaultDefectData));
      }
    }
  }, [recordId, masterChecklist.length]);

useEffect(() => {
  if (recordId && checkpointDefinitions.length > 0) {
    // Only reload if we haven't loaded checkpoint data yet
    if (checkpointInspectionData.length === 0 || 
        !checkpointInspectionData.some(item => item.decision)) {
      loadSavedDataById(recordId);
    }
  }
}, [recordId, checkpointDefinitions.length]);

useEffect(() => {
  if (checkpointInspectionData.length > 0) {
    
    // Log images specifically
    checkpointInspectionData.forEach((item, idx) => {
      if (item.comparisonImages && item.comparisonImages.length > 0) {
        item.comparisonImages.forEach((img, imgIdx) => {
        });
      }
    });
  }
}, [checkpointInspectionData]);

const tabs = useMemo(() => [
    {
      id: "newInspection",
      label: "New Inspection",
      icon: <ClipboardCheck size={20} />,
      description: "Create New After Ironing Inspection"
    },
    {
      id: "submittedData", 
      label: "Daily View",
      icon: <Database size={20} />,
      description: "View Submitted Inspection Data"
    }
  ], []);

  const activeTabData = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [activeTab, tabs]);

  const PageTitle = () => (
    <div className="text-center">
      <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
        Yorkmars (Cambodia) Garment MFG Co., LTD
      </h1>
      <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
        After Ironing Report
        {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
      </p>
    </div>
  );

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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          
          {/* MOBILE/TABLET LAYOUT (< lg) */}
          <div className="lg:hidden space-y-3">
            {/* Top Row: Title + User */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <FileText size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                      After Ironing Report
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        QC
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs text-indigo-100 font-medium truncate">
                    Yorkmars (Cambodia) Garment MFG Co., LTD
                  </p>
                </div>
                
                {/* Active Status Indicator */}
                <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-xs leading-tight">
                      {activeTabData?.label}
                    </p>
                    <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                      Active Module
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

            {/* Main Tabs - Scrollable */}
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
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        After Ironing Report
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={12} className="text-yellow-300" />
                        <span className="text-xs font-bold text-white">
                          QC
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-100 font-medium">
                      Yorkmars (Cambodia) Garment MFG Co., LTD
                    </p>
                  </div>
                </div>

                {/* Navigation Bar */}
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
                        Active Module
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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="animate-fadeIn">
            {activeTab === "newInspection" && (
              <>
            <OverAllSummaryCard
              summary={{
                ...formData,
                checkedQty: Number(formData.checkedQty) || 0,
                washQty: Number(formData.washQty) || 0,
                ironingQty: Number(formData.ironingQty) || 0,
                inspectionDetails: {
                  checkpointInspectionData: checkpointInspectionData
                }
              }}
              defectDetails={formData.defectDetails}
              before_after_wash={formData.before_after_wash}
              showMeasurementTable={showMeasurementTable}
            />
            <OrderDetailsSection
              formData={formData}
              setFormData={setFormData}
              handleInputChange={handleInputChange}
              fetchOrderDetailsByStyle={fetchOrderDetailsByStyle}
              colorOptions={colorOptions}
              user={user}
              isVisible={orderSectionVisible}
              onToggle={toggleOrderSection}
              orderNoSuggestions={orderNoSuggestions}
              showOrderNoSuggestions={showOrderNoSuggestions}
              setShowOrderNoSuggestions={setShowOrderNoSuggestions}
              colorOrderQty={colorOrderQty}
              activateNextSection={activateAllSections}
              setRecordId={setRecordId}
              setSavedSizes={setSavedSizes}
              onLoadSavedDataById={loadSavedDataById}
              onWashingValidationChange={handleWashingValidationChange}
              isExistingData={formData.isExistingData}
            />

            {inspectionSectionVisible && (
              <InspectionDataSection
                onLoadSavedDataById={loadSavedDataById}
                inspectionData={inspectionData}
                setInspectionData={setInspectionData}
                defectData={defectData}
                isVisible={inspectionContentVisible}
                onToggle={toggleInspectionSection}
                ironingQty={formData.ironingQty}
                setDefectData={setDefectData}
                recordId={recordId}
                normalizeImageSrc={normalizeImageSrc}
                checkpointInspectionData={checkpointInspectionData}
                setCheckpointInspectionData={setCheckpointInspectionData}
                checkpointDefinitions={checkpointDefinitions}
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
                recordId={recordId}
                formData={formData}
                user={user}
              />
            )}

            {washingValidationPassed && (
              <div className="flex justify-end space-x-4 mt-6">
              <button
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={() => {
                  Swal.fire({
                    title: "Are you sure?",
                    text: "This will clear all data from the form.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Yes, clear it!",
                  }).then((result) => {
                    if (result.isConfirmed) {
                      clearFormData();
                      Swal.fire("Cleared!", "The form has been cleared.", "success");
                    }
                  });
                }}
              >
                Clear Form
              </button>
              <button
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={async () => {
                  // Validate required fields
                  if (!formData.orderNo || !formData.color || !formData.reportType) {
                    Swal.fire({
                      icon: "warning",
                      title: "Missing Required Fields",
                      text: "Please fill in Order No, Color, and Report Type before submitting."
                    });
                    return;
                  }

                  const result = await Swal.fire({
                    title: "Are you sure?",
                    text: "Do you want to submit this After Ironing data?",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Yes, Submit!",
                    cancelButtonText: "No, Cancel",
                    reverseButtons: true
                  });

                  if (!result.isConfirmed) return;

                  // Re-calculate summary right before submission to ensure it's up-to-date
                  const finalSummary = calculateOverallSummary({
                    defectDetails: {
                      ...formData.defectDetails,
                      result: formData.result,
                      defectsByPc: Object.entries(defectsByPc).map(([pcNumber, pcDefects]) => ({ pcNumber, pcDefects })),
                    },
                    measurementDetails: {
                      measurement: [...measurementData.beforeIroning, ...measurementData.afterIroning],
                    },
                    checkedQty: formData.checkedQty,
                    ironingQty: formData.ironingQty,
                    washQty: formData.washQty,
                  });

                  try {
                    // Ensure we have a record ID by saving order data first
                    let currentRecordId = recordId;
                    
                    if (!currentRecordId) {
                      const orderResponse = await fetch(`${API_BASE_URL}/api/after-ironing/orderData-save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          formData: { ...formData, ...finalSummary, colorOrderQty },
                          userId: user?.emp_id,
                          savedAt: new Date().toISOString()
                        })
                      });
                      const orderResult = await orderResponse.json();
                      if (orderResult.success) {
                        currentRecordId = orderResult.id;
                        setRecordId(currentRecordId);
                      }
                    }

                    if (currentRecordId) {
                      // CRITICAL FIX: Build measurement details from current frontend state
                      const currentMeasurementDetails = {
                        measurement: [
                          ...measurementData.afterIroning.map((item) => ({
                            ...item,
                            before_after_wash: "afterIroning"
                          }))
                        ],
                        measurementSizeSummary: []
                      };

                      // Calculate measurementSizeSummary from current measurement data
                      if (currentMeasurementDetails.measurement.length > 0) {
                        const measurementSizeSummary = [];
                        currentMeasurementDetails.measurement.forEach(measurement => {
                          if (measurement.pcs && Array.isArray(measurement.pcs)) {
                            let checkedPcs = measurement.pcs.length;
                            let checkedPoints = 0;
                            let totalPass = 0;
                            let totalFail = 0;
                            let plusToleranceFailCount = 0;
                            let minusToleranceFailCount = 0;

                            measurement.pcs.forEach((pc) => {
                              (pc.measurementPoints || []).forEach((point) => {
                                checkedPoints++;
                                if (point.result === "pass") totalPass++;
                                if (point.result === "fail") {
                                  totalFail++;
                                  const value = typeof point.measured_value_decimal === "number"
                                    ? point.measured_value_decimal
                                    : parseFloat(point.measured_value_decimal);
                                  
                                  if (!isNaN(value)) {
                                    if (value > point.tolerancePlus) plusToleranceFailCount++;
                                    if (value < point.toleranceMinus) minusToleranceFailCount++;
                                  }
                                }
                              });
                            });

                            measurementSizeSummary.push({
                              size: measurement.size,
                              kvalue: measurement.kvalue,
                              checkedPcs,
                              checkedPoints,
                              totalPass,
                              totalFail,
                              plusToleranceFailCount,
                              minusToleranceFailCount,
                              before_after_wash: measurement.before_after_wash
                            });
                          }
                        });
                        currentMeasurementDetails.measurementSizeSummary = measurementSizeSummary;
                      }

                      // Update the record with complete measurement details INCLUDING summary
                      const updateResponse = await fetch(`${API_BASE_URL}/api/after-ironing/orderData-save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          formData: { 
                            ...formData, 
                            ...finalSummary, // Include the final calculated summary
                            colorOrderQty,
                            measurementDetails: currentMeasurementDetails, // Use current frontend state
                            _id: currentRecordId // Update existing record
                          },
                          userId: user?.emp_id,
                          savedAt: new Date().toISOString()
                        })
                      });

                      const updateResult = await updateResponse.json();
                      if (!updateResult.success) {
                        throw new Error('Failed to update measurement summary');
                      }


                      // Save inspection data if exists
                      if (inspectionData.length > 0 || checkpointInspectionData.length > 0) {
                        const inspectionFormData = new FormData();
                        inspectionFormData.append('recordId', currentRecordId);
                        inspectionFormData.append('inspectionData', JSON.stringify(inspectionData));
                        inspectionFormData.append('defectData', JSON.stringify(defectData));
                        
                        // Process checkpoint images
                        const sanitizedCheckpointData = checkpointInspectionData.map((item, idx) => {
                          const existingImages = [];
                          let imageIndex = 0;
                          
                          // Process main checkpoint images
                          (item.comparisonImages || []).forEach((img) => {
                            if (img.file && !img.isExisting) {
                              const fieldName = `checkpointImages_${idx}_${imageIndex}`;
                              inspectionFormData.append(fieldName, img.file, img.name);
                              imageIndex++;
                            } else if (img.preview && (img.isExisting || typeof img.preview === 'string')) {
                              existingImages.push(img.preview);
                            }
                          });
                          
                          const processedItem = {
                            ...item,
                            comparisonImages: existingImages
                          };
                          
                          // Process sub-point images if they exist
                          if (item.subPoints && Array.isArray(item.subPoints)) {
                            processedItem.subPoints = item.subPoints.map((subPoint, subIdx) => {
                              const existingSubImages = [];
                              let subImageIndex = 0;
                              
                              (subPoint.comparisonImages || []).forEach((img) => {
                                if (img.file && !img.isExisting) {
                                  const fieldName = `checkpointImages_${idx}_sub_${subIdx}_${subImageIndex}`;
                                  inspectionFormData.append(fieldName, img.file, img.name);
                                  subImageIndex++;
                                } else if (img.preview && (img.isExisting || typeof img.preview === 'string')) {
                                  existingSubImages.push(img.preview);
                                }
                              });
                              
                              return {
                                ...subPoint,
                                comparisonImages: existingSubImages
                              };
                            });
                          }
                          
                          return processedItem;
                        });
                        
                        inspectionFormData.append('checkpointInspectionData', JSON.stringify(sanitizedCheckpointData));
                        
                        const inspectionResponse = await fetch(`${API_BASE_URL}/api/after-ironing/inspection-save`, {
                          method: "POST",
                          body: inspectionFormData
                        });
                        
                        const inspectionResult = await inspectionResponse.json();
                        if (!inspectionResult.success) {
                          console.error('Inspection save failed:', inspectionResult.message);
                        }
                      }

                      // Save defect data if exists
                      if (Object.keys(defectsByPc).length > 0 || uploadedImages.length > 0 || comment) {
                        const defectFormData = new FormData();
                        defectFormData.append('recordId', currentRecordId);
                        
                        // Process additional images
                        const existingAdditionalImages = [];
                        let additionalImageIndex = 0;
                        
                        uploadedImages.forEach((img) => {
                          if (img.file && !img.isExisting) {
                            defectFormData.append(`additionalImages_${additionalImageIndex}`, img.file, img.name);
                            additionalImageIndex++;
                          } else if (img.isExisting && img.preview) {
                            existingAdditionalImages.push(img.preview);
                          }
                        });
                        
                        // Process defect images and prepare defect data
                        const sanitizedDefectsByPc = Object.entries(defectsByPc).map(([pcNumber, pcDefects], pcIdx) => ({
                          pcNumber,
                          pcDefects: pcDefects.map((defect, defectIdx) => {
                            const existingDefectImages = [];
                            let defectImageIndex = 0;
                            
                            // Process defect images
                            (defect.defectImages || []).forEach((img) => {
                              if (img.file && !img.isExisting) {
                                const fieldName = `defectImages_${pcIdx}_${defectIdx}_${defectImageIndex}`;
                                defectFormData.append(fieldName, img.file, img.name);
                                defectImageIndex++;
                              } else if (img.isExisting && img.preview) {
                                existingDefectImages.push(img.preview);
                              }
                            });
                            
                            return {
                              selectedDefect: defect.selectedDefect || defect.defectId || '',
                              defectName: defect.defectName || '',
                              defectQty: defect.defectQty || 0,
                              defectImages: existingDefectImages
                            };
                          })
                        }));
                        
                        defectFormData.append('defectDetails', JSON.stringify({
                          defectsByPc: sanitizedDefectsByPc,
                          comment: comment || '',
                          additionalImages: existingAdditionalImages
                        }));
                        
                        const defectResponse = await fetch(`${API_BASE_URL}/api/after-ironing/defect-details-save`, {
                          method: "POST",
                          body: defectFormData
                        });
                        
                        const defectResult = await defectResponse.json();
                        if (!defectResult.success) {
                          console.error('Defect save failed:', defectResult.message);
                        }
                      }
                    }

                    // Submit the record
                    const response = await fetch(`${API_BASE_URL}/api/after-ironing/submit`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                        orderNo: formData.orderNo,
                        recordId: currentRecordId,
                        overallFinalResult: finalSummary.overallFinalResult // Pass the final result
                      }),
                    });
                    
                    const submitResult = await response.json();
                    if (submitResult.success) {
                      Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Your After Ironing report has been submitted successfully!',
                        showConfirmButton: true,
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#3085d6'
                      });
                      clearFormData();
                    } else {
                      throw new Error(submitResult.message || "Submission failed");
                    }

                  } catch (error) {
                    console.error("Submit error:", error);
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: `Failed to submit data: ${error.message}`
                    });
                  }
                }}
                disabled={!formData.orderNo || !formData.color || !formData.reportType}
              >
                Submit All Data
              </button>

              </div>
            )}
          
          </>
        )}

        {activeTab === "submittedData" && <SubmittedDataPage />}
        {/* {activeTab === "subConEditQty" && <SubConEdit />} */}
     
    </div>
    </div>
    <style>{`
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

export default AfterIroning;
