import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaEye, FaMinus, FaPlus, FaPrint, FaQrcode, FaFilter, FaTimes, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import { useFormData } from "../components/context/FormDataContext";
import BluetoothComponent from "../components/forms/Bluetooth";
import EditModal from "../components/forms/EditBundleData";
import MonoSearch from "../components/forms/MonoSearch";
import NumLetterPad from "../components/forms/NumLetterPad";
import NumberPad from "../components/forms/NumberPad";
import QRCodePreview from "../components/forms/QRCodePreview";
import ReprintTab from "../components/forms/ReprintTab";
import SubConSelection from "../components/forms/SubConSelection";
import { useTranslation } from 'react-i18next';

function BundleRegistration() {
  const { t } = useTranslation();
  const { user, loading } = useAuth(); // Get the logged-in user data
  const { formData: persistedFormData, updateFormData, clearFormData } = useFormData();
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
    () => persistedFormData.bundleRegistration?.department === "Sub-con" || false
  );
  const [subConName, setSubConName] = useState(
    () => persistedFormData.bundleRegistration?.subConName || ""
  );
  const [estimatedTotal, setEstimatedTotal] = useState(null);

  const bluetoothComponentRef = useRef();
  const subConNames = ["Sunicon", "Win Sheng", "Yeewo", "Jinmyung"];

  const [editModalOpen, setEditModalOpen] = useState(false); // State to control the edit modal
  const [editRecordId, setEditRecordId] = useState(null); // State to store the ID of the record being edited
  const [styleCodeFilter, setStyleCodeFilter] = useState("");
  const [packageNoFilter, setPackageNoFilter] = useState("");
  const [monoFilter, setMonoFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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

  const [showOrderDetails, setShowOrderDetails] = useState(false); // State to track visibility

  const toggleOrderDetails = () => {
    setShowOrderDetails(!showOrderDetails);
  };

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

  // Handle edit button click
  const handleEdit = (recordId) => {
    const record = userBatches.find((batch) => batch._id === recordId);
    if (record) {
      setFormData({
        id: record._id,
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

  const clearFilters = () => {
    setStyleCodeFilter("");
    setPackageNoFilter("");
    setMonoFilter("");
    setColorFilter("");
    setSizeFilter("");
  };

  const filteredBatches = userBatches.filter((batch) => {
    const matchesStyleCode = styleCodeFilter
      ? batch.custStyle?.toLowerCase().includes(styleCodeFilter.toLowerCase())
      : true;
    const matchesColor = colorFilter
      ? batch.color?.toLowerCase().includes(colorFilter.toLowerCase())
      : true;
    const matchesSize = sizeFilter
      ? batch.size?.toLowerCase().includes(sizeFilter.toLowerCase())
      : true;
    const matchesPackageNo = packageNoFilter
      ? batch.package_no?.toString().toLowerCase().includes(packageNoFilter.toLowerCase())
      : true;
    const matchesMono = monoFilter
      ? batch.selectedMono?.toLowerCase().endsWith(monoFilter.toLowerCase())
      : true;
    return matchesStyleCode && matchesPackageNo && matchesMono && matchesColor && matchesSize;
  });

  return (
    <div className="h-screen flex flex-col bg-blue-50">
      {/* Header with tabs */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            {t('bundle.bundle_registration')}
          </h1>
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("registration")}
              className={`px-3 py-1.5 text-sm rounded-md ${
                activeTab === "registration"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {t('bundle.registration')}
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`px-3 py-1.5 text-sm rounded-md ${
                activeTab === "data"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {t('bundle.data')}
            </button>
            <button
              onClick={() => setActiveTab("reprint")}
              className={`px-3 py-1.5 text-sm rounded-md ${
                activeTab === "reprint"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {t('bundle.reprint')}
            </button>
          </div>
        </div>
      </div>

      {/* Main content area - scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto p-2">
          {activeTab === "registration" ? (
            <div className="bg-white rounded-lg shadow-md p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="flex items-end space-x-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("bundle.date")}
                  </label>
                  <DatePicker
                    selected={formData.date}
                    onChange={(date) =>
                      setFormData((prev) => ({ ...prev, date }))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
                <BluetoothComponent ref={bluetoothComponentRef} />
              </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("bundle.department")}
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="">{t("bundle.select_department")}</option>
                    <option value="QC1 Endline">{t("bundle.qc1_endline")}</option>
                    <option value="Washing">{t("bundle.washing")}</option>
                    <option value="Sub-con">{t("bundle.sub_con")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("bundle.search_mono")}
                  </label>
                  <MonoSearch
                    value={formData.selectedMono}
                    onSelect={(mono) =>
                      setFormData({ ...formData, selectedMono: mono })
                    }
                    placeholder="Search Last 3 Digits of MONo..."
                    showSearchIcon={true}
                    closeOnOutsideClick={true}
                    inputMode="numeric"
                  />
                  {formData.selectedMono && (
                    <div className="mt-2 text-sm text-gray-700">
                      <strong>{t("bundle.selected_mono")}:</strong> {formData.selectedMono}
                    </div>
                  )}
                </div>
              </div>

              {formData.selectedMono && (
              <div className="mb-2 p-2 bg-gray-50 rounded-md text-xs">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-bold text-gray-800 ">
                    {t("bundle.order_details")}
                  </h2>
                  <button
                    onClick={toggleOrderDetails}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showOrderDetails ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {showOrderDetails && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-700">
                        <span className="font-bold">{t("bundle.selected_mono")}:</span>{" "}
                        {formData.selectedMono}
                      </p>
                      <p className="text-xs text-gray-700">
                        <span className="font-bold">{t("bundle.customer_style")}:</span>{" "}
                        {formData.custStyle}
                      </p>
                      <p className="text-xs text-gray-700">
                        <span className="font-bold">{t("bundle.buyer")}:</span> {formData.buyer}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-700">
                        <span className="font-bold">{t("bundle.country")}:</span>{" "}
                        {formData.country}
                      </p>
                      <p className="text-xs text-gray-700">
                        <span className="font-bold">{t("bundle.order_qty")}:</span>{" "}
                        {formData.orderQty}
                      </p>
                      <p className="text-xs text-gray-700">
                        <span className="font-bold">{t("bundle.factory")}:</span>{" "}
                        {formData.factoryInfo}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("bundle.line_no")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.lineNo}
                    onClick={() => {
                      setNumberPadTarget("lineNo");
                      setShowNumberPad(true);
                    }}
                    readOnly
                    //readOnly={formData.department !== "QC1 Endline"}
                    className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md cursor-pointer"
                  />
                  {formData.department === "Washing" && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <span className="text-gray-500 text-xs">WA</span>
                    </div>
                  )}
                  {formData.department === "Sub-con" && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <span className="text-gray-500 text-xs">SUB</span>
                    </div>
                  )}
                </div>
              </div>

             
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("bundle.color")}
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
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="">{t("bundle.select_color")}</option>
                      {colors.map((color) => (
                        <option key={color.original} value={color.original}>
                          {color.original}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-gray-500 py-1.5">{t("bundle.no_colors_available")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("bundle.size")}
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="">Select Size</option>
                        {sizes.map((sizeObj) => (
                          <option key={sizeObj.size} value={sizeObj.size}>
                            {sizeObj.size}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-gray-500 py-1.5">{t("bundle.no_size_available")}</p>
                    )
                  ) : (
                    <p className="text-xs text-gray-500 py-1.5">{t("bundle.no_colors_available")}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                {formData.sizeOrderQty > 0 && (
                  <div className="p-1.5 bg-blue-50 rounded-md">
                    <span className="text-xs font-medium">{t("bundle.size_order_qty")}: </span>
                    <span className="text-xs">{formData.sizeOrderQty}</span>
                  </div>
                )}
                {formData.planCutQty > 0 && (
                  <div className="p-1.5 bg-green-50 rounded-md">
                    <span className="text-xs font-medium">{t("bundle.plan_cut_qty")}: </span>
                    <span className="text-xs">{formData.planCutQty}</span>
                  </div>
                )}
              </div>

              {formData.totalGarmentsCount !== undefined && (
                <div
                  className={`mt-1 text-xs ${
                    formData.totalGarmentsCount > formData.planCutQty
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                >
                  {t("bundle.total_garment_count")}: {formData.totalGarmentsCount}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("bundle.count")}
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      type="button"
                      onClick={() => decrementValue("count")}
                      className="px-2 py-1 bg-gray-200 rounded-l-md"
                    >
                      <FaMinus size={12} />
                    </button>
                    <input
                      type="text"
                      value={formData.count}
                      onClick={() => {
                        setNumberPadTarget("count");
                        setShowNumberPad(true);
                      }}
                      readOnly
                      className="w-full px-2 py-1 text-sm bg-gray-50 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => incrementValue("count")}
                      className="px-2 py-1 bg-gray-200 rounded-r-md"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("bundle.bundle_qty")}
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      type="button"
                      onClick={() => decrementValue("bundleQty")}
                      className="px-2 py-1 bg-gray-200 rounded-l-md"
                    >
                      <FaMinus size={12} />
                    </button>
                    <input
                      type="text"
                      value={formData.bundleQty}
                      onClick={() => {
                        setNumberPadTarget("bundleQty");
                        setShowNumberPad(true);
                      }}
                      readOnly
                      className="w-full px-2 py-1 text-sm bg-gray-50 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => incrementValue("bundleQty")}
                      className="px-2 py-1 bg-gray-200 rounded-r-md"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                  {formData.selectedMono && (
                    <p className="mt-1 text-xs text-gray-700">
                      {t("bundle.total_registered_bundle_qty")}: {totalBundleQty}
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
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("bundle.sub_con_factory")}
                  </label>
                  <select
                    value={subConName}
                    onChange={(e) => setSubConName(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="">{t("bundle.select_sub_con_factory")}</option>
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
                  className={`mt-1 text-xs ${
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

              <div className="flex justify-between mt-3">
                <div className="flex flex-wrap gap-2">
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
                    className={`px-3 py-1.5 rounded-md flex items-center text-xs ${
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
                    <FaQrcode className="mr-1" size={12} /> {t("bundle.generate_qr")}
                  </button>
                  {qrData.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowQRPreview(true)}
                        className="px-3 py-1.5 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 flex items-center text-xs"
                      >
                        <FaEye className="mr-1" size={12} /> {t("bundle.preview_qr")}
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintQR}
                        disabled={isPrinting}
                        className={`px-3 py-1.5 rounded-md flex items-center text-xs ${
                          isPrinting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                        } text-white`}
                      >
                        <FaPrint className="mr-1" size={12} />
                        {isPrinting ? t("bundle.printing") : t("bundle.print_qr")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "data" ? (
            <div className="bg-white rounded-lg shadow-md p-3">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-bold text-gray-800">{t("bundle.data")}</h2>
                <div className="flex items-center">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center text-xs bg-blue-500 text-white px-2 py-1 rounded-md mr-2"
                  >
                    <FaFilter className="mr-1" size={10} /> {showFilters ? "Hide Filters" : "Show Filters"}
                  </button>
                  {showFilters && (
                    <button 
                      onClick={clearFilters}
                      className="flex items-center text-xs bg-gray-200 px-2 py-1 rounded-md"
                    >
                      <FaTimes className="mr-1" size={10} /> Clear
                    </button>
                  )}
                </div>
              </div>
              
              {showFilters && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Filter by Color"
                    value={colorFilter}
                    onChange={(e) => setColorFilter(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Filter by Size"
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Filter by Style Code"
                    value={styleCodeFilter}
                    onChange={(e) => setStyleCodeFilter(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Filter by Package No"
                    value={packageNoFilter}
                    onChange={(e) => setPackageNoFilter(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Filter by MONo"
                    value={monoFilter}
                    onChange={(e) => setMonoFilter(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md col-span-2"
                  />
                </div>
              )}

              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-sky-100">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.record_id")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.package_no")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.date")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.modify")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.time")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.department")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.emp_id")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.eng_name")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.kh_name")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.mono")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.customer_style")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.buyer")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.country")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.total_order_qty")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.factory")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.line_no")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.color")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.color_chi")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.size")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.order_cut_qty")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.plan_cut_qty")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.count")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.total_bundle_qty")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.sub_con")}
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {t("bundle.sub_con_factory")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBatches.map((batch, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {index + 1}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.package_no}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.updated_date_seperator}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        <button
                          onClick={() => handleEdit(batch._id)}
                          className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border border-gray-800 bg-green-400"
                        >
                          {t("bundle.edit")}
                        </button>
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.updated_time_seperator}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.department}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.emp_id}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.eng_name}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.kh_name}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.selectedMono}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.custStyle}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.buyer}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.country}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.orderQty}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.factory}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.lineNo}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.color}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.chnColor}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.size}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.sizeOrderQty}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.planCutQty}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.count}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.bundleQty}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.sub_con}
                      </td>
                      <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                        {batch.sub_con === "Yes" ? batch.sub_con_factory : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                Showing {filteredBatches.length} of {userBatches.length} records
              </div>
            </div>
          ) : (
            <ReprintTab />
          )}
        </div>
      </div>

      {/* Modals and overlays */}
      {showNumberPad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
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
        </div>
      )}

      <QRCodePreview
        isOpen={showQRPreview}
        onClose={() => setShowQRPreview(false)}
        qrData={qrData}
        onPrint={handlePrintQR}
        mode="production"
      />

      {/* Edit Modal */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        setUserBatches={setUserBatches}
        setEditModalOpen={setEditModalOpen}
      />
    </div>
  );
}

export default BundleRegistration;