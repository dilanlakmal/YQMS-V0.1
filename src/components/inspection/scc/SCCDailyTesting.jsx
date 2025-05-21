// import React, { useState, useEffect, useRef, useCallback } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";
// import { useAuth } from "../../authentication/AuthContext";
// import { useTranslation } from "react-i18next";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import Swal from "sweetalert2";
// import { Loader2, Info, PlusCircle, RefreshCcw } from "lucide-react";
// import SCCImageUpload from "./SCCImageUpload"; // Reuse this

// const initialCycleState = { cycleNo: 1, result: "Pass" }; // Default for a new cycle
// const MAX_CYCLES = 5;

// const SCCDailyTesting = ({
//   formData,
//   onFormDataChange,
//   onFormSubmit,
//   isSubmitting
// }) => {
//   const { t } = useTranslation();
//   const { user } = useAuth();

//   const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
//   const [moNoOptions, setMoNoOptions] = useState([]);
//   const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
//   const [availableColors, setAvailableColors] = useState([]);

//   const [machineNoSearch, setMachineNoSearch] = useState(
//     formData.machineNo || ""
//   );
//   const [machineNoOptionsInternal, setMachineNoOptionsInternal] = useState([]);
//   const [showMachineNoDropdown, setShowMachineNoDropdown] = useState(false);

//   const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
//   const [existingRecordLoading, setExistingRecordLoading] = useState(false);
//   const [specsLoading, setSpecsLoading] = useState(false);
//   const [recordStatusMessage, setRecordStatusMessage] = useState("");

//   const moNoDropdownRef = useRef(null);
//   const machineNoDropdownRef = useRef(null);

//   // Generate machine numbers: 1-15 and 001-005
//   useEffect(() => {
//     const machines = [];
//     for (let i = 1; i <= 15; i++) machines.push(String(i));
//     for (let i = 1; i <= 5; i++) machines.push(String(i).padStart(3, "0"));
//     setMachineNoOptionsInternal(machines);
//   }, []);

//   const filteredMachineOptions = machineNoOptionsInternal.filter((machine) =>
//     machine.toLowerCase().includes(machineNoSearch.toLowerCase())
//   );

//   const fetchMoNumbers = useCallback(async () => {
//     if (moNoSearch.trim() === "") {
//       setMoNoOptions([]);
//       setShowMoNoDropdown(false);
//       return;
//     }
//     try {
//       const response = await axios.get(`${API_BASE_URL}/api/search-mono`, {
//         params: { term: moNoSearch }
//       });
//       setMoNoOptions(response.data || []);
//       setShowMoNoDropdown(response.data.length > 0);
//     } catch (error) {
//       console.error(
//         t("sccdaily.errorFetchingMoLog", "Error fetching MO numbers:"),
//         error
//       );
//       setMoNoOptions([]);
//       setShowMoNoDropdown(false);
//     }
//   }, [moNoSearch, t]);

//   useEffect(() => {
//     const delayDebounceFn = setTimeout(() => {
//       fetchMoNumbers();
//     }, 300);
//     return () => clearTimeout(delayDebounceFn);
//   }, [moNoSearch, fetchMoNumbers]);

//   const handleMoSelect = (selectedMo) => {
//     setMoNoSearch(selectedMo);
//     onFormDataChange({
//       ...formData,
//       moNo: selectedMo,
//       buyer: "",
//       buyerStyle: "",
//       color: "",
//       _id: null,
//       standardSpecifications: { tempC: "", timeSec: "", pressure: "" }, // Reset specs
//       cycleWashingResults: [], // Reset cycles
//       numberOfRejections: 0,
//       finalResult: "Pending",
//       afterWashImageFile: null,
//       afterWashImageUrl: null,
//       remarks: ""
//     });
//     setShowMoNoDropdown(false);
//     setRecordStatusMessage("");
//   };

//   const handleMachineSelect = (selectedMachine) => {
//     setMachineNoSearch(selectedMachine);
//     onFormDataChange({ ...formData, machineNo: selectedMachine, _id: null }); // Reset _id on machine change
//     setShowMachineNoDropdown(false);
//     setRecordStatusMessage("");
//   };

//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       if (!formData.moNo) {
//         setAvailableColors([]);
//         onFormDataChange((prev) => ({ ...prev, buyer: "", buyerStyle: "" }));
//         return;
//       }
//       setOrderDetailsLoading(true);
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/order-details/${formData.moNo}`
//         );
//         const details = response.data;
//         onFormDataChange((prev) => ({
//           ...prev,
//           buyer: details.engName || "N/A",
//           buyerStyle: details.custStyle || "N/A"
//         }));
//         setAvailableColors(details.colors || []);
//       } catch (error) {
//         console.error(
//           t(
//             "sccdaily.errorFetchingOrderDetailsLog",
//             "Error fetching order details:"
//           ),
//           error
//         );
//         Swal.fire(
//           t("scc.error"),
//           t(
//             "sccdaily.errorFetchingOrderDetails",
//             "Failed to fetch order details."
//           ),
//           "error"
//         );
//         onFormDataChange((prev) => ({ ...prev, buyer: "", buyerStyle: "" }));
//         setAvailableColors([]);
//       } finally {
//         setOrderDetailsLoading(false);
//       }
//     };
//     if (formData.moNo) fetchOrderDetails();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [formData.moNo, t]);

//   // Fetch Standard Specifications from First Output
//   const fetchStandardSpecs = useCallback(async () => {
//     if (!formData.moNo || !formData.color || !formData.inspectionDate) return;
//     setSpecsLoading(true);
//     try {
//       const response = await axios.get(
//         `${API_BASE_URL}/api/scc/get-first-output-specs`,
//         {
//           params: {
//             moNo: formData.moNo,
//             color: formData.color,
//             inspectionDate: formData.inspectionDate.toISOString()
//           }
//         }
//       );
//       if (response.data.data) {
//         onFormDataChange((prev) => ({
//           ...prev,
//           standardSpecifications: {
//             tempC: response.data.data.tempC || "",
//             timeSec: response.data.data.timeSec || "",
//             pressure: response.data.data.pressure || ""
//           }
//         }));
//       } else {
//         // SPECS_NOT_FOUND or other issues
//         onFormDataChange((prev) => ({
//           ...prev,
//           standardSpecifications: { tempC: "", timeSec: "", pressure: "" } // Clear if not found
//         }));
//         // Optionally inform user specs weren't found, or let them fill manually
//         console.log(
//           t(
//             "sccdaily.specsNotFoundLog",
//             "Standard specs not found for this MO/Color/Date from First Output. User can input manually."
//           )
//         );
//       }
//     } catch (error) {
//       console.error(
//         t("sccdaily.errorFetchingSpecsLog", "Error fetching standard specs:"),
//         error
//       );
//       onFormDataChange((prev) => ({
//         ...prev,
//         standardSpecifications: { tempC: "", timeSec: "", pressure: "" } // Clear on error
//       }));
//     } finally {
//       setSpecsLoading(false);
//     }
//   }, [
//     formData.moNo,
//     formData.color,
//     formData.inspectionDate,
//     onFormDataChange,
//     t
//   ]);

//   // Fetch existing Daily Testing record OR standard specs if new
//   useEffect(() => {
//     const fetchDailyTestingRecordOrSpecs = async () => {
//       if (
//         !formData.moNo ||
//         !formData.color ||
//         !formData.machineNo ||
//         !formData.inspectionDate
//       )
//         return;

//       setExistingRecordLoading(true);
//       setRecordStatusMessage("");
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/scc/daily-testing`,
//           {
//             params: {
//               moNo: formData.moNo,
//               color: formData.color,
//               machineNo: formData.machineNo,
//               inspectionDate: formData.inspectionDate.toISOString()
//             }
//           }
//         );
//         const recordData = response.data; // Full response

//         if (
//           recordData.message === "DAILY_TESTING_RECORD_NOT_FOUND" ||
//           !recordData.data
//         ) {
//           setRecordStatusMessage(
//             t(
//               "sccdaily.newRecordMessage",
//               "This is a new daily testing record. Please proceed."
//             )
//           );
//           onFormDataChange((prev) => ({
//             ...prev,
//             _id: null,
//             // Standard specs will be fetched by fetchStandardSpecs or can be manually entered
//             cycleWashingResults: [],
//             numberOfRejections: 0,
//             finalResult: "Pending",
//             afterWashImageUrl: null,
//             remarks: prev.remarks || ""
//           }));
//           fetchStandardSpecs(); // Fetch specs for the new record
//         } else {
//           // Existing record found
//           setRecordStatusMessage(
//             t(
//               "sccdaily.existingRecordLoadedShort",
//               "Existing daily testing record loaded."
//             )
//           );
//           onFormDataChange((prev) => ({
//             ...prev,
//             _id: recordData._id || recordData.data?._id,
//             standardSpecifications: recordData.standardSpecifications ||
//               recordData.data?.standardSpecifications || {
//                 tempC: "",
//                 timeSec: "",
//                 pressure: ""
//               },
//             cycleWashingResults:
//               recordData.cycleWashingResults ||
//               recordData.data?.cycleWashingResults ||
//               [],
//             numberOfRejections:
//               recordData.numberOfRejections ||
//               recordData.data?.numberOfRejections ||
//               0,
//             finalResult:
//               recordData.finalResult ||
//               recordData.data?.finalResult ||
//               "Pending",
//             afterWashImageUrl:
//               recordData.afterWashImage || recordData.data?.afterWashImage,
//             remarks:
//               recordData.remarks === "NA"
//                 ? ""
//                 : recordData.remarks || recordData.data?.remarks || ""
//           }));
//         }
//       } catch (error) {
//         console.error(
//           t(
//             "sccdaily.errorFetchingDailyRecordLog",
//             "Error fetching daily testing record:"
//           ),
//           error
//         );
//         Swal.fire(
//           t("scc.error"),
//           t(
//             "sccdaily.errorFetchingDailyRecord",
//             "Failed to fetch daily testing record."
//           ),
//           "error"
//         );
//         onFormDataChange((prev) => ({
//           // Reset to new state on error
//           ...prev,
//           _id: null,
//           cycleWashingResults: [],
//           numberOfRejections: 0,
//           finalResult: "Pending",
//           standardSpecifications: { tempC: "", timeSec: "", pressure: "" }
//         }));
//       } finally {
//         setExistingRecordLoading(false);
//       }
//     };

//     if (
//       formData.moNo &&
//       formData.color &&
//       formData.machineNo &&
//       formData.inspectionDate
//     ) {
//       fetchDailyTestingRecordOrSpecs();
//     } else if (
//       formData.moNo &&
//       formData.color &&
//       formData.inspectionDate &&
//       !formData.machineNo
//     ) {
//       // If machineNo is not yet selected, but other fields are, try to fetch specs
//       fetchStandardSpecs();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [
//     formData.moNo,
//     formData.color,
//     formData.machineNo,
//     formData.inspectionDate,
//     fetchStandardSpecs,
//     t
//   ]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     onFormDataChange({ ...formData, [name]: value });
//   };

//   const handleDateChange = (date) => {
//     onFormDataChange({ ...formData, inspectionDate: date });
//   };

//   const handleColorChange = (e) => {
//     onFormDataChange({ ...formData, color: e.target.value, _id: null });
//     setRecordStatusMessage("");
//   };

//   const handleSpecChange = (field, value) => {
//     onFormDataChange((prev) => ({
//       ...prev,
//       standardSpecifications: { ...prev.standardSpecifications, [field]: value }
//     }));
//   };

//   const handleCycleResultChange = (index, result) => {
//     const newCycles = [...(formData.cycleWashingResults || [])];
//     newCycles[index].result = result;
//     updateCyclesAndFinalResult(newCycles);
//   };

//   const addCycle = () => {
//     const currentCycles = formData.cycleWashingResults || [];
//     if (currentCycles.length >= MAX_CYCLES) return;

//     // If previous cycle was Reject, this new cycle effectively resets progress from user's perspective
//     // but data-wise, we just add a new cycle. The rejection count handles the logic.
//     const nextCycleNo = currentCycles.length + 1;
//     const newCycles = [
//       ...currentCycles,
//       { cycleNo: nextCycleNo, result: "Pass" }
//     ];
//     updateCyclesAndFinalResult(newCycles);
//   };

//   const resetCycles = () => {
//     updateCyclesAndFinalResult([]);
//   };

//   const updateCyclesAndFinalResult = (updatedCycles) => {
//     const rejections = updatedCycles.filter(
//       (c) => c.result === "Reject"
//     ).length;
//     let finalRes = "Pending";
//     if (rejections > 0) {
//       finalRes = "Reject"; // Any rejection makes final result Reject, unless overridden
//     } else if (updatedCycles.length === MAX_CYCLES && rejections === 0) {
//       finalRes = "Pass";
//     }

//     onFormDataChange((prev) => ({
//       ...prev,
//       cycleWashingResults: updatedCycles,
//       numberOfRejections: rejections,
//       finalResult:
//         formData.finalResult !== "Pending" && formData.finalResult !== finalRes
//           ? formData.finalResult
//           : finalRes // Keep manual override if not pending
//     }));
//   };

//   const handleFinalResultChange = (e) => {
//     onFormDataChange({ ...formData, finalResult: e.target.value });
//   };

//   const handleImageChange = (imageType, file, previewUrl) => {
//     // imageType here will be 'afterWashDaily'
//     onFormDataChange({
//       ...formData,
//       afterWashImageFile: file,
//       afterWashImageUrl: previewUrl
//     });
//   };

//   const handleImageRemove = () => {
//     onFormDataChange({
//       ...formData,
//       afterWashImageFile: null,
//       afterWashImageUrl: null
//     });
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         moNoDropdownRef.current &&
//         !moNoDropdownRef.current.contains(event.target)
//       ) {
//         setShowMoNoDropdown(false);
//       }
//       if (
//         machineNoDropdownRef.current &&
//         !machineNoDropdownRef.current.contains(event.target)
//       ) {
//         setShowMachineNoDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   if (!user) return <div>{t("scc.loadingUser", "Loading user data...")}</div>;

//   const currentCycles = formData.cycleWashingResults || [];

//   return (
//     <form
//       onSubmit={(e) => {
//         e.preventDefault();
//         onFormSubmit("DailyTesting");
//       }}
//       className="space-y-6"
//     >
//       <h2 className="text-xl font-semibold text-gray-700">
//         {t(
//           "sccdaily.formTitle",
//           "Fusing and Heat Transfer Daily Testing Report"
//         )}
//       </h2>
//       {(orderDetailsLoading || existingRecordLoading || specsLoading) && (
//         <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
//           <Loader2 className="animate-spin h-12 w-12 text-white" />
//         </div>
//       )}
//       {recordStatusMessage && (
//         <div
//           className={`p-3 mb-4 rounded-md text-sm flex items-center ${
//             recordStatusMessage.includes(
//               t("sccdaily.newRecordMessageKey", "new daily testing record")
//             )
//               ? "bg-blue-100 text-blue-700"
//               : "bg-green-100 text-green-700"
//           }`}
//         >
//           <Info size={18} className="mr-2" /> {recordStatusMessage}
//         </div>
//       )}

//       {/* Row 1: Date, MO No */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div>
//           <label
//             htmlFor="dailyTestInspectionDate"
//             className="block text-sm font-medium text-gray-700"
//           >
//             {t("scc.date")}
//           </label>
//           <DatePicker
//             selected={
//               formData.inspectionDate
//                 ? new Date(formData.inspectionDate)
//                 : new Date()
//             }
//             onChange={handleDateChange}
//             dateFormat="MM/dd/yyyy"
//             className="mt-1 block w-full input-field" // Use a common class for styling if needed
//             required
//           />
//         </div>
//         <div className="relative" ref={moNoDropdownRef}>
//           <label
//             htmlFor="dailyTestMoNoSearch"
//             className="block text-sm font-medium text-gray-700"
//           >
//             {t("scc.moNo")}
//           </label>
//           <input
//             type="text"
//             id="dailyTestMoNoSearch"
//             value={moNoSearch}
//             onChange={(e) => setMoNoSearch(e.target.value)}
//             placeholder={t("scc.searchMoNo")}
//             className="mt-1 block w-full input-field"
//             required
//           />
//           {showMoNoDropdown && moNoOptions.length > 0 && (
//             <ul className="dropdown-list">
//               {moNoOptions.map((mo) => (
//                 <li
//                   key={mo}
//                   onClick={() => handleMoSelect(mo)}
//                   className="dropdown-item"
//                 >
//                   {mo}
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </div>

//       {/* Row 2: Buyer, Buyer Style, Color */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             {t("scc.buyer")}
//           </label>
//           <input
//             type="text"
//             value={formData.buyer || ""}
//             readOnly
//             className="mt-1 block w-full input-field-readonly"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             {t("scc.buyerStyle")}
//           </label>
//           <input
//             type="text"
//             value={formData.buyerStyle || ""}
//             readOnly
//             className="mt-1 block w-full input-field-readonly"
//           />
//         </div>
//         <div>
//           <label
//             htmlFor="dailyTestColor"
//             className="block text-sm font-medium text-gray-700"
//           >
//             {t("scc.color")}
//           </label>
//           <select
//             id="dailyTestColor"
//             value={formData.color || ""}
//             onChange={handleColorChange}
//             className="mt-1 block w-full input-field"
//             disabled={!formData.moNo || availableColors.length === 0}
//             required
//           >
//             <option value="">{t("scc.selectColor")}</option>
//             {availableColors.map((c) => (
//               <option key={c.key || c.original} value={c.original}>
//                 {c.original} {c.chn ? `(${c.chn})` : ""}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Row 3: Machine No */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {" "}
//         {/* Adjust grid as needed */}
//         <div className="relative" ref={machineNoDropdownRef}>
//           <label
//             htmlFor="machineNo"
//             className="block text-sm font-medium text-gray-700"
//           >
//             {t("sccdaily.machineNo", "Machine No")}
//           </label>
//           <input
//             type="text"
//             id="machineNo"
//             value={machineNoSearch}
//             onChange={(e) => {
//               setMachineNoSearch(e.target.value);
//               setShowMachineNoDropdown(true);
//             }}
//             onFocus={() => setShowMachineNoDropdown(true)}
//             placeholder={t(
//               "sccdaily.selectOrTypeMachine",
//               "Select or Type Machine No..."
//             )}
//             className="mt-1 block w-full input-field"
//             required
//           />
//           {showMachineNoDropdown && filteredMachineOptions.length > 0 && (
//             <ul className="dropdown-list">
//               {filteredMachineOptions.map((machine) => (
//                 <li
//                   key={machine}
//                   onClick={() => handleMachineSelect(machine)}
//                   className="dropdown-item"
//                 >
//                   {machine}
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//         <div>{/* Placeholder for layout if needed */}</div>
//         <div>{/* Placeholder for layout if needed */}</div>
//       </div>

//       {/* Standard Specifications Table */}
//       <div className="mt-6">
//         <h3 className="text-lg font-medium leading-6 text-gray-900">
//           {t("scc.standardSpecifications")}
//         </h3>
//         <div className="mt-2 overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200 border">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="table-header">
//                   {t("sccdaily.temperature", "Temperature (°C)")}
//                 </th>
//                 <th className="table-header">
//                   {t("sccdaily.time", "Time (sec)")}
//                 </th>
//                 <th className="table-header">
//                   {t("sccdaily.pressure", "Pressure")}
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               <tr>
//                 <td className="table-cell">
//                   <input
//                     type="number"
//                     value={formData.standardSpecifications?.tempC || ""}
//                     onChange={(e) => handleSpecChange("tempC", e.target.value)}
//                     className="w-full p-1 input-field-table"
//                   />
//                 </td>
//                 <td className="table-cell">
//                   <input
//                     type="number"
//                     value={formData.standardSpecifications?.timeSec || ""}
//                     onChange={(e) =>
//                       handleSpecChange("timeSec", e.target.value)
//                     }
//                     className="w-full p-1 input-field-table"
//                   />
//                 </td>
//                 <td className="table-cell">
//                   <input
//                     type="text"
//                     value={formData.standardSpecifications?.pressure || ""}
//                     onChange={(e) =>
//                       handleSpecChange("pressure", e.target.value)
//                     }
//                     className="w-full p-1 input-field-table"
//                   />
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* 5 Cycle Washing Results */}
//       <div className="mt-6">
//         <div className="flex justify-between items-center mb-2">
//           <h3 className="text-lg font-medium leading-6 text-gray-900">
//             {t("sccdaily.cycleWashingResults", "5 Cycle Washing Results")}
//           </h3>
//           <div>
//             {currentCycles.length < MAX_CYCLES && (
//               <button
//                 type="button"
//                 onClick={addCycle}
//                 className="mr-2 button-outline-sm"
//               >
//                 <PlusCircle size={16} className="mr-1 inline" />{" "}
//                 {t("sccdaily.addCycle", "Add Cycle")}
//               </button>
//             )}
//             {currentCycles.length > 0 && (
//               <button
//                 type="button"
//                 onClick={resetCycles}
//                 className="button-danger-sm"
//               >
//                 <RefreshCcw size={16} className="mr-1 inline" />{" "}
//                 {t("sccdaily.resetCycles", "Reset Cycles")}
//               </button>
//             )}
//           </div>
//         </div>
//         {currentCycles.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200 border">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="table-header">
//                     {t("sccdaily.cycleNo", "Cycle No")}
//                   </th>
//                   <th className="table-header">{t("scc.status", "Result")}</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {currentCycles.map((cycle, index) => (
//                   <tr key={index}>
//                     <td className="table-cell text-center">{cycle.cycleNo}</td>
//                     <td
//                       className={`table-cell ${
//                         cycle.result === "Pass" ? "bg-green-100" : "bg-red-100"
//                       }`}
//                     >
//                       <select
//                         value={cycle.result}
//                         onChange={(e) =>
//                           handleCycleResultChange(index, e.target.value)
//                         }
//                         className={`w-full p-1 border-gray-300 rounded-md text-sm ${
//                           cycle.result === "Pass" ? "bg-green-50" : "bg-red-50"
//                         }`}
//                       >
//                         <option value="Pass">{t("scc.pass")}</option>
//                         <option value="Reject">{t("scc.reject")}</option>
//                       </select>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <p className="text-sm text-gray-500">
//             {t(
//               "sccdaily.noCyclesAdded",
//               "No cycles added yet. Click 'Add Cycle' to start."
//             )}
//           </p>
//         )}
//         <p className="mt-2 text-sm text-gray-600">
//           {t("sccdaily.numberOfRejections", "Number of Rejections")}:{" "}
//           {formData.numberOfRejections || 0}
//         </p>
//       </div>

//       {/* Final Results and Remarks */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-start">
//         <div>
//           <label
//             htmlFor="finalResult"
//             className="block text-sm font-medium text-gray-700"
//           >
//             {t("sccdaily.finalResult", "Final Result")}
//           </label>
//           <select
//             id="finalResult"
//             value={formData.finalResult || "Pending"}
//             onChange={handleFinalResultChange}
//             className="mt-1 block w-full input-field"
//           >
//             <option value="Pending">{t("sccdaily.pending", "Pending")}</option>
//             <option value="Pass">{t("scc.pass")}</option>
//             <option value="Reject">{t("scc.reject")}</option>
//           </select>
//         </div>
//         <div>
//           <label
//             htmlFor="dailyTestRemarks"
//             className="block text-sm font-medium text-gray-700"
//           >
//             {t("sccdaily.remarks", "Remarks")}
//           </label>
//           <textarea
//             id="dailyTestRemarks"
//             name="remarks"
//             rows="2"
//             maxLength="150"
//             value={formData.remarks || ""}
//             onChange={handleInputChange}
//             className="mt-1 block w-full input-field"
//             placeholder={t(
//               "sccdaily.remarksPlaceholder",
//               "Enter remarks (max 150 chars)..."
//             )}
//           ></textarea>
//           <p className="mt-1 text-xs text-gray-500 text-right">
//             {(formData.remarks || "").length} / 150 {t("scc.characters")}
//           </p>
//         </div>
//       </div>

//       {/* After Wash Image */}
//       <div className="mt-6">
//         <SCCImageUpload
//           label={t("sccdaily.afterWashImage", "After Wash Image")}
//           onImageChange={(file, url) =>
//             handleImageChange("afterWashDaily", file, url)
//           } // type is just for internal logic if needed
//           onImageRemove={handleImageRemove}
//           initialImageUrl={formData.afterWashImageUrl}
//         />
//       </div>

//       {/* Submit Button */}
//       <div className="pt-5 flex justify-end">
//         <button
//           type="submit"
//           disabled={isSubmitting}
//           className="button-primary"
//         >
//           {isSubmitting && (
//             <Loader2 className="animate-spin h-5 w-5 mr-2 inline" />
//           )}
//           {formData._id ? t("scc.update") : t("scc.submit")}
//         </button>
//       </div>
//     </form>
//   );
// };

// export default SCCDailyTesting;

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Ensure this is imported
import Swal from "sweetalert2";
import {
  Loader2,
  Info,
  PlusCircle,
  RefreshCcw,
  Search,
  ChevronDown,
  X
} from "lucide-react"; // Added icons
import SCCImageUpload from "./SCCImageUpload";

const initialCycleState = { cycleNo: 1, result: "Pass" };
const MAX_CYCLES = 5;

// Define common input field styling
const inputBaseClasses =
  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm";
const inputFocusClasses = "focus:ring-indigo-500 focus:border-indigo-500";
const inputFieldClasses = `${inputBaseClasses} ${inputFocusClasses}`;
const inputFieldReadonlyClasses = `${inputBaseClasses} bg-gray-100 cursor-not-allowed`;
const inputFieldTableClasses =
  "w-full p-1.5 border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500";

const labelClasses = "block text-sm font-medium text-gray-700 mb-0.5";

const SCCDailyTesting = ({
  formData,
  onFormDataChange,
  onFormSubmit,
  isSubmitting
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);

  const [machineNoSearch, setMachineNoSearch] = useState(
    formData.machineNo || ""
  );
  const [machineNoOptionsInternal, setMachineNoOptionsInternal] = useState([]);
  const [showMachineNoDropdown, setShowMachineNoDropdown] = useState(false);

  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [existingRecordLoading, setExistingRecordLoading] = useState(false);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [recordStatusMessage, setRecordStatusMessage] = useState("");

  const moNoInputRef = useRef(null); // For focusing
  const machineNoInputRef = useRef(null);
  const moNoDropdownRef = useRef(null);
  const machineNoDropdownRef = useRef(null);

  useEffect(() => {
    const machines = [];
    for (let i = 1; i <= 15; i++) machines.push(String(i));
    for (let i = 1; i <= 5; i++) machines.push(String(i).padStart(3, "0"));
    setMachineNoOptionsInternal(machines);
  }, []);

  const filteredMachineOptions = machineNoOptionsInternal.filter((machine) =>
    machine.toLowerCase().includes(machineNoSearch.toLowerCase())
  );

  const fetchMoNumbers = useCallback(async () => {
    if (moNoSearch.trim() === "") {
      setMoNoOptions([]);
      setShowMoNoDropdown(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search-mono`, {
        params: { term: moNoSearch }
      });
      setMoNoOptions(response.data || []);
      setShowMoNoDropdown(response.data.length > 0);
    } catch (error) {
      console.error(
        t("sccdaily.errorFetchingMoLog", "Error fetching MO numbers:"),
        error
      );
      setMoNoOptions([]);
      setShowMoNoDropdown(false);
    }
  }, [moNoSearch, t]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMoNumbers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [moNoSearch, fetchMoNumbers]);

  const handleMoSelect = (selectedMo) => {
    setMoNoSearch(selectedMo); // Keep search input updated for display
    onFormDataChange({
      ...formData,
      moNo: selectedMo,
      buyer: "",
      buyerStyle: "",
      color: "",
      _id: null,
      standardSpecifications: { tempC: "", timeSec: "", pressure: "" },
      cycleWashingResults: [],
      numberOfRejections: 0,
      finalResult: "Pending",
      afterWashImageFile: null,
      afterWashImageUrl: null,
      remarks: ""
    });
    setShowMoNoDropdown(false);
    setRecordStatusMessage("");
  };

  const handleMachineSelect = (selectedMachine) => {
    setMachineNoSearch(selectedMachine); // Keep search input updated
    onFormDataChange({ ...formData, machineNo: selectedMachine, _id: null });
    setShowMachineNoDropdown(false);
    setRecordStatusMessage("");
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!formData.moNo) {
        setAvailableColors([]);
        onFormDataChange((prev) => ({ ...prev, buyer: "", buyerStyle: "" }));
        return;
      }
      setOrderDetailsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/order-details/${formData.moNo}`
        );
        const details = response.data;
        onFormDataChange((prev) => ({
          ...prev,
          buyer: details.engName || "N/A",
          buyerStyle: details.custStyle || "N/A"
        }));
        setAvailableColors(details.colors || []);
      } catch (error) {
        console.error(
          t(
            "sccdaily.errorFetchingOrderDetailsLog",
            "Error fetching order details:"
          ),
          error
        );
        Swal.fire(
          t("scc.error"),
          t(
            "sccdaily.errorFetchingOrderDetails",
            "Failed to fetch order details."
          ),
          "error"
        );
        onFormDataChange((prev) => ({ ...prev, buyer: "", buyerStyle: "" }));
        setAvailableColors([]);
      } finally {
        setOrderDetailsLoading(false);
      }
    };
    if (formData.moNo) fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.moNo, t]);

  const fetchStandardSpecs = useCallback(async () => {
    if (!formData.moNo || !formData.color || !formData.inspectionDate) return;
    setSpecsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/scc/get-first-output-specs`,
        {
          params: {
            moNo: formData.moNo,
            color: formData.color,
            inspectionDate: formData.inspectionDate.toISOString()
          }
        }
      );
      if (response.data.data) {
        onFormDataChange((prev) => ({
          ...prev,
          standardSpecifications: {
            tempC: response.data.data.tempC || "",
            timeSec: response.data.data.timeSec || "",
            pressure: response.data.data.pressure || ""
          }
        }));
      } else {
        onFormDataChange((prev) => ({
          ...prev,
          standardSpecifications: { tempC: "", timeSec: "", pressure: "" }
        }));
        console.log(
          t(
            "sccdaily.specsNotFoundLog",
            "Standard specs not found. User can input manually."
          )
        );
      }
    } catch (error) {
      console.error(
        t("sccdaily.errorFetchingSpecsLog", "Error fetching standard specs:"),
        error
      );
      onFormDataChange((prev) => ({
        ...prev,
        standardSpecifications: { tempC: "", timeSec: "", pressure: "" }
      }));
    } finally {
      setSpecsLoading(false);
    }
  }, [
    formData.moNo,
    formData.color,
    formData.inspectionDate,
    onFormDataChange,
    t
  ]);

  useEffect(() => {
    const fetchDailyTestingRecordOrSpecs = async () => {
      if (
        !formData.moNo ||
        !formData.color ||
        !formData.machineNo ||
        !formData.inspectionDate
      )
        return;

      setExistingRecordLoading(true);
      setRecordStatusMessage("");
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/daily-testing`,
          {
            params: {
              moNo: formData.moNo,
              color: formData.color,
              machineNo: formData.machineNo,
              inspectionDate: formData.inspectionDate.toISOString()
            }
          }
        );
        const recordData = response.data;

        if (
          recordData.message === "DAILY_TESTING_RECORD_NOT_FOUND" ||
          !recordData.data
        ) {
          setRecordStatusMessage(
            t(
              "sccdaily.newRecordMessage",
              "This is a new daily testing record. Please proceed."
            )
          );
          onFormDataChange((prev) => ({
            ...prev,
            _id: null,
            cycleWashingResults: [],
            numberOfRejections: 0,
            finalResult: "Pending",
            afterWashImageUrl: null,
            remarks: prev.remarks || ""
          }));
          fetchStandardSpecs();
        } else {
          setRecordStatusMessage(
            t(
              "sccdaily.existingRecordLoadedShort",
              "Existing daily testing record loaded."
            )
          );
          onFormDataChange((prev) => ({
            ...prev,
            _id: recordData._id || recordData.data?._id,
            standardSpecifications: recordData.standardSpecifications ||
              recordData.data?.standardSpecifications || {
                tempC: "",
                timeSec: "",
                pressure: ""
              },
            cycleWashingResults:
              recordData.cycleWashingResults ||
              recordData.data?.cycleWashingResults ||
              [],
            numberOfRejections:
              recordData.numberOfRejections ||
              recordData.data?.numberOfRejections ||
              0,
            finalResult:
              recordData.finalResult ||
              recordData.data?.finalResult ||
              "Pending",
            afterWashImageUrl:
              recordData.afterWashImage || recordData.data?.afterWashImage,
            remarks:
              recordData.remarks === "NA"
                ? ""
                : recordData.remarks || recordData.data?.remarks || ""
          }));
        }
      } catch (error) {
        console.error(
          t(
            "sccdaily.errorFetchingDailyRecordLog",
            "Error fetching daily testing record:"
          ),
          error
        );
        Swal.fire(
          t("scc.error"),
          t(
            "sccdaily.errorFetchingDailyRecord",
            "Failed to fetch daily testing record."
          ),
          "error"
        );
        onFormDataChange((prev) => ({
          ...prev,
          _id: null,
          cycleWashingResults: [],
          numberOfRejections: 0,
          finalResult: "Pending",
          standardSpecifications: { tempC: "", timeSec: "", pressure: "" }
        }));
      } finally {
        setExistingRecordLoading(false);
      }
    };

    if (
      formData.moNo &&
      formData.color &&
      formData.machineNo &&
      formData.inspectionDate
    ) {
      fetchDailyTestingRecordOrSpecs();
    } else if (
      formData.moNo &&
      formData.color &&
      formData.inspectionDate &&
      !formData.machineNo
    ) {
      fetchStandardSpecs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.moNo,
    formData.color,
    formData.machineNo,
    formData.inspectionDate,
    fetchStandardSpecs,
    t
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFormDataChange({ ...formData, [name]: value });
  };

  const handleDateChange = (date) => {
    onFormDataChange({ ...formData, inspectionDate: date });
  };

  const handleColorChange = (e) => {
    onFormDataChange({ ...formData, color: e.target.value, _id: null });
    setRecordStatusMessage("");
  };

  const handleSpecChange = (field, value) => {
    onFormDataChange((prev) => ({
      ...prev,
      standardSpecifications: { ...prev.standardSpecifications, [field]: value }
    }));
  };

  const handleCycleResultChange = (index, result) => {
    const newCycles = [...(formData.cycleWashingResults || [])];
    newCycles[index].result = result;
    updateCyclesAndFinalResult(newCycles);
  };

  const addCycle = () => {
    const currentCycles = formData.cycleWashingResults || [];
    if (currentCycles.length >= MAX_CYCLES) return;
    const nextCycleNo = currentCycles.length + 1;
    const newCycles = [
      ...currentCycles,
      { cycleNo: nextCycleNo, result: "Pass" }
    ];
    updateCyclesAndFinalResult(newCycles);
  };

  const resetCycles = () => {
    updateCyclesAndFinalResult([]);
  };

  const updateCyclesAndFinalResult = (updatedCycles) => {
    const rejections = updatedCycles.filter(
      (c) => c.result === "Reject"
    ).length;
    let finalRes = "Pending";
    if (rejections > 0) {
      finalRes = "Reject";
    } else if (updatedCycles.length === MAX_CYCLES && rejections === 0) {
      finalRes = "Pass";
    }

    // Preserve manual override of finalResult unless it's "Pending" or the auto-calculated result is different
    // and more restrictive (e.g., manual was Pass, auto becomes Reject)
    let newFinalResult = finalRes;
    if (formData.finalResult && formData.finalResult !== "Pending") {
      if (formData.finalResult === "Pass" && finalRes === "Reject") {
        newFinalResult = "Reject"; // Auto Reject overrides manual Pass
      } else {
        newFinalResult = formData.finalResult; // Keep manual override if it's not conflicting badly
      }
    }

    onFormDataChange((prev) => ({
      ...prev,
      cycleWashingResults: updatedCycles,
      numberOfRejections: rejections,
      finalResult: newFinalResult
    }));
  };

  const handleFinalResultChange = (e) => {
    onFormDataChange({ ...formData, finalResult: e.target.value });
  };

  const handleImageChange = (imageType, file, previewUrl) => {
    onFormDataChange({
      ...formData,
      afterWashImageFile: file,
      afterWashImageUrl: previewUrl
    });
  };

  const handleImageRemove = () => {
    onFormDataChange({
      ...formData,
      afterWashImageFile: null,
      afterWashImageUrl: null
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target) &&
        !moNoInputRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
      if (
        machineNoDropdownRef.current &&
        !machineNoDropdownRef.current.contains(event.target) &&
        !machineNoInputRef.current.contains(event.target)
      ) {
        setShowMachineNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user)
    return (
      <div className="p-6 text-center">
        {t("scc.loadingUser", "Loading user data...")}
      </div>
    );

  const currentCycles = formData.cycleWashingResults || [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <h2 className="text-xl font-semibold text-gray-800">
        {t(
          "sccdaily.formTitle",
          "Fusing and Heat Transfer Daily Testing Report"
        )}
      </h2>

      {(orderDetailsLoading || existingRecordLoading || specsLoading) && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
          <Loader2 className="animate-spin h-12 w-12 text-white" />
        </div>
      )}
      {recordStatusMessage && (
        <div
          className={`p-3 mb-4 rounded-md text-sm flex items-center shadow-sm ${
            recordStatusMessage.includes(
              t("sccdaily.newRecordMessageKey", "new daily testing record")
            )
              ? "bg-blue-100 text-blue-700 border border-blue-200"
              : "bg-green-100 text-green-700 border border-green-200"
          }`}
        >
          <Info size={18} className="mr-2 flex-shrink-0" />{" "}
          {recordStatusMessage}
        </div>
      )}

      {/* Row 1: Date, MO No, Machine No - Enhanced Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 items-end">
        <div>
          <label htmlFor="dailyTestInspectionDate" className={labelClasses}>
            {t("scc.date")}
          </label>
          <DatePicker
            selected={
              formData.inspectionDate
                ? new Date(formData.inspectionDate)
                : new Date()
            }
            onChange={handleDateChange}
            dateFormat="MM/dd/yyyy"
            className={inputFieldClasses}
            required
            popperPlacement="bottom-start"
          />
        </div>

        <div className="relative">
          <label htmlFor="dailyTestMoNoSearch" className={labelClasses}>
            {t("scc.moNo")}
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              id="dailyTestMoNoSearch"
              value={moNoSearch}
              ref={moNoInputRef}
              onChange={(e) => {
                setMoNoSearch(e.target.value);
                setShowMoNoDropdown(true);
              }}
              onFocus={() => setShowMoNoDropdown(true)}
              placeholder={t("scc.searchMoNo")}
              className={`${inputFieldClasses} pl-10`}
              required
            />
            {showMoNoDropdown && moNoOptions.length > 0 && (
              <ul
                ref={moNoDropdownRef}
                className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
              >
                {moNoOptions.map((mo) => (
                  <li
                    key={mo}
                    onClick={() => handleMoSelect(mo)}
                    className="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-500 hover:text-white"
                  >
                    {mo}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="relative">
          <label htmlFor="machineNo" className={labelClasses}>
            {t("sccdaily.machineNo", "Machine No")}
          </label>
          <div className="relative mt-1">
            <input
              type="text"
              id="machineNo"
              value={machineNoSearch}
              ref={machineNoInputRef}
              onChange={(e) => {
                setMachineNoSearch(e.target.value);
                setShowMachineNoDropdown(true);
              }}
              onFocus={() => setShowMachineNoDropdown(true)}
              placeholder={t(
                "sccdaily.selectOrTypeMachine",
                "Type or select..."
              )}
              className={inputFieldClasses}
              required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            {showMachineNoDropdown && (
              <ul
                ref={machineNoDropdownRef}
                className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
              >
                {filteredMachineOptions.length > 0 ? (
                  filteredMachineOptions.map((machine) => (
                    <li
                      key={machine}
                      onClick={() => handleMachineSelect(machine)}
                      className="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-500 hover:text-white"
                    >
                      {machine}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 cursor-default select-none relative py-2 px-3">
                    {t("sccdaily.noMachineMatch", "No match")}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Buyer, Buyer Style, Color */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 items-end">
        <div>
          <label className={labelClasses}>{t("scc.buyer")}</label>
          <input
            type="text"
            value={formData.buyer || ""}
            readOnly
            className={inputFieldReadonlyClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>{t("scc.buyerStyle")}</label>
          <input
            type="text"
            value={formData.buyerStyle || ""}
            readOnly
            className={inputFieldReadonlyClasses}
          />
        </div>
        <div>
          <label htmlFor="dailyTestColor" className={labelClasses}>
            {t("scc.color")}
          </label>
          <select
            id="dailyTestColor"
            value={formData.color || ""}
            onChange={handleColorChange}
            className={inputFieldClasses}
            disabled={!formData.moNo || availableColors.length === 0}
            required
          >
            <option value="">{t("scc.selectColor")}</option>
            {availableColors.map((c) => (
              <option key={c.key || c.original} value={c.original}>
                {c.original} {c.chn ? `(${c.chn})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Standard Specifications Table */}
      <div className="mt-6 border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-800 bg-gray-50 px-4 py-3 border-b border-gray-200">
          {t("scc.standardSpecifications")}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-gray-200"
                >
                  {t("sccdaily.temperature", "Temperature (°C)")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-gray-200"
                >
                  {t("sccdaily.time", "Time (sec)")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                >
                  {t("sccdaily.pressure", "Pressure")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                  <input
                    type="number"
                    value={formData.standardSpecifications?.tempC || ""}
                    onChange={(e) => handleSpecChange("tempC", e.target.value)}
                    className={inputFieldTableClasses}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                  <input
                    type="number"
                    value={formData.standardSpecifications?.timeSec || ""}
                    onChange={(e) =>
                      handleSpecChange("timeSec", e.target.value)
                    }
                    className={inputFieldTableClasses}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={formData.standardSpecifications?.pressure || ""}
                    onChange={(e) =>
                      handleSpecChange("pressure", e.target.value)
                    }
                    className={inputFieldTableClasses}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5 Cycle Washing Results */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-2">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("sccdaily.cycleWashingResults", "5 Cycle Washing Results")}
          </h3>
          <div className="flex space-x-2">
            {currentCycles.length < MAX_CYCLES && (
              <button
                type="button"
                onClick={addCycle}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusCircle size={16} className="mr-1.5" />{" "}
                {t("sccdaily.addCycle", "Add Cycle")}
              </button>
            )}
            {currentCycles.length > 0 && (
              <button
                type="button"
                onClick={resetCycles}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCcw size={16} className="mr-1.5" />{" "}
                {t("sccdaily.resetCycles", "Reset Cycles")}
              </button>
            )}
          </div>
        </div>
        {currentCycles.length > 0 ? (
          <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th
                      scope="col"
                      className="w-1/2 px-4 py-2.5 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-gray-200"
                    >
                      {t("sccdaily.cycleNo", "Cycle No")}
                    </th>
                    <th
                      scope="col"
                      className="w-1/2 px-4 py-2.5 text-center text-xs font-medium text-gray-600 uppercase tracking-wider"
                    >
                      {t("scc.status", "Result")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCycles.map((cycle, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap text-center border-r border-gray-200 text-sm text-gray-700">
                        {cycle.cycleNo}
                      </td>
                      <td
                        className={`px-3 py-2 whitespace-nowrap ${
                          cycle.result === "Pass" ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        <select
                          value={cycle.result}
                          onChange={(e) =>
                            handleCycleResultChange(index, e.target.value)
                          }
                          className={`w-full p-1.5 border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                            cycle.result === "Pass"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <option value="Pass">{t("scc.pass")}</option>
                          <option value="Reject">{t("scc.reject")}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic py-4 text-center">
            {t(
              "sccdaily.noCyclesAdded",
              "No cycles added yet. Click 'Add Cycle' to start."
            )}
          </p>
        )}
        <p className="mt-2 text-sm text-gray-600">
          {t("sccdaily.numberOfRejections", "Number of Rejections")}:{" "}
          <span className="font-semibold">
            {formData.numberOfRejections || 0}
          </span>
        </p>
      </div>

      {/* Final Results and Remarks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start mt-8">
        <div>
          <label htmlFor="finalResult" className={labelClasses}>
            {t("sccdaily.finalResult", "Final Result")}
          </label>
          <select
            id="finalResult"
            value={formData.finalResult || "Pending"}
            onChange={handleFinalResultChange}
            className={`${inputFieldClasses} ${
              formData.finalResult === "Pass"
                ? "bg-green-50 text-green-700 font-medium"
                : formData.finalResult === "Reject"
                ? "bg-red-50 text-red-700 font-medium"
                : ""
            }`}
          >
            <option value="Pending">{t("sccdaily.pending", "Pending")}</option>
            <option value="Pass">{t("scc.pass")}</option>
            <option value="Reject">{t("scc.reject")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="dailyTestRemarks" className={labelClasses}>
            {t("sccdaily.remarks", "Remarks")}
          </label>
          <textarea
            id="dailyTestRemarks"
            name="remarks"
            rows="2"
            maxLength="150"
            value={formData.remarks || ""}
            onChange={handleInputChange}
            className={inputFieldClasses}
            placeholder={t(
              "sccdaily.remarksPlaceholder",
              "Enter remarks (max 150 chars)..."
            )}
          ></textarea>
          <p className="mt-1 text-xs text-gray-500 text-right">
            {(formData.remarks || "").length} / 150 {t("scc.characters")}
          </p>
        </div>
      </div>

      {/* After Wash Image */}
      <div className="mt-8">
        <SCCImageUpload
          label={t("sccdaily.afterWashImage", "After Wash Image")}
          onImageChange={(file, url) =>
            handleImageChange("afterWashDaily", file, url)
          }
          onImageRemove={handleImageRemove}
          initialImageUrl={formData.afterWashImageUrl}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-5 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
          {formData._id ? t("scc.update") : t("scc.submit")}
        </button>
      </div>
    </div>
  );
};

export default SCCDailyTesting;
