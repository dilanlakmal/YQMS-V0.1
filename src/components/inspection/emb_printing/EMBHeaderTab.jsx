import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Search, Eye, EyeOff, Upload, Camera, X, Trash2, Plus, ChevronDown, AlertTriangle, CheckCircle, FileText, ListChecks, Users, Lock } from "lucide-react";
import Webcam from "react-webcam";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";
import ValidationChecklist from "./ValidationChecklist";
import { getAqlDetails } from "../qc_accuracy/aqlHelper";
import showToast from "../../../utils/toast";

const FACTORY_NAMES = ["Tong Chai", "WEL", "Da Feng", "Sunwahyu"];

const EMB_DEFECTS = [
  "Wrong EMB Position",
  "Wrong Color Thread",
  "Dirty",
  "Oil Stain",
  "Broken Stitch",
  "Skip Stitch",
  "Untrimmed thread/Uncut Thread",
  "Missing Stitches",
  "Loose threads",
  "Hole",
  "Thread breaks",
  "Wrong design Logo",
  "Puckering/Wrinkles",
  "Overlapping Stitches/Heavy stitching",
  "Hoop marks/Burn marks"
];

const PRINTING_DEFECTS = [
  "Staining / Ink Spots",
  "Misplaced Print",
  "Dirty",
  "Peeling",
  "Cracking",
  "Uneven Print",
  "Smudging / Blurring",
  "Off Registration",
  "Puckering/Wrinkles",
  "Incomplete Print / Missing Area",
  "Wrong Size printing",
  "Slanted Print"
];

const DEFAULT_PHOTO_CATEGORIES = [
  { id: "default_product_view_front", title: "Product View - Front" },
  { id: "default_product_view_back", title: "Product View - Back" },
  { id: "default_compare_embroidery", title: "Compare Sample Vs. Actual - Embroidery" },
  { id: "default_compare_front", title: "Compare Sample Vs. Actual - Front" },
  { id: "default_compare_back", title: "Compare Sample Vs. Actual - Back" },
  { id: "default_compare_print", title: "Compare Sample Vs. Actual - Print" },
  { id: "default_compare_color", title: "Compare Sample Vs. Actual - Color" }
];

const getSavedCustomPhotoCategories = () => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("embPrinting_customCategories");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
};

const getAllPhotoCategoriesWithTitles = () => {
  return [...DEFAULT_PHOTO_CATEGORIES, ...getSavedCustomPhotoCategories()];
};

const isDataUrl = (value) => typeof value === "string" && value.startsWith("data:image/");

const MAX_REMARKS_LENGTH = 250;

// Curing dropdown options
const CURING_MAIN_OPTIONS = [
  "Time",
  "Pressure",

];

const CURING_SUB_OPTIONS = {
  "Heat Press": ["Low", "Medium", "High"],
  Oven: ["Static", "Conveyor"],
  UV: ["A", "B", "C"],
  IR: ["Short Wave", "Medium Wave", "Long Wave"],
  None: ["N/A"],
  Other: ["Custom"]
};

// Function to get buyer from MO Number (skip first 2 chars, check next 2 chars)
const getBuyerFromMoNumber = (moNo) => {
  if (!moNo || moNo.length < 4) return null;

  // Skip first 2 characters and get the next 2 characters
  const checkString = moNo.substring(2, 4).toUpperCase();

  // Check for the more specific "COM" first to correctly identify MWW
  if (moNo.substring(2).includes("COM")) return "MWW";

  // Then, check for the more general "CO" for Costco
  if (checkString === "CO" || moNo.substring(2).includes("CO")) return "Costco";

  // The rest of the original rules
  if (checkString === "AR") return "Aritzia";
  if (checkString === "RT") return "Reitmans";
  if (checkString === "AF") return "ANF";
  if (checkString === "NT") return "STORI";

  // Default case if no other rules match
  return null;
};

const EMBHeaderTab = ({ formData, onFormDataChange, onSubmitHandlerRef, isSubmitting, setIsSubmitting, inspectionType, setActiveTabRef, onSuccess }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSkus, setAvailableSkus] = useState([]);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [showColorsList, setShowColorsList] = useState(false);
  const [showSkusList, setShowSkusList] = useState(false);
  const [showBuyerFields, setShowBuyerFields] = useState(true);

  // Production tab states
  const [tableNoSearchTerm, setTableNoSearchTerm] = useState(
    formData.tableNo || ""
  );
  const [allTableNoOptions, setAllTableNoOptions] = useState([]);
  const [filteredTableNoOptions, setFilteredTableNoOptions] = useState([]);
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const [tableNoManuallyEntered, setTableNoManuallyEntered] = useState(false);
  const [cutPanelDetailsLoading, setCutPanelDetailsLoading] = useState(false);

  const moNoInputRef = useRef(null);
  const moNoDropdownRef = useRef(null);
  const tableNoInputRef = useRef(null);
  const tableNoDropdownWrapperRef = useRef(null);
  const tableNoManuallyEnteredRef = useRef(tableNoManuallyEntered);

  const uploadPhotoFileToServer = useCallback(
    async (file, categoryId) => {
      const uploadFormData = new FormData();
      uploadFormData.append("imageFile", file);
      uploadFormData.append("categoryId", categoryId);

      if (formData.moNo) {
        uploadFormData.append("moNo", formData.moNo);
      }

      let inspectionDateValue = new Date();
      if (formData.inspectionDate) {
        inspectionDateValue =
          formData.inspectionDate instanceof Date
            ? formData.inspectionDate
            : new Date(formData.inspectionDate);
      }
      const inspectionDateString = inspectionDateValue.toISOString().split("T")[0];
      uploadFormData.append("inspectionDate", inspectionDateString);

      const response = await axios.post(
        `${API_BASE_URL}/api/subcon-emb/upload-image`,
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      if (response.data && response.data.success && response.data.filePath) {
        return response.data.filePath;
      }
      throw new Error(response.data?.message || "Failed to upload image.");
    },
    [formData.moNo, formData.inspectionDate]
  );

  const convertDataUrlToFile = (dataUrl, filenamePrefix = "image") => {
    try {
      const [meta, base64Data] = dataUrl.split(",");
      const mimeMatch = meta.match(/data:(.*);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const byteCharacters = atob(base64Data);
      const byteNumbers = Array.from(byteCharacters).map((char) =>
        char.charCodeAt(0)
      );
      const byteArray = new Uint8Array(byteNumbers);
      const file = new File(
        [byteArray],
        `${filenamePrefix}-${Date.now()}-${Math.random()}.jpg`,
        { type: mimeType }
      );
      return file;
    } catch (error) {
      console.error("Failed to convert data URL to file:", error);
      return null;
    }
  };

  const ensureImageUploaded = useCallback(
    async (imageValue, categoryKey = "defect-image") => {
      if (!imageValue) return "";

      const uploadWithFile = async (file) => {
        if (!file) return "";
        return await uploadPhotoFileToServer(file, categoryKey);
      };

      if (typeof imageValue === "string") {
        if (isDataUrl(imageValue)) {
          const file = convertDataUrlToFile(imageValue, categoryKey);
          return await uploadWithFile(file);
        }
        return imageValue;
      }

      if (typeof imageValue === "object") {
        if (imageValue.url && !isDataUrl(imageValue.url)) {
          return imageValue.url;
        }
        if (imageValue.file) {
          return await uploadWithFile(imageValue.file);
        }
        if (imageValue.preview && isDataUrl(imageValue.preview)) {
          const file = convertDataUrlToFile(imageValue.preview, categoryKey);
          return await uploadWithFile(file);
        }
      }

      return "";
    },
    [uploadPhotoFileToServer]
  );

  const preparePhotosForSubmission = useCallback(async () => {
    const photos = formData.photos || {};
    const cleanedPhotos = {};
    const allCategories = getAllPhotoCategoriesWithTitles();

    for (const categoryId of Object.keys(photos)) {
      const categoryEntry = photos[categoryId];
      const categoryPhotos = Array.isArray(categoryEntry)
        ? categoryEntry
        : categoryEntry?.photos || [];
      if (!categoryPhotos || categoryPhotos.length === 0) {
        continue;
      }

      const category = allCategories.find((cat) => cat.id === categoryId);
      const categoryTitle = category ? category.title : categoryId;
      const resolvedPhotos = [];

      for (const photo of categoryPhotos) {
        let photoUrl = photo.url || "";

        if (!photoUrl) {
          let fileToUpload = photo.file;

          if (!fileToUpload && photo.preview) {
            try {
              const response = await fetch(photo.preview);
              const blob = await response.blob();
              const filename = `photo-${Date.now()}-${Math.random()}.jpg`;
              fileToUpload = new File([blob], filename, { type: blob.type || "image/jpeg" });
            } catch (error) {
              console.error("Failed to convert photo preview to file:", error);
            }
          }

          if (fileToUpload) {
            photoUrl = await uploadPhotoFileToServer(fileToUpload, categoryId);
          }
        }

        if (photoUrl) {
          resolvedPhotos.push({
            url: photoUrl,
            timestamp: photo.timestamp || new Date().toISOString(),
            description: photo.description || ""
          });
        }
      }

      if (resolvedPhotos.length > 0) {
        cleanedPhotos[categoryId] = {
          categoryId,
          categoryTitle,
          photos: resolvedPhotos
        };
      }
    }

    return cleanedPhotos;
  }, [formData.photos, uploadPhotoFileToServer]);

  const prepareDefectsForSubmission = useCallback(async () => {
    const defects = formData.defects || [];
    const processedDefects = [];

    for (const defect of defects) {
      const categoryKey = `defect-${defect.category || defect.defectType || defect.name || "image"}`;
      const resolvedImage = await ensureImageUploaded(defect.image, categoryKey);
      processedDefects.push({
        ...defect,
        image: resolvedImage
      });
    }

    return processedDefects;
  }, [formData.defects, ensureImageUploaded]);

  const validateRequiredFields = useCallback(() => {
    const missingFields = [];
    if (!formData.inspectionDate) {
      missingFields.push(t("embPrinting.header.date", "Inspection Date"));
    }
    if (!formData.reportType) {
      missingFields.push(t("embPrinting.header.reportType", "Report Type"));
    }
    if (!formData.factoryName || formData.factoryName.trim() === "") {
      missingFields.push(t("embPrinting.header.factoryName", "Factory Name"));
    }
    if (!formData.moNo || formData.moNo.trim() === "") {
      missingFields.push(t("embPrinting.header.moNo", "MO Number"));
    }

    if (missingFields.length > 0) {
      showToast.error(
        `${t(
          "embPrinting.validation.missingFieldsMessage",
          "Please fill out the following fields before submitting:"
        )} ${missingFields.join(", ")}`
      );
      return false;
    }
    return true;
  }, [formData.inspectionDate, formData.reportType, formData.factoryName, formData.moNo, t]);

  useEffect(() => {
    tableNoManuallyEnteredRef.current = tableNoManuallyEntered;
  }, [tableNoManuallyEntered]);

  const inputFieldClasses =
    "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const inputFieldReadonlyClasses =
    "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFormDataChange({ [name]: value });
  };

  const handleNeedleSizeChange = (e) => {
    const { value } = e.target;
    if (value === "") {
      onFormDataChange({ needleSize: "" });
      return;
    }

    const numericValue = Number(value);
    if (!Number.isNaN(numericValue) && numericValue >= 7 && numericValue <= 16) {
      onFormDataChange({ needleSize: numericValue });
    }
  };

  const handleMachineNoChange = (e) => {
    const { value } = e.target;
    if (value === "") {
      onFormDataChange({ machineNo: "1" });
      return;
    }

    const sanitized = value.replace(/[^0-9]/g, "");
    if (sanitized === "") {
      onFormDataChange({ machineNo: "1" });
      return;
    }

    const numericValue = Number(sanitized);
    if (!Number.isNaN(numericValue)) {
      // Clamp value between 1 and 30
      const clampedValue = Math.max(1, Math.min(30, numericValue));
      onFormDataChange({ machineNo: String(clampedValue) });
    }
  };

  const handleNumericInputChange = (e) => {
    const { name, value } = e.target;
    if (value === "") {
      onFormDataChange({ [name]: "" });
      return;
    }
    const sanitized = value.replace(/[^0-9]/g, "");
    if (sanitized === "") {
      return;
    }
    onFormDataChange({ [name]: Number(sanitized) });
  };

  const toNumberOrNull = (value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  };

  const normalizedColorString = useMemo(() => {
    if (
      typeof formData.color === "string" &&
      formData.color.trim() !== "" &&
      !formData.color.toLowerCase().includes("all colors selected")
    ) {
      return formData.color;
    }
    return "";
  }, [formData.color]);

  const selectedColors = useMemo(() => {
    if (Array.isArray(formData.selectedColors) && formData.selectedColors.length > 0) {
      return formData.selectedColors;
    }
    if (Array.isArray(formData.color) && formData.color.length > 0) {
      return formData.color;
    }
    if (normalizedColorString) {
      return [normalizedColorString];
    }
    return [];
  }, [formData.selectedColors, formData.color, normalizedColorString]);

  const extractColorValue = (colorItem) => {
    if (!colorItem) return "";
    return (
      colorItem.original ||
      colorItem.name ||
      colorItem.color ||
      colorItem.value ||
      ""
    );
  };

  const updateColorSelection = (colorsArray) => {
    const normalized = colorsArray.filter(Boolean);
    onFormDataChange({
      selectedColors: normalized,
      color: normalized[0] || ""
    });
  };

  const toggleColorSelection = (colorValue) => {
    if (!colorValue) return;
    const current = new Set(selectedColors);
    if (current.has(colorValue)) {
      current.delete(colorValue);
    } else {
      current.add(colorValue);
    }
    updateColorSelection(Array.from(current));
  };

  const selectAllColors = () => {
    const allColors = availableColors.map(extractColorValue).filter(Boolean);
    updateColorSelection(allColors);
  };

  const clearAllColors = () => {
    updateColorSelection([]);
  };

  const getColorSummary = () => {
    if (selectedColors.length === 0) {
      return t("embPrinting.header.noColorSelected", "No colors selected");
    }
    if (selectedColors.length === availableColors.length) {
      return t("embPrinting.header.allColorsSelected", "All colors selected");
    }
    if (selectedColors.length === 1) {
      return selectedColors[0];
    }
    return t("embPrinting.header.multipleColorsSelected", {
      defaultValue: "{{count}} colors selected",
      count: selectedColors.length
    });
  };

  useEffect(() => {
    if (
      formData.needleSize === undefined ||
      formData.needleSize === null ||
      formData.needleSize === ""
    ) {
      onFormDataChange({ needleSize: 7 });
    }
  }, [formData.needleSize, onFormDataChange]);

  useEffect(() => {
    if (
      formData.machineNo === undefined ||
      formData.machineNo === null ||
      formData.machineNo === ""
    ) {
      onFormDataChange({ machineNo: "1" });
    }
  }, [formData.machineNo, onFormDataChange]);

  // Initialize conclusion result fields with default "Pass" value
  useEffect(() => {
    const updates = {};

    if (!formData.packingResult) {
      updates.packingResult = "Pass";
    }
    if (!formData.workmanshipResult) {
      updates.workmanshipResult = "Pass";
    }
    if (!formData.qualityPlanResult) {
      updates.qualityPlanResult = "Pass";
    }

    if (Object.keys(updates).length > 0) {
      onFormDataChange(updates);
    }
  }, [formData.packingResult, formData.workmanshipResult, formData.qualityPlanResult, onFormDataChange]);

  // Initialize checklist with default "N/A" values for all items
  useEffect(() => {
    const checklistItems = [
      "orderType",
      "samplesAvailable",
      "labAnalysisTesting",
      "masterCartonRequirements",
      "dropTest",
      "price",
      "hangTags",
      "labels",
      "composition"
    ];

    const currentChecklist = formData.checklist || {};
    const updates = {};
    let hasUpdates = false;

    checklistItems.forEach((key) => {
      if (!currentChecklist[key]) {
        updates[key] = "N/A";
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      onFormDataChange({
        checklist: {
          ...currentChecklist,
          ...updates
        }
      });
    }
  }, [formData.checklist, onFormDataChange]);

  const handleDateChange = (date) => {
    onFormDataChange({ inspectionDate: date });
  };

  const fetchMoNumbers = useCallback(
    async (searchTerm) => {
      if (searchTerm.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/api/search-mono`, {
          params: { term: searchTerm },
          validateStatus: (status) => {
            // Don't throw error for 404, treat it as acceptable
            return status < 500;
          }
        });
        if (response.status === 200 && response.data) {
          setMoNoOptions(response.data || []);
          setShowMoNoDropdown((response.data || []).length > 0);
        } else {
          // 404 or other non-200 status - no results found
          setMoNoOptions([]);
          setShowMoNoDropdown(false);
        }
      } catch (error) {
        // Only log non-404 errors
        if (error.response?.status !== 404 && error.response?.status !== undefined) {
          console.error("Error fetching MO numbers:", error);
        }
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
      }
    },
    []
  );

  // Sync moNoSearch with formData.moNo when it changes externally
  useEffect(() => {
    if (formData.moNo !== moNoSearch) {
      setMoNoSearch(formData.moNo || "");
    }
  }, [formData.moNo]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (moNoSearch && (moNoSearch !== formData.moNo || !formData.moNo)) {
        fetchMoNumbers(moNoSearch);
      } else if (!moNoSearch && moNoSearch.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        // When MO search is cleared, immediately update formData.moNo to trigger reset
        if (formData.moNo) {
          onFormDataChange({ moNo: "" });
        }
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [moNoSearch, formData.moNo, fetchMoNumbers, onFormDataChange]);

  // Handle immediate reset when MO input is cleared (before debounce)
  useEffect(() => {
    if ((!moNoSearch || moNoSearch.trim() === "") && formData.moNo) {
      // Immediately clear MO number to trigger reset
      onFormDataChange({ moNo: "" });
    }
  }, [moNoSearch, formData.moNo, onFormDataChange]);

  const handleMoSelect = (selectedMo) => {
    setMoNoSearch(selectedMo);
    setShowMoNoDropdown(false);
    onFormDataChange({
      moNo: selectedMo,
      buyer: "",
      buyerStyle: "",
      color: "",
      // selectedColors: [],
      skuNumber: "",
      totalOrderQty: null,
      qty: "",
      skuDescription: "",
      selectedColors: [],
      // Reset production fields
      tableNo: "",
      actualLayers: null,
      totalBundle: null,
      totalPcs: null,
      // Reset AQL data
      aqlData: {
        type: "General",
        level: "II",
        sampleSizeLetterCode: "",
        sampleSize: null,
        acceptDefect: null,
        rejectDefect: null
      },
      // Reset defect data
      productionDefects: { emb: [], printing: [] },
      defectsQty: 0,
      defectRate: 0,
      defects: [],
      result: "Pending"
    });
    setAvailableColors([]);
    setAvailableSkus([]);
    setTableNoSearchTerm("");
    setAllTableNoOptions([]);
    setFilteredTableNoOptions([]);
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!formData.moNo) {
        // Reset ALL related fields when MO is cleared
        const updates = {};

        // Always reset order details that are auto-populated from MO number
        updates.buyer = "";
        updates.buyerStyle = "";
        updates.color = "";
        updates.selectedColors = [];
        updates.skuDescription = "";
        updates.skuNumber = "";
        updates.totalOrderQty = null;
        updates.qty = "";

        // Reset production fields
        if (formData.tableNo || formData.actualLayers || formData.totalBundle || formData.totalPcs) {
          updates.tableNo = "";
          updates.actualLayers = null;
          updates.totalBundle = null;
          updates.totalPcs = null;
        }

        // Always reset AQL data when MO is cleared
        updates.aqlData = {
          type: "General",
          level: "II",
          sampleSizeLetterCode: "",
          sampleSize: null,
          acceptDefect: null,
          rejectDefect: null
        };

        // Always reset defect data when MO is cleared
        updates.productionDefects = { emb: [], printing: [] };
        updates.defectsQty = 0;
        updates.defectRate = 0;
        updates.defects = [];
        updates.result = "Pending";

        // Always apply updates to ensure clean state
        onFormDataChange(updates);
        setAvailableColors([]);
        setAvailableSkus([]);
        setTableNoSearchTerm("");
        setAllTableNoOptions([]);
        setFilteredTableNoOptions([]);
        return;
      }
      setOrderDetailsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/order-details/${formData.moNo}`,
          {
            validateStatus: (status) => {
              // Don't throw error for 404, treat it as acceptable
              return status < 500;
            }
          }
        );
        if (response.status === 200 && response.data) {
          const details = response.data;

          // Get buyer from MO Number using the function (skip first 2, check next 2)
          // Priority: Function result > API response (to reduce wrong results)
          const buyerFromMo = getBuyerFromMoNumber(formData.moNo);
          const finalBuyer = buyerFromMo || details.engName || "N/A";

          // Auto-select color if only one color is available
          const availableColorsList = details.colors || [];
          const defaultSelectedColors =
            availableColorsList.length === 1
              ? [extractColorValue(availableColorsList[0])].filter(Boolean)
              : availableColorsList.map(extractColorValue).filter(Boolean);
          const primaryColor = defaultSelectedColors[0] || "";

          onFormDataChange({
            buyer: finalBuyer,
            buyerStyle: details.custStyle || "N/A",
            color: primaryColor,
            selectedColors: defaultSelectedColors,
            skuDescription: details.skuDescription || "",
            skuNumber: "", // Clear SKU - will show "All SKUs selected" if available
            totalOrderQty:
              details.totalQty !== undefined &&
                details.totalQty !== null &&
                details.totalQty !== ""
                ? Number(details.totalQty)
                : null
          });
          setAvailableColors(availableColorsList);
          setAvailableSkus(details.availableSkus || []);
        } else {
          // 404 or other non-200 status - no order details found
          // Try to get buyer from MO Number function even if API fails
          const buyerFromMo = getBuyerFromMoNumber(formData.moNo);

          onFormDataChange({
            buyer: buyerFromMo || "",
            buyerStyle: "",
            color: "",
            selectedColors: [],
            skuDescription: "",
            skuNumber: "",
            totalOrderQty: null
          });
          setAvailableColors([]);
          setAvailableSkus([]);
        }
      } catch (error) {
        // Only log non-404 errors
        if (error.response?.status !== 404 && error.response?.status !== undefined) {
          console.error("Error fetching order details:", error);
        }

        // Try to get buyer from MO Number function even if API fails
        const buyerFromMo = getBuyerFromMoNumber(formData.moNo);

        onFormDataChange({
          buyer: buyerFromMo || "",
          buyerStyle: "",
          color: "",
          selectedColors: [],
          skuDescription: "",
          skuNumber: "",
          totalOrderQty: null
        });
        setAvailableColors([]);
        setAvailableSkus([]);
      } finally {
        setOrderDetailsLoading(false);
      }
    };
    // Always call fetchOrderDetails - it handles both fetch and reset logic
    fetchOrderDetails();
  }, [formData.moNo]);

  const handleCuringMainChange = (e) => {
    const newMain = e.target.value;
    // Reset sub when main changes
    onFormDataChange({ curingMain: newMain, curingSub: "" });
  };

  const handleCuringSubChange = (e) => {
    onFormDataChange({ curingSub: e.target.value });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target) &&
        moNoInputRef.current &&
        !moNoInputRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Production-related functions
  const selectFieldClasses =
    "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'12\\' height=\\'12\\' viewBox=\\'0 0 12 12\\'%3E%3Cpath d=\\'M6 9L1 4h10z\\' fill=\\'%23333\\'/%3E%3C/svg%3E')] bg-no-repeat bg-right bg-[length:16px_16px] pr-10";

  const fetchAQLDetails = useCallback(
    (checkedQty) => {
      if (!checkedQty || checkedQty <= 0) {
        onFormDataChange({
          aqlData: {
            type: "General",
            level: "II",
            sampleSizeLetterCode: "",
            sampleSize: null,
            acceptDefect: null,
            rejectDefect: null
          }
        });
        return;
      }

      // Use the same AQL calculation logic as qc-accuracy page
      const aql = getAqlDetails(checkedQty);

      if (aql.codeLetter === "N/A" || aql.sampleSize === "N/A") {
        // Invalid or too small quantity
        onFormDataChange({
          aqlData: {
            type: "General",
            level: "II",
            sampleSizeLetterCode: "",
            sampleSize: null,
            acceptDefect: null,
            rejectDefect: null
          }
        });
        return;
      }

      // Update AQL data with calculated values
      const newAql = {
        type: "General",
        level: "II",
        sampleSizeLetterCode: aql.codeLetter,
        sampleSize: aql.sampleSize,
        acceptDefect: aql.ac,
        rejectDefect: aql.re
      };
      onFormDataChange({ aqlData: newAql });
    },
    [onFormDataChange]
  );

  const handleProductionInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (["actualLayers", "totalBundle", "totalPcs"].includes(name)) {
      // Allow empty string, or valid number (including partial numbers during typing)
      if (value === "") {
        processedValue = "";
      } else if (isNaN(parseInt(value, 10))) {
        // If not a valid number, keep the current formData value to prevent invalid input
        processedValue = formData[name] || "";
      } else {
        // Valid number - convert to integer
        processedValue = parseInt(value, 10);
      }
    }

    const updates = { [name]: processedValue };
    const numBundle = name === "totalBundle" ? Number(processedValue) || 0 : Number(formData.totalBundle) || 0;
    const numLayers = name === "actualLayers" ? Number(processedValue) || 0 : Number(formData.actualLayers) || 0;

    // Auto-calculate totalPcs only if both bundle and layers are valid numbers > 0
    if ((name === "totalBundle" || name === "actualLayers") && numBundle > 0 && numLayers > 0) {
      updates.totalPcs = numBundle * numLayers;
    } else if (name === "totalBundle" || name === "actualLayers") {
      // If one of them is cleared or invalid, clear totalPcs
      if (processedValue === "" || processedValue === 0) {
        updates.totalPcs = "";
      }
    }

    // Update form data - the useEffect will automatically fetch AQL when totalPcs changes
    onFormDataChange(updates);
  };

  const fetchAllTableNumbersForMOColor = useCallback(async () => {
    const primaryColor = normalizedColorString || selectedColors[0] || "";

    if (!formData.moNo || !primaryColor) {
      setAllTableNoOptions([]);
      setShowTableNoDropdown(false);
      return;
    }
    setCutPanelDetailsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/cutpanel-orders-table-nos`,
        {
          params: { styleNo: formData.moNo, color: primaryColor },
          validateStatus: (status) => {
            // Don't throw error for 404, treat it as acceptable
            return status < 500;
          }
        }
      );
      if (response.status === 200 && response.data) {
        const tables = (response.data || []).map((item) =>
          typeof item === "object" ? item.TableNo : item
        );
        setAllTableNoOptions(tables);
      } else {
        // 404 or other non-200 status - no table numbers found
        setAllTableNoOptions([]);
      }
    } catch (error) {
      // Only log non-404 errors
      if (error.response?.status !== 404 && error.response?.status !== undefined) {
        console.error("Error fetching table numbers:", error);
      }
      setAllTableNoOptions([]);
    } finally {
      setCutPanelDetailsLoading(false);
    }
  }, [formData.moNo, normalizedColorString, selectedColors]);

  useEffect(() => {
    if (formData.moNo && (normalizedColorString || selectedColors.length > 0)) {
      fetchAllTableNumbersForMOColor();
    } else {
      setAllTableNoOptions([]);
    }
  }, [formData.moNo, normalizedColorString, selectedColors, fetchAllTableNumbersForMOColor]);

  // Watch for totalPcs changes and automatically fetch AQL details
  const prevTotalPcsRef = useRef(null);
  useEffect(() => {
    const currentTotalPcs = formData.totalPcs ? Number(formData.totalPcs) : 0;
    const prevTotalPcs = prevTotalPcsRef.current !== null ? Number(prevTotalPcsRef.current) : null;

    // Skip if value hasn't changed
    if (currentTotalPcs === prevTotalPcs) {
      return;
    }

    // Update ref
    prevTotalPcsRef.current = formData.totalPcs;

    // Handle AQL fetch based on new value
    if (currentTotalPcs > 0 && currentTotalPcs >= 8) {
      fetchAQLDetails(currentTotalPcs);
    } else if (currentTotalPcs > 0 && currentTotalPcs < 8) {
      // For lot sizes < 8, set AQL data to null without API call
      onFormDataChange({
        aqlData: {
          type: "General",
          level: "II",
          sampleSizeLetterCode: "",
          sampleSize: null,
          acceptDefect: null,
          rejectDefect: null
        }
      });
    } else if (currentTotalPcs === 0 && prevTotalPcs !== null) {
      // Reset when totalPcs is cleared
      onFormDataChange({
        aqlData: {
          type: "General",
          level: "II",
          sampleSizeLetterCode: "",
          sampleSize: null,
          acceptDefect: null,
          rejectDefect: null
        }
      });
    }
  }, [formData.totalPcs, fetchAQLDetails, onFormDataChange]);

  const handleTableNoSearchChange = (e) => {
    const searchTerm = e.target.value;
    setTableNoSearchTerm(searchTerm);
    setTableNoManuallyEntered(true);
    setShowTableNoDropdown(
      searchTerm.trim() !== "" || allTableNoOptions.length > 0
    );
    if (searchTerm === "") {
      setFilteredTableNoOptions(allTableNoOptions);
      onFormDataChange({
        tableNo: "",
        actualLayers: "",
        totalBundle: "",
        totalPcs: ""
      });
    }
  };

  useEffect(() => {
    const filtered =
      tableNoSearchTerm.trim() !== ""
        ? allTableNoOptions.filter((option) =>
          String(option)
            .toLowerCase()
            .includes(tableNoSearchTerm.toLowerCase())
        )
        : allTableNoOptions;
    setFilteredTableNoOptions(filtered);
  }, [tableNoSearchTerm, allTableNoOptions]);

  const handleTableNoSelect = async (selectedTable) => {
    const selectedTableNo =
      typeof selectedTable === "object" ? selectedTable.TableNo : selectedTable;
    setTableNoSearchTerm(selectedTableNo);
    setShowTableNoDropdown(false);
    setTableNoManuallyEntered(false);
    setCutPanelDetailsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/cutpanel-orders-details`,
        {
          params: {
            styleNo: formData.moNo,
            tableNo: selectedTableNo,
            color: formData.color
          },
          validateStatus: (status) => {
            // Don't throw error for 404, treat it as acceptable
            return status < 500;
          }
        }
      );
      if (response.status === 200 && response.data) {
        const cutPanelDetails = response.data;
        const actualLayersValue =
          cutPanelDetails.ActualLayer != null
            ? Number(cutPanelDetails.ActualLayer)
            : cutPanelDetails.PlanLayer != null
              ? Number(cutPanelDetails.PlanLayer)
              : "";

        const numBundle = Number(formData.totalBundle) || 0;
        const newTotalPcs =
          numBundle > 0 && actualLayersValue > 0
            ? numBundle * actualLayersValue
            : "";

        onFormDataChange({
          tableNo: selectedTableNo,
          actualLayers: actualLayersValue,
          totalPcs: newTotalPcs
        });

        // The useEffect will automatically fetch AQL when totalPcs changes
      } else {
        // 404 or other non-200 status - no details found, just set table number
        onFormDataChange({
          tableNo: selectedTableNo,
          actualLayers: "",
          totalPcs: ""
        });
      }
    } catch (error) {
      // Only log non-404 errors
      if (error.response?.status !== 404 && error.response?.status !== undefined) {
        console.error("Error fetching cut panel details:", error);
      }
      onFormDataChange({
        tableNo: selectedTableNo,
        actualLayers: "",
        totalPcs: ""
      });
    } finally {
      setCutPanelDetailsLoading(false);
    }
  };

  const handleTableNoInputBlur = () => {
    setTimeout(() => {
      if (
        tableNoDropdownWrapperRef.current &&
        !tableNoDropdownWrapperRef.current.contains(document.activeElement)
      ) {
        setShowTableNoDropdown(false);
      }
      if (tableNoManuallyEnteredRef.current) {
        const trimmedSearchTerm = tableNoSearchTerm.trim();
        if (formData.tableNo !== trimmedSearchTerm) {
          onFormDataChange({
            tableNo: trimmedSearchTerm,
            actualLayers: "",
            totalBundle: "",
            totalPcs: ""
          });
        }
        setTableNoManuallyEntered(false);
      }
    }, 150);
  };

  useEffect(() => {
    const handleClickOutsideTableNo = (event) => {
      if (
        tableNoDropdownWrapperRef.current &&
        !tableNoDropdownWrapperRef.current.contains(event.target) &&
        !tableNoInputRef.current?.contains(event.target)
      ) {
        setShowTableNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideTableNo);
    return () => document.removeEventListener("mousedown", handleClickOutsideTableNo);
  }, []);

  // Searchable Select Component for Defects
  const SearchableDefectSelect = ({ value, onChange, options, placeholder = "Select Defect..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState(options);
    const selectRef = useRef(null);

    useEffect(() => {
      if (isOpen && searchTerm.trim() === "") {
        setFilteredOptions(options);
      } else if (isOpen) {
        const filtered = options.filter(opt =>
          opt.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredOptions(filtered);
      }
    }, [searchTerm, options, isOpen]);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (selectRef.current && !selectRef.current.contains(event.target)) {
          setIsOpen(false);
          setSearchTerm("");
        }
      };
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    const handleSelect = (option) => {
      onChange(option);
      setIsOpen(false);
      setSearchTerm("");
    };

    const selectedLabel = value || placeholder;

    return (
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={selectFieldClasses + " text-left cursor-pointer flex items-center justify-between"}
        >
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {selectedLabel}
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-[500px] overflow-y-auto">
            <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search defect..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelect(option)}
                    className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${value === option ? "bg-blue-100 font-medium" : ""
                      } ${index < filteredOptions.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    {option}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm text-center">
                  No defects found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Image Upload Component for each defect
  const normalizeImageValue = (imageValue) => {
    if (!imageValue) return null;
    if (typeof imageValue === "string") {
      return { url: imageValue };
    }
    return imageValue;
  };

  const DefectImageUpload = ({ category, defectId, imageUrl, onImageChange }) => {
    const [showWebcam, setShowWebcam] = useState(false);
    const fileInputRef = useRef(null);
    const webcamRef = useRef(null);

    const handleFileSelect = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange({
          file,
          preview: reader.result,
          url: "",
          categoryKey: `defect-${category}-${defectId}`
        });
      };
      reader.readAsDataURL(file);
      e.target.value = null;
    };

    const handleCapture = async () => {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) return;

      onImageChange({
        file: convertDataUrlToFile(imageSrc, `defect-${category}-${defectId}`),
        preview: imageSrc,
        url: "",
        categoryKey: `defect-${category}-${defectId}`
      });
      setShowWebcam(false);
    };

    const removeImage = () => {
      onImageChange(null);
    };

    const resolvedImage = normalizeImageValue(imageUrl);
    const displaySrc =
      resolvedImage?.preview ||
      resolvedImage?.url ||
      "";

    if (displaySrc) {
      let imageSrc = displaySrc;
      if (typeof imageSrc === "string" && !imageSrc.startsWith("data:image/")) {
        if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
          imageSrc = imageSrc;
        } else if (imageSrc.startsWith("/storage/")) {
          imageSrc = `${API_BASE_URL}${imageSrc}`;
        } else if (imageSrc.startsWith("/")) {
          imageSrc = `${API_BASE_URL}${imageSrc}`;
        } else {
          imageSrc = `${API_BASE_URL}/storage/sub-emb-images/${imageSrc}`;
        }
      }

      return (
        <div className="relative group flex items-center">
          <img
            src={imageSrc}
            alt="Defect"
            className="w-24 h-24 object-cover rounded-md border-2 border-gray-300 shadow-md group-hover:border-blue-400 transition-all"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <button
            onClick={removeImage}
            type="button"
            className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700 hover:scale-110"
          >
            <X size={14} />
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-600 hover:text-blue-600 border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm"
            title="Upload Image"
          >
            <Upload size={18} />
          </button>
          <button
            type="button"
            onClick={() => setShowWebcam(true)}
            className="p-2.5 text-gray-600 hover:text-blue-600 border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm"
            title="Capture from Camera"
          >
            <Camera size={18} />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {showWebcam && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg w-full max-w-md">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="w-full rounded"
              />
              <div className="flex justify-center mt-4 gap-4">
                <button
                  onClick={handleCapture}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Capture
                </button>
                <button
                  onClick={() => setShowWebcam(false)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Get defect list for a category
  const getDefectList = (category) => {
    const current = formData.productionDefects || { emb: [], printing: [] };
    const categoryData = current[category] || [];

    if (!Array.isArray(categoryData)) {
      const defectArray = [];
      Object.keys(categoryData).forEach((defectType) => {
        const data = categoryData[defectType];
        if (typeof data === "number") {
          defectArray.push({
            id: `defect-${Date.now()}-${Math.random()}`,
            defectType: defectType,
            name: defectType,
            qty: data,
            image: "",
            remarks: "",
            isVisible: true,
            garmentNo: defectArray.length + 1,
            defectNo: 1
          });
        } else if (typeof data === "object") {
          defectArray.push({
            id: `defect-${Date.now()}-${Math.random()}`,
            defectType: defectType,
            name: data.name || defectType,
            qty: data.qty || 0,
            image: data.image || "",
            remarks: data.remarks || "",
            machineNo: data.machineNo || "1",
            isVisible: data.isVisible !== undefined ? data.isVisible : true,
            garmentNo: data.garmentNo || defectArray.length + 1,
            defectNo: data.defectNo || 1
          });
        }
      });
      return defectArray;
    }

    return categoryData.map((defect, index) => ({
      id: defect.id || `defect-${Date.now()}-${Math.random()}`,
      defectType: defect.defectType || defect.name || "",
      name: defect.name || defect.defectType || "",
      qty: defect.qty || 0,
      image: defect.image || "",
      remarks: defect.remarks || "",
      machineNo: defect.machineNo || "1",
      isVisible: defect.isVisible !== undefined ? defect.isVisible : true,
      garmentNo: defect.garmentNo || index + 1,
      defectNo: defect.defectNo || 1
    }));
  };

  // Add new defect
  const handleAddDefect = (category) => {
    // Check if MO number is filled
    if (!formData.moNo || formData.moNo.trim() === "") {
      console.warn(t("embPrinting.lock.message", "Please complete header details first"));
      return;
    }

    const current = formData.productionDefects || { emb: [], printing: [] };
    const categoryData = current[category] || [];
    const newDefect = {
      id: `defect-${Date.now()}-${Math.random()}`,
      defectType: "",
      name: "",
      qty: 1,
      image: "",
      remarks: "",
      machineNo: formData.machineNo || "1",
      isVisible: true,
      garmentNo: categoryData.length + 1,
      defectNo: 1
    };

    const updated = {
      ...current,
      [category]: [...categoryData, newDefect]
    };

    onFormDataChange({ productionDefects: updated });
  };

  // Add defect to existing garment
  const handleAddDefectToGarment = (category, garmentNo) => {
    // Check if MO number is filled
    if (!formData.moNo || formData.moNo.trim() === "") {
      console.warn(t("embPrinting.lock.message", "Please complete header details first"));
      return;
    }

    const current = formData.productionDefects || { emb: [], printing: [] };
    const categoryData = current[category] || [];

    // Find the highest defectNo for this garment
    const defectsForGarment = categoryData.filter(d => d.garmentNo === garmentNo);
    const maxDefectNo = defectsForGarment.length > 0
      ? Math.max(...defectsForGarment.map(d => d.defectNo || 1))
      : 0;

    const newDefect = {
      id: `defect-${Date.now()}-${Math.random()}`,
      defectType: "",
      name: "",
      qty: 1,
      image: "",
      remarks: "",
      machineNo: formData.machineNo || "1",
      isVisible: true,
      garmentNo: garmentNo,
      defectNo: maxDefectNo + 1
    };

    const updated = {
      ...current,
      [category]: [...categoryData, newDefect]
    };

    onFormDataChange({ productionDefects: updated });
  };

  // Toggle visibility
  const handleToggleVisibility = (category, defectId) => {
    const current = formData.productionDefects || { emb: [], printing: [] };
    const categoryData = current[category] || [];

    const updatedData = categoryData.map((defect) => {
      if (defect.id === defectId) {
        return { ...defect, isVisible: !defect.isVisible };
      }
      return defect;
    });

    const updated = {
      ...current,
      [category]: updatedData
    };

    onFormDataChange({ productionDefects: updated });
  };

  // Remove defect
  const handleRemoveDefect = (category, defectId) => {
    const current = formData.productionDefects || { emb: [], printing: [] };
    const categoryData = current[category] || [];
    const updated = {
      ...current,
      [category]: categoryData.filter((defect) => defect.id !== defectId)
    };

    // Let the useEffect handle recalculation of defectsQty, defectRate, and result
    onFormDataChange({ productionDefects: updated });
  };

  // Update defect field
  const handleDefectChange = (category, defectId, field, value) => {
    const current = formData.productionDefects || { emb: [], printing: [] };
    const categoryData = current[category] || [];

    const updatedData = categoryData.map((defect) => {
      if (defect.id === defectId) {
        const updated = { ...defect };

        if (field === "qty") {
          const parsed = value === "" ? 1 : parseInt(value, 10);
          updated.qty = isNaN(parsed) ? 1 : Math.max(1, parsed);
        } else if (field === "machineNo") {
          const sanitized = value.replace(/[^0-9]/g, "");
          if (sanitized === "") {
            updated.machineNo = "1";
          } else {
            const numericValue = Number(sanitized);
            if (!Number.isNaN(numericValue)) {
              const clampedValue = Math.max(1, Math.min(30, numericValue));
              updated.machineNo = String(clampedValue);
            }
          }
        } else if (field === "defectType") {
          updated.defectType = value;
          if (!updated.name || updated.name === defect.defectType) {
            updated.name = value;
          }
        } else {
          updated[field] = value;
        }

        return updated;
      }
      return defect;
    });

    const updated = {
      ...current,
      [category]: updatedData
    };

    // Let the useEffect handle recalculation of defectsQty, defectRate, and result
    onFormDataChange({ productionDefects: updated });
  };

  // Determine which defect sections to show based on reportType
  const reportType = formData.reportType || "EMB";
  const showEMB = reportType === "EMB" || reportType === "EMB + Print";
  const showPrinting = reportType === "Printing" || reportType === "EMB + Print";
  const showBoth = reportType === "EMB + Print";
  const gridCols = showBoth ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1";

  // Get defect lists
  const embDefects = getDefectList("emb");
  const printingDefects = getDefectList("printing");

  // Automatically derive totals, defect rate, and conclusion based on defects + AQL
  useEffect(() => {
    const current = formData.productionDefects || { emb: [], printing: [] };

    const normalize = (defectsArray, categoryLabel) => {
      if (!Array.isArray(defectsArray)) {
        return [];
      }
      return defectsArray.map((item) => ({
        category: categoryLabel,
        defectType: item.defectType || item.name || "",
        name: item.name || item.defectType || "",
        qty: Number(item.qty) || 0,
        count: Number(item.qty) || 0,
        remarks: item.remarks || "",
        image: item.image || "",
        machineNo: item.machineNo || "1"
      }));
    };

    const normalizedEmb = normalize(Array.isArray(current.emb) ? current.emb : embDefects, "EMB");
    const normalizedPrinting = normalize(
      Array.isArray(current.printing) ? current.printing : printingDefects,
      "Printing"
    );

    const aggregatedDefects = [...normalizedEmb, ...normalizedPrinting].filter(
      (defect) => defect.defectType && defect.qty > 0
    );

    // Only use formData.defects as fallback if productionDefects structure doesn't exist yet (initial load)
    // If productionDefects exists (even if empty arrays), use it as source of truth - don't fall back
    const hasProductionDefectsStructure = formData.productionDefects &&
      (Array.isArray(formData.productionDefects.emb) || Array.isArray(formData.productionDefects.printing));

    if (
      aggregatedDefects.length === 0 &&
      !hasProductionDefectsStructure &&
      Array.isArray(formData.defects) &&
      formData.defects.length > 0
    ) {
      // Only fallback to formData.defects if productionDefects structure doesn't exist (initial load scenario)
      aggregatedDefects.push(
        ...formData.defects.map((defect) => ({
          category: defect.category || "EMB",
          defectType: defect.defectType || defect.name || "",
          name: defect.name || defect.defectType || "",
          qty: Number(defect.qty ?? defect.count ?? 0) || 0,
          count: Number(defect.count ?? defect.qty ?? 0) || 0,
          remarks: defect.remarks || "",
          image: defect.image || ""
        }))
      );
    }

    const sanitizedDefects = aggregatedDefects.filter((defect) => defect.defectType && defect.qty > 0);

    const totalDefectsQty = sanitizedDefects.reduce((sum, defect) => sum + defect.qty, 0);

    const sampleSize = formData.aqlData?.sampleSize;
    const acceptQty = formData.aqlData?.acceptDefect;

    let calculatedRate = 0;
    let calculatedResult = "Pending";

    if (typeof sampleSize === "number" && sampleSize > 0) {
      calculatedRate = parseFloat(((totalDefectsQty / sampleSize) * 100).toFixed(2));
      if (acceptQty !== null && acceptQty !== undefined) {
        calculatedResult = totalDefectsQty <= acceptQty ? "Pass" : "Reject";
      } else {
        calculatedResult = totalDefectsQty === 0 ? "Pass" : "Pending";
      }
    } else if (sampleSize === 0) {
      calculatedResult = totalDefectsQty === 0 ? "Pass" : "Reject";
    } else {
      // No AQL data - default to Pass if no defects
      calculatedResult = totalDefectsQty === 0 ? "Pass" : "Pending";
    }

    const updates = {};

    if (formData.defectsQty !== totalDefectsQty) {
      updates.defectsQty = totalDefectsQty;
    }

    const existingRate =
      typeof formData.defectRate === "number"
        ? parseFloat(formData.defectRate.toFixed(2))
        : null;

    if (existingRate === null || existingRate !== calculatedRate) {
      updates.defectRate = calculatedRate;
    }

    if (formData.result !== calculatedResult) {
      updates.result = calculatedResult;
    }

    const existingDefectsJson = JSON.stringify(formData.defects || []);
    const aggregatedDefectsJson = JSON.stringify(sanitizedDefects);
    if (existingDefectsJson !== aggregatedDefectsJson) {
      updates.defects = sanitizedDefects;
    }

    if (Object.keys(updates).length > 0) {
      onFormDataChange(updates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.productionDefects,
    formData.defects,
    formData.aqlData?.sampleSize,
    formData.aqlData?.acceptDefect,
    formData.aqlData?.rejectDefect
  ]);

  const handleSubmit = async () => {
    if (!setIsSubmitting) {
      // Fallback if setIsSubmitting is not provided
      return;
    }
    if (!validateRequiredFields()) {
      return;
    }
    const {
      reportType,
      inspectionDate,
      factoryName,
      moNo,
      color,
      aqlData
    } = formData;

    // Get available colors for color array conversion

    // No frontend validation - let the backend handle validation with flexible rules
    // The new endpoint /api/scc/subcon-emb-report has flexible validation

    if (!user) {
      console.error(t("userNotLoggedIn", "User not logged in"));
      return;
    }

    if (setIsSubmitting) {
      setIsSubmitting(true);
    }

    try {
      const [cleanedPhotos, processedDefects] = await Promise.all([
        preparePhotosForSubmission(),
        prepareDefectsForSubmission()
      ]);
      const inspectionTime = `${String(new Date().getHours()).padStart(
        2,
        "0"
      )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
        new Date().getSeconds()
      ).padStart(2, "0")}`;

      const payload = {
        inspectionType: inspectionType || "First Output",
        reportType: formData.reportType || "EMB",
        inspectionDate: formData.inspectionDate ? (formData.inspectionDate instanceof Date ? formData.inspectionDate.toISOString() : formData.inspectionDate) : new Date().toISOString(),
        factoryName: formData.factoryName || "",
        moNo: formData.moNo || "",
        buyer: formData.buyer || "",
        buyerStyle: formData.buyerStyle || "",
        color: Array.isArray(formData.selectedColors)
          ? formData.selectedColors
          : formData.color
            ? [formData.color]
            : [],
        skuDescription: formData.skuDescription || "",
        // Store SKUs as array - if no specific SKU selected, store all available SKUs (like color)
        skuNumber: (() => {
          // If a specific SKU is selected (not "No SKU selected" or "All SKUs selected")
          if (formData.skuNumber &&
            !formData.skuNumber.includes("No SKU selected") &&
            !formData.skuNumber.includes("All SKUs selected") &&
            formData.skuNumber.trim() !== "") {
            return [formData.skuNumber]; // Single SKU as array
          }
          // If "No SKU selected" or "All SKUs selected" or no SKU selected, store all available SKUs
          if (availableSkus.length > 0) {
            return availableSkus.map(sku => sku.sku || sku); // Array of all available SKUs
          }
          return []; // Empty array if no SKUs available
        })(),
        totalOrderQty: Number(formData.totalOrderQty ?? 0),
        totalPcs: Number(formData.totalPcs),
        // EMB Details - only include if reportType is "EMB" or "EMB + Print"
        embDetails: (formData.reportType === "EMB" || formData.reportType === "EMB + Print") ? {
          speed: toNumberOrNull(formData.speed),
          stitch: toNumberOrNull(formData.stitch),
          needleSize: toNumberOrNull(formData.needleSize),
          machineNo: formData.machineNo || "1"
        } : {
          speed: null,
          stitch: null,
          needleSize: null,
          machineNo: null
        },
        // Printing Details - only include if reportType is "Printing" or "EMB + Print"
        printingDetails: (formData.reportType === "Printing" || formData.reportType === "EMB + Print") ? {
          method: formData.printMethod || "",
          curingTime: formData.curingTime || "",
          curingPressure: formData.curingPressure || ""
        } : {
          method: "",
          curingTime: "",
          curingPressure: ""
        },
        aqlData: formData.aqlData,
        defects: processedDefects,
        defectsQty: formData.defectsQty || 0,
        defectRate: formData.defectRate || 0,
        result: formData.result || "Pending",
        packingResult: formData.packingResult || "N/A",
        workmanshipResult: formData.workmanshipResult || "N/A",
        qualityPlanResult: formData.qualityPlanResult || "N/A",
        remarks: formData.remarks?.trim() || "NA",
        checklist: formData.checklist || {},
        photos: cleanedPhotos,
        inspector: formData.inspector || user.eng_name || "N/A",
        inspectionTime: inspectionTime
      };

      // Log payload for debugging
      console.log("Submitting payload:", {
        reportType: payload.reportType,
        inspectionDate: payload.inspectionDate,
        factoryName: payload.factoryName,
        moNo: payload.moNo,
        color: payload.color,
        hasInspectionDate: !!payload.inspectionDate
      });

      const response = await axios.post(
        `${API_BASE_URL}/api/scc/subcon-emb-report`,
        payload
      );

      console.log(response.data.message || t("embPrinting.conclusion.reportSaved", "Report saved successfully"));
    } catch (error) {
      console.error("Error submitting report:", error);
      console.error("Error details:", error.response?.data);
      console.error(error.response?.data?.message || error.message || t("embPrinting.conclusion.errorSubmitting", "Failed to submit report"));
    } finally {
      if (setIsSubmitting) {
        setIsSubmitting(false);
      }
    }
  };

  // Reset form function
  const resetForm = useCallback(() => {
    // Reset all form data to initial state
    onFormDataChange({
      // Header data
      inspectionDate: new Date(),
      reportType: "EMB",
      factoryName: "",
      moNo: "",
      buyer: "",
      buyerStyle: "",
      color: "",
      skuNumber: "",
      totalOrderQty: null,
      qty: "",
      skuDescription: "",
      inspector: "",
      // EMB specific fields
      speed: "",
      stitch: "",
      needleSize: "",
      machineNo: "",
      // Printing specific fields
      manual: "",
      curing: "",
      time: "",
      pressure: "",
      shortCutP: "",
      printMethod: "",
      curingTime: "",
      curingPressure: "",
      // Validations and Checklists
      checklist: {},
      // Production data
      actualLayers: null,
      totalBundle: null,
      totalPcs: null,
      tableNo: "",
      // Photos (organized by categories)
      photos: {},
      // Quality Plan / AQL
      aqlData: {
        type: "General",
        level: "II",
        sampleSizeLetterCode: "",
        sampleSize: null,
        acceptDefect: null,
        rejectDefect: null
      },
      defects: [],
      defectsQty: 0,
      defectRate: 0,
      productionDefects: { emb: [], printing: [] },
      // Conclusion
      result: "Pending",
      remarks: "",
      packingResult: "Pass",
      workmanshipResult: "Pass",
      qualityPlanResult: "Pass"
    });

    // Reset local state variables
    setMoNoSearch("");
    setMoNoOptions([]);
    setShowMoNoDropdown(false);
    setAvailableColors([]);
    setAvailableSkus([]);
    setShowColorsList(false);
    setShowSkusList(false);
    setTableNoSearchTerm("");
    setAllTableNoOptions([]);
    setFilteredTableNoOptions([]);
  }, [onFormDataChange]);

  // Expose submit handler to parent via ref
  // Use useCallback to ensure we always have the latest formData, availableColors, and availableSkus
  const submitHandler = React.useCallback(async () => {
    // Use the latest formData from props (not closure)
    if (!setIsSubmitting) {
      return;
    }
    if (!validateRequiredFields()) {
      if (setIsSubmitting) {
        setIsSubmitting(false);
      }
      return;
    }

    if (!user) {
      console.error(t("userNotLoggedIn", "User not logged in"));
      return;
    }

    if (setIsSubmitting) {
      setIsSubmitting(true);
    }

    try {
      const [cleanedPhotos, processedDefects] = await Promise.all([
        preparePhotosForSubmission(),
        prepareDefectsForSubmission()
      ]);
      const inspectionTime = `${String(new Date().getHours()).padStart(
        2,
        "0"
      )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
        new Date().getSeconds()
      ).padStart(2, "0")}`;

      const payload = {
        inspectionType: inspectionType || "First Output",
        reportType: formData.reportType || "EMB",
        inspectionDate: formData.inspectionDate ? (formData.inspectionDate instanceof Date ? formData.inspectionDate.toISOString() : formData.inspectionDate) : new Date().toISOString(),
        factoryName: formData.factoryName || "",
        moNo: formData.moNo || "",
        buyer: formData.buyer || "",
        buyerStyle: formData.buyerStyle || "",
        color: Array.isArray(formData.selectedColors)
          ? formData.selectedColors
          : formData.color
            ? [formData.color]
            : [],
        skuDescription: formData.skuDescription || "",
        // Store SKUs as array - if no specific SKU selected, store all available SKUs (like color)
        skuNumber: (() => {
          // If a specific SKU is selected (not "No SKU selected" or "All SKUs selected")
          if (formData.skuNumber &&
            !formData.skuNumber.includes("No SKU selected") &&
            !formData.skuNumber.includes("All SKUs selected") &&
            formData.skuNumber.trim() !== "") {
            return [formData.skuNumber]; // Single SKU as array
          }
          // If "No SKU selected" or "All SKUs selected" or no SKU selected, store all available SKUs
          if (availableSkus.length > 0) {
            return availableSkus.map(sku => sku.sku || sku); // Array of all available SKUs
          }
          return []; // Empty array if no SKUs available
        })(),
        totalOrderQty: Number(formData.totalOrderQty ?? 0),
        totalPcs: Number(formData.totalPcs),
        // EMB Details - only include if reportType is "EMB" or "EMB + Print"
        embDetails: (formData.reportType === "EMB" || formData.reportType === "EMB + Print") ? {
          speed: toNumberOrNull(formData.speed),
          stitch: toNumberOrNull(formData.stitch),
          needleSize: toNumberOrNull(formData.needleSize),
          machineNo: formData.machineNo || "1"
        } : {
          speed: null,
          stitch: null,
          needleSize: null,
          machineNo: null
        },
        // Printing Details - only include if reportType is "Printing" or "EMB + Print"
        printingDetails: (formData.reportType === "Printing" || formData.reportType === "EMB + Print") ? {
          method: formData.printMethod || "",
          curingTime: formData.curingTime || "",
          curingPressure: formData.curingPressure || ""
        } : {
          method: "",
          curingTime: "",
          curingPressure: ""
        },
        aqlData: formData.aqlData,
        defects: processedDefects,
        defectsQty: formData.defectsQty || 0,
        defectRate: formData.defectRate || 0,
        result: formData.result || "Pending",
        packingResult: formData.packingResult || "N/A",
        workmanshipResult: formData.workmanshipResult || "N/A",
        qualityPlanResult: formData.qualityPlanResult || "N/A",
        remarks: formData.remarks?.trim() || "NA",
        checklist: formData.checklist || {},
        photos: cleanedPhotos,
        inspector: formData.inspector || user.eng_name || "N/A",
        inspectionTime: inspectionTime
      };

      // Log payload for debugging
      // console.log("Submitting payload (from submitHandler):", {
      //   reportType: payload.reportType,
      //   inspectionDate: payload.inspectionDate,
      //   factoryName: payload.factoryName,
      //   moNo: payload.moNo,
      //   color: payload.color,
      //   hasInspectionDate: !!payload.inspectionDate,
      //   hasPhotos: Object.keys(payload.photos).length > 0,
      //   photosCategories: Object.keys(payload.photos)
      // });

      const response = await axios.post(
        `${API_BASE_URL}/api/scc/subcon-emb-report`,
        payload
      );

      // Check if submission was successful (status 201 or 200)
      if (response.status === 201 || response.status === 200) {
        console.log("✅ Form submitted successfully, starting refresh process...");
        
        // Show success notification
        showToast.success(
          response.data?.message || t("embPrinting.conclusion.reportSaved", "Report saved successfully")
        );

        // Reset form after successful submission
        resetForm();

        // Call onSuccess callback to refresh reports list in parent
        if (onSuccess) {
          console.log("🔄 Calling onSuccess to refresh reports list...");
          onSuccess();
          console.log("✅ Reports list refresh triggered");
        }
        
        // Switch to Reports tab after successful submission
        if (setActiveTabRef && setActiveTabRef.current) {
          console.log("📋 Switching to Reports tab...");
          setActiveTabRef.current("reports");
        }

        console.log("✅ Submission process complete");
      } else {
        throw new Error(response.data?.message || "Failed to submit report");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      console.error("Error details:", error.response?.data);

      // Show error notification
      showToast.error(
        error.response?.data?.message || error.message || t("embPrinting.conclusion.errorSubmitting", "Failed to submit report")
      );
    } finally {
      if (setIsSubmitting) {
        setIsSubmitting(false);
      }
    }
  }, [formData, availableColors, availableSkus, user, inspectionType, setIsSubmitting, t, resetForm, preparePhotosForSubmission, prepareDefectsForSubmission, setActiveTabRef, onSuccess]);

  React.useEffect(() => {
    if (onSubmitHandlerRef) {
      onSubmitHandlerRef.current = submitHandler;
    }
  }, [onSubmitHandlerRef, submitHandler]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
        {t("embPrinting.header.title", "Inspection Header Information")}
      </h3>

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="inspectionDate" className={labelClasses}>
            {t("embPrinting.header.date", "Inspection Date")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <DatePicker
            selected={
              formData.inspectionDate
                ? new Date(formData.inspectionDate)
                : new Date()
            }
            onChange={handleDateChange}
            dateFormat="MM/dd/yyyy"
            className={inputFieldClasses}
            required
            id="inspectionDate"
          />
        </div>

        <div>
          <label htmlFor="reportType" className={labelClasses}>
            {t("embPrinting.header.reportType", "Report Type")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <select
            id="reportType"
            name="reportType"
            value={formData.reportType || "EMB"}
            onChange={handleInputChange}
            className={inputFieldClasses}
            required
          >
            <option value="EMB">EMB</option>
            <option value="Printing">Printing</option>
            <option value="EMB + Print">EMB + Print</option>
          </select>
        </div>

        <div>
          <label htmlFor="factoryName" className={labelClasses}>
            {t("embPrinting.header.factoryName", "Factory Name")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <select
            id="factoryName"
            name="factoryName"
            value={formData.factoryName || ""}
            onChange={handleInputChange}
            className={inputFieldClasses}
            required
          >
            <option value="">
              {t("embPrinting.header.selectFactory", "Select Factory")}
            </option>
            {FACTORY_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label htmlFor="moNoSearch" className={labelClasses}>
            {t("embPrinting.header.moNo", "MO Number")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1" ref={moNoDropdownRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              id="moNoSearch"
              value={moNoSearch}
              ref={moNoInputRef}
              onChange={(e) => {
                const newValue = e.target.value;
                setMoNoSearch(newValue);
                // If MO is cleared, immediately update formData to trigger reset
                if (!newValue || newValue.trim() === "") {
                  if (formData.moNo) {
                    onFormDataChange({ moNo: "" });
                  }
                }
              }}
              onFocus={() => {
                if (moNoSearch && moNoOptions.length === 0)
                  fetchMoNumbers(moNoSearch);
                setShowMoNoDropdown(true);
              }}
              placeholder={t("embPrinting.header.searchMo", "Search MO...")}
              className={`${inputFieldClasses} pl-9`}
              required
              autoComplete="off"
            />
            {showMoNoDropdown && moNoOptions.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {moNoOptions.map((mo) => (
                  <li
                    key={mo}
                    onClick={() => handleMoSelect(mo)}
                    className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-500 hover:text-white"
                  >
                    {mo}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Conditional Fields Based on Report Type */}
      {formData.reportType === "EMB" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-md font-semibold text-blue-800 mb-4">EMB Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="speed" className={labelClasses}>
                Speed
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                id="speed"
                name="speed"
                value={formData.speed || ""}
                onChange={handleNumericInputChange}
                className={inputFieldClasses}
                placeholder="Enter speed"
              />
            </div>
            <div>
              <label htmlFor="stitch" className={labelClasses}>
                Stitch
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                id="stitch"
                name="stitch"
                value={formData.stitch || ""}
                onChange={handleNumericInputChange}
                className={inputFieldClasses}
                placeholder="Enter stitch"
              />
            </div>
            <div>
              <label htmlFor="needleSize" className={labelClasses}>
                Needle Size
              </label>
              <input
                type="number"
                id="needleSize"
                name="needleSize"
                min="7"
                max="16"
                step="1"
                value={formData.needleSize || ""}
                onChange={handleNeedleSizeChange}
                className={inputFieldClasses}
                placeholder="Enter a value between 7 and 16"
              />
            </div>
          </div>
        </div>
      )}

      {formData.reportType === "Printing" && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-md font-semibold text-purple-800 mb-4">Printing Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClasses}>Method</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="printMethod"
                    value="manual"
                    checked={formData.printMethod === "manual"}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Manual</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="printMethod"
                    value="auto"
                    checked={formData.printMethod === "auto"}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Auto</span>
                </label>
              </div>
            </div>
            <div>
              <label htmlFor="curingTime" className={labelClasses}>Time</label>
              <input
                type="text"
                inputMode="numeric"
                id="curingTime"
                name="curingTime"
                value={formData.curingTime || ""}
                onChange={handleInputChange}
                className={inputFieldClasses}
                placeholder="Enter time"
              />
            </div>
            <div>
              <label htmlFor="curingPressure" className={labelClasses}>Pressure</label>
              <input
                type="text"
                inputMode="numeric"
                id="curingPressure"
                name="curingPressure"
                value={formData.curingPressure || ""}
                onChange={handleInputChange}
                className={inputFieldClasses}
                placeholder="Enter pressure"
              />
            </div>






          </div>
        </div>
      )}

      {formData.reportType === "EMB + Print" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-md font-semibold text-blue-800 mb-4">EMB Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="speed" className={labelClasses}>
                  Speed
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="speed"
                  name="speed"
                  value={formData.speed || ""}
                  onChange={handleNumericInputChange}
                  className={inputFieldClasses}
                  placeholder="Enter speed"
                />
              </div>
              <div>
                <label htmlFor="stitch" className={labelClasses}>
                  Stitch
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="stitch"
                  name="stitch"
                  value={formData.stitch || ""}
                  onChange={handleNumericInputChange}
                  className={inputFieldClasses}
                  placeholder="Enter stitch"
                />
              </div>
              {/* <div>
                <label htmlFor="needleSize" className={labelClasses}>
                  Needle Size ppp
                </label>
                <input
                  type="number"
                  id="needleSize"
                  name="needleSize"
                  min="7"
                  max="16"
                  step="1"
                  value={formData.needleSize || ""}
                  onChange={handleNeedleSizeChange}
                  className={inputFieldClasses}
                  placeholder="Enter a value between 7 and 16"
                />
              </div> */}
              {/* <div>
                <label htmlFor="machineNo" className={labelClasses}>
                  Machine No
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="machineNo"
                  name="machineNo"
                  value={formData.machineNo || ""}
                  onChange={handleNumericInputChange}
                  className={inputFieldClasses}
                  placeholder="Enter machine number"
                />
              </div> */}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-md font-semibold text-purple-800 mb-4">Printing Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>Method</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="printMethod"
                      value="manual"
                      checked={formData.printMethod === "manual"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Manual</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="printMethod"
                      value="auto"
                      checked={formData.printMethod === "auto"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Auto</span>
                  </label>
                </div>
              </div>
              <div>
                <label htmlFor="curingTime" className={labelClasses}>Time</label>
                <input
                  type="text"
                  inputMode="numeric"
                  id="curingTime"
                  name="curingTime"
                  value={formData.curingTime || ""}
                  onChange={handleInputChange}
                  className={inputFieldClasses}
                  placeholder="Enter time"
                />
              </div>
              <div>
                <label htmlFor="curingPressure" className={labelClasses}>Pressure</label>
                <input
                  type="text"
                  inputMode="numeric"
                  id="curingPressure"
                  name="curingPressure"
                  value={formData.curingPressure || ""}
                  onChange={handleInputChange}
                  className={inputFieldClasses}
                  placeholder="Enter pressure"
                />
              </div>


            </div>
          </div>
        </>
      )}

      {/* Row 3 - Buyer Fields with Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700">Order Information</h4>
          <button
            type="button"
            onClick={() => setShowBuyerFields(!showBuyerFields)}
            className="text-gray-600 hover:text-gray-800 p-2 transition-colors"
            title={showBuyerFields ? "Hide Fields" : "Show Fields"}
          >
            {showBuyerFields ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {showBuyerFields && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className={labelClasses}>
                {t("embPrinting.header.buyer", "Buyer")}
              </label>
              <input
                type="text"
                value={formData.buyer || ""}
                readOnly
                className={inputFieldReadonlyClasses}
                placeholder="No buyer information available"
              />
            </div>

            <div>
              <label className={labelClasses}>
                {t("embPrinting.header.buyerStyle", "Buyer Style")}
              </label>
              <input
                type="text"
                value={formData.buyerStyle || ""}
                readOnly
                className={inputFieldReadonlyClasses}
                placeholder="No buyer style information available"
              />
            </div>

            <div>
              <label htmlFor="color" className={labelClasses}>
                {t("embPrinting.header.color", "Color")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={getColorSummary()}
                  readOnly
                  className={inputFieldReadonlyClasses + " flex-1"}
                />
                {availableColors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowColorsList(!showColorsList)}
                    className="text-gray-600 hover:text-gray-800 p-2"
                    title={showColorsList ? "Hide Colors" : "Show Colors"}
                  >
                    {showColorsList ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              {showColorsList && availableColors.length > 0 && (
                <div className="mt-2 p-4 bg-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <p className="font-semibold text-gray-700">
                      {t("embPrinting.header.availableColors", "Available Colors")}:
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllColors}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        {t("common.selectAll", "Select All")}
                      </button>
                      <button
                        type="button"
                        onClick={clearAllColors}
                        className="px-3 py-1 bg-gray-300 text-gray-800 text-xs rounded hover:bg-gray-400"
                      >
                        {t("common.clearAll", "Clear All")}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableColors.map((c, index) => {
                      const colorValue = extractColorValue(c);
                      if (!colorValue) {
                        return null;
                      }
                      const isSelected = selectedColors.includes(colorValue);
                      return (
                        <button
                          type="button"
                          key={c.key || `${colorValue}-${index}`}
                          onClick={() => toggleColorSelection(colorValue)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded border text-sm transition-colors ${isSelected
                              ? "bg-blue-50 border-blue-400 text-blue-700"
                              : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"
                            }`}
                        >
                          <span className="font-semibold flex-1 text-left">
                            {colorValue}
                            {c.chn && (
                              <span className="text-gray-600 font-normal ml-2">({c.chn})</span>
                            )}
                          </span>
                          <span
                            className={`w-4 h-4 border rounded ${isSelected ? "bg-blue-500 border-blue-500" : "border-gray-400"
                              }`}
                          >
                            {isSelected && (
                              <span className="block w-full h-full bg-blue-500" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="skuDescription" className={labelClasses}>
                SKU Description
              </label>
              <input
                type="text"
                id="skuDescription"
                name="skuDescription"
                value={formData.skuDescription || ""}
                readOnly
                className={inputFieldReadonlyClasses}
                placeholder="No SKU description available"
              />
            </div>

            <div>
              <label htmlFor="skuNumber" className={labelClasses}>
                SKU Number
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="skuNumber"
                  name="skuNumber"
                  value={formData.skuNumber && !formData.skuNumber.includes("No SKU selected") && formData.skuNumber.trim() !== ""
                    ? formData.skuNumber
                    : (availableSkus.length > 0 ? t("embPrinting.header.allSkusSelected", "All SKUs selected") : t("embPrinting.header.noSkuSelected", "No SKU selected"))}
                  readOnly
                  className={inputFieldReadonlyClasses + " flex-1"}
                />
                {availableSkus.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSkusList(!showSkusList)}
                    className="text-gray-600 hover:text-gray-800 p-2"
                    title={showSkusList ? "Hide SKUs" : "Show SKUs"}
                  >
                    {showSkusList ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              {showSkusList && availableSkus.length > 0 && (
                <div className="mt-2 p-4 bg-gray-100 rounded-lg border border-gray-200">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {t("embPrinting.header.availableSkus", "Available SKUs")}:
                    </p>
                    {availableSkus.map((skuItem, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          onFormDataChange({ skuNumber: skuItem.sku });
                          setShowSkusList(false);
                        }}
                        className="text-sm text-gray-800 py-2 px-3 bg-white rounded border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="font-semibold">{skuItem.sku}</div>
                        {skuItem.color && (
                          <div className="text-xs text-gray-600 mt-1">
                            Color: {skuItem.color}
                          </div>
                        )}
                        {skuItem.qty > 0 && (
                          <div className="text-xs text-gray-600">
                            Qty: {skuItem.qty}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Row 4 - Total PO Items */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="totalOrderQty" className={labelClasses}>
            Total Order Qty
          </label>
          <input
            type="number"
            id="totalOrderQty"
            name="totalOrderQty"
            value={formData.totalOrderQty ?? ""}
            readOnly
            className={inputFieldReadonlyClasses}
            placeholder="Total Order Qty"
          />
        </div>
      </div>

      {/* Validation Checklist */}
      <ValidationChecklist
        checklist={formData.checklist || {}}
        onChecklistChange={(newChecklist) =>
          onFormDataChange({ checklist: newChecklist })
        }
      />

      {/* Production & Inspection Details */}
      <div className="space-y-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
          {t("embPrinting.production.title", "Production & Inspection Details")}
        </h3>

        {/* Inspection Details Table */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="px-4 py-3 border-b">
            <h4 className="text-md font-semibold text-gray-700">Inspection Details</h4>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Total Pcs</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Insp. Qty (AQL)</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Defects Qty</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Defect Rate</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Result</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name="totalPcs"
                        value={formData.totalPcs ?? ""}
                        onChange={handleProductionInputChange}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Enter total pieces"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="px-2 py-1.5 bg-gray-50 rounded-md text-gray-700 font-medium">
                        {formData.aqlData?.sampleSize || "N/A"}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="px-2 py-1.5 bg-gray-50 rounded-md text-gray-700 font-medium">
                        {formData.defectsQty || 0}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className={`px-2 py-1.5 rounded-md font-medium ${formData.defectRate > 0
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-50 text-gray-700"
                        }`}>
                        {typeof formData.defectRate === "number"
                          ? `${formData.defectRate.toFixed(2)}%`
                          : "0.00%"}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className={`px-2 py-1.5 rounded-md font-medium text-center ${formData.result === "Pass"
                        ? "bg-green-100 text-green-700"
                        : formData.result === "Reject"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                        }`}>
                        {formData.result || "Pending"}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Defect Categories (EMB and Printing) */}
        <div className={`grid ${gridCols} gap-6`}>
          {/* EMB Defect Card */}
          {showEMB && (
            <div className="rounded-lg shadow bg-white relative">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg flex justify-between items-center">
                <h4 className="text-white font-semibold">EMB Defect</h4>
                <button
                  type="button"
                  onClick={() => handleAddDefect("emb")}
                  disabled={!formData.moNo || formData.moNo.trim() === ""}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-md ${!formData.moNo || formData.moNo.trim() === ""
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-white text-blue-600 hover:bg-blue-50 hover:shadow-lg border-2 border-blue-300"
                    }`}
                >
                  <Plus size={18} />
                  Add Pcs
                </button>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-b-lg relative">
                {(!formData.moNo || formData.moNo.trim() === "") && (
                  <div className="absolute inset-0 bg-gray-100 bg-opacity-90 rounded-b-lg flex items-center justify-center z-10">
                    <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-sm">
                      <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-semibold text-gray-800 mb-2">
                        {t("embPrinting.lock.message", "Please complete header details first")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("embPrinting.lock.hint", "(MO No)")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {embDefects.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      <p>No defects added yet. Click "Add Pcs" to start.</p>
                    </div>
                  ) : (
                    embDefects.map((defect) => {
                      return (
                        <div
                          key={defect.id}
                          className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                        >
                          {/* Card Header */}
                          <div className="flex justify-between items-center mb-4 pb-2 border-b">
                            <h5 className="font-semibold text-gray-800">
                              Garment {defect.garmentNo} - Defect {defect.defectNo}
                            </h5>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleVisibility("emb", defect.id)}
                                className="p-1 text-gray-600 hover:text-blue-600 rounded transition-colors"
                                title={defect.isVisible ? "Hide" : "Show"}
                              >
                                {defect.isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveDefect("emb", defect.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Remove Defect"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          {defect.isVisible && (
                            <div className="space-y-3">
                              {/* Defect Name - Dropdown */}
                              <div>
                                <label className={labelClasses}>Defect Name</label>
                                <SearchableDefectSelect
                                  value={defect.defectType}
                                  onChange={(value) =>
                                    handleDefectChange("emb", defect.id, "defectType", value)
                                  }
                                  options={EMB_DEFECTS}
                                  placeholder="Select Defect..."
                                />
                              </div>

                              {/* Qty and Image in one row */}
                              <div className="grid grid-cols-2 gap-4 items-start">
                                <div>
                                  <label className={labelClasses}>Qty</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newQty = Math.max(1, defect.qty - 1);
                                        handleDefectChange("emb", defect.id, "qty", newQty);
                                      }}
                                      disabled={defect.qty <= 1}
                                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 transition-all font-semibold text-gray-700 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center font-medium"
                                      value={defect.qty}
                                      onChange={(e) =>
                                        handleDefectChange("emb", defect.id, "qty", e.target.value)
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newQty = defect.qty + 1;
                                        handleDefectChange("emb", defect.id, "qty", newQty);
                                      }}
                                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 transition-all font-semibold text-gray-700 text-lg"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className={labelClasses}>Image</label>
                                  <div className="mt-1 flex items-center min-h-[2.5rem]">
                                    <DefectImageUpload
                                      category="emb"
                                      defectId={defect.id}
                                      imageUrl={defect.image}
                                      onImageChange={(url) =>
                                        handleDefectChange("emb", defect.id, "image", url)
                                      }
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Machine No */}
                              <div>
                                <label className={labelClasses}>Machine No</label>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min="1"
                                  max="30"
                                  className={inputFieldClasses}
                                  value={defect.machineNo || "1"}
                                  onChange={(e) =>
                                    handleDefectChange("emb", defect.id, "machineNo", e.target.value)
                                  }
                                  placeholder="Enter machine number (1-30)"
                                />
                              </div>

                              {/* Remarks - Optional */}
                              <div>
                                <label className={labelClasses}>Remarks (Optional)</label>
                                <textarea
                                  className={inputFieldClasses}
                                  rows="2"
                                  value={defect.remarks || ""}
                                  onChange={(e) =>
                                    handleDefectChange("emb", defect.id, "remarks", e.target.value)
                                  }
                                  placeholder="Enter remarks..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Printing Defect Card */}
          {showPrinting && (
            <div className="rounded-lg shadow bg-white relative">
              <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-lg flex justify-between items-center">
                <h4 className="text-white font-semibold">Printing Defect</h4>
                <button
                  type="button"
                  onClick={() => handleAddDefect("printing")}
                  disabled={!formData.moNo || formData.moNo.trim() === ""}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-md ${!formData.moNo || formData.moNo.trim() === ""
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-white text-purple-600 hover:bg-purple-50 hover:shadow-lg border-2 border-purple-300"
                    }`}
                >
                  <Plus size={18} />
                  Add Pcs
                </button>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-b-lg relative">
                {(!formData.moNo || formData.moNo.trim() === "") && (
                  <div className="absolute inset-0 bg-gray-100 bg-opacity-90 rounded-b-lg flex items-center justify-center z-10">
                    <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-sm">
                      <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-semibold text-gray-800 mb-2">
                        {t("embPrinting.lock.message", "Please complete header details first")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("embPrinting.lock.hint", "(MO No)")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {printingDefects.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      <p>No defects added yet. Click "Add Pcs" to start.</p>
                    </div>
                  ) : (
                    printingDefects.map((defect) => {
                      return (
                        <div
                          key={defect.id}
                          className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                        >
                          {/* Card Header */}
                          <div className="flex justify-between items-center mb-4 pb-2 border-b">
                            <h5 className="font-semibold text-gray-800">
                              Garment {defect.garmentNo} - Defect {defect.defectNo}
                            </h5>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleVisibility("printing", defect.id)}
                                className="p-1 text-gray-600 hover:text-purple-600 rounded transition-colors"
                                title={defect.isVisible ? "Hide" : "Show"}
                              >
                                {defect.isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveDefect("printing", defect.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Remove Defect"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          {defect.isVisible && (
                            <div className="space-y-3">
                              {/* Defect Name - Dropdown */}
                              <div>
                                <label className={labelClasses}>Defect Name</label>
                                <SearchableDefectSelect
                                  value={defect.defectType}
                                  onChange={(value) =>
                                    handleDefectChange("printing", defect.id, "defectType", value)
                                  }
                                  options={PRINTING_DEFECTS}
                                  placeholder="Select Defect..."
                                />
                              </div>

                              {/* Qty and Image in one row */}
                              <div className="grid grid-cols-2 gap-4 items-start">
                                <div>
                                  <label className={labelClasses}>Qty</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newQty = Math.max(1, defect.qty - 1);
                                        handleDefectChange("printing", defect.id, "qty", newQty);
                                      }}
                                      disabled={defect.qty <= 1}
                                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 transition-all font-semibold text-gray-700 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center font-medium"
                                      value={defect.qty}
                                      onChange={(e) =>
                                        handleDefectChange("printing", defect.id, "qty", e.target.value)
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newQty = defect.qty + 1;
                                        handleDefectChange("printing", defect.id, "qty", newQty);
                                      }}
                                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 transition-all font-semibold text-gray-700 text-lg"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className={labelClasses}>Image</label>
                                  <div className="mt-1 flex items-center min-h-[2.5rem]">
                                    <DefectImageUpload
                                      category="printing"
                                      defectId={defect.id}
                                      imageUrl={defect.image}
                                      onImageChange={(url) =>
                                        handleDefectChange("printing", defect.id, "image", url)
                                      }
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Machine No */}
                              <div>
                                <label className={labelClasses}>Machine No</label>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min="1"
                                  max="30"
                                  className={inputFieldClasses}
                                  value={defect.machineNo || "1"}
                                  onChange={(e) =>
                                    handleDefectChange("printing", defect.id, "machineNo", e.target.value)
                                  }
                                  placeholder="Enter machine number (1-30)"
                                />
                              </div>

                              {/* Remarks - Optional */}
                              <div>
                                <label className={labelClasses}>Remarks (Optional)</label>
                                <textarea
                                  className={inputFieldClasses}
                                  rows="2"
                                  value={defect.remarks || ""}
                                  onChange={(e) =>
                                    handleDefectChange("printing", defect.id, "remarks", e.target.value)
                                  }
                                  placeholder="Enter remarks..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add More Defects to Existing Garments */}
        {(embDefects.length > 0 || printingDefects.length > 0) && (
          <div className="bg-white rounded-lg border shadow-sm p-4 mt-6">
            <h4 className="text-md font-semibold text-gray-700 mb-4">
              Add More Defects to an Existing Garment
            </h4>
            <div className="space-y-4">
              {/* EMB Defects Section */}
              {showEMB && embDefects.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-2">EMB Defects</h5>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(embDefects.map(d => d.garmentNo)))
                      .sort((a, b) => a - b)
                      .map((garmentNo) => (
                        <button
                          key={`emb-${garmentNo}`}
                          type="button"
                          onClick={() => handleAddDefectToGarment("emb", garmentNo)}
                          disabled={!formData.moNo || formData.moNo.trim() === ""}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${!formData.moNo || formData.moNo.trim() === ""
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                        >
                          <Plus size={16} />
                          Add to Garment {garmentNo}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Printing Defects Section */}
              {showPrinting && printingDefects.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Printing Defects</h5>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(printingDefects.map(d => d.garmentNo)))
                      .sort((a, b) => a - b)
                      .map((garmentNo) => (
                        <button
                          key={`printing-${garmentNo}`}
                          type="button"
                          onClick={() => handleAddDefectToGarment("printing", garmentNo)}
                          disabled={!formData.moNo || formData.moNo.trim() === ""}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${!formData.moNo || formData.moNo.trim() === ""
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                        >
                          <Plus size={16} />
                          Add to Garment {garmentNo}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AQL Sampling Plan Section */}
        <div className="space-y-6 mt-6">
          {/* AQL Sampling Plan */}
          {formData.aqlData?.sampleSize !== null &&
            formData.aqlData?.sampleSize !== undefined && (
              <div className="p-4 bg-blue-100 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg shadow-sm">
                <h4 className="text-md font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                  <ListChecks size={20} className="mr-2" />
                  {t("qcAccuracy.aqlSamplingPlan", "AQL Sampling Plan")}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center">
                    <FileText size={16} className="mr-2 text-blue-500" />
                    {t("qcAccuracy.codeLetter", "Code Letter")}:
                    <strong className="ml-2 font-mono">
                      {formData.aqlData.sampleSizeLetterCode || "N/A"}
                    </strong>
                  </div>
                  <div className="flex items-center">
                    <Users size={16} className="mr-2 text-blue-500" />
                    {t("qcAccuracy.sampleSize", "Sample Size")}:
                    <strong className="ml-2 font-mono">
                      {formData.aqlData.sampleSize || "N/A"}
                    </strong>
                  </div>
                  <div className="flex items-center text-green-700 dark:text-green-400">
                    <CheckCircle size={16} className="mr-2" />
                    {t("qcAccuracy.accept", "Accept (Ac)")}:
                    <strong className="ml-2 font-mono">
                      {formData.aqlData.acceptDefect ?? "N/A"}
                    </strong>
                  </div>
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <AlertTriangle size={16} className="mr-2" />
                    {t("qcAccuracy.reject", "Reject (Re)")}:
                    <strong className="ml-2 font-mono">
                      {formData.aqlData.rejectDefect ?? "N/A"}
                    </strong>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Conclusion Section */}
        <div className="space-y-6 mt-6">
          <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
            {t("embPrinting.conclusion.title", "Conclusion")}
          </h4>

          <div className="bg-white rounded-lg border">
            <div className="divide-y">
              {[
                { field: "packingResult", label: "Packing, Packaging & Labeling" },
                { field: "workmanshipResult", label: "Workmanship" },
                { field: "qualityPlanResult", label: "Quality Plan (Quality Plan)" }
              ].map((row) => (
                <div key={row.field} className="p-4 flex items-center justify-between">
                  <span className="text-sm text-gray-800">{row.label}</span>
                  <div className="flex items-center gap-6">
                    {[
                      { key: "Pass", color: "text-green-700" },
                      { key: "Fail", color: "text-red-700" },
                      { key: "N/A", color: "text-gray-700" }
                    ].map((opt) => (
                      <label key={opt.key} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={row.field}
                          value={opt.key}
                          checked={(formData[row.field] || "") === opt.key}
                          onChange={(e) => onFormDataChange({ [row.field]: e.target.value })}
                          className="mr-2"
                        />
                        <span className={`text-sm ${opt.color}`}>{opt.key}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* <div className="bg-gray-50 rounded-lg border p-4">
            <div className="text-center text-sm text-gray-700">Total Defective Units</div>
            <div className="text-center mt-1 text-xl font-bold text-gray-900">{formData.defectsQty || 0}</div>
          </div> */}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Remarks (Optional)
            </label>
            <div className="relative">
              <textarea
                value={formData.remarks || ""}
                onChange={(e) =>
                  onFormDataChange({ remarks: e.target.value.slice(0, MAX_REMARKS_LENGTH) })
                }
                placeholder="Enter any additional comments here..."
                className={`${inputFieldClasses} min-h-[120px] resize-y pr-16`}
                maxLength={MAX_REMARKS_LENGTH}
              />
              <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                {(formData.remarks || "").length} / {MAX_REMARKS_LENGTH}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EMBHeaderTab;

