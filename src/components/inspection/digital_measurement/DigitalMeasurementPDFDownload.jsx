import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { FaFilePdf } from "react-icons/fa";
import MeasurementSummaryPDF from "./MeasurementSummaryPDF";
import MeasurementPointCardPDF from "./MeasurementPointCardPDF";
import StabilityAnalysisPDF from "./StabilityAnalysisPDF";
import StatisticalAnalysisPDF from "./StatisticalAnalysisPDF";
import InspectedSummaryPDF from "./InspectedSummaryPDF";

// Helper function to convert decimal to fraction
const decimalToFraction = (decimal) => {
  if (!decimal || isNaN(decimal)) return "";
  const sign = decimal < 0 ? "-" : "";
  const absDecimal = Math.abs(decimal);
  const fractionValue =
    absDecimal >= 1 ? absDecimal - Math.floor(absDecimal) : absDecimal;
  const whole = absDecimal >= 1 ? Math.floor(absDecimal) : 0;

  if (fractionValue === 0) return `${sign}${whole || 0}`;

  const fractions = [
    { value: 0.0625, fraction: { numerator: 1, denominator: 16 } },
    { value: 0.125, fraction: { numerator: 1, denominator: 8 } },
    { value: 0.1875, fraction: { numerator: 3, denominator: 16 } },
    { value: 0.25, fraction: { numerator: 1, denominator: 4 } },
    { value: 0.3125, fraction: { numerator: 5, denominator: 16 } },
    { value: 0.375, fraction: { numerator: 3, denominator: 8 } },
    { value: 0.4375, fraction: { numerator: 7, denominator: 16 } },
    { value: 0.5, fraction: { numerator: 1, denominator: 2 } },
    { value: 0.5625, fraction: { numerator: 9, denominator: 16 } },
    { value: 0.625, fraction: { numerator: 5, denominator: 8 } },
    { value: 0.6875, fraction: { numerator: 11, denominator: 16 } },
    { value: 0.75, fraction: { numerator: 3, denominator: 4 } },
    { value: 0.8125, fraction: { numerator: 13, denominator: 16 } },
    { value: 0.875, fraction: { numerator: 7, denominator: 8 } },
    { value: 0.9375, fraction: { numerator: 15, denominator: 16 } }
  ];

  const tolerance = 0.01;
  const closestFraction = fractions.find(
    (f) => Math.abs(fractionValue - f.value) < tolerance
  );

  if (closestFraction) {
    const { numerator, denominator } = closestFraction.fraction;
    return whole !== 0
      ? `${sign}${whole} ${numerator}/${denominator}`
      : `${sign}${numerator}/${denominator}`;
  }
  return `${sign}${fractionValue.toFixed(3)}`;
};

const DigitalMeasurementPDFDownload = ({ selectedMono, filters }) => {
  const [measurementSummary, setMeasurementSummary] = useState([]);
  const [measurementDetails, setMeasurementDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const fetchData = useCallback(async () => {
    if (!selectedMono) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const summaryParams = {
        page: 1,
        factory: filters.factory,
        startDate: filters.startDate ? filters.startDate.toISOString() : null,
        endDate: filters.endDate ? filters.endDate.toISOString() : null,
        mono: selectedMono,
        custStyle: filters.custStyle,
        buyer: filters.buyer,
        empId: filters.empId,
        stage: filters.stage
      };
      const summaryResponse = await axios.get(
        `${API_BASE_URL}/api/measurement-summary-per-mono`,
        { params: summaryParams, withCredentials: true }
      );
      setMeasurementSummary(summaryResponse.data.summaryPerMono || []);

      const detailsParams = {
        startDate: filters.startDate ? filters.startDate.toISOString() : null,
        endDate: filters.endDate ? filters.endDate.toISOString() : null,
        empId: filters.empId,
        stage: filters.stage
      };
      const detailsResponse = await axios.get(
        `${API_BASE_URL}/api/measurement-details/${selectedMono}`,
        { params: detailsParams, withCredentials: true }
      );
      setMeasurementDetails(
        detailsResponse.data || {
          records: [],
          measurementPointSummary: [],
          sizeSpec: []
        }
      );
    } catch (error) {
      console.error("Error fetching PDF data:", error);
      setMeasurementSummary([]);
      setMeasurementDetails({
        records: [],
        measurementPointSummary: [],
        sizeSpec: []
      });
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedMono,
    filters.factory,
    filters.startDate,
    filters.endDate,
    filters.custStyle,
    filters.buyer,
    filters.empId,
    filters.stage
  ]);

  const debouncedFetchData = useMemo(
    () => debounce(fetchData, 300),
    [fetchData]
  );

  useEffect(() => {
    debouncedFetchData();
    return () => {
      // Cleanup
    };
  }, [debouncedFetchData]);

  const measurementPointSummary = useMemo(() => {
    const summary = [];

    if (!measurementDetails || !measurementDetails.sizeSpec) return summary;

    measurementDetails.sizeSpec.forEach((spec, index) => {
      const measurementPoint = spec.EnglishRemark;
      let totalCount = 0;
      let totalPass = 0;

      measurementDetails.records.forEach((record) => {
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
  }, [measurementDetails]);

  const computeSummaryBySize = useMemo(() => {
    const summary = [];
    const sizePointCounts = {};

    if (!measurementDetails || !measurementDetails.sizeSpec) {
      return { summary, sizePointCounts };
    }

    const recordsBySize = {};
    measurementDetails.records.forEach((record) => {
      const size = record.size || "N/A";
      if (!recordsBySize[size]) {
        recordsBySize[size] = [];
      }
      recordsBySize[size].push(record);
      sizePointCounts[size] = 0;
    });

    Object.keys(recordsBySize).forEach((size) => {
      measurementDetails.sizeSpec.forEach((spec, index) => {
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

        const LSL = buyerSpec + tolMinus;
        const USL = buyerSpec + tolPlus;
        let cpk = NaN;
        let cp = NaN;
        let cv = NaN;

        if (stdDev > 0) {
          const cpkUpper = (USL - mean) / (3 * stdDev);
          const cpkLower = (mean - LSL) / (3 * stdDev);
          cpk = Math.min(cpkUpper, cpkLower);
          cp = (USL - LSL) / (6 * stdDev);
          cv = (stdDev / mean) * 100;
        } else if (stdDev === 0 && totalCount === totalPass && totalCount > 0) {
          cpk = Infinity;
          cp = Infinity;
          cv = 0;
        }

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
  }, [measurementDetails]);

  const computeDistributionTableData = useMemo(() => {
    if (!measurementDetails || !measurementDetails.sizeSpec) {
      return { measurementPoints: [], sizes: [], matrix: [] };
    }

    const sizes = [
      ...new Set(
        measurementDetails.records.map((record) => record.size || "N/A")
      )
    ].sort();
    const measurementPoints = measurementDetails.sizeSpec
      .filter((spec) => {
        return measurementDetails.records.some((record) => {
          const index = measurementDetails.sizeSpec.findIndex(
            (s) => s.EnglishRemark === spec.EnglishRemark
          );
          const actualValue = record.actual[index]?.value || 0;
          return actualValue !== 0;
        });
      })
      .map((spec) => spec.EnglishRemark);

    const { summary: sizeBasedSummary } = computeSummaryBySize;

    const matrix = measurementPoints.map((measurementPoint) => {
      const row = { measurementPoint, data: {} };
      sizes.forEach((size) => {
        const spec = measurementDetails.sizeSpec.find(
          (s) => s.EnglishRemark === measurementPoint
        );
        const buyerSpec =
          spec?.Specs.find((s) => Object.keys(s)[0] === size)?.[size]
            ?.decimal || 0;
        const tolMinus = spec?.ToleranceMinus?.decimal ?? 0;
        const tolPlus = spec?.TolerancePlus?.decimal ?? 0;

        let totalCount = 0;
        const actualValues = [];

        measurementDetails.records.forEach((record) => {
          if (record.size !== size) return;
          const index = measurementDetails.sizeSpec.findIndex(
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
  }, [measurementDetails, computeSummaryBySize]);

  const { summary: sizeBasedSummary } = computeSummaryBySize;
  const { measurementPoints, sizes, matrix } = computeDistributionTableData;

  const loadFont = async () => {
    try {
      const response = await fetch("/fonts/Roboto-Regular.ttf");
      if (!response.ok) throw new Error("Failed to fetch Roboto font");
      const fontArrayBuffer = await response.arrayBuffer();
      const blob = new Blob([fontArrayBuffer], {
        type: "application/octet-stream"
      });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      const fontBase64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result.split(",")[1];
          resolve(base64String);
        };
        reader.onerror = () => reject(new Error("Failed to read font file"));
      });
      return fontBase64;
    } catch (error) {
      console.error("Error loading font:", error);
      throw error;
    }
  };

  const generatePDF = async () => {
    try {
      setIsLoading(true);
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const robotoBase64 = await loadFont();
      doc.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.setFont("Roboto", "normal");

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Digital Measurement Report", 148.5, 15, { align: "center" });
      doc.setFontSize(12);
      doc.text(`MO No: ${selectedMono}`, 148.5, 22, { align: "center" });
      doc.setLineWidth(0.5);
      doc.setDrawColor(150, 150, 150);
      doc.line(14, 25, 283, 25);

      let y = 30;

      y = MeasurementSummaryPDF({ doc, startY: y, measurementSummary });
      y = MeasurementPointCardPDF({ doc, startY: y, measurementPointSummary });
      y = StabilityAnalysisPDF({
        doc,
        startY: y,
        sizeBasedSummary,
        decimalToFraction
      });
      y = StatisticalAnalysisPDF({
        doc,
        startY: y,
        measurementPoints,
        sizes,
        matrix
      });
      y = InspectedSummaryPDF({
        doc,
        startY: y,
        moNo: selectedMono,
        measurementDetails: measurementDetails || { records: [], sizeSpec: [] },
        sizeSpec: measurementDetails?.sizeSpec || [],
        decimalToFraction
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(75, 85, 99);
        doc.text(`Page ${i} of ${pageCount}`, 283, 200, { align: "right" });
        doc.text("Generated on: April 30, 2025", 14, 200);
      }

      doc.save(`DigitalMeasurement_${selectedMono}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-end">
      {selectedMono ? (
        <button
          onClick={generatePDF}
          disabled={isLoading || hasError}
          className={`w-full h-10 py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center ${
            isLoading || hasError
              ? "bg-gray-200 text-gray-700 cursor-not-allowed"
              : "bg-red-200 text-red-800 hover:bg-red-300 focus:ring-red-400"
          }`}
        >
          {isLoading ? (
            "Loading..."
          ) : hasError ? (
            <>
              <FaFilePdf className="mr-2" />
              PDF Generation Failed
            </>
          ) : (
            <>
              <FaFilePdf className="mr-2" />
              Download PDF
            </>
          )}
        </button>
      ) : (
        <button
          disabled
          className="w-full h-10 py-2 px-4 rounded bg-green-600 dark:bg-green-300 text-gray-700 cursor-not-allowed flex items-center justify-center"
        >
          <FaFilePdf className="mr-2" />
          Download PDF
        </button>
      )}
    </div>
  );
};

export default DigitalMeasurementPDFDownload;
