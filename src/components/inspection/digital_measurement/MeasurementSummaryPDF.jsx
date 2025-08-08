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
