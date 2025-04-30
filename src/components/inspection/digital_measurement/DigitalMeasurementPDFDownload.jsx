import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  StyleSheet,
  Font
} from "@react-pdf/renderer";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { FaFilePdf } from "react-icons/fa";
import MeasurementSummaryPDF from "./MeasurementSummaryPDF";
import MeasurementPointCardPDF from "./MeasurementPointCardPDF";
import StabilityAnalysisPDF from "./StabilityAnalysisPDF";
import StatisticalAnalysisPDF from "./StatisticalAnalysisPDF";
import InspectedSummaryPDF from "./InspectedSummaryPDF";

// Register fonts
Font.register({
  family: "Roboto",
  src: "https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf"
});

// PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "Roboto",
    fontSize: 10,
    flexDirection: "column"
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginVertical: 8
  },
  table: {
    width: "100%",
    border: "1 solid #000",
    marginBottom: 10
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #000"
  },
  tableHeader: {
    backgroundColor: "#e2e8f0",
    fontWeight: "bold",
    padding: 4,
    textAlign: "center",
    borderRight: "1 solid #000"
  },
  tableCell: {
    padding: 4,
    textAlign: "center",
    borderRight: "1 solid #000",
    flex: 1
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10
  },
  card: {
    width: "30%",
    border: "1 solid #000",
    margin: 5,
    padding: 5
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: "bold",
    backgroundColor: "#e2e8f0",
    padding: 4,
    textAlign: "center"
  },
  cardContent: {
    padding: 4,
    fontSize: 8
  },
  cardFooter: {
    padding: 4,
    fontSize: 8,
    textAlign: "center",
    backgroundColor: "#e2e8f0"
  },
  textGreen: {
    color: "#15803d"
  },
  textRed: {
    color: "#b91c1c"
  }
});

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

// PDF Document Component
const PDFDocument = ({
  moNo,
  measurementSummary,
  measurementDetails,
  summaryData,
  sizeSpec,
  styles,
  decimalToFraction
}) => {
  // Memoize computation functions
  const measurementPointSummary = useMemo(() => {
    const summary = [];

    sizeSpec.forEach((spec, index) => {
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
  }, [measurementDetails, sizeSpec]);

  const computeSummaryBySize = useMemo(() => {
    const summary = [];
    const sizePointCounts = {};

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
  }, [measurementDetails, sizeSpec]);

  const computeDistributionTableData = useMemo(() => {
    const sizes = [
      ...new Set(
        measurementDetails.records.map((record) => record.size || "N/A")
      )
    ].sort();
    const measurementPoints = sizeSpec
      .filter((spec) => {
        return measurementDetails.records.some((record) => {
          const index = sizeSpec.findIndex(
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
        const spec = sizeSpec.find((s) => s.EnglishRemark === measurementPoint);
        const buyerSpec =
          spec?.Specs.find((s) => Object.keys(s)[0] === size)?.[size]
            ?.decimal || 0;
        const tolMinus = spec?.ToleranceMinus?.decimal ?? 0;
        const tolPlus = spec?.TolerancePlus?.decimal ?? 0;

        let totalCount = 0;
        const actualValues = [];

        measurementDetails.records.forEach((record) => {
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
  }, [measurementDetails, sizeSpec, computeSummaryBySize]);

  const { summary: sizeBasedSummary, sizePointCounts } = computeSummaryBySize;
  const { measurementPoints, sizes, matrix } = computeDistributionTableData;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>
          Digital Measurement Report for MO No: {moNo}
        </Text>
        <MeasurementSummaryPDF
          measurementSummary={measurementSummary}
          styles={styles}
        />
        <MeasurementPointCardPDF
          measurementPointSummary={measurementPointSummary}
          styles={styles}
        />
        <StabilityAnalysisPDF
          sizeBasedSummary={sizeBasedSummary}
          styles={styles}
          decimalToFraction={decimalToFraction}
        />
        <StatisticalAnalysisPDF
          measurementPoints={measurementPoints}
          sizes={sizes}
          matrix={matrix}
          styles={styles}
        />
        <InspectedSummaryPDF
          moNo={moNo}
          measurementDetails={measurementDetails}
          sizeSpec={sizeSpec}
          styles={styles}
          decimalToFraction={decimalToFraction}
        />
      </Page>
    </Document>
  );
};

// Error Boundary Component
class PDFErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <button
          disabled
          className="w-full h-10 py-2 px-4 rounded bg-gray-200 text-gray-700 cursor-not-allowed flex items-center justify-center"
        >
          <FaFilePdf className="mr-2" />
          PDF Generation Failed
        </button>
      );
    }
    return this.props.children;
  }
}

const DigitalMeasurementPDFDownload = ({ selectedMono, filters }) => {
  const [measurementSummary, setMeasurementSummary] = useState([]);
  const [measurementDetails, setMeasurementDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!selectedMono) return;
    setIsLoading(true);
    try {
      // Fetch Measurement Summary
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

      // Fetch Measurement Details
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

  // Debounced fetch data
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

  // Memoize PDF document
  const pdfDocument = useMemo(() => {
    if (!selectedMono) return null;
    return (
      <PDFDocument
        moNo={selectedMono}
        measurementSummary={measurementSummary}
        measurementDetails={
          measurementDetails || {
            records: [],
            measurementPointSummary: [],
            sizeSpec: []
          }
        }
        summaryData={measurementDetails?.measurementPointSummary || []}
        sizeSpec={measurementDetails?.sizeSpec || []}
        styles={styles}
        decimalToFraction={decimalToFraction}
      />
    );
  }, [selectedMono, measurementSummary, measurementDetails]);

  return (
    <div className="flex items-end">
      {selectedMono ? (
        <PDFErrorBoundary>
          <PDFDownloadLink
            document={pdfDocument}
            fileName={`DigitalMeasurement_${selectedMono}.pdf`}
            className={`w-full h-10 py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center ${
              isLoading
                ? "bg-gray-200 text-gray-700 cursor-not-allowed"
                : "bg-red-200 text-red-800 hover:bg-red-300 focus:ring-red-400"
            }`}
          >
            {({ loading }) =>
              loading || isLoading ? (
                <span>Loading...</span>
              ) : (
                <>
                  <FaFilePdf className="mr-2" />
                  Download PDF
                </>
              )
            }
          </PDFDownloadLink>
        </PDFErrorBoundary>
      ) : (
        <button
          disabled
          className="w-full h-10 py-2 px-4 rounded bg-gray-200 text-gray-700 cursor-not-allowed flex items-center justify-center"
        >
          <FaFilePdf className="mr-2" />
          Download PDF
        </button>
      )}
    </div>
  );
};

export default DigitalMeasurementPDFDownload;
