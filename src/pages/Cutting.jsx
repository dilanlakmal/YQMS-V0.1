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

  const handleOkClick = () => {
    navigate('/qc2-inspection', { state: { formData } });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {t('cutting')}
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
           {t("bundle.registration")}
          </button>
        </div>

        {activeTab === "registration" ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Date Picker and MONo Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">{t("bundle.select_department")}</option>
                  <option value="QC1 Endline">{t("bundle.qc1_endline")}</option>
                  <option value="Washing">{t("bundle.washing")}</option>
                  <option value="Dyeing">{t("home.opa")}</option>
                  <option value="Sub-con">{t("bundle.sub_con")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("bundle.search_mono")}
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
                {t("bundle.order_details")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">{t("bundle.select-mono")}:</span>{" "}
                      {formData.selectedMono}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">{t("bundle.customer_style")}:</span>{" "}
                      {formData.custStyle}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">{t("bundle.buyer")}:</span> {formData.buyer}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">{t("bundle.country")}:</span>{" "}
                      {formData.country}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">{t("bundle.order_qty")}:</span>{" "}
                      {formData.orderQty}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">{t("bundle.factory")}:</span>{" "}
                      {formData.factoryInfo}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Line No */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("bundle.line_no")}
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
            </div>
            {/* Color and Size in one line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("bundle.color")}
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
                    <option value="">{t("bundle.select-color")}</option>
                    {colors.map((color) => (
                      <option key={color.original} value={color.original}>
                        {color.original}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">{t("bundle.no_colors_available")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("bundle.size")}
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
                      <option value="">{t("bundle.select_size")}</option>
                      {sizes.map((sizeObj) => (
                        <option key={sizeObj.size} value={sizeObj.size}>
                          {sizeObj.size}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500">{t("bundle.no_size_available")}</p>
                  )
                ) : (
                  <p className="text-sm text-gray-500">{t("bundle.no_colors_available")}</p>
                )}
              </div>
            </div>
            {/* Size Order Qty and Plan Cut Qty */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              {formData.sizeOrderQty > 0 && (
                <div className="p-2 bg-blue-50 rounded-md">
                  <span className="text-sm font-medium">{t("bundle.size-order_qty")}: </span>
                  <span className="text-sm">{formData.sizeOrderQty}</span>
                </div>
              )}
              {formData.planCutQty > 0 && (
                <div className="p-2 bg-green-50 rounded-md">
                  <span className="text-sm font-medium">{t("bundle.plan_cut_qty")}: </span>
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
                {t("bundle.total_garment_count")}: {formData.totalGarmentsCount}
              </div>
            )}

            {/* Count and Bundle Qty in one line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("bundle.count")}
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
                {t("bundle.bundle_qty")}
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
                   {t("bundle.total_registered_bundle_qty")}: {totalBundleQty}
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
                {t("bundle.sub_con_factory")}
                </label>
                <select
                  value={subConName}
                  onChange={(e) => setSubConName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">{t("bundle.select-sub_con_factory")}</option>
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
                      onClick={handleOkClick}
                      className="px-4 py-2 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 flex items-center"
                    >
                       {t("bundle.ok")}
                    </button>
                     
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            
            
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
      </div>
    </div>
  );
}

export default BundleRegistration;

//{dataRecords.map((record, index) => (
