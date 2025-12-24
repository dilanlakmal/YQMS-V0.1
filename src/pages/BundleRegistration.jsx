import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import { FaClipboardCheck, FaDatabase, FaRedoAlt } from "react-icons/fa";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import { useFormData } from "../components/context/FormDataContext";
import EditModal from "../components/forms/EditBundleData";
import NumLetterPad from "../components/forms/NumLetterPad";
import NumberPad from "../components/forms/NumberPad";
import QRCodePreview from "../components/forms/QRCodePreview";
import ReprintTab from "../components/forms/ReprintTab";
import BundleRegistrationRecordData from "../components/inspection/qc2/BundleRegistrationRecordData";
import BundleRegistrationTabData from "../components/inspection/qc2/BundleRegistrationTabData";
import {
  Sparkles,
  User,
  ClipboardCheck as ClipboardCheckLucide,
  Database as DatabaseLucide,
  RotateCcw,
  Package
} from "lucide-react";

function BundleRegistration() {
  const { t } = useTranslation();
  const { user, loading: userLoading } = useAuth();
  const { formData: persistedFormData, updateFormData } = useFormData();

  // --- NEW STATE ---
  const [subConFactories, setSubConFactories] = useState([]);
  const [additionalLines, setAdditionalLines] = useState(
    persistedFormData.bundleRegistration?.additionalLines || []
  );

  // --- ADD NEW STATE FOR TYPE AND TASK NO ---
  const [registrationType, setRegistrationType] = useState(
    persistedFormData.bundleRegistration?.registrationType || "end" // 'end' or 'repack'
  );
  const [selectedTaskNo, setSelectedTaskNo] = useState(
    persistedFormData.bundleRegistration?.selectedTaskNo || ""
  );

  // --- EXISTING STATE ---
  const [userBatches, setUserBatches] = useState([]);
  const [qrData, setQrData] = useState([]);
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [numberPadTarget, setNumberPadTarget] = useState(null);
  const [isGenerateDisabled, setIsGenerateDisabled] = useState(false);
  const [activeTab, setActiveTab] = useState("registration");
  const [isPrinting, setIsPrinting] = useState(false);
  const [totalBundleQty, setTotalBundleQty] = useState(0);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [hasColors, setHasColors] = useState(false);
  const [hasSizes, setHasSizes] = useState(false);

  const savedContextData = persistedFormData.bundleRegistration;
  const [formData, setFormData] = useState(() => {
    const today = new Date();
    return {
      date: savedContextData?.date ? new Date(savedContextData.date) : today,
      department: savedContextData?.department || "",
      selectedMono: savedContextData?.selectedMono || "",
      buyer: "", // Fetched on MONo change
      orderQty: "", // Fetched
      factoryInfo: "", // Fetched
      custStyle: "", // Fetched
      country: "", // Fetched
      color: savedContextData?.color || "",
      size: savedContextData?.size || "",
      bundleQty: savedContextData?.bundleQty || 1,
      lineNo: savedContextData?.lineNo || "",
      count: savedContextData?.count || 10,
      colorCode: "", // Fetched
      chnColor: "", // Fetched
      colorKey: "", // Fetched
      sizeOrderQty: "", // Fetched
      planCutQty: "" // Fetched
    };
  });

  const [isSubConState, setIsSubConState] = useState(
    () => savedContextData?.isSubCon || false
  );
  const [subConNameState, setSubConNameState] = useState(
    () => savedContextData?.subConName || ""
  );
  const [estimatedTotal, setEstimatedTotal] = useState(null);
  const bluetoothComponentRef = useRef();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecordId, setEditRecordId] = useState(null);

  const isMobileDevice = useMemo(
    () => /Mobi|Android/i.test(navigator.userAgent),
    []
  );

  const memoizedQrData = useMemo(() => qrData, [qrData]);

  // Define tabs with modern icons
  const tabs = useMemo(() => [
    {
      id: "registration",
      label: t("bundle.registration"),
      icon: <ClipboardCheckLucide size={20} />,
      description: "Bundle Registration Form"
    },
    {
      id: "data",
      label: t("bundle.data"),
      icon: <DatabaseLucide size={20} />,
      description: "View Registration Data"
    },
    {
      id: "reprint",
      label: t("bundle.reprint"),
      icon: <RotateCcw size={20} />,
      description: "Reprint Bundle Labels"
    }
  ], [t]);

  const activeTabData = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [activeTab, tabs]);

  // Effect to fetch sub-con factories
  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/subcon-factories`);
        if (!response.ok) throw new Error("Failed to fetch factories");
        const data = await response.json();
        // Format for react-select: { value: 'FactoryName', label: 'FactoryName' }
        const formattedFactories = data.map((f) => ({
          value: f.factory,
          label: f.factory
        }));
        setSubConFactories(formattedFactories);
      } catch (error) {
        console.error("Error fetching sub-con factories:", error);
      }
    };

    fetchFactories();
  }, []);

  // Effect to persist data to context
  useEffect(() => {
    const dataToPersist = {
      ...formData,
      isSubCon: isSubConState,
      subConName: subConNameState,
      additionalLines,
      // PERSIST NEW STATE ---
      registrationType,
      selectedTaskNo
    };

    updateFormData("bundleRegistration", dataToPersist);
  }, [
    formData,
    isSubConState,
    subConNameState,
    additionalLines,
    // ADD DEPENDENCIES ---
    registrationType,
    selectedTaskNo,
    updateFormData
  ]);

  // Effect for Department change
  useEffect(() => {
    const department = formData.department;
    let newLineNo = formData.lineNo;

    // Reset department-specific states on change
    setAdditionalLines([]);
    setIsSubConState(department === "Sub-con"); // True only for Sub-con by default
    setSubConNameState("");

    if (department === "Sub-con") {
      newLineNo = "SUB";
    } else if (department === "Washing") {
      newLineNo = "WS";
    } else if (department === "QC1 Endline") {
      // Clear lineNo if it was from a previous department
      if (["SUB", "WS"].includes(formData.lineNo)) {
        newLineNo = "";
      }
    } else {
      newLineNo = "";
    }

    if (newLineNo !== formData.lineNo) {
      setFormData((prev) => ({ ...prev, lineNo: newLineNo }));
    }
  }, [formData.department]);

  // Effect for MONo change
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!formData.selectedMono) {
        setFormData((prev) => ({
          ...prev,
          buyer: "",
          orderQty: "",
          factoryInfo: "",
          custStyle: "",
          country: "",
          color: "",
          colorCode: "",
          chnColor: "",
          colorKey: "",
          size: "",
          sizeOrderQty: "",
          planCutQty: "",
          totalGarmentsCount: undefined
        }));
        setColors([]);
        setHasColors(false);
        setSizes([]);
        setHasSizes(false);
        setTotalBundleQty(0);
        return;
      }

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
          setSizes([]);
          setHasSizes(false);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        setColors([]);
        setHasColors(false);
        setSizes([]);
        setHasSizes(false);
      }
    };

    fetchOrderDetails();
  }, [formData.selectedMono]);

  // Effect for Color change
  useEffect(() => {
    const fetchSizesAndInitialCount = async () => {
      if (!formData.selectedMono || !formData.color) {
        setSizes([]);
        setHasSizes(false);
        setFormData((prev) => ({
          ...prev,
          size: "",
          sizeOrderQty: "",
          planCutQty: "",
          totalGarmentsCount: undefined
        }));
        return;
      }

      try {
        const sizesResponse = await fetch(
          `${API_BASE_URL}/api/order-sizes/${formData.selectedMono}/${formData.color}`
        );
        const sizesData = await sizesResponse.json();

        if (sizesData && sizesData.length > 0) {
          setSizes(sizesData);
          setHasSizes(true);

          const currentSizeToFetch = formData.size || sizesData[0].size;

          // Fetch total count using the selected type
          const totalCountResponse = await fetch(
            `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${currentSizeToFetch}?type=${registrationType}`
          );
          const totalCountData = await totalCountResponse.json();

          setFormData((prev) => {
            const selectedSizeDetails =
              sizesData.find((s) => s.size === currentSizeToFetch) ||
              sizesData[0];

            return {
              ...prev,
              size: currentSizeToFetch,
              sizeOrderQty: selectedSizeDetails?.orderQty || 0,
              planCutQty: selectedSizeDetails?.planCutQty || 0,
              totalGarmentsCount: totalCountData.totalCount
            };
          });
        } else {
          setSizes([]);
          setHasSizes(false);
          setFormData((prev) => ({
            ...prev,
            size: "",
            sizeOrderQty: "",
            planCutQty: "",
            totalGarmentsCount: undefined
          }));
        }
      } catch (error) {
        console.error("Error fetching sizes:", error);
        setSizes([]);
        setHasSizes(false);
        setFormData((prev) => ({
          ...prev,
          size: "",
          sizeOrderQty: "",
          planCutQty: "",
          totalGarmentsCount: undefined
        }));
      }
    };

    fetchSizesAndInitialCount();
  }, [formData.selectedMono, formData.color, formData.size, registrationType]);

  // ---POLLING useEffect TO INCLUDE 'registrationType' ---
  // Polling for totalGarmentsCount
  useEffect(() => {
    if (!formData.selectedMono || !formData.color || !formData.size) {
      return; // Exit if necessary data is not available
    }

    const fetchGarmentsCount = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${formData.size}?type=${registrationType}`
        );

        if (!response.ok) {
          // If the API returns an error (like 400), don't update the count
          console.error(
            "Failed to fetch polled garments count, response not ok."
          );
          return;
        }

        const data = await response.json();
        setFormData((prev) => {
          // Only update if the value has actually changed to prevent re-renders
          if (data.totalCount !== prev.totalGarmentsCount) {
            return { ...prev, totalGarmentsCount: data.totalCount };
          }
          return prev;
        });
      } catch (error) {
        console.error("Error polling total garments count:", error);
      }
    };

    fetchGarmentsCount(); // Initial fetch
    const interval = setInterval(fetchGarmentsCount, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [formData.selectedMono, formData.color, formData.size, registrationType]);

  // Polling for totalBundleQty
  useEffect(() => {
    const fetchTotalBundleQtyPoll = async () => {
      if (!formData.selectedMono) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
        );
        const data = await response.json();
        if (data.total !== totalBundleQty) {
          setTotalBundleQty(data.total);
        }
      } catch (error) {
        console.error("Error polling total bundle quantity:", error);
      }
    };

    if (formData.selectedMono) {
      fetchTotalBundleQtyPoll();
      const interval = setInterval(fetchTotalBundleQtyPoll, 3000);
      return () => clearInterval(interval);
    } else {
      setTotalBundleQty(0);
    }
  }, [formData.selectedMono, totalBundleQty]);

  // Calculate estimatedTotal
  useEffect(() => {
    if (
      formData.totalGarmentsCount === undefined ||
      formData.count === "" ||
      formData.bundleQty === "" ||
      isNaN(parseInt(formData.count)) ||
      isNaN(parseInt(formData.bundleQty))
    ) {
      setEstimatedTotal(null);
      return;
    }

    const newEstimatedTotal =
      formData.totalGarmentsCount +
      parseInt(formData.count) * parseInt(formData.bundleQty);
    setEstimatedTotal(newEstimatedTotal);
  }, [formData.totalGarmentsCount, formData.count, formData.bundleQty]);

  // Fetch User Batches
  useEffect(() => {
    const fetchUserBatches = async () => {
      if (!user) return;

      try {
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

  const handleNumberPadInput = useCallback(
    (value) => {
      setFormData((prev) => ({ ...prev, [numberPadTarget]: value }));
    },
    [numberPadTarget]
  );

  const validateLineNo = useCallback(() => {
    if (
      formData.factoryInfo === "YM" &&
      formData.department === "QC1 Endline"
    ) {
      if (formData.lineNo === "") return false;
      const lineNoNum = parseInt(formData.lineNo);
      return !isNaN(lineNoNum) && lineNoNum >= 1 && lineNoNum <= 30;
    }

    if (formData.department === "Washing") return formData.lineNo === "WS";
    if (formData.department === "Sub-con") return formData.lineNo === "SUB";
    if (!formData.department && formData.lineNo === "") return true;
    if (formData.lineNo === "") return false;

    return true;
  }, [formData.factoryInfo, formData.department, formData.lineNo]);

  // ---handleGenerateQR WITH PROPER STATE MANAGEMENT ---
  const handleGenerateQR = useCallback(async () => {
    // --- Start: Validations ---
    if (!user || userLoading) {
      alert("User data is not available. Please try again.");
      return;
    }

    if (!validateLineNo()) {
      alert("Invalid or missing Line No for the selected department.");
      return;
    }

    if (!selectedTaskNo) {
      alert("Please select a valid Task No.");
      return;
    }

    const bundleQtyNum = parseInt(formData.bundleQty);
    const countNum = parseInt(formData.count);

    if (isNaN(bundleQtyNum) || bundleQtyNum <= 0) {
      alert("Bundle Qty must be a positive number.");
      return;
    }

    if (isNaN(countNum) || countNum <= 0) {
      alert("Count must be a positive number.");
      return;
    }

    if (
      estimatedTotal !== null &&
      formData.planCutQty > 0 &&
      estimatedTotal > formData.planCutQty
    ) {
      if (
        !window.confirm(
          "Actual Cut Qty exceeds Plan Cut Qty. Do you want to proceed anyway?"
        )
      ) {
        return;
      }
    }

    // --- End: Validations ---

    // Disable button immediately to prevent double clicks
    setIsGenerateDisabled(true);

    let finalLineNo = formData.lineNo;
    if (additionalLines.length > 0) {
      finalLineNo = `${formData.lineNo} (${additionalLines.join(",")})`;
    }

    let subConStatus = "No";
    let subConFactoryName = "N/A";

    if (formData.department === "Washing") {
      if (isSubConState) {
        subConStatus = "Yes";
        subConFactoryName = subConNameState || "N/A";
      }
    } else if (formData.department === "Sub-con") {
      subConStatus = "Yes";
      subConFactoryName = subConNameState || "N/A";
    }

    const bundleData = [];
    for (let i = 1; i <= bundleQtyNum; i++) {
      bundleData.push({
        type: registrationType,
        task_no: selectedTaskNo,
        date: formData.date.toLocaleDateString("en-CA"),
        department: formData.department,
        selectedMono: formData.selectedMono,
        custStyle: formData.custStyle,
        buyer: formData.buyer,
        country: formData.country,
        orderQty: formData.orderQty,
        factory: formData.factoryInfo,
        lineNo: finalLineNo,
        color: formData.color,
        colorCode: formData.colorCode,
        chnColor: formData.chnColor,
        colorKey: formData.colorKey,
        size: formData.size,
        sizeOrderQty: formData.sizeOrderQty,
        planCutQty: formData.planCutQty,
        count: countNum,
        bundleQty: bundleQtyNum,
        totalBundleQty: 1,
        sub_con: subConStatus,
        sub_con_factory: subConFactoryName,
        emp_id: user.emp_id,
        eng_name: user.eng_name,
        kh_name: user.kh_name,
        job_title: user.job_title,
        dept_name: user.dept_name,
        sect_name: user.sect_name
      });
    }

    try {
      const saveResponse = await fetch(`${API_BASE_URL}/api/save-bundle-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleData })
      });

      if (saveResponse.ok) {
        const savedData = await saveResponse.json();
        // SUCCESS: Set QR data, which will show the Preview/Print buttons
        setQrData(savedData.data);
        // Keep the generate button disabled until the user prints or clears.
        // Refresh other data on screen
        const [totalBundleRes, totalGarmentsRes] = await Promise.all([
          fetch(
            `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
          ),
          fetch(
            `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${formData.size}?type=${registrationType}`
          )
        ]);

        const totalBundleData = await totalBundleRes.json();
        const totalGarmentsData = await totalGarmentsRes.json();

        setTotalBundleQty(totalBundleData.total);
        setFormData((prev) => ({
          ...prev,
          totalGarmentsCount: totalGarmentsData.totalCount
        }));
      } else {
        // FAIL: Alert the user and re-enable the button
        const errorData = await saveResponse.json();
        alert(
          `Failed to save bundle data: ${errorData.message || "Unknown error"}`
        );
        setIsGenerateDisabled(false); // Re-enable on failure
      }
    } catch (error) {
      // CATCH: Alert the user and re-enable the button
      console.error("Error saving bundle data:", error);
      alert(`Failed to save bundle data: ${error.message}`);
      setIsGenerateDisabled(false); // Re-enable on error
    }
  }, [
    user,
    userLoading,
    formData,
    registrationType,
    selectedTaskNo,
    validateLineNo,
    estimatedTotal,
    isSubConState,
    subConNameState,
    additionalLines
  ]);

  const handlePrintQR = useCallback(async () => {
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
        size: "",
        bundleQty: 1,
        count: 10,
        sizeOrderQty: "",
        planCutQty: ""
      }));

      setQrData([]);
      setIsGenerateDisabled(false);

      if (user) {
        const batchesResponse = await fetch(
          `${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`
        );
        const batchesData = await batchesResponse.json();
        setUserBatches(batchesData);
      }
    } catch (error) {
      alert(`Print failed: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  }, [qrData, user]);

  const handleEdit = useCallback(
    (recordId) => {
      const record = userBatches.find((batch) => batch._id === recordId);
      if (record) {
        setEditRecordId(recordId);
        setEditModalOpen(true);
      } else {
        alert("Error: Could not find the record to edit.");
      }
    },
    [userBatches]
  );

  const recordToEdit = useMemo(
    () =>
      editRecordId ? userBatches.find((b) => b._id === editRecordId) : null,
    [editRecordId, userBatches]
  );

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          
          {/* MOBILE/TABLET LAYOUT (< lg) */}
          <div className="lg:hidden space-y-3">
            {/* Top Row: Title + User */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <Package size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                      {t("bundle.bundle_registration")}
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        QC
                      </span>
                    </div>
                  </div>
                  {/* Active Tab Indicator - Inline with title */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                    </div>
                    <p className="text-[10px] text-indigo-100 font-medium truncate">
                      {activeTabData?.label} • Active
                    </p>
                  </div>
                </div>
              </div>

              {user && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-1.5 shadow-xl flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white font-bold text-xs leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Main Tabs - Scrollable */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 min-w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`group relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white shadow-lg scale-105"
                          : "bg-transparent hover:bg-white/20 hover:scale-102"
                      }`}
                    >
                      <div
                        className={`transition-colors duration-300 ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {React.cloneElement(tab.icon, { className: "w-4 h-4" })}
                      </div>
                      <span
                        className={`text-[10px] font-bold transition-colors duration-300 whitespace-nowrap ${
                                                   isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DESKTOP LAYOUT (>= lg) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-1">
                {/* Logo Area */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Package size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        {t("bundle.bundle_registration")}
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={12} className="text-yellow-300" />
                        <span className="text-xs font-bold text-white">
                          QC
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-100 font-medium">
                      Yorkmars (Cambodia) Garment MFG Co., LTD
                    </p>
                  </div>
                </div>

                {/* Navigation Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={`group relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 ${
                            isActive
                              ? "bg-white shadow-lg scale-105"
                              : "bg-transparent hover:bg-white/20 hover:scale-102"
                          }`}
                        >
                          <div
                            className={`transition-colors duration-300 ${
                              isActive ? "text-indigo-600" : "text-white"
                            }`}
                          >
                            {React.cloneElement(tab.icon, {
                              className: "w-5 h-5"
                            })}
                          </div>
                          <span
                            className={`text-xs font-bold transition-colors duration-300 ${
                              isActive ? "text-indigo-600" : "text-white"
                            }`}
                          >
                            {tab.label}
                          </span>
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">
                        {activeTabData?.label}
                      </p>
                      <p className="text-indigo-200 text-xs font-medium leading-tight">
                        Active Module
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 shadow-xl">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 text-xs font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="animate-fadeIn">
          {activeTab === "registration" && (
            <BundleRegistrationTabData
              formData={formData}
              setFormData={setFormData}
              colors={colors}
              sizes={sizes}
              hasColors={hasColors}
              hasSizes={hasSizes}
              // Sub Con Props
              isSubCon={isSubConState}
              setIsSubCon={setIsSubConState}
              subConName={subConNameState}
              setSubConName={setSubConNameState}
              subConFactories={subConFactories}
              // Additional Lines Props
              additionalLines={additionalLines}
              setAdditionalLines={setAdditionalLines}
              // Other props
              totalBundleQty={totalBundleQty}
              estimatedTotal={estimatedTotal}
              isMobileDevice={isMobileDevice}
              setShowNumberPad={setShowNumberPad}
              setNumberPadTarget={setNumberPadTarget}
              handleGenerateQR={handleGenerateQR}
              handlePrintQR={handlePrintQR}
              qrData={qrData}
              isGenerateDisabled={isGenerateDisabled}
              isPrinting={isPrinting}
              setShowQRPreview={setShowQRPreview}
              bluetoothComponentRef={bluetoothComponentRef}
              // Pass new props
              registrationType={registrationType}
              setRegistrationType={setRegistrationType}
              selectedTaskNo={selectedTaskNo}
              setSelectedTaskNo={setSelectedTaskNo}
              validateLineNo={validateLineNo}
            />
          )}

          {activeTab === "data" && (
            <BundleRegistrationRecordData handleEdit={handleEdit} />
          )}

          {activeTab === "reprint" && <ReprintTab />}
        </div>
      </div>

      {/* Modals */}
      {showNumberPad && !isMobileDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            {numberPadTarget === "bundleQty" ||
            numberPadTarget === "count" ||
            (formData.factoryInfo === "YM" &&
              formData.department === "QC1 Endline" &&
              numberPadTarget === "lineNo") ? (
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
        qrData={memoizedQrData}
        onPrint={handlePrintQR}
        mode="production"
      />

      {editModalOpen && recordToEdit && (
        <EditModal
          isOpen={true}
          onClose={() => {
            setEditModalOpen(false);
            setEditRecordId(null);
          }}
          initialFormData={recordToEdit}
          recordId={editRecordId}
          onSave={(updatedBatch) => {
            setUserBatches((prevBatches) =>
              prevBatches.map((b) =>
                b._id === updatedBatch._id ? updatedBatch : b
              )
            );
            setEditModalOpen(false);
            setEditRecordId(null);
          }}
          setUserBatches={setUserBatches}
          setEditModalOpen={setEditModalOpen}
        />
      )}

      {/* Custom Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .bg-grid-white {
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            );
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}

export default BundleRegistration;

