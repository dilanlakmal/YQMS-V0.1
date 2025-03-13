// QrCodeScannerRepair.jsx
import React from "react";
import Scanner from "./Scanner"; // Assuming Scanner.jsx is in the same directory

const QrCodeScannerRepair = ({ onScanSuccess, onScanError }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <Scanner onScanSuccess={onScanSuccess} onScanError={onScanError} />
    </div>
  );
};

export default QrCodeScannerRepair;
