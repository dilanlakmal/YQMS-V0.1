import axios from "axios";
import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  Camera,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Download,
  Factory,
  FileText,
  Hash,
  Image as ImageIcon,
  Info,
  List,
  Loader2,
  Package,
  Palette,
  Percent,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
  XCircle
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";

// --- SUMMARY CARD COMPONENT ---
const MobileSummaryCard = ({ icon, title, value, subValue, bgColorClass }) => (
  <div
    className={`rounded-xl shadow-lg overflow-hidden ${
      bgColorClass || "bg-white dark:bg-gray-800"
    }`}
  >
    <div className="p-4 flex items-center gap-3">
      <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-xl text-indigo-500 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-grow">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-gray-800 dark:text-gray-100">
            {value}
          </span>
          {subValue && (
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-md">
              {subValue}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// --- TOP DEFECT CARD ---
const MobileTopDefectCard = ({ rank, defect }) => (
  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl shadow-lg border-2 border-amber-200 dark:border-amber-800 p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
        {rank}
      </div>
      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
        Top Defect
      </p>
    </div>
    {defect ? (
      <div className="space-y-1">
        <p
          className="text-base font-bold text-gray-800 dark:text-gray-100 truncate"
          title={defect.name}
        >
          {defect.name}
        </p>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs font-semibold bg-gray-800 dark:bg-gray-700 text-white px-2 py-1 rounded-md">
            {defect.qty.toLocaleString()} pcs
          </span>
          <span className="text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-md">
            {defect.rate.toFixed(2)}%
          </span>
        </div>
      </div>
    ) : (
      <p className="text-sm text-gray-400">No data available</p>
    )}
  </div>
);

// --- REPORT CARD COMPONENT ---
const ReportCard = ({
  report,
  displayMode,
  dynamicDefectHeaders,
  getRateColorClass,
  getQARateColorClass,
  handleShowQaUser,
  handleShowImages,
  aggregateQADefects
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDefects, setShowDefects] = useState(false);

  const defectMap = new Map(
    report.defectList.map((d) => [d.defectCode, d.qty])
  );
  const defectRateOverall =
    report.checkedQty > 0
      ? (report.totalDefectQty / report.checkedQty) * 100
      : 0;

  const qaReport = report.qaReport;
  const hasImages = qaReport?.qcData?.some((qc) =>
    qc.defectList?.some((d) => d.images && d.images.length > 0)
  );

  const qaDefectRate =
    qaReport && qaReport.totalCheckedQty > 0
      ? (qaReport.totalOverallDefectQty / qaReport.totalCheckedQty) * 100
      : 0;

  const aggregatedDefects = qaReport?.qcData
    ? aggregateQADefects(qaReport.qcData)
    : [];

  // --- ✅ NEW: Create sorted QC defects list ---
  const qcDefectsList = useMemo(() => {
    const defects = [];
    dynamicDefectHeaders.forEach((defect) => {
      const qty = defectMap.get(defect.DefectCode);
      if (qty) {
        const rate =
          report.checkedQty > 0 ? (qty / report.checkedQty) * 100 : 0;
        defects.push({
          code: defect.DefectCode,
          name: defect.DefectNameEng,
          qty: qty,
          rate: rate
        });
      }
    });
    // Sort by quantity descending
    return defects.sort((a, b) => b.qty - a.qty);
  }, [dynamicDefectHeaders, defectMap, report.checkedQty]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">{report.moNo}</p>
              <p className="text-indigo-100 text-xs">
                {format(new Date(report.inspectionDate), "MMM dd, yyyy")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-4">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <Factory className="w-3.5 h-3.5 text-indigo-500" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Factory
              </p>
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
              {report.factory}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <List className="w-3.5 h-3.5 text-indigo-500" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Line
              </p>
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {report.lineNo}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-3.5 h-3.5 text-indigo-500" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                MO Number
              </p>
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {report.moNo}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Color
              </p>
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
              {report.color}
            </p>
          </div>
        </div>

        {/* QC Metrics */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-500" />
            QC Inspection Data
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border-2 border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                Checked
              </p>
              <p className="text-xl font-black text-gray-800 dark:text-gray-100">
                {report.checkedQty}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 border-2 border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                Defects
              </p>
              <p className="text-xl font-black text-gray-800 dark:text-gray-100">
                {report.totalDefectQty}
              </p>
            </div>
            <div
              className={`rounded-lg p-3 border-2 ${getRateColorClass(
                defectRateOverall,
                true
              )}`}
            >
              <p className="text-xs font-semibold mb-1">Rate</p>
              <p className="text-xl font-black">
                {defectRateOverall.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* --- ✅ NEW: QC Defect Details Section --- */}
        {qcDefectsList.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              QC Defect Details
            </h4>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
              <div className="space-y-2">
                {qcDefectsList.map((defect) => (
                  <div
                    key={defect.code}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {defect.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-sm font-bold bg-gray-800 dark:bg-gray-700 text-white px-2.5 py-1 rounded-md">
                        {defect.qty}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        ({defect.rate.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QA Metrics */}
        {qaReport && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              QA Inspection Data
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 border-2 border-purple-200 dark:border-purple-800">
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                  Sample
                </p>
                <p className="text-xl font-black text-gray-800 dark:text-gray-100">
                  {qaReport.totalCheckedQty}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 border-2 border-red-200 dark:border-red-800">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                  Defects
                </p>
                <p className="text-xl font-black text-gray-800 dark:text-gray-100">
                  {qaReport.totalOverallDefectQty}
                </p>
              </div>
              <div
                className={`rounded-lg p-3 border-2 ${getQARateColorClass(
                  qaDefectRate
                )}`}
              >
                <p className="text-xs font-semibold mb-1">Rate</p>
                <p className="text-xl font-black">{qaDefectRate.toFixed(2)}%</p>
              </div>
            </div>

            {/* QC IDs */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                QC Inspectors
              </p>
              <div className="flex flex-wrap gap-2">
                {qaReport.qcList?.map((qc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-md text-xs font-semibold"
                  >
                    <User className="w-3 h-3" />
                    <span>{qc.qcID}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QA Prepared By */}
            {qaReport.preparedBy && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  Prepared By
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-700 dark:text-purple-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {qaReport.preparedBy.empId}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {qaReport.preparedBy.engName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleShowQaUser(qaReport.preparedBy.empId)}
                    className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                  >
                    <Info
                      size={16}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </button>
                </div>
              </div>
            )}

            {/* QA Defect Details */}
            {aggregatedDefects.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                    QA Defect Details
                  </p>
                  {hasImages && (
                    <button
                      onClick={() => handleShowImages(qaReport)}
                      className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                    >
                      <ImageIcon
                        size={14}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {aggregatedDefects.map((defect) => (
                    <div
                      key={defect.defectCode}
                      className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md px-2 py-1.5"
                    >
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
                        {defect.defectName}
                      </span>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 ml-2">
                        {defect.qty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expandable Defect Details Section */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t-2 border-gray-200 dark:border-gray-700 animate-slideDown">
            <button
              onClick={() => setShowDefects(!showDefects)}
              className="w-full flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-3 rounded-lg hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all"
            >
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Extended Defect View ({qcDefectsList.length})
              </span>
              {showDefects ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {showDefects && (
              <div className="grid grid-cols-1 gap-2">
                {qcDefectsList.map((defect) => {
                  return (
                    <div
                      key={defect.code}
                      className={`p-3 rounded-lg border-2 ${
                        displayMode === "rate"
                          ? getRateColorClass(defect.rate)
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate flex-1">
                          {defect.name}
                        </p>
                        <div className="flex items-center gap-2 ml-2">
                          {displayMode === "qty" ? (
                            <span className="text-sm font-bold bg-gray-800 dark:bg-gray-700 text-white px-2 py-0.5 rounded-md">
                              {defect.qty}
                            </span>
                          ) : (
                            <span className="text-sm font-bold px-2 py-0.5 rounded-md">
                              {defect.rate.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-3 border-t-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {defectRateOverall <= 2 ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : defectRateOverall <= 5 ? (
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {defectRateOverall <= 2
                ? "Excellent Quality"
                : defectRateOverall <= 5
                ? "Good Quality"
                : "Needs Improvement"}
            </span>
          </div>
          {qaReport && (
            <div className="flex items-center gap-1">
              {qaDefectRate <= 5 ? (
                <TrendingDown className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                QA: {qaDefectRate.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MODALS (Same as before) ---
const QAUserModal = ({ user, isLoading, onClose }) => {
  if (!user && !isLoading) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-72 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
        ) : (
          <>
            <img
              src={
                user.face_photo ||
                `https://ui-avatars.com/api/?name=${user.eng_name}&background=random`
              }
              alt={user.eng_name}
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-indigo-400 object-cover"
            />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {user.emp_id}
            </h3>
            <p className="text-md text-gray-600 dark:text-gray-300">
              {user.eng_name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {user.job_title}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

const QAImageModal = ({ data, onClose }) => {
  if (!data) return null;

  const defectsWithImages = useMemo(() => {
    const defectMap = new Map();

    data.qcData?.forEach((qc) => {
      qc.defectList?.forEach((defect) => {
        if (defect.images && defect.images.length > 0) {
          const key = defect.defectCode;
          if (defectMap.has(key)) {
            const existing = defectMap.get(key);
            existing.images = [...existing.images, ...defect.images];
          } else {
            defectMap.set(key, {
              defectCode: defect.defectCode,
              defectName: defect.defectName,
              khmerName: defect.khmerName,
              chineseName: defect.chineseName,
              images: [...defect.images]
            });
          }
        }
      });
    });

    return Array.from(defectMap.values());
  }, [data]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-6 h-6" />
            Defect Images
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-6">
          {defectsWithImages.length > 0 ? (
            defectsWithImages.map((defect) => (
              <div key={defect.defectCode} className="space-y-3">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-3 border-2 border-indigo-200 dark:border-indigo-800">
                  <h4 className="font-bold text-base text-indigo-600 dark:text-indigo-400">
                    {defect.defectName}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {defect.khmerName} | {defect.chineseName}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {defect.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={`${API_BASE_URL}${img}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl shadow-lg group border-2 border-gray-200 dark:border-gray-700"
                    >
                      <img
                        src={`${API_BASE_URL}${img}`}
                        alt={`Defect ${defect.defectCode} - ${idx + 1}`}
                        className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No images found for this report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const SubConQCReportMobileView = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: new Date(),
    factory: null,
    lineNo: null,
    moNo: null,
    color: null
  });

  const [data, setData] = useState({
    reports: [],
    summary: {
      totalCheckedQty: 0,
      totalDefectQty: 0,
      totalQASampleSize: 0,
      totalQADefectQty: 0,
      overallDefectRate: 0,
      topDefects: []
    },
    filterOptions: { factories: [], lineNos: [], moNos: [], colors: [] }
  });

  const [allDefects, setAllDefects] = useState([]);
  const [allFactories, setAllFactories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayMode, setDisplayMode] = useState("qty");

  const [qaUserInfo, setQaUserInfo] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const [imageModalData, setImageModalData] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const userFactory = useMemo(() => {
    if (user && user.name && allFactories.length > 0) {
      const matchedFactoryName = allFactories.find(
        (f) => f.toLowerCase() === user.name.toLowerCase()
      );
      if (matchedFactoryName) {
        return { value: matchedFactoryName, label: matchedFactoryName };
      }
    }
    return null;
  }, [user, allFactories]);

  useEffect(() => {
    const fetchAllDefects = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/subcon-defects`);
        res.data.sort((a, b) => a.DefectCode - b.DefectCode);
        setAllDefects(res.data);
      } catch (err) {
        console.error("Failed to fetch master defect list", err);
      }
    };
    fetchAllDefects();
  }, []);

  useEffect(() => {
    if (userFactory && !filters.factory) {
      handleFilterChange("factory", userFactory);
    }
  }, [userFactory, filters.factory]);

  useEffect(() => {
    const fetchAllFactories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-factories`
        );
        if (Array.isArray(res.data)) {
          setAllFactories(res.data.map((f) => f.factory));
        }
      } catch (err) {
        console.error("Failed to fetch master factory list", err);
      }
    };
    fetchAllFactories();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const params = {
        startDate: format(filters.startDate, "yyyy-MM-dd"),
        endDate: format(filters.endDate, "yyyy-MM-dd"),
        factory: filters.factory?.value,
        lineNo: filters.lineNo?.value,
        moNo: filters.moNo?.value,
        color: filters.color?.value
      };
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-qc1-report-data`,
          { params }
        );
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch report data:", err);
        setError("Could not load report data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const dynamicDefectHeaders = useMemo(() => {
    if (data.reports.length === 0 || allDefects.length === 0) return [];
    const presentDefectCodes = new Set(
      data.reports.flatMap((r) => r.defectList.map((d) => d.defectCode))
    );
    return allDefects.filter((defect) =>
      presentDefectCodes.has(defect.DefectCode)
    );
  }, [data.reports, allDefects]);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [filterName]: value };
      if (filterName === "factory") {
        newFilters.lineNo = null;
        newFilters.moNo = null;
        newFilters.color = null;
      }
      if (filterName === "lineNo") {
        newFilters.moNo = null;
        newFilters.color = null;
      }
      if (filterName === "moNo") {
        newFilters.color = null;
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    const defaultFilters = {
      startDate: new Date(),
      endDate: new Date(),
      factory: null,
      lineNo: null,
      moNo: null,
      color: null
    };
    if (userFactory) {
      defaultFilters.factory = userFactory;
    }
    setFilters(defaultFilters);
  };

  const factoryFilterOptions = useMemo(() => {
    if (userFactory) {
      return [userFactory];
    }
    return (
      data.filterOptions?.factories?.map((f) => ({
        value: f,
        label: f
      })) || []
    );
  }, [userFactory, data.filterOptions.factories]);

  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)",
      minHeight: "38px"
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      zIndex: 9999
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: isSelected ? "white" : "var(--color-text-primary)"
    })
  };

  const handleShowQaUser = async (empId) => {
    if (!empId) return;
    setIsUserLoading(true);
    setQaUserInfo(null);
    setIsUserModalOpen(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/user-info-subcon-qa/${empId}`
      );
      setQaUserInfo(res.data);
    } catch (err) {
      console.error("Failed to fetch user info", err);
      setIsUserModalOpen(false);
    } finally {
      setIsUserLoading(false);
    }
  };

  const handleShowImages = (qaReport) => {
    if (qaReport) {
      setImageModalData(qaReport);
      setIsImageModalOpen(true);
    }
  };

  const closeUserModal = () => setIsUserModalOpen(false);
  const closeImageModal = () => setIsImageModalOpen(false);

  const getRateColorClass = (rate, isOverall = false) => {
    const highThreshold = isOverall ? 5 : 3;
    const midThreshold = isOverall ? 3 : 1;
    if (rate > highThreshold)
      return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700";
    if (rate >= midThreshold)
      return "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700";
    if (rate > 0)
      return "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700";
    return "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
  };

  const getQARateColorClass = (rate) => {
    if (rate >= 10)
      return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700";
    if (rate >= 0)
      return "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700";
    return "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
  };

  const overallQARate = useMemo(() => {
    if (
      !data.summary.totalQASampleSize ||
      data.summary.totalQASampleSize === 0
    ) {
      return 0;
    }
    return (
      (data.summary.totalQADefectQty / data.summary.totalQASampleSize) * 100
    );
  }, [data.summary]);

  const aggregateQADefects = (qcData) => {
    if (!qcData || qcData.length === 0) return [];

    const defectMap = new Map();

    qcData.forEach((qc) => {
      qc.defectList?.forEach((defect) => {
        const key = defect.defectCode;
        if (defectMap.has(key)) {
          const existing = defectMap.get(key);
          existing.qty += defect.qty;
        } else {
          defectMap.set(key, {
            defectCode: defect.defectCode,
            defectName: defect.defectName,
            qty: defect.qty
          });
        }
      });
    });

    return Array.from(defectMap.values());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4">
        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                Sub-Con QC Report
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Quality inspection analytics
              </p>
            </div>
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-500" />
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <List className="w-5 h-5" />
              Filters
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {/* Date Filters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Start Date
                </label>
                <DatePicker
                  selected={filters.startDate}
                  onChange={(date) => handleFilterChange("startDate", date)}
                  maxDate={filters.endDate}
                  dateFormat="MM/dd/yyyy"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100"
                  wrapperClassName="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  End Date
                </label>
                <DatePicker
                  selected={filters.endDate}
                  onChange={(date) => handleFilterChange("endDate", date)}
                  minDate={filters.startDate}
                  dateFormat="MM/dd/yyyy"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100"
                  wrapperClassName="w-full"
                />
              </div>
            </div>

            {/* Other Filters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Factory className="w-3.5 h-3.5 text-indigo-500" />
                  Factory
                </label>
                <Select
                  options={factoryFilterOptions}
                  value={filters.factory}
                  onChange={(val) => handleFilterChange("factory", val)}
                  styles={reactSelectStyles}
                  isClearable={!userFactory}
                  isDisabled={!!userFactory}
                  placeholder="All"
                  menuPortalTarget={document.body}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <List className="w-3.5 h-3.5 text-indigo-500" />
                  Line No
                </label>
                <Select
                  options={data.filterOptions?.lineNos?.map((l) => ({
                    value: l,
                    label: l
                  }))}
                  value={filters.lineNo}
                  onChange={(val) => handleFilterChange("lineNo", val)}
                  styles={reactSelectStyles}
                  isClearable
                  isDisabled={!filters.factory}
                  placeholder="All"
                  menuPortalTarget={document.body}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-indigo-500" />
                  MO No
                </label>
                <Select
                  options={data.filterOptions?.moNos?.map((m) => ({
                    value: m,
                    label: m
                  }))}
                  value={filters.moNo}
                  onChange={(val) => handleFilterChange("moNo", val)}
                  styles={reactSelectStyles}
                  isClearable
                  placeholder="All"
                  menuPortalTarget={document.body}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-indigo-500" />
                  Color
                </label>
                <Select
                  options={data.filterOptions?.colors?.map((c) => ({
                    value: c,
                    label: c
                  }))}
                  value={filters.color}
                  onChange={(val) => handleFilterChange("color", val)}
                  styles={reactSelectStyles}
                  isClearable
                  isDisabled={!filters.moNo}
                  placeholder="All"
                  menuPortalTarget={document.body}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={clearFilters}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold text-sm transition-all"
              >
                <XCircle size={16} />
                Clear
              </button>
              <button className="p-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md">
                <Download size={18} />
              </button>
              <button className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md">
                <FileText size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MobileSummaryCard
            icon={<CheckSquare size={20} />}
            title="Checked | QA Sample"
            value={(data.summary.totalCheckedQty ?? 0).toLocaleString()}
            subValue={(data.summary.totalQASampleSize ?? 0).toLocaleString()}
          />
          <MobileSummaryCard
            icon={<AlertTriangle size={20} />}
            title="Defects | QA Defects"
            value={(data.summary.totalDefectQty ?? 0).toLocaleString()}
            subValue={(data.summary.totalQADefectQty ?? 0).toLocaleString()}
          />
          <MobileSummaryCard
            icon={<Percent size={20} />}
            title="QC Defect Rate"
            value={`${data.summary.overallDefectRate.toFixed(2)}%`}
            bgColorClass={getRateColorClass(
              data.summary.overallDefectRate,
              true
            )}
          />
          <MobileSummaryCard
            icon={<Percent size={20} />}
            title="QA Defect Rate"
            value={`${overallQARate.toFixed(2)}%`}
            bgColorClass={getQARateColorClass(overallQARate)}
          />
        </div>

        {/* Top Defects */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MobileTopDefectCard rank={1} defect={data.summary.topDefects[0]} />
          <MobileTopDefectCard rank={2} defect={data.summary.topDefects[1]} />
          <MobileTopDefectCard rank={3} defect={data.summary.topDefects[2]} />
        </div>

        {/* Display Mode Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Display By:
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDisplayMode("qty")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  displayMode === "qty"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                Qty
              </button>
              <button
                onClick={() => setDisplayMode("rate")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  displayMode === "rate"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                Rate
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-indigo-500" />
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
                Loading reports...
              </p>
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
              <p className="mt-4 text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            </div>
          ) : data.reports.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                No reports found
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            data.reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                displayMode={displayMode}
                dynamicDefectHeaders={dynamicDefectHeaders}
                getRateColorClass={getRateColorClass}
                getQARateColorClass={getQARateColorClass}
                handleShowQaUser={handleShowQaUser}
                handleShowImages={handleShowImages}
                aggregateQADefects={aggregateQADefects}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {isUserModalOpen && (
        <QAUserModal
          user={qaUserInfo}
          isLoading={isUserLoading}
          onClose={closeUserModal}
        />
      )}
      {isImageModalOpen && (
        <QAImageModal data={imageModalData} onClose={closeImageModal} />
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SubConQCReportMobileView;
