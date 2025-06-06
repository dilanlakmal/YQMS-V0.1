// import axios from "axios";
// import {
//   Activity,
//   BookUser,
//   CalendarDays,
//   Check,
//   ListChecks,
//   Loader2,
//   Search,
//   Send
// } from "lucide-react";
// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState
// } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import { API_BASE_URL } from "../../../../config";
// import { useAuth } from "../../authentication/AuthContext";

// const baseInputClasses =
//   "text-sm block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";
// const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

// const TIME_SLOTS_CONFIG_ELASTIC = [
//   { key: "07:00", label: "07.00 AM", inspectionNo: 1 },
//   { key: "09:00", label: "09.00 AM", inspectionNo: 2 },
//   { key: "12:00", label: "12.00 PM", inspectionNo: 3 },
//   { key: "14:00", label: "02.00 PM", inspectionNo: 4 },
//   { key: "16:00", label: "04.00 PM", inspectionNo: 5 },
//   { key: "18:00", label: "06.00 PM", inspectionNo: 6 }
// ];

// const formatDateForAPI = (date) => {
//   if (!date) return null;
//   const d = new Date(date);
//   const year = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// };

// const formatTimestampForDisplay = (dateString) => {
//   if (!dateString) return "";
//   const date = new Date(dateString);
//   return date.toLocaleTimeString("en-US", {
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true
//   });
// };

// const ElasticReport = ({ onFormSubmit, isSubmitting: parentIsSubmitting }) => {
//   const { t } = useTranslation();
//   const { user } = useAuth();

//   const [inspectionDate, setInspectionDate] = useState(new Date());
//   const [regMachineNo, setRegMachineNo] = useState("");
//   const [regMoNoSearch, setRegMoNoSearch] = useState("");
//   const [regMoNo, setRegMoNo] = useState("");
//   const [regBuyer, setRegBuyer] = useState("");
//   const [regBuyerStyle, setRegBuyerStyle] = useState("");
//   const [regColor, setRegColor] = useState("");
//   const [regAvailableColors, setRegAvailableColors] = useState([]);
//   const [moDropdownOptions, setMoDropdownOptions] = useState([]);
//   const [showRegMoDropdown, setShowRegMoDropdown] = useState(false);
//   const [isRegLoading, setIsRegLoading] = useState(false);

//   const regMoSearchInputRef = useRef(null);
//   const regMoDropdownContainerRef = useRef(null);

//   const [registeredMachinesForElastic, setRegisteredMachinesForElastic] =
//     useState([]);
//   const [filterMachineNo, setFilterMachineNo] = useState("All");
//   const [selectedTimeSlotKey, setSelectedTimeSlotKey] = useState("");

//   // This state is the source of truth for the input values
//   const [slotInspectionValues, setSlotInspectionValues] = useState({});

//   // Ref for submission handlers to get latest values if setState is async
//   const slotInspectionValuesRef = useRef(slotInspectionValues);

//   const [isInspectionDataLoading, setIsInspectionDataLoading] = useState(false);
//   const [submittingMachineSlot, setSubmittingMachineSlot] = useState(null);

//   const machineOptions = useMemo(
//     () => Array.from({ length: 5 }, (_, i) => String(i + 1)),
//     []
//   );

//   useEffect(() => {
//     slotInspectionValuesRef.current = slotInspectionValues;
//   }, [slotInspectionValues]);

//   useEffect(() => {
//     const delayDebounceFn = setTimeout(() => {
//       if (regMoNoSearch.trim().length > 0 && regMoNoSearch !== regMoNo) {
//         setIsRegLoading(true);
//         axios
//           .get(`${API_BASE_URL}/api/search-mono`, {
//             params: { term: regMoNoSearch }
//           })
//           .then((response) => {
//             setMoDropdownOptions(
//               response.data.map((mo) => ({ moNo: mo })) || []
//             );
//             setShowRegMoDropdown(response.data.length > 0);
//           })
//           .catch((error) => {
//             console.error("Error searching MOs for Elastic Report:", error);
//             setMoDropdownOptions([]);
//           })
//           .finally(() => setIsRegLoading(false));
//       } else {
//         setMoDropdownOptions([]);
//         setShowRegMoDropdown(false);
//       }
//     }, 300);
//     return () => clearTimeout(delayDebounceFn);
//   }, [regMoNoSearch, regMoNo]);

//   const handleMoSelect = (selectedMoObj) => {
//     const selectedMo = selectedMoObj.moNo;
//     setRegMoNoSearch(selectedMo);
//     setRegMoNo(selectedMo);
//     setShowRegMoDropdown(false);
//     setRegColor("");
//     setRegAvailableColors([]);
//     setIsRegLoading(true);
//     axios
//       .get(`${API_BASE_URL}/api/order-details/${selectedMo}`)
//       .then((response) => {
//         setRegBuyer(response.data.engName || "N/A");
//         setRegBuyerStyle(response.data.custStyle || "N/A");
//         const colorsFromApi = response.data.colors.map((c) => c.original);
//         setRegAvailableColors(colorsFromApi || []);
//         if (colorsFromApi && colorsFromApi.length === 1) {
//           setRegColor(colorsFromApi[0]);
//         }
//       })
//       .catch((error) => {
//         console.error("Error fetching MO details for Elastic Report:", error);
//         setRegBuyer("");
//         setRegBuyerStyle("");
//         setRegAvailableColors([]);
//         Swal.fire(t("scc.error"), t("scc.errorFetchingOrderDetails"), "error");
//       })
//       .finally(() => setIsRegLoading(false));
//   };

//   const resetRegistrationForm = () => {
//     setRegMachineNo("");
//     setRegMoNoSearch("");
//     setRegMoNo("");
//     setRegBuyer("");
//     setRegBuyerStyle("");
//     setRegColor("");
//     setRegAvailableColors([]);
//   };

//   const handleRegisterMachineForElastic = async () => {
//     if (!regMachineNo || !regMoNo || !regColor) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccElasticReport.validation.fillMachineMoColor"),
//         "warning"
//       );
//       return;
//     }
//     const payload = {
//       inspectionDate: formatDateForAPI(inspectionDate),
//       machineNo: regMachineNo,
//       moNo: regMoNo,
//       buyer: regBuyer,
//       buyerStyle: regBuyerStyle,
//       color: regColor,
//       emp_id: user.emp_id,
//       emp_kh_name: user.kh_name,
//       emp_eng_name: user.eng_name
//     };
//     const success = await onFormSubmit("registerElasticMachine", payload);
//     if (success) {
//       resetRegistrationForm();
//       fetchRegisteredMachinesForElasticReport();
//     }
//   };

//   const fetchRegisteredMachinesForElasticReport = useCallback(() => {
//     if (!inspectionDate) return;
//     setIsInspectionDataLoading(true);

//     const updateSlotsOnFetch = (fetchedMachines, currentSlotKey) => {
//       setSlotInspectionValues((prevSlotValues) => {
//         const newSlotValues = { ...prevSlotValues };
//         let changed = false;
//         fetchedMachines.forEach((machine) => {
//           const docSlotKey = `${machine._id}_${currentSlotKey}`;
//           const existingInspection = machine.inspections?.find(
//             (insp) => insp.timeSlotKey === currentSlotKey
//           );

//           if (existingInspection) {
//             // If there's a saved inspection, ensure local state matches it
//             // This is crucial if data was submitted and then fetched again
//             if (
//               JSON.stringify(newSlotValues[docSlotKey] || {}) !==
//               JSON.stringify(existingInspection)
//             ) {
//               newSlotValues[docSlotKey] = {
//                 ...existingInspection,
//                 isUserModified: true
//               }; // Mark as modified if it has data
//               changed = true;
//             }
//           } else if (
//             !newSlotValues[docSlotKey] ||
//             !newSlotValues[docSlotKey].isUserModified
//           ) {
//             // If no saved inspection and local state is not user-modified, set to default
//             newSlotValues[docSlotKey] = {
//               checkedQty: 20,
//               qualityIssue: "Pass",
//               measurement: "Pass",
//               defects: "Pass",
//               result: "Pass",
//               remarks: "",
//               isUserModified: false
//             };
//             changed = true;
//           }
//         });
//         return changed ? newSlotValues : prevSlotValues;
//       });
//     };

//     axios
//       .get(`${API_BASE_URL}/api/scc/elastic-report/by-date`, {
//         params: { inspectionDate: formatDateForAPI(inspectionDate) }
//       })
//       .then((response) => {
//         const fetchedMachines = response.data || [];
//         setRegisteredMachinesForElastic(fetchedMachines);
//         if (selectedTimeSlotKey && fetchedMachines.length > 0) {
//           updateSlotsOnFetch(fetchedMachines, selectedTimeSlotKey);
//         }
//       })
//       .catch((error) => {
//         console.error(
//           "Error fetching registered machines for Elastic Report:",
//           error
//         );
//         setRegisteredMachinesForElastic([]);
//       })
//       .finally(() => setIsInspectionDataLoading(false));
//   }, [inspectionDate, selectedTimeSlotKey]);

//   useEffect(() => {
//     fetchRegisteredMachinesForElasticReport();
//   }, [fetchRegisteredMachinesForElasticReport]);

//   const handleSlotInputChange = (docId, timeSlotKey, field, value) => {
//     const key = `${docId}_${timeSlotKey}`;
//     setSlotInspectionValues((prev) => {
//       const currentSlotData = prev[key] || {
//         checkedQty: 20,
//         qualityIssue: "Pass",
//         measurement: "Pass",
//         defects: "Pass",
//         result: "Pass",
//         remarks: "",
//         isUserModified: false
//       };
//       const processedValue =
//         field === "checkedQty" ? (value === "" ? "" : Number(value)) : value;
//       const newSlotData = {
//         ...currentSlotData,
//         [field]: processedValue,
//         isUserModified: true
//       };

//       if (
//         ["qualityIssue", "measurement", "defects"].includes(field) ||
//         field === "checkedQty"
//       ) {
//         newSlotData.result =
//           newSlotData.qualityIssue === "Pass" &&
//           newSlotData.measurement === "Pass" &&
//           newSlotData.defects === "Pass" &&
//           Number(newSlotData.checkedQty) > 0
//             ? "Pass"
//             : "Reject";
//       }
//       return { ...prev, [key]: newSlotData };
//     });
//   };

//   const handleSubmitElasticSlotInspection = async (machineDoc) => {
//     if (!selectedTimeSlotKey) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccElasticReport.validation.selectTimeSlot"),
//         "warning"
//       );
//       return;
//     }
//     const currentSlotConfig = TIME_SLOTS_CONFIG_ELASTIC.find(
//       (ts) => ts.key === selectedTimeSlotKey
//     );
//     if (!currentSlotConfig) return;

//     const docSlotKey = `${machineDoc._id}_${selectedTimeSlotKey}`;
//     const currentSlotData = slotInspectionValuesRef.current[docSlotKey];

//     if (
//       !currentSlotData ||
//       currentSlotData.checkedQty === undefined ||
//       currentSlotData.checkedQty === null ||
//       Number(currentSlotData.checkedQty) <= 0
//     ) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccElasticReport.validation.fillCheckedQty"),
//         "warning"
//       );
//       return;
//     }

//     const payload = {
//       inspectionDate: formatDateForAPI(inspectionDate),
//       timeSlotKey: selectedTimeSlotKey,
//       inspectionNo: currentSlotConfig.inspectionNo,
//       elasticReportDocId: machineDoc._id,
//       checkedQty: Number(currentSlotData.checkedQty),
//       qualityIssue: currentSlotData.qualityIssue,
//       measurement: currentSlotData.measurement,
//       defects: currentSlotData.defects,
//       result: currentSlotData.result,
//       remarks: currentSlotData.remarks?.trim() || "",
//       emp_id: user.emp_id,
//       isUserModified: true
//     };

//     setSubmittingMachineSlot(docSlotKey);
//     const success = await onFormSubmit("submitElasticSlotInspection", payload);
//     setSubmittingMachineSlot(null);
//     if (success) {
//       fetchRegisteredMachinesForElasticReport();
//     }
//   };

//   const inspectionTableDisplayData = useMemo(() => {
//     let filtered = registeredMachinesForElastic;
//     if (filterMachineNo !== "All") {
//       filtered = registeredMachinesForElastic.filter(
//         (m) => m.machineNo === filterMachineNo
//       );
//     }
//     return filtered.sort((a, b) => {
//       const numA = parseInt(a.machineNo, 10);
//       const numB = parseInt(b.machineNo, 10);
//       return !isNaN(numA) && !isNaN(numB)
//         ? numA - numB
//         : a.machineNo.localeCompare(b.machineNo);
//     });
//   }, [registeredMachinesForElastic, filterMachineNo]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         regMoDropdownContainerRef.current &&
//         !regMoDropdownContainerRef.current.contains(event.target) &&
//         regMoSearchInputRef.current &&
//         !regMoSearchInputRef.current.contains(event.target)
//       ) {
//         setShowRegMoDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   if (!user)
//     return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;
//   const overallIsLoading =
//     parentIsSubmitting ||
//     isRegLoading ||
//     isInspectionDataLoading ||
//     !!submittingMachineSlot;

//   return (
//     <div className="space-y-6 p-3 md:p-5 bg-gray-50 min-h-screen">
//       {overallIsLoading && (
//         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000]">
//           <Loader2 className="animate-spin h-12 w-12 md:h-16 md:w-16 text-indigo-400" />
//         </div>
//       )}
//       <header className="text-center mb-6">
//         <h1 className="text-lg md:text-xl font-bold text-slate-800">
//           {t("sccElasticReport.mainTitle", "Daily Elastic Checking Report")}
//         </h1>
//       </header>

//       <div className="max-w-xs mx-auto my-4 md:my-5">
//         <label
//           htmlFor="elasticInspectionDate"
//           className={`${labelClasses} text-center`}
//         >
//           {t("scc.inspectionDate")}
//         </label>
//         <div className="relative">
//           <DatePicker
//             selected={inspectionDate}
//             onChange={(date) => {
//               setInspectionDate(date);
//               setSelectedTimeSlotKey("");
//               setSlotInspectionValues({});
//             }}
//             dateFormat="MM/dd/yyyy"
//             className={`${baseInputClasses} py-1.5 text-center`}
//             id="elasticInspectionDate"
//             popperPlacement="bottom"
//             wrapperClassName="w-full"
//           />
//           <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
//         </div>
//       </div>

//       <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
//         <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
//           <BookUser size={18} className="mr-2 text-indigo-600" />
//           {t("sccElasticReport.registerMachineTitle")}
//         </h2>
//         <div className="relative">
//           <table
//             className="w-full text-xs sm:text-sm"
//             style={{ tableLayout: "auto" }}
//           >
//             <thead className="bg-slate-100">
//               <tr className="text-left text-slate-600 font-semibold">
//                 <th className="p-2">{t("scc.machineNo")}</th>
//                 <th className="p-2">{t("scc.moNo")}</th>
//                 <th className="p-2">{t("scc.buyer")}</th>
//                 <th className="p-2">{t("scc.buyerStyle")}</th>
//                 <th className="p-2">{t("scc.color")}</th>
//                 <th className="p-2 text-center">{t("scc.action")}</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
//                 <td className="p-1.5 whitespace-nowrap">
//                   <select
//                     value={regMachineNo}
//                     onChange={(e) => setRegMachineNo(e.target.value)}
//                     className={`${baseInputClasses} py-1.5`}
//                   >
//                     <option value="">{t("scc.select")}</option>
//                     {machineOptions.map((m) => (
//                       <option key={m} value={m}>
//                         {m}
//                       </option>
//                     ))}
//                   </select>
//                 </td>
//                 <td
//                   className="p-1.5 whitespace-nowrap"
//                   ref={regMoDropdownContainerRef}
//                 >
//                   <div className="relative z-[70]">
//                     <input
//                       type="text"
//                       ref={regMoSearchInputRef}
//                       value={regMoNoSearch}
//                       onChange={(e) => setRegMoNoSearch(e.target.value)}
//                       onFocus={() =>
//                         regMoNoSearch.trim() && setShowRegMoDropdown(true)
//                       }
//                       placeholder={t("scc.searchMoNo")}
//                       className={`${baseInputClasses} pl-7 py-1.5`}
//                     />
//                     <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
//                     {showRegMoDropdown && moDropdownOptions.length > 0 && (
//                       <ul className="absolute z-[80] mt-1 w-max min-w-full bg-white shadow-xl max-h-52 md:max-h-60 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto top-full left-0">
//                         {moDropdownOptions.map((mo, idx) => (
//                           <li
//                             key={idx}
//                             onClick={() => handleMoSelect(mo)}
//                             className="text-slate-900 cursor-pointer select-none relative py-1.5 px-3 hover:bg-indigo-50 hover:text-indigo-700 transition-colors whitespace-normal"
//                           >
//                             {mo.moNo}
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>
//                 </td>
//                 <td className="p-1.5 whitespace-nowrap">
//                   <input
//                     type="text"
//                     value={regBuyer}
//                     readOnly
//                     className={`${baseInputClasses} bg-slate-100 py-1.5`}
//                   />
//                 </td>
//                 <td className="p-1.5 whitespace-nowrap">
//                   <input
//                     type="text"
//                     value={regBuyerStyle}
//                     readOnly
//                     className={`${baseInputClasses} bg-slate-100 py-1.5`}
//                   />
//                 </td>
//                 <td className="p-1.5 whitespace-nowrap">
//                   <select
//                     value={regColor}
//                     onChange={(e) => setRegColor(e.target.value)}
//                     className={`${baseInputClasses} py-1.5`}
//                     disabled={isRegLoading || regAvailableColors.length === 0}
//                   >
//                     <option value="">{t("scc.selectColor")}</option>
//                     {regAvailableColors.map((c) => (
//                       <option key={c} value={c}>
//                         {c}
//                       </option>
//                     ))}
//                   </select>
//                 </td>
//                 <td className="p-1.5 whitespace-nowrap text-center">
//                   <button
//                     type="button"
//                     onClick={handleRegisterMachineForElastic}
//                     disabled={
//                       !regMachineNo ||
//                       !regMoNo ||
//                       !regColor ||
//                       isRegLoading ||
//                       parentIsSubmitting
//                     }
//                     className="px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
//                   >
//                     {t("sccDailyHTQC.register")}
//                   </button>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </section>

//       <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
//         <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
//           <ListChecks size={18} className="mr-2 text-indigo-600" />
//           {t("sccElasticReport.inspectionDataTitle")}
//         </h2>
//         <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 bg-slate-50 rounded-md mb-4 border border-slate-200">
//           <div className="w-full sm:w-auto sm:flex-1">
//             <label htmlFor="filterElasticMachineNo" className={labelClasses}>
//               {t("scc.machineNo")}
//             </label>
//             <select
//               id="filterElasticMachineNo"
//               value={filterMachineNo}
//               onChange={(e) => setFilterMachineNo(e.target.value)}
//               className={`${baseInputClasses} py-1.5`}
//             >
//               <option value="All">{t("scc.allMachines")}</option>
//               {machineOptions
//                 .filter((m) =>
//                   registeredMachinesForElastic.some((rm) => rm.machineNo === m)
//                 )
//                 .map((m) => (
//                   <option key={m} value={m}>
//                     {m}
//                   </option>
//                 ))}
//             </select>
//           </div>
//           <div className="w-full sm:w-auto sm:flex-1">
//             <label
//               htmlFor="selectedElasticTimeSlotKey"
//               className={labelClasses}
//             >
//               {t("sccDailyHTQC.timeSlot")}
//             </label>
//             <select
//               id="selectedElasticTimeSlotKey"
//               value={selectedTimeSlotKey}
//               onChange={(e) => {
//                 const newSlotKey = e.target.value;
//                 setSelectedTimeSlotKey(newSlotKey);
//                 if (newSlotKey) {
//                   setSlotInspectionValues((prevSlotValues) => {
//                     // Use functional update
//                     const newValues = { ...prevSlotValues };
//                     let changed = false;
//                     // Use registeredMachinesForElastic directly as inspectionTableDisplayData might not be updated yet
//                     registeredMachinesForElastic.forEach((machine) => {
//                       const docSlotKey = `${machine._id}_${newSlotKey}`;
//                       const existingInspection = machine.inspections?.find(
//                         (insp) => insp.timeSlotKey === newSlotKey
//                       );
//                       if (existingInspection) {
//                         if (
//                           !newValues[docSlotKey] ||
//                           JSON.stringify(newValues[docSlotKey]) !==
//                             JSON.stringify(existingInspection)
//                         ) {
//                           newValues[docSlotKey] = {
//                             ...existingInspection,
//                             isUserModified: true
//                           };
//                           changed = true;
//                         }
//                       } else if (
//                         !newValues[docSlotKey] ||
//                         !newValues[docSlotKey].isUserModified
//                       ) {
//                         newValues[docSlotKey] = {
//                           checkedQty: 20,
//                           qualityIssue: "Pass",
//                           measurement: "Pass",
//                           defects: "Pass",
//                           result: "Pass",
//                           remarks: "",
//                           isUserModified: false
//                         };
//                         changed = true;
//                       }
//                     });
//                     return changed ? newValues : prevSlotValues;
//                   });
//                 }
//               }}
//               className={`${baseInputClasses} py-1.5`}
//             >
//               <option value="">{t("sccDailyHTQC.selectTimeSlot")}</option>
//               {TIME_SLOTS_CONFIG_ELASTIC.map((ts) => (
//                 <option key={ts.key} value={ts.key}>
//                   {ts.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         {selectedTimeSlotKey ? (
//           <div className="overflow-x-auto pretty-scrollbar">
//             <table className="min-w-full text-xs border-collapse border border-slate-300">
//               <thead className="bg-slate-200 text-slate-700">
//                 <tr>
//                   <th className="p-2 border border-slate-300">
//                     {t("scc.machineNo")}
//                   </th>
//                   <th className="p-2 border border-slate-300">
//                     {t("scc.moNo")}
//                   </th>
//                   <th className="p-2 border border-slate-300">
//                     {t("scc.color")}
//                   </th>
//                   <th className="p-2 border border-slate-300">
//                     {t("sccElasticReport.checkedQty")}
//                   </th>
//                   <th className="p-2 border border-slate-300">
//                     {t("sccElasticReport.qualityIssue")}
//                   </th>
//                   <th className="p-2 border border-slate-300">
//                     {t("sccElasticReport.measurement")}
//                   </th>
//                   <th className="p-2 border border-slate-300">
//                     {t("sccElasticReport.defects")}
//                   </th>
//                   <th className="p-2 border border-slate-300">
//                     {t("scc.result")}
//                   </th>
//                   <th className="p-2 border border-slate-300">
//                     {t("scc.remarks")}
//                   </th>
//                   <th className="p-2 border border-slate-300 text-center">
//                     {t("scc.action")}
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-200">
//                 {inspectionTableDisplayData.length === 0 && (
//                   <tr>
//                     <td
//                       colSpan="10"
//                       className="p-4 text-center text-slate-500 italic"
//                     >
//                       {t("sccElasticReport.noMachinesRegisteredOrFiltered")}
//                     </td>
//                   </tr>
//                 )}
//                 {inspectionTableDisplayData.map((machine) => {
//                   const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
//                   // *** FIX: Read directly from slotInspectionValues state for rendering ***
//                   const currentData = slotInspectionValues[docSlotKey] || {
//                     checkedQty: 20,
//                     qualityIssue: "Pass",
//                     measurement: "Pass",
//                     defects: "Pass",
//                     result: "Pass",
//                     remarks: "",
//                     isUserModified: false
//                   };
//                   const existingInspectionForSlot = machine.inspections?.find(
//                     (insp) => insp.timeSlotKey === selectedTimeSlotKey
//                   );
//                   const isCurrentlySubmittingThis =
//                     submittingMachineSlot === docSlotKey;
//                   const isSubmitted = !!existingInspectionForSlot;

//                   return (
//                     <tr
//                       key={docSlotKey}
//                       className={`transition-colors text-xs hover:bg-slate-50 ${
//                         isSubmitted ? "bg-green-50" : ""
//                       }`}
//                     >
//                       <td className="p-2 border border-slate-300 text-center align-middle font-medium text-slate-700">
//                         {machine.machineNo}
//                       </td>
//                       <td className="p-2 border border-slate-300 text-center align-middle text-slate-600">
//                         {machine.moNo}
//                       </td>
//                       <td className="p-2 border border-slate-300 text-center align-middle text-slate-600">
//                         {machine.color}
//                       </td>
//                       <td className="p-1 border border-slate-300 text-center">
//                         {isSubmitted ? (
//                           <span className="px-1.5 py-0.5 rounded text-xs font-semibold">
//                             {existingInspectionForSlot.checkedQty}
//                           </span>
//                         ) : (
//                           <input
//                             type="number"
//                             min="1"
//                             value={currentData.checkedQty} // Value from state
//                             onChange={(e) =>
//                               handleSlotInputChange(
//                                 machine._id,
//                                 selectedTimeSlotKey,
//                                 "checkedQty",
//                                 e.target.value
//                               )
//                             }
//                             className="w-16 text-center p-1 border border-slate-300 rounded text-xs focus:ring-indigo-500 focus:border-indigo-500"
//                           />
//                         )}
//                       </td>
//                       {["qualityIssue", "measurement", "defects"].map(
//                         (field) => (
//                           <td
//                             key={field}
//                             className="p-1 border border-slate-300 text-center"
//                           >
//                             {isSubmitted ? (
//                               <span
//                                 className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
//                                   existingInspectionForSlot[field] === "Pass"
//                                     ? "text-green-700 bg-green-100"
//                                     : "text-red-700 bg-red-100"
//                                 }`}
//                               >
//                                 {t(
//                                   `scc.${existingInspectionForSlot[
//                                     field
//                                   ]?.toLowerCase()}`,
//                                   existingInspectionForSlot[field]
//                                 )}
//                               </span>
//                             ) : (
//                               <select
//                                 value={currentData[field]} // Value from state
//                                 onChange={(e) =>
//                                   handleSlotInputChange(
//                                     machine._id,
//                                     selectedTimeSlotKey,
//                                     field,
//                                     e.target.value
//                                   )
//                                 }
//                                 className={`${baseInputClasses} py-1 text-xs`}
//                               >
//                                 <option value="Pass">{t("scc.pass")}</option>
//                                 <option value="Reject">
//                                   {t("scc.reject")}
//                                 </option>
//                               </select>
//                             )}
//                           </td>
//                         )
//                       )}
//                       <td className="p-1 border border-slate-300 text-center">
//                         <span
//                           className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
//                             (isSubmitted
//                               ? existingInspectionForSlot.result
//                               : currentData.result) === "Pass"
//                               ? "text-green-700 bg-green-100"
//                               : "text-red-700 bg-red-100"
//                           }`}
//                         >
//                           {t(
//                             `scc.${(isSubmitted
//                               ? existingInspectionForSlot.result
//                               : currentData.result
//                             )?.toLowerCase()}`,
//                             isSubmitted
//                               ? existingInspectionForSlot.result
//                               : currentData.result
//                           )}
//                         </span>
//                       </td>
//                       <td className="p-1 border border-slate-300 text-center">
//                         {isSubmitted ? (
//                           <span className="text-xs">
//                             {existingInspectionForSlot.remarks || "-"}
//                           </span>
//                         ) : (
//                           <input
//                             type="text"
//                             value={currentData.remarks} // Value from state
//                             onChange={(e) =>
//                               handleSlotInputChange(
//                                 machine._id,
//                                 selectedTimeSlotKey,
//                                 "remarks",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full p-1 border border-slate-300 rounded text-xs focus:ring-indigo-500 focus:border-indigo-500"
//                             placeholder={t("scc.remarksPlaceholderShort")}
//                           />
//                         )}
//                       </td>
//                       <td className="p-2 border border-slate-300 text-center align-middle">
//                         {isSubmitted ? (
//                           <div className="flex flex-col items-center justify-center text-green-700">
//                             <Check
//                               size={18}
//                               className="mb-0.5 text-green-500"
//                             />
//                             <span className="text-[11px] font-semibold">
//                               {t("sccDailyHTQC.submitted")}
//                             </span>
//                             <span className="text-[9px] text-slate-500">
//                               (
//                               {formatTimestampForDisplay(
//                                 existingInspectionForSlot.inspectionTimestamp
//                               )}
//                               )
//                             </span>
//                           </div>
//                         ) : (
//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleSubmitElasticSlotInspection(machine)
//                             }
//                             disabled={
//                               isCurrentlySubmittingThis || parentIsSubmitting
//                             }
//                             className="w-full px-2 py-1.5 bg-blue-600 text-white text-[11px] font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-slate-400 flex items-center justify-center"
//                           >
//                             {isCurrentlySubmittingThis ? (
//                               <Loader2
//                                 size={12}
//                                 className="animate-spin mr-1"
//                               />
//                             ) : (
//                               <Send size={12} className="mr-1" />
//                             )}
//                             {t("scc.submit")}
//                           </button>
//                         )}
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="text-center py-6 text-slate-500 italic">
//             {t("sccElasticReport.pleaseSelectTimeSlot")}
//           </div>
//         )}
//       </section>
//     </div>
//   );
// };

// export default ElasticReport;

import axios from "axios";
import {
  Activity,
  BookUser,
  CalendarDays,
  Check,
  ClipboardCheck,
  Loader2,
  MinusCircle,
  PlusCircle,
  Search,
  Send,
  UserCircle2,
  X
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";

// Helper: Get Face Photo URL
const getFacePhotoUrl = (facePhotoPath) => {
  if (!facePhotoPath) return null;
  if (
    facePhotoPath.startsWith("http://") ||
    facePhotoPath.startsWith("https://")
  )
    return facePhotoPath;
  if (facePhotoPath.startsWith("/storage/"))
    return `${API_BASE_URL}${facePhotoPath}`;
  if (facePhotoPath.startsWith("/")) {
    try {
      const apiOrigin = new URL(API_BASE_URL).origin;
      return `${apiOrigin}${facePhotoPath}`;
    } catch (e) {
      console.warn(
        "API_BASE_URL not valid for operator image paths",
        facePhotoPath
      );
      return facePhotoPath;
    }
  }
  console.warn("Unhandled operator face_photo path format:", facePhotoPath);
  return facePhotoPath;
};

const baseInputClasses =
  "text-sm block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";
const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

const TIME_SLOTS_CONFIG_ELASTIC = [
  { key: "07:00", label: "07.00 AM", inspectionNo: 1 },
  { key: "09:00", label: "09.00 AM", inspectionNo: 2 },
  { key: "12:00", label: "12.00 PM", inspectionNo: 3 },
  { key: "14:00", label: "02.00 PM", inspectionNo: 4 },
  { key: "16:00", label: "04.00 PM", inspectionNo: 5 },
  { key: "18:00", label: "06.00 PM", inspectionNo: 6 }
];

const ELASTIC_DEFECTS = ["Broken Stich", "Dirty"];

const formatDateForAPI = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTimestampForDisplay = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

const ElasticReport = ({ onFormSubmit, isSubmitting: parentIsSubmitting }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [inspectionDate, setInspectionDate] = useState(new Date());

  // Registration States
  const [regMachineNo, setRegMachineNo] = useState("");
  const [regOperatorData, setRegOperatorData] = useState(null);
  const [regOperatorLoading, setRegOperatorLoading] = useState(false);
  const [regMoNoSearch, setRegMoNoSearch] = useState("");
  const [regMoNo, setRegMoNo] = useState("");
  const [regBuyer, setRegBuyer] = useState("");
  const [regBuyerStyle, setRegBuyerStyle] = useState("");
  const [regColor, setRegColor] = useState("");
  const [regAvailableColors, setRegAvailableColors] = useState([]);
  const [moDropdownOptions, setMoDropdownOptions] = useState([]);
  const [showRegMoDropdown, setShowRegMoDropdown] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);

  const regMoSearchInputRef = useRef(null);
  const regMoDropdownContainerRef = useRef(null);

  // Inspection Data States
  const [registeredMachines, setRegisteredMachines] = useState([]);
  const [filterMoNo, setFilterMoNo] = useState("All");
  const [uniqueMoNos, setUniqueMoNos] = useState([]);
  const [filterMachineNo, setFilterMachineNo] = useState("All");
  const [selectedTimeSlotKey, setSelectedTimeSlotKey] = useState("");
  const [slotInspectionValues, setSlotInspectionValues] = useState({});
  const [isInspectionDataLoading, setIsInspectionDataLoading] = useState(false);
  const [submittingMachineSlot, setSubmittingMachineSlot] = useState(null);

  // Defect Modal States
  const [showDefectModal, setShowDefectModal] = useState(false);
  const [currentMachineForDefects, setCurrentMachineForDefects] =
    useState(null);
  const [tempDefects, setTempDefects] = useState([]);

  const machineOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => String(i + 1)),
    []
  );

  // Fetch operator data when machine number for registration changes
  useEffect(() => {
    const fetchRegOperator = async () => {
      if (!regMachineNo) {
        setRegOperatorData(null);
        return;
      }
      setRegOperatorLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/operator-by-machine/elastic/${regMachineNo}`
        );
        setRegOperatorData(response.data?.data || null);
      } catch (error) {
        setRegOperatorData(null);
        if (
          !(
            error.response?.status === 404 &&
            error.response?.data?.message === "OPERATOR_NOT_FOUND"
          )
        ) {
          console.error("Error fetching operator for registration:", error);
        }
      } finally {
        setRegOperatorLoading(false);
      }
    };
    if (regMachineNo) fetchRegOperator();
    else setRegOperatorData(null);
  }, [regMachineNo]);

  // Debounced MO search for registration
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (regMoNoSearch.trim().length > 0 && regMoNoSearch !== regMoNo) {
        setIsRegLoading(true);
        axios
          .get(`${API_BASE_URL}/api/search-mono`, {
            params: { term: regMoNoSearch }
          })
          .then((response) => {
            setMoDropdownOptions(
              response.data.map((mo) => ({ moNo: mo })) || []
            );
            setShowRegMoDropdown(response.data.length > 0);
          })
          .catch((error) => {
            console.error("Error searching MOs for Elastic Report:", error);
            setMoDropdownOptions([]);
          })
          .finally(() => setIsRegLoading(false));
      } else {
        setMoDropdownOptions([]);
        setShowRegMoDropdown(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [regMoNoSearch, regMoNo]);

  const handleMoSelect = (selectedMoObj) => {
    const selectedMo = selectedMoObj.moNo;
    setRegMoNoSearch(selectedMo);
    setRegMoNo(selectedMo);
    setShowRegMoDropdown(false);
    setRegColor("");
    setRegAvailableColors([]);
    setIsRegLoading(true);
    axios
      .get(`${API_BASE_URL}/api/order-details/${selectedMo}`)
      .then((response) => {
        setRegBuyer(response.data.engName || "N/A");
        setRegBuyerStyle(response.data.custStyle || "N/A");
        const colorsFromApi = response.data.colors.map((c) => c.original);
        setRegAvailableColors(colorsFromApi || []);
        if (colorsFromApi && colorsFromApi.length === 1) {
          setRegColor(colorsFromApi[0]);
        }
      })
      .catch((error) => {
        console.error("Error fetching MO details:", error);
        setRegBuyer("");
        setRegBuyerStyle("");
        setRegAvailableColors([]);
        Swal.fire(t("scc.error"), t("scc.errorFetchingOrderDetails"), "error");
      })
      .finally(() => setIsRegLoading(false));
  };

  const resetRegistrationForm = () => {
    setRegMachineNo("");
    setRegMoNoSearch("");
    setRegMoNo("");
    setRegBuyer("");
    setRegBuyerStyle("");
    setRegColor("");
    setRegAvailableColors([]);
    setRegOperatorData(null);
  };

  const handleRegisterMachineForElastic = async () => {
    if (!regMachineNo || !regMoNo || !regColor) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccElasticReport.validation.fillMachineMoColor"),
        "warning"
      );
      return;
    }
    const payload = {
      inspectionDate: formatDateForAPI(inspectionDate),
      machineNo: regMachineNo,
      moNo: regMoNo,
      buyer: regBuyer,
      buyerStyle: regBuyerStyle,
      color: regColor,
      operatorData: regOperatorData,
      emp_id: user.emp_id,
      emp_kh_name: user.kh_name,
      emp_eng_name: user.eng_name
    };
    const success = await onFormSubmit("registerElasticMachine", payload);
    if (success) {
      resetRegistrationForm();
      fetchRegisteredMachinesForElasticReport();
    }
  };

  const fetchRegisteredMachinesForElasticReport = useCallback(() => {
    if (!inspectionDate) return;
    setIsInspectionDataLoading(true);
    const apiDate = formatDateForAPI(inspectionDate);

    axios
      .get(`${API_BASE_URL}/api/scc/elastic-report/distinct-mos`, {
        params: { inspectionDate: apiDate }
      })
      .then((res) => setUniqueMoNos(res.data || []))
      .catch((err) => console.error("Error fetching distinct MOs:", err));

    axios
      .get(`${API_BASE_URL}/api/scc/elastic-report/by-date`, {
        params: { inspectionDate: apiDate }
      })
      .then((response) => {
        setRegisteredMachines(response.data || []);
      })
      .catch((error) => {
        console.error("Error fetching registered machines:", error);
        setRegisteredMachines([]);
      })
      .finally(() => setIsInspectionDataLoading(false));
  }, [inspectionDate]);

  useEffect(() => {
    fetchRegisteredMachinesForElasticReport();
  }, [fetchRegisteredMachinesForElasticReport]);

  const handleSlotInputChange = useCallback(
    (docId, timeSlotKey, field, value) => {
      const key = `${docId}_${timeSlotKey}`;
      setSlotInspectionValues((prev) => {
        const currentSlotData = prev[key] || {};
        const newSlotData = {
          ...currentSlotData,
          [field]: value,
          isUserModified: true
        };

        const totalDefectQty = (newSlotData.defectDetails || []).reduce(
          (sum, d) => sum + d.qty,
          0
        );
        newSlotData.totalDefectQty = totalDefectQty;
        newSlotData.qualityIssue = totalDefectQty > 0 ? "Reject" : "Pass";
        newSlotData.result =
          newSlotData.qualityIssue === "Pass" &&
          newSlotData.measurement === "Pass"
            ? "Pass"
            : "Reject";

        return { ...prev, [key]: newSlotData };
      });
    },
    []
  );

  useEffect(() => {
    if (selectedTimeSlotKey && registeredMachines.length > 0) {
      setSlotInspectionValues((prev) => {
        const newValues = { ...prev };
        let changed = false;
        registeredMachines.forEach((machine) => {
          const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
          if (!newValues[docSlotKey]?.isUserModified) {
            const existing = machine.inspections.find(
              (insp) => insp.timeSlotKey === selectedTimeSlotKey
            );
            newValues[docSlotKey] = existing || {
              checkedQty: 20,
              measurement: "Pass",
              qualityIssue: "Pass",
              defectDetails: [],
              totalDefectQty: 0,
              result: "Pass",
              remarks: "",
              isUserModified: false
            };
            changed = true;
          }
        });
        return changed ? newValues : prev;
      });
    }
  }, [selectedTimeSlotKey, registeredMachines]);

  const handleSubmitElasticSlotInspection = async (machineDoc) => {
    if (!selectedTimeSlotKey) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccElasticReport.validation.selectTimeSlot"),
        "warning"
      );
      return;
    }
    const currentSlotConfig = TIME_SLOTS_CONFIG_ELASTIC.find(
      (ts) => ts.key === selectedTimeSlotKey
    );
    const docSlotKey = `${machineDoc._id}_${selectedTimeSlotKey}`;
    const currentSlotData = slotInspectionValues[docSlotKey];

    if (
      !currentSlotData ||
      !currentSlotData.checkedQty ||
      currentSlotData.checkedQty <= 0
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccElasticReport.validation.fillCheckedQty"),
        "warning"
      );
      return;
    }

    const payload = {
      elasticReportDocId: machineDoc._id,
      timeSlotKey: selectedTimeSlotKey,
      inspectionNo: currentSlotConfig.inspectionNo,
      checkedQty: Number(currentSlotData.checkedQty),
      measurement: currentSlotData.measurement,
      defectDetails: currentSlotData.defectDetails || [],
      remarks: currentSlotData.remarks?.trim() || "",
      emp_id: user.emp_id
    };

    setSubmittingMachineSlot(docSlotKey);
    const success = await onFormSubmit("submitElasticSlotInspection", payload);
    setSubmittingMachineSlot(null);
    if (success) {
      fetchRegisteredMachinesForElasticReport();
    }
  };

  const openDefectModal = (machine) => {
    const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
    const currentSlotData = slotInspectionValues[docSlotKey] || {};
    const initialDefects = ELASTIC_DEFECTS.map((name) => {
      const existing = (currentSlotData.defectDetails || []).find(
        (d) => d.name === name
      );
      return { name, qty: existing ? existing.qty : 0 };
    });
    setTempDefects(initialDefects);
    setCurrentMachineForDefects(machine);
    setShowDefectModal(true);
  };

  const handleDefectChange = (defectName, newQty) => {
    setTempDefects((prev) =>
      prev.map((d) => (d.name === defectName ? { ...d, qty: newQty } : d))
    );
  };

  const handleSaveDefects = () => {
    if (!currentMachineForDefects) return;
    const docSlotKey = `${currentMachineForDefects._id}_${selectedTimeSlotKey}`;
    const defectsToSave = tempDefects.filter((d) => d.qty > 0);
    handleSlotInputChange(
      currentMachineForDefects._id,
      selectedTimeSlotKey,
      "defectDetails",
      defectsToSave
    );
    setShowDefectModal(false);
  };

  const inspectionTableDisplayData = useMemo(() => {
    let filtered = registeredMachines;
    if (filterMoNo !== "All") {
      filtered = filtered.filter((m) => m.moNo === filterMoNo);
    }
    if (filterMachineNo !== "All") {
      filtered = filtered.filter((m) => m.machineNo === filterMachineNo);
    }
    return filtered.sort((a, b) =>
      a.machineNo.localeCompare(b.machineNo, undefined, { numeric: true })
    );
  }, [registeredMachines, filterMoNo, filterMachineNo]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        regMoDropdownContainerRef.current &&
        !regMoDropdownContainerRef.current.contains(event.target) &&
        regMoSearchInputRef.current &&
        !regMoSearchInputRef.current.contains(event.target)
      ) {
        setShowRegMoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const overallIsLoading =
    parentIsSubmitting ||
    isRegLoading ||
    isInspectionDataLoading ||
    !!submittingMachineSlot ||
    regOperatorLoading;

  return (
    <div className="space-y-6 p-3 md:p-5 bg-gray-50 min-h-screen">
      {overallIsLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000]">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-400" />
        </div>
      )}

      <header className="text-center mb-4">
        <h1 className="text-lg md:text-xl font-bold text-slate-800">
          {t("sccElasticReport.mainTitle")}
        </h1>
      </header>

      {/* --- MODIFICATION HERE: New Header Layout with Operator Box --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-6">
        <div className="md:col-span-1 max-w-xs mx-auto w-full">
          <label
            htmlFor="elasticInspectionDate"
            className={`${labelClasses} text-center`}
          >
            {t("scc.inspectionDate")}
          </label>
          <div className="relative">
            <DatePicker
              selected={inspectionDate}
              onChange={(date) => {
                setInspectionDate(date);
                setSelectedTimeSlotKey("");
                setSlotInspectionValues({});
              }}
              dateFormat="MM/dd/yyyy"
              className={`${baseInputClasses} py-1.5 text-center`}
              id="elasticInspectionDate"
              popperPlacement="bottom"
              wrapperClassName="w-full"
            />
            <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="md:col-span-2 flex justify-center md:justify-start">
          {/* This empty div can be used for other controls later if needed */}
        </div>
      </div>

      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
          <BookUser size={18} className="mr-2 text-indigo-600" />
          {t("sccElasticReport.registerMachineTitle")}
        </h2>
        <div
          className={`pretty-scrollbar ${
            showRegMoDropdown ? "overflow-visible" : "overflow-x-auto"
          }`}
        >
          <table
            className="w-full text-xs sm:text-sm"
            style={{ tableLayout: "auto" }}
          >
            <thead className="bg-slate-100">
              <tr className="text-left text-slate-600 font-semibold">
                <th className="p-2">Machine No</th>
                <th className="p-2">Operator</th>
                <th className="p-2">MO No</th>
                <th className="p-2">Buyer</th>
                <th className="p-2">Buyer Style</th>
                <th className="p-2">Color</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors align-middle">
                <td
                  className="p-1.5 whitespace-nowrap"
                  style={{ width: "120px" }}
                >
                  <select
                    value={regMachineNo}
                    onChange={(e) => setRegMachineNo(e.target.value)}
                    className={`${baseInputClasses} py-1.5`}
                  >
                    <option value="">{t("scc.select")}</option>
                    {machineOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-1.5 whitespace-nowrap text-center align-middle">
                  {regOperatorLoading ? (
                    <Loader2
                      size={16}
                      className="animate-spin text-indigo-500 mx-auto"
                    />
                  ) : regOperatorData ? (
                    <div className="flex flex-col items-center">
                      {regOperatorData.emp_face_photo ? (
                        <img
                          src={getFacePhotoUrl(regOperatorData.emp_face_photo)}
                          alt="op"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle2 className="w-8 h-8 text-slate-300" />
                      )}
                      <span className="text-[10px] font-medium">
                        {regOperatorData.emp_id}
                      </span>
                    </div>
                  ) : (
                    <UserCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                  )}
                </td>
                <td
                  className="p-1.5 whitespace-nowrap"
                  ref={regMoDropdownContainerRef}
                >
                  <div className="relative z-[70]">
                    <input
                      type="text"
                      ref={regMoSearchInputRef}
                      value={regMoNoSearch}
                      onChange={(e) => setRegMoNoSearch(e.target.value)}
                      onFocus={() =>
                        regMoNoSearch.trim() && setShowRegMoDropdown(true)
                      }
                      placeholder={t("scc.searchMoNo")}
                      className={`${baseInputClasses} pl-7 py-1.5`}
                    />
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    {showRegMoDropdown && moDropdownOptions.length > 0 && (
                      <ul className="absolute z-[80] mt-1 w-max min-w-full bg-white shadow-xl max-h-52 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto top-full left-0">
                        {moDropdownOptions.map((mo, idx) => (
                          <li
                            key={idx}
                            onClick={() => handleMoSelect(mo)}
                            className="text-slate-900 cursor-pointer select-none relative py-1.5 px-3 hover:bg-indigo-50"
                          >
                            {mo.moNo}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </td>
                <td className="p-1.5 whitespace-nowrap">
                  <input
                    type="text"
                    value={regBuyer}
                    readOnly
                    className={`${baseInputClasses} bg-slate-100 py-1.5`}
                  />
                </td>
                <td className="p-1.5 whitespace-nowrap">
                  <input
                    type="text"
                    value={regBuyerStyle}
                    readOnly
                    className={`${baseInputClasses} bg-slate-100 py-1.5`}
                  />
                </td>
                <td className="p-1.5 whitespace-nowrap">
                  <select
                    value={regColor}
                    onChange={(e) => setRegColor(e.target.value)}
                    className={`${baseInputClasses} py-1.5`}
                    disabled={isRegLoading || regAvailableColors.length === 0}
                  >
                    <option value="">{t("scc.selectColor")}</option>
                    {regAvailableColors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-1.5 whitespace-nowrap text-center align-middle">
                  <button
                    type="button"
                    onClick={handleRegisterMachineForElastic}
                    disabled={
                      !regMachineNo ||
                      !regMoNo ||
                      !regColor ||
                      isRegLoading ||
                      parentIsSubmitting
                    }
                    className="px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:bg-slate-400"
                  >
                    {t("sccDailyHTQC.register")}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
          <ClipboardCheck size={18} className="mr-2 text-indigo-600" />
          {t("sccElasticReport.inspectionDataTitle")}
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 bg-slate-50 rounded-md mb-4 border border-slate-200">
          <div className="w-full sm:w-auto sm:flex-1">
            <label htmlFor="filterElasticMoNo" className={labelClasses}>
              {t("scc.moNo")}
            </label>
            <select
              id="filterElasticMoNo"
              value={filterMoNo}
              onChange={(e) => setFilterMoNo(e.target.value)}
              className={`${baseInputClasses} py-1.5`}
            >
              <option value="All">{t("sccDailyHTQC.allMoNo")}</option>
              {uniqueMoNos.map((mo) => (
                <option key={`filter-mo-${mo}`} value={mo}>
                  {mo}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto sm:flex-1">
            <label htmlFor="filterElasticMachineNo" className={labelClasses}>
              {t("scc.machineNo")}
            </label>
            <select
              id="filterElasticMachineNo"
              value={filterMachineNo}
              onChange={(e) => setFilterMachineNo(e.target.value)}
              className={`${baseInputClasses} py-1.5`}
            >
              <option value="All">{t("scc.allMachines")}</option>
              {machineOptions
                .filter((m) =>
                  registeredMachines.some((rm) => rm.machineNo === m)
                )
                .map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
            </select>
          </div>
          <div className="w-full sm:w-auto sm:flex-1">
            <label
              htmlFor="selectedElasticTimeSlotKey"
              className={labelClasses}
            >
              {t("sccDailyHTQC.timeSlot")}
            </label>
            <select
              id="selectedElasticTimeSlotKey"
              value={selectedTimeSlotKey}
              onChange={(e) => setSelectedTimeSlotKey(e.target.value)}
              className={`${baseInputClasses} py-1.5`}
            >
              <option value="">{t("sccDailyHTQC.selectTimeSlot")}</option>
              {TIME_SLOTS_CONFIG_ELASTIC.map((ts) => (
                <option key={ts.key} value={ts.key}>
                  {ts.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedTimeSlotKey ? (
          <div className="overflow-x-auto pretty-scrollbar">
            <table className="min-w-full text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-200 text-slate-700">
                <tr>
                  <th className="p-2 border border-slate-300">Machine No</th>
                  <th className="p-2 border border-slate-300">Operator</th>
                  <th className="p-2 border border-slate-300">MO No</th>
                  <th className="p-2 border border-slate-300">Color</th>
                  <th className="p-2 border border-slate-300">Checked Qty</th>
                  <th className="p-2 border border-slate-300">Measurement</th>
                  <th className="p-2 border border-slate-300">Quality</th>
                  <th className="p-2 border border-slate-300">
                    Defect Details
                  </th>
                  <th className="p-2 border border-slate-300">Defect Rate</th>
                  <th className="p-2 border border-slate-300">Result</th>
                  <th className="p-2 border border-slate-300">Remarks</th>
                  <th className="p-2 border border-slate-300 text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inspectionTableDisplayData.length === 0 && (
                  <tr>
                    <td
                      colSpan="12"
                      className="p-4 text-center text-slate-500 italic"
                    >
                      {t("sccElasticReport.noMachinesRegisteredOrFiltered")}
                    </td>
                  </tr>
                )}
                {inspectionTableDisplayData.map((machine) => {
                  const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
                  const currentData = slotInspectionValues[docSlotKey] || {};
                  const isSubmitted = machine.inspections.some(
                    (insp) => insp.timeSlotKey === selectedTimeSlotKey
                  );
                  const submittedData = isSubmitted
                    ? machine.inspections.find(
                        (insp) => insp.timeSlotKey === selectedTimeSlotKey
                      )
                    : null;
                  const dataToDisplay = isSubmitted
                    ? submittedData
                    : currentData;
                  const isCurrentlySubmittingThis =
                    submittingMachineSlot === docSlotKey;
                  const totalDefects = (
                    dataToDisplay.defectDetails || []
                  ).reduce((sum, d) => sum + d.qty, 0);
                  const defectRate =
                    dataToDisplay.checkedQty > 0
                      ? totalDefects / dataToDisplay.checkedQty
                      : 0;

                  return (
                    <tr
                      key={docSlotKey}
                      className={`transition-colors text-xs hover:bg-slate-50 ${
                        isSubmitted ? "bg-green-50" : ""
                      }`}
                    >
                      <td className="p-2 border border-slate-300 text-center align-middle font-medium">
                        {machine.machineNo}
                      </td>
                      <td className="p-1 border border-slate-300 align-middle">
                        {machine.operatorData ? (
                          <div className="flex flex-col items-center">
                            {machine.operatorData.emp_face_photo ? (
                              <img
                                src={getFacePhotoUrl(
                                  machine.operatorData.emp_face_photo
                                )}
                                alt="op"
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <UserCircle2 className="w-8 h-8 text-slate-300" />
                            )}
                            <span className="text-[10px] font-medium">
                              {machine.operatorData.emp_id}
                            </span>
                            <span className="text-[9px] text-slate-500">
                              {machine.operatorData.emp_eng_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>
                      <td className="p-2 border border-slate-300 text-center align-middle">
                        {machine.moNo}
                      </td>
                      <td className="p-2 border border-slate-300 text-center align-middle">
                        {machine.color}
                      </td>
                      <td className="p-1 border border-slate-300 text-center">
                        {isSubmitted ? (
                          <span className="font-semibold">
                            {dataToDisplay.checkedQty}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            value={dataToDisplay.checkedQty || ""}
                            onChange={(e) =>
                              handleSlotInputChange(
                                machine._id,
                                selectedTimeSlotKey,
                                "checkedQty",
                                e.target.value
                              )
                            }
                            className="w-16 text-center p-1 border rounded"
                          />
                        )}
                      </td>
                      <td className="p-1 border border-slate-300 text-center">
                        {isSubmitted ? (
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold ${
                              dataToDisplay.measurement === "Pass"
                                ? "text-green-700 bg-green-100"
                                : "text-red-700 bg-red-100"
                            }`}
                          >
                            {dataToDisplay.measurement}
                          </span>
                        ) : (
                          <select
                            value={dataToDisplay.measurement || "Pass"}
                            onChange={(e) =>
                              handleSlotInputChange(
                                machine._id,
                                selectedTimeSlotKey,
                                "measurement",
                                e.target.value
                              )
                            }
                            className={`${baseInputClasses} py-1 text-xs`}
                          >
                            <option value="Pass">Pass</option>
                            <option value="Reject">Reject</option>
                          </select>
                        )}
                      </td>
                      <td
                        className={`p-1 border border-slate-300 text-center ${
                          dataToDisplay.qualityIssue === "Pass"
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold ${
                            dataToDisplay.qualityIssue === "Pass"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {dataToDisplay.qualityIssue}
                        </span>
                      </td>
                      <td className="p-1 border border-slate-300 text-center align-middle">
                        <button
                          type="button"
                          onClick={() =>
                            !isSubmitted && openDefectModal(machine)
                          }
                          disabled={isSubmitted}
                          className="text-blue-600 hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed w-full"
                        >
                          {totalDefects > 0 ? (
                            <div className="text-left text-[10px]">
                              <div>
                                <strong>Qty: {totalDefects}</strong>
                              </div>
                              {(dataToDisplay.defectDetails || []).map((d) => (
                                <div key={d.name}>
                                  {d.name}: {d.qty}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span>Qty: 0</span>
                          )}
                        </button>
                      </td>
                      <td className="p-1 border border-slate-300 text-center align-middle font-semibold">{`${(
                        defectRate * 100
                      ).toFixed(2)}%`}</td>
                      <td className="p-1 border border-slate-300 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold ${
                            dataToDisplay.result === "Pass"
                              ? "text-green-700 bg-green-100"
                              : "text-red-700 bg-red-100"
                          }`}
                        >
                          {dataToDisplay.result}
                        </span>
                      </td>
                      <td className="p-1 border border-slate-300">
                        {isSubmitted ? (
                          <span className="text-xs">
                            {dataToDisplay.remarks || "-"}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={dataToDisplay.remarks || ""}
                            onChange={(e) =>
                              handleSlotInputChange(
                                machine._id,
                                selectedTimeSlotKey,
                                "remarks",
                                e.target.value
                              )
                            }
                            className="w-full p-1 border rounded"
                          />
                        )}
                      </td>
                      <td className="p-2 border border-slate-300 text-center align-middle">
                        {isSubmitted ? (
                          <div className="flex flex-col items-center text-green-700">
                            <Check size={18} className="text-green-500" />
                            <span className="text-[11px] font-semibold">
                              {t("sccDailyHTQC.submitted")}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleSubmitElasticSlotInspection(machine)
                            }
                            disabled={
                              isCurrentlySubmittingThis || parentIsSubmitting
                            }
                            className="w-full px-2 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400 flex items-center justify-center"
                          >
                            {isCurrentlySubmittingThis ? (
                              <Loader2
                                size={12}
                                className="animate-spin mr-1"
                              />
                            ) : (
                              <Send size={12} className="mr-1" />
                            )}{" "}
                            {t("scc.submit")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 italic">
            {t("sccElasticReport.pleaseSelectTimeSlot")}
          </div>
        )}
      </section>

      {showDefectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1050] p-4">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Defect Details
              </h3>
              <button
                onClick={() => setShowDefectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {tempDefects.map((defect) => (
                <div
                  key={defect.name}
                  className="flex items-center justify-between p-2 rounded hover:bg-slate-50"
                >
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={defect.qty > 0}
                      onChange={(e) =>
                        handleDefectChange(
                          defect.name,
                          e.target.checked ? 1 : 0
                        )
                      }
                      className="form-checkbox h-4 w-4 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">{defect.name}</span>
                  </label>
                  {defect.qty > 0 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleDefectChange(
                            defect.name,
                            Math.max(1, defect.qty - 1)
                          )
                        }
                        className="text-red-500"
                      >
                        <MinusCircle size={18} />
                      </button>
                      <input
                        type="number"
                        value={defect.qty}
                        readOnly
                        className="w-12 text-center border-gray-300 rounded"
                      />
                      <button
                        onClick={() =>
                          handleDefectChange(defect.name, defect.qty + 1)
                        }
                        className="text-green-500"
                      >
                        <PlusCircle size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t">
              <button
                onClick={handleSaveDefects}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Defects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElasticReport;
