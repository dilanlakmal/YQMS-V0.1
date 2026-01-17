import React, { useState, useEffect, useRef } from "react";
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
  Lock,
  Mic,
  Square,
  Trash2
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
  onSubmit // Optional: Function to refresh parent UI
}) => {
  const [status, setStatus] = useState("Approved");
  const [autoComment, setAutoComment] = useState("");
  const [additionalComment, setAdditionalComment] = useState("");
  const [leaderDetails, setLeaderDetails] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Audio States ---
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

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

  // 2. Auto-Generate System Comment
  useEffect(() => {
    if (report && user) {
      const dateStr = new Date(report.inspectionDate).toLocaleDateString();
      const orderStr = report.orderNos ? report.orderNos.join(", ") : "N/A";
      const approverName =
        leaderDetails?.eng_name || user.eng_name || "Unknown";

      const baseInfo = `Report ID: ${report.reportId}
Inspection Date: ${dateStr}
Order No: ${orderStr}
Report Type: ${report.reportType}
QA ID: ${report.empId}`;

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

    // Reset fields when Approved selected
    if (status === "Approved") {
      setAdditionalComment("");
      setAudioBlob(null);
      setAudioUrl(null);
    }
  }, [status, report, user, leaderDetails]);

  // --- Audio Functions ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start Timer
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Could not access microphone. Check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // --- Submit Handler ---
  const handleSubmit = async () => {
    // Validation: Rework/Reject must have explanation
    if (
      (status === "Rework" || status === "Rejected") &&
      !additionalComment.trim() &&
      !audioBlob
    ) {
      alert(
        "Please provide a reason (Text or Audio) in the Additional Comments section."
      );
      return;
    }

    setSubmitting(true);
    try {
      // Create FormData
      const formData = new FormData();
      formData.append("reportId", report.reportId); // Sends as string, backend parses int
      formData.append("leaderId", user.emp_id);
      formData.append("leaderName", leaderDetails?.eng_name || user.eng_name);
      formData.append("status", status);
      formData.append("systemComment", autoComment);
      formData.append("additionalComment", additionalComment);

      if (audioBlob) {
        formData.append("audioBlob", audioBlob, "recording.webm");
      }

      // API Call
      await axios.post(
        `${API_BASE_URL}/api/fincheck-reports/submit-decision`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      if (onSubmit) onSubmit({ success: true });
      onClose();
    } catch (err) {
      console.error("Submission failed", err);
      alert("Failed to save decision. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
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

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Col */}
            <div className="space-y-6">
              {/* User Card */}
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

              {/* Buttons */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-3">
                  Select Status
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {["Approved", "Rework", "Rejected"].map((s) => {
                    let colorClass = "";
                    let icon = null;
                    let desc = "";
                    if (s === "Approved") {
                      colorClass =
                        status === s
                          ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "hover:border-green-300 hover:bg-green-50/50";
                      icon = <CheckCircle2 className="w-6 h-6" />;
                      desc = "Result verified OK";
                    } else if (s === "Rework") {
                      colorClass =
                        status === s
                          ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                          : "hover:border-amber-300 hover:bg-amber-50/50";
                      icon = <AlertTriangle className="w-6 h-6" />;
                      desc = "Requires corrections";
                    } else {
                      colorClass =
                        status === s
                          ? "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          : "hover:border-red-300 hover:bg-red-50/50";
                      icon = <XCircle className="w-6 h-6" />;
                      desc = "Failed inspection";
                    }

                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left group ${
                          status === s
                            ? `${colorClass} shadow-sm`
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 " +
                              colorClass
                        }`}
                      >
                        <div
                          className={`p-2 rounded-full transition-colors ${
                            status === s
                              ? s === "Approved"
                                ? "bg-green-500 text-white"
                                : s === "Rework"
                                ? "bg-amber-500 text-white"
                                : "bg-red-500 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {icon}
                        </div>
                        <div>
                          <span className="block font-bold uppercase text-sm">
                            {s}
                          </span>
                          <span className="text-xs opacity-80 font-medium">
                            {desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Col */}
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 min-h-[120px] flex flex-col">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> System Message
                </label>
                <textarea
                  disabled
                  className="w-full h-full p-4 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-500 dark:text-gray-400 resize-none cursor-not-allowed focus:outline-none opacity-80"
                  value={autoComment}
                ></textarea>
              </div>

              {status !== "Approved" && (
                <div className="flex-1 flex flex-col animate-fadeIn border-t border-gray-100 dark:border-gray-700 pt-4">
                  <label className="text-xs font-bold text-gray-800 dark:text-white uppercase mb-2">
                    Additional Remarks
                  </label>
                  <textarea
                    className="w-full min-h-[100px] p-4 mb-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-sans focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-shadow shadow-inner"
                    placeholder={`Type specific reasons for ${status}...`}
                    value={additionalComment}
                    onChange={(e) => setAdditionalComment(e.target.value)}
                  ></textarea>

                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
                    {!audioUrl && !isRecording && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                          <Mic className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          Add Voice Note
                        </span>
                      </div>
                    )}
                    {isRecording && (
                      <div className="flex items-center gap-3 text-red-500 animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm font-mono font-bold">
                          {formatTime(recordingDuration)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Recording...
                        </span>
                      </div>
                    )}
                    {audioUrl && !isRecording && (
                      <div className="flex-1 flex items-center gap-3">
                        <audio
                          controls
                          src={audioUrl}
                          className="h-8 w-full max-w-[200px]"
                        />
                        <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Recorded
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {!isRecording && !audioUrl && (
                        <button
                          onClick={startRecording}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Mic className="w-3 h-3" /> Record
                        </button>
                      )}
                      {isRecording && (
                        <button
                          onClick={stopRecording}
                          className="px-3 py-1.5 bg-gray-800 text-white hover:bg-black rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Square className="w-3 h-3 fill-current" /> Stop
                        </button>
                      )}
                      {audioUrl && (
                        <button
                          onClick={deleteRecording}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {status === "Approved" && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/30">
                  <div className="text-center text-gray-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium">
                      No additional comments needed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
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
                ? "bg-red-600 hover:bg-red-700"
                : status === "Rework"
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-green-600 hover:bg-green-700"
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
