import React from "react";
import { jsPDF } from "jspdf";
import QRCode from "react-qr-code";

// Constants for PDF layout
const A4_WIDTH = 210; // A4 width in mm (portrait)
const A4_HEIGHT = 297; // A4 height in mm (portrait)
const QR_SIZE_MM = 20; // 2 cm x 2 cm for QR code
const QR_SIZE_PX = 72; // Approximate pixel size for 2 cm at 96 DPI (2 cm = 20 mm, 1 mm ≈ 3.6 px at 96 DPI)
const GRID_COLS = 8; // 8 QR codes per row
const GRID_ROWS = 10; // 10 rows per page
const MARGIN = 10; // 10 mm margin on all sides
const SPACING = 5; // 5 mm spacing between QR codes
const LABEL_HEIGHT = 5; // Height for Emp ID label below QR code (in mm)

// Function to convert QR code SVG to PNG data URL
const qrCodeToImage = (qrValue) => {
  return new Promise((resolve, reject) => {
    // Create a temporary container to render the QR code
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    // Render the QR code into the container
    const qrSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    qrSvg.setAttribute("width", QR_SIZE_PX.toString());
    qrSvg.setAttribute("height", QR_SIZE_PX.toString());
    container.appendChild(qrSvg);

    // Use react-qr-code to generate the SVG
    const qrCode = <QRCode value={qrValue} size={QR_SIZE_PX} />;
    const svgString = qrCode.props ? qrCode.props : null;

    if (!svgString) {
      document.body.removeChild(container);
      reject(new Error("Failed to generate QR code SVG"));
      return;
    }

    // Convert SVG to PNG
    const canvas = document.createElement("canvas");
    canvas.width = QR_SIZE_PX;
    canvas.height = QR_SIZE_PX;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = `data:image/svg+xml;base64,${btoa(
      new XMLSerializer().serializeToString(qrSvg)
    )}`;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, QR_SIZE_PX, QR_SIZE_PX);
      const imgData = canvas.toDataURL("image/png");
      document.body.removeChild(container);
      resolve(imgData);
    };
    img.onerror = (err) => {
      document.body.removeChild(container);
      reject(new Error("Failed to load QR code image: " + err.message));
    };
  });
};

const PDFEmpQR = ({ users }) => {
  const generatePDF = async () => {
    if (!users || users.length === 0) {
      alert("No users available to generate PDF.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Group users by sect_name
    const groupedUsers = users.reduce((acc, user) => {
      const sectName = user.sect_name || "No Section";
      if (!acc[sectName]) {
        acc[sectName] = [];
      }
      acc[sectName].push(user);
      return acc;
    }, {});

    let currentPage = 1;
    let currentRow = 0;
    let currentCol = 0;
    let yOffset = MARGIN;

    // Iterate over each section
    for (const sectName of Object.keys(groupedUsers)) {
      // Add section header
      if (currentRow !== 0 || currentCol !== 0) {
        doc.addPage();
        currentPage++;
        currentRow = 0;
        currentCol = 0;
        yOffset = MARGIN;
      }

      doc.setFontSize(14);
      doc.text(`Section: ${sectName}`, MARGIN, yOffset);
      yOffset += 10; // Space after section header

      const usersInSection = groupedUsers[sectName];

      // Iterate over users in the section
      for (const user of usersInSection) {
        // Calculate position
        const x = MARGIN + currentCol * (QR_SIZE_MM + SPACING);
        const y = yOffset + currentRow * (QR_SIZE_MM + LABEL_HEIGHT + SPACING);

        // If we've filled the current page, add a new page
        if (currentRow >= GRID_ROWS) {
          doc.addPage();
          currentPage++;
          currentRow = 0;
          currentCol = 0;
          yOffset = MARGIN;

          // Add section header again on the new page
          doc.setFontSize(14);
          doc.text(`Section: ${sectName} (Continued)`, MARGIN, yOffset);
          yOffset += 10;
        }

        try {
          // Generate QR code image
          const qrValue = user.emp_id;
          const imgData = await qrCodeToImage(qrValue);

          // Add QR code to PDF
          doc.addImage(imgData, "PNG", x, y, QR_SIZE_MM, QR_SIZE_MM);

          // Add Emp ID label below QR code
          doc.setFontSize(8);
          doc.text(user.emp_id, x + QR_SIZE_MM / 2, y + QR_SIZE_MM + 3, {
            align: "center"
          });
        } catch (error) {
          console.error(
            `Failed to generate QR code for ${user.emp_id}:`,
            error
          );
          // Add a placeholder text in case of failure
          doc.setFontSize(8);
          doc.text(
            `QR Error: ${user.emp_id}`,
            x + QR_SIZE_MM / 2,
            y + QR_SIZE_MM / 2,
            { align: "center" }
          );
        }

        // Update grid position
        currentCol++;
        if (currentCol >= GRID_COLS) {
          currentCol = 0;
          currentRow++;
        }
      }

      // Reset the grid for the next section
      currentRow = 0;
      currentCol = 0;
      yOffset = MARGIN;
    }

    // Save the PDF and trigger download
    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Employee_QR_Codes.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={generatePDF}
      className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
      disabled={users.length === 0} // Disable button if no users
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
        ></path>
      </svg>
      Download PDF
    </button>
  );
};

export default PDFEmpQR;
