import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Camera, Upload } from "lucide-react";
import Scanner from "../../forms/Scanner";
import QRCodeUpload from "../../forms/QRCodeUpload";

const QC2InspectionScannerView = ({
  onScanSuccess,
  onScanError,
  loadingData
}) => {
  const { t } = useTranslation();
  const [scanMethod, setScanMethod] = useState("camera"); // "camera" or "upload"

  return (
    // This outer div centers the entire scanner block on the page.
    <div className="flex flex-col items-center justify-center h-full p-4">
      {/* 
        This is the container that mimics the style of Washing.jsx scanner.
        - `bg-white`: Gives it a distinct background.
        - `p-4 md:p-6`: Adds padding inside the box.
        - `rounded-lg`: Rounds the corners.
        - `shadow-xl`: Adds a prominent shadow to make it "pop" off the page.
        - `w-full max-w-md`: Makes it responsive but constrains the max width to be small and manageable.
      */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-xl w-full max-w-md">
        {/* Scan Method Selection */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setScanMethod("camera")}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 text-sm ${
                scanMethod === "camera"
                  ? "bg-white shadow-md text-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Camera size={16} />
              <span className="font-medium">Camera</span>
            </button>
            <button
              onClick={() => setScanMethod("upload")}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 text-sm ${
                scanMethod === "upload"
                  ? "bg-white shadow-md text-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Upload size={16} />
              <span className="font-medium">Upload</span>
            </button>
          </div>
        </div>

        {/* Conditional Rendering based on scan method */}
        <div className="w-full">
          {scanMethod === "camera" ? (
            <Scanner onScanSuccess={onScanSuccess} onScanError={onScanError} />
          ) : (
            <QRCodeUpload
              onScanSuccess={onScanSuccess}
              onScanError={onScanError}
              disabled={loadingData}
            />
          )}
        </div>

        {/* Loading indicator */}
        {loadingData && (
          <div className="flex items-center justify-center gap-2 text-blue-600 mt-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p>{t("qc2In.loading_data", "Loading Data...")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QC2InspectionScannerView;
