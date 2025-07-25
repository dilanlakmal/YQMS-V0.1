import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { QrCode, X, Camera, Loader2 } from "lucide-react";

// Correct imports
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

const CuttingBarcodeReader = () => {
  const { t } = useTranslation();
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [error, setError] = useState("");
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // State to track if the scanner is actively trying to decode
  const [isScanningActive, setIsScanningActive] = useState(false);

  const codeReader = useRef(new BrowserMultiFormatReader());
  const controlsRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Only run the effect if the scanner modal is open and a camera is selected
    if (isScannerOpen && selectedDeviceId) {
      console.log(`Starting scanner for device: ${selectedDeviceId}`);
      setIsScanningActive(true);
      setError("");

      codeReader.current
        .decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              console.log("Barcode found!", result);
              setScannedBarcode(result.getText());
              closeScanner(); // This will also stop the stream
            }
            if (err && err instanceof NotFoundException) {
              return; // This is normal, just means no barcode was found
            }
            if (err) {
              console.error("An unexpected scanning error occurred:", err);
              setError(
                t(
                  "barcode.error.scanFailed",
                  "An unexpected error occurred during scanning."
                )
              );
            }
          }
        )
        .then((controls) => {
          console.log("Scanner controls initialized.");
          controlsRef.current = controls;
        })
        .catch((err) => {
          console.error("Failed to start video stream:", err);
          setError(
            t(
              "barcode.error.cameraError",
              "Could not access camera. Check permissions and ensure it is not in use."
            )
          );
          setIsScanningActive(false);
        });
    }

    // Cleanup function to stop the camera
    return () => {
      if (controlsRef.current) {
        console.log("Stopping scanner via cleanup.");
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScannerOpen, selectedDeviceId]);

  const openScanner = async () => {
    console.log("Attempting to open scanner...");
    setIsScannerOpen(true);
    setError("");
    setScannedBarcode("");
    try {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      console.log("Video devices found:", devices);
      setVideoInputDevices(devices);
      if (devices.length > 0) {
        const backCamera = devices.find((device) =>
          device.label.toLowerCase().includes("back")
        );
        const newDeviceId = backCamera
          ? backCamera.deviceId
          : devices[0].deviceId;
        console.log(`Selected device ID: ${newDeviceId}`);
        setSelectedDeviceId(newDeviceId);
      } else {
        setError(t("barcode.error.noCamera", "No cameras found."));
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError(
        t(
          "barcode.error.permissions",
          "Could not access cameras. Please grant permission in your browser."
        )
      );
      setIsScannerOpen(false);
    }
  };

  const closeScanner = () => {
    if (controlsRef.current) {
      console.log("Stopping scanner via close button.");
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setIsScannerOpen(false);
    setIsScanningActive(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mx-auto flex flex-col items-center">
      <button
        onClick={openScanner}
        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full"
      >
        <QrCode className="mr-3 h-5 w-5" />
        {t("barcode.scan", "Scan Barcode")}
      </button>

      <div className="mt-8 text-center w-full">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Scanned Barcode
        </h3>
        <div className="mt-2 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
          {scannedBarcode ? (
            <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white tracking-widest">
              {scannedBarcode}
            </p>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">
              Ready to scan
            </p>
          )}
        </div>
      </div>

      {isScannerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-4 relative">
            <button
              onClick={closeScanner}
              className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white z-10"
            >
              <X size={24} />
            </button>
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
              Point camera at barcode
            </h3>

            <div className="relative w-full">
              <video
                ref={videoRef}
                className="w-full h-auto rounded-md border border-gray-300 dark:border-gray-600"
              />
              {isScanningActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-20 rounded-md">
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                  <p className="text-white mt-2 font-semibold">Scanning...</p>
                </div>
              )}
            </div>

            {videoInputDevices.length > 1 && (
              <div className="mt-4 flex items-center">
                <label
                  htmlFor="camera-select"
                  className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <Camera size={16} className="inline mr-1" /> Camera:
                </label>
                <select
                  id="camera-select"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {videoInputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && (
              <p className="mt-4 text-center text-red-500 text-sm">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CuttingBarcodeReader;

// import React, { useState, useEffect, useRef } from "react";
// import { useTranslation } from "react-i18next";
// import { QrCode, X, Camera } from "lucide-react";
// import { BrowserMultiFormatReader } from "@zxing/browser";
// import { NotFoundException } from "@zxing/library";

// const CuttingBarcodeReader = () => {
//   const { t } = useTranslation();
//   const [scannedBarcode, setScannedBarcode] = useState("");
//   const [isScannerOpen, setIsScannerOpen] = useState(false);
//   const [error, setError] = useState("");
//   const [videoInputDevices, setVideoInputDevices] = useState([]);
//   const [selectedDeviceId, setSelectedDeviceId] = useState("");
//   const [isScanning, setIsScanning] = useState(false); // Track scanning state

//   const codeReader = useRef(new BrowserMultiFormatReader());
//   const videoRef = useRef(null);
//   const controlsRef = useRef(null);

//   // Effect to list available cameras when scanner opens
//   useEffect(() => {
//     if (isScannerOpen) {
//       const initializeCameras = async () => {
//         try {
//           const devices =
//             await BrowserMultiFormatReader.listVideoInputDevices();
//           if (devices.length === 0) {
//             setError(
//               t("barcode.error.noCamera", "No video input devices found.")
//             );
//             setIsScannerOpen(false);
//             return;
//           }
//           setVideoInputDevices(devices);
//           const backCamera = devices.find((device) =>
//             device.label.toLowerCase().includes("back")
//           );
//           setSelectedDeviceId(
//             backCamera ? backCamera.deviceId : devices[0].deviceId
//           );
//         } catch (err) {
//           console.error("Error accessing cameras:", err);
//           setError(
//             t(
//               "barcode.error.cameraAccess",
//               "Could not access camera. Please check permissions."
//             )
//           );
//           setIsScannerOpen(false);
//         }
//       };
//       initializeCameras();
//     }
//   }, [isScannerOpen, t]);

//   // Effect to start scanning when a device is selected
//   useEffect(() => {
//     if (isScannerOpen && selectedDeviceId && !isScanning) {
//       setError("");
//       setIsScanning(true);

//       codeReader.current
//         .decodeFromVideoDevice(
//           selectedDeviceId,
//           videoRef.current,
//           (result, err) => {
//             if (result) {
//               const barcodeText = result.getText();
//               // Validate 9/10-digit barcode
//               if (/^\d{9,10}$/.test(barcodeText)) {
//                 setScannedBarcode(barcodeText);
//                 setIsScanning(false); // Pause scanning but keep modal open
//               } else {
//                 setError(
//                   t(
//                     "barcode.error.invalidFormat",
//                     "Invalid barcode format. Expected 9 or 10 digits."
//                   )
//                 );
//               }
//             }
//             if (err && !(err instanceof NotFoundException)) {
//               console.error("Barcode scan error:", err);
//               setError(
//                 t(
//                   "barcode.error.scanFailed",
//                   "Failed to scan barcode. Please try again."
//                 )
//               );
//             }
//           }
//         )
//         .then((controls) => {
//           controlsRef.current = controls;
//         })
//         .catch((err) => {
//           console.error("Error initializing video device:", err);
//           setError(
//             t(
//               "barcode.error.cameraError",
//               "Could not access camera. Please check permissions."
//             )
//           );
//           setIsScanning(false);
//         });
//     }

//     // Cleanup on unmount or when dependencies change
//     return () => {
//       if (controlsRef.current) {
//         controlsRef.current.stop();
//         controlsRef.current = null;
//       }
//       setIsScanning(false);
//     };
//   }, [isScannerOpen, selectedDeviceId, t]);

//   const openScanner = () => {
//     setIsScannerOpen(true);
//     setScannedBarcode("");
//     setError("");
//   };

//   const closeScanner = () => {
//     if (controlsRef.current) {
//       controlsRef.current.stop();
//       controlsRef.current = null;
//     }
//     setIsScannerOpen(false);
//     setIsScanning(false);
//   };

//   const confirmScan = () => {
//     closeScanner();
//   };

//   return (
//     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mx-auto flex flex-col items-center">
//       <button
//         onClick={openScanner}
//         className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full"
//       >
//         <QrCode className="mr-3 h-5 w-5" />
//         {t("barcode.scan", "Scan Barcode")}
//       </button>

//       {/* Display Area for the Scanned Barcode */}
//       <div className="mt-8 text-center w-full">
//         <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//           Scanned Barcode
//         </h3>
//         <div className="mt-2 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
//           {scannedBarcode ? (
//             <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white tracking-widest">
//               {scannedBarcode}
//             </p>
//           ) : (
//             <p className="text-gray-400 dark:text-gray-500 italic">
//               Ready to scan
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Scanner Modal */}
//       {isScannerOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center">
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4 p-4 relative">
//             <button
//               onClick={closeScanner}
//               className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white z-10"
//             >
//               <X size={24} />
//             </button>
//             <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
//               Point camera at barcode
//             </h3>

//             <video
//               ref={videoRef}
//               className="w-full h-auto rounded-md border border-gray-300 dark:border-gray-600"
//             />

//             {scannedBarcode && (
//               <div className="mt-4 text-center">
//                 <p className="text-lg font-bold text-green-600">
//                   Scanned: {scannedBarcode}
//                 </p>
//                 <button
//                   onClick={confirmScan}
//                   className="mt-2 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//                 >
//                   Confirm
//                 </button>
//               </div>
//             )}

//             {videoInputDevices.length > 1 && (
//               <div className="mt-4 flex items-center">
//                 <label
//                   htmlFor="camera-select"
//                   className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300"
//                 >
//                   <Camera size={16} className="inline mr-1" /> Camera:
//                 </label>
//                 <select
//                   id="camera-select"
//                   value={selectedDeviceId}
//                   onChange={(e) => setSelectedDeviceId(e.target.value)}
//                   className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
//                 >
//                   {videoInputDevices.map((device) => (
//                     <option key={device.deviceId} value={device.deviceId}>
//                       {device.label || `Camera ${device.deviceId}`}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}
//             {error && (
//               <p className="mt-4 text-center text-red-500 text-sm">{error}</p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CuttingBarcodeReader;
