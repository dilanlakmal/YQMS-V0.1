// import React from "react";
// import { Text, View } from "@react-pdf/renderer";

// const StabilityAnalysisPDF = ({
//   sizeBasedSummary,
//   styles,
//   decimalToFraction
// }) => {
//   return (
//     <>
//       <Text style={styles.subtitle}>Stability Analysis</Text>
//       <View style={styles.table}>
//         <View style={styles.tableRow}>
//           {[
//             "Size",
//             "Measurement Point",
//             "Buyer Spec",
//             "Tol-",
//             "Tol+",
//             "Total Count",
//             "Total Pass",
//             "Total Fail",
//             "Mean",
//             "Std. Dev",
//             "Diff",
//             "Diff %",
//             "Pass Rate",
//             "Cpk",
//             "Cp",
//             "CV (%)",
//             "Stability"
//           ].map((header) => (
//             <Text
//               key={header}
//               style={[
//                 styles.tableHeader,
//                 { flex: header === "Measurement Point" ? 2 : 1 }
//               ]}
//             >
//               {header}
//             </Text>
//           ))}
//         </View>
//         {sizeBasedSummary.length > 0 ? (
//           sizeBasedSummary.map((point, index) => {
//             const isFirstSizeRow =
//               index === 0 || point.size !== sizeBasedSummary[index - 1].size;
//             return (
//               <View key={index} style={styles.tableRow}>
//                 {isFirstSizeRow ? (
//                   <Text style={[styles.tableCell, { flex: 1 }]}>
//                     {point.size}
//                   </Text>
//                 ) : null}
//                 <Text
//                   style={[styles.tableCell, { flex: 2, textAlign: "left" }]}
//                 >
//                   {point.measurementPoint}
//                 </Text>
//                 <Text style={styles.tableCell}>
//                   {decimalToFraction(point.buyerSpec)}
//                 </Text>
//                 <Text style={styles.tableCell}>
//                   {decimalToFraction(point.tolMinus)}
//                 </Text>
//                 <Text style={styles.tableCell}>
//                   {decimalToFraction(point.tolPlus)}
//                 </Text>
//                 <Text style={styles.tableCell}>{point.totalCount}</Text>
//                 <Text style={styles.tableCell}>{point.totalPass}</Text>
//                 <Text style={styles.tableCell}>{point.totalFail}</Text>
//                 <Text style={styles.tableCell}>{point.mean.toFixed(2)}</Text>
//                 <Text style={styles.tableCell}>{point.stdDev.toFixed(2)}</Text>
//                 <Text style={styles.tableCell}>{point.diff.toFixed(4)}</Text>
//                 <Text style={styles.tableCell}>
//                   {point.diffPercent.toFixed(2)}%
//                 </Text>
//                 <Text style={styles.tableCell}>{point.passRate}%</Text>
//                 <Text style={styles.tableCell}>
//                   {point.cpk === Infinity
//                     ? "Inf"
//                     : point.cpk !== null
//                     ? point.cpk.toFixed(2)
//                     : "-"}
//                 </Text>
//                 <Text style={styles.tableCell}>
//                   {point.cp === Infinity
//                     ? "Inf"
//                     : point.cp !== null
//                     ? point.cp.toFixed(2)
//                     : "-"}
//                 </Text>
//                 <Text style={styles.tableCell}>
//                   {point.cv !== null ? point.cv.toFixed(2) : "-"}
//                 </Text>
//                 <Text style={styles.tableCell}>{point.stabilityStatus}</Text>
//               </View>
//             );
//           })
//         ) : (
//           <View style={styles.tableRow}>
//             <Text style={[styles.tableCell, { flex: 17 }]}>
//               No stability data available
//             </Text>
//           </View>
//         )}
//       </View>
//     </>
//   );
// };

// export default StabilityAnalysisPDF;

//New code
import React from "react";
import autoTable from "jspdf-autotable";

const StabilityAnalysisPDF = ({
  doc,
  startY,
  sizeBasedSummary,
  decimalToFraction
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

  doc.addPage();
  startY = 14;

  const columns = [
    { header: "Size", dataKey: "size", width: 12 },
    { header: "Measurement Point", dataKey: "measurementPoint", width: 60 },
    { header: "Buyer Spec", dataKey: "buyerSpec", width: 16 },
    { header: "Tol-", dataKey: "tolMinus", width: 12 },
    { header: "Tol+", dataKey: "tolPlus", width: 12 },
    { header: "Total Count", dataKey: "totalCount", width: 12 },
    { header: "Total Pass", dataKey: "totalPass", width: 12 },
    { header: "Total Fail", dataKey: "totalFail", width: 12 },
    { header: "Mean", dataKey: "mean", width: 12 },
    { header: "Std. Dev", dataKey: "stdDev", width: 12 },
    { header: "Diff", dataKey: "diff", width: 12 },
    { header: "Diff %", dataKey: "diffPercent", width: 12 },
    { header: "Pass Rate", dataKey: "passRate", width: 12 },
    { header: "Cpk", dataKey: "cpk", width: 12 },
    { header: "Cp", dataKey: "cp", width: 12 },
    { header: "CV (%)", dataKey: "cv", width: 12 },
    { header: "Stability", dataKey: "stabilityStatus", width: 24 }
  ];

  const data =
    sizeBasedSummary.length > 0
      ? sizeBasedSummary.map((point, index) => {
          const isFirstSizeRow =
            index === 0 || point.size !== sizeBasedSummary[index - 1].size;
          return {
            size: isFirstSizeRow ? point.size : "",
            measurementPoint: point.measurementPoint,
            buyerSpec: decimalToFraction(point.buyerSpec),
            tolMinus: decimalToFraction(point.tolMinus),
            tolPlus: decimalToFraction(point.tolPlus),
            totalCount: point.totalCount,
            totalPass: point.totalPass,
            totalFail: point.totalFail,
            mean: point.mean.toFixed(2),
            stdDev: point.stdDev.toFixed(2),
            diff: point.diff.toFixed(4),
            diffPercent: `${point.diffPercent.toFixed(2)}%`,
            passRate: `${point.passRate}%`,
            cpk:
              point.cpk === Infinity
                ? "Inf"
                : point.cpk !== null
                ? point.cpk.toFixed(2)
                : "-",
            cp:
              point.cp === Infinity
                ? "Inf"
                : point.cp !== null
                ? point.cp.toFixed(2)
                : "-",
            cv: point.cv !== null ? point.cv.toFixed(2) : "-",
            stabilityStatus: point.stabilityStatus,
            isFirstSizeRow
          };
        })
      : [
          {
            size: "No stability data available",
            measurementPoint: "",
            buyerSpec: "",
            tolMinus: "",
            tolPlus: "",
            totalCount: "",
            totalPass: "",
            totalFail: "",
            mean: "",
            stdDev: "",
            diff: "",
            diffPercent: "",
            passRate: "",
            cpk: "",
            cp: "",
            cv: "",
            stabilityStatus: "",
            isFirstSizeRow: true
          }
        ];

  doc.setFontSize(12);
  doc.text("Stability Analysis", 14, startY);
  startY += 5;

  const legendItems = [
    { color: [147, 197, 253], text: "CPK = Inf: Superior" },
    { color: [134, 239, 172], text: "CPK ≥ 1.33: Excellent" },
    { color: [220, 252, 231], text: "CPK ≥ 1.0: Acceptable" },
    { color: [254, 240, 138], text: "CPK ≥ 0.5: Marginal" },
    { color: [254, 226, 226], text: "CPK below 0.5: Poor" }
  ];

  let legendX = 14;
  doc.setFontSize(6);
  legendItems.forEach((item) => {
    doc.setFillColor(...item.color);
    doc.rect(legendX, startY, 4, 4, "F");
    doc.setTextColor(75, 85, 99);
    doc.text(item.text, legendX + 6, startY + 3);
    legendX += 40;
  });
  startY += 6;

  doc.setLineDash([2, 2]);
  doc.setDrawColor(156, 163, 175);
  doc.line(14, startY, 283, startY);
  doc.setLineDash([]);
  startY += 4;

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
          halign: idx === 1 ? "left" : "center",
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
      fontSize: 6
    },
    didParseCell: (data) => {
      const row = data.row.raw;
      if (row) {
        if (data.column.index === 0 && row.size !== "") {
          data.cell.styles.fillColor = [30, 64, 175];
          data.cell.styles.textColor = [255, 255, 255];
        }

        // Diff column
        if (data.column.index === 10) {
          const diff = row.diff ? parseFloat(row.diff) : 0;
          const tolMinus = row.tolMinus ? parseFloat(row.tolMinus) : 0;
          const tolPlus = row.tolPlus ? parseFloat(row.tolPlus) : 0;
          data.cell.styles.fillColor =
            diff >= tolMinus && diff <= tolPlus
              ? [220, 252, 231] // bg-green-100
              : [254, 226, 226]; // bg-red-100
          data.cell.styles.fontStyle = "bold";
        }

        // Diff % column
        if (data.column.index === 11) {
          const diff = row.diff ? parseFloat(row.diff) : 0; // Use diff value as in web
          const tolMinus = row.tolMinus ? parseFloat(row.tolMinus) : 0;
          const tolPlus = row.tolPlus ? parseFloat(row.tolPlus) : 0;
          data.cell.styles.fillColor =
            diff >= tolMinus && diff <= tolPlus
              ? [220, 252, 231]
              : [254, 226, 226];
          data.cell.styles.fontStyle = "bold";
        }

        // Pass Rate column
        if (data.column.index === 12) {
          const passRate = row.passRate
            ? parseFloat(row.passRate.replace("%", ""))
            : 0;
          data.cell.styles.fillColor =
            passRate > 98 ? [220, 252, 231] : [254, 226, 226];
          data.cell.styles.fontStyle = "bold";
        }

        // Cpk column
        if (data.column.index === 13) {
          const cpk =
            row.cpk === "Inf" ? Infinity : row.cpk ? parseFloat(row.cpk) : null;
          data.cell.styles.fillColor =
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
          data.cell.styles.fontStyle = "bold";
        }

        // Stability column
        if (data.column.index === 16) {
          const cpk =
            row.cpk === "Inf" ? Infinity : row.cpk ? parseFloat(row.cpk) : null;
          data.cell.styles.fillColor =
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
          data.cell.styles.fontStyle = "bold";
        }

        if (data.column.index === 8 || data.column.index === 9) {
          data.cell.styles.fillColor = [243, 244, 246];
        }
      }
    },
    didDrawCell: (data) => {
      const row = data.row.raw;
      if (row && row.isFirstSizeRow && data.row.section === "body") {
        doc.setLineWidth(0.5);
        doc.setDrawColor(75, 85, 99);
        doc.line(
          data.cell.x,
          data.cell.y,
          data.cell.x + data.cell.width,
          data.cell.y
        );
        doc.setLineWidth(0.1);
      }
    }
  });

  return doc.lastAutoTable.finalY + 10;
};

export default StabilityAnalysisPDF;
