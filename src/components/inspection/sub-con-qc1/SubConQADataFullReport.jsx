import axios from "axios";
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  Factory,
  FileText,
  Hash,
  Image as ImageIcon,
  List,
  Loader2,
  Palette,
  Percent,
  TrendingUp,
  User,
  Users,
  XCircle
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../../../../config";

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start text-sm">
    <div className="w-5 mr-2 mt-0.5 text-gray-500 dark:text-gray-400">
      {icon}
    </div>
    <div className="font-semibold text-gray-600 dark:text-gray-300 w-32">
      {label}:
    </div>
    <div className="flex-1 font-medium text-gray-800 dark:text-gray-100">
      {value}
    </div>
  </div>
);

const StatusBadge = ({ status, type = "default" }) => {
  let bgColor = "";
  let textColor = "";

  if (type === "spi" || type === "measurement") {
    bgColor =
      status === "Pass"
        ? "bg-green-100 dark:bg-green-900/30"
        : "bg-red-100 dark:bg-red-900/30";
    textColor =
      status === "Pass"
        ? "text-green-700 dark:text-green-400"
        : "text-red-700 dark:text-red-400";
  } else if (type === "labelling") {
    bgColor =
      status === "Correct"
        ? "bg-green-100 dark:bg-green-900/30"
        : "bg-red-100 dark:bg-red-900/30";
    textColor =
      status === "Correct"
        ? "text-green-700 dark:text-green-400"
        : "text-red-700 dark:text-red-400";
  } else if (type === "severity") {
    switch (status) {
      case "Minor":
        bgColor = "bg-yellow-100 dark:bg-yellow-900/30";
        textColor = "text-yellow-700 dark:text-yellow-400";
        break;
      case "Major":
        bgColor = "bg-orange-100 dark:bg-orange-900/30";
        textColor = "text-orange-700 dark:text-orange-400";
        break;
      case "Critical":
        bgColor = "bg-red-100 dark:bg-red-900/30";
        textColor = "text-red-700 dark:text-red-400";
        break;
      default:
        bgColor = "bg-gray-100 dark:bg-gray-700";
        textColor = "text-gray-700 dark:text-gray-300";
    }
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold ${bgColor} ${textColor}`}
    >
      {status}
    </span>
  );
};

const ImageGallery = ({ images, title }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedImage(`${API_BASE_URL}${img}`)}
            className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700"
          >
            <img
              src={`${API_BASE_URL}${img}`}
              alt={`${title} ${idx + 1}`}
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white bg-red-600 hover:bg-red-700 p-2 rounded-full"
          >
            <XCircle size={24} />
          </button>
          <img
            src={selectedImage}
            alt="Full size preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
};

const SubConQADataFullReport = () => {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [qaInspector, setQaInspector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reportRes = await axios.get(
          `${API_BASE_URL}/api/subcon-qa-inspection-data/${reportId}`
        );
        setReport(reportRes.data.report);

        // Fetch QA Inspector details
        if (reportRes.data.report.preparedBy?.empId) {
          try {
            const qaRes = await axios.get(
              `${API_BASE_URL}/api/user-info-subcon-qa/${reportRes.data.report.preparedBy.empId}`
            );
            setQaInspector(qaRes.data);
          } catch (err) {
            console.error("Failed to fetch QA inspector details", err);
          }
        }
      } catch (err) {
        setError("Failed to load report data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <div className="text-center text-red-500 text-xl">
          {error || "Report not found"}
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-700 dark:text-gray-200">
              Yorkmars Garment MFG Co., LTD | QA Inspection Full Report
            </h1>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Report ID
              </p>
              <p className="text-lg font-mono font-bold">{report.reportID}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Report Type: {report.reportType} | Factory: {report.factory} | Date:{" "}
            {formatDate(report.inspectionDate)} | MO No: {report.moNo} | Line
            No: {report.lineNo}
          </p>
        </div>

        {/* Inspector Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QA Inspector */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-indigo-200 dark:border-indigo-800">
            <h3 className="font-bold mb-4 text-lg flex items-center gap-2">
              <User className="text-indigo-500" />
              QA Inspector
            </h3>
            {qaInspector ? (
              <div className="flex items-center gap-4">
                <img
                  src={
                    qaInspector.face_photo ||
                    `https://ui-avatars.com/api/?name=${qaInspector.eng_name}&background=random`
                  }
                  alt={qaInspector.eng_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-400 shadow-lg"
                />
                <div>
                  <div className="font-bold text-xl">
                    {qaInspector.eng_name}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 font-mono">
                    {report.preparedBy.empId}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {qaInspector.job_title}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                <p className="font-mono">{report.preparedBy.empId}</p>
                <p>{report.preparedBy.engName}</p>
              </div>
            )}
          </div>

          {/* QC Inspectors */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-purple-200 dark:border-purple-800">
            <h3 className="font-bold mb-4 text-lg flex items-center gap-2">
              <Users className="text-purple-500" />
              QC Inspectors ({report.qcList?.length || 0})
            </h3>
            <div className="space-y-3">
              {report.qcList?.map((qc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                >
                  <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center">
                    <User
                      className="text-purple-700 dark:text-purple-300"
                      size={24}
                    />
                  </div>
                  <div>
                    <div className="font-bold">{qc.qcID}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {qc.qcName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Details */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700">
          <h3 className="font-bold mb-4 text-xl border-b-2 pb-2 dark:border-gray-700">
            Report Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailItem
              icon={<Calendar size={16} />}
              label="Inspection Date"
              value={formatDate(report.inspectionDate)}
            />
            <DetailItem
              icon={<FileText size={16} />}
              label="Report Type"
              value={report.reportType}
            />
            <DetailItem
              icon={<Factory size={16} />}
              label="Factory"
              value={report.factory}
            />
            <DetailItem
              icon={<List size={16} />}
              label="Line No"
              value={report.lineNo}
            />
            <DetailItem
              icon={<Hash size={16} />}
              label="MO Number"
              value={report.moNo}
            />
            <DetailItem
              icon={<Factory size={16} />}
              label="Buyer"
              value={report.buyer}
            />
            <DetailItem
              icon={<Palette size={16} />}
              label="Color"
              value={report.color}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle size={32} />
              <span className="text-3xl font-black">
                {report.totalCheckedQty}
              </span>
            </div>
            <p className="text-sm opacity-90">Total Checked Qty</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-pink-500 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <XCircle size={32} />
              <span className="text-3xl font-black">
                {report.totalRejectPcs}
              </span>
            </div>
            <p className="text-sm opacity-90">Total Reject Pieces</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle size={32} />
              <span className="text-3xl font-black">
                {report.totalOverallDefectQty}
              </span>
            </div>
            <p className="text-sm opacity-90">Total Defects</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={32} />
              <span className="text-3xl font-black">
                {report.totalCheckedQty > 0
                  ? (
                      (report.totalOverallDefectQty / report.totalCheckedQty) *
                      100
                    ).toFixed(2)
                  : "0.00"}
                %
              </span>
            </div>
            <p className="text-sm opacity-90">Defect Rate</p>
          </div>
        </div>

        {/* QC Data Details */}
        {report.qcData?.map((qc, qcIndex) => (
          <div
            key={qcIndex}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* QC Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {qcIndex + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {qc.qcID} - {qc.qcName}
                    </h3>
                    <p className="text-sm opacity-90">
                      Quality Control Inspector
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* QC Stats */}
              {(() => {
                // Calculate severity counts
                const minorCount =
                  qc.defectList
                    ?.filter((d) => d.standardStatus === "Minor")
                    .reduce((sum, d) => sum + (d.qty || 0), 0) || 0;
                const majorCount =
                  qc.defectList
                    ?.filter((d) => d.standardStatus === "Major")
                    .reduce((sum, d) => sum + (d.qty || 0), 0) || 0;
                const criticalCount =
                  qc.defectList
                    ?.filter((d) => d.standardStatus === "Critical")
                    .reduce((sum, d) => sum + (d.qty || 0), 0) || 0;

                // Calculate defect rate
                const defectRate =
                  qc.checkedQty > 0
                    ? ((qc.totalDefectQty / qc.checkedQty) * 100).toFixed(2)
                    : "0.00";

                // Calculate weighted defect sum and pass rate
                const weightedDefectSum =
                  qc.defectList?.reduce((sum, defect) => {
                    const weight =
                      defect.standardStatus === "Minor"
                        ? 1
                        : defect.standardStatus === "Major"
                        ? 1.5
                        : defect.standardStatus === "Critical"
                        ? 2
                        : 0;
                    return sum + defect.qty * weight;
                  }, 0) || 0;

                const passRate =
                  qc.checkedQty > 0
                    ? (1 - weightedDefectSum / qc.checkedQty) * 100
                    : 100;

                // Determine grade
                let grade = "D";
                if (passRate === 100) grade = "A";
                else if (passRate >= 95) grade = "B";
                else if (passRate >= 92.5) grade = "C";

                // Grade styling
                const getGradeClass = (g) => {
                  switch (g) {
                    case "A":
                      return "bg-gradient-to-br from-green-500 to-emerald-600 text-white";
                    case "B":
                      return "bg-gradient-to-br from-blue-500 to-cyan-600 text-white";
                    case "C":
                      return "bg-gradient-to-br from-orange-500 to-amber-600 text-white";
                    case "D":
                      return "bg-gradient-to-br from-red-500 to-rose-600 text-white";
                    default:
                      return "bg-gray-300 text-gray-800";
                  }
                };

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Checked Qty */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                          {qc.checkedQty}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Checked Qty
                      </p>
                    </div>

                    {/* Reject Pcs */}
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-5 rounded-xl border-2 border-red-200 dark:border-red-800 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg">
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-3xl font-black text-red-600 dark:text-red-400">
                          {qc.rejectPcs}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Reject Pcs
                      </p>
                    </div>

                    {/* Defect Qty with Breakdown */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-5 rounded-xl border-2 border-orange-200 dark:border-orange-800 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <p className="text-3xl font-black text-orange-600 dark:text-orange-400">
                          {qc.totalDefectQty}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                        Total Defects
                      </p>
                      {(minorCount > 0 ||
                        majorCount > 0 ||
                        criticalCount > 0) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {minorCount > 0 && (
                            <div className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-md text-xs font-bold">
                              MI: {minorCount}
                            </div>
                          )}
                          {majorCount > 0 && (
                            <div className="px-2 py-1 bg-orange-600 text-white rounded-md text-xs font-bold">
                              MA: {majorCount}
                            </div>
                          )}
                          {criticalCount > 0 && (
                            <div className="px-2 py-1 bg-red-600 text-white rounded-md text-xs font-bold">
                              CR: {criticalCount}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Defect Rate */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-5 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                          <Percent className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
                          {defectRate}%
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Defect Rate
                      </p>
                    </div>

                    {/* Grade */}
                    <div
                      className={`p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${getGradeClass(
                        grade
                      )}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-5xl font-black text-white drop-shadow-lg">
                          {grade}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-white/90">Grade</p>
                      <p className="text-xs text-white/75 mt-1">
                        {passRate.toFixed(2)}% Pass Rate
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Defect Details */}
              {qc.defectList && qc.defectList.length > 0 && (
                <div>
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-orange-500" />
                    Defect Details
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="p-3 text-left font-semibold">
                            Pcs No
                          </th>
                          <th className="p-3 text-left font-semibold">
                            Defect Name
                          </th>
                          <th className="p-3 text-center font-semibold">Qty</th>
                          <th className="p-3 text-center font-semibold">
                            Severity
                          </th>
                          <th className="p-3 text-center font-semibold">
                            Decision
                          </th>
                          <th className="p-3 text-center font-semibold">
                            Images
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {qc.defectList.map((defect, defIdx) => (
                          <tr
                            key={defIdx}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <td className="p-3 font-mono">{defect.pcsNo}</td>
                            <td className="p-3">
                              <div className="font-semibold">
                                {defect.defectName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {defect.khmerName}
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold">
                              {defect.qty}
                            </td>
                            <td className="p-3 text-center">
                              <StatusBadge
                                status={defect.standardStatus}
                                type="severity"
                              />
                            </td>
                            <td className="p-3 text-center text-sm">
                              {defect.decision}
                            </td>
                            <td className="p-3 text-center">
                              {defect.images && defect.images.length > 0 ? (
                                <span className="text-blue-600 font-semibold">
                                  {defect.images.length} image(s)
                                </span>
                              ) : (
                                <span className="text-gray-400">No images</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Defect Images */}
                  {qc.defectList.some(
                    (d) => d.images && d.images.length > 0
                  ) && (
                    <div className="mt-6">
                      <h5 className="font-semibold mb-3 flex items-center gap-2">
                        <ImageIcon className="text-indigo-500" size={20} />
                        Defect Images
                      </h5>
                      {qc.defectList
                        .filter((d) => d.images && d.images.length > 0)
                        .map((defect, idx) => (
                          <div key={idx} className="mb-6">
                            <p className="font-medium mb-2">
                              {defect.defectName} (Pcs #{defect.pcsNo})
                            </p>
                            <ImageGallery
                              images={defect.images}
                              title={`${defect.defectName} Pcs ${defect.pcsNo}`}
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* SPI, Measurement, Labelling */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SPI */}
                <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-bold text-lg">SPI</h5>
                    <StatusBadge status={qc.spi.status} type="spi" />
                  </div>
                  <ImageGallery images={qc.spi.images} title="SPI" />
                </div>

                {/* Measurement */}
                <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-bold text-lg">Measurement</h5>
                    <StatusBadge
                      status={qc.measurement.status}
                      type="measurement"
                    />
                  </div>
                  <ImageGallery
                    images={qc.measurement.images}
                    title="Measurement"
                  />
                </div>

                {/* Labelling */}
                <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-bold text-lg">Labelling</h5>
                    <StatusBadge
                      status={qc.labelling.status}
                      type="labelling"
                    />
                  </div>
                  <ImageGallery
                    images={qc.labelling.images}
                    title="Labelling"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Additional Comments */}
        {report.additionalComments && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <FileText className="text-purple-500" />
              Additional Comments
            </h3>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-l-4 border-purple-500">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {report.additionalComments}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubConQADataFullReport;
