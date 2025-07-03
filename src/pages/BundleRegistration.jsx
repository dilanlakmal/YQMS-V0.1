// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState
// } from "react";
// import "react-datepicker/dist/react-datepicker.css";
// import { useTranslation } from "react-i18next";
// import { FaClipboardCheck, FaDatabase, FaRedoAlt } from "react-icons/fa";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import { useFormData } from "../components/context/FormDataContext";
// import EditModal from "../components/forms/EditBundleData";
// import NumLetterPad from "../components/forms/NumLetterPad";
// import NumberPad from "../components/forms/NumberPad";
// import QRCodePreview from "../components/forms/QRCodePreview";
// import ReprintTab from "../components/forms/ReprintTab";
// import BundleRegistrationRecordData from "../components/inspection/qc2/BundleRegistrationRecordData";
// import BundleRegistrationTabData from "../components/inspection/qc2/BundleRegistrationTabData";

// function BundleRegistration() {
//   const { t } = useTranslation();
//   const { user, loading: userLoading } = useAuth();
//   const { formData: persistedFormData, updateFormData } = useFormData();

//   // --- NEW STATE ---
//   const [subConFactories, setSubConFactories] = useState([]);
//   const [additionalLines, setAdditionalLines] = useState(
//     persistedFormData.bundleRegistration?.additionalLines || []
//   );

//   // --- EXISTING STATE ---
//   const [userBatches, setUserBatches] = useState([]);
//   const [qrData, setQrData] = useState([]);
//   const [showQRPreview, setShowQRPreview] = useState(false);
//   const [showNumberPad, setShowNumberPad] = useState(false);
//   const [numberPadTarget, setNumberPadTarget] = useState(null);
//   const [isGenerateDisabled, setIsGenerateDisabled] = useState(false);
//   const [activeTab, setActiveTab] = useState("registration");
//   const [isPrinting, setIsPrinting] = useState(false);
//   const [totalBundleQty, setTotalBundleQty] = useState(0);
//   const [colors, setColors] = useState([]);
//   const [sizes, setSizes] = useState([]);
//   const [hasColors, setHasColors] = useState(false);
//   const [hasSizes, setHasSizes] = useState(false);

//   const savedContextData = persistedFormData.bundleRegistration;

//   const [formData, setFormData] = useState(() => {
//     const today = new Date();
//     return {
//       date: savedContextData?.date ? new Date(savedContextData.date) : today,
//       department: savedContextData?.department || "",
//       selectedMono: savedContextData?.selectedMono || "",
//       buyer: "", // Fetched on MONo change
//       orderQty: "", // Fetched
//       factoryInfo: "", // Fetched
//       custStyle: "", // Fetched
//       country: "", // Fetched
//       color: savedContextData?.color || "",
//       size: savedContextData?.size || "",
//       bundleQty: savedContextData?.bundleQty || 1,
//       lineNo: savedContextData?.lineNo || "",
//       count: savedContextData?.count || 10,
//       colorCode: "", // Fetched
//       chnColor: "", // Fetched
//       colorKey: "", // Fetched
//       sizeOrderQty: "", // Fetched
//       planCutQty: "" // Fetched
//     };
//   });

//   const [isSubConState, setIsSubConState] = useState(
//     () => savedContextData?.isSubCon || false
//   );
//   const [subConNameState, setSubConNameState] = useState(
//     () => savedContextData?.subConName || ""
//   );

//   const [estimatedTotal, setEstimatedTotal] = useState(null);
//   const bluetoothComponentRef = useRef();
//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [editRecordId, setEditRecordId] = useState(null);
//   const isMobileDevice = useMemo(
//     () => /Mobi|Android/i.test(navigator.userAgent),
//     []
//   );
//   const memoizedQrData = useMemo(() => qrData, [qrData]);

//   // Effect to fetch sub-con factories
//   useEffect(() => {
//     const fetchFactories = async () => {
//       try {
//         const response = await fetch(`${API_BASE_URL}/api/subcon-factories`);
//         if (!response.ok) throw new Error("Failed to fetch factories");
//         const data = await response.json();
//         // Format for react-select: { value: 'FactoryName', label: 'FactoryName' }
//         const formattedFactories = data.map((f) => ({
//           value: f.factory,
//           label: f.factory
//         }));
//         setSubConFactories(formattedFactories);
//       } catch (error) {
//         console.error("Error fetching sub-con factories:", error);
//       }
//     };
//     fetchFactories();
//   }, []);

//   // Effect to persist data to context
//   useEffect(() => {
//     const dataToPersist = {
//       ...formData,
//       isSubCon: isSubConState,
//       subConName: subConNameState,
//       additionalLines
//     };
//     updateFormData("bundleRegistration", dataToPersist);
//   }, [
//     formData,
//     isSubConState,
//     subConNameState,
//     additionalLines,
//     updateFormData
//   ]);

//   // Effect for Department change
//   useEffect(() => {
//     const department = formData.department;
//     let newLineNo = formData.lineNo;

//     // Reset department-specific states on change
//     setAdditionalLines([]);
//     setIsSubConState(department === "Sub-con"); // True only for Sub-con by default
//     setSubConNameState("");

//     if (department === "Sub-con") {
//       newLineNo = "SUB";
//     } else if (department === "Washing") {
//       newLineNo = "WS";
//     } else if (department === "QC1 Endline") {
//       // Clear lineNo if it was from a previous department
//       if (["SUB", "WS"].includes(formData.lineNo)) {
//         newLineNo = "";
//       }
//     } else {
//       newLineNo = "";
//     }

//     if (newLineNo !== formData.lineNo) {
//       setFormData((prev) => ({ ...prev, lineNo: newLineNo }));
//     }
//   }, [formData.department]);

//   // Effect for MONo change
//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       if (!formData.selectedMono) {
//         setFormData((prev) => ({
//           ...prev,
//           buyer: "",
//           orderQty: "",
//           factoryInfo: "",
//           custStyle: "",
//           country: "",
//           color: "",
//           colorCode: "",
//           chnColor: "",
//           colorKey: "",
//           size: "",
//           sizeOrderQty: "",
//           planCutQty: "",
//           totalGarmentsCount: undefined
//         }));
//         setColors([]);
//         setHasColors(false);
//         setSizes([]);
//         setHasSizes(false);
//         setTotalBundleQty(0);
//         return;
//       }
//       try {
//         const response = await fetch(
//           `${API_BASE_URL}/api/order-details/${formData.selectedMono}`
//         );
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
//           planCutQty: ""
//         }));
//         const totalResponse = await fetch(
//           `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
//         );
//         if (!totalResponse.ok)
//           throw new Error("Failed to fetch total bundle quantity");
//         const totalData = await totalResponse.json();
//         setTotalBundleQty(totalData.total);
//         if (data.colors && data.colors.length > 0) {
//           setColors(data.colors);
//           setHasColors(true);
//           setHasSizes(false);
//         } else {
//           setColors([]);
//           setHasColors(false);
//           setSizes([]);
//           setHasSizes(false);
//         }
//       } catch (error) {
//         console.error("Error fetching order details:", error);
//         setColors([]);
//         setHasColors(false);
//         setSizes([]);
//         setHasSizes(false);
//       }
//     };
//     fetchOrderDetails();
//   }, [formData.selectedMono]);

//   // Effect for Color change
//   useEffect(() => {
//     const fetchSizesAndInitialCount = async () => {
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
//         const data = await response.json();
//         if (data && data.length > 0) {
//           setSizes(data);
//           setHasSizes(true);
//           const currentSizeToFetch = formData.size || data[0].size;
//           const totalCountResponse = await fetch(
//             `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${currentSizeToFetch}`
//           );
//           const totalCountData = await totalCountResponse.json();
//           setFormData((prev) => {
//             const selectedSizeDetails =
//               data.find((s) => s.size === (prev.size || data[0].size)) ||
//               data[0];
//             return {
//               ...prev,
//               size: prev.size || data[0].size,
//               sizeOrderQty: selectedSizeDetails?.orderQty || 0,
//               planCutQty: selectedSizeDetails?.planCutQty || 0,
//               totalGarmentsCount: totalCountData.totalCount
//             };
//           });
//         } else {
//           setSizes([]);
//           setHasSizes(false);
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
//         setFormData((prev) => ({
//           ...prev,
//           size: "",
//           sizeOrderQty: "",
//           planCutQty: "",
//           totalGarmentsCount: undefined
//         }));
//       }
//     };
//     fetchSizesAndInitialCount();
//   }, [formData.selectedMono, formData.color, formData.size]);

//   // Polling for totalGarmentsCount
//   useEffect(() => {
//     const interval = setInterval(async () => {
//       if (formData.selectedMono && formData.color && formData.size) {
//         try {
//           const response = await fetch(
//             `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${formData.size}`
//           );
//           const data = await response.json();
//           if (data.totalCount !== formData.totalGarmentsCount) {
//             setFormData((prev) => ({
//               ...prev,
//               totalGarmentsCount: data.totalCount
//             }));
//           }
//         } catch (error) {
//           console.error("Error polling total garments count:", error);
//         }
//       }
//     }, 3000);
//     return () => clearInterval(interval);
//   }, [
//     formData.selectedMono,
//     formData.color,
//     formData.size,
//     formData.totalGarmentsCount
//   ]);

//   // Polling for totalBundleQty
//   useEffect(() => {
//     const fetchTotalBundleQtyPoll = async () => {
//       if (!formData.selectedMono) return;
//       try {
//         const response = await fetch(
//           `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
//         );
//         const data = await response.json();
//         if (data.total !== totalBundleQty) {
//           setTotalBundleQty(data.total);
//         }
//       } catch (error) {
//         console.error("Error polling total bundle quantity:", error);
//       }
//     };
//     if (formData.selectedMono) {
//       fetchTotalBundleQtyPoll();
//       const interval = setInterval(fetchTotalBundleQtyPoll, 3000);
//       return () => clearInterval(interval);
//     } else {
//       setTotalBundleQty(0);
//     }
//   }, [formData.selectedMono, totalBundleQty]);

//   // Calculate estimatedTotal
//   useEffect(() => {
//     if (
//       formData.totalGarmentsCount === undefined ||
//       formData.count === "" ||
//       formData.bundleQty === "" ||
//       isNaN(parseInt(formData.count)) ||
//       isNaN(parseInt(formData.bundleQty))
//     ) {
//       setEstimatedTotal(null);
//       return;
//     }
//     const newEstimatedTotal =
//       formData.totalGarmentsCount +
//       parseInt(formData.count) * parseInt(formData.bundleQty);
//     setEstimatedTotal(newEstimatedTotal);
//   }, [formData.totalGarmentsCount, formData.count, formData.bundleQty]);

//   // Fetch User Batches
//   useEffect(() => {
//     const fetchUserBatches = async () => {
//       if (!user) return;
//       try {
//         const response = await fetch(
//           `${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`
//         );
//         const data = await response.json();
//         setUserBatches(data);
//       } catch (error) {
//         console.error("Error fetching user batches:", error);
//       }
//     };
//     fetchUserBatches();
//   }, [user]);

//   const handleNumberPadInput = useCallback(
//     (value) => {
//       setFormData((prev) => ({ ...prev, [numberPadTarget]: value }));
//     },
//     [numberPadTarget]
//   );

//   const validateLineNo = useCallback(() => {
//     if (
//       formData.factoryInfo === "YM" &&
//       formData.department === "QC1 Endline"
//     ) {
//       if (formData.lineNo === "") return false;
//       const lineNoNum = parseInt(formData.lineNo);
//       return !isNaN(lineNoNum) && lineNoNum >= 1 && lineNoNum <= 30;
//     }
//     if (formData.department === "Washing") return formData.lineNo === "WS";
//     if (formData.department === "Sub-con") return formData.lineNo === "SUB";
//     if (!formData.department && formData.lineNo === "") return true;
//     if (formData.lineNo === "") return false;
//     return true;
//   }, [formData.factoryInfo, formData.department, formData.lineNo]);

//   const handleGenerateQR = useCallback(async () => {
//     if (!user || userLoading) {
//       alert("User data is not available. Please try again.");
//       return;
//     }
//     if (!validateLineNo()) {
//       alert("Invalid or missing Line No for the selected department.");
//       return;
//     }
//     const bundleQtyNum = parseInt(formData.bundleQty);
//     const countNum = parseInt(formData.count);
//     if (isNaN(bundleQtyNum) || bundleQtyNum <= 0) {
//       alert("Bundle Qty must be a positive number.");
//       return;
//     }
//     if (isNaN(countNum) || countNum <= 0) {
//       alert("Count must be a positive number.");
//       return;
//     }
//     if (
//       estimatedTotal !== null &&
//       formData.planCutQty > 0 &&
//       estimatedTotal > formData.planCutQty
//     ) {
//       alert("Actual Cut Qty exceeds Plan Cut Qty. Cannot generate QR.");
//       return;
//     }

//     // --- NEW LOGIC for task_no and final lineNo ---
//     const getTaskNo = (dept) => {
//       if (dept === "Washing") return 51;
//       if (dept === "Sub-con" || dept === "QC1 Endline") return 52;
//       return null;
//     };

//     let finalLineNo = formData.lineNo;
//     if (additionalLines.length > 0) {
//       finalLineNo = `${formData.lineNo} (${additionalLines.join(",")})`;
//     }

//     const task_no = getTaskNo(formData.department);
//     if (!task_no) {
//       alert("Could not determine Task No. for the selected department.");
//       return;
//     }

//     // --- NEW LOGIC for sub_con and sub_con_factory ---
//     let subConStatus = "No";
//     let subConFactoryName = "N/A";
//     if (formData.department === "Washing") {
//       if (isSubConState) {
//         subConStatus = "Yes";
//         subConFactoryName = subConNameState || "N/A";
//       }
//     } else if (formData.department === "Sub-con") {
//       subConStatus = "Yes";
//       subConFactoryName = subConNameState || "N/A";
//     }

//     try {
//       const response = await fetch(`${API_BASE_URL}/api/check-bundle-id`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           date: formData.date.toISOString().split("T")[0],
//           lineNo: finalLineNo,
//           selectedMono: formData.selectedMono,
//           color: formData.color,
//           size: formData.size
//         })
//       });
//       const { largestNumber } = await response.json();
//       const bundleData = [];
//       for (let i = 1; i <= bundleQtyNum; i++) {
//         const bundleId = `${
//           formData.date.toISOString().split("T")[0]
//         }:${finalLineNo}:${formData.selectedMono}:${formData.color}:${
//           formData.size
//         }:${largestNumber + i}`;
//         bundleData.push({
//           bundle_id: bundleId,
//           task_no, // ADDED
//           date: formData.date.toLocaleDateString("en-CA"),
//           department: formData.department,
//           selectedMono: formData.selectedMono,
//           custStyle: formData.custStyle,
//           buyer: formData.buyer,
//           country: formData.country,
//           orderQty: formData.orderQty,
//           factory: formData.factoryInfo,
//           lineNo: finalLineNo, // USE FINAL LINE NO
//           color: formData.color,
//           colorCode: formData.colorCode,
//           chnColor: formData.chnColor,
//           colorKey: formData.colorKey,
//           size: formData.size,
//           sizeOrderQty: formData.sizeOrderQty,
//           planCutQty: formData.planCutQty,
//           count: countNum,
//           bundleQty: bundleQtyNum,
//           totalBundleQty: 1,
//           sub_con: subConStatus, // USE NEW LOGIC
//           sub_con_factory: subConFactoryName, // USE NEW LOGIC
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

//       if (saveResponse.ok) {
//         const savedData = await saveResponse.json();
//         setQrData(savedData.data);
//         setIsGenerateDisabled(true);

//         // --- FIXED DATA REFRESH LOGIC ---
//         // 1. Fetch all responses
//         const [totalBundleRes, totalGarmentsRes, userBatchesRes] =
//           await Promise.all([
//             fetch(
//               `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
//             ),
//             fetch(
//               `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${formData.size}`
//             ),
//             user
//               ? fetch(`${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`)
//               : Promise.resolve(null)
//           ]);

//         // 2. Parse all JSON responses
//         const [totalBundleData, totalGarmentsData, batchesData] =
//           await Promise.all([
//             totalBundleRes.json(),
//             totalGarmentsRes.json(),
//             userBatchesRes ? userBatchesRes.json() : Promise.resolve(null)
//           ]);

//         // 3. Update state with the parsed data
//         setTotalBundleQty(totalBundleData.total);
//         setFormData((prev) => ({
//           ...prev,
//           totalGarmentsCount: totalGarmentsData.totalCount
//         }));
//         if (batchesData) {
//           setUserBatches(batchesData);
//         }
//       } else {
//         const errorData = await saveResponse.json();
//         alert(
//           `Failed to save bundle data: ${errorData.message || "Unknown error"}`
//         );
//       }
//     } catch (error) {
//       console.error("Error saving bundle data:", error);
//       alert(`Failed to save bundle data: ${error.message}`);
//     }
//   }, [
//     user,
//     userLoading,
//     formData,
//     validateLineNo,
//     estimatedTotal,
//     isSubConState,
//     subConNameState,
//     additionalLines
//   ]);

//   const handlePrintQR = useCallback(async () => {
//     if (!bluetoothComponentRef.current) {
//       alert("Bluetooth component not initialized");
//       setIsGenerateDisabled(false);
//       return;
//     }
//     try {
//       setIsPrinting(true);
//       for (const data of qrData) {
//         await bluetoothComponentRef.current.printData({
//           ...data,
//           bundle_id: data.bundle_random_id
//         });
//       }
//       setFormData((prev) => ({
//         ...prev,
//         size: "",
//         bundleQty: 1,
//         count: 10,
//         sizeOrderQty: "",
//         planCutQty: ""
//       }));
//       setQrData([]);
//       setIsGenerateDisabled(false);
//       if (user) {
//         const batchesResponse = await fetch(
//           `${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`
//         );
//         const batchesData = await batchesResponse.json();
//         setUserBatches(batchesData);
//       }
//     } catch (error) {
//       alert(`Print failed: ${error.message}`);
//     } finally {
//       setIsPrinting(false);
//     }
//   }, [qrData, user]);

//   const handleEdit = useCallback(
//     (recordId) => {
//       const record = userBatches.find((batch) => batch._id === recordId);
//       if (record) {
//         setEditRecordId(recordId);
//         setEditModalOpen(true);
//       } else {
//         alert("Error: Could not find the record to edit.");
//       }
//     },
//     [userBatches]
//   );

//   const recordToEdit = useMemo(
//     () =>
//       editRecordId ? userBatches.find((b) => b._id === editRecordId) : null,
//     [editRecordId, userBatches]
//   );

//   const PageTitle = useCallback(
//     () => (
//       <div className="text-center">
//         <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
//           Yorkmars (Cambodia) Garment MFG Co., LTD
//         </h1>
//         <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
//           {t("bundle.bundle_registration")}
//           {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
//         </p>
//       </div>
//     ),
//     [t, user]
//   );

//   const tabIcons = useMemo(
//     () => ({
//       registration: <FaClipboardCheck />,
//       data: <FaDatabase />,
//       reprint: <FaRedoAlt />
//     }),
//     []
//   );

//   return (
//     <div className="min-h-screen flex flex-col bg-slate-100 text-gray-800">
//       {/* Mobile Layout */}
//       <div className="md:hidden flex flex-col h-screen">
//         <header className="bg-white shadow-md p-3 sticky top-0 z-20">
//           <PageTitle />
//           <div className="mt-3 flex space-x-1 justify-center">
//             {["registration", "data", "reprint"].map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className={`flex-1 px-3 py-2.5 text-xs rounded-lg font-semibold transition-all duration-150 focus:outline-none flex items-center justify-center space-x-1.5
//                   ${
//                     activeTab === tab
//                       ? "bg-indigo-600 text-white shadow-md"
//                       : "bg-slate-200 text-slate-700 hover:bg-slate-300"
//                   }`}
//               >
//                 {tabIcons[tab]} <span>{t(`bundle.${tab}`)}</span>
//               </button>
//             ))}
//           </div>
//         </header>
//         <main className="flex-1 overflow-y-auto p-3">
//           {activeTab === "registration" && (
//             <BundleRegistrationTabData
//               formData={formData}
//               setFormData={setFormData}
//               colors={colors}
//               sizes={sizes}
//               hasColors={hasColors}
//               hasSizes={hasSizes}
//               // Sub Con Props
//               isSubCon={isSubConState}
//               setIsSubCon={setIsSubConState}
//               subConName={subConNameState}
//               setSubConName={setSubConNameState}
//               subConFactories={subConFactories} // NEW
//               // Additional Lines Props
//               additionalLines={additionalLines} // NEW
//               setAdditionalLines={setAdditionalLines} // NEW
//               // Other props
//               totalBundleQty={totalBundleQty}
//               estimatedTotal={estimatedTotal}
//               isMobileDevice={isMobileDevice}
//               setShowNumberPad={setShowNumberPad}
//               setNumberPadTarget={setNumberPadTarget}
//               handleGenerateQR={handleGenerateQR}
//               handlePrintQR={handlePrintQR}
//               qrData={qrData}
//               isGenerateDisabled={isGenerateDisabled}
//               isPrinting={isPrinting}
//               setShowQRPreview={setShowQRPreview}
//               bluetoothComponentRef={bluetoothComponentRef}
//               validateLineNo={validateLineNo}
//             />
//           )}
//           {activeTab === "data" && (
//             <BundleRegistrationRecordData handleEdit={handleEdit} />
//           )}
//           {activeTab === "reprint" && <ReprintTab />}
//         </main>
//       </div>

//       {/* Desktop Layout */}
//       <div className="hidden md:block">
//         <header className="bg-gradient-to-r from-slate-50 to-gray-100 shadow-lg py-5 px-8">
//           <PageTitle />
//         </header>
//         <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
//           <div className="border-b border-gray-300 mb-8">
//             <nav
//               className="-mb-px flex space-x-6 justify-center"
//               aria-label="Tabs"
//             >
//               {["registration", "data", "reprint"].map((tab) => (
//                 <button
//                   key={tab}
//                   onClick={() => setActiveTab(tab)}
//                   className={`group inline-flex items-center py-3 px-5 border-b-2 font-semibold text-sm focus:outline-none transition-all duration-200 ease-in-out rounded-t-lg
//                         ${
//                           activeTab === tab
//                             ? "border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm"
//                             : "border-transparent text-gray-500 hover:text-indigo-700 hover:border-indigo-300 hover:bg-gray-50"
//                         }`}
//                 >
//                   {React.cloneElement(tabIcons[tab], {
//                     className: `mr-2 h-5 w-5 ${
//                       activeTab === tab
//                         ? "text-indigo-600"
//                         : "text-gray-400 group-hover:text-indigo-500"
//                     }`
//                   })}
//                   {t(`bundle.${tab}`)}
//                 </button>
//               ))}
//             </nav>
//           </div>
//           {activeTab === "registration" && (
//             <BundleRegistrationTabData
//               formData={formData}
//               setFormData={setFormData}
//               colors={colors}
//               sizes={sizes}
//               hasColors={hasColors}
//               hasSizes={hasSizes}
//               isSubCon={isSubConState}
//               setIsSubCon={setIsSubConState}
//               subConName={subConNameState}
//               setSubConName={setSubConNameState}
//               subConFactories={subConFactories} // NEW
//               additionalLines={additionalLines} // NEW
//               setAdditionalLines={setAdditionalLines} // NEW
//               totalBundleQty={totalBundleQty}
//               estimatedTotal={estimatedTotal}
//               isMobileDevice={isMobileDevice}
//               setShowNumberPad={setShowNumberPad}
//               setNumberPadTarget={setNumberPadTarget}
//               handleGenerateQR={handleGenerateQR}
//               handlePrintQR={handlePrintQR}
//               qrData={qrData}
//               isGenerateDisabled={isGenerateDisabled}
//               isPrinting={isPrinting}
//               setShowQRPreview={setShowQRPreview}
//               bluetoothComponentRef={bluetoothComponentRef}
//               validateLineNo={validateLineNo}
//             />
//           )}
//           {activeTab === "data" && (
//             <BundleRegistrationRecordData handleEdit={handleEdit} />
//           )}
//           {activeTab === "reprint" && <ReprintTab />}
//         </main>
//       </div>

//       {/* Modals */}
//       {showNumberPad && !isMobileDevice && (
//         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
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
//         onPrint={handlePrintQR}
//         mode="production"
//       />
//       {editModalOpen && recordToEdit && (
//         <EditModal
//           isOpen={true}
//           onClose={() => {
//             setEditModalOpen(false);
//             setEditRecordId(null);
//           }}
//           initialFormData={recordToEdit}
//           recordId={editRecordId}
//           onSave={(updatedBatch) => {
//             setUserBatches((prevBatches) =>
//               prevBatches.map((b) =>
//                 b._id === updatedBatch._id ? updatedBatch : b
//               )
//             );
//             setEditModalOpen(false);
//             setEditRecordId(null);
//           }}
//           setUserBatches={setUserBatches}
//           setEditModalOpen={setEditModalOpen}
//         />
//       )}
//     </div>
//   );
// }

// export default BundleRegistration;

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
      // --- FIX 2: PERSIST NEW STATE ---
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
          `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${formData.size}?type=${registrationType}` // <-- Pass the type here
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
  }, [
    formData.selectedMono,
    formData.color,
    formData.size,
    registrationType // <-- Add registrationType to dependency array
  ]);

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

  // ---AKE handleGenerateQR ROBUST WITH PROPER STATE MANAGEMENT ---
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

  const PageTitle = useCallback(
    () => (
      <div className="text-center">
        <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
          {t("bundle.bundle_registration")}
          {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
        </p>
      </div>
    ),
    [t, user]
  );

  const tabIcons = useMemo(
    () => ({
      registration: <FaClipboardCheck />,
      data: <FaDatabase />,
      reprint: <FaRedoAlt />
    }),
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-gray-800">
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-screen">
        <header className="bg-white shadow-md p-3 sticky top-0 z-20">
          <PageTitle />
          <div className="mt-3 flex space-x-1 justify-center">
            {["registration", "data", "reprint"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2.5 text-xs rounded-lg font-semibold transition-all duration-150 focus:outline-none flex items-center justify-center space-x-1.5
                  ${
                    activeTab === tab
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
              >
                {tabIcons[tab]} <span>{t(`bundle.${tab}`)}</span>
              </button>
            ))}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3">
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
              subConFactories={subConFactories} // NEW
              // Additional Lines Props
              additionalLines={additionalLines} // NEW
              setAdditionalLines={setAdditionalLines} // NEW
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
              // --- FIX 4: PASS NEW PROPS ---
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
        </main>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <header className="bg-gradient-to-r from-slate-50 to-gray-100 shadow-lg py-5 px-8">
          <PageTitle />
        </header>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-300 mb-8">
            <nav
              className="-mb-px flex space-x-6 justify-center"
              aria-label="Tabs"
            >
              {["registration", "data", "reprint"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`group inline-flex items-center py-3 px-5 border-b-2 font-semibold text-sm focus:outline-none transition-all duration-200 ease-in-out rounded-t-lg
                        ${
                          activeTab === tab
                            ? "border-indigo-600 text-indigo-700 bg-indigo-50 shadow-sm"
                            : "border-transparent text-gray-500 hover:text-indigo-700 hover:border-indigo-300 hover:bg-gray-50"
                        }`}
                >
                  {React.cloneElement(tabIcons[tab], {
                    className: `mr-2 h-5 w-5 ${
                      activeTab === tab
                        ? "text-indigo-600"
                        : "text-gray-400 group-hover:text-indigo-500"
                    }`
                  })}
                  {t(`bundle.${tab}`)}
                </button>
              ))}
            </nav>
          </div>
          {activeTab === "registration" && (
            <BundleRegistrationTabData
              formData={formData}
              setFormData={setFormData}
              colors={colors}
              sizes={sizes}
              hasColors={hasColors}
              hasSizes={hasSizes}
              isSubCon={isSubConState}
              setIsSubCon={setIsSubConState}
              subConName={subConNameState}
              setSubConName={setSubConNameState}
              subConFactories={subConFactories} // NEW
              additionalLines={additionalLines} // NEW
              setAdditionalLines={setAdditionalLines} // NEW
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
              // --- FIX 5: PASS NEW PROPS ---
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
        </main>
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
    </div>
  );
}

export default BundleRegistration;
