import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaEye, FaMinus, FaPlus, FaPrint, FaQrcode } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import { useFormData } from "../components/context/FormDataContext";
import BluetoothComponent from "../components/forms/Bluetooth";
import MonoSearch from "../components/forms/MonoSearch";
import NumLetterPad from "../components/forms/NumLetterPad";
import NumberPad from "../components/forms/NumberPad";
import QRCodePreview from "../components/forms/QRCodePreview";
import ReprintTab from "../components/forms/ReprintTab";
import SubConSelection from "../components/forms/SubConSelection";

function BundleRegistration() {
  const { user, loading } = useAuth();
  const {
    formData: persistedFormData,
    updateFormData,
    clearFormData,
  } = useFormData();

  const [userBatches, setUserBatches] = useState([]);
  const navigate = useNavigate();
  const [qrData, setQrData] = useState([]);
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [numberPadTarget, setNumberPadTarget] = useState(null);
  const [isGenerateDisabled, setIsGenerateDisabled] = useState(false);
  const [activeTab, setActiveTab] = useState("registration");
  const [dataRecords, setDataRecords] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [totalBundleQty, setTotalBundleQty] = useState(0);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [hasColors, setHasColors] = useState(false);
  const [hasSizes, setHasSizes] = useState(false);
  const [isSubCon, setIsSubCon] = useState(
    () =>
      persistedFormData.bundleRegistration?.department === "Sub-con" || false
  );
  const [subConName, setSubConName] = useState(
    () => persistedFormData.bundleRegistration?.subConName || ""
  );
  const [estimatedTotal, setEstimatedTotal] = useState(null);

  const bluetoothComponentRef = useRef();
  const subConNames = ["Sunicon", "Win Sheng", "Yeewo", "Jinmyung"];

  const [formData, setFormData] = useState(() => {
    const savedData = persistedFormData.bundleRegistration;
    const today = new Date();

    return savedData && user
      ? {
          ...savedData,
          date: savedData.date ? new Date(savedData.date) : today,
        }
      : {
          date: today,
          department: "",
          selectedMono: "",
          buyer: "",
          orderQty: "",
          factoryInfo: "",
          custStyle: "",
          country: "",
          color: "",
          size: "",
          bundleQty: 1, // Default value for Bundle Qty
          lineNo: "",
          count: 10, // Default value for Count
          colorCode: "",
          chnColor: "",
          colorKey: "",
          sizeOrderQty: "",
          planCutQty: "",
        };
  });

  useEffect(() => {
    updateFormData("bundleRegistration", {
      ...formData,
      isSubCon,
      subConName,
    });
  }, [formData, isSubCon, subConName]);

  useEffect(() => {
    if (formData.department === "Sub-con") {
      setIsSubCon(true);
      setFormData((prev) => ({
        ...prev,
        lineNo: "SUB",
      }));
    } else if (formData.department === "Washing") {
      setFormData((prev) => ({
        ...prev,
        lineNo: "WA",
      }));
    } else {
      setIsSubCon(false);
      setSubConName("");
      setFormData((prev) => ({
        ...prev,
        lineNo: "",
      }));
    }
  }, [formData.department]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!formData.selectedMono) return;
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/order-details/${formData.selectedMono}`
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
          `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
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

  useEffect(() => {
    const fetchSizes = async () => {
      if (!formData.selectedMono || !formData.color) return;
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/order-sizes/${formData.selectedMono}/${formData.color}`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          setSizes(data);
          setHasSizes(true);

          const totalCountResponse = await fetch(
            `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${data[0].size}`
          );
          const totalCountData = await totalCountResponse.json();
          const totalGarmentsCount = totalCountData.totalCount;

          setFormData((prev) => ({
            ...prev,
            totalGarmentsCount,
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

  useEffect(() => {
    const interval = setInterval(async () => {
      if (formData.selectedMono && formData.color && formData.size) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${formData.size}`
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
    }, 500);

    return () => clearInterval(interval);
  }, [formData.selectedMono, formData.color, formData.size]);

  useEffect(() => {
    const fetchTotalBundleQty = async () => {
      if (!formData.selectedMono) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
        );
        const data = await response.json();
        setTotalBundleQty(data.total);
      } catch (error) {
        console.error("Error fetching total bundle quantity:", error);
      }
    };

    fetchTotalBundleQty();

    const interval = setInterval(fetchTotalBundleQty, 500);

    return () => clearInterval(interval);
  }, [formData.selectedMono]);

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
          `${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`
        );
        const data = await response.json();
        setUserBatches(data);
      } catch (error) {
        console.error("Error fetching user batches:", error);
      }
    };

    fetchUserBatches();
  }, [user]);

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

  const validateLineNo = () => {
    if (
      formData.factoryInfo === "YM" &&
      formData.department === "QC1 Endline"
    ) {
      const lineNo = parseInt(formData.lineNo);
      return lineNo >= 1 && lineNo <= 30;
    }
    return formData.lineNo === "WA" || formData.lineNo === "SUB";
  };

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
      const response = await fetch(`${API_BASE_URL}/api/check-bundle-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date.toISOString().split("T")[0],
          lineNo,
          selectedMono,
          color,
          size,
        }),
      });

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
          totalBundleQty: 1,
          sub_con: isSubCon ? "Yes" : "No",
          sub_con_factory: isSubCon ? subConName : "",
          emp_id: user.emp_id,
          eng_name: user.eng_name,
          kh_name: user.kh_name,
          job_title: user.job_title,
          dept_name: user.dept_name,
          sect_name: user.sect_name,
        };

        bundleData.push(bundleRecord);
      }

      const saveResponse = await fetch(`${API_BASE_URL}/api/save-bundle-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleData }),
      });

      if (saveResponse.ok) {
        const savedData = await saveResponse.json();
        setQrData(savedData.data);
        setIsGenerateDisabled(true);
        setFormData((prev) => ({
          ...prev,
          bundleQty: "",
        }));

        setDataRecords((prevRecords) => [...prevRecords, ...savedData.data]);

        try {
          const totalResponse = await fetch(
            `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
          );
          const totalData = await totalResponse.json();
          setTotalBundleQty(totalData.total);

          if (user) {
            const batchesResponse = await fetch(
              `${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`
            );
            const batchesData = await batchesResponse.json();
            setUserBatches(batchesData);
          }
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
      setIsGenerateDisabled(false);
      return;
    }

    try {
      setIsPrinting(true);

      for (const data of qrData) {
        await bluetoothComponentRef.current.printData({
          ...data,
          bundle_id: data.bundle_random_id,
        });
      }

      setFormData((prev) => ({
        ...prev,
        bundleQty: 1, // Reset to default value
        size: "",
        count: 10, // Reset to default value
      }));
      setIsGenerateDisabled(false);

      if (user) {
        const batchesResponse = await fetch(
          `${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`
        );
        const batchesData = await batchesResponse.json();
        setUserBatches(batchesData);
      }

      alert("QR codes printed successfully!");
    } catch (error) {
      alert(`Print failed: ${error.message}`);
      setIsGenerateDisabled(false);
    } finally {
      setIsPrinting(false);
    }
  };

  const incrementValue = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: parseInt(prev[field]) + 1,
    }));
  };

  const decrementValue = (field) => {
    if (formData[field] > 1) {
      setFormData((prev) => ({
        ...prev,
        [field]: parseInt(prev[field]) - 1,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Bundle Registration
        </h1>

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
          <button
            onClick={() => setActiveTab("reprint")}
            className={`px-4 py-2 rounded-md ${
              activeTab === "reprint"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Reprint
          </button>
        </div>

        {activeTab === "registration" ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
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
                    setFormData({ ...formData, selectedMono: mono })
                  }
                  placeholder="Search Last 3 Digits of MONo..."
                  showSearchIcon={true}
                  closeOnOutsideClick={true}
                />
              </div>
            </div>

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

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Line No
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.lineNo}
                  onClick={() => {
                    setNumberPadTarget("lineNo");
                    setShowNumberPad(true);
                  }}
                  readOnly={formData.department !== "QC1 Endline"}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md cursor-pointer"
                />
                {formData.department === "Washing" && (
                  <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
                    <span className="text-gray-500">WA</span>
                  </div>
                )}
                {formData.department === "Sub-con" && (
                  <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
                    <span className="text-gray-500">SUB</span>
                  </div>
                )}
              </div>
            </div>

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
                      const newFormData = {
                        ...formData,
                        color: e.target.value,
                        colorCode: selectedColor?.code || "",
                        chnColor: selectedColor?.chn || "",
                        colorKey: selectedColor?.key || "",
                        size: "",
                        sizeOrderQty: "",
                        planCutQty: "",
                      };
                      setFormData(newFormData);
                      updateFormData("bundleRegistration", newFormData);
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
                    <select
                      value={formData.size}
                      onChange={(e) => {
                        const selectedSize = sizes.find(
                          (s) => s.size === e.target.value
                        );
                        const newFormData = {
                          ...formData,
                          size: e.target.value,
                          sizeOrderQty: selectedSize?.orderQty || 0,
                          planCutQty: selectedSize?.planCutQty || 0,
                        };
                        setFormData(newFormData);
                        updateFormData("bundleRegistration", newFormData);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Count
                </label>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    type="button"
                    onClick={() => decrementValue("count")}
                    className="px-3 py-2 bg-gray-200 rounded-l-md"
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="text"
                    value={formData.count}
                    onClick={() => {
                      setNumberPadTarget("count");
                      setShowNumberPad(true);
                    }}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => incrementValue("count")}
                    className="px-3 py-2 bg-gray-200 rounded-r-md"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bundle Qty
                </label>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    type="button"
                    onClick={() => decrementValue("bundleQty")}
                    className="px-3 py-2 bg-gray-200 rounded-l-md"
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="text"
                    value={formData.bundleQty}
                    onClick={() => {
                      setNumberPadTarget("bundleQty");
                      setShowNumberPad(true);
                    }}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => incrementValue("bundleQty")}
                    className="px-3 py-2 bg-gray-200 rounded-r-md"
                  >
                    <FaPlus />
                  </button>
                </div>
                {formData.selectedMono && (
                  <p className="mt-2 text-sm text-gray-700">
                    Total Registered Bundle Qty: {totalBundleQty}
                  </p>
                )}
              </div>
            </div>

            {formData.department !== "Sub-con" && (
              <SubConSelection
                isSubCon={isSubCon}
                setIsSubCon={setIsSubCon}
                subConName={subConName}
                setSubConName={setSubConName}
              />
            )}

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
                      }`}
                    >
                      <FaPrint className="mr-2" />
                      {isPrinting ? "Printing..." : "Print QR"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === "data" ? (
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
                      Package NO
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Date
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
                        {batch.package_no}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
                        {batch.updated_date_seperator}
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
        ) : (
          <ReprintTab />
        )}

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

        <QRCodePreview
          isOpen={showQRPreview}
          onClose={() => setShowQRPreview(false)}
          qrData={qrData}
          onPrint={handlePrintQR}
        />
      </div>
    </div>
  );
}

export default BundleRegistration;
