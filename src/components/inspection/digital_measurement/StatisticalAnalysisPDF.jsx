// import React from "react";
// import { Text, View } from "@react-pdf/renderer";

// const StatisticalAnalysisPDF = ({
//   measurementPoints,
//   sizes,
//   matrix,
//   styles
// }) => {
//   return (
//     <>
//       <Text style={styles.subtitle}>Statistical Analysis</Text>
//       <View style={styles.table}>
//         <View style={styles.tableRow}>
//           <Text style={[styles.tableHeader, { flex: 2 }]}>
//             Measurement Point
//           </Text>
//           {sizes.map((size) => (
//             <Text key={size} style={[styles.tableHeader, { flex: 1 }]}>
//               {size}
//             </Text>
//           ))}
//         </View>
//         {matrix.length > 0 ? (
//           matrix.map((row, rowIndex) => (
//             <View key={rowIndex} style={styles.tableRow}>
//               <Text style={[styles.tableCell, { flex: 2, textAlign: "left" }]}>
//                 {row.measurementPoint}
//               </Text>
//               {sizes.map((size) => (
//                 <Text key={size} style={[styles.tableCell, { flex: 1 }]}>
//                   {row.data[size].totalCount > 0
//                     ? `Count: ${row.data[size].totalCount}, Cpk: ${
//                         row.data[size].cpk === Infinity
//                           ? "Inf"
//                           : row.data[size].cpk !== null
//                           ? row.data[size].cpk.toFixed(2)
//                           : "-"
//                       }`
//                     : "-"}
//                 </Text>
//               ))}
//             </View>
//           ))
//         ) : (
//           <View style={styles.tableRow}>
//             <Text style={[styles.tableCell, { flex: sizes.length + 2 }]}>
//               No statistical data available
//             </Text>
//           </View>
//         )}
//       </View>
//     </>
//   );
// };

// export default StatisticalAnalysisPDF;

//New code
import React from "react";
import autoTable from "jspdf-autotable";

const StatisticalAnalysisPDF = ({
  doc,
  startY,
  measurementPoints,
  sizes,
  matrix
}) => {
  try {
    doc.setFont("Roboto", "normal");
  } catch (error) {
    console.warn(
      "Roboto font not available, falling back to Helvetica:",
      error
    );
    doc.setFont("Helvetica", "normal");
  }

  const calculateCpk = (data) => {
    if (!data || !data.actualValues || data.actualValues.length === 0)
      return null;
    const mean =
      data.mean ||
      data.actualValues.reduce((sum, val) => sum + val, 0) /
        data.actualValues.length;
    const variance =
      data.actualValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      data.actualValues.length;
    const stdDev = Math.sqrt(variance);
    const LSL = data.buyerSpec + data.tolMinus;
    const USL = data.buyerSpec + data.tolPlus;
    if (stdDev === 0 || isNaN(stdDev)) return null;
    const cpk = Math.min(
      (USL - mean) / (3 * stdDev),
      (mean - LSL) / (3 * stdDev)
    );
    return cpk >= 0 ? cpk : 0;
  };

  const data =
    matrix && matrix.length > 0
      ? matrix.map((row) => {
          const rowData = { measurementPoint: row.measurementPoint || "N/A" };
          sizes.forEach((size) => {
            const sizeData = row.data && row.data[size] ? row.data[size] : null;
            if (
              sizeData &&
              sizeData.actualValues &&
              sizeData.actualValues.length > 0
            ) {
              rowData[size] = {
                totalCount: sizeData.totalCount || sizeData.actualValues.length,
                actualValues: sizeData.actualValues,
                buyerSpec: sizeData.buyerSpec,
                tolMinus: sizeData.tolMinus,
                tolPlus: sizeData.tolPlus,
                mean:
                  sizeData.mean ||
                  sizeData.actualValues.reduce((sum, val) => sum + val, 0) /
                    sizeData.actualValues.length,
                cpk: sizeData.cpk || calculateCpk(sizeData)
              };
            } else {
              rowData[size] = null;
            }
          });
          return rowData;
        })
      : [
          {
            measurementPoint: "No statistical data available",
            ...sizes.reduce((acc, size) => ({ ...acc, [size]: null }), {})
          }
        ];

  const columns = [
    { header: "Measurement Point", dataKey: "measurementPoint", width: 30 },
    ...sizes.map((size) => ({ header: size, dataKey: size, width: 48 }))
  ];

  doc.setFontSize(12);
  doc.text("Statistical Analysis", 14, startY);
  startY += 5;

  doc.setFontSize(6);
  doc.setTextColor(75, 85, 99);
  doc.text(
    "LL = Lower Limit, S = Buyer Spec, UL = Upper Limit, M = Mean",
    14,
    startY
  );
  startY += 4;

  doc.setLineDash([2, 2]);
  doc.setDrawColor(156, 163, 175);
  doc.line(14, startY, 283, startY);
  doc.setLineDash([]);
  startY += 4;

  const normalPDF = (x, mean, stdDev) => {
    const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    return coefficient * Math.exp(exponent);
  };

  autoTable(doc, {
    startY,
    head: [columns.map((col) => col.header)],
    body: data.map((row) =>
      columns.map((col) => {
        const value = row[col.dataKey];
        return col.dataKey === "measurementPoint"
          ? value
          : value && value.totalCount > 0
          ? ""
          : "-";
      })
    ),
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
      fontSize: 6,
      cellPadding: 1,
      overflow: "linebreak",
      lineColor: [150, 150, 150],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [229, 231, 235],
      textColor: [0, 0, 0],
      fontSize: 6,
      fontStyle: "bold",
      halign: "center",
      valign: "middle"
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 6,
      minCellHeight: 40
    },
    didDrawCell: (data) => {
      if (data.column.index === 0 || data.row.section !== "body") return;

      const cellData = data.row.raw[data.column.dataKey];
      if (
        !cellData ||
        typeof cellData !== "object" ||
        !cellData.totalCount ||
        cellData.totalCount === 0 ||
        !cellData.actualValues ||
        !Array.isArray(cellData.actualValues)
      )
        return;

      const { actualValues, buyerSpec, tolMinus, tolPlus, mean, cpk } =
        cellData;
      const variance =
        actualValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        actualValues.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev === 0 || isNaN(stdDev)) return;

      const canvasWidth = data.cell.width - 4;
      const canvasHeight = 30; // Increased for better visibility
      const xOffset = data.cell.x + 2;
      const yOffset = data.cell.y + 2;

      const xMin = mean - 3 * stdDev;
      const xMax = mean + 3 * stdDev;
      const xRange = xMax - xMin;

      const points = [];
      const step = xRange / 100; // More points for smoother curve
      let maxY = 0;

      for (let x = xMin; x <= xMax; x += step) {
        const y = normalPDF(x, mean, stdDev);
        points.push({ x, y });
        maxY = Math.max(maxY, y);
      }

      const scaleX = canvasWidth / xRange;
      const scaleY = ((canvasHeight - 5) / maxY) * 0.8;

      doc.setDrawColor(0, 0, 255);
      doc.setLineWidth(0.2);
      points.forEach((point, i) => {
        const canvasX = xOffset + (point.x - xMin) * scaleX;
        const canvasY = yOffset + canvasHeight - point.y * scaleY;
        if (i === 0) doc.moveTo(canvasX, canvasY);
        else doc.lineTo(canvasX, canvasY);
      });
      doc.stroke();

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      doc.line(
        xOffset,
        yOffset + canvasHeight,
        xOffset + canvasWidth,
        yOffset + canvasHeight
      );

      const drawLine = (value, color, label, dashed = false) => {
        if (isNaN(value) || value < xMin || value > xMax) return;
        const canvasX = xOffset + (value - xMin) * scaleX;
        doc.setDrawColor(...color);
        if (dashed) doc.setLineDash([1, 1]);
        doc.line(canvasX, yOffset, canvasX, yOffset + canvasHeight);
        doc.setLineDash([]);
        doc.setTextColor(...color);
        doc.setFontSize(4);
        doc.text(label, canvasX, yOffset + canvasHeight + 2, {
          align: "center"
        });
      };

      drawLine(buyerSpec + tolMinus, [255, 0, 0], "LL", true);
      drawLine(buyerSpec, [0, 0, 0], "S");
      drawLine(buyerSpec + tolPlus, [255, 0, 0], "UL", true);
      drawLine(mean, [0, 128, 0], "M");

      const cpkText = `Cpk = ${
        cpk === Infinity ? "Inf" : cpk !== null ? cpk.toFixed(2) : "N/A"
      }`;
      const cpkBgColor =
        cpk === null
          ? [243, 244, 246]
          : cpk === Infinity
          ? [147, 197, 253]
          : cpk >= 1.33
          ? [134, 239, 172]
          : cpk >= 1.0
          ? [220, 252, 231]
          : cpk >= 0.5
          ? [254, 240, 138]
          : [254, 226, 226];

      const cpkBoxWidth = 15;
      const cpkBoxHeight = 5;
      const cpkBoxX = xOffset + canvasWidth - cpkBoxWidth - 1;
      const cpkBoxY = yOffset + 1;

      doc.setFillColor(...cpkBgColor);
      doc.setDrawColor(107, 114, 128);
      doc.rect(cpkBoxX, cpkBoxY, cpkBoxWidth, cpkBoxHeight, "FD");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(4);
      doc.text(
        cpkText,
        cpkBoxX + cpkBoxWidth / 2,
        cpkBoxY + cpkBoxHeight / 2 + 1,
        { align: "center" }
      );

      const labelY = yOffset + canvasHeight + 6;
      let labelX = xOffset;
      const labelHeight = 4;
      const labelPadding = 1;

      const drawLabel = (text, borderColor, textColor) => {
        const textWidth = doc.getTextWidth(text) + 2 * labelPadding;
        doc.setDrawColor(...borderColor);
        doc.setFillColor(255, 255, 255);
        doc.rect(labelX, labelY, textWidth, labelHeight, "FD");
        doc.setTextColor(...textColor);
        doc.text(text, labelX + textWidth / 2, labelY + labelHeight / 2 + 1, {
          align: "center"
        });
        labelX += textWidth + 2;
      };

      drawLabel(
        `LL = ${(buyerSpec + tolMinus).toFixed(4)}`,
        [255, 0, 0],
        [255, 0, 0]
      );
      drawLabel(`S = ${buyerSpec.toFixed(4)}`, [0, 0, 0], [0, 0, 0]);
      drawLabel(
        `UL = ${(buyerSpec + tolPlus).toFixed(4)}`,
        [255, 0, 0],
        [255, 0, 0]
      );
      drawLabel(`M = ${mean.toFixed(4)}`, [0, 128, 0], [0, 128, 0]);

      doc.setLineDash([1, 1]);
      doc.setDrawColor(156, 163, 175);
      doc.line(
        xOffset,
        labelY + labelHeight + 1,
        xOffset + canvasWidth,
        labelY + labelHeight + 1
      );
      doc.setLineDash([]);
    }
  });

  return doc.lastAutoTable.finalY + 10;
};

export default StatisticalAnalysisPDF;
