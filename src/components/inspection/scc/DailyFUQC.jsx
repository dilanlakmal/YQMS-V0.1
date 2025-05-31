// import axios from "axios";
// import {
//   CheckCircle,
//   Eye,
//   EyeOff,
//   History,
//   Info,
//   Loader2,
//   Minus,
//   Plus,
//   Search,
//   XCircle
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
  Eye,
  EyeOff,
  Loader2,
  Minus,
  Plus,
  Search,
  Settings2,
  Thermometer,
  Clock,
  CalendarDays,
  Power,
  PowerOff,
  AlertTriangle,
  Check,
  ListChecks,
  BookUser,
  Send
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
import { API_BASE_URL } from "../../../../config"; // Ensure this path is correct
import { useAuth } from "../../authentication/AuthContext"; // Ensure this path is correct

// --- Reusable Tailwind CSS classes (similar to DailyHTQC) ---
const baseInputClasses =
  "text-sm block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";
const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
const iconButtonClasses =
  "p-1.5 hover:bg-slate-200 rounded-full text-slate-600 hover:text-indigo-600 transition-colors";

// --- Time Slots (can be shared or specific if needed) ---
const TIME_SLOTS_CONFIG = [
  { key: "07:00", label: "07.00 AM", inspectionNo: 1 },
  { key: "09:00", label: "09.00 AM", inspectionNo: 2 },
  { key: "12:00", label: "12.00 PM", inspectionNo: 3 },
  { key: "14:00", label: "02.00 PM", inspectionNo: 4 },
  { key: "16:00", label: "04.00 PM", inspectionNo: 5 },
  { key: "18:00", label: "06.00 PM", inspectionNo: 6 }
];

// --- Helper Functions ---
const formatDateForAPI = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

const formatTimestampForDisplay = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

// Helper to format machine numbers (e.g., 1 -> "001")
const formatMachineNumber = (num, length = 3) =>
  String(num).padStart(length, "0");

const DailyFUQC = ({ onFormSubmit, isSubmitting: parentIsSubmitting }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // --- Settings State ---
  const [settingsEnabled, setSettingsEnabled] = useState(false);
  const [totalMachines, setTotalMachines] = useState(5); // Default total machines for FUQC
  const [tempTolerance, setTempTolerance] = useState(5); // Default temperature tolerance

  // --- Registration Form State ---
  const [inspectionDate, setInspectionDate] = useState(new Date());
  const [regMachineNo, setRegMachineNo] = useState(""); // For FUQC, this might be directly selected
  const [regMoNoSearch, setRegMoNoSearch] = useState("");
  const [regMoNo, setRegMoNo] = useState("");
  const [regBuyer, setRegBuyer] = useState("");
  const [regBuyerStyle, setRegBuyerStyle] = useState("");
  const [regColor, setRegColor] = useState("");
  const [regAvailableColors, setRegAvailableColors] = useState([]);
  const [regReqTemp, setRegReqTemp] = useState(null); // Only temp for FUQC registration
  const [moDropdownOptions, setMoDropdownOptions] = useState([]);
  const [showRegMoDropdown, setShowRegMoDropdown] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);

  const regMoSearchInputRef = useRef(null);
  const regMoDropdownContainerRef = useRef(null);

  // --- Inspection Data State ---
  const [registeredMachines, setRegisteredMachines] = useState([]); // Stores records from daily_testing_fu_qc
  const [filterMachineNo, setFilterMachineNo] = useState("All"); // For filtering the inspection table
  const [selectedTimeSlotKey, setSelectedTimeSlotKey] = useState("");
  const [actualValues, setActualValues] = useState({}); // { 'docId_slotKey': { temp_actual: val, temp_isNA: false } }
  const [isInspectionDataLoading, setIsInspectionDataLoading] = useState(false);
  const [submittingMachineSlot, setSubmittingMachineSlot] = useState(null); // Stores `docId_slotKey`

  // --- Machine Number Options ---
  const machineOptions = useMemo(
    () =>
      Array.from({ length: totalMachines }, (_, i) =>
        formatMachineNumber(i + 1)
      ),
    [totalMachines]
  );

  // --- Initialize actualValues or sync with existing inspections ---
  useEffect(() => {
    if (selectedTimeSlotKey && registeredMachines.length > 0) {
      const newActuals = { ...actualValues };
      let changed = false;
      registeredMachines.forEach((machine) => {
        const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
        const existingInspection = machine.inspections.find(
          (insp) => insp.timeSlotKey === selectedTimeSlotKey
        );

        if (existingInspection) {
          // Sync with submitted data
          if (
            !newActuals[docSlotKey] ||
            newActuals[docSlotKey].temp_actual !==
              existingInspection.temp_actual ||
            newActuals[docSlotKey].temp_isNA !== existingInspection.temp_isNA
          ) {
            newActuals[docSlotKey] = {
              temp_actual: existingInspection.temp_actual,
              temp_isNA: existingInspection.temp_isNA,
              temp_isUserModified: true // Consider it "modified" as it's from DB
            };
            changed = true;
          }
        } else {
          // Initialize for new entry
          if (!newActuals[docSlotKey]) {
            newActuals[docSlotKey] = { temp_isNA: false }; // temp_actual will be undefined until user types
            changed = true;
          } else if (newActuals[docSlotKey].temp_isNA === undefined) {
            newActuals[docSlotKey].temp_isNA = false;
            changed = true;
          }
        }
      });
      if (changed) setActualValues(newActuals);
    } else if (!selectedTimeSlotKey && Object.keys(actualValues).length > 0) {
      setActualValues({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeSlotKey, registeredMachines]);

  // --- MO Search Debounce for Registration ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (regMoNoSearch.trim().length > 0 && regMoNoSearch !== regMoNo) {
        setIsRegLoading(true);
        axios
          .get(`${API_BASE_URL}/api/scc/fu-first-output/search-active-mos`, {
            params: { term: regMoNoSearch }
          }) // Endpoint for FUQC
          .then((response) => {
            setMoDropdownOptions(response.data || []);
            setShowRegMoDropdown(response.data.length > 0);
          })
          .catch((error) => {
            console.error("Error searching FU MOs:", error);
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

  // --- Handle MO Selection for Registration ---
  const handleMoSelect = (selectedMo) => {
    setRegMoNoSearch(selectedMo.moNo);
    setRegMoNo(selectedMo.moNo);
    setRegBuyer(selectedMo.buyer);
    setRegBuyerStyle(selectedMo.buyerStyle);
    setShowRegMoDropdown(false);
    setRegColor("");
    setRegAvailableColors([]);
    setRegReqTemp(null);
    setIsRegLoading(true);
    axios
      .get(
        `${API_BASE_URL}/api/scc/fu-first-output/mo-details-for-registration`,
        { params: { moNo: selectedMo.moNo } }
      ) // Endpoint for FUQC
      .then((response) => {
        setRegAvailableColors(response.data.colors || []);
        if (response.data.colors && response.data.colors.length === 1) {
          handleColorChange(response.data.colors[0], selectedMo.moNo);
        }
      })
      .catch((error) => {
        console.error(
          "Error fetching FU MO colors:",
          error.response ? error.response.data : error.message
        );
        setRegAvailableColors([]);
      })
      .finally(() => setIsRegLoading(false));
  };

  // --- Handle Color Change for Registration ---
  const handleColorChange = (newColor, moNumberFromSelect = null) => {
    setRegColor(newColor);
    const moToUse = moNumberFromSelect || regMoNo;
    if (moToUse && newColor) {
      setIsRegLoading(true);
      axios
        .get(`${API_BASE_URL}/api/scc/fu-first-output/specs-for-registration`, {
          params: { moNo: moToUse, color: newColor }
        }) // Endpoint for FUQC
        .then((response) => {
          const specs = response.data;
          setRegReqTemp(specs?.reqTemp !== undefined ? specs.reqTemp : null);
        })
        .catch((error) => {
          console.error(
            "Error fetching FU specs:",
            error.response ? error.response.data : error.message
          );
          setRegReqTemp(null);
          Swal.fire(
            t("scc.error"),
            t(
              "sccDailyFUQC.errorFetchingSpecs",
              "Error fetching specifications for Fusing."
            ),
            "error"
          );
        })
        .finally(() => setIsRegLoading(false));
    } else {
      setRegReqTemp(null);
    }
  };

  // --- Reset Registration Form ---
  const resetRegistrationForm = () => {
    setRegMachineNo("");
    setRegMoNoSearch("");
    setRegMoNo("");
    setRegBuyer("");
    setRegBuyerStyle("");
    setRegColor("");
    setRegAvailableColors([]);
    setRegReqTemp(null);
  };

  // --- Handle Machine Registration ---
  const handleRegisterMachine = async () => {
    if (!regMachineNo || !regMoNo || !regColor) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t(
          "sccDailyFUQC.validation.fillMachineMoColor",
          "Please select Machine No, search and select MO No, and Color."
        ),
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
      baseReqTemp: regReqTemp, // Only temp for FUQC
      emp_id: user.emp_id,
      emp_kh_name: user.kh_name,
      emp_eng_name: user.eng_name,
      emp_dept_name: user.dept_name,
      emp_sect_name: user.sect_name,
      emp_job_title: user.job_title
    };
    // Assuming a generic "registerMachine" type that parent SCCPage routes to specific FUQC endpoint
    const success = await onFormSubmit("registerFUQCMachine", payload); // NEW formType
    if (success) {
      resetRegistrationForm();
      fetchRegisteredMachinesForDate();
    }
  };

  // --- Fetch Registered Machines for Inspection Table ---
  const fetchRegisteredMachinesForDate = useCallback(() => {
    if (!inspectionDate) return;
    setIsInspectionDataLoading(true);
    axios
      .get(`${API_BASE_URL}/api/scc/daily-fuqc/by-date`, {
        params: { inspectionDate: formatDateForAPI(inspectionDate) }
      }) // Endpoint for FUQC
      .then((response) => setRegisteredMachines(response.data || []))
      .catch((error) => {
        console.error("Error fetching registered FUQC machines:", error);
        setRegisteredMachines([]);
      })
      .finally(() => setIsInspectionDataLoading(false));
  }, [inspectionDate]);

  useEffect(() => {
    fetchRegisteredMachinesForDate();
  }, [fetchRegisteredMachinesForDate]);

  // --- Handlers for Inspection Table Inputs ---
  const handleActualValueChange = (docId, timeSlotKey, paramField, value) => {
    // paramField is 'temp'
    const key = `${docId}_${timeSlotKey}`;
    const actualFieldKey = `${paramField}_actual`;
    const userModifiedFlagKey = `${paramField}_isUserModified`;

    setActualValues((prev) => {
      const currentSlotData = prev[key] || { temp_isNA: false };
      const newSlotData = {
        ...currentSlotData,
        [actualFieldKey]: value === "" ? null : Number(value),
        [userModifiedFlagKey]: true
      };
      return { ...prev, [key]: newSlotData };
    });
  };

  const toggleActualNA = (docId, timeSlotKey, paramField) => {
    // paramField is 'temp'
    const key = `${docId}_${timeSlotKey}`;
    const actualFieldKey = `${paramField}_actual`;
    const isNAFlagKey = `${paramField}_isNA`;
    const userModifiedFlagKey = `${paramField}_isUserModified`;

    setActualValues((prev) => {
      const currentSlotActuals = prev[key] || { temp_isNA: false };
      const newIsNA = !currentSlotActuals[isNAFlagKey];
      return {
        ...prev,
        [key]: {
          ...currentSlotActuals,
          [actualFieldKey]: newIsNA ? null : currentSlotActuals[actualFieldKey],
          [isNAFlagKey]: newIsNA,
          [userModifiedFlagKey]: true
        }
      };
    });
  };

  const handleIncrementDecrement = (
    docId,
    timeSlotKey,
    paramField,
    increment
  ) => {
    // paramField is 'temp'
    const key = `${docId}_${timeSlotKey}`;
    const actualFieldKey = `${paramField}_actual`;
    const userModifiedFlagKey = `${paramField}_isUserModified`;

    setActualValues((prev) => {
      const currentSlotActuals = prev[key] || { temp_isNA: false };
      let currentActualNum = Number(currentSlotActuals[actualFieldKey]);
      if (isNaN(currentActualNum)) currentActualNum = 0;
      let newValue = currentActualNum + increment;

      return {
        ...prev,
        [key]: {
          ...currentSlotActuals,
          [actualFieldKey]: newValue,
          [userModifiedFlagKey]: true
        }
      };
    });
  };

  // --- Data for Inspection Table Display ---
  const inspectionTableDisplayData = useMemo(() => {
    let filtered = registeredMachines;
    if (filterMachineNo !== "All") {
      filtered = filtered.filter((m) => m.machineNo === filterMachineNo);
    }
    return filtered.sort((a, b) =>
      a.machineNo.localeCompare(b.machineNo, undefined, { numeric: true })
    ); // Numeric sort for "001", "002"
  }, [registeredMachines, filterMachineNo]);

  // --- Handle Submission of a Single Machine's Slot Inspection ---
  const handleSubmitMachineSlotInspection = async (machineDoc) => {
    if (!selectedTimeSlotKey) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyFUQC.validation.selectTimeSlot"),
        "warning"
      );
      return;
    }
    const currentSlotConfig = TIME_SLOTS_CONFIG.find(
      (ts) => ts.key === selectedTimeSlotKey
    );
    if (!currentSlotConfig) return;

    const docSlotKey = `${machineDoc._id}_${selectedTimeSlotKey}`;
    const currentActuals = actualValues[docSlotKey] || {};
    const tempActualToSubmit = currentActuals.temp_isNA
      ? null
      : currentActuals.temp_actual ?? null;

    if (!currentActuals.temp_isNA && tempActualToSubmit === null) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t(
          "sccDailyFUQC.validation.fillActualTempOrNA",
          "Please fill actual temperature or mark as N/A."
        ),
        "warning"
      );
      return;
    }

    const payload = {
      inspectionDate: formatDateForAPI(inspectionDate),
      timeSlotKey: selectedTimeSlotKey,
      inspectionNo: currentSlotConfig.inspectionNo,
      dailyFUQCDocId: machineDoc._id, // Changed key
      temp_req: machineDoc.baseReqTemp ?? null,
      temp_actual: tempActualToSubmit,
      temp_isNA: !!currentActuals.temp_isNA,
      temp_isUserModified: !!currentActuals.temp_isUserModified,
      emp_id: user.emp_id
    };
    setSubmittingMachineSlot(docSlotKey);
    const success = await onFormSubmit("submitFUQCSlotInspection", payload); // NEW formType
    setSubmittingMachineSlot(null);
    if (success) fetchRegisteredMachinesForDate();
  };

  // --- Get Status and Background Color for Cells ---
  const getStatusAndBG = useCallback(
    (actual, req, currentTolerance, isNA, forCellBackground = false) => {
      // For FUQC, tolerance is always tempTolerance
      if (isNA)
        return {
          statusText: "N/A",
          bgColor: "bg-slate-200 text-slate-600",
          icon: <EyeOff size={14} className="mr-1" />
        };
      if (forCellBackground && (actual === null || actual === undefined))
        return { statusText: "", bgColor: "bg-white" };
      if (
        actual === null ||
        req === null ||
        actual === undefined ||
        req === undefined
      )
        return {
          statusText: t("scc.pending"),
          bgColor: "bg-amber-100 text-amber-700",
          icon: <Clock size={14} className="mr-1" />
        };
      const numActual = Number(actual);
      const numReq = Number(req);
      if (isNaN(numActual) || isNaN(numReq))
        return {
          statusText: t("scc.invalidData"),
          bgColor: "bg-gray-100 text-gray-700",
          icon: <AlertTriangle size={14} className="mr-1" />
        };

      const diff = Math.round(numActual - numReq); // Assuming temp is integer

      if (Math.abs(diff) <= currentTolerance)
        return {
          statusText: `OK`,
          valueText: `(${numActual})`,
          bgColor: "bg-green-100 text-green-700",
          icon: <Check size={14} className="mr-1" />
        };

      const deviationText = diff < 0 ? `Low` : `High`;
      const valueText = `(${numActual}, ${diff < 0 ? "" : "+"}${diff})`;
      return {
        statusText: deviationText,
        valueText,
        bgColor: "bg-red-100 text-red-700",
        icon: <AlertTriangle size={14} className="mr-1" />
      };
    },
    [t, tempTolerance]
  ); // Depends on tempTolerance state for FUQC

  // --- Click Outside Handler for MO Dropdown ---
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

  if (!user)
    return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;
  const overallIsLoading =
    parentIsSubmitting ||
    isRegLoading ||
    isInspectionDataLoading ||
    !!submittingMachineSlot;

  // --- JSX Structure ---
  return (
    <div className="space-y-6 p-3 md:p-5 bg-gray-50 min-h-screen">
      {overallIsLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000]">
          <Loader2 className="animate-spin h-12 w-12 md:h-16 md:w-16 text-indigo-400" />
        </div>
      )}

      <header className="text-center mb-6">
        <h1 className="text-sm md:text-xl font-bold text-slate-800">
          {t("sccDailyFUQC.mainTitle", "Daily Fusing Machine Test Log")}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t(
            "sccDailyFUQC.mainSubtitle",
            "Regular checks to ensure fusing quality."
          )}
        </p>
      </header>

      {/* Settings Section for FUQC */}
      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center text-slate-700">
            <Settings2 size={18} className="mr-2 text-indigo-600" />
            <h2 className="text-md md:text-lg font-semibold">
              {t("sccDailyFUQC.settingsTitle", "Settings")}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setSettingsEnabled(!settingsEnabled)}
            className={`p-1.5 md:p-2 rounded-md flex items-center transition-colors ${
              settingsEnabled
                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title={
              settingsEnabled
                ? t("scc.turnOffSettings")
                : t("scc.turnOnSettings")
            }
          >
            {settingsEnabled ? <Power size={16} /> : <PowerOff size={16} />}
            <span className="ml-1.5 text-xs md:text-sm font-medium">
              {settingsEnabled ? t("scc.onUpper") : t("scc.offUpper")}
            </span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3 md:gap-x-4 md:gap-y-4 items-end">
          <div>
            <label htmlFor="fuqcTotalMachines" className={labelClasses}>
              {t("sccDailyFUQC.totalMachines", "Total Fusing Machines")}
            </label>
            <input
              id="fuqcTotalMachines"
              type="number"
              value={totalMachines}
              onChange={(e) =>
                setTotalMachines(Math.max(1, Number(e.target.value)))
              }
              disabled={!settingsEnabled}
              className={`${baseInputClasses} py-1.5`}
            />
          </div>
          <div>
            <label htmlFor="fuqcTempTolerance" className={labelClasses}>
              <AlertTriangle size={12} className="inline mr-1 text-slate-500" />
              {t("sccDailyFUQC.tempTolerance", "Temp. Tolerance (°C)")}
            </label>
            <input
              id="fuqcTempTolerance"
              type="number"
              value={tempTolerance}
              onChange={(e) => setTempTolerance(Number(e.target.value))}
              disabled={!settingsEnabled}
              className={`${baseInputClasses} py-1.5`}
            />
          </div>
        </div>
      </section>

      {/* Inspection Date Picker */}
      <div className="max-w-xs mx-auto my-4 md:my-5">
        <label
          htmlFor="fuqcInspectionDate"
          className={`${labelClasses} text-center`}
        >
          {t("scc.inspectionDate")}
        </label>
        <div className="relative">
          <DatePicker
            selected={inspectionDate}
            onChange={(date) => setInspectionDate(date)}
            dateFormat="MM/dd/yyyy"
            className={`${baseInputClasses} py-1.5 text-center`}
            id="fuqcInspectionDate"
            popperPlacement="bottom"
            wrapperClassName="w-full"
          />
          <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Register Machine Section for FUQC */}
      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
          <BookUser size={18} className="mr-2 text-indigo-600" />
          {t("sccDailyFUQC.registerMachineTitle", "Register Fusing Machine")}
        </h2>
        <div className="relative">
          {" "}
          {/* Added relative for potential absolute positioning of dropdown */}
          <table
            className="w-full text-xs sm:text-sm"
            style={{ tableLayout: "auto" }}
          >
            <thead className="bg-slate-100">
              <tr className="text-left text-slate-600 font-semibold">
                <th className="p-2 w-[15%]">{t("scc.machineNo")}</th>
                <th className="p-2 w-[25%]">{t("scc.moNo")}</th>
                <th className="p-2 w-[15%] hidden sm:table-cell">
                  {t("scc.buyer")}
                </th>
                <th className="p-2 w-[15%] hidden sm:table-cell">
                  {t("scc.buyerStyle")}
                </th>
                <th className="p-2 w-[15%]">{t("scc.color")}</th>
                <th className="p-2 w-[10%] text-center">
                  {t("sccDailyFUQC.reqTempShort", "Std.Temp")}
                </th>
                <th className="p-2 w-[15%] text-center">{t("scc.action")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                <td className="p-1.5 whitespace-nowrap">
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
                      <ul className="absolute z-[80] mt-1 w-max min-w-full bg-white shadow-xl max-h-52 md:max-h-60 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto top-full left-0">
                        {moDropdownOptions.map((mo, idx) => (
                          <li
                            key={idx}
                            onClick={() => handleMoSelect(mo)}
                            className="text-slate-900 cursor-pointer select-none relative py-1.5 px-3 hover:bg-indigo-50 hover:text-indigo-700 transition-colors whitespace-normal"
                          >
                            {mo.moNo}{" "}
                            <span className="text-xs text-slate-500">
                              ({mo.buyerStyle || t("scc.naCap")})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </td>
                <td className="p-1.5 whitespace-nowrap hidden sm:table-cell">
                  <input
                    type="text"
                    value={regBuyer}
                    readOnly
                    className={`${baseInputClasses} bg-slate-100 py-1.5`}
                  />
                </td>
                <td className="p-1.5 whitespace-nowrap hidden sm:table-cell">
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
                    onChange={(e) => handleColorChange(e.target.value)}
                    className={`${baseInputClasses} py-1.5`}
                    disabled={regAvailableColors.length === 0}
                  >
                    <option value="">{t("scc.selectColor")}</option>
                    {regAvailableColors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-1.5 whitespace-nowrap">
                  <input
                    type="number"
                    value={regReqTemp ?? ""}
                    readOnly
                    className={`${baseInputClasses} text-center bg-slate-100 py-1.5`}
                  />
                </td>
                <td className="p-1.5 whitespace-nowrap text-center">
                  <button
                    type="button"
                    onClick={handleRegisterMachine}
                    disabled={
                      !regMachineNo ||
                      !regMoNo ||
                      !regColor ||
                      isRegLoading ||
                      parentIsSubmitting
                    }
                    className="px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {t("sccDailyFUQC.register", "Register")}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Inspection Data Section for FUQC */}
      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
          <ListChecks size={18} className="mr-2 text-indigo-600" />
          {t("sccDailyFUQC.inspectionDataTitle", "Inspection Data")}
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 bg-slate-50 rounded-md mb-4 border border-slate-200">
          <div className="w-full sm:w-auto sm:flex-1">
            <label htmlFor="fuqcFilterMachineNo" className={labelClasses}>
              {t("scc.machineNo")}
            </label>
            <select
              id="fuqcFilterMachineNo"
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
            <label htmlFor="fuqcSelectedTimeSlotKey" className={labelClasses}>
              {t("sccDailyFUQC.timeSlot")}
            </label>
            <select
              id="fuqcSelectedTimeSlotKey"
              value={selectedTimeSlotKey}
              onChange={(e) => setSelectedTimeSlotKey(e.target.value)}
              className={`${baseInputClasses} py-1.5`}
            >
              <option value="">{t("sccDailyFUQC.selectTimeSlot")}</option>
              {TIME_SLOTS_CONFIG.map((ts) => (
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
                  <th className="p-2 border border-slate-300">
                    {t("scc.machineNo")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("scc.moNo")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("scc.color")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("sccDailyFUQC.parameter", "Parameter")}
                  </th>
                  <th className="p-2 border border-slate-300 text-center">
                    {t("sccDailyFUQC.reqValue", "Std.Value")}
                  </th>
                  <th className="p-2 border border-slate-300 text-center">
                    {t("sccDailyFUQC.actualValue", "Actual Value")}
                  </th>
                  <th className="p-2 border border-slate-300 text-center">
                    {t("scc.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inspectionTableDisplayData.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-4 text-center text-slate-500 italic"
                    >
                      {t("sccDailyFUQC.noMachinesRegisteredOrFiltered")}
                    </td>
                  </tr>
                )}
                {inspectionTableDisplayData.map((machine) => {
                  const existingInspectionForSlot = machine.inspections.find(
                    (insp) => insp.timeSlotKey === selectedTimeSlotKey
                  );
                  const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
                  const currentActualsForSlot = actualValues[docSlotKey] || {
                    temp_isNA: false
                  };
                  const isCurrentlySubmittingThis =
                    submittingMachineSlot === docSlotKey;

                  // Only one parameter for FUQC: Temperature
                  const param = {
                    name: t("sccDailyFUQC.temperature", "Temperature"),
                    field: "temp",
                    unit: "°C",
                    reqValue: machine.baseReqTemp,
                    tolerance: tempTolerance,
                    icon: <Thermometer size={12} />
                  };
                  const actualValueForParam = currentActualsForSlot.temp_actual;
                  const isNAForParam = currentActualsForSlot.temp_isNA;
                  const cellStatus = getStatusAndBG(
                    actualValueForParam,
                    param.reqValue,
                    param.tolerance,
                    isNAForParam,
                    true
                  );
                  const rowOverallStatus = getStatusAndBG(
                    actualValueForParam,
                    param.reqValue,
                    param.tolerance,
                    isNAForParam,
                    false
                  );

                  return (
                    <tr
                      key={`${machine._id}_${selectedTimeSlotKey}_${param.field}`}
                      className={`transition-colors text-xs ${
                        !existingInspectionForSlot &&
                        actualValueForParam !== undefined &&
                        !isNAForParam
                          ? rowOverallStatus.bgColor.replace(
                              /text-(red|green|amber)-[0-9]+/,
                              "bg-opacity-10"
                            )
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="p-2 border border-slate-300 text-center align-middle font-medium text-slate-700">
                        {machine.machineNo}
                      </td>
                      <td className="p-2 border border-slate-300 text-center align-middle text-slate-600">
                        {machine.moNo}
                      </td>
                      <td className="p-2 border border-slate-300 text-center align-middle text-slate-600">
                        {machine.color}
                      </td>
                      <td className="p-2 border border-slate-300 whitespace-nowrap text-slate-700 flex items-center">
                        {React.cloneElement(param.icon, {
                          className: "mr-1 text-indigo-600"
                        })}{" "}
                        {param.name}{" "}
                        <span className="text-slate-500 ml-0.5">
                          ({param.unit})
                        </span>
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-medium text-slate-600">
                        {param.reqValue ?? t("scc.naCap")}
                      </td>
                      <td
                        className={`p-1 border border-slate-300 text-center ${
                          !existingInspectionForSlot ? cellStatus.bgColor : ""
                        }`}
                      >
                        {existingInspectionForSlot ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold inline-flex items-center ${
                              getStatusAndBG(
                                existingInspectionForSlot.temp_actual,
                                param.reqValue,
                                param.tolerance,
                                existingInspectionForSlot.temp_isNA,
                                false
                              ).bgColor
                            }`}
                          >
                            {React.cloneElement(
                              getStatusAndBG(
                                existingInspectionForSlot.temp_actual,
                                param.reqValue,
                                param.tolerance,
                                existingInspectionForSlot.temp_isNA,
                                false
                              ).icon,
                              { size: 10, className: "mr-0.5" }
                            )}
                            {existingInspectionForSlot.temp_isNA
                              ? t("scc.naCap")
                              : existingInspectionForSlot.temp_actual ??
                                t("scc.naCap")}
                          </span>
                        ) : (
                          <div className="flex items-center justify-center space-x-0.5">
                            {isNAForParam ? (
                              <span className="italic text-slate-500 px-1.5 py-0.5">
                                {t("scc.naCap")}
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleIncrementDecrement(
                                      machine._id,
                                      selectedTimeSlotKey,
                                      param.field,
                                      -1
                                    )
                                  }
                                  className={`${iconButtonClasses} p-1`}
                                  title={t("scc.decrement")}
                                >
                                  <Minus size={10} />
                                </button>
                                <input
                                  type="number"
                                  value={actualValueForParam ?? ""}
                                  onChange={(e) =>
                                    handleActualValueChange(
                                      machine._id,
                                      selectedTimeSlotKey,
                                      param.field,
                                      e.target.value
                                    )
                                  }
                                  className="w-12 sm:w-16 text-center p-0.5 border border-slate-300 rounded text-[11px] focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleIncrementDecrement(
                                      machine._id,
                                      selectedTimeSlotKey,
                                      param.field,
                                      1
                                    )
                                  }
                                  className={`${iconButtonClasses} p-1`}
                                  title={t("scc.increment")}
                                >
                                  <Plus size={10} />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                toggleActualNA(
                                  machine._id,
                                  selectedTimeSlotKey,
                                  param.field
                                )
                              }
                              className={`${iconButtonClasses} p-1`}
                              title={
                                isNAForParam
                                  ? t("scc.markAsApplicable")
                                  : t("scc.markNA")
                              }
                            >
                              {isNAForParam ? (
                                <Eye size={10} className="text-slate-500" />
                              ) : (
                                <EyeOff size={10} />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-2 border border-slate-300 text-center align-middle">
                        {existingInspectionForSlot ? (
                          <div className="flex flex-col items-center justify-center text-green-700 ">
                            <Check
                              size={18}
                              className="mb-0.5 text-green-500"
                            />
                            <span className="text-[11px] font-semibold">
                              {t("sccDailyFUQC.submitted", "Logged")}
                            </span>
                            <span className="text-[9px] text-slate-500">
                              (
                              {formatTimestampForDisplay(
                                existingInspectionForSlot.inspectionTimestamp
                              )}
                              )
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleSubmitMachineSlotInspection(machine)
                            }
                            disabled={
                              isCurrentlySubmittingThis || parentIsSubmitting
                            }
                            className="w-full px-2 py-1.5 bg-blue-600 text-white text-[11px] font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-slate-400 flex items-center justify-center"
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
            {t("sccDailyFUQC.pleaseSelectTimeSlot")}
          </div>
        )}
      </section>
    </div>
  );
};

export default DailyFUQC;
