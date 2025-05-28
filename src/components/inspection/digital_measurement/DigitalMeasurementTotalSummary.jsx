import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FaCalculator,
  FaCheckCircle,
  FaTimesCircle,
  FaPercentage,
  FaFlag
} from "react-icons/fa";
import jStat from "jstat";

const DistributionCurveComponent = ({
  actualValues,
  totalCount,
  buyerSpec,
  tolMinus,
  tolPlus,
  mean,
  cpk
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!actualValues.length || totalCount === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust canvas size based on number of data points
    const isSmallData = actualValues.length <= 2;
    const canvasWidth = isSmallData ? 150 : 200;
    const canvasHeight = isSmallData ? 90 : 120;

    // Set canvas resolution to prevent blurriness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Compute standard deviation
    const variance =
      actualValues.length > 0
        ? actualValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          actualValues.length
        : 0;
    const stdDev = Math.sqrt(variance);

    // Skip if stdDev is 0 or invalid
    if (stdDev === 0 || isNaN(stdDev)) return;

    // Define x-axis range (mean ± 3*stdDev)
    const xMin = mean - 3 * stdDev;
    const xMax = mean + 3 * stdDev;
    const xRange = xMax - xMin;

    // Compute PDF (normal or t-distribution)
    const isNormal = totalCount > 30;
    const df = totalCount - 1; // Degrees of freedom for t-distribution
    const points = [];
    const step = xRange / 100;
    let maxY = 0;

    for (let x = xMin; x <= xMax; x += step) {
      let y;
      if (isNormal) {
        // Normal distribution PDF
        y = jStat.normal.pdf(x, mean, stdDev);
      } else {
        // t-distribution PDF (standardized)
        const t = (x - mean) / stdDev;
        y = jStat.studentt.pdf(t, df) / stdDev;
      }
      points.push({ x, y });
      maxY = Math.max(maxY, y);
    }

    // Scale points to canvas (reserve space for labels and X-axis)
    const scaleX = canvasWidth / xRange;
    const scaleY = ((canvasHeight - 20) / maxY) * 0.8; // 20px for labels, 20% margin

    // Draw curve
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    points.forEach((point, i) => {
      const canvasX = (point.x - xMin) * scaleX;
      const canvasY = canvasHeight - 20 - point.y * scaleY; // Offset for X-axis
      if (i === 0) {
        ctx.moveTo(canvasX, canvasY);
      } else {
        ctx.lineTo(canvasX, canvasY);
      }
    });
    ctx.stroke();

    // Draw X-axis
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.moveTo(0, canvasHeight - 15);
    ctx.lineTo(canvasWidth, canvasHeight - 15);
    ctx.stroke();

    // Draw vertical grid lines and labels
    const drawLine = (value, color, label, dashed = false) => {
      if (isNaN(value) || value < xMin || value > xMax) return;
      const canvasX = ((value - xMin) / xRange) * canvasWidth;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      if (dashed) {
        ctx.setLineDash([5, 5]);
      }
      ctx.moveTo(canvasX, 0);
      ctx.lineTo(canvasX, canvasHeight - 15);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw label with smaller font
      ctx.font = "8px Arial";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(label, canvasX, canvasHeight - 5);
    };

    drawLine(buyerSpec + tolMinus, "red", "LL", true); // Lower Limit
    drawLine(buyerSpec, "black", "S"); // Buyer Spec
    drawLine(buyerSpec + tolPlus, "red", "UL", true); // Upper Limit
    drawLine(mean, "green", "M"); // Mean
  }, [actualValues, totalCount, buyerSpec, tolMinus, tolPlus, mean]);

  // Determine Cpk background color
  const cpkBgColor =
    cpk === null
      ? "bg-gray-100"
      : cpk === Infinity
      ? "bg-blue-100"
      : cpk >= 1.33
      ? "bg-green-300"
      : cpk >= 1.0
      ? "bg-green-100"
      : cpk >= 0.5
      ? "bg-yellow-100"
      : "bg-red-100";

  return actualValues.length && totalCount > 0 ? (
    <div className="relative flex flex-col items-center">
      <div className="absolute top-0 right-0 h-8 w-24 bg-gray-50 flex items-center justify-center">
        <div
          className={`text-xs px-2 py-1 border border-gray-500 rounded ${cpkBgColor} flex items-center justify-center h-full`}
        >
          Cpk ={" "}
          {cpk === Infinity ? "Inf" : cpk !== null ? cpk.toFixed(2) : "N/A"}
        </div>
      </div>
      <div className="flex justify-center">
        <canvas ref={canvasRef} className="w-auto h-auto" />
      </div>

      <div className="text-xs mt-2 text-center flex flex-wrap justify-center gap-2">
        <span className="inline-flex items-center px-2 py-1 border border-red-500 text-red-500 rounded">
          LL = {(buyerSpec + tolMinus).toFixed(4)}
        </span>
        <span className="inline-flex items-center px-2 py-1 border border-black text-black rounded">
          S = {buyerSpec.toFixed(4)}
        </span>
        <span className="inline-flex items-center px-2 py-1 border border-red-500 text-red-500 rounded">
          UL = {(buyerSpec + tolPlus).toFixed(4)}
        </span>
        <span className="inline-flex items-center px-2 py-1 border border-green-500 text-green-500 rounded">
          M = {mean.toFixed(4)}
        </span>
      </div>
      <div className="w-full border-t border-dashed border-gray-400 my-1"></div>
    </div>
  ) : (
    <span>-</span>
  );
};
DistributionCurveComponent.displayName = "DistributionCurve"; // Explicitly set displayName
const DistributionCurve = React.memo(DistributionCurveComponent);

const DigitalMeasurementTotalSummary = ({
  summaryData,
  records,
  sizeSpec,
  decimalToFraction
}) => {
  const [maxTitleHeight, setMaxTitleHeight] = useState(0);
  const titleRefs = useRef([]);

  const computeMeasurementPointSummary = () => {
    const summary = [];

    sizeSpec.forEach((spec, index) => {
      const measurementPoint = spec.EnglishRemark;
      let totalCount = 0;
      let totalPass = 0;

      records.forEach((record) => {
        const size = record.size || "N/A";
        const actualValue = record.actual[index]?.value || 0;
        if (actualValue === 0) return;

        const buyerSpec =
          spec.Specs.find((s) => Object.keys(s)[0] === size)?.[size]?.decimal ||
          0;
        const tolMinus = spec.ToleranceMinus?.decimal ?? 0;
        const tolPlus = spec.TolerancePlus?.decimal ?? 0;

        totalCount++;
        const lower = buyerSpec + tolMinus;
        const upper = buyerSpec + tolPlus;
        if (actualValue >= lower && actualValue <= upper) {
          totalPass++;
        }
      });

      if (totalCount === 0) return;

      const totalFail = totalCount - totalPass;
      const passRate =
        totalCount > 0 ? ((totalPass / totalCount) * 100).toFixed(2) : "0.00";
      const status = parseFloat(passRate) > 98 ? "Pass" : "Fail";

      summary.push({
        measurementPoint,
        totalCount,
        totalPass,
        totalFail,
        passRate,
        status
      });
    });

    return summary.sort((a, b) => {
      if (a.status === "Fail" && b.status === "Pass") return -1;
      if (a.status === "Pass" && b.status === "Fail") return 1;
      return a.measurementPoint.localeCompare(b.measurementPoint);
    });
  };

  const computeSummaryBySize = () => {
    const summary = [];
    const sizePointCounts = {};

    const recordsBySize = {};
    records.forEach((record) => {
      const size = record.size || "N/A";
      if (!recordsBySize[size]) {
        recordsBySize[size] = [];
      }
      recordsBySize[size].push(record);
      sizePointCounts[size] = 0;
    });

    Object.keys(recordsBySize).forEach((size) => {
      sizeSpec.forEach((spec, index) => {
        const measurementPoint = spec.EnglishRemark;
        const tolMinus = spec.ToleranceMinus?.decimal ?? 0;
        const tolPlus = spec.TolerancePlus?.decimal ?? 0;
        const buyerSpec =
          spec.Specs.find((s) => Object.keys(s)[0] === size)?.[size]?.decimal ||
          0;

        let totalCount = 0;
        let totalPass = 0;
        const actualValues = [];

        recordsBySize[size].forEach((record) => {
          const actualValue = record.actual[index]?.value || 0;
          if (actualValue === 0) return;

          totalCount++;
          actualValues.push(actualValue);

          const lower = buyerSpec + tolMinus;
          const upper = buyerSpec + tolPlus;
          if (actualValue >= lower && actualValue <= upper) {
            totalPass++;
          }
        });

        if (totalCount === 0) return;

        sizePointCounts[size] += 1;

        const totalFail = totalCount - totalPass;
        const passRate =
          totalCount > 0 ? ((totalPass / totalCount) * 100).toFixed(2) : "0.00";

        const mean =
          actualValues.length > 0
            ? actualValues.reduce((sum, val) => sum + val, 0) /
              actualValues.length
            : 0;

        const variance =
          actualValues.length > 0
            ? actualValues.reduce(
                (sum, val) => sum + Math.pow(val - mean, 2),
                0
              ) / actualValues.length
            : 0;
        const stdDev = Math.sqrt(variance);

        const diff = buyerSpec - mean;
        const diffPercent =
          buyerSpec !== 0 ? ((buyerSpec - mean) / buyerSpec) * 100 : 0;

        // Calculate Cpk, Cp, and CV
        const LSL = buyerSpec + tolMinus; // Lower Specification Limit
        const USL = buyerSpec + tolPlus; // Upper Specification Limit
        let cpk = NaN;
        let cp = NaN;
        let cv = NaN;

        if (stdDev > 0) {
          // Cpk: Process Capability Index
          const cpkUpper = (USL - mean) / (3 * stdDev);
          const cpkLower = (mean - LSL) / (3 * stdDev);
          cpk = Math.min(cpkUpper, cpkLower);

          // Cp: Process Potential Index
          cp = (USL - LSL) / (6 * stdDev);

          // CV: Coefficient of Variation
          cv = (stdDev / mean) * 100;
        } else if (stdDev === 0 && totalCount === totalPass && totalCount > 0) {
          // If stdDev is 0 and all measurements pass, set Cpk to Infinity
          cpk = Infinity;
          cp = Infinity; // Cp is also undefined in this case, but set to Infinity for consistency
          cv = 0; // Coefficient of Variation is 0 when stdDev is 0
        }

        // Stability Status based on Cpk
        let stabilityStatus = "N/A";
        if (cpk === Infinity) {
          stabilityStatus = "Superior";
        } else if (!isNaN(cpk)) {
          if (cpk >= 1.33) stabilityStatus = "Excellent";
          else if (cpk >= 1.0) stabilityStatus = "Acceptable";
          else if (cpk >= 0.5) stabilityStatus = "Marginal";
          else if (cpk >= 0) stabilityStatus = "Poor";
          else stabilityStatus = "Out of Tolerance";
        }

        summary.push({
          size,
          measurementPoint,
          buyerSpec,
          tolMinus,
          tolPlus,
          totalCount,
          totalPass,
          totalFail,
          mean,
          stdDev,
          diff,
          diffPercent,
          passRate,
          cpk: isNaN(cpk) ? null : cpk,
          cp: isNaN(cp) ? null : cp,
          cv: isNaN(cv) ? null : cv,
          stabilityStatus
        });
      });
    });

    return {
      summary: summary.sort((a, b) => {
        if (a.size === b.size) {
          return a.measurementPoint.localeCompare(b.measurementPoint);
        }
        return a.size.localeCompare(b.size);
      }),
      sizePointCounts
    };
  };

  const computeDistributionTableData = useMemo(() => {
    // Get unique sizes
    const sizes = [
      ...new Set(records.map((record) => record.size || "N/A"))
    ].sort();

    // Filter measurement points with at least one non-zero value
    const measurementPoints = sizeSpec
      .filter((spec) => {
        return records.some((record) => {
          const index = sizeSpec.findIndex(
            (s) => s.EnglishRemark === spec.EnglishRemark
          );
          const actualValue = record.actual[index]?.value || 0;
          return actualValue !== 0;
        });
      })
      .map((spec) => spec.EnglishRemark);

    // Get Cpk values from sizeBasedSummary
    const { summary: sizeBasedSummary } = computeSummaryBySize();

    // Build matrix
    const matrix = measurementPoints.map((measurementPoint) => {
      const row = { measurementPoint, data: {} };
      sizes.forEach((size) => {
        const spec = sizeSpec.find((s) => s.EnglishRemark === measurementPoint);
        const buyerSpec =
          spec?.Specs.find((s) => Object.keys(s)[0] === size)?.[size]
            ?.decimal || 0;
        const tolMinus = spec?.ToleranceMinus?.decimal ?? 0;
        const tolPlus = spec?.TolerancePlus?.decimal ?? 0;

        let totalCount = 0;
        const actualValues = [];

        records.forEach((record) => {
          if (record.size !== size) return;
          const index = sizeSpec.findIndex(
            (s) => s.EnglishRemark === measurementPoint
          );
          const actualValue = record.actual[index]?.value || 0;
          if (actualValue === 0) return;

          totalCount++;
          actualValues.push(actualValue);
        });

        const mean =
          actualValues.length > 0
            ? actualValues.reduce((sum, val) => sum + val, 0) /
              actualValues.length
            : 0;

        // Find Cpk from sizeBasedSummary
        const summaryEntry = sizeBasedSummary.find(
          (entry) =>
            entry.measurementPoint === measurementPoint && entry.size === size
        );
        const cpk = summaryEntry ? summaryEntry.cpk : null;

        row.data[size] = {
          totalCount,
          actualValues,
          buyerSpec,
          tolMinus,
          tolPlus,
          mean,
          cpk
        };
      });
      return row;
    });

    return { measurementPoints, sizes, matrix };
  }, [records, sizeSpec]);

  const { summary: sizeBasedSummary, sizePointCounts } = computeSummaryBySize();
  const measurementPointSummary = computeMeasurementPointSummary();
  const { measurementPoints, sizes, matrix } = computeDistributionTableData;

  useEffect(() => {
    const heights = titleRefs.current.map((ref) =>
      ref ? ref.getBoundingClientRect().height : 0
    );
    const maxHeight = Math.max(...heights);
    setMaxTitleHeight(maxHeight);
  }, [measurementPointSummary]);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Overall Measurement Point Summary
      </h2>
      {measurementPointSummary.length > 0 ? (
        <div className="grid grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
          {measurementPointSummary.map((point, index) => {
            const isPass = parseFloat(point.passRate) > 98;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md flex flex-col h-full text-center"
              >
                <div
                  ref={(el) => (titleRefs.current[index] = el)}
                  className="bg-gray-100 p-2 rounded-t-lg"
                  style={{
                    minHeight: maxTitleHeight ? `${maxTitleHeight}px` : "auto"
                  }}
                >
                  <h3 className="text-md font-semibold">
                    {point.measurementPoint}
                  </h3>
                </div>
                <div className="p-2 text-sm flex-1">
                  <div className="flex items-center justify-center mb-1">
                    <FaCalculator className="mr-2 text-gray-600" />
                    <span>Total Count: {point.totalCount}</span>
                  </div>
                  <div className="flex items-center justify-center mb-1">
                    <FaCheckCircle className="mr-2 text-green-600" />
                    <span>Total Pass: {point.totalPass}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <FaTimesCircle className="mr-2 text-red-600" />
                    <span>Total Fail: {point.totalFail}</span>
                  </div>
                </div>
                <div
                  className={`p-2 ${isPass ? "bg-green-100" : "bg-red-100"}`}
                >
                  <div className="flex items-center justify-center">
                    <FaPercentage className="mr-2 text-gray-600" />
                    <span
                      className={`px-3 py-1 rounded-full border-2 ${
                        isPass
                          ? "bg-green-100 border-green-800 text-green-800"
                          : "bg-red-100 border-red-800 text-red-800"
                      }`}
                    >
                      Pass Rate: {point.passRate}%
                    </span>
                  </div>
                </div>
                <div
                  className={`p-2 ${
                    isPass ? "bg-green-100" : "bg-red-100"
                  } rounded-b-lg`}
                >
                  <div className="flex items-center justify-center">
                    <FaFlag
                      className={`mr-2 ${
                        isPass ? "text-green-600" : "text-red-600"
                      }`}
                    />
                    <span
                      className={
                        isPass
                          ? "text-green-800 font-bold"
                          : "text-red-800 font-bold"
                      }
                    >
                      Status: {point.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-500 mb-4">
          No measurement points available for cards
        </p>
      )}
      <div className="overflow-x-auto mb-6">
        <h2 className="text-sm font-semibold mb-2">Stability Analysis</h2>
        <div className="flex flex-wrap text-sm text-gray-600 mb-2 gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 mr-2"></div>
            <span>CPK = Inf: Superior</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-300 mr-2"></div>
            <span>CPK ≥ 1.33: Excellent</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 mr-2"></div>
            <span>CPK ≥ 1.0: Acceptable</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 mr-2"></div>
            <span>CPK ≥ 0.5: Marginal</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 mr-2"></div>
            <span>CPK below 0.5: Poor</span>
          </div>
        </div>

        <div className="w-full border-t border-dashed border-gray-400 mb-4"></div>
        <table className="w-full bg-white rounded border table-auto">
          <thead>
            <tr className="bg-gray-200 text-sm">
              <th className="p-2 border">Size</th>
              <th className="p-2 border">Measurement Point</th>
              <th className="p-2 border">Buyer Spec</th>
              <th className="p-2 border">Tol-</th>
              <th className="p-2 border">Tol+</th>
              <th className="p-2 border">Total Count</th>
              <th className="p-2 border">Total Pass</th>
              <th className="p-2 border">Total Fail</th>
              <th className="p-2 border">Mean</th>
              <th className="p-2 border">Std. Dev</th>
              <th className="p-2 border">Diff</th>
              <th className="p-2 border">Diff %</th>
              <th className="p-2 border">Pass Rate</th>
              {/* <th className="p-2 border">Cpk</th>
              <th className="p-2 border">Cp</th>
              <th className="p-2 border">CV (%)</th>
              <th className="p-2 border">Stability</th> */}
            </tr>
          </thead>
          <tbody>
            {sizeBasedSummary.length > 0 ? (
              sizeBasedSummary.map((point, index) => {
                const isFirstSizeRow =
                  index === 0 ||
                  point.size !== sizeBasedSummary[index - 1].size;
                const isDiffWithinTolerance =
                  point.diff >= point.tolMinus && point.diff <= point.tolPlus;
                const diffBgColor = isDiffWithinTolerance
                  ? "bg-green-100"
                  : "bg-red-100";
                const cpkBgColor =
                  point.cpk === null
                    ? "bg-gray-100"
                    : point.cpk === Infinity
                    ? "bg-blue-100"
                    : point.cpk >= 1.33
                    ? "bg-green-300"
                    : point.cpk >= 1.0
                    ? "bg-green-100"
                    : point.cpk >= 0.5
                    ? "bg-yellow-100"
                    : "bg-red-100";

                return (
                  <tr
                    key={index}
                    className={`text-center text-sm ${
                      isFirstSizeRow ? "border-t-4 border-gray-600" : ""
                    }`}
                  >
                    {isFirstSizeRow ? (
                      <td
                        className="p-2 border align-middle"
                        rowSpan={sizePointCounts[point.size] || 1}
                      >
                        {point.size}
                      </td>
                    ) : null}
                    <td className="p-2 border text-left">
                      {point.measurementPoint}
                    </td>
                    <td className="p-2 border">
                      {decimalToFraction(point.buyerSpec)}
                    </td>
                    <td className="p-2 border">
                      {decimalToFraction(point.tolMinus)}
                    </td>
                    <td className="p-2 border">
                      {decimalToFraction(point.tolPlus)}
                    </td>
                    <td className="p-2 border">{point.totalCount}</td>
                    <td className="p-2 border">{point.totalPass}</td>
                    <td className="p-2 border">{point.totalFail}</td>
                    <td className="p-2 border bg-gray-100">
                      {point.mean.toFixed(2)}
                    </td>
                    <td className="p-2 border bg-gray-100">
                      {point.stdDev.toFixed(2)}
                    </td>
                    <td className={`p-2 border ${diffBgColor} font-bold`}>
                      {point.diff.toFixed(4)}
                    </td>
                    <td className={`p-2 border ${diffBgColor} font-bold`}>
                      {point.diffPercent.toFixed(2)}%
                    </td>
                    <td
                      className={`p-2 border ${
                        parseFloat(point.passRate) > 98
                          ? "bg-green-100"
                          : "bg-red-100"
                      } font-bold`}
                    >
                      {point.passRate}%
                    </td>
                    {/* <td className={`p-2 border ${cpkBgColor}`}>
                      {point.cpk === Infinity
                        ? "Inf"
                        : point.cpk !== null
                        ? point.cpk.toFixed(2)
                        : "-"}
                    </td>
                    <td className="p-2 border">
                      {point.cpk === Infinity
                        ? "Inf"
                        : point.cp !== null
                        ? point.cp.toFixed(2)
                        : "-"}
                    </td>
                    <td className="p-2 border">
                      {point.cv !== null ? point.cv.toFixed(2) : "-"}
                    </td>
                    <td className={`p-2 border ${cpkBgColor}`}>
                      {point.stabilityStatus}
                    </td> */}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="13" className="p-4 text-center text-gray-500">
                  No measurement points available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* <div className="overflow-x-auto">
          <h2 className="text-sm font-semibold mb-2">Statistical Analysis</h2>
          <p className="text-sm text-gray-600 mb-2">
            LL = Lower Limit, S = Buyer Spec, UL = Upper Limit, M = Mean
          </p>
          <div className="w-full border-t border-dashed border-gray-400 mb-4"></div>
          <table className="w-full bg-white rounded border table-auto">
            <thead>
              <tr className="bg-gray-200 text-sm">
                <th className="p-2 border min-w-24 max-w-32 whitespace-normal break-words">
                  Measurement Point
                </th>
                {sizes.map((size) => (
                  <th key={size} className="p-2 border min-w-48">
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.length > 0 ? (
                matrix.map((row, rowIndex) => (
                  <tr key={rowIndex} className="text-sm">
                    <td className="p-2 border text-left min-w-24 max-w-32 whitespace-normal break-words">
                      {row.measurementPoint}
                    </td>
                    {sizes.map((size) => (
                      <td key={size} className="p-2 border min-w-48">
                        {row.data[size].totalCount > 0 ? (
                          <DistributionCurve
                            actualValues={row.data[size].actualValues}
                            totalCount={row.data[size].totalCount}
                            buyerSpec={row.data[size].buyerSpec}
                            tolMinus={row.data[size].tolMinus}
                            tolPlus={row.data[size].tolPlus}
                            mean={row.data[size].mean}
                            cpk={row.data[size].cpk}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={sizes.length + 1}
                    className="p-4 text-center text-gray-500"
                  >
                    No distribution data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div> */}
    </div>
  );
};

export default DigitalMeasurementTotalSummary;
