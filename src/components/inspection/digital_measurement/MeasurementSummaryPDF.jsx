// import React from "react";
// import { Text, View } from "@react-pdf/renderer";

// const MeasurementSummaryPDF = ({ measurementSummary, styles }) => {
//   return (
//     <>
//       <Text style={styles.subtitle}>Measurement Summary</Text>
//       <View style={styles.table}>
//         <View style={styles.tableRow}>
//           {[
//             "MO No",
//             "Cust. Style",
//             "Buyer",
//             "Country",
//             "Origin",
//             "Mode",
//             "Order Qty",
//             "Inspected Qty",
//             "Total Pass",
//             "Total Reject",
//             "Pass Rate"
//           ].map((header) => (
//             <Text
//               key={header}
//               style={[
//                 styles.tableHeader,
//                 { flex: header === "MO No" ? 1.5 : 1 }
//               ]}
//             >
//               {header}
//             </Text>
//           ))}
//         </View>
//         {measurementSummary.length > 0 ? (
//           measurementSummary.map((item, index) => (
//             <View key={index} style={styles.tableRow}>
//               <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.moNo}</Text>
//               <Text style={styles.tableCell}>{item.custStyle || "N/A"}</Text>
//               <Text style={styles.tableCell}>{item.buyer || "N/A"}</Text>
//               <Text style={styles.tableCell}>{item.country || "N/A"}</Text>
//               <Text style={styles.tableCell}>{item.origin || "N/A"}</Text>
//               <Text style={styles.tableCell}>{item.mode || "N/A"}</Text>
//               <Text style={styles.tableCell}>{item.orderQty}</Text>
//               <Text style={styles.tableCell}>{item.inspectedQty}</Text>
//               <Text style={styles.tableCell}>{item.totalPass}</Text>
//               <Text style={styles.tableCell}>{item.totalReject}</Text>
//               <Text style={styles.tableCell}>{item.passRate}%</Text>
//             </View>
//           ))
//         ) : (
//           <View style={styles.tableRow}>
//             <Text style={[styles.tableCell, { flex: 11 }]}>
//               No data available
//             </Text>
//           </View>
//         )}
//       </View>
//     </>
//   );
// };

// export default MeasurementSummaryPDF;

// import React from "react";
// import autoTable from "jspdf-autotable";

// const MeasurementSummaryPDF = ({ doc, startY, measurementSummary }) => {
//   const columns = [
//     { header: "MO No", dataKey: "moNo", width: 30 },
//     { header: "Cust. Style", dataKey: "custStyle", width: 30 },
//     { header: "Buyer", dataKey: "buyer", width: 30 },
//     { header: "Country", dataKey: "country", width: 30 },
//     { header: "Origin", dataKey: "origin", width: 20 },
//     { header: "Mode", dataKey: "mode", width: 20 },
//     { header: "Order Qty", dataKey: "orderQty", width: 20 },
//     { header: "Inspected Qty", dataKey: "inspectedQty", width: 20 },
//     { header: "Total Pass", dataKey: "totalPass", width: 20 },
//     { header: "Total Reject", dataKey: "totalReject", width: 20 },
//     { header: "Pass Rate", dataKey: "passRate", width: 20 }
//   ];

//   const data =
//     measurementSummary.length > 0
//       ? measurementSummary.map((item) => ({
//           moNo: item.moNo,
//           custStyle: item.custStyle || "N/A",
//           buyer: item.buyer || "N/A",
//           country: item.country || "N/A",
//           origin: item.origin || "N/A",
//           mode: item.mode || "N/A",
//           orderQty: item.orderQty,
//           inspectedQty: item.inspectedQty,
//           totalPass: item.totalPass,
//           totalReject: item.totalReject,
//           passRate: `${item.passRate}%`
//         }))
//       : [
//           {
//             moNo: "No data available",
//             custStyle: "",
//             buyer: "",
//             country: "",
//             origin: "",
//             mode: "",
//             orderQty: "",
//             inspectedQty: "",
//             totalPass: "",
//             totalReject: "",
//             passRate: ""
//           }
//         ];

//   doc.setFontSize(12);
//   doc.text("Measurement Summary", 14, startY);
//   startY += 10;

//   autoTable(doc, {
//     startY,
//     head: [columns.map((col) => col.header)],
//     body: data.map((row) => columns.map((col) => row[col.dataKey])),
//     columnStyles: columns.reduce(
//       (acc, col, idx) => ({
//         ...acc,
//         [idx]: { cellWidth: col.width, halign: "center" }
//       }),
//       {}
//     ),
//     styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
//     headStyles: {
//       fillColor: [226, 232, 240],
//       textColor: [0, 0, 0],
//       fontStyle: "bold",
//       halign: "center"
//     }
//   });

//   return doc.lastAutoTable.finalY + 10;
// };

// export default MeasurementSummaryPDF;

// import React from "react";
// import autoTable from "jspdf-autotable";

// const MeasurementSummaryPDF = ({ doc, startY, measurementSummary }) => {
//   // Ensure font is set to Roboto, fallback to Helvetica if not available
//   try {
//     doc.setFont("Roboto", "normal");
//   } catch (error) {
//     console.warn(
//       "Roboto font not available, falling back to Helvetica:",
//       error
//     );
//     doc.setFont("Helvetica", "normal");
//   }

//   const columns = [
//     { header: "MO No", dataKey: "moNo", width: 30 },
//     { header: "Cust. Style", dataKey: "custStyle", width: 30 },
//     { header: "Buyer", dataKey: "buyer", width: 30 },
//     { header: "Country", dataKey: "country", width: 30 },
//     { header: "Origin", dataKey: "origin", width: 20 },
//     { header: "Mode", dataKey: "mode", width: 20 },
//     { header: "Order Qty", dataKey: "orderQty", width: 20 },
//     { header: "Inspected Qty", dataKey: "inspectedQty", width: 20 },
//     { header: "Total Pass", dataKey: "totalPass", width: 20 },
//     { header: "Total Reject", dataKey: "totalReject", width: 20 },
//     { header: "Pass Rate", dataKey: "passRate", width: 20 }
//   ];

//   const data =
//     measurementSummary.length > 0
//       ? measurementSummary.map((item) => ({
//           moNo: item.moNo,
//           custStyle: item.custStyle || "N/A",
//           buyer: item.buyer || "N/A",
//           country: item.country || "N/A",
//           origin: item.origin || "N/A",
//           mode: item.mode || "N/A",
//           orderQty: item.orderQty,
//           inspectedQty: item.inspectedQty,
//           totalPass: item.totalPass,
//           totalReject: item.totalReject,
//           passRate: `${item.passRate}%`
//         }))
//       : [
//           {
//             moNo: "No data available",
//             custStyle: "",
//             buyer: "",
//             country: "",
//             origin: "",
//             mode: "",
//             orderQty: "",
//             inspectedQty: "",
//             totalPass: "",
//             totalReject: "",
//             passRate: ""
//           }
//         ];

//   doc.setFontSize(12);
//   doc.text("Measurement Summary", 14, startY);
//   startY += 10;

//   autoTable(doc, {
//     startY,
//     head: [columns.map((col) => col.header)],
//     body: data.map((row) => columns.map((col) => row[col.dataKey])),
//     theme: "grid",
//     columnStyles: columns.reduce(
//       (acc, col, idx) => ({
//         ...acc,
//         [idx]: { cellWidth: col.width, halign: "center", valign: "middle" }
//       }),
//       {}
//     ),
//     styles: {
//       font: "Roboto",
//       fontSize: 8,
//       cellPadding: 1.5,
//       overflow: "linebreak",
//       textColor: [0, 0, 0],
//       lineColor: [150, 150, 150], // Gray border
//       lineWidth: 0.1
//     },
//     headStyles: {
//       fillColor: [229, 231, 235], // Tailwind bg-gray-200
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
//       fillColor: [245, 245, 245] // Slight gray for alternate rows
//     }
//   });

//   return doc.lastAutoTable.finalY + 10;
// };

// export default MeasurementSummaryPDF;

//New code
import React from "react";
import autoTable from "jspdf-autotable";

const MeasurementSummaryPDF = ({ doc, startY, measurementSummary }) => {
  try {
    doc.setFont("Roboto", "normal");
  } catch (error) {
    console.warn(
      "Roboto font not available, falling back to Helvetica:",
      error
    );
    doc.setFont("Helvetica", "normal");
  }

  const columns = [
    { header: "MO No", dataKey: "moNo", width: 30 },
    { header: "Cust. Style", dataKey: "custStyle", width: 30 },
    { header: "Buyer", dataKey: "buyer", width: 30 },
    { header: "Country", dataKey: "country", width: 30 },
    { header: "Origin", dataKey: "origin", width: 20 },
    { header: "Mode", dataKey: "mode", width: 20 },
    { header: "Order Qty", dataKey: "orderQty", width: 20 },
    { header: "Inspected Qty", dataKey: "inspectedQty", width: 20 },
    { header: "Total Pass", dataKey: "totalPass", width: 20 },
    { header: "Total Reject", dataKey: "totalReject", width: 20 },
    { header: "Pass Rate", dataKey: "passRate", width: 20 }
  ];

  const data =
    measurementSummary.length > 0
      ? measurementSummary.map((item) => ({
          moNo: item.moNo,
          custStyle: item.custStyle || "N/A",
          buyer: item.buyer || "N/A",
          country: item.country || "N/A",
          origin: item.origin || "N/A",
          mode: item.mode || "N/A",
          orderQty: item.orderQty,
          inspectedQty: item.inspectedQty,
          totalPass: item.totalPass,
          totalReject: item.totalReject,
          passRate: `${item.passRate}%`
        }))
      : [
          {
            moNo: "No data available",
            custStyle: "",
            buyer: "",
            country: "",
            origin: "",
            mode: "",
            orderQty: "",
            inspectedQty: "",
            totalPass: "",
            totalReject: "",
            passRate: ""
          }
        ];

  doc.setFontSize(12);
  doc.text("Measurement Summary", 14, startY);
  startY += 10;

  autoTable(doc, {
    startY,
    head: [columns.map((col) => col.header)],
    body: data.map((row) => columns.map((col) => row[col.dataKey])),
    theme: "grid",
    columnStyles: columns.reduce(
      (acc, col, idx) => ({
        ...acc,
        [idx]: { cellWidth: col.width, halign: "center", valign: "middle" }
      }),
      {}
    ),
    styles: {
      font: "Roboto",
      fontSize: 8,
      cellPadding: 1.5,
      overflow: "linebreak",
      textColor: [0, 0, 0],
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
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  return doc.lastAutoTable.finalY + 10;
};

export default MeasurementSummaryPDF;
