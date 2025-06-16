// import { Check, Clock, Loader2, Minus, Package, Plus, X } from "lucide-react";
// import React from "react";
// import Scanner from "./Scanner";

// const QrCodeScanner = ({
//   onScanSuccess,
//   onScanError,
//   autoAdd,
//   isAdding,
//   countdown,
//   handleAddRecord,
//   handleReset,
//   scannedData,
//   loadingData,
//   passQtyIron,
//   passQtyOPA,
//   passQtyWash,
//   passQtyPack,
//   handlePassQtyChange,
//   isIroningPage,
//   isWashingPage,
//   isPackingPage,
//   isOPAPage,
//   isDefectCard
// }) => {
//   return (
//     <div className="bg-white p-6 rounded-lg shadow-lg relative">
//       <Scanner
//         onScanSuccess={onScanSuccess}
//         onScanError={onScanError}
//         continuous={true}
//       />

//       {loadingData && (
//         <div className="flex items-center justify-center gap-2 text-blue-600 mt-4">
//           <Loader2 className="w-5 h-5 animate-spin" />
//           <p>Loading data...</p>
//         </div>
//       )}

//       {scannedData && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-blue-50 p-6 border border-blue-200 rounded-lg max-w-2xl w-full mx-4">
//             <div className="flex items-start gap-4">
//               <Package className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
//               <div className="flex-grow">
//                 <h2 className="text-xl font-semibold text-gray-800 mb-4">
//                   {isDefectCard ? "Defect Card Details" : "Order Details"}
//                 </h2>
//                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-3 overflow-hidden">
//                   <div>
//                     <p className="text-sm text-gray-600">
//                       {isDefectCard ? "Defect Print ID" : "Bundle ID"}
//                     </p>
//                     <p className="font-medium">
//                       {isDefectCard
//                         ? scannedData.defect_print_id
//                         : scannedData.bundle_id}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">MO Number</p>
//                     <p className="font-medium">
//                       {scannedData.selectedMono || scannedData.moNo}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Style</p>
//                     <p className="font-medium">{scannedData.custStyle}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Buyer</p>
//                     <p className="font-medium">{scannedData.buyer}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Color</p>
//                     <p className="font-medium">{scannedData.color}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Size</p>
//                     <p className="font-medium">{scannedData.size}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Factory</p>
//                     <p className="font-medium">{scannedData.factory}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Line No</p>
//                     <p className="font-medium">{scannedData.lineNo}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Count</p>
//                     <p className="font-medium">
//                       {isDefectCard
//                         ? isOPAPage || isIroningPage || isWashingPage
//                           ? scannedData.totalRejectGarmentCount || 0
//                           : isPackingPage
//                           ? scannedData.totalRejectGarment_Var || 0
//                           : scannedData.count || 0
//                         : scannedData.count || 0}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">
//                       {isDefectCard ? "QC ID" : "Separator ID"}
//                     </p>
//                     <p className="font-medium">
//                       {isDefectCard
//                         ? scannedData.emp_id_inspection
//                         : scannedData.emp_id}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">
//                       {isDefectCard ? "Inspection Date" : "Registered Date"}
//                     </p>
//                     <p className="font-medium">
//                       {isDefectCard
//                         ? scannedData.inspection_date
//                         : scannedData.updated_date_seperator}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">
//                       {isDefectCard ? "Inspection Time" : "Registered Time"}
//                     </p>
//                     <p className="font-medium">
//                       {isDefectCard
//                         ? scannedData.inspection_time
//                         : scannedData.updated_time_seperator}
//                     </p>
//                   </div>
//                   {scannedData.sub_con === "Yes" && (
//                     <div>
//                       <p className="text-sm text-gray-600">
//                         Sub Con Factory Name
//                       </p>
//                       <p className="font-medium">
//                         {scannedData.sub_con_factory}
//                       </p>
//                     </div>
//                   )}
//                 </div>

//                 {/* Horizontal Line Separator */}
//                 <hr className="my-6 border-gray-300" />

//                 {/* Pass Quantity Section */}
//                 {(isIroningPage || isOPAPage) && (
//                   <div className="mt-4">
//                     <p className="text-sm text-gray-600 mb-2">
//                       {isIroningPage ? "Pass Iron Qty" : "Pass OPA Qty"}
//                     </p>
//                     <div className="flex items-center gap-3">
//                       <button
//                         onClick={() =>
//                           handlePassQtyChange(
//                             (isIroningPage ? passQtyIron : passQtyOPA) - 1
//                           )
//                         }
//                         className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
//                       >
//                         <Minus className="w-6 h-6" />
//                       </button>
//                       <input
//                         type="number"
//                         value={isIroningPage ? passQtyIron : passQtyOPA}
//                         onChange={(e) =>
//                           handlePassQtyChange(Number(e.target.value))
//                         }
//                         className="w-20 text-lg text-center border border-gray-300 rounded-md py-2"
//                       />
//                       <button
//                         onClick={() =>
//                           handlePassQtyChange(
//                             (isIroningPage ? passQtyIron : passQtyOPA) + 1
//                           )
//                         }
//                         className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
//                       >
//                         <Plus className="w-6 h-6" />
//                       </button>
//                     </div>
//                   </div>
//                 )}

//                 {isWashingPage && (
//                   <div className="mt-4">
//                     <p className="text-sm text-gray-600 mb-2">Pass Wash Qty</p>
//                     <input
//                       type="number"
//                       value={passQtyWash}
//                       readOnly
//                       className="w-20 text-lg text-center border border-gray-300 rounded-md py-2 bg-gray-100"
//                     />
//                   </div>
//                 )}

//                 {isPackingPage && (
//                   <div className="mt-4">
//                     <p className="text-sm text-gray-600 mb-2">Pass Pack Qty</p>
//                     <div className="flex items-center gap-3">
//                       <button
//                         onClick={() => handlePassQtyChange(passQtyPack - 1)}
//                         className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
//                         disabled={passQtyPack <= 0}
//                       >
//                         <Minus className="w-6 h-6" />
//                       </button>
//                       <input
//                         type="number"
//                         value={passQtyPack}
//                         onChange={(e) =>
//                           handlePassQtyChange(Number(e.target.value))
//                         }
//                         className="w-20 text-lg text-center border border-gray-300 rounded-md py-2"
//                         min="0"
//                         max={
//                           isDefectCard
//                             ? scannedData.totalRejectGarment_Var ||
//                               scannedData.count
//                             : scannedData.count
//                         }
//                       />
//                       <button
//                         onClick={() => handlePassQtyChange(passQtyPack + 1)}
//                         className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
//                         disabled={
//                           passQtyPack >=
//                           (isDefectCard
//                             ? scannedData.totalRejectGarment_Var ||
//                               scannedData.count
//                             : scannedData.count)
//                         }
//                       >
//                         <Plus className="w-6 h-6" />
//                       </button>
//                     </div>
//                   </div>
//                 )}

//                 <div className="mt-6 flex items-center gap-4">
//                   <button
//                     onClick={() => {
//                       handleAddRecord();
//                       handleReset(); // Close the overlay after adding
//                     }}
//                     className={`px-4 py-2 rounded-md flex items-center gap-2 ${
//                       isAdding
//                         ? "bg-blue-500 text-white"
//                         : "bg-green-500 text-white"
//                     }`}
//                   >
//                     {autoAdd && isAdding ? (
//                       <>
//                         <Clock className="w-5 h-5" />
//                         Adding ({countdown}s)
//                       </>
//                     ) : (
//                       <>
//                         <Check className="w-5 h-5" />
//                         {autoAdd ? "Add Now" : "Add"}
//                       </>
//                     )}
//                   </button>
//                   <button
//                     onClick={handleReset}
//                     className="px-4 py-2 rounded-md bg-gray-500 text-white flex items-center gap-2"
//                   >
//                     <X className="w-5 h-5" />
//                     Reset
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default QrCodeScanner;

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
  isDefectCard
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
    if (html5QrCodeInstance) return;

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
  }, [html5QrCodeInstance, onScanError, selectDefaultCamera]);

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
    <div className="bg-white p-6 rounded-lg shadow-lg relative">
      {/* Integrated Scanner UI */}
      <div
        id="qr-reader"
        className="mb-6 rounded-lg overflow-hidden border-2 border-gray-300 w-full h-[250px] bg-gray-300 flex justify-center items-center"
      ></div>
      {cameras.length > 1 && (
        <div className="flex justify-center mb-4">
          <select
            value={selectedCameraId || ""}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm bg-white"
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
        {" "}
        {/* Added mb-6 for spacing */}
        {!scanning ? (
          <button
            onClick={startScanning}
            disabled={!html5QrCodeInstance || !selectedCameraId}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400"
          >
            <Camera className="w-5 h-5" />
            {t("scan.start")}
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            {t("scan.stop")}
          </button>
        )}
      </div>
      {/* End of Integrated Scanner UI */}
      {loadingData && (
        <div className="flex items-center justify-center gap-2 text-blue-600 mt-4">
          <Loader2 className="w-5 h-5 animate-spin" />

          <p>{t("qrCodeScan.loading_bundle")}</p>
        </div>
      )}

      {scannedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-blue-50 p-6 border border-blue-200 rounded-lg max-w-2xl w-full mx-4">
            <div className="flex items-start gap-4">
              <Package className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-grow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {isDefectCard ? "Defect Card Details" : "Order Details"}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-3 overflow-hidden">
                  <div>
                    <p className="text-sm text-gray-600">
                      {isDefectCard ? "Defect Print ID" : "Bundle ID"}
                    </p>
                    <p className="font-medium">
                      {isDefectCard
                        ? scannedData.defect_print_id
                        : scannedData.bundle_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">MO Number</p>
                    <p className="font-medium">
                      {scannedData.selectedMono || scannedData.moNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Style</p>
                    <p className="font-medium">{scannedData.custStyle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Buyer</p>
                    <p className="font-medium">{scannedData.buyer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Color</p>
                    <p className="font-medium">{scannedData.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Size</p>
                    <p className="font-medium">{scannedData.size}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Factory</p>
                    <p className="font-medium">{scannedData.factory}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Line No</p>
                    <p className="font-medium">{scannedData.lineNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Count</p>
                    <p className="font-medium">
                      {isDefectCard
                        ? isOPAPage || isIroningPage || isWashingPage
                          ? scannedData.totalRejectGarmentCount || 0
                          : isPackingPage
                          ? scannedData.totalRejectGarment_Var || 0
                          : scannedData.count || 0
                        : scannedData.count || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {isDefectCard ? "QC ID" : "Separator ID"}
                    </p>
                    <p className="font-medium">
                      {isDefectCard
                        ? scannedData.emp_id_inspection
                        : scannedData.emp_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {isDefectCard ? "Inspection Date" : "Registered Date"}
                    </p>
                    <p className="font-medium">
                      {isDefectCard
                        ? scannedData.inspection_date
                        : scannedData.updated_date_seperator}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {isDefectCard ? "Inspection Time" : "Registered Time"}
                    </p>
                    <p className="font-medium">
                      {isDefectCard
                        ? scannedData.inspection_time
                        : scannedData.updated_time_seperator}
                    </p>
                  </div>
                  {scannedData.sub_con === "Yes" && (
                    <div>
                      <p className="text-sm text-gray-600">
                        Sub Con Factory Name
                      </p>
                      <p className="font-medium">
                        {scannedData.sub_con_factory}
                      </p>
                    </div>
                  )}
                </div>

                {/* Horizontal Line Separator */}
                <hr className="my-6 border-gray-300" />

                {/* Pass Quantity Section */}
                {(isIroningPage || isOPAPage) && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {isIroningPage ? "Pass Iron Qty" : "Pass OPA Qty"}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          handlePassQtyChange(
                            (isIroningPage ? passQtyIron : passQtyOPA) - 1
                          )
                        }
                        className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        <Minus className="w-6 h-6" />
                      </button>
                      <input
                        type="number"
                        value={isIroningPage ? passQtyIron : passQtyOPA}
                        onChange={(e) =>
                          handlePassQtyChange(Number(e.target.value))
                        }
                        className="w-20 text-lg text-center border border-gray-300 rounded-md py-2"
                      />
                      <button
                        onClick={() =>
                          handlePassQtyChange(
                            (isIroningPage ? passQtyIron : passQtyOPA) + 1
                          )
                        }
                        className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}

                {isWashingPage && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Pass Wash Qty</p>
                    <input
                      type="number"
                      value={passQtyWash}
                      readOnly
                      className="w-20 text-lg text-center border border-gray-300 rounded-md py-2 bg-gray-100"
                    />
                  </div>
                )}

                {isPackingPage && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Pass Pack Qty</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePassQtyChange(passQtyPack - 1)}
                        className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                        className="w-20 text-lg text-center border border-gray-300 rounded-md py-2"
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
                        className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                      isAdding
                        ? "bg-blue-500 text-white"
                        : "bg-green-500 text-white"
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
                    className="px-4 py-2 rounded-md bg-gray-500 text-white flex items-center gap-2"
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
