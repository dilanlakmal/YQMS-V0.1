import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer";
import React from "react";

// --- FONT REGISTRATION ---
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal"
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold"
    }
  ]
});

// --- STYLESHEET ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    backgroundColor: "#ffffff",
    padding: 30,
    color: "#333"
  },
  headerContainer: { textAlign: "center", marginBottom: 20 },
  mainTitle: { fontSize: 14, fontWeight: "bold", color: "#111827" },
  subtitle: { fontSize: 11, color: "#4b5563", marginTop: 4 },
  table: { display: "table", width: "100%" },
  tableRow: { flexDirection: "row" },
  tableHeaderRow: { backgroundColor: "#f9fafb" },
  tableColHeader: {
    padding: 5,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    fontWeight: "bold",
    fontSize: 8,
    textAlign: "center"
  },
  tableCol: {
    padding: 4,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    textAlign: "center"
  },
  // Column Widths
  colDate: { width: "8%" },
  colMachine: { width: "6%" },
  colMo: { width: "8%" },
  colStyle: { width: "10%" },
  colOperator: { width: "8%" },
  colSpecs: { width: "10%" },
  colTest: { width: "10%" },
  colTimeSlots: { width: "40%" },
  textLeft: { textAlign: "left" }
});

const TIME_SLOTS_CONFIG = [
  { key: "07:00", label: "07.00 AM" },
  { key: "09:00", label: "09.00 AM" },
  { key: "12:00", label: "12.00 PM" },
  { key: "14:00", label: "02.00 PM" },
  { key: "16:00", label: "04.00 PM" },
  { key: "18:00", label: "06.00 PM" }
];

const FinalConsolidateHTReportMachineCalibPDF = ({ data }) => (
  <Document author="Yorkmars Garment MFG Co., LTD">
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.headerContainer}>
        <Text style={styles.mainTitle}>
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </Text>
        <Text style={styles.subtitle}>Daily HT Machine Calibration Test</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeaderRow]} fixed>
          <Text style={[styles.tableColHeader, styles.colDate]}>
            Insp. Date
          </Text>
          <Text style={[styles.tableColHeader, styles.colMachine]}>Mach.</Text>
          <Text style={[styles.tableColHeader, styles.colMo]}>MO No</Text>
          <Text style={[styles.tableColHeader, styles.colStyle]}>
            Buyer Style
          </Text>
          <Text style={[styles.tableColHeader, styles.colOperator]}>
            Operator
          </Text>
          <Text style={[styles.tableColHeader, styles.colSpecs]}>
            Base Specs
          </Text>
          <Text style={[styles.tableColHeader, styles.colTest]}>
            Stretch Test
          </Text>
          <Text style={[styles.tableColHeader, styles.colTimeSlots]}>
            Time Slot Results
          </Text>
        </View>

        {data.map((row, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={[styles.tableCol, styles.colDate]}>
              {new Date(row.inspectionDate).toLocaleDateString()}
            </Text>
            <Text style={[styles.tableCol, styles.colMachine]}>
              {row.machineNo}
            </Text>
            <Text style={[styles.tableCol, styles.colMo]}>{row.moNo}</Text>
            <Text style={[styles.tableCol, styles.colStyle]}>
              {row.buyerStyle}
            </Text>
            <Text style={[styles.tableCol, styles.colOperator]}>
              {row.operatorData?.emp_id || "N/A"}
            </Text>
            <Text style={[styles.tableCol, styles.colSpecs, styles.textLeft]}>
              {`T: ${row.baseReqTemp || "N/A"}°C\nt: ${
                row.baseReqTime || "N/A"
              }s\nP: ${row.baseReqPressure || "N/A"}Bar`}
            </Text>
            <Text style={[styles.tableCol, styles.colTest]}>
              {row.stretchTestResult}
            </Text>
            <Text
              style={[styles.tableCol, styles.colTimeSlots, styles.textLeft]}
            >
              {TIME_SLOTS_CONFIG.map((slot) => {
                const inspection = row.inspections.find(
                  (insp) => insp.timeSlotKey === slot.key
                );
                if (!inspection) return `${slot.label}: No Data\n`;
                return `${slot.label} - T: ${
                  inspection.temp_actual ?? "N/A"
                }, t: ${inspection.time_actual ?? "N/A"}, P: ${
                  inspection.pressure_actual ?? "N/A"
                }\n`;
              }).join("")}
            </Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default FinalConsolidateHTReportMachineCalibPDF;
