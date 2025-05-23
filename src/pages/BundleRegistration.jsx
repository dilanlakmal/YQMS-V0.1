import { useEffect, useRef, useState, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import {
  FaEye,
  FaEyeSlash,
  FaFilter,
  FaMinus,
  FaPlus,
  FaPrint,
  FaQrcode,
  FaTimes
} from "react-icons/fa";
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

function BundleRegistration() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const {
    formData: persistedFormData,
    updateFormData,
    clearFormData
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
  const [isSubCon, setIsSubCon] = useState(() => {
    const savedDepartment = persistedFormData.bundleRegistration?.department;
    if (savedDepartment === "Sub-con") return true; // Default to "Yes" for Sub-con
    return false; // Default to "No" for all other cases
  });
  // const [isSubCon, setIsSubCon] = useState(
  //   () =>
  //     persistedFormData.bundleRegistration?.department === "Sub-con" || false
  // );
  const [subConName, setSubConName] = useState(
    () => persistedFormData.bundleRegistration?.subConName || ""
  );
  const [estimatedTotal, setEstimatedTotal] = useState(null);

  const bluetoothComponentRef = useRef();
  const subConNames = ["Sunicon", "Win Sheng", "Yeewo", "Jinmyung"];

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecordId, setEditRecordId] = useState(null);
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
          date: savedData.date ? new Date(savedData.date) : today
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
          bundleQty: 1,
          lineNo: "",
          count: 10,
          colorCode: "",
          chnColor: "",
          colorKey: "",
          sizeOrderQty: "",
          planCutQty: ""
        };
  });

  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const memoizedQrData = useMemo(() => qrData, [qrData]);

  const toggleOrderDetails = () => {
    setShowOrderDetails(!showOrderDetails);
  };

  useEffect(() => {
    updateFormData("bundleRegistration", {
      ...formData,
      isSubCon,
      subConName
    });
  }, [formData, isSubCon, subConName]);

  useEffect(() => {
    if (formData.department === "Sub-con") {
      setIsSubCon(true); // Default to "Yes" for Sub-con
      setFormData((prev) => ({
        ...prev,
        lineNo: "SUB"
      }));
    } else if (formData.department === "Washing") {
      setIsSubCon(false); // Default to "No" for Washing
      setSubConName(""); // Reset subConName when not Sub-con
      setFormData((prev) => ({
        ...prev,
        lineNo: "WA"
      }));
    } else if (formData.department === "QC1 Endline") {
      setIsSubCon(false); // Default to "No" for QC1 Endline
      setSubConName(""); // Reset subConName when not Sub-con
      setFormData((prev) => ({
        ...prev,
        lineNo: ""
      }));
    } else {
      setIsSubCon(false); // Default to "No" for any other case (e.g., empty department)
      setSubConName(""); // Reset subConName
      setFormData((prev) => ({
        ...prev,
        lineNo: ""
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
          planCutQty: ""
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
            totalGarmentsCount
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
            totalGarmentsCount: data.totalCount
          }));
        } catch (error) {
          console.error("Error fetching updated total:", error);
        }
      }
    }, 3000);

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

    const interval = setInterval(fetchTotalBundleQty, 3000);

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
        bundleQty: value
      }));
    } else if (numberPadTarget === "lineNo") {
      setFormData((prev) => ({
        ...prev,
        lineNo: value
      }));
    } else if (numberPadTarget === "count") {
      setFormData((prev) => ({
        ...prev,
        count: value
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
          size
        })
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
          sect_name: user.sect_name
        };

        bundleData.push(bundleRecord);
      }

      const saveResponse = await fetch(`${API_BASE_URL}/api/save-bundle-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleData })
      });

      if (saveResponse.ok) {
        const savedData = await saveResponse.json();
        setQrData(savedData.data);
        setIsGenerateDisabled(true);
        setFormData((prev) => ({
          ...prev,
          bundleQty: ""
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
          bundle_id: data.bundle_random_id
        });
      }

      setFormData((prev) => ({
        ...prev,
        bundleQty: 1,
        size: "",
        count: 10
      }));
      setIsGenerateDisabled(false);

      if (user) {
        const batchesResponse = await fetch(
          `${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`
        );
        const batchesData = await batchesResponse.json();
        setUserBatches(batchesData);
      }

      //alert("QR codes printed successfully!");
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
      [field]: parseInt(prev[field]) + 1
    }));
  };

  const decrementValue = (field) => {
    if (formData[field] > 1) {
      setFormData((prev) => ({
        ...prev,
        [field]: parseInt(prev[field]) - 1
      }));
    }
  };

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
        planCutQty: record.planCutQty
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
      ? batch.package_no
          ?.toString()
          .toLowerCase()
          .includes(packageNoFilter.toLowerCase())
      : true;
    const matchesMono = monoFilter
      ? batch.selectedMono?.toLowerCase().endsWith(monoFilter.toLowerCase())
      : true;
    return (
      matchesStyleCode &&
      matchesPackageNo &&
      matchesMono &&
      matchesColor &&
      matchesSize
    );
  });

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Mobile Layout (below md: 768px) */}
      <div className="md:hidden">
        <div className="bg-white shadow-sm p-3 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">
              {t("bundle.bundle_registration")}
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
                {t("bundle.registration")}
              </button>
              <button
                onClick={() => setActiveTab("data")}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  activeTab === "data"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {t("bundle.data")}
              </button>
              <button
                onClick={() => setActiveTab("reprint")}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  activeTab === "reprint"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {t("bundle.reprint")}
              </button>
            </div>
          </div>
        </div>

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
                          department: e.target.value
                        }))
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="">{t("bundle.select_department")}</option>
                      <option value="QC1 Endline">
                        {t("bundle.qc1_endline")}
                      </option>
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
                      placeholder="Search MONo..."
                      showSearchIcon={true}
                      closeOnOutsideClick={true}
                      inputMode="numeric"
                    />
                    {formData.selectedMono && (
                      <div className="mt-2 text-sm text-gray-700">
                        <strong>{t("bundle.selected_mono")}:</strong>{" "}
                        {formData.selectedMono}
                      </div>
                    )}
                  </div>
                </div>

                {formData.selectedMono && (
                  <div className="mb-2 p-2 bg-gray-50 rounded-md text-xs">
                    <div className="flex justify-between items-center">
                      <h2 className="text-sm font-bold text-gray-800">
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
                            <span className="font-bold">
                              {t("bundle.selected_mono")}:
                            </span>{" "}
                            {formData.selectedMono}
                          </p>
                          <p className="text-xs text-gray-700">
                            <span className="font-bold">
                              {t("bundle.customer_style")}:
                            </span>{" "}
                            {formData.custStyle}
                          </p>
                          <p className="text-xs text-gray-700">
                            <span className="font-bold">
                              {t("bundle.buyer")}:
                            </span>{" "}
                            {formData.buyer}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-700">
                            <span className="font-bold">
                              {t("bundle.country")}:
                            </span>{" "}
                            {formData.country}
                          </p>
                          <p className="text-xs text-gray-700">
                            <span className="font-bold">
                              {t("bundle.order_qty")}:
                            </span>{" "}
                            {formData.orderQty}
                          </p>
                          <p className="text-xs text-gray-700">
                            <span className="font-bold">
                              {t("bundle.factory")}:
                            </span>{" "}
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
                            planCutQty: ""
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
                      <p className="text-xs text-gray-500 py-1.5">
                        {t("bundle.no_colors_available")}
                      </p>
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
                              planCutQty: selectedSize?.planCutQty || 0
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
                        <p className="text-xs text-gray-500 py-1.5">
                          {t("bundle.no_size_available")}
                        </p>
                      )
                    ) : (
                      <p className="text-xs text-gray-500 py-1.5">
                        {t("bundle.no_colors_available")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  {formData.sizeOrderQty > 0 && (
                    <div className="p-1.5 bg-blue-50 rounded-md">
                      <span className="text-xs font-medium">
                        {t("bundle.size_order_qty")}:{" "}
                      </span>
                      <span className="text-xs">{formData.sizeOrderQty}</span>
                    </div>
                  )}
                  {formData.planCutQty > 0 && (
                    <div className="p-1.5 bg-green-50 rounded-md">
                      <span className="text-xs font-medium">
                        {t("bundle.plan_cut_qty")}:{" "}
                      </span>
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
                    {t("bundle.total_garment_count")}:{" "}
                    {formData.totalGarmentsCount}
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
                        {t("bundle.total_registered_bundle_qty")}:{" "}
                        {totalBundleQty}
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
                      <option value="">
                        {t("bundle.select_sub_con_factory")}
                      </option>
                      {subConNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.planCutQty !== undefined &&
                  estimatedTotal !== null && (
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
                      <FaQrcode className="mr-1" size={12} />{" "}
                      {t("bundle.generate_qr")}
                    </button>
                    {qrData.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowQRPreview(true)}
                          className="px-3 py-1.5 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 flex items-center text-xs"
                        >
                          <FaEye className="mr-1" size={12} />{" "}
                          {t("bundle.preview_qr")}
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
                          {isPrinting
                            ? t("bundle.printing")
                            : t("bundle.print_qr")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === "data" ? (
              <div className="bg-white rounded-lg shadow-md p-3">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-bold text-gray-800">
                    {t("bundle.data")}
                  </h2>
                  <div className="flex items-center">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center text-xs bg-blue-500 text-white px-2 py-1 rounded-md mr-2"
                    >
                      <FaFilter className="mr-1" size={10} />{" "}
                      {showFilters ? "Hide Filters" : "Show Filters"}
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
                                  className="px-2 py-1.5 text-xs font-medium text-gray-700 border border-blue-800 bg-blue-200 rounded-md hover:bg-blue-300"
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
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Showing {filteredBatches.length} of {userBatches.length}{" "}
                  records
                </div>
              </div>
            ) : (
              <ReprintTab />
            )}
          </div>
        </div>
      </div>
      {/* Laptop Layout (md and above: 768px+) */}
      <div className="hidden md:block min-h-screen bg-gray-50 pt-5 px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {t("bundle.bundle_registration")}
          </h1>

          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setActiveTab("registration")}
              className={`px-4 py-2 rounded-md ${
                activeTab === "registration"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {t("bundle.registration")}
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`px-4 py-2 rounded-md ${
                activeTab === "data"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {t("bundle.data")}
            </button>
            <button
              onClick={() => setActiveTab("reprint")}
              className={`px-4 py-2 rounded-md ${
                activeTab === "reprint"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {t("bundle.reprint")}
            </button>
          </div>

          {activeTab === "registration" ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    {t("bundle.date")}
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
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    {t("bundle.department")}
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        department: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">{t("bundle.select_department")}</option>
                    <option value="QC1 Endline">
                      {t("bundle.qc1_endline")}
                    </option>
                    <option value="Washing">{t("bundle.washing")}</option>
                    <option value="Sub-con">{t("bundle.sub_con")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    {t("bundle.search_mono")}
                  </label>
                  <MonoSearch
                    value={formData.selectedMono}
                    onSelect={(mono) =>
                      setFormData({ ...formData, selectedMono: mono })
                    }
                    placeholder="Search MONo..."
                    showSearchIcon={true}
                    closeOnOutsideClick={true}
                    inputMode="numeric"
                  />
                </div>
              </div>

              {formData.selectedMono && (
                <div className="mb-1 p-1 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-700">
                          <span className="font-bold">
                            {t("bundle.selected_mono")}:
                          </span>{" "}
                          {formData.selectedMono}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-bold">
                            {t("bundle.customer_style")}:
                          </span>{" "}
                          {formData.custStyle}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-bold">
                            {t("bundle.buyer")}:
                          </span>{" "}
                          {formData.buyer}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">
                          <span className="font-bold">
                            {t("bundle.country")}:
                          </span>{" "}
                          {formData.country}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-bold">
                            {t("bundle.order_qty")}:
                          </span>{" "}
                          {formData.orderQty}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-bold">
                            {t("bundle.factory")}:
                          </span>{" "}
                          {formData.factoryInfo}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Line No, Color, and Size in one row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
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
                          planCutQty: ""
                        };
                        setFormData(newFormData);
                        updateFormData("bundleRegistration", newFormData);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">{t("bundle.select_color")}</option>
                      {colors.map((color) => (
                        <option key={color.original} value={color.original}>
                          {color.original}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {t("bundle.no_colors_available")}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
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
                            planCutQty: selectedSize?.planCutQty || 0
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
                      <p className="text-sm text-gray-500">
                        {t("bundle.no_size_available")}
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-gray-500">
                      {t("bundle.no_colors_available")}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {formData.sizeOrderQty > 0 && (
                  <div className="p-2 bg-blue-50 rounded-md">
                    <span className="text-sm font-medium">
                      {t("bundle.size_order_qty")}:{" "}
                    </span>
                    <span className="text-sm">{formData.sizeOrderQty}</span>
                  </div>
                )}
                {formData.planCutQty > 0 && (
                  <div className="p-2 bg-green-50 rounded-md">
                    <span className="text-sm font-medium">
                      {t("bundle.plan_cut_qty")}:{" "}
                    </span>
                    <span className="text-sm">{formData.planCutQty}</span>
                  </div>
                )}
              </div>

              {formData.totalGarmentsCount !== undefined && (
                <div
                  className={`mb-4 text-sm ${
                    formData.totalGarmentsCount > formData.planCutQty
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                >
                  {t("bundle.total_garment_count")}:{" "}
                  {formData.totalGarmentsCount}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    {t("bundle.count")}
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
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    {t("bundle.bundle_qty")}
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
                    <p className="mt-1 text-sm text-gray-700">
                      {t("bundle.total_registered_bundle_qty")}:{" "}
                      {totalBundleQty}
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    {t("bundle.sub_con_factory")}
                  </label>
                  <select
                    value={subConName}
                    onChange={(e) => setSubConName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">
                      {t("bundle.select_sub_con_factory")}
                    </option>
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
                  className={`mb-4 text-sm ${
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

              <div className="flex justify-between">
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
                    <FaQrcode className="mr-2" /> {t("bundle.generate_qr")}
                  </button>

                  {qrData.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowQRPreview(true)}
                        className="px-4 py-2 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 flex items-center"
                      >
                        <FaEye className="mr-2" /> {t("bundle.preview_qr")}
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
                        {isPrinting
                          ? t("bundle.printing")
                          : t("bundle.print_qr")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "data" ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  {t("bundle.data")}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center text-sm bg-blue-500 text-white px-3 py-1 rounded-md"
                  >
                    <FaFilter className="mr-1" size={10} />{" "}
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </button>
                  {showFilters && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center text-sm bg-gray-200 px-3 py-1 rounded-md"
                    >
                      <FaTimes className="mr-1" size={10} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Filter by Color"
                    value={colorFilter}
                    onChange={(e) => setColorFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Filter by Size"
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Filter by Style Code"
                    value={styleCodeFilter}
                    onChange={(e) => setStyleCodeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Filter by Package No"
                    value={packageNoFilter}
                    onChange={(e) => setPackageNoFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Filter by MONo"
                    value={monoFilter}
                    onChange={(e) => setMonoFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-sky-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.record_id")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.package_no")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.date")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.modify")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.time")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.department")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.emp_id")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.eng_name")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.kh_name")}
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
                        {t("bundle.total_order_qty")}
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
                        {t("bundle.color_chi")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.size")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.order_cut_qty")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.plan_cut_qty")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.count")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.total_bundle_qty")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.sub_con")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
                        {t("bundle.sub_con_factory")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBatches.map((batch, index) => (
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
                          <button
                            onClick={() => handleEdit(batch._id)}
                            className="ml-2 text-gray-900 text-sm font-medium border border-blue-700 bg-blue-200 rounded-md px-4 py-2 hover:bg-blue-300"
                          >
                            {t("bundle.edit")}
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
          ) : (
            <ReprintTab />
          )}

          {showNumberPad && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
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

          <EditModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            formData={formData}
            setFormData={setFormData}
            setUserBatches={setUserBatches}
            setEditModalOpen={setEditModalOpen}
          />
        </div>
      </div>
      {/* Modals and overlays for Mobile Layout */}
      <div className="md:hidden">
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
          qrData={memoizedQrData} // Use memoized version of qrData
          //qrData={qrData}
          onPrint={handlePrintQR}
          mode="production"
        />

        <EditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          formData={formData}
          setFormData={setFormData}
          setUserBatches={setUserBatches}
          setEditModalOpen={setEditModalOpen}
        />
      </div>
    </div>
  );
}

export default BundleRegistration;

// import React, { useEffect, useRef, useState, useMemo } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { useTranslation } from "react-i18next";
// import {
//   FaEye,
//   FaEyeSlash,
//   FaFilter,
//   FaMinus,
//   FaPlus,
//   FaPrint,
//   FaQrcode,
//   FaTimes,
//   FaUndoAlt,
//   FaCalendarAlt,
//   FaBuilding,
//   FaTshirt,
//   FaUserTie,
//   FaGlobeAmericas,
//   FaIndustry,
//   FaMapMarkerAlt,
//   FaPaintBrush,
//   FaRulerCombined,
//   FaSortNumericDown,
//   FaLayerGroup,
//   FaUserFriends,
//   FaCheckDouble,
//   FaInfoCircle,
//   FaBarcode,
//   FaBoxOpen,
//   FaFileInvoiceDollar,
//   FaCut,
//   FaToggleOn,
//   FaToggleOff,
//   FaCogs // For Auto Print Toggle, FaCog for settings
// } from "react-icons/fa";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import { useFormData } from "../components/context/FormDataContext";
// import BluetoothComponent from "../components/forms/Bluetooth";
// import EditModal from "../components/forms/EditBundleData";
// import MonoSearch from "../components/forms/MonoSearch";
// import NumLetterPad from "../components/forms/NumLetterPad";
// import NumberPad from "../components/forms/NumberPad";
// import QRCodePreview from "../components/forms/QRCodePreview";
// import ReprintTab from "../components/forms/ReprintTab";
// import SubConSelection from "../components/forms/SubConSelection";

// const inputBaseClasses =
//   "w-full px-3 py-2 text-sm md:text-base border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out placeholder-slate-400";
// const inputReadOnlyClasses = `${inputBaseClasses} bg-slate-100 cursor-pointer`;
// const labelBaseClasses =
//   "flex items-center text-xs md:text-sm font-medium text-slate-700 mb-1";
// const iconBaseClasses = "mr-2 text-indigo-500";

// const getFormattedDate = (date = new Date()) => {
//   return date.toLocaleDateString("en-GB", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric"
//   });
// };

// function BundleRegistration() {
//   const { t } = useTranslation();
//   const { user, loading } = useAuth();
//   const { formData: persistedFormData, updateFormData } = useFormData();

//   const [userBatches, setUserBatches] = useState([]);
//   const [qrData, setQrData] = useState([]);
//   const [showQRPreview, setShowQRPreview] = useState(false);
//   const [showNumberPad, setShowNumberPad] = useState(false);
//   const [numberPadTarget, setNumberPadTarget] = useState(null);
//   const [isGenerateDisabled, setIsGenerateDisabled] = useState(false);
//   const [activeTab, setActiveTab] = useState("registration");
//   // const [dataRecords, setDataRecords] = useState([]); // Not actively used for display logic, can be removed if not needed elsewhere
//   const [isPrinting, setIsPrinting] = useState(false);
//   const [totalBundleQty, setTotalBundleQty] = useState(0);
//   const [colors, setColors] = useState([]);
//   const [sizes, setSizes] = useState([]);
//   const [hasColors, setHasColors] = useState(false);
//   const [hasSizes, setHasSizes] = useState(false);
//   const [showBundleQtyOverview, setShowBundleQtyOverview] = useState(false); // For new toggle
//   const [autoPrintEnabled, setAutoPrintEnabled] = useState(true); // For Auto Print Toggle

//   const [isSubCon, setIsSubCon] = useState(() => {
//     const savedDepartment = persistedFormData.bundleRegistration?.department;
//     return savedDepartment === "Sub-con";
//   });

//   const [subConName, setSubConName] = useState(
//     () => persistedFormData.bundleRegistration?.subConName || ""
//   );
//   const [estimatedTotal, setEstimatedTotal] = useState(null);

//   const bluetoothComponentRef = useRef();
//   const subConNames = [
//     "Sunicon",
//     "Win Sheng",
//     "Yeewo",
//     "Jinmyung",
//     "Elite",
//     "SYD"
//   ];

//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [editRecordId, setEditRecordId] = useState(null);
//   const [styleCodeFilter, setStyleCodeFilter] = useState("");
//   const [packageNoFilter, setPackageNoFilter] = useState("");
//   const [monoFilter, setMonoFilter] = useState("");
//   const [colorFilter, setColorFilter] = useState("");
//   const [sizeFilter, setSizeFilter] = useState("");
//   const [showFilters, setShowFilters] = useState(false);

//   const [formData, setFormData] = useState(() => {
//     const savedData = persistedFormData.bundleRegistration;
//     const today = new Date();
//     return savedData && user
//       ? {
//           ...savedData,
//           date: savedData.date ? new Date(savedData.date) : today
//         }
//       : {
//           date: today,
//           department: "",
//           selectedMono: "",
//           buyer: "",
//           orderQty: "",
//           factoryInfo: "",
//           custStyle: "",
//           country: "",
//           color: "",
//           size: "",
//           bundleQty: 1,
//           lineNo: "",
//           count: 10,
//           colorCode: "",
//           chnColor: "",
//           colorKey: "",
//           sizeOrderQty: "",
//           planCutQty: ""
//         };
//   });

//   const [showOrderDetails, setShowOrderDetails] = useState(false);
//   const memoizedQrData = useMemo(() => qrData, [qrData]);

//   const toggleOrderDetails = () => setShowOrderDetails(!showOrderDetails);
//   const toggleBundleQtyOverview = () =>
//     setShowBundleQtyOverview(!showBundleQtyOverview);
//   const toggleAutoPrint = () => setAutoPrintEnabled(!autoPrintEnabled);

//   useEffect(() => {
//     updateFormData("bundleRegistration", { ...formData, isSubCon, subConName });
//   }, [formData, isSubCon, subConName, updateFormData]);

//   useEffect(() => {
//     let newLineNo = "";
//     let newIsSubCon = false;
//     // let newSubConName = ""; // Keep subConName unless department changes away from Sub-con

//     if (formData.department === "Sub-con") {
//       newLineNo = "SUB";
//       newIsSubCon = true;
//       // newSubConName = subConName && isSubCon ? subConName : ""; // This logic was a bit redundant
//     } else if (formData.department === "Washing") {
//       newLineNo = "WA";
//     } else if (formData.department === "QC1 Endline") {
//       newLineNo =
//         persistedFormData.bundleRegistration?.department === "QC1 Endline" &&
//         persistedFormData.bundleRegistration?.lineNo
//           ? persistedFormData.bundleRegistration.lineNo
//           : "";
//     }

//     setIsSubCon(newIsSubCon);
//     if (!newIsSubCon) {
//       setSubConName("");
//     }
//     // Only update lineNo if it's derived from department logic
//     if (
//       formData.department === "Sub-con" ||
//       formData.department === "Washing"
//     ) {
//       setFormData((prev) => ({ ...prev, lineNo: newLineNo }));
//     } else if (
//       formData.department === "QC1 Endline" &&
//       prevFormDataRef.current?.department !== "QC1 Endline"
//     ) {
//       setFormData((prev) => ({ ...prev, lineNo: "" })); // Clear lineNo when switching to QC1
//     }
//   }, [formData.department]);

//   // Ref to store previous formData to detect changes
//   const prevFormDataRef = useRef();
//   useEffect(() => {
//     prevFormDataRef.current = formData;
//   });

//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       if (!formData.selectedMono) return;
//       setShowOrderDetails(false);
//       try {
//         const response = await fetch(
//           `${API_BASE_URL}/api/order-details/${formData.selectedMono}`
//         );
//         if (!response.ok)
//           throw new Error(`HTTP error! status: ${response.status}`);
//         const data = await response.json();

//         setFormData((prev) => ({
//           ...prev,
//           buyer: data.engName,
//           orderQty: data.totalQty,
//           factoryInfo: data.factoryname,
//           custStyle: data.custStyle,
//           country: data.country,
//           color: "",
//           colorCode: "",
//           chnColor: "",
//           colorKey: "",
//           size: "",
//           sizeOrderQty: "",
//           planCutQty: "",
//           totalGarmentsCount: undefined
//         }));

//         const totalResponse = await fetch(
//           `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
//         );
//         if (!totalResponse.ok)
//           throw new Error("Failed to fetch total bundle quantity");
//         const totalData = await totalResponse.json();
//         setTotalBundleQty(totalData.total);

//         setColors(data.colors && data.colors.length > 0 ? data.colors : []);
//         setHasColors(data.colors && data.colors.length > 0);
//         setHasSizes(false);
//       } catch (error) {
//         console.error("Error fetching order details:", error);
//         setColors([]);
//         setHasColors(false);
//         setHasSizes(false);
//       }
//     };
//     fetchOrderDetails();
//   }, [formData.selectedMono]);

//   useEffect(() => {
//     const fetchSizes = async () => {
//       if (!formData.selectedMono || !formData.color) {
//         setSizes([]);
//         setHasSizes(false);
//         setFormData((prev) => ({
//           ...prev,
//           size: "",
//           sizeOrderQty: "",
//           planCutQty: "",
//           totalGarmentsCount: undefined
//         }));
//         return;
//       }
//       try {
//         const response = await fetch(
//           `${API_BASE_URL}/api/order-sizes/${formData.selectedMono}/${formData.color}`
//         );
//         if (!response.ok)
//           throw new Error(`HTTP error! status: ${response.status}`);
//         const data = await response.json();
//         setSizes(data && data.length > 0 ? data : []);
//         setHasSizes(data && data.length > 0);
//         if (!(data && data.length > 0)) {
//           setFormData((prev) => ({
//             ...prev,
//             size: "",
//             sizeOrderQty: "",
//             planCutQty: "",
//             totalGarmentsCount: undefined
//           }));
//         }
//       } catch (error) {
//         console.error("Error fetching sizes:", error);
//         setSizes([]);
//         setHasSizes(false);
//       }
//     };
//     fetchSizes();
//   }, [formData.selectedMono, formData.color]);

//   useEffect(() => {
//     const fetchTotalGarmentsCount = async () => {
//       if (formData.selectedMono && formData.color && formData.size) {
//         try {
//           const response = await fetch(
//             `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${formData.size}`
//           );
//           if (!response.ok)
//             throw new Error(`HTTP error! status: ${response.status}`);
//           const data = await response.json();
//           setFormData((prev) => ({
//             ...prev,
//             totalGarmentsCount: data.totalCount
//           }));
//         } catch (error) {
//           console.error("Error fetching updated total garments count:", error);
//           setFormData((prev) => ({ ...prev, totalGarmentsCount: undefined }));
//         }
//       } else {
//         setFormData((prev) => ({ ...prev, totalGarmentsCount: undefined }));
//       }
//     };
//     fetchTotalGarmentsCount();
//     const interval = setInterval(fetchTotalGarmentsCount, 7000); // Slightly longer interval
//     return () => clearInterval(interval);
//   }, [formData.selectedMono, formData.color, formData.size]);

//   useEffect(() => {
//     const fetchTotalBundleQty = async () => {
//       if (!formData.selectedMono) return;
//       try {
//         const response = await fetch(
//           `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
//         );
//         if (!response.ok)
//           throw new Error(`HTTP error! status: ${response.status}`);
//         const data = await response.json();
//         setTotalBundleQty(data.total);
//       } catch (error) {
//         console.error("Error fetching total bundle quantity:", error);
//       }
//     };
//     fetchTotalBundleQty();
//     const interval = setInterval(fetchTotalBundleQty, 7000);
//     return () => clearInterval(interval);
//   }, [formData.selectedMono]);

//   useEffect(() => {
//     if (
//       formData.totalGarmentsCount === undefined ||
//       formData.count === "" ||
//       formData.bundleQty === ""
//     ) {
//       setEstimatedTotal(null);
//       return;
//     }
//     const newEstimatedTotal =
//       formData.totalGarmentsCount +
//       parseInt(formData.count || 0) * parseInt(formData.bundleQty || 0);
//     setEstimatedTotal(newEstimatedTotal);
//   }, [formData.totalGarmentsCount, formData.count, formData.bundleQty]);

//   useEffect(() => {
//     const fetchUserBatches = async () => {
//       if (!user) return;
//       try {
//         const response = await fetch(
//           `${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`
//         );
//         if (!response.ok)
//           throw new Error(`HTTP error! status: ${response.status}`);
//         const data = await response.json();
//         setUserBatches(data);
//       } catch (error) {
//         console.error("Error fetching user batches:", error);
//       }
//     };
//     fetchUserBatches();
//   }, [user, activeTab]); // Re-fetch when activeTab changes to ensure data is fresh if user switches back

//   const handleNumberPadInput = (value) => {
//     if (numberPadTarget) {
//       setFormData((prev) => ({ ...prev, [numberPadTarget]: value }));
//     }
//   };

//   const handleGenerateQR = async () => {
//     if (!user || loading) {
//       alert("User data is not available. Please try again.");
//       return;
//     }

//     if (
//       formData.factoryInfo === "YM" &&
//       formData.department === "QC1 Endline"
//     ) {
//       if (
//         !/^\d+$/.test(formData.lineNo) ||
//         parseInt(formData.lineNo) < 1 ||
//         parseInt(formData.lineNo) > 30
//       ) {
//         alert(t("bundle.error_invalid_line_no_ym"));
//         return;
//       }
//     } else if (formData.department === "Washing" && formData.lineNo !== "WA") {
//       alert(t("bundle.error_invalid_line_no_washing"));
//       return;
//     } else if (formData.department === "Sub-con" && formData.lineNo !== "SUB") {
//       alert(t("bundle.error_invalid_line_no_subcon"));
//       return;
//     } else if (
//       formData.department === "QC1 Endline" &&
//       formData.factoryInfo !== "YM" &&
//       !formData.lineNo
//     ) {
//       alert(t("bundle.error_line_no_required_qc1"));
//       return; // General QC1 line no required
//     }

//     if (
//       formData.planCutQty > 0 &&
//       formData.totalGarmentsCount > formData.planCutQty
//     ) {
//       alert(t("bundle.error_total_exceeds_plan"));
//       return;
//     }
//     if (formData.planCutQty > 0 && estimatedTotal > formData.planCutQty) {
//       alert(t("bundle.error_estimated_exceeds_plan"));
//       return;
//     }

//     const { date, selectedMono, color, size, lineNo } = formData;
//     // Validate all required fields before proceeding
//     if (
//       !selectedMono ||
//       !department ||
//       !color ||
//       !size ||
//       !lineNo ||
//       !count ||
//       !bundleQty
//     ) {
//       alert(t("bundle.error_fill_all_fields")); // Add this translation
//       return;
//     }

//     setIsGenerateDisabled(true); // Disable button immediately
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/check-bundle-id`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           date: date.toISOString().split("T")[0],
//           lineNo,
//           selectedMono,
//           color,
//           size
//         })
//       });
//       if (!response.ok) {
//         const errorData = await response
//           .json()
//           .catch(() => ({
//             message: "Failed to check bundle ID. Server error."
//           }));
//         throw new Error(
//           errorData.message || `HTTP error! status: ${response.status}`
//         );
//       }
//       const { largestNumber } = await response.json();
//       const bundleQtyNum = parseInt(formData.bundleQty);
//       const bundleData = [];

//       for (let i = 1; i <= bundleQtyNum; i++) {
//         const bundleId = `${
//           date.toISOString().split("T")[0]
//         }:${lineNo}:${selectedMono}:${color}:${size}:${largestNumber + i}`;
//         bundleData.push({
//           bundle_id: bundleId,
//           date: date.toLocaleDateString("en-CA"),
//           department: formData.department,
//           selectedMono,
//           custStyle: formData.custStyle,
//           buyer: formData.buyer,
//           country: formData.country,
//           orderQty: formData.orderQty,
//           factory: formData.factoryInfo,
//           lineNo,
//           color,
//           colorCode: formData.colorCode,
//           chnColor: formData.chnColor,
//           colorKey: formData.colorKey,
//           size,
//           sizeOrderQty: formData.sizeOrderQty,
//           planCutQty: formData.planCutQty,
//           count: formData.count,
//           bundleQty: 1,
//           sub_con: isSubCon ? "Yes" : "No",
//           sub_con_factory: isSubCon ? subConName : "",
//           emp_id: user.emp_id,
//           eng_name: user.eng_name,
//           kh_name: user.kh_name,
//           job_title: user.job_title,
//           dept_name: user.dept_name,
//           sect_name: user.sect_name
//         });
//       }

//       const saveResponse = await fetch(`${API_BASE_URL}/api/save-bundle-data`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ bundleData })
//       });

//       if (!saveResponse.ok) {
//         const errorData = await saveResponse
//           .json()
//           .catch(() => ({
//             message: "Failed to save bundle data. Server error."
//           }));
//         throw new Error(
//           errorData.message ||
//             `Save bundle data HTTP error! status: ${saveResponse.status}`
//         );
//       }

//       const savedData = await saveResponse.json();
//       setQrData(savedData.data);
//       // setDataRecords((prevRecords) => [...prevRecords, ...savedData.data]); // Keep if needed

//       // Fetch updates after successful save
//       const totalMonoBundleResponse = await fetch(
//         `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
//       );
//       const totalMonoBundleData = await totalMonoBundleResponse.json();
//       setTotalBundleQty(totalMonoBundleData.total);

//       if (user) {
//         const batchesResponse = await fetch(
//           `${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`
//         );
//         const batchesData = await batchesResponse.json();
//         setUserBatches(batchesData);
//       }
//       if (formData.selectedMono && formData.color && formData.size) {
//         const garmentsCountResponse = await fetch(
//           `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${formData.size}`
//         );
//         const garmentsCountData = await garmentsCountResponse.json();
//         setFormData((prev) => ({
//           ...prev,
//           totalGarmentsCount: garmentsCountData.totalCount
//         }));
//       }

//       if (autoPrintEnabled && savedData.data && savedData.data.length > 0) {
//         await handlePrintQR(savedData.data); // Pass the newly generated QR data for printing
//       } else {
//         // If not auto-printing, keep generate disabled until manual print or clear
//         // setIsGenerateDisabled(true); // Already set
//       }
//     } catch (error) {
//       console.error("Error in handleGenerateQR:", error);
//       alert(`${t("bundle.error_generating_qr")}: ${error.message}`);
//       setIsGenerateDisabled(false); // Re-enable on error
//     }
//   };

//   // Modified handlePrintQR to optionally accept qr data for auto-print
//   const handlePrintQR = async (dataToPrint = qrData) => {
//     if (!bluetoothComponentRef.current) {
//       alert(t("bundle.error_bluetooth_not_init"));
//       return;
//     }
//     if (!dataToPrint || dataToPrint.length === 0) {
//       alert(t("bundle.error_no_qr_to_print"));
//       return;
//     }

//     setIsPrinting(true);
//     try {
//       for (const data of dataToPrint) {
//         await bluetoothComponentRef.current.printData({
//           ...data,
//           bundle_id: data.bundle_random_id || data.bundle_id
//         });
//       }
//       setQrData([]); // Clear QR data after printing
//       setIsGenerateDisabled(false); // Allow new generation

//       if (user) {
//         const batchesResponse = await fetch(
//           `${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`
//         );
//         const batchesData = await batchesResponse.json();
//         setUserBatches(batchesData);
//       }
//     } catch (error) {
//       alert(`${t("bundle.error_printing")}: ${error.message}`);
//     } finally {
//       setIsPrinting(false);
//     }
//   };

//   const incrementValue = (field) =>
//     setFormData((prev) => ({
//       ...prev,
//       [field]: parseInt(prev[field] || 0) + 1
//     }));
//   const decrementValue = (field) =>
//     setFormData((prev) => ({
//       ...prev,
//       [field]: Math.max(1, parseInt(prev[field] || 1) - 1)
//     }));

//   const handleEdit = (recordId) => {
//     const record = userBatches.find((batch) => batch._id === recordId);
//     if (record) {
//       setFormData({
//         id: record._id,
//         date: new Date(record.date),
//         department: record.department,
//         selectedMono: record.selectedMono,
//         buyer: record.buyer,
//         orderQty: record.orderQty,
//         factoryInfo: record.factory,
//         custStyle: record.custStyle,
//         country: record.country,
//         color: record.color,
//         size: record.size,
//         bundleQty: record.bundleQty,
//         lineNo: record.lineNo,
//         count: record.count,
//         colorCode: record.colorCode,
//         chnColor: record.chnColor,
//         colorKey: record.colorKey,
//         sizeOrderQty: record.sizeOrderQty,
//         planCutQty: record.planCutQty
//       });
//       setIsSubCon(record.sub_con === "Yes");
//       setSubConName(record.sub_con_factory || "");
//       setEditRecordId(recordId);
//       setEditModalOpen(true);
//     }
//   };

//   const clearFilters = () => {
//     setStyleCodeFilter("");
//     setPackageNoFilter("");
//     setMonoFilter("");
//     setColorFilter("");
//     setSizeFilter("");
//   };

//   const filteredBatches = userBatches.filter((batch) => {
//     const lowerCase = (str) => str?.toLowerCase() || "";
//     return (
//       (styleCodeFilter
//         ? lowerCase(batch.custStyle).includes(lowerCase(styleCodeFilter))
//         : true) &&
//       (colorFilter
//         ? lowerCase(batch.color).includes(lowerCase(colorFilter))
//         : true) &&
//       (sizeFilter
//         ? lowerCase(batch.size).includes(lowerCase(sizeFilter))
//         : true) &&
//       (packageNoFilter
//         ? lowerCase(batch.package_no?.toString()).includes(
//             lowerCase(packageNoFilter)
//           )
//         : true) &&
//       (monoFilter
//         ? lowerCase(batch.selectedMono).includes(lowerCase(monoFilter))
//         : true)
//     );
//   });

//   const AppHeader = () => (
//     <div className="bg-white shadow-md px-4 py-3 md:px-6 md:py-4">
//       <div className="max-w-7xl mx-auto">
//         <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-700">
//           Yorkmars (Cambodia) Garment MFG Co., LTD{" "}
//           <span className="font-semibold text-slate-600">| QC 2 System</span>
//         </h1>
//         <div className="flex flex-wrap items-center text-xs sm:text-sm text-slate-500 mt-1">
//           <span className="font-medium">{t("bundle.bundle_registration")}</span>
//           <span className="mx-1.5 md:mx-2">|</span>
//           <span>{getFormattedDate()}</span>
//           {user && !loading && (
//             <>
//               <span className="mx-1.5 md:mx-2">|</span>
//               <span>
//                 {" "}
//                 {t("bundle.issued_by")}:{" "}
//                 <span className="font-medium text-indigo-600">
//                   {user.emp_id}
//                 </span>{" "}
//               </span>
//             </>
//           )}
//         </div>
//       </div>
//       <hr className="mt-3 md:mt-4 border-slate-200" />
//     </div>
//   );

//   const TabButton = ({ label, tabName, icon }) => (
//     <button
//       onClick={() => setActiveTab(tabName)}
//       className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-3 py-2.5 md:px-5 md:py-3 text-xs md:text-sm font-medium rounded-t-lg
//         transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400
//         ${
//           activeTab === tabName
//             ? "bg-indigo-600 text-white shadow-lg border-b-4 border-indigo-700"
//             : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-indigo-600 border-b-4 border-transparent"
//         }`}
//     >
//       {icon}
//       <span>{label}</span>
//     </button>
//   );

//   const QtyInfoCard = ({
//     icon,
//     label,
//     value,
//     unit = "",
//     bgColorClass = "bg-blue-50",
//     textColorClass = "text-blue-700",
//     borderColorClass = "border-blue-200"
//   }) => {
//     if (value === undefined || value === null || value === "") return null;
//     return (
//       <div
//         className={`p-3 rounded-lg border ${borderColorClass} ${bgColorClass} ${textColorClass} shadow-sm flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-3`}
//       >
//         <div
//           className={`p-2 rounded-full ${
//             bgColorClass === "bg-blue-50"
//               ? "bg-blue-100"
//               : bgColorClass === "bg-green-50"
//               ? "bg-green-100"
//               : "bg-red-100"
//           }`}
//         >
//           {React.isValidElement(icon)
//             ? React.cloneElement(icon, { size: 18, className: `opacity-80` })
//             : icon}
//         </div>
//         <div className="text-left sm:text-left">
//           <p className="text-xs font-medium opacity-80">{label}</p>
//           <p className="text-base font-bold">
//             {value} {unit}
//           </p>
//         </div>
//       </div>
//     );
//   };

//   const isGenerateButtonDisabled =
//     isGenerateDisabled ||
//     !formData.selectedMono ||
//     !formData.department || // Added department validation
//     !formData.color ||
//     !formData.size ||
//     !formData.bundleQty ||
//     !formData.lineNo ||
//     !formData.count ||
//     (formData.planCutQty > 0 &&
//       estimatedTotal !== null &&
//       estimatedTotal > formData.planCutQty);

//   const { department, selectedMono, color, size, lineNo, count, bundleQty } =
//     formData; // For cleaner validation check

//   return (
//     <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
//       <AppHeader />

//       {/* Common Tab Navigation for both Mobile and Desktop, placed below AppHeader */}
//       <div className="bg-white shadow-sm sticky top-0 z-20 md:z-10 px-1 md:px-6">
//         <div className="max-w-7xl mx-auto flex space-x-1 border-b border-slate-200">
//           <TabButton
//             label={t(
//               activeTab === "registration"
//                 ? "bundle.registration"
//                 : "bundle.registration_short",
//               "Reg"
//             )}
//             tabName="registration"
//             icon={<FaQrcode size={14} />}
//           />
//           <TabButton
//             label={t(
//               activeTab === "data" ? "bundle.data" : "bundle.data_short",
//               "Data"
//             )}
//             tabName="data"
//             icon={<FaEye size={14} />}
//           />
//           <TabButton
//             label={t(
//               activeTab === "reprint"
//                 ? "bundle.reprint"
//                 : "bundle.reprint_short",
//               "Reprint"
//             )}
//             tabName="reprint"
//             icon={<FaUndoAlt size={14} />}
//           />
//         </div>
//       </div>

//       {/* Content Area */}
//       <div className="flex-1 overflow-hidden">
//         <div className="h-full overflow-y-auto p-3 md:p-6">
//           <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
//             {activeTab === "registration" && (
//               <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 space-y-4 md:space-y-6">
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-x-6 md:gap-y-4 items-end">
//                   <div>
//                     <label htmlFor="mainDate" className={labelBaseClasses}>
//                       <FaCalendarAlt className={iconBaseClasses} />
//                       {t("bundle.date")}
//                     </label>
//                     <DatePicker
//                       id="mainDate"
//                       selected={formData.date}
//                       onChange={(date) =>
//                         setFormData((prev) => ({ ...prev, date }))
//                       }
//                       className={`${inputBaseClasses} text-xs md:text-sm`}
//                       dateFormat="yyyy-MM-dd"
//                     />
//                   </div>
//                   <div className="flex items-end space-x-2 col-span-2 md:col-span-1">
//                     {" "}
//                     {/* Group Bluetooth and AutoPrint */}
//                     <BluetoothComponent ref={bluetoothComponentRef} />
//                     <button
//                       onClick={toggleAutoPrint}
//                       title={
//                         autoPrintEnabled
//                           ? t("bundle.auto_print_on")
//                           : t("bundle.auto_print_off")
//                       }
//                       className={`p-2 rounded-md transition-colors duration-200 text-xs md:text-sm flex items-center space-x-1
//                                 ${
//                                   autoPrintEnabled
//                                     ? "bg-green-500 text-white hover:bg-green-600"
//                                     : "bg-slate-300 text-slate-700 hover:bg-slate-400"
//                                 }`}
//                     >
//                       {autoPrintEnabled ? (
//                         <FaToggleOn size={16} />
//                       ) : (
//                         <FaToggleOff size={16} />
//                       )}
//                       <span className="hidden sm:inline">
//                         {t("bundle.auto")}
//                       </span>
//                     </button>
//                   </div>
//                   <div>
//                     <label
//                       htmlFor="mainDepartment"
//                       className={labelBaseClasses}
//                     >
//                       <FaBuilding className={iconBaseClasses} />
//                       {t("bundle.department")}
//                     </label>
//                     <select
//                       id="mainDepartment"
//                       value={formData.department}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           department: e.target.value
//                         }))
//                       }
//                       className={`${inputBaseClasses} text-xs md:text-sm`}
//                     >
//                       <option value="">{t("bundle.select_department")}</option>
//                       <option value="QC1 Endline">
//                         {t("bundle.qc1_endline")}
//                       </option>
//                       <option value="Washing">{t("bundle.washing")}</option>
//                       <option value="Sub-con">{t("bundle.sub_con")}</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label
//                       htmlFor="mainMonoSearch"
//                       className={labelBaseClasses}
//                     >
//                       <FaBarcode className={iconBaseClasses} />
//                       {t("bundle.search_mono")}
//                     </label>
//                     <MonoSearch
//                       id="mainMonoSearch"
//                       value={formData.selectedMono}
//                       onSelect={(mono) =>
//                         setFormData({ ...formData, selectedMono: mono })
//                       }
//                       placeholder={t("bundle.search_mono_placeholder")}
//                       showSearchIcon={true}
//                       closeOnOutsideClick={true}
//                       inputMode="numeric"
//                     />
//                     {formData.selectedMono && (
//                       <div className="mt-1.5 text-xs md:text-sm text-indigo-600">
//                         <strong>{t("bundle.selected_mono")}:</strong>{" "}
//                         {formData.selectedMono}
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {formData.selectedMono && (
//                   <div className="my-3 md:my-4 p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
//                     <div className="flex justify-between items-center mb-2.5 md:mb-3">
//                       <h2 className="text-base md:text-lg font-semibold text-indigo-700 flex items-center">
//                         <FaInfoCircle className="mr-2" />
//                         {t("bundle.order_details")}
//                       </h2>
//                       <button
//                         onClick={toggleOrderDetails}
//                         className="text-slate-500 hover:text-indigo-600 p-1 md:p-1.5 rounded-full hover:bg-indigo-100 transition-colors"
//                       >
//                         {showOrderDetails ? (
//                           <FaEyeSlash size={18} />
//                         ) : (
//                           <FaEye size={18} />
//                         )}
//                       </button>
//                     </div>
//                     {showOrderDetails && (
//                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 md:gap-x-5 gap-y-1.5 md:gap-y-2 text-xs md:text-sm text-slate-700">
//                         {[
//                           {
//                             icon: <FaTshirt className="text-slate-500" />,
//                             label: t("bundle.customer_style"),
//                             value: formData.custStyle
//                           },
//                           {
//                             icon: <FaUserTie className="text-slate-500" />,
//                             label: t("bundle.buyer"),
//                             value: formData.buyer
//                           },
//                           {
//                             icon: (
//                               <FaGlobeAmericas className="text-slate-500" />
//                             ),
//                             label: t("bundle.country"),
//                             value: formData.country
//                           },
//                           {
//                             icon: <FaBoxOpen className="text-slate-500" />,
//                             label: t("bundle.order_qty"),
//                             value: formData.orderQty
//                           },
//                           {
//                             icon: <FaIndustry className="text-slate-500" />,
//                             label: t("bundle.factory"),
//                             value: formData.factoryInfo
//                           }
//                         ].map((item) => (
//                           <div
//                             key={item.label}
//                             className="flex items-center py-0.5 md:py-1"
//                           >
//                             <span className="w-5 md:w-6 flex-shrink-0">
//                               {item.icon}
//                             </span>
//                             <span className="font-medium w-28 md:w-32 flex-shrink-0">
//                               {item.label}:
//                             </span>
//                             <span className="truncate" title={item.value}>
//                               {item.value}
//                             </span>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* Combined Qty Display */}
//                 <div className="my-3 md:my-4 p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
//                   <div className="flex justify-between items-center mb-2 md:mb-3">
//                     <h3 className="text-base md:text-lg font-semibold text-indigo-600">
//                       {t("bundle.quantity_overview")}
//                     </h3>
//                     <button
//                       onClick={toggleBundleQtyOverview}
//                       className="text-slate-500 hover:text-indigo-600 p-1 md:p-1.5 rounded-full hover:bg-indigo-100 transition-colors"
//                     >
//                       {showBundleQtyOverview ? (
//                         <FaEyeSlash size={18} />
//                       ) : (
//                         <FaEye size={18} />
//                       )}
//                     </button>
//                   </div>
//                   {showBundleQtyOverview && (
//                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
//                       <QtyInfoCard
//                         icon={<FaFileInvoiceDollar />}
//                         label={t("bundle.size_order_qty")}
//                         value={formData.sizeOrderQty}
//                         bgColorClass="bg-sky-50"
//                         textColorClass="text-sky-700"
//                         borderColorClass="border-sky-200"
//                       />
//                       <QtyInfoCard
//                         icon={<FaCut />}
//                         label={t("bundle.plan_cut_qty")}
//                         value={formData.planCutQty}
//                         bgColorClass="bg-emerald-50"
//                         textColorClass="text-emerald-700"
//                         borderColorClass="border-emerald-200"
//                       />
//                       <QtyInfoCard
//                         icon={<FaCheckDouble />}
//                         label={t("bundle.total_garment_count")}
//                         value={formData.totalGarmentsCount}
//                         bgColorClass={
//                           formData.totalGarmentsCount > formData.planCutQty &&
//                           formData.planCutQty > 0
//                             ? "bg-red-50"
//                             : "bg-green-50"
//                         }
//                         textColorClass={
//                           formData.totalGarmentsCount > formData.planCutQty &&
//                           formData.planCutQty > 0
//                             ? "text-red-700"
//                             : "text-green-700"
//                         }
//                         borderColorClass={
//                           formData.totalGarmentsCount > formData.planCutQty &&
//                           formData.planCutQty > 0
//                             ? "border-red-200"
//                             : "border-green-200"
//                         }
//                       />
//                     </div>
//                   )}
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-x-6 md:gap-y-4">
//                   <div>
//                     <label htmlFor="mainLineNo" className={labelBaseClasses}>
//                       <FaMapMarkerAlt className={iconBaseClasses} />
//                       {t("bundle.line_no")}
//                     </label>
//                     <div className="relative">
//                       <input
//                         id="mainLineNo"
//                         type="text"
//                         value={formData.lineNo}
//                         onClick={() => {
//                           setNumberPadTarget("lineNo");
//                           setShowNumberPad(true);
//                         }}
//                         readOnly
//                         className={`${inputReadOnlyClasses} text-xs md:text-sm pr-8 md:pr-10`}
//                       />
//                       {(formData.department === "Washing" ||
//                         formData.department === "Sub-con") && (
//                         <div className="absolute inset-y-0 right-0 flex items-center pr-2 md:pr-3 pointer-events-none">
//                           <span className="text-slate-500 text-xs md:text-sm">
//                             {formData.department === "Washing" ? "WA" : "SUB"}
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                   <div>
//                     <label htmlFor="mainColor" className={labelBaseClasses}>
//                       <FaPaintBrush className={iconBaseClasses} />
//                       {t("bundle.color")}
//                     </label>
//                     {hasColors ? (
//                       <select
//                         id="mainColor"
//                         value={formData.color}
//                         onChange={(e) => {
//                           const sc = colors.find(
//                             (c) => c.original === e.target.value
//                           );
//                           setFormData((p) => ({
//                             ...p,
//                             color: e.target.value,
//                             colorCode: sc?.code || "",
//                             chnColor: sc?.chn || "",
//                             colorKey: sc?.key || "",
//                             size: "",
//                             sizeOrderQty: "",
//                             planCutQty: ""
//                           }));
//                         }}
//                         className={`${inputBaseClasses} text-xs md:text-sm`}
//                       >
//                         <option value="">{t("bundle.select_color")}</option>
//                         {colors.map((c) => (
//                           <option key={c.original} value={c.original}>
//                             {c.original}
//                           </option>
//                         ))}
//                       </select>
//                     ) : (
//                       <p className="text-xs md:text-sm text-slate-500 py-1.5 md:py-2 px-2 md:px-3 border border-slate-300 rounded-md bg-slate-100 h-[34px] md:h-[42px] flex items-center">
//                         {t(
//                           formData.selectedMono
//                             ? "bundle.no_colors_available"
//                             : "bundle.select_mono_first"
//                         )}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label htmlFor="mainSize" className={labelBaseClasses}>
//                       <FaRulerCombined className={iconBaseClasses} />
//                       {t("bundle.size")}
//                     </label>
//                     {hasColors && formData.color ? (
//                       hasSizes ? (
//                         <select
//                           id="mainSize"
//                           value={formData.size}
//                           onChange={(e) => {
//                             const ss = sizes.find(
//                               (s) => s.size === e.target.value
//                             );
//                             setFormData((p) => ({
//                               ...p,
//                               size: e.target.value,
//                               sizeOrderQty: ss?.orderQty || 0,
//                               planCutQty: ss?.planCutQty || 0
//                             }));
//                           }}
//                           className={`${inputBaseClasses} text-xs md:text-sm`}
//                         >
//                           <option value="">{t("bundle.select_size")}</option>
//                           {sizes.map((sObj) => (
//                             <option key={sObj.size} value={sObj.size}>
//                               {sObj.size}
//                             </option>
//                           ))}
//                         </select>
//                       ) : (
//                         <p className="text-xs md:text-sm text-slate-500 py-1.5 md:py-2 px-2 md:px-3 border border-slate-300 rounded-md bg-slate-100 h-[34px] md:h-[42px] flex items-center">
//                           {t("bundle.no_size_available")}
//                         </p>
//                       )
//                     ) : (
//                       <p className="text-xs md:text-sm text-slate-500 py-1.5 md:py-2 px-2 md:px-3 border border-slate-300 rounded-md bg-slate-100 h-[34px] md:h-[42px] flex items-center">
//                         {t(
//                           formData.color
//                             ? "bundle.no_size_available"
//                             : "bundle.select_color_first"
//                         )}
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-x-6 md:gap-y-4">
//                   <div>
//                     <label htmlFor="mainCount" className={labelBaseClasses}>
//                       <FaSortNumericDown className={iconBaseClasses} />
//                       {t("bundle.count")}
//                     </label>
//                     <div className="flex items-center border border-slate-300 rounded-md shadow-sm">
//                       <button
//                         type="button"
//                         onClick={() => decrementValue("count")}
//                         className="px-2.5 md:px-3.5 py-2 md:py-2.5 bg-slate-200 hover:bg-slate-300 rounded-l-md transition-colors"
//                       >
//                         <FaMinus size={10} />
//                       </button>
//                       <input
//                         id="mainCount"
//                         type="text"
//                         value={formData.count}
//                         onClick={() => {
//                           setNumberPadTarget("count");
//                           setShowNumberPad(true);
//                         }}
//                         readOnly
//                         className="w-full px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-base bg-slate-100 text-center focus:outline-none"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => incrementValue("count")}
//                         className="px-2.5 md:px-3.5 py-2 md:py-2.5 bg-slate-200 hover:bg-slate-300 rounded-r-md transition-colors"
//                       >
//                         <FaPlus size={10} />
//                       </button>
//                     </div>
//                   </div>
//                   <div>
//                     <label htmlFor="mainBundleQty" className={labelBaseClasses}>
//                       <FaLayerGroup className={iconBaseClasses} />
//                       {t("bundle.bundle_qty")}
//                     </label>
//                     <div className="flex items-center border border-slate-300 rounded-md shadow-sm">
//                       <button
//                         type="button"
//                         onClick={() => decrementValue("bundleQty")}
//                         className="px-2.5 md:px-3.5 py-2 md:py-2.5 bg-slate-200 hover:bg-slate-300 rounded-l-md transition-colors"
//                       >
//                         <FaMinus size={10} />
//                       </button>
//                       <input
//                         id="mainBundleQty"
//                         type="text"
//                         value={formData.bundleQty}
//                         onClick={() => {
//                           setNumberPadTarget("bundleQty");
//                           setShowNumberPad(true);
//                         }}
//                         readOnly
//                         className="w-full px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-base bg-slate-100 text-center focus:outline-none"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => incrementValue("bundleQty")}
//                         className="px-2.5 md:px-3.5 py-2 md:py-2.5 bg-slate-200 hover:bg-slate-300 rounded-r-md transition-colors"
//                       >
//                         <FaPlus size={10} />
//                       </button>
//                     </div>
//                     {formData.selectedMono && (
//                       <p className="mt-1 text-xs md:text-sm text-slate-600">
//                         {t("bundle.total_registered_bundle_qty")}:{" "}
//                         {totalBundleQty}
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 {formData.department !== "Sub-con" && (
//                   <SubConSelection
//                     isSubCon={isSubCon}
//                     setIsSubCon={setIsSubCon}
//                     subConName={subConName}
//                     setSubConName={setSubConName}
//                     icon={<FaUserFriends className={iconBaseClasses} />}
//                   />
//                 )}
//                 {formData.department === "Sub-con" && (
//                   <div className="mb-3 md:mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
//                     <label
//                       htmlFor="mainSubConFactory"
//                       className="flex items-center text-sm font-medium text-slate-700 mb-1"
//                     >
//                       <FaIndustry className={iconBaseClasses} />
//                       {t("bundle.sub_con_factory")}
//                     </label>
//                     <select
//                       id="mainSubConFactory"
//                       value={subConName}
//                       onChange={(e) => setSubConName(e.target.value)}
//                       className={`${inputBaseClasses} text-xs md:text-sm`}
//                     >
//                       <option value="">
//                         {t("bundle.select_sub_con_factory")}
//                       </option>
//                       {subConNames.map((name) => (
//                         <option key={name} value={name}>
//                           {name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 )}

//                 {formData.planCutQty > 0 && estimatedTotal !== null && (
//                   <div
//                     className={`mt-1.5 text-xs md:text-sm font-medium p-1.5 md:p-2.5 rounded-md border ${
//                       estimatedTotal > formData.planCutQty
//                         ? "text-red-700 bg-red-50 border-red-200"
//                         : "text-emerald-700 bg-emerald-50 border-emerald-200"
//                     }`}
//                   >
//                     {estimatedTotal > formData.planCutQty
//                       ? `⚠️ ${t("bundle.actual_cut_qty_exceeds", {
//                           actual: estimatedTotal,
//                           plan: formData.planCutQty
//                         })}`
//                       : `✅ ${t("bundle.actual_cut_qty_within", {
//                           actual: estimatedTotal,
//                           plan: formData.planCutQty
//                         })}`}
//                   </div>
//                 )}

//                 <div className="flex flex-col sm:flex-row sm:justify-start items-stretch gap-2 pt-2 md:pt-4 md:space-x-3 border-t border-slate-200">
//                   <button
//                     type="button"
//                     onClick={handleGenerateQR}
//                     disabled={isGenerateButtonDisabled}
//                     className={`w-full sm:w-auto px-4 md:px-5 py-2.5 rounded-md flex items-center justify-center text-xs md:text-sm font-semibold transition-colors duration-150 ease-in-out
//                       ${
//                         isGenerateButtonDisabled
//                           ? "bg-slate-300 text-slate-500 cursor-not-allowed"
//                           : (formData.planCutQty > 0 &&
//                             estimatedTotal !== null &&
//                             estimatedTotal > formData.planCutQty
//                               ? "bg-red-500 hover:bg-red-600"
//                               : "bg-green-500 hover:bg-green-600") +
//                             " text-white shadow-sm hover:shadow-md"
//                       }`}
//                   >
//                     <FaQrcode className="mr-1.5 md:mr-2" size={14} />{" "}
//                     {t("bundle.generate_qr")}
//                   </button>
//                   {qrData.length > 0 &&
//                     !autoPrintEnabled /* Show manual print only if not auto-printing or if auto-print failed */ && (
//                       <>
//                         <button
//                           type="button"
//                           onClick={() => setShowQRPreview(true)}
//                           className="w-full sm:w-auto px-4 md:px-5 py-2.5 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 flex items-center justify-center text-xs md:text-sm font-semibold shadow-sm hover:shadow-md transition-colors"
//                         >
//                           <FaEye className="mr-1.5 md:mr-2" size={14} />{" "}
//                           {t("bundle.preview_qr")}
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => handlePrintQR()}
//                           disabled={
//                             isPrinting
//                           } /* Pass no args for manual print */
//                           className={`w-full sm:w-auto px-4 md:px-5 py-2.5 rounded-md flex items-center justify-center text-xs md:text-sm font-semibold shadow-sm hover:shadow-md transition-colors
//                           ${
//                             isPrinting
//                               ? "bg-slate-400 text-slate-600 cursor-not-allowed"
//                               : "bg-sky-500 hover:bg-sky-600 text-white"
//                           }`}
//                         >
//                           <FaPrint className="mr-1.5 md:mr-2" size={14} />{" "}
//                           {isPrinting
//                             ? t("bundle.printing")
//                             : t("bundle.print_qr")}
//                         </button>
//                       </>
//                     )}
//                   {qrData.length > 0 &&
//                     autoPrintEnabled &&
//                     isPrinting /* Indicate printing if auto print is on and in progress */ && (
//                       <div className="w-full sm:w-auto px-4 md:px-5 py-2.5 rounded-md flex items-center justify-center text-xs md:text-sm font-semibold bg-sky-100 text-sky-700">
//                         <FaPrint
//                           className="mr-1.5 md:mr-2 animate-pulse"
//                           size={14}
//                         />{" "}
//                         {t("bundle.auto_printing")}
//                       </div>
//                     )}
//                 </div>
//               </div>
//             )}
//             {activeTab === "data" && (
//               <div className="bg-white rounded-xl shadow-xl p-3 md:p-6">
//                 <div className="flex flex-col md:flex-row justify-between items-center mb-3 md:mb-5 gap-3">
//                   <h2 className="text-base md:text-xl font-semibold text-slate-700">
//                     {t("bundle.data_records")}
//                   </h2>
//                   <div className="flex items-center space-x-2 md:space-x-3">
//                     <button
//                       onClick={() => setShowFilters(!showFilters)}
//                       className="flex items-center text-xs md:text-sm bg-indigo-500 text-white px-2.5 md:px-3 py-1.5 rounded-md hover:bg-indigo-600 shadow transition-colors"
//                     >
//                       <FaFilter className="mr-1 md:mr-1.5" size={10} />{" "}
//                       {showFilters
//                         ? t("bundle.hide_filters")
//                         : t("bundle.show_filters")}
//                     </button>
//                     {showFilters && (
//                       <button
//                         onClick={clearFilters}
//                         className="flex items-center text-xs md:text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 md:px-3 py-1.5 rounded-md shadow transition-colors"
//                       >
//                         <FaTimes className="mr-1 md:mr-1.5" size={10} />{" "}
//                         {t("bundle.clear")}
//                       </button>
//                     )}
//                   </div>
//                 </div>
//                 {showFilters && (
//                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mb-3 md:mb-5">
//                     {[
//                       { ph: "Color", val: colorFilter, set: setColorFilter },
//                       { ph: "Size", val: sizeFilter, set: setSizeFilter },
//                       {
//                         ph: "Style Code",
//                         val: styleCodeFilter,
//                         set: setStyleCodeFilter
//                       },
//                       {
//                         ph: "Package No",
//                         val: packageNoFilter,
//                         set: setPackageNoFilter
//                       },
//                       { ph: "MONo", val: monoFilter, set: setMonoFilter }
//                     ].map((f) => (
//                       <input
//                         key={f.ph}
//                         type="text"
//                         placeholder={t(
//                           `bundle.filter_by_${f.ph
//                             .toLowerCase()
//                             .replace(/\s+/g, "_")}`,
//                           f.ph
//                         )}
//                         value={f.val}
//                         onChange={(e) => f.set(e.target.value)}
//                         className={`${inputBaseClasses} text-xs md:text-sm`}
//                       />
//                     ))}
//                   </div>
//                 )}
//                 <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-md">
//                   <table className="min-w-full divide-y divide-slate-200">
//                     <thead className="bg-slate-100">
//                       <tr>
//                         {[
//                           "ID",
//                           "Pkg No",
//                           "Date",
//                           "Modify",
//                           "Time",
//                           "Dept",
//                           "Emp ID",
//                           "Eng Name",
//                           "KH Name",
//                           "MONo",
//                           "Cust Style",
//                           "Buyer",
//                           "Country",
//                           "Order Qty",
//                           "Factory",
//                           "Line No",
//                           "Color",
//                           "Color(CH)",
//                           "Size",
//                           "Size Qty",
//                           "Plan Qty",
//                           "Count",
//                           "Bundle Qty",
//                           "SubCon",
//                           "SubCon Fac."
//                         ].map((h) => (
//                           <th
//                             key={h}
//                             className="px-3 py-2 md:py-3 text-left text-[9px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-r-0 whitespace-nowrap"
//                           >
//                             {t(
//                               `bundle.table_header_desktop_${h
//                                 .toLowerCase()
//                                 .replace(/[\s.]+/g, "_")}`,
//                               h
//                             )}
//                           </th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-slate-200">
//                       {filteredBatches.map((batch, index) => (
//                         <tr
//                           key={batch._id || index}
//                           className="hover:bg-slate-50 transition-colors"
//                         >
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {index + 1}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.package_no}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.updated_date_seperator}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm border-r">
//                             <button
//                               onClick={() => handleEdit(batch._id)}
//                               className="px-1.5 md:px-2.5 py-0.5 md:py-1 text-[9px] md:text-xs font-medium text-indigo-700 bg-indigo-100 border border-indigo-300 rounded-md hover:bg-indigo-200"
//                             >
//                               {t("bundle.edit")}
//                             </button>
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.updated_time_seperator}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.department}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.emp_id}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.eng_name}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.kh_name}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.selectedMono}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.custStyle}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.buyer}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.country}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.orderQty}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.factory}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.lineNo}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.color}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.chnColor}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.size}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.sizeOrderQty}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.planCutQty}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.count}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.bundleQty}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600 border-r">
//                             {batch.sub_con}
//                           </td>
//                           <td className="px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-600">
//                             {batch.sub_con === "Yes"
//                               ? batch.sub_con_factory
//                               : "N/A"}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//                 <div className="mt-3 md:mt-4 text-xs md:text-sm text-slate-500">
//                   {t("bundle.showing_records", {
//                     count: filteredBatches.length,
//                     total: userBatches.length
//                   })}
//                 </div>
//               </div>
//             )}
//             {activeTab === "reprint" && <ReprintTab />}
//           </div>
//         </div>
//       </div>

//       {/* Modals */}
//       {showNumberPad && (
//         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center pt-10 md:pt-20 z-50">
//           <div className="bg-white rounded-xl shadow-2xl max-w-xs sm:max-w-sm w-full mx-4 overflow-hidden">
//             {numberPadTarget === "bundleQty" ||
//             numberPadTarget === "count" ||
//             (formData.factoryInfo === "YM" &&
//               formData.department === "QC1 Endline" &&
//               numberPadTarget === "lineNo") ? (
//               <NumberPad
//                 onClose={() => setShowNumberPad(false)}
//                 onInput={handleNumberPadInput}
//               />
//             ) : (
//               <NumLetterPad
//                 onClose={() => setShowNumberPad(false)}
//                 onInput={handleNumberPadInput}
//               />
//             )}
//           </div>
//         </div>
//       )}
//       <QRCodePreview
//         isOpen={showQRPreview}
//         onClose={() => setShowQRPreview(false)}
//         qrData={memoizedQrData}
//         onPrint={() => handlePrintQR()}
//         mode="production"
//       />
//       <EditModal
//         isOpen={editModalOpen}
//         onClose={() => setEditModalOpen(false)}
//         formData={formData}
//         setFormData={setFormData}
//         recordId={editRecordId}
//         setUserBatches={setUserBatches}
//         setEditModalOpen={setEditModalOpen}
//       />
//     </div>
//   );
// }

// export default BundleRegistration;
