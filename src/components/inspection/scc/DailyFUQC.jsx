// import axios from "axios";
// import {
//   CheckCircle,
//   Eye,
//   EyeOff,
//   Info,
//   Loader2,
//   Minus,
//   Plus,
//   Search,
//   XCircle,
//   History
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

// // --- Constants and Helpers ---
// const inputBaseClasses =
//   "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm";
// const inputFocusClasses = "focus:ring-indigo-500 focus:border-indigo-500";
// const inputFieldClasses = `${inputBaseClasses} ${inputFocusClasses}`;
// const inputFieldReadonlyClasses = `${inputBaseClasses} bg-gray-100 cursor-not-allowed`;
// const labelClasses = "block text-sm font-medium text-gray-700 mb-0.5";

// const getCellBGFromResult = (result) => {
//   if (result === "Pass") return "bg-green-100 text-green-700";
//   if (result === "Reject") return "bg-red-100 text-red-700";
//   if (result === "N/A") return "bg-gray-100 text-gray-500 italic";
//   return "bg-white";
// };

// const getCellBGForNA = (isNA) => {
//   return isNA ? "bg-gray-200 text-gray-500 italic" : "";
// };

// const TIME_SLOTS_CONFIG = [
//   { key: "07:00", label: "07.00", inspectionNo: 1 },
//   { key: "09:00", label: "09.00", inspectionNo: 2 },
//   { key: "12:00", label: "12.00", inspectionNo: 3 },
//   { key: "14:00", label: "2.00 PM", inspectionNo: 4 },
//   { key: "16:00", label: "4.00 PM", inspectionNo: 5 },
//   { key: "18:00", label: "6.00 PM", inspectionNo: 6 }
// ];

// const MACHINE_NUMBERS = ["001", "002", "003", "004", "005"];
// const DEFAULT_TEMP_OFFSET = 5;

// const initialSlotData = {
//   inspectionNo: 0,
//   timeSlotKey: "",
//   temp_req: null,
//   temp_actual: null,
//   temp_isNA: false,
//   result: "Pending",
//   inspectionTimestamp: null
// };

// const formatInspectionTimestamp = (timestamp) => {
//   if (!timestamp) return "";
//   try {
//     const date = new Date(timestamp);
//     if (isNaN(date.getTime())) return "";
//     return date.toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//       hour12: true
//     });
//   } catch (e) {
//     return "";
//   }
// };

// const DailyFUQC = ({
//   formData,
//   onFormDataChange,
//   onFormSubmit,
//   isSubmitting,
//   formType
// }) => {
//   const { t } = useTranslation();
//   const { user } = useAuth();

//   const [localFormData, setLocalFormData] = useState(() => {
//     const initialSlots = TIME_SLOTS_CONFIG.reduce((acc, slot) => {
//       acc[slot.key] = {
//         ...initialSlotData,
//         inspectionNo: slot.inspectionNo,
//         timeSlotKey: slot.key
//       };
//       return acc;
//     }, {});
//     return {
//       ...formData,
//       slotsDetailed: initialSlots,
//       remarks: formData.remarks || "",
//       temp_offset:
//         formData.temp_offset !== undefined
//           ? formData.temp_offset
//           : DEFAULT_TEMP_OFFSET
//     };
//   });

//   const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
//   const [moNoOptions, setMoNoOptions] = useState([]);
//   const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
//   const [availableColors, setAvailableColors] = useState([]);
//   const [availableMachineRecords, setAvailableMachineRecords] = useState([]); // For existing MOs dropdown
//   const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
//   const [baseTempLoading, setBaseTempLoading] = useState(false);
//   const [existingQCRecordLoading, setExistingQCRecordLoading] = useState(false); // For loading specific MO/Color record
//   const [machineRecordsLoading, setMachineRecordsLoading] = useState(false); // For loading list of MOs for a machine

//   const [recordStatusMessage, setRecordStatusMessage] = useState("");
//   const [currentActiveSlotKey, setCurrentActiveSlotKey] = useState(null);
//   const [showHistory, setShowHistory] = useState(false);

//   const moNoInputRef = useRef(null);
//   const moNoDropdownRef = useRef(null);

//   const loading =
//     orderDetailsLoading ||
//     baseTempLoading ||
//     existingQCRecordLoading ||
//     machineRecordsLoading ||
//     isSubmitting;

//   // Sync localFormData with formData prop from parent
//   useEffect(() => {
//     setMoNoSearch(formData.moNo || ""); // Sync search field if parent changes MO
//     const newSlotsDetailed = TIME_SLOTS_CONFIG.reduce((acc, slotConf) => {
//       const existingInsp = formData.inspections?.find(
//         (i) => i.timeSlotKey === slotConf.key
//       );
//       acc[slotConf.key] = existingInsp
//         ? {
//             ...initialSlotData,
//             ...existingInsp,
//             temp_req: Number(existingInsp.temp_req),
//             temp_actual:
//               existingInsp.temp_actual !== null
//                 ? Number(existingInsp.temp_actual)
//                 : null,
//             inspectionTimestamp: existingInsp.inspectionTimestamp || null
//           }
//         : {
//             ...initialSlotData,
//             inspectionNo: slotConf.inspectionNo,
//             timeSlotKey: slotConf.key
//           };
//       return acc;
//     }, {});

//     setLocalFormData((prev) => ({
//       ...prev, // Keep local UI states like showHistory
//       ...formData, // Sync with all data from parent
//       slotsDetailed: newSlotsDetailed,
//       remarks: formData.remarks || "",
//       temp_offset:
//         formData.temp_offset !== undefined
//           ? formData.temp_offset
//           : DEFAULT_TEMP_OFFSET
//     }));
//   }, [formData]);

//   // Function to update parent (SCCPage)
//   const updateParentFormData = useCallback(
//     (dataToUpdate) => {
//       const inspectionsArray = Object.values(dataToUpdate.slotsDetailed)
//         .filter(
//           (slot) =>
//             slot.result !== "Pending" ||
//             slot.temp_isNA ||
//             slot.temp_actual !== null ||
//             slot.temp_req !== null
//         )
//         .map((slot) => ({
//           inspectionNo: slot.inspectionNo,
//           timeSlotKey: slot.timeSlotKey,
//           temp_req: slot.temp_req !== null ? Number(slot.temp_req) : null,
//           temp_actual:
//             slot.temp_actual !== null ? Number(slot.temp_actual) : null,
//           temp_isNA: slot.temp_isNA,
//           result: slot.result,
//           inspectionTimestamp: slot.inspectionTimestamp
//         }));

//       onFormDataChange({
//         _id: dataToUpdate._id,
//         inspectionDate: dataToUpdate.inspectionDate,
//         machineNo: dataToUpdate.machineNo,
//         moNo: dataToUpdate.moNo,
//         buyer: dataToUpdate.buyer,
//         buyerStyle: dataToUpdate.buyerStyle,
//         color: dataToUpdate.color,
//         baseReqTemp:
//           dataToUpdate.baseReqTemp !== null
//             ? Number(dataToUpdate.baseReqTemp)
//             : null,
//         temp_offset: Number(dataToUpdate.temp_offset),
//         inspections: inspectionsArray,
//         remarks: dataToUpdate.remarks
//       });
//     },
//     [onFormDataChange]
//   );

//   // Reset detailed slots in local state
//   const resetLocalDetailedSlots = (
//     currentLocalData,
//     preserveBaseTemp = false
//   ) => {
//     const newSlots = {};
//     TIME_SLOTS_CONFIG.forEach((slot) => {
//       newSlots[slot.key] = {
//         ...initialSlotData,
//         inspectionNo: slot.inspectionNo,
//         timeSlotKey: slot.key,
//         temp_req: preserveBaseTemp ? currentLocalData.baseReqTemp : null, // Preserve if told to
//         temp_actual: preserveBaseTemp ? currentLocalData.baseReqTemp : null
//       };
//     });
//     return { ...currentLocalData, slotsDetailed: newSlots };
//   };

//   const clearAndResetFormForNewMo = (prevLocalData) => {
//     let newData = {
//       ...prevLocalData,
//       moNo: "",
//       color: "",
//       buyer: "",
//       buyerStyle: "",
//       _id: null,
//       baseReqTemp: null,
//       remarks: "",
//       inspections: []
//       // temp_offset: DEFAULT_TEMP_OFFSET, // Keep user's temp_offset setting
//     };
//     newData = resetLocalDetailedSlots(newData, false); // Don't preserve base temp for totally new MO
//     setMoNoSearch("");
//     setAvailableColors([]);
//     // availableMachineRecords will be refetched by handleMachineNoChange effect
//     setCurrentActiveSlotKey(TIME_SLOTS_CONFIG[0]?.key || null); // Reset to first slot
//     setRecordStatusMessage(t("sccDailyFUQC.enterNewMo"));
//     setShowHistory(false);
//     updateParentFormData(newData); // Update parent with cleared fields
//     return newData;
//   };

//   const handleDateChange = (date) => {
//     setLocalFormData((prev) => {
//       // When date changes, we assume a completely new context
//       let newLocalData = {
//         ...prev,
//         inspectionDate: date,
//         moNo: "",
//         color: "",
//         buyer: "",
//         buyerStyle: "",
//         _id: null,
//         baseReqTemp: null,
//         remarks: "",
//         inspections: [],
//         temp_offset: DEFAULT_TEMP_OFFSET
//       };
//       newLocalData = resetLocalDetailedSlots(newLocalData);
//       setMoNoSearch("");
//       setAvailableColors([]);
//       setAvailableMachineRecords([]);
//       setCurrentActiveSlotKey(null);
//       setRecordStatusMessage("");
//       setShowHistory(false);
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   // When Machine No changes, fetch available MOs for that machine and date
//   const handleMachineNoChange = (e) => {
//     const machineNo = e.target.value;
//     setLocalFormData((prev) => {
//       let newLocalData = {
//         ...prev,
//         machineNo,
//         moNo: "",
//         color: "",
//         buyer: "",
//         buyerStyle: "",
//         _id: null,
//         baseReqTemp: null,
//         remarks: "",
//         inspections: [],
//         temp_offset: DEFAULT_TEMP_OFFSET
//       };
//       newLocalData = resetLocalDetailedSlots(newLocalData);
//       setMoNoSearch("");
//       setAvailableColors([]);
//       setAvailableMachineRecords([]);
//       setCurrentActiveSlotKey(null);
//       setRecordStatusMessage("");
//       setShowHistory(false);
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   // Fetch MO Numbers for search dropdown
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
//       if (moNoSearch !== localFormData.moNo || !localFormData.moNo) {
//         fetchMoNumbers();
//       }
//     }, 300);
//     return () => clearTimeout(delayDebounceFn);
//   }, [moNoSearch, fetchMoNumbers, localFormData.moNo]);

//   // When user selects an MO from the search dropdown
//   const handleMoSelect = (selectedMo) => {
//     setMoNoSearch(selectedMo); // Update the search input for display
//     setShowMoNoDropdown(false);
//     setLocalFormData((prev) => {
//       // Reset for the newly selected MO, but keep date, machine, temp_offset
//       let newLocalData = {
//         ...prev,
//         moNo: selectedMo,
//         color: "",
//         buyer: "",
//         buyerStyle: "",
//         _id: null,
//         baseReqTemp: null,
//         remarks: "",
//         inspections: []
//       };
//       newLocalData = resetLocalDetailedSlots(newLocalData, false); // Don't preserve base temp for new MO
//       setRecordStatusMessage("");
//       setShowHistory(false);
//       // Order details and specific record will be fetched by other useEffects
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   // Fetch Order Details when MO No. changes (and is valid)
//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       if (!localFormData.moNo) {
//         if (localFormData.buyer || localFormData.buyerStyle) {
//           setLocalFormData((p) => {
//             const ud = { ...p, buyer: "", buyerStyle: "" };
//             updateParentFormData(ud);
//             return ud;
//           });
//         }
//         setAvailableColors([]);
//         return;
//       }
//       setOrderDetailsLoading(true);
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/order-details/${localFormData.moNo}`
//         );
//         const details = response.data;
//         setLocalFormData((prev) => {
//           const nd = {
//             ...prev,
//             buyer: details.engName || "N/A",
//             buyerStyle: details.custStyle || "N/A"
//           };
//           updateParentFormData(nd);
//           return nd;
//         });
//         setAvailableColors(details.colors || []);
//         // If a color was previously selected for a different MO, it might need reset if not in new availableColors
//         if (
//           localFormData.color &&
//           !details.colors?.find((c) => c.original === localFormData.color)
//         ) {
//           setLocalFormData((prev) => {
//             const nd = { ...prev, color: "" };
//             updateParentFormData(nd);
//             return nd;
//           });
//         }
//       } catch (error) {
//         console.error(t("scc.errorFetchingOrderDetailsLog"), error);
//         setLocalFormData((prev) => {
//           const nd = { ...prev, buyer: "", buyerStyle: "", color: "" };
//           updateParentFormData(nd);
//           return nd;
//         });
//         setAvailableColors([]);
//       } finally {
//         setOrderDetailsLoading(false);
//       }
//     };
//     if (localFormData.moNo) fetchOrderDetails();
//     else {
//       if (localFormData.buyer || localFormData.buyerStyle) {
//         setLocalFormData((p) => {
//           const ud = { ...p, buyer: "", buyerStyle: "" };
//           updateParentFormData(ud);
//           return ud;
//         });
//       }
//       setAvailableColors([]);
//     }
//   }, [localFormData.moNo, t, updateParentFormData]);

//   // When color changes, reset subsequent fields and fetch specific record or prepare for new
//   const handleColorChange = (e) => {
//     const newColor = e.target.value;
//     setLocalFormData((prev) => {
//       let newLocalData = {
//         ...prev,
//         color: newColor,
//         _id: null,
//         baseReqTemp: null,
//         remarks: "",
//         inspections: []
//       };
//       newLocalData = resetLocalDetailedSlots(newLocalData, false); // Don't preserve base temp for new color
//       setRecordStatusMessage("");
//       setShowHistory(false);
//       // Specific record will be fetched by useEffect watching for moNo, color, date, machineNo
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const handleRemarksChange = (e) => {
//     setLocalFormData((prev) => {
//       const newLocalData = { ...prev, remarks: e.target.value };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const handleTempOffsetChange = (e) => {
//     const offsetValue = e.target.value;
//     const numOffset = offsetValue === "" ? null : Number(offsetValue);
//     setLocalFormData((prev) => {
//       const newLocalData = {
//         ...prev,
//         temp_offset: numOffset === null ? DEFAULT_TEMP_OFFSET : numOffset
//       };
//       if (
//         currentActiveSlotKey &&
//         newLocalData.slotsDetailed[currentActiveSlotKey]
//       ) {
//         const slot = newLocalData.slotsDetailed[currentActiveSlotKey];
//         if (
//           !slot.temp_isNA &&
//           slot.temp_actual !== null &&
//           slot.temp_req !== null
//         ) {
//           const diff = Math.abs(slot.temp_actual - slot.temp_req);
//           slot.result =
//             diff <= (newLocalData.temp_offset || 0) ? "Pass" : "Reject";
//         }
//       }
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const fetchBaseTemperature = useCallback(
//     async (
//       moNoToFetch,
//       colorToFetch,
//       inspectionDateToFetch,
//       activeSlotKeyForUpdate
//     ) => {
//       if (!moNoToFetch || !colorToFetch || !inspectionDateToFetch) return;
//       setBaseTempLoading(true);
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/scc/fu-first-output-temp`,
//           {
//             params: {
//               moNo: moNoToFetch,
//               color: colorToFetch,
//               inspectionDate:
//                 inspectionDateToFetch instanceof Date
//                   ? inspectionDateToFetch.toISOString()
//                   : inspectionDateToFetch
//             }
//           }
//         );
//         let newBaseReqTemp = null;
//         if (response.data && response.data.tempC !== undefined) {
//           newBaseReqTemp =
//             response.data.tempC !== null ? Number(response.data.tempC) : null;
//         }

//         setLocalFormData((prevLocalData) => {
//           const updatedSlotsDetailed = { ...prevLocalData.slotsDetailed };
//           Object.keys(updatedSlotsDetailed).forEach((slotKey) => {
//             const slot = updatedSlotsDetailed[slotKey];
//             slot.temp_req = newBaseReqTemp; // Update req temp for all slots
//             if (!slot.temp_isNA && slot.temp_actual === null) {
//               // If actual is not set and not N/A, default to req
//               slot.temp_actual = newBaseReqTemp;
//             }
//             // Re-calculate result for all slots based on new req temp
//             if (
//               !slot.temp_isNA &&
//               slot.temp_actual !== null &&
//               newBaseReqTemp !== null
//             ) {
//               const diff = Math.abs(slot.temp_actual - newBaseReqTemp);
//               slot.result =
//                 diff <= (prevLocalData.temp_offset || 0) ? "Pass" : "Reject";
//             } else if (slot.temp_isNA) {
//               slot.result = "N/A";
//             }
//           });
//           const newLocalData = {
//             ...prevLocalData,
//             baseReqTemp: newBaseReqTemp,
//             slotsDetailed: updatedSlotsDetailed
//           };
//           updateParentFormData(newLocalData);
//           return newLocalData;
//         });
//       } catch (error) {
//         console.error(t("sccDailyFUQC.errorFetchingFuSpecsLog"), error);
//         setLocalFormData((prevLocalData) => {
//           const nd = { ...prevLocalData, baseReqTemp: null };
//           updateParentFormData(nd);
//           return nd;
//         });
//       } finally {
//         setBaseTempLoading(false);
//       }
//     },
//     [t, updateParentFormData]
//   );

//   useEffect(() => {
//     // Fetch base temp if MO, Color, Date are set (could be for new or loading existing)
//     if (
//       localFormData.moNo &&
//       localFormData.color &&
//       localFormData.inspectionDate
//     ) {
//       fetchBaseTemperature(
//         localFormData.moNo,
//         localFormData.color,
//         localFormData.inspectionDate,
//         currentActiveSlotKey
//       );
//     }
//   }, [
//     localFormData.moNo,
//     localFormData.color,
//     localFormData.inspectionDate,
//     fetchBaseTemperature,
//     currentActiveSlotKey
//   ]);

//   // Effect to auto-set current slot's req and actual based on baseReqTemp and evaluate result
//   useEffect(() => {
//     if (
//       currentActiveSlotKey &&
//       localFormData.slotsDetailed &&
//       localFormData.slotsDetailed[currentActiveSlotKey] &&
//       localFormData.baseReqTemp !== null
//     ) {
//       setLocalFormData((prevLocalData) => {
//         const currentSlotsDetailed = { ...prevLocalData.slotsDetailed };
//         const slotToUpdate = { ...currentSlotsDetailed[currentActiveSlotKey] };
//         let hasChanged = false;
//         if (slotToUpdate.temp_req !== prevLocalData.baseReqTemp) {
//           slotToUpdate.temp_req = prevLocalData.baseReqTemp;
//           hasChanged = true;
//         }
//         if (slotToUpdate.temp_actual === null && !slotToUpdate.temp_isNA) {
//           slotToUpdate.temp_actual = prevLocalData.baseReqTemp;
//           hasChanged = true;
//         }
//         if (
//           !slotToUpdate.temp_isNA &&
//           slotToUpdate.temp_actual !== null &&
//           slotToUpdate.temp_req !== null
//         ) {
//           const diff = Math.abs(
//             slotToUpdate.temp_actual - slotToUpdate.temp_req
//           );
//           const newResult =
//             diff <= (prevLocalData.temp_offset || 0) ? "Pass" : "Reject";
//           if (slotToUpdate.result !== newResult) {
//             slotToUpdate.result = newResult;
//             hasChanged = true;
//           }
//         }
//         if (hasChanged) {
//           const newSlotsDetailedState = {
//             ...currentSlotsDetailed,
//             [currentActiveSlotKey]: slotToUpdate
//           };
//           return { ...prevLocalData, slotsDetailed: newSlotsDetailedState };
//         }
//         return prevLocalData;
//       });
//     }
//   }, [
//     currentActiveSlotKey,
//     localFormData.baseReqTemp,
//     localFormData.temp_offset
//   ]);

//   // Main data fetching logic for the form (existing records or list of MOs)
//   const fetchDailyFUQCData = useCallback(
//     async (date, machine, mo, clr) => {
//       if (!date || !machine) return;
//       setExistingQCRecordLoading(true);
//       setRecordStatusMessage("");
//       setShowHistory(false);
//       setAvailableMachineRecords([]); // Clear previous list of MOs

//       try {
//         const params = {
//           inspectionDate: date instanceof Date ? date.toISOString() : date,
//           machineNo: machine
//         };
//         if (mo && clr) {
//           params.moNo = mo;
//           params.color = clr;
//         }

//         const response = await axios.get(
//           `${API_BASE_URL}/api/scc/daily-fuqc-test`,
//           { params }
//         );
//         const { message, data } = response.data;

//         if (
//           message === "DAILY_FUQC_RECORD_NOT_FOUND" &&
//           params.moNo &&
//           params.color
//         ) {
//           // Specific MO/Color not found
//           setRecordStatusMessage(t("sccDailyFUQC.newRecordForMoColor"));
//           const firstSlotKey = TIME_SLOTS_CONFIG[0]?.key || null;
//           setCurrentActiveSlotKey(firstSlotKey);
//           // Reset slots, but baseReqTemp might have been fetched by another effect if MO/Color/Date are set
//           setLocalFormData((prev) => {
//             let newLocalState = {
//               ...prev,
//               _id: null,
//               inspections: [],
//               remarks: "",
//               moNo: mo,
//               color: clr
//             }; // Ensure current mo/color are set
//             newLocalState = resetLocalDetailedSlots(newLocalState, true); // Preserve base temp if available
//             return newLocalState;
//           });
//           // Base temp should be fetched if not already via the dedicated useEffect
//           if (!localFormData.baseReqTemp) {
//             fetchBaseTemperature(mo, clr, date, firstSlotKey);
//           }
//         } else if (message === "NO_RECORDS_FOR_DATE_MACHINE" && !params.moNo) {
//           // No records at all for this date/machine
//           setRecordStatusMessage(t("sccDailyFUQC.newRecord"));
//           setCurrentActiveSlotKey(TIME_SLOTS_CONFIG[0]?.key || null);
//           setLocalFormData((prev) =>
//             clearAndResetFormForNewMo({
//               ...prev,
//               inspectionDate: date,
//               machineNo: machine
//             })
//           );
//         } else if (message === "RECORD_FOUND" && data) {
//           // Specific record found
//           setRecordStatusMessage(t("sccDailyFUQC.recordLoaded"));
//           const populatedSlots = TIME_SLOTS_CONFIG.reduce((acc, slotConf) => {
//             const existingInsp = (data.inspections || []).find(
//               (i) => i.timeSlotKey === slotConf.key
//             );
//             acc[slotConf.key] = existingInsp
//               ? {
//                   ...initialSlotData,
//                   ...existingInsp,
//                   temp_req: Number(existingInsp.temp_req),
//                   temp_actual:
//                     existingInsp.temp_actual !== null
//                       ? Number(existingInsp.temp_actual)
//                       : null,
//                   inspectionTimestamp: existingInsp.inspectionTimestamp || null
//                 }
//               : {
//                   ...initialSlotData,
//                   inspectionNo: slotConf.inspectionNo,
//                   timeSlotKey: slotConf.key,
//                   temp_req: data.baseReqTemp,
//                   temp_actual: data.baseReqTemp,
//                   inspectionTimestamp: null
//                 };
//             return acc;
//           }, {});
//           const lastSubmittedInspNo =
//             (data.inspections || []).length > 0
//               ? Math.max(...data.inspections.map((i) => i.inspectionNo))
//               : 0;
//           const nextInspNo = lastSubmittedInspNo + 1;
//           const activeSlotConfig = TIME_SLOTS_CONFIG.find(
//             (s) => s.inspectionNo === nextInspNo
//           );
//           setCurrentActiveSlotKey(
//             activeSlotConfig ? activeSlotConfig.key : null
//           );
//           setLocalFormData((prev) => ({
//             ...prev,
//             _id: data._id,
//             moNo: data.moNo,
//             buyer: data.buyer,
//             buyerStyle: data.buyerStyle,
//             color: data.color,
//             baseReqTemp:
//               data.baseReqTemp !== null ? Number(data.baseReqTemp) : null,
//             temp_offset:
//               data.temp_offset !== undefined
//                 ? data.temp_offset
//                 : DEFAULT_TEMP_OFFSET,
//             remarks: data.remarks || "",
//             inspections: data.inspections || [],
//             slotsDetailed: populatedSlots
//           }));
//           setMoNoSearch(data.moNo || "");
//           if (data.baseReqTemp === null && data.moNo && data.color) {
//             fetchBaseTemperature(
//               data.moNo,
//               data.color,
//               date,
//               activeSlotConfig ? activeSlotConfig.key : null
//             );
//           }
//         } else if (message === "MULTIPLE_MO_COLOR_FOUND" && data.length > 0) {
//           // Multiple MOs for date/machine
//           setRecordStatusMessage(
//             t("sccDailyFUQC.selectMoColorMachine", { machineNo: machine })
//           );
//           setAvailableMachineRecords(data);
//           setCurrentActiveSlotKey(null); // No active slot until MO/Color selected from dropdown
//           // Clear MO/Color specific fields but keep date/machine
//           setLocalFormData((prev) => ({
//             ...prev,
//             moNo: "",
//             color: "",
//             buyer: "",
//             buyerStyle: "",
//             _id: null,
//             baseReqTemp: null,
//             remarks: "",
//             inspections: [],
//             slotsDetailed: TIME_SLOTS_CONFIG.reduce((acc, slot) => {
//               acc[slot.key] = {
//                 ...initialSlotData,
//                 inspectionNo: slot.inspectionNo,
//                 timeSlotKey: slot.key
//               };
//               return acc;
//             }, {})
//           }));
//           setMoNoSearch("");
//         } else {
//           // Fallback
//           setRecordStatusMessage(t("sccDailyFUQC.newRecord"));
//           setCurrentActiveSlotKey(TIME_SLOTS_CONFIG[0]?.key || null);
//           setLocalFormData((prev) =>
//             clearAndResetFormForNewMo({
//               ...prev,
//               inspectionDate: date,
//               machineNo: machine
//             })
//           );
//         }
//       } catch (error) {
//         console.error(t("sccDailyFUQC.errorLoadingRecord"), error);
//         Swal.fire(
//           t("scc.error"),
//           t("sccDailyFUQC.errorLoadingRecordMsg"),
//           "error"
//         );
//         setLocalFormData((prev) =>
//           clearAndResetFormForNewMo({
//             ...prev,
//             inspectionDate: date,
//             machineNo: machine
//           })
//         );
//       } finally {
//         setExistingQCRecordLoading(false);
//         setMachineRecordsLoading(false);
//       }
//     },
//     [t, fetchBaseTemperature, updateParentFormData, localFormData.baseReqTemp]
//   ); // Added localFormData.baseReqTemp as it's used in reset

//   // Effect to trigger data fetching when primary keys (date, machine) change
//   useEffect(() => {
//     if (localFormData.inspectionDate && localFormData.machineNo) {
//       // If MO and Color are also set, fetch that specific record.
//       // Otherwise, fetch to see if there are multiple MOs for the date/machine or if it's a new context.
//       fetchDailyFUQCData(
//         localFormData.inspectionDate,
//         localFormData.machineNo,
//         localFormData.moNo,
//         localFormData.color
//       );
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [localFormData.inspectionDate, localFormData.machineNo]); // Only these should trigger the initial fetch or list of MOs

//   // Effect to fetch specific record when MO/Color are selected from the list
//   useEffect(() => {
//     if (
//       localFormData.inspectionDate &&
//       localFormData.machineNo &&
//       localFormData.moNo &&
//       localFormData.color
//     ) {
//       fetchDailyFUQCData(
//         localFormData.inspectionDate,
//         localFormData.machineNo,
//         localFormData.moNo,
//         localFormData.color
//       );
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [localFormData.moNo, localFormData.color]); // Re-fetch specific record when MO/Color changes

//   const handleSlotActualTempChange = (slotKey, value) => {
//     setLocalFormData((prev) => {
//       const newSlotsDetailed = { ...prev.slotsDetailed };
//       const slot = { ...newSlotsDetailed[slotKey] };
//       if (!slot || slot.temp_isNA) return prev;
//       slot.temp_actual = value === "" || value === null ? null : Number(value);
//       if (
//         !slot.temp_isNA &&
//         slot.temp_actual !== null &&
//         slot.temp_req !== null
//       ) {
//         const diff = Math.abs(slot.temp_actual - slot.temp_req);
//         slot.result = diff <= (prev.temp_offset || 0) ? "Pass" : "Reject";
//       } else if (slot.temp_isNA) {
//         slot.result = "N/A";
//       } else {
//         slot.result = "Pending";
//       }
//       newSlotsDetailed[slotKey] = slot;
//       const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const handleSlotTempIncrementDecrement = (slotKey, action) => {
//     setLocalFormData((prev) => {
//       const newSlotsDetailed = { ...prev.slotsDetailed };
//       const slot = { ...newSlotsDetailed[slotKey] };
//       if (!slot || slot.temp_isNA) return prev;
//       let currentValue = parseFloat(slot.temp_actual);
//       if (isNaN(currentValue)) {
//         currentValue = parseFloat(slot.temp_req);
//         if (isNaN(currentValue)) currentValue = 0;
//       }
//       if (action === "increment") currentValue += 1;
//       if (action === "decrement") currentValue -= 1;
//       slot.temp_actual = currentValue;
//       if (
//         !slot.temp_isNA &&
//         slot.temp_actual !== null &&
//         slot.temp_req !== null
//       ) {
//         const diff = Math.abs(slot.temp_actual - slot.temp_req);
//         slot.result = diff <= (prev.temp_offset || 0) ? "Pass" : "Reject";
//       } else if (slot.temp_isNA) {
//         slot.result = "N/A";
//       } else {
//         slot.result = "Pending";
//       }
//       newSlotsDetailed[slotKey] = slot;
//       const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const toggleSlotTempNA = (slotKey) => {
//     setLocalFormData((prev) => {
//       const newSlotsDetailed = { ...prev.slotsDetailed };
//       const slot = { ...newSlotsDetailed[slotKey] };
//       if (!slot) return prev;
//       slot.temp_isNA = !slot.temp_isNA;
//       if (slot.temp_isNA) {
//         slot.temp_actual = null;
//         slot.result = "N/A";
//       } else {
//         slot.temp_actual =
//           slot.temp_actual === null ? slot.temp_req : slot.temp_actual;
//         if (slot.temp_actual !== null && slot.temp_req !== null) {
//           const diff = Math.abs(slot.temp_actual - slot.temp_req);
//           slot.result = diff <= (prev.temp_offset || 0) ? "Pass" : "Reject";
//         } else {
//           slot.result = "Pending";
//         }
//       }
//       newSlotsDetailed[slotKey] = slot;
//       const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const handleSlotResultChange = (slotKey, resultValue) => {
//     setLocalFormData((prev) => {
//       const newSlotsDetailed = { ...prev.slotsDetailed };
//       const slot = { ...newSlotsDetailed[slotKey] };
//       if (!slot || slot.temp_isNA) return prev;
//       slot.result = resultValue;
//       newSlotsDetailed[slotKey] = slot;
//       const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const handleFormActualSubmit = async () => {
//     // Made async for potential re-fetch
//     if (
//       !localFormData.inspectionDate ||
//       !localFormData.machineNo ||
//       !localFormData.moNo ||
//       !localFormData.color
//     ) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyFUQC.validation.fillBasic"),
//         "warning"
//       );
//       return;
//     }
//     if (!currentActiveSlotKey) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyFUQC.validation.allSlotsDone"),
//         "info"
//       );
//       return;
//     }
//     const activeSlotData = localFormData.slotsDetailed[currentActiveSlotKey];
//     if (!activeSlotData) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         "Error: Active slot data not found.",
//         "error"
//       );
//       return;
//     }
//     if (activeSlotData.temp_req === null && !baseTempLoading) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyFUQC.validation.tempReqMissing"),
//         "warning"
//       );
//       return;
//     }
//     if (!activeSlotData.temp_isNA && activeSlotData.temp_actual === null) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyFUQC.validation.fillActualTemp"),
//         "warning"
//       );
//       return;
//     }
//     if (activeSlotData.result === "Pending" && !activeSlotData.temp_isNA) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyFUQC.validation.selectResultActiveSlot"),
//         "warning"
//       );
//       return;
//     }

//     const payloadForParent = {
//       _id: localFormData._id,
//       inspectionDate: localFormData.inspectionDate,
//       machineNo: localFormData.machineNo,
//       moNo: localFormData.moNo,
//       buyer: localFormData.buyer,
//       buyerStyle: localFormData.buyerStyle,
//       color: localFormData.color,
//       baseReqTemp:
//         localFormData.baseReqTemp !== null
//           ? Number(localFormData.baseReqTemp)
//           : null,
//       temp_offset: Number(localFormData.temp_offset),
//       remarks: localFormData.remarks?.trim() || "NA",
//       emp_id: user.emp_id,
//       emp_kh_name: user.kh_name,
//       emp_eng_name: user.eng_name,
//       emp_dept_name: user.dept_name,
//       emp_sect_name: user.sect_name,
//       emp_job_title: user.job_title,
//       currentInspection: {
//         inspectionNo: activeSlotData.inspectionNo,
//         timeSlotKey: activeSlotData.timeSlotKey,
//         temp_req:
//           activeSlotData.temp_req !== null
//             ? Number(activeSlotData.temp_req)
//             : null,
//         temp_actual:
//           activeSlotData.temp_actual !== null
//             ? Number(activeSlotData.temp_actual)
//             : null,
//         temp_isNA: activeSlotData.temp_isNA,
//         result: activeSlotData.temp_isNA ? "N/A" : activeSlotData.result,
//         inspectionTimestamp: new Date()
//       }
//     };

//     try {
//       await onFormSubmit(formType, payloadForParent); // onFormSubmit is from SCCPage
//       // After successful submission, SCCPage will reset its formData prop.
//       // The useEffect watching formData in this component will then re-sync localFormData.
//       // To ensure history updates immediately, we can re-trigger the fetch for the current context.
//       if (
//         localFormData.inspectionDate &&
//         localFormData.machineNo &&
//         localFormData.moNo &&
//         localFormData.color
//       ) {
//         fetchDailyFUQCData(
//           localFormData.inspectionDate,
//           localFormData.machineNo,
//           localFormData.moNo,
//           localFormData.color
//         );
//       } else if (localFormData.inspectionDate && localFormData.machineNo) {
//         fetchDailyFUQCData(
//           localFormData.inspectionDate,
//           localFormData.machineNo,
//           null,
//           null
//         ); // Fetch list of MOs if MO was cleared
//       }
//       // setShowHistory(true); // Optionally auto-show history after submit
//     } catch (error) {
//       // Error handling is typically done in onFormSubmit within SCCPage
//       console.error("Submission error caught in DailyFUQC", error);
//     }
//   };

//   const currentSlotTableTitle = useMemo(() => {
//     if (!currentActiveSlotKey) return t("sccDailyFUQC.noActiveSlot");
//     const slotConfig = TIME_SLOTS_CONFIG.find(
//       (s) => s.key === currentActiveSlotKey
//     );
//     if (!slotConfig) return t("sccDailyFUQC.noActiveSlot");
//     return `${t("sccDailyFUQC.currentInspectionSlot")}: ${slotConfig.label} (#${
//       slotConfig.inspectionNo
//     })`;
//   }, [currentActiveSlotKey, t]);

//   const renderCurrentSlotTable = () => {
//     if (!currentActiveSlotKey) return null;
//     const currentSlot = localFormData.slotsDetailed[currentActiveSlotKey];
//     if (!currentSlot) return null;

//     return (
//       <div className="border border-gray-300 rounded-lg shadow-sm bg-white overflow-hidden">
//         <table className="min-w-full text-xs divide-y divide-gray-200">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="px-3 py-2 text-center font-semibold text-gray-700 border-r w-1/3">
//                 {t("sccDailyFUQC.reqTemp")} (°C)
//               </th>
//               <th className="px-3 py-2 text-center font-semibold text-gray-700 border-r w-1/3">
//                 {t("sccDailyFUQC.actualTemp")} (°C)
//               </th>
//               <th className="px-3 py-2 text-center font-semibold text-gray-700 w-1/3">
//                 {t("sccDailyFUQC.result")}
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             <tr
//               className={`hover:bg-gray-50 ${getCellBGFromResult(
//                 currentSlot.result
//               )}`}
//             >
//               <td className="px-3 py-2 border-r text-center">
//                 {currentSlot.temp_req !== null ? (
//                   currentSlot.temp_req
//                 ) : baseTempLoading ? (
//                   <Loader2 size={14} className="animate-spin inline-block" />
//                 ) : (
//                   "N/A"
//                 )}
//               </td>
//               <td
//                 className={`px-1.5 py-1.5 border-r text-center ${getCellBGForNA(
//                   currentSlot.temp_isNA
//                 )}`}
//               >
//                 {currentSlot.temp_isNA ? (
//                   <span className="italic text-gray-500">{t("scc.na")}</span>
//                 ) : (
//                   <input
//                     type="number"
//                     inputMode="numeric"
//                     value={
//                       currentSlot.temp_actual !== null
//                         ? currentSlot.temp_actual
//                         : ""
//                     }
//                     onChange={(e) =>
//                       handleSlotActualTempChange(
//                         currentActiveSlotKey,
//                         e.target.value
//                       )
//                     }
//                     className={`${inputFieldClasses} text-center text-xs p-1 w-full mb-1`}
//                     disabled={
//                       currentSlot.temp_isNA ||
//                       (currentSlot.temp_req === null && !baseTempLoading)
//                     }
//                   />
//                 )}
//                 <div className="flex justify-center items-center space-x-2 mt-1">
//                   {!currentSlot.temp_isNA &&
//                     (currentSlot.temp_req !== null || baseTempLoading) && (
//                       <>
//                         <button
//                           type="button"
//                           onClick={() =>
//                             handleSlotTempIncrementDecrement(
//                               currentActiveSlotKey,
//                               "decrement"
//                             )
//                           }
//                           className="p-1 hover:bg-gray-200 rounded-full disabled:opacity-50"
//                           disabled={
//                             currentSlot.temp_isNA ||
//                             (currentSlot.temp_req === null && !baseTempLoading)
//                           }
//                         >
//                           <Minus size={12} />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() =>
//                             handleSlotTempIncrementDecrement(
//                               currentActiveSlotKey,
//                               "increment"
//                             )
//                           }
//                           className="p-1 hover:bg-gray-200 rounded-full disabled:opacity-50"
//                           disabled={
//                             currentSlot.temp_isNA ||
//                             (currentSlot.temp_req === null && !baseTempLoading)
//                           }
//                         >
//                           <Plus size={12} />
//                         </button>
//                       </>
//                     )}
//                   <button
//                     type="button"
//                     onClick={() => toggleSlotTempNA(currentActiveSlotKey)}
//                     className="p-1 hover:bg-gray-200 rounded-full disabled:opacity-50"
//                     disabled={
//                       currentSlot.temp_req === null &&
//                       !baseTempLoading &&
//                       !currentSlot.temp_isNA
//                     }
//                   >
//                     {currentSlot.temp_isNA ? (
//                       <EyeOff size={12} className="text-gray-500" />
//                     ) : (
//                       <Eye size={12} />
//                     )}
//                   </button>
//                 </div>
//               </td>
//               <td className={`px-1.5 py-1.5 text-center`}>
//                 <select
//                   value={currentSlot.result}
//                   onChange={(e) =>
//                     handleSlotResultChange(currentActiveSlotKey, e.target.value)
//                   }
//                   className={`${inputFieldClasses} text-center text-xs p-1 w-full ${getCellBGFromResult(
//                     currentSlot.result
//                   )}`}
//                   disabled={
//                     currentSlot.temp_isNA ||
//                     (currentSlot.temp_req === null && !baseTempLoading)
//                   }
//                 >
//                   <option value="Pending">{t("scc.pending")}</option>
//                   <option value="Pass">{t("scc.pass")}</option>
//                   <option value="Reject">{t("scc.reject")}</option>
//                 </select>
//               </td>
//             </tr>
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   const renderPreviousRecordsTable = () => {
//     if (!showHistory) return null;

//     const currentSlotConfig = currentActiveSlotKey
//       ? TIME_SLOTS_CONFIG.find((s) => s.key === currentActiveSlotKey)
//       : null;
//     const currentSlotInspectionNo = currentSlotConfig
//       ? currentSlotConfig.inspectionNo
//       : Infinity;

//     // Use localFormData.slotsDetailed to show the most up-to-date state before full parent sync might happen
//     const submittedInspections = Object.values(localFormData.slotsDetailed)
//       .filter((slot) => slot.inspectionNo < currentSlotInspectionNo)
//       .filter(
//         (slot) =>
//           slot.result !== "Pending" ||
//           slot.temp_isNA ||
//           slot.temp_actual !== null
//       )
//       .sort((a, b) => a.inspectionNo - b.inspectionNo);

//     if (submittedInspections.length === 0) {
//       return (
//         <p className="text-sm text-gray-500 italic mt-2">
//           {t("sccDailyFUQC.noHistoryToShow")}
//         </p>
//       );
//     }

//     return (
//       <div className="border border-gray-300 rounded-lg shadow-sm bg-white mt-5 overflow-hidden">
//         {/* Title moved outside if Check History button acts as title */}
//         <div className="overflow-x-auto">
//           <table className="min-w-full text-xs divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-r sticky left-0 bg-gray-50 z-10 min-w-[120px]">
//                   {t("sccDailyFUQC.parameter")}
//                 </th>
//                 {submittedInspections.map((insp) => (
//                   <th
//                     key={insp.timeSlotKey}
//                     className="px-3 py-2 text-center font-semibold text-gray-600 uppercase tracking-wider border-r min-w-[70px]"
//                   >
//                     {
//                       TIME_SLOTS_CONFIG.find((s) => s.key === insp.timeSlotKey)
//                         ?.label
//                     }
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               <tr className="hover:bg-gray-50">
//                 <td className="px-3 py-2 border-r font-medium text-gray-700 sticky left-0 bg-white z-10">
//                   {t("sccDailyFUQC.reqTemp")} (°C)
//                 </td>
//                 {submittedInspections.map((insp) => (
//                   <td
//                     key={`${insp.timeSlotKey}-req`}
//                     className="px-3 py-2 border-r text-center"
//                   >
//                     {insp.temp_req !== null ? insp.temp_req : "N/A"}
//                   </td>
//                 ))}
//               </tr>
//               <tr className="hover:bg-gray-50">
//                 <td className="px-3 py-2 border-r font-medium text-gray-700 sticky left-0 bg-white z-10">
//                   {t("sccDailyFUQC.actualTemp")} (°C)
//                 </td>
//                 {submittedInspections.map((insp) => (
//                   <td
//                     key={`${insp.timeSlotKey}-actual`}
//                     className={`px-3 py-2 border-r text-center ${
//                       insp.temp_isNA ? "bg-gray-100 text-gray-500 italic" : ""
//                     }`}
//                   >
//                     {insp.temp_isNA
//                       ? t("scc.na")
//                       : insp.temp_actual !== null
//                       ? insp.temp_actual
//                       : ""}
//                   </td>
//                 ))}
//               </tr>
//               <tr className="hover:bg-gray-50">
//                 <td className="px-3 py-2 border-r font-medium text-gray-700 sticky left-0 bg-white z-10">
//                   {t("sccDailyFUQC.result")}
//                 </td>
//                 {submittedInspections.map((insp) => (
//                   <td
//                     key={`${insp.timeSlotKey}-result`}
//                     className={`px-3 py-2 border-r text-center ${
//                       insp.temp_isNA
//                         ? "bg-gray-100 text-gray-500 italic"
//                         : getCellBGFromResult(insp.result)
//                     }`}
//                   >
//                     <div>
//                       {insp.temp_isNA
//                         ? t("scc.na")
//                         : t(`scc.${insp.result?.toLowerCase() || "pending"}`)}
//                       {!insp.temp_isNA && insp.result === "Pass" && (
//                         <CheckCircle
//                           size={12}
//                           className="inline-block ml-1 text-green-600"
//                         />
//                       )}
//                       {!insp.temp_isNA && insp.result === "Reject" && (
//                         <XCircle
//                           size={12}
//                           className="inline-block ml-1 text-red-600"
//                         />
//                       )}
//                     </div>
//                     {insp.inspectionTimestamp && (
//                       <div className="text-gray-500 text-[10px] mt-0.5">
//                         {formatInspectionTimestamp(insp.inspectionTimestamp)}
//                       </div>
//                     )}
//                   </td>
//                 ))}
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-5">
//       <h2 className="text-lg font-semibold text-gray-800">
//         {t("sccDailyFUQC.title")}
//       </h2>
//       <p className="text-xs text-gray-600 -mt-3">
//         {t("sccDailyFUQC.subtitle")}
//       </p>

//       {loading && (
//         <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-[100]">
//           <Loader2 className="animate-spin h-12 w-12 text-white" />
//         </div>
//       )}
//       {recordStatusMessage && (
//         <div
//           className={`p-3 mb-3 rounded-md text-sm flex items-center shadow-sm border ${
//             recordStatusMessage.includes(
//               t("sccDailyFUQC.newRecordKey", "New")
//             ) ||
//             recordStatusMessage.includes(
//               t("sccDailyFUQC.selectMoColorKey", "select MO and Color")
//             ) ||
//             recordStatusMessage.includes(
//               t("sccDailyFUQC.selectMoColorMachine", "for machine")
//             )
//               ? "bg-blue-50 text-blue-700 border-blue-200"
//               : "bg-green-50 text-green-700 border-green-200"
//           }`}
//         >
//           <Info size={18} className="mr-2 shrink-0" /> {recordStatusMessage}
//         </div>
//       )}

//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 items-end">
//         <div>
//           <label htmlFor="fuqcInspectionDate" className={labelClasses}>
//             {t("scc.date")}
//           </label>
//           <DatePicker
//             selected={
//               localFormData.inspectionDate
//                 ? new Date(localFormData.inspectionDate)
//                 : new Date()
//             }
//             onChange={handleDateChange}
//             dateFormat="MM/dd/yyyy"
//             className={inputFieldClasses}
//             required
//             popperPlacement="bottom-start"
//             id="fuqcInspectionDate"
//           />
//         </div>
//         <div>
//           <label htmlFor="fuqcMachineNo" className={labelClasses}>
//             {t("scc.machineNo")}
//           </label>
//           <select
//             id="fuqcMachineNo"
//             name="machineNo"
//             value={localFormData.machineNo || ""}
//             onChange={handleMachineNoChange}
//             className={inputFieldClasses}
//             required
//           >
//             <option value="">{t("scc.selectMachine")}</option>
//             {MACHINE_NUMBERS.map((num) => (
//               <option key={`machine-${num}`} value={num}>
//                 {num}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="relative">
//           <label htmlFor="fuqcMoNoSearch" className={labelClasses}>
//             {t("scc.moNo")}
//           </label>
//           <div className="relative mt-1" ref={moNoDropdownRef}>
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Search className="h-5 w-5 text-gray-400" />
//             </div>
//             <input
//               type="text"
//               id="fuqcMoNoSearch"
//               value={moNoSearch}
//               ref={moNoInputRef}
//               onChange={(e) => setMoNoSearch(e.target.value)}
//               onFocus={() => setShowMoNoDropdown(true)}
//               placeholder={t("scc.searchMoNo")}
//               className={`${inputFieldClasses} pl-10`}
//             />
//             {showMoNoDropdown && moNoOptions.length > 0 && (
//               <ul className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
//                 {moNoOptions.map((mo) => (
//                   <li
//                     key={mo}
//                     onClick={() => handleMoSelect(mo)}
//                     className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-500 hover:text-white"
//                   >
//                     {mo}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//           {availableMachineRecords.length > 0 &&
//             !localFormData.moNo && ( // Show dropdown if multiple MOs exist and none selected yet
//               <div className="mt-1">
//                 <label
//                   htmlFor="selectExistingMoFuqc"
//                   className={`${labelClasses} text-xs`}
//                 >
//                   {t("sccDailyFUQC.selectExistingOrSearch")}
//                 </label>
//                 <select
//                   id="selectExistingMoFuqc"
//                   onChange={(e) => {
//                     const val = e.target.value;
//                     if (val) {
//                       const [sm, sc] = val.split("|");
//                       setLocalFormData((p) => {
//                         let nd = {
//                           ...p,
//                           moNo: sm,
//                           color: sc,
//                           _id: null,
//                           baseReqTemp: null,
//                           remarks: "",
//                           inspections: []
//                         };
//                         nd = resetLocalDetailedSlots(nd);
//                         setMoNoSearch(sm);
//                         return nd;
//                       });
//                     }
//                   }}
//                   className={inputFieldClasses}
//                   defaultValue=""
//                 >
//                   <option value="">-- {t("scc.select")} --</option>
//                   {availableMachineRecords.map((rec) => (
//                     <option
//                       key={`${rec.moNo}-${rec.color}`}
//                       value={`${rec.moNo}|${rec.color}`}
//                     >
//                       {rec.moNo} - {rec.color} (
//                       {rec.buyerStyle || t("scc.naCap")})
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 items-end">
//         <div>
//           <label className={labelClasses}>{t("scc.buyer")}</label>
//           <input
//             type="text"
//             value={localFormData.buyer || ""}
//             readOnly
//             className={inputFieldReadonlyClasses}
//           />
//         </div>
//         <div>
//           <label className={labelClasses}>{t("scc.buyerStyle")}</label>
//           <input
//             type="text"
//             value={localFormData.buyerStyle || ""}
//             readOnly
//             className={inputFieldReadonlyClasses}
//           />
//         </div>
//         <div>
//           <label htmlFor="fuqcColor" className={labelClasses}>
//             {t("scc.color")}
//           </label>
//           <select
//             id="fuqcColor"
//             name="color"
//             value={localFormData.color || ""}
//             onChange={handleColorChange}
//             className={inputFieldClasses}
//             disabled={!localFormData.moNo || availableColors.length === 0}
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

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-3 items-end">
//         <div>
//           <label htmlFor="fuqcTempOffset" className={labelClasses}>
//             {t("sccDailyFUQC.tempOffset", "Temp. Offset (±°C)")}
//           </label>
//           <input
//             type="number"
//             id="fuqcTempOffset"
//             name="temp_offset"
//             inputMode="numeric"
//             value={
//               localFormData.temp_offset !== null
//                 ? localFormData.temp_offset
//                 : ""
//             }
//             onChange={handleTempOffsetChange}
//             className={inputFieldClasses}
//             placeholder="e.g. 5"
//           />
//         </div>
//       </div>

//       {(localFormData.moNo && localFormData.color) ||
//       availableMachineRecords.length > 0 ? ( // Show tables section if we have criteria or a list of MOs to pick from
//         <div className="mt-4 space-y-4">
//           <h3 className="text-md font-semibold text-gray-700">
//             {currentSlotTableTitle}
//           </h3>
//           {currentActiveSlotKey ? (
//             renderCurrentSlotTable()
//           ) : !localFormData.moNo && availableMachineRecords.length > 0 ? (
//             <p className="text-sm italic text-gray-500">
//               {t("sccDailyFUQC.selectMoFromList")}
//             </p>
//           ) : (
//             <div className="text-center py-4 text-gray-500 italic">
//               {t("sccDailyFUQC.allInspectionsCompleted")}
//             </div>
//           )}

//           <div className="mt-3">
//             <button
//               type="button"
//               onClick={() => setShowHistory((prev) => !prev)}
//               className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
//             >
//               <History size={14} className="mr-1.5" />{" "}
//               {showHistory
//                 ? t("sccDailyFUQC.hideHistory")
//                 : t("sccDailyFUQC.checkHistory")}
//             </button>
//           </div>
//           {renderPreviousRecordsTable()}

//           <div className="pt-3">
//             <label htmlFor="fuqcRemarks" className={labelClasses}>
//               {t("sccDailyFUQC.remarks")} ({t("scc.optional")})
//             </label>
//             <textarea
//               id="fuqcRemarks"
//               name="remarks"
//               rows="2"
//               value={localFormData.remarks || ""}
//               onChange={handleRemarksChange}
//               className={inputFieldClasses}
//               placeholder={t("sccDailyFUQC.remarksPlaceholder")}
//             ></textarea>
//           </div>
//         </div>
//       ) : null}

//       <div className="pt-5 flex justify-end">
//         <button
//           type="button"
//           onClick={handleFormActualSubmit}
//           disabled={
//             isSubmitting ||
//             !currentActiveSlotKey ||
//             loading ||
//             !localFormData.moNo ||
//             !localFormData.color
//           }
//           className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
//         >
//           {isSubmitting && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
//           {currentActiveSlotKey
//             ? `${t("scc.submit")} (${
//                 TIME_SLOTS_CONFIG.find((s) => s.key === currentActiveSlotKey)
//                   ?.label
//               })`
//             : t("scc.noActiveSlot")}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default DailyFUQC;

import axios from "axios";
import {
  CheckCircle,
  Eye,
  EyeOff,
  History,
  Info,
  Loader2,
  Minus,
  Plus,
  Search,
  XCircle
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

// --- Constants and Helpers ---
const inputBaseClasses =
  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm";
const inputFocusClasses = "focus:ring-indigo-500 focus:border-indigo-500";
const inputFieldClasses = `${inputBaseClasses} ${inputFocusClasses}`;
const inputFieldReadonlyClasses = `${inputBaseClasses} bg-gray-100 cursor-not-allowed`;
const labelClasses = "block text-sm font-medium text-gray-700 mb-0.5";

const getCellBGFromResult = (result) => {
  if (result === "Pass") return "bg-green-100 text-green-700";
  if (result === "Reject") return "bg-red-100 text-red-700";
  if (result === "N/A") return "bg-gray-100 text-gray-500 italic";
  return "bg-white";
};

const getCellBGForNA = (isNA) => {
  return isNA ? "bg-gray-200 text-gray-500 italic" : "";
};

const TIME_SLOTS_CONFIG = [
  { key: "07:00", label: "07.00", inspectionNo: 1 },
  { key: "09:00", label: "09.00", inspectionNo: 2 },
  { key: "12:00", label: "12.00", inspectionNo: 3 },
  { key: "14:00", label: "2.00 PM", inspectionNo: 4 },
  { key: "16:00", label: "4.00 PM", inspectionNo: 5 },
  { key: "18:00", label: "6.00 PM", inspectionNo: 6 }
];

const MACHINE_NUMBERS = ["001", "002", "003", "004", "005"];
const DEFAULT_TEMP_OFFSET = 5;

const initialSlotData = {
  inspectionNo: 0,
  timeSlotKey: "",
  temp_req: null,
  temp_actual: null,
  temp_isNA: false,
  result: "Pending",
  inspectionTimestamp: null
};

const formatInspectionTimestamp = (timestamp) => {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  } catch (e) {
    return "";
  }
};

const DailyFUQC = ({
  formData,
  onFormDataChange,
  onFormSubmit,
  isSubmitting,
  formType
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [localFormData, setLocalFormData] = useState(() => {
    const initialSlots = TIME_SLOTS_CONFIG.reduce((acc, slot) => {
      acc[slot.key] = {
        ...initialSlotData,
        inspectionNo: slot.inspectionNo,
        timeSlotKey: slot.key
      };
      return acc;
    }, {});
    return {
      ...formData,
      slotsDetailed: initialSlots,
      remarks: formData.remarks || "",
      temp_offset:
        formData.temp_offset !== undefined
          ? formData.temp_offset
          : DEFAULT_TEMP_OFFSET
    };
  });

  const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableMachineRecords, setAvailableMachineRecords] = useState([]); // For existing MOs dropdown
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [baseTempLoading, setBaseTempLoading] = useState(false);
  const [existingQCRecordLoading, setExistingQCRecordLoading] = useState(false); // For loading specific MO/Color record
  const [machineRecordsLoading, setMachineRecordsLoading] = useState(false); // For loading list of MOs for a machine

  const [recordStatusMessage, setRecordStatusMessage] = useState("");
  const [currentActiveSlotKey, setCurrentActiveSlotKey] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const moNoInputRef = useRef(null);
  const moNoDropdownRef = useRef(null);

  const loading =
    orderDetailsLoading ||
    baseTempLoading ||
    existingQCRecordLoading ||
    machineRecordsLoading ||
    isSubmitting;

  // Sync localFormData with formData prop from parent
  useEffect(() => {
    setMoNoSearch(formData.moNo || ""); // Sync search field if parent changes MO
    const newSlotsDetailed = TIME_SLOTS_CONFIG.reduce((acc, slotConf) => {
      const existingInsp = formData.inspections?.find(
        (i) => i.timeSlotKey === slotConf.key
      );
      acc[slotConf.key] = existingInsp
        ? {
            ...initialSlotData,
            ...existingInsp,
            temp_req: Number(existingInsp.temp_req),
            temp_actual:
              existingInsp.temp_actual !== null
                ? Number(existingInsp.temp_actual)
                : null,
            inspectionTimestamp: existingInsp.inspectionTimestamp || null
          }
        : {
            ...initialSlotData,
            inspectionNo: slotConf.inspectionNo,
            timeSlotKey: slotConf.key
          };
      return acc;
    }, {});

    setLocalFormData((prev) => ({
      ...prev, // Keep local UI states like showHistory
      ...formData, // Sync with all data from parent
      slotsDetailed: newSlotsDetailed,
      remarks: formData.remarks || "",
      temp_offset:
        formData.temp_offset !== undefined
          ? formData.temp_offset
          : DEFAULT_TEMP_OFFSET
    }));
  }, [formData]);

  // Function to update parent (SCCPage)
  const updateParentFormData = useCallback(
    (dataToUpdate) => {
      const inspectionsArray = Object.values(dataToUpdate.slotsDetailed)
        .filter(
          (slot) =>
            slot.result !== "Pending" ||
            slot.temp_isNA ||
            slot.temp_actual !== null ||
            slot.temp_req !== null
        )
        .map((slot) => ({
          inspectionNo: slot.inspectionNo,
          timeSlotKey: slot.timeSlotKey,
          temp_req: slot.temp_req !== null ? Number(slot.temp_req) : null,
          temp_actual:
            slot.temp_actual !== null ? Number(slot.temp_actual) : null,
          temp_isNA: slot.temp_isNA,
          result: slot.result,
          inspectionTimestamp: slot.inspectionTimestamp
        }));

      onFormDataChange({
        _id: dataToUpdate._id,
        inspectionDate: dataToUpdate.inspectionDate,
        machineNo: dataToUpdate.machineNo,
        moNo: dataToUpdate.moNo,
        buyer: dataToUpdate.buyer,
        buyerStyle: dataToUpdate.buyerStyle,
        color: dataToUpdate.color,
        baseReqTemp:
          dataToUpdate.baseReqTemp !== null
            ? Number(dataToUpdate.baseReqTemp)
            : null,
        temp_offset: Number(dataToUpdate.temp_offset),
        inspections: inspectionsArray,
        remarks: dataToUpdate.remarks
      });
    },
    [onFormDataChange]
  );

  // Reset detailed slots in local state
  const resetLocalDetailedSlots = (
    currentLocalData,
    preserveBaseTemp = false
  ) => {
    const newSlots = {};
    TIME_SLOTS_CONFIG.forEach((slot) => {
      newSlots[slot.key] = {
        ...initialSlotData,
        inspectionNo: slot.inspectionNo,
        timeSlotKey: slot.key,
        temp_req: preserveBaseTemp ? currentLocalData.baseReqTemp : null, // Preserve if told to
        temp_actual: preserveBaseTemp ? currentLocalData.baseReqTemp : null
      };
    });
    return { ...currentLocalData, slotsDetailed: newSlots };
  };

  const clearAndResetFormForNewMo = (prevLocalData) => {
    let newData = {
      ...prevLocalData,
      moNo: "",
      color: "",
      buyer: "",
      buyerStyle: "",
      _id: null,
      baseReqTemp: null,
      remarks: "",
      inspections: []
      // temp_offset: DEFAULT_TEMP_OFFSET, // Keep user's temp_offset setting
    };
    newData = resetLocalDetailedSlots(newData, false); // Don't preserve base temp for totally new MO
    setMoNoSearch("");
    setAvailableColors([]);
    // availableMachineRecords will be refetched by handleMachineNoChange effect
    setCurrentActiveSlotKey(TIME_SLOTS_CONFIG[0]?.key || null); // Reset to first slot
    setRecordStatusMessage(t("sccDailyFUQC.enterNewMo"));
    setShowHistory(false);
    updateParentFormData(newData); // Update parent with cleared fields
    return newData;
  };

  const handleDateChange = (date) => {
    setLocalFormData((prev) => {
      // When date changes, we assume a completely new context
      let newLocalData = {
        ...prev,
        inspectionDate: date,
        moNo: "",
        color: "",
        buyer: "",
        buyerStyle: "",
        _id: null,
        baseReqTemp: null,
        remarks: "",
        inspections: [],
        temp_offset: DEFAULT_TEMP_OFFSET
      };
      newLocalData = resetLocalDetailedSlots(newLocalData);
      setMoNoSearch("");
      setAvailableColors([]);
      setAvailableMachineRecords([]);
      setCurrentActiveSlotKey(null);
      setRecordStatusMessage("");
      setShowHistory(false);
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  // When Machine No changes, fetch available MOs for that machine and date
  const handleMachineNoChange = (e) => {
    const machineNo = e.target.value;
    setLocalFormData((prev) => {
      let newLocalData = {
        ...prev,
        machineNo,
        moNo: "",
        color: "",
        buyer: "",
        buyerStyle: "",
        _id: null,
        baseReqTemp: null,
        remarks: "",
        inspections: [],
        temp_offset: DEFAULT_TEMP_OFFSET
      };
      newLocalData = resetLocalDetailedSlots(newLocalData);
      setMoNoSearch("");
      setAvailableColors([]);
      setAvailableMachineRecords([]);
      setCurrentActiveSlotKey(null);
      setRecordStatusMessage("");
      setShowHistory(false);
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  // Fetch MO Numbers for search dropdown
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
      if (moNoSearch !== localFormData.moNo || !localFormData.moNo) {
        fetchMoNumbers();
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [moNoSearch, fetchMoNumbers, localFormData.moNo]);

  // When user selects an MO from the search dropdown
  const handleMoSelect = (selectedMo) => {
    setMoNoSearch(selectedMo); // Update the search input for display
    setShowMoNoDropdown(false);
    setLocalFormData((prev) => {
      // Reset for the newly selected MO, but keep date, machine, temp_offset
      let newLocalData = {
        ...prev,
        moNo: selectedMo,
        color: "",
        buyer: "",
        buyerStyle: "",
        _id: null,
        baseReqTemp: null,
        remarks: "",
        inspections: []
      };
      newLocalData = resetLocalDetailedSlots(newLocalData, false); // Don't preserve base temp for new MO
      setRecordStatusMessage("");
      setShowHistory(false);
      // Order details and specific record will be fetched by other useEffects
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  // Fetch Order Details when MO No. changes (and is valid)
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!localFormData.moNo) {
        if (localFormData.buyer || localFormData.buyerStyle) {
          setLocalFormData((p) => {
            const ud = { ...p, buyer: "", buyerStyle: "" };
            updateParentFormData(ud);
            return ud;
          });
        }
        setAvailableColors([]);
        return;
      }
      setOrderDetailsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/order-details/${localFormData.moNo}`
        );
        const details = response.data;
        setLocalFormData((prev) => {
          const nd = {
            ...prev,
            buyer: details.engName || "N/A",
            buyerStyle: details.custStyle || "N/A"
          };
          updateParentFormData(nd);
          return nd;
        });
        setAvailableColors(details.colors || []);
        // If a color was previously selected for a different MO, it might need reset if not in new availableColors
        if (
          localFormData.color &&
          !details.colors?.find((c) => c.original === localFormData.color)
        ) {
          setLocalFormData((prev) => {
            const nd = { ...prev, color: "" };
            updateParentFormData(nd);
            return nd;
          });
        }
      } catch (error) {
        console.error(t("scc.errorFetchingOrderDetailsLog"), error);
        setLocalFormData((prev) => {
          const nd = { ...prev, buyer: "", buyerStyle: "", color: "" };
          updateParentFormData(nd);
          return nd;
        });
        setAvailableColors([]);
      } finally {
        setOrderDetailsLoading(false);
      }
    };
    if (localFormData.moNo) fetchOrderDetails();
    else {
      if (localFormData.buyer || localFormData.buyerStyle) {
        setLocalFormData((p) => {
          const ud = { ...p, buyer: "", buyerStyle: "" };
          updateParentFormData(ud);
          return ud;
        });
      }
      setAvailableColors([]);
    }
  }, [localFormData.moNo, t, updateParentFormData]);

  // When color changes, reset subsequent fields and fetch specific record or prepare for new
  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setLocalFormData((prev) => {
      let newLocalData = {
        ...prev,
        color: newColor,
        _id: null,
        baseReqTemp: null,
        remarks: "",
        inspections: []
      };
      newLocalData = resetLocalDetailedSlots(newLocalData, false); // Don't preserve base temp for new color
      setRecordStatusMessage("");
      setShowHistory(false);
      // Specific record will be fetched by useEffect watching for moNo, color, date, machineNo
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const handleRemarksChange = (e) => {
    setLocalFormData((prev) => {
      const newLocalData = { ...prev, remarks: e.target.value };
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const handleTempOffsetChange = (e) => {
    const offsetValue = e.target.value;
    const numOffset = offsetValue === "" ? null : Number(offsetValue);
    setLocalFormData((prev) => {
      const newLocalData = {
        ...prev,
        temp_offset: numOffset === null ? DEFAULT_TEMP_OFFSET : numOffset
      };
      if (
        currentActiveSlotKey &&
        newLocalData.slotsDetailed[currentActiveSlotKey]
      ) {
        const slot = newLocalData.slotsDetailed[currentActiveSlotKey];
        if (
          !slot.temp_isNA &&
          slot.temp_actual !== null &&
          slot.temp_req !== null
        ) {
          const diff = Math.abs(slot.temp_actual - slot.temp_req);
          slot.result =
            diff <= (newLocalData.temp_offset || 0) ? "Pass" : "Reject";
        }
      }
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const fetchBaseTemperature = useCallback(
    async (
      moNoToFetch,
      colorToFetch,
      inspectionDateToFetch,
      activeSlotKeyForUpdate
    ) => {
      if (!moNoToFetch || !colorToFetch || !inspectionDateToFetch) return;
      setBaseTempLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/fu-first-output-temp`,
          {
            params: {
              moNo: moNoToFetch,
              color: colorToFetch,
              inspectionDate:
                inspectionDateToFetch instanceof Date
                  ? inspectionDateToFetch.toISOString()
                  : inspectionDateToFetch
            }
          }
        );
        let newBaseReqTemp = null;
        if (response.data && response.data.tempC !== undefined) {
          newBaseReqTemp =
            response.data.tempC !== null ? Number(response.data.tempC) : null;
        }

        setLocalFormData((prevLocalData) => {
          const updatedSlotsDetailed = { ...prevLocalData.slotsDetailed };
          Object.keys(updatedSlotsDetailed).forEach((slotKey) => {
            const slot = updatedSlotsDetailed[slotKey];
            slot.temp_req = newBaseReqTemp; // Update req temp for all slots
            if (!slot.temp_isNA && slot.temp_actual === null) {
              // If actual is not set and not N/A, default to req
              slot.temp_actual = newBaseReqTemp;
            }
            // Re-calculate result for all slots based on new req temp
            if (
              !slot.temp_isNA &&
              slot.temp_actual !== null &&
              newBaseReqTemp !== null
            ) {
              const diff = Math.abs(slot.temp_actual - newBaseReqTemp);
              slot.result =
                diff <= (prevLocalData.temp_offset || 0) ? "Pass" : "Reject";
            } else if (slot.temp_isNA) {
              slot.result = "N/A";
            }
          });
          const newLocalData = {
            ...prevLocalData,
            baseReqTemp: newBaseReqTemp,
            slotsDetailed: updatedSlotsDetailed
          };
          updateParentFormData(newLocalData);
          return newLocalData;
        });
      } catch (error) {
        console.error(t("sccDailyFUQC.errorFetchingFuSpecsLog"), error);
        setLocalFormData((prevLocalData) => {
          const nd = { ...prevLocalData, baseReqTemp: null };
          updateParentFormData(nd);
          return nd;
        });
      } finally {
        setBaseTempLoading(false);
      }
    },
    [t, updateParentFormData]
  );

  useEffect(() => {
    // Fetch base temp if MO, Color, Date are set (could be for new or loading existing)
    if (
      localFormData.moNo &&
      localFormData.color &&
      localFormData.inspectionDate
    ) {
      fetchBaseTemperature(
        localFormData.moNo,
        localFormData.color,
        localFormData.inspectionDate,
        currentActiveSlotKey
      );
    }
  }, [
    localFormData.moNo,
    localFormData.color,
    localFormData.inspectionDate,
    fetchBaseTemperature,
    currentActiveSlotKey
  ]);

  // Effect to auto-set current slot's req and actual based on baseReqTemp and evaluate result
  useEffect(() => {
    if (
      currentActiveSlotKey &&
      localFormData.slotsDetailed &&
      localFormData.slotsDetailed[currentActiveSlotKey] &&
      localFormData.baseReqTemp !== null
    ) {
      setLocalFormData((prevLocalData) => {
        const currentSlotsDetailed = { ...prevLocalData.slotsDetailed };
        const slotToUpdate = { ...currentSlotsDetailed[currentActiveSlotKey] };
        let hasChanged = false;
        if (slotToUpdate.temp_req !== prevLocalData.baseReqTemp) {
          slotToUpdate.temp_req = prevLocalData.baseReqTemp;
          hasChanged = true;
        }
        if (slotToUpdate.temp_actual === null && !slotToUpdate.temp_isNA) {
          slotToUpdate.temp_actual = prevLocalData.baseReqTemp;
          hasChanged = true;
        }
        if (
          !slotToUpdate.temp_isNA &&
          slotToUpdate.temp_actual !== null &&
          slotToUpdate.temp_req !== null
        ) {
          const diff = Math.abs(
            slotToUpdate.temp_actual - slotToUpdate.temp_req
          );
          const newResult =
            diff <= (prevLocalData.temp_offset || 0) ? "Pass" : "Reject";
          if (slotToUpdate.result !== newResult) {
            slotToUpdate.result = newResult;
            hasChanged = true;
          }
        }
        if (hasChanged) {
          const newSlotsDetailedState = {
            ...currentSlotsDetailed,
            [currentActiveSlotKey]: slotToUpdate
          };
          return { ...prevLocalData, slotsDetailed: newSlotsDetailedState };
        }
        return prevLocalData;
      });
    }
  }, [
    currentActiveSlotKey,
    localFormData.baseReqTemp,
    localFormData.temp_offset
  ]);

  // Main data fetching logic for the form (existing records or list of MOs)
  const fetchDailyFUQCData = useCallback(
    async (date, machine, mo, clr) => {
      if (!date || !machine) return;
      setExistingQCRecordLoading(true);
      setRecordStatusMessage("");
      setShowHistory(false);
      setAvailableMachineRecords([]); // Clear previous list of MOs

      try {
        const params = {
          inspectionDate: date instanceof Date ? date.toISOString() : date,
          machineNo: machine
        };
        if (mo && clr) {
          params.moNo = mo;
          params.color = clr;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/scc/daily-fuqc-test`,
          { params }
        );
        const { message, data } = response.data;

        if (
          message === "DAILY_FUQC_RECORD_NOT_FOUND" &&
          params.moNo &&
          params.color
        ) {
          // Specific MO/Color not found
          setRecordStatusMessage(t("sccDailyFUQC.newRecordForMoColor"));
          const firstSlotKey = TIME_SLOTS_CONFIG[0]?.key || null;
          setCurrentActiveSlotKey(firstSlotKey);
          // Reset slots, but baseReqTemp might have been fetched by another effect if MO/Color/Date are set
          setLocalFormData((prev) => {
            let newLocalState = {
              ...prev,
              _id: null,
              inspections: [],
              remarks: "",
              moNo: mo,
              color: clr
            }; // Ensure current mo/color are set
            newLocalState = resetLocalDetailedSlots(newLocalState, true); // Preserve base temp if available
            return newLocalState;
          });
          // Base temp should be fetched if not already via the dedicated useEffect
          if (!localFormData.baseReqTemp) {
            fetchBaseTemperature(mo, clr, date, firstSlotKey);
          }
        } else if (message === "NO_RECORDS_FOR_DATE_MACHINE" && !params.moNo) {
          // No records at all for this date/machine
          setRecordStatusMessage(t("sccDailyFUQC.newRecord"));
          setCurrentActiveSlotKey(TIME_SLOTS_CONFIG[0]?.key || null);
          setLocalFormData((prev) =>
            clearAndResetFormForNewMo({
              ...prev,
              inspectionDate: date,
              machineNo: machine
            })
          );
        } else if (message === "RECORD_FOUND" && data) {
          // Specific record found
          setRecordStatusMessage(t("sccDailyFUQC.recordLoaded"));
          const populatedSlots = TIME_SLOTS_CONFIG.reduce((acc, slotConf) => {
            const existingInsp = (data.inspections || []).find(
              (i) => i.timeSlotKey === slotConf.key
            );
            acc[slotConf.key] = existingInsp
              ? {
                  ...initialSlotData,
                  ...existingInsp,
                  temp_req: Number(existingInsp.temp_req),
                  temp_actual:
                    existingInsp.temp_actual !== null
                      ? Number(existingInsp.temp_actual)
                      : null,
                  inspectionTimestamp: existingInsp.inspectionTimestamp || null
                }
              : {
                  ...initialSlotData,
                  inspectionNo: slotConf.inspectionNo,
                  timeSlotKey: slotConf.key,
                  temp_req: data.baseReqTemp,
                  temp_actual: data.baseReqTemp,
                  inspectionTimestamp: null
                };
            return acc;
          }, {});
          const lastSubmittedInspNo =
            (data.inspections || []).length > 0
              ? Math.max(...data.inspections.map((i) => i.inspectionNo))
              : 0;
          const nextInspNo = lastSubmittedInspNo + 1;
          const activeSlotConfig = TIME_SLOTS_CONFIG.find(
            (s) => s.inspectionNo === nextInspNo
          );
          setCurrentActiveSlotKey(
            activeSlotConfig ? activeSlotConfig.key : null
          );
          setLocalFormData((prev) => ({
            ...prev,
            _id: data._id,
            moNo: data.moNo,
            buyer: data.buyer,
            buyerStyle: data.buyerStyle,
            color: data.color,
            baseReqTemp:
              data.baseReqTemp !== null ? Number(data.baseReqTemp) : null,
            temp_offset:
              data.temp_offset !== undefined
                ? data.temp_offset
                : DEFAULT_TEMP_OFFSET,
            remarks: data.remarks || "",
            inspections: data.inspections || [],
            slotsDetailed: populatedSlots
          }));
          setMoNoSearch(data.moNo || "");
          if (data.baseReqTemp === null && data.moNo && data.color) {
            fetchBaseTemperature(
              data.moNo,
              data.color,
              date,
              activeSlotConfig ? activeSlotConfig.key : null
            );
          }
        } else if (message === "MULTIPLE_MO_COLOR_FOUND" && data.length > 0) {
          // Multiple MOs for date/machine
          setRecordStatusMessage(
            t("sccDailyFUQC.selectMoColorMachine", { machineNo: machine })
          );
          setAvailableMachineRecords(data);
          setCurrentActiveSlotKey(null); // No active slot until MO/Color selected from dropdown
          // Clear MO/Color specific fields but keep date/machine
          setLocalFormData((prev) => ({
            ...prev,
            moNo: "",
            color: "",
            buyer: "",
            buyerStyle: "",
            _id: null,
            baseReqTemp: null,
            remarks: "",
            inspections: [],
            slotsDetailed: TIME_SLOTS_CONFIG.reduce((acc, slot) => {
              acc[slot.key] = {
                ...initialSlotData,
                inspectionNo: slot.inspectionNo,
                timeSlotKey: slot.key
              };
              return acc;
            }, {})
          }));
          setMoNoSearch("");
        } else {
          // Fallback
          setRecordStatusMessage(t("sccDailyFUQC.newRecord"));
          setCurrentActiveSlotKey(TIME_SLOTS_CONFIG[0]?.key || null);
          setLocalFormData((prev) =>
            clearAndResetFormForNewMo({
              ...prev,
              inspectionDate: date,
              machineNo: machine
            })
          );
        }
      } catch (error) {
        console.error(t("sccDailyFUQC.errorLoadingRecord"), error);
        Swal.fire(
          t("scc.error"),
          t("sccDailyFUQC.errorLoadingRecordMsg"),
          "error"
        );
        setLocalFormData((prev) =>
          clearAndResetFormForNewMo({
            ...prev,
            inspectionDate: date,
            machineNo: machine
          })
        );
      } finally {
        setExistingQCRecordLoading(false);
        setMachineRecordsLoading(false);
      }
    },
    [t, fetchBaseTemperature, updateParentFormData, localFormData.baseReqTemp]
  ); // Added localFormData.baseReqTemp as it's used in reset

  // Effect to trigger data fetching when primary keys (date, machine) change
  useEffect(() => {
    if (localFormData.inspectionDate && localFormData.machineNo) {
      // If MO and Color are also set, fetch that specific record.
      // Otherwise, fetch to see if there are multiple MOs for the date/machine or if it's a new context.
      fetchDailyFUQCData(
        localFormData.inspectionDate,
        localFormData.machineNo,
        localFormData.moNo,
        localFormData.color
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFormData.inspectionDate, localFormData.machineNo]); // Only these should trigger the initial fetch or list of MOs

  // Effect to fetch specific record when MO/Color are selected from the list
  useEffect(() => {
    if (
      localFormData.inspectionDate &&
      localFormData.machineNo &&
      localFormData.moNo &&
      localFormData.color
    ) {
      fetchDailyFUQCData(
        localFormData.inspectionDate,
        localFormData.machineNo,
        localFormData.moNo,
        localFormData.color
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFormData.moNo, localFormData.color]); // Re-fetch specific record when MO/Color changes

  const handleSlotActualTempChange = (slotKey, value) => {
    setLocalFormData((prev) => {
      const newSlotsDetailed = { ...prev.slotsDetailed };
      const slot = { ...newSlotsDetailed[slotKey] };
      if (!slot || slot.temp_isNA) return prev;
      slot.temp_actual = value === "" || value === null ? null : Number(value);
      if (
        !slot.temp_isNA &&
        slot.temp_actual !== null &&
        slot.temp_req !== null
      ) {
        const diff = Math.abs(slot.temp_actual - slot.temp_req);
        slot.result = diff <= (prev.temp_offset || 0) ? "Pass" : "Reject";
      } else if (slot.temp_isNA) {
        slot.result = "N/A";
      } else {
        slot.result = "Pending";
      }
      newSlotsDetailed[slotKey] = slot;
      const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const handleSlotTempIncrementDecrement = (slotKey, action) => {
    setLocalFormData((prev) => {
      const newSlotsDetailed = { ...prev.slotsDetailed };
      const slot = { ...newSlotsDetailed[slotKey] };
      if (!slot || slot.temp_isNA) return prev;
      let currentValue = parseFloat(slot.temp_actual);
      if (isNaN(currentValue)) {
        currentValue = parseFloat(slot.temp_req);
        if (isNaN(currentValue)) currentValue = 0;
      }
      if (action === "increment") currentValue += 1;
      if (action === "decrement") currentValue -= 1;
      slot.temp_actual = currentValue;
      if (
        !slot.temp_isNA &&
        slot.temp_actual !== null &&
        slot.temp_req !== null
      ) {
        const diff = Math.abs(slot.temp_actual - slot.temp_req);
        slot.result = diff <= (prev.temp_offset || 0) ? "Pass" : "Reject";
      } else if (slot.temp_isNA) {
        slot.result = "N/A";
      } else {
        slot.result = "Pending";
      }
      newSlotsDetailed[slotKey] = slot;
      const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const toggleSlotTempNA = (slotKey) => {
    setLocalFormData((prev) => {
      const newSlotsDetailed = { ...prev.slotsDetailed };
      const slot = { ...newSlotsDetailed[slotKey] };
      if (!slot) return prev;
      slot.temp_isNA = !slot.temp_isNA;
      if (slot.temp_isNA) {
        slot.temp_actual = null;
        slot.result = "N/A";
      } else {
        slot.temp_actual =
          slot.temp_actual === null ? slot.temp_req : slot.temp_actual;
        if (slot.temp_actual !== null && slot.temp_req !== null) {
          const diff = Math.abs(slot.temp_actual - slot.temp_req);
          slot.result = diff <= (prev.temp_offset || 0) ? "Pass" : "Reject";
        } else {
          slot.result = "Pending";
        }
      }
      newSlotsDetailed[slotKey] = slot;
      const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const handleSlotResultChange = (slotKey, resultValue) => {
    setLocalFormData((prev) => {
      const newSlotsDetailed = { ...prev.slotsDetailed };
      const slot = { ...newSlotsDetailed[slotKey] };
      if (!slot || slot.temp_isNA) return prev;
      slot.result = resultValue;
      newSlotsDetailed[slotKey] = slot;
      const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const handleFormActualSubmit = async () => {
    // Made async for potential re-fetch
    if (
      !localFormData.inspectionDate ||
      !localFormData.machineNo ||
      !localFormData.moNo ||
      !localFormData.color
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyFUQC.validation.fillBasic"),
        "warning"
      );
      return;
    }
    if (!currentActiveSlotKey) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyFUQC.validation.allSlotsDone"),
        "info"
      );
      return;
    }
    const activeSlotData = localFormData.slotsDetailed[currentActiveSlotKey];
    if (!activeSlotData) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        "Error: Active slot data not found.",
        "error"
      );
      return;
    }
    if (activeSlotData.temp_req === null && !baseTempLoading) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyFUQC.validation.tempReqMissing"),
        "warning"
      );
      return;
    }
    if (!activeSlotData.temp_isNA && activeSlotData.temp_actual === null) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyFUQC.validation.fillActualTemp"),
        "warning"
      );
      return;
    }
    if (activeSlotData.result === "Pending" && !activeSlotData.temp_isNA) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyFUQC.validation.selectResultActiveSlot"),
        "warning"
      );
      return;
    }

    const payloadForParent = {
      _id: localFormData._id,
      inspectionDate: localFormData.inspectionDate,
      machineNo: localFormData.machineNo,
      moNo: localFormData.moNo,
      buyer: localFormData.buyer,
      buyerStyle: localFormData.buyerStyle,
      color: localFormData.color,
      baseReqTemp:
        localFormData.baseReqTemp !== null
          ? Number(localFormData.baseReqTemp)
          : null,
      temp_offset: Number(localFormData.temp_offset),
      remarks: localFormData.remarks?.trim() || "NA",
      emp_id: user.emp_id,
      emp_kh_name: user.kh_name,
      emp_eng_name: user.eng_name,
      emp_dept_name: user.dept_name,
      emp_sect_name: user.sect_name,
      emp_job_title: user.job_title,
      currentInspection: {
        inspectionNo: activeSlotData.inspectionNo,
        timeSlotKey: activeSlotData.timeSlotKey,
        temp_req:
          activeSlotData.temp_req !== null
            ? Number(activeSlotData.temp_req)
            : null,
        temp_actual:
          activeSlotData.temp_actual !== null
            ? Number(activeSlotData.temp_actual)
            : null,
        temp_isNA: activeSlotData.temp_isNA,
        result: activeSlotData.temp_isNA ? "N/A" : activeSlotData.result,
        inspectionTimestamp: new Date()
      }
    };

    try {
      await onFormSubmit(formType, payloadForParent); // onFormSubmit is from SCCPage
      // After successful submission, SCCPage will reset its formData prop.
      // The useEffect watching formData in this component will then re-sync localFormData.
      // To ensure history updates immediately, we can re-trigger the fetch for the current context.
      if (
        localFormData.inspectionDate &&
        localFormData.machineNo &&
        localFormData.moNo &&
        localFormData.color
      ) {
        fetchDailyFUQCData(
          localFormData.inspectionDate,
          localFormData.machineNo,
          localFormData.moNo,
          localFormData.color
        );
      } else if (localFormData.inspectionDate && localFormData.machineNo) {
        fetchDailyFUQCData(
          localFormData.inspectionDate,
          localFormData.machineNo,
          null,
          null
        ); // Fetch list of MOs if MO was cleared
      }
      // setShowHistory(true); // Optionally auto-show history after submit
    } catch (error) {
      // Error handling is typically done in onFormSubmit within SCCPage
      console.error("Submission error caught in DailyFUQC", error);
    }
  };

  const currentSlotTableTitle = useMemo(() => {
    if (!currentActiveSlotKey) return t("sccDailyFUQC.noActiveSlot");
    const slotConfig = TIME_SLOTS_CONFIG.find(
      (s) => s.key === currentActiveSlotKey
    );
    if (!slotConfig) return t("sccDailyFUQC.noActiveSlot");
    return `${t("sccDailyFUQC.currentInspectionSlot")}: ${slotConfig.label} (#${
      slotConfig.inspectionNo
    })`;
  }, [currentActiveSlotKey, t]);

  const renderCurrentSlotTable = () => {
    if (!currentActiveSlotKey) return null;
    const currentSlot = localFormData.slotsDetailed[currentActiveSlotKey];
    if (!currentSlot) return null;

    return (
      <div className="border border-gray-300 rounded-lg shadow-sm bg-white overflow-hidden">
        <table className="min-w-full text-xs divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-center font-semibold text-gray-700 border-r w-1/3">
                {t("sccDailyFUQC.reqTemp")} (°C)
              </th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700 border-r w-1/3">
                {t("sccDailyFUQC.actualTemp")} (°C)
              </th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700 w-1/3">
                {t("sccDailyFUQC.result")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr
              className={`hover:bg-gray-50 ${getCellBGFromResult(
                currentSlot.result
              )}`}
            >
              <td className="px-3 py-2 border-r text-center">
                {currentSlot.temp_req !== null ? (
                  currentSlot.temp_req
                ) : baseTempLoading ? (
                  <Loader2 size={14} className="animate-spin inline-block" />
                ) : (
                  "N/A"
                )}
              </td>
              <td
                className={`px-1.5 py-1.5 border-r text-center ${getCellBGForNA(
                  currentSlot.temp_isNA
                )}`}
              >
                {currentSlot.temp_isNA ? (
                  <span className="italic text-gray-500">{t("scc.na")}</span>
                ) : (
                  <input
                    type="number"
                    inputMode="numeric"
                    value={
                      currentSlot.temp_actual !== null
                        ? currentSlot.temp_actual
                        : ""
                    }
                    onChange={(e) =>
                      handleSlotActualTempChange(
                        currentActiveSlotKey,
                        e.target.value
                      )
                    }
                    className={`${inputFieldClasses} text-center text-xs p-1 w-full mb-1`}
                    disabled={
                      currentSlot.temp_isNA ||
                      (currentSlot.temp_req === null && !baseTempLoading)
                    }
                  />
                )}
                <div className="flex justify-center items-center space-x-2 mt-1">
                  {!currentSlot.temp_isNA &&
                    (currentSlot.temp_req !== null || baseTempLoading) && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleSlotTempIncrementDecrement(
                              currentActiveSlotKey,
                              "decrement"
                            )
                          }
                          className="p-1 hover:bg-gray-200 rounded-full disabled:opacity-50"
                          disabled={
                            currentSlot.temp_isNA ||
                            (currentSlot.temp_req === null && !baseTempLoading)
                          }
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSlotTempIncrementDecrement(
                              currentActiveSlotKey,
                              "increment"
                            )
                          }
                          className="p-1 hover:bg-gray-200 rounded-full disabled:opacity-50"
                          disabled={
                            currentSlot.temp_isNA ||
                            (currentSlot.temp_req === null && !baseTempLoading)
                          }
                        >
                          <Plus size={12} />
                        </button>
                      </>
                    )}
                  <button
                    type="button"
                    onClick={() => toggleSlotTempNA(currentActiveSlotKey)}
                    className="p-1 hover:bg-gray-200 rounded-full disabled:opacity-50"
                    disabled={
                      currentSlot.temp_req === null &&
                      !baseTempLoading &&
                      !currentSlot.temp_isNA
                    }
                  >
                    {currentSlot.temp_isNA ? (
                      <EyeOff size={12} className="text-gray-500" />
                    ) : (
                      <Eye size={12} />
                    )}
                  </button>
                </div>
              </td>
              <td className={`px-1.5 py-1.5 text-center`}>
                <select
                  value={currentSlot.result}
                  onChange={(e) =>
                    handleSlotResultChange(currentActiveSlotKey, e.target.value)
                  }
                  className={`${inputFieldClasses} text-center text-xs p-1 w-full ${getCellBGFromResult(
                    currentSlot.result
                  )}`}
                  disabled={
                    currentSlot.temp_isNA ||
                    (currentSlot.temp_req === null && !baseTempLoading)
                  }
                >
                  <option value="Pending">{t("scc.pending")}</option>
                  <option value="Pass">{t("scc.pass")}</option>
                  <option value="Reject">{t("scc.reject")}</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderPreviousRecordsTable = () => {
    if (!showHistory) return null;

    const currentSlotConfig = currentActiveSlotKey
      ? TIME_SLOTS_CONFIG.find((s) => s.key === currentActiveSlotKey)
      : null;
    const currentSlotInspectionNo = currentSlotConfig
      ? currentSlotConfig.inspectionNo
      : Infinity;

    // Use localFormData.slotsDetailed to show the most up-to-date state before full parent sync might happen
    const submittedInspections = Object.values(localFormData.slotsDetailed)
      .filter((slot) => slot.inspectionNo < currentSlotInspectionNo)
      .filter(
        (slot) =>
          slot.result !== "Pending" ||
          slot.temp_isNA ||
          slot.temp_actual !== null
      )
      .sort((a, b) => a.inspectionNo - b.inspectionNo);

    if (submittedInspections.length === 0) {
      return (
        <p className="text-sm text-gray-500 italic mt-2">
          {t("sccDailyFUQC.noHistoryToShow")}
        </p>
      );
    }

    return (
      <div className="border border-gray-300 rounded-lg shadow-sm bg-white mt-5 overflow-hidden">
        {/* Title moved outside if Check History button acts as title */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-r sticky left-0 bg-gray-50 z-10 min-w-[120px]">
                  {t("sccDailyFUQC.parameter")}
                </th>
                {submittedInspections.map((insp) => (
                  <th
                    key={insp.timeSlotKey}
                    className="px-3 py-2 text-center font-semibold text-gray-600 uppercase tracking-wider border-r min-w-[70px]"
                  >
                    {
                      TIME_SLOTS_CONFIG.find((s) => s.key === insp.timeSlotKey)
                        ?.label
                    }
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-3 py-2 border-r font-medium text-gray-700 sticky left-0 bg-white z-10">
                  {t("sccDailyFUQC.reqTemp")} (°C)
                </td>
                {submittedInspections.map((insp) => (
                  <td
                    key={`${insp.timeSlotKey}-req`}
                    className="px-3 py-2 border-r text-center"
                  >
                    {insp.temp_req !== null ? insp.temp_req : "N/A"}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-3 py-2 border-r font-medium text-gray-700 sticky left-0 bg-white z-10">
                  {t("sccDailyFUQC.actualTemp")} (°C)
                </td>
                {submittedInspections.map((insp) => (
                  <td
                    key={`${insp.timeSlotKey}-actual`}
                    className={`px-3 py-2 border-r text-center ${
                      insp.temp_isNA ? "bg-gray-100 text-gray-500 italic" : ""
                    }`}
                  >
                    {insp.temp_isNA
                      ? t("scc.na")
                      : insp.temp_actual !== null
                      ? insp.temp_actual
                      : ""}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-3 py-2 border-r font-medium text-gray-700 sticky left-0 bg-white z-10">
                  {t("sccDailyFUQC.result")}
                </td>
                {submittedInspections.map((insp) => (
                  <td
                    key={`${insp.timeSlotKey}-result`}
                    className={`px-3 py-2 border-r text-center ${
                      insp.temp_isNA
                        ? "bg-gray-100 text-gray-500 italic"
                        : getCellBGFromResult(insp.result)
                    }`}
                  >
                    <div>
                      {insp.temp_isNA
                        ? t("scc.na")
                        : t(`scc.${insp.result?.toLowerCase() || "pending"}`)}
                      {!insp.temp_isNA && insp.result === "Pass" && (
                        <CheckCircle
                          size={12}
                          className="inline-block ml-1 text-green-600"
                        />
                      )}
                      {!insp.temp_isNA && insp.result === "Reject" && (
                        <XCircle
                          size={12}
                          className="inline-block ml-1 text-red-600"
                        />
                      )}
                    </div>
                    {insp.inspectionTimestamp && (
                      <div className="text-gray-500 text-[10px] mt-0.5">
                        {formatInspectionTimestamp(insp.inspectionTimestamp)}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-800">
        {t("sccDailyFUQC.title")}
      </h2>
      <p className="text-xs text-gray-600 -mt-3">
        {t("sccDailyFUQC.subtitle")}
      </p>

      {loading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-[100]">
          <Loader2 className="animate-spin h-12 w-12 text-white" />
        </div>
      )}
      {recordStatusMessage && (
        <div
          className={`p-3 mb-3 rounded-md text-sm flex items-center shadow-sm border ${
            recordStatusMessage.includes(
              t("sccDailyFUQC.newRecordKey", "New")
            ) ||
            recordStatusMessage.includes(
              t("sccDailyFUQC.selectMoColorKey", "select MO and Color")
            ) ||
            recordStatusMessage.includes(
              t("sccDailyFUQC.selectMoColorMachine", "for machine")
            )
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          <Info size={18} className="mr-2 shrink-0" /> {recordStatusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 items-end">
        <div>
          <label htmlFor="fuqcInspectionDate" className={labelClasses}>
            {t("scc.date")}
          </label>
          <DatePicker
            selected={
              localFormData.inspectionDate
                ? new Date(localFormData.inspectionDate)
                : new Date()
            }
            onChange={handleDateChange}
            dateFormat="MM/dd/yyyy"
            className={inputFieldClasses}
            required
            popperPlacement="bottom-start"
            id="fuqcInspectionDate"
          />
        </div>
        <div>
          <label htmlFor="fuqcMachineNo" className={labelClasses}>
            {t("scc.machineNo")}
          </label>
          <select
            id="fuqcMachineNo"
            name="machineNo"
            value={localFormData.machineNo || ""}
            onChange={handleMachineNoChange}
            className={inputFieldClasses}
            required
          >
            <option value="">{t("scc.selectMachine")}</option>
            {MACHINE_NUMBERS.map((num) => (
              <option key={`machine-${num}`} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label htmlFor="fuqcMoNoSearch" className={labelClasses}>
            {t("scc.moNo")}
          </label>
          <div className="relative mt-1" ref={moNoDropdownRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="fuqcMoNoSearch"
              value={moNoSearch}
              ref={moNoInputRef}
              onChange={(e) => setMoNoSearch(e.target.value)}
              onFocus={() => setShowMoNoDropdown(true)}
              placeholder={t("scc.searchMoNo")}
              className={`${inputFieldClasses} pl-10`}
            />
            {showMoNoDropdown && moNoOptions.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {moNoOptions.map((mo) => (
                  <li
                    key={mo}
                    onClick={() => handleMoSelect(mo)}
                    className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-500 hover:text-white"
                  >
                    {mo}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {availableMachineRecords.length > 0 &&
            !localFormData.moNo && ( // Show dropdown if multiple MOs exist and none selected yet
              <div className="mt-1">
                <label
                  htmlFor="selectExistingMoFuqc"
                  className={`${labelClasses} text-xs`}
                >
                  {t("sccDailyFUQC.selectExistingOrSearch")}
                </label>
                <select
                  id="selectExistingMoFuqc"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      const [sm, sc] = val.split("|");
                      setLocalFormData((p) => {
                        let nd = {
                          ...p,
                          moNo: sm,
                          color: sc,
                          _id: null,
                          baseReqTemp: null,
                          remarks: "",
                          inspections: []
                        };
                        nd = resetLocalDetailedSlots(nd);
                        setMoNoSearch(sm);
                        return nd;
                      });
                    }
                  }}
                  className={inputFieldClasses}
                  defaultValue=""
                >
                  <option value="">-- {t("scc.select")} --</option>
                  {availableMachineRecords.map((rec) => (
                    <option
                      key={`${rec.moNo}-${rec.color}`}
                      value={`${rec.moNo}|${rec.color}`}
                    >
                      {rec.moNo} - {rec.color} (
                      {rec.buyerStyle || t("scc.naCap")})
                    </option>
                  ))}
                </select>
              </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 items-end">
        <div>
          <label className={labelClasses}>{t("scc.buyer")}</label>
          <input
            type="text"
            value={localFormData.buyer || ""}
            readOnly
            className={inputFieldReadonlyClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>{t("scc.buyerStyle")}</label>
          <input
            type="text"
            value={localFormData.buyerStyle || ""}
            readOnly
            className={inputFieldReadonlyClasses}
          />
        </div>
        <div>
          <label htmlFor="fuqcColor" className={labelClasses}>
            {t("scc.color")}
          </label>
          <select
            id="fuqcColor"
            name="color"
            value={localFormData.color || ""}
            onChange={handleColorChange}
            className={inputFieldClasses}
            disabled={!localFormData.moNo || availableColors.length === 0}
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-3 items-end">
        <div>
          <label htmlFor="fuqcTempOffset" className={labelClasses}>
            {t("sccDailyFUQC.tempOffset", "Temp. Offset (±°C)")}
          </label>
          <input
            type="number"
            id="fuqcTempOffset"
            name="temp_offset"
            inputMode="numeric"
            value={
              localFormData.temp_offset !== null
                ? localFormData.temp_offset
                : ""
            }
            onChange={handleTempOffsetChange}
            className={inputFieldClasses}
            placeholder="e.g. 5"
          />
        </div>
      </div>

      {(localFormData.moNo && localFormData.color) ||
      availableMachineRecords.length > 0 ? ( // Show tables section if we have criteria or a list of MOs to pick from
        <div className="mt-4 space-y-4">
          <h3 className="text-md font-semibold text-gray-700">
            {currentSlotTableTitle}
          </h3>
          {currentActiveSlotKey ? (
            renderCurrentSlotTable()
          ) : !localFormData.moNo && availableMachineRecords.length > 0 ? (
            <p className="text-sm italic text-gray-500">
              {t("sccDailyFUQC.selectMoFromList")}
            </p>
          ) : (
            <div className="text-center py-4 text-gray-500 italic">
              {t("sccDailyFUQC.allInspectionsCompleted")}
            </div>
          )}

          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              <History size={14} className="mr-1.5" />{" "}
              {showHistory
                ? t("sccDailyFUQC.hideHistory")
                : t("sccDailyFUQC.checkHistory")}
            </button>
          </div>
          {renderPreviousRecordsTable()}

          <div className="pt-3">
            <label htmlFor="fuqcRemarks" className={labelClasses}>
              {t("sccDailyFUQC.remarks")} ({t("scc.optional")})
            </label>
            <textarea
              id="fuqcRemarks"
              name="remarks"
              rows="2"
              value={localFormData.remarks || ""}
              onChange={handleRemarksChange}
              className={inputFieldClasses}
              placeholder={t("sccDailyFUQC.remarksPlaceholder")}
            ></textarea>
          </div>
        </div>
      ) : null}

      <div className="pt-5 flex justify-end">
        <button
          type="button"
          onClick={handleFormActualSubmit}
          disabled={
            isSubmitting ||
            !currentActiveSlotKey ||
            loading ||
            !localFormData.moNo ||
            !localFormData.color
          }
          className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
          {currentActiveSlotKey
            ? `${t("scc.submit")} (${
                TIME_SLOTS_CONFIG.find((s) => s.key === currentActiveSlotKey)
                  ?.label
              })`
            : t("scc.noActiveSlot")}
        </button>
      </div>
    </div>
  );
};

export default DailyFUQC;
