// import React from "react";
// import { Text, View } from "@react-pdf/renderer";

// const InspectedSummaryPDF = ({
//   moNo,
//   measurementDetails,
//   sizeSpec,
//   styles,
//   decimalToFraction
// }) => {
//   return (
//     <>
//       <Text style={styles.subtitle}>Inspected Summary for MO No: {moNo}</Text>
//       <View style={styles.table}>
//         {/* Table Header */}
//         <View style={[styles.tableRow, styles.tableHeaderRow]}>
//           {[
//             { header: "Inspection Date", flex: 1.2 },
//             { header: "Garment NO", flex: 1.2 },
//             { header: "Size", flex: 0.8 },
//             { header: "Measurement Point", flex: 2.5 },
//             { header: "Buyer Specs", flex: 1 },
//             { header: "TolMinus", flex: 0.8 },
//             { header: "TolPlus", flex: 0.8 },
//             { header: "Measure Value", flex: 1 },
//             { header: "Diff", flex: 0.8 },
//             { header: "Status", flex: 0.8 }
//           ].map((col) => (
//             <Text
//               key={col.header}
//               style={[
//                 styles.tableHeader,
//                 { flex: col.flex, textAlign: "center" }
//               ]}
//             >
//               {col.header}
//             </Text>
//           ))}
//         </View>
//         {/* Table Body */}
//         {measurementDetails.records.length > 0 ? (
//           measurementDetails.records.map((record, garmentIndex) => {
//             const inspectionDate = new Date(
//               record.created_at
//             ).toLocaleDateString("en-US", {
//               year: "numeric",
//               month: "2-digit",
//               day: "2-digit"
//             });
//             const garmentNo = `${garmentIndex + 1}\n(Ref: "${
//               record.reference_no
//             }")`;
//             const size = record.size || "N/A";

//             const points = record.actual
//               .map((actualItem, index) => {
//                 if (actualItem.value === 0) return null;
//                 const spec = sizeSpec[index];
//                 if (!spec) return null;
//                 const measurementPoint = spec.EnglishRemark;
//                 const tolMinus = spec.ToleranceMinus.decimal;
//                 const tolPlus = spec.TolerancePlus.decimal;
//                 const buyerSpec =
//                   spec.Specs.find((s) => Object.keys(s)[0] === record.size)?.[
//                     record.size
//                   ]?.decimal || 0;
//                 const measureValue = actualItem.value;
//                 const diff = buyerSpec - measureValue;
//                 const lower = buyerSpec + tolMinus;
//                 const upper = buyerSpec + tolPlus;
//                 const status =
//                   measureValue >= lower && measureValue <= upper
//                     ? "Pass"
//                     : "Fail";
//                 return {
//                   measurementPoint,
//                   buyerSpec,
//                   tolMinus,
//                   tolPlus,
//                   measureValue,
//                   diff,
//                   status
//                 };
//               })
//               .filter((p) => p !== null);

//             // Calculate row height for merged cells (based on number of points)
//             const rowSpanHeight = points.length * 12; // 12pt per row, adjust as needed

//             return (
//               <View key={garmentIndex} wrap={false}>
//                 {points.map((point, pointIndex) => (
//                   <View
//                     key={`${garmentIndex}-${pointIndex}`}
//                     style={styles.tableRow}
//                   >
//                     {/* Inspection Date */}
//                     {pointIndex === 0 ? (
//                       <View
//                         style={[
//                           styles.tableCell,
//                           {
//                             flex: 1.2,
//                             height: rowSpanHeight,
//                             justifyContent: "center",
//                             alignItems: "center"
//                           }
//                         ]}
//                       >
//                         <Text>{inspectionDate}</Text>
//                       </View>
//                     ) : null}
//                     {/* Garment NO */}
//                     {pointIndex === 0 ? (
//                       <View
//                         style={[
//                           styles.tableCell,
//                           {
//                             flex: 1.2,
//                             height: rowSpanHeight,
//                             justifyContent: "center",
//                             alignItems: "center"
//                           }
//                         ]}
//                       >
//                         <Text>{garmentNo}</Text>
//                       </View>
//                     ) : null}
//                     {/* Size */}
//                     {pointIndex === 0 ? (
//                       <View
//                         style={[
//                           styles.tableCell,
//                           {
//                             flex: 0.8,
//                             height: rowSpanHeight,
//                             justifyContent: "center",
//                             alignItems: "center"
//                           }
//                         ]}
//                       >
//                         <Text>{size}</Text>
//                       </View>
//                     ) : null}
//                     {/* Measurement Point */}
//                     <Text
//                       style={[
//                         styles.tableCell,
//                         { flex: 2.5, textAlign: "left", paddingLeft: 4 }
//                       ]}
//                     >
//                       {point.measurementPoint}
//                     </Text>
//                     {/* Buyer Specs */}
//                     <Text
//                       style={[
//                         styles.tableCell,
//                         { flex: 1, textAlign: "center" }
//                       ]}
//                     >
//                       {decimalToFraction(point.buyerSpec)}
//                     </Text>
//                     {/* TolMinus */}
//                     <Text
//                       style={[
//                         styles.tableCell,
//                         { flex: 0.8, textAlign: "center" }
//                       ]}
//                     >
//                       {decimalToFraction(point.tolMinus)}
//                     </Text>
//                     {/* TolPlus */}
//                     <Text
//                       style={[
//                         styles.tableCell,
//                         { flex: 0.8, textAlign: "center" }
//                       ]}
//                     >
//                       {decimalToFraction(point.tolPlus)}
//                     </Text>
//                     {/* Measure Value */}
//                     <Text
//                       style={[
//                         styles.tableCell,
//                         { flex: 1, textAlign: "center" }
//                       ]}
//                     >
//                       {point.measureValue.toFixed(3)}
//                     </Text>
//                     {/* Diff */}
//                     <View
//                       style={[
//                         styles.tableCell,
//                         {
//                           flex: 0.8,
//                           backgroundColor:
//                             point.diff >= point.tolMinus &&
//                             point.diff <= point.tolPlus
//                               ? "#DCFFDC"
//                               : "#FFDCDC",
//                           justifyContent: "center",
//                           alignItems: "center"
//                         }
//                       ]}
//                     >
//                       <Text>{point.diff.toFixed(3)}</Text>
//                     </View>
//                     {/* Status */}
//                     <View
//                       style={[
//                         styles.tableCell,
//                         {
//                           flex: 0.8,
//                           backgroundColor:
//                             point.status === "Pass" ? "#DCFFDC" : "#FFDCDC",
//                           justifyContent: "center",
//                           alignItems: "center"
//                         }
//                       ]}
//                     >
//                       <Text>{point.status}</Text>
//                     </View>
//                   </View>
//                 ))}
//               </View>
//             );
//           })
//         ) : (
//           <View style={styles.tableRow}>
//             <Text style={[styles.tableCell, { flex: 10, textAlign: "center" }]}>
//               No inspection data available
//             </Text>
//           </View>
//         )}
//       </View>
//     </>
//   );
// };

// export default InspectedSummaryPDF;

//New code
// import autoTable from "jspdf-autotable";

// const InspectedSummaryPDF = ({
//   doc,
//   startY,
//   moNo,
//   measurementDetails,
//   sizeSpec,
//   decimalToFraction
// }) => {
//   try {
//     doc.setFont("Roboto", "normal");
//   } catch (error) {
//     console.warn(
//       "Roboto font not available, falling back to Helvetica:",
//       error
//     );
//     doc.setFont("Helvetica", "normal");
//   }

//   doc.setFontSize(12);
//   doc.text(`Inspected Summary for MO No: ${moNo}`, 14, startY);
//   startY += 10;

//   const tableData = [];
//   const records = measurementDetails?.records || [];
//   const sizeSpecData = sizeSpec || [];

//   records.forEach((record, garmentIndex) => {
//     const inspectionDate = new Date(record.created_at).toLocaleDateString(
//       "en-US",
//       { year: "numeric", month: "2-digit", day: "2-digit" }
//     );
//     const inspectionTime = new Date(record.created_at).toLocaleTimeString(
//       "en-US",
//       { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }
//     );
//     const garmentNo = `${garmentIndex + 1}\n(Ref: "${
//       record.reference_no
//     }")\n${inspectionTime}`;
//     const size = record.size || "N/A";

//     const points = record.actual
//       .map((actualItem, index) => {
//         if (actualItem.value === 0) return null;
//         const spec = sizeSpecData[index];
//         if (!spec) return null;
//         const measurementPoint = spec.EnglishRemark;
//         const tolMinus = spec.ToleranceMinus.decimal;
//         const tolPlus = spec.TolerancePlus.decimal;
//         const buyerSpec =
//           spec.Specs.find((s) => Object.keys(s)[0] === record.size)?.[
//             record.size
//           ]?.decimal || 0;
//         const measureValue = actualItem.value;
//         const diff = buyerSpec - measureValue;
//         const lower = buyerSpec + tolMinus;
//         const upper = buyerSpec + tolPlus;
//         const status =
//           measureValue >= lower && measureValue <= upper ? "Pass" : "Fail";
//         return {
//           measurementPoint,
//           buyerSpec,
//           tolMinus,
//           tolPlus,
//           measureValue,
//           diff,
//           status
//         };
//       })
//       .filter((p) => p !== null);

//     const overallStatus = points.every((p) => p.status === "Pass")
//       ? "Pass"
//       : "Fail";

//     points.forEach((point, pointIndex) => {
//       tableData.push({
//         inspectionDate: pointIndex === 0 ? inspectionDate : "",
//         garmentNo: pointIndex === 0 ? garmentNo : "",
//         size: pointIndex === 0 ? size : "",
//         measurementPoint: point.measurementPoint,
//         buyerSpec: decimalToFraction(point.buyerSpec),
//         tolMinus: decimalToFraction(point.tolMinus),
//         tolPlus: decimalToFraction(point.tolPlus),
//         measureValue: point.measureValue.toFixed(3),
//         diff: point.diff.toFixed(3),
//         status: point.status,
//         overallStatus: pointIndex === 0 ? overallStatus : "",
//         rowSpan: pointIndex === 0 ? points.length : 0,
//         isFirstPoint: pointIndex === 0
//       });
//     });
//   });

//   const columns = [
//     { header: "Inspection Date", dataKey: "inspectionDate", width: 20 },
//     { header: "Garment NO", dataKey: "garmentNo", width: 30 },
//     { header: "Size", dataKey: "size", width: 15 },
//     { header: "Measurement Point", dataKey: "measurementPoint", width: 50 },
//     { header: "Buyer Specs", dataKey: "buyerSpec", width: 20 },
//     { header: "TolMinus", dataKey: "tolMinus", width: 15 },
//     { header: "TolPlus", dataKey: "tolPlus", width: 15 },
//     { header: "Measure Value", dataKey: "measureValue", width: 20 },
//     { header: "Diff", dataKey: "diff", width: 15 },
//     { header: "Status", dataKey: "status", width: 15 }
//   ];

//   autoTable(doc, {
//     startY,
//     head: [columns.map((col) => col.header)],
//     body: tableData.map((row) => [
//       row.inspectionDate,
//       row.garmentNo,
//       row.size,
//       row.measurementPoint,
//       row.buyerSpec,
//       row.tolMinus,
//       row.tolPlus,
//       row.measureValue,
//       row.diff,
//       row.status
//     ]),
//     theme: "grid",
//     columnStyles: columns.reduce(
//       (acc, col, idx) => ({
//         ...acc,
//         [idx]: {
//           cellWidth: col.width,
//           halign: idx === 3 ? "left" : "center",
//           valign: "middle"
//         }
//       }),
//       {}
//     ),
//     styles: {
//       font: "Roboto",
//       fontSize: 8,
//       cellPadding: 1.5,
//       overflow: "linebreak",
//       lineColor: [150, 150, 150],
//       lineWidth: 0.1
//     },
//     headStyles: {
//       fillColor: [229, 231, 235],
//       textColor: [0, 0, 0],
//       fontSize: 8,
//       fontStyle: "bold",
//       halign: "center",
//       valign: "middle"
//     },
//     bodyStyles: {
//       fillColor: [255, 255, 255],
//       textColor: [0, 0, 0],
//       fontSize: 8
//     },
//     alternateRowStyles: {
//       fillColor: [245, 245, 245]
//     },
//     didParseCell: (data) => {
//       const row = tableData[data.row.index];
//       if (row) {
//         if (!row.isFirstPoint) {
//           if (data.column.index === 0) data.cell.text = "";
//           if (data.column.index === 1) data.cell.text = "";
//           if (data.column.index === 2) data.cell.text = "";
//         }

//         if (data.column.index === 8) {
//           data.cell.styles.fillColor =
//             row.diff >= row.tolMinus && row.diff <= row.tolPlus
//               ? [220, 252, 231]
//               : [254, 226, 226];
//         }
//         if (data.column.index === 9) {
//           data.cell.styles.fillColor =
//             row.status === "Pass" ? [220, 252, 231] : [254, 226, 226];
//         }
//       }
//     },
//     didDrawCell: (data) => {
//       const row = tableData[data.row.index];
//       if (row && row.isFirstPoint) {
//         if (data.column.index === 0 && row.rowSpan > 1) {
//           doc.rect(
//             data.cell.x,
//             data.cell.y,
//             data.cell.width,
//             data.cell.height * row.rowSpan,
//             "S"
//           );
//         }
//         if (data.column.index === 1 && row.rowSpan > 1) {
//           doc.rect(
//             data.cell.x,
//             data.cell.y,
//             data.cell.width,
//             data.cell.height * row.rowSpan,
//             "S"
//           );
//           const overallStatus = row.overallStatus;
//           const statusColor =
//             overallStatus === "Pass" ? [34, 197, 94] : [239, 68, 68];
//           const statusBgColor =
//             overallStatus === "Pass" ? [220, 252, 231] : [254, 226, 226];
//           const textY = data.cell.y + data.cell.height * row.rowSpan - 5;
//           doc.setFillColor(...statusBgColor);
//           doc.setDrawColor(...statusColor);
//           doc.setLineWidth(0.2);
//           doc.roundedRect(
//             data.cell.x + 2,
//             textY - 3,
//             data.cell.width - 4,
//             6,
//             1,
//             1,
//             "FD"
//           );
//           doc.setTextColor(...statusColor);
//           doc.setFontSize(7);
//           doc.setFont("Roboto", "bold");
//           doc.text(
//             overallStatus,
//             data.cell.x + data.cell.width / 2,
//             textY + 1,
//             {
//               align: "center"
//             }
//           );
//           doc.setTextColor(0, 0, 0);
//           doc.setLineWidth(0.1);
//           doc.setDrawColor(150, 150, 150);
//         }
//         if (data.column.index === 2 && row.rowSpan > 1) {
//           doc.rect(
//             data.cell.x,
//             data.cell.y,
//             data.cell.width,
//             data.cell.height * row.rowSpan,
//             "S"
//           );
//         }
//       }
//     }
//   });

//   return doc.lastAutoTable.finalY + 10;
// };

// export default InspectedSummaryPDF;

// import autoTable from "jspdf-autotable";

// const InspectedSummaryPDF = ({
//   doc,
//   startY,
//   moNo,
//   measurementDetails,
//   sizeSpec,
//   decimalToFraction
// }) => {
//   try {
//     doc.setFont("Roboto", "normal");
//   } catch (error) {
//     console.warn(
//       "Roboto font not available, falling back to Helvetica:",
//       error
//     );
//     doc.setFont("Helvetica", "normal");
//   }

//   // Start a new page for the table
//   doc.addPage();
//   startY = 10; // Reset startY for new page

//   doc.setFontSize(12);
//   doc.text(`Inspected Summary for MO No: ${moNo}`, 14, startY);
//   startY += 10;

//   const tableData = [];
//   const records = measurementDetails?.records || [];
//   const sizeSpecData = sizeSpec || [];

//   records.forEach((record, garmentIndex) => {
//     const inspectionDate = new Date(record.created_at).toLocaleDateString(
//       "en-US",
//       { year: "numeric", month: "2-digit", day: "2-digit" }
//     );
//     const inspectionTime = new Date(record.created_at).toLocaleTimeString(
//       "en-US",
//       { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }
//     );
//     const garmentNo = `${garmentIndex + 1}\n(Ref: "${
//       record.reference_no
//     }")\n${inspectionTime}`;
//     const size = record.size || "N/A";

//     const points = record.actual
//       .map((actualItem, index) => {
//         if (actualItem.value === 0) return null;
//         const spec = sizeSpecData[index];
//         if (!spec) return null;
//         const measurementPoint = spec.EnglishRemark;
//         const tolMinus = spec.ToleranceMinus.decimal;
//         const tolPlus = spec.TolerancePlus.decimal;
//         const buyerSpec =
//           spec.Specs.find((s) => Object.keys(s)[0] === record.size)?.[
//             record.size
//           ]?.decimal || 0;
//         const measureValue = actualItem.value;
//         const diff = buyerSpec - measureValue;
//         const lower = buyerSpec + tolMinus;
//         const upper = buyerSpec + tolPlus;
//         const status =
//           measureValue >= lower && measureValue <= upper ? "Pass" : "Fail";
//         return {
//           measurementPoint,
//           buyerSpec,
//           tolMinus,
//           tolPlus,
//           measureValue,
//           diff,
//           status
//         };
//       })
//       .filter((p) => p !== null);

//     const overallStatus = points.every((p) => p.status === "Pass")
//       ? "Pass"
//       : "Fail";

//     points.forEach((point, pointIndex) => {
//       tableData.push({
//         inspectionDate: pointIndex === 0 ? inspectionDate : "",
//         garmentNo: pointIndex === 0 ? garmentNo : "",
//         finalStatus: pointIndex === 0 ? overallStatus : "",
//         size: pointIndex === 0 ? size : "",
//         measurementPoint: point.measurementPoint,
//         buyerSpec: decimalToFraction(point.buyerSpec),
//         tolMinus: decimalToFraction(point.tolMinus),
//         tolPlus: decimalToFraction(point.tolPlus),
//         measureValue: point.measureValue.toFixed(3),
//         diff: point.diff.toFixed(3),
//         status: point.status,
//         rowSpan: pointIndex === 0 ? points.length : 0,
//         isFirstPoint: pointIndex === 0
//       });
//     });
//   });

//   const columns = [
//     { header: "Inspection Date", dataKey: "inspectionDate", width: 20 },
//     { header: "Garment NO", dataKey: "garmentNo", width: 30 },
//     { header: "Final Status", dataKey: "finalStatus", width: 15 },
//     { header: "Size", dataKey: "size", width: 15 },
//     { header: "Measurement Point", dataKey: "measurementPoint", width: 70 },
//     { header: "Buyer Specs", dataKey: "buyerSpec", width: 20 },
//     { header: "TolMinus", dataKey: "tolMinus", width: 15 },
//     { header: "TolPlus", dataKey: "tolPlus", width: 15 },
//     { header: "Measure Value", dataKey: "measureValue", width: 20 },
//     { header: "Diff", dataKey: "diff", width: 15 },
//     { header: "Status", dataKey: "status", width: 15 }
//   ];

//   autoTable(doc, {
//     startY,
//     head: [columns.map((col) => col.header)],
//     body: tableData.map((row) => [
//       row.inspectionDate,
//       row.garmentNo,
//       row.finalStatus,
//       row.size,
//       row.measurementPoint,
//       row.buyerSpec,
//       row.tolMinus,
//       row.tolPlus,
//       row.measureValue,
//       row.diff,
//       row.status
//     ]),
//     theme: "grid",
//     columnStyles: columns.reduce(
//       (acc, col, idx) => ({
//         ...acc,
//         [idx]: {
//           cellWidth: col.width,
//           halign: idx === 4 ? "left" : "center",
//           valign: "middle"
//         }
//       }),
//       {}
//     ),
//     styles: {
//       font: "Roboto",
//       fontSize: 6, // Smaller font for body values
//       cellPadding: 1.5,
//       overflow: "linebreak",
//       lineColor: [150, 150, 150],
//       lineWidth: 0.1
//     },
//     headStyles: {
//       fillColor: [229, 231, 235],
//       textColor: [0, 0, 0],
//       fontSize: 8,
//       fontStyle: "bold",
//       halign: "center",
//       valign: "middle"
//     },
//     bodyStyles: {
//       fillColor: [255, 255, 255],
//       textColor: [0, 0, 0],
//       fontSize: 6
//     },
//     alternateRowStyles: {
//       fillColor: [245, 245, 245]
//     },
//     didParseCell: (data) => {
//       const row = tableData[data.row.index];
//       if (row) {
//         if (!row.isFirstPoint) {
//           if (data.column.index === 0) data.cell.text = "";
//           if (data.column.index === 1) data.cell.text = "";
//           if (data.column.index === 2) data.cell.text = "";
//           if (data.column.index === 3) data.cell.text = "";
//         }

//         if (data.column.index === 9) {
//           data.cell.styles.fillColor =
//             row.diff >= row.tolMinus && row.diff <= row.tolPlus
//               ? [220, 252, 231]
//               : [254, 226, 226];
//         }
//         if (data.column.index === 10) {
//           data.cell.styles.fillColor =
//             row.status === "Pass" ? [220, 252, 231] : [254, 226, 226];
//         }
//         if (data.column.index === 2 && row.isFirstPoint) {
//           data.cell.styles.fillColor =
//             row.finalStatus === "Pass" ? [220, 252, 231] : [254, 226, 226];
//           data.cell.styles.textColor =
//             row.finalStatus === "Pass" ? [34, 197, 94] : [239, 68, 68];
//           data.cell.styles.fontStyle = "bold";
//         }
//       }
//     },
//     didDrawCell: (data) => {
//       const row = tableData[data.row.index];
//       if (row && row.isFirstPoint && row.rowSpan > 1) {
//         // Inspection Date
//         if (data.column.index === 0) {
//           doc.rect(
//             data.cell.x,
//             data.cell.y,
//             data.cell.width,
//             data.cell.height * row.rowSpan,
//             "S"
//           );
//         }
//         // Garment No
//         if (data.column.index === 1) {
//           doc.rect(
//             data.cell.x,
//             data.cell.y,
//             data.cell.width,
//             data.cell.height * row.rowSpan,
//             "S"
//           );
//         }
//         // Final Status
//         if (data.column.index === 2) {
//           doc.rect(
//             data.cell.x,
//             data.cell.y,
//             data.cell.width,
//             data.cell.height * row.rowSpan,
//             "S"
//           );
//         }
//         // Size
//         if (data.column.index === 3) {
//           doc.rect(
//             data.cell.x,
//             data.cell.y,
//             data.cell.width,
//             data.cell.height * row.rowSpan,
//             "S"
//           );
//         }
//       }
//     }
//   });

//   return doc.lastAutoTable.finalY + 10;
// };

// export default InspectedSummaryPDF;

import autoTable from "jspdf-autotable";

const InspectedSummaryPDF = ({
  doc,
  startY,
  moNo,
  measurementDetails,
  sizeSpec,
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

  // Start a new page for the table
  doc.addPage();
  startY = 10; // Reset startY for new page

  doc.setFontSize(12);
  doc.text(`Inspected Summary for MO No: ${moNo}`, 14, startY);
  startY += 10;

  const tableData = [];
  const records = measurementDetails?.records || [];
  const sizeSpecData = sizeSpec || [];

  records.forEach((record, garmentIndex) => {
    const inspectionDate = new Date(record.created_at).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "2-digit", day: "2-digit" }
    );
    const inspectionTime = new Date(record.created_at).toLocaleTimeString(
      "en-US",
      { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }
    );
    const garmentNo = `${garmentIndex + 1}\n(Ref: "${
      record.reference_no
    }")\n${inspectionTime}`;
    const size = record.size || "N/A";

    const points = record.actual
      .map((actualItem, index) => {
        if (actualItem.value === 0) return null;
        const spec = sizeSpecData[index];
        if (!spec) return null;
        const measurementPoint = spec.EnglishRemark;
        const tolMinus = spec.ToleranceMinus.decimal;
        const tolPlus = spec.TolerancePlus.decimal;
        const buyerSpec =
          spec.Specs.find((s) => Object.keys(s)[0] === record.size)?.[
            record.size
          ]?.decimal || 0;
        const measureValue = actualItem.value;
        const diff = buyerSpec - measureValue;
        const lower = buyerSpec + tolMinus;
        const upper = buyerSpec + tolPlus;
        const status =
          measureValue >= lower && measureValue <= upper ? "Pass" : "Fail";
        return {
          measurementPoint,
          buyerSpec,
          tolMinus,
          tolPlus,
          measureValue,
          diff,
          status
        };
      })
      .filter((p) => p !== null);

    const overallStatus = points.every((p) => p.status === "Pass")
      ? "Pass"
      : "Fail";

    points.forEach((point, pointIndex) => {
      tableData.push({
        inspectionDate: pointIndex === 0 ? inspectionDate : "",
        garmentNo: pointIndex === 0 ? garmentNo : "",
        finalStatus: pointIndex === 0 ? overallStatus : "",
        size: pointIndex === 0 ? size : "",
        measurementPoint: point.measurementPoint,
        buyerSpec: decimalToFraction(point.buyerSpec),
        tolMinus: decimalToFraction(point.tolMinus),
        tolPlus: decimalToFraction(point.tolPlus),
        measureValue: point.measureValue.toFixed(3),
        diff: point.diff.toFixed(3),
        status: point.status,
        rowSpan: pointIndex === 0 ? points.length : 0,
        isFirstPoint: pointIndex === 0
      });
    });
  });

  const columns = [
    { header: "Inspection Date", dataKey: "inspectionDate", width: 20 },
    { header: "Garment NO", dataKey: "garmentNo", width: 30 },
    { header: "Final Status", dataKey: "finalStatus", width: 15 },
    { header: "Size", dataKey: "size", width: 15 },
    { header: "Measurement Point", dataKey: "measurementPoint", width: 70 },
    { header: "Buyer Specs", dataKey: "buyerSpec", width: 20 },
    { header: "TolMinus", dataKey: "tolMinus", width: 15 },
    { header: "TolPlus", dataKey: "tolPlus", width: 15 },
    { header: "Measure Value", dataKey: "measureValue", width: 20 },
    { header: "Diff", dataKey: "diff", width: 15 },
    { header: "Status", dataKey: "status", width: 15 }
  ];

  autoTable(doc, {
    startY,
    head: [columns.map((col) => col.header)],
    body: tableData.map((row) => [
      row.inspectionDate,
      row.garmentNo,
      row.finalStatus,
      row.size,
      row.measurementPoint,
      row.buyerSpec,
      row.tolMinus,
      row.tolPlus,
      row.measureValue,
      row.diff,
      row.status
    ]),
    theme: "grid",
    columnStyles: columns.reduce(
      (acc, col, idx) => ({
        ...acc,
        [idx]: {
          cellWidth: col.width,
          halign: idx === 4 ? "left" : "center",
          valign: "middle"
        }
      }),
      {}
    ),
    styles: {
      font: "Roboto",
      fontSize: 6, // Smaller font for body values
      cellPadding: 1.5,
      overflow: "linebreak",
      lineColor: [150, 150, 150],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [229, 231, 235],
      textColor: [0, 0, 0],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      valign: "middle"
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 6
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    didParseCell: (data) => {
      const row = tableData[data.row.index];
      if (row) {
        if (!row.isFirstPoint) {
          if (data.column.index === 0) data.cell.text = "";
          if (data.column.index === 1) data.cell.text = "";
          if (data.column.index === 2) data.cell.text = "";
          if (data.column.index === 3) data.cell.text = "";
        }

        if (data.column.index === 9) {
          data.cell.styles.fillColor =
            row.diff >= row.tolMinus && row.diff <= row.tolPlus
              ? [220, 252, 231]
              : [254, 226, 226];
        }
        if (data.column.index === 10) {
          data.cell.styles.fillColor =
            row.status === "Pass" ? [220, 252, 231] : [254, 226, 226];
        }
        if (data.column.index === 2 && row.isFirstPoint) {
          data.cell.styles.fillColor =
            row.finalStatus === "Pass" ? [220, 252, 231] : [254, 226, 226];
          data.cell.styles.textColor =
            row.finalStatus === "Pass" ? [34, 197, 94] : [239, 68, 68];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    didDrawCell: (data) => {
      const row = tableData[data.row.index];
      if (row && row.isFirstPoint && row.rowSpan > 1) {
        // Inspection Date
        if (data.column.index === 0) {
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height * row.rowSpan,
            "S"
          );
        }
        // Garment No
        if (data.column.index === 1) {
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height * row.rowSpan,
            "S"
          );
        }
        // Final Status
        if (data.column.index === 2) {
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height * row.rowSpan,
            "S"
          );
        }
        // Size
        if (data.column.index === 3) {
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height * row.rowSpan,
            "S"
          );
        }
      }
    }
  });

  return doc.lastAutoTable.finalY + 10;
};

export default InspectedSummaryPDF;
