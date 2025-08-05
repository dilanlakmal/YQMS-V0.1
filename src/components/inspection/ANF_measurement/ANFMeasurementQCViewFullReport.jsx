import React, { useState, useEffect, useMemo, Fragment } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { format } from "date-fns";
import {
  Loader2,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Target,
  Check,
  TrendingUp,
  Percent
} from "lucide-react";

// --- Reusable Helper & Child Components ---

const fractionToDecimal = (fraction) => {
  if (!fraction || fraction === "0") return 0;
  const sign = fraction.startsWith("-") ? -1 : 1;
  const parts = fraction.replace(/[-+]/, "").split("/");
  return parts.length === 2
    ? sign * (parseInt(parts[0], 10) / parseInt(parts[1], 10))
    : NaN;
};

const SummaryCard = ({
  icon,
  title,
  value,
  colorClass,
  iconBgClass,
  cardBgClass = "bg-gray-100 dark:bg-gray-700/50"
}) => (
  <div className={`p-4 rounded-xl shadow-inner ${cardBgClass}`}>
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

const SizeTallyTable = ({ sizeDetail, dynamicColumns }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-xs border-collapse">
      <thead className="bg-gray-100 dark:bg-gray-700">
        <tr /* ... header row ... */></tr>
      </thead>
      <tbody>
        {sizeDetail.buyerSpecData.map((spec) => {
          const tolMinus = fractionToDecimal(spec.tolNeg_fraction);
          const tolPlus = fractionToDecimal(spec.tolPos_fraction);
          return (
            <tr
              key={spec.no}
              className="dark:odd:bg-gray-800 dark:even:bg-gray-800/50"
            >
              {/* ... table cells for spec data ... */}
              {dynamicColumns.map((col) => {
                const count = sizeDetail.measurementsTally[spec.no]?.[col] || 0;
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

const GarmentDataTable = ({ sizeDetail }) => {
  const GARMENTS_PER_TABLE = 15;
  const garmentChunks = useMemo(() => {
    const chunks = [];
    for (
      let i = 0;
      i < sizeDetail.sizeMeasurementData.length;
      i += GARMENTS_PER_TABLE
    ) {
      chunks.push(
        sizeDetail.sizeMeasurementData.slice(i, i + GARMENTS_PER_TABLE)
      );
    }
    return chunks;
  }, [sizeDetail.sizeMeasurementData]);

  return (
    <div className="space-y-6">
      {/* Buyer Spec Table for this size */}
      <div>
        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Buyer Specifications
        </h5>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="p-2 border dark:border-gray-600 text-center">
                  No
                </th>
                <th className="p-2 border dark:border-gray-600 text-left w-56">
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
              </tr>
            </thead>
            <tbody>
              {sizeDetail.buyerSpecData.map((spec) => (
                <tr
                  key={spec.no}
                  className="dark:odd:bg-gray-800 dark:even:bg-gray-800/50"
                >
                  <td className="p-2 border dark:border-gray-600 text-center font-semibold">
                    {spec.no}
                  </td>
                  <td className="p-2 border dark:border-gray-600">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Garment Measurement Tables */}
      {garmentChunks.map((chunk, chunkIndex) => (
        <div key={chunkIndex} className="overflow-x-auto">
          <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Garments {chunkIndex * GARMENTS_PER_TABLE + 1} -{" "}
            {chunkIndex * GARMENTS_PER_TABLE + chunk.length}
          </h5>
          <table className="min-w-full text-xs border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="p-2 border dark:border-gray-600 text-center">
                  No
                </th>
                {chunk.map((garment) => (
                  <th
                    key={garment.garmentNo}
                    className="p-2 border dark:border-gray-600"
                  >
                    G{garment.garmentNo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizeDetail.buyerSpecData.map((spec) => {
                const tolMinus = spec.tolNeg_decimal;
                const tolPlus = spec.tolPos_decimal;
                return (
                  <tr
                    key={spec.no}
                    className="dark:odd:bg-gray-800 dark:even:bg-gray-800/50"
                  >
                    <td className="p-2 border dark:border-gray-600 text-center font-semibold">
                      {spec.no}
                    </td>
                    {chunk.map((garment) => {
                      const measurement = garment.measurements.find(
                        (m) => m.orderNo === spec.no
                      );
                      const deviation = measurement?.decimalValue || 0;
                      const isInTolerance =
                        deviation >= tolMinus && deviation <= tolPlus;
                      const cellBg = measurement
                        ? isInTolerance
                          ? "bg-green-100 dark:bg-green-900/40"
                          : "bg-red-100 dark:bg-red-900/40"
                        : "";
                      return (
                        <td
                          key={garment.garmentNo}
                          className={`p-2 border dark:border-gray-600 text-center font-bold ${cellBg}`}
                        >
                          {measurement?.fractionValue || "0"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const ANFMeasurementQCViewFullReport = () => {
  const { pageId } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!pageId) {
        setError("Report ID is missing.");
        setIsLoading(false);
        return;
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/anf-measurement/qc-daily-report/detail/${pageId}`
        );
        setReport(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load the report.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [pageId]);

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
  if (!report)
    return <div className="text-center p-8">No report data available.</div>;

  const summary = report.overallMeasurementSummary;
  const passRateGarment =
    summary?.garmentDetailsCheckedQty > 0
      ? (summary.garmentDetailsOKGarment / summary.garmentDetailsCheckedQty) *
        100
      : null;
  const passRatePoints =
    summary?.measurementDetailsPoints > 0
      ? (summary.measurementDetailsPass / summary.measurementDetailsPoints) *
        100
      : null;
  const garmentRateBg =
    passRateGarment !== null
      ? passRateGarment >= 90
        ? "bg-green-50 dark:bg-green-900/30"
        : "bg-red-50 dark:bg-red-900/30"
      : "bg-gray-100 dark:bg-gray-700/50";
  const pointsRateBg =
    passRatePoints !== null
      ? passRatePoints >= 90
        ? "bg-green-50 dark:bg-green-900/30"
        : "bg-red-50 dark:bg-red-900/30"
      : "bg-gray-100 dark:bg-gray-700/50";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-center">QC Daily Full Report</h1>

        {/* --- Section 1 & 2: Main Info and Summary --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Details */}
            <div>
              <h2 className="text-lg font-bold mb-3 border-b pb-2 dark:border-gray-700">
                Order Details
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-1.5 pr-3 font-semibold text-gray-500 dark:text-gray-400">
                      Inspection Date:
                    </td>
                    <td className="font-bold">
                      {format(new Date(report.inspectionDate), "yyyy-MM-dd")}
                    </td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-1.5 pr-3 font-semibold text-gray-500 dark:text-gray-400">
                      MO No:
                    </td>
                    <td>{report.moNo}</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-1.5 pr-3 font-semibold text-gray-500 dark:text-gray-400">
                      QC ID:
                    </td>
                    <td>{report.qcID}</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-1.5 pr-3 font-semibold text-gray-500 dark:text-gray-400">
                      Color(s):
                    </td>
                    <td>{report.color.join(", ")}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-3 font-semibold text-gray-500 dark:text-gray-400">
                      Order Qty:
                    </td>
                    <td>{report.orderDetails.orderQty_style}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Results Summary Cards */}
            <div>
              <h2 className="text-lg font-bold mb-3 border-b pb-2 dark:border-gray-700">
                Results Summary
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {/* ... SummaryCard components ... */}
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
                  cardBgClass={garmentRateBg}
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
                  cardBgClass={pointsRateBg}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- Section 4: Measurement Data by Garment (per size) --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-4 border-b pb-2 dark:border-gray-700">
            Measurement Data by Garment
          </h2>
          <div className="space-y-10">
            {report.measurementDetails.map((sizeDetail, index) => (
              <div key={index}>
                <h3 className="text-base font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                  Size: {sizeDetail.size}
                </h3>
                <GarmentDataTable sizeDetail={sizeDetail} />
                {index < report.measurementDetails.length - 1 && (
                  <hr className="mt-10 border-dashed dark:border-gray-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ANFMeasurementQCViewFullReport;
