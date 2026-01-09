import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Upload, X, Camera, ChevronDown, ChevronUp, FileText, FileSpreadsheet, Printer, QrCode, Scan, Pencil, CheckCircle, RotateCw, RotateCcw, Download, Trash2, Save, RefreshCw, Send, Search, ClipboardList } from "lucide-react";
import { API_BASE_URL, QR_CODE_BASE_URL } from "../../config.js";
import Select from "react-select";
import { pdf } from "@react-pdf/renderer";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";
import WashingMachineTestPDF from "../components/inspection/WashingTesting/WashingMachineTestPDF";
import generateWashingMachineTestExcel from "../components/inspection/WashingTesting/WashingMachineTestExcel";
import {
  ImageViewerModal,
  useImageViewer,
  normalizeImageUrl,
  getImageFilename,
  FormSection,
  ReportsList,
  ReceivedModal,
  CompletionModal,
  DeleteConfirmationModal,
  EditImagesModal,
  EditReportModal,
  QRCodeModal,
  QRScannerModal,
  useOrderData,
  useQRCode,
  useReports,
  useImageHandling,
  useFormState,
  useReportSubmission,
} from "../components/inspection/WashingTesting/lib";
import showToast from "../utils/toast";

const LaundryWashingMachineTest = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateValue = new Date().toISOString().split("T")[0];
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const receivedImageInputRef = useRef(null);
  const completionImageInputRef = useRef(null);

  // Get the base URL for QR codes - use computer's network IP so phones can access
  const getQRCodeBaseURL = () => {
    const currentProtocol = window.location.protocol; // Get current protocol (http: or https:)

    if (QR_CODE_BASE_URL) {
      // This ensures QR codes use the same protocol as the current page (HTTP/HTTPS)
      try {
        const url = new URL(QR_CODE_BASE_URL);
        url.protocol = currentProtocol;
        return url.toString().replace(/\/$/, ''); // Remove trailing slash if present
      } catch (error) {
        // If URL parsing fails, try simple string replacement
        const protocolMatch = QR_CODE_BASE_URL.match(/^https?:\/\//);
        if (protocolMatch) {
          return QR_CODE_BASE_URL.replace(/^https?:\/\//, `${currentProtocol}//`);
        }
        // Fallback: prepend protocol if missing
        return `${currentProtocol}//${QR_CODE_BASE_URL.replace(/^\/\//, '')}`;
      }
    }

    const origin = window.location.origin;
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      console.warn("Accessing via localhost - QR codes may not work for network devices. Please set VITE_QR_CODE_BASE_URL in .env file.");
    }
    return origin;
  };

  // Initialize custom hooks
  const initialFormData = {
    color: [],
    ymStyle: "",
    buyerStyle: "",
    po: [],
    exFtyDate: [],
    factory: "",
    sendToHomeWashingDate: dateValue,
    images: [],
    notes: "",
  };

  const { formData, setFormData, handleInputChange: handleFormInputChange, resetForm } = useFormState(initialFormData);

  const {
    reports,
    isLoadingReports,
    expandedReports,
    printingReportId,
    setPrintingReportId,
    fetchReports,
    deleteReport,
    toggleReport,
    pagination,
  } = useReports();

  const {
    availableColors,
    availablePOs,
    availableETDs,
    isLoadingColors,
    fetchOrderColors,
    fetchYorksysOrderETD,
    resetOrderData,
  } = useOrderData();

  const {
    showReportDateQR,
    setShowReportDateQR,
    showReportDateScanner,
    setShowReportDateScanner,
    scanningReportId,
    setScanningReportId,
    generateQRCodeDataURL: generateQRCodeDataURLHook,
    downloadQRCode: downloadQRCodeHook,
    initializeScannerHook,
    stopScannerHook,
    handleQRCodeFileUploadHook,
    processQRScanResult,
    statusCheckIntervalRef,
  } = useQRCode(getQRCodeBaseURL);

  // Local scanner instance state (needed for custom scanner logic)
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState(null);

  const {
    imageRotations,
    receivedImageRotations,
    completionImageRotations,
    reportImageRotations,
    setImageRotations,
    setReceivedImageRotations,
    setCompletionImageRotations,
    validateImageFile,
    handleImageUpload,
    handleRemoveImage,
    rotateFormImage,
    rotateReceivedImage,
    rotateCompletionImage,
    rotateReportImage,
  } = useImageHandling();

  const {
    isSubmitting,
    isSavingReceived,
    isSavingCompletion,
    submitReport,
    saveReceivedStatus,
    saveCompletionStatus,
    updateReport,
  } = useReportSubmission(user, fetchReports);

  // Received modal state
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [receivedReportId, setReceivedReportId] = useState(null);
  const [receivedImages, setReceivedImages] = useState([]);
  const [receivedNotes, setReceivedNotes] = useState("");
  const [shouldUpdateReceivedStatus, setShouldUpdateReceivedStatus] = useState(false);

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionReportId, setCompletionReportId] = useState(null);
  const [completionImages, setCompletionImages] = useState([]);
  const [completionNotes, setCompletionNotes] = useState("");

  // Image viewer hook
  const {
    imageViewer,
    savedImageRotations,
    openImageViewer,
    closeImageViewer,
    goToNextImage,
    goToPreviousImage,
    rotateImageViewer,
    zoomImageViewer,
    toggleZoom,
    handleImageMouseDown,
    handleImageMouseMove,
    handleImageMouseUp,
    handlePanMove,
    downloadImageViewer,
  } = useImageViewer();

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  // Edit image modals state
  const [showEditInitialImagesModal, setShowEditInitialImagesModal] = useState(false);
  const [showEditReceivedImagesModal, setShowEditReceivedImagesModal] = useState(false);
  const [showEditCompletionImagesModal, setShowEditCompletionImagesModal] = useState(false);
  const [editingImageReport, setEditingImageReport] = useState(null);
  const [editingImageType, setEditingImageType] = useState(null); // 'initial', 'received', 'completion'
  const [editingImages, setEditingImages] = useState([]);
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);
  const [editFormData, setEditFormData] = useState({
    color: [],
    buyerStyle: "",
    po: [],
    exFtyDate: [],
    factory: "",
    sendToHomeWashingDate: "",
  });
  const [editAvailableColors, setEditAvailableColors] = useState([]);
  const [editAvailablePOs, setEditAvailablePOs] = useState([]);
  const [editAvailableETDs, setEditAvailableETDs] = useState([]);
  const [showEditColorDropdown, setShowEditColorDropdown] = useState(false);
  const [showEditPODropdown, setShowEditPODropdown] = useState(false);
  const [showEditETDDropdown, setShowEditETDDropdown] = useState(false);


  // Tab state
  const [activeTab, setActiveTab] = useState("form"); // "form" or "reports"

  // normalizeImageUrl and getImageFilename are now imported from utils

  // Order_No autocomplete state
  const [orderNoSuggestions, setOrderNoSuggestions] = useState([]);
  const [showOrderNoSuggestions, setShowOrderNoSuggestions] = useState(false);
  const [isSearchingOrderNo, setIsSearchingOrderNo] = useState(false);

  // Debounce timer for auto-fetching colors when typing
  const colorFetchTimerRef = useRef(null);

  // Factory dropdown state
  const [factories, setFactories] = useState([]);
  const [isLoadingFactories, setIsLoadingFactories] = useState(false);

  // Filter states
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterFactory, setFilterFactory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPage, setFilterPage] = useState(1);
  const [filterLimit, setFilterLimit] = useState(10);

  // Reset page to 1 when filters (except page) change
  useEffect(() => {
    setFilterPage(1);
  }, [filterStartDate, filterEndDate, filterSearch, filterColor, filterFactory, filterStatus, filterLimit]);

  // Fetch reports when filters or page change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports({
        startDate: filterStartDate,
        endDate: filterEndDate,
        search: filterSearch,
        color: filterColor,
        factory: filterFactory,
        status: filterStatus,
        page: filterPage,
        limit: filterLimit
      });
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [filterStartDate, filterEndDate, filterSearch, filterColor, filterFactory, filterStatus, filterPage, filterLimit, fetchReports]);

  // Dropdown states
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showPODropdown, setShowPODropdown] = useState(false);
  const [showETDDropdown, setShowETDDropdown] = useState(false);

  // Handle input change with order data clearing
  const handleInputChange = (field, value) => {
    handleFormInputChange(field, value, (field, value, newData, prev) => {
      // Clear color, PO, and ETD when Order_No changes manually
      if (field === "ymStyle" && prev.ymStyle !== value) {
        newData.color = [];
        newData.po = [];
        newData.exFtyDate = [];
        resetOrderData();
      }
    });

    // If Order_No field is being changed, search for suggestions
    if (field === "ymStyle" && value.length >= 2) {
      searchOrderNo(value);

      // Clear any existing timer
      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
        colorFetchTimerRef.current = null;
      }

      // Auto-fetch colors when user stops typing (debounced)
      // Only fetch if it looks like a complete YM Style (min 4 chars, starts with letters)
      // Also check that value doesn't contain invalid characters like colons
      const trimmedValue = value.trim();
      if (trimmedValue.length >= 3 && /^[A-Za-z]/.test(trimmedValue) && !trimmedValue.includes(':')) {
        colorFetchTimerRef.current = setTimeout(() => {
          // Double-check the value hasn't changed while waiting
          // The trimmedValue is captured in closure, so we can safely use it
          if (trimmedValue.length >= 3 && !trimmedValue.includes(':')) {
            fetchOrderColors(trimmedValue, setFormData);
            fetchYorksysOrderETD(trimmedValue);
          }
        }, 800); // Wait 800ms after user stops typing
      }
    } else if (field === "ymStyle" && value.length < 2) {
      setOrderNoSuggestions([]);
      setShowOrderNoSuggestions(false);
      resetOrderData();

      // Clear timer if user deletes the value
      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
        colorFetchTimerRef.current = null;
      }
    }
  };

  // Search Order_No from dt_orders collection
  const searchOrderNo = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOrderNoSuggestions([]);
      setShowOrderNoSuggestions(false);
      return;
    }

    setIsSearchingOrderNo(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/washing/search-mono?term=${encodeURIComponent(searchTerm)}`
      );
      if (response.ok) {
        const suggestions = await response.json();
        setOrderNoSuggestions(suggestions);
        setShowOrderNoSuggestions(suggestions.length > 0);
      } else {
        setOrderNoSuggestions([]);
        setShowOrderNoSuggestions(false);
      }
    } catch (error) {
      console.error("Error searching Order_No:", error);
      setOrderNoSuggestions([]);
      setShowOrderNoSuggestions(false);
    } finally {
      setIsSearchingOrderNo(false);
    }
  };

  // Handle Order_No selection from suggestions
  const handleOrderNoSelect = async (orderNo) => {
    // Clear any pending color fetch timer since we're handling the fetch now
    if (colorFetchTimerRef.current) {
      clearTimeout(colorFetchTimerRef.current);
      colorFetchTimerRef.current = null;
    }

    // Use case-insensitive comparison to see if we're just confirming what's already typed
    const currentStyle = (formData.ymStyle || "").trim().toUpperCase();
    const selectedStyle = (orderNo || "").trim().toUpperCase();

    // If the selected order is the same as typed (even different casing),
    // just update casing and close suggestions without resetting data
    if (selectedStyle === currentStyle) {
      setFormData(prev => ({ ...prev, ymStyle: orderNo }));
      setShowOrderNoSuggestions(false);
      setOrderNoSuggestions([]);

      // Still trigger fetches (hook handles duplicate suppression case-insensitively now)
      fetchOrderColors(orderNo, setFormData);
      fetchYorksysOrderETD(orderNo);
      return;
    }

    // Truly new style selected: Clear color, PO, and ETD
    setFormData((prev) => ({
      ...prev,
      ymStyle: orderNo,
      color: [],
      po: [],
      exFtyDate: [],
    }));
    setShowOrderNoSuggestions(false);
    setOrderNoSuggestions([]);
    resetOrderData();

    // Fetch colors and ETD for the new style
    await fetchOrderColors(orderNo, setFormData);
    await fetchYorksysOrderETD(orderNo);
  };

  // Handle image upload - store File objects instead of base64
  const handleImageUploadWrapper = (files) => {
    handleImageUpload(files, (prev) => ({
      ...prev,
      images: [...prev.images, ...Array.from(files).filter(f => validateImageFile(f))],
    }));
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const currentCount = formData.images?.length || 0;
      const filesToHandle = Array.from(e.target.files);

      if (currentCount >= 5) {
        showToast.warning("Maximum of 5 images allowed per section.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const availableSlots = 5 - currentCount;
      const filesToAdd = filesToHandle.slice(0, availableSlots);

      if (filesToHandle.length > availableSlots) {
        showToast.info(`Only ${availableSlots} more image(s) can be added (Limit: 5).`);
      }

      const validFiles = filesToAdd.filter(f => validateImageFile(f));
      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...validFiles],
        }));
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle camera input change
  const handleCameraInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const currentCount = formData.images?.length || 0;
      if (currentCount >= 5) {
        showToast.warning("Maximum of 5 images allowed per section.");
        if (cameraInputRef.current) cameraInputRef.current.value = "";
        return;
      }

      const validFiles = Array.from(e.target.files).filter(f => validateImageFile(f));
      if (validFiles.length > 0) {
        // Since camera is usually one by one, we just check if it exceeds after adding
        if (currentCount + validFiles.length > 5) {
          showToast.warning("Total images exceed limit of 5. Only the first ones were added.");
        }

        const availableSlots = 5 - currentCount;
        const filesToAdd = validFiles.slice(0, availableSlots);

        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...filesToAdd],
        }));
      }
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    if ((formData.images?.length || 0) >= 5) {
      showToast.warning("Maximum of 5 images allowed (Initial Step).");
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  // Trigger camera input
  const triggerCameraInput = () => {
    if ((formData.images?.length || 0) >= 5) {
      showToast.warning("Maximum of 5 images allowed (Initial Step).");
      return;
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.setAttribute("capture", "environment");
      cameraInputRef.current.click();
    }
  };

  // Handle image remove
  const handleRemoveImageWrapper = (index) => {
    handleRemoveImage(
      index,
      formData.images,
      (updater) => setFormData((prevData) => ({
        ...prevData,
        images: typeof updater === 'function' ? updater(prevData.images) : updater
      })),
      imageRotations,
      setImageRotations
    );
  };

  // Image viewer functions are now in useImageViewer hook

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await submitReport(formData, () => {
      // Keep on the form tab for faster subsequent entries
      // setActiveTab("reports"); // Removed per request
      // Reset form
      resetForm({
        color: [],
        ymStyle: "",
        buyerStyle: "",
        po: [],
        exFtyDate: [],
        factory: "",
        sendToHomeWashingDate: new Date().toISOString().split("T")[0],
        images: [],
        notes: "",
      });
      setImageRotations({});
      setShowColorDropdown(false);
      setShowPODropdown(false);
      setShowETDDropdown(false);
      resetOrderData();
    });
  };

  // Handle delete report - open confirmation modal
  const handleDelete = (id) => {
    setReportToDelete(id);
    setShowDeleteConfirm(true);
  };

  // Confirm delete report
  const confirmDelete = async () => {
    if (!reportToDelete) return;
    const success = await deleteReport(reportToDelete);
    if (success) {
      setShowDeleteConfirm(false);
      setReportToDelete(null);
    }
  };

  // Helper function to normalize date to YYYY-MM-DD format for date input
  const normalizeDateForInput = (dateString) => {
    if (!dateString) return new Date().toISOString().split("T")[0];

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Try to parse the date and convert to YYYY-MM-DD
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    } catch (error) {
      console.error("Error parsing date:", error);
    }

    // If parsing fails, return today's date
    return new Date().toISOString().split("T")[0];
  };

  // Handle edit report - open modal and populate form
  const handleEditReport = async (report) => {
    setEditingReport(report);

    // Populate edit form with current report data
    setEditFormData({
      color: report.color || [],
      buyerStyle: report.buyerStyle || "",
      po: report.po || [],
      exFtyDate: report.exFtyDate || [],
      factory: report.factory || "",
      sendToHomeWashingDate: normalizeDateForInput(report.sendToHomeWashingDate),
    });

    // Fetch available options for the report's ymStyle
    if (report.ymStyle) {
      // Fetch colors
      try {
        const colorResponse = await fetch(
          `${API_BASE_URL}/api/washing/order-details/${encodeURIComponent(report.ymStyle)}`
        );
        if (colorResponse.ok) {
          const orderData = await colorResponse.json();
          if (orderData.colors && Array.isArray(orderData.colors)) {
            const colorNames = orderData.colors
              .map(c => c.original || c)
              .filter(Boolean);
            const uniqueColors = [...new Set(colorNames)];
            setEditAvailableColors(uniqueColors);
          } else {
            setEditAvailableColors([]);
          }
        }
      } catch (error) {
        console.error("Error fetching order colors for edit:", error);
        setEditAvailableColors([]);
      }

      // Fetch ETD and PO
      try {
        const etdResponse = await fetch(
          `${API_BASE_URL}/api/yorksys-orders/by-style/${encodeURIComponent(report.ymStyle)}`
        );
        if (etdResponse.ok) {
          const result = await etdResponse.json();
          if (result.success && result.data && result.data.SKUData && Array.isArray(result.data.SKUData) && result.data.SKUData.length > 0) {
            // Get ETDs
            const allETDs = result.data.SKUData
              .map(sku => sku.ETD)
              .filter(etd => etd && etd.trim() !== "")
              .map(etd => {
                let etdDate = etd.trim();
                try {
                  if (/^\d{4}-\d{2}-\d{2}$/.test(etdDate)) {
                    return etdDate;
                  } else {
                    const parsedDate = new Date(etdDate);
                    if (!isNaN(parsedDate.getTime())) {
                      return parsedDate.toISOString().split("T")[0];
                    }
                  }
                } catch (dateError) {
                  console.error("Error parsing ETD date:", dateError);
                }
                return etdDate;
              })
              .filter(Boolean);
            const uniqueETDs = [...new Set(allETDs)].sort();
            setEditAvailableETDs(uniqueETDs);

            // Get POs
            const allPOLines = result.data.SKUData
              .map(sku => sku.POLine)
              .filter(poline => poline && poline.trim() !== "")
              .map(poline => poline.trim());
            const uniquePOLines = [...new Set(allPOLines)];
            setEditAvailablePOs(uniquePOLines);
          } else {
            setEditAvailablePOs([]);
            setEditAvailableETDs([]);
          }
        } else if (etdResponse.status === 404) {
          // Order not found - this is expected if Order_No doesn't match moNo or style
          setEditAvailablePOs([]);
          setEditAvailableETDs([]);
        } else {
          // Other error status
          console.error(`Error fetching yorksys order for edit: ${etdResponse.status} ${etdResponse.statusText}`);
          setEditAvailablePOs([]);
          setEditAvailableETDs([]);
        }
      } catch (error) {
        // Only log non-connection errors (connection errors are handled elsewhere)
        if (!error.message.includes("Failed to fetch") && !error.message.includes("ERR_CONNECTION_REFUSED")) {
          console.error("Error fetching yorksys order for edit:", error);
        }
        setEditAvailablePOs([]);
        setEditAvailableETDs([]);
      }
    }

    setShowEditModal(true);
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editingReport) return;

    // Validate that at least one color is selected
    if (!editFormData.color || editFormData.color.length === 0) {
      showToast.warning("Please select at least one color");
      return;
    }

    try {
      const formDataToSubmit = new FormData();

      // Add form fields
      formDataToSubmit.append("color", JSON.stringify(editFormData.color || []));
      formDataToSubmit.append("buyerStyle", editFormData.buyerStyle || "");
      formDataToSubmit.append("po", JSON.stringify(editFormData.po || []));
      formDataToSubmit.append("exFtyDate", JSON.stringify(editFormData.exFtyDate || []));
      formDataToSubmit.append("factory", editFormData.factory || "");
      formDataToSubmit.append("sendToHomeWashingDate", editFormData.sendToHomeWashingDate || "");

      const reportId = editingReport._id || editingReport.id;
      const response = await fetch(`${API_BASE_URL}/api/report-washing/${reportId}`, {
        method: "PUT",
        body: formDataToSubmit,
      });

      const contentType = response.headers.get("content-type");
      let result;

      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        let errorMessage = `Server error (${response.status}): ${response.statusText}`;
        const preMatch = text.match(/<pre>([^<]+)<\/pre>/i);
        if (preMatch) {
          const errorText = preMatch[1];
          const errorMatch = errorText.match(/Error:\s*([^<]+)/i);
          if (errorMatch) {
            errorMessage = errorMatch[1].trim();
          } else {
            errorMessage = errorText.split('<br>')[0].trim();
          }
        }
        throw new Error(errorMessage);
      }

      if (response.ok && result.success) {
        showToast.success("Report updated successfully!");

        // Refresh reports list
        await fetchReports();

        // Close modal and reset
        setShowEditModal(false);
        setEditingReport(null);
        setEditFormData({
          color: [],
          buyerStyle: "",
          po: [],
          exFtyDate: [],
          factory: "",
          sendToHomeWashingDate: "",
        });
        setEditAvailableColors([]);
        setEditAvailablePOs([]);
        setEditAvailableETDs([]);
      } else {
        const errorMessage = result?.message || result?.error || `Server error (${response.status}): ${response.statusText}`;
        showToast.error(errorMessage);
        console.error("Error updating report:", result);
      }
    } catch (error) {
      console.error("Error updating report:", error);
      const errorMessage = error.message || "An error occurred while updating the report. Please try again.";
      showToast.error(errorMessage);
    }
  };

  // Initialize QR Code Scanner for a specific report
  const initializeScanner = async (reportId) => {
    try {
      if (html5QrCodeInstance) {
        await html5QrCodeInstance.stop();
        setHtml5QrCodeInstance(null);
      }

      const scannerId = `report-date-scanner-${reportId}`;
      const instance = new Html5Qrcode(scannerId);
      setHtml5QrCodeInstance(instance);
      setScanningReportId(reportId);

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        // Prefer back camera
        const backCamera = cameras.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("environment")
        );
        const cameraId = backCamera ? backCamera.id : cameras[0].id;

        await instance.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {
            // Check if scanned QR code is the Report Date QR
            // Support multiple formats:
            // 1. URL format: "http://...?scan=REPORT_ID" (from QR code)
            // 2. "REPORT_DATE_SCAN" (old format from UI)
            // 3. "REPORT_DATE_SCAN:REPORT_ID" (old format from PDF)
            let targetReportId = reportId;

            // Check if it's a URL format
            if (decodedText.includes("?scan=")) {
              try {
                const url = new URL(decodedText);
                const scanParam = url.searchParams.get("scan");
                if (scanParam) {
                  targetReportId = scanParam;
                } else {
                  showToast.warning("Invalid QR code. Missing report ID in URL.");
                  return;
                }
              } catch (error) {
                showToast.warning("Invalid QR code URL format.");
                return;
              }
            } else if (decodedText === "REPORT_DATE_SCAN") {
              // Old format - use current reportId from scanner context
              targetReportId = reportId;
            } else if (decodedText.startsWith("REPORT_DATE_SCAN:")) {
              // Old format from PDF - extract report ID from QR code
              const qrReportId = decodedText.split(":")[1];
              if (qrReportId) {
                targetReportId = qrReportId;
              }
            } else {
              // Not a valid report date QR code
              showToast.warning("Invalid QR code. Please scan the Report Date QR code.");
              return;
            }

            // Fetch current report to check status
            try {
              const reportResponse = await fetch(`${API_BASE_URL}/api/report-washing/${targetReportId}`);
              if (!reportResponse.ok) {
                showToast.error("Failed to fetch report details.");
                return;
              }

              const reportResult = await reportResponse.json();
              const currentReport = reportResult.data || reportResult;
              const currentStatus = currentReport.status || "pending";
              const currentDate = new Date().toISOString();
              const currentDateOnly = currentDate.split("T")[0];

              if (currentStatus === "pending" || !currentStatus) {
                // First scan - Open received modal (status will be updated when user saves)
                // Stop scanner and close all modals
                stopScanner();
                setShowReportDateScanner(null);
                setShowReportDateQR(null); // Close QR code modal if open

                // Open received modal for user to upload images and add notes
                setReceivedReportId(targetReportId);
                setReceivedImages([]);
                setReceivedNotes("");
                setShouldUpdateReceivedStatus(true); // Flag to update status when saving
                setShowReceivedModal(true);

                // Switch to Reports tab
                setActiveTab("reports");

                showToast.success(`QR Scan Success! Please add images and notes, then save to update status to "Received".`);
              } else if (currentStatus === "received") {
                // Second scan - Open completion modal
                stopScanner();
                setShowReportDateScanner(null);
                setShowReportDateQR(null); // Close QR code modal if open
                setCompletionReportId(targetReportId);
                setCompletionImages([]);
                setCompletionNotes("");
                setShowCompletionModal(true);
                // Switch to Reports tab
                setActiveTab("reports");
              } else if (currentStatus === "completed") {
                showToast.info("This report is already completed.");
                stopScanner();
                setShowReportDateScanner(null);
                // Switch to Reports tab to show the completed report
                setActiveTab("reports");
              } else {
                showToast.warning(`Report status is "${currentStatus}". Cannot process.`);
                // Switch to Reports tab anyway
                setActiveTab("reports");
              }
            } catch (error) {
              console.error("Error processing QR scan:", error);
              showToast.error("Failed to process QR code scan. Please try again.");
            }
          },
          (errorMessage) => {
            // Ignore scan errors (continuous scanning)
          }
        );
      }
    } catch (error) {
      console.error("Error initializing scanner:", error);
      showToast.error("Failed to initialize scanner. Please check camera permissions.");
      setShowReportDateScanner(null);
      setScanningReportId(null);
    }
  };

  // Stop QR Code Scanner (local version for custom logic)
  const stopScanner = useCallback(async () => {
    if (html5QrCodeInstance) {
      try {
        if (html5QrCodeInstance.isScanning) {
          await html5QrCodeInstance.stop();
        }
        await html5QrCodeInstance.clear();
      } catch (error) {
        console.error("Error stopping scanner:", error);
      } finally {
        setHtml5QrCodeInstance(null);
        setScanningReportId(null);
      }
    }
  }, [html5QrCodeInstance, setScanningReportId]);

  // Handle QR code file upload and scan
  const handleQRCodeFileUpload = async (event, reportId) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast.error("Invalid file type. Please upload an image file (PNG, JPG, JPEG, etc.).");
      event.target.value = "";
      return;
    }

    try {
      // Create a temporary container for Html5Qrcode (required by constructor)
      const tempContainer = document.createElement('div');
      tempContainer.id = 'temp-qr-file-scanner';
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);

      // Use Html5Qrcode to scan QR code from file
      const html5QrCode = new Html5Qrcode('temp-qr-file-scanner');
      let decodedText;

      try {
        decodedText = await html5QrCode.scanFile(file, false);
      } catch (scanError) {
        // Clean up temporary container
        document.body.removeChild(tempContainer);

        // Check if it's a QR code scanning error
        if (scanError && scanError.message) {
          if (scanError.message.includes("No QR code found") || scanError.message.includes("QR code parse error")) {
            showToast.error("No QR code found in the image. Please make sure the image contains a valid QR code and try again.");
          } else {
            showToast.error("Failed to scan QR code. The image may be corrupted or the QR code is not readable. Please try with a clearer image.");
          }
        } else {
          showToast.error("Failed to scan QR code from the image. Please ensure the image contains a valid QR code.");
        }
        event.target.value = "";
        return;
      }

      // Clean up temporary container
      document.body.removeChild(tempContainer);

      // Process the scanned QR code (same logic as camera scanner)
      let targetReportId = reportId;
      let isValidQRCode = false;

      if (decodedText.includes("?scan=")) {
        try {
          const url = new URL(decodedText);
          const scanParam = url.searchParams.get("scan");
          if (scanParam) {
            targetReportId = scanParam;
            isValidQRCode = true;
          } else {
            showToast.warning("This QR code is not valid. Please upload the QR code that is displayed in the current modal window.");
            event.target.value = "";
            return;
          }
        } catch (error) {
          showToast.warning("This QR code is not valid. Please upload the QR code that is displayed in the current modal window.");
          event.target.value = "";
          return;
        }
      } else if (decodedText === "REPORT_DATE_SCAN") {
        targetReportId = reportId;
        isValidQRCode = true;
      } else if (decodedText.startsWith("REPORT_DATE_SCAN:")) {
        const qrReportId = decodedText.split(":")[1];
        if (qrReportId) {
          targetReportId = qrReportId;
          isValidQRCode = true;
        }
      } else {
        showToast.warning("This QR code is not valid. Please upload the QR code that is displayed in the current modal window.");
        event.target.value = "";
        return;
      }

      // Check if the scanned QR code belongs to the current report
      if (isValidQRCode && targetReportId !== reportId) {
        showToast.error("This QR code is from a different report. Please upload the QR code that is displayed in the current modal window.");
        event.target.value = "";
        return;
      }

      // Fetch current report to check status
      let reportResponse;
      try {
        reportResponse = await fetch(`${API_BASE_URL}/api/report-washing/${targetReportId}`);
        if (!reportResponse.ok) {
          if (reportResponse.status === 404) {
            showToast.error("This QR code is from an old or deleted report. Please upload the QR code that is displayed in the current modal window.");
          } else {
            showToast.error("Unable to verify the report. Please try again.");
          }
          event.target.value = "";
          return;
        }
      } catch (fetchError) {
        console.error("Error fetching report:", fetchError);
        showToast.error("Network error. Failed to verify the report. Please check your connection and try again.");
        event.target.value = "";
        return;
      }

      const reportResult = await reportResponse.json();
      const currentReport = reportResult.data || reportResult;
      const currentStatus = currentReport.status || "pending";

      if (currentStatus === "pending" || !currentStatus) {
        setShowReportDateQR(null);
        setReceivedReportId(targetReportId);
        setReceivedImages([]);
        setReceivedNotes("");
        setShouldUpdateReceivedStatus(true);
        setShowReceivedModal(true);
        setActiveTab("reports");
        showToast.success(`QR Scan Success! Please add images and notes, then save to update status to "Received".`);
      } else if (currentStatus === "received") {
        setShowReportDateQR(null);
        setCompletionReportId(targetReportId);
        setCompletionImages([]);
        setCompletionNotes("");
        setShowCompletionModal(true);
        setActiveTab("reports");
      } else if (currentStatus === "completed") {
        showToast.info("This report is already completed.");
        setShowReportDateQR(null);
        setActiveTab("reports");
      } else {
        showToast.warning(`Report status is "${currentStatus}". Cannot process.`);
        setShowReportDateQR(null);
        setActiveTab("reports");
      }
    } catch (error) {
      console.error("Error scanning QR code from file:", error);

      // Provide more specific error messages based on error type
      if (error.message && error.message.includes("No QR code")) {
        showToast.error("No QR code found in the image. Please make sure the image contains a valid QR code and try again.");
      } else if (error.message && error.message.includes("parse")) {
        showToast.error("Failed to read the QR code. The image may be blurry or the QR code is damaged. Please try with a clearer image.");
      } else {
        showToast.error("Failed to scan QR code from file. Please make sure it's a valid QR code image file (PNG, JPG, JPEG) and try again.");
      }

      // Clean up temporary container if it exists
      const tempContainer = document.getElementById('temp-qr-file-scanner');
      if (tempContainer) {
        document.body.removeChild(tempContainer);
      }
    } finally {
      // Reset file input
      event.target.value = "";
    }
  };

  // Download QR code as image (wrapper for hook function)
  const downloadQRCode = downloadQRCodeHook;

  // Cleanup scanner on unmount or when scanner is closed
  useEffect(() => {
    if (!showReportDateScanner && html5QrCodeInstance) {
      stopScanner();
    }
    return () => {
      if (html5QrCodeInstance) {
        stopScanner();
      }
    };
  }, [showReportDateScanner, html5QrCodeInstance, stopScanner]);

  // Auto-close QR modal when status changes (scanned from another device)
  useEffect(() => {
    // Clear any existing interval
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }

    // If QR modal is open, start polling for status changes
    if (showReportDateQR) {
      const reportId = showReportDateQR;

      // Store initial status using ref to avoid re-renders
      const currentReport = reports.find(r => (r._id === reportId || r.id === reportId));
      const initialStatus = currentReport?.status || "pending";

      console.log(`[QR Polling] Started for report ${reportId}, initial status: ${initialStatus}`);

      // Use a ref to track status within the interval (avoids stale closure)
      let currentKnownStatus = initialStatus;

      // Poll every 2 seconds to check for status changes
      statusCheckIntervalRef.current = setInterval(async () => {
        try {
          console.log(`[QR Polling] Checking status for report ${reportId}...`);

          const response = await fetch(`${API_BASE_URL}/api/report-washing/${reportId}`);
          if (response.ok) {
            const result = await response.json();
            const report = result.data || result;
            const newStatus = report.status || "pending";

            console.log(`[QR Polling] Current status: ${currentKnownStatus}, New status: ${newStatus}`);

            // If status changed, close the QR modal and refresh
            if (newStatus !== currentKnownStatus) {
              console.log(`[QR Polling] âœ“ Status changed from ${currentKnownStatus} to ${newStatus} - closing QR modal`);

              // Clear interval first
              if (statusCheckIntervalRef.current) {
                clearInterval(statusCheckIntervalRef.current);
                statusCheckIntervalRef.current = null;
              }

              // Close QR modal
              setShowReportDateQR(null);
              setShowReportDateScanner(null);

              // Show notification
              showToast.success(`âœ“ QR Scanned! Report status updated to "${newStatus}"`);

              // Refresh reports
              await fetchReports();

              // Switch to reports tab
              setActiveTab("reports");

              // Scroll to updated report with highlight
              setTimeout(() => {
                const reportElement = document.querySelector(`[data-report-id="${reportId}"]`);
                if (reportElement) {
                  reportElement.scrollIntoView({ behavior: "smooth", block: "center" });
                  reportElement.style.transition = "background-color 0.5s ease";
                  reportElement.style.backgroundColor = "#d4edda";
                  setTimeout(() => {
                    reportElement.style.backgroundColor = "";
                  }, 2000);
                }
              }, 200);
            } else {
              console.log(`[QR Polling] No status change detected, continuing to poll...`);
            }
          } else {
            console.error(`[QR Polling] Failed to fetch report: ${response.status}`);
          }
        } catch (error) {
          console.error("[QR Polling] Error checking report status:", error);
        }
      }, 2000); // Check every 2 seconds
    }

    // Cleanup on unmount or when modal closes
    return () => {
      if (statusCheckIntervalRef.current) {
        console.log("[QR Polling] Cleanup - stopping interval");
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [showReportDateQR, reports]);


  // Handle URL-based QR code scan (when page is opened via QR code URL)
  useEffect(() => {
    const scanReportId = searchParams.get("scan");
    if (scanReportId) {
      // Switch to Reports tab immediately when scan parameter is detected
      setActiveTab("reports");

      if (reports.length > 0) {
        // Find the report
        const report = reports.find(r => (r._id === scanReportId || r.id === scanReportId));
        if (report) {
          // Process the scan automatically
          processQRScanFromURL(scanReportId);
          // Clear the URL parameter
          setSearchParams({});
        }
      }
    }
  }, [searchParams, reports]);

  // Process QR scan from URL - Enhanced handler for QR scan success
  const processQRScanFromURL = async (targetReportId) => {
    if (!targetReportId) return;

    try {
      // Show loading state
      showToast.info("Processing QR code...");

      // Fetch current report to check status
      const reportResponse = await fetch(`${API_BASE_URL}/api/report-washing/${targetReportId}`);
      if (!reportResponse.ok) {
        showToast.error("Failed to fetch report details.");
        return;
      }

      const reportResult = await reportResponse.json();
      const currentReport = reportResult.data || reportResult;
      const currentStatus = currentReport.status || "pending";
      const currentDate = new Date().toISOString();
      const currentDateOnly = currentDate.split("T")[0];

      if (currentStatus === "pending" || !currentStatus) {
        // First scan - Open received modal (status will be updated when user saves)
        // 1. Close QR code modal immediately
        setShowReportDateQR(null);
        setShowReportDateScanner(null);

        // 2. Stop scanner if running
        if (html5QrCodeInstance) {
          try {
            await html5QrCodeInstance.stop();
            setHtml5QrCodeInstance(null);
          } catch (err) {
            console.log("Scanner already stopped");
          }
        }
        setScanningReportId(null);

        // 3. Open received modal for user to upload images and add notes
        setReceivedReportId(targetReportId);
        setReceivedImages([]);
        setReceivedNotes("");
        setShouldUpdateReceivedStatus(true); // Flag to update status when saving
        setShowReceivedModal(true);

        // 4. Switch to Reports tab
        setActiveTab("reports");

        showToast.success(`âœ“ QR Scan Success! Please add images and notes, then save to update status to "Received".`);
      } else if (currentStatus === "received") {
        // Second scan - Open completion modal
        // 1. Close QR code modal
        setShowReportDateQR(null);
        setShowReportDateScanner(null);

        // 2. Stop scanner if running
        if (html5QrCodeInstance) {
          try {
            await html5QrCodeInstance.stop();
            setHtml5QrCodeInstance(null);
          } catch (err) {
            console.log("Scanner already stopped");
          }
        }
        setScanningReportId(null);

        // 3. Open completion modal
        setCompletionReportId(targetReportId);
        setCompletionImages([]);
        setCompletionNotes("");
        setShowCompletionModal(true);

        // 4. Switch to Reports tab
        setActiveTab("reports");

        showToast.success("QR Scan Success! Please complete the report details.");
      } else if (currentStatus === "completed") {
        // Close modal and show info
        setShowReportDateQR(null);
        setShowReportDateScanner(null);

        showToast.info("This report is already completed.");

        // Switch to Reports tab to show the completed report
        setActiveTab("reports");

        // Scroll to the report
        setTimeout(() => {
          const reportElement = document.querySelector(`[data-report-id="${targetReportId}"]`);
          if (reportElement) {
            reportElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);
      } else {
        // Close modal for any other status
        setShowReportDateQR(null);
        setShowReportDateScanner(null);

        showToast.warning(`Report status is "${currentStatus}". Cannot process.`);

        // Switch to Reports tab anyway
        setActiveTab("reports");
      }
    } catch (error) {
      console.error("Error processing QR scan:", error);
      showToast.error("Failed to process QR code scan. Please try again.");

      // Close modal on error
      setShowReportDateQR(null);
      setShowReportDateScanner(null);
    }
  };

  // Handle received image upload
  const handleReceivedImageUpload = (files) => {
    if (!files || files.length === 0) return;

    const currentCount = receivedImages.length;
    if (currentCount >= 5) {
      showToast.warning("Maximum of 5 images allowed per section.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const filesArray = Array.from(files);
    const availableSlots = 5 - currentCount;
    const filesToProcess = filesArray.slice(0, availableSlots);

    if (filesArray.length > availableSlots) {
      showToast.info(`Only ${availableSlots} more image(s) can be added (Limit: 5).`);
    }

    filesToProcess.forEach((file) => {
      const isValidType = allowedTypes.includes(file.type.toLowerCase());
      if (!isValidType) {
        showToast.error(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
        return;
      }
      setReceivedImages((prev) => [...prev, file]);
    });
  };

  // Handle received form submit - Save images and notes for received status
  const handleReceivedSubmit = async () => {
    if (!receivedReportId) return;

    const success = await saveReceivedStatus(
      receivedReportId,
      receivedImages,
      receivedNotes,
      shouldUpdateReceivedStatus,
      (reportId) => {
        // 1. Close received modal immediately
        setShowReceivedModal(false);

        // 2. Close QR code modal if it's open for this report
        if (showReportDateQR === reportId) {
          setShowReportDateQR(null);
          setShowReportDateScanner(null);
        }

        // 3. Reset received form data
        setReceivedReportId(null);
        setReceivedImages([]);
        setReceivedNotes("");
        setShouldUpdateReceivedStatus(false); // Clear the flag
        setReceivedImageRotations({}); // Clear received image rotations

        // 4. Scroll to updated report with visual feedback
        setTimeout(() => {
          const reportElement = document.querySelector(`[data-report-id="${reportId}"]`);
          if (reportElement) {
            reportElement.scrollIntoView({ behavior: "smooth", block: "center" });
            // Add a temporary highlight effect
            reportElement.style.transition = "background-color 0.5s ease";
            reportElement.style.backgroundColor = "#d4edda";
            setTimeout(() => {
              reportElement.style.backgroundColor = "";
            }, 2000);
          }
        }, 200);
      }
    );
  };

  // Handle completion image upload
  const handleCompletionImageUpload = (files) => {
    if (!files || files.length === 0) return;

    const currentCount = completionImages.length;
    if (currentCount >= 5) {
      showToast.warning("Maximum of 5 images allowed per section.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const filesArray = Array.from(files);
    const availableSlots = 5 - currentCount;
    const filesToProcess = filesArray.slice(0, availableSlots);

    if (filesArray.length > availableSlots) {
      showToast.info(`Only ${availableSlots} more image(s) can be added (Limit: 5).`);
    }

    filesToProcess.forEach((file) => {
      const isValidType = allowedTypes.includes(file.type.toLowerCase());
      if (!isValidType) {
        showToast.error(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
        return;
      }
      setCompletionImages((prev) => [...prev, file]);
    });
  };

  // Handle completion form submit - Enhanced with better feedback
  const handleCompletionSubmit = async () => {
    if (!completionReportId) return;

    const success = await saveCompletionStatus(
      completionReportId,
      completionImages,
      completionNotes,
      (reportId) => {
        // 1. Close completion modal immediately
        setShowCompletionModal(false);

        // 2. Close QR code modal if it's open for this report
        if (showReportDateQR === reportId) {
          setShowReportDateQR(null);
          setShowReportDateScanner(null);
        }

        // 3. Reset completion form data
        setCompletionReportId(null);
        setCompletionImages([]);
        setCompletionNotes("");
        setCompletionImageRotations({}); // Clear completion image rotations

        // 4. Scroll to updated report with visual feedback
        setTimeout(() => {
          const reportElement = document.querySelector(`[data-report-id="${reportId}"]`);
          if (reportElement) {
            reportElement.scrollIntoView({ behavior: "smooth", block: "center" });
            // Add a temporary highlight effect
            reportElement.style.transition = "background-color 0.5s ease";
            reportElement.style.backgroundColor = "#d1ecf1";
            setTimeout(() => {
              reportElement.style.backgroundColor = "";
            }, 2000);
          }
        }, 200);
      }
    );
  };

  // Handle edit initial images
  const handleEditInitialImages = (report) => {
    setEditingImageReport(report);
    setEditingImageType('initial');
    setEditingImages(report.images || []);
    setShowEditInitialImagesModal(true);
  };

  // Handle edit received images
  const handleEditReceivedImages = (report) => {
    setEditingImageReport(report);
    setEditingImageType('received');
    setEditingImages(report.receivedImages || []);
    setShowEditReceivedImagesModal(true);
  };

  // Handle edit completion images
  const handleEditCompletionImages = (report) => {
    setEditingImageReport(report);
    setEditingImageType('completion');
    setEditingImages(report.completionImages || []);
    setShowEditCompletionImagesModal(true);
  };

  // Handle image upload for edit modals
  const handleEditImageUpload = (files, type) => {
    if (!files || files.length === 0) return;

    const currentCount = editingImages.length;
    if (currentCount >= 5) {
      showToast.warning("Maximum of 5 images allowed per section.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const filesArray = Array.from(files);
    const availableSlots = 5 - currentCount;
    const filesToProcess = filesArray.slice(0, availableSlots);

    if (filesArray.length > availableSlots) {
      showToast.info(`Only ${availableSlots} more image(s) can be added (Limit: 5).`);
    }

    filesToProcess.forEach((file) => {
      const isValidType = allowedTypes.includes(file.type.toLowerCase());
      if (!isValidType) {
        showToast.error(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
        return;
      }
      setEditingImages((prev) => [...prev, file]);
    });
  };

  // Handle remove image from edit modal
  const handleRemoveEditImage = (index) => {
    setEditingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle update images
  const handleUpdateImages = async () => {
    if (!editingImageReport || !editingImageType) return;

    const reportId = editingImageReport._id || editingImageReport.id;
    setIsUpdatingImages(true);

    try {
      const formDataToSubmit = new FormData();

      // Determine which field name to use based on type
      const fieldName = editingImageType === 'initial'
        ? 'images'
        : editingImageType === 'received'
          ? 'receivedImages'
          : 'completionImages';

      // Separate new File objects from existing URLs
      const newImageFiles = editingImages.filter(img => img instanceof File);
      const existingImageUrls = editingImages.filter(img => typeof img === 'string');

      // Add new images (File objects) - these will be uploaded
      newImageFiles.forEach((file) => {
        formDataToSubmit.append(fieldName, file);
      });

      // Send the list of existing URLs to keep (so backend knows which ones to preserve)
      // We'll send this as a JSON string in a separate field
      if (existingImageUrls.length > 0) {
        formDataToSubmit.append(`${fieldName}Urls`, JSON.stringify(existingImageUrls));
      }

      const response = await fetch(`${API_BASE_URL}/api/report-washing/${reportId}`, {
        method: "PUT",
        body: formDataToSubmit,
      });

      const contentType = response.headers.get("content-type");
      let result;

      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        let errorMessage = `Server error (${response.status}): ${response.statusText}`;
        const preMatch = text.match(/<pre>([^<]+)<\/pre>/i);
        if (preMatch) {
          const errorText = preMatch[1];
          const errorMatch = errorText.match(/Error:\s*([^<]+)/i);
          if (errorMatch) {
            errorMessage = errorMatch[1].trim();
          } else {
            errorMessage = errorText.split('<br>')[0].trim();
          }
        }
        throw new Error(errorMessage);
      }

      if (response.ok && result.success) {
        showToast.success("Images updated successfully!");

        // Close modal
        setShowEditInitialImagesModal(false);
        setShowEditReceivedImagesModal(false);
        setShowEditCompletionImagesModal(false);
        setEditingImageReport(null);
        setEditingImageType(null);
        setEditingImages([]);

        // Refresh reports
        await fetchReports();
      } else {
        const errorMessage = result?.message || result?.error || `Server error (${response.status}): ${response.statusText}`;
        showToast.error(errorMessage);
        console.error("Error updating images:", result);
      }
    } catch (error) {
      console.error("Error updating images:", error);
      const errorMessage = error.message || "An error occurred while updating images. Please try again.";
      showToast.error(errorMessage);
    } finally {
      setIsUpdatingImages(false);
    }
  };

  // Generate QR code as data URL for PDF using QRCodeCanvas (wrapper for hook function)
  const generateQRCodeDataURL = async (value, size = 100) => {
    return generateQRCodeDataURLHook(value, size);
  };

  // Legacy function - now uses hook
  const generateQRCodeDataURLLegacy = async (value, size = 100) => {
    // Increase resolution for the data URL to ensure it's sharp in PDF/Print
    const highResSize = 1024;

    return new Promise((resolve) => {
      try {
        // Create a temporary container
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.width = `${highResSize}px`;
        container.style.height = `${highResSize}px`;
        container.style.background = "white";
        document.body.appendChild(container);

        // Dynamically import react-dom/client and render QR code
        import("react-dom/client").then(({ createRoot }) => {
          const root = createRoot(container);
          root.render(
            React.createElement(QRCodeCanvas, {
              value: value,
              size: highResSize,
              level: "H",
              includeMargin: true,
              imageSettings: {
                src: "/assets/Home/YQMSLogoEdit.png",
                x: undefined,
                y: undefined,
                height: highResSize * 0.2,
                width: highResSize * 0.2,
                excavate: true,
              }
            })
          );

          // Wait for QR code to render, then get canvas data
          setTimeout(() => {
            const canvas = container.querySelector("canvas");
            if (canvas) {
              const dataURL = canvas.toDataURL("image/png");
              root.unmount();
              document.body.removeChild(container);
              resolve(dataURL);
            } else {
              root.unmount();
              document.body.removeChild(container);
              resolve(null);
            }
          }, 300);
        }).catch((error) => {
          console.error("Error importing react-dom/client:", error);
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
          resolve(null);
        });
      } catch (error) {
        console.error("Error generating QR code:", error);
        resolve(null);
      }
    });
  };

  // Handle Print PDF for single report
  const handlePrintPDF = async (report) => {
    const reportId = report._id || report.id;

    // Prevent multiple clicks
    if (printingReportId === reportId) {
      return;
    }

    setPrintingReportId(reportId);

    try {
      // Generate QR code data URL for the report - use URL format for mobile compatibility
      const qrCodeValue = `${getQRCodeBaseURL()}/Launch-washing-machine-test?scan=${reportId}`;
      const qrCodeDataURL = await generateQRCodeDataURL(qrCodeValue, 100);

      const blob = await pdf(<WashingMachineTestPDF report={report} apiBaseUrl={API_BASE_URL} qrCodeDataURL={qrCodeDataURL} savedImageRotations={savedImageRotations} />).toBlob();
      const url = URL.createObjectURL(blob);

      // Clean up any existing print iframes first
      const existingIframes = document.querySelectorAll('iframe[id^="print-iframe-"]');
      existingIframes.forEach(iframe => {
        try {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      });

      // Create a temporary iframe for printing
      const iframeId = `print-iframe-${Date.now()}`;
      const iframe = document.createElement("iframe");
      iframe.id = iframeId;
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";

      let printTriggered = false;
      let cleanupDone = false;

      // Function to cleanup
      const cleanup = () => {
        if (cleanupDone) return;
        cleanupDone = true;

        setTimeout(() => {
          try {
            if (iframe && iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          } catch (e) {
            // Ignore cleanup errors
          }
          // Revoke URL after print dialog has been shown
          setTimeout(() => {
            try {
              URL.revokeObjectURL(url);
            } catch (e) {
              // Ignore URL revocation errors
            }
          }, 2000);
        }, 500);
      };

      // Function to trigger print and cleanup
      const triggerPrint = () => {
        if (printTriggered) return;
        printTriggered = true;

        try {
          // Wait a bit more to ensure iframe content is fully loaded
          setTimeout(() => {
            if (iframe && iframe.contentWindow) {
              try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                cleanup();
              } catch (printError) {
                console.error("Error calling print:", printError);
                cleanup();
              }
            } else {
              cleanup();
            }
          }, 200);
        } catch (error) {
          console.error("Error printing:", error);
          cleanup();
        }
      };

      // Wait for iframe to load the PDF
      iframe.onload = () => {
        // Give more time for PDF to fully render
        setTimeout(triggerPrint, 300);
      };

      // Add error handler
      iframe.onerror = () => {
        console.error("Iframe load error");
        cleanup();
      };

      // Append iframe to DOM first
      document.body.appendChild(iframe);

      // Set the PDF URL after iframe is in DOM
      iframe.src = url;

      // Fallback timeout in case onload doesn't fire
      setTimeout(() => {
        if (!printTriggered) {
          try {
            if (iframe && iframe.contentDocument) {
              const readyState = iframe.contentDocument.readyState;
              if (readyState === "complete" || readyState === "interactive") {
                triggerPrint();
              } else {
                // If still loading, wait a bit more
                setTimeout(() => {
                  if (!printTriggered && iframe && iframe.contentDocument) {
                    triggerPrint();
                  }
                }, 500);
              }
            } else {
              // If iframe doesn't have contentDocument, try anyway
              triggerPrint();
            }
          } catch (e) {
            console.error("Error in fallback:", e);
            cleanup();
          }
        }
      }, 2000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast.error("Failed to generate PDF. Please try again.");
    } finally {
      // Reset printing state after a delay
      setTimeout(() => {
        setPrintingReportId(null);
      }, 3000);
    }
  };

  // Handle Download PDF for single report
  const handleDownloadPDF = async (report) => {
    try {
      // Generate QR code data URL for the report
      const reportId = report._id || report.id;
      const qrCodeValue = `REPORT_DATE_SCAN:${reportId}`;
      const qrCodeDataURL = await generateQRCodeDataURL(qrCodeValue, 100);

      const blob = await pdf(<WashingMachineTestPDF report={report} apiBaseUrl={API_BASE_URL} qrCodeDataURL={qrCodeDataURL} savedImageRotations={savedImageRotations} />).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Washing_Test_Report_${report.ymStyle || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      setTimeout(() => URL.revokeObjectURL(url), 100);

      showToast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast.error("Failed to generate PDF. Please try again.");
    }
  };

  // Handle Export Excel for single report
  const handleExportExcel = async (report) => {
    try {
      await generateWashingMachineTestExcel(report, API_BASE_URL);
      showToast.success("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      showToast.error("Failed to export Excel. Please try again.");
    }
  };

  // Fetch factories from subcon-sewing-factories-manage
  useEffect(() => {
    const fetchFactories = async () => {
      setIsLoadingFactories(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage`
        );
        if (response.ok) {
          const data = await response.json();
          setFactories(data);
        } else {
          console.error("Failed to fetch factories");
          showToast.error("Failed to load factories. Please check your connection.");
        }
      } catch (error) {
        console.error("Error fetching factories:", error);
        // Check if it's a connection error
        if (error.message.includes("Failed to fetch") || error.message.includes("ERR_CONNECTION_REFUSED")) {
          showToast.error(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend server is running on port 5001.`);
        } else {
          showToast.error("Error loading factories. Please try again.");
        }
      } finally {
        setIsLoadingFactories(false);
      }
    };

    fetchFactories();
    fetchFactories();
    // fetchReports(); // Handled by filter useEffect

    // Cleanup timer on unmount
    return () => {
      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
      }
    };
  }, []);

  // Close color, PO, and ETD dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColorDropdown && !event.target.closest('.color-dropdown-container')) {
        setShowColorDropdown(false);
      }
      if (showPODropdown && !event.target.closest('.po-dropdown-container')) {
        setShowPODropdown(false);
      }
      if (showETDDropdown && !event.target.closest('.etd-dropdown-container')) {
        setShowETDDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorDropdown, showPODropdown, showETDDropdown]);

  // Close edit color, PO, and ETD dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEditColorDropdown && !event.target.closest('.color-dropdown-container')) {
        setShowEditColorDropdown(false);
      }
      if (showEditPODropdown && !event.target.closest('.po-dropdown-container')) {
        setShowEditPODropdown(false);
      }
      if (showEditETDDropdown && !event.target.closest('.etd-dropdown-container')) {
        setShowEditETDDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditColorDropdown, showEditPODropdown, showEditETDDropdown]);

  // Close QR code modal if report becomes completed
  useEffect(() => {
    if (showReportDateQR) {
      const report = reports.find(r => (r._id === showReportDateQR || r.id === showReportDateQR));
      if (report && report.status === "completed") {
        setShowReportDateQR(null);
      }
    }
  }, [reports, showReportDateQR]);

  // Keyboard and wheel support is now handled in ImageViewerModal component

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
        <div className="p-4 md:p-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Launch Washing Machine Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Report Washing - Enter test details and view submitted reports
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("form")}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === "form"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  New Report
                </span>
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === "reports"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Reports ({pagination.totalRecords})
                </span>
              </button>
            </nav>
          </div>

          {/* Form Section */}
          {activeTab === "form" && (
            <FormSection
              formData={formData}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              orderNoSuggestions={orderNoSuggestions}
              showOrderNoSuggestions={showOrderNoSuggestions}
              setShowOrderNoSuggestions={setShowOrderNoSuggestions}
              isSearchingOrderNo={isSearchingOrderNo}
              handleOrderNoSelect={handleOrderNoSelect}
              searchOrderNo={searchOrderNo}
              fetchOrderColors={fetchOrderColors}
              fetchYorksysOrderETD={fetchYorksysOrderETD}
              availableColors={availableColors}
              isLoadingColors={isLoadingColors}
              showColorDropdown={showColorDropdown}
              setShowColorDropdown={setShowColorDropdown}
              availablePOs={availablePOs}
              showPODropdown={showPODropdown}
              setShowPODropdown={setShowPODropdown}
              availableETDs={availableETDs}
              showETDDropdown={showETDDropdown}
              setShowETDDropdown={setShowETDDropdown}
              factories={factories}
              isLoadingFactories={isLoadingFactories}
              handleFileInputChange={handleFileInputChange}
              handleCameraInputChange={handleCameraInputChange}
              triggerFileInput={triggerFileInput}
              triggerCameraInput={triggerCameraInput}
              handleRemoveImage={handleRemoveImageWrapper}
              fileInputRef={fileInputRef}
              cameraInputRef={cameraInputRef}
              imageRotations={imageRotations}
            />
          )}

          {/* Form Section is now in FormSection component */}

          {/* Submitted Reports Section */}
          {activeTab === "reports" && (
            <ReportsList
              reports={reports}
              isLoadingReports={isLoadingReports}
              onRefresh={() => fetchReports({
                startDate: filterStartDate,
                endDate: filterEndDate,
                search: filterSearch,
                color: filterColor,
                factory: filterFactory,
                status: filterStatus,
                page: filterPage,
                limit: 10
              })}
              expandedReports={expandedReports}
              onToggleReport={toggleReport}
              onPrintPDF={handlePrintPDF}
              onDownloadPDF={handleDownloadPDF}
              onExportExcel={handleExportExcel}
              onEdit={handleEditReport}
              onDelete={handleDelete}
              onShowQRCode={(reportId) => setShowReportDateQR(showReportDateQR === reportId ? null : reportId)}
              printingReportId={printingReportId}
              savedImageRotations={savedImageRotations}
              openImageViewer={openImageViewer}
              setActiveTab={setActiveTab}
              onEditInitialImages={handleEditInitialImages}
              onEditReceivedImages={handleEditReceivedImages}
              onEditCompletionImages={handleEditCompletionImages}
              // Filter props
              filterStartDate={filterStartDate}
              setFilterStartDate={setFilterStartDate}
              filterEndDate={filterEndDate}
              setFilterEndDate={setFilterEndDate}
              filterSearch={filterSearch}
              setFilterSearch={setFilterSearch}
              filterColor={filterColor}
              setFilterColor={setFilterColor}
              filterFactory={filterFactory}
              setFilterFactory={setFilterFactory}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterPage={filterPage}
              setFilterPage={setFilterPage}
              filterLimit={filterLimit}
              setFilterLimit={setFilterLimit}
              pagination={pagination}
              factories={factories}
            />
          )}





          {/* Modals */}
          <ReceivedModal
            isOpen={showReceivedModal}
            onClose={() => {
              setShowReceivedModal(false);
              setReceivedReportId(null);
              setReceivedImages([]);
              setReceivedNotes("");
              setShouldUpdateReceivedStatus(false);
              setReceivedImageRotations({});
            }}
            receivedImages={receivedImages}
            setReceivedImages={setReceivedImages}
            receivedNotes={receivedNotes}
            setReceivedNotes={setReceivedNotes}
            receivedImageInputRef={receivedImageInputRef}
            handleReceivedImageUpload={handleReceivedImageUpload}
            handleReceivedSubmit={handleReceivedSubmit}
            isSavingReceived={isSavingReceived}
            receivedImageRotations={receivedImageRotations}
            setReceivedImageRotations={setReceivedImageRotations}
          />

          <CompletionModal
            isOpen={showCompletionModal}
            onClose={() => {
              setShowCompletionModal(false);
              setCompletionReportId(null);
              setCompletionImages([]);
              setCompletionNotes("");
              setCompletionImageRotations({});
            }}
            completionImages={completionImages}
            setCompletionImages={setCompletionImages}
            completionNotes={completionNotes}
            setCompletionNotes={setCompletionNotes}
            completionImageInputRef={completionImageInputRef}
            handleCompletionImageUpload={handleCompletionImageUpload}
            handleCompletionSubmit={handleCompletionSubmit}
            isSavingCompletion={isSavingCompletion}
            completionImageRotations={completionImageRotations}
            setCompletionImageRotations={setCompletionImageRotations}
          />

          <EditReportModal
            isOpen={showEditModal}
            editingReport={editingReport}
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            editAvailableColors={editAvailableColors}
            editAvailablePOs={editAvailablePOs}
            editAvailableETDs={editAvailableETDs}
            showEditColorDropdown={showEditColorDropdown}
            setShowEditColorDropdown={setShowEditColorDropdown}
            showEditPODropdown={showEditPODropdown}
            setShowEditPODropdown={setShowEditPODropdown}
            showEditETDDropdown={showEditETDDropdown}
            setShowEditETDDropdown={setShowEditETDDropdown}
            factories={factories}
            isLoadingFactories={isLoadingFactories}
            onClose={() => {
              setShowEditModal(false);
              setEditingReport(null);
              setEditFormData({
                color: [],
                buyerStyle: "",
                po: [],
                exFtyDate: [],
                factory: "",
                sendToHomeWashingDate: "",
              });
              setEditAvailableColors([]);
              setEditAvailablePOs([]);
              setEditAvailableETDs([]);
            }}
            onSubmit={handleEditSubmit}
          />

          <DeleteConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => {
              setShowDeleteConfirm(false);
              setReportToDelete(null);
            }}
            onConfirm={confirmDelete}
          />

          <QRCodeModal
            isOpen={!!showReportDateQR}
            reportId={showReportDateQR}
            onClose={() => setShowReportDateQR(null)}
            onDownloadQRCode={downloadQRCode}
            onUploadQRCode={handleQRCodeFileUpload}
            getQRCodeBaseURL={getQRCodeBaseURL}
            fileInputRef={fileInputRef}
          />

          <QRScannerModal
            isOpen={!!showReportDateScanner}
            reportId={showReportDateScanner}
            onClose={() => {
              stopScanner();
              setShowReportDateScanner(null);
            }}
            scannerElementId={showReportDateScanner ? `report-date-scanner-${showReportDateScanner}` : ""}
          />


          {/* Edit Initial Images Modal */}
          <EditImagesModal
            isOpen={showEditInitialImagesModal}
            onClose={() => {
              setShowEditInitialImagesModal(false);
              setEditingImageReport(null);
              setEditingImageType(null);
              setEditingImages([]);
            }}
            title={`Edit Initial Images - ${editingImageReport?.ymStyle || "N/A"}`}
            images={editingImages}
            onRemoveImage={handleRemoveEditImage}
            onUploadImage={(files) => handleEditImageUpload(files, 'initial')}
            onSave={handleUpdateImages}
            isSaving={isUpdatingImages}
            saveButtonColor="blue"
          />

          {/* Edit Received Images Modal */}
          <EditImagesModal
            isOpen={showEditReceivedImagesModal}
            onClose={() => {
              setShowEditReceivedImagesModal(false);
              setEditingImageReport(null);
              setEditingImageType(null);
              setEditingImages([]);
            }}
            title={`Edit Received Images - ${editingImageReport?.ymStyle || "N/A"}`}
            images={editingImages}
            onRemoveImage={handleRemoveEditImage}
            onUploadImage={(files) => handleEditImageUpload(files, 'received')}
            onSave={handleUpdateImages}
            isSaving={isUpdatingImages}
            saveButtonColor="yellow"
          />

          {/* Edit Completion Images Modal */}
          <EditImagesModal
            isOpen={showEditCompletionImagesModal}
            onClose={() => {
              setShowEditCompletionImagesModal(false);
              setEditingImageReport(null);
              setEditingImageType(null);
              setEditingImages([]);
            }}
            title={`Edit Completion Images - ${editingImageReport?.ymStyle || "N/A"}`}
            images={editingImages}
            onRemoveImage={handleRemoveEditImage}
            onUploadImage={(files) => handleEditImageUpload(files, 'completion')}
            onSave={handleUpdateImages}
            isSaving={isUpdatingImages}
            saveButtonColor="green"
          />

          {/* Image Viewer Modal */}
          <ImageViewerModal
            isOpen={imageViewer.isOpen}
            imageUrl={imageViewer.imageUrl}
            imageTitle={imageViewer.imageTitle}
            images={imageViewer.images}
            currentIndex={imageViewer.currentIndex}
            rotation={imageViewer.rotation}
            zoom={imageViewer.zoom}
            panX={imageViewer.panX}
            panY={imageViewer.panY}
            isDragging={imageViewer.isDragging}
            onClose={closeImageViewer}
            onNextImage={goToNextImage}
            onPreviousImage={goToPreviousImage}
            onRotate={rotateImageViewer}
            onZoom={zoomImageViewer}
            onPanStart={handleImageMouseDown}
            onPanMove={handleImageMouseMove}
            onPanEnd={handleImageMouseUp}
            onToggleZoom={toggleZoom}
            onDownload={downloadImageViewer}
          />

        </div>
      </div>
    </div>
  );
};

export default LaundryWashingMachineTest;
