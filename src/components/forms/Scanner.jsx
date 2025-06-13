// import { Html5Qrcode } from "html5-qrcode";
// import { Camera, X } from "lucide-react";
// import React, { useEffect, useState } from "react";

// const Scanner = ({ onScanSuccess, onScanError }) => {
//   const [scanning, setScanning] = useState(false);
//   const [html5QrCode, setHtml5QrCode] = useState(null);
//   const [cameras, setCameras] = useState([]);
//   const [selectedCameraId, setSelectedCameraId] = useState(null);

//   useEffect(() => {
//     const scanner = new Html5Qrcode("qr-reader");
//     setHtml5QrCode(scanner);

//     const fetchCameras = async () => {
//       try {
//         const devices = await Html5Qrcode.getCameras();
//         setCameras(devices);

//         if (devices.length > 0) {
//           const defaultCamera = getDefaultCamera(devices);
//           setSelectedCameraId(defaultCamera.id);
//         }
//       } catch (err) {
//         onScanError(err.message || "Failed to access cameras");
//       }
//     };

//     fetchCameras();

//     return () => {
//       if (scanner.isScanning) {
//         scanner.stop();
//       }
//     };
//   }, [onScanError]);

//   const getDefaultCamera = (devices) => {
//     const isMobile = /Mobi|Android/i.test(navigator.userAgent);
//     if (isMobile && devices.length > 1) {
//       // Select the back camera for mobile devices
//       return (
//         devices.find((device) => device.label.toLowerCase().includes("back")) ||
//         devices[1]
//       );
//     }
//     // Default to the first camera for desktops/laptops or if only one camera is available
//     return devices[0];
//   };

//   const startScanning = async () => {
//     if (!html5QrCode || !selectedCameraId) return;

//     try {
//       setScanning(true);

//       await html5QrCode.start(
//         selectedCameraId,
//         {
//           fps: 10,
//           qrbox: { width: 250, height: 250 },
//         },
//         (decodedText) => {
//           onScanSuccess(decodedText);
//           stopScanning();
//         },
//         (errorMessage) => {
//           console.log(errorMessage);
//         }
//       );
//     } catch (err) {
//       onScanError(err.message || "Failed to start scanning");
//       setScanning(false);
//     }
//   };

//   const stopScanning = async () => {
//     if (html5QrCode && html5QrCode.isScanning) {
//       await html5QrCode.stop();
//       setScanning(false);
//     }
//   };

//   return (
//     <div>
//       <div id="qr-reader" className="mb-6"></div>

//       <div className="flex justify-center mb-4">
//         <select
//           value={selectedCameraId}
//           onChange={(e) => setSelectedCameraId(e.target.value)}
//           className="px-4 py-2 border rounded-lg"
//         >
//           {cameras.map((camera) => (
//             <option key={camera.id} value={camera.id}>
//               {camera.label}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div className="flex justify-center">
//         {!scanning ? (
//           <button
//             onClick={startScanning}
//             className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
//           >
//             <Camera className="w-5 h-5" />
//             Start Scanner
//           </button>
//         ) : (
//           <button
//             onClick={stopScanning}
//             className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
//           >
//             <X className="w-5 h-5" />
//             Stop Scanner
//           </button>
//         )}
//       </div>

//       <div className="mt-6 text-center text-sm text-gray-500">
//         <p className="flex items-center justify-center gap-2">
//           <Camera className="w-4 h-4" />
//           Using{" "}
//           {cameras.find((cam) => cam.id === selectedCameraId)?.label ||
//             "Built-in Camera"}
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Scanner;

import { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
const Scanner = ({ onScanSuccess, onScanError }) => {
  const {t} = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);

  // --- START OF THE FIX ---
  // We will now explicitly find and set the back camera as the default.

  const selectDefaultCamera = useCallback((devices) => {
    if (devices && devices.length > 0) {
      // 1. Look for a camera with "back" or "environment" in its label. This is a common pattern.
      const backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("environment")
      );

      if (backCamera) {
        setSelectedCameraId(backCamera.id);
        return;
      }

      // 2. If no label matches, and there are multiple cameras (common on mobile),
      // assume the last camera in the list is the back camera. This is a strong heuristic.
      if (devices.length > 1) {
        setSelectedCameraId(devices[devices.length - 1].id);
        return;
      }

      // 3. As a final fallback (for PCs or single-camera devices), just use the first camera.
      setSelectedCameraId(devices[0].id);
    }
  }, []);

  // Initialize the scanner and get available cameras
  useEffect(() => {
    // Only run initialization once
    if (html5QrCode) return;

    const instance = new Html5Qrcode("qr-reader");
    setHtml5QrCode(instance);

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          selectDefaultCamera(devices); // Use our new function to set the default
        }
      })
      .catch((err) => {
        onScanError(err.message || "Failed to access cameras");
      });
  }, [html5QrCode, onScanError, selectDefaultCamera]);

  // --- END OF THE FIX ---

  // Cleanup function to stop scanning when the component unmounts
  useEffect(() => {
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .catch((err) =>
            console.error("Error stopping scanner on unmount:", err)
          );
      }
    };
  }, [html5QrCode]);

  const startScanning = async () => {
    if (!html5QrCode || !selectedCameraId) {
      onScanError("Scanner not ready or no camera selected.");
      return;
    }

    setScanning(true);

    try {
      await html5QrCode.start(
        selectedCameraId, // Directly use the pre-selected camera ID
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          onScanSuccess(decodedText);
          stopScanning(); // Stop scanning on successful scan
        },
        (errorMessage) => {
          // This callback can be ignored to prevent console spam on frames without a QR code.
        }
      );
    } catch (err) {
      onScanError(
        err.message ||
          "Failed to start scanning. Please check camera permissions."
      );
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCode && html5QrCode.isScanning) {
      try {
        await html5QrCode.stop();
      } catch (err) {
        console.error("Error while stopping the scanner:", err);
      } finally {
        setScanning(false);
      }
    }
  };

  return (
    <div>
      {/* The qr-reader div is where the video feed will be rendered */}
      <div
        id="qr-reader"
        className="mb-6 rounded-lg overflow-hidden border-2 border-gray-300 min-h-[250px]"
      ></div>

      {/* Manual camera selection dropdown */}
      {cameras.length > 1 && (
        <div className="flex justify-center mb-4">
          <select
            value={selectedCameraId || ""}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm bg-white"
            disabled={scanning}
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-center">
        {!scanning ? (
          <button
            onClick={startScanning}
            disabled={!html5QrCode || !selectedCameraId}
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
    </div>
  );
};

export default Scanner;
