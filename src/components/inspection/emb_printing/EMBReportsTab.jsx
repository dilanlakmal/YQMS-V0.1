import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import {
  Loader2,
  FileText,
  Search,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  RefreshCw
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { pdf } from "@react-pdf/renderer";
import EMBReportPDF from "./EMBReportPDF";
import showToast from "../../../utils/toast";
import ConfirmDialog from "./ComfirmModal/ConfirmDialog";


const EMBReportsTab = ({ 
  formData, 
  onFormDataChange, 
  onSubmitHandlerRef, 
  isSubmitting, 
  setIsSubmitting, 
  inspectionType,
  reports = [],
  reportsLoading = false,
  reportsError = null,
  fetchReports,
  onDateRangeChange,
  reportsDateRange
}) => {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState(reportsDateRange?.startDate || new Date(new Date().setDate(new Date().getDate() - 7)));
  const [endDate, setEndDate] = useState(reportsDateRange?.endDate || new Date());
  const [searchTerm, setSearchTerm] = useState("");
  // Pending filters (what user selects)
  const [filterFactoryName, setFilterFactoryName] = useState("");
  const [filterMoNumber, setFilterMoNumber] = useState("");
  const [filterBuyer, setFilterBuyer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterInspector, setFilterInspector] = useState("");
  const [filterResult, setFilterResult] = useState("");
  // Applied filters (what actually filters the data)
  const [appliedFactoryName, setAppliedFactoryName] = useState("");
  const [appliedMoNumber, setAppliedMoNumber] = useState("");
  const [appliedBuyer, setAppliedBuyer] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedInspector, setAppliedInspector] = useState("");
  const [appliedResult, setAppliedResult] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedReport, setSelectedReport] = useState({});
  const [loadingPdf, setLoadingPdf] = useState({});
  const [printReportData, setPrintReportData] = useState(null);
  const [printKey, setPrintKey] = useState(0);
  const menuRefs = useRef({});
  const printIframeRef = useRef(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    onConfirm: null
  });

  // Sync local date state with parent's date range
  useEffect(() => {
    if (reportsDateRange) {
      setStartDate(reportsDateRange.startDate);
      setEndDate(reportsDateRange.endDate);
    }
  }, [reportsDateRange]);

  // Handle date range changes and trigger fetch
  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (onDateRangeChange && fetchReports) {
      onDateRangeChange({ startDate: date, endDate: endDate });
      fetchReports(date, endDate);
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    if (onDateRangeChange && fetchReports) {
      onDateRangeChange({ startDate: startDate, endDate: date });
      fetchReports(startDate, date);
    }
  };

  const fetchReportDetails = async (reportId, showLoading = false, forceRefresh = false) => {
    // If forceRefresh is true, always fetch fresh data from server
    if (!forceRefresh && selectedReport[reportId]) {
      return selectedReport[reportId];
    }
    if (showLoading) {
      setLoadingPdf(prev => ({ ...prev, [reportId]: true }));
    }
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/scc/subcon-emb-report/${reportId}`
      );
      if (response.data.success) {
        setSelectedReport(prev => ({
          ...prev,
          [reportId]: response.data.data
        }));
        return response.data.data;
      }
    } catch (err) {
      console.error("Error fetching report details:", err);
      showToast.error("Failed to load report details. Please try again.");
    } finally {
      if (showLoading) {
        setLoadingPdf(prev => ({ ...prev, [reportId]: false }));
      }
    }
    return null;
  };

  const handleDownloadPDF = async (report) => {
    setOpenMenuId(null);
    
    try {
      // Force refresh to get latest status from database
      const reportData = await fetchReportDetails(report._id, true, true);
      if (!reportData) {
        showToast.error("Failed to load report data for download.");
        return;
      }
   
      // Show loading toast
      const loadingToast = showToast.loading("Generating PDF...");

      try {
        // Generate PDF blob with timeout
        // Note: EMBReportPDF component includes defects pages (same as print PDF)
        const pdfPromise = pdf(
          <EMBReportPDF 
            report={reportData} 
            isPrinting={false} 
          />
        ).toBlob();
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("PDF generation timeout. Please check your internet connection and try again.")), 60000)
        );
        
        const blob = await Promise.race([pdfPromise, timeoutPromise]);
        
        // Dismiss loading toast
        showToast.dismiss(loadingToast);
        
        // Create download link and trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EMB_Report_${report.moNo || report._id}_${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        
        showToast.success("PDF download started.");
        
        // Refresh reports list to ensure status is up to date
        if (fetchReports) {
          fetchReports();
        }
      } catch (pdfError) {
        showToast.dismiss(loadingToast);
        console.error("Error generating PDF for download:", pdfError);
        
        // More specific error messages
        if (pdfError.message && pdfError.message.includes("timeout")) {
          showToast.error("PDF generation timed out. Please check your internet connection and try again.");
        } else if (pdfError.message && pdfError.message.includes("network") || pdfError.message && pdfError.message.includes("fetch")) {
          showToast.error("Network error. Please check your internet connection and try again.");
        } else if (pdfError.message && pdfError.message.includes("image") || pdfError.message && pdfError.message.includes("CORS")) {
          showToast.error("Error loading images. Please check your internet connection and try again.");
        } else {
          showToast.error(pdfError.message || "Failed to generate PDF. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error in handleDownloadPDF:", error);
      showToast.error("Failed to load report data. Please try again.");
    }
  };

  const handlePrintPDF = async (report) => {
    setOpenMenuId(null);
    // Force refresh to get latest status from database
    const reportData = await fetchReportDetails(report._id, true, true);
    if (!reportData) {
      showToast.error("Failed to load report data for printing.");
      return;
    }

    // Set the report data with unique key to force regeneration
    setPrintReportData(reportData);
    setPrintKey(prev => prev + 1); // Force regeneration even for same report
    
    // Refresh reports list to ensure status is up to date
    if (fetchReports) {
      fetchReports();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId].contains(event.target)) {
          setOpenMenuId(null);
        }
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && openMenuId) {
        setOpenMenuId(null);
      }
    };

    const handleScroll = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openMenuId]);

  const handleMenuToggle = (reportId) => {
    setOpenMenuId(openMenuId === reportId ? null : reportId);
  };

  const handleViewInspection = (report) => {
    const url = `/emb-printing/view-inspection/${report._id}`;
    window.open(url, '_blank');
  };

  const handleApprove = async (report) => {
    setConfirmDialog({
      isOpen: true,
      title: "Approve Inspection?",
      message: "Are you sure you want to approve this inspection?",
      type: "question",
      confirmText: "Yes, Approve",
      cancelText: "Cancel",
      confirmColor: "green",
      onConfirm: async () => {
        try {
          const response = await axios.patch(
            `${API_BASE_URL}/api/scc/subcon-emb-report/${report._id}/approve`
          );
          
          if (response.data.success) {
            showToast.success("Inspection has been approved successfully.");
            setOpenMenuId(null);
            if (fetchReports) {
              fetchReports();
            }
          } else {
            throw new Error(response.data.message || "Failed to approve inspection");
          }
        } catch (err) {
          console.error("Error approving inspection:", err);
          showToast.error(err.response?.data?.message || err.message || "Failed to approve inspection. Please try again.");
        }
      }
    });
  };

  const handleReject = async (report) => {
    setConfirmDialog({
      isOpen: true,
      title: "Reject Inspection?",
      message: "Are you sure you want to reject this inspection?",
      type: "warning",
      confirmText: "Yes, Reject",
      cancelText: "Cancel",
      confirmColor: "red",
      onConfirm: async () => {
        try {
          const response = await axios.patch(
            `${API_BASE_URL}/api/scc/subcon-emb-report/${report._id}/reject`
          );
          
          if (response.data.success) {
            showToast.success("Inspection has been rejected successfully.");
            setOpenMenuId(null);
            if (fetchReports) {
              fetchReports();
            }
          } else {
            throw new Error(response.data.message || "Failed to reject inspection");
          }
        } catch (err) {
          console.error("Error rejecting inspection:", err);
          showToast.error(err.response?.data?.message || err.message || "Failed to reject inspection. Please try again.");
        }
      }
    });
  };

  const handleApplyFilters = () => {
    // Validate that at least one filter is selected
    const hasActiveFilters = 
      filterFactoryName.trim() !== "" ||
      filterMoNumber.trim() !== "" ||
      filterBuyer.trim() !== "" ||
      filterStatus.trim() !== "" ||
      filterInspector.trim() !== "" ||
      filterResult.trim() !== "";
    
    if (!hasActiveFilters) {
      showToast.error("Please select at least one filter before applying.");
      return;
    }
    
    setAppliedFactoryName(filterFactoryName);
    setAppliedMoNumber(filterMoNumber);
    setAppliedBuyer(filterBuyer);
    setAppliedStatus(filterStatus);
    setAppliedInspector(filterInspector);
    setAppliedResult(filterResult);
    showToast.success("Filters applied successfully.");
  };

  // Listen for refresh messages from child windows (inspection view)
  useEffect(() => {
    const handleMessage = (event) => {
      // Verify message is from same origin
      if (event.origin !== window.location.origin) {
        return;
      }
      
      if (event.data && event.data.type === 'REFRESH_EMB_REPORTS') {
        console.log("🔄 Received refresh message from inspection view, refreshing reports...");
        if (fetchReports) {
          fetchReports();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [fetchReports]);

  // Reactive print handler - automatically regenerates and prints when printReportData or printKey changes
  useEffect(() => {
    if (!printReportData) return;

    let isMounted = true;
    let currentUrl = null;
    let currentIframe = null;
    let afterPrintHandler = null;

    const generateAndPrint = async () => {
      try {
        // Clean up any existing iframe first
        if (printIframeRef.current && document.body.contains(printIframeRef.current)) {
          try {
            if (printIframeRef.current.src) {
              URL.revokeObjectURL(printIframeRef.current.src);
            }
            document.body.removeChild(printIframeRef.current);
          } catch (e) {
            console.warn("Error removing old iframe:", e);
          }
        }

        // Generate PDF blob from current state - only for printing
        // NOTE: @react-pdf/renderer caches components, so code changes require page reload
        // The printKey ensures different reports regenerate correctly
        const blob = await pdf(
          <EMBReportPDF 
            report={printReportData} 
            isPrinting={true} 
          />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        currentUrl = url;
        
        if (!isMounted) {
          URL.revokeObjectURL(url);
          return;
        }
        
        // Create hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        iframe.src = url;
        currentIframe = iframe;
        printIframeRef.current = iframe;
        
        document.body.appendChild(iframe);
        
        iframe.onload = () => {
          if (!isMounted) return;
          
          setTimeout(() => {
            if (!isMounted || !iframe.contentWindow) return;
            
            try {
              iframe.contentWindow.print();
              
              // Clean up after print dialog closes
              afterPrintHandler = () => {
                try {
                  if (currentIframe && document.body.contains(currentIframe)) {
                    document.body.removeChild(currentIframe);
                  }
                  if (currentUrl) {
                    URL.revokeObjectURL(currentUrl);
                  }
                  printIframeRef.current = null;
                  // Reset state to allow re-printing
                  setPrintReportData(null);
                } catch (e) {
                  console.warn("Error in afterprint cleanup:", e);
                }
                if (afterPrintHandler) {
                  window.removeEventListener('afterprint', afterPrintHandler);
                }
              };
              
              window.addEventListener('afterprint', afterPrintHandler);
            } catch (error) {
              console.error("Error triggering print:", error);
              // Clean up on error
              if (currentIframe && document.body.contains(currentIframe)) {
                document.body.removeChild(currentIframe);
              }
              if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
              }
              printIframeRef.current = null;
              setPrintReportData(null);
            }
          }, 500);
        };

        iframe.onerror = () => {
          console.error("Error loading PDF in iframe");
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }
          if (currentIframe && document.body.contains(currentIframe)) {
            document.body.removeChild(currentIframe);
          }
          printIframeRef.current = null;
          setPrintReportData(null);
        };
      } catch (error) {
        console.error("Error generating PDF:", error);
        showToast.error("Failed to generate PDF. Please try again.");
        setPrintReportData(null);
      }
    };

    generateAndPrint();

    // Cleanup function
    return () => {
      isMounted = false;
      
      // Remove event listener
      if (afterPrintHandler) {
        window.removeEventListener('afterprint', afterPrintHandler);
      }
      
      // Clean up iframe and URL
      if (currentIframe && document.body.contains(currentIframe)) {
        try {
          document.body.removeChild(currentIframe);
        } catch (e) {
          console.warn("Error removing iframe in cleanup:", e);
        }
      }
      
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      
      if (printIframeRef.current && document.body.contains(printIframeRef.current)) {
        try {
          if (printIframeRef.current.src) {
            URL.revokeObjectURL(printIframeRef.current.src);
          }
          document.body.removeChild(printIframeRef.current);
        } catch (e) {
          console.warn("Error removing iframe ref in cleanup:", e);
        }
      }
      
      printIframeRef.current = null;
    };
  }, [printReportData, printKey]);


  // Get unique values for filter dropdowns
  const uniqueFactoryNames = [...new Set(reports.map(r => r.factoryName).filter(Boolean))].sort();
  const uniqueMoNumbers = [...new Set(reports.map(r => r.moNo).filter(Boolean))].sort();
  const uniqueBuyers = [...new Set(reports.map(r => r.buyerStyle).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(reports.map(r => r.status).filter(Boolean))].sort();
  const uniqueInspectors = [...new Set(reports.map(r => r.inspector).filter(Boolean))].sort();
  const uniqueResults = [...new Set(reports.map(r => r.result).filter(Boolean))].sort();

  const filteredReports = reports.filter((report) => {
    // Filter by Date Range
    if (report.inspectionDate) {
      const reportDate = new Date(report.inspectionDate);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      if (reportDate < start || reportDate > end) {
        return false;
      }
    }
    
    // Filter by Factory Name
    if (appliedFactoryName && report.factoryName !== appliedFactoryName) {
      return false;
    }
    
    // Filter by MO Number
    if (appliedMoNumber && report.moNo !== appliedMoNumber) {
      return false;
    }
    
    // Filter by Buyer
    if (appliedBuyer && report.buyerStyle !== appliedBuyer) {
      return false;
    }
    
    // Filter by Status
    if (appliedStatus && report.status !== appliedStatus) {
      return false;
    }
    
    // Filter by Inspector
    if (appliedInspector && report.inspector !== appliedInspector) {
      return false;
    }
    
    // Filter by Result
    if (appliedResult && report.result !== appliedResult) {
      return false;
    }
    
    // Search term filter (searches across multiple fields)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        report.moNo?.toLowerCase().includes(searchLower) ||
        report.factoryName?.toLowerCase().includes(searchLower) ||
        report.inspector?.toLowerCase().includes(searchLower) ||
        report.buyerStyle?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) {
        return false;
      }
    }
    
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getResultBadgeClass = (result) => {
    switch (result?.toLowerCase()) {
      case "pass":
        return "bg-green-100 text-green-800";
      case "reject":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate dropdown menu position (smart positioning: last 3 records open up only if not enough space below, all others always down)
  const getMenuPosition = (reportId, index) => {
    const buttonElement = menuRefs.current[reportId];
    if (!buttonElement) {
      return { top: 0, left: 0, openUp: false };
    }

    const buttonRect = buttonElement.getBoundingClientRect();
    const menuHeight = 200; // Approximate height of the menu (reduced due to compact spacing)
    const menuWidth = 224; // 56 * 4 = 224px (w-56)
    const spacing = 4;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const totalRecords = filteredReports.length;

    // Check if this is one of the last 3 records
    const isLastThree = index >= totalRecords - 3;
    
    // Calculate available space
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    // For last 3 records: open upward only if not enough space below, otherwise open downward
    // For all other records: always open downward (normal behavior)
    let openUp;
    if (isLastThree) {
      // Last 3 records: check if there's enough space below
      // If enough space, open down; if not, open up
      openUp = spaceBelow < menuHeight;
    } else {
      // All other records: always open downward
      openUp = false;
    }

    // Calculate top position
    let top;
    if (openUp) {
      // Position above the button
      top = buttonRect.top - menuHeight - spacing;
      // Ensure menu doesn't go above viewport
      top = Math.max(8, top);
    } else {
      // Position below the button
      top = buttonRect.bottom + spacing;
      // Ensure menu doesn't go below viewport
      if (top + menuHeight > viewportHeight - 8) {
        top = viewportHeight - menuHeight - 8;
      }
    }

    // Calculate left position (align to right edge of button, with margin)
    let left = Math.max(8, buttonRect.right - menuWidth);
    // Ensure menu doesn't go off-screen on the left or right
    if (left + menuWidth > viewportWidth - 8) {
      left = viewportWidth - menuWidth - 8;
    }

    return { top, left, openUp };
  };

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        confirmColor={confirmDialog.confirmColor}
      />
      <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("embPrinting.reports.filters", "Filters")}
          </h3>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle size={18} />
            Apply Filter
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("embPrinting.reports.startDate", "Start Date")}
            </label>
            <DatePicker
              selected={startDate}
              onChange={handleStartDateChange}
              dateFormat="MM/dd/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("embPrinting.reports.endDate", "End Date")}
            </label>
            <DatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              dateFormat="MM/dd/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("embPrinting.reports.factory", "Factory")}
            </label>
            <select
              value={filterFactoryName}
              onChange={(e) => setFilterFactoryName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Factories</option>
              {uniqueFactoryNames.map((factory) => (
                <option key={factory} value={factory}>
                  {factory}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("embPrinting.reports.moNo", "MO Number")}
            </label>
            <select
              value={filterMoNumber}
              onChange={(e) => setFilterMoNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All MO Numbers</option>
              {uniqueMoNumbers.map((moNo) => (
                <option key={moNo} value={moNo}>
                  {moNo}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("embPrinting.reports.buyer", "Buyer")}
            </label>
            <select
              value={filterBuyer}
              onChange={(e) => setFilterBuyer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Buyers</option>
              {uniqueBuyers.map((buyer) => (
                <option key={buyer} value={buyer}>
                  {buyer}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("embPrinting.reports.inspector", "Inspector")}
            </label>
            <select
              value={filterInspector}
              onChange={(e) => setFilterInspector(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Inspectors</option>
              {uniqueInspectors.map((inspector) => (
                <option key={inspector} value={inspector}>
                  {inspector}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("embPrinting.reports.status", "Status")}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("embPrinting.reports.result", "Result")}
            </label>
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Results</option>
              {uniqueResults.map((result) => (
                <option key={result} value={result}>
                  {result}
                </option>
              ))}
            </select>
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("embPrinting.reports.search", "Search")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("embPrinting.reports.searchPlaceholder", "MO, Factory, Inspector...")}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div> */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 flex items-end justify-end gap-2">
            <button
              onClick={() => {
                setFilterFactoryName("");
                setFilterMoNumber("");
                setFilterBuyer("");
                setFilterStatus("");
                setFilterInspector("");
                setFilterResult("");
                setAppliedFactoryName("");
                setAppliedMoNumber("");
                setAppliedBuyer("");
                setAppliedStatus("");
                setAppliedInspector("");
                setAppliedResult("");
                setSearchTerm("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              title="Clear all filters"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FileText size={20} className="mr-2" />
              {t("embPrinting.reports.title", "Reports")}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredReports.length})
              </span>
            </h3>
            <button
              onClick={() => {
                if (fetchReports) {
                  fetchReports(startDate, endDate);
                }
              }}
              disabled={reportsLoading}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh reports list"
            >
              <RefreshCw 
                size={18} 
                className={reportsLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {reportsLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : reportsError ? (
          <div className="p-6 text-center">
            <p className="text-red-600">{reportsError}</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {t("embPrinting.reports.noReports", "No reports found for the selected date range.")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("embPrinting.reports.date", "Date")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("embPrinting.reports.moNo", "MO Number")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("embPrinting.reports.factory", "Factory")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("embPrinting.reports.buyer", "Buyer")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("embPrinting.reports.inspector", "Inspector")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("embPrinting.reports.totalPcs", "Total Pcs")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("embPrinting.reports.defects", "Defects")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("embPrinting.reports.result", "Result")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("embPrinting.reports.status", "Status")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("embPrinting.reports.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report, index) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(report.inspectionDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {report.moNo || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {report.factoryName || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {report.buyerStyle || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {report.inspector || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {report.totalPcs || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {report.defectsQty || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getResultBadgeClass(
                          report.result
                        )}`}
                      >
                        {report.result || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                          report.status
                        )}`}
                      >
                        {report.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="relative inline-block" ref={el => {
                        if (el) menuRefs.current[report._id] = el;
                      }}>
                        <button
                          type="button"
                          className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleMenuToggle(report._id);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          aria-label="Actions menu"
                          aria-expanded={openMenuId === report._id}
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {/* Dropdown Menu - Fixed positioning to prevent scroll issues */}
                        {openMenuId === report._id && (() => {
                          const menuPosition = getMenuPosition(report._id, index);
                          return (
                            <div 
                              className="fixed bg-white rounded-md shadow-2xl z-[9999] border border-gray-200 overflow-hidden w-56"
                              style={{
                                top: `${menuPosition.top}px`,
                                left: `${menuPosition.left}px`,
                                transform: menuPosition.openUp ? 'translateY(24px)' : 'translateY(0px)',
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                            <div className="py-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewInspection(report);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                              >
                                <Eye size={16} className="text-blue-600" />
                                View Inspection
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(report);
                                  setOpenMenuId(null);
                                }}
                                disabled={report.status === "Approved" || report.status === "Rejected"}
                                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700"
                                title={report.status === "Approved" ? "Already approved" : report.status === "Rejected" ? "Cannot approve rejected inspection" : "Approve this inspection"}
                              >
                                <CheckCircle size={16} className="text-green-600" />
                                Approve Inspection
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(report);
                                  setOpenMenuId(null);
                                }}
                                disabled={report.status === "Approved" || report.status === "Rejected"}
                                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-700"
                                title={report.status === "Rejected" ? "Already rejected" : report.status === "Approved" ? "Cannot reject approved inspection" : "Reject this inspection"}
                              >
                                <XCircle size={16} className="text-red-600" />
                                Reject Inspection
                              </button>
                              <div className="border-t border-gray-200 my-0.5"></div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPDF(report);
                                }}
                                disabled={loadingPdf[report._id]}
                                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loadingPdf[report._id] ? (
                                  <>
                                    <Loader2 size={16} className="animate-spin text-blue-600" />
                                    Loading PDF...
                                  </>
                                ) : (
                                  <>
                                    <Download size={16} className="text-blue-600" />
                                    Download PDF
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintPDF(report);
                                }}
                                disabled={loadingPdf[report._id]}
                                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Printer size={16} className="text-gray-600" />
                                Print PDF
                              </button>
                            </div>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default EMBReportsTab;

