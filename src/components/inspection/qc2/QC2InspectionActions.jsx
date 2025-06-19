//---This component contains the primary action buttons for the inspection process.---//

import React from "react";
import { useTranslation } from "react-i18next";
import { Eye, QrCode, Printer } from "lucide-react";

const QC2InspectionActions = ({
  // State for button logic
  hasDefects,
  isReturnInspection,
  totalPass,
  selectedGarment,
  rejectedGarmentNumbers,
  qrCodesData,
  isPassingBundle,
  rejectedOnce,
  passBundleCountdown,
  defectQty,
  generateQRDisabled,
  isBluetoothConnected,
  printing,

  // Handlers
  handleRejectGarment,
  handlePassBundle,
  handleGenerateQRCodes,
  handlePrintQRCode,
  setShowQRPreview
}) => {
  const { t } = useTranslation();

  const isRejectDisabled =
    !hasDefects ||
    (isReturnInspection && totalPass <= 0) ||
    (isReturnInspection &&
      selectedGarment &&
      rejectedGarmentNumbers.has(selectedGarment));

  // --- Simplified the `isPassDisabled` logic. ---

  const isPassDisabled =
    isPassingBundle ||
    (isReturnInspection
      ? hasDefects || rejectedOnce
      : (hasDefects && !rejectedOnce) ||
        // Check if there are rejected garments that require a QR code to be generated.
        (rejectedOnce && qrCodesData.bundle.length === 0) ||
        printing);

  // --- Simplified `passButtonClass` logic. ---
  // The complex check for `qrCodesData.garment[0]?.checkedQty` is removed.

  const passButtonClass = isPassDisabled
    ? "bg-gray-300 cursor-not-allowed"
    : defectQty > 0
    ? "bg-yellow-500 hover:bg-yellow-600" // If there are defects, button is yellow
    : "bg-green-600 hover:bg-green-700"; // If no defects, button is green

  return (
    <>
      {/* Left-side Actions */}
      <div className="w-1/6 h-32 flex flex-col justify-center items-center space-y-2">
        <button
          onClick={handleRejectGarment}
          disabled={isRejectDisabled}
          className={`px-2 md:px-4 py-2 rounded ${
            isRejectDisabled
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {t("qc2In.reject_garment")}
        </button>
        {!isReturnInspection && (
          // --- FIX: Logic now only depends on `qrCodesData.bundle`. ---
          <button
            onClick={() => setShowQRPreview(true)}
            disabled={qrCodesData.bundle.length === 0}
            className={`p-2 md:p-2 rounded ${
              qrCodesData.bundle.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            title="Preview QR"
          >
            <Eye className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Placeholder for the Dashboard */}

      {/* Right-side Actions */}
      <div className="w-1/6 h-32 flex flex-col justify-center items-center space-y-2">
        <button
          onClick={handlePassBundle}
          disabled={isPassDisabled}
          className={`px-2 md:px-4 py-1 md:py-2 rounded ${passButtonClass} text-white`}
        >
          {t("qc2In.pass_bundle")}{" "}
          {passBundleCountdown !== null ? `(${passBundleCountdown}s)` : ""}
        </button>
        {!isReturnInspection && (
          <div className="flex space-x-1">
            <button
              onClick={handleGenerateQRCodes}
              disabled={!defectQty || generateQRDisabled}
              className={`p-2 md:p-2 rounded ${
                !defectQty || generateQRDisabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              title={t("bundle.generate_qr")}
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrintQRCode}
              // --- Logic now only depends on `qrCodesData.bundle`. ---
              disabled={
                !isBluetoothConnected ||
                qrCodesData.bundle.length === 0 ||
                printing
              }
              className={`p-2 md:p-2 rounded ${
                !isBluetoothConnected ||
                qrCodesData.bundle.length === 0 ||
                printing
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              title={t("bundle.print_qr")}
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default QC2InspectionActions;
