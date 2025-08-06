import React, { useState, useEffect, useMemo, Fragment } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import {
  Loader2,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Target,
  Check,
  TrendingUp,
  Percent,
  Tag,
  User,
  Shirt,
  Package,
  Ship,
  Globe,
  MapPin
} from "lucide-react";

// --- Helper & Sub-components ---

const fractionToDecimal = (fraction) => {
  if (!fraction || fraction === "0") return 0;
  const sign = fraction.startsWith("-") ? -1 : 1;
  const parts = fraction.replace(/[-+]/, "").split("/");
  return parts.length === 2
    ? sign * (parseInt(parts[0], 10) / parseInt(parts[1], 10))
    : NaN;
};

const SummaryCard = ({ icon, title, value, colorClass, iconBgClass }) => (
  <div
    className={`p-3 rounded-xl shadow-inner bg-gray-100 dark:bg-gray-700/50`}
  >
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-full ${iconBgClass}`}>
        {React.cloneElement(icon, { className: `h-5 w-5 ${colorClass}` })}
      </div>
      <h5 className="font-semibold text-xs text-gray-600 dark:text-gray-300">
        {title}
      </h5>
    </div>
    <div className="text-center">
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  </div>
);

const TallyTable = ({ tallyData }) => {
  const dynamicColumns = useMemo(() => {
    if (!tallyData?.measurementsTally) return [];
    const allFractions = new Set();
    Object.values(tallyData.measurementsTally).forEach((tally) => {
      Object.keys(tally).forEach((fraction) => allFractions.add(fraction));
    });
    return Array.from(allFractions).sort(
      (a, b) => fractionToDecimal(a) - fractionToDecimal(b)
    );
  }, [tallyData]);

  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full text-xs border-collapse">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="sticky left-0 bg-gray-100 dark:bg-gray-700 p-2 border dark:border-gray-600 text-center">
              No
            </th>
            <th className="sticky left-10 bg-gray-100 dark:bg-gray-700 p-2 border dark:border-gray-600 text-left w-48">
              Measurement Point
            </th>
            <th className="p-2 border dark:border-gray-600 text-center">
              Spec
            </th>
            <th className="p-2 border dark:border-gray-600 text-center">
              Tol-
            </th>
            <th className="p-2 border dark:border-gray-600 text-center">
              Tol+
            </th>
            {dynamicColumns.map((col) => (
              <th
                key={col}
                className="p-2 border dark:border-gray-600 font-mono text-center"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tallyData.buyerSpecData.map((spec) => {
            const tolMinus = fractionToDecimal(spec.tolNeg_fraction);
            const tolPlus = fractionToDecimal(spec.tolPos_fraction);
            return (
              <tr
                key={spec.no}
                className="dark:odd:bg-gray-800 dark:even:bg-gray-800/50"
              >
                <td className="sticky left-0 bg-white dark:bg-gray-800/95 p-2 border dark:border-gray-600 text-center font-semibold">
                  {spec.no}
                </td>
                <td className="sticky left-10 bg-white dark:bg-gray-800/95 p-2 border dark:border-gray-600">
                  {spec.measurementPoint}
                </td>
                <td className="p-2 border dark:border-gray-600 text-center font-bold">
                  {spec.spec_fraction}
                </td>
                <td className="p-2 border dark:border-gray-600 text-center text-red-500">
                  {spec.tolNeg_fraction}
                </td>
                <td className="p-2 border dark:border-gray-600 text-center text-green-500">
                  {spec.tolPos_fraction}
                </td>
                {dynamicColumns.map((col) => {
                  const count =
                    tallyData.measurementsTally[spec.no]?.[col] || 0;
                  const colDecimal = fractionToDecimal(col);
                  const isInTolerance =
                    colDecimal >= tolMinus && colDecimal <= tolPlus;
                  const cellBg =
                    count > 0
                      ? isInTolerance
                        ? "bg-green-100 dark:bg-green-900/40"
                        : "bg-red-100 dark:bg-red-900/40"
                      : "";
                  return (
                    <td
                      key={col}
                      className={`p-2 border dark:border-gray-600 text-center font-bold ${cellBg}`}
                    >
                      {count > 0 ? count : ""}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const ANFStyleViewFullReport = () => {
  const { moNo } = useParams();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!moNo) {
        setError("MO Number is missing.");
        setIsLoading(false);
        return;
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/anf-measurement/style-view-full-report/${moNo}`
        );
        setReportData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load the report.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [moNo]);

  const { orderDetails, inspectorData, summaryByColor, detailsByColor } =
    reportData || {};

  const allSizes = useMemo(() => {
    if (!orderDetails?.orderColors) return [];
    const sizes = new Set();
    orderDetails.orderColors.forEach((c) =>
      c.OrderQty.forEach((q) => sizes.add(Object.keys(q)[0].split(";")[0]))
    );
    // A simple alpha-numeric sort for sizes
    return Array.from(sizes).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [orderDetails]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        <AlertTriangle className="h-8 w-8 mr-3" /> {error}
      </div>
    );
  if (!reportData)
    return <div className="text-center p-8">No report data available.</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        <h1 className="text-xl font-bold text-center">Style Full Report</h1>

        {/* --- Order Details Section --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-700">
            Order Details
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <p className="text-sm">
                <span className="font-semibold text-gray-500 dark:text-gray-400 w-28 inline-block">
                  MO No:
                </span>{" "}
                <span className="font-bold text-lg">{orderDetails.moNo}</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-500 dark:text-gray-400 w-28 inline-block">
                  Buyer:
                </span>{" "}
                {orderDetails.buyer} ANF
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-500 dark:text-gray-400 w-28 inline-block">
                  Cust. Style:
                </span>{" "}
                {orderDetails.custStyle}
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-500 dark:text-gray-400 w-28 inline-block">
                  Order Qty:
                </span>{" "}
                <span className="font-bold">{orderDetails.orderQty_style}</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-500 dark:text-gray-400 w-28 inline-block">
                  Mode:
                </span>{" "}
                {orderDetails.mode}
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-500 dark:text-gray-400 w-28 inline-block">
                  Country:
                </span>{" "}
                {orderDetails.country}
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-500 dark:text-gray-400 w-28 inline-block">
                  Origin:
                </span>{" "}
                {orderDetails.origin}
              </p>
            </div>
            <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-2 text-left font-bold">Color</th>
                    {allSizes.map((size) => (
                      <th key={size} className="p-2 text-center font-bold">
                        {size}
                      </th>
                    ))}
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
                    return (
                      <tr key={color.Color}>
                        <td className="p-2 font-semibold">{color.Color}</td>
                        {allSizes.map((size) => (
                          <td key={size} className="p-2 text-center">
                            {sizeMap.get(size) || 0}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- Inspector Data Section --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-700">
            Inspector Data
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/60 text-xs uppercase">
                <tr>
                  <th rowSpan="2" className="p-2 text-left">
                    QC ID
                  </th>
                  <th
                    colSpan="3"
                    className="p-2 text-center border-l border-r dark:border-gray-600"
                  >
                    Garment Details
                  </th>
                  <th
                    colSpan="5"
                    className="p-2 text-center border-r dark:border-gray-600"
                  >
                    Measurement Details
                  </th>
                  <th rowSpan="2" className="p-2 text-center">
                    Pass% (G)
                  </th>
                  <th rowSpan="2" className="p-2 text-center">
                    Pass% (P)
                  </th>
                  <th rowSpan="2" className="p-2 text-center">
                    Contribution
                  </th>
                </tr>
                <tr className="border-t dark:border-gray-600">
                  <th className="px-2 py-2 text-center tracking-wider border-l dark:border-gray-600">
                    Checked
                  </th>
                  <th className="px-2 py-2 text-center tracking-wider">OK</th>
                  <th className="px-2 py-2 text-center tracking-wider border-r dark:border-gray-600">
                    Reject
                  </th>
                  <th className="px-2 py-2 text-center tracking-wider">
                    Points
                  </th>
                  <th className="px-2 py-2 text-center tracking-wider">Pass</th>
                  <th className="px-2 py-2 text-center tracking-wider">
                    Issues
                  </th>
                  <th className="px-2 py-2 text-center tracking-wider">T+</th>
                  <th className="px-2 py-2 text-center tracking-wider border-r dark:border-gray-600">
                    T-
                  </th>
                </tr>
              </thead>
              <tbody>
                {inspectorData.map((qc) => {
                  const passRateGarment =
                    qc.garmentDetailsCheckedQty > 0
                      ? (
                          (qc.garmentDetailsOKGarment /
                            qc.garmentDetailsCheckedQty) *
                          100
                        ).toFixed(2) + "%"
                      : "N/A";
                  const passRatePoints =
                    qc.measurementDetailsPoints > 0
                      ? (
                          (qc.measurementDetailsPass /
                            qc.measurementDetailsPoints) *
                          100
                        ).toFixed(2) + "%"
                      : "N/A";
                  const contribution =
                    orderDetails.orderQty_style > 0
                      ? (
                          (qc.garmentDetailsCheckedQty /
                            orderDetails.orderQty_style) *
                          100
                        ).toFixed(2) + "%"
                      : "N/A";
                  return (
                    <tr
                      key={qc.qcID}
                      className="border-b last:border-b-0 dark:border-gray-700 text-center"
                    >
                      <td className="p-2 font-bold text-left">{qc.qcID}</td>
                      <td className="p-2">{qc.garmentDetailsCheckedQty}</td>
                      <td className="p-2 text-green-600 dark:text-green-400">
                        {qc.garmentDetailsOKGarment}
                      </td>
                      <td className="p-2 text-red-600 dark:text-red-400">
                        {qc.garmentDetailsRejected}
                      </td>
                      <td className="p-2">{qc.measurementDetailsPoints}</td>
                      <td className="p-2 text-green-600 dark:text-green-400">
                        {qc.measurementDetailsPass}
                      </td>
                      <td className="p-2 text-red-600 dark:text-red-400">
                        {qc.measurementDetailsTotalIssues}
                      </td>
                      <td className="p-2 text-rose-500">
                        {qc.measurementDetailsTolPositive}
                      </td>
                      <td className="p-2 text-red-500">
                        {qc.measurementDetailsTolNegative}
                      </td>
                      <td className="p-2 font-semibold">{passRateGarment}</td>
                      <td className="p-2 font-semibold">{passRatePoints}</td>
                      <td className="p-2 font-bold">{contribution}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Summary by Color Section --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-700">
            Summary by Color
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/60 text-xs uppercase">
                <tr>
                  <th rowSpan="2" className="p-2 text-left">
                    Color
                  </th>
                  <th
                    colSpan="3"
                    className="p-2 text-center border-l border-r dark:border-gray-600"
                  >
                    Garment Details
                  </th>
                  <th
                    colSpan="5"
                    className="p-2 text-center border-r dark:border-gray-600"
                  >
                    Measurement Details
                  </th>
                  <th rowSpan="2" className="p-2 text-center">
                    Pass% (G)
                  </th>
                  <th rowSpan="2" className="p-2 text-center">
                    Pass% (P)
                  </th>
                </tr>
                <tr className="border-t dark:border-gray-600">
                  <th className="px-2 py-2 text-center tracking-wider border-l dark:border-gray-600">
                    Checked
                  </th>
                  <th className="px-2 py-2 text-center tracking-wider">OK</th>
                  <th className="px-2 py-2 text-center tracking-wider border-r dark:border-gray-600">
                    Reject
                  </th>
                  <th className="px-2 py-2 text-center tracking-wider">
                    Points
                  </th>
                  <th className="px-2 py-2 text-center tracking-wider">Pass</th>
                  <th className="px-2 py-2 text-center tracking-wider">
                    Issues
                  </th>
                  <th className="px-2 py-2 text-center tracking-wider">T+</th>
                  <th className="px-2 py-2 text-center tracking-wider border-r dark:border-gray-600">
                    T-
                  </th>
                </tr>
              </thead>
              <tbody>
                {summaryByColor.map((color) => {
                  const passRateGarment =
                    color.garmentDetailsCheckedQty > 0
                      ? (
                          (color.garmentDetailsOKGarment /
                            color.garmentDetailsCheckedQty) *
                          100
                        ).toFixed(2) + "%"
                      : "N/A";
                  const passRatePoints =
                    color.measurementDetailsPoints > 0
                      ? (
                          (color.measurementDetailsPass /
                            color.measurementDetailsPoints) *
                          100
                        ).toFixed(2) + "%"
                      : "N/A";
                  return (
                    <tr
                      key={color.color}
                      className="border-b last:border-b-0 dark:border-gray-700 text-center"
                    >
                      <td className="p-2 font-bold text-left">{color.color}</td>
                      <td className="p-2">{color.garmentDetailsCheckedQty}</td>
                      <td className="p-2 text-green-600 dark:text-green-400">
                        {color.garmentDetailsOKGarment}
                      </td>
                      <td className="p-2 text-red-600 dark:text-red-400">
                        {color.garmentDetailsRejected}
                      </td>
                      <td className="p-2">{color.measurementDetailsPoints}</td>
                      <td className="p-2 text-green-600 dark:text-green-400">
                        {color.measurementDetailsPass}
                      </td>
                      <td className="p-2 text-red-600 dark:text-red-400">
                        {color.measurementDetailsTotalIssues}
                      </td>
                      <td className="p-2 text-rose-500">
                        {color.measurementDetailsTolPositive}
                      </td>
                      <td className="p-2 text-red-500">
                        {color.measurementDetailsTolNegative}
                      </td>
                      <td className="p-2 font-semibold">{passRateGarment}</td>
                      <td className="p-2 font-semibold">{passRatePoints}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODIFIED: Detailed Breakdown by Color Section --- */}
        {detailsByColor &&
          detailsByColor.map((detail) => {
            // --- FIX #1: Safely access summaryCards and provide a default empty object ---
            const summary = detail.summaryCards || {};

            const passRateGarment =
              summary?.garmentDetailsCheckedQty > 0
                ? (summary.garmentDetailsOKGarment /
                    summary.garmentDetailsCheckedQty) *
                  100
                : null;
            const passRatePoints =
              summary?.measurementDetailsPoints > 0
                ? (summary.measurementDetailsPass /
                    summary.measurementDetailsPoints) *
                  100
                : null;
            return (
              <div
                key={detail.color}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              >
                <h2 className="text-xl font-bold mb-4 text-center">
                  Color: {detail.color}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  {/* --- FIX #2: Use optional chaining (?.) for all summary properties --- */}
                  <SummaryCard
                    icon={<ClipboardList />}
                    title="Checked Garments"
                    value={summary?.garmentDetailsCheckedQty || 0}
                    colorClass="text-blue-600 dark:text-blue-400"
                    iconBgClass="bg-blue-100 dark:bg-blue-900/50"
                  />
                  <SummaryCard
                    icon={<CheckCircle2 />}
                    title="OK Garments"
                    value={summary?.garmentDetailsOKGarment || 0}
                    colorClass="text-green-600 dark:text-green-400"
                    iconBgClass="bg-green-100 dark:bg-green-900/50"
                  />
                  <SummaryCard
                    icon={<Target />}
                    title="Total Points"
                    value={summary?.measurementDetailsPoints || 0}
                    colorClass="text-purple-600 dark:text-purple-400"
                    iconBgClass="bg-purple-100 dark:bg-purple-900/50"
                  />
                  <SummaryCard
                    icon={<Check />}
                    title="Pass Points"
                    value={summary?.measurementDetailsPass || 0}
                    colorClass="text-teal-600 dark:text-teal-400"
                    iconBgClass="bg-teal-100 dark:bg-teal-900/50"
                  />
                  <SummaryCard
                    icon={<TrendingUp />}
                    title="Pass % (Garment)"
                    value={
                      passRateGarment !== null
                        ? `${passRateGarment.toFixed(2)}%`
                        : "N/A"
                    }
                    colorClass={
                      passRateGarment !== null && passRateGarment >= 90
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }
                    iconBgClass={
                      passRateGarment !== null && passRateGarment >= 90
                        ? "bg-green-100 dark:bg-green-900/50"
                        : "bg-red-100 dark:bg-red-900/50"
                    }
                  />
                  <SummaryCard
                    icon={<Percent />}
                    title="Pass % (Points)"
                    value={
                      passRatePoints !== null
                        ? `${passRatePoints.toFixed(2)}%`
                        : "N/A"
                    }
                    colorClass={
                      passRatePoints !== null && passRatePoints >= 90
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }
                    iconBgClass={
                      passRatePoints !== null && passRatePoints >= 90
                        ? "bg-green-100 dark:bg-green-900/50"
                        : "bg-red-100 dark:bg-red-900/50"
                    }
                  />
                </div>

                {/* --- FIX #3: Check if summaryBySize exists before rendering its table --- */}
                {detail.summaryBySize && detail.summaryBySize.length > 0 && (
                  <div className="overflow-x-auto mb-8">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/60 text-xs uppercase">
                        <tr>
                          <th rowSpan="2" className="p-2 text-left">
                            Size
                          </th>
                          <th
                            colSpan="3"
                            className="p-2 text-center border-l border-r dark:border-gray-600"
                          >
                            Garment Details
                          </th>
                          <th
                            colSpan="5"
                            className="p-2 text-center border-r dark:border-gray-600"
                          >
                            Measurement Details
                          </th>
                          <th rowSpan="2" className="p-2 text-center">
                            Pass% (G)
                          </th>
                          <th rowSpan="2" className="p-2 text-center">
                            Pass% (P)
                          </th>
                        </tr>
                        <tr className="border-t dark:border-gray-600">
                          <th className="px-2 py-2 text-center tracking-wider border-l dark:border-gray-600">
                            Checked
                          </th>
                          <th className="px-2 py-2 text-center tracking-wider">
                            OK
                          </th>
                          <th className="px-2 py-2 text-center tracking-wider border-r dark:border-gray-600">
                            Reject
                          </th>
                          <th className="px-2 py-2 text-center tracking-wider">
                            Points
                          </th>
                          <th className="px-2 py-2 text-center tracking-wider">
                            Pass
                          </th>
                          <th className="px-2 py-2 text-center tracking-wider">
                            Issues
                          </th>
                          <th className="px-2 py-2 text-center tracking-wider">
                            T+
                          </th>
                          <th className="px-2 py-2 text-center tracking-wider border-r dark:border-gray-600">
                            T-
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.summaryBySize.map((sizeSummary) => {
                          // --- FIX #4: Safely access nested sizeSummary object ---
                          const s = sizeSummary.sizeSummary || {};
                          const passG =
                            s.garmentDetailsCheckedQty > 0
                              ? (
                                  (s.garmentDetailsOKGarment /
                                    s.garmentDetailsCheckedQty) *
                                  100
                                ).toFixed(2) + "%"
                              : "N/A";
                          const passP =
                            s.measurementDetailsPoints > 0
                              ? (
                                  (s.measurementDetailsPass /
                                    s.measurementDetailsPoints) *
                                  100
                                ).toFixed(2) + "%"
                              : "N/A";
                          return (
                            <tr
                              key={sizeSummary.size}
                              className="border-b last:border-b-0 dark:border-gray-700 text-center"
                            >
                              <td className="p-2 font-bold text-left">
                                {sizeSummary.size}
                              </td>
                              <td className="p-2">
                                {s.garmentDetailsCheckedQty || 0}
                              </td>
                              <td className="p-2 text-green-600 dark:text-green-400">
                                {s.garmentDetailsOKGarment || 0}
                              </td>
                              <td className="p-2 text-red-600 dark:text-red-400">
                                {s.garmentDetailsRejected || 0}
                              </td>
                              <td className="p-2">
                                {s.measurementDetailsPoints || 0}
                              </td>
                              <td className="p-2 text-green-600 dark:text-green-400">
                                {s.measurementDetailsPass || 0}
                              </td>
                              <td className="p-2 text-red-600 dark:text-red-400">
                                {s.measurementDetailsTotalIssues || 0}
                              </td>
                              <td className="p-2 text-rose-500">
                                {s.measurementDetailsTolPositive || 0}
                              </td>
                              <td className="p-2 text-red-500">
                                {s.measurementDetailsTolNegative || 0}
                              </td>
                              <td className="p-2 font-semibold">{passG}</td>
                              <td className="p-2 font-semibold">{passP}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* --- FIX #5: Check if tallyBySize exists before rendering its section --- */}
                {detail.tallyBySize && detail.tallyBySize.length > 0 && (
                  <>
                    <hr className="my-8 border-dashed dark:border-gray-600" />
                    {detail.tallyBySize.map((sizeTally) => (
                      <div key={sizeTally.size} className="mt-8">
                        <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                          Size: {sizeTally.size} - Measurement Data
                        </h3>
                        <TallyTable tallyData={sizeTally} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ANFStyleViewFullReport;
