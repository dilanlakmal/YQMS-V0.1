import React from "react";
import Scanner from "./Scanner";

const QrCodeScannerRepair = ({ onScanSuccess, onScanError }) => {
  return <Scanner onScanSuccess={onScanSuccess} onScanError={onScanError} />;
};

export default QrCodeScannerRepair;
