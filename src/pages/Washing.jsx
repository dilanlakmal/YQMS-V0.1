import { AlertCircle, QrCode, Table } from "lucide-react";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import QrCodeScanner from "../components/forms/QRCodeScanner";

const WashingPage = () => {
  const { user, loading } = useAuth();
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const [washingRecords, setWashingRecords] = useState([]);
  const [scannedData, setScannedData] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [isAdding, setIsAdding] = useState(false);
  const [autoAdd, setAutoAdd] = useState(true);
  const [passQtyWash, setPassQtyWash] = useState(0);
  const [washingRecordId, setWashingRecordId] = useState(1);
  const [isDefectCard, setIsDefectCard] = useState(false);

  useEffect(() => {
    const fetchInitialRecordId = async () => {
      if (user && user.emp_id) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/last-washing-record-id/${user.emp_id}`
          );
          if (!response.ok)
            throw new Error("Failed to fetch last washing record ID");
          const data = await response.json();
          setWashingRecordId(data.lastRecordId + 1);
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
      console.log("Scanned QR Code:", trimmedId);

      let response = await fetch(
        `${API_BASE_URL}/api/bundle-by-random-id/${trimmedId}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Order card data fetched:", data);

        // Check if this bundle_random_id already exists in Washing (via bundle_id)
        const orderExistsResponse = await fetch(
          `${API_BASE_URL}/api/check-washing-exists/${data.bundle_id}-55`
        );
        const orderExistsData = await orderExistsResponse.json();
        if (orderExistsData.exists) {
          throw new Error("This order data already exists in washing");
        }

        setScannedData({ ...data, bundle_random_id: trimmedId });
        setPassQtyWash(data.count);
      } else {
        const defectResponse = await fetch(
          `${API_BASE_URL}/api/check-defect-card-washing/${trimmedId}`
        );
        const defectResponseText = await defectResponse.text();
        console.log("Defect card response:", defectResponseText);

        if (!defectResponse.ok) {
          const errorData = defectResponseText
            ? JSON.parse(defectResponseText)
            : {};
          throw new Error(errorData.message || "Defect card not found");
        }

        const defectData = JSON.parse(defectResponseText);
        console.log("Defect card data fetched:", defectData);

        // Check if this defect_print_id already exists in Washing (using washing_bundle_id format: defect_print_id-86)
        const existsResponse = await fetch(
          `${API_BASE_URL}/api/check-washing-exists/${trimmedId}-86`
        );
        const existsData = await existsResponse.json();
        if (existsData.exists) {
          throw new Error("This defect card already scanned");
        }

        const formattedData = {
          defect_print_id: defectData.defect_print_id,
          totalRejectGarmentCount: defectData.totalRejectGarmentCount,
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
          count: defectData.totalRejectGarmentCount, // Use totalRejectGarmentCount for Washing defect cards
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
        setPassQtyWash(defectData.totalRejectGarmentCount); // Use totalRejectGarmentCount for Pass Wash Qty
        setIsDefectCard(true);
      }

      setIsAdding(true);
      setCountdown(5);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err.message);
      setError(err.message);
      setScannedData(null); // Prevent the scanned box from opening
      setIsAdding(false);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddRecord = async () => {
    try {
      const now = new Date();
      const taskNoWashing = isDefectCard ? 86 : 55;

      const newRecord = {
        washing_record_id: isDefectCard ? 0 : washingRecordId,
        task_no_washing: taskNoWashing,
        washing_bundle_id: isDefectCard
          ? `${scannedData.defect_print_id}-86`
          : `${scannedData.bundle_id}-55`,
        washing_updated_date: now.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric"
        }),
        washing_update_time: now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }),
        package_no: scannedData.package_no,
        ...scannedData,
        passQtyWash,
        emp_id_washing: user.emp_id,
        eng_name_washing: user.eng_name,
        kh_name_washing: user.kh_name,
        job_title_washing: user.job_title,
        dept_name_washing: user.dept_name,
        sect_name_washing: user.sect_name
      };
      console.log("New Record to be saved:", newRecord);

      // Save to washing collection
      const response = await fetch(`${API_BASE_URL}/api/save-washing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord)
      });
      if (!response.ok) throw new Error("Failed to save washing record");

      // Update qc2_orderdata with inspectionFirst or inspectionDefect
      const inspectionType = isDefectCard ? "defect" : "first";
      const updateData = {
        inspectionType,
        process: "washing",
        data: {
          task_no: taskNoWashing,
          passQty: newRecord.passQtyWash,
          updated_date: newRecord.washing_updated_date,
          update_time: newRecord.washing_update_time,
          emp_id: newRecord.emp_id_washing,
          eng_name: newRecord.eng_name_washing,
          kh_name: newRecord.kh_name_washing,
          job_title: newRecord.job_title_washing,
          dept_name: newRecord.dept_name_washing,
          sect_name: newRecord.sect_name_washing,
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

      setWashingRecords((prev) => [...prev, newRecord]);
      setScannedData(null);
      setIsAdding(false);
      setCountdown(5);
      if (!isDefectCard) setWashingRecordId((prev) => prev + 1);
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
      ? scannedData.totalRejectGarmentCount
      : scannedData.count;
    if (value >= 0 && value <= maxQty) {
      setPassQtyWash(value);
    }
  };

  const fetchWashingRecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/washing-records`);
      if (!response.ok) throw new Error("Failed to fetch washing records");
      const data = await response.json();
      setWashingRecords(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchWashingRecords();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Washing Process Scanner
            </h1>
          </div>
          <p className="text-gray-600">
            Scan the QR code (Order or Defect Card) to record washing details
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
            passQtyWash={passQtyWash}
            handlePassQtyChange={handlePassQtyChange}
            isIroningPage={false}
            isWashingPage={true}
            isPackingPage={false}
            isOPAPage={false}
            isDefectCard={isDefectCard}
          />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-sky-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Washing ID
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Task No
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Package No
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
                      Pass Qty (Wash)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {washingRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.washing_record_id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.task_no_washing}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.package_no}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.department}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.washing_updated_date}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.washing_update_time}
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
                        {record.count || record.totalRejectGarmentCount}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {record.passQtyWash}
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

export default WashingPage;
