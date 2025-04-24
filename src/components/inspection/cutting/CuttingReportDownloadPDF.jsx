import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import CuttingReportOrderDetailsPDF from "./CuttingReportOrderDetailsPDF";
import CuttingReportSummaryCardPDF from "./CuttingReportSummaryCardPDF";
import CuttingReportMeasurementTablePDF from "./CuttingReportMeasurementTablePDF";
import CuttingReportDefectsPDF from "./CuttingReportDefectsPDF";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center"
  },
  section: {
    marginBottom: 15
  },
  table: {
    display: "table",
    width: "auto",
    borderWidth: 1,
    borderStyle: "solid"
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomStyle: "solid"
  },
  cell: {
    padding: 5,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightStyle: "solid"
  }
});

const CuttingReportDownloadPDF = ({ allReportData, measurementPoints }) => {
  const getPanelIndexName = (garmentType, panelIndex) => {
    if (!garmentType || !panelIndex) return `Panel Index: ${panelIndex}`;
    const matchingPoints = measurementPoints.find(
      (point) => point.panel.toLowerCase() === garmentType.toLowerCase()
    );
    if (!matchingPoints) return `Panel Index: ${panelIndex}`;
    const matchingPoint = measurementPoints.find(
      (point) =>
        point.panel.toLowerCase() === garmentType.toLowerCase() &&
        point.panelIndex === panelIndex
    );
    return matchingPoint
      ? matchingPoint.panelIndexName
      : `Panel Index: ${panelIndex}`;
  };

  return (
    <Document>
      <Page size="A3" style={styles.page}>
        {allReportData.map((data, index) => (
          <View key={index} break={index > 0} style={styles.section}>
            <Text style={styles.title}>
              {data.moNo} - Cutting Table {data.cuttingtableLetter}
              {data.cuttingtableNo} Summary
            </Text>
            <CuttingReportOrderDetailsPDF data={data} />
            <CuttingReportSummaryCardPDF summary={data.summary} />
            {data.inspectionData.map((sizeData, idx) => (
              <View key={idx} style={styles.section}>
                <Text style={{ fontSize: 12, marginBottom: 5 }}>
                  Inspected Sample Details - Size: {sizeData.size}
                </Text>
                <View style={styles.section}>
                  <View style={styles.table}>
                    <View style={styles.row}>
                      {[
                        "Serial Letter",
                        "Total Pcs",
                        "Total Pass",
                        "Total Reject",
                        "Measurement Issues",
                        "Physical Defects"
                      ].map((header, i) => (
                        <Text
                          key={i}
                          style={{
                            width: "16.66%",
                            padding: 5,
                            borderRightWidth: i < 5 ? 1 : 0,
                            borderRightStyle: "solid",
                            fontWeight: "bold"
                          }}
                        >
                          {header}
                        </Text>
                      ))}
                    </View>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={[styles.cell, { width: "16.66%" }]}>
                        {sizeData.serialLetter}
                      </Text>
                      <Text style={[styles.cell, { width: "16.66%" }]}>
                        {sizeData.totalPcs}
                      </Text>
                      <Text style={[styles.cell, { width: "16.66%" }]}>
                        {sizeData.totalPass}
                      </Text>
                      <Text style={[styles.cell, { width: "16.66%" }]}>
                        {sizeData.totalReject}
                      </Text>
                      <Text style={[styles.cell, { width: "16.66%" }]}>
                        {sizeData.totalRejectMeasurement}
                      </Text>
                      <Text
                        style={[
                          styles.cell,
                          { width: "16.66%", borderRightWidth: 0 }
                        ]}
                      >
                        {sizeData.totalRejectDefects}
                      </Text>
                    </View>
                  </View>
                </View>
                {sizeData.pcsLocation
                  .reduce((acc, loc) => {
                    loc.measurementData.forEach((panel) => {
                      const existing = acc.find(
                        (p) => p.panelIndex === panel.panelIndex
                      );
                      if (!existing) {
                        acc.push({
                          panelIndex: panel.panelIndex,
                          measurementData: [],
                          defectData: []
                        });
                      }
                      const panelEntry = acc.find(
                        (p) => p.panelIndex === panel.panelIndex
                      );
                      panelEntry.measurementData.push({
                        location: loc.location,
                        ...panel
                      });
                      if (panel.defectData.length > 0) {
                        panelEntry.defectData.push(...panel.defectData);
                      }
                    });
                    return acc;
                  }, [])
                  .map((panel, panelIdx) => (
                    <View key={panelIdx} style={styles.section}>
                      <Text style={{ fontSize: 11, marginBottom: 5 }}>
                        {getPanelIndexName(data.garmentType, panel.panelIndex)}
                      </Text>
                      <CuttingReportMeasurementTablePDF panel={panel} />
                      <CuttingReportDefectsPDF defectData={panel.defectData} />
                    </View>
                  ))}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
};

export default CuttingReportDownloadPDF;
