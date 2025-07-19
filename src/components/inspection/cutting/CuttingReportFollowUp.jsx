import {
  Archive,
  AlertTriangle,
  Bug,
  ClipboardCheck,
  FileSearch,
  PackageCheck,
  Scaling,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
  Loader2
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext"; // Adjust path if needed

// --- START: ADD THE MISSING FUNCTION HERE ---
const getResultStatus = (
  totalInspectionQty,
  sumTotalReject,
  sumTotalPcs,
  t
) => {
  if (sumTotalPcs < totalInspectionQty) {
    return {
      status: t("common.pending"),
      color: "bg-yellow-100 text-yellow-700"
    };
  }
  if (totalInspectionQty >= 315) {
    if (sumTotalReject > 7)
      return { status: t("common.fail"), color: "bg-red-100 text-red-600" };
    return { status: t("common.pass"), color: "bg-green-100 text-green-600" };
  } else if (totalInspectionQty >= 210) {
    if (sumTotalReject > 5)
      return { status: t("common.fail"), color: "bg-red-100 text-red-600" };
    return { status: t("common.pass"), color: "bg-green-100 text-green-600" };
  } else if (totalInspectionQty >= 135) {
    if (sumTotalReject > 3)
      return { status: t("common.fail"), color: "bg-red-100 text-red-600" };
    return { status: t("common.pass"), color: "bg-green-100 text-green-600" };
  } else if (totalInspectionQty >= 90) {
    if (sumTotalReject > 2)
      return { status: t("common.fail"), color: "bg-red-100 text-red-600" };
    return { status: t("common.pass"), color: "bg-green-100 text-green-600" };
  } else if (totalInspectionQty >= 60) {
    if (sumTotalReject > 1)
      return { status: t("common.fail"), color: "bg-red-100 text-red-600" };
    return { status: t("common.pass"), color: "bg-green-100 text-green-600" };
  } else if (totalInspectionQty >= 30) {
    if (sumTotalReject > 0)
      return { status: t("common.fail"), color: "bg-red-100 text-red-600" };
    return { status: t("common.pass"), color: "bg-green-100 text-green-600" };
  }
  return {
    status: t("common.pending"),
    color: "bg-yellow-100 text-yellow-700"
  };
};

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-semibold text-gray-800 break-words">
      {value || "N/A"}
    </p>
  </div>
);

const SummaryTableItem = ({ label, value, icon: Icon, colorClass }) => (
  <div
    className={`p-2 border rounded-md flex items-center gap-3 ${
      colorClass || "bg-gray-50"
    }`}
  >
    {Icon && <Icon className="h-5 w-5 text-gray-600" />}
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// --- NEW COMPONENT FOR THE ISSUES TABLE ---
const MeasurementIssuesTable = ({ reportId }) => {
  const { t } = useTranslation();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIssues = async () => {
      if (!reportId) return;
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-report-measurement-issues/${reportId}`
        );
        setIssues(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch measurement issues:", err);
        setError(t("cutting.failedToFetchMeasurementIssues"));
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [reportId, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="animate-spin mr-2" /> {t("common.loadingData")}
      </div>
    );
  }
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }
  if (issues.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
        {t("cutting.noMeasurementIssuesFound")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse border border-gray-300">
        <thead className="bg-gray-100 font-semibold">
          <tr>
            <th className="p-2 border border-gray-300 text-left">
              {t("cutting.inspectedSize")}
            </th>
            <th className="p-2 border border-gray-300 text-left">
              {t("cutting.measurementPointName")}
            </th>
            <th className="p-2 border border-gray-300 text-left">
              {t("cutting.measuredValues")}
            </th>
            <th className="p-2 border border-gray-300 text-center">
              {t("cutting.totalCount")}
            </th>
            <th className="p-2 border border-gray-300 text-center">
              {t("cutting.totalNegTol")}
            </th>
            <th className="p-2 border border-gray-300 text-center">
              {t("cutting.totalPosTol")}
            </th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-2 border border-gray-300 font-medium">
                {issue.inspectedSize}
              </td>
              <td className="p-2 border border-gray-300">
                {issue.measurementPointName}
              </td>
              <td className="p-2 border border-gray-300">
                <div className="flex flex-wrap gap-2">
                  {issue.measuredValues.map((val, idx) => (
                    <span
                      key={idx}
                      className={`font-mono px-2 py-1 rounded ${
                        val.valuedecimal < 0
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {val.value}{" "}
                      <span className="text-xs opacity-75">
                        (Bundle:{val.bundleNo}, Pcs Name:{val.pcsName})
                      </span>
                    </span>
                  ))}
                </div>
              </td>
              <td className="p-2 border border-gray-300 text-center font-bold">
                {issue.totalCount}
              </td>
              <td className="p-2 border border-gray-300 text-center font-bold text-red-600">
                {issue.totalNegTol}
              </td>
              <td className="p-2 border border-gray-300 text-center font-bold text-blue-600">
                {issue.totalPosTol}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CuttingReportFollowUp = ({ report, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth(); // Get logged-in user details

  const result = getResultStatus(
    report.totalInspectionQty,
    report.sumTotalReject,
    report.sumTotalPcs,
    t
  );
  const isFail = result.status === t("common.fail");

  if (!report) return null;

  return (
    // Modal Backdrop
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto">
      {/* Modal Content */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 transform transition-all">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {t("cutting.followUpReport")} | {report.garmentType} | {report.moNo}{" "}
            | {report.tableNo}
          </h2>
          {isFail ? (
            <span className="px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 border-2 border-red-700 rounded-lg">
              {t("common.actionRequired")}
            </span>
          ) : (
            <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 border-2 border-green-700 rounded-lg">
              {t("common.noActionRequired")}
            </span>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Top Info Box */}
          <div className="p-4 border rounded-lg bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem
              label={t("cutting.inspectionDate")}
              value={report.inspectionDate}
            />
            <InfoItem label={t("cutting.moNo")} value={report.moNo} />
            <InfoItem
              label={t("cutting.custStyle")}
              value={report.buyerStyle}
            />
            <InfoItem label={t("cutting.buyer")} value={report.buyer} />
            <InfoItem label={t("cutting.tableNo")} value={report.tableNo} />
            <InfoItem
              label={t("cutting.spreadTable")}
              value={report.cuttingTableDetails?.spreadTable}
            />
            <InfoItem
              label={t("cutting.material")}
              value={report.fabricDetails?.material}
            />
            <InfoItem label={t("cutting.color")} value={report.color} />
            <InfoItem
              label={t("cutting.garmentType")}
              value={report.garmentType}
            />
            <InfoItem
              label={t("cutting.mackerNo")}
              value={report.cuttingTableDetails?.mackerNo}
            />
            <div className="col-span-2">
              <p className="text-xs text-gray-500">{t("cutting.lotNos")}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {report.lotNo?.map((lot, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full"
                  >
                    {lot}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <hr />

          {/* Summary Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-100 text-gray-700 font-semibold">
                <tr>
                  <th
                    colSpan="3"
                    className="p-2 border border-gray-300 text-center"
                  >
                    {t("cutting.layerDetails")}
                  </th>
                  <th
                    colSpan="4"
                    className="p-2 border border-gray-300 text-center"
                  >
                    {t("cutting.bundleDetails")}
                  </th>

                  <th
                    colSpan="2"
                    className="p-2 border border-gray-300 text-center"
                  >
                    {t("cutting.overallResult")}
                  </th>
                </tr>
                <tr>
                  {/* Layer Details */}
                  <th className="p-2 border border-gray-300">
                    {t("cutting.plan")}
                  </th>
                  <th className="p-2 border border-gray-300">
                    {t("cutting.actual")}
                  </th>
                  <th className="p-2 border border-gray-300">
                    {t("cutting.totalPcs")}
                  </th>
                  {/* Bundle Details */}
                  <th className="p-2 border border-gray-300">
                    {t("cutting.totalQty")}
                  </th>
                  <th className="p-2 border border-gray-300">
                    {t("cutting.qtyChecked")}
                  </th>
                  <th className="p-2 border border-gray-300">
                    {t("cutting.inspectedQty")}
                  </th>
                  <th className="p-2 border border-gray-300">
                    {t("cutting.inspectedSizes")}
                  </th>

                  {/* Overall Result */}
                  <th className="p-2 border border-gray-300">
                    {t("cutting.passRate")}
                  </th>
                  <th className="p-2 border border-gray-300">
                    {t("cutting.aqlresults")}
                  </th>
                </tr>
              </thead>
              <tbody className="text-center font-medium">
                <tr>
                  {/* Layer Details Values */}
                  <td className="p-2 border border-gray-300">
                    {report.cuttingTableDetails?.planLayers}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {report.cuttingTableDetails?.actualLayers}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {report.cuttingTableDetails?.totalPcs}
                  </td>
                  {/* Bundle Details Values */}
                  <td className="p-2 border border-gray-300">
                    {report.totalBundleQty}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {report.bundleQtyCheck}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {report.totalInspectionQty}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {report.numberOfInspectedSizes}
                  </td>

                  {/* Overall Result Values */}
                  <td className="p-2 border border-gray-300">{`${report.overallPassRate?.toFixed(
                    2
                  )}%`}</td>
                  <td
                    className={`p-2 border border-gray-300 ${
                      getResultStatus(
                        report.totalInspectionQty,
                        report.sumTotalReject,
                        report.sumTotalPcs,
                        t
                      ).color
                    }`}
                  >
                    {
                      getResultStatus(
                        report.totalInspectionQty,
                        report.sumTotalReject,
                        report.sumTotalPcs,
                        t
                      ).status
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Tables */}
          <div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
              <SummaryTableItem
                label={t("cutting.totalCompleted")}
                value={report.sumTotalPcs}
                icon={PackageCheck}
                colorClass="bg-blue-100"
              />
              <SummaryTableItem
                label={t("cutting.pass")}
                value={report.sumTotalPass}
                icon={ThumbsUp}
                colorClass="bg-green-100"
              />
              <SummaryTableItem
                label={t("cutting.reject")}
                value={report.sumTotalReject}
                icon={ThumbsDown}
                colorClass="bg-red-300"
              />
              <SummaryTableItem
                label={t("cutting.rejectMeasurements")}
                value={report.sumTotalRejectMeasurement}
                icon={AlertTriangle}
                colorClass="bg-red-100"
              />
              <SummaryTableItem
                label={t("cutting.rejectDefects")}
                value={report.sumTotalRejectDefects}
                icon={Bug}
                colorClass="bg-red-100"
              />
            </div>
          </div>

          <hr />

          {/* Measurement Issues Placeholder */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t("cutting.measurementIssues")}
            </h3>
            {/* Replace the placeholder with the new component */}
            <MeasurementIssuesTable reportId={report._id} />
            {/* <div className="p-4 border rounded-lg text-center text-gray-500 bg-gray-50">
              {t("common.featureComingSoon")}
            </div> */}
          </div>

          {/* Supervisor Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t("cutting.supervisorActions")}
            </h3>
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50">
              {user && (
                <div className="flex-shrink-0 flex flex-col items-center w-24">
                  {user.face_photo ? (
                    <img
                      src={user.face_photo}
                      alt={user.eng_name}
                      className="h-16 w-16 rounded-full object-cover shadow-md border-2 border-white"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center border-2 border-white shadow-md">
                      <User className="h-10 w-10 text-gray-500" />
                    </div>
                  )}
                  <p className="text-sm font-bold text-gray-800 mt-2">
                    {user.eng_name}
                  </p>
                  <p className="text-xs text-gray-500">{user.emp_id}</p>
                </div>
              )}
              <div className="flex-grow">
                <label
                  htmlFor="supervisor-comments"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("common.actionsComments")}
                </label>
                <textarea
                  id="supervisor-comments"
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t("cutting.enterFollowUpActions")}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={() => Swal.fire(t("common.workInProgress"), "", "info")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CuttingReportFollowUp;
