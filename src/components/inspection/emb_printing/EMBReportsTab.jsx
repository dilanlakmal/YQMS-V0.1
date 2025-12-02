import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import {
  Loader2,
  FileText,
  Search,
  RefreshCw,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  MoreVertical
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import EMBReportPDF from "./EMBReportPDF";
import Swal from "sweetalert2";


const EMBReportsTab = ({ formData, onFormDataChange, onSubmitHandlerRef, isSubmitting, setIsSubmitting, inspectionType }) => {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [endDate, setEndDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedReport, setSelectedReport] = useState({});
  const [loadingPdf, setLoadingPdf] = useState({});
  const [printReportData, setPrintReportData] = useState(null);
  const [printKey, setPrintKey] = useState(0);
  const menuRefs = useRef({});
  const printIframeRef = useRef(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scc/subcon-emb-reports`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      
      if (response.data.success) {
        setReports(response.data.data || []);
      } else {
        setReports([]);
        setError(response.data.message || "Failed to load reports.");
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      if (err.response?.status === 404) {
        setError("Report endpoint not found. Please check the API.");
      } else if (err.response?.status === 500) {
        setError(err.response?.data?.message || "Server error. Please try again later.");
      } else {
        setError("Failed to load reports. Please try again.");
      }
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportDetails = async (reportId, showLoading = false) => {
    if (selectedReport[reportId]) {
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
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load report details. Please try again."
      });
    } finally {
      if (showLoading) {
        setLoadingPdf(prev => ({ ...prev, [reportId]: false }));
      }
    }
    return null;
  };

  const handleDownloadPDF = async (report) => {
    const reportData = await fetchReportDetails(report._id, true);
    if (!reportData) {
      return;
    }
    // Keep menu open to show the PDFDownloadLink
    // The user can then click it to download
  };

  const handlePrintPDF = async (report) => {
    setOpenMenuId(null);
    const reportData = await fetchReportDetails(report._id, true);
    if (!reportData) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load report data for printing."
      });
      return;
    }

    // Set the report data with unique key to force regeneration - useEffect will handle printing reactively
    setPrintReportData(reportData);
    setPrintKey(prev => prev + 1); // Force regeneration even for same report
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

    // Prevent body scroll when menu is open
    if (openMenuId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = '';
    };
  }, [openMenuId]);

  const handleMenuToggle = (reportId) => {
    setOpenMenuId(openMenuId === reportId ? null : reportId);
  };

  const handleApprove = async (report) => {
    const result = await Swal.fire({
      title: "Approve Inspection?",
      text: "Are you sure you want to approve this inspection?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      try {
        // TODO: Implement approve API endpoint
        await Swal.fire({
          icon: "success",
          title: "Approved!",
          text: "Inspection has been approved successfully.",
          timer: 2000
        });
        setOpenMenuId(null);
        fetchReports();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Failed to approve inspection. Please try again."
        });
      }
    }
  };

  const handleRebook = async (report) => {
    const result = await Swal.fire({
      title: "Rebook Inspection?",
      text: "Are you sure you want to rebook this inspection?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Rebook",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      try {
        // TODO: Implement rebook API endpoint
        await Swal.fire({
          icon: "success",
          title: "Rebooked!",
          text: "Inspection has been rebooked successfully.",
          timer: 2000
        });
        setOpenMenuId(null);
        fetchReports();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Failed to rebook inspection. Please try again."
        });
      }
    }
  };


  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

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

        // Generate PDF blob from current state
        const blob = await pdf(<EMBReportPDF report={printReportData} />).toBlob();
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
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to generate PDF. Please try again."
        });
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


  const filteredReports = reports.filter((report) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      report.moNo?.toLowerCase().includes(searchLower) ||
      report.factoryName?.toLowerCase().includes(searchLower) ||
      report.inspector?.toLowerCase().includes(searchLower) ||
      report.buyerStyle?.toLowerCase().includes(searchLower)
    );
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

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t("embPrinting.reports.filters", "Filters")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("embPrinting.reports.startDate", "Start Date")}
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
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
              onChange={(date) => setEndDate(date)}
              dateFormat="MM/dd/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
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
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReports}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={18} className="mr-2" />
              {t("embPrinting.reports.refresh", "Refresh")}
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <FileText size={20} className="mr-2" />
            {t("embPrinting.reports.title", "Submitted Reports")}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredReports.length})
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">{error}</p>
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
                    {t("embPrinting.reports.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
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
                        {openMenuId === report._id && (
                          <div 
                            className="fixed bg-white rounded-md shadow-2xl z-[9999] border border-gray-200 overflow-hidden w-56"
                            style={{
                              top: `${(menuRefs.current[report._id]?.getBoundingClientRect().bottom || 0) + 4}px`,
                              right: `${Math.max(8, window.innerWidth - (menuRefs.current[report._id]?.getBoundingClientRect().right || 0))}px`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(report);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors"
                              >
                                <CheckCircle size={16} className="text-green-600" />
                                Approve Inspection
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRebook(report);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors"
                              >
                                <XCircle size={16} className="text-red-600" />
                                Rebook Inspection
                              </button>
                              <div className="border-t border-gray-200 my-1"></div>
                              {loadingPdf[report._id] ? (
                                <div className="w-full text-left px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
                                  <Loader2 size={16} className="animate-spin text-blue-600" />
                                  Loading PDF data...
                                </div>
                              ) : selectedReport[report._id] ? (
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <PDFDownloadLink
                                    document={<EMBReportPDF report={selectedReport[report._id]} />}
                                    fileName={`EMB_Report_${report.moNo}_${new Date().toISOString().split("T")[0]}.pdf`}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                                  >
                                    {({ loading: pdfLoading }) => (
                                      <>
                                        <Download size={16} className="text-blue-600" />
                                        {pdfLoading ? "Generating PDF..." : "Download PDF"}
                                      </>
                                    )}
                                  </PDFDownloadLink>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadPDF(report);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                                >
                                  <Download size={16} className="text-blue-600" />
                                  Download PDF
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintPDF(report);
                                }}
                                disabled={loadingPdf[report._id]}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Printer size={16} className="text-gray-600" />
                                Print PDF
                              </button>
                            </div>
                          </div>
                        )}
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
  );
};

export default EMBReportsTab;

