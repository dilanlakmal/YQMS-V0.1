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
  printMethod,
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

  const isPassDisabled =
    isPassingBundle ||
    (isReturnInspection
      ? hasDefects || rejectedOnce
      : (hasDefects && !rejectedOnce) ||
        (rejectedOnce &&
          (printMethod === "garment" || printMethod === "bundle") &&
          qrCodesData.garment.length === 0) ||
        printing);

  const passButtonClass = isPassDisabled
    ? "bg-gray-300 cursor-not-allowed"
    : totalPass <
        (isReturnInspection
          ? qrCodesData.garment[0]?.checkedQty || 0
          : qrCodesData.garment[0]?.checkedQty || 0) && defectQty > 0
    ? "bg-yellow-500 hover:bg-yellow-600"
    : "bg-green-600 hover:bg-green-700";

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
          <button
            onClick={() => setShowQRPreview(true)}
            disabled={qrCodesData[printMethod].length === 0}
            className={`p-2 md:p-2 rounded ${
              qrCodesData[printMethod].length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            title="Preview QR"
          >
            <Eye className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Placeholder for the Dashboard which will be passed as a child */}
      {/* The dashboard component is rendered between left and right actions in the parent */}

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
              disabled={
                !isBluetoothConnected ||
                qrCodesData[printMethod].length === 0 ||
                printing
              }
              className={`p-2 md:p-2 rounded ${
                !isBluetoothConnected ||
                qrCodesData[printMethod].length === 0 ||
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
