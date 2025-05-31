// import { useEffect, useRef, useState, useMemo } from "react";
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
//   FaTimes
// } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
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

// function BundleRegistration() {
//   const { t } = useTranslation();
//   const { user, loading } = useAuth();
//   const {
//     formData: persistedFormData,
//     updateFormData,
//     clearFormData
//   } = useFormData();

//   const [userBatches, setUserBatches] = useState([]);
//   const navigate = useNavigate();
//   const [qrData, setQrData] = useState([]);
//   const [showQRPreview, setShowQRPreview] = useState(false);
//   const [showNumberPad, setShowNumberPad] = useState(false);
//   const [numberPadTarget, setNumberPadTarget] = useState(null);
//   const [isGenerateDisabled, setIsGenerateDisabled] = useState(false);
//   const [activeTab, setActiveTab] = useState("registration");
//   const [dataRecords, setDataRecords] = useState([]);
//   const [isPrinting, setIsPrinting] = useState(false);
//   const [totalBundleQty, setTotalBundleQty] = useState(0);
//   const [colors, setColors] = useState([]);
//   const [sizes, setSizes] = useState([]);
//   const [hasColors, setHasColors] = useState(false);
//   const [hasSizes, setHasSizes] = useState(false);
//   const [isSubCon, setIsSubCon] = useState(() => {
//     const savedDepartment = persistedFormData.bundleRegistration?.department;
//     if (savedDepartment === "Sub-con") return true; // Default to "Yes" for Sub-con
//     return false; // Default to "No" for all other cases
//   });
//   // const [isSubCon, setIsSubCon] = useState(
//   //   () =>
//   //     persistedFormData.bundleRegistration?.department === "Sub-con" || false
//   // );
//   const [subConName, setSubConName] = useState(
//     () => persistedFormData.bundleRegistration?.subConName || ""
//   );
//   const [estimatedTotal, setEstimatedTotal] = useState(null);

//   const bluetoothComponentRef = useRef();
//   const subConNames = ["Sunicon", "Win Sheng", "Yeewo", "Jinmyung"];

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

//   const toggleOrderDetails = () => {
//     setShowOrderDetails(!showOrderDetails);
//   };

//   useEffect(() => {
//     updateFormData("bundleRegistration", {
//       ...formData,
//       isSubCon,
//       subConName
//     });
//   }, [formData, isSubCon, subConName]);

//   useEffect(() => {
//     if (formData.department === "Sub-con") {
//       setIsSubCon(true); // Default to "Yes" for Sub-con
//       setFormData((prev) => ({
//         ...prev,
//         lineNo: "SUB"
//       }));
//     } else if (formData.department === "Washing") {
//       setIsSubCon(false); // Default to "No" for Washing
//       setSubConName(""); // Reset subConName when not Sub-con
//       setFormData((prev) => ({
//         ...prev,
//         lineNo: "WA"
//       }));
//     } else if (formData.department === "QC1 Endline") {
//       setIsSubCon(false); // Default to "No" for QC1 Endline
//       setSubConName(""); // Reset subConName when not Sub-con
//       setFormData((prev) => ({
//         ...prev,
//         lineNo: ""
//       }));
//     } else {
//       setIsSubCon(false); // Default to "No" for any other case (e.g., empty department)
//       setSubConName(""); // Reset subConName
//       setFormData((prev) => ({
//         ...prev,
//         lineNo: ""
//       }));
//     }
//   }, [formData.department]);

//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       if (!formData.selectedMono) return;
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
//           setHasSizes(false);
//         }
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
//       if (!formData.selectedMono || !formData.color) return;
//       try {
//         const response = await fetch(
//           `${API_BASE_URL}/api/order-sizes/${formData.selectedMono}/${formData.color}`
//         );
//         const data = await response.json();

//         if (data && data.length > 0) {
//           setSizes(data);
//           setHasSizes(true);

//           const totalCountResponse = await fetch(
//             `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${data[0].size}`
//           );
//           const totalCountData = await totalCountResponse.json();
//           const totalGarmentsCount = totalCountData.totalCount;

//           setFormData((prev) => ({
//             ...prev,
//             totalGarmentsCount
//           }));
//         } else {
//           setSizes([]);
//           setHasSizes(false);
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
//     const interval = setInterval(async () => {
//       if (formData.selectedMono && formData.color && formData.size) {
//         try {
//           const response = await fetch(
//             `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${formData.size}`
//           );
//           const data = await response.json();
//           setFormData((prev) => ({
//             ...prev,
//             totalGarmentsCount: data.totalCount
//           }));
//         } catch (error) {
//           console.error("Error fetching updated total:", error);
//         }
//       }
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [formData.selectedMono, formData.color, formData.size]);

//   useEffect(() => {
//     const fetchTotalBundleQty = async () => {
//       if (!formData.selectedMono) return;

//       try {
//         const response = await fetch(
//           `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
//         );
//         const data = await response.json();
//         setTotalBundleQty(data.total);
//       } catch (error) {
//         console.error("Error fetching total bundle quantity:", error);
//       }
//     };

//     fetchTotalBundleQty();

//     const interval = setInterval(fetchTotalBundleQty, 3000);

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
//       parseInt(formData.count) * parseInt(formData.bundleQty);
//     setEstimatedTotal(newEstimatedTotal);
//   }, [formData.totalGarmentsCount, formData.count, formData.bundleQty]);

//   useEffect(() => {
//     const fetchUserBatches = async () => {
//       try {
//         if (!user) return;
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

//   const handleNumberPadInput = (value) => {
//     if (numberPadTarget === "bundleQty") {
//       setFormData((prev) => ({
//         ...prev,
//         bundleQty: value
//       }));
//     } else if (numberPadTarget === "lineNo") {
//       setFormData((prev) => ({
//         ...prev,
//         lineNo: value
//       }));
//     } else if (numberPadTarget === "count") {
//       setFormData((prev) => ({
//         ...prev,
//         count: value
//       }));
//     }
//   };

//   const validateLineNo = () => {
//     if (
//       formData.factoryInfo === "YM" &&
//       formData.department === "QC1 Endline"
//     ) {
//       const lineNo = parseInt(formData.lineNo);
//       return lineNo >= 1 && lineNo <= 30;
//     }
//     return formData.lineNo === "WA" || formData.lineNo === "SUB";
//   };

//   const handleGenerateQR = async () => {
//     if (!user || loading) {
//       alert("User data is not available. Please try again.");
//       return;
//     }

//     if (!validateLineNo()) {
//       alert("Invalid Line No. It must be between 1 and 30 for YM factory.");
//       return;
//     }

//     const { date, selectedMono, color, size, lineNo } = formData;

//     if (formData.totalGarmentsCount > formData.planCutQty) return;

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

//       const { largestNumber } = await response.json();

//       const bundleQty = parseInt(formData.bundleQty);
//       const bundleData = [];

//       for (let i = 1; i <= bundleQty; i++) {
//         const bundleId = `${
//           date.toISOString().split("T")[0]
//         }:${lineNo}:${selectedMono}:${color}:${size}:${largestNumber + i}`;

//         const bundleRecord = {
//           bundle_id: bundleId,
//           date: date.toLocaleDateString("en-US"),
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
//           bundleQty: formData.bundleQty,
//           totalBundleQty: 1,
//           sub_con: isSubCon ? "Yes" : "No",
//           sub_con_factory: isSubCon ? subConName : "",
//           emp_id: user.emp_id,
//           eng_name: user.eng_name,
//           kh_name: user.kh_name,
//           job_title: user.job_title,
//           dept_name: user.dept_name,
//           sect_name: user.sect_name
//         };

//         bundleData.push(bundleRecord);
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
//         setFormData((prev) => ({
//           ...prev,
//           bundleQty: ""
//         }));

//         setDataRecords((prevRecords) => [...prevRecords, ...savedData.data]);

//         try {
//           const totalResponse = await fetch(
//             `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
//           );
//           const totalData = await totalResponse.json();
//           setTotalBundleQty(totalData.total);

//           if (user) {
//             const batchesResponse = await fetch(
//               `${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`
//             );
//             const batchesData = await batchesResponse.json();
//             setUserBatches(batchesData);
//           }
//         } catch (error) {
//           console.error("Error updating total bundle quantity:", error);
//         }
//       } else {
//         alert("Failed to save bundle data.");
//       }
//     } catch (error) {
//       console.error("Error saving bundle data:", error);
//       alert("Failed to save bundle data.");
//     }
//   };

//   const handlePrintQR = async () => {
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
//         bundleQty: 1,
//         size: "",
//         count: 10
//       }));
//       setIsGenerateDisabled(false);

//       if (user) {
//         const batchesResponse = await fetch(
//           `${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`
//         );
//         const batchesData = await batchesResponse.json();
//         setUserBatches(batchesData);
//       }

//       //alert("QR codes printed successfully!");
//     } catch (error) {
//       alert(`Print failed: ${error.message}`);
//       setIsGenerateDisabled(false);
//     } finally {
//       setIsPrinting(false);
//     }
//   };

//   const incrementValue = (field) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: parseInt(prev[field]) + 1
//     }));
//   };

//   const decrementValue = (field) => {
//     if (formData[field] > 1) {
//       setFormData((prev) => ({
//         ...prev,
//         [field]: parseInt(prev[field]) - 1
//       }));
//     }
//   };

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
//     const matchesStyleCode = styleCodeFilter
//       ? batch.custStyle?.toLowerCase().includes(styleCodeFilter.toLowerCase())
//       : true;
//     const matchesColor = colorFilter
//       ? batch.color?.toLowerCase().includes(colorFilter.toLowerCase())
//       : true;
//     const matchesSize = sizeFilter
//       ? batch.size?.toLowerCase().includes(sizeFilter.toLowerCase())
//       : true;
//     const matchesPackageNo = packageNoFilter
//       ? batch.package_no
//           ?.toString()
//           .toLowerCase()
//           .includes(packageNoFilter.toLowerCase())
//       : true;
//     const matchesMono = monoFilter
//       ? batch.selectedMono?.toLowerCase().endsWith(monoFilter.toLowerCase())
//       : true;
//     return (
//       matchesStyleCode &&
//       matchesPackageNo &&
//       matchesMono &&
//       matchesColor &&
//       matchesSize
//     );
//   });

//   return (
//     <div className="h-screen flex flex-col bg-gray-50">
//       {/* Mobile Layout (below md: 768px) */}
//       <div className="md:hidden">
//         <div className="bg-white shadow-sm p-3 sticky top-0 z-10">
//           <div className="flex justify-between items-center">
//             <h1 className="text-xl font-bold text-gray-900">
//               {t("bundle.bundle_registration")}
//             </h1>
//             <div className="flex space-x-1">
//               <button
//                 onClick={() => setActiveTab("registration")}
//                 className={`px-3 py-1.5 text-sm rounded-md ${
//                   activeTab === "registration"
//                     ? "bg-blue-500 text-white"
//                     : "bg-gray-200 text-gray-700"
//                 }`}
//               >
//                 {t("bundle.registration")}
//               </button>
//               <button
//                 onClick={() => setActiveTab("data")}
//                 className={`px-3 py-1.5 text-sm rounded-md ${
//                   activeTab === "data"
//                     ? "bg-blue-500 text-white"
//                     : "bg-gray-200 text-gray-700"
//                 }`}
//               >
//                 {t("bundle.data")}
//               </button>
//               <button
//                 onClick={() => setActiveTab("reprint")}
//                 className={`px-3 py-1.5 text-sm rounded-md ${
//                   activeTab === "reprint"
//                     ? "bg-blue-500 text-white"
//                     : "bg-gray-200 text-gray-700"
//                 }`}
//               >
//                 {t("bundle.reprint")}
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="flex-1 overflow-hidden">
//           <div className="h-full overflow-auto p-2">
//             {activeTab === "registration" ? (
//               <div className="bg-white rounded-lg shadow-md p-3">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
//                   <div className="flex items-end space-x-4">
//                     <div>
//                       <label className="block text-xs font-medium text-gray-700 mb-1">
//                         {t("bundle.date")}
//                       </label>
//                       <DatePicker
//                         selected={formData.date}
//                         onChange={(date) =>
//                           setFormData((prev) => ({ ...prev, date }))
//                         }
//                         className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
//                         dateFormat="yyyy-MM-dd"
//                       />
//                     </div>
//                     <BluetoothComponent ref={bluetoothComponentRef} />
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-3">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       {t("bundle.department")}
//                     </label>
//                     <select
//                       value={formData.department}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           department: e.target.value
//                         }))
//                       }
//                       className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
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
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       {t("bundle.search_mono")}
//                     </label>
//                     <MonoSearch
//                       value={formData.selectedMono}
//                       onSelect={(mono) =>
//                         setFormData({ ...formData, selectedMono: mono })
//                       }
//                       placeholder="Search MONo..."
//                       showSearchIcon={true}
//                       closeOnOutsideClick={true}
//                       inputMode="numeric"
//                     />
//                     {formData.selectedMono && (
//                       <div className="mt-2 text-sm text-gray-700">
//                         <strong>{t("bundle.selected_mono")}:</strong>{" "}
//                         {formData.selectedMono}
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {formData.selectedMono && (
//                   <div className="mb-2 p-2 bg-gray-50 rounded-md text-xs">
//                     <div className="flex justify-between items-center">
//                       <h2 className="text-sm font-bold text-gray-800">
//                         {t("bundle.order_details")}
//                       </h2>
//                       <button
//                         onClick={toggleOrderDetails}
//                         className="text-gray-500 hover:text-gray-700"
//                       >
//                         {showOrderDetails ? <FaEyeSlash /> : <FaEye />}
//                       </button>
//                     </div>
//                     {showOrderDetails && (
//                       <div className="grid grid-cols-2 gap-2">
//                         <div>
//                           <p className="text-xs text-gray-700">
//                             <span className="font-bold">
//                               {t("bundle.selected_mono")}:
//                             </span>{" "}
//                             {formData.selectedMono}
//                           </p>
//                           <p className="text-xs text-gray-700">
//                             <span className="font-bold">
//                               {t("bundle.customer_style")}:
//                             </span>{" "}
//                             {formData.custStyle}
//                           </p>
//                           <p className="text-xs text-gray-700">
//                             <span className="font-bold">
//                               {t("bundle.buyer")}:
//                             </span>{" "}
//                             {formData.buyer}
//                           </p>
//                         </div>
//                         <div>
//                           <p className="text-xs text-gray-700">
//                             <span className="font-bold">
//                               {t("bundle.country")}:
//                             </span>{" "}
//                             {formData.country}
//                           </p>
//                           <p className="text-xs text-gray-700">
//                             <span className="font-bold">
//                               {t("bundle.order_qty")}:
//                             </span>{" "}
//                             {formData.orderQty}
//                           </p>
//                           <p className="text-xs text-gray-700">
//                             <span className="font-bold">
//                               {t("bundle.factory")}:
//                             </span>{" "}
//                             {formData.factoryInfo}
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}
//                 <div className="grid grid-cols-3 gap-3 mb-3">
//                   <div className="mb-3">
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       {t("bundle.line_no")}
//                     </label>
//                     <div className="relative">
//                       <input
//                         type="text"
//                         value={formData.lineNo}
//                         onClick={() => {
//                           setNumberPadTarget("lineNo");
//                           setShowNumberPad(true);
//                         }}
//                         readOnly
//                         className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md cursor-pointer"
//                       />
//                       {formData.department === "Washing" && (
//                         <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//                           <span className="text-gray-500 text-xs">WA</span>
//                         </div>
//                       )}
//                       {formData.department === "Sub-con" && (
//                         <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//                           <span className="text-gray-500 text-xs">SUB</span>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       {t("bundle.color")}
//                     </label>
//                     {hasColors ? (
//                       <select
//                         value={formData.color}
//                         onChange={(e) => {
//                           const selectedColor = colors.find(
//                             (c) => c.original === e.target.value
//                           );
//                           const newFormData = {
//                             ...formData,
//                             color: e.target.value,
//                             colorCode: selectedColor?.code || "",
//                             chnColor: selectedColor?.chn || "",
//                             colorKey: selectedColor?.key || "",
//                             size: "",
//                             sizeOrderQty: "",
//                             planCutQty: ""
//                           };
//                           setFormData(newFormData);
//                           updateFormData("bundleRegistration", newFormData);
//                         }}
//                         className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
//                       >
//                         <option value="">{t("bundle.select_color")}</option>
//                         {colors.map((color) => (
//                           <option key={color.original} value={color.original}>
//                             {color.original}
//                           </option>
//                         ))}
//                       </select>
//                     ) : (
//                       <p className="text-xs text-gray-500 py-1.5">
//                         {t("bundle.no_colors_available")}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       {t("bundle.size")}
//                     </label>
//                     {hasColors ? (
//                       hasSizes ? (
//                         <select
//                           value={formData.size}
//                           onChange={(e) => {
//                             const selectedSize = sizes.find(
//                               (s) => s.size === e.target.value
//                             );
//                             const newFormData = {
//                               ...formData,
//                               size: e.target.value,
//                               sizeOrderQty: selectedSize?.orderQty || 0,
//                               planCutQty: selectedSize?.planCutQty || 0
//                             };
//                             setFormData(newFormData);
//                             updateFormData("bundleRegistration", newFormData);
//                           }}
//                           className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
//                         >
//                           <option value="">Select Size</option>
//                           {sizes.map((sizeObj) => (
//                             <option key={sizeObj.size} value={sizeObj.size}>
//                               {sizeObj.size}
//                             </option>
//                           ))}
//                         </select>
//                       ) : (
//                         <p className="text-xs text-gray-500 py-1.5">
//                           {t("bundle.no_size_available")}
//                         </p>
//                       )
//                     ) : (
//                       <p className="text-xs text-gray-500 py-1.5">
//                         {t("bundle.no_colors_available")}
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-2 mb-2">
//                   {formData.sizeOrderQty > 0 && (
//                     <div className="p-1.5 bg-blue-50 rounded-md">
//                       <span className="text-xs font-medium">
//                         {t("bundle.size_order_qty")}:{" "}
//                       </span>
//                       <span className="text-xs">{formData.sizeOrderQty}</span>
//                     </div>
//                   )}
//                   {formData.planCutQty > 0 && (
//                     <div className="p-1.5 bg-green-50 rounded-md">
//                       <span className="text-xs font-medium">
//                         {t("bundle.plan_cut_qty")}:{" "}
//                       </span>
//                       <span className="text-xs">{formData.planCutQty}</span>
//                     </div>
//                   )}
//                 </div>

//                 {formData.totalGarmentsCount !== undefined && (
//                   <div
//                     className={`mt-1 text-xs ${
//                       formData.totalGarmentsCount > formData.planCutQty
//                         ? "text-red-500"
//                         : "text-green-500"
//                     }`}
//                   >
//                     {t("bundle.total_garment_count")}:{" "}
//                     {formData.totalGarmentsCount}
//                   </div>
//                 )}

//                 <div className="grid grid-cols-2 gap-3 mb-3">
//                   <div className="relative">
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       {t("bundle.count")}
//                     </label>
//                     <div className="flex items-center border border-gray-300 rounded-md">
//                       <button
//                         type="button"
//                         onClick={() => decrementValue("count")}
//                         className="px-2 py-1 bg-gray-200 rounded-l-md"
//                       >
//                         <FaMinus size={12} />
//                       </button>
//                       <input
//                         type="text"
//                         value={formData.count}
//                         onClick={() => {
//                           setNumberPadTarget("count");
//                           setShowNumberPad(true);
//                         }}
//                         readOnly
//                         className="w-full px-2 py-1 text-sm bg-gray-50 text-center"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => incrementValue("count")}
//                         className="px-2 py-1 bg-gray-200 rounded-r-md"
//                       >
//                         <FaPlus size={12} />
//                       </button>
//                     </div>
//                   </div>
//                   <div className="relative">
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       {t("bundle.bundle_qty")}
//                     </label>
//                     <div className="flex items-center border border-gray-300 rounded-md">
//                       <button
//                         type="button"
//                         onClick={() => decrementValue("bundleQty")}
//                         className="px-2 py-1 bg-gray-200 rounded-l-md"
//                       >
//                         <FaMinus size={12} />
//                       </button>
//                       <input
//                         type="text"
//                         value={formData.bundleQty}
//                         onClick={() => {
//                           setNumberPadTarget("bundleQty");
//                           setShowNumberPad(true);
//                         }}
//                         readOnly
//                         className="w-full px-2 py-1 text-sm bg-gray-50 text-center"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => incrementValue("bundleQty")}
//                         className="px-2 py-1 bg-gray-200 rounded-r-md"
//                       >
//                         <FaPlus size={12} />
//                       </button>
//                     </div>
//                     {formData.selectedMono && (
//                       <p className="mt-1 text-xs text-gray-700">
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
//                   />
//                 )}

//                 {formData.department === "Sub-con" && (
//                   <div className="mb-3">
//                     <label className="block text-xs font-medium text-gray-700 mb-1">
//                       {t("bundle.sub_con_factory")}
//                     </label>
//                     <select
//                       value={subConName}
//                       onChange={(e) => setSubConName(e.target.value)}
//                       className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
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

//                 {formData.planCutQty !== undefined &&
//                   estimatedTotal !== null && (
//                     <div
//                       className={`mt-1 text-xs ${
//                         estimatedTotal > formData.planCutQty
//                           ? "text-red-500"
//                           : "text-green-500"
//                       }`}
//                     >
//                       {estimatedTotal > formData.planCutQty
//                         ? `⚠️ Actual Cut Qty (${estimatedTotal}) exceeds Plan Cut Qty (${formData.planCutQty}). Please adjust values.`
//                         : `✅ Actual Cut Qty (${estimatedTotal}) is within Plan Cut Qty (${formData.planCutQty}).`}
//                     </div>
//                   )}

//                 <div className="flex justify-between mt-3">
//                   <div className="flex flex-wrap gap-2">
//                     <button
//                       type="button"
//                       onClick={handleGenerateQR}
//                       disabled={
//                         isGenerateDisabled ||
//                         !formData.selectedMono ||
//                         !formData.color ||
//                         !formData.size ||
//                         !formData.bundleQty ||
//                         !formData.lineNo ||
//                         !formData.count ||
//                         (estimatedTotal !== null &&
//                           estimatedTotal > formData.planCutQty)
//                       }
//                       className={`px-3 py-1.5 rounded-md flex items-center text-xs ${
//                         formData.selectedMono &&
//                         formData.color &&
//                         formData.size &&
//                         formData.bundleQty &&
//                         formData.lineNo &&
//                         formData.count
//                           ? (estimatedTotal !== null &&
//                             estimatedTotal > formData.planCutQty
//                               ? "bg-red-500"
//                               : "bg-green-500") + " text-white"
//                           : "bg-gray-300 text-gray-500 cursor-not-allowed"
//                       }`}
//                     >
//                       <FaQrcode className="mr-1" size={12} />{" "}
//                       {t("bundle.generate_qr")}
//                     </button>
//                     {qrData.length > 0 && (
//                       <>
//                         <button
//                           type="button"
//                           onClick={() => setShowQRPreview(true)}
//                           className="px-3 py-1.5 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 flex items-center text-xs"
//                         >
//                           <FaEye className="mr-1" size={12} />{" "}
//                           {t("bundle.preview_qr")}
//                         </button>
//                         <button
//                           type="button"
//                           onClick={handlePrintQR}
//                           disabled={isPrinting}
//                           className={`px-3 py-1.5 rounded-md flex items-center text-xs ${
//                             isPrinting
//                               ? "bg-gray-400 cursor-not-allowed"
//                               : "bg-green-500 hover:bg-green-600"
//                           } text-white`}
//                         >
//                           <FaPrint className="mr-1" size={12} />
//                           {isPrinting
//                             ? t("bundle.printing")
//                             : t("bundle.print_qr")}
//                         </button>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ) : activeTab === "data" ? (
//               <div className="bg-white rounded-lg shadow-md p-3">
//                 <div className="flex justify-between items-center mb-3">
//                   <h2 className="text-sm font-bold text-gray-800">
//                     {t("bundle.data")}
//                   </h2>
//                   <div className="flex items-center">
//                     <button
//                       onClick={() => setShowFilters(!showFilters)}
//                       className="flex items-center text-xs bg-blue-500 text-white px-2 py-1 rounded-md mr-2"
//                     >
//                       <FaFilter className="mr-1" size={10} />{" "}
//                       {showFilters ? "Hide Filters" : "Show Filters"}
//                     </button>
//                     {showFilters && (
//                       <button
//                         onClick={clearFilters}
//                         className="flex items-center text-xs bg-gray-200 px-2 py-1 rounded-md"
//                       >
//                         <FaTimes className="mr-1" size={10} /> Clear
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 {showFilters && (
//                   <div className="grid grid-cols-2 gap-2 mb-3">
//                     <input
//                       type="text"
//                       placeholder="Filter by Color"
//                       value={colorFilter}
//                       onChange={(e) => setColorFilter(e.target.value)}
//                       className="px-2 py-1 text-xs border border-gray-300 rounded-md"
//                     />
//                     <input
//                       type="text"
//                       placeholder="Filter by Size"
//                       value={sizeFilter}
//                       onChange={(e) => setSizeFilter(e.target.value)}
//                       className="px-2 py-1 text-xs border border-gray-300 rounded-md"
//                     />
//                     <input
//                       type="text"
//                       placeholder="Filter by Style Code"
//                       value={styleCodeFilter}
//                       onChange={(e) => setStyleCodeFilter(e.target.value)}
//                       className="px-2 py-1 text-xs border border-gray-300 rounded-md"
//                     />
//                     <input
//                       type="text"
//                       placeholder="Filter by Package No"
//                       value={packageNoFilter}
//                       onChange={(e) => setPackageNoFilter(e.target.value)}
//                       className="px-2 py-1 text-xs border border-gray-300 rounded-md"
//                     />
//                     <input
//                       type="text"
//                       placeholder="Filter by MONo"
//                       value={monoFilter}
//                       onChange={(e) => setMonoFilter(e.target.value)}
//                       className="px-2 py-1 text-xs border border-gray-300 rounded-md col-span-2"
//                     />
//                   </div>
//                 )}

//                 <div className="overflow-x-auto">
//                   <div className="inline-block min-w-full align-middle">
//                     <div className="overflow-hidden border border-gray-200 rounded-lg">
//                       <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
//                         <thead className="bg-sky-100">
//                           <tr>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.record_id")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.package_no")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.date")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.modify")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.time")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.department")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.emp_id")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.eng_name")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.kh_name")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.mono")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.customer_style")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.buyer")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.country")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.total_order_qty")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.factory")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.line_no")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.color")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.color_chi")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.size")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.order_cut_qty")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.plan_cut_qty")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.count")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.total_bundle_qty")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.sub_con")}
//                             </th>
//                             <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                               {t("bundle.sub_con_factory")}
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                           {filteredBatches.map((batch, index) => (
//                             <tr key={index} className="hover:bg-gray-50">
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {index + 1}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.package_no}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.updated_date_seperator}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 <button
//                                   onClick={() => handleEdit(batch._id)}
//                                   className="px-2 py-1.5 text-xs font-medium text-gray-700 border border-blue-800 bg-blue-200 rounded-md hover:bg-blue-300"
//                                 >
//                                   {t("bundle.edit")}
//                                 </button>
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.updated_time_seperator}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.department}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.emp_id}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.eng_name}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.kh_name}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.selectedMono}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.custStyle}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.buyer}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.country}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.orderQty}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.factory}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.lineNo}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.color}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.chnColor}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.size}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.sizeOrderQty}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.planCutQty}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.count}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.bundleQty}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.sub_con}
//                               </td>
//                               <td className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
//                                 {batch.sub_con === "Yes"
//                                   ? batch.sub_con_factory
//                                   : "N/A"}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="mt-3 text-xs text-gray-500">
//                   Showing {filteredBatches.length} of {userBatches.length}{" "}
//                   records
//                 </div>
//               </div>
//             ) : (
//               <ReprintTab />
//             )}
//           </div>
//         </div>
//       </div>
//       {/* Laptop Layout (md and above: 768px+) */}
//       <div className="hidden md:block min-h-screen bg-gray-50 pt-5 px-8">
//         <div className="max-w-6xl mx-auto">
//           <h1 className="text-3xl font-bold text-gray-900 mb-6">
//             {t("bundle.bundle_registration")}
//           </h1>

//           <div className="flex space-x-4 mb-4">
//             <button
//               onClick={() => setActiveTab("registration")}
//               className={`px-4 py-2 rounded-md ${
//                 activeTab === "registration"
//                   ? "bg-blue-500 text-white"
//                   : "bg-gray-200 text-gray-700"
//               }`}
//             >
//               {t("bundle.registration")}
//             </button>
//             <button
//               onClick={() => setActiveTab("data")}
//               className={`px-4 py-2 rounded-md ${
//                 activeTab === "data"
//                   ? "bg-blue-500 text-white"
//                   : "bg-gray-200 text-gray-700"
//               }`}
//             >
//               {t("bundle.data")}
//             </button>
//             <button
//               onClick={() => setActiveTab("reprint")}
//               className={`px-4 py-2 rounded-md ${
//                 activeTab === "reprint"
//                   ? "bg-blue-500 text-white"
//                   : "bg-gray-200 text-gray-700"
//               }`}
//             >
//               {t("bundle.reprint")}
//             </button>
//           </div>

//           {activeTab === "registration" ? (
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-0.5">
//                     {t("bundle.date")}
//                   </label>
//                   <DatePicker
//                     selected={formData.date}
//                     onChange={(date) =>
//                       setFormData((prev) => ({ ...prev, date }))
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                     dateFormat="yyyy-MM-dd"
//                   />
//                 </div>
//                 <div className="flex items-end">
//                   <BluetoothComponent ref={bluetoothComponentRef} />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-0.5">
//                     {t("bundle.department")}
//                   </label>
//                   <select
//                     value={formData.department}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         department: e.target.value
//                       }))
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                   >
//                     <option value="">{t("bundle.select_department")}</option>
//                     <option value="QC1 Endline">
//                       {t("bundle.qc1_endline")}
//                     </option>
//                     <option value="Washing">{t("bundle.washing")}</option>
//                     <option value="Sub-con">{t("bundle.sub_con")}</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-0.5">
//                     {t("bundle.search_mono")}
//                   </label>
//                   <MonoSearch
//                     value={formData.selectedMono}
//                     onSelect={(mono) =>
//                       setFormData({ ...formData, selectedMono: mono })
//                     }
//                     placeholder="Search MONo..."
//                     showSearchIcon={true}
//                     closeOnOutsideClick={true}
//                     inputMode="numeric"
//                   />
//                 </div>
//               </div>

//               {formData.selectedMono && (
//                 <div className="mb-1 p-1 bg-gray-50 rounded-md">
//                   <div className="flex justify-between items-center">
//                     <h2 className="text-lg font-bold text-gray-800 mb-2">
//                       {t("bundle.order_details")}
//                     </h2>
//                     <button
//                       onClick={toggleOrderDetails}
//                       className="text-gray-500 hover:text-gray-700"
//                     >
//                       {showOrderDetails ? <FaEyeSlash /> : <FaEye />}
//                     </button>
//                   </div>
//                   {showOrderDetails && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                       <div>
//                         <p className="text-sm text-gray-700">
//                           <span className="font-bold">
//                             {t("bundle.selected_mono")}:
//                           </span>{" "}
//                           {formData.selectedMono}
//                         </p>
//                         <p className="text-sm text-gray-700">
//                           <span className="font-bold">
//                             {t("bundle.customer_style")}:
//                           </span>{" "}
//                           {formData.custStyle}
//                         </p>
//                         <p className="text-sm text-gray-700">
//                           <span className="font-bold">
//                             {t("bundle.buyer")}:
//                           </span>{" "}
//                           {formData.buyer}
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-700">
//                           <span className="font-bold">
//                             {t("bundle.country")}:
//                           </span>{" "}
//                           {formData.country}
//                         </p>
//                         <p className="text-sm text-gray-700">
//                           <span className="font-bold">
//                             {t("bundle.order_qty")}:
//                           </span>{" "}
//                           {formData.orderQty}
//                         </p>
//                         <p className="text-sm text-gray-700">
//                           <span className="font-bold">
//                             {t("bundle.factory")}:
//                           </span>{" "}
//                           {formData.factoryInfo}
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Line No, Color, and Size in one row */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-0.5">
//                     {t("bundle.line_no")}
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="text"
//                       value={formData.lineNo}
//                       onClick={() => {
//                         setNumberPadTarget("lineNo");
//                         setShowNumberPad(true);
//                       }}
//                       readOnly
//                       className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md cursor-pointer"
//                     />
//                     {formData.department === "Washing" && (
//                       <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
//                         <span className="text-gray-500">WA</span>
//                       </div>
//                     )}
//                     {formData.department === "Sub-con" && (
//                       <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
//                         <span className="text-gray-500">SUB</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-0.5">
//                     {t("bundle.color")}
//                   </label>
//                   {hasColors ? (
//                     <select
//                       value={formData.color}
//                       onChange={(e) => {
//                         const selectedColor = colors.find(
//                           (c) => c.original === e.target.value
//                         );
//                         const newFormData = {
//                           ...formData,
//                           color: e.target.value,
//                           colorCode: selectedColor?.code || "",
//                           chnColor: selectedColor?.chn || "",
//                           colorKey: selectedColor?.key || "",
//                           size: "",
//                           sizeOrderQty: "",
//                           planCutQty: ""
//                         };
//                         setFormData(newFormData);
//                         updateFormData("bundleRegistration", newFormData);
//                       }}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                     >
//                       <option value="">{t("bundle.select_color")}</option>
//                       {colors.map((color) => (
//                         <option key={color.original} value={color.original}>
//                           {color.original}
//                         </option>
//                       ))}
//                     </select>
//                   ) : (
//                     <p className="text-sm text-gray-500">
//                       {t("bundle.no_colors_available")}
//                     </p>
//                   )}
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-0.5">
//                     {t("bundle.size")}
//                   </label>
//                   {hasColors ? (
//                     hasSizes ? (
//                       <select
//                         value={formData.size}
//                         onChange={(e) => {
//                           const selectedSize = sizes.find(
//                             (s) => s.size === e.target.value
//                           );
//                           const newFormData = {
//                             ...formData,
//                             size: e.target.value,
//                             sizeOrderQty: selectedSize?.orderQty || 0,
//                             planCutQty: selectedSize?.planCutQty || 0
//                           };
//                           setFormData(newFormData);
//                           updateFormData("bundleRegistration", newFormData);
//                         }}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       >
//                         <option value="">Select Size</option>
//                         {sizes.map((sizeObj) => (
//                           <option key={sizeObj.size} value={sizeObj.size}>
//                             {sizeObj.size}
//                           </option>
//                         ))}
//                       </select>
//                     ) : (
//                       <p className="text-sm text-gray-500">
//                         {t("bundle.no_size_available")}
//                       </p>
//                     )
//                   ) : (
//                     <p className="text-sm text-gray-500">
//                       {t("bundle.no_colors_available")}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4 mb-4">
//                 {formData.sizeOrderQty > 0 && (
//                   <div className="p-2 bg-blue-50 rounded-md">
//                     <span className="text-sm font-medium">
//                       {t("bundle.size_order_qty")}:{" "}
//                     </span>
//                     <span className="text-sm">{formData.sizeOrderQty}</span>
//                   </div>
//                 )}
//                 {formData.planCutQty > 0 && (
//                   <div className="p-2 bg-green-50 rounded-md">
//                     <span className="text-sm font-medium">
//                       {t("bundle.plan_cut_qty")}:{" "}
//                     </span>
//                     <span className="text-sm">{formData.planCutQty}</span>
//                   </div>
//                 )}
//               </div>

//               {formData.totalGarmentsCount !== undefined && (
//                 <div
//                   className={`mb-4 text-sm ${
//                     formData.totalGarmentsCount > formData.planCutQty
//                       ? "text-red-500"
//                       : "text-green-500"
//                   }`}
//                 >
//                   {t("bundle.total_garment_count")}:{" "}
//                   {formData.totalGarmentsCount}
//                 </div>
//               )}

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                 <div className="relative">
//                   <label className="block text-sm font-medium text-gray-700 mb-0.5">
//                     {t("bundle.count")}
//                   </label>
//                   <div className="flex items-center border border-gray-300 rounded-md">
//                     <button
//                       type="button"
//                       onClick={() => decrementValue("count")}
//                       className="px-3 py-2 bg-gray-200 rounded-l-md"
//                     >
//                       <FaMinus />
//                     </button>
//                     <input
//                       type="text"
//                       value={formData.count}
//                       onClick={() => {
//                         setNumberPadTarget("count");
//                         setShowNumberPad(true);
//                       }}
//                       readOnly
//                       className="w-full px-3 py-2 bg-gray-50 text-center"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => incrementValue("count")}
//                       className="px-3 py-2 bg-gray-200 rounded-r-md"
//                     >
//                       <FaPlus />
//                     </button>
//                   </div>
//                 </div>
//                 <div className="relative">
//                   <label className="block text-sm font-medium text-gray-700 mb-0.5">
//                     {t("bundle.bundle_qty")}
//                   </label>
//                   <div className="flex items-center border border-gray-300 rounded-md">
//                     <button
//                       type="button"
//                       onClick={() => decrementValue("bundleQty")}
//                       className="px-3 py-2 bg-gray-200 rounded-l-md"
//                     >
//                       <FaMinus />
//                     </button>
//                     <input
//                       type="text"
//                       value={formData.bundleQty}
//                       onClick={() => {
//                         setNumberPadTarget("bundleQty");
//                         setShowNumberPad(true);
//                       }}
//                       readOnly
//                       className="w-full px-3 py-2 bg-gray-50 text-center"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => incrementValue("bundleQty")}
//                       className="px-3 py-2 bg-gray-200 rounded-r-md"
//                     >
//                       <FaPlus />
//                     </button>
//                   </div>
//                   {formData.selectedMono && (
//                     <p className="mt-1 text-sm text-gray-700">
//                       {t("bundle.total_registered_bundle_qty")}:{" "}
//                       {totalBundleQty}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               {formData.department !== "Sub-con" && (
//                 <SubConSelection
//                   isSubCon={isSubCon}
//                   setIsSubCon={setIsSubCon}
//                   subConName={subConName}
//                   setSubConName={setSubConName}
//                 />
//               )}

//               {formData.department === "Sub-con" && (
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-0.5">
//                     {t("bundle.sub_con_factory")}
//                   </label>
//                   <select
//                     value={subConName}
//                     onChange={(e) => setSubConName(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                   >
//                     <option value="">
//                       {t("bundle.select_sub_con_factory")}
//                     </option>
//                     {subConNames.map((name) => (
//                       <option key={name} value={name}>
//                         {name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               )}

//               {formData.planCutQty !== undefined && estimatedTotal !== null && (
//                 <div
//                   className={`mb-4 text-sm ${
//                     estimatedTotal > formData.planCutQty
//                       ? "text-red-500"
//                       : "text-green-500"
//                   }`}
//                 >
//                   {estimatedTotal > formData.planCutQty
//                     ? `⚠️ Actual Cut Qty (${estimatedTotal}) exceeds Plan Cut Qty (${formData.planCutQty}). Please adjust values.`
//                     : `✅ Actual Cut Qty (${estimatedTotal}) is within Plan Cut Qty (${formData.planCutQty}).`}
//                 </div>
//               )}

//               <div className="flex justify-between">
//                 <div className="flex space-x-4">
//                   <button
//                     type="button"
//                     onClick={handleGenerateQR}
//                     disabled={
//                       isGenerateDisabled ||
//                       !formData.selectedMono ||
//                       !formData.color ||
//                       !formData.size ||
//                       !formData.bundleQty ||
//                       !formData.lineNo ||
//                       !formData.count ||
//                       (estimatedTotal !== null &&
//                         estimatedTotal > formData.planCutQty)
//                     }
//                     className={`px-4 py-2 rounded-md flex items-center ${
//                       formData.selectedMono &&
//                       formData.color &&
//                       formData.size &&
//                       formData.bundleQty &&
//                       formData.lineNo &&
//                       formData.count
//                         ? (estimatedTotal !== null &&
//                           estimatedTotal > formData.planCutQty
//                             ? "bg-red-500"
//                             : "bg-green-500") + " text-white"
//                         : "bg-gray-300 text-gray-500 cursor-not-allowed"
//                     }`}
//                   >
//                     <FaQrcode className="mr-2" /> {t("bundle.generate_qr")}
//                   </button>

//                   {qrData.length > 0 && (
//                     <>
//                       <button
//                         type="button"
//                         onClick={() => setShowQRPreview(true)}
//                         className="px-4 py-2 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 flex items-center"
//                       >
//                         <FaEye className="mr-2" /> {t("bundle.preview_qr")}
//                       </button>
//                       <button
//                         type="button"
//                         onClick={handlePrintQR}
//                         disabled={isPrinting}
//                         className={`px-4 py-2 rounded-md flex items-center ${
//                           isPrinting
//                             ? "bg-gray-400 cursor-not-allowed"
//                             : "bg-green-500 hover:bg-green-600"
//                         } text-white`}
//                       >
//                         <FaPrint className="mr-2" />
//                         {isPrinting
//                           ? t("bundle.printing")
//                           : t("bundle.print_qr")}
//                       </button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ) : activeTab === "data" ? (
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-lg font-bold text-gray-800">
//                   {t("bundle.data")}
//                 </h2>
//                 <div className="flex items-center space-x-2">
//                   <button
//                     onClick={() => setShowFilters(!showFilters)}
//                     className="flex items-center text-sm bg-blue-500 text-white px-3 py-1 rounded-md"
//                   >
//                     <FaFilter className="mr-1" size={10} />{" "}
//                     {showFilters ? "Hide Filters" : "Show Filters"}
//                   </button>
//                   {showFilters && (
//                     <button
//                       onClick={clearFilters}
//                       className="flex items-center text-sm bg-gray-200 px-3 py-1 rounded-md"
//                     >
//                       <FaTimes className="mr-1" size={10} /> Clear
//                     </button>
//                   )}
//                 </div>
//               </div>

//               {showFilters && (
//                 <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
//                   <input
//                     type="text"
//                     placeholder="Filter by Color"
//                     value={colorFilter}
//                     onChange={(e) => setColorFilter(e.target.value)}
//                     className="px-3 py-2 border border-gray-300 rounded-md text-sm"
//                   />
//                   <input
//                     type="text"
//                     placeholder="Filter by Size"
//                     value={sizeFilter}
//                     onChange={(e) => setSizeFilter(e.target.value)}
//                     className="px-3 py-2 border border-gray-300 rounded-md text-sm"
//                   />
//                   <input
//                     type="text"
//                     placeholder="Filter by Style Code"
//                     value={styleCodeFilter}
//                     onChange={(e) => setStyleCodeFilter(e.target.value)}
//                     className="px-3 py-2 border border-gray-300 rounded-md text-sm"
//                   />
//                   <input
//                     type="text"
//                     placeholder="Filter by Package No"
//                     value={packageNoFilter}
//                     onChange={(e) => setPackageNoFilter(e.target.value)}
//                     className="px-3 py-2 border border-gray-300 rounded-md text-sm"
//                   />
//                   <input
//                     type="text"
//                     placeholder="Filter by MONo"
//                     value={monoFilter}
//                     onChange={(e) => setMonoFilter(e.target.value)}
//                     className="px-3 py-2 border border-gray-300 rounded-md text-sm"
//                   />
//                 </div>
//               )}

//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
//                   <thead className="bg-sky-100">
//                     <tr>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.record_id")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.package_no")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.date")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.modify")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.time")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.department")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.emp_id")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.eng_name")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.kh_name")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.mono")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.customer_style")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.buyer")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.country")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.total_order_qty")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.factory")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.line_no")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.color")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.color_chi")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.size")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.order_cut_qty")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.plan_cut_qty")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.count")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.total_bundle_qty")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.sub_con")}
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                         {t("bundle.sub_con_factory")}
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {filteredBatches.map((batch, index) => (
//                       <tr key={index} className="hover:bg-gray-50">
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {index + 1}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.package_no}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.updated_date_seperator}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           <button
//                             onClick={() => handleEdit(batch._id)}
//                             className="ml-2 text-gray-900 text-sm font-medium border border-blue-700 bg-blue-200 rounded-md px-4 py-2 hover:bg-blue-300"
//                           >
//                             {t("bundle.edit")}
//                           </button>
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.updated_time_seperator}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.department}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.emp_id}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.eng_name}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.kh_name}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.selectedMono}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.custStyle}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.buyer}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.country}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.orderQty}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.factory}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.lineNo}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.color}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.chnColor}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.size}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.sizeOrderQty}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.planCutQty}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.count}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.bundleQty}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.sub_con}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">
//                           {batch.sub_con === "Yes"
//                             ? batch.sub_con_factory
//                             : "N/A"}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           ) : (
//             <ReprintTab />
//           )}

//           {showNumberPad && (
//             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
//               <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
//                 {numberPadTarget === "bundleQty" ||
//                 numberPadTarget === "count" ||
//                 formData.factoryInfo === "YM" ? (
//                   <NumberPad
//                     onClose={() => setShowNumberPad(false)}
//                     onInput={handleNumberPadInput}
//                   />
//                 ) : (
//                   <NumLetterPad
//                     onClose={() => setShowNumberPad(false)}
//                     onInput={handleNumberPadInput}
//                   />
//                 )}
//               </div>
//             </div>
//           )}

//           <QRCodePreview
//             isOpen={showQRPreview}
//             onClose={() => setShowQRPreview(false)}
//             qrData={qrData}
//             onPrint={handlePrintQR}
//             mode="production"
//           />

//           <EditModal
//             isOpen={editModalOpen}
//             onClose={() => setEditModalOpen(false)}
//             formData={formData}
//             setFormData={setFormData}
//             setUserBatches={setUserBatches}
//             setEditModalOpen={setEditModalOpen}
//           />
//         </div>
//       </div>
//       {/* Modals and overlays for Mobile Layout */}
//       <div className="md:hidden">
//         {showNumberPad && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
//               {numberPadTarget === "bundleQty" ||
//               numberPadTarget === "count" ||
//               formData.factoryInfo === "YM" ? (
//                 <NumberPad
//                   onClose={() => setShowNumberPad(false)}
//                   onInput={handleNumberPadInput}
//                 />
//               ) : (
//                 <NumLetterPad
//                   onClose={() => setShowNumberPad(false)}
//                   onInput={handleNumberPadInput}
//                 />
//               )}
//             </div>
//           </div>
//         )}

//         <QRCodePreview
//           isOpen={showQRPreview}
//           onClose={() => setShowQRPreview(false)}
//           qrData={memoizedQrData} // Use memoized version of qrData
//           //qrData={qrData}
//           onPrint={handlePrintQR}
//           mode="production"
//         />

//         <EditModal
//           isOpen={editModalOpen}
//           onClose={() => setEditModalOpen(false)}
//           formData={formData}
//           setFormData={setFormData}
//           setUserBatches={setUserBatches}
//           setEditModalOpen={setEditModalOpen}
//         />
//       </div>
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
import "react-datepicker/dist/react-datepicker.css"; // Keep if DatePicker is used in children or EditModal
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
  const { formData: persistedFormDataFromContext, updateFormData } =
    useFormData(); // Renamed for clarity

  const [userBatches, setUserBatches] = useState([]);
  const [qrData, setQrData] = useState([]);
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [numberPadTarget, setNumberPadTarget] = useState(null);
  const [isGenerateDisabled, setIsGenerateDisabled] = useState(false);
  const [activeTab, setActiveTab] = useState("registration");
  // const [dataRecords, setDataRecords] = useState([]); // dataRecords was used to push saved bundle data,
  // but it's not directly displayed.
  // If only for side-effects in handleGenerateQR, it might not need to be state.
  // For now, keeping it if there's a subtle use.
  const [isPrinting, setIsPrinting] = useState(false);
  const [totalBundleQty, setTotalBundleQty] = useState(0);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [hasColors, setHasColors] = useState(false);
  const [hasSizes, setHasSizes] = useState(false);

  const [formData, setFormData] = useState(() => {
    const savedContextData = persistedFormDataFromContext.bundleRegistration;
    const today = new Date(); // This will be a Date object

    const initialDate =
      savedContextData && savedContextData.date instanceof Date
        ? savedContextData.date
        : today;

    return {
      date: initialDate,
      department: savedContextData?.department || "",
      selectedMono: savedContextData?.selectedMono || "",
      buyer: savedContextData?.buyer || "",
      orderQty: savedContextData?.orderQty || "",
      factoryInfo: savedContextData?.factoryInfo || "",
      custStyle: savedContextData?.custStyle || "",
      country: savedContextData?.country || "",
      color: savedContextData?.color || "",
      size: savedContextData?.size || "",
      bundleQty: savedContextData?.bundleQty || 1,
      lineNo: savedContextData?.lineNo || "",
      count: savedContextData?.count || 10,
      colorCode: savedContextData?.colorCode || "",
      chnColor: savedContextData?.chnColor || "",
      colorKey: savedContextData?.colorKey || "",
      sizeOrderQty: savedContextData?.sizeOrderQty || "",
      planCutQty: savedContextData?.planCutQty || ""
      // isSubCon and subConName will be managed by separate local states based on department
    };
  });

  const [isSubConState, setIsSubConState] = useState(
    () => formData.department === "Sub-con"
  );
  const [subConNameState, setSubConNameState] = useState(() =>
    formData.department === "Sub-con"
      ? persistedFormDataFromContext.bundleRegistration?.subConName || ""
      : ""
  );

  const [estimatedTotal, setEstimatedTotal] = useState(null);
  const bluetoothComponentRef = useRef();
  const subConNames = ["Sunicon", "Win Sheng", "Yeewo", "Jinmyung"];
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecordId, setEditRecordId] = useState(null);

  const isMobileDevice = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      /Mobi|Android/i.test(navigator.userAgent),
    []
  );

  const memoizedQrData = useMemo(() => qrData, [qrData]);

  // Effect to persist data to context
  useEffect(() => {
    const dataToPersist = {
      date: formData.date, // This is a Date object
      department: formData.department,
      selectedMono: formData.selectedMono,
      color: formData.color,
      size: formData.size,
      bundleQty: formData.bundleQty,
      lineNo: formData.lineNo,
      count: formData.count,
      colorCode: formData.colorCode,
      chnColor: formData.chnColor,
      colorKey: formData.colorKey,
      sizeOrderQty: formData.sizeOrderQty,
      planCutQty: formData.planCutQty,
      isSubCon: formData.department === "Sub-con",
      subConName: formData.department === "Sub-con" ? subConNameState : ""
    };
    updateFormData("bundleRegistration", dataToPersist);
  }, [
    formData.date,
    formData.department,
    formData.selectedMono,
    formData.color,
    formData.size,
    formData.bundleQty,
    formData.lineNo,
    formData.count,
    formData.colorCode,
    formData.chnColor,
    formData.colorKey,
    formData.sizeOrderQty,
    formData.planCutQty,
    subConNameState,
    updateFormData
  ]);

  // Effect for Department change
  useEffect(() => {
    let newLineNo = formData.lineNo;
    let newIsSubCon = formData.department === "Sub-con";
    let newSubConName =
      formData.department === "Sub-con" ? subConNameState : "";

    if (formData.department === "Sub-con") {
      newLineNo = "SUB";
    } else if (formData.department === "Washing") {
      newLineNo = "WA";
    } else if (formData.department === "QC1 Endline") {
      if (formData.lineNo === "WA" || formData.lineNo === "SUB") {
        newLineNo = "";
      }
    } else {
      newLineNo = "";
    }

    setIsSubConState(newIsSubCon);
    setSubConNameState(newSubConName);

    if (newLineNo !== formData.lineNo) {
      setFormData((prev) => ({ ...prev, lineNo: newLineNo }));
    }
  }, [formData.department, subConNameState]); // Keep subConNameState as formData.subConName is not directly in local formData

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
        console.error("Error fetching order details:", error.message); 
        setColors([]);
        setHasColors(false);
        setSizes([]);
        setHasSizes(false);
        setFormData(prev => ({
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
          planCutQty: ""
        }));
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
        const response = await fetch(
          `${API_BASE_URL}/api/order-sizes/${formData.selectedMono}/${formData.color}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setSizes(data);
          setHasSizes(true);
          const currentSizeToFetch = formData.size || data[0].size;
          const totalCountResponse = await fetch(
            `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${currentSizeToFetch}`
          );
          const totalCountData = await totalCountResponse.json();
          setFormData((prev) => {
            const selectedSizeDetails =
              data.find((s) => s.size === (prev.size || data[0].size)) ||
              data[0];
            return {
              ...prev,
              size: prev.size || data[0].size,
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
  }, [formData.selectedMono, formData.color, formData.size]);

  // Polling for totalGarmentsCount - conditional update
  useEffect(() => {
    const interval = setInterval(async () => {
      if (formData.selectedMono && formData.color && formData.size) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${formData.size}`
          );
          const data = await response.json();
          if (data.totalCount !== formData.totalGarmentsCount) {
            setFormData((prev) => ({
              ...prev,
              totalGarmentsCount: data.totalCount
            }));
          }
        } catch (error) {
          console.error("Error polling total garments count:", error);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [
    formData.selectedMono,
    formData.color,
    formData.size,
    formData.totalGarmentsCount
  ]);

  // Polling for totalBundleQty - conditional update
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
    if (formData.department === "Washing") return formData.lineNo === "WA";
    if (formData.department === "Sub-con") return formData.lineNo !== "";
    if (!formData.department && formData.lineNo === "") return true;
    if (formData.lineNo === "") return false;
    return true;
  }, [formData.factoryInfo, formData.department, formData.lineNo]);

  const handleGenerateQR = useCallback(async () => {
    if (!user || userLoading) {
      alert("User data is not available. Please try again.");
      return;
    }
    if (!validateLineNo()) {
      alert(
        formData.factoryInfo === "YM" && formData.department === "QC1 Endline"
          ? "Invalid Line No. It must be a number between 1 and 30 for YM factory and QC1 Endline."
          : "Invalid or missing Line No for the selected department."
      );
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
      formData.planCutQty !== undefined &&
      formData.planCutQty > 0 &&
      estimatedTotal > formData.planCutQty
    ) {
      alert("Actual Cut Qty exceeds Plan Cut Qty. Cannot generate QR.");
      return;
    }
    const { date, selectedMono, color, size, lineNo } = formData;
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
      const bundleData = [];
      for (let i = 1; i <= bundleQtyNum; i++) {
        const bundleId = `${
          date.toISOString().split("T")[0]
        }:${lineNo}:${selectedMono}:${color}:${size}:${largestNumber + i}`;
        bundleData.push({
          bundle_id: bundleId,
          date: date.toLocaleDateString("en-CA"),
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
          count: countNum,
          bundleQty: bundleQtyNum,
          totalBundleQty: 1,
          sub_con:
            formData.department === "Sub-con"
              ? "Yes"
              : isSubConState
              ? "Yes"
              : "No",
          sub_con_factory:
            formData.department === "Sub-con"
              ? subConNameState
              : isSubConState
              ? subConNameState
              : "",
          emp_id: user.emp_id,
          eng_name: user.eng_name,
          kh_name: user.kh_name,
          job_title: user.job_title,
          dept_name: user.dept_name,
          sect_name: user.sect_name
        });
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
        // setDataRecords(prev => [...prev, ...savedData.data]); // If dataRecords is used
        const [totalBundleRes, totalGarmentsRes, userBatchesRes] =
          await Promise.all([
            fetch(
              `${API_BASE_URL}/api/total-bundle-qty/${formData.selectedMono}`
            ),
            fetch(
              `${API_BASE_URL}/api/total-garments-count/${formData.selectedMono}/${formData.color}/${formData.size}`
            ),
            user
              ? fetch(`${API_BASE_URL}/api/user-batches?emp_id=${user.emp_id}`)
              : Promise.resolve(null)
          ]);
        const totalBundleData = await totalBundleRes.json();
        setTotalBundleQty(totalBundleData.total);
        const totalGarmentsData = await totalGarmentsRes.json();
        setFormData((prev) => ({
          ...prev,
          totalGarmentsCount: totalGarmentsData.totalCount
        }));
        if (userBatchesRes) {
          const batchesData = await userBatchesRes.json();
          setUserBatches(batchesData);
        }
      } else {
        const errorData = await saveResponse.json();
        alert(
          `Failed to save bundle data: ${errorData.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error saving bundle data:", error);
      alert(`Failed to save bundle data: ${error.message}`);
    }
  }, [
    user,
    userLoading,
    formData,
    validateLineNo,
    estimatedTotal,
    isSubConState,
    subConNameState
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
              isSubCon={isSubConState}
              setIsSubCon={setIsSubConState}
              subConName={subConNameState}
              setSubConName={setSubConNameState}
              subConNames={subConNames}
              totalBundleQty={totalBundleQty}
              estimatedTotal={estimatedTotal}
              isMobileDevice={isMobileDevice}
              showNumberPad={showNumberPad}
              setShowNumberPad={setShowNumberPad}
              setNumberPadTarget={setNumberPadTarget}
              handleGenerateQR={handleGenerateQR}
              handlePrintQR={handlePrintQR}
              qrData={qrData}
              isGenerateDisabled={isGenerateDisabled}
              isPrinting={isPrinting}
              setShowQRPreview={setShowQRPreview}
              bluetoothComponentRef={bluetoothComponentRef}
              validateLineNo={validateLineNo}
            />
          )}
          {activeTab === "data" && (
            <BundleRegistrationRecordData handleEdit={handleEdit} />
          )}{" "}
          {/* Removed userBatches prop */}
          {activeTab === "reprint" && <ReprintTab />}
        </main>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <header className="bg-gradient-to-r from-slate-50 to-gray-100 shadow-lg py-5 px-8">
          {" "}
          <PageTitle />{" "}
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
              subConNames={subConNames}
              totalBundleQty={totalBundleQty}
              estimatedTotal={estimatedTotal}
              isMobileDevice={isMobileDevice}
              showNumberPad={showNumberPad}
              setShowNumberPad={setShowNumberPad}
              setNumberPadTarget={setNumberPadTarget}
              handleGenerateQR={handleGenerateQR}
              handlePrintQR={handlePrintQR}
              qrData={qrData}
              isGenerateDisabled={isGenerateDisabled}
              isPrinting={isPrinting}
              setShowQRPreview={setShowQRPreview}
              bluetoothComponentRef={bluetoothComponentRef}
              validateLineNo={validateLineNo}
            />
          )}
          {activeTab === "data" && (
            <BundleRegistrationRecordData handleEdit={handleEdit} />
          )}{" "}
          {/* Removed userBatches prop */}
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

                   
