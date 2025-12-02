import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { QrCode, X, Camera, Loader2, Copy, Check, Edit3, History, Trash2, Database, User, Package, Calendar, Hash } from "lucide-react";

// Correct imports
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

const CuttingBarcodeReader = ({ onBarcodeScanned, onOrderDataChange }) => {
  const { t } = useTranslation();
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [error, setError] = useState("");
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // State to track if the scanner is actively trying to decode
  const [isScanningActive, setIsScanningActive] = useState(false);

  // New states for enhanced functionality
  const [isCopied, setIsCopied] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // New states for order data
  const [orderData, setOrderData] = useState(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  const codeReader = useRef(new BrowserMultiFormatReader());
  const controlsRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Only run the effect if the scanner modal is open and a camera is selected
    if (isScannerOpen && selectedDeviceId) {
      console.log(`Starting scanner for device: ${selectedDeviceId}`);
      setIsScanningActive(true);
      setError("");

      // Add a small delay to ensure the video element is ready
      const startScanning = async () => {
        try {
          const controls = await codeReader.current.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result, err) => {
              if (result) {
                console.log("Barcode found!", result);
                const barcodeText = result.getText();
                processBarcode(barcodeText);
                closeScanner(); // This will also stop the stream
              }
              if (err && err instanceof NotFoundException) {
                return; // This is normal, just means no barcode was found
              }
              if (err) {
                console.error("An unexpected scanning error occurred:", err);
                setError("An unexpected error occurred during scanning.");
              }
            }
          );
          
          console.log("Scanner controls initialized.");
          controlsRef.current = controls;
        } catch (err) {
          console.error("Failed to start video stream:", err);
          if (err.name === 'NotAllowedError') {
            setError("Camera permission denied. Please allow camera access and try again.");
          } else if (err.name === 'NotFoundError') {
            setError("Camera not found. Please check your camera connection.");
          } else {
            setError("Could not access camera. Check permissions and ensure it is not in use.");
          }
          setIsScanningActive(false);
        }
      };

      // Small delay to ensure video element is ready
      setTimeout(startScanning, 100);
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
      // First, try to get user media to request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera
        } 
      });
      
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      // Now list available devices
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      console.log("Video devices found:", devices);
      setVideoInputDevices(devices);
      
      if (devices.length > 0) {
        // Try to find back camera first, then any camera
        const backCamera = devices.find((device) =>
          device.label.toLowerCase().includes("back") || 
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment")
        );
        
        const newDeviceId = backCamera ? backCamera.deviceId : devices[0].deviceId;
        console.log(`Selected device ID: ${newDeviceId}`);
        setSelectedDeviceId(newDeviceId);
      } else {
        setError("No cameras found on this device.");
        setIsScannerOpen(false);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      
      if (err.name === 'NotAllowedError') {
        setError("Camera permission denied. Please allow camera access and try again.");
      } else if (err.name === 'NotFoundError') {
        setError("No camera found on this device.");
      } else if (err.name === 'NotSupportedError') {
        setError("Camera not supported in this browser.");
      } else {
        setError("Could not access camera. Please check your browser settings and try again.");
      }
      
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

  // Enhanced functionality functions
  const copyToClipboard = async () => {
    if (scannedBarcode) {
      try {
        await navigator.clipboard.writeText(scannedBarcode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = scannedBarcode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    }
  };

  const addToHistory = (barcode) => {
    const timestamp = new Date().toLocaleString();
    const newEntry = { barcode, timestamp, id: Date.now() };
    setScanHistory(prev => [newEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
  };

  const clearHistory = () => {
    setScanHistory([]);
  };

  const clearOrderData = () => {
    setOrderData(null);
    setOrderError("");
    setScannedBarcode("");
    
    // Notify parent component that order data is cleared
    if (onOrderDataChange) {
      onOrderDataChange(null);
    }
  };

  const selectFromHistory = (barcode) => {
    processBarcode(barcode);
    setShowHistory(false);
  };

  const handleManualInput = () => {
    if (manualInput.trim()) {
      processBarcode(manualInput.trim());
      setManualInput("");
      setShowManualInput(false);
    }
  };

  const validateBarcode = (barcode) => {
    // Basic validation - can be customized based on your requirements
    if (!barcode || barcode.length < 3) {
      return { isValid: false, message: "Barcode too short" };
    }
    if (barcode.length > 50) {
      return { isValid: false, message: "Barcode too long" };
    }
    return { isValid: true, message: "Valid barcode" };
  };

  // Function to fetch order data from API
  const fetchOrderData = async (barcode) => {
    setIsLoadingOrder(true);
    setOrderError("");
    setOrderData(null);

    try {
      const response = await fetch(`http://localhost:5001/api/cutting-inline-orders/barcode/${barcode}`);
      const data = await response.json();

      if (data.success) {
        setOrderData(data.data);
        console.log("Order data fetched:", data.data);
        
        // Notify parent component of order data change
        if (onOrderDataChange) {
          onOrderDataChange(data.data);
        }
      } else {
        setOrderError(data.message || "Order not found");
        console.log("Order not found for barcode:", barcode);
      }
    } catch (error) {
      console.error("Error fetching order data:", error);
      setOrderError("Failed to fetch order data. Please check your connection.");
    } finally {
      setIsLoadingOrder(false);
    }
  };

  // Function to handle barcode processing
  const processBarcode = (barcode) => {
    const validation = validateBarcode(barcode);
    if (validation.isValid) {
      setScannedBarcode(barcode);
      addToHistory(barcode);
      fetchOrderData(barcode);
    } else {
      setError(validation.message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mx-auto flex flex-col items-center">
      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={openScanner}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full"
        >
          <QrCode className="mr-3 h-5 w-5" />
          {t("barcode.scan", "Scan Barcode")}
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Manual Input
          </button>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <History className="mr-2 h-4 w-4" />
            History ({scanHistory.length})
          </button>
        </div>
      </div>

      {/* Manual Input Section */}
      {showManualInput && (
        <div className="mt-4 w-full">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter barcode manually..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
            />
            <button
              onClick={handleManualInput}
              disabled={!manualInput.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* History Section */}
      {showHistory && (
        <div className="mt-4 w-full">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Scans</h4>
            {scanHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {scanHistory.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm italic">No scans yet</p>
            ) : (
              scanHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => selectFromHistory(entry.barcode)}
                >
                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                    {entry.barcode}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.timestamp}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Display Area for the Scanned Barcode */}
      <div className="mt-8 text-center w-full">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Scanned Barcode
        </h3>
        <div className="mt-2 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md relative">
          {scannedBarcode ? (
            <>
              <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white tracking-widest">
                {scannedBarcode}
              </p>
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Copy to clipboard"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">
              Ready to scan
            </p>
          )}
        </div>
      </div>

      {/* Order Data Display */}
      {isLoadingOrder && (
        <div className="mt-6 w-full">
          <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-600 dark:text-blue-400">Loading order data...</span>
          </div>
        </div>
      )}

      {orderError && (
        <div className="mt-6 w-full">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700 dark:text-red-400">{orderError}</span>
            </div>
          </div>
        </div>
      )}

      {
      // orderData && (
      //   <div className="mt-6 w-full">
      //     <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      //       <div className="flex items-center justify-between mb-3">
      //         <div className="flex items-center">
      //           <Database className="h-5 w-5 text-green-600 mr-2" />
      //           <h4 className="text-lg font-semibold text-green-800 dark:text-green-200">ffff</h4>
      //         </div>
      //         <button
      //           onClick={clearOrderData}
      //           className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      //           title="Clear order data"
      //         >
      //           <X className="h-4 w-4" />
      //         </button>
      //       </div>
            
      //       <div className="space-y-3">
      //         {/* Basic Info */}
      //         <div className="grid grid-cols-2 gap-3">
      //           <div className="flex items-center">
      //             <User className="h-4 w-4 text-gray-500 mr-2" />
      //             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Buyer:</span>
      //           </div>
      //           <span className="text-sm text-gray-900 dark:text-white font-semibold">{orderData.buyer}</span>
                
      //           <div className="flex items-center">
      //             <Package className="h-4 w-4 text-gray-500 mr-2" />
      //             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Style:</span>
      //           </div>
      //           <span className="text-sm text-gray-900 dark:text-white font-semibold">{orderData.styleNo}</span>
                
      //           <div className="flex items-center">
      //             <Hash className="h-4 w-4 text-gray-500 mr-2" />
      //             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Color:</span>
      //           </div>
      //           <span className="text-sm text-gray-900 dark:text-white font-semibold">{orderData.color}</span>
                
      //           <div className="flex items-center">
      //             <Calendar className="h-4 w-4 text-gray-500 mr-2" />
      //             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">TXN:</span>
      //           </div>
      //           <span className="text-sm text-gray-900 dark:text-white font-semibold">{orderData.txnNo}</span>
      //         </div>

      //         {/* Detailed Info */}
      //         <div className="pt-3 border-t border-green-200 dark:border-green-700">
      //           <div className="grid grid-cols-2 gap-2 text-xs">
      //             <div>
      //               <span className="text-gray-600 dark:text-gray-400">Buyer Style:</span>
      //               <p className="font-medium text-gray-900 dark:text-white">{orderData.buyerStyle}</p>
      //             </div>
      //             <div>
      //               <span className="text-gray-600 dark:text-gray-400">Color Code:</span>
      //               <p className="font-medium text-gray-900 dark:text-white">{orderData.colorCode}</p>
      //             </div>
      //             <div>
      //               <span className="text-gray-600 dark:text-gray-400">Fabric Type:</span>
      //               <p className="font-medium text-gray-900 dark:text-white">{orderData.fabricType}</p>
      //             </div>
      //             <div>
      //               <span className="text-gray-600 dark:text-gray-400">Table No:</span>
      //               <p className="font-medium text-gray-900 dark:text-white">{orderData.tableNo}</p>
      //             </div>
      //             <div>
      //               <span className="text-gray-600 dark:text-gray-400">Total Order Qty:</span>
      //               <p className="font-medium text-gray-900 dark:text-white">{orderData.totalOrderQty?.toLocaleString()}</p>
      //             </div>
      //             <div>
      //               <span className="text-gray-600 dark:text-gray-400">Total Pcs:</span>
      //               <p className="font-medium text-gray-900 dark:text-white">{orderData.totalPcs?.toLocaleString()}</p>
      //             </div>
      //           </div>
      //         </div>

      //         {/* Marker Ratio Info */}
      //         {orderData.markerRatio && orderData.markerRatio.length > 0 && (
      //           <div className="pt-3 border-t border-green-200 dark:border-green-700">
      //             <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Size Breakdown:</h5>
      //             <div className="grid grid-cols-2 gap-1 text-xs">
      //               {orderData.markerRatio.slice(0, 6).map((item, index) => (
      //                 <div key={index} className="flex justify-between">
      //                   <span className="text-gray-600 dark:text-gray-400">{item.size}:</span>
      //                   <span className="font-medium text-gray-900 dark:text-white">{item.qty}</span>
      //                 </div>
      //               ))}
      //             </div>
      //           </div>
      //         )}
      //       </div>
      //     </div>
      //   </div>
      // )
      }

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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Make sure the barcode is well-lit and clearly visible in the camera view
            </p>

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

            {videoInputDevices.length > 0 && (
              <div className="mt-4">
                <label
                  htmlFor="camera-select"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  <Camera size={16} className="inline mr-1" /> Select Camera:
                </label>
                <select
                  id="camera-select"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {videoInputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && (
              <div className="mt-4 text-center">
                <p className="text-red-500 text-sm mb-2">{error}</p>
                <button
                  onClick={openScanner}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Retry Camera Access
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CuttingBarcodeReader;
