// src/components/inspection/cutting/report/CuttingReportDetailView.jsx
import axios from "axios";
import { Loader2, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config"; // Adjust path
import ReportGeneralInfo from "./ReportGeneralInfo";
import ReportInspectionSummary from "./ReportInspectionSummary";
import ReportSizeDetail from "./ReportSizeDetail";

const CuttingReportDetailView = ({ reportId, onBack }) => {
  const { t } = useTranslation();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reportId) return;

    const fetchReportDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/cutting-inspection-report-detail/${reportId}`,
          {
            withCredentials: true
          }
        );
        setReport(response.data);
      } catch (err) {
        console.error("Error fetching report detail:", err);
        setError(
          err.response?.data?.message || t("cutting.failedToFetchReportDetails")
        );
        Swal.fire({
          icon: "error",
          title: t("cutting.error"),
          text:
            err.response?.data?.message ||
            t("cutting.failedToFetchReportDetails")
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetail();
  }, [reportId, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2">{t("common.loadingData")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
        >
          <XCircle size={20} className="mr-2" />
          {t("common.backToList")}
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center text-gray-500 p-4">
        <p>{t("cutting.reportNotFound")}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
        >
          <XCircle size={20} className="mr-2" />
          {t("common.backToList")}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {t("cutting.cuttingInspectionReport")} - {t("cutting.moNo")}:{" "}
          {report.moNo}, {t("cutting.tableNo")}: {report.tableNo}
        </h1>
        <button
          onClick={onBack}
          className="p-2 text-red-600 hover:text-red-800"
          title={t("common.closeReport")}
        >
          <XCircle size={28} />
        </button>
      </div>

      <ReportGeneralInfo report={report} />
      <ReportInspectionSummary inspectionData={report.inspectionData} />

      {report.inspectionData?.map((dataEntry, index) => (
        <ReportSizeDetail key={index} inspectionDataEntry={dataEntry} />
      ))}
    </div>
  );
};

export default CuttingReportDetailView;
