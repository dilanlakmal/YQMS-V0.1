import React, { useState, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Loader2,
  Package,
  Minus,
  Plus,
  Check,
  Clock,
  X,
  AlertCircle,
  Camera
} from "lucide-react";
import { useTranslation } from "react-i18next";

const QrCodeScanner = ({
  onScanSuccess,
  onScanError,
  autoAdd,
  isAdding,
  countdown,
  handleAddRecord,
  handleReset,
  scannedData,
  loadingData,
  passQtyIron,
  passQtyOPA,
  passQtyWash,
  passQtyPack,
  handlePassQtyChange,
  error,
  isIroningPage,
  isWashingPage,
  isPackingPage,
  isOPAPage,
  isDefectCard,
  hideScanner = false, // New prop to hide scanner when using upload
}) => {
  const { t } = useTranslation();
  // State from Scanner.jsx
  const [scanning, setScanning] = useState(false);
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);

  const selectDefaultCamera = useCallback((devices) => {
    if (devices && devices.length > 0) {
      const backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("environment")
      );
      if (backCamera) {
        setSelectedCameraId(backCamera.id);
        return;
      }
      if (devices.length > 1) {
        setSelectedCameraId(devices[devices.length - 1].id);
        return;
      }
      setSelectedCameraId(devices[0].id);
    }
  }, []);

  useEffect(() => {
    // Don't initialize camera if scanner is hidden
    if (hideScanner || html5QrCodeInstance) return;

    const instance = new Html5Qrcode("qr-reader");
    setHtml5QrCodeInstance(instance);

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          selectDefaultCamera(devices);
        }
      })
      .catch((err) => {
        onScanError(err.message || "Failed to access cameras");
      });
  }, [html5QrCodeInstance, onScanError, selectDefaultCamera, hideScanner]);

  useEffect(() => {
    return () => {
      if (html5QrCodeInstance && html5QrCodeInstance.isScanning) {
        html5QrCodeInstance
          .stop()
          .catch((err) =>
            console.error("Error stopping scanner on unmount:", err)
          );
      }
    };
  }, [html5QrCodeInstance]);

  const stopScanning = useCallback(async () => {
    if (html5QrCodeInstance && html5QrCodeInstance.isScanning) {
      try {
        await html5QrCodeInstance.stop();
      } catch (err) {
        console.error("Error while stopping the scanner:", err);
      } finally {
        setScanning(false);
      }
    }
  }, [html5QrCodeInstance]);

  const startScanning = useCallback(async () => {
    if (!html5QrCodeInstance || !selectedCameraId) {
      onScanError("Scanner not ready or no camera selected.");
      return;
    }

    setScanning(true);
    try {
      await html5QrCodeInstance.start(
        selectedCameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScanSuccess(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          /* Error callback for each frame, can be ignored */
        }
      );
    } catch (err) {
      onScanError(
        err.message ||
          "Failed to start scanning. Please check camera permissions."
      );
      setScanning(false);
    }
  }, [
    html5QrCodeInstance,
    selectedCameraId,
    onScanError,
    onScanSuccess,
    stopScanning
  ]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative border dark:border-gray-700 transition-colors duration-300">
      {/* Conditionally render scanner UI based on hideScanner prop */}
      {!hideScanner && (
        <>
          {/* Integrated Scanner UI */}
          <div
            id="qr-reader"
            className="mb-6 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 w-full h-[250px] bg-gray-300 dark:bg-gray-700 flex justify-center items-center transition-colors duration-300"
          ></div>

          {cameras.length > 1 && (
            <div className="flex justify-center mb-4">
              <select
                value={selectedCameraId || ""}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-300"
                disabled={scanning}
              >
                {cameras.map((camera, index) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-center mb-6">
            {!scanning ? (
              <button
                onClick={startScanning}
                disabled={!html5QrCodeInstance || !selectedCameraId}
                className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors duration-300 shadow-md hover:shadow-lg"
              >
                <Camera className="w-5 h-5" />
                {t("scan.start")}
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="bg-red-600 dark:bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 flex items-center gap-2 transition-colors duration-300 shadow-md hover:shadow-lg"
              >
                <X className="w-5 h-5" />
                {t("scan.stop")}
              </button>
            )}
          </div>
          {/* End of Integrated Scanner UI */}
        </>
      )}

      {/* Loading indicator - always show when loading */}
      {loadingData && (
        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mt-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-gray-700 dark:text-gray-300">{t("qrCodeScan.loading_bundle")}</p>
        </div>
      )}

      {/* Data display modal - always show when scannedData exists */}
      {scannedData && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-blue-50 dark:bg-gray-800 p-6 border border-blue-200 dark:border-gray-600 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl transition-colors duration-300">
            <div className="flex items-start gap-4">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div className="flex-grow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  {isDefectCard ? "Defect Card Details" : "Order Details"}
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-3 overflow-hidden">
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {isDefectCard ? "Defect Print ID" : "Bundle ID"}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {isDefectCard
                        ? scannedData.defect_print_id
                        : scannedData.bundle_id}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">MO Number</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {scannedData.selectedMono || scannedData.moNo}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Style</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{scannedData.custStyle}</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Buyer</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{scannedData.buyer}</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Color</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{scannedData.color}</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Size</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{scannedData.size}</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Factory</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{scannedData.factory}</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Line No</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{scannedData.lineNo}</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Count</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {isDefectCard
                        ? isOPAPage || isIroningPage || isWashingPage
                          ? scannedData.totalRejectGarmentCount || 0
                          : isPackingPage
                          ? scannedData.totalRejectGarment_Var || 0
                          : scannedData.count || 0
                        : scannedData.count || 0}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {isDefectCard ? "QC ID" : "Separator ID"}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {isDefectCard
                        ? scannedData.emp_id_inspection
                        : scannedData.emp_id}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {isDefectCard ? "Inspection Date" : "Registered Date"}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {isDefectCard
                        ? scannedData.inspection_date
                        : scannedData.updated_date_seperator}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {isDefectCard ? "Inspection Time" : "Registered Time"}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {isDefectCard
                        ? scannedData.inspection_time
                        : scannedData.updated_time_seperator}
                    </p>
                  </div>

                  {scannedData.sub_con === "Yes" && (
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Sub Con Factory Name
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {scannedData.sub_con_factory}
                      </p>
                    </div>
                  )}
                </div>

                {/* Horizontal Line Separator */}
                <hr className="my-6 border-gray-300 dark:border-gray-600" />

                {/* Pass Quantity Section */}
                {(isIroningPage || isOPAPage) && (
                  <div className="mt-4 bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                      {isIroningPage ? "Pass Iron Qty" : "Pass OPA Qty"}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          handlePassQtyChange(
                            (isIroningPage ? passQtyIron : passQtyOPA) - 1
                          )
                        }
                        className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300 shadow-sm"
                      >
                        <Minus className="w-6 h-6" />
                      </button>
                      <input
                        type="number"
                        value={isIroningPage ? passQtyIron : passQtyOPA}
                        onChange={(e) =>
                          handlePassQtyChange(Number(e.target.value))
                        }
                        className="w-20 text-lg text-center border border-gray-300 dark:border-gray-600 rounded-md py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-300"
                      />
                      <button
                        onClick={() =>
                          handlePassQtyChange(
                            (isIroningPage ? passQtyIron : passQtyOPA) + 1
                          )
                        }
                        className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300 shadow-sm"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}

                {isWashingPage && (
                  <div className="mt-4 bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">Pass Wash Qty</p>
                    <input
                      type="number"
                      value={passQtyWash}
                      readOnly
                      className="w-20 text-lg text-center border border-gray-300 dark:border-gray-600 rounded-md py-2 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                    />
                  </div>
                )}

                {isPackingPage && (
                  <div className="mt-4 bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">Pass Pack Qty</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePassQtyChange(passQtyPack - 1)}
                        className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-sm"
                        disabled={passQtyPack <= 0}
                      >
                        <Minus className="w-6 h-6" />
                      </button>
                      <input
                        type="number"
                        value={passQtyPack}
                        onChange={(e) =>
                          handlePassQtyChange(Number(e.target.value))
                        }
                        className="w-20 text-lg text-center border border-gray-300 dark:border-gray-600 rounded-md py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-300"
                        min="0"
                        max={
                          isDefectCard
                            ? scannedData.totalRejectGarment_Var ||
                              scannedData.count
                            : scannedData.count
                        }
                      />
                      <button
                        onClick={() => handlePassQtyChange(passQtyPack + 1)}
                        className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-sm"
                        disabled={
                          passQtyPack >=
                          (isDefectCard
                            ? scannedData.totalRejectGarment_Var ||
                              scannedData.count
                            : scannedData.count)
                        }
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center gap-4">
                  <button
                    onClick={() => {
                      handleAddRecord();
                      handleReset(); // Close the overlay after adding
                    }}
                    className={`px-6 py-3 rounded-md flex items-center gap-2 font-medium transition-all duration-300 shadow-md hover:shadow-lg ${
                      isAdding
                        ? "bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700"
                        : "bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700"
                    }`}
                  >
                    {autoAdd && isAdding ? (
                      <>
                        <Clock className="w-5 h-5" />
                        Adding ({countdown}s)
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        {autoAdd ? "Add Now" : "Add"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 rounded-md bg-gray-500 dark:bg-gray-600 text-white flex items-center gap-2 font-medium hover:bg-gray-600 dark:hover:bg-gray-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <X className="w-5 h-5" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrCodeScanner;
