// src/components/inspection/digital_measurement/DigitalMeasurementPDFDownload.jsx
import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import MeasurementSummaryPDF from "./MeasurementSummaryPDF";
import OverallMeasurementPointSummaryPDF from "./OverallMeasurementPointSummaryPDF";
import InspectedSummaryPDF from "./InspectedSummaryPDF";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 10 },
  section: { marginBottom: 20 }
});

const CombinedPDF = ({
  measurementSummary,
  overallSummary,
  inspectedSummary,
  selectedMono
}) => (
  <Document>
    {/* Measurement Summary */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <MeasurementSummaryPDF summaryData={measurementSummary} />
      </View>
    </Page>
    {/* Overall Measurement Point Summary */}
    {overallSummary && overallSummary.length > 0 && (
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <OverallMeasurementPointSummaryPDF summaryData={overallSummary} />
        </View>
      </Page>
    )}
    {/* Inspected Summary */}
    {inspectedSummary && (
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <InspectedSummaryPDF
            records={inspectedSummary.records}
            sizeSpec={inspectedSummary.sizeSpec}
            selectedMono={selectedMono}
          />
        </View>
      </Page>
    )}
  </Document>
);

const DigitalMeasurementPDFDownload = ({
  measurementSummary,
  overallSummary,
  inspectedSummary,
  selectedMono,
  disabled
}) => {
  return (
    <PDFDownloadLink
      document={
        <CombinedPDF
          measurementSummary={measurementSummary}
          overallSummary={overallSummary}
          inspectedSummary={inspectedSummary}
          selectedMono={selectedMono}
        />
      }
      fileName={`DigitalMeasurement_${selectedMono || "Summary"}_${
        new Date().toISOString().split("T")[0]
      }.pdf`}
    >
      {({ blob, url, loading, error }) => (
        <button
          disabled={disabled || loading}
          className={`w-full h-10 py-2.5 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center ${
            disabled || loading
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-green-200 text-green-800 hover:bg-green-300 focus:ring-green-400"
          }`}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          {loading ? "Generating PDF..." : "Download PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
};

export default DigitalMeasurementPDFDownload;
