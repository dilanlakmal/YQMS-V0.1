import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import {
  Loader2,
  User,
  Users,
  Calendar,
  Clock,
  Factory,
  Ship,
  Plane,
  Tag,
  Users2,
  MapPin,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle
} from "lucide-react";
import QCAccuracyViewReportPageTitle from "./QCAccuracyViewReportPageTitle";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  ChartDataLabels
);

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start text-sm">
    <div className="w-5 mr-2 mt-0.5 text-gray-500 dark:text-gray-400">
      {icon}
    </div>
    <div className="font-semibold text-gray-600 dark:text-gray-300 w-32">
      {label}:
    </div>
    <div className="flex-1 font-medium">{value}</div>
  </div>
);

// --- CREATE NEW, MORE SPECIFIC COMPONENTS FOR THE NEW UI ---
const MiniStatCard = ({ label, value, icon, colorClass = "text-gray-300" }) => (
  <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg flex items-center">
    <div className={`p-2 mr-3`}>
      {React.cloneElement(icon, {
        size: 20,
        className: `text-gray-400 dark:${colorClass}`
      })}
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-xl font-bold dark:${colorClass}`}>{value}</p>
    </div>
  </div>
);

const DefectCountPill = ({ label, count, bgColor, textColor }) => (
  <div
    className={`flex items-center gap-2 ${bgColor} ${textColor} px-2 py-1 rounded-md text-xs font-semibold`}
  >
    <span>{label}:</span>
    <span>{count}</span>
  </div>
);

const QCAccuracyViewInspectionReport = () => {
  const { reportId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImageModal, setShowImageModal] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/qa-accuracy/report/${reportId}`
        );
        setData(response.data);
      } catch (err) {
        setError("Failed to load report data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reportId]);

  const { report, qaInspectorDetails, scannedQcDetails, orderDetails } =
    data || {};

  const inspectionStats = useMemo(() => {
    if (!report) return null;
    const totalDefects = report.defects.reduce((sum, d) => sum + d.qty, 0);
    const rejectedPcs = new Set(report.defects.map((d) => d.pcsNo)).size;
    const defectStatusCounts = report.defects.reduce(
      (acc, d) => {
        if (d.standardStatus)
          acc[d.standardStatus] = (acc[d.standardStatus] || 0) + d.qty;
        return acc;
      },
      { Minor: 0, Major: 0, Critical: 0 }
    );
    const defectNameCounts = report.defects.reduce((acc, d) => {
      if (d.defectNameEng)
        acc[d.defectNameEng] = (acc[d.defectNameEng] || 0) + d.qty;
      return acc;
    }, {});
    return { totalDefects, rejectedPcs, defectStatusCounts, defectNameCounts };
  }, [report]);

  const { totalDefects, rejectedPcs, defectStatusCounts, defectNameCounts } =
    inspectionStats || {};

  // Chart Logic
  const pieChartData = useMemo(
    () => ({
      labels: ["Minor", "Major", "Critical"],
      datasets: [
        {
          data: [
            defectStatusCounts?.Minor || 0,
            defectStatusCounts?.Major || 0,
            defectStatusCounts?.Critical || 0
          ],
          backgroundColor: ["#FBBF24", "#F97316", "#EF4444"],
          borderColor: ["#fff", "#fff", "#fff"],
          borderWidth: 2
        }
      ]
    }),
    [defectStatusCounts]
  );

  const paretoData = useMemo(() => {
    if (!defectNameCounts)
      return { labels: [], defectData: [], cumulativePercentage: [] };
    const sortedDefects = Object.entries(defectNameCounts).sort(
      ([, a], [, b]) => b - a
    );
    const labels = sortedDefects.map(([name]) => name);
    const defectData = sortedDefects.map(([, qty]) => qty);
    const cumulativeData = defectData.reduce(
      (acc, val, i) => [...acc, (acc[i - 1] || 0) + val],
      []
    );
    const cumulativePercentage = cumulativeData.map(
      (val) => (val / totalDefects) * 100
    );
    return { labels, defectData, cumulativePercentage };
  }, [defectNameCounts, totalDefects]);

  const barChartData = {
    labels: paretoData.labels,
    datasets: [
      {
        type: "bar",
        label: "Defect Qty",
        data: paretoData.defectData,
        backgroundColor: "rgba(54, 162, 235, 0.6)"
      },
      {
        type: "line",
        label: "Pareto Curve",
        data: paretoData.cumulativePercentage,
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
        fill: false,
        yAxisID: "y1"
      }
    ]
  };
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Quantity" } },
      y1: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        max: 100,
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Cumulative %" }
      }
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

  const allSizes =
    orderDetails?.orderColors.flatMap((c) =>
      c.OrderQty.map((q) => Object.keys(q)[0].split(";")[0])
    ) || [];
  const uniqueSizes = [...new Set(allSizes)].sort();

  const getStatusPillClass = (status) => {
    switch (status) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      case "Major":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
      case "Minor":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <QCAccuracyViewReportPageTitle report={report} />

        {/* Personnel Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="font-bold mb-3 text-lg">QA Inspector</h3>
            <div className="flex items-center">
              <img
                src={
                  qaInspectorDetails.face_photo || "/path/to/default/avatar.png"
                }
                alt={qaInspectorDetails.eng_name}
                className="w-20 h-20 rounded-full object-cover mr-4"
              />
              <div>
                <div className="font-bold text-xl">
                  {qaInspectorDetails.eng_name}
                </div>
                <div className="text-gray-500 dark:text-gray-400 font-mono">
                  {report.qcInspector.empId}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="font-bold mb-3 text-lg">QC Inspector</h3>
            <div className="flex items-center">
              <img
                src={
                  scannedQcDetails.face_photo || "/path/to/default/avatar.png"
                }
                alt={scannedQcDetails.eng_name}
                className="w-20 h-20 rounded-full object-cover mr-4"
              />
              <div>
                <div className="font-bold text-xl">
                  {scannedQcDetails.eng_name}
                </div>
                <div className="text-gray-500 dark:text-gray-400 font-mono">
                  {report.scannedQc.empId}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <h3 className="font-bold mb-4 text-lg border-b pb-2 dark:border-gray-700">
            Order & Report Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <DetailItem
              icon={<Factory size={16} />}
              label="Factory"
              value="Yorkmars (YM)"
            />
            <DetailItem
              icon={<Calendar size={16} />}
              label="Inspected Date"
              value={new Date(report.reportDate).toLocaleDateString()}
            />
            <DetailItem
              icon={<Clock size={16} />}
              label="Submitted Time"
              value={new Date(report.createdAt).toLocaleTimeString()}
            />
            <DetailItem
              icon={<User size={16} />}
              label="Merchandiser"
              value={orderDetails?.salesTeamName || "N/A"}
            />
            <DetailItem
              icon={<Clock size={16} />}
              label="Last Modified"
              value={new Date(report.updatedAt).toLocaleString()}
            />
            <DetailItem
              icon={<Tag size={16} />}
              label="MO No"
              value={report.moNo}
            />
            <DetailItem
              icon={<Users2 size={16} />}
              label="Customer Style"
              value={orderDetails?.custStyle || "N/A"}
            />
            <DetailItem
              icon={<MapPin size={16} />}
              label="Ship To"
              value={orderDetails?.country || "N/A"}
            />
            <DetailItem
              icon={<Ship size={16} />}
              label="Ship Mode"
              value={orderDetails?.mode || "N/A"}
            />
          </div>

          {orderDetails && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">
                Order Quantity by Color & Size
              </h4>
              <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-2 text-left font-bold">Color</th>
                      {uniqueSizes.map((size) => (
                        <th key={size} className="p-2 text-center font-bold">
                          {size}
                        </th>
                      ))}
                      <th className="p-2 text-center font-bold border-l dark:border-gray-600">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-600">
                    {orderDetails.orderColors.map((color) => {
                      const sizeMap = new Map(
                        color.OrderQty.map((q) => [
                          Object.keys(q)[0].split(";")[0],
                          Object.values(q)[0]
                        ])
                      );
                      const totalByColor = Array.from(sizeMap.values()).reduce(
                        (a, b) => a + b,
                        0
                      );
                      return (
                        <tr key={color.Color}>
                          <td className="p-2 font-semibold">{color.Color}</td>
                          {uniqueSizes.map((size) => (
                            <td key={size} className="p-2 text-center">
                              {sizeMap.get(size) || 0}
                            </td>
                          ))}
                          <td className="p-2 text-center font-bold border-l dark:border-gray-600">
                            {totalByColor}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* --- FIX #3: NEW INSPECTION DETAILS SECTION --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4 text-xl border-b pb-2 dark:border-gray-700">
            Inspection Details
          </h3>

          {/* AQL Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Sample Size & AQL</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-1 pr-2 font-medium text-gray-500">
                      Type:
                    </td>
                    <td>General</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-1 pr-2 font-medium text-gray-500">
                      Level:
                    </td>
                    <td>II</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-1 pr-2 font-medium text-gray-500">
                      Code Letter:
                    </td>
                    <td>{report.aql.codeLetter}</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-1 pr-2 font-medium text-gray-500">
                      Sample Size:
                    </td>
                    <td>{report.aql.sampleSize}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2 font-medium text-gray-500">
                      Accept (Ac):
                    </td>
                    <td>{report.aql.ac}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2 font-medium text-gray-500">
                      Reject (Re):
                    </td>
                    <td>{report.aql.re}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="border rounded-lg p-4 flex flex-col justify-center">
              <h4 className="font-semibold mb-2">Special Accept Criteria</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md font-bold w-20 text-center">
                    Minor
                  </div>
                  <span>: 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-md font-bold w-20 text-center">
                    Major
                  </div>
                  <span>: 0</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-red-100 text-red-800 px-2 py-1 rounded-md font-bold w-20 text-center">
                    Critical
                  </div>
                  <span>: 0</span>
                </div>
              </div>
            </div>
          </div>

          {/* --- FIX #2: RESTRUCTURED STATS SECTION --- */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
            <MiniStatCard
              label="Checked Qty"
              value={report.totalCheckedQty}
              icon={<FileText />}
            />
            <MiniStatCard
              label="Reject Pcs"
              value={rejectedPcs}
              icon={<XCircle />}
              colorClass="text-red-400"
            />

            <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg col-span-2 md:col-span-1">
              <div className="flex items-center mb-2">
                <div className="p-2 mr-3">
                  <AlertTriangle
                    size={20}
                    className="text-gray-400 dark:text-orange-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total Defects
                  </p>
                  <p className="text-xl font-bold dark:text-orange-400">
                    {totalDefects}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-around gap-1">
                <DefectCountPill
                  label="MI"
                  count={defectStatusCounts.Minor || 0}
                  bgColor="bg-yellow-200"
                  textColor="text-yellow-800"
                />
                <DefectCountPill
                  label="MA"
                  count={defectStatusCounts.Major || 0}
                  bgColor="bg-orange-200"
                  textColor="text-orange-800"
                />
                <DefectCountPill
                  label="CR"
                  count={defectStatusCounts.Critical || 0}
                  bgColor="bg-red-200"
                  textColor="text-red-800"
                />
              </div>
            </div>

            <div
              className={`p-3 rounded-lg flex items-center ${
                report.result === "Pass"
                  ? "bg-green-100 dark:bg-green-800/50"
                  : "bg-red-100 dark:bg-red-800/50"
              }`}
            >
              <div className="p-2 mr-3">
                <CheckCircle
                  size={20}
                  className={`text-gray-400 ${
                    report.result === "Pass"
                      ? "dark:text-green-400"
                      : "dark:text-red-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Results
                </p>
                <p
                  className={`text-xl font-bold ${
                    report.result === "Pass"
                      ? "dark:text-green-400"
                      : "dark:text-red-400"
                  }`}
                >
                  {report.result}
                </p>
              </div>
            </div>
            <div
              className={`p-4 rounded-lg flex justify-between items-center text-white ${
                report.grade === "A" || report.grade === "B"
                  ? "bg-blue-600"
                  : "bg-red-600"
              }`}
            >
              <div>
                <p className="text-sm opacity-80">Accuracy</p>
                <p className="font-black text-3xl">
                  {report.qcAccuracy.toFixed(2)}%
                </p>
              </div>
            </div>
            <div
              className={`p-4 rounded-lg flex justify-between items-center text-white ${
                report.grade === "A" || report.grade === "B"
                  ? "bg-blue-600"
                  : "bg-red-600"
              }`}
            >
              <div>
                <p className="text-sm opacity-80">Grade</p>
                <p className="font-black text-5xl">{report.grade}</p>
              </div>
            </div>
          </div>

          {/* Defect Details Table */}
          <div className="overflow-x-auto border rounded-lg dark:border-gray-700 mb-8">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-2 text-left">Defect Name</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-center">Classification</th>
                  <th className="p-2 text-center">Image</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-600">
                {report.defects && report.defects[0]?.defectCode ? (
                  report.defects.map((defect, i) => (
                    <tr key={i}>
                      <td className="p-2">{defect.defectNameEng}</td>
                      <td className="p-2 text-center">{defect.qty}</td>
                      <td className="p-2 text-center">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusPillClass(
                            defect.standardStatus
                          )}`}
                        >
                          {defect.standardStatus}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        {defect.imageUrl ? (
                          <img
                            src={defect.imageUrl}
                            onClick={() => setShowImageModal(defect.imageUrl)}
                            alt="defect"
                            className="h-10 w-10 object-cover rounded cursor-pointer mx-auto"
                          />
                        ) : (
                          "N/A"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-4 text-center italic text-gray-500"
                    >
                      No Defects Recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-center mb-2">
                Severity of Defects
              </h4>
              <div style={{ height: "300px" }}>
                <Pie
                  data={pieChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      datalabels: {
                        formatter: (value, ctx) => {
                          let sum = 0;
                          let dataArr = ctx.chart.data.datasets[0].data;
                          dataArr.map((data) => (sum += data));
                          let percentage =
                            ((value * 100) / sum).toFixed(2) + "%";
                          return `${percentage} (${value})`;
                        },
                        color: "#fff"
                      },
                      legend: { position: "bottom" }
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-center mb-2">
                Pareto of Defects
              </h4>
              <div style={{ height: "300px" }}>
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div
          onClick={() => setShowImageModal(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <img
            src={showImageModal}
            alt="Defect Preview"
            className="max-w-[90vw] max-h-[90vh]"
          />
        </div>
      )}

      {/* Inspection Details Section will be added here in the next prompt */}
    </div>
  );
};

export default QCAccuracyViewInspectionReport;
