import {
  AlertCircle,
  Check,
  Clock,
  Loader2,
  Minus,
  Package,
  Plus,
  QrCode,
  Table,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import Scanner from "../components/forms/Scanner";

const OPAPage = () => {
  const { user, loading } = useAuth();
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const [OPARecords, setOPARecords] = useState([]);
  const [scannedData, setScannedData] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [isAdding, setIsAdding] = useState(false);
  const [autoAdd, setAutoAdd] = useState(true);
  const [passQtyOPA, setPassQtyOPA] = useState(0);
  const [OPARecordId, setOPARecordId] = useState(1);

  useEffect(() => {
    const fetchInitialRecordId = async () => {
      if (user && user.emp_id) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/last-opa-record-id/${user.emp_id}`
          );
          if (response.ok) {
            const data = await response.json();
            setOPARecordId(data.lastRecordId + 1);
          }
        } catch (err) {
          console.error("Error fetching initial record ID:", err);
        }
      }
    };

    fetchInitialRecordId();
  }, [user]);

  useEffect(() => {
    let timer;
    if (autoAdd && isAdding && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      handleAddRecord();
    }
    return () => clearInterval(timer);
  }, [autoAdd, isAdding, countdown]);

  const fetchBundleData = async (randomId) => {
    try {
      setLoadingData(true);
      const response = await fetch(
        `${API_BASE_URL}/api/bundle-by-random-id/${randomId}`
      );
      if (!response.ok) throw new Error("Bundle not found");

      const data = await response.json();
      const existsResponse = await fetch(
        `${API_BASE_URL}/api/check-opa-exists/${data.bundle_id}-53`
      );
      const existsData = await existsResponse.json();

      if (existsData.exists) {
        throw new Error("This data already exists");
      }

      setScannedData(data);
      setPassQtyOPA(data.count);
      setIsAdding(true);
      setCountdown(5);
      setError(null);
    } catch (err) {
      setError(err.message);
      setScannedData(null);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddRecord = async () => {
    try {
      const now = new Date();
      const newRecord = {
        opa_record_id: OPARecordId,
        task_no_opa: 53,
        opa_bundle_id: `${scannedData.bundle_id}-53`,
        opa_updated_date: now.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        opa_update_time: now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        ...scannedData,
        passQtyOPA,
      };

      console.log("New Record to be saved:", newRecord); // Log the new record

      const response = await fetch(`${API_BASE_URL}/api/save-opa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });

      if (!response.ok) throw new Error("Failed to save OPA record");

      const updateResponse = await fetch(
        `${API_BASE_URL}/api/update-qc2-orderdata/${scannedData.bundle_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passQtyOPA,
            opa_updated_date: newRecord.opa_updated_date,
            opa_update_time: newRecord.opa_update_time,
          }),
        }
      );

      if (!updateResponse.ok) throw new Error("Failed to update qc2_orderdata");

      setOPARecords((prev) => [...prev, newRecord]);
      setScannedData(null);
      setIsAdding(false);
      setCountdown(5);
      setOPARecordId((prev) => prev + 1); // Increment the record ID
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = () => {
    setScannedData(null);
    setIsAdding(false);
    setCountdown(5);
  };

  const handleScanSuccess = (decodedText) => {
    if (!isAdding) fetchBundleData(decodedText);
  };

  const handlePassQtyChange = (value) => {
    if (value >= 0 && value <= scannedData.count) {
      setPassQtyOPA(value);
    }
  };

  const fetchOPARecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/opa-records`);
      if (!response.ok) throw new Error("Failed to fetch OPA records");
      const data = await response.json();
      setOPARecords(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchOPARecords();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              OPA Process Scanner
            </h1>
          </div>
          <p className="text-gray-600">
            Scan the QR code on the bundle to record OPA details
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

        <div className="flex items-center mb-4">
          <label className="text-gray-700 mr-2">Auto Add:</label>
          <input
            type="checkbox"
            checked={autoAdd}
            onChange={(e) => setAutoAdd(e.target.checked)}
            className="form-checkbox"
          />
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

            {loadingData && (
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
                        <p className="font-medium">{scannedData.count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Separator ID</p>
                        <p className="font-medium">{scannedData.emp_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Registered Date</p>
                        <p className="font-medium">
                          {scannedData.updated_date_seperator}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Registered Time</p>
                        <p className="font-medium">
                          {scannedData.updated_time_seperator}
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
                      <div>
                        <p className="text-sm text-gray-600">Pass Qty (Iron)</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePassQtyChange(passQtyOPA - 1)}
                            className="px-2 py-1 rounded-md bg-gray-200 text-gray-700"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={passQtyOPA}
                            onChange={(e) =>
                              handlePassQtyChange(Number(e.target.value))
                            }
                            className="w-16 text-center border border-gray-300 rounded-md"
                          />
                          <button
                            onClick={() => handlePassQtyChange(passQtyOPA + 1)}
                            className="px-2 py-1 rounded-md bg-gray-200 text-gray-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
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
            )}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-sky-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      OPA ID
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Task No
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Department
                    </th>
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
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Pass Qty (Iron)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {OPARecords.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.opa_record_id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.task_no_opa}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.department}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.opa_updated_date}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.opa_update_time}
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
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.passQtyOPA}
                      </td>
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

export default OPAPage;
