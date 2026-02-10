import React, { useState, useRef, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import { useSearchParams } from "react-router-dom";
import { HiDocumentAdd, HiClipboardList } from "react-icons/hi";
import {
  MdWarehouse,
  MdLocalLaundryService,
  MdOutlineDeviceThermostat,
  MdOutlineImagesearchRoller,
  MdOutlineExpand,
  MdAssignmentInd
} from "react-icons/md";
import { Select, Checkbox } from "antd";
import axios from "axios";
import { API_BASE_URL, QR_CODE_BASE_URL } from "../../config.js";
import { pdf } from "@react-pdf/renderer";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";
import WashingMachineTestPDF from "../components/inspection/WashingTesting/WashingMachineTestPDF";
import generateWashingMachineTestExcel from "../components/inspection/WashingTesting/WashingMachineTestExcel";
import {
  ImageViewerModal,
  useImageViewer,
  FormSection,
  DynamicFormSection,
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
  // Constants
  getQRCodeBaseURL,
  getCurrentDate,
  IMAGE_LIMITS,
  TABS,
  REPORT_TYPES,
  getReportTypeConfig,
  getImageFilename,
  getInitialFormData,
  getCompletionNotesField,
  normalizeDateForInput, // Added import
  // Edit handlers (only used ones)
  prepareEditFormData,
  handleEditFormSubmit,
  // Order handlers
  handleOrderNoSearch,
  handleOrderNoSelection,
  shouldAutoFetchColors,
  // Image handlers (being used)
  handleFileInputChange as handleFileInputChangeHandler,
  handleCameraInputChange as handleCameraInputChangeHandler,
  triggerFileInput as triggerFileInputHandler,
  triggerCameraInput as triggerCameraInputHandler,
} from "../components/inspection/WashingTesting/lib";
import showToast from "../utils/toast";

const LaundryWashingMachineTest = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateValue = getCurrentDate(); // Use helper instead of inline code
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const receivedImageInputRef = useRef(null);
  const completionImageInputRef = useRef(null);

  // Initialize custom hooks
  const initialFormData = getInitialFormData(REPORT_TYPES.HOME_WASH);

  const { formData, setFormData, handleInputChange: handleFormInputChange, resetForm } = useFormState(initialFormData);

  // Initialize Socket.IO connection once for the component
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(API_BASE_URL);

    newSocket.on("connect", () => {
      console.log("✅ Socket connected to:", API_BASE_URL);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Standard Reports Hook - share socket
  const reportsHook = useReports(socket);
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
  } = reportsHook;

  // Warehouse Reports Hook - share socket
  const whReportsHook = useReports(socket);
  const {
    reports: whReports,
    isLoadingReports: isLoadingWhReports,
    expandedReports: whExpandedReports,
    printingReportId: whPrintingReportId,
    setPrintingReportId: setWhPrintingReportId,
    fetchReports: fetchWhReports,
    deleteReport: deleteWhReport,
    toggleReport: toggleWhReport,
    pagination: whPagination,
  } = whReportsHook;

  const {
    availableColors,
    availablePOs,
    availableETDs,
    availableSizes,
    fabrication,
    season,
    styleDescription,
    custStyle,
    isLoadingColors,
    isLoadingSpecs,
    fetchOrderColors,
    fetchYorksysOrderETD,
    fetchAnfSpecs,
    resetOrderData,
    anfSpecs,
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
    printQRCode,
    statusCheckIntervalRef,
  } = useQRCode(() => getQRCodeBaseURL(QR_CODE_BASE_URL)); // Use helper function

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
  } = useImageHandling();

  // Standard Filter states
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterFactory, setFilterFactory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPage, setFilterPage] = useState(1);
  const [filterLimit, setFilterLimit] = useState(10);
  const [filterReportType, setFilterReportType] = useState("");

  // Warehouse Filter states
  const [whFilterStartDate, setWhFilterStartDate] = useState("");
  const [whFilterEndDate, setWhFilterEndDate] = useState("");
  const [whFilterSearch, setWhFilterSearch] = useState("");
  const [whFilterColor, setWhFilterColor] = useState("");
  const [whFilterFactory, setWhFilterFactory] = useState("");
  const [whFilterStatus, setWhFilterStatus] = useState("");
  const [whFilterPage, setWhFilterPage] = useState(1);
  const [whFilterLimit, setWhFilterLimit] = useState(10);
  const [whFilterReportType, setWhFilterReportType] = useState("");

  // Create a combined fetch function to refresh both or active tab
  const refreshAllReports = useCallback(async () => {
    // We refresh both to ensure consistency across tabs
    await Promise.all([
      fetchReports({
        startDate: filterStartDate,
        endDate: filterEndDate,
        search: filterSearch,
        color: filterColor,
        factory: filterFactory,
        status: filterStatus,
        reportType: filterReportType,
        page: filterPage,
        limit: filterLimit,
      }),
      fetchWhReports({
        startDate: whFilterStartDate,
        endDate: whFilterEndDate,
        search: whFilterSearch,
        color: whFilterColor,
        factory: whFilterFactory,
        status: whFilterStatus,
        reportType: whFilterReportType,
        page: whFilterPage,
        limit: whFilterLimit,
      })
    ]);
  }, [
    fetchReports, filterStartDate, filterEndDate, filterSearch, filterColor, filterFactory, filterStatus, filterReportType, filterPage, filterLimit,
    fetchWhReports, whFilterStartDate, whFilterEndDate, whFilterSearch, whFilterColor, whFilterFactory, whFilterStatus, whFilterReportType, whFilterPage, whFilterLimit
  ]);

  const {
    isSubmitting,
    isSavingReceived,
    isSavingCompletion,
    submitReport,
    saveReceivedStatus,
    saveCompletionStatus,
    updateReport, // Expose updateReport
  } = useReportSubmission(user, refreshAllReports);

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

  // Track if we are completing a report via the form
  const [completingReport, setCompletingReport] = useState(null);

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
  const [editingNotes, setEditingNotes] = useState("");
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

  // Custom Dropdown State
  const [isReportTypeOpen, setIsReportTypeOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Assign Control State
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [assignData, setAssignData] = useState({
    _id: null,
    preparedBy: null,
    checkedBy: null,
    approvedBy: null
  });
  const [selectedUserForAssign, setSelectedUserForAssign] = useState(null);

  const [causeAssignHistory, setCauseAssignHistory] = useState([]);

  const fetchAssignControl = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assign-control`);
      if (response.data && Array.isArray(response.data)) {
        setCauseAssignHistory(response.data);
      }
    } catch (error) {
      console.error("Error fetching assign control:", error);
    }
  }, []);

  // Load users and cause assign data with polling
  useEffect(() => {
    fetchAssignControl();

    // Poll every 5 seconds for real-time updates
    const intervalId = setInterval(fetchAssignControl, 5000);

    // Also refetch immediately when window regains focus (user switches tabs)
    const handleFocus = () => {
      fetchAssignControl();
    };
    window.addEventListener('focus', handleFocus);

    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users`);
        if (response.data) {
          setUsers(response.data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        showToast.error("Failed to load users list");
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();

    // Cleanup
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchAssignControl]);

  // Prepare user options for Select
  const userOptions = users.map(user => {
    const id = user.emp_id;
    const name = user.name || user.eng_name || 'Unknown';
    return {
      value: id || name, // Fallback to name if ID is missing
      label: id ? `(${id}) ${name}` : name,
      key: user._id || id || name
    };
  });

  // Reset page to 1 when filters (except page) change for standard reports
  useEffect(() => {
    setFilterPage(1);
  }, [filterStartDate, filterEndDate, filterSearch, filterColor, filterFactory, filterStatus, filterReportType, filterLimit]);

  // Reset page to 1 when filters (except page) change for warehouse reports
  useEffect(() => {
    setWhFilterPage(1);
  }, [whFilterStartDate, whFilterEndDate, whFilterSearch, whFilterColor, whFilterFactory, whFilterStatus, whFilterReportType, whFilterLimit]);

  // Fetch standard reports when filters or page change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports({
        startDate: filterStartDate,
        endDate: filterEndDate,
        search: filterSearch,
        color: filterColor,
        factory: filterFactory,
        status: filterStatus,
        reportType: filterReportType,
        page: filterPage,
        limit: filterLimit
      });
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [filterStartDate, filterEndDate, filterSearch, filterColor, filterFactory, filterStatus, filterReportType, filterPage, filterLimit, fetchReports]);

  // Fetch warehouse reports when filters or page change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWhReports({
        startDate: whFilterStartDate,
        endDate: whFilterEndDate,
        search: whFilterSearch,
        color: whFilterColor,
        factory: whFilterFactory,
        status: whFilterStatus,
        reportType: whFilterReportType,
        page: whFilterPage,
        limit: whFilterLimit
      });
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [whFilterStartDate, whFilterEndDate, whFilterSearch, whFilterColor, whFilterFactory, whFilterStatus, whFilterReportType, whFilterPage, whFilterLimit, fetchWhReports]);

  // Dropdown states
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showPODropdown, setShowPODropdown] = useState(false);
  const [showETDDropdown, setShowETDDropdown] = useState(false);

  // Handle input change with order data clearing
  const handleInputChange = (field, value) => {
    // 1. Handle Report Type Change - ONLY UPDATE THE REPORT TYPE VALUE, DON'T RESET FORM
    if (field === "reportType") {
      // Just update the reportType field, keep all other form data intact
      setFormData(prev => ({
        ...prev,
        reportType: value
      }));

      // Stop here - don't reset anything else
      return;
    }

    handleFormInputChange(field, value, (field, value, newData, prev) => {
      // Clear user-selected choices (color, PO, ETD) when Style changes manually
      // But keep metadata (season, description) until new search results arrive
      if ((field === "ymStyle" && prev.ymStyle !== value) ||
        (field === "style" && prev.style !== value)) {
        newData.color = [];
        newData.po = [];
        newData.exFtyDate = [];
        newData.washType = 'Before Wash';
        newData.sampleSize = '';

        // IMMEDIATELY clear metadata if style is cleared or too short
        if (!value || value.length < 2) {
          newData.season = '';
          newData.styleDescription = '';
          newData.custStyle = '';
          newData.buyerStyle = '';
        }
      }
    });

    // Unified logic for Style Search (supports both 'ymStyle' and 'style')
    const isStyleField = field === "ymStyle" || field === "style";

    if (isStyleField && value.length >= 2) {
      // Use handler function
      handleOrderNoSearch(
        value,
        setOrderNoSuggestions,
        setShowOrderNoSuggestions,
        setIsSearchingOrderNo
      );

      // Clear any existing timer
      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
        colorFetchTimerRef.current = null;
      }

      // Auto-fetch colors when user stops typing (debounced)
      if (shouldAutoFetchColors(value)) {
        colorFetchTimerRef.current = setTimeout(async () => {
          if (shouldAutoFetchColors(value)) {
            // Fetch the suggestions again or use the ones we have?
            // Better to re-fetch or use results of handleOrderNoSearch
            const suggestions = await handleOrderNoSearch(
              value,
              setOrderNoSuggestions,
              setShowOrderNoSuggestions,
              setIsSearchingOrderNo
            );

            // If exactly one suggestion or the exact match is in the list, auto-select it
            if (suggestions && suggestions.length === 1) {
              handleOrderNoSelect(suggestions[0]);
            } else if (suggestions && suggestions.some(s => s.toUpperCase() === value.toUpperCase())) {
              const exactMatch = suggestions.find(s => s.toUpperCase() === value.toUpperCase());
              handleOrderNoSelect(exactMatch);
            } else {
              // Check if the current value is a prefix of any suggestion
              // If it is, user is likely still typing, so don't fetch yet to avoid 404s
              const isPrefix = suggestions && suggestions.some(s => s.toUpperCase().startsWith(value.toUpperCase()) && s.length > value.length);

              if (!isPrefix) {
                // No auto-select, just fetch data for what we have
                fetchOrderColors(value, setFormData);
                fetchYorksysOrderETD(value, setFormData);
              }
            }
          }
        }, 800); // Wait 800ms after user stops typing
      }
    } else if (isStyleField && value.length < 2) {
      setOrderNoSuggestions([]);
      setShowOrderNoSuggestions(false);
      resetOrderData();

      // Close any open dropdowns
      setShowColorDropdown(false);
      setShowPODropdown(false);
      setShowETDDropdown(false);

      // Clear auto-populated fields in form data as well
      setFormData(prev => ({
        ...prev,
        season: '',
        styleDescription: '',
        custStyle: '',
        buyerStyle: '',
        color: [],
        po: [],
        exFtyDate: []
      }));

      // Clear timer if user deletes the value
      if (colorFetchTimerRef.current) {
        clearTimeout(colorFetchTimerRef.current);
        colorFetchTimerRef.current = null;
      }
    }
  };

  // Search for Order_No suggestions
  const searchOrderNo = (value) => {
    if (value && value.length >= 2) {
      handleOrderNoSearch(
        value,
        setOrderNoSuggestions,
        setShowOrderNoSuggestions,
        setIsSearchingOrderNo
      );
    }
  };

  // Handle Order_No selection - use handler function
  const handleOrderNoSelect = async (orderNo) => {
    // Clear any pending color fetch timer
    if (colorFetchTimerRef.current) {
      clearTimeout(colorFetchTimerRef.current);
      colorFetchTimerRef.current = null;
    }

    // Use handler function
    await handleOrderNoSelection(
      orderNo,
      formData,
      setFormData,
      setShowOrderNoSuggestions,
      setOrderNoSuggestions,
      fetchOrderColors,
      fetchYorksysOrderETD,
      resetOrderData
    );
  };

  // Handle image upload - store File objects instead of base64
  const handleImageUploadWrapper = (files) => {
    handleImageUpload(files, (prev) => ({
      ...prev,
      images: [...prev.images, ...Array.from(files).filter(f => validateImageFile(f))],
    }));
  };

  // Use imported handlers for file/camera inputs
  const handleFileInputChange = (e) => handleFileInputChangeHandler(
    e, formData.images, setFormData, fileInputRef, IMAGE_LIMITS.INITIAL
  );

  const handleCameraInputChange = (e) => handleCameraInputChangeHandler(
    e, formData.images, setFormData, cameraInputRef, IMAGE_LIMITS.INITIAL
  );

  const triggerFileInput = () => triggerFileInputHandler(
    formData.images, fileInputRef, IMAGE_LIMITS.INITIAL, "Initial Step"
  );

  const triggerCameraInput = () => triggerCameraInputHandler(
    formData.images, cameraInputRef, IMAGE_LIMITS.INITIAL, "Initial Step"
  );

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

    // Check if we are completing a report
    if (completingReport) {
      const success = await updateReport(completingReport._id, {
        ...formData,
        status: "completed",
        completedDate: new Date().toISOString().split("T")[0],
        completedAt: new Date().toISOString(),
      });

      if (success) {
        setCompletingReport(null);
        // Reset form
        const currentReportType = formData.reportType || REPORT_TYPES.HOME_WASH;
        resetForm(getInitialFormData(currentReportType));

        // Switch to reports tab
        setActiveTab("reports");

        // Clear rotations
        setImageRotations({});
        setShowColorDropdown(false);
        setShowPODropdown(false);
        setShowETDDropdown(false);
        resetOrderData();
      }
      return;
    }

    const currentReportType = formData.reportType || REPORT_TYPES.HOME_WASH;
    const success = await submitReport(formData, () => {
      // Keep on the form tab for faster subsequent entries
      // setActiveTab("reports"); // Removed per request
      // Reset form with initial data for the current report type
      resetForm(getInitialFormData(currentReportType));
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
      // Manually refresh warehouse reports too to keep them in sync
      fetchWhReports({
        startDate: whFilterStartDate,
        endDate: whFilterEndDate,
        search: whFilterSearch,
        color: whFilterColor,
        factory: whFilterFactory,
        status: whFilterStatus,
        page: whFilterPage,
        limit: whFilterLimit
      });
    }
  };

  // Handle edit report - use handler function
  const handleEditReport = async (report) => {
    setEditingReport(report);

    // Use handler function to prepare edit form
    await prepareEditFormData(
      report,
      setEditFormData,
      setEditAvailableColors,
      setEditAvailablePOs,
      setEditAvailableETDs
    );

    setShowEditModal(true);
  };

  // Handle edit form submit - use handler
  const resetEditState = () => {
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
  };

  const handleEditSubmit = (e) => handleEditFormSubmit(
    e,
    editingReport,
    editFormData,
    refreshAllReports,
    setShowEditModal,
    resetEditState
  );

  // Initialize QR Code Scanner for a specific report
  const initializeScanner = async (reportId) => {
    try {
      if (html5QrCodeInstance) {
        await html5QrCodeInstance.stop();
        setHtml5QrCodeInstance(null);
      }

      const scannerId = `report-date-scanner-${reportId}`;
      const instance = new Html5Qrcode(scannerId, { verbose: false });
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
            fps: 20, // Increased FPS for smoother scanning
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdgeSize * 0.7);
              return {
                width: qrboxSize,
                height: qrboxSize
              };
            },
            aspectRatio: 1.0,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true // Use native browser API if available (faster/better)
            }
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
                // Second scan - Load report into form for completion
                stopScanner();
                setShowReportDateScanner(null);
                setShowReportDateQR(null); // Close QR code modal if open

                // Set completing report state
                setCompletingReport(currentReport);

                // Populate form data (form will always show HomeWashForm regardless of reportType)
                setFormData({
                  ...currentReport,
                  reportType: currentReport.reportType || "Home Wash Test",
                  color: currentReport.color || [],
                  po: currentReport.po || [],
                  exFtyDate: currentReport.exFtyDate || [],
                  images: [], // Don't preload previous images into input (unless we want to display them, but file input can't be preloaded)
                  // Note: If we want to show existing images, we might need a separate display or handle it in the form.
                });

                // Fetch colors and other data for the style
                if (currentReport.ymStyle) {
                  fetchOrderColors(currentReport.ymStyle, setFormData);
                  fetchYorksysOrderETD(currentReport.ymStyle, setFormData);
                }

                // Switch to Form tab
                setActiveTab("form");

                showToast.success("Report loaded for completion. Please fill in the results and submit.");

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

    const { parseQRCodeScanResult } = await import("../components/inspection/WashingTesting/lib");

    // Helper to process scan result
    const processResult = async (decodedText) => {
      const result = parseQRCodeScanResult(decodedText, reportId);

      if (!result.isValid) {
        if (result.format === 'invalid_url' || result.format === 'unknown') {
          showToast.warning("This QR code is not valid. Please upload the QR code that is displayed in the current modal window.");
        } else {
          showToast.warning("Invalid QR code format.");
        }
        return;
      }

      const targetReportId = result.reportId;

      // Check if the scanned QR code belongs to the current report
      if (targetReportId !== reportId) {
        showToast.error("This QR code is from a different report. Please upload the QR code that is displayed in the current modal window.");
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
          return;
        }
      } catch (fetchError) {
        console.error("Error fetching report:", fetchError);
        showToast.error("Network error. Failed to verify the report. Please check your connection and try again.");
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

        // Second scan - Load report into form for completion
        setCompletingReport(currentReport);

        // Populate form data (form will always show HomeWashForm regardless of reportType)
        setFormData({
          ...currentReport,
          reportType: currentReport.reportType || "Home Wash Test",
          color: currentReport.color || [],
          po: currentReport.po || [],
          exFtyDate: currentReport.exFtyDate || [],
          images: [], // Don't preload previous images into input
        });

        // Fetch colors and other data for the style
        if (currentReport.ymStyle) {
          fetchOrderColors(currentReport.ymStyle, setFormData);
          fetchYorksysOrderETD(currentReport.ymStyle);
        }

        // Switch to Form tab
        setActiveTab("form");
        showToast.success("Report loaded for completion. Please fill in the results and submit.");
      } else if (currentStatus === "completed") {
        showToast.info("This report is already completed.");
        setShowReportDateQR(null);
        setActiveTab("reports");
      } else {
        showToast.warning(`Report status is "${currentStatus}". Cannot process.`);
        setShowReportDateQR(null);
        setActiveTab("reports");
      }
    };

    try {
      // Method 1: Try Html5Qrcode first (fastest)
      const tempContainer = document.createElement('div');
      tempContainer.id = 'temp-qr-file-scanner';
      tempContainer.style.display = 'none';
      document.body.appendChild(tempContainer);

      const html5QrCode = new Html5Qrcode('temp-qr-file-scanner');
      try {
        const decodedText = await html5QrCode.scanFile(file, false);
        document.body.removeChild(tempContainer);
        await processResult(decodedText);
        event.target.value = "";
        return;
      } catch (scanError) {
        document.body.removeChild(tempContainer);
        console.warn("Html5Qrcode failed, trying fallback...", scanError);
      }

      // Method 2: Fallback to jsQR with Canvas (more robust for some images)
      try {
        const jsQR = (await import("jsqr")).default;

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = objectUrl;
        });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        URL.revokeObjectURL(objectUrl);

        if (code) {
          await processResult(code.data);
          event.target.value = "";
          return;
        }
      } catch (fallbackError) {
        console.error("Fallback scan failed:", fallbackError);
      }

      // If both failed
      showToast.error("Failed to scan QR code. The image may be corrupted or the QR code is not readable.");

    } catch (error) {
      console.error("Error in QR scan process:", error);
      showToast.error("An error occurred while scanning. Please try again.");
    } finally {
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
        // Second scan - Open completion mode in form
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

        // 3. Load report into form for completion
        setCompletingReport(currentReport);

        // Populate form data
        setFormData({
          ...currentReport,
          reportType: currentReport.reportType || "Home Wash Test",
          color: currentReport.color || [],
          po: currentReport.po || [],
          exFtyDate: currentReport.exFtyDate || [],
          images: [], // Don't preload previous images into input
        });

        // Fetch colors and other data for the style
        if (currentReport.ymStyle) {
          fetchOrderColors(currentReport.ymStyle, setFormData);
          fetchYorksysOrderETD(currentReport.ymStyle);
        }

        // 4. Switch to Form tab
        setActiveTab("form");

        showToast.success("Report loaded for completion. Please fill in the results and submit.");
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
  // Handle completion form submit - Enhanced with better feedback
  const handleCompletionSubmit = async () => {
    if (!completionReportId) return;

    // Find the report to get its type so we can save notes to the correct field
    let report = reports.find(r => (r._id === completionReportId || r.id === completionReportId));
    if (!report) {
      report = whReports.find(r => (r._id === completionReportId || r.id === completionReportId));
    }

    // Default to Home Wash if not found (though it should be found)
    const reportType = report?.reportType || "Home Wash Test";

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
      },
      reportType // Pass the report type to saveCompletionStatus
    );
  };

  // Handle edit initial images
  const handleEditInitialImages = (report) => {
    setEditingImageReport(report);
    setEditingImageType('initial');
    setEditingImages(report.images || []);
    setEditingNotes(report.notes || "");
    setShowEditInitialImagesModal(true);
  };

  // Handle edit received images
  const handleEditReceivedImages = (report) => {
    setEditingImageReport(report);
    setEditingImageType('received');
    setEditingImages(report.receivedImages || []);
    setEditingNotes(report.receivedNotes || "");
    setShowEditReceivedImagesModal(true);
  };



  // Handle edit completion images
  const handleEditCompletionImages = (report) => {
    setEditingImageReport(report);
    setEditingImageType('completion');
    setEditingImages(report.completionImages || []);

    // Get notes from the specific field based on report type, fallback to generic completionNotes
    const noteField = getCompletionNotesField(report.reportType);
    setEditingNotes(report[noteField] || report.completionNotes || "");

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

      // Add notes using correct field name
      let notesFieldName;
      if (editingImageType === 'initial') {
        notesFieldName = 'notes';
      } else if (editingImageType === 'received') {
        notesFieldName = 'receivedNotes';
      } else {
        // completion
        notesFieldName = getCompletionNotesField(editingImageReport.reportType);
      }

      formDataToSubmit.append(notesFieldName, editingNotes);

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

        // Refresh all reports
        await refreshAllReports();
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

    const currentPrintingId = activeTab === "warehouse_reports" ? whPrintingReportId : printingReportId;
    const currentSetPrintingId = activeTab === "warehouse_reports" ? setWhPrintingReportId : setPrintingReportId;

    // Prevent multiple clicks
    if (currentPrintingId === reportId) {
      return;
    }

    currentSetPrintingId(reportId);

    try {
      // Generate QR code data URL for the report - use URL format for mobile compatibility
      const qrCodeValue = `${getQRCodeBaseURL(QR_CODE_BASE_URL)}/Launch-washing-machine-test?scan=${reportId}`;
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
        currentSetPrintingId(null);
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

  // Close Report Type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsReportTypeOpen(false);
      }
    };
    if (isReportTypeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isReportTypeOpen]);

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
        {/* Page Title & Report Type Selection - Custom Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-700 p-6 md:p-8 rounded-t-xl relative overflow-hidden group">
          {/* Ambient Background Effects - Water Theme */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-all duration-700 group-hover:bg-cyan-400/30"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none transition-all duration-700 group-hover:bg-blue-400/30"></div>

          {/* Bubble/Water Accents */}
          <div className="absolute top-10 right-20 w-4 h-4 bg-white/20 rounded-full blur-sm animate-pulse"></div>
          <div className="absolute bottom-10 left-32 w-6 h-6 bg-white/10 rounded-full blur-md animate-bounce delay-700"></div>

          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-white tracking-tight drop-shadow-md">
              Launch Washing Machine Test
            </h1>
            <p className="text-sm text-blue-100 flex items-center gap-2 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
              </span>
              Report Washing - Enter test details and view submitted reports
            </p>
          </div>
        </div>

        <div className="p-4 md:p-6">

          {/* Tab Navigation - Mobile Optimized */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav
              className="flex overflow-x-auto scrollbar-hide -mb-px"
              aria-label="Tabs"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => setActiveTab("form")}
                className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "form"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
              >
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <HiDocumentAdd className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "form" ? "text-emerald-600" : "text-emerald-500/70"}`} />
                  <span className="hidden sm:inline">Create New Report</span>
                  <span className="sm:hidden">Create</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "reports"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
              >
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <HiClipboardList className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "reports" ? "text-blue-600" : "text-blue-500/70"}`} />
                  <span className="hidden sm:inline">Reports ({pagination.totalRecords})</span>
                  <span className="sm:hidden">Reports <span className="text-[10px] bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded-full">{pagination.totalRecords}</span></span>
                </span>
              </button>

              {/* Warehouse Report Tab - Conditionally Hidden based on Role */}
              {/* Example: Only show warehouse tab if user has permission. Modify the condition as needed. */}
              {(!user?.role || user?.role !== 'user_assigned_to_hide_warehouse') && (
                <button
                  onClick={() => setActiveTab("warehouse_reports")}
                  className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "warehouse_reports"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                >
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <MdWarehouse className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "warehouse_reports" ? "text-amber-600" : "text-amber-500/70"}`} />
                    <span className="hidden sm:inline">Warehouse Report</span>
                    <span className="sm:hidden">Warehouse</span>
                  </span>
                </button>
              )}
              <button
                onClick={() => setActiveTab("assign_control")}
                className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "assign_control"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
              >
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <MdAssignmentInd className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "assign_control" ? "text-purple-600" : "text-purple-500/70"}`} />
                  <span className="hidden sm:inline">Assign Control</span>
                  <span className="sm:hidden">Assign</span>
                </span>
              </button>
            </nav>
          </div>

          {/* Form Section - Dynamic based on Report Type */}
          {activeTab === "form" && (
            <DynamicFormSection
              formData={formData}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isCompleting={!!completingReport}
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
              availableSizes={availableSizes}
              season={season}
              styleDescription={styleDescription}
              custStyle={custStyle}
              fabrication={fabrication}
              anfSpecs={anfSpecs}
              isLoadingSpecs={isLoadingSpecs}
              fetchAnfSpecs={fetchAnfSpecs}
              isReportTypeOpen={isReportTypeOpen}
              setIsReportTypeOpen={setIsReportTypeOpen}
              dropdownRef={dropdownRef}
              reportTypeIcons={{
                "Home Wash Test": <MdLocalLaundryService />,
                "Garment Wash Report": <MdLocalLaundryService />,
                "HT Testing": <MdOutlineDeviceThermostat />,
                "EMB/Printing Testing": <MdOutlineImagesearchRoller />,
                "Pulling Test": <MdOutlineExpand />
              }}
              reportTypes={[
                { val: "Home Wash Test", icon: <MdLocalLaundryService /> },
                { val: "Garment Wash Report", icon: <MdLocalLaundryService /> },
                { val: "HT Testing", icon: <MdOutlineDeviceThermostat /> },
                { val: "EMB/Printing Testing", icon: <MdOutlineImagesearchRoller /> },
                { val: "Pulling Test", icon: <MdOutlineExpand /> }
              ]}
              causeAssignData={assignData}
              assignHistory={causeAssignHistory}
              users={users} // Pass users to form
              isLoadingUsers={isLoadingUsers}
            />
          )}

          {/* Form Section is now in FormSection component */}

          {/* Submitted Reports Section - Standard Tab */}
          {activeTab === "reports" && (
            <ReportsList
              activeTab={activeTab}
              reports={reports}
              isLoadingReports={isLoadingReports}
              onRefresh={() => fetchReports({
                startDate: filterStartDate,
                endDate: filterEndDate,
                search: filterSearch,
                color: filterColor,
                factory: filterFactory,
                status: filterStatus,
                reportType: filterReportType,
                page: filterPage,
                limit: filterLimit
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
              filterReportType={filterReportType}
              setFilterReportType={setFilterReportType}
            />
          )}

          {/* Submitted Reports Section - Warehouse Tab */}
          {activeTab === "warehouse_reports" && (
            <ReportsList
              activeTab={activeTab}
              reports={whReports}
              isLoadingReports={isLoadingWhReports}
              onRefresh={() => fetchWhReports({
                startDate: whFilterStartDate,
                endDate: whFilterEndDate,
                search: whFilterSearch,
                color: whFilterColor,
                factory: whFilterFactory,
                status: whFilterStatus,
                reportType: whFilterReportType,
                page: whFilterPage,
                limit: whFilterLimit
              })}
              expandedReports={whExpandedReports}
              onToggleReport={toggleWhReport}
              onPrintPDF={handlePrintPDF}
              onDownloadPDF={handleDownloadPDF}
              onExportExcel={handleExportExcel}
              onEdit={handleEditReport}
              onDelete={null} // Keep delete disabled for warehouse
              onShowQRCode={(reportId) => setShowReportDateQR(showReportDateQR === reportId ? null : reportId)}
              printingReportId={whPrintingReportId}
              savedImageRotations={savedImageRotations}
              openImageViewer={openImageViewer}
              setActiveTab={setActiveTab}
              onEditInitialImages={handleEditInitialImages}
              onEditReceivedImages={handleEditReceivedImages}
              onEditCompletionImages={handleEditCompletionImages}
              // Warehouse Filter props
              filterStartDate={whFilterStartDate}
              setFilterStartDate={setWhFilterStartDate}
              filterEndDate={whFilterEndDate}
              setFilterEndDate={setWhFilterEndDate}
              filterSearch={whFilterSearch}
              setFilterSearch={setWhFilterSearch}
              filterColor={whFilterColor}
              setFilterColor={setWhFilterColor}
              filterFactory={whFilterFactory}
              setFilterFactory={setWhFilterFactory}
              filterStatus={whFilterStatus}
              setFilterStatus={setWhFilterStatus}
              filterPage={whFilterPage}
              setFilterPage={setWhFilterPage}
              filterLimit={whFilterLimit}
              setFilterLimit={setWhFilterLimit}
              pagination={whPagination}
              factories={factories}
              filterReportType={whFilterReportType}
              setFilterReportType={setWhFilterReportType}
            />
          )}






          {/* Assign Control Tab */}
          {activeTab === "assign_control" && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 dark:border-gray-700 animate-fadeIn">
              <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <MdAssignmentInd className="w-6 h-6 text-purple-500" />
                Assign Control
              </h2>

              <div className="max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  {/* User Selection */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Select User:
                      </label>
                      <div className="relative">
                        <Select
                          className="w-full h-12"
                          placeholder="Search and select a user"
                          loading={isLoadingUsers}
                          showSearch
                          optionFilterProp="label"
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          options={userOptions}
                          value={selectedUserForAssign}
                          onChange={(value) => setSelectedUserForAssign(value)}
                          size="large"
                          style={{ width: '100%', height: '48px' }}
                          allowClear
                        />
                      </div>
                    </div>

                    {selectedUserForAssign && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800/30 flex flex-col gap-3 animate-slideIn">
                        <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Define Role for Selected User:</p>
                        <div className="flex flex-wrap gap-x-8 gap-y-2">
                          <Checkbox
                            className="text-gray-700 dark:text-gray-300 font-semibold whitespace-nowrap"
                            checked={assignData.preparedBy === selectedUserForAssign}
                            onChange={(e) => {
                              setAssignData(prev => ({
                                ...prev,
                                preparedBy: e.target.checked ? selectedUserForAssign : (prev.preparedBy === selectedUserForAssign ? null : prev.preparedBy)
                              }));
                            }}
                          >
                            PREPARED BY
                          </Checkbox>
                          <Checkbox
                            className="text-gray-700 dark:text-gray-300 font-semibold whitespace-nowrap"
                            checked={assignData.checkedBy === selectedUserForAssign}
                            onChange={(e) => {
                              setAssignData(prev => ({
                                ...prev,
                                checkedBy: e.target.checked ? selectedUserForAssign : (prev.checkedBy === selectedUserForAssign ? null : prev.checkedBy)
                              }));
                            }}
                          >
                            CHECKED BY
                          </Checkbox>
                          <Checkbox
                            className="text-gray-700 dark:text-gray-300 font-semibold whitespace-nowrap"
                            checked={assignData.approvedBy === selectedUserForAssign}
                            onChange={(e) => {
                              setAssignData(prev => ({
                                ...prev,
                                approvedBy: e.target.checked ? selectedUserForAssign : (prev.approvedBy === selectedUserForAssign ? null : prev.approvedBy)
                              }));
                            }}
                          >
                            APPROVED BY
                          </Checkbox>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Current Selection Summary */}
                  <div className="md:col-span-5 bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/50 h-full flex flex-col justify-center min-h-[160px]">
                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-6 uppercase tracking-widest text-center">Active Assignment View</h4>
                    <div className="grid grid-cols-1 gap-5">
                      <div className="flex items-center gap-4 group">
                        <div className={`w-1 h-10 rounded-full transition-colors ${assignData.preparedBy ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Prepared By</p>
                          <p className={`text-sm font-bold transition-colors ${assignData.preparedBy ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 font-normal italic'}`}>
                            {userOptions.find(u => u.value === assignData.preparedBy)?.label || 'Not assigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 group">
                        <div className={`w-1 h-10 rounded-full transition-colors ${assignData.checkedBy ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Checked By</p>
                          <p className={`text-sm font-bold transition-colors ${assignData.checkedBy ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 font-normal italic'}`}>
                            {userOptions.find(u => u.value === assignData.checkedBy)?.label || 'Not assigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 group">
                        <div className={`w-1 h-10 rounded-full transition-colors ${assignData.approvedBy ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Approved By</p>
                          <p className={`text-sm font-bold transition-colors ${assignData.approvedBy ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 font-normal italic'}`}>
                            {userOptions.find(u => u.value === assignData.approvedBy)?.label || 'Not assigned'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:shadow-md transform transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    onClick={() => {
                      setAssignData({ _id: null, preparedBy: null, checkedBy: null, approvedBy: null });
                      setSelectedUserForAssign(null);
                    }}
                  >
                    Clear / New Record
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!assignData.preparedBy && !assignData.checkedBy && !assignData.approvedBy}
                    onClick={async () => {
                      if (!assignData.preparedBy && !assignData.checkedBy && !assignData.approvedBy) {
                        showToast.error("Please select at least one assignee (Prepared By, Checked By or Approved By).");
                        return;
                      }

                      try {
                        await axios.post(`${API_BASE_URL}/api/assign-control`, assignData);
                        showToast.success(assignData._id ? "Assignment updated successfully!" : "New assignment created successfully!");
                        await fetchAssignControl();
                        setAssignData({ _id: null, preparedBy: null, checkedBy: null, approvedBy: null });
                        setSelectedUserForAssign(null);
                      } catch (error) {
                        console.error("Error saving assignments:", error);
                        showToast.error("Failed to save assignments.");
                      }
                    }}
                  >
                    {assignData._id ? "Update Assignment" : "Save New Assignment"}
                  </button>
                </div>
              </div>

              {/* Assignments History Table */}
              <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Assignment History (Click row to edit)</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prepared By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Checked By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Approved By</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {causeAssignHistory.map((item) => (
                        <tr
                          key={item._id}
                          onClick={() => {
                            setAssignData({
                              _id: item._id,
                              preparedBy: item.preparedBy,
                              checkedBy: item.checkedBy,
                              approvedBy: item.approvedBy
                            });
                            // Default the selection to preparedBy if available, then checkedBy, then approvedBy
                            setSelectedUserForAssign(item.preparedBy || item.checkedBy || item.approvedBy);
                          }}
                          className={`cursor-pointer transition-colors ${assignData._id === item._id ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(item.updatedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {userOptions.find(u => u.value === item.preparedBy)?.label || item.preparedBy || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {userOptions.find(u => u.value === item.checkedBy)?.label || item.checkedBy || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {userOptions.find(u => u.value === item.approvedBy)?.label || item.approvedBy || '-'}
                          </td>
                        </tr>
                      ))}
                      {causeAssignHistory.length === 0 && (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                            No history found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
            onDownloadQRCode={downloadQRCodeHook}
            onPrintQRCode={printQRCode}
            onUploadQRCode={handleQRCodeFileUpload}
            onOpenScanner={(reportId) => {
              setShowReportDateScanner(reportId);
              // Wait for modal to animate and element to be available
              setTimeout(() => initializeScanner(reportId), 300);
            }}
            getQRCodeBaseURL={() => getQRCodeBaseURL(QR_CODE_BASE_URL)}
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
              setEditingNotes("");
            }}
            title={`Edit Initial Images - ${editingImageReport?.ymStyle || "N/A"}`}
            images={editingImages}
            notes={editingNotes}
            onNotesChange={setEditingNotes}
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
              setEditingNotes("");
            }}
            title={`Edit Received Images - ${editingImageReport?.ymStyle || "N/A"}`}
            images={editingImages}
            notes={editingNotes}
            onNotesChange={setEditingNotes}
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
              setEditingNotes("");
            }}
            title={`Edit Completion Images - ${editingImageReport?.ymStyle || "N/A"}`}
            images={editingImages}
            notes={editingNotes}
            onNotesChange={setEditingNotes}
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
    </div >
  );
};

export default LaundryWashingMachineTest;
