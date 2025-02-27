import { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const Scanner = ({ onScanSuccess, onScanError }) => {
  const {t} = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    setHtml5QrCode(scanner);

    const fetchCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        setCameras(devices);

        if (devices.length > 0) {
          const defaultCamera = getDefaultCamera(devices);
          setSelectedCameraId(defaultCamera.id);
        }
      } catch (err) {
        onScanError(err.message || "Failed to access cameras");
      }
    };

    fetchCameras();

    return () => {
      if (scanner.isScanning) {
        scanner.stop();
      }
    };
  }, [onScanError]);

  const getDefaultCamera = (devices) => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile && devices.length > 1) {
      // Select the back camera for mobile devices
      return (
        devices.find((device) => device.label.toLowerCase().includes("back")) ||
        devices[1]
      );
    }
    // Default to the first camera for desktops/laptops or if only one camera is available
    return devices[0];
  };

  const startScanning = async () => {
    if (!html5QrCode || !selectedCameraId) return;

    try {
      setScanning(true);

      await html5QrCode.start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScanSuccess(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          console.log(errorMessage);
        }
      );
    } catch (err) {
      onScanError(err.message || "Failed to start scanning");
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCode && html5QrCode.isScanning) {
      await html5QrCode.stop();
      setScanning(false);
    }
  };

  return (
    <div>
      <div id="qr-reader" className="mb-6"></div>

      <div className="flex justify-center mb-4">
        <select
          value={selectedCameraId}
          onChange={(e) => setSelectedCameraId(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-center">
        {!scanning ? (
          <button
            onClick={startScanning}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
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

      <div className="mt-6 text-center text-sm text-gray-500">
        <p className="flex items-center justify-center gap-2">
          <Camera className="w-4 h-4" />
          {t("scan.using")}{" "}
          {cameras.find((cam) => cam.id === selectedCameraId)?.label ||
            "Built-in Camera"}
        </p>
      </div>
    </div>
  );
};

export default Scanner;