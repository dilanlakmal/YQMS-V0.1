import { useEffect, useRef, useState } from "react";
import { FaPrint, FaQrcode } from "react-icons/fa";
import { useFormData } from "../../components/context/FormDataContext"; // Import the useFormData hook
import BluetoothComponent from "./Bluetooth";
import MonoSearch from "./MonoSearch";
import QRCodePreview from "./QRCodePreview";
// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "../../../config";
import { useTranslation } from 'react-i18next';

export default function ReprintTab() {
  const { t } = useTranslation();
  const { formData, updateFormData } = useFormData(); // Access context
  const [selectedMono, setSelectedMono] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null); // New
  const bluetoothComponentRef = useRef();

  // Fetch order details when selectedMono changes
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!selectedMono) {
        setOrderDetails(null);
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/order-details/${selectedMono}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setOrderDetails(data);
      } catch (error) {
        console.error("Error fetching order details:", error);
        setOrderDetails(null);
      }
    };

    fetchOrderDetails();
  }, [selectedMono]);

  useEffect(() => {
    const fetchColorsSizes = async () => {
      if (!selectedMono) return;
      const response = await fetch(
        `${API_BASE_URL}/api/reprint-colors-sizes/${selectedMono}`
      );
      const data = await response.json();
      setColors(data);
    };
    fetchColorsSizes();
  }, [selectedMono]);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!selectedMono || !color || !size) return;
      const response = await fetch(
        `${API_BASE_URL}/api/reprint-records?mono=${selectedMono}&color=${color}&size=${size}`
      );
      const data = await response.json();
      setRecords(data);
    };
    fetchRecords();
  }, [selectedMono, color, size]);

  const handlePrint = async (record) => {
    try {
      await bluetoothComponentRef.current.printData({
        ...record,
        bundle_id: record.bundle_random_id,
      });
    } catch (error) {
      alert(`Print failed: ${error.message}`);
    }
  };

  const handlePreviewQR = (record) => {
    setSelectedRecords([record]); // Set the selected record for preview
    setShowQRPreview(true); // Show the QR preview modal
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("bundle.search_mono")}
          </label>
          <MonoSearch
            value={selectedMono}
            onSelect={setSelectedMono}
            placeholder="Search Last 3 Digits of MONo..."
            endpoint="/api/reprint-search-mono"
          />
        </div>
        <BluetoothComponent ref={bluetoothComponentRef} />
      </div>

      {/* Order Details Box */}
      {orderDetails && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
          {t("bundle.order_details")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-bold">{t("bundle.selected_mono")}:</span> {selectedMono}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">{t("bundle.customer_style")}:</span>{" "}
                {orderDetails.custStyle || "N/A"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">{t("bundle.buyer")}:</span> {orderDetails.engName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-bold">{t("bundle.country")}:</span>{" "}
                {orderDetails.country || "N/A"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">{t("bundle.order_qty")}:</span>{" "}
                {orderDetails.totalQty || "N/A"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">{t("bundle.factory")}:</span>{" "}
                {orderDetails.factoryname || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedMono && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label>{t("bundle.color")}</label>
            <select
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setSize("");
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">{t("bundle.select_color")}</option>
              {colors.map((c) => (
                <option key={c.color} value={c.color}>
                  {c.color}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>{t("bundle.size")}</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={!color}
            >
              <option value="">{t("bundle.select-size")}</option>
              {colors
                .find((c) => c.color === color)
                ?.sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {records.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-sky-100">
                <th className="p-2 border border-gray-300">{t("bundle.package_no")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.mono")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.color")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.size")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.style_no")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.line_no")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.date")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.time")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.emp_id")}</th>
                <th className="p-2 border border-gray-300">{t("bundle.action")}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="p-2 border border-gray-300 text-center">
                    {record.package_no}
                  </td>
                  <td className="p-2 border border-gray-300 text-center">
                    {record.selectedMono}
                  </td>
                  <td className="p-2 border border-gray-300 text-center">
                    {record.color}
                  </td>
                  <td className="p-2 border border-gray-300 text-center">
                    {record.size}
                  </td>
                  <td className="p-2 border border-gray-300 text-center">
                    {record.custStyle}
                  </td>
                  <td className="p-2 border border-gray-300 text-center">
                    {record.lineNo}
                  </td>
                  <td className="p-2 border border-gray-300 text-center">
                    {record.updated_date_seperator}
                  </td>
                  <td className="p-2 border border-gray-300 text-center">
                    {record.updated_time_seperator}
                  </td>
                  <td className="p-2 border border-gray-300 text-center">
                    {record.emp_id}
                  </td>
                  <td>
                    <button
                      onClick={() => handlePreviewQR(record)}
                      className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-100"
                    >
                      <FaQrcode className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handlePrint(record)}
                      className="ml-2 text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-100"
                    >
                      <FaPrint className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <QRCodePreview
        isOpen={showQRPreview}
        onClose={() => setShowQRPreview(false)}
        qrData={selectedRecords}
        onPrint={handlePrint}
        mode="production" // Add this line
      />
    </div>
  );
}
