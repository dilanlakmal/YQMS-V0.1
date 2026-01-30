import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../../config";
import { Modal, Image } from "antd";
import { renderToStaticMarkup } from "react-dom/server";
import PaperPreviewReitmans from "./PaperPreviewReitmans";
import {
  FileText,
  MessageSquare,
  X as CloseIcon,
  Calendar,
  Clock,
  Target,
  Beaker,
  Camera,
  ArrowRight,
  FlaskConical,
  History,
  User,
  Info,
  Briefcase,
  FileSearch,
  Printer,
} from "lucide-react";

const HistoryModelReitmans = ({
  open,
  onCancel,
  report,
  formatDate,
  formatTime,
}) => {
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
          console.error("Error fetching full Reitmans report details:", err);
        }
      };
      fetchFullDetails();
    }
  }, [open, report?._id]);

  useEffect(() => {
    if (!open) {
      setFullReport(null);
    }
  }, [open]);

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
        const sessions = {};
        history.forEach((item) => {
          const ck = item.checkName || "Check 1";
          if (!sessions[ck]) sessions[ck] = { name: ck, items: [] };
          sessions[ck].items.push(item);
        });
        return Object.keys(sessions)
          .sort((a, b) => {
            const numA = parseInt(a.replace("Check ", ""));
            const numB = parseInt(b.replace("Check ", ""));
            return numA - numB;
          })
          .map((k) => sessions[k]);
      }
      return history.map((h, i) => ({
        name: h.checkName || `Check ${i + 1}`,
        items: [{ ...h, itemName: h.itemName || "Item 1" }],
      }));
    }

    if (typeof history !== "object" || history === null) return [];

    const sessions = {};
    Object.keys(history).forEach((itemKey) => {
      const checks = history[itemKey] || {};
      Object.keys(checks).forEach((checkKey) => {
        if (!sessions[checkKey]) {
          sessions[checkKey] = {
            name: checkKey,
            items: [],
          };
        }
        sessions[checkKey].items.push({
          ...checks[checkKey],
          itemName: itemKey,
          checkName: checkKey,
        });
      });
    });

    return Object.keys(sessions)
      .sort((a, b) => {
        const numA = parseInt(a.replace("Check ", ""));
        const numB = parseInt(b.replace("Check ", ""));
        return numA - numB;
      })
      .map((k) => sessions[k]);
  };

  const groupedHistory = getGroupedHistory(rawHistory);
  const history = groupedHistory.flatMap((s) => s.items);

  const getItemStatus = (record) => {
    return record.top?.status === "pass" || !record.top?.status
      ? "pass"
      : "fail";
  };

  const getSessionStatus = (session) => {
    if (!session || !session.items) return "fail";
    return session.items.every((record) => getItemStatus(record) === "pass")
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
  const specLimit = Number(activeReport.upperCentisimalIndex || 0);

  const renderStatusBadge = (status) => {
    const isPass = status === "pass" || status === "Optimal";
    return (
      <span
        className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isPass
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-700"
        }`}
      >
        {isPass ? "Pass" : "Fail"}
      </span>
    );
  };

  const getValueColor = (val) => {
    if (!val) return "text-slate-400";
    return Number(val) > specLimit ? "text-rose-600" : "text-emerald-600";
  };

  const handlePrint = () => {
    try {
      const reportHtml = renderToStaticMarkup(
        <PaperPreviewReitmans data={activeReport} />,
      );
      const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                <title>Reitmans Humidity Report - ${activeReport.factoryStyleNo || ""}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        @page { margin: 0; }
                        body { padding: 10px; -webkit-print-color-adjust: exact; }
                        .page-break-after-always { page-break-after: always; }
                    }
                </style>
                </head>
                <body class="bg-gray-100 print:bg-white text-gray-800">
                    <div class="max-w-[800px] mx-auto bg-white p-4 print:p-0">
                        ${reportHtml}
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() { window.print(); }, 500);
                        }
                    </script>
                </body>
                </html>
            `;

      const w = window.open("", "_blank");
      if (!w) {
        alert("Popup blocked. Please allow popups.");
        return;
      }
      w.document.open();
      w.document.write(fullHtml);
      w.document.close();
    } catch (err) {
      console.error("Print error", err);
      alert("Failed to generate print preview.");
    }
  };

  return (
    <Modal
      title={null}
      closeIcon={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1200}
      centered
      styles={{
        body: { padding: 0, overflow: "hidden" },
        content: {
          padding: 0,
          borderRadius: "16px",
          overflow: "hidden",
          border: "none",
        },
        mask: {
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(0, 0, 0, 0.45)",
        },
      }}
    >
      {/* Compact header */}
      <div className="bg-emerald-500 px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-white shadow-sm">
            <FileText size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-extrabold text-white leading-tight">
              Reitmans Humidity History
            </h3>
            <p className="text-white text-xs opacity-95 mt-1 flex flex-wrap gap-2 items-center">
              <span className="inline-block px-2 py-1 bg-white/10 rounded text-white text-[12px] font-semibold">
                {activeReport.factoryStyleNo || "N/A"}
              </span>
              <span className="inline-block px-2 py-1 bg-white/10 rounded text-white text-[12px] font-semibold">
                {activeReport.buyerStyle || "N/A"}
              </span>
              <span className="inline-block px-2 py-1 bg-white/10 rounded text-white text-[12px] font-semibold">
                Upper Centisimal Index:{" "}
                {activeReport.upperCentisimalIndex ||
                  activeReport.aquaboySpecBody ||
                  activeReport.aquaboySpec ||
                  "N/A"}
                %
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/70 font-black uppercase tracking-widest">
              Overall Result
            </span>
            <div className="mt-1">{renderStatusBadge(reportStatus)}</div>
          </div>
          <button
            onClick={onCancel}
            className="text-white/90 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors ml-4"
          >
            <CloseIcon size={20} />
          </button>
        </div>
      </div>

      {/* Content Area: Grid of cards matching the Reference style */}
      <div className="p-8 bg-slate-50/30 overflow-y-auto max-h-[75vh] custom-scrollbar space-y-8">
        {groupedHistory.length > 0 ? (
          groupedHistory.map((session, sIdx) => {
            const isLatest = sIdx === groupedHistory.length - 1;
            return (
              <div
                key={sIdx}
                className="mb-12 space-y-6 animate-fade-in"
                style={{ animationDelay: `${sIdx * 0.06}s` }}
              >
                {/* Session Title Header */}
                <div className="flex items-center gap-4 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 shadow-sm">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-md">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-800 uppercase tracking-[0.15em] leading-tight">
                      {session.name}
                    </h4>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">
                      Unified Inspection Session
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] text-emerald-600/60 font-black uppercase tracking-widest">
                        Session Status
                      </span>
                      <div className="mt-1">
                        {renderStatusBadge(getSessionStatus(session))}
                      </div>
                    </div>
                    {isLatest && (
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-3 py-2 rounded-full uppercase tracking-widest shadow-sm">
                        Latest Check
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  {session.items.map((record, rIdx) => (
                    <div
                      key={`${sIdx}-${rIdx}`}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch"
                    >
                      {/* Card 1: Session Information */}
                      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                          <span className="text-4xl font-black text-emerald-500">
                            {record.itemName || `Item ${rIdx + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Clock size={18} className="text-emerald-600" />
                            <h4 className="text-sm font-bold uppercase tracking-wide text-emerald-600">
                              {record.itemName || `Item ${rIdx + 1}`} - Details
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-emerald-600/50 uppercase tracking-widest">
                              Item Result:
                            </span>
                            {renderStatusBadge(getItemStatus(record))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-sm text-slate-500 font-medium capitalize">
                              Time Checked:
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {formatTime(
                                record.timeChecked ||
                                  (isLatest ? report.timeChecked : ""),
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-sm text-slate-500 font-medium capitalize">
                              No. pc checked:
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {record.noPcChecked ||
                                (isLatest ? report.noPcChecked : "N/A")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-sm text-slate-500 font-medium capitalize">
                              Time in:
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {formatTime(
                                record.timeIn ||
                                  (isLatest ? report.timeIn : ""),
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-sm text-slate-500 font-medium capitalize">
                              Moisture rate (Before):
                            </span>
                            <span className="text-sm font-black text-slate-800">
                              {record.moistureRateBeforeDehumidify ||
                                record.moistureRateBeforeDry ||
                                (isLatest
                                  ? activeReport.moistureRateBeforeDehumidify
                                  : "---")}
                              %
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-50">
                            <span className="text-sm text-slate-500 font-medium capitalize">
                              Moisture rate (After):
                            </span>
                            <span
                              className={`text-sm font-black tracking-tight ${getValueColor(record.moistureRateAfter || record.moistureRateAfterDry || (isLatest ? report.moistureRateAfter : null))}`}
                            >
                              {record.moistureRateAfter ||
                                record.moistureRateAfterDry ||
                                (isLatest
                                  ? activeReport.moistureRateAfter
                                  : "---")}
                              %
                            </span>
                          </div>
                        </div>
                        <div className="space-y-4 mt-4">
                          <div className="flex items-center gap-3 text-emerald-600 border-b border-gray-100 pb-4">
                            <Camera size={18} />
                            <h4 className="text-sm font-bold uppercase tracking-wide">
                              Image
                            </h4>
                          </div>
                          {record.images?.length > 0 ? (
                            <Image.PreviewGroup>
                              <div className="flex flex-wrap gap-3">
                                {record.images.map((img, i) => (
                                  <Image
                                    key={i}
                                    src={img.preview}
                                    width={70}
                                    height={70}
                                    className="rounded-xl object-cover border border-slate-100 shadow-sm"
                                    preview={{
                                      mask: (
                                        <div className="text-[8px] font-black">
                                          VIEW
                                        </div>
                                      ),
                                    }}
                                  />
                                ))}
                              </div>
                            </Image.PreviewGroup>
                          ) : (
                            <div className="py-4 text-center">
                              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic leading-none">
                                Not available
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card 2: Technical Readings */}
                      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-md">
                        <div className="flex items-center gap-3 text-emerald-600 border-b border-gray-100 pb-3">
                          <Beaker size={18} />
                          <h4 className="text-sm font-bold uppercase tracking-wide">
                            Record
                          </h4>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-sm text-slate-500 font-medium capitalize">
                              Date:
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {formatDate(
                                record.date || (isLatest ? report.date : ""),
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-sm text-slate-500 font-medium capitalize">
                              Time out:
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {formatTime(
                                record.timeOut ||
                                  (isLatest ? report.timeOut : ""),
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-sm text-slate-500 font-bold uppercase tracking-tight">
                                Moisture Reading:
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-end">
                                <span className="text-base font-black text-slate-800">
                                  {record.top?.body || "0"}%
                                </span>
                                {record.top?.status && (
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-widest ${record.top.status === "pass" ? "text-emerald-500" : "text-rose-500"}`}
                                  >
                                    {record.top.status}
                                  </span>
                                )}
                              </div>
                              {renderStatusBadge(record.top?.status)}
                            </div>
                          </div>

                          <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-3 text-emerald-600 border-b border-gray-100 pb-3">
                              <MessageSquare size={18} />
                              <h4 className="text-sm font-bold uppercase">
                                General Remark
                              </h4>
                            </div>
                            <div className="bg-emerald-50/30 border border-emerald-100 rounded-lg p-4 min-h-[70px]">
                              <p className="text-sm text-gray-600 font-medium leading-relaxed m-0 italic">
                                {record.generalRemark || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 shadow-sm border border-slate-100 mb-4">
              <History size={32} />
            </div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              No Synchronized Audit Flow
            </h3>
          </div>
        )}
      </div>

      {/* Footer: Matching the green button style */}
      <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">
              Total Nodes
            </span>
            <span className="text-xs font-black text-slate-800 leading-none mt-2">
              {history.length} Entries
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-md text-sm font-semibold hover:shadow"
                    >
                        <Printer size={16} />
                        Print
                    </button> */}
          <button
            onClick={onCancel}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
          >
            Close Details
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default HistoryModelReitmans;
