import React, { useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";

const Scanner = ({ onScanSuccess, onScanError }) => {
  const [scanning, setScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    setHtml5QrCode(scanner);

    return () => {
      if (scanner.isScanning) {
        scanner.stop();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!html5QrCode) return;

    try {
      setScanning(true);

      const devices = await Html5Qrcode.getCameras();
      const camera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("facetime") ||
          device.label.toLowerCase().includes("built-in")
      );

      if (!camera) {
        throw new Error("Camera not found");
      }

      await html5QrCode.start(
        camera.id,
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
      onScanError(err.message || "Failed to access camera");
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

      <div className="flex justify-center">
        {!scanning ? (
          <button
            onClick={startScanning}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Start Scanner
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            Stop Scanner
          </button>
        )}
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p className="flex items-center justify-center gap-2">
          <Camera className="w-4 h-4" />
          Using Built-in Camera
        </p>
      </div>
    </div>
  );
};

export default Scanner;
