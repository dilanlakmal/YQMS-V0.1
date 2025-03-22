import { AlertCircle, QrCode, Table } from "lucide-react";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import QrCodeScanner from "../components/forms/QRCodeScanner";
import { useTranslation } from 'react-i18next';

const PackingPage = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const [packingRecords, setPackingRecords] = useState([]);
  const [scannedData, setScannedData] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [isAdding, setIsAdding] = useState(false);
  const [autoAdd, setAutoAdd] = useState(true);
  const [passQtyPack, setPassQtyPack] = useState(0);
  const [packingRecordId, setPackingRecordId] = useState(1);
  const [isDefectCard, setIsDefectCard] = useState(false);

  useEffect(() => {
    const fetchInitialRecordId = async () => {
      if (user && user.emp_id) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/last-packing-record-id/${user.emp_id}`
          );
          if (!response.ok)
            throw new Error("Failed to fetch last packing record ID");
          const data = await response.json();
          setPackingRecordId(data.lastRecordId + 1);
        } catch (err) {
          console.error("Error fetching initial record ID:", err);
          setError(err.message);
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
      const trimmedId = randomId.trim();
      setLoadingData(true);
      setIsDefectCard(false);
      console.log("Scanned QR Code (10-digit):", trimmedId);

      let orderResponse = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-random-id/${trimmedId}`
      );
      if (orderResponse.ok) {
        const bundleData = await orderResponse.json();
        if (!bundleData || !bundleData.bundle_id) {
          throw new Error(
            "Order card data not found or invalid for this bundle_random_id"
          );
        }
        console.log(
          "Order card data fetched from qc2_inspection_pass_bundle (bundle_random_id):",
          bundleData
        );

        const existsResponse = await fetch(
          `${API_BASE_URL}/api/check-packing-exists/${bundleData.bundle_id}-62`
        );
        const existsData = await existsResponse.json();
        if (existsData.exists) {
          throw new Error("This order card already exists");
        }

        const formattedData = {
          bundle_id: bundleData.bundle_id,
          bundle_random_id: bundleData.bundle_random_id,
          package_no: bundleData.package_no,
          moNo: bundleData.moNo,
          selectedMono: bundleData.moNo,
          custStyle: bundleData.custStyle,
          buyer: bundleData.buyer,
          color: bundleData.color,
          size: bundleData.size,
          factory: bundleData.factory || "N/A",
          country: bundleData.country || "N/A",
          lineNo: bundleData.lineNo,
          department: bundleData.department,
          count: bundleData.totalPass,
          totalBundleQty: 1,
          emp_id_inspection: bundleData.emp_id_inspection,
          inspection_date: bundleData.inspection_date,
          inspection_time: bundleData.inspection_time,
          sub_con: bundleData.sub_con,
          sub_con_factory: bundleData.sub_con_factory
        };

        setScannedData(formattedData);
        setPassQtyPack(bundleData.totalPass);
      } else {
        const defectResponse = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-defect-print-id/${trimmedId}?includeCompleted=true`
        );
        if (defectResponse.ok) {
          const defectData = await defectResponse.json();
          if (!defectData) {
            throw new Error(
              "Defect card data not found for this defect_print_id"
            );
          }
          console.log(
            "Defect card data fetched from qc2_inspection_pass_bundle (defect_print_id):",
            defectData
          );

          const printData = defectData.printArray.find(
            (item) => item.defect_print_id === trimmedId
          );
          if (!printData) {
            throw new Error("Defect print ID not found in printArray");
          }

          const existsResponse = await fetch(
            `${API_BASE_URL}/api/check-packing-exists/${trimmedId}-62`
          );
          const existsData = await existsResponse.json();
          if (existsData.exists) {
            throw new Error("This defect card already exists");
          }

          const formattedData = {
            defect_print_id: printData.defect_print_id,
            totalRejectGarmentCount: printData.totalRejectGarmentCount,
            totalRejectGarment_Var: printData.totalRejectGarment_Var,
            package_no: defectData.package_no,
            moNo: defectData.moNo,
            selectedMono: defectData.moNo,
            custStyle: defectData.custStyle,
            buyer: defectData.buyer,
            color: defectData.color,
            size: defectData.size,
            factory: defectData.factory || "N/A",
            country: defectData.country || "N/A",
            lineNo: defectData.lineNo,
            department: defectData.department,
            count: printData.totalRejectGarment_Var,
            totalBundleQty: 1,
            emp_id_inspection: defectData.emp_id_inspection,
            inspection_date: defectData.inspection_date,
            inspection_time: defectData.inspection_time,
            sub_con: defectData.sub_con,
            sub_con_factory: defectData.sub_con_factory,
            bundle_id: defectData.bundle_id,
            bundle_random_id: defectData.bundle_random_id
          };

          setScannedData(formattedData);
          setPassQtyPack(printData.totalRejectGarment_Var);
          setIsDefectCard(true);
        } else {
          const errorData = await defectResponse.json();
          throw new Error(
            errorData.message || "Failed to fetch defect card data"
          );
        }
      }

      setIsAdding(true);
      setCountdown(5);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err.message);
      setError(err.message);
      setScannedData(null);
      setIsAdding(false);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddRecord = async () => {
    try {
      const now = new Date();
      const taskNoPacking = 62;

      const newRecord = {
        packing_record_id: packingRecordId,
        task_no_packing: taskNoPacking,
        packing_bundle_id: isDefectCard
          ? `${scannedData.defect_print_id}-62`
          : `${scannedData.bundle_id}-62`,
        packing_updated_date: now.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric"
        }),
        packing_update_time: now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }),
        package_no: scannedData.package_no,
        ...scannedData,
        passQtyPack,
        emp_id_packing: user.emp_id,
        eng_name_packing: user.eng_name,
        kh_name_packing: user.kh_name,
        job_title_packing: user.job_title,
        dept_name_packing: user.dept_name,
        sect_name_packing: user.sect_name
      };
      console.log("New Record to be saved:", newRecord);

      const response = await fetch(`${API_BASE_URL}/api/save-packing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord)
      });
      if (!response.ok) throw new Error("Failed to save packing record");

      // Update qc2_orderdata
      const inspectionType = isDefectCard ? "defect" : "first";
      const updateData = {
        inspectionType,
        process: "packing",
        data: {
          task_no: taskNoPacking,
          passQty: newRecord.passQtyPack,
          updated_date: newRecord.packing_updated_date,
          update_time: newRecord.packing_update_time,
          emp_id: newRecord.emp_id_packing,
          eng_name: newRecord.eng_name_packing,
          kh_name: newRecord.kh_name_packing,
          job_title: newRecord.job_title_packing,
          dept_name: newRecord.dept_name_packing,
          sect_name: newRecord.sect_name_packing,
          packing_record_id: newRecord.packing_record_id,
          ...(isDefectCard && { defect_print_id: scannedData.defect_print_id })
        }
      };

      const updateResponse = await fetch(
        `${API_BASE_URL}/api/update-qc2-orderdata/${scannedData.bundle_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData)
        }
      );
      if (!updateResponse.ok) throw new Error("Failed to update qc2_orderdata");

      setPackingRecords((prev) => [...prev, newRecord]);
      setScannedData(null);
      setIsAdding(false);
      setCountdown(5);
      setPackingRecordId((prev) => prev + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = () => {
    setScannedData(null);
    setIsAdding(false);
    setCountdown(5);
    setIsDefectCard(false);
  };

  const handleScanSuccess = (decodedText) => {
    if (!isAdding) fetchBundleData(decodedText);
  };

  const handlePassQtyChange = (value) => {
    const maxQty = isDefectCard
      ? scannedData.totalRejectGarment_Var || scannedData.count
      : scannedData.count;
    if (value >= 0 && value <= maxQty) {
      setPassQtyPack(value);
    }
  };

  const fetchPackingRecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/packing-records`);
      if (!response.ok) throw new Error("Failed to fetch Packing records");
      const data = await response.json();
      setPackingRecords(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchPackingRecords();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              {t("pack.header")}
            </h1>
          </div>
          <p className="text-gray-600">
          {t("pack.card")}
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
            passQtyPack={passQtyPack}
            handlePassQtyChange={handlePassQtyChange}
            isIroningPage={false}
            isPackingPage={true}
            isDefectCard={isDefectCard}
          />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-sky-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("pack.packing_id")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("iro.task_no")}
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                    {t("bundle.package_no")}
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
                    {t("pack.pass_qty")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packingRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.packing_record_id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.task_no_packing}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.package_no}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.department}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.packing_updated_date}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.packing_update_time}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.selectedMono || record.moNo}
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
                        {record.count || record.totalRejectGarment_Var}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.passQtyPack}
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

export default PackingPage;
