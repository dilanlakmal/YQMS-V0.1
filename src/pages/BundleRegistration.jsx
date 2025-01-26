import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import MonoSearch from "../components/forms/MonoSearch";
import QRCodePreview from "../components/forms/QRCodePreview";
import NumberPad from "../components/forms/NumberPad";
import NumLetterPad from "../components/forms/NumLetterPad";
import { FaQrcode, FaPrint, FaEye } from "react-icons/fa";

function BundleRegistration() {
  const navigate = useNavigate();
  const [qrData, setQrData] = useState([]); // Array to hold multiple QR codes
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [numberPadTarget, setNumberPadTarget] = useState(null);
  const [isGenerateDisabled, setIsGenerateDisabled] = useState(false); // To disable Generate QR button
  const [formData, setFormData] = useState({
    date: new Date(),
    selectedMono: "",
    buyer: "",
    orderQty: "",
    factoryInfo: "",
    custStyle: "",
    country: "",
    color: "",
    size: "",
    bundleQty: "",
    lineNo: "",
    count: "10",
  });

  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [hasColors, setHasColors] = useState(false);
  const [hasSizes, setHasSizes] = useState(false);

  // Fetch order details when MONo is selected
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!formData.selectedMono) return;

      try {
        const response = await fetch(
          `http://localhost:5001/api/order-details/${formData.selectedMono}`
        );
        const data = await response.json();

        setFormData((prev) => ({
          ...prev,
          buyer: data.engName,
          orderQty: data.totalQty,
          factoryInfo: data.factoryname,
          custStyle: data.custStyle,
          country: data.country,
          color: "",
          size: "",
        }));

        if (data.colors && data.colors.length > 0) {
          setColors(data.colors);
          setHasColors(true);
          setHasSizes(false);
        } else {
          setColors([]);
          setHasColors(false);
          setHasSizes(false);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        setColors([]);
        setHasColors(false);
        setHasSizes(false);
      }
    };

    fetchOrderDetails();
  }, [formData.selectedMono]);

  // Fetch sizes when color is selected
  useEffect(() => {
    const fetchSizes = async () => {
      if (!formData.selectedMono || !formData.color) return;

      try {
        const response = await fetch(
          `http://localhost:5001/api/order-sizes/${formData.selectedMono}/${formData.color}`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          setSizes(data);
          setHasSizes(true);
        } else {
          setSizes([]);
          setHasSizes(false);
        }
      } catch (error) {
        console.error("Error fetching sizes:", error);
        setSizes([]);
        setHasSizes(false);
      }
    };

    fetchSizes();
  }, [formData.selectedMono, formData.color]);

  // Handle number pad input
  const handleNumberPadInput = (value) => {
    if (numberPadTarget === "bundleQty") {
      setFormData((prev) => ({
        ...prev,
        bundleQty: value,
      }));
    } else if (numberPadTarget === "lineNo") {
      setFormData((prev) => ({
        ...prev,
        lineNo: value,
      }));
    } else if (numberPadTarget === "count") {
      setFormData((prev) => ({
        ...prev,
        count: value,
      }));
    }
  };

  // Validate Line No for YM factory
  const validateLineNo = () => {
    if (formData.factoryInfo === "YM") {
      const lineNo = parseInt(formData.lineNo);
      return lineNo >= 1 && lineNo <= 30;
    }
    return true;
  };

  // Generate QR code and save bundle data
  const handleGenerateQR = async () => {
    if (!validateLineNo()) {
      alert("Invalid Line No. It must be between 1 and 30 for YM factory.");
      return;
    }

    const { date, selectedMono, color, size, lineNo } = formData;

    // Check if bundle_id already exists and get the largest number
    try {
      const response = await fetch(
        "http://localhost:5001/api/check-bundle-id",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: date.toISOString().split("T")[0],
            lineNo,
            selectedMono,
            color,
            size,
          }),
        }
      );

      const { largestNumber } = await response.json();

      const bundleQty = parseInt(formData.bundleQty);
      const bundleData = [];

      for (let i = 1; i <= bundleQty; i++) {
        const bundleId = `${
          date.toISOString().split("T")[0]
        }:${lineNo}:${selectedMono}:${color}:${size}:${largestNumber + i}`;

        const bundleRecord = {
          bundle_id: bundleId,
          date: date.toLocaleDateString("en-US"), // Format as MM/DD/YYYY
          selectedMono,
          custStyle: formData.custStyle,
          buyer: formData.buyer,
          country: formData.country,
          orderQty: formData.orderQty,
          factory: formData.factoryInfo,
          lineNo,
          color,
          size,
          count: formData.count,
          totalBundleQty: bundleQty,
        };

        bundleData.push(bundleRecord);
      }

      // Save bundle data to MongoDB
      const saveResponse = await fetch(
        "http://localhost:5001/api/save-bundle-data",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bundleData }),
        }
      );

      if (saveResponse.ok) {
        setQrData(bundleData); // Set QR data for preview
        setIsGenerateDisabled(true); // Disable Generate QR button
      } else {
        alert("Failed to save bundle data.");
      }
    } catch (error) {
      console.error("Error saving bundle data:", error);
      alert("Failed to save bundle data.");
    }
  };

  // Print QR code and clear form data
  const handlePrintQR = () => {
    setFormData((prev) => ({
      ...prev,
      color: "",
      size: "",
      bundleQty: "",
    }));
    setIsGenerateDisabled(false); // Re-enable Generate QR button
    alert("Print QR code functionality will be implemented here.");
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Bundle Registration
        </h1>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* Date Picker and MONo Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <DatePicker
                selected={formData.date}
                onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search MONo
              </label>
              <MonoSearch
                value={formData.selectedMono}
                onSelect={(mono) =>
                  setFormData((prev) => ({
                    ...prev,
                    selectedMono: mono,
                    color: "",
                    size: "",
                  }))
                }
                placeholder="Search Last 3 Digits of MONo..."
                showSearchIcon={true}
                closeOnOutsideClick={true}
              />
            </div>
          </div>

          {/* Selected MONo and Order Details */}
          {formData.selectedMono && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Order Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">Selected MONo:</span>{" "}
                    {formData.selectedMono}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">Customer Style:</span>{" "}
                    {formData.custStyle}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">Buyer:</span> {formData.buyer}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">Country:</span>{" "}
                    {formData.country}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">Order Qty:</span>{" "}
                    {formData.orderQty}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">Factory:</span>{" "}
                    {formData.factoryInfo}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Line No, Color, Size, Count, and Bundle Qty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Line No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Line No
              </label>
              <input
                type="text"
                value={formData.lineNo}
                onClick={() => {
                  setNumberPadTarget("lineNo");
                  setShowNumberPad(true);
                }}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              {hasColors ? (
                <select
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Color</option>
                  {colors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500">No Colors Available</p>
              )}
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              {hasColors ? (
                hasSizes ? (
                  <select
                    value={formData.size}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, size: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Size</option>
                    {sizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">No Sizes Available</p>
                )
              ) : (
                <p className="text-sm text-gray-500">No Colors Available</p>
              )}
            </div>

            {/* Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Count
              </label>
              <input
                type="text"
                value={formData.count}
                onClick={() => {
                  setNumberPadTarget("count");
                  setShowNumberPad(true);
                }}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>

            {/* Bundle Qty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bundle Qty
              </label>
              <input
                type="text"
                value={formData.bundleQty}
                onClick={() => {
                  setNumberPadTarget("bundleQty");
                  setShowNumberPad(true);
                }}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
          </div>

          {/* QR Code Controls */}
          <div className="flex justify-between mt-6">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleGenerateQR}
                disabled={
                  isGenerateDisabled ||
                  !formData.selectedMono ||
                  !formData.color ||
                  !formData.size ||
                  !formData.bundleQty ||
                  !formData.lineNo ||
                  !formData.count
                }
                className={`px-4 py-2 rounded-md flex items-center ${
                  formData.selectedMono &&
                  formData.color &&
                  formData.size &&
                  formData.bundleQty &&
                  formData.lineNo &&
                  formData.count
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <FaQrcode className="mr-2" /> Generate QR
              </button>
              {qrData.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowQRPreview(true)}
                    className="px-4 py-2 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 flex items-center"
                  >
                    <FaEye className="mr-2" /> Preview QR
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintQR}
                    className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 flex items-center"
                  >
                    <FaPrint className="mr-2" /> Print QR
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Number Pad Modal */}
        {showNumberPad && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20">
            {numberPadTarget === "bundleQty" ||
            numberPadTarget === "count" ||
            formData.factoryInfo === "YM" ? (
              <NumberPad
                onClose={() => setShowNumberPad(false)}
                onInput={handleNumberPadInput}
              />
            ) : (
              <NumLetterPad
                onClose={() => setShowNumberPad(false)}
                onInput={handleNumberPadInput}
              />
            )}
          </div>
        )}

        {/* QR Code Preview Modal */}
        <QRCodePreview
          isOpen={showQRPreview}
          onClose={() => setShowQRPreview(false)}
          qrData={qrData}
        />
      </div>
    </div>
  );
}

export default BundleRegistration;
