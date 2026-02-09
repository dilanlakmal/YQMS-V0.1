import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../../config";
import { Modal, Image } from "antd";
import { renderToStaticMarkup } from "react-dom/server";
import PaperPreview from "./PaperPreview";
import {
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Send,
} from "lucide-react";
import { useAuth } from "../../authentication/AuthContext";

const HistoryModal = ({
  open,
  onCancel,
  report,
  formatDate,
  formatTime,
  onApprove,
}) => {
  const { user: currentUser } = useAuth();
  const [approvalRemark, setApprovalRemark] = useState("");
  const [fullReport, setFullReport] = useState(null);

  useEffect(() => {
    if (open && report?._id) {
      const fetchFullDetails = async () => {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/humidity-reports/${report._id}`,
          );
          if (res.ok) {
            const json = await res.json();
            if (json.success) {
              setFullReport(json.data);
            }
          }
        } catch (err) {
          console.error("Error fetching full report details:", err);
        }
      };
      fetchFullDetails();
    }
  }, [open, report?._id]);

  const activeReport = fullReport || report;
  if (!activeReport) return null;

  const rawHistory =
    activeReport.history &&
    (Array.isArray(activeReport.history)
      ? activeReport.history.length > 0
      : Object.keys(activeReport.history).length > 0)
      ? activeReport.history
      : activeReport.inspectionRecords || [];

  // Helper to group nested history by Session (Check 1, Check 2, etc.)
  const getGroupedHistory = (history) => {
    if (Array.isArray(history)) {
      if (history.length > 0 && (history[0].itemName || history[0].checkName)) {
        const itemGroups = {};
        history.forEach((rec) => {
          // In array format, we take the original intention: group by identity
          const ik = rec.checkName || "Item 1";
          if (!itemGroups[ik]) itemGroups[ik] = { name: ik, items: [] };
          itemGroups[ik].items.push(rec);
        });
        return Object.keys(itemGroups)
          .sort((a, b) => {
            const numA = parseInt(a.replace("Item ", ""));
            const numB = parseInt(b.replace("Item ", ""));
            return numA - numB;
          })
          .map((k) => itemGroups[k]);
      }
      return history.map((h, i) => ({
        name: h.checkName || `Item ${i + 1}`,
        items: [{ ...h, itemName: h.itemName || "Check 1" }],
      }));
    }

    if (typeof history !== "object" || history === null) return [];

    const itemGroups = {};
    Object.keys(history).forEach((itemKey) => {
      // Group by Item (Record ID)
      if (!itemGroups[itemKey]) {
        itemGroups[itemKey] = {
          name: itemKey,
          items: [],
        };
      }
      const checks = history[itemKey] || {};
      Object.keys(checks).forEach((checkKey) => {
        itemGroups[itemKey].items.push({
          ...checks[checkKey],
          itemName: checkKey, // "Check 1"
          checkName: itemKey, // "Item 1"
        });
      });

      // Sort checks within the item
      itemGroups[itemKey].items.sort((a, b) => {
        const numA = parseInt(a.itemName.replace("Check ", ""));
        const numB = parseInt(b.itemName.replace("Check ", ""));
        return numA - numB;
      });
    });

    return Object.keys(itemGroups)
      .sort((a, b) => {
        const numA = parseInt(a.replace("Item ", ""));
        const numB = parseInt(b.replace("Item ", ""));
        return numA - numB;
      })
      .map((k) => itemGroups[k]);
  };

  const groupedHistory = getGroupedHistory(rawHistory);
  const flattenedHistory = groupedHistory.flatMap((s) => s.items);
  const history = flattenedHistory; // For summary stats

  const getItemStatus = (item) => {
    return (item.top?.status === "pass" || !item.top?.status) &&
      (item.middle?.status === "pass" || !item.middle?.status) &&
      (item.bottom?.status === "pass" || !item.bottom?.status)
      ? "pass"
      : "fail";
  };

  const getSessionStatus = (session) => {
    if (!session || !session.items) return "fail";
    return session.items.every((item) => getItemStatus(item) === "pass")
      ? "pass"
      : "fail";
  };

  const getReportStatus = (raw) => {
    const grouped = getGroupedHistory(raw);
    if (grouped.length === 0) return "fail";
    const latestSession = grouped[grouped.length - 1];
    return getSessionStatus(latestSession);
  };

  const reportStatus = getReportStatus(rawHistory);

  const ribsVisible =
    activeReport.ribsAvailable ??
    history.some((h) => h.top?.ribs || h.middle?.ribs || h.bottom?.ribs);

  const openPrintableWindow = (contentHtml) => {
    try {
      const w = window.open("", "_blank");
      if (!w) {
        alert("Popup blocked. Please allow popups for this site.");
        return null;
      }
      const fullHtml = `
                <!doctype html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Humidity Report</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @media print {
                            @page { margin: 0; }
                        }
                    </style>
                </head>
                <body class="p-4">
                    ${contentHtml}
                </body>
                </html>
            `;
      w.document.open();
      w.document.write(fullHtml);
      w.document.close();
      w.focus();
      return w;
    } catch (err) {
      console.error("Error opening print window", err);
      alert("Unable to open print window.");
      return null;
    }
  };

  const printReport = () => {
    try {
      const content = renderToStaticMarkup(
        <PaperPreview data={activeReport} />,
      );
      const w = openPrintableWindow(content);
      if (w) setTimeout(() => w.print(), 400);
    } catch (err) {
      console.error("Error preparing print", err);
      alert("Failed to prepare print view.");
    }
  };

  const exportPdf = () => {
    // Use print dialog where user can select "Save as PDF"
    printReport();
  };

  // Clear full report when modal closes or report changes
  useEffect(() => {
    if (!open) {
      setFullReport(null);
    }
  }, [open]);

  return (
    <Modal
      title={null}
      closeIcon={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1800}
      centered
      styles={{
        body: {
          padding: 0,
        },
        content: {
          padding: 0,
          borderRadius: "16px",
          overflow: "hidden",
        },
        mask: {
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(0, 0, 0, 0.45)",
        },
      }}
    >
      <>
        <div className="bg-gradient-to-r from-green-50 to-green-50 border border-gray-200 border-b-0 px-8 py-6 relative overflow-hidden w-full shadow-lg rounded-t-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12 scale-150 pointer-events-none">
            <svg
              className="w-32 h-32 text-green-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 backdrop-blur-md rounded-xl border border-green-500/30 shadow-inner">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-500 mb-1 tracking-tight flex items-center gap-4">
                  <span>Inspection History</span>
                </h3>
                <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/40 border border-green-200/50 rounded-lg shadow-sm backdrop-blur-sm">
                    {report.factoryStyleNo || "N/A"}
                  </span>
                  <span className="opacity-100">•</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/40 border border-green-200/50 rounded-lg shadow-sm backdrop-blur-sm">
                    {report.buyerStyle || "N/A"}
                  </div>
                  <div className="opacity-100">•</div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/40 border border-green-200/50 rounded-lg shadow-sm backdrop-blur-sm">
                    <div className="text-[12px] uppercase text-green-500 tracking-wider">
                      Spec (Body):
                    </div>
                    <div className="text-green-700 text-[12px]">
                      {report.aquaboySpecBody
                        ? `${report.aquaboySpecBody}%`
                        : report.aquaboySpec
                          ? `${report.aquaboySpec}%`
                          : "N/A"}
                    </div>
                  </div>
                  <div className="opacity-100">•</div>
                  {ribsVisible && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/40 border border-green-200/50 rounded-lg shadow-sm backdrop-blur-sm">
                      <div className="text-[12px] uppercase text-green-500 tracking-wider">
                        Spec (Ribs):
                      </div>
                      <div className="text-green-700 text-[12px]">
                        {report.aquaboySpecRibs
                          ? `${report.aquaboySpecRibs}%`
                          : "N/A"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeReport.approvalStatus !== "approved" && onApprove && (
                <button
                  onClick={() => onApprove(activeReport._id)}
                  className="px-3 py-2.5 bg-white border-2 border-green-500 text-green-600 font-bold rounded-lg shadow-sm hover:bg-green-50 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  <CheckCircle2 size={16} strokeWidth={3} />
                  Approve Report
                </button>
              )}
              <button
                onClick={printReport}
                className="px-3 py-2.5 text-red-600 border-2 font-bold border-red-500 rounded-lg shadow-sm hover:bg-green-50 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest flex items-center gap-2"
                title="Print report"
                aria-label="Print report"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 9V2h12v7"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 14h12v8H6z"
                  />
                </svg>
                Print
              </button>
              <button
                onClick={exportPdf}
                className="px-3 py-2 mr-6 bg-red-500 text-white border font-bold border-red-500 rounded-lg text-sm hover:bg-red-600 inline-flex items-center gap-2"
                title="Export to PDF"
                aria-label="Export to PDF"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  stroke="none"
                >
                  <path d="M12 2a2 2 0 00-2 2v6H6l6 6 6-6h-4V4a2 2 0 00-2-2z" />
                  <path
                    d="M6 18v2a2 2 0 002 2h8a2 2 0 002-2v-2"
                    fill="#fff"
                    opacity="0.15"
                  />
                </svg>
                Export PDF
              </button>
              <button
                onClick={onCancel}
                className="p-2 bg-gray-500/20 hover:bg-gray-500/50 rounded-full transition-all text-white backdrop-blur-sm group"
              >
                <svg
                  className="w-6 h-6 transform group-hover:rotate-90 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 max-h-[calc(90vh-180px)] overflow-y-auto custom-scrollbar">
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-inner">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100/80">
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200"
                    rowSpan={2}
                  >
                    Nº
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200"
                    rowSpan={2}
                  >
                    Date
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200"
                    rowSpan={2}
                  >
                    Customer
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200"
                    rowSpan={2}
                  >
                    Fabrication
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200"
                    rowSpan={2}
                  >
                    Color
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200"
                    rowSpan={2}
                  >
                    Before Dry
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200"
                    rowSpan={2}
                  >
                    After Dry
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200 bg-green-50/30"
                    colSpan={ribsVisible ? 3 : 2}
                  >
                    Top Section
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200 bg-green-50/30"
                    colSpan={ribsVisible ? 3 : 2}
                  >
                    Middle Section
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200 bg-green-50/30"
                    colSpan={ribsVisible ? 3 : 2}
                  >
                    Bottom Section
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200 bg-emerald-50/20"
                    rowSpan={2}
                  >
                    Total Result
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200"
                    rowSpan={2}
                  >
                    Photos
                  </th>
                </tr>
                <tr className="bg-gray-100/80">
                  <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-l border-gray-200 bg-blue-50/10">
                    Body
                  </th>
                  {ribsVisible && (
                    <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-gray-200 bg-blue-50/10">
                      Ribs
                    </th>
                  )}
                  <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-gray-200 bg-blue-50/10">
                    Status
                  </th>
                  <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-l border-gray-200 bg-indigo-50/10">
                    Body
                  </th>
                  {ribsVisible && (
                    <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-gray-200 bg-indigo-50/10">
                      Ribs
                    </th>
                  )}
                  <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-gray-200 bg-indigo-50/10">
                    Status
                  </th>
                  <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-l border-gray-200 bg-purple-50/10">
                    Body
                  </th>
                  {ribsVisible && (
                    <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-gray-200 bg-purple-50/10">
                      Ribs
                    </th>
                  )}
                  <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-gray-200 bg-purple-50/10">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-b">
                {groupedHistory.map((session, sessionIdx) => (
                  <React.Fragment key={sessionIdx}>
                    {/* Session Header Row */}
                    <tr className="bg-green-50/50">
                      <td
                        colSpan={ribsVisible ? 18 : 15}
                        className="px-4 py-2 border-y border-green-100/50"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              size={14}
                              className="text-green-600"
                            />
                            <span className="text-[10px] font-black text-green-700 uppercase tracking-[0.2em]">
                              {session.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-bold text-green-600/60 uppercase tracking-widest">
                              Item Result:
                            </span>
                            {renderStatusBadge(getSessionStatus(session), true)}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {session.items.map((item, itemIdx) => (
                      <tr
                        key={`${sessionIdx}-${itemIdx}`}
                        className="hover:bg-green-50/50 transition-colors group border-b"
                      >
                        <td className="px-4 py-3.5 text-center font-bold text-gray-400 group-hover:text-green-600 transition-colors">
                          {item.itemName || `Item ${itemIdx + 1}`}
                        </td>
                        <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">
                          {activeReport.customer || "N/A"}
                        </td>
                        <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">
                          {activeReport.fabrication || "N/A"}
                        </td>
                        <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">
                          {item.colorName ||
                            item.color ||
                            activeReport.colorName ||
                            "N/A"}
                        </td>
                        <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">
                          {formatTime(
                            item.beforeDryRoom || item.beforeDryRoomTime,
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">
                          {formatTime(
                            item.afterDryRoom || item.afterDryRoomTime,
                          )}
                        </td>
                        {/* Top Section */}
                        <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">
                          <div className="flex flex-col items-center">
                            <span>{item.top?.body || "N/A"}</span>
                            {(item.top?.bodyStatus || item.top?.status) && (
                              <span
                                className={`text-[8px] font-bold uppercase ${(item.top?.bodyStatus || item.top?.status) === "pass" ? "text-green-500" : "text-rose-500"}`}
                              >
                                {item.top?.bodyStatus || item.top?.status}
                              </span>
                            )}
                          </div>
                        </td>
                        {ribsVisible && (
                          <td className="px-4 py-3.5 text-center text-gray-600 font-medium bg-blue-50/5 text-[12px]">
                            <div className="flex flex-col items-center">
                              <span>{item.top?.ribs || "N/A"}</span>
                              {(item.top?.ribsStatus || item.top?.status) && (
                                <span
                                  className={`text-[8px] font-bold uppercase ${(item.top?.ribsStatus || item.top?.status) === "pass" ? "text-green-500" : "text-rose-500"}`}
                                >
                                  {item.top?.ribsStatus || item.top?.status}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3.5 text-center bg-blue-50/5">
                          {renderStatusBadge(item.top?.status)}
                        </td>

                        {/* Middle Section */}
                        <td className="px-4 py-3.5 text-center text-gray-600 font-medium border-l border-gray-50 bg-indigo-50/5">
                          <div className="flex flex-col items-center">
                            <span>{item.middle?.body || "N/A"}</span>
                            {(item.middle?.bodyStatus ||
                              item.middle?.status) && (
                              <span
                                className={`text-[8px] font-bold uppercase ${(item.middle?.bodyStatus || item.middle?.status) === "pass" ? "text-green-500" : "text-rose-500"}`}
                              >
                                {item.middle?.bodyStatus || item.middle?.status}
                              </span>
                            )}
                          </div>
                        </td>
                        {ribsVisible && (
                          <td className="px-4 py-3.5 text-center text-gray-600 font-medium bg-indigo-50/5 text-[12px]">
                            <div className="flex flex-col items-center">
                              <span>{item.middle?.ribs || "N/A"}</span>
                              {(item.middle?.ribsStatus ||
                                item.middle?.status) && (
                                <span
                                  className={`text-[8px] font-bold uppercase ${(item.middle?.ribsStatus || item.middle?.status) === "pass" ? "text-green-500" : "text-rose-500"}`}
                                >
                                  {item.middle?.ribsStatus ||
                                    item.middle?.status}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3.5 text-center bg-indigo-50/5">
                          {renderStatusBadge(item.middle?.status)}
                        </td>

                        {/* Bottom Section */}
                        <td className="px-4 py-3.5 text-center text-gray-600 font-medium border-l border-gray-50 bg-purple-50/5">
                          <div className="flex flex-col items-center">
                            <span>{item.bottom?.body || "N/A"}</span>
                            {(item.bottom?.bodyStatus ||
                              item.bottom?.status) && (
                              <span
                                className={`text-[8px] font-bold uppercase ${(item.bottom?.bodyStatus || item.bottom?.status) === "pass" ? "text-green-500" : "text-rose-500"}`}
                              >
                                {item.bottom?.bodyStatus || item.bottom?.status}
                              </span>
                            )}
                          </div>
                        </td>
                        {ribsVisible && (
                          <td className="px-4 py-3.5 text-center text-gray-600 font-medium bg-purple-50/5 text-[12px]">
                            <div className="flex flex-col items-center">
                              <span>{item.bottom?.ribs || "N/A"}</span>
                              {(item.bottom?.ribsStatus ||
                                item.bottom?.status) && (
                                <span
                                  className={`text-[8px] font-bold uppercase ${(item.bottom?.ribsStatus || item.bottom?.status) === "pass" ? "text-green-500" : "text-rose-500"}`}
                                >
                                  {item.bottom?.ribsStatus ||
                                    item.bottom?.status}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3.5 text-center bg-purple-50/5">
                          {renderStatusBadge(item.bottom?.status)}
                        </td>
                        <td className="px-4 py-3.5 text-center border-l border-gray-50 bg-emerald-50/10">
                          {renderStatusBadge(getItemStatus(item))}
                        </td>
                        <td className="px-4 py-3.5 text-center border-l border-gray-50">
                          {item.images && item.images.length > 0 ? (
                            <div className="flex -space-x-2 justify-center hover:space-x-1 transition-all min-w-[100px]">
                              <Image.PreviewGroup>
                                {item.images.map((img, i) => (
                                  <div
                                    key={img.id || i}
                                    className="relative group/img"
                                  >
                                    <Image
                                      src={img.preview}
                                      width={40}
                                      height={40}
                                      className="rounded-lg object-cover border-2 border-white shadow-sm cursor-zoom-in group-hover/img:scale-110 transition-transform"
                                      fallback="https://via.placeholder.com/40?text=Error"
                                    />
                                  </div>
                                ))}
                              </Image.PreviewGroup>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-[10px] uppercase font-bold tracking-widest italic">
                              No Photos
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {history.length > 0 &&
              history[history.length - 1]?.generalRemark && (
                <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl shadow-sm flex flex-col h-full transition-all hover:bg-slate-100/50 hover:shadow-md">
                  <div className="flex items-center gap-3 mb-4 text-slate-600">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <MessageSquare size={18} className="text-green-500" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest m-0">
                      Latest Remark
                    </h3>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl p-2 flex-grow flex items-center justify-center shadow-sm">
                    <p className="text-slate-600 text-sm font-medium leading-relaxed m-0 italic text-center">
                      "{history[history.length - 1].generalRemark}"
                    </p>
                  </div>
                </div>
              )}

            {activeReport.approvalStatus === "approved" && (
              <div className="p-5 bg-emerald-50/50 border border-emerald-200 rounded-2xl shadow-sm backdrop-blur-sm flex flex-col h-full transition-all hover:shadow-md group/approve">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 ring-4 ring-emerald-50">
                      <ShieldCheck size={20} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800 m-0">
                      Report Approved
                    </h3>
                  </div>
                  <div className="text-[10px] font-black text-emerald-500 bg-emerald-100/50 px-2 py-1 rounded-md border border-emerald-200/50 uppercase">
                    Official Seal
                  </div>
                </div>

                <div className="bg-white border border-emerald-100 rounded-2xl p-5 flex flex-col gap-4 flex-grow shadow-sm relative overflow-hidden group/card shadow-inner-white">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/card:opacity-[0.07] transition-opacity pointer-events-none">
                    <CheckCircle2 size={120} />
                  </div>

                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-100 shrink-0 select-none">
                      <span className="text-lg font-black text-emerald-600">
                        {(
                          activeReport.approvedBy?.engName ||
                          activeReport.approvedBy?.empId ||
                          "A"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-black text-slate-800 truncate tracking-tight">
                        {activeReport.approvedBy?.engName ||
                          activeReport.approvedBy?.empId}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider tabular-nums">
                          {activeReport.approvedAt
                            ? formatDate(activeReport.approvedAt)
                            : ""}
                        </span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest leading-none">
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  {activeReport.approvedRemark ? (
                    <div className="relative z-10 text-[13px] text-slate-600 leading-relaxed bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50 italic">
                      <span className="text-emerald-300 mr-2 font-serif text-lg leading-none">
                        "
                      </span>
                      {activeReport.approvedRemark}
                      <span className="text-emerald-300 ml-2 font-serif text-lg leading-none">
                        "
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      No approval remarks provided.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 px-8 flex border-t border-gray-200 justify-between items-center bg-gray-50/50 rounded-b-2xl">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">
                Total Nodes
              </span>
              <span className="text-xs font-black text-slate-800 leading-none mt-2">
                {history.length} Entries
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-sm hover:bg-green-600 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest"
            >
              Close Detail
            </button>
          </div>
        </div>
      </>
    </Modal>
  );
};
const renderStatusBadge = (status, isAdditional = false) => {
  if (status === "pass") {
    return (
      <div
        className={`inline-flex items-center ${isAdditional ? "px-2 py-0.5" : "px-3 py-1"} rounded-full bg-green-50 text-green-700 border border-green-100 shadow-sm transition-all hover:scale-105 active:scale-95`}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full bg-green-500 mr-2 ${!isAdditional && "animate-pulse"}`}
        ></div>
        <span
          className={`font-bold ${isAdditional ? "text-[8px]" : "text-[10px]"} uppercase tracking-wider`}
        >
          Pass
        </span>
      </div>
    );
  }
  if (status === "fail") {
    return (
      <div
        className={`inline-flex items-center ${isAdditional ? "px-2 py-0.5" : "px-3 py-1"} rounded-full bg-rose-50 text-rose-700 border border-rose-100 shadow-sm transition-all hover:scale-105 active:scale-95`}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2"></div>
        <span
          className={`font-bold ${isAdditional ? "text-[8px]" : "text-[10px]"} uppercase tracking-wider`}
        >
          Fail
        </span>
      </div>
    );
  }
  return (
    <span className="text-gray-300 font-bold text-[10px] uppercase tracking-widest">
      {isAdditional ? "-" : "N/A"}
    </span>
  );
};

export default HistoryModal;
