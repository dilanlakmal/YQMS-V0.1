import { PDFDownloadLink } from "@react-pdf/renderer";
import axios from "axios";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardList,
  Download,
  Loader2,
  Percent,
  Target,
  TrendingUp
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../../../config";
import ANFStyleViewFullReportPDF from "./ANFStyleViewFullReportPDF";

// A small loader component for the PDF button
const PDFLoader = () => (
  <div className="flex items-center space-x-2 text-sm">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>Preparing PDF...</span>
  </div>
);

// --- Helper & Sub-components (unchanged) ---

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
                      {/* Note: The '0' column value is modified by the processor before being passed here */}
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

const InfoBlock = ({ label, value, isHighlighted = false }) => (
  <div>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p
      className={`font-semibold ${
        isHighlighted
          ? "text-lg text-indigo-500 dark:text-indigo-400"
          : "text-gray-800 dark:text-gray-200"
      }`}
    >
      {value}
    </p>
  </div>
);

// --- MAIN PAGE COMPONENT ---
const ANFBuyerStyleViewFullReport = () => {
  const { moNo } = useParams();
  const [searchParams] = useSearchParams();
  const stageValue = searchParams.get("stage") || "M1";

  const [originalReportData, setOriginalReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ------------------------------------------------------------------
     Update Fetch Logic with Dynamic Prefix
  ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchReport = async () => {
      if (!moNo) {
        setError("MO Number is missing.");
        setIsLoading(false);
        return;
      }

      const apiPrefix =
        stageValue === "M2"
          ? `${API_BASE_URL}/api/anf-measurement-packing`
          : `${API_BASE_URL}/api/anf-measurement`;

      try {
        // Use dynamic prefix
        const res = await axios.get(
          `${apiPrefix}/style-view-full-report/${moNo}`
        );
        setOriginalReportData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load the report.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [moNo, stageValue]);

  // --- This large memo processes the original data into the buyer's view ---
  const buyerReportData = useMemo(() => {
    if (!originalReportData) return null;

    const processed = JSON.parse(JSON.stringify(originalReportData));
    const { orderDetails, inspectorData, summaryByColor, detailsByColor } =
      processed;
    const { orderQty_style = 0, orderColors = [] } = orderDetails;

    // Create maps for easy lookup of order quantities
    const colorOrderQtyMap = new Map();
    const sizeOrderQtyMap = new Map();
    orderColors.forEach((color) => {
      let totalColorQty = 0;
      const currentSizeMap = new Map();
      color.OrderQty.forEach((sizeObj) => {
        const sizeName = Object.keys(sizeObj)[0].split(";")[0];
        const qty = Object.values(sizeObj)[0];
        totalColorQty += qty;
        currentSizeMap.set(sizeName, qty);
      });
      colorOrderQtyMap.set(color.Color, totalColorQty);
      sizeOrderQtyMap.set(color.Color, currentSizeMap);
    });

    // 1. Process Inspector Data
    if (inspectorData) {
      inspectorData.forEach((qc) => {
        const originalChecked = qc.garmentDetailsCheckedQty || 0;
        const originalPoints = qc.measurementDetailsPoints || 0;

        qc.garmentDetailsCheckedQty = orderQty_style;
        qc.garmentDetailsOKGarment =
          orderQty_style - (qc.garmentDetailsRejected || 0);

        const newPoints =
          originalChecked > 0
            ? Math.round((originalPoints / originalChecked) * orderQty_style)
            : 0;
        qc.measurementDetailsPoints = newPoints;
        qc.measurementDetailsPass =
          newPoints - (qc.measurementDetailsTotalIssues || 0);
      });
    }

    // 2. Process Summary by Color
    if (summaryByColor) {
      summaryByColor.forEach((colorSummary) => {
        const orderQtyForColor = colorOrderQtyMap.get(colorSummary.color) || 0;
        const originalChecked = colorSummary.garmentDetailsCheckedQty || 0;
        const originalPoints = colorSummary.measurementDetailsPoints || 0;

        colorSummary.garmentDetailsCheckedQty = orderQtyForColor;
        colorSummary.garmentDetailsOKGarment =
          orderQtyForColor - (colorSummary.garmentDetailsRejected || 0);

        const newPoints =
          originalChecked > 0
            ? Math.round((originalPoints / originalChecked) * orderQtyForColor)
            : 0;
        colorSummary.measurementDetailsPoints = newPoints;
        colorSummary.measurementDetailsPass =
          newPoints - (colorSummary.measurementDetailsTotalIssues || 0);
      });
    }

    // 3. Process Detailed Breakdown by Color
    if (detailsByColor) {
      detailsByColor.forEach((detail, index) => {
        const originalDetail = originalReportData.detailsByColor[index];
        const color = detail.color;
        const orderQtyForColor = colorOrderQtyMap.get(color) || 0;

        // 3a. Process Summary Cards
        if (detail.summaryCards) {
          const originalChecked =
            originalDetail.summaryCards.garmentDetailsCheckedQty || 0;
          const originalPoints =
            originalDetail.summaryCards.measurementDetailsPoints || 0;

          detail.summaryCards.garmentDetailsCheckedQty = orderQtyForColor;
          detail.summaryCards.garmentDetailsOKGarment =
            orderQtyForColor -
            (detail.summaryCards.garmentDetailsRejected || 0);

          const newPoints =
            originalChecked > 0
              ? Math.round(
                  (originalPoints / originalChecked) * orderQtyForColor
                )
              : 0;
          detail.summaryCards.measurementDetailsPoints = newPoints;
          detail.summaryCards.measurementDetailsPass =
            newPoints -
            (detail.summaryCards.measurementDetailsTotalIssues || 0);
        }

        // 3b. Process Summary By Size table
        if (detail.summaryBySize) {
          detail.summaryBySize.forEach((sizeSummaryItem, sizeIndex) => {
            const originalSizeSummary =
              originalDetail.summaryBySize[sizeIndex].sizeSummary;
            const size = sizeSummaryItem.size;
            const orderQtyForSize = sizeOrderQtyMap.get(color)?.get(size) || 0;

            const originalChecked =
              originalSizeSummary.garmentDetailsCheckedQty || 0;
            const originalPoints =
              originalSizeSummary.measurementDetailsPoints || 0;

            const s = sizeSummaryItem.sizeSummary;
            s.garmentDetailsCheckedQty = orderQtyForSize;
            s.garmentDetailsOKGarment =
              orderQtyForSize - (s.garmentDetailsRejected || 0);

            const newPoints =
              originalChecked > 0
                ? Math.round(
                    (originalPoints / originalChecked) * orderQtyForSize
                  )
                : 0;
            s.measurementDetailsPoints = newPoints;
            s.measurementDetailsPass =
              newPoints - (s.measurementDetailsTotalIssues || 0);
          });
        }

        // 3c. Process Tally By Size (for the '0' column)
        if (detail.tallyBySize) {
          detail.tallyBySize.forEach((sizeTallyItem) => {
            const size = sizeTallyItem.size;
            const originalSizeSummary = originalDetail.summaryBySize.find(
              (s) => s.size === size
            )?.sizeSummary;
            if (originalSizeSummary) {
              const originalPoints =
                originalSizeSummary.measurementDetailsPoints || 0;
              const originalChecked =
                originalSizeSummary.garmentDetailsCheckedQty || 0;

              if (originalChecked > 0) {
                const ratio = originalPoints / originalChecked;
                Object.values(sizeTallyItem.measurementsTally).forEach(
                  (pointTally) => {
                    if (pointTally["0"]) {
                      pointTally["0"] = Math.round(pointTally["0"] * ratio);
                    }
                  }
                );
              }
            }
          });
        }
      });
    }

    return processed;
  }, [originalReportData]);

  // --- This memo is still needed to create the Maps for efficient lookups in the JSX ---
  const processedDataForRender = useMemo(() => {
    if (!buyerReportData) return null;

    const detailsByColorProcessed = buyerReportData.detailsByColor
      ? buyerReportData.detailsByColor.map((detail) => ({
          ...detail,
          summaryBySizeMap: new Map(
            detail.summaryBySize.map((item) => [item.size, item])
          ),
          tallyBySizeMap: new Map(
            detail.tallyBySize.map((item) => [item.size, item])
          )
        }))
      : [];

    return {
      ...buyerReportData,
      detailsByColorProcessed
    };
  }, [buyerReportData]);

  const allSizes = useMemo(() => {
    if (
      !originalReportData?.orderDetails?.orderColors ||
      originalReportData.orderDetails.orderColors.length === 0
    ) {
      return [];
    }
    const firstColorOrderQty =
      originalReportData.orderDetails.orderColors[0].OrderQty;
    return firstColorOrderQty.map(
      (sizeObj) => Object.keys(sizeObj)[0].split(";")[0]
    );
  }, [originalReportData]);

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
  if (!processedDataForRender)
    return <div className="text-center p-8">No report data available.</div>;

  const {
    orderDetails,
    inspectorData,
    summaryByColor,
    detailsByColorProcessed
  } = processedDataForRender;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-center">
            Buyer Style Full Report
          </h1>
          {processedDataForRender && (
            <PDFDownloadLink
              document={
                <ANFStyleViewFullReportPDF
                  reportData={processedDataForRender}
                  allSizes={allSizes}
                  detailsByColorProcessed={detailsByColorProcessed}
                />
              }
              fileName={`${orderDetails?.moNo ?? "BuyerStyleReport"}.pdf`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {({ loading }) =>
                loading ? (
                  <PDFLoader />
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF
                  </>
                )
              }
            </PDFDownloadLink>
          )}
        </div>

        {/* --- Order Details Section (Unchanged) --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Order Details</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 xl:grid-cols-7 gap-x-6 gap-y-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <InfoBlock label="MO No:" value={orderDetails.moNo} isHighlighted />
            <InfoBlock label="Buyer:" value={orderDetails.buyer} />
            <InfoBlock label="Cust. Style:" value={orderDetails.custStyle} />
            <InfoBlock
              label="Order Qty:"
              value={orderDetails.orderQty_style}
              isHighlighted
            />
            <InfoBlock label="Mode:" value={orderDetails.mode} />
            <InfoBlock label="Country:" value={orderDetails.country} />
            <InfoBlock label="Origin:" value={orderDetails.origin} />
          </div>
          <div className="overflow-x-auto bg-gray-100 dark:bg-blue-900 p-4 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  <th className="p-3 text-left font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs w-1/3">
                    Color
                  </th>
                  {allSizes.map((size) => (
                    <th
                      key={size}
                      className="p-3 text-center font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs"
                    >
                      {size}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderDetails.orderColors.map((color) => {
                  const sizeMap = new Map(
                    color.OrderQty.map((q) => [
                      Object.keys(q)[0].split(";")[0],
                      Object.values(q)[0]
                    ])
                  );
                  return (
                    <tr
                      key={color.Color}
                      className="border-b last:border-b-0 bg-gray-300 border-gray-200 dark:bg-blue-800 dark:border-blue-700"
                    >
                      <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">
                        {color.Color}
                      </td>
                      {allSizes.map((size) => (
                        <td
                          key={size}
                          className="p-3 text-center font-semibold text-gray-600 dark:text-gray-300"
                        >
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

        {/* --- Inspector Data Section (Renders modified data) --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-700">
            Inspector Data
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* ... table headers ... */}
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
                {inspectorData.map((qc, index) => {
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
                  // Contribution must be based on original data to be meaningful
                  const originalCheckedQty =
                    originalReportData.inspectorData[index]
                      .garmentDetailsCheckedQty;
                  const contribution =
                    orderDetails.orderQty_style > 0
                      ? (
                          (originalCheckedQty / orderDetails.orderQty_style) *
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

        {/* --- Summary by Color Section (Renders modified data) --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-700">
            Summary by Color
          </h2>
          <div className="overflow-x-auto">
            {/* ... table headers ... */}
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

        {/* --- Detailed Breakdown by Color Section (Renders modified data) --- */}

        {detailsByColorProcessed &&
          detailsByColorProcessed.map((detail) => {
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

            const inspectedSizesForColor = allSizes.filter((size) => {
              const sizeData = detail.summaryBySizeMap.get(size);
              return (
                sizeData &&
                originalReportData.detailsByColor // Check against original data to see if it was inspected
                  .find((d) => d.color === detail.color)
                  .summaryBySize.find((s) => s.size === size)?.sizeSummary
                  ?.garmentDetailsCheckedQty > 0
              );
            });

            return (
              <div
                key={detail.color}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              >
                <h2 className="text-xl font-bold mb-4 text-center">
                  Color: {detail.color}
                </h2>
                {/* --- Cards with modified data --- */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
                    colorClass="text-green-700 dark:text-green-300"
                    iconBgClass="bg-green-100 dark:bg-green-900/50"
                  />
                  <SummaryCard
                    icon={<Percent />}
                    title="Pass % (Points)"
                    value={
                      passRatePoints !== null
                        ? `${passRatePoints.toFixed(2)}%`
                        : "N/A"
                    }
                    colorClass="text-green-700 dark:text-green-300"
                    iconBgClass="bg-green-100 dark:bg-green-900/50"
                  />
                </div>

                {/* --- Summary by Size table with modified data --- */}
                {inspectedSizesForColor.length > 0 && (
                  <div className="overflow-x-auto mb-8">
                    {/* ... table headers ... */}
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
                        {inspectedSizesForColor.map((size) => {
                          const sizeSummaryData =
                            detail.summaryBySizeMap.get(size);
                          const s = sizeSummaryData
                            ? sizeSummaryData.sizeSummary
                            : {};
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
                              key={size}
                              className="border-b last:border-b-0 dark:border-gray-700 text-center"
                            >
                              <td className="p-2 font-bold text-left">
                                {size}
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

                {/* --- Tally tables --- */}
                {detail.tallyBySizeMap.size > 0 && (
                  <>
                    <hr className="my-8 border-dashed dark:border-gray-600" />
                    {inspectedSizesForColor.map((size) => {
                      const sizeTally = detail.tallyBySizeMap.get(size);
                      if (!sizeTally) return null;

                      return (
                        <div key={sizeTally.size} className="mt-8">
                          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                            Size: {sizeTally.size} - Measurement Data
                          </h3>
                          <TallyTable tallyData={sizeTally} />
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ANFBuyerStyleViewFullReport;
