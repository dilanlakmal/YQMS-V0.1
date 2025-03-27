import React from "react";
import QRCode from "react-qr-code"; // Use react-qr-code instead
import { useAuth } from "../../authentication/AuthContext";

const EmpQR = () => {
  const { user } = useAuth();

  if (!user || !user.emp_id) {
    return <div>No employee ID available to generate QR code.</div>;
  }

  // The QR code will encode the emp_id
  const qrValue = user.emp_id;

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-2">Employee QR Code</h2>
      <QRCode value={qrValue} height={128} width={128} />
      <p className="mt-2 text-sm text-gray-600">Emp ID: {qrValue}</p>
    </div>
  );
};

export default EmpQR;
