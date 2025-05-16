// import React from "react";
// import { Text, View } from "@react-pdf/renderer";

// const MeasurementPointCardPDF = ({ measurementPointSummary, styles }) => {
//   return (
//     <>
//       <Text style={styles.subtitle}>Overall Measurement Point Summary</Text>
//       <View style={styles.cardContainer}>
//         {measurementPointSummary.length > 0 ? (
//           measurementPointSummary.map((point, index) => {
//             const isPass = parseFloat(point.passRate) > 98;
//             return (
//               <View key={index} style={styles.card}>
//                 <Text style={styles.cardTitle}>{point.measurementPoint}</Text>
//                 <View style={styles.cardContent}>
//                   <Text>Total Count: {point.totalCount}</Text>
//                   <Text>Total Pass: {point.totalPass}</Text>
//                   <Text>Total Fail: {point.totalFail}</Text>
//                   <Text>Pass Rate: {point.passRate}%</Text>
//                 </View>
//                 <Text
//                   style={[
//                     styles.cardFooter,
//                     isPass ? styles.textGreen : styles.textRed
//                   ]}
//                 >
//                   Status: {point.status}
//                 </Text>
//               </View>
//             );
//           })
//         ) : (
//           <Text>No measurement points available</Text>
//         )}
//       </View>
//     </>
//   );
// };

// export default MeasurementPointCardPDF;

//New code
import autoTable from "jspdf-autotable";

const MeasurementPointCardPDF = ({ doc, startY, measurementPointSummary }) => {
  try {
    doc.setFont("Roboto", "normal");
  } catch (error) {
    console.warn(
      "Roboto font not available, falling back to Helvetica:",
      error
    );
    doc.setFont("Helvetica", "normal");
  }

  // Title
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Overall Measurement Point Summary", 14, startY);
  startY += 10;

  // Handle empty data
  if (measurementPointSummary.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text("No measurement points available", 14, startY);
    return startY + 10;
  }

  // Define table columns
  const columns = [
    { header: "Measurement Point", dataKey: "measurementPoint", width: 100 },
    { header: "Total Count", dataKey: "totalCount", width: 25 },
    { header: "Total Pass", dataKey: "totalPass", width: 25 },
    { header: "Total Fail", dataKey: "totalFail", width: 25 },
    { header: "Pass Rate", dataKey: "passRate", width: 25 },
    { header: "Status", dataKey: "status", width: 25 }
  ];

  // Prepare table data with calculated passRate and status
  const data = measurementPointSummary.map((point) => {
    const totalCount = point.totalCount || 0;
    const totalPass = point.totalPass || 0;
    const totalFail = point.totalFail || 0;
    const passRate =
      totalCount > 0 ? ((totalPass / totalCount) * 100).toFixed(2) : "0.00";
    const status = parseFloat(passRate) >= 98 ? "Pass" : "Fail";

    return {
      measurementPoint: point.measurementPoint || "N/A",
      totalCount,
      totalPass,
      totalFail,
      passRate: `${passRate}%`,
      status
    };
  });

  // Draw table using autoTable
  autoTable(doc, {
    startY,
    head: [columns.map((col) => col.header)],
    body: data.map((row) => columns.map((col) => row[col.dataKey])),
    theme: "grid",
    columnStyles: columns.reduce(
      (acc, col, idx) => ({
        ...acc,
        [idx]: {
          cellWidth: col.width,
          halign: idx === 0 ? "left" : "center",
          valign: "middle"
        }
      }),
      {}
    ),
    styles: {
      font: "Roboto",
      fontSize: 7, // Reduced font size
      cellPadding: 2,
      overflow: "linebreak",
      lineColor: [150, 150, 150],
      lineWidth: 0.2,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [229, 231, 235], // Gray-200
      textColor: [0, 0, 0],
      fontSize: 7, // Reduced font size
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      lineWidth: 0.2,
      lineColor: [150, 150, 150]
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 7 // Reduced font size
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245] // Gray-50
    },
    didParseCell: (data) => {
      const row = data.row.raw;
      if (data.section === "body") {
        // Pass Rate column (index 4)
        if (data.column.index === 4) {
          const passRateValue =
            row.passRate && typeof row.passRate === "string"
              ? row.passRate.replace("%", "")
              : "0";
          const passRate = parseFloat(passRateValue);
          data.cell.styles.fillColor =
            !isNaN(passRate) && passRate >= 98
              ? [220, 252, 231]
              : [254, 226, 226]; // bg-green-100 or bg-red-100
          data.cell.styles.fontStyle = "bold";
        }
        // Status column (index 5)
        if (data.column.index === 5) {
          data.cell.styles.fillColor =
            row.status === "Pass" ? [220, 252, 231] : [254, 226, 226]; // bg-green-100 or bg-red-100
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor =
            row.status === "Pass" ? [34, 197, 94] : [239, 68, 68]; // text-green-500 or text-red-500
        }
      }
    },
    didDrawCell: (data) => {
      // Add a subtle shadow effect to the table
      if (data.section === "body" && data.row.index === 0) {
        doc.setFillColor(200, 200, 200);
        doc.rect(data.cell.x, data.cell.y - 0.5, data.cell.width, 0.5, "F"); // Top shadow
      }
    },
    margin: { left: 14, right: 14 }
  });

  // Add a footer line
  const tableEndY = doc.lastAutoTable.finalY;
  doc.setDrawColor(156, 163, 175);
  doc.setLineDash([2, 2]);
  doc.line(14, tableEndY + 3, 283, tableEndY + 3);
  doc.setLineDash([]);

  return tableEndY + 10;
};

export default MeasurementPointCardPDF;
