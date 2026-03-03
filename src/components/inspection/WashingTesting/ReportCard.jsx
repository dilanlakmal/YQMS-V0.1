import React from "react";
import { useAuth } from "../../authentication/AuthContext";
import { ChevronDown, ChevronUp, Printer, FileText, FileSpreadsheet, Pencil, Trash2, QrCode, CheckCircle, BadgeCheck, XCircle, Bell, BellRing, Shield } from "lucide-react";
import { useAssignControlStore, computeUserRoles, useModalStore } from "./stores";
import { getReportSizeDisplay } from "./helpers";
import ReportTimeline from "./ReportTimeline";

const DEFAULT_SCALE = 'scale-125';

const CUSTOM_SCALES = {
  // Machine Wash
  'machine-wash.png': 'scale-125',
  'hand-wasing.png': 'scale-125',
  'do-not-wash.png': 'scale-125',

  // Water Temp
  'water-temperature30.png': 'scale-125',
  'water-temperature40.png': 'scale-125',
  'water-temperature50.png': 'scale-125',

  // Bleach
  'bleach.png': 'scale-[1.0]',
  'non-chlorine-bleach.png': 'scale-[1.0]',
  'not-bleach.png': 'scale-[1.0]',
  'not-bleach1.png': 'scale-[1.0]',

  // Tumble Dry
  'tumble-dry.png': 'scale-[1.1]',
  'tb-dry-normal-no-heat.png': 'scale-[1.1]',
  'tb-dry-permanent-press-no-heat.png': 'scale-[1.2]',
  'tb-dry-gentle-no-heat.png': 'scale-[1.2]',
  'low-heat1.png': 'scale-[1.0]',
  'medium-heat.png': 'scale-[1.0]',
  'high-heat.png': 'scale-[1.0]',
  'tb-dry-permanent-press-low-heat.png': 'scale-[1.3]',
  'tb-dry-permanent-press-medium-heat.png': 'scale-[1.3]',
  'tb-dry-gentle-low-heat.png': 'scale-[1.3]',
  'tb-dry-gentle-medium-heat.png': 'scale-[1.3]',
  'do-not-tumble-dry.png': 'scale-[1.0]',

  // Dry
  'line-dry.png': 'scale-[1.2]',
  'dry-flat.png': 'scale-[1.2]',
  'dry.png': 'scale-[1.2]',
  'do-not-dry.png': 'scale-[1.2]',

  // Iron
  'iron-empty.png': 'scale-[1.5]',
  'iron-low-temp.png': 'scale-[1.5]',
  'iron-medium-temp.png': 'scale-[1.5]',
  'iron-hight-temp.png': 'scale-[1.5]',
  'no-steam.png': 'scale-[1.5]',
  'do-not-iron.png': 'scale-[1.5]',

  // Dry Clean
  'dry-clean.png': 'scale-[0.8]',
  'do-not-dryclean.png': 'scale-[1.2]',
  // 'do-not-dry.png': 'scale-[1.2]', // Removed duplicate
  'wet-cleaning.png': 'scale-[1.1]',
  'any-solvent.png': 'scale-[1.1]',
  'petroleum-sovent-only.png': 'scale-[0.9]',
  'Any-sx-tetrachlorethylene.png': 'scale-[1.0]',
  'reduced.png': 'scale-[1.0]',
  'short-cycle.png': 'scale-[1.0]',
  'low-heat.png': 'scale-[1.0]',
  'no-steam-finishing.png': 'scale-[1.0]',
  'gentle-cleaning-pce.png': 'scale-[1.0]',
  'very-gentle-cleaning-pce.png': 'scale-[1.1]',
};

const getIconScale = (iconName) => {
  return CUSTOM_SCALES[iconName] || DEFAULT_SCALE;
};

// Resolve emp_id to display name from users list (name or eng_name), fallback to id
const getNameForView = (empId, storedName, users = []) => {
  if (storedName && String(storedName).trim()) return storedName;
  if (!empId) return null;
  const u = users.find((user) => String(user.emp_id) === String(empId) || String(user.id) === String(empId));
  return u ? (u.name || u.eng_name || u.emp_id) : null;
};

const ReportCard = ({
  report,
  isExpanded,
  onToggle,
  onPrintPDF,
  onDownloadPDF,
  onExportExcel,
  onEdit,
  onDelete,
  onReject,
  openRejectModal,
  onAcceptReceived,
  printingReportId,
  savedImageRotations,
  openImageViewer,
  onEditInitialImages,
  onEditReceivedImages,
  onEditCompletionImages,
  restrictDeleteStatuses = [],
  restrictEditStatuses = [],
  enableRoleLocking = false,
  /** When true, show notification icon on this record (e.g. user submitted / record finished). You control this in the parent. */
  hasNotification = false,
  /** When true, show warehouse-edit notification (bell icon, amber). */
  hasWarehouseNotification = false,
  /** When true, show admin-edit notification (shield icon, blue). */
  hasAdminNotification = false,
  /** When true, user has opened notification (mark read) – dot is hidden, ring icon kept. */
  notificationRead = false,
  /** When true, always show the notification button so user can open status modal (default true in Reports list). */
  showNotificationButton = true,
  /** Optional tooltip for the notification icon */
  notificationTitle = "Notification",
  /** Optional callback when notification icon is clicked */
  onNotificationClick,
}) => {
  const { user } = useAuth();
  const { users, causeAssignHistory } = useAssignControlStore();
  const { isAdminUser, isWarehouseUser } = computeUserRoles(user, causeAssignHistory);
  const { showReportDateQR, setShowReportDateQR } = useModalStore();
  const reportId = report._id || report.id;

  // Check if edit should be locked based on user role and status
  const isEditLocked = () => {
    if (isAdminUser) return false; // Admins are NEVER locked
    if (!enableRoleLocking) return false;
    if (!user) return false;
    const empId = user.emp_id || user.id; // handle both emp_id or id if prevalent

    // Reporter Logic: Lock if reporter_status is 'done'
    if (report.reporter_emp_id === empId && report.reporter_status === 'done') {
      return true;
    }

    // Receiver Logic: Lock if status is 'received' or 'completed' (receiver has taken action)
    // The user requirement: "receiverempid receiver status = pending edit still can click and if receiver status = received it will locked"
    if (report.receiver_emp_id === empId && (report.status === 'received' || report.status === 'completed')) {
      return true;
    }

    return false;
  };

  // Permissions Calculation
  const isCreator = (report.userSubmit && String(user?.emp_id) === String(report.userSubmit)) ||
    (report.reporter_emp_id && String(user?.emp_id) === String(report.reporter_emp_id));

  // canUserEdit: admin, creator, or warehouse can edit. canUserDelete: only admin or creator; warehouse must never delete.
  const canUserEdit = isAdminUser || isCreator || isWarehouseUser;
  const canUserDelete = (isAdminUser || isCreator) && !isWarehouseUser;

  // Completed reports cannot be edited by anyone, but admins can delete them
  const isCompleted = report.status === 'completed';
  // Rejected reports: hide Edit for everyone; hide Delete for non-admins only (admin can delete rejected records)
  const isRejected = report.status === 'rejected';

  // Buttons: Edit always hidden when completed/rejected; Delete hidden for non-admin when completed/rejected, admin can delete rejected
  const shouldHideEditButton = !canUserEdit || isCompleted || isRejected || (!isAdminUser && restrictEditStatuses && restrictEditStatuses.includes(report.status));
  const shouldHideDeleteButton = !canUserDelete || (!isAdminUser && isCompleted) || (!isAdminUser && isRejected) || (!isAdminUser && restrictDeleteStatuses && restrictDeleteStatuses.includes(report.status));

  // Reject: only for warehouse (or admin) when report is still pending – e.g. submitter sent 2 colors but warehouse sees 1
  const canReject = (isWarehouseUser || isAdminUser) && (report.status === "pending" || report.status === "" || !report.status);
  const shouldShowRejectButton = canReject && openRejectModal;
  // Accept Received: same eligibility as Reject – quick accept without opening modal (no images/notes)
  const shouldShowAcceptReceivedButton = canReject && onAcceptReceived;

  // Timeline uploads/edits follow the same "canUserEdit" logic
  const isActionLocked = isEditLocked(); // Use more granular isEditLocked instead of just canUserEdit

  return (
    <div
      data-report-id={reportId}
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow"
    >
      {/* Header - Clickable to expand/collapse */}
      <div
        className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-3 cursor-pointer"
        onClick={() => onToggle(reportId)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white truncate uppercase">
                {report.ymStyle || "N/A"}
              </h3>
              {/* Status Badge */}
              {report.status && (
                <span className={`px-2 py-1 text-xs font-medium rounded flex-shrink-0 ${report.status === "completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : report.status === "received"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : report.status === "rejected"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  }`}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
              )}
              {/* Warehouse edit: BellRing (amber). Admin edit: Shield (violet – distinct from amber and blue buttons). No notification: Bell muted. */}
              {showNotificationButton && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {hasWarehouseNotification && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onNotificationClick?.(report);
                      }}
                      className="relative rounded transition-all duration-200 p-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                      title={notificationTitle || "Warehouse edited this report"}
                    >
                      <BellRing size={18} strokeWidth={2.25} />
                      {!notificationRead && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 ring-2 ring-white dark:ring-gray-800" aria-hidden />
                      )}
                    </button>
                  )}
                  {hasAdminNotification && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onNotificationClick?.(report);
                      }}
                      className="relative rounded transition-all duration-200 p-1 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                      title={notificationTitle || "Admin edited this report"}
                    >
                      <Shield size={18} strokeWidth={2.25} />
                      {!notificationRead && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400 ring-2 ring-white dark:ring-gray-800" aria-hidden />
                      )}
                    </button>
                  )}
                  {!hasNotification && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onNotificationClick?.(report);
                      }}
                      className="rounded transition-all duration-200 p-1 text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 opacity-70 hover:opacity-100"
                      title="View report status"
                    >
                      <Bell size={16} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Submitted: {report.createdAt
                ? new Date(report.createdAt).toLocaleString('en-GB', { hour12: true })
                : report.submittedAt
                  ? new Date(report.submittedAt).toLocaleString('en-GB', { hour12: true })
                  : "N/A"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1.5 md:gap-2 flex-wrap">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPrintPDF(report);
              }}
              disabled={printingReportId === reportId}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Print PDF"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">{printingReportId === reportId ? "Printing..." : "Print"}</span>
            </button>
            <button
              onClick={() => onDownloadPDF(report)}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
              title="Download PDF"
            >
              <FileText size={14} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={() => onExportExcel(report)}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-1"
              title="Export Excel"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Excel</span>
            </button>
            {!shouldHideEditButton && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(report);
                }}
                className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors flex items-center gap-1"
                title="Edit Report"
              >
                <Pencil size={14} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}


            {shouldShowRejectButton && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openRejectModal(report);
                }}
                className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-md hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex items-center gap-1"
                title="Reject report (e.g. color mismatch)"
              >
                <XCircle size={14} />
                <span className="hidden sm:inline">Reject</span>
              </button>
            )}
            {onDelete && !shouldHideDeleteButton && (
              <button
                onClick={() => onDelete(reportId)}
                className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                title="Delete Report"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Delete</span>
                <span className="sm:hidden">Del</span>
              </button>
            )}

          </div>
          {/* QR Code Button */}
          {report.status === "completed" ? (
            <div
              className="px-1 flex items-center justify-center cursor-default flex-shrink-0 text-emerald-500 dark:text-emerald-400"
              title="Report Completed - QR Code no longer available"
            >
              <BadgeCheck size={24} strokeWidth={2} />
            </div>
          ) : report.status === "rejected" ? (
            <div
              className="px-1 flex items-center justify-center cursor-default flex-shrink-0 text-red-500 dark:text-red-400"
              title="Report Rejected"
            >
              <XCircle size={22} strokeWidth={2} />
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowReportDateQR(showReportDateQR === reportId ? null : reportId);
              }}
              className="px-2 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center flex-shrink-0"
              title="Show QR Code"
            >
              <QrCode size={16} />
            </button>
          )}
          {shouldShowAcceptReceivedButton && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAcceptReceived(report);
              }}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1"
              title="Accept as received (no images or notes)"
            >
              <CheckCircle size={14} />
              <span className="hidden sm:inline">Accept Received</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary View (Collapsed) */}
      {!isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mt-2 text-xs md:text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Type: </span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{report.reportType || "Home Wash Test"}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Buyer Style: </span>
            <span className="text-gray-900 dark:text-white break-words">{report.buyerStyle || "N/A"}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Colors: </span>
            <span className="text-gray-900 dark:text-white">
              {report.color && report.color.length > 0
                ? `${report.color.length} color(s)`
                : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Size: </span>
            <span className="text-gray-900 dark:text-white">
              {getReportSizeDisplay(report)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Factory: </span>
            <span className="text-gray-900 dark:text-white">{report.factory || "N/A"}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Images: </span>
            <span className="text-gray-900 dark:text-white">
              {report.images && report.images.length > 0
                ? `${report.images.length} image(s)`
                : "None"}
            </span>
          </div>
          {report.status === "rejected" && (
            <div className="sm:col-span-2 lg:col-span-4 mt-1 pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-gray-500 dark:text-gray-400">Rejected by </span>
              <span className="text-gray-900 dark:text-white">
                {getNameForView(report.receiver_emp_id, report.receiver_name, users) || report.receiver_emp_id || "—"}
              </span>
              {report.rejectedAt && (
                <>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">on </span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(report.rejectedAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                  </span>
                </>
              )}
              {report.rejectedNotes && report.rejectedNotes.trim() && (
                <>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">— </span>
                  <span className="text-gray-700 dark:text-gray-300 italic truncate max-w-[200px] inline-block align-bottom" title={report.rejectedNotes}>
                    {report.rejectedNotes}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full Details View (Expanded) */}
      {isExpanded && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Report Type
              </p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {report.reportType || "Home Wash Test"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Buyer Style
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {report.buyerStyle || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Colors
              </p>
              <div className="flex flex-wrap gap-1">
                {report.color && report.color.length > 0 ? (
                  report.color.map((color, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                    >
                      {color}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Size
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {getReportSizeDisplay(report)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                PO
              </p>
              <div className="flex flex-wrap gap-1">
                {report.po && report.po.length > 0 ? (
                  report.po.map((po, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded"
                    >
                      {po}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Ex Fty Date
              </p>
              <div className="flex flex-wrap gap-1">
                {report.exFtyDate && report.exFtyDate.length > 0 ? (
                  report.exFtyDate.map((date, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded"
                    >
                      {date}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Factory
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {report.factory || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Submitted By
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {getNameForView(report.reporter_emp_id, report.reporter_name, users) || report.reporter_emp_id || "N/A"}
              </p>
            </div>

            {/* Checked By & Approved By (for completed reports) - show name for view, ID when known */}
            {report.status === "completed" && (report.checkedBy || report.approvedBy) && (
              <>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Checked By
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(() => {
                      const name = getNameForView(report.checkedBy, report.checkedByName, users);
                      return name ? (name !== report.checkedBy ? `${name} (${report.checkedBy})` : name) : (report.checkedBy || "N/A");
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Approved By
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(() => {
                      const name = getNameForView(report.approvedBy, report.approvedByName, users);
                      return name ? (name !== report.approvedBy ? `${name} (${report.approvedBy})` : name) : (report.approvedBy || "N/A");
                    })()}
                  </p>
                </div>
              </>
            )}

            {/* Rejection details (for admins/anyone viewing a rejected report) */}
            {report.status === "rejected" && (
              <>
                <div className="sm:col-span-2 lg:col-span-3 mt-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
                    Rejection details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/50">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Rejected by</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getNameForView(report.receiver_emp_id, report.receiver_name, users) || report.receiver_emp_id || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Rejected at</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {report.rejectedAt
                          ? new Date(report.rejectedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", hour12: true })
                          : "—"}
                      </p>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Reason</p>
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                        {report.rejectedNotes && report.rejectedNotes.trim() ? report.rejectedNotes : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>


          {/* Care Symbols Display */}
          {(report.careSymbols && (typeof report.careSymbols === 'object' ? Object.keys(report.careSymbols).length > 0 : report.careSymbols.length > 0)) && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Care Instructions
              </p>
              <div className="flex flex-wrap gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                {Object.entries(
                  typeof report.careSymbols === 'string'
                    ? (() => { try { return JSON.parse(report.careSymbols) } catch (e) { return {} } })()
                    : report.careSymbols
                ).map(([key, iconName]) => {
                  // Priority: Use Base64 image from DB (careSymbolsImages) if available
                  // Fallback: Use local asset path
                  const imageSource = report.careSymbolsImages && report.careSymbolsImages[key]
                    ? report.careSymbolsImages[key]
                    : `/assets/Wash-bold/${iconName}`;

                  return (
                    <div key={key} className="relative group p-1 bg-white rounded-md flex items-center justify-center w-12 h-12" title={key}>
                      <img
                        src={imageSource}
                        alt={key}
                        className={`object-contain transform ${getIconScale(iconName)} w-full h-full`}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Final Results for EMB/HT Testing */}
          {(report.reportType === "EMB/Printing Testing" || report.reportType === "HT Testing") && (report.finalResult || report.checkedBy || report.checkedDate || report.finalResults) && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Approval & Final Results
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Final Result</p>
                  <p className={`text-sm font-bold ${report.finalResult === 'Accepted' || report.finalResults === 'Accepted' ? 'text-green-600' : 'text-red-600'}`}>
                    {report.finalResult || report.finalResults || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Checked By</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">
                    {report.checkedBy || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Date</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">
                    {report.checkedDate || report.finalDate || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Flat Measurements & Shrinkage Summary */}
          {report.shrinkageRows && Array.isArray(report.shrinkageRows) && report.shrinkageRows.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Measurements & Shrinkage
              </p>
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-2 border-b dark:border-gray-700">Point</th>
                      <th className="p-2 border-b dark:border-gray-700 text-center">Spec (B)</th>
                      <th className="p-2 border-b dark:border-gray-700 text-center">G1 (B)</th>
                      <th className="p-2 border-b dark:border-gray-700 text-center">G2 (A)</th>
                      <th className="p-2 border-b dark:border-gray-700 text-center">Shrinkage</th>
                      <th className="p-2 border-b dark:border-gray-700 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {report.shrinkageRows
                      .filter(row => row.selected) // Only show selected rows in the summary card!
                      .map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                          <td className="p-2 font-medium text-gray-700 dark:text-gray-300 max-w-[150px] truncate" title={row.location}>
                            {row.location}
                          </td>
                          <td className="p-2 text-center text-blue-600 dark:text-blue-400 font-mono">
                            {row.beforeWashSpec || "-"}
                          </td>
                          <td className="p-2 text-center text-gray-600 dark:text-gray-400">
                            {row.beforeWash || "-"}
                          </td>
                          <td className="p-2 text-center text-gray-600 dark:text-gray-400">
                            {row.afterWash || "-"}
                          </td>
                          <td className={`p-2 text-center font-bold ${parseFloat(row.shrinkage) > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                            {row.shrinkage || "-"}
                          </td>
                          <td className="p-2 text-center">
                            {row.passFail === 'PASS' ? (
                              <span className="text-green-600 font-bold text-[10px] px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 rounded">PASS</span>
                            ) : row.passFail === 'FAIL' ? (
                              <span className="text-red-500 font-bold text-[10px] px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 rounded">FAIL</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    {report.shrinkageRows.filter(row => row.selected).length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-400 italic">
                          No measurement points selected.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Timeline View - no edit/add image when locked or rejected (rejected = record is read-only) */}
          <ReportTimeline
            report={report}
            savedImageRotations={savedImageRotations}
            openImageViewer={openImageViewer}
            onEditInitialImages={isActionLocked || isRejected ? null : onEditInitialImages}
            onEditReceivedImages={isActionLocked || isRejected ? null : onEditReceivedImages}
            onEditCompletionImages={isActionLocked || isRejected ? null : onEditCompletionImages}
            isAdminUser={isAdminUser}
          />
        </>
      )
      }
    </div >
  );
};

export default ReportCard;

