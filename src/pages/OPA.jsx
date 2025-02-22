import { AlertCircle, QrCode, Table } from "lucide-react";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import QrCodeScanner from "../components/forms/QRCodeScanner";
import { useTranslation } from 'react-i18next';

const OPAPage = () => {
  const { t } = useTranslation();
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">
             {t("opa.header")}
            </h1>
          </div>
          <p className="text-gray-600">
          {t("opa.card")}
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
            {t("iro.qr_scan")}
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
            {t("bundle.date")}
          </button>
        </div>
        <div className="flex items-center mb-4">
          <label className="text-gray-700 mr-2">{t("iro.auto_add")}:</label>
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
          <QrCodeScanner
            onScanSuccess={handleScanSuccess}
            onScanError={(err) => setError(err)}
            autoAdd={autoAdd}
            isAdding={isAdding}
            countdown={countdown}
            handleAddRecord={handleAddRecord}
            handleReset={handleReset}
            scannedData={scannedData}
            loadingData={loadingData}
            passQtyOPA={passQtyOPA}
            handlePassQtyChange={handlePassQtyChange}
            error={error}
            isIroningPage={false}
          />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-sky-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("opa.opa_id")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("iro.task_no")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("bundle.department")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("iro.updated_date")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("iro.updated_time")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("bundle.mono")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("bundle.customer_style")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("bundle.buyer")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("bundle.country")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("bundle.factory")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("bundle.line_no")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("bundle.color")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("bundle.size")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("bundle.count")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("opa.pass_qty")}
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
