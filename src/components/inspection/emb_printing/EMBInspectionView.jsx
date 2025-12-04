import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ConfirmDialog from "./ComfirmModal/ConfirmDialog";

const EMBInspectionView = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    onConfirm: null
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/subcon-emb-report/${reportId}`
        );
        if (response.data.success) {
          setReport(response.data.data);
        } else {
          setError("Failed to load report data.");
        }
      } catch (err) {
        console.error("Error fetching report:", err);
        setError("Failed to load report data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (error) {
      return "N/A";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = String(hours).padStart(2, "0");
      return `${month}/${day}/${year}, ${formattedHours}:${minutes} ${ampm}`;
    } catch (error) {
      return "N/A";
    }
  };

  const formatInspectionDateTime = (dateString, timeString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      if (timeString) {
        const timeParts = timeString.split(":");
        let hours = parseInt(timeParts[0], 10);
        let minutes = timeParts[1] ? String(timeParts[1]).padStart(2, "0") : "00";
        let ampm = hours >= 12 ? "PM" : "AM";
        let formattedHours = hours % 12;
        formattedHours = formattedHours ? formattedHours : 12;
        formattedHours = String(formattedHours).padStart(2, "0");
        const formattedTime = `${formattedHours}:${minutes} ${ampm}`;

        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}, ${formattedTime}`;
      }

      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = String(hours).padStart(2, "0");
      return `${month}/${day}/${year}, ${formattedHours}:${minutes} ${ampm}`;
    } catch (error) {
      return "N/A";
    }
  };

  const getResultBadgeClass = (result) => {
    if (!result) return "bg-yellow-100 text-yellow-800";
    
    const lowerResult = result.toLowerCase();
    switch (lowerResult) {
      case "pass":
      case "approved":
        return "bg-green-100 text-green-800";
      case "reject":
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const calculateDefectCounts = () => {
    if (!report?.defects || report.defects.length === 0) {
      return { critical: 0, major: 0, minor: 0 };
    }
    
    let critical = 0, major = 0, minor = 0;
    report.defects.forEach(defect => {
      const category = defect.category?.toLowerCase() || "";
      const qty = defect.qty || defect.count || 0;
      
      if (category.includes("critical")) {
        critical += qty;
      } else if (category.includes("major")) {
        major += qty;
      } else {
        minor += qty;
      }
    });
    
    return { critical, major, minor };
  };

  const defectCounts = calculateDefectCounts();

  const handleApprove = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Approve Inspection?",
      message: "Are you sure you want to approve this inspection?",
      type: "question",
      confirmText: "Yes, Approve",
      cancelText: "Cancel",
      confirmColor: "green",
      onConfirm: async () => {
        setProcessing(true);
        try {
          const response = await axios.patch(
            `${API_BASE_URL}/api/scc/subcon-emb-report/${reportId}/approve`
          );
          
          if (response.data.success) {
            // Update local report state
            setReport(prev => ({
              ...prev,
              status: "Approved",
              result: "Pass"
            }));
            
            toast.success("Inspection has been approved successfully.");
            
            // Refresh the report data
            const fetchReport = async () => {
              try {
                const res = await axios.get(
                  `${API_BASE_URL}/api/scc/subcon-emb-report/${reportId}`
                );
                if (res.data.success) {
                  setReport(res.data.data);
                }
              } catch (err) {
                console.error("Error refreshing report:", err);
              }
            };
            fetchReport();
          } else {
            throw new Error(response.data.message || "Failed to approve inspection");
          }
        } catch (err) {
          console.error("Error approving inspection:", err);
          toast.error(err.response?.data?.message || err.message || "Failed to approve inspection. Please try again.");
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  const handleReject = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Reject Inspection?",
      message: "Are you sure you want to reject this inspection?",
      type: "warning",
      confirmText: "Yes, Reject",
      cancelText: "Cancel",
      confirmColor: "red",
      onConfirm: async () => {
        setProcessing(true);
        try {
          const response = await axios.patch(
            `${API_BASE_URL}/api/scc/subcon-emb-report/${reportId}/reject`
          );
          
          if (response.data.success) {
            // Update local report state
            setReport(prev => ({
              ...prev,
              status: "Rejected",
              result: "Reject"
            }));
            
            toast.success("Inspection has been rejected successfully.");
            
            // Refresh the report data
            const fetchReport = async () => {
              try {
                const res = await axios.get(
                  `${API_BASE_URL}/api/scc/subcon-emb-report/${reportId}`
                );
                if (res.data.success) {
                  setReport(res.data.data);
                }
              } catch (err) {
                console.error("Error refreshing report:", err);
              }
            };
            fetchReport();
          } else {
            throw new Error(response.data.message || "Failed to reject inspection");
          }
        } catch (err) {
          console.error("Error rejecting inspection:", err);
          toast.error(err.response?.data?.message || err.message || "Failed to reject inspection. Please try again.");
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  const normalizeImageUrl = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    
    if (imageUrl.startsWith("data:")) {
      return imageUrl;
    }
    
    let fullUrl = imageUrl;
    
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      fullUrl = imageUrl;
    } else if (imageUrl.startsWith("/storage/")) {
      fullUrl = `${API_BASE_URL}${imageUrl}`;
    } else if (imageUrl.startsWith("/")) {
      fullUrl = `${API_BASE_URL}${imageUrl}`;
    } else {
      fullUrl = `${API_BASE_URL}/storage/sub-emb-images/${imageUrl}`;
    }
    
    return fullUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Report not found"}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const checklistItems = [
    { key: "orderType", label: "Order Type" },
    { key: "samplesAvailable", label: "Samples Available?" },
    { key: "labAnalysisTesting", label: "Lab Analysis & Testing" },
    { key: "masterCartonRequirements", label: "Master Carton Requirements?" },
    { key: "dropTest", label: "Drop Test?" },
    { key: "price", label: "Price?" },
    { key: "hangTags", label: "Hang Tags?" },
    { key: "labels", label: "Labels?" },
    { key: "composition", label: "Composition" }
  ];

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
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
      <div className="min-h-screen bg-gray-50">
      {/* Header with Action Buttons */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {report.inspectionType || "First Output"}
                {report.reportType === "EMB + Print" ? " - EMB + Print" : report.reportType === "Printing" ? " - Printing" : " - EMB"}
              </h1>
              <p className="text-sm text-gray-500">
                Inspection #: {report.moNo || "N/A"} | Group #: {report._id?.slice(-6) || "N/A"}
              </p>
            </div>
            <div className="flex gap-2" style={{ margin: 0, padding: 0 }}>
              <button
                onClick={handleApprove}
                disabled={processing || report.status === "Approved" || report.status === "Rejected"}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ margin: 0, padding: '8px 16px' }}
                title={report.status === "Approved" ? "Already approved" : report.status === "Rejected" ? "Cannot approve rejected inspection" : "Approve this inspection"}
              >
                <CheckCircle size={18} />
                Approve Inspection
              </button>
              <button
                onClick={handleReject}
                disabled={processing || report.status === "Approved" || report.status === "Rejected"}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ margin: 0, padding: '8px 16px' }}
                title={report.status === "Rejected" ? "Already rejected" : report.status === "Approved" ? "Cannot reject approved inspection" : "Reject this inspection"}
              >
                <XCircle size={18} />
                Reject Inspection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Status and Result Badges */}
        <div className="mb-6 flex gap-3">
          <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getResultBadgeClass(report.status)}`}>
            {report.status || "Pending"}
          </span>
          <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getResultBadgeClass(report.result)}`}>
            {report.result || "Pending"}
          </span>
        </div>

        {/* Inspection Details Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="bg-blue-900 text-white px-4 py-2 rounded-t-lg">
            <h2 className="text-lg font-bold">Inspection Details</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded">
              <div className="text-center">
                <p className="text-xs font-bold text-gray-600 mb-1">Scheduled Inspection Date:</p>
                <p className="text-sm text-gray-900">{formatDateTime(report.inspectionDate)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-600 mb-1">Inspection Time:</p>
                <p className="text-sm text-gray-900">{formatInspectionDateTime(report.inspectionDate, report.inspectionTime)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex border-b pb-2">
                <div className="w-2/5 font-bold text-gray-700">Report Type:</div>
                <div className="w-3/5 text-gray-900">
                  {report.inspectionType || "First Output"} - {report.reportType || "EMB"}
                </div>
              </div>
              <div className="flex border-b pb-2">
                <div className="w-2/5 font-bold text-gray-700">Factory Name:</div>
                <div className="w-3/5 text-gray-900">{report.factoryName || "N/A"}</div>
              </div>
              <div className="flex border-b pb-2">
                <div className="w-2/5 font-bold text-gray-700">Inspector:</div>
                <div className="w-3/5 text-gray-900">{report.inspector || "N/A"}</div>
              </div>
              <div className="flex border-b pb-2">
                <div className="w-2/5 font-bold text-gray-700">MO Number:</div>
                <div className="w-3/5 text-gray-900">{report.moNo || "N/A"}</div>
              </div>
              <div className="flex border-b pb-2">
                <div className="w-2/5 font-bold text-gray-700">Buyer:</div>
                <div className="w-3/5 text-gray-900">{report.buyer || "N/A"}</div>
              </div>
              <div className="flex border-b pb-2">
                <div className="w-2/5 font-bold text-gray-700">Buyer Style:</div>
                <div className="w-3/5 text-gray-900">{report.buyerStyle || "N/A"}</div>
              </div>
              <div className="flex border-b pb-2">
                <div className="w-2/5 font-bold text-gray-700">Color:</div>
                <div className="w-3/5 text-gray-900">
                  {Array.isArray(report.color) ? report.color.join(", ") : report.color || "N/A"}
                </div>
              </div>
              <div className="flex border-b pb-2">
                <div className="w-2/5 font-bold text-gray-700">SKU #:</div>
                <div className="w-3/5 text-gray-900">
                  {Array.isArray(report.skuNumber) ? report.skuNumber.join(", ") : report.skuNumber || "N/A"}
                </div>
              </div>
             
              <div className="flex border-b pb-2">
                <div className="w-2/5 font-bold text-gray-700">Sample Inspected:</div>
                <div className="w-3/5 text-gray-900">{report.aqlData?.sampleSize || report.totalPcs || 0}</div>
              </div>
              <div className="flex border-b pb-2">
                <div className="w-2/5 font-bold text-gray-700">Total PO Items Qty:</div>
                <div className="w-3/5 text-gray-900">{report.totalOrderQty || 0}</div>
              </div>
              <div className="flex border-b pb-2">
                <div className="w-2/5 font-bold text-gray-700">Inspected Qty (Pcs):</div>
                <div className="w-3/5 text-gray-900">{report.totalPcs || 0}</div>
              </div>
              {(report.reportType === "EMB" || report.reportType === "EMB + Print") && report.embDetails && (
                <>
                  <div className="flex border-b pb-2">
                    <div className="w-2/5 font-bold text-gray-700">EMB Speed:</div>
                    <div className="w-3/5 text-gray-900">{report.embDetails.speed || "N/A"}</div>
                  </div>
                  <div className="flex border-b pb-2">
                    <div className="w-2/5 font-bold text-gray-700">EMB Stitch:</div>
                    <div className="w-3/5 text-gray-900">{report.embDetails.stitch || "N/A"}</div>
                  </div>
                  <div className="flex border-b pb-2">
                    <div className="w-2/5 font-bold text-gray-700">EMB Needle Size:</div>
                    <div className="w-3/5 text-gray-900">{report.embDetails.needleSize || "N/A"}</div>
                  </div>
                  <div className="flex border-b pb-2">
                    <div className="w-2/5 font-bold text-gray-700">EMB Machine No:</div>
                    <div className="w-3/5 text-gray-900">{report.embDetails.machineNo || "N/A"}</div>
                  </div>
                </>
              )}
              {(report.reportType === "Printing" || report.reportType === "EMB + Print") && report.printingDetails && (
                <>
                  <div className="flex border-b pb-2">
                    <div className="w-2/5 font-bold text-gray-700">Printing Method:</div>
                    <div className="w-3/5 text-gray-900">{report.printingDetails.method || "N/A"}</div>
                  </div>
                  <div className="flex border-b pb-2">
                    <div className="w-2/5 font-bold text-gray-700">Curing:</div>
                    <div className="w-3/5 text-gray-900">{report.printingDetails.curing || "N/A"}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Checklists Section */}
        {report.checklist && Object.keys(report.checklist).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="bg-blue-900 text-white px-4 py-2 rounded-t-lg">
              <h2 className="text-lg font-bold">Checklists</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {checklistItems.map((item) => {
                  const value = report.checklist[item.key];
                  if (!value) return null;
                  return (
                    <div key={item.key} className="flex border-b pb-2">
                      <div className="w-2/5 text-gray-700">{item.label}:</div>
                      <div className="w-3/5 text-green-600 font-bold text-center">{value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Photos Section */}
        {report.photos && Object.keys(report.photos).length > 0 && (() => {
          const photoKeys = Object.keys(report.photos);
          let totalPhotos = 0;
          photoKeys.forEach(key => {
            const category = report.photos[key];
            if (Array.isArray(category?.photos)) {
              totalPhotos += category.photos.length;
            } else if (Array.isArray(category)) {
              totalPhotos += category.length;
            }
          });
          
          if (totalPhotos === 0) return null;
          
          return (
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="bg-blue-900 text-white px-4 py-2 rounded-t-lg">
                <h2 className="text-lg font-bold">Photos</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {photoKeys.map((categoryId) => {
                    const category = report.photos[categoryId];
                    const categoryTitle = category?.categoryTitle || categoryId;
                    let photos = [];
                    
                    if (Array.isArray(category?.photos)) {
                      photos = category.photos;
                    } else if (Array.isArray(category)) {
                      photos = category;
                    }
                    
                    if (photos.length === 0) return null;
                    
                    // Get the first photo (only one image per category)
                    const photo = photos[0];
                    const rawImageUrl = photo?.url || photo?.preview || photo;
                    if (!rawImageUrl || typeof rawImageUrl !== 'string') return null;
                    
                    const imageUrl = normalizeImageUrl(rawImageUrl);
                    if (!imageUrl) return null;
                    
                    return (
                      <div key={categoryId} className="border border-gray-200 rounded-md bg-white shadow-sm">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h3 className="font-medium text-gray-700 text-sm truncate" title={categoryTitle}>
                            {categoryTitle} ({photos.length})
                          </h3>
                        </div>
                        <div className="p-4">
                          <img
                            src={imageUrl}
                            alt={photo?.description || categoryTitle}
                            className="w-full h-64 object-contain mb-3"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3EImage not available%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          {photo?.description && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                                {photo.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Conclusion Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="bg-blue-900 text-white px-4 py-2 rounded-t-lg">
            <h2 className="text-lg font-bold">Conclusion</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-gray-700">Inspection Result</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full ${getResultBadgeClass(report.result)}`}>
                  {report.result || "Pending"}
                </span>
              </div>
              {/* <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-gray-700">Approval Status</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full ${getResultBadgeClass(report.result)}`}>
                  {report.result === "Pass" ? "Accepted" : report.result === "Reject" ? "Rejected" : "Pending"}
                </span>
              </div> */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-gray-700">Checklists</span>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">PASS</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-gray-700">Packing, Packaging & Labelling</span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${getResultBadgeClass(report.packingResult)}`}>
                    {report.packingResult || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-gray-700">Workmanship</span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${getResultBadgeClass(report.workmanshipResult)}`}>
                    {report.workmanshipResult || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-gray-700">Quality Plan</span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${getResultBadgeClass(report.qualityPlanResult)}`}>
                    {report.qualityPlanResult || "N/A"}
                  </span>
                </div>
              </div>
              <div className="mt-4 bg-gray-50 p-4 rounded">
                <h3 className="font-bold text-gray-700 mb-3">Defect Summary</h3>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-gray-600 mb-1">Critical</div>
                    <div className="text-lg font-bold">{defectCounts.critical}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-600 mb-1">Major</div>
                    <div className="text-lg font-bold">{defectCounts.major}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-600 mb-1">Minor</div>
                    <div className="text-lg font-bold">{defectCounts.minor}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-600 mb-1">Total Defective Units</div>
                    <div className="text-lg font-bold">{report.defectsQty || 0}</div>
                  </div>
                </div>
              </div>
              {report.remarks && report.remarks !== "NA" && (
                <div className="mt-4">
                  <div className="font-bold text-gray-700 mb-2">Comments:</div>
                  <div className="text-gray-900 bg-gray-50 p-3 rounded">{report.remarks}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Packing, Packaging & Labelling Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="bg-blue-900 text-white px-4 py-2 rounded-t-lg">
            <h2 className="text-lg font-bold">Packing, Packaging & Labelling</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-7 gap-2 text-xs mb-2">
                  <div className="font-bold text-center">Inspection Method</div>
                  <div className="font-bold text-center">Inspection Level</div>
                  <div className="font-bold text-center">Critical</div>
                  <div className="font-bold text-center">Major</div>
                  <div className="font-bold text-center">Minor</div>
                  <div className="font-bold text-center">Carton Qty</div>
                  <div className="font-bold text-center">Sample Size (Ctns)</div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-xs text-center">
                  <div>normal</div>
                  <div>{report.aqlData?.level || "II"}</div>
                  <div>0.010</div>
                  <div>1.500</div>
                  <div>0.010</div>
                  <div>0</div>
                  <div>0</div>
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <span className="font-bold text-gray-700">Total Defective Units</span>
                <span className="text-lg font-bold">{report.defectsQty || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700">Inspection Result</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full ${getResultBadgeClass(report.packingResult)}`}>
                  {report.packingResult || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Workmanship Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="bg-blue-900 text-white px-4 py-2 rounded-t-lg">
            <h2 className="text-lg font-bold">Workmanship</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-7 gap-2 text-xs mb-2">
                  <div className="font-bold text-center">Inspection Method</div>
                  <div className="font-bold text-center">Inspection Level</div>
                  <div className="font-bold text-center">Critical</div>
                  <div className="font-bold text-center">Major</div>
                  <div className="font-bold text-center">Minor</div>
                  <div className="font-bold text-center">Qty Inspected</div>
                  <div className="font-bold text-center">Sample Inspected</div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-xs text-center">
                  <div>normal</div>
                  <div>{report.aqlData?.level || "II"}</div>
                  <div>0.010</div>
                  <div>1.500</div>
                  <div>0.010</div>
                  <div>{report.totalPcs || 0}</div>
                  <div>{report.aqlData?.sampleSize || 0}</div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div className="font-bold text-center">Critical</div>
                  <div className="font-bold text-center">Major</div>
                  <div className="font-bold text-center">Minor</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-center mb-2">
                  <div>Total Defects</div>
                  <div>Total Defects</div>
                  <div>Total Defects</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-center mb-2">
                  <div>{defectCounts.critical}</div>
                  <div>{defectCounts.major}</div>
                  <div>{defectCounts.minor}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-center mb-2">
                  <div>Accept/Reject Qty</div>
                  <div>Accept/Reject Qty</div>
                  <div>Accept/Reject Qty</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div>{defectCounts.critical === 0 ? "0/1" : "1/0"}</div>
                  <div>{defectCounts.major === 0 ? "0/1" : "1/0"}</div>
                  <div>{defectCounts.minor === 0 ? "0/1" : "1/0"}</div>
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <span className="font-bold text-gray-700">Total Defective Units</span>
                <span className="text-lg font-bold">{report.defectsQty || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700">Inspection Result</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full ${getResultBadgeClass(report.workmanshipResult)}`}>
                  {report.workmanshipResult || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Plan Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="bg-blue-900 text-white px-4 py-2 rounded-t-lg">
            <h2 className="text-lg font-bold">Quality Plan (Quality Plan尺寸表 - ANF)</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-gray-700">Total Defective Units</span>
                <span className="text-lg font-bold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700">Inspection Result</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full ${getResultBadgeClass(report.qualityPlanResult)}`}>
                  {report.qualityPlanResult || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default EMBInspectionView;

