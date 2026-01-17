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
  Loader2,
  Lock
} from "lucide-react";
import { createPortal } from "react-dom";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// Helper to resolve photo URL
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
  user,
  onSubmit
}) => {
  const [status, setStatus] = useState("Approved");

  // Split state: One for system text (read-only), one for user text
  const [autoComment, setAutoComment] = useState("");
  const [additionalComment, setAdditionalComment] = useState("");

  const [leaderDetails, setLeaderDetails] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Leader Details
  useEffect(() => {
    const fetchLeaderDetails = async () => {
      if (isOpen && user?.emp_id) {
        setLoadingUser(true);
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/user-details?empId=${user.emp_id}`
          );
          if (res.data) {
            setLeaderDetails(res.data);
          }
        } catch (error) {
          console.error("Error fetching leader details", error);
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

  // 2. Auto-Generate Comment Logic (For ALL Statuses)
  useEffect(() => {
    if (report && user) {
      const dateStr = new Date(report.inspectionDate).toLocaleDateString();
      const orderStr = report.orderNos ? report.orderNos.join(", ") : "N/A";
      const approverName =
        leaderDetails?.eng_name || user.eng_name || "Unknown";

      // Base Information
      const baseInfo = `Report ID: ${report.reportId}
Inspection Date: ${dateStr}
Order No: ${orderStr}
Report Type: ${report.reportType}
QA ID: ${report.empId}`;

      // Status Specific Message
      let statusMsg = "";
      if (status === "Approved") {
        statusMsg = `\n✅ DECISION: APPROVED by ${user.emp_id} - ${approverName}`;
      } else if (status === "Rework") {
        statusMsg = `\n⚠️ DECISION: Marked for REWORK by ${user.emp_id} - ${approverName}`;
      } else if (status === "Rejected") {
        statusMsg = `\n❌ DECISION: REJECTED by ${user.emp_id} - ${approverName}`;
      }

      setAutoComment(`${baseInfo}\n${statusMsg}`);
    }

    // Reset additional comment when switching back to Approved (optional, usually cleaner)
    if (status === "Approved") {
      setAdditionalComment("");
    }
  }, [status, report, user, leaderDetails]);

  const handleSubmit = async () => {
    if (
      (status === "Rework" || status === "Rejected") &&
      !additionalComment.trim()
    ) {
      alert("Please provide a reason in the Additional Comments section.");
      return;
    }

    setSubmitting(true);
    try {
      // Combine comments for the backend
      let finalComment = autoComment;
      if (additionalComment.trim()) {
        finalComment += `\n\n--- Additional Leader Comments ---\n${additionalComment}`;
      }

      if (onSubmit) {
        await onSubmit({
          status,
          comment: finalComment,
          leaderId: user.emp_id
        });
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* 
         Classes changed for Width/Height:
         - w-full max-w-3xl (Wider on desktop)
         - max-h-[90vh] (Tall, but respects viewport height)
      */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Gavel className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              Leader Decision
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT COLUMN: User Info & Buttons */}
            <div className="space-y-6">
              {/* User Info Box */}
              <div className="bg-gradient-to-r from-slate-50 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
                <div className="w-16 h-16 rounded-full border-2 border-white dark:border-gray-600 shadow-md overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center">
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
                  <h4 className="text-lg font-black text-gray-800 dark:text-white truncate">
                    {leaderDetails?.eng_name || user?.eng_name || "Unknown"}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mt-1">
                    <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-200 font-bold border border-gray-200 dark:border-gray-500">
                      {user?.emp_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decision Buttons */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-3">
                  Select Status
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {/* Approve */}
                  <button
                    onClick={() => setStatus("Approved")}
                    className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left group ${
                      status === "Approved"
                        ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-400 shadow-sm"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-green-300 hover:bg-green-50/50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full transition-colors ${
                        status === "Approved"
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-400 group-hover:text-green-500"
                      }`}
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block font-bold uppercase text-sm">
                        Approve
                      </span>
                      <span className="text-xs opacity-80 font-medium">
                        Result verified OK
                      </span>
                    </div>
                  </button>

                  {/* Rework */}
                  <button
                    onClick={() => setStatus("Rework")}
                    className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left group ${
                      status === "Rework"
                        ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 shadow-sm"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-amber-300 hover:bg-amber-50/50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full transition-colors ${
                        status === "Rework"
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-400 group-hover:text-amber-500"
                      }`}
                    >
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block font-bold uppercase text-sm">
                        Rework
                      </span>
                      <span className="text-xs opacity-80 font-medium">
                        Requires corrections
                      </span>
                    </div>
                  </button>

                  {/* Reject */}
                  <button
                    onClick={() => setStatus("Rejected")}
                    className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left group ${
                      status === "Rejected"
                        ? "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400 shadow-sm"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-red-300 hover:bg-red-50/50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full transition-colors ${
                        status === "Rejected"
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-400 group-hover:text-red-500"
                      }`}
                    >
                      <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block font-bold uppercase text-sm">
                        Reject
                      </span>
                      <span className="text-xs opacity-80 font-medium">
                        Failed inspection
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Comments Area */}
            <div className="flex flex-col h-full">
              {/* 1. Auto-Generated Box (Read Only) */}
              <div className="flex-1 mb-4 flex flex-col">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> System Message (Read-Only)
                </label>
                <textarea
                  disabled
                  className="w-full h-full min-h-[140px] p-4 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-500 dark:text-gray-400 resize-none cursor-not-allowed focus:outline-none opacity-80"
                  value={autoComment}
                ></textarea>
              </div>

              {/* 2. Additional Comments (Only for Rework/Reject) */}
              {status !== "Approved" && (
                <div className="flex-1 flex flex-col animate-fadeIn">
                  <label className="text-xs font-bold text-gray-800 dark:text-white uppercase mb-2 flex justify-between">
                    <span>Additional Comments (Required)</span>
                    <span className="text-xs font-medium normal-case text-indigo-600 dark:text-indigo-400">
                      Write remarks here...
                    </span>
                  </label>
                  <textarea
                    className="w-full h-full min-h-[140px] p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-sans focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-shadow shadow-inner"
                    placeholder={`Please explain why this report is marked for ${status}...`}
                    value={additionalComment}
                    onChange={(e) => setAdditionalComment(e.target.value)}
                  ></textarea>
                </div>
              )}

              {/* Spacer if Approved to keep height consistent or allow white space */}
              {status === "Approved" && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/30">
                  <div className="text-center text-gray-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium">
                      No additional comments needed for Approval.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-8 py-3 rounded-xl text-sm font-bold text-white shadow-xl flex items-center gap-2 transition-transform active:scale-95 ${
              status === "Rejected"
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                : status === "Rework"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500"
                : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600"
            }`}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Confirm Decision
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default YPivotQAReportDecisionModal;
