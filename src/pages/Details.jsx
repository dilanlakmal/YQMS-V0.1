import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FACTORIES,
  STYLE_CODES,
  getCustomerByStyleCode,
} from "../constants/data";
import MonoSearch from "../components/forms/MonoSearch";
import StyleCodeSelect from "../components/forms/StyleCodeSelect";
import StyleDigitInput from "../components/forms/StyleDigitInput";
import QRCodePreview from "../components/forms/QRCodePreview";

function Details({ onDetailsSubmit, isSubmitted, savedDetails }) {
  const navigate = useNavigate();
  const [leftActive, setLeftActive] = useState(false);
  const [rightActive, setRightActive] = useState(false);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [qrData, setQrData] = useState(null);
  const [showQRPreview, setShowQRPreview] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date(),
    factory: "",
    lineNo: "",
    styleCode: "",
    styleDigit: "",
    customer: "",
    moNo: "",
    monoSearch: "",
    selectedMono: "",
    buyer: "",
    orderQty: "",
    factoryInfo: "",
    custStyle: "",
    country: "",
    color: "",
    size: "",
  });

  useEffect(() => {
    if (savedDetails) {
      setFormData(savedDetails);
    }
  }, [savedDetails]);

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
        }));

        setColors(data.colors);
      } catch (error) {
        console.error("Error fetching order details:", error);
      }
    };

    fetchOrderDetails();
  }, [formData.selectedMono]);

  useEffect(() => {
    const fetchSizes = async () => {
      if (!formData.selectedMono || !formData.color) return;

      try {
        const response = await fetch(
          `http://localhost:5001/api/order-sizes/${formData.selectedMono}/${formData.color}`
        );
        const data = await response.json();
        setSizes(data);
      } catch (error) {
        console.error("Error fetching sizes:", error);
      }
    };

    fetchSizes();
  }, [formData.selectedMono, formData.color]);

  const validateStyleDigit = (value) => {
    const cleanValue = value.replace(/[^0-9a-zA-Z-]/g, "");
    const isOnlyNumbers = /^\d+$/.test(cleanValue);

    if (isOnlyNumbers) {
      if (cleanValue.length > 5) return cleanValue.slice(0, 5);
      if (cleanValue.length < 3) return cleanValue;
      return cleanValue;
    }

    return cleanValue;
  };

  const handleLeftToggle = () => {
    setLeftActive(!leftActive);
    setRightActive(false);
  };

  const handleRightToggle = () => {
    setRightActive(!rightActive);
    setLeftActive(false);
  };

  const handleStyleCodeChange = (code) => {
    if (isSubmitted) return;
    const customer = getCustomerByStyleCode(code);
    setFormData((prev) => ({
      ...prev,
      styleCode: code,
      customer,
      moNo: `${code}${prev.styleDigit}`,
    }));
  };

  const handleStyleDigitChange = (value) => {
    if (isSubmitted) return;
    const validatedValue = validateStyleDigit(value);
    setFormData((prev) => ({
      ...prev,
      styleDigit: validatedValue,
      moNo: `${prev.styleCode}${validatedValue}`,
    }));
  };

  const handleLineNoChange = (value) => {
    if (isSubmitted) return;
    const cleanValue = value.toUpperCase().replace(/\s+/g, "");
    setFormData((prev) => ({
      ...prev,
      lineNo: cleanValue,
    }));
  };

  const handleGenerateQR = () => {
    const data = {
      mono: formData.selectedMono,
      factory: formData.factoryInfo,
      buyer: formData.buyer,
      orderQty: formData.orderQty,
      color: formData.color,
      size: formData.size,
    };
    setQrData(data);
  };

  const handlePreviewQR = () => {
    setShowQRPreview(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSubmitted) {
      navigate("/inspection");
      return;
    }

    const leftFilled = formData.styleCode && formData.styleDigit;
    const rightFilled =
      formData.selectedMono && formData.color && formData.size;

    if (!leftFilled && !rightFilled) {
      alert("Please fill either Style Info or Order Info section");
      return;
    }

    if (leftFilled) {
      const isOnlyNumbers = /^\d+$/.test(formData.styleDigit);
      if (isOnlyNumbers && formData.styleDigit.length < 3) {
        alert("Style digit must be at least 3 digits when using numbers only");
        return;
      }
    }

    if (
      !formData.factory ||
      !formData.lineNo ||
      (!leftFilled && !rightFilled)
    ) {
      alert("Please fill in all required fields");
      return;
    }

    onDetailsSubmit(formData);
    navigate("/inspection");
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Quality Inspection Details
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Section - Style Info */}
            <div>
              <button
                type="button"
                onClick={handleLeftToggle}
                className={`mb-4 w-full py-2 rounded-md transition-colors ${
                  leftActive
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                }`}
              >
                Fill Below (Style Info)
              </button>

              <div className={`space-y-4 ${!leftActive ? "opacity-50" : ""}`}>
                <StyleCodeSelect
                  value={formData.styleCode}
                  onChange={handleStyleCodeChange}
                  onCustomerChange={(customer) =>
                    setFormData((prev) => ({ ...prev, customer }))
                  }
                  disabled={!leftActive || isSubmitted}
                />

                <StyleDigitInput
                  value={formData.styleDigit}
                  onChange={handleStyleDigitChange}
                  disabled={!leftActive || isSubmitted}
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer
                  </label>
                  <input
                    type="text"
                    value={formData.customer}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MO No
                  </label>
                  <input
                    type="text"
                    value={formData.moNo}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Right Section - Order Info */}
            <div>
              <button
                type="button"
                onClick={handleRightToggle}
                className={`mb-4 w-full py-2 rounded-md transition-colors ${
                  rightActive
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                }`}
              >
                Fill Below (Order Info)
              </button>

              <div className={`space-y-4 ${!rightActive ? "opacity-50" : ""}`}>
                <MonoSearch
                  value={formData.monoSearch}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, monoSearch: value }))
                  }
                  onSelect={(mono) =>
                    setFormData((prev) => ({
                      ...prev,
                      selectedMono: mono,
                      color: "",
                      size: "",
                      buyer: "",
                      orderQty: "",
                    }))
                  }
                  disabled={!rightActive || isSubmitted}
                />

                {formData.selectedMono && (
                  <div className="mb-4 p-2 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">
                      Selected MONo:{" "}
                      <span className="ml-2 font-bold text-blue-600">
                        {formData.selectedMono}
                      </span>
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buyer
                  </label>
                  <input
                    type="text"
                    value={formData.buyer}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Qty
                  </label>
                  <input
                    type="text"
                    value={formData.orderQty}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Factory
                  </label>
                  <input
                    type="text"
                    value={formData.factoryInfo}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Style
                  </label>
                  <input
                    type="text"
                    value={formData.custStyle}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <select
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={!rightActive || isSubmitted}
                  >
                    <option value="">Select Color</option>
                    {colors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, size: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={!rightActive || isSubmitted}
                  >
                    <option value="">Select Size</option>
                    {sizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <DatePicker
                selected={formData.date}
                onChange={(date) =>
                  !isSubmitted && setFormData((prev) => ({ ...prev, date }))
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isSubmitted ? "bg-gray-100" : ""
                }`}
                dateFormat="yyyy-MM-dd"
                disabled={isSubmitted}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Factory
              </label>
              <select
                value={formData.factory}
                onChange={(e) =>
                  !isSubmitted &&
                  setFormData((prev) => ({ ...prev, factory: e.target.value }))
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isSubmitted ? "bg-gray-100" : ""
                }`}
                disabled={isSubmitted}
                required
              >
                <option value="">Select Factory</option>
                {FACTORIES.map((factory) => (
                  <option key={factory} value={factory}>
                    {factory}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Line No
              </label>
              <input
                type="text"
                value={formData.lineNo}
                onChange={(e) => handleLineNoChange(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isSubmitted ? "bg-gray-100" : ""
                }`}
                disabled={isSubmitted}
                required
              />
            </div>
          </div>

          {/* QR Code Controls */}
          <div className="flex justify-between mt-6">
            <div className="space-x-4">
              <button
                type="button"
                onClick={handleGenerateQR}
                disabled={
                  !formData.selectedMono || !formData.color || !formData.size
                }
                className={`px-4 py-2 rounded-md ${
                  formData.selectedMono && formData.color && formData.size
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Generate QR Code
              </button>

              {qrData && (
                <button
                  type="button"
                  onClick={handlePreviewQR}
                  className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600"
                >
                  Preview QR Code
                </button>
              )}
            </div>

            <button
              type="submit"
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSubmitted ? "Continue to Inspection" : "Submit Details"}
            </button>
          </div>
        </form>

        <QRCodePreview
          isOpen={showQRPreview}
          onClose={() => setShowQRPreview(false)}
          qrData={qrData}
        />
      </div>
    </div>
  );
}

export default Details;
