// import axios from "axios";
// import { Info, Loader2, Search } from "lucide-react";
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import { API_BASE_URL } from "../../../../config";
// import { useAuth } from "../../authentication/AuthContext";
// import SCCImageUpload from "./SCCImageUpload";

// const initialSpecState = {
//   type: "first", // Default to 'first'
//   method: "",
//   timeSec: "",
//   tempC: "",
//   tempOffset: "5", // Default Temp Offset
//   pressure: "", // Keep pressure here, submission logic will handle it
//   status: "Pass",
//   remarks: ""
// };

// const SCCFirstOutputForm = ({
//   formType, // "HT" or "FU"
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
//   const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
//   const [existingRecordLoading, setExistingRecordLoading] = useState(false);
//   const [recordStatusMessage, setRecordStatusMessage] = useState("");

//   const moNoDropdownRef = useRef(null);
//   const moNoInputRef = useRef(null);

//   const methodText =
//     formType === "HT"
//       ? t("scc.heatTransfer", "Heat Transfer")
//       : t("scc.fusingMethod", "Fusing");

//   const formTitle =
//     formType === "HT"
//       ? t("scc.firstOutputHTTitle", "First Output - Heat Transfer")
//       : t("scc.firstOutputFUTitle", "First Output - Fusing");

//   const machineNoOptions =
//     formType === "HT"
//       ? Array.from({ length: 15 }, (_, i) => String(i + 1))
//       : Array.from({ length: 5 }, (_, i) => String(i + 1).padStart(3, "0"));

//   // Ensure standardSpecification is initialized correctly
//   useEffect(() => {
//     let currentSpecs = formData.standardSpecification;
//     let specsChanged = false;

//     if (!currentSpecs || currentSpecs.length === 0) {
//       currentSpecs = [
//         { ...initialSpecState, type: "first", method: methodText }
//       ];
//       specsChanged = true;
//     } else {
//       if (
//         currentSpecs[0].method !== methodText ||
//         typeof currentSpecs[0].remarks === "undefined" ||
//         typeof currentSpecs[0].tempOffset === "undefined"
//       ) {
//         currentSpecs[0] = {
//           ...initialSpecState,
//           ...currentSpecs[0],
//           type: "first",
//           method: methodText,
//           remarks: currentSpecs[0].remarks || "",
//           tempOffset: currentSpecs[0].tempOffset || "5"
//         };
//         specsChanged = true;
//       }
//     }

//     if (formData.showSecondHeatSpec) {
//       if (currentSpecs.length < 2) {
//         currentSpecs.push({
//           ...initialSpecState,
//           type: "2nd heat",
//           method: methodText
//         });
//         specsChanged = true;
//       } else {
//         if (
//           currentSpecs[1].method !== methodText ||
//           typeof currentSpecs[1].remarks === "undefined" ||
//           typeof currentSpecs[1].tempOffset === "undefined"
//         ) {
//           currentSpecs[1] = {
//             ...initialSpecState,
//             ...currentSpecs[1],
//             type: "2nd heat",
//             method: methodText,
//             remarks: currentSpecs[1].remarks || "",
//             tempOffset: currentSpecs[1].tempOffset || "5"
//           };
//           specsChanged = true;
//         }
//       }
//     } else if (!formData.showSecondHeatSpec && currentSpecs.length > 1) {
//       currentSpecs = [currentSpecs[0]];
//       specsChanged = true;
//     }

//     if (specsChanged) {
//       onFormDataChange({
//         ...formData,
//         standardSpecification: currentSpecs
//       });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [formType, methodText, t, formData.showSecondHeatSpec]);

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
//       console.error(t("scc.errorFetchingMoLog"), error);
//       setMoNoOptions([]);
//       setShowMoNoDropdown(false);
//     }
//   }, [moNoSearch, t]);

//   useEffect(() => {
//     const delayDebounceFn = setTimeout(() => {
//       if (moNoSearch !== formData.moNo || !formData.moNo) {
//         fetchMoNumbers();
//       }
//     }, 300);
//     return () => clearTimeout(delayDebounceFn);
//   }, [moNoSearch, formData.moNo, fetchMoNumbers]);

//   const handleMoSelect = (selectedMo) => {
//     setMoNoSearch(selectedMo);
//     onFormDataChange({
//       ...formData,
//       moNo: selectedMo,
//       buyer: "",
//       buyerStyle: "",
//       color: "",
//       _id: null
//     });
//     setShowMoNoDropdown(false);
//     setRecordStatusMessage("");
//   };

//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       if (!formData.moNo) {
//         if (formData.buyer || formData.buyerStyle || formData.color) {
//           onFormDataChange((prev) => ({
//             ...prev,
//             buyer: "",
//             buyerStyle: "",
//             color: ""
//           }));
//         }
//         setAvailableColors([]);
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
//         console.error(t("scc.errorFetchingOrderDetailsLog"), error);
//         Swal.fire(t("scc.error"), t("scc.errorFetchingOrderDetails"), "error");
//         onFormDataChange((prev) => ({
//           ...prev,
//           buyer: "",
//           buyerStyle: "",
//           color: ""
//         }));
//         setAvailableColors([]);
//       } finally {
//         setOrderDetailsLoading(false);
//       }
//     };

//     if (formData.moNo) {
//       fetchOrderDetails();
//     } else {
//       if (formData.buyer || formData.buyerStyle || formData.color) {
//         onFormDataChange((prev) => ({
//           ...prev,
//           buyer: "",
//           buyerStyle: "",
//           color: ""
//         }));
//       }
//       setAvailableColors([]);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [formData.moNo, t]);

//   useEffect(() => {
//     const fetchExistingRecord = async () => {
//       if (
//         !formData.moNo ||
//         !formData.color ||
//         !formData.inspectionDate ||
//         !formData.machineNo
//       )
//         return;

//       setExistingRecordLoading(true);
//       setRecordStatusMessage("");
//       try {
//         const endpoint =
//           formType === "HT"
//             ? "/api/scc/ht-first-output"
//             : "/api/scc/fu-first-output";
//         const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
//           params: {
//             moNo: formData.moNo,
//             color: formData.color,
//             inspectionDate: formData.inspectionDate.toISOString(),
//             machineNo: formData.machineNo
//           }
//         });

//         const recordData = response.data;

//         if (
//           recordData.message === "HT_RECORD_NOT_FOUND" ||
//           recordData.message === "FU_RECORD_NOT_FOUND" ||
//           !recordData.data
//         ) {
//           setRecordStatusMessage(t("scc.newRecordMessage"));
//           onFormDataChange((prev) => ({
//             ...prev,
//             _id: null
//           }));
//         } else {
//           const loadedRecord = recordData.data || recordData;
//           const mapSpecsForDisplay = (specs) =>
//             specs.map((spec) => ({
//               ...initialSpecState, // Ensure all fields from initialSpecState are present
//               ...spec,
//               type: spec.type,
//               method: spec.method || methodText,
//               tempOffset:
//                 spec.tempOffsetPlus !== 0
//                   ? String(spec.tempOffsetPlus)
//                   : spec.tempOffsetMinus !== 0
//                   ? String(spec.tempOffsetMinus)
//                   : "5",
//               remarks: spec.remarks || "",
//               pressure:
//                 spec.pressure !== null && spec.pressure !== undefined
//                   ? String(spec.pressure)
//                   : "",
//               status: spec.status || "Pass",
//               timeSec:
//                 spec.timeSec !== null && spec.timeSec !== undefined
//                   ? String(spec.timeSec)
//                   : "",
//               tempC:
//                 spec.tempC !== null && spec.tempC !== undefined
//                   ? String(spec.tempC)
//                   : ""
//             }));

//           setRecordStatusMessage(t("scc.existingRecordLoadedShort"));
//           onFormDataChange((prev) => ({
//             ...prev,
//             _id: loadedRecord._id,
//             standardSpecification: mapSpecsForDisplay(
//               loadedRecord.standardSpecification
//             ),
//             referenceSampleImageUrl: loadedRecord.referenceSampleImage,
//             afterWashImageUrl: loadedRecord.afterWashImage,
//             remarks:
//               loadedRecord.remarks === "NA" ? "" : loadedRecord.remarks || "",
//             showSecondHeatSpec: loadedRecord.standardSpecification?.length > 1
//           }));
//         }
//       } catch (error) {
//         console.error(t("scc.errorFetchingExistingLog"), error);
//         if (
//           !(
//             error.response &&
//             (error.response.data.message === "HT_RECORD_NOT_FOUND" ||
//               error.response.data.message === "FU_RECORD_NOT_FOUND")
//           )
//         ) {
//           Swal.fire(t("scc.error"), t("scc.errorFetchingExisting"), "error");
//         }
//         onFormDataChange((prev) => ({
//           ...prev,
//           _id: null
//         }));
//       } finally {
//         setExistingRecordLoading(false);
//       }
//     };

//     if (
//       formData.moNo &&
//       formData.color &&
//       formData.inspectionDate &&
//       formData.machineNo
//     ) {
//       fetchExistingRecord();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [
//     formData.moNo,
//     formData.color,
//     formData.inspectionDate,
//     formData.machineNo,
//     formType,
//     methodText,
//     t
//   ]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     let newFormData = { ...formData, [name]: value };
//     if (name === "moNo" || name === "machineNo" || name === "color") {
//       newFormData._id = null;
//       setRecordStatusMessage("");
//       if (name === "moNo") {
//         setMoNoSearch(value);
//         newFormData.color = "";
//         newFormData.buyer = "";
//         newFormData.buyerStyle = "";
//         setAvailableColors([]);
//       }
//     }
//     onFormDataChange(newFormData);
//   };

//   const handleDateChange = (date) => {
//     onFormDataChange({
//       ...formData,
//       inspectionDate: date,
//       _id: null
//     });
//     setRecordStatusMessage("");
//   };

//   const handleMachineNoChange = (e) => {
//     onFormDataChange({
//       ...formData,
//       machineNo: e.target.value,
//       _id: null
//     });
//     setRecordStatusMessage("");
//   };

//   const handleColorChange = (e) => {
//     onFormDataChange({
//       ...formData,
//       color: e.target.value,
//       _id: null
//     });
//     setRecordStatusMessage("");
//   };

//   const handleShowSecondHeatChange = (e) => {
//     const show = e.target.value === "yes";
//     let newSpecs = [...(formData.standardSpecification || [])];

//     if (show) {
//       if (newSpecs.length < 2) {
//         newSpecs.push({
//           ...initialSpecState,
//           type: "2nd heat",
//           method: methodText
//         });
//       } else {
//         newSpecs[1] = {
//           ...initialSpecState,
//           ...newSpecs[1],
//           type: "2nd heat",
//           method: methodText
//         };
//       }
//     } else {
//       if (newSpecs.length > 1) {
//         newSpecs = [newSpecs[0]];
//       }
//     }
//     onFormDataChange({
//       ...formData,
//       showSecondHeatSpec: show,
//       standardSpecification: newSpecs
//     });
//   };

//   const handleSpecChange = (specIndex, field, value) => {
//     const newSpecs = [...formData.standardSpecification];
//     if (!newSpecs[specIndex]) {
//       newSpecs[specIndex] = {
//         ...initialSpecState,
//         type: specIndex === 0 ? "first" : "2nd heat",
//         method: methodText
//       };
//     }
//     newSpecs[specIndex] = { ...newSpecs[specIndex], [field]: value };
//     onFormDataChange({ ...formData, standardSpecification: newSpecs });
//   };

//   const handleImageChange = (imageType, file, previewUrl) => {
//     if (imageType === "referenceSample") {
//       onFormDataChange({
//         ...formData,
//         referenceSampleImageFile: file,
//         referenceSampleImageUrl: previewUrl
//       });
//     } else if (imageType === "afterWash") {
//       onFormDataChange({
//         ...formData,
//         afterWashImageFile: file,
//         afterWashImageUrl: previewUrl
//       });
//     }
//   };

//   const handleImageRemove = (imageType) => {
//     if (imageType === "referenceSample") {
//       onFormDataChange({
//         ...formData,
//         referenceSampleImageFile: null,
//         referenceSampleImageUrl: null
//       });
//     } else if (imageType === "afterWash") {
//       onFormDataChange({
//         ...formData,
//         afterWashImageFile: null,
//         afterWashImageUrl: null
//       });
//     }
//   };

//   const isSpecTableDisabled =
//     !formData.machineNo || !formData.moNo || !formData.color;

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         moNoDropdownRef.current &&
//         !moNoDropdownRef.current.contains(event.target) &&
//         moNoInputRef.current &&
//         !moNoInputRef.current.contains(event.target)
//       ) {
//         setShowMoNoDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   if (!user) {
//     return (
//       <div className="p-6 text-center">
//         {t("scc.loadingUser", "Loading user data...")}
//       </div>
//     );
//   }

//   const firstSpec = (formData.standardSpecification &&
//     formData.standardSpecification[0]) || {
//     ...initialSpecState,
//     type: "first",
//     method: methodText
//   };
//   const secondSpec = (formData.showSecondHeatSpec &&
//     formData.standardSpecification &&
//     formData.standardSpecification[1]) || {
//     ...initialSpecState,
//     type: "2nd heat",
//     method: methodText
//   };

//   const renderSpecTable = (specData, specIndex, title, isDisabled) => {
//     const specType = specIndex === 0 ? "first" : "2nd heat";

//     // Define base fields
//     let fieldsToRender = [
//       {
//         key: "method",
//         label: t("scc.method", "Method"),
//         type: "text",
//         readOnly: true
//       },
//       {
//         key: "timeSec",
//         label: t("scc.timeSec", "Time (sec)"),
//         type: "number",
//         inputMode: "numeric"
//       },
//       {
//         key: "tempC",
//         label: t("scc.tempC", "Temp (°C)"),
//         type: "number",
//         inputMode: "numeric"
//       },
//       {
//         key: "tempOffset",
//         label: t("scc.tempOffset", "Temp Offset (±)"),
//         type: "number",
//         inputMode: "numeric"
//       }
//       // Pressure will be added conditionally
//     ];

//     // Conditionally add Pressure field for HT form type
//     if (formType === "HT") {
//       fieldsToRender.push({
//         key: "pressure",
//         label: t("scc.pressure", "Pressure"),
//         type: "number",
//         inputMode: "numeric"
//       });
//     }

//     // Add remaining fields
//     fieldsToRender.push(
//       {
//         key: "status",
//         label: t("scc.status", "Status"),
//         type: "select",
//         options: ["Pass", "Reject"]
//       },
//       {
//         key: "remarks",
//         label: t("scc.specRemarks", "Remarks"),
//         type: "textarea"
//       }
//     );

//     return (
//       <div
//         className={`mt-6 ${isDisabled ? "opacity-50 pointer-events-none" : ""}`}
//       >
//         <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
//         {isDisabled && (
//           <p className="mt-2 text-sm text-blue-600 flex items-center">
//             <Info size={16} className="mr-1" />
//             {t(
//               "scc.fillMachineMoColorToEnableSpecs",
//               "Please fill Machine No, MO No, and Color to enable specification entry."
//             )}
//           </p>
//         )}
//         <div className="mt-2 overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200 border">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r w-1/3">
//                   {t("scc.parameter", "Parameter")}
//                 </th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/3">
//                   {t(
//                     `scc.${specType}`,
//                     specType.charAt(0).toUpperCase() + specType.slice(1)
//                   )}
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {fieldsToRender.map(
//                 ({ key, label, type, inputMode, readOnly, options }) => (
//                   <tr key={`${specType}-${key}`}>
//                     <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
//                       {label}
//                     </td>
//                     <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
//                       {type === "select" ? (
//                         <select
//                           value={
//                             specData?.[key] || (key === "status" ? "Pass" : "")
//                           }
//                           onChange={(e) =>
//                             handleSpecChange(specIndex, key, e.target.value)
//                           }
//                           className="w-full p-1 border-gray-300 rounded-md text-sm"
//                           disabled={isDisabled}
//                         >
//                           {options.map((opt) => (
//                             <option key={opt} value={opt}>
//                               {t(`scc.${opt.toLowerCase()}`, opt)}
//                             </option>
//                           ))}
//                         </select>
//                       ) : type === "textarea" ? (
//                         <textarea
//                           value={specData?.[key] || ""}
//                           onChange={(e) =>
//                             handleSpecChange(specIndex, key, e.target.value)
//                           }
//                           rows="2"
//                           className={`w-full p-1 border-gray-300 rounded-md text-sm ${
//                             readOnly ? "bg-gray-100" : ""
//                           }`}
//                           readOnly={readOnly}
//                           disabled={isDisabled}
//                         />
//                       ) : (
//                         <input
//                           type={type}
//                           inputMode={inputMode || "text"}
//                           value={
//                             specData?.[key] ||
//                             (key === "tempOffset" && !specData?.[key]
//                               ? "5"
//                               : "")
//                           }
//                           readOnly={readOnly}
//                           onChange={(e) =>
//                             handleSpecChange(specIndex, key, e.target.value)
//                           }
//                           className={`w-full p-1 border-gray-300 rounded-md text-sm ${
//                             readOnly ? "bg-gray-100" : ""
//                           }`}
//                           disabled={isDisabled}
//                         />
//                       )}
//                     </td>
//                   </tr>
//                 )
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <form
//       onSubmit={(e) => {
//         e.preventDefault();
//         onFormSubmit(formType);
//       }}
//       className="space-y-6"
//     >
//       <h2 className="text-xl font-semibold text-gray-700 mb-4">{formTitle}</h2>

//       {(orderDetailsLoading || existingRecordLoading) && (
//         <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
//           <Loader2 className="animate-spin h-12 w-12 text-white" />
//         </div>
//       )}
//       {recordStatusMessage && (
//         <div
//           className={`p-3 mb-4 rounded-md text-sm flex items-center ${
//             recordStatusMessage.includes(
//               t("scc.newRecordMessageKey", "new record")
//             )
//               ? "bg-blue-100 text-blue-700"
//               : "bg-green-100 text-green-700"
//           }`}
//         >
//           <Info size={18} className="mr-2" />
//           {recordStatusMessage}
//         </div>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div>
//           <label
//             htmlFor={`${formType}-inspectionDate`}
//             className="block text-sm font-medium text-gray-700"
//           >
//             {t("scc.date", "Date")}
//           </label>
//           <DatePicker
//             selected={
//               formData.inspectionDate
//                 ? new Date(formData.inspectionDate)
//                 : new Date()
//             }
//             onChange={handleDateChange}
//             dateFormat="MM/dd/yyyy"
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//             required
//             id={`${formType}-inspectionDate`}
//           />
//         </div>
//         <div>
//           <label
//             htmlFor={`${formType}-machineNo`}
//             className="block text-sm font-medium text-gray-700"
//           >
//             {t("scc.machineNo", "Machine No")}
//           </label>
//           <select
//             id={`${formType}-machineNo`}
//             name="machineNo"
//             value={formData.machineNo || ""}
//             onChange={handleMachineNoChange}
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//             required
//           >
//             <option value="">
//               {t("scc.selectMachine", "Select Machine...")}
//             </option>
//             {machineNoOptions.map((num) => (
//               <option key={num} value={num}>
//                 {num}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="relative">
//           <label
//             htmlFor={`${formType}-moNoSearch`}
//             className="block text-sm font-medium text-gray-700"
//           >
//             {t("scc.moNo", "MO No")}
//           </label>
//           <div className="relative mt-1" ref={moNoDropdownRef}>
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
//             </div>
//             <input
//               type="text"
//               id={`${formType}-moNoSearch`}
//               ref={moNoInputRef}
//               value={moNoSearch}
//               onChange={(e) => setMoNoSearch(e.target.value)}
//               onFocus={() => setShowMoNoDropdown(true)}
//               placeholder={t("scc.searchMoNo", "Search MO No...")}
//               className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//               required
//             />
//             {showMoNoDropdown && moNoOptions.length > 0 && (
//               <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
//                 {moNoOptions.map((mo) => (
//                   <li
//                     key={mo}
//                     onClick={() => handleMoSelect(mo)}
//                     className="px-3 py-2 cursor-pointer hover:bg-gray-100"
//                   >
//                     {mo}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             {t("scc.buyer", "Buyer")}
//           </label>
//           <input
//             type="text"
//             value={formData.buyer || ""}
//             readOnly
//             className="mt-1 block w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             {t("scc.buyerStyle", "Buyer Style")}
//           </label>
//           <input
//             type="text"
//             value={formData.buyerStyle || ""}
//             readOnly
//             className="mt-1 block w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
//           />
//         </div>
//         <div>
//           <label
//             htmlFor={`${formType}-color`}
//             className="block text-sm font-medium text-gray-700"
//           >
//             {t("scc.color", "Color")}
//           </label>
//           <select
//             id={`${formType}-color`}
//             name="color"
//             value={formData.color || ""}
//             onChange={handleColorChange}
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//             disabled={!formData.moNo || availableColors.length === 0}
//             required
//           >
//             <option value="">{t("scc.selectColor", "Select Color...")}</option>
//             {availableColors.map((c) => (
//               <option key={c.key || c.original} value={c.original}>
//                 {c.original} {c.chn ? `(${c.chn})` : ""}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {renderSpecTable(
//         firstSpec,
//         0,
//         t("scc.standardSpecifications", "Standard Specifications"),
//         isSpecTableDisabled
//       )}

//       <div className="mt-6">
//         <label className="block text-sm font-medium text-gray-700">
//           {t("scc.secondHeatSpecificationQuestion", "2nd Heat Specification?")}
//         </label>
//         <div className="mt-1 flex items-center space-x-4">
//           <label className="inline-flex items-center">
//             <input
//               type="radio"
//               name="showSecondHeatSpec"
//               value="yes"
//               checked={formData.showSecondHeatSpec === true}
//               onChange={handleShowSecondHeatChange}
//               className="form-radio h-4 w-4 text-indigo-600"
//               disabled={isSpecTableDisabled}
//             />
//             <span className="ml-2 text-sm text-gray-700">
//               {t("scc.yes", "Yes")}
//             </span>
//           </label>
//           <label className="inline-flex items-center">
//             <input
//               type="radio"
//               name="showSecondHeatSpec"
//               value="no"
//               checked={formData.showSecondHeatSpec === false}
//               onChange={handleShowSecondHeatChange}
//               className="form-radio h-4 w-4 text-indigo-600"
//               disabled={isSpecTableDisabled}
//             />
//             <span className="ml-2 text-sm text-gray-700">
//               {t("scc.no", "No")}
//             </span>
//           </label>
//         </div>
//       </div>

//       {formData.showSecondHeatSpec &&
//         renderSpecTable(
//           secondSpec,
//           1,
//           t("scc.specsAfterSecondHeat", "Specifications after 2nd Heat"),
//           isSpecTableDisabled
//         )}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
//         <SCCImageUpload
//           label={t("scc.referenceSample", "Reference Sample")}
//           onImageChange={(file, url) =>
//             handleImageChange("referenceSample", file, url)
//           }
//           onImageRemove={() => handleImageRemove("referenceSample")}
//           initialImageUrl={formData.referenceSampleImageUrl}
//           imageType="referenceSample"
//         />
//         <SCCImageUpload
//           label={t("scc.afterWash", "After Wash")}
//           onImageChange={(file, url) =>
//             handleImageChange("afterWash", file, url)
//           }
//           onImageRemove={() => handleImageRemove("afterWash")}
//           initialImageUrl={formData.afterWashImageUrl}
//           imageType="afterWash"
//         />
//       </div>

//       <div className="mt-6">
//         <label
//           htmlFor="remarks"
//           className="block text-sm font-medium text-gray-700"
//         >
//           {t("scc.mainRemarks", "Remarks")}
//         </label>
//         <textarea
//           id="remarks"
//           name="remarks"
//           rows="3"
//           maxLength="250"
//           value={formData.remarks || ""}
//           onChange={handleInputChange}
//           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//           placeholder={t("scc.remarksPlaceholder", "Enter remarks here...")}
//         ></textarea>
//         <p className="mt-1 text-xs text-gray-500 text-right">
//           {(formData.remarks || "").length} / 250{" "}
//           {t("scc.characters", "characters")}
//         </p>
//       </div>

//       <div className="pt-5">
//         <div className="flex justify-end">
//           <button
//             type="submit"
//             disabled={isSubmitting || isSpecTableDisabled}
//             className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
//           >
//             {isSubmitting ? (
//               <Loader2 className="animate-spin h-5 w-5 mr-2" />
//             ) : null}
//             {formData._id
//               ? t("scc.update", "Update")
//               : t("scc.submit", "Submit")}
//           </button>
//         </div>
//       </div>
//     </form>
//   );
// };

// export default SCCFirstOutputForm;

import axios from "axios";
import { Info, Loader2, Search, UserCircle2 } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo
} from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";
import SCCImageUpload from "./SCCImageUpload";

// Helper function to determine the correct image URL
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
        "API_BASE_URL is not a valid URL for constructing operator image paths, using path directly:",
        facePhotoPath
      );
      return facePhotoPath;
    }
  }
  console.warn(
    "Unhandled operator face_photo path format:",
    facePhotoPath,
    "- rendering as is."
  );
  return facePhotoPath;
};

const initialSpecState = {
  type: "first",
  method: "",
  timeSec: "",
  tempC: "",
  tempOffset: "5",
  pressure: "",
  status: "Pass",
  remarks: ""
};

const SCCFirstOutputForm = ({
  formType,
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
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [existingRecordLoading, setExistingRecordLoading] = useState(false);
  const [recordStatusMessage, setRecordStatusMessage] = useState("");

  // operatorDisplayData is for UI, formData.operatorData is for submission
  const [operatorDisplayData, setOperatorDisplayData] = useState(
    formData.operatorData || null
  );
  const [operatorLoading, setOperatorLoading] = useState(false);

  const moNoDropdownRef = useRef(null);
  const moNoInputRef = useRef(null);

  const methodText = useMemo(
    () =>
      formType === "HT"
        ? t("scc.heatTransfer", "Heat Transfer")
        : t("scc.fusingMethod", "Fusing"),
    [formType, t]
  );

  const formTitle = useMemo(
    () =>
      formType === "HT"
        ? t("scc.firstOutputHTTitle", "First Output - Heat Transfer")
        : t("scc.firstOutputFUTitle", "First Output - Fusing"),
    [formType, t]
  );

  const machineNoOptions = useMemo(
    () =>
      formType === "HT"
        ? Array.from({ length: 15 }, (_, i) => String(i + 1))
        : Array.from({ length: 5 }, (_, i) => String(i + 1).padStart(3, "0")),
    [formType]
  );

  // Initialize/Update specs when formType, methodText, or showSecondHeatSpec changes
  useEffect(() => {
    let currentSpecs = [...(formData.standardSpecification || [])]; // Create a new array copy
    let specsChanged = false;

    // Ensure first spec exists and has correct method
    if (currentSpecs.length === 0) {
      currentSpecs = [
        { ...initialSpecState, type: "first", method: methodText }
      ];
      specsChanged = true;
    } else {
      const firstSpec = { ...currentSpecs[0] }; // Copy first spec
      let firstSpecChanged = false;
      if (firstSpec.method !== methodText) {
        firstSpec.method = methodText;
        firstSpecChanged = true;
      }
      if (typeof firstSpec.remarks === "undefined") {
        firstSpec.remarks = "";
        firstSpecChanged = true;
      }
      if (typeof firstSpec.tempOffset === "undefined") {
        firstSpec.tempOffset = "5";
        firstSpecChanged = true;
      }
      if (firstSpecChanged) {
        currentSpecs[0] = firstSpec;
        specsChanged = true;
      }
    }

    // Ensure second spec exists/removed based on showSecondHeatSpec
    if (formData.showSecondHeatSpec) {
      if (currentSpecs.length < 2) {
        currentSpecs.push({
          ...initialSpecState,
          type: "2nd heat",
          method: methodText
        });
        specsChanged = true;
      } else {
        const secondSpec = { ...currentSpecs[1] }; // Copy second spec
        let secondSpecChanged = false;
        if (secondSpec.method !== methodText) {
          secondSpec.method = methodText;
          secondSpecChanged = true;
        }
        if (typeof secondSpec.remarks === "undefined") {
          secondSpec.remarks = "";
          secondSpecChanged = true;
        }
        if (typeof secondSpec.tempOffset === "undefined") {
          secondSpec.tempOffset = "5";
          secondSpecChanged = true;
        }
        if (secondSpecChanged) {
          currentSpecs[1] = secondSpec;
          specsChanged = true;
        }
      }
    } else if (!formData.showSecondHeatSpec && currentSpecs.length > 1) {
      currentSpecs = [currentSpecs[0]]; // Keep only the first spec
      specsChanged = true;
    }

    if (specsChanged) {
      onFormDataChange({ ...formData, standardSpecification: currentSpecs });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formType, methodText, formData.showSecondHeatSpec]); // onFormDataChange, formData removed to prevent loops, let parent handle state

  // Fetch Operator Data
  useEffect(() => {
    const fetchOperator = async () => {
      if (!formData.machineNo || !formType) {
        setOperatorDisplayData(null);
        // If operatorData was on formData, clear it via onFormDataChange
        if (formData.operatorData) {
          onFormDataChange({ ...formData, operatorData: null });
        }
        return;
      }
      setOperatorLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/operator-by-machine/${formType.toLowerCase()}/${
            formData.machineNo
          }`
        );
        const fetchedOpData = response.data?.data || null;
        setOperatorDisplayData(fetchedOpData);
        // Update parent's formData directly
        onFormDataChange({ ...formData, operatorData: fetchedOpData });
      } catch (error) {
        setOperatorDisplayData(null);
        onFormDataChange({ ...formData, operatorData: null }); // Clear on error too
        if (
          !(
            error.response &&
            error.response.status === 404 &&
            error.response.data.message === "OPERATOR_NOT_FOUND"
          )
        ) {
          console.error("Error fetching operator data:", error);
        }
      } finally {
        setOperatorLoading(false);
      }
    };
    fetchOperator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.machineNo, formType]); // Re-fetch when machineNo or formType changes

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
      console.error(t("scc.errorFetchingMoLog"), error);
      setMoNoOptions([]);
      setShowMoNoDropdown(false);
    }
  }, [moNoSearch, t]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (moNoSearch !== formData.moNo || !formData.moNo) {
        fetchMoNumbers();
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [moNoSearch, formData.moNo, fetchMoNumbers]);

  const handleMoSelect = (selectedMo) => {
    setMoNoSearch(selectedMo);
    onFormDataChange({
      ...formData,
      moNo: selectedMo,
      buyer: "",
      buyerStyle: "",
      color: "",
      _id: null
    });
    setShowMoNoDropdown(false);
    setRecordStatusMessage("");
  };

  // Fetch Order Details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!formData.moNo) {
        // Clear dependent fields if moNo is cleared
        if (formData.buyer || formData.buyerStyle || formData.color) {
          onFormDataChange((prev) => ({
            ...prev,
            buyer: "",
            buyerStyle: "",
            color: ""
          }));
        }
        setAvailableColors([]);
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
        console.error(t("scc.errorFetchingOrderDetailsLog"), error);
        Swal.fire(t("scc.error"), t("scc.errorFetchingOrderDetails"), "error");
        onFormDataChange((prev) => ({
          ...prev,
          buyer: "",
          buyerStyle: "",
          color: ""
        }));
        setAvailableColors([]);
      } finally {
        setOrderDetailsLoading(false);
      }
    };

    fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.moNo]); // Removed t, onFormDataChange

  // Fetch Existing Record
  useEffect(() => {
    const fetchExistingRecord = async () => {
      if (
        !formData.moNo ||
        !formData.color ||
        !formData.inspectionDate ||
        !formData.machineNo
      )
        return;
      setExistingRecordLoading(true);
      setRecordStatusMessage("");
      try {
        const endpoint =
          formType === "HT"
            ? "/api/scc/ht-first-output"
            : "/api/scc/fu-first-output";
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          params: {
            moNo: formData.moNo,
            color: formData.color,
            inspectionDate: new Date(formData.inspectionDate).toISOString(),
            machineNo: formData.machineNo
          }
        });

        const recordData = response.data;
        const actualRecord = recordData.data
          ? recordData.data
          : recordData.message
          ? null
          : recordData;

        if (
          !actualRecord ||
          recordData.message === "HT_RECORD_NOT_FOUND" ||
          recordData.message === "FU_RECORD_NOT_FOUND"
        ) {
          setRecordStatusMessage(t("scc.newRecordMessage"));
          // When new, preserve current formData fields like machineNo, date, color, MO, and importantly, operatorData
          // but reset _id and potentially specs if they shouldn't carry over.
          onFormDataChange((prev) => ({
            ...prev, // Keeps moNo, color, inspectionDate, machineNo, operatorData
            _id: null,
            // Reset specs to default if it's truly a "new" record context for these keys
            standardSpecification: [
              { ...initialSpecState, type: "first", method: methodText }
            ],
            showSecondHeatSpec: false,
            referenceSampleImageUrl: null,
            afterWashImageUrl: null,
            remarks: ""
          }));
        } else {
          const mapSpecsForDisplay = (specs = []) =>
            specs.map((spec) => ({
              ...initialSpecState,
              ...spec,
              type: spec.type,
              method: spec.method || methodText,
              tempOffset:
                spec.tempOffsetPlus !== 0
                  ? String(spec.tempOffsetPlus)
                  : spec.tempOffsetMinus !== 0
                  ? String(spec.tempOffsetMinus)
                  : "5",
              remarks: spec.remarks || "",
              pressure: spec.pressure != null ? String(spec.pressure) : "",
              status: spec.status || "Pass",
              timeSec: spec.timeSec != null ? String(spec.timeSec) : "",
              tempC: spec.tempC != null ? String(spec.tempC) : ""
            }));

          setRecordStatusMessage(t("scc.existingRecordLoadedShort"));
          onFormDataChange((prev) => ({
            ...prev, // Keeps current moNo, color, inspectionDate, machineNo
            _id: actualRecord._id,
            standardSpecification: mapSpecsForDisplay(
              actualRecord.standardSpecification
            ),
            referenceSampleImageUrl: actualRecord.referenceSampleImage,
            afterWashImageUrl: actualRecord.afterWashImage,
            remarks:
              actualRecord.remarks === "NA" ? "" : actualRecord.remarks || "",
            showSecondHeatSpec: actualRecord.standardSpecification?.length > 1,
            operatorData: actualRecord.operatorData || prev.operatorData || null // Prioritize loaded, then current
          }));
          if (actualRecord.operatorData) {
            setOperatorDisplayData(actualRecord.operatorData);
          }
        }
      } catch (error) {
        console.error(t("scc.errorFetchingExistingLog"), error);
        if (
          !(
            error.response &&
            (error.response.data.message === "HT_RECORD_NOT_FOUND" ||
              error.response.data.message === "FU_RECORD_NOT_FOUND")
          )
        ) {
          Swal.fire(t("scc.error"), t("scc.errorFetchingExisting"), "error");
        }
        onFormDataChange((prev) => ({ ...prev, _id: null })); // Keep other fields, just reset _id
      } finally {
        setExistingRecordLoading(false);
      }
    };

    fetchExistingRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.moNo,
    formData.color,
    formData.inspectionDate,
    formData.machineNo,
    formType,
    methodText
  ]); // Removed t

  // Handle basic input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    if (name === "moNo" || name === "machineNo" || name === "color") {
      newFormData._id = null;
      setRecordStatusMessage("");
      if (name === "moNo") {
        setMoNoSearch(value);
        newFormData.color = "";
        newFormData.buyer = "";
        newFormData.buyerStyle = "";
        setAvailableColors([]);
      }
    }
    onFormDataChange(newFormData);
  };

  const handleDateChange = (date) => {
    onFormDataChange({ ...formData, inspectionDate: date, _id: null });
    setRecordStatusMessage("");
  };

  // When machineNo changes, operatorData will be re-fetched by its own useEffect
  const handleMachineNoChange = (e) => {
    onFormDataChange({
      ...formData,
      machineNo: e.target.value,
      _id: null,
      operatorData: null // Clear existing operatorData, let useEffect fetch new
    });
    setOperatorDisplayData(null); // Also clear local display state immediately
    setRecordStatusMessage("");
  };

  const handleColorChange = (e) => {
    onFormDataChange({ ...formData, color: e.target.value, _id: null });
    setRecordStatusMessage("");
  };

  const handleShowSecondHeatChange = (e) => {
    const show = e.target.value === "yes";
    // This logic was fine from your original code
    let newSpecs = [...(formData.standardSpecification || [])];
    if (show) {
      if (newSpecs.length < 2) {
        newSpecs.push({
          ...initialSpecState,
          type: "2nd heat",
          method: methodText
        });
      } else {
        newSpecs[1] = {
          ...initialSpecState,
          ...newSpecs[1],
          type: "2nd heat",
          method: methodText
        };
      }
    } else {
      if (newSpecs.length > 1) {
        newSpecs = [newSpecs[0]];
      }
    }
    onFormDataChange({
      ...formData,
      showSecondHeatSpec: show,
      standardSpecification: newSpecs
    });
  };

  const handleSpecChange = (specIndex, field, value) => {
    // This logic was fine
    const newSpecs = [...formData.standardSpecification];
    if (!newSpecs[specIndex]) {
      newSpecs[specIndex] = {
        ...initialSpecState,
        type: specIndex === 0 ? "first" : "2nd heat",
        method: methodText
      };
    }
    newSpecs[specIndex] = { ...newSpecs[specIndex], [field]: value };
    onFormDataChange({ ...formData, standardSpecification: newSpecs });
  };

  const handleImageChange = (imageType, file, previewUrl) => {
    /* ... (same as original) ... */
  };
  const handleImageRemove = (imageType) => {
    /* ... (same as original) ... */
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target) &&
        moNoInputRef.current &&
        !moNoInputRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;
  }

  const isSpecTableDisabled =
    !formData.machineNo || !formData.moNo || !formData.color;

  // Use formData directly for rendering spec tables
  const firstSpecToRender = formData.standardSpecification?.[0] || {
    ...initialSpecState,
    type: "first",
    method: methodText
  };
  const secondSpecToRender = (formData.showSecondHeatSpec &&
    formData.standardSpecification?.[1]) || {
    ...initialSpecState,
    type: "2nd heat",
    method: methodText
  };

  const renderSpecTable = (specData, specIndex, title, isDisabled) => {
    const specType = specIndex === 0 ? "first" : "2nd heat";
    let fieldsToRender = [
      {
        key: "method",
        label: t("scc.method", "Method"),
        type: "text",
        readOnly: true
      },
      {
        key: "timeSec",
        label: t("scc.timeSec", "Time (sec)"),
        type: "number",
        inputMode: "numeric"
      },
      {
        key: "tempC",
        label: t("scc.tempC", "Temp (°C)"),
        type: "number",
        inputMode: "numeric"
      },
      {
        key: "tempOffset",
        label: t("scc.tempOffset", "Temp Offset (±)"),
        type: "number",
        inputMode: "numeric"
      }
    ];
    if (formType === "HT") {
      fieldsToRender.push({
        key: "pressure",
        label: t("scc.pressure", "Pressure"),
        type: "number",
        inputMode: "numeric"
      });
    }
    fieldsToRender.push(
      {
        key: "status",
        label: t("scc.status", "Status"),
        type: "select",
        options: ["Pass", "Reject"]
      },
      {
        key: "remarks",
        label: t("scc.specRemarks", "Remarks"),
        type: "textarea"
      }
    );

    return (
      <div
        className={`mt-6 ${isDisabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
        {isDisabled && (
          <p className="mt-2 text-sm text-blue-600 flex items-center">
            <Info size={16} className="mr-1" />
            {t("scc.fillMachineMoColorToEnableSpecs")}
          </p>
        )}
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r w-1/3">
                  {t("scc.parameter")}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/3">
                  {t(
                    `scc.${specType}`,
                    specType.charAt(0).toUpperCase() + specType.slice(1)
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fieldsToRender.map(
                ({ key, label, type, inputMode, readOnly, options }) => (
                  <tr key={`${specType}-${key}`}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                      {label}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {type === "select" ? (
                        <select
                          value={
                            specData?.[key] || (key === "status" ? "Pass" : "")
                          }
                          onChange={(e) =>
                            handleSpecChange(specIndex, key, e.target.value)
                          }
                          className="w-full p-1 border-gray-300 rounded-md text-sm"
                          disabled={isDisabled}
                        >
                          {options.map((opt) => (
                            <option key={opt} value={opt}>
                              {t(`scc.${opt.toLowerCase()}`, opt)}
                            </option>
                          ))}
                        </select>
                      ) : type === "textarea" ? (
                        <textarea
                          value={specData?.[key] || ""}
                          onChange={(e) =>
                            handleSpecChange(specIndex, key, e.target.value)
                          }
                          rows="2"
                          className={`w-full p-1 border-gray-300 rounded-md text-sm ${
                            readOnly ? "bg-gray-100" : ""
                          }`}
                          readOnly={readOnly}
                          disabled={isDisabled}
                        />
                      ) : (
                        <input
                          type={type}
                          inputMode={inputMode || "text"}
                          value={
                            specData?.[key] ||
                            (key === "tempOffset" && !specData?.[key]
                              ? "5"
                              : "")
                          }
                          readOnly={readOnly}
                          onChange={(e) =>
                            handleSpecChange(specIndex, key, e.target.value)
                          }
                          className={`w-full p-1 border-gray-300 rounded-md text-sm ${
                            readOnly ? "bg-gray-100" : ""
                          }`}
                          disabled={isDisabled}
                        />
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Ensure formData includes the latest operatorData before submitting to parent
        const finalFormData = {
          ...formData,
          operatorData: operatorDisplayData || formData.operatorData || null
        };
        onFormSubmit(formType, finalFormData);
      }}
      className="space-y-6"
    >
      <h2 className="text-xl font-semibold text-gray-700 mb-4">{formTitle}</h2>

      {(orderDetailsLoading || existingRecordLoading || operatorLoading) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <Loader2 className="animate-spin h-12 w-12 text-white" />
        </div>
      )}
      {recordStatusMessage && (
        <div
          className={`p-3 mb-4 rounded-md text-sm flex items-center ${
            recordStatusMessage.includes(
              t("scc.newRecordMessageKey", "new record")
            )
              ? "bg-blue-100 text-blue-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          <Info size={18} className="mr-2" /> {recordStatusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-x-6 gap-y-4 items-start">
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {/* Row 1 */}
          <div className="md:col-span-1">
            <label
              htmlFor={`${formType}-inspectionDate`}
              className="block text-sm font-medium text-gray-700"
            >
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
              className="mt-1 block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              id={`${formType}-inspectionDate`}
            />
          </div>
          <div className="md:col-span-1">
            <label
              htmlFor={`${formType}-machineNo`}
              className="block text-sm font-medium text-gray-700"
            >
              {t("scc.machineNo")}
            </label>
            <select
              id={`${formType}-machineNo`}
              name="machineNo"
              value={formData.machineNo || ""}
              onChange={handleMachineNoChange}
              className="mt-1 block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">{t("scc.selectMachine")}</option>
              {machineNoOptions.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1 relative">
            <label
              htmlFor={`${formType}-moNoSearch`}
              className="block text-sm font-medium text-gray-700"
            >
              {t("scc.moNo")}
            </label>
            <div className="relative mt-1" ref={moNoDropdownRef}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id={`${formType}-moNoSearch`}
                ref={moNoInputRef}
                value={moNoSearch}
                onChange={(e) => setMoNoSearch(e.target.value)}
                onFocus={() => setShowMoNoDropdown(moNoOptions.length > 0)}
                placeholder={t("scc.searchMoNo")}
                className="block w-full px-3 py-1.5 text-sm pl-9 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              {showMoNoDropdown && moNoOptions.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {moNoOptions.map((mo) => (
                    <li
                      key={mo}
                      onClick={() => handleMoSelect(mo)}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                    >
                      {mo}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* Row 2 */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              {t("scc.buyer")}
            </label>
            <input
              type="text"
              value={formData.buyer || ""}
              readOnly
              className="mt-1 block w-full bg-gray-100 px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              {t("scc.buyerStyle")}
            </label>
            <input
              type="text"
              value={formData.buyerStyle || ""}
              readOnly
              className="mt-1 block w-full bg-gray-100 px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div className="md:col-span-1">
            <label
              htmlFor={`${formType}-color`}
              className="block text-sm font-medium text-gray-700"
            >
              {t("scc.color")}
            </label>
            <select
              id={`${formType}-color`}
              name="color"
              value={formData.color || ""}
              onChange={handleColorChange}
              className="mt-1 block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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

        {/* Operator Data Display - Reduced width by using col-span-1 on a wider grid, or max-width */}
        <div className="xl:col-span-1 lg:max-w-xs w-full">
          {" "}
          {/* Apply max-width or adjust grid */}
          <div className="bg-slate-50 p-3 rounded-lg shadow border border-slate-200 h-full flex flex-col justify-center items-center min-h-[155px] sm:min-h-[140px]">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 self-start">
              {t("scc.operatorData")}
            </h3>
            {operatorLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            ) : operatorDisplayData && operatorDisplayData.emp_id ? (
              <div className="text-center w-full flex flex-col items-center">
                {operatorDisplayData.emp_face_photo ? (
                  <img
                    src={getFacePhotoUrl(operatorDisplayData.emp_face_photo)}
                    alt={operatorDisplayData.emp_eng_name || "Operator"}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-slate-200 mb-1"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <UserCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300 mb-1" />
                )}
                <p
                  className="text-sm font-medium text-slate-800 truncate w-full px-1"
                  title={operatorDisplayData.emp_id}
                >
                  {operatorDisplayData.emp_id}
                </p>
                <p
                  className="text-xs text-slate-500 truncate w-full px-1"
                  title={operatorDisplayData.emp_eng_name}
                >
                  {operatorDisplayData.emp_eng_name || "N/A"}
                </p>
              </div>
            ) : (
              <div className="text-center text-slate-400 flex flex-col items-center justify-center h-full">
                <UserCircle2 className="w-12 h-12 mb-1" />
                <p className="text-xs">{t("scc.noOperatorAssigned")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {renderSpecTable(
        firstSpecToRender,
        0,
        t("scc.standardSpecifications"),
        isSpecTableDisabled
      )}

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700">
          {t("scc.secondHeatSpecificationQuestion")}
        </label>
        <div className="mt-1 flex items-center space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="showSecondHeatSpec"
              value="yes"
              checked={formData.showSecondHeatSpec === true}
              onChange={handleShowSecondHeatChange}
              className="form-radio h-4 w-4 text-indigo-600"
              disabled={isSpecTableDisabled}
            />
            <span className="ml-2 text-sm text-gray-700">{t("scc.yes")}</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="showSecondHeatSpec"
              value="no"
              checked={formData.showSecondHeatSpec === false}
              onChange={handleShowSecondHeatChange}
              className="form-radio h-4 w-4 text-indigo-600"
              disabled={isSpecTableDisabled}
            />
            <span className="ml-2 text-sm text-gray-700">{t("scc.no")}</span>
          </label>
        </div>
      </div>

      {formData.showSecondHeatSpec &&
        renderSpecTable(
          secondSpecToRender,
          1,
          t("scc.specsAfterSecondHeat"),
          isSpecTableDisabled
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <SCCImageUpload
          label={t("scc.referenceSample")}
          onImageChange={(file, url) =>
            handleImageChange("referenceSample", file, url)
          }
          onImageRemove={() => handleImageRemove("referenceSample")}
          initialImageUrl={formData.referenceSampleImageUrl}
          imageType="referenceSample"
        />
        <SCCImageUpload
          label={t("scc.afterWash")}
          onImageChange={(file, url) =>
            handleImageChange("afterWash", file, url)
          }
          onImageRemove={() => handleImageRemove("afterWash")}
          initialImageUrl={formData.afterWashImageUrl}
          imageType="afterWash"
        />
      </div>

      <div className="mt-6">
        <label
          htmlFor="remarks"
          className="block text-sm font-medium text-gray-700"
        >
          {t("scc.mainRemarks")}
        </label>
        <textarea
          id="remarks"
          name="remarks"
          rows="3"
          maxLength="250"
          value={formData.remarks || ""}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder={t("scc.remarksPlaceholder")}
        ></textarea>
        <p className="mt-1 text-xs text-gray-500 text-right">
          {(formData.remarks || "").length} / 250 {t("scc.characters")}
        </p>
      </div>

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || isSpecTableDisabled}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : null}
            {formData._id ? t("scc.update") : t("scc.submit")}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SCCFirstOutputForm;
