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
import React from "react";

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

  doc.setFontSize(12);
  doc.text("Overall Measurement Point Summary", 14, startY);
  startY += 10;

  if (measurementPointSummary.length === 0) {
    doc.setFontSize(10);
    doc.text("No measurement points available", 14, startY);
    return startY + 10;
  }

  const cardWidth = 60;
  const cardsPerRow = 4;
  const margin = 5;
  const cardHeight = 40;

  let x = 14;
  let y = startY;

  measurementPointSummary.forEach((point, index) => {
    const isPass = parseFloat(point.passRate) > 98;
    const statusColor = isPass ? [34, 197, 94] : [239, 68, 68]; // Green-500 or Red-500
    const statusBgColor = isPass ? [220, 252, 231] : [254, 226, 226]; // Green-100 or Red-100

    if (index % cardsPerRow === 0 && index !== 0) {
      x = 14;
      y += cardHeight + margin;
    }

    // Draw card border with shadow effect
    doc.setLineWidth(0.2);
    doc.setDrawColor(150, 150, 150);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x + 1, y + 1, cardWidth, cardHeight, 2, 2, "FD"); // Shadow
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD"); // Main card

    // Title
    doc.setFillColor(243, 244, 246); // Gray-100
    doc.roundedRect(x, y, cardWidth, 8, 2, 0, "F");
    doc.setFontSize(7); // Smaller font for title
    doc.setFont("Roboto", "bold");
    doc.text(point.measurementPoint, x + cardWidth / 2, y + 5, {
      align: "center",
      maxWidth: cardWidth - 4
    });

    // Content with icons (colored squares)
    const contentY = y + 10;
    const lineHeight = 5;
    const metrics = [
      { label: "Total Count", value: point.totalCount, color: [107, 114, 128] }, // Gray-500
      { label: "Total Pass", value: point.totalPass, color: [34, 197, 94] }, // Green-500
      { label: "Total Fail", value: point.totalFail, color: [239, 68, 68] }, // Red-500
      { label: "Pass Rate", value: `${point.passRate}%`, color: [59, 130, 246] } // Blue-500
    ];

    metrics.forEach((metric, idx) => {
      const metricY = contentY + idx * lineHeight;
      // Draw icon (colored square)
      doc.setFillColor(...metric.color);
      doc.rect(x + 2, metricY - 1, 2, 2, "F");
      // Draw text
      doc.setFontSize(6); // Small font for metrics
      doc.setFont("Roboto", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`${metric.label}: ${metric.value}`, x + 6, metricY + 1);
    });

    // Footer (status) styled like web
    const footerY = y + cardHeight - 8;
    doc.setFillColor(...statusBgColor);
    doc.setDrawColor(...statusColor);
    doc.setLineWidth(0.2);
    doc.roundedRect(x + 2, footerY + 1, cardWidth - 4, 6, 1, 1, "FD"); // Rounded rectangle with border
    doc.setTextColor(...statusColor);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(7);
    doc.text(`Status: ${point.status}`, x + cardWidth / 2, footerY + 5, {
      align: "center"
    });
    doc.setTextColor(0, 0, 0); // Reset text color
    doc.setDrawColor(150, 150, 150); // Reset draw color
    doc.setLineWidth(0.1); // Reset line width

    x += cardWidth + margin;
  });

  const rows = Math.ceil(measurementPointSummary.length / cardsPerRow);
  return y + rows * (cardHeight + margin);
};

export default MeasurementPointCardPDF;
