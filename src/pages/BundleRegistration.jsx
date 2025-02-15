import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaEye, FaPrint, FaQrcode } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authentication/AuthContext"; // Import the AuthContext
import BluetoothComponent from "../components/forms/Bluetooth";
import MonoSearch from "../components/forms/MonoSearch";
import NumLetterPad from "../components/forms/NumLetterPad";
import NumberPad from "../components/forms/NumberPad";
import QRCodePreview from "../components/forms/QRCodePreview";
import SubConSelection from "../components/forms/SubConSelection";
import { useTranslation } from 'react-i18next';
import EditModal from "../components/forms/EditBundleData"; 

function BundleRegistration() {
  const { t } = useTranslation();
  const { user, loading } = useAuth(); // Get the logged-in user data
  const [userBatches, setUserBatches] = useState([]);
  const navigate = useNavigate();
  const [qrData, setQrData] = useState([]);
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [numberPadTarget, setNumberPadTarget] = useState(null);
  const [isGenerateDisabled, setIsGenerateDisabled] = useState(false);
  const [activeTab, setActiveTab] = useState("registration");
  const [dataRecords, setDataRecords] = useState([]);
  const [isSubCon, setIsSubCon] = useState(false);
  const [subConName, setSubConName] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [totalBundleQty, setTotalBundleQty] = useState(0);

  const [formData, setFormData] = useState({
    date: new Date(),
    department: "",
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
    colorCode: "",
    chnColor: "",
    colorKey: "",
    sizeOrderQty: "",
    planCutQty: "",
  });

  const [editModalOpen, setEditModalOpen] = useState(false); // State to control the edit modal
  const [editRecordId, setEditRecordId] = useState(null); // State to store the ID of the record being edited

  // Reference to Bluetooth component
  const bluetoothComponentRef = useRef();

  // Hardcoded Sub Con names

  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [hasColors, setHasColors] = useState(false);
  const [hasSizes, setHasSizes] = useState(false);

  const subConNames = ["Sunicon", "Elite", "SYD"];
  const [estimatedTotal, setEstimatedTotal] = useState(null);

  // Add useEffect to handle department change
  useEffect(() => {
    if (formData.department === "Sub-con") {
      setIsSubCon(true);
    } else {
      setIsSubCon(false);
      setSubConName("");
    }
  }, [formData.department]);

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
          colorCode: "",
          chnColor: "",
          colorKey: "",
          size: "",
          sizeOrderQty: "",
          planCutQty: "",
        }));

        const totalResponse = await fetch(
          `http://localhost:5001/api/total-bundle-qty/${formData.selectedMono}`
        );
        if (!totalResponse.ok)
          throw new Error("Failed to fetch total bundle quantity");
        const totalData = await totalResponse.json();
        setTotalBundleQty(totalData.total);

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

          // Fetch total garments count for the selected MONo, Color, and Size
          const totalCountResponse = await fetch(
            `http://localhost:5001/api/total-garments-count/${formData.selectedMono}/${formData.color}/${data[0].size}`
          );
          const totalCountData = await totalCountResponse.json();
          const totalGarmentsCount = totalCountData.totalCount;

          setFormData((prev) => ({
            ...prev,
            totalGarmentsCount, // Add this line
          }));
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

  // Fetch total garments count for the selected MONo, Color, and Size

  useEffect(() => {
    const interval = setInterval(async () => {
      if (formData.selectedMono && formData.color && formData.size) {
        try {
          const response = await fetch(
            `http://localhost:5001/api/total-garments-count/${formData.selectedMono}/${formData.color}/${formData.size}`
          );
          const data = await response.json();
          setFormData((prev) => ({
            ...prev,
            totalGarmentsCount: data.totalCount,
          }));
        } catch (error) {
          console.error("Error fetching updated total:", error);
        }
      }
    }, 500); // Update every 0.5 seconds

    return () => clearInterval(interval);
  }, [formData.selectedMono, formData.color, formData.size]);

  // Add this useEffect for real-time total bundle quantity updates
  useEffect(() => {
    const fetchTotalBundleQty = async () => {
      if (!formData.selectedMono) return;

      try {
        const response = await fetch(
          `http://localhost:5001/api/total-bundle-qty/${formData.selectedMono}`
        );
        const data = await response.json();
        setTotalBundleQty(data.total);
      } catch (error) {
        console.error("Error fetching total bundle quantity:", error);
      }
    };

    // Fetch immediately when component mounts or selectedMono changes
    fetchTotalBundleQty();

    // Set up interval to fetch every 0.5 seconds
    const interval = setInterval(fetchTotalBundleQty, 500);

    // Cleanup interval on component unmount or selectedMono change
    return () => clearInterval(interval);
  }, [formData.selectedMono]);

  // Calculate estimated total

  useEffect(() => {
    if (
      formData.totalGarmentsCount === undefined ||
      formData.count === "" ||
      formData.bundleQty === ""
    ) {
      setEstimatedTotal(null);
      return;
    }
    const newEstimatedTotal =
      formData.totalGarmentsCount +
      parseInt(formData.count) * parseInt(formData.bundleQty);
    setEstimatedTotal(newEstimatedTotal);
  }, [formData.totalGarmentsCount, formData.count, formData.bundleQty]);

  useEffect(() => {
    const fetchUserBatches = async () => {
      try {
        if (!user) return;
        const response = await fetch(
          `http://localhost:5001/api/user-batches?emp_id=${user.emp_id}`
        );
        const data = await response.json();
        setUserBatches(data);
      } catch (error) {
        console.error("Error fetching user batches:", error);
      }
    };

    fetchUserBatches();
  }, [user]);

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
    if (!user || loading) {
      alert("User data is not available. Please try again.");
      return;
    }

    if (!validateLineNo()) {
      alert("Invalid Line No. It must be between 1 and 30 for YM factory.");
      return;
    }

    const { date, selectedMono, color, size, lineNo } = formData;

    if (formData.totalGarmentsCount > formData.planCutQty) return;

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
          date: date.toLocaleDateString("en-US"),
          department: formData.department,
          selectedMono,
          custStyle: formData.custStyle,
          buyer: formData.buyer,
          country: formData.country,
          orderQty: formData.orderQty,
          factory: formData.factoryInfo,
          lineNo,
          color,
          colorCode: formData.colorCode,
          chnColor: formData.chnColor,
          colorKey: formData.colorKey,
          size,
          sizeOrderQty: formData.sizeOrderQty,
          planCutQty: formData.planCutQty,
          count: formData.count,
          bundleQty: formData.bundleQty,
          totalBundleQty: 1, // This is always 1 for each record, becuase when user Generate QR, it's for one bundle
          sub_con: isSubCon ? "Yes" : "No",
          sub_con_factory: isSubCon ? subConName : "",
          // Add user data
          emp_id: user.emp_id,
          eng_name: user.eng_name,
          kh_name: user.kh_name,
          job_title: user.job_title,
          dept_name: user.dept_name,
          sect_name: user.sect_name,
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
        const savedData = await saveResponse.json();
        setQrData(savedData.data);
        setIsGenerateDisabled(true); // Disable Generate QR button
        // Reset bundleQty in form data
        setFormData((prev) => ({
          ...prev,
          bundleQty: "",
        }));

        // After successful save, update the client's data records
        setDataRecords((prevRecords) => [...prevRecords, ...savedData.data]);

        // Fetch and update totalBundleQty IMMEDIATELY after saving
        try {
          const totalResponse = await fetch(
            `http://localhost:5001/api/total-bundle-qty/${formData.selectedMono}`
          );
          const totalData = await totalResponse.json();
          setTotalBundleQty(totalData.total);
        } catch (error) {
          console.error("Error updating total bundle quantity:", error);
        }
      } else {
        alert("Failed to save bundle data.");
      }
    } catch (error) {
      console.error("Error saving bundle data:", error);
      alert("Failed to save bundle data.");
    }
  };

  const handlePrintQR = async () => {
    if (!bluetoothComponentRef.current) {
      alert("Bluetooth component not initialized");
      setIsGenerateDisabled(false); // Enable Generate QR immediately if Bluetooth isn't ready
      return;
    }

    try {
      setIsPrinting(true);

      // Print each QR code sequentially
      for (const data of qrData) {
        await bluetoothComponentRef.current.printData({
          ...data,
          bundle_id: data.bundle_random_id, // Use the correct field for QR content
        });
      }

      // Clear form after successful print
      setFormData((prev) => ({
        ...prev,
        bundleQty: "",
      }));
      setIsGenerateDisabled(false); // Enable Generate QR after successful print

      alert("QR codes printed successfully!");
    } catch (error) {
      alert(`Print failed: ${error.message}`);
      setIsGenerateDisabled(false); // Re-enable Generate QR on print failure
    } finally {
      setIsPrinting(false);
    }
  };

// Handle edit button click
const handleEdit = (recordId) => {
  const record = userBatches.find((batch) => batch.id === recordId);
  if (record) {
    setFormData({
      date: new Date(record.date),
      department: record.department,
      selectedMono: record.selectedMono,
      buyer: record.buyer,
      orderQty: record.orderQty,
      factoryInfo: record.factory,
      custStyle: record.custStyle,
      country: record.country,
      color: record.color,
      size: record.size,
      bundleQty: record.bundleQty,
      lineNo: record.lineNo,
      count: record.count,
      colorCode: record.colorCode,
      chnColor: record.chnColor,
      colorKey: record.colorKey,
      sizeOrderQty: record.sizeOrderQty,
      planCutQty: record.planCutQty,
    });
    setEditRecordId(recordId);
    setEditModalOpen(true);
  }
};

// Handle save button click in the modal
const handleSave = async () => {
  try {
    const response = await fetch(
      `http://localhost:5001/api/update-bundle-data/${editRecordId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }
    );
    if (response.ok) {
      const updatedRecord = await response.json();
      setUserBatches((prevBatches) =>
        prevBatches.map((batch) =>
          batch.id === editRecordId ? updatedRecord : batch
        )
      );
      setEditModalOpen(false);
      alert("Record updated successfully!");
    } else {
      alert("Failed to update record.");
    }
  } catch (error) {
    console.error("Error updating record:", error);
    alert("Failed to update record.");
  }
};


  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {t('bundle_registration')}
        </h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("registration")}
            className={`px-4 py-2 rounded-md ${
              activeTab === "registration"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Registration
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`px-4 py-2 rounded-md ${
              activeTab === "data"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Data
          </button>
        </div>

        {activeTab === "registration" ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Date Picker and MONo Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <DatePicker
                  selected={formData.date}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, date }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              <div className="flex items-end">
                <BluetoothComponent ref={bluetoothComponentRef} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Department</option>
                  <option value="QC1 Endline">QC1 Endline</option>
                  <option value="Washing">Washing</option>
                  <option value="Dyeing">Dyeing</option>
                  <option value="Sub-con">Sub-con</option>
                </select>
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
            {/* Line No */}
            <div className="mb-6">
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
            {/* Color and Size in one line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                {hasColors ? (
                  <select
                    value={formData.color}
                    onChange={(e) => {
                      const selectedColor = colors.find(
                        (c) => c.original === e.target.value
                      );
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                        colorCode: selectedColor?.code || "",
                        chnColor: selectedColor?.chn || "",
                        colorKey: selectedColor?.key || "",
                        size: "",
                        sizeOrderQty: "",
                        planCutQty: "",
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Color</option>
                    {colors.map((color) => (
                      <option key={color.original} value={color.original}>
                        {color.original}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">No Colors Available</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                {hasColors ? (
                  hasSizes ? (
                    // Update the size dropdown and selection handler
                    <select
                      value={formData.size}
                      onChange={(e) => {
                        const selectedSize = sizes.find(
                          (s) => s.size === e.target.value
                        );
                        setFormData((prev) => ({
                          ...prev,
                          size: e.target.value,
                          sizeOrderQty: selectedSize?.orderQty || 0,
                          planCutQty: selectedSize?.planCutQty || 0,
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Size</option>
                      {sizes.map((sizeObj) => (
                        <option key={sizeObj.size} value={sizeObj.size}>
                          {sizeObj.size}
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
            </div>
            {/* Size Order Qty and Plan Cut Qty */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              {formData.sizeOrderQty > 0 && (
                <div className="p-2 bg-blue-50 rounded-md">
                  <span className="text-sm font-medium">Size Order Qty: </span>
                  <span className="text-sm">{formData.sizeOrderQty}</span>
                </div>
              )}
              {formData.planCutQty > 0 && (
                <div className="p-2 bg-green-50 rounded-md">
                  <span className="text-sm font-medium">Plan Cut Qty: </span>
                  <span className="text-sm">{formData.planCutQty}</span>
                </div>
              )}
            </div>
            {/* Display Total Garments Count */}
            {formData.totalGarmentsCount !== undefined && (
              <div
                className={`mt-2 text-sm ${
                  formData.totalGarmentsCount > formData.planCutQty
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                Total Garments Count: {formData.totalGarmentsCount}
              </div>
            )}

            {/* Count and Bundle Qty in one line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                {formData.selectedMono && (
                  <p className="mt-2 text-sm text-gray-700">
                    Total Registered Bundle Qty: {totalBundleQty}
                  </p>
                )}
              </div>
            </div>
            {/* Sub Con Selection - Modified to show only when department is not Sub-con */}
            {formData.department !== "Sub-con" && (
              <SubConSelection
                isSubCon={isSubCon}
                setIsSubCon={setIsSubCon}
                subConName={subConName}
                setSubConName={setSubConName}
              />
            )}
            {/* When department is Sub-con, show forced Sub-con selection */}
            {formData.department === "Sub-con" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-con Factory
                </label>
                <select
                  value={subConName}
                  onChange={(e) => setSubConName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Sub-con Factory</option>
                  {subConNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.planCutQty !== undefined && estimatedTotal !== null && (
              <div
                className={`mt-2 text-sm ${
                  estimatedTotal > formData.planCutQty
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {estimatedTotal > formData.planCutQty
                  ? `⚠️ Actual Cut Qty (${estimatedTotal}) exceeds Plan Cut Qty (${formData.planCutQty}). Please adjust values.`
                  : `✅ Actual Cut Qty (${estimatedTotal}) is within Plan Cut Qty (${formData.planCutQty}).`}
              </div>
            )}

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
                    !formData.count ||
                    (estimatedTotal !== null &&
                      estimatedTotal > formData.planCutQty)
                  }
                  className={`px-4 py-2 rounded-md flex items-center ${
                    formData.selectedMono &&
                    formData.color &&
                    formData.size &&
                    formData.bundleQty &&
                    formData.lineNo &&
                    formData.count
                      ? (estimatedTotal !== null &&
                        estimatedTotal > formData.planCutQty
                          ? "bg-red-500"
                          : "bg-green-500") + " text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"

                    // formData.count
                    //   ? "bg-green-500 text-white hover:bg-green-600"
                    //   : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
                      disabled={isPrinting}
                      className={`px-4 py-2 rounded-md flex items-center ${
                        isPrinting
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600"
                      } text-white`}
                    >
                      <FaPrint className="mr-2" />
                      {isPrinting ? "Printing..." : "Print QR"}
                    </button>
                    {/* <button
                      type="button"
                      onClick={handlePrintQR}
                      className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 flex items-center"
                    >
                      <FaPrint className="mr-2" /> Print QR
                    </button> */}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Data</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-sky-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Record ID
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Modify
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Time
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Department
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      EmpID
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      EngName
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      KhName
                    </th>

                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      MONo
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Customer Style
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Buyer
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Country
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Total Order Qty
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
                      Color-Chi
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Size
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Order Cut Qty
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Plan Cut Qty
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Count
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Total Bundle Qty
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Sub Con
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Sub Con Factory
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userBatches.map((batch, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.updated_date_seperator}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                      <button
                          onClick={() => handleEdit(batch.id)}
                          className="ml-2 text-gray-900 font-m hover:text-blue-800 border px-4 py-2 bg-green-500"
                        >
                          Edit
                        </button>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.updated_time_seperator}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.department}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.emp_id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.eng_name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.kh_name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.selectedMono}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.custStyle}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.buyer}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.country}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.orderQty}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.factory}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.lineNo}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.color}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.chnColor}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.size}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.sizeOrderQty}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.planCutQty}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.count}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.bundleQty}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.sub_con}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.sub_con === "Yes"
                          ? batch.sub_con_factory
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
          onPrint={handlePrintQR}
        />

        {/* Edit Modal */}
        <EditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          formData={formData}
          setFormData={setFormData}
          handleSave={handleSave}
        />
      </div>
    </div>
  );
}

export default BundleRegistration;

//{dataRecords.map((record, index) => (
