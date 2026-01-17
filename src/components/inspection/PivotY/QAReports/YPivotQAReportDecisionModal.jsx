import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  User,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Gavel,
  Save,
  Loader2
} from "lucide-react";
import { createPortal } from "react-dom";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// Helper to resolve photo URL (similar to your existing one)
const getUserPhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url.substring(1) : url;
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL
    : `${PUBLIC_ASSET_URL}/`;
  return `${baseUrl}${cleanPath}`;
};

const YPivotQAReportDecisionModal = ({
  isOpen,
  onClose,
  report,
  user, // Logged in user from useAuth
  onSubmit // Function to handle the actual API call/save
}) => {
  const [status, setStatus] = useState("Approved");
  const [comment, setComment] = useState("");
  const [leaderDetails, setLeaderDetails] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch full details for the logged-in user (Leader) to get Photo/Title
  useEffect(() => {
    const fetchLeaderDetails = async () => {
      if (isOpen && user?.emp_id) {
        setLoadingUser(true);
        try {
          // Assuming you have this endpoint, otherwise fallback to user object
          const res = await axios.get(
            `${API_BASE_URL}/api/user-details?empId=${user.emp_id}`
          );
          if (res.data) {
            setLeaderDetails(res.data);
          }
        } catch (error) {
          console.error("Error fetching leader details", error);
          // Fallback to basic auth user info if fetch fails
          setLeaderDetails({
            emp_id: user.emp_id,
            eng_name: user.eng_name || user.username,
            job_title: "Leader / Manager",
            face_photo: user.face_photo || null
          });
        } finally {
          setLoadingUser(false);
        }
      }
    };
    fetchLeaderDetails();
  }, [isOpen, user]);

  // 2. Handle Auto-Comment Logic
  useEffect(() => {
    if (status === "Approved" && report && user) {
      const dateStr = new Date(report.inspectionDate).toLocaleDateString();
      const orderStr = report.orderNos ? report.orderNos.join(", ") : "N/A";
      const approverName =
        leaderDetails?.eng_name || user.eng_name || "Unknown";

      const autoText = `Report ID: ${report.reportId}
Inspection Date: ${dateStr}
Order No: ${orderStr}
Report Type: ${report.reportType}
QA ID: ${report.empId}

Report has been approved by ${user.emp_id} - ${approverName}`;

      setComment(autoText);
    } else {
      // Clear comment for Rework/Reject so user can type manually
      // Only clear if it matches the previous auto-text (optional UX polish),
      // but for now, we reset to empty as requested.
      setComment("");
    }
  }, [status, report, user, leaderDetails]);

  const handleSubmit = async () => {
    setSubmitting(true);
    // Mimic API delay or call passed prop
    try {
      if (onSubmit) {
        await onSubmit({ status, comment, leaderId: user.emp_id });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Leader Decision
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* 1. User Info Box */}
          <div className="mb-6 bg-gradient-to-r from-slate-50 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden">
            {/* Decorative bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>

            <div className="w-14 h-14 rounded-full border-2 border-white dark:border-gray-600 shadow-md overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center">
              {loadingUser ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : leaderDetails?.face_photo ? (
                <img
                  src={getUserPhotoUrl(leaderDetails.face_photo)}
                  alt="Leader"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                Decision By
              </p>
              <h4 className="text-base font-black text-gray-800 dark:text-white truncate">
                {leaderDetails?.eng_name || user?.eng_name || "Unknown"}
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-200 font-bold border border-gray-200 dark:border-gray-500">
                  {user?.emp_id}
                </span>
                <span className="text-gray-400">•</span>
                <span className="truncate">
                  {leaderDetails?.job_title || "Manager"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Decision Buttons */}
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase block mb-3">
              Select Decision
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Approve */}
              <button
                onClick={() => setStatus("Approved")}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  status === "Approved"
                    ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-green-300 hover:bg-green-50/50"
                }`}
              >
                <div
                  className={`p-1.5 rounded-full ${
                    status === "Approved"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase">Approve</span>
              </button>

              {/* Rework */}
              <button
                onClick={() => setStatus("Rework")}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  status === "Rework"
                    ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <div
                  className={`p-1.5 rounded-full ${
                    status === "Rework"
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase">Rework</span>
              </button>

              {/* Reject */}
              <button
                onClick={() => setStatus("Rejected")}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  status === "Rejected"
                    ? "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-red-300 hover:bg-red-50/50"
                }`}
              >
                <div
                  className={`p-1.5 rounded-full ${
                    status === "Rejected"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase">Reject</span>
              </button>
            </div>
          </div>

          {/* 3. Comment Box */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2 flex justify-between">
              <span>Decision Comments</span>
              <span
                className={`text-[10px] ${
                  status === "Approved" ? "text-indigo-500" : "text-gray-400"
                }`}
              >
                {status === "Approved" ? "Auto-Generated" : "Manual Entry"}
              </span>
            </label>
            <textarea
              className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-shadow"
              placeholder={
                status === "Approved"
                  ? "Auto-generated message..."
                  : "Please provide reasons for rework or rejection..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg flex items-center gap-2 transition-transform active:scale-95 ${
              status === "Rejected"
                ? "bg-red-600 hover:bg-red-700"
                : status === "Rework"
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Confirm {status}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default YPivotQAReportDecisionModal;
