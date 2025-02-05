// IroningPage.jsx
import React, { useState, useEffect } from "react";
import {
  QrCode,
  AlertCircle,
  Package,
  Loader2,
  Table,
  X,
  Check,
  Clock,
} from "lucide-react";
import Scanner from "../components/forms/Scanner";

const IroningPage = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const [ironingRecords, setIroningRecords] = useState([]);
  const [scannedData, setScannedData] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let timer;
    if (isAdding && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      handleAddRecord();
    }
    return () => clearInterval(timer);
  }, [isAdding, countdown]);

  const fetchBundleData = async (randomId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5001/api/bundle-by-random-id/${randomId}`
      );
      if (!response.ok) throw new Error("Bundle not found");

      const data = await response.json();
      const existsResponse = await fetch(
        `http://localhost:5001/api/check-ironing-exists/${data.bundle_id}-53`
      );
      const existsData = await existsResponse.json();

      if (existsData.exists) {
        throw new Error("This data already exists");
      }

      setScannedData(data);
      setIsAdding(true);
      setCountdown(5);
      setError(null);
    } catch (err) {
      setError(err.message);
      setScannedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async () => {
    try {
      const now = new Date();
      const newRecord = {
        ironing_record_id: ironingRecords.length + 1,
        task_no: 53,
        ironing_bundle_id: `${scannedData.bundle_id}-53`,
        ironing_updated_date: now.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        ironing_update_time: now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        ...scannedData,
      };

      const response = await fetch("http://localhost:5001/api/save-ironing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });

      if (!response.ok) throw new Error("Failed to save ironing record");

      setIroningRecords((prev) => [...prev, newRecord]);
      setScannedData(null);
      setIsAdding(false);
      setCountdown(5);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setCountdown(5);
  };

  const handleReset = () => {
    setScannedData(null);
    setIsAdding(false);
    setCountdown(5);
  };

  const handleScanSuccess = (decodedText) => {
    if (!isAdding) fetchBundleData(decodedText);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Ironing Process Scanner
            </h1>
          </div>
          <p className="text-gray-600">
            Scan the QR code on the bundle to record ironing details
          </p>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("scan")}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              activeTab === "scan"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            <QrCode className="w-5 h-5" />
            QR Scan
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              activeTab === "data"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            <Table className="w-5 h-5" />
            Data
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {activeTab === "scan" ? (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Scanner
              onScanSuccess={handleScanSuccess}
              onScanError={(err) => setError(err)}
              continuous={true}
            />

            {loading && (
              <div className="flex items-center justify-center gap-2 text-blue-600 mt-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p>Loading bundle data...</p>
              </div>
            )}

            {scannedData && (
              <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-4">
                  <Package className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-grow">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Order Details
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Bundle ID</p>
                        <p className="font-medium">{scannedData.bundle_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">MO Number</p>
                        <p className="font-medium">
                          {scannedData.selectedMono}
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
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                      <button
                        onClick={handleAddRecord}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                          isAdding
                            ? "bg-blue-500 text-white"
                            : "bg-green-500 text-white"
                        }`}
                      >
                        {isAdding ? (
                          <>
                            <Clock className="w-5 h-5" />
                            Adding ({countdown}s)
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Add Now
                          </>
                        )}
                      </button>

                      {isAdding && (
                        <button
                          onClick={handleCancelAdd}
                          className="px-4 py-2 rounded-md bg-red-500 text-white flex items-center gap-2"
                        >
                          <X className="w-5 h-5" />
                          Cancel
                        </button>
                      )}

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
            )}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                {/* Table headers and rows same as before, add new fields */}
                <thead className="bg-sky-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Ironing ID
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Task No
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Department
                    </th>
                    {/* <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Bundle ID
                    </th> */}
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Updated Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Updated Time
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      MONo
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Cust. Style
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Buyer
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Country
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Factory
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Line No
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Color
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Size
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Count
                    </th>
                    {/* <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Bundle ID
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ironingRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.ironing_record_id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.task_no}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.department}
                      </td>
                      {/* <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.ironing_bundle_id}
                      </td> */}
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.ironing_updated_date}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.ironing_update_time}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.selectedMono}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.custStyle}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.buyer}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.country}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.factory}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.lineNo}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.color}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.size}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.count}
                      </td>
                      {/* <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.bundle_id}
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IroningPage;
