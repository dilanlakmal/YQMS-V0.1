// import axios from "axios";
// import {
//   AlertTriangle,
//   CheckCircle,
//   ChevronDown, // For multiselect dropdown arrow
//   Eye,
//   EyeOff,
//   Info,
//   Loader2,
//   Minus,
//   Plus,
//   Search,
//   X, // For removing selected reasons
//   History, // For Check History button
//   Triangle // Generic triangle for difference indicator
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

// const TIME_SLOTS_CONFIG = [
//   { key: "07:00", label: "07.00", inspectionNo: 1 },
//   { key: "09:00", label: "09.00", inspectionNo: 2 },
//   { key: "12:00", label: "12.00", inspectionNo: 3 },
//   { key: "14:00", label: "2.00 PM", inspectionNo: 4 }, // Adjusted label for clarity
//   { key: "16:00", label: "4.00 PM", inspectionNo: 5 },
//   { key: "18:00", label: "6.00 PM", inspectionNo: 6 }
// ];

// const TEMP_TOLERANCE = 5;
// const TIME_TOLERANCE = 2;
// const PRESSURE_TOLERANCE = 0.5; // Example for numeric pressure

// const initialSlotData = {
//   inspectionNo: 0,
//   timeSlotKey: "",
//   temp_req: null,
//   temp_actual: null,
//   temp_status: "pending",
//   temp_isUserModified: false,
//   temp_isNA: false,
//   time_req: null,
//   time_actual: null,
//   time_status: "pending",
//   time_isUserModified: false,
//   time_isNA: false,
//   pressure_req: null,
//   pressure_actual: null,
//   pressure_status: "pending",
//   pressure_isUserModified: false,
//   pressure_isNA: false
// };

// const STRETCH_TEST_REJECT_REASONS_OPTIONS = ["NA1", "NA2", "NA3", "Other"]; // Added "Other"

// const parsePressure = (pressureValue) => {
//   if (
//     pressureValue === null ||
//     pressureValue === undefined ||
//     pressureValue === ""
//   )
//     return null;
//   const num = parseFloat(pressureValue);
//   return isNaN(num) ? null : num;
// };

// const DailyHTQC = ({
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
//       ...formData, // Includes stretchTestRejectReasons from parent
//       slotsDetailed: initialSlots,
//       baseReqPressure: parsePressure(formData.baseReqPressure)
//     };
//   });

//   const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
//   const [moNoOptions, setMoNoOptions] = useState([]);
//   const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
//   const [availableColors, setAvailableColors] = useState([]);
//   const [availableMachineRecords, setAvailableMachineRecords] = useState([]);
//   const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
//   const [firstOutputSpecsLoading, setFirstOutputSpecsLoading] = useState(false);
//   const [existingQCRecordLoading, setExistingQCRecordLoading] = useState(false);
//   const [recordStatusMessage, setRecordStatusMessage] = useState("");
//   const [currentActiveSlotKey, setCurrentActiveSlotKey] = useState(null);
//   const [showHistory, setShowHistory] = useState(false); // New state for history visibility
//   const [showRejectReasonDropdown, setShowRejectReasonDropdown] =
//     useState(false);

//   const moNoInputRef = useRef(null);
//   const moNoDropdownRef = useRef(null);
//   const rejectReasonDropdownRef = useRef(null);

//   useEffect(() => {
//     setMoNoSearch(formData.moNo || "");
//     const newSlotsDetailed = TIME_SLOTS_CONFIG.reduce((acc, slotConf) => {
//       const existingInsp = formData.inspections?.find(
//         (i) => i.timeSlotKey === slotConf.key
//       );
//       acc[slotConf.key] = existingInsp
//         ? {
//             ...initialSlotData,
//             ...existingInsp,
//             temp_req:
//               existingInsp.temp_req !== null
//                 ? Number(existingInsp.temp_req)
//                 : null,
//             temp_actual:
//               existingInsp.temp_actual !== null
//                 ? Number(existingInsp.temp_actual)
//                 : null,
//             time_req:
//               existingInsp.time_req !== null
//                 ? Number(existingInsp.time_req)
//                 : null,
//             time_actual:
//               existingInsp.time_actual !== null
//                 ? Number(existingInsp.time_actual)
//                 : null,
//             pressure_req: parsePressure(existingInsp.pressure_req), // Ensure numeric pressure
//             pressure_actual: parsePressure(existingInsp.pressure_actual) // Ensure numeric pressure
//           }
//         : {
//             ...initialSlotData,
//             inspectionNo: slotConf.inspectionNo,
//             timeSlotKey: slotConf.key
//           };
//       return acc;
//     }, {});

//     setLocalFormData((prev) => ({
//       ...prev,
//       ...formData, // This will bring in stretchTestResult and stretchTestRejectReasons from parent
//       baseReqPressure: parsePressure(formData.baseReqPressure),
//       slotsDetailed: newSlotsDetailed
//     }));
//   }, [formData]);

//   const updateParentFormData = useCallback(
//     (updatedLocalData) => {
//       const inspectionsArray = Object.values(updatedLocalData.slotsDetailed)
//         .filter(
//           (slot) =>
//             slot.temp_isUserModified ||
//             slot.time_isUserModified ||
//             slot.pressure_isUserModified ||
//             slot.temp_isNA ||
//             slot.time_isNA ||
//             slot.pressure_isNA ||
//             slot.temp_actual !== null ||
//             slot.time_actual !== null ||
//             slot.pressure_actual !== null
//         )
//         .map((slot) => ({
//           inspectionNo: slot.inspectionNo,
//           timeSlotKey: slot.timeSlotKey,
//           temp_req: slot.temp_req !== null ? Number(slot.temp_req) : null,
//           temp_actual:
//             slot.temp_actual !== null ? Number(slot.temp_actual) : null,
//           temp_status: slot.temp_status,
//           temp_isUserModified: slot.temp_isUserModified,
//           temp_isNA: slot.temp_isNA,
//           time_req: slot.time_req !== null ? Number(slot.time_req) : null,
//           time_actual:
//             slot.time_actual !== null ? Number(slot.time_actual) : null,
//           time_status: slot.time_status,
//           time_isUserModified: slot.time_isUserModified,
//           time_isNA: slot.time_isNA,
//           pressure_req:
//             slot.pressure_req !== null ? Number(slot.pressure_req) : null, // Ensure numeric
//           pressure_actual:
//             slot.pressure_actual !== null ? Number(slot.pressure_actual) : null, // Ensure numeric
//           pressure_status: slot.pressure_status,
//           pressure_isUserModified: slot.pressure_isUserModified,
//           pressure_isNA: slot.pressure_isNA
//         }));

//       onFormDataChange({
//         _id: updatedLocalData._id,
//         inspectionDate: updatedLocalData.inspectionDate,
//         machineNo: updatedLocalData.machineNo,
//         moNo: updatedLocalData.moNo,
//         buyer: updatedLocalData.buyer,
//         buyerStyle: updatedLocalData.buyerStyle,
//         color: updatedLocalData.color,
//         baseReqTemp:
//           updatedLocalData.baseReqTemp !== null
//             ? Number(updatedLocalData.baseReqTemp)
//             : null,
//         baseReqTime:
//           updatedLocalData.baseReqTime !== null
//             ? Number(updatedLocalData.baseReqTime)
//             : null,
//         baseReqPressure:
//           updatedLocalData.baseReqPressure !== null
//             ? Number(updatedLocalData.baseReqPressure)
//             : null, // Ensure numeric
//         inspections: inspectionsArray,
//         stretchTestResult: updatedLocalData.stretchTestResult,
//         stretchTestRejectReasons:
//           updatedLocalData.stretchTestResult === "Reject"
//             ? updatedLocalData.stretchTestRejectReasons || []
//             : [], // Pass reasons if reject, else empty
//         washingTestResult: updatedLocalData.washingTestResult,
//         isStretchWashingTestDone: updatedLocalData.isStretchWashingTestDone
//       });
//     },
//     [onFormDataChange]
//   );

//   const resetLocalDetailedSlots = (currentLocalData) => {
//     const newSlots = { ...currentLocalData.slotsDetailed };
//     TIME_SLOTS_CONFIG.forEach((slot) => {
//       newSlots[slot.key] = {
//         ...initialSlotData,
//         inspectionNo: slot.inspectionNo,
//         timeSlotKey: slot.key
//       };
//     });
//     return { ...currentLocalData, slotsDetailed: newSlots };
//   };

//   const handleDateChange = (date) => {
//     setLocalFormData((prev) => {
//       let newLocalData = {
//         ...prev,
//         inspectionDate: date,
//         moNo: "",
//         color: "",
//         buyer: "",
//         buyerStyle: "",
//         _id: null,
//         baseReqTemp: null,
//         baseReqTime: null,
//         baseReqPressure: null,
//         stretchTestResult: "Pending",
//         stretchTestRejectReasons: [],
//         washingTestResult: "Pending",
//         isStretchWashingTestDone: false,
//         inspections: []
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
//         baseReqTime: null,
//         baseReqPressure: null,
//         stretchTestResult: "Pending",
//         stretchTestRejectReasons: [],
//         washingTestResult: "Pending",
//         isStretchWashingTestDone: false,
//         inspections: []
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

//   const handleMoSelect = (selectedMo) => {
//     setMoNoSearch(selectedMo);
//     setShowMoNoDropdown(false);
//     setLocalFormData((prev) => {
//       let newLocalData = {
//         ...prev,
//         moNo: selectedMo,
//         color: "",
//         buyer: "",
//         buyerStyle: "",
//         _id: null,
//         baseReqTemp: null,
//         baseReqTime: null,
//         baseReqPressure: null,
//         stretchTestResult: "Pending",
//         stretchTestRejectReasons: [],
//         washingTestResult: "Pending",
//         isStretchWashingTestDone: false,
//         inspections: []
//       };
//       newLocalData = resetLocalDetailedSlots(newLocalData);
//       setRecordStatusMessage("");
//       setShowHistory(false);
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       if (!localFormData.moNo) {
//         if (localFormData.buyer || localFormData.buyerStyle) {
//           setLocalFormData((prev) => {
//             const updatedData = { ...prev, buyer: "", buyerStyle: "" };
//             updateParentFormData(updatedData);
//             return updatedData;
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
//           const newLocalData = {
//             ...prev,
//             buyer: details.engName || "N/A",
//             buyerStyle: details.custStyle || "N/A"
//           };
//           updateParentFormData(newLocalData);
//           return newLocalData;
//         });
//         setAvailableColors(details.colors || []);
//       } catch (error) {
//         console.error(t("scc.errorFetchingOrderDetailsLog"), error);
//         setLocalFormData((prev) => {
//           const newLocalData = { ...prev, buyer: "", buyerStyle: "" };
//           updateParentFormData(newLocalData);
//           return newLocalData;
//         });
//         setAvailableColors([]);
//       } finally {
//         setOrderDetailsLoading(false);
//       }
//     };
//     if (localFormData.moNo) {
//       fetchOrderDetails();
//     } else {
//       if (localFormData.buyer || localFormData.buyerStyle) {
//         setLocalFormData((prev) => {
//           const updatedData = { ...prev, buyer: "", buyerStyle: "" };
//           updateParentFormData(updatedData);
//           return updatedData;
//         });
//       }
//       setAvailableColors([]);
//     }
//   }, [localFormData.moNo, t, updateParentFormData]);

//   const handleColorChange = (e) => {
//     const newColor = e.target.value;
//     setLocalFormData((prev) => {
//       let newLocalData = {
//         ...prev,
//         color: newColor,
//         _id: null,
//         baseReqTemp: null,
//         baseReqTime: null,
//         baseReqPressure: null,
//         stretchTestResult: "Pending",
//         stretchTestRejectReasons: [],
//         washingTestResult: "Pending",
//         isStretchWashingTestDone: false,
//         inspections: []
//       };
//       newLocalData = resetLocalDetailedSlots(newLocalData);
//       setRecordStatusMessage("");
//       setShowHistory(false);
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const calculateStatusAndDiff = (actual, req, tolerance) => {
//     if (actual === null || req === null)
//       return { status: "pending", diff: null };
//     const numActual = Number(actual);
//     const numReq = Number(req);
//     if (isNaN(numActual) || isNaN(numReq))
//       return { status: "pending", diff: null };

//     const difference = numActual - numReq;
//     if (Math.abs(difference) <= tolerance)
//       return { status: "ok", diff: difference };
//     return { status: numActual < numReq ? "low" : "high", diff: difference };
//   };

//   const fetchBaseSpecs = useCallback(
//     async (
//       moNoToFetch,
//       colorToFetch,
//       inspectionDateToFetch,
//       activeSlotKeyForUpdate
//     ) => {
//       if (!moNoToFetch || !colorToFetch || !inspectionDateToFetch) return;
//       setFirstOutputSpecsLoading(true);
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/scc/get-first-output-specs`,
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
//         let newBaseReqTemp = null,
//           newBaseReqTime = null,
//           newBaseReqPressure = null;
//         if (response.data.data) {
//           const specs = response.data.data;
//           newBaseReqTemp = specs.tempC !== null ? Number(specs.tempC) : null;
//           newBaseReqTime =
//             specs.timeSec !== null ? Number(specs.timeSec) : null;
//           newBaseReqPressure = parsePressure(specs.pressure); // Ensure numeric
//         }
//         setLocalFormData((prevLocalData) => {
//           const updatedSlotsDetailed = { ...prevLocalData.slotsDetailed };
//           const slotKeyToUpdate =
//             activeSlotKeyForUpdate ||
//             (TIME_SLOTS_CONFIG[0] ? TIME_SLOTS_CONFIG[0].key : null);

//           if (slotKeyToUpdate && updatedSlotsDetailed[slotKeyToUpdate]) {
//             const slot = updatedSlotsDetailed[slotKeyToUpdate];
//             if (!slot.temp_isUserModified && !slot.temp_isNA) {
//               slot.temp_req = newBaseReqTemp;
//               slot.temp_actual =
//                 slot.temp_actual === null &&
//                 !slot.temp_isNA &&
//                 newBaseReqTemp !== null
//                   ? newBaseReqTemp
//                   : slot.temp_actual;
//               slot.temp_status = slot.temp_isNA
//                 ? "na"
//                 : calculateStatusAndDiff(
//                     slot.temp_actual,
//                     slot.temp_req,
//                     TEMP_TOLERANCE
//                   ).status;
//             }
//             // Similar logic for time and pressure
//             if (!slot.time_isUserModified && !slot.time_isNA) {
//               slot.time_req = newBaseReqTime;
//               slot.time_actual =
//                 slot.time_actual === null &&
//                 !slot.time_isNA &&
//                 newBaseReqTime !== null
//                   ? newBaseReqTime
//                   : slot.time_actual;
//               slot.time_status = slot.time_isNA
//                 ? "na"
//                 : calculateStatusAndDiff(
//                     slot.time_actual,
//                     slot.time_req,
//                     TIME_TOLERANCE
//                   ).status;
//             }
//             if (!slot.pressure_isUserModified && !slot.pressure_isNA) {
//               slot.pressure_req = newBaseReqPressure;
//               slot.pressure_actual =
//                 slot.pressure_actual === null &&
//                 !slot.pressure_isNA &&
//                 newBaseReqPressure !== null
//                   ? newBaseReqPressure
//                   : slot.pressure_actual;
//               slot.pressure_status = slot.pressure_isNA
//                 ? "na"
//                 : calculateStatusAndDiff(
//                     slot.pressure_actual,
//                     slot.pressure_req,
//                     PRESSURE_TOLERANCE
//                   ).status;
//             }
//           }
//           const newLocalData = {
//             ...prevLocalData,
//             baseReqTemp: newBaseReqTemp,
//             baseReqTime: newBaseReqTime,
//             baseReqPressure: newBaseReqPressure,
//             slotsDetailed: updatedSlotsDetailed
//           };
//           updateParentFormData(newLocalData);
//           return newLocalData;
//         });
//       } catch (error) {
//         console.error(t("scc.errorFetchingHtSpecsLog"), error);
//         setLocalFormData((prevLocalData) => {
//           const newLocalData = {
//             ...prevLocalData,
//             baseReqTemp: null,
//             baseReqTime: null,
//             baseReqPressure: null
//           };
//           updateParentFormData(newLocalData);
//           return newLocalData;
//         });
//       } finally {
//         setFirstOutputSpecsLoading(false);
//       }
//     },
//     [t, updateParentFormData]
//   );

//   useEffect(() => {
//     if (
//       currentActiveSlotKey &&
//       localFormData.slotsDetailed &&
//       localFormData.slotsDetailed[currentActiveSlotKey] &&
//       localFormData.moNo &&
//       localFormData.color &&
//       localFormData.inspectionDate
//     ) {
//       fetchBaseSpecs(
//         localFormData.moNo,
//         localFormData.color,
//         localFormData.inspectionDate,
//         currentActiveSlotKey
//       );
//     }
//   }, [
//     currentActiveSlotKey,
//     localFormData.moNo,
//     localFormData.color,
//     localFormData.inspectionDate,
//     fetchBaseSpecs
//   ]);

//   useEffect(() => {
//     if (
//       currentActiveSlotKey &&
//       localFormData.slotsDetailed &&
//       localFormData.slotsDetailed[currentActiveSlotKey]
//     ) {
//       setLocalFormData((prevLocalData) => {
//         const currentSlotsDetailed = prevLocalData.slotsDetailed;
//         const slotToUpdate = { ...currentSlotsDetailed[currentActiveSlotKey] };
//         const baseTemp = prevLocalData.baseReqTemp;
//         const baseTime = prevLocalData.baseReqTime;
//         const basePressure = prevLocalData.baseReqPressure;
//         let hasChanged = false;

//         if (
//           !slotToUpdate.temp_isUserModified &&
//           !slotToUpdate.temp_isNA &&
//           baseTemp !== null
//         ) {
//           if (slotToUpdate.temp_req !== baseTemp) {
//             slotToUpdate.temp_req = baseTemp;
//             hasChanged = true;
//           }
//           if (slotToUpdate.temp_actual === null) {
//             slotToUpdate.temp_actual = baseTemp;
//             hasChanged = true;
//           }
//           slotToUpdate.temp_status = calculateStatusAndDiff(
//             slotToUpdate.temp_actual,
//             slotToUpdate.temp_req,
//             TEMP_TOLERANCE
//           ).status;
//         } else if (slotToUpdate.temp_isNA) {
//           slotToUpdate.temp_status = "na";
//         }

//         if (
//           !slotToUpdate.time_isUserModified &&
//           !slotToUpdate.time_isNA &&
//           baseTime !== null
//         ) {
//           if (slotToUpdate.time_req !== baseTime) {
//             slotToUpdate.time_req = baseTime;
//             hasChanged = true;
//           }
//           if (slotToUpdate.time_actual === null) {
//             slotToUpdate.time_actual = baseTime;
//             hasChanged = true;
//           }
//           slotToUpdate.time_status = calculateStatusAndDiff(
//             slotToUpdate.time_actual,
//             slotToUpdate.time_req,
//             TIME_TOLERANCE
//           ).status;
//         } else if (slotToUpdate.time_isNA) {
//           slotToUpdate.time_status = "na";
//         }

//         if (
//           !slotToUpdate.pressure_isUserModified &&
//           !slotToUpdate.pressure_isNA &&
//           basePressure !== null
//         ) {
//           if (slotToUpdate.pressure_req !== basePressure) {
//             slotToUpdate.pressure_req = basePressure;
//             hasChanged = true;
//           }
//           if (slotToUpdate.pressure_actual === null) {
//             slotToUpdate.pressure_actual = basePressure;
//             hasChanged = true;
//           }
//           slotToUpdate.pressure_status = calculateStatusAndDiff(
//             slotToUpdate.pressure_actual,
//             slotToUpdate.pressure_req,
//             PRESSURE_TOLERANCE
//           ).status;
//         } else if (slotToUpdate.pressure_isNA) {
//           slotToUpdate.pressure_status = "na";
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
//     localFormData.baseReqTime,
//     localFormData.baseReqPressure
//   ]);

//   const fetchDailyHTQCData = useCallback(
//     async (
//       currentMoNo,
//       currentColor,
//       currentInspectionDate,
//       currentMachineNo
//     ) => {
//       if (!currentInspectionDate || !currentMachineNo) return;
//       setExistingQCRecordLoading(true);
//       setRecordStatusMessage("");
//       setShowHistory(false);
//       let baseSpecsShouldBeFetched = false;
//       let moForBaseSpecs = currentMoNo,
//         colorForBaseSpecs = currentColor,
//         dateForBaseSpecs = currentInspectionDate;
//       let activeSlotForBaseSpecsUpdate = currentActiveSlotKey;

//       try {
//         const params = {
//           inspectionDate:
//             currentInspectionDate instanceof Date
//               ? currentInspectionDate.toISOString()
//               : currentInspectionDate,
//           machineNo: currentMachineNo
//         };
//         if (currentMoNo && currentColor) {
//           params.moNo = currentMoNo;
//           params.color = currentColor;
//         }

//         const response = await axios.get(
//           `${API_BASE_URL}/api/scc/daily-htfu-test`,
//           { params }
//         );
//         const { message, data } = response.data;

//         if (
//           message === "DAILY_HTFU_RECORD_NOT_FOUND" ||
//           (message === "NO_RECORDS_FOR_DATE_MACHINE" && !params.moNo)
//         ) {
//           setRecordStatusMessage(t("sccDailyHTQC.newRecord"));
//           setLocalFormData((prev) => {
//             let newLocalState = {
//               ...prev,
//               _id: null,
//               stretchTestResult: "Pending",
//               stretchTestRejectReasons: [],
//               washingTestResult: "Pending",
//               isStretchWashingTestDone: false,
//               inspections: [],
//               baseReqTemp: null,
//               baseReqTime: null,
//               baseReqPressure: null
//             };
//             newLocalState = resetLocalDetailedSlots(newLocalState);
//             const firstSlotKey = TIME_SLOTS_CONFIG[0]
//               ? TIME_SLOTS_CONFIG[0].key
//               : null;
//             setCurrentActiveSlotKey(firstSlotKey);
//             activeSlotForBaseSpecsUpdate = firstSlotKey;
//             return newLocalState;
//           });
//           if (params.moNo && params.color) baseSpecsShouldBeFetched = true;
//         } else if (message === "RECORD_FOUND" && data) {
//           setRecordStatusMessage(t("sccDailyHTQC.recordLoaded"));
//           const populatedSlots = TIME_SLOTS_CONFIG.reduce((acc, slotConf) => {
//             const existingInsp = (data.inspections || []).find(
//               (i) => i.timeSlotKey === slotConf.key
//             );
//             acc[slotConf.key] = existingInsp
//               ? {
//                   ...initialSlotData,
//                   ...existingInsp,
//                   temp_actual:
//                     existingInsp.temp_actual !== null
//                       ? Number(existingInsp.temp_actual)
//                       : null,
//                   time_actual:
//                     existingInsp.time_actual !== null
//                       ? Number(existingInsp.time_actual)
//                       : null,
//                   pressure_actual: parsePressure(existingInsp.pressure_actual) // Ensure numeric
//                 }
//               : {
//                   ...initialSlotData,
//                   inspectionNo: slotConf.inspectionNo,
//                   timeSlotKey: slotConf.key
//                 };
//             return acc;
//           }, {});
//           setLocalFormData((prev) => {
//             const newLocalState = {
//               ...prev,
//               _id: data._id,
//               moNo: data.moNo,
//               buyer: data.buyer,
//               buyerStyle: data.buyerStyle,
//               color: data.color,
//               baseReqTemp:
//                 data.baseReqTemp !== null ? Number(data.baseReqTemp) : null,
//               baseReqTime:
//                 data.baseReqTime !== null ? Number(data.baseReqTime) : null,
//               baseReqPressure: parsePressure(data.baseReqPressure), // Ensure numeric
//               stretchTestResult: data.stretchTestResult || "Pending",
//               stretchTestRejectReasons: data.stretchTestRejectReasons || [], // Load reasons
//               washingTestResult: data.washingTestResult || "Pending",
//               isStretchWashingTestDone: data.isStretchWashingTestDone || false,
//               inspections: data.inspections || [],
//               slotsDetailed: populatedSlots
//             };
//             setMoNoSearch(data.moNo || "");
//             const lastSubmittedInspNo =
//               (data.inspections || []).length > 0
//                 ? Math.max(...data.inspections.map((i) => i.inspectionNo))
//                 : 0;
//             const nextInspNo = lastSubmittedInspNo + 1;
//             const activeSlotConfig = TIME_SLOTS_CONFIG.find(
//               (s) => s.inspectionNo === nextInspNo
//             );
//             const newActiveSlotKey = activeSlotConfig
//               ? activeSlotConfig.key
//               : null;
//             setCurrentActiveSlotKey(newActiveSlotKey);
//             activeSlotForBaseSpecsUpdate = newActiveSlotKey;
//             return newLocalState;
//           });
//           moForBaseSpecs = data.moNo;
//           colorForBaseSpecs = data.color;
//           if (!data.baseReqTemp && data.moNo && data.color)
//             baseSpecsShouldBeFetched = true;
//         } else if (message === "MULTIPLE_MO_COLOR_FOUND" && data.length > 0) {
//           setRecordStatusMessage(t("sccDailyHTQC.selectMoColor"));
//           setAvailableMachineRecords(data);
//           setLocalFormData((prev) => {
//             let newLocalState = {
//               ...prev,
//               moNo: "",
//               color: "",
//               buyer: "",
//               buyerStyle: "",
//               _id: null,
//               baseReqTemp: null,
//               baseReqTime: null,
//               baseReqPressure: null,
//               inspections: []
//             };
//             newLocalState = resetLocalDetailedSlots(newLocalState);
//             setMoNoSearch("");
//             setCurrentActiveSlotKey(null);
//             updateParentFormData(newLocalState);
//             return newLocalState;
//           });
//         } else {
//           setRecordStatusMessage(t("sccDailyHTQC.newRecord"));
//           setLocalFormData((prev) => {
//             let newLocalState = { ...prev, _id: null, inspections: [] };
//             newLocalState = resetLocalDetailedSlots(newLocalState);
//             const firstSlotKey = TIME_SLOTS_CONFIG[0]
//               ? TIME_SLOTS_CONFIG[0].key
//               : null;
//             setCurrentActiveSlotKey(firstSlotKey);
//             activeSlotForBaseSpecsUpdate = firstSlotKey;
//             return newLocalState;
//           });
//           if (params.moNo && params.color) baseSpecsShouldBeFetched = true;
//         }
//         if (
//           baseSpecsShouldBeFetched &&
//           moForBaseSpecs &&
//           colorForBaseSpecs &&
//           dateForBaseSpecs
//         ) {
//           fetchBaseSpecs(
//             moForBaseSpecs,
//             colorForBaseSpecs,
//             dateForBaseSpecs,
//             activeSlotForBaseSpecsUpdate
//           );
//         }
//       } catch (error) {
//         console.error(t("sccDailyHTQC.errorLoadingRecord"), error);
//         Swal.fire(
//           t("scc.error"),
//           t("sccDailyHTQC.errorLoadingRecordMsg"),
//           "error"
//         );
//       } finally {
//         setExistingQCRecordLoading(false);
//       }
//     },
//     [t, fetchBaseSpecs, updateParentFormData, currentActiveSlotKey]
//   );

//   useEffect(() => {
//     if (localFormData.inspectionDate && localFormData.machineNo) {
//       fetchDailyHTQCData(
//         localFormData.moNo,
//         localFormData.color,
//         localFormData.inspectionDate,
//         localFormData.machineNo
//       );
//     }
//   }, [
//     localFormData.inspectionDate,
//     localFormData.machineNo,
//     localFormData.moNo,
//     localFormData.color,
//     fetchDailyHTQCData
//   ]);

//   const handleSlotActualValueChange = (slotKey, fieldType, value) => {
//     setLocalFormData((prev) => {
//       const newSlotsDetailed = { ...prev.slotsDetailed };
//       const slot = { ...newSlotsDetailed[slotKey] };
//       if (!slot) return prev;
//       const field_actual = `${fieldType}_actual`,
//         field_req = `${fieldType}_req`,
//         field_status = `${fieldType}_status`,
//         field_isUserModified = `${fieldType}_isUserModified`,
//         field_isNA = `${fieldType}_isNA`;
//       if (slot[field_isNA]) return prev;
//       const numValue = value === "" || value === null ? null : Number(value);
//       slot[field_actual] = numValue;
//       slot[field_isUserModified] = true;
//       const tolerance =
//         fieldType === "temp"
//           ? TEMP_TOLERANCE
//           : fieldType === "time"
//           ? TIME_TOLERANCE
//           : PRESSURE_TOLERANCE;
//       slot[field_status] = calculateStatusAndDiff(
//         numValue,
//         slot[field_req],
//         tolerance
//       ).status;
//       newSlotsDetailed[slotKey] = slot;
//       const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const handleSlotIncrementDecrement = (slotKey, fieldType, action) => {
//     setLocalFormData((prev) => {
//       const newSlotsDetailed = { ...prev.slotsDetailed };
//       const slot = { ...newSlotsDetailed[slotKey] };
//       if (!slot) return prev;
//       const field_actual = `${fieldType}_actual`,
//         field_req = `${fieldType}_req`,
//         field_status = `${fieldType}_status`,
//         field_isUserModified = `${fieldType}_isUserModified`,
//         field_isNA = `${fieldType}_isNA`;
//       if (slot[field_isNA]) return prev;
//       let currentValue = parseFloat(slot[field_actual]);
//       if (isNaN(currentValue)) {
//         currentValue = parseFloat(slot[field_req]);
//         if (isNaN(currentValue)) currentValue = 0;
//       }
//       if (action === "increment") currentValue += 1;
//       if (action === "decrement") currentValue -= 1;
//       slot[field_actual] = currentValue;
//       slot[field_isUserModified] = true;
//       const tolerance =
//         fieldType === "temp"
//           ? TEMP_TOLERANCE
//           : fieldType === "time"
//           ? TIME_TOLERANCE
//           : PRESSURE_TOLERANCE;
//       slot[field_status] = calculateStatusAndDiff(
//         currentValue,
//         slot[field_req],
//         tolerance
//       ).status;
//       newSlotsDetailed[slotKey] = slot;
//       const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const toggleSlotNA = (slotKey, fieldType) => {
//     setLocalFormData((prev) => {
//       const newSlotsDetailed = { ...prev.slotsDetailed };
//       const slot = { ...newSlotsDetailed[slotKey] };
//       if (!slot) return prev;
//       const field_actual = `${fieldType}_actual`,
//         field_req = `${fieldType}_req`,
//         field_status = `${fieldType}_status`,
//         field_isNA = `${fieldType}_isNA`;
//       slot[field_isNA] = !slot[field_isNA];
//       if (slot[field_isNA]) {
//         slot[field_actual] = null;
//         slot[field_status] = "na";
//       } else {
//         slot[field_actual] =
//           slot[field_actual] === null ? slot[field_req] : slot[field_actual];
//         const tolerance =
//           fieldType === "temp"
//             ? TEMP_TOLERANCE
//             : fieldType === "time"
//             ? TIME_TOLERANCE
//             : PRESSURE_TOLERANCE;
//         slot[field_status] = calculateStatusAndDiff(
//           slot[field_actual],
//           slot[field_req],
//           tolerance
//         ).status;
//       }
//       newSlotsDetailed[slotKey] = slot;
//       const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const handleTestResultChange = (field, value) => {
//     setLocalFormData((prev) => {
//       const newLocalData = { ...prev, [field]: value };
//       // If stretchTestResult is changed to not 'Reject', clear reasons
//       if (field === "stretchTestResult" && value !== "Reject") {
//         newLocalData.stretchTestRejectReasons = [];
//       }
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const handleRejectReasonSelect = (reason) => {
//     setLocalFormData((prev) => {
//       const currentReasons = prev.stretchTestRejectReasons || [];
//       let newReasons;
//       if (currentReasons.includes(reason)) {
//         newReasons = currentReasons.filter((r) => r !== reason); // Remove if already selected
//       } else {
//         newReasons = [...currentReasons, reason]; // Add if not selected
//       }
//       const newLocalData = { ...prev, stretchTestRejectReasons: newReasons };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//     // Do not close dropdown: setShowRejectReasonDropdown(false);
//   };

//   const getCellBG = (status, isNA) => {
//     if (isNA) return "bg-gray-200 text-gray-500";
//     if (status === "ok") return "bg-green-100 text-green-700";
//     if (status === "low" || status === "high") return "bg-red-100 text-red-700";
//     return "bg-white";
//   };

//   const handleFormActualSubmit = () => {
//     if (
//       !localFormData.inspectionDate ||
//       !localFormData.machineNo ||
//       !localFormData.moNo ||
//       !localFormData.color
//     ) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyHTQC.validation.fillBasic"),
//         "warning"
//       );
//       return;
//     }
//     if (!currentActiveSlotKey) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyHTQC.validation.allSlotsDone"),
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
//     if (
//       (activeSlotData.temp_actual === null && !activeSlotData.temp_isNA) ||
//       (activeSlotData.time_actual === null && !activeSlotData.time_isNA) ||
//       (activeSlotData.pressure_actual === null && !activeSlotData.pressure_isNA)
//     ) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyHTQC.validation.fillActiveSlot"),
//         "warning"
//       );
//       return;
//     }
//     if (
//       localFormData.stretchTestResult === "Reject" &&
//       (!localFormData.stretchTestRejectReasons ||
//         localFormData.stretchTestRejectReasons.length === 0)
//     ) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyHTQC.validation.rejectReasonRequired"),
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
//       baseReqTime:
//         localFormData.baseReqTime !== null
//           ? Number(localFormData.baseReqTime)
//           : null,
//       baseReqPressure:
//         localFormData.baseReqPressure !== null
//           ? Number(localFormData.baseReqPressure)
//           : null, // Ensure numeric
//       stretchTestResult: localFormData.stretchTestResult,
//       stretchTestRejectReasons:
//         localFormData.stretchTestResult === "Reject"
//           ? localFormData.stretchTestRejectReasons || []
//           : [],
//       washingTestResult: localFormData.washingTestResult,
//       isStretchWashingTestDone: localFormData.isStretchWashingTestDone,
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
//         temp_status: activeSlotData.temp_status,
//         temp_isUserModified: activeSlotData.temp_isUserModified,
//         temp_isNA: activeSlotData.temp_isNA,
//         time_req:
//           activeSlotData.time_req !== null
//             ? Number(activeSlotData.time_req)
//             : null,
//         time_actual:
//           activeSlotData.time_actual !== null
//             ? Number(activeSlotData.time_actual)
//             : null,
//         time_status: activeSlotData.time_status,
//         time_isUserModified: activeSlotData.time_isUserModified,
//         time_isNA: activeSlotData.time_isNA,
//         pressure_req:
//           activeSlotData.pressure_req !== null
//             ? Number(activeSlotData.pressure_req)
//             : null, // Ensure numeric
//         pressure_actual:
//           activeSlotData.pressure_actual !== null
//             ? Number(activeSlotData.pressure_actual)
//             : null, // Ensure numeric
//         pressure_status: activeSlotData.pressure_status,
//         pressure_isUserModified: activeSlotData.pressure_isUserModified,
//         pressure_isNA: activeSlotData.pressure_isNA
//       }
//     };
//     onFormSubmit(formType, payloadForParent);
//   };

//   const loading =
//     orderDetailsLoading || firstOutputSpecsLoading || existingQCRecordLoading;

//   const renderDifference = (actual, req, tolerance, fieldType) => {
//     if (
//       actual === null ||
//       req === null ||
//       isNaN(Number(actual)) ||
//       isNaN(Number(req))
//     )
//       return null;
//     const { status, diff } = calculateStatusAndDiff(actual, req, tolerance);
//     if (status === "ok" || diff === 0 || diff === null) return null; // No indicator for 'ok' or zero difference

//     const isHigh = status === "high";
//     const colorClass = isHigh ? "text-red-500" : "text-orange-500"; // Red for high, orange for low
//     const sign = isHigh ? "+" : "";

//     return (
//       <span
//         className={`ml-1 text-xs font-semibold ${colorClass} flex items-center`}
//       >
//         <Triangle
//           className={`w-2 h-2 fill-current ${
//             isHigh ? "rotate-0" : "rotate-180"
//           }`}
//         />
//         {sign}
//         {diff.toFixed(fieldType === "pressure" ? 1 : 0)}
//       </span>
//     );
//   };

//   const currentSlotTableTitle = useMemo(() => {
//     if (!currentActiveSlotKey) return t("sccDailyHTQC.noActiveSlot");
//     const slotConfig = TIME_SLOTS_CONFIG.find(
//       (s) => s.key === currentActiveSlotKey
//     );
//     if (!slotConfig) return t("sccDailyHTQC.noActiveSlot");
//     return `${t("sccDailyHTQC.currentInspectionSlot")}: ${slotConfig.label} (#${
//       slotConfig.inspectionNo
//     })`;
//   }, [currentActiveSlotKey, t]);

//   const renderCurrentSlotTable = () => {
//     if (!currentActiveSlotKey) return null;
//     const currentSlot = localFormData.slotsDetailed[currentActiveSlotKey];
//     if (!currentSlot) return null;

//     const parameters = [
//       {
//         label: t("sccDailyHTQC.temperature"),
//         field: "temp",
//         unit: "°C",
//         tolerance: TEMP_TOLERANCE
//       },
//       {
//         label: t("sccDailyHTQC.timing"),
//         field: "time",
//         unit: "Sec",
//         tolerance: TIME_TOLERANCE
//       },
//       {
//         label: t("sccDailyHTQC.pressure"),
//         field: "pressure",
//         unit: "Bar",
//         tolerance: PRESSURE_TOLERANCE
//       } // Assuming Bar unit
//     ];

//     return (
//       <div className="border border-gray-300 rounded-lg shadow-sm bg-white overflow-hidden">
//         <table className="min-w-full text-xs divide-y divide-gray-200">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="px-3 py-2.5 text-left font-semibold text-gray-700 border-r w-1/3">
//                 {t("sccDailyHTQC.parameter")}
//               </th>
//               <th className="px-3 py-2.5 text-center font-semibold text-gray-700 border-r w-1/3">
//                 {t("sccDailyHTQC.reqValue")}
//               </th>
//               <th className="px-3 py-2.5 text-center font-semibold text-gray-700 w-1/3">
//                 {t("sccDailyHTQC.actualValue")}
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {parameters.map((param) => {
//               const reqVal = currentSlot[`${param.field}_req`];
//               const actualVal = currentSlot[`${param.field}_actual`];
//               const isNA = currentSlot[`${param.field}_isNA`];
//               const { status } = calculateStatusAndDiff(
//                 actualVal,
//                 reqVal,
//                 param.tolerance
//               );

//               return (
//                 <tr
//                   key={param.field}
//                   className={`hover:bg-gray-50 ${getCellBG(status, isNA)}`}
//                 >
//                   <td className="px-3 py-2 border-r font-medium">
//                     {param.label} {param.unit ? `(${param.unit})` : ""}
//                   </td>
//                   <td className="px-3 py-2 border-r text-center">
//                     {reqVal !== null ? reqVal : "N/A"}
//                   </td>
//                   <td className={`px-1.5 py-1.5 text-center`}>
//                     {isNA ? (
//                       <span className="italic text-gray-500">
//                         {t("scc.na")}
//                       </span>
//                     ) : (
//                       <div className="flex items-center justify-center">
//                         <input
//                           type="number"
//                           inputMode="numeric"
//                           value={actualVal !== null ? actualVal : ""}
//                           onChange={(e) =>
//                             handleSlotActualValueChange(
//                               currentActiveSlotKey,
//                               param.field,
//                               e.target.value
//                             )
//                           }
//                           className={`${inputFieldClasses} text-center text-xs p-1 w-20`}
//                         />
//                         {renderDifference(
//                           actualVal,
//                           reqVal,
//                           param.tolerance,
//                           param.field
//                         )}
//                       </div>
//                     )}
//                     <div className="flex justify-center items-center space-x-2 mt-1">
//                       {!isNA && (
//                         <>
//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleSlotIncrementDecrement(
//                                 currentActiveSlotKey,
//                                 param.field,
//                                 "decrement"
//                               )
//                             }
//                             className="p-1 hover:bg-gray-200 rounded-full"
//                           >
//                             <Minus size={12} />
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleSlotIncrementDecrement(
//                                 currentActiveSlotKey,
//                                 param.field,
//                                 "increment"
//                               )
//                             }
//                             className="p-1 hover:bg-gray-200 rounded-full"
//                           >
//                             <Plus size={12} />
//                           </button>
//                         </>
//                       )}
//                       <button
//                         type="button"
//                         onClick={() =>
//                           toggleSlotNA(currentActiveSlotKey, param.field)
//                         }
//                         className="p-1 hover:bg-gray-200 rounded-full"
//                       >
//                         {isNA ? (
//                           <EyeOff size={12} className="text-gray-500" />
//                         ) : (
//                           <Eye size={12} />
//                         )}
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   const renderPreviousRecordsTable = () => {
//     if (!showHistory) return null;
//     const submittedInspections = (localFormData.inspections || [])
//       .filter((insp) => insp.timeSlotKey !== currentActiveSlotKey) // Exclude current active slot
//       .sort((a, b) => a.inspectionNo - b.inspectionNo);

//     if (submittedInspections.length === 0) {
//       return (
//         <p className="text-sm text-gray-500 italic mt-2">
//           {t("sccDailyHTQC.noHistoryToShow")}
//         </p>
//       );
//     }

//     const parameters = [
//       {
//         label: t("sccDailyHTQC.temperature"),
//         field: "temp",
//         unit: "°C",
//         tolerance: TEMP_TOLERANCE
//       },
//       {
//         label: t("sccDailyHTQC.timing"),
//         field: "time",
//         unit: "Sec",
//         tolerance: TIME_TOLERANCE
//       },
//       {
//         label: t("sccDailyHTQC.pressure"),
//         field: "pressure",
//         unit: "Bar",
//         tolerance: PRESSURE_TOLERANCE
//       }
//     ];

//     return (
//       <div className="border border-gray-300 rounded-lg shadow-sm bg-white mt-5 overflow-hidden">
//         <h3 className="text-md font-semibold text-gray-700 px-4 py-3 bg-gray-100 border-b">
//           {t("sccDailyHTQC.previousRecords")}
//         </h3>
//         <div className="overflow-x-auto">
//           <table className="min-w-full text-xs divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-r sticky left-0 bg-gray-50 z-10 min-w-[120px]">
//                   {t("sccDailyHTQC.parameter")}
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
//               {parameters.map((param) => (
//                 <tr key={param.field} className="hover:bg-gray-50">
//                   <td className="px-3 py-2 border-r font-medium text-gray-700 sticky left-0 bg-white z-10">
//                     {param.label} {param.unit ? `(${param.unit})` : ""}
//                   </td>
//                   {submittedInspections.map((insp) => {
//                     const actualVal = insp[`${param.field}_actual`];
//                     const reqVal = insp[`${param.field}_req`];
//                     const isNA = insp[`${param.field}_isNA`];
//                     const { status } = calculateStatusAndDiff(
//                       actualVal,
//                       reqVal,
//                       param.tolerance
//                     );

//                     return (
//                       <td
//                         key={`${insp.timeSlotKey}-${param.field}`}
//                         className={`px-3 py-2 border-r text-center ${getCellBG(
//                           status,
//                           isNA
//                         )}`}
//                       >
//                         {isNA ? (
//                           <span className="italic">{t("scc.na")}</span>
//                         ) : actualVal !== null ? (
//                           actualVal
//                         ) : (
//                           ""
//                         )}
//                         {!isNA &&
//                           renderDifference(
//                             actualVal,
//                             reqVal,
//                             param.tolerance,
//                             param.field
//                           )}
//                       </td>
//                     );
//                   })}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     );
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         rejectReasonDropdownRef.current &&
//         !rejectReasonDropdownRef.current.contains(event.target)
//       ) {
//         setShowRejectReasonDropdown(false);
//       }
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

//   if (!user)
//     return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;

//   return (
//     <div className="space-y-5">
//       <h2 className="text-lg font-semibold text-gray-800">
//         {t("sccDailyHTQC.title")}
//       </h2>
//       <p className="text-xs text-gray-600 -mt-3">
//         {t("sccDailyHTQC.subtitle")}
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
//               t("sccDailyHTQC.newRecordKey", "New")
//             ) ||
//             recordStatusMessage.includes(
//               t("sccDailyHTQC.selectMoColorKey", "select MO and Color")
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
//           <label htmlFor="htqcInspectionDate" className={labelClasses}>
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
//             id="htqcInspectionDate"
//           />
//         </div>
//         <div>
//           <label htmlFor="htqcMachineNo" className={labelClasses}>
//             {t("scc.machineNo")}
//           </label>
//           <select
//             id="htqcMachineNo"
//             name="machineNo"
//             value={localFormData.machineNo || ""}
//             onChange={handleMachineNoChange}
//             className={inputFieldClasses}
//             required
//           >
//             <option value="">{t("scc.selectMachine")}</option>
//             {Array.from({ length: 15 }, (_, i) => String(i + 1)).map((num) => (
//               <option key={`machine-${num}`} value={num}>
//                 {num}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="relative">
//           <label htmlFor="htqcMoNoSearch" className={labelClasses}>
//             {t("scc.moNo")}
//           </label>
//           <div className="relative mt-1" ref={moNoDropdownRef}>
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Search className="h-5 w-5 text-gray-400" />
//             </div>
//             <input
//               type="text"
//               id="htqcMoNoSearch"
//               value={moNoSearch}
//               ref={moNoInputRef}
//               onChange={(e) => setMoNoSearch(e.target.value)}
//               onFocus={() => setShowMoNoDropdown(true)}
//               placeholder={t("scc.searchMoNo")}
//               className={`${inputFieldClasses} pl-10`}
//               required
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
//           {availableMachineRecords.length > 0 && !localFormData.moNo && (
//             <div className="mt-1">
//               <label
//                 htmlFor="selectExistingMo"
//                 className={`${labelClasses} text-xs`}
//               >
//                 {t("sccDailyHTQC.selectExisting")}
//               </label>
//               <select
//                 id="selectExistingMo"
//                 onChange={(e) => {
//                   const val = e.target.value;
//                   if (val) {
//                     const [sm, sc] = val.split("|");
//                     setLocalFormData((p) => {
//                       let nd = {
//                         ...p,
//                         moNo: sm,
//                         color: sc,
//                         _id: null,
//                         baseReqTemp: null,
//                         baseReqTime: null,
//                         baseReqPressure: null,
//                         inspections: []
//                       };
//                       nd = resetLocalDetailedSlots(nd);
//                       setMoNoSearch(sm);
//                       return nd;
//                     });
//                   }
//                 }}
//                 className={inputFieldClasses}
//                 defaultValue=""
//               >
//                 <option value="">-- {t("scc.select")} --</option>
//                 {availableMachineRecords.map((rec) => (
//                   <option
//                     key={`${rec.moNo}-${rec.color}`}
//                     value={`${rec.moNo}|${rec.color}`}
//                   >
//                     {rec.moNo} - {rec.color} ({rec.buyerStyle || t("scc.naCap")}
//                     )
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}
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
//           <label htmlFor="htqcColor" className={labelClasses}>
//             {t("scc.color")}
//           </label>
//           <select
//             id="htqcColor"
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

//       {localFormData.moNo && localFormData.color && (
//         <div className="mt-4 space-y-4">
//           <h3 className="text-md font-semibold text-gray-700">
//             {currentSlotTableTitle}
//           </h3>
//           {currentActiveSlotKey ? (
//             renderCurrentSlotTable()
//           ) : (
//             <div className="text-center py-4 text-gray-500 italic">
//               {t("sccDailyHTQC.allInspectionsCompleted")}
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
//                 ? t("sccDailyHTQC.hideHistory")
//                 : t("sccDailyHTQC.checkHistory")}
//             </button>
//           </div>
//           {renderPreviousRecordsTable()}

//           {!localFormData.isStretchWashingTestDone && currentActiveSlotKey && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start pt-4 border-t border-gray-200 mt-4">
//               <div>
//                 <label htmlFor="htqcStretchTest" className={labelClasses}>
//                   {t("sccDailyHTQC.stretchScratchTest")}
//                 </label>
//                 <select
//                   id="htqcStretchTest"
//                   value={localFormData.stretchTestResult || "Pending"}
//                   onChange={(e) =>
//                     handleTestResultChange("stretchTestResult", e.target.value)
//                   }
//                   className={`${inputFieldClasses} ${
//                     localFormData.stretchTestResult === "Pass"
//                       ? "bg-green-50 text-green-700"
//                       : localFormData.stretchTestResult === "Reject"
//                       ? "bg-red-50 text-red-700"
//                       : ""
//                   }`}
//                 >
//                   <option value="Pending">{t("scc.pending")}</option>
//                   <option value="Pass">{t("scc.pass")}</option>
//                   <option value="Reject">{t("scc.reject")}</option>
//                 </select>
//                 {localFormData.stretchTestResult === "Reject" && (
//                   <div className="mt-2 relative" ref={rejectReasonDropdownRef}>
//                     <label className={`${labelClasses} text-xs`}>
//                       {t("sccDailyHTQC.rejectReasons")}
//                     </label>
//                     <button
//                       type="button"
//                       onClick={() =>
//                         setShowRejectReasonDropdown((prev) => !prev)
//                       }
//                       className="w-full text-left px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm flex justify-between items-center"
//                     >
//                       <span>
//                         {(localFormData.stretchTestRejectReasons || []).join(
//                           ", "
//                         ) || t("sccDailyHTQC.selectReasons")}
//                       </span>
//                       <ChevronDown
//                         size={16}
//                         className={`transform transition-transform ${
//                           showRejectReasonDropdown ? "rotate-180" : ""
//                         }`}
//                       />
//                     </button>
//                     {showRejectReasonDropdown && (
//                       <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto py-1">
//                         {STRETCH_TEST_REJECT_REASONS_OPTIONS.map((reason) => (
//                           <div
//                             key={reason}
//                             onClick={() => handleRejectReasonSelect(reason)}
//                             className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
//                               (
//                                 localFormData.stretchTestRejectReasons || []
//                               ).includes(reason)
//                                 ? "bg-indigo-50 text-indigo-700"
//                                 : ""
//                             }`}
//                           >
//                             {reason}
//                             {(
//                               localFormData.stretchTestRejectReasons || []
//                             ).includes(reason) && (
//                               <CheckCircle
//                                 size={14}
//                                 className="text-indigo-600"
//                               />
//                             )}
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//               <div>
//                 <label htmlFor="htqcWashingTest" className={labelClasses}>
//                   {t("sccDailyHTQC.washingTest")}
//                 </label>
//                 <select
//                   id="htqcWashingTest"
//                   value={localFormData.washingTestResult || "Pending"}
//                   onChange={(e) =>
//                     handleTestResultChange("washingTestResult", e.target.value)
//                   }
//                   className={`${inputFieldClasses} ${
//                     localFormData.washingTestResult === "Pass"
//                       ? "bg-green-50 text-green-700"
//                       : localFormData.washingTestResult === "Reject"
//                       ? "bg-red-50 text-red-700"
//                       : ""
//                   }`}
//                 >
//                   <option value="Pending">{t("scc.pending")}</option>
//                   <option value="Pass">{t("scc.pass")}</option>
//                   <option value="Reject">{t("scc.reject")}</option>
//                 </select>
//               </div>
//             </div>
//           )}
//           {localFormData.isStretchWashingTestDone /* Display read-only if tests are marked done */ && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start pt-4 border-t border-gray-200 mt-4">
//               <div>
//                 <label className={labelClasses}>
//                   {t("sccDailyHTQC.stretchScratchTest")}
//                 </label>
//                 <input
//                   type="text"
//                   value={t(
//                     `scc.${
//                       localFormData.stretchTestResult?.toLowerCase() ||
//                       "pending"
//                     }`
//                   )}
//                   readOnly
//                   className={`${inputFieldReadonlyClasses} ${
//                     localFormData.stretchTestResult === "Pass"
//                       ? "bg-green-100 text-green-700"
//                       : localFormData.stretchTestResult === "Reject"
//                       ? "bg-red-100 text-red-700"
//                       : ""
//                   }`}
//                 />
//                 {localFormData.stretchTestResult === "Reject" &&
//                   (localFormData.stretchTestRejectReasons || []).length > 0 && (
//                     <div className="mt-1 text-xs text-gray-600">
//                       <strong>{t("sccDailyHTQC.reasons")}:</strong>{" "}
//                       {localFormData.stretchTestRejectReasons.join(", ")}
//                     </div>
//                   )}
//               </div>
//               <div>
//                 <label className={labelClasses}>
//                   {t("sccDailyHTQC.washingTest")}
//                 </label>
//                 <input
//                   type="text"
//                   value={t(
//                     `scc.${
//                       localFormData.washingTestResult?.toLowerCase() ||
//                       "pending"
//                     }`
//                   )}
//                   readOnly
//                   className={`${inputFieldReadonlyClasses} ${
//                     localFormData.washingTestResult === "Pass"
//                       ? "bg-green-100 text-green-700"
//                       : localFormData.washingTestResult === "Reject"
//                       ? "bg-red-100 text-red-700"
//                       : ""
//                   }`}
//                 />
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       <div className="pt-5 flex justify-end">
//         <button
//           type="button"
//           onClick={handleFormActualSubmit}
//           disabled={isSubmitting || !currentActiveSlotKey || loading}
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

// export default DailyHTQC;

// //src / components / inspection / scc / DailyHTQC.jsx;
// import axios from "axios";
// import {
//   CheckCircle,
//   ChevronDown,
//   Eye,
//   EyeOff,
//   Info,
//   Loader2,
//   Minus,
//   Plus,
//   Search,
//   Triangle
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

// const TIME_SLOTS_CONFIG = [
//   { key: "07:00", label: "07.00", inspectionNo: 1 },
//   { key: "09:00", label: "09.00", inspectionNo: 2 },
//   { key: "12:00", label: "12.00", inspectionNo: 3 },
//   { key: "14:00", label: "2.00 PM", inspectionNo: 4 },
//   { key: "16:00", label: "4.00 PM", inspectionNo: 5 },
//   { key: "18:00", label: "6.00 PM", inspectionNo: 6 }
// ];

// const TEMP_TOLERANCE = 5;
// const TIME_TOLERANCE = 0;
// const PRESSURE_TOLERANCE = 0;

// const initialSlotData = {
//   inspectionNo: 0,
//   timeSlotKey: "",
//   temp_req: null,
//   temp_actual: null,
//   temp_status: "pending",
//   temp_isUserModified: false,
//   temp_isNA: false,
//   time_req: null,
//   time_actual: null,
//   time_status: "pending",
//   time_isUserModified: false,
//   time_isNA: false,
//   pressure_req: null,
//   pressure_actual: null,
//   pressure_status: "pending",
//   pressure_isUserModified: false,
//   pressure_isNA: false
// };

// const STRETCH_TEST_REJECT_REASONS_OPTIONS = ["NA1", "NA2", "NA3", "Other"];

// const parsePressure = (pressureValue) => {
//   if (
//     pressureValue === null ||
//     pressureValue === undefined ||
//     pressureValue === ""
//   )
//     return null;
//   const num = parseFloat(pressureValue);
//   return isNaN(num) ? null : num;
// };

// const DailyHTQC = ({
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
//       baseReqPressure: parsePressure(formData.baseReqPressure)
//     };
//   });

//   const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
//   const [moNoOptions, setMoNoOptions] = useState([]);
//   const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
//   const [availableColors, setAvailableColors] = useState([]);
//   const [availableMachineRecords, setAvailableMachineRecords] = useState([]);
//   const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
//   const [firstOutputSpecsLoading, setFirstOutputSpecsLoading] = useState(false);
//   const [existingQCRecordLoading, setExistingQCRecordLoading] = useState(false);
//   const [recordStatusMessage, setRecordStatusMessage] = useState("");
//   const [currentActiveSlotKey, setCurrentActiveSlotKey] = useState(null);
//   const [showRejectReasonDropdown, setShowRejectReasonDropdown] =
//     useState(false);

//   const moNoInputRef = useRef(null);
//   const moNoDropdownRef = useRef(null);
//   const rejectReasonDropdownRef = useRef(null);

//   useEffect(() => {
//     setMoNoSearch(formData.moNo || "");
//     const newSlotsDetailed = TIME_SLOTS_CONFIG.reduce((acc, slotConf) => {
//       const existingInsp = formData.inspections?.find(
//         (i) => i.timeSlotKey === slotConf.key
//       );
//       acc[slotConf.key] = existingInsp
//         ? {
//             ...initialSlotData,
//             ...existingInsp,
//             temp_req:
//               existingInsp.temp_req !== null
//                 ? Number(existingInsp.temp_req)
//                 : null,
//             temp_actual:
//               existingInsp.temp_actual !== null
//                 ? Number(existingInsp.temp_actual)
//                 : null,
//             time_req:
//               existingInsp.time_req !== null
//                 ? Number(existingInsp.time_req)
//                 : null,
//             time_actual:
//               existingInsp.time_actual !== null
//                 ? Number(existingInsp.time_actual)
//                 : null,
//             pressure_req: parsePressure(existingInsp.pressure_req),
//             pressure_actual: parsePressure(existingInsp.pressure_actual)
//           }
//         : {
//             ...initialSlotData,
//             inspectionNo: slotConf.inspectionNo,
//             timeSlotKey: slotConf.key
//           };
//       return acc;
//     }, {});

//     setLocalFormData((prev) => ({
//       ...prev, // Keep local UI states
//       ...formData, // Sync with all data from parent
//       baseReqPressure: parsePressure(formData.baseReqPressure),
//       slotsDetailed: newSlotsDetailed
//     }));
//   }, [formData]);

//   const updateParentFormData = useCallback(
//     (updatedLocalData) => {
//       const inspectionsArray = Object.values(updatedLocalData.slotsDetailed)
//         .filter(
//           (slot) =>
//             slot.temp_isUserModified ||
//             slot.time_isUserModified ||
//             slot.pressure_isUserModified ||
//             slot.temp_isNA ||
//             slot.time_isNA ||
//             slot.pressure_isNA ||
//             slot.temp_actual !== null ||
//             slot.time_actual !== null ||
//             slot.pressure_actual !== null
//         )
//         .map((slot) => ({
//           inspectionNo: slot.inspectionNo,
//           timeSlotKey: slot.timeSlotKey,
//           temp_req: slot.temp_req !== null ? Number(slot.temp_req) : null,
//           temp_actual:
//             slot.temp_actual !== null ? Number(slot.temp_actual) : null,
//           temp_status: slot.temp_status,
//           temp_isUserModified: slot.temp_isUserModified,
//           temp_isNA: slot.temp_isNA,
//           time_req: slot.time_req !== null ? Number(slot.time_req) : null,
//           time_actual:
//             slot.time_actual !== null ? Number(slot.time_actual) : null,
//           time_status: slot.time_status,
//           time_isUserModified: slot.time_isUserModified,
//           time_isNA: slot.time_isNA,
//           pressure_req:
//             slot.pressure_req !== null ? Number(slot.pressure_req) : null,
//           pressure_actual:
//             slot.pressure_actual !== null ? Number(slot.pressure_actual) : null,
//           pressure_status: slot.pressure_status,
//           pressure_isUserModified: slot.pressure_isUserModified,
//           pressure_isNA: slot.pressure_isNA
//         }));

//       onFormDataChange({
//         _id: updatedLocalData._id,
//         inspectionDate: updatedLocalData.inspectionDate,
//         machineNo: updatedLocalData.machineNo,
//         moNo: updatedLocalData.moNo,
//         buyer: updatedLocalData.buyer,
//         buyerStyle: updatedLocalData.buyerStyle,
//         color: updatedLocalData.color,
//         baseReqTemp:
//           updatedLocalData.baseReqTemp !== null
//             ? Number(updatedLocalData.baseReqTemp)
//             : null,
//         baseReqTime:
//           updatedLocalData.baseReqTime !== null
//             ? Number(updatedLocalData.baseReqTime)
//             : null,
//         baseReqPressure:
//           updatedLocalData.baseReqPressure !== null
//             ? Number(updatedLocalData.baseReqPressure)
//             : null,
//         inspections: inspectionsArray,
//         stretchTestResult: updatedLocalData.stretchTestResult,
//         stretchTestRejectReasons:
//           updatedLocalData.stretchTestResult === "Reject"
//             ? updatedLocalData.stretchTestRejectReasons || []
//             : [],
//         washingTestResult: updatedLocalData.washingTestResult,
//         isStretchWashingTestDone: updatedLocalData.isStretchWashingTestDone
//       });
//     },
//     [onFormDataChange]
//   );

//   const resetLocalDetailedSlots = (currentLocalData) => {
//     const newSlots = { ...currentLocalData.slotsDetailed };
//     TIME_SLOTS_CONFIG.forEach((slot) => {
//       newSlots[slot.key] = {
//         ...initialSlotData,
//         inspectionNo: slot.inspectionNo,
//         timeSlotKey: slot.key
//       };
//     });
//     return { ...currentLocalData, slotsDetailed: newSlots };
//   };

//   const resetFormForNewMoOrColor = (
//     prevLocalData,
//     newMoNo = "",
//     newColor = ""
//   ) => {
//     let newLocalData = {
//       ...prevLocalData,
//       moNo: newMoNo,
//       color: newColor,
//       buyer: "",
//       buyerStyle: "",
//       _id: null, // Critical: treat as a new record for this MO/Color
//       baseReqTemp: null,
//       baseReqTime: null,
//       baseReqPressure: null,
//       stretchTestResult: "Pending",
//       stretchTestRejectReasons: [],
//       washingTestResult: "Pending",
//       isStretchWashingTestDone: false,
//       inspections: [] // Clear inspections for the new MO/Color
//     };
//     newLocalData = resetLocalDetailedSlots(newLocalData); // Reset all slot details
//     if (newMoNo) setMoNoSearch(newMoNo); // Update search bar if MO is set
//     else setMoNoSearch(""); // Clear search if MO is cleared

//     setAvailableColors([]); // Will be refetched if MO is valid
//     setCurrentActiveSlotKey(TIME_SLOTS_CONFIG[0]?.key || null); // Reset to first slot
//     setRecordStatusMessage("");
//     return newLocalData;
//   };

//   const handleDateChange = (date) => {
//     setLocalFormData((prev) => {
//       let newLocalData = {
//         ...prev,
//         inspectionDate: date,
//         machineNo: prev.machineNo, // Keep machineNo
//         moNo: "", // Clear MO and related fields
//         color: "",
//         buyer: "",
//         buyerStyle: "",
//         _id: null,
//         baseReqTemp: null,
//         baseReqTime: null,
//         baseReqPressure: null,
//         stretchTestResult: "Pending",
//         stretchTestRejectReasons: [],
//         washingTestResult: "Pending",
//         isStretchWashingTestDone: false,
//         inspections: []
//       };
//       newLocalData = resetLocalDetailedSlots(newLocalData);
//       setMoNoSearch("");
//       setAvailableColors([]);
//       setAvailableMachineRecords([]); // Clear list of MOs for previous date
//       setCurrentActiveSlotKey(null);
//       setRecordStatusMessage("");
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const handleMachineNoChange = (e) => {
//     const machineNo = e.target.value;
//     setLocalFormData((prev) => {
//       let newLocalData = {
//         ...prev,
//         machineNo,
//         inspectionDate: prev.inspectionDate, // Keep date
//         moNo: "", // Clear MO and related fields
//         color: "",
//         buyer: "",
//         buyerStyle: "",
//         _id: null,
//         baseReqTemp: null,
//         baseReqTime: null,
//         baseReqPressure: null,
//         stretchTestResult: "Pending",
//         stretchTestRejectReasons: [],
//         washingTestResult: "Pending",
//         isStretchWashingTestDone: false,
//         inspections: []
//       };
//       newLocalData = resetLocalDetailedSlots(newLocalData);
//       setMoNoSearch("");
//       setAvailableColors([]);
//       setAvailableMachineRecords([]); // Will be refetched by effect
//       setCurrentActiveSlotKey(null);
//       setRecordStatusMessage("");
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

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
//       // Fetch if search term is different from current MO or if current MO is empty
//       if (moNoSearch !== localFormData.moNo || !localFormData.moNo) {
//         // Also, ensure we don't fetch if the search term is empty after clearing it
//         if (moNoSearch.trim() !== "") fetchMoNumbers();
//         else {
//           setMoNoOptions([]);
//           setShowMoNoDropdown(false);
//         }
//       }
//     }, 300);
//     return () => clearTimeout(delayDebounceFn);
//   }, [moNoSearch, localFormData.moNo, fetchMoNumbers]);

//   const handleMoSelect = (selectedMo) => {
//     // This is when user selects an MO from the search dropdown
//     setShowMoNoDropdown(false);
//     setLocalFormData((prev) => {
//       const newLocalData = resetFormForNewMoOrColor(prev, selectedMo, ""); // Reset color for new MO
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   // When user selects from "Existing MOs for this Machine/Date" dropdown
//   const handleExistingMoColorSelect = (e) => {
//     const val = e.target.value;
//     if (val) {
//       const [selectedMo, selectedColor] = val.split("|");
//       setLocalFormData((prev) => {
//         // Don't fully reset, as we are loading an existing context
//         let newLocalData = {
//           ...prev,
//           moNo: selectedMo,
//           color: selectedColor
//           // _id, baseReqTemp, inspections etc., will be fetched by fetchDailyHTQCData
//         };
//         // Slots will be populated by fetchDailyHTQCData
//         setMoNoSearch(selectedMo); // Sync search input
//         updateParentFormData(newLocalData); // Trigger data fetch via useEffect
//         return newLocalData;
//       });
//     } else {
//       // If "-- Select --" is chosen
//       setLocalFormData((prev) => {
//         const newLocalData = resetFormForNewMoOrColor(prev, "", ""); // Reset to blank MO/Color
//         updateParentFormData(newLocalData);
//         return newLocalData;
//       });
//     }
//   };

//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       if (!localFormData.moNo) {
//         if (localFormData.buyer || localFormData.buyerStyle) {
//           setLocalFormData((prev) => {
//             const updatedData = {
//               ...prev,
//               buyer: "",
//               buyerStyle: "",
//               color: ""
//             }; // Also clear color
//             updateParentFormData(updatedData);
//             return updatedData;
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
//           const newLocalData = {
//             ...prev,
//             buyer: details.engName || "N/A",
//             buyerStyle: details.custStyle || "N/A"
//           };
//           // If color was set but not in new available colors, clear it
//           if (
//             prev.color &&
//             !details.colors?.find((c) => c.original === prev.color)
//           ) {
//             newLocalData.color = "";
//           }
//           updateParentFormData(newLocalData);
//           return newLocalData;
//         });
//         setAvailableColors(details.colors || []);
//       } catch (error) {
//         console.error(t("scc.errorFetchingOrderDetailsLog"), error);
//         setLocalFormData((prev) => {
//           const newLocalData = {
//             ...prev,
//             buyer: "",
//             buyerStyle: "",
//             color: ""
//           };
//           updateParentFormData(newLocalData);
//           return newLocalData;
//         });
//         setAvailableColors([]);
//       } finally {
//         setOrderDetailsLoading(false);
//       }
//     };
//     if (localFormData.moNo) {
//       // Only fetch if MO is present
//       fetchOrderDetails();
//     } else {
//       // If MO is cleared, clear dependent fields
//       if (
//         localFormData.buyer ||
//         localFormData.buyerStyle ||
//         localFormData.color
//       ) {
//         setLocalFormData((prev) => {
//           const updatedData = { ...prev, buyer: "", buyerStyle: "", color: "" };
//           updateParentFormData(updatedData);
//           return updatedData;
//         });
//       }
//       setAvailableColors([]);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [localFormData.moNo, t]); // updateParentFormData removed

//   const handleColorChange = (e) => {
//     const newColor = e.target.value;
//     setLocalFormData((prev) => {
//       const newLocalData = resetFormForNewMoOrColor(prev, prev.moNo, newColor); // Keep current MO, reset for new color
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const calculateStatusAndDiff = (actual, req, tolerance) => {
//     if (actual === null || req === null)
//       return { status: "pending", diff: null };
//     const numActual = Number(actual);
//     const numReq = Number(req);
//     if (isNaN(numActual) || isNaN(numReq))
//       return { status: "pending", diff: null };

//     const difference = numActual - numReq;
//     if (Math.abs(difference) <= tolerance)
//       return { status: "ok", diff: difference };
//     return { status: numActual < numReq ? "low" : "high", diff: difference };
//   };

//   const fetchBaseSpecs = useCallback(
//     async (
//       moNoToFetch,
//       colorToFetch,
//       inspectionDateToFetch,
//       activeSlotKeyForUpdate
//     ) => {
//       if (!moNoToFetch || !colorToFetch || !inspectionDateToFetch) return;
//       setFirstOutputSpecsLoading(true);
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/scc/get-first-output-specs`,
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
//         let newBaseReqTemp = null,
//           newBaseReqTime = null,
//           newBaseReqPressure = null;
//         if (response.data.data) {
//           const specs = response.data.data;
//           newBaseReqTemp = specs.tempC !== null ? Number(specs.tempC) : null;
//           newBaseReqTime =
//             specs.timeSec !== null ? Number(specs.timeSec) : null;
//           newBaseReqPressure = parsePressure(specs.pressure);
//         }
//         setLocalFormData((prevLocalData) => {
//           const updatedSlotsDetailed = { ...prevLocalData.slotsDetailed };
//           // Update req values for ALL slots if base specs are found
//           // And actual values if they are not user modified and not N/A
//           Object.keys(updatedSlotsDetailed).forEach((slotKey) => {
//             const slot = updatedSlotsDetailed[slotKey];
//             if (!slot.temp_isUserModified && !slot.temp_isNA)
//               slot.temp_req = newBaseReqTemp;
//             if (!slot.time_isUserModified && !slot.time_isNA)
//               slot.time_req = newBaseReqTime;
//             if (!slot.pressure_isUserModified && !slot.pressure_isNA)
//               slot.pressure_req = newBaseReqPressure;

//             // If actual is null and not NA, set to req
//             if (slot.temp_actual === null && !slot.temp_isNA)
//               slot.temp_actual = slot.temp_req;
//             if (slot.time_actual === null && !slot.time_isNA)
//               slot.time_actual = slot.time_req;
//             if (slot.pressure_actual === null && !slot.pressure_isNA)
//               slot.pressure_actual = slot.pressure_req;

//             // Recalculate status
//             slot.temp_status = slot.temp_isNA
//               ? "na"
//               : calculateStatusAndDiff(
//                   slot.temp_actual,
//                   slot.temp_req,
//                   TEMP_TOLERANCE
//                 ).status;
//             slot.time_status = slot.time_isNA
//               ? "na"
//               : calculateStatusAndDiff(
//                   slot.time_actual,
//                   slot.time_req,
//                   TIME_TOLERANCE
//                 ).status;
//             slot.pressure_status = slot.pressure_isNA
//               ? "na"
//               : calculateStatusAndDiff(
//                   slot.pressure_actual,
//                   slot.pressure_req,
//                   PRESSURE_TOLERANCE
//                 ).status;
//           });

//           const newLocalData = {
//             ...prevLocalData,
//             baseReqTemp: newBaseReqTemp,
//             baseReqTime: newBaseReqTime,
//             baseReqPressure: newBaseReqPressure,
//             slotsDetailed: updatedSlotsDetailed
//           };
//           updateParentFormData(newLocalData);
//           return newLocalData;
//         });
//       } catch (error) {
//         console.error(t("scc.errorFetchingHtSpecsLog"), error);
//         setLocalFormData((prevLocalData) => {
//           const newLocalData = {
//             ...prevLocalData,
//             baseReqTemp: null,
//             baseReqTime: null,
//             baseReqPressure: null
//           };
//           // Clear req fields in slots if specs fetch failed
//           const updatedSlots = { ...prevLocalData.slotsDetailed };
//           Object.values(updatedSlots).forEach((slot) => {
//             if (!slot.temp_isUserModified) slot.temp_req = null;
//             if (!slot.time_isUserModified) slot.time_req = null;
//             if (!slot.pressure_isUserModified) slot.pressure_req = null;
//           });
//           newLocalData.slotsDetailed = updatedSlots;
//           updateParentFormData(newLocalData);
//           return newLocalData;
//         });
//       } finally {
//         setFirstOutputSpecsLoading(false);
//       }
//     },
//     [t, updateParentFormData]
//   );

//   useEffect(() => {
//     // This effect auto-populates current slot based on base specs
//     if (
//       currentActiveSlotKey &&
//       localFormData.slotsDetailed &&
//       localFormData.slotsDetailed[currentActiveSlotKey]
//     ) {
//       setLocalFormData((prevLocalData) => {
//         const currentSlotsDetailed = { ...prevLocalData.slotsDetailed };
//         const slotToUpdate = { ...currentSlotsDetailed[currentActiveSlotKey] };
//         const baseTemp = prevLocalData.baseReqTemp;
//         const baseTime = prevLocalData.baseReqTime;
//         const basePressure = prevLocalData.baseReqPressure;
//         let hasChanged = false;

//         if (!slotToUpdate.temp_isUserModified && !slotToUpdate.temp_isNA) {
//           if (slotToUpdate.temp_req !== baseTemp) {
//             slotToUpdate.temp_req = baseTemp;
//             hasChanged = true;
//           }
//           if (slotToUpdate.temp_actual === null && baseTemp !== null) {
//             slotToUpdate.temp_actual = baseTemp;
//             hasChanged = true;
//           }
//           slotToUpdate.temp_status = calculateStatusAndDiff(
//             slotToUpdate.temp_actual,
//             slotToUpdate.temp_req,
//             TEMP_TOLERANCE
//           ).status;
//         } else if (slotToUpdate.temp_isNA) slotToUpdate.temp_status = "na";

//         if (!slotToUpdate.time_isUserModified && !slotToUpdate.time_isNA) {
//           if (slotToUpdate.time_req !== baseTime) {
//             slotToUpdate.time_req = baseTime;
//             hasChanged = true;
//           }
//           if (slotToUpdate.time_actual === null && baseTime !== null) {
//             slotToUpdate.time_actual = baseTime;
//             hasChanged = true;
//           }
//           slotToUpdate.time_status = calculateStatusAndDiff(
//             slotToUpdate.time_actual,
//             slotToUpdate.time_req,
//             TIME_TOLERANCE
//           ).status;
//         } else if (slotToUpdate.time_isNA) slotToUpdate.time_status = "na";

//         if (
//           !slotToUpdate.pressure_isUserModified &&
//           !slotToUpdate.pressure_isNA
//         ) {
//           if (slotToUpdate.pressure_req !== basePressure) {
//             slotToUpdate.pressure_req = basePressure;
//             hasChanged = true;
//           }
//           if (slotToUpdate.pressure_actual === null && basePressure !== null) {
//             slotToUpdate.pressure_actual = basePressure;
//             hasChanged = true;
//           }
//           slotToUpdate.pressure_status = calculateStatusAndDiff(
//             slotToUpdate.pressure_actual,
//             slotToUpdate.pressure_req,
//             PRESSURE_TOLERANCE
//           ).status;
//         } else if (slotToUpdate.pressure_isNA)
//           slotToUpdate.pressure_status = "na";

//         if (hasChanged) {
//           const newSlotsDetailedState = {
//             ...currentSlotsDetailed,
//             [currentActiveSlotKey]: slotToUpdate
//           };
//           // No need to call updateParentFormData here, this is an internal sync
//           return { ...prevLocalData, slotsDetailed: newSlotsDetailedState };
//         }
//         return prevLocalData;
//       });
//     }
//   }, [
//     currentActiveSlotKey,
//     localFormData.baseReqTemp,
//     localFormData.baseReqTime,
//     localFormData.baseReqPressure
//     // localFormData.slotsDetailed // Be careful with this dependency
//   ]);

//   // Main data fetching logic
//   const fetchDailyHTQCData = useCallback(
//     async (
//       currentMoNo,
//       currentColor,
//       currentInspectionDate,
//       currentMachineNo
//     ) => {
//       if (!currentInspectionDate || !currentMachineNo) {
//         setAvailableMachineRecords([]); // Clear if essential params missing
//         return;
//       }
//       setExistingQCRecordLoading(true);
//       setRecordStatusMessage("");
//       let baseSpecsShouldBeFetched = false;

//       try {
//         const params = {
//           inspectionDate:
//             currentInspectionDate instanceof Date
//               ? currentInspectionDate.toISOString()
//               : currentInspectionDate,
//           machineNo: currentMachineNo
//         };
//         // If specific MO/Color provided, try to fetch that record
//         if (currentMoNo && currentColor) {
//           params.moNo = currentMoNo;
//           params.color = currentColor;
//         }

//         const response = await axios.get(
//           `${API_BASE_URL}/api/scc/daily-htfu-test`,
//           { params }
//         );
//         const { message, data } = response.data;

//         if (
//           message === "DAILY_HTFU_RECORD_NOT_FOUND" &&
//           params.moNo &&
//           params.color
//         ) {
//           setRecordStatusMessage(t("sccDailyHTQC.newRecord"));
//           const firstSlotKey = TIME_SLOTS_CONFIG[0]?.key || null;
//           setLocalFormData((prev) => {
//             // Keep current date, machine, MO, Color, but reset slots and other details
//             let newLocalState = resetFormForNewMoOrColor(
//               prev,
//               currentMoNo,
//               currentColor
//             );
//             newLocalState.inspectionDate = prev.inspectionDate; // ensure date is preserved
//             newLocalState.machineNo = prev.machineNo; // ensure machineNo is preserved
//             setCurrentActiveSlotKey(firstSlotKey);
//             return newLocalState;
//           });
//           baseSpecsShouldBeFetched = true; // Fetch base specs for this new MO/Color context
//         } else if (message === "RECORD_FOUND" && data) {
//           setRecordStatusMessage(t("sccDailyHTQC.recordLoaded"));
//           const populatedSlots = TIME_SLOTS_CONFIG.reduce((acc, slotConf) => {
//             const existingInsp = (data.inspections || []).find(
//               (i) => i.timeSlotKey === slotConf.key
//             );
//             acc[slotConf.key] = existingInsp
//               ? {
//                   ...initialSlotData,
//                   ...existingInsp,
//                   temp_actual:
//                     existingInsp.temp_actual !== null
//                       ? Number(existingInsp.temp_actual)
//                       : null,
//                   time_actual:
//                     existingInsp.time_actual !== null
//                       ? Number(existingInsp.time_actual)
//                       : null,
//                   pressure_actual: parsePressure(existingInsp.pressure_actual)
//                 }
//               : {
//                   ...initialSlotData,
//                   inspectionNo: slotConf.inspectionNo,
//                   timeSlotKey: slotConf.key
//                 };
//             return acc;
//           }, {});

//           setLocalFormData((prev) => {
//             const newLocalState = {
//               ...prev, // Keep existing local state like currentActiveSlotKey potentially
//               _id: data._id,
//               moNo: data.moNo,
//               buyer: data.buyer,
//               buyerStyle: data.buyerStyle,
//               color: data.color,
//               baseReqTemp:
//                 data.baseReqTemp !== null ? Number(data.baseReqTemp) : null,
//               baseReqTime:
//                 data.baseReqTime !== null ? Number(data.baseReqTime) : null,
//               baseReqPressure: parsePressure(data.baseReqPressure),
//               stretchTestResult: data.stretchTestResult || "Pending",
//               stretchTestRejectReasons: data.stretchTestRejectReasons || [],
//               washingTestResult: data.washingTestResult || "Pending",
//               isStretchWashingTestDone: data.isStretchWashingTestDone || false,
//               inspections: data.inspections || [],
//               slotsDetailed: populatedSlots
//             };
//             setMoNoSearch(data.moNo || "");
//             const lastSubmittedInspNo =
//               (data.inspections || []).length > 0
//                 ? Math.max(...data.inspections.map((i) => i.inspectionNo))
//                 : 0;
//             const nextInspNo = lastSubmittedInspNo + 1;
//             const activeSlotConfig = TIME_SLOTS_CONFIG.find(
//               (s) => s.inspectionNo === nextInspNo
//             );
//             setCurrentActiveSlotKey(
//               activeSlotConfig ? activeSlotConfig.key : null
//             );
//             return newLocalState;
//           });
//           if (!data.baseReqTemp && data.moNo && data.color)
//             baseSpecsShouldBeFetched = true;
//           // After loading a specific record, also fetch the list of other MOs for this date/machine
//           axios
//             .get(`${API_BASE_URL}/api/scc/daily-htfu-test`, {
//               params: {
//                 inspectionDate:
//                   currentInspectionDate instanceof Date
//                     ? currentInspectionDate.toISOString()
//                     : currentInspectionDate,
//                 machineNo: currentMachineNo
//               }
//             })
//             .then((listRes) => {
//               if (
//                 listRes.data.message === "MULTIPLE_MO_COLOR_FOUND" &&
//                 listRes.data.data.length > 0
//               ) {
//                 setAvailableMachineRecords(listRes.data.data);
//               } else {
//                 setAvailableMachineRecords([]); // Clear if no other records
//               }
//             })
//             .catch(() => setAvailableMachineRecords([]));
//         } else if (message === "MULTIPLE_MO_COLOR_FOUND" && data.length > 0) {
//           setRecordStatusMessage(t("sccDailyHTQC.selectMoColor"));
//           setAvailableMachineRecords(data);
//           setLocalFormData((prev) => resetFormForNewMoOrColor(prev, "", "")); // Reset if multiple MOs and none selected
//           setCurrentActiveSlotKey(null);
//         } else {
//           // NO_RECORDS_FOR_DATE_MACHINE or other cases
//           setRecordStatusMessage(t("sccDailyHTQC.newRecordMachineDate"));
//           setLocalFormData((prev) => resetFormForNewMoOrColor(prev, "", ""));
//           setCurrentActiveSlotKey(TIME_SLOTS_CONFIG[0]?.key || null);
//           setAvailableMachineRecords([]); // No existing records
//         }

//         if (
//           baseSpecsShouldBeFetched &&
//           currentMoNo &&
//           currentColor &&
//           currentInspectionDate
//         ) {
//           fetchBaseSpecs(
//             currentMoNo,
//             currentColor,
//             currentInspectionDate,
//             currentActiveSlotKey
//           );
//         }
//       } catch (error) {
//         console.error(t("sccDailyHTQC.errorLoadingRecord"), error);
//         Swal.fire(
//           t("scc.error"),
//           t("sccDailyHTQC.errorLoadingRecordMsg"),
//           "error"
//         );
//         setLocalFormData((prev) => resetFormForNewMoOrColor(prev, "", "")); // Reset on error
//       } finally {
//         setExistingQCRecordLoading(false);
//       }
//     },
//     [t, fetchBaseSpecs, updateParentFormData, currentActiveSlotKey] // currentActiveSlotKey might be needed for fetchBaseSpecs context
//   );

//   // Effect for initial load / Date or Machine change
//   useEffect(() => {
//     if (localFormData.inspectionDate && localFormData.machineNo) {
//       // Fetch list of MOs or specific record if MO/Color are already set
//       fetchDailyHTQCData(
//         localFormData.moNo,
//         localFormData.color,
//         localFormData.inspectionDate,
//         localFormData.machineNo
//       );
//     } else {
//       setAvailableMachineRecords([]); // Clear if date/machine not set
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [localFormData.inspectionDate, localFormData.machineNo]);

//   // Effect for MO or Color change (after Date/Machine are set)
//   useEffect(() => {
//     if (
//       localFormData.inspectionDate &&
//       localFormData.machineNo &&
//       localFormData.moNo &&
//       localFormData.color
//     ) {
//       fetchDailyHTQCData(
//         localFormData.moNo,
//         localFormData.color,
//         localFormData.inspectionDate,
//         localFormData.machineNo
//       );
//     }
//     // If only MO is set but no color, do nothing here, wait for color selection.
//     // If MO/Color are cleared, the date/machine useEffect handles fetching the list.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [localFormData.moNo, localFormData.color]);

//   const handleSlotActualValueChange = (slotKey, fieldType, value) => {
//     setLocalFormData((prev) => {
//       const newSlotsDetailed = { ...prev.slotsDetailed };
//       const slot = { ...newSlotsDetailed[slotKey] };
//       if (!slot) return prev;
//       const field_actual = `${fieldType}_actual`,
//         field_req = `${fieldType}_req`,
//         field_status = `${fieldType}_status`,
//         field_isUserModified = `${fieldType}_isUserModified`,
//         field_isNA = `${fieldType}_isNA`;
//       if (slot[field_isNA]) return prev;
//       const numValue = value === "" || value === null ? null : Number(value);
//       slot[field_actual] = numValue;
//       slot[field_isUserModified] = true;
//       const tolerance =
//         fieldType === "temp"
//           ? TEMP_TOLERANCE
//           : fieldType === "time"
//           ? TIME_TOLERANCE
//           : PRESSURE_TOLERANCE;
//       slot[field_status] = calculateStatusAndDiff(
//         numValue,
//         slot[field_req],
//         tolerance
//       ).status;
//       newSlotsDetailed[slotKey] = slot;
//       const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const handleSlotIncrementDecrement = (slotKey, fieldType, action) => {
//     setLocalFormData((prev) => {
//       const newSlotsDetailed = { ...prev.slotsDetailed };
//       const slot = { ...newSlotsDetailed[slotKey] };
//       if (!slot) return prev;
//       const field_actual = `${fieldType}_actual`,
//         field_req = `${fieldType}_req`,
//         field_status = `${fieldType}_status`,
//         field_isUserModified = `${fieldType}_isUserModified`,
//         field_isNA = `${fieldType}_isNA`;
//       if (slot[field_isNA]) return prev;
//       let currentValue = parseFloat(slot[field_actual]);
//       if (isNaN(currentValue)) {
//         currentValue = parseFloat(slot[field_req]);
//         if (isNaN(currentValue)) currentValue = 0;
//       }
//       if (action === "increment") currentValue += 1;
//       if (action === "decrement") currentValue -= 1;
//       slot[field_actual] = currentValue;
//       slot[field_isUserModified] = true;
//       const tolerance =
//         fieldType === "temp"
//           ? TEMP_TOLERANCE
//           : fieldType === "time"
//           ? TIME_TOLERANCE
//           : PRESSURE_TOLERANCE;
//       slot[field_status] = calculateStatusAndDiff(
//         currentValue,
//         slot[field_req],
//         tolerance
//       ).status;
//       newSlotsDetailed[slotKey] = slot;
//       const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const toggleSlotNA = (slotKey, fieldType) => {
//     setLocalFormData((prev) => {
//       const newSlotsDetailed = { ...prev.slotsDetailed };
//       const slot = { ...newSlotsDetailed[slotKey] };
//       if (!slot) return prev;
//       const field_actual = `${fieldType}_actual`,
//         field_req = `${fieldType}_req`,
//         field_status = `${fieldType}_status`,
//         field_isNA = `${fieldType}_isNA`;
//       slot[field_isNA] = !slot[field_isNA];
//       if (slot[field_isNA]) {
//         slot[field_actual] = null;
//         slot[field_status] = "na";
//       } else {
//         slot[field_actual] =
//           slot[field_actual] === null ? slot[field_req] : slot[field_actual];
//         const tolerance =
//           fieldType === "temp"
//             ? TEMP_TOLERANCE
//             : fieldType === "time"
//             ? TIME_TOLERANCE
//             : PRESSURE_TOLERANCE;
//         slot[field_status] = calculateStatusAndDiff(
//           slot[field_actual],
//           slot[field_req],
//           tolerance
//         ).status;
//       }
//       newSlotsDetailed[slotKey] = slot;
//       const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const handleTestResultChange = (field, value) => {
//     setLocalFormData((prev) => {
//       const newLocalData = { ...prev, [field]: value };
//       if (field === "stretchTestResult" && value !== "Reject") {
//         newLocalData.stretchTestRejectReasons = [];
//       }
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const handleRejectReasonSelect = (reason) => {
//     setLocalFormData((prev) => {
//       const currentReasons = prev.stretchTestRejectReasons || [];
//       let newReasons;
//       if (currentReasons.includes(reason)) {
//         newReasons = currentReasons.filter((r) => r !== reason);
//       } else {
//         newReasons = [...currentReasons, reason];
//       }
//       const newLocalData = { ...prev, stretchTestRejectReasons: newReasons };
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const getCellBG = (status, isNA) => {
//     if (isNA) return "bg-gray-200 text-gray-500";
//     if (status === "ok") return "bg-green-100 text-green-700";
//     if (status === "low" || status === "high") return "bg-red-100 text-red-700";
//     return "bg-white";
//   };

//   const handleFormActualSubmit = () => {
//     if (
//       !localFormData.inspectionDate ||
//       !localFormData.machineNo ||
//       !localFormData.moNo ||
//       !localFormData.color
//     ) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyHTQC.validation.fillBasic"),
//         "warning"
//       );
//       return;
//     }
//     if (!currentActiveSlotKey) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyHTQC.validation.allSlotsDone"),
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
//     if (
//       (activeSlotData.temp_actual === null && !activeSlotData.temp_isNA) ||
//       (activeSlotData.time_actual === null && !activeSlotData.time_isNA) ||
//       (activeSlotData.pressure_actual === null && !activeSlotData.pressure_isNA)
//     ) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyHTQC.validation.fillActiveSlot"),
//         "warning"
//       );
//       return;
//     }
//     if (
//       localFormData.stretchTestResult === "Reject" &&
//       (!localFormData.stretchTestRejectReasons ||
//         localFormData.stretchTestRejectReasons.length === 0)
//     ) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyHTQC.validation.rejectReasonRequired"),
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
//       baseReqTime:
//         localFormData.baseReqTime !== null
//           ? Number(localFormData.baseReqTime)
//           : null,
//       baseReqPressure:
//         localFormData.baseReqPressure !== null
//           ? Number(localFormData.baseReqPressure)
//           : null,
//       stretchTestResult: localFormData.stretchTestResult,
//       stretchTestRejectReasons:
//         localFormData.stretchTestResult === "Reject"
//           ? localFormData.stretchTestRejectReasons || []
//           : [],
//       washingTestResult: localFormData.washingTestResult,
//       isStretchWashingTestDone: localFormData.isStretchWashingTestDone,
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
//         temp_status: activeSlotData.temp_status,
//         temp_isUserModified: activeSlotData.temp_isUserModified,
//         temp_isNA: activeSlotData.temp_isNA,
//         time_req:
//           activeSlotData.time_req !== null
//             ? Number(activeSlotData.time_req)
//             : null,
//         time_actual:
//           activeSlotData.time_actual !== null
//             ? Number(activeSlotData.time_actual)
//             : null,
//         time_status: activeSlotData.time_status,
//         time_isUserModified: activeSlotData.time_isUserModified,
//         time_isNA: activeSlotData.time_isNA,
//         pressure_req:
//           activeSlotData.pressure_req !== null
//             ? Number(activeSlotData.pressure_req)
//             : null,
//         pressure_actual:
//           activeSlotData.pressure_actual !== null
//             ? Number(activeSlotData.pressure_actual)
//             : null,
//         pressure_status: activeSlotData.pressure_status,
//         pressure_isUserModified: activeSlotData.pressure_isUserModified,
//         pressure_isNA: activeSlotData.pressure_isNA
//       }
//     };
//     onFormSubmit(formType, payloadForParent);
//   };

//   const loading =
//     orderDetailsLoading || firstOutputSpecsLoading || existingQCRecordLoading;

//   const renderDifference = (actual, req, tolerance, fieldType) => {
//     if (
//       actual === null ||
//       req === null ||
//       isNaN(Number(actual)) ||
//       isNaN(Number(req))
//     )
//       return null;
//     const { status, diff } = calculateStatusAndDiff(actual, req, tolerance);
//     if (status === "ok" || diff === 0 || diff === null) return null;

//     const isHigh = status === "high";
//     const colorClass = isHigh ? "text-red-500" : "text-orange-500";
//     const sign = isHigh ? "+" : "";

//     return (
//       <span
//         className={`ml-1 text-xs font-semibold ${colorClass} flex items-center`}
//       >
//         <Triangle
//           className={`w-2 h-2 fill-current ${
//             isHigh ? "rotate-0" : "rotate-180"
//           }`}
//         />
//         {sign}
//         {diff.toFixed(fieldType === "pressure" ? 1 : 0)}
//       </span>
//     );
//   };

//   const currentSlotTableTitle = useMemo(() => {
//     if (!currentActiveSlotKey) return t("sccDailyHTQC.noActiveSlot");
//     const slotConfig = TIME_SLOTS_CONFIG.find(
//       (s) => s.key === currentActiveSlotKey
//     );
//     if (!slotConfig) return t("sccDailyHTQC.noActiveSlot");
//     return `${t("sccDailyHTQC.currentInspectionSlot")}: ${slotConfig.label} (#${
//       slotConfig.inspectionNo
//     })`;
//   }, [currentActiveSlotKey, t]);

//   const renderCurrentSlotTable = () => {
//     if (!currentActiveSlotKey) return null;
//     const currentSlot = localFormData.slotsDetailed[currentActiveSlotKey];
//     if (!currentSlot) return null;

//     const parameters = [
//       {
//         label: t("sccDailyHTQC.temperature"),
//         field: "temp",
//         unit: "°C",
//         tolerance: TEMP_TOLERANCE
//       },
//       {
//         label: t("sccDailyHTQC.timing"),
//         field: "time",
//         unit: "Sec",
//         tolerance: TIME_TOLERANCE
//       },
//       {
//         label: t("sccDailyHTQC.pressure"),
//         field: "pressure",
//         unit: "Bar",
//         tolerance: PRESSURE_TOLERANCE
//       }
//     ];

//     return (
//       <div className="border border-gray-300 rounded-lg shadow-sm bg-white overflow-hidden">
//         <table className="min-w-full text-xs divide-y divide-gray-200">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="px-3 py-2.5 text-left font-semibold text-gray-700 border-r w-1/3">
//                 {t("sccDailyHTQC.parameter")}
//               </th>
//               <th className="px-3 py-2.5 text-center font-semibold text-gray-700 border-r w-1/3">
//                 {t("sccDailyHTQC.reqValue")}
//               </th>
//               <th className="px-3 py-2.5 text-center font-semibold text-gray-700 w-1/3">
//                 {t("sccDailyHTQC.actualValue")}
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {parameters.map((param) => {
//               const reqVal = currentSlot[`${param.field}_req`];
//               const actualVal = currentSlot[`${param.field}_actual`];
//               const isNA = currentSlot[`${param.field}_isNA`];
//               const { status } = calculateStatusAndDiff(
//                 actualVal,
//                 reqVal,
//                 param.tolerance
//               );

//               return (
//                 <tr
//                   key={param.field}
//                   className={`hover:bg-gray-50 ${getCellBG(status, isNA)}`}
//                 >
//                   <td className="px-3 py-2 border-r font-medium">
//                     {param.label} {param.unit ? `(${param.unit})` : ""}
//                   </td>
//                   <td className="px-3 py-2 border-r text-center">
//                     {reqVal !== null ? reqVal : "N/A"}
//                   </td>
//                   <td className={`px-1.5 py-1.5 text-center`}>
//                     {isNA ? (
//                       <span className="italic text-gray-500">
//                         {t("scc.na")}
//                       </span>
//                     ) : (
//                       <div className="flex items-center justify-center">
//                         <input
//                           type="number"
//                           inputMode="numeric"
//                           value={actualVal !== null ? actualVal : ""}
//                           onChange={(e) =>
//                             handleSlotActualValueChange(
//                               currentActiveSlotKey,
//                               param.field,
//                               e.target.value
//                             )
//                           }
//                           className={`${inputFieldClasses} text-center text-xs p-1 w-20`}
//                         />
//                         {renderDifference(
//                           actualVal,
//                           reqVal,
//                           param.tolerance,
//                           param.field
//                         )}
//                       </div>
//                     )}
//                     <div className="flex justify-center items-center space-x-2 mt-1">
//                       {!isNA && (
//                         <>
//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleSlotIncrementDecrement(
//                                 currentActiveSlotKey,
//                                 param.field,
//                                 "decrement"
//                               )
//                             }
//                             className="p-1 hover:bg-gray-200 rounded-full"
//                           >
//                             <Minus size={12} />
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleSlotIncrementDecrement(
//                                 currentActiveSlotKey,
//                                 param.field,
//                                 "increment"
//                               )
//                             }
//                             className="p-1 hover:bg-gray-200 rounded-full"
//                           >
//                             <Plus size={12} />
//                           </button>
//                         </>
//                       )}
//                       <button
//                         type="button"
//                         onClick={() =>
//                           toggleSlotNA(currentActiveSlotKey, param.field)
//                         }
//                         className="p-1 hover:bg-gray-200 rounded-full"
//                       >
//                         {isNA ? (
//                           <EyeOff size={12} className="text-gray-500" />
//                         ) : (
//                           <Eye size={12} />
//                         )}
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         rejectReasonDropdownRef.current &&
//         !rejectReasonDropdownRef.current.contains(event.target)
//       ) {
//         setShowRejectReasonDropdown(false);
//       }
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

//   if (!user)
//     return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;

//   return (
//     <div className="space-y-5">
//       <h2 className="text-lg font-semibold text-gray-800">
//         {t("sccDailyHTQC.title")}
//       </h2>
//       <p className="text-xs text-gray-600 -mt-3">
//         {t("sccDailyHTQC.subtitle")}
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
//               t("sccDailyHTQC.newRecordKey", "New")
//             ) ||
//             recordStatusMessage.includes(
//               t("sccDailyHTQC.selectMoColorKey", "select MO and Color")
//             ) ||
//             recordStatusMessage.includes(
//               t(
//                 "sccDailyHTQC.newRecordMachineDate",
//                 "New record for this Machine & Date"
//               )
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
//           <label htmlFor="htqcInspectionDate" className={labelClasses}>
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
//             id="htqcInspectionDate"
//           />
//         </div>
//         <div>
//           <label htmlFor="htqcMachineNo" className={labelClasses}>
//             {t("scc.machineNo")}
//           </label>
//           <select
//             id="htqcMachineNo"
//             name="machineNo"
//             value={localFormData.machineNo || ""}
//             onChange={handleMachineNoChange}
//             className={inputFieldClasses}
//             required
//           >
//             <option value="">{t("scc.selectMachine")}</option>
//             {Array.from({ length: 15 }, (_, i) => String(i + 1)).map((num) => (
//               <option key={`machine-${num}`} value={num}>
//                 {num}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="relative">
//           <label htmlFor="htqcMoNoSearch" className={labelClasses}>
//             {t("scc.moNo")}
//           </label>
//           <div className="relative mt-1" ref={moNoDropdownRef}>
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Search className="h-5 w-5 text-gray-400" />
//             </div>
//             <input
//               type="text"
//               id="htqcMoNoSearch"
//               value={moNoSearch}
//               ref={moNoInputRef}
//               onChange={(e) => setMoNoSearch(e.target.value)}
//               onFocus={() => {
//                 // If there are existing records, show them, otherwise show MO search results
//                 if (availableMachineRecords.length > 0 && !moNoSearch) {
//                   setShowMoNoDropdown(false); // Don't show search results if existing list is primary
//                 } else {
//                   setShowMoNoDropdown(true);
//                 }
//               }}
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
//           {availableMachineRecords.length > 0 && (
//             <div className="mt-1">
//               <label
//                 htmlFor="selectExistingMo"
//                 className={`${labelClasses} text-xs`}
//               >
//                 {t(
//                   "sccDailyHTQC.selectExisting",
//                   "Or select existing for this Machine/Date:"
//                 )}
//               </label>
//               <select
//                 id="selectExistingMo"
//                 onChange={handleExistingMoColorSelect}
//                 className={inputFieldClasses}
//                 value={
//                   localFormData.moNo && localFormData.color
//                     ? `${localFormData.moNo}|${localFormData.color}`
//                     : ""
//                 }
//               >
//                 <option value="">-- {t("scc.select")} --</option>
//                 {availableMachineRecords.map((rec) => (
//                   <option
//                     key={`${rec.moNo}-${rec.color}`}
//                     value={`${rec.moNo}|${rec.color}`}
//                   >
//                     {rec.moNo} - {rec.color} ({rec.buyerStyle || t("scc.naCap")}
//                     )
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}
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
//           <label htmlFor="htqcColor" className={labelClasses}>
//             {t("scc.color")}
//           </label>
//           <select
//             id="htqcColor"
//             name="color"
//             value={localFormData.color || ""}
//             onChange={handleColorChange}
//             className={inputFieldClasses}
//             disabled={!localFormData.moNo || availableColors.length === 0} // Disabled if no MO or no colors for MO
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

//       {localFormData.moNo &&
//         localFormData.color && ( // Only show table if MO and Color are selected
//           <div className="mt-4 space-y-4">
//             <h3 className="text-md font-semibold text-gray-700">
//               {currentSlotTableTitle}
//             </h3>
//             {currentActiveSlotKey ? (
//               renderCurrentSlotTable()
//             ) : (
//               <div className="text-center py-4 text-gray-500 italic">
//                 {t("sccDailyHTQC.allInspectionsCompleted")}
//               </div>
//             )}

//             {!localFormData.isStretchWashingTestDone &&
//               currentActiveSlotKey && (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start pt-4 border-t border-gray-200 mt-4">
//                   <div>
//                     <label htmlFor="htqcStretchTest" className={labelClasses}>
//                       {t("sccDailyHTQC.stretchScratchTest")}
//                     </label>
//                     <select
//                       id="htqcStretchTest"
//                       value={localFormData.stretchTestResult || "Pending"}
//                       onChange={(e) =>
//                         handleTestResultChange(
//                           "stretchTestResult",
//                           e.target.value
//                         )
//                       }
//                       className={`${inputFieldClasses} ${
//                         localFormData.stretchTestResult === "Pass"
//                           ? "bg-green-50 text-green-700"
//                           : localFormData.stretchTestResult === "Reject"
//                           ? "bg-red-50 text-red-700"
//                           : ""
//                       }`}
//                     >
//                       <option value="Pending">{t("scc.pending")}</option>
//                       <option value="Pass">{t("scc.pass")}</option>
//                       <option value="Reject">{t("scc.reject")}</option>
//                     </select>
//                     {localFormData.stretchTestResult === "Reject" && (
//                       <div
//                         className="mt-2 relative"
//                         ref={rejectReasonDropdownRef}
//                       >
//                         <label className={`${labelClasses} text-xs`}>
//                           {t("sccDailyHTQC.rejectReasons")}
//                         </label>
//                         <button
//                           type="button"
//                           onClick={() =>
//                             setShowRejectReasonDropdown((prev) => !prev)
//                           }
//                           className="w-full text-left px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm flex justify-between items-center"
//                         >
//                           <span>
//                             {(
//                               localFormData.stretchTestRejectReasons || []
//                             ).join(", ") || t("sccDailyHTQC.selectReasons")}
//                           </span>
//                           <ChevronDown
//                             size={16}
//                             className={`transform transition-transform ${
//                               showRejectReasonDropdown ? "rotate-180" : ""
//                             }`}
//                           />
//                         </button>
//                         {showRejectReasonDropdown && (
//                           <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto py-1">
//                             {STRETCH_TEST_REJECT_REASONS_OPTIONS.map(
//                               (reason) => (
//                                 <div
//                                   key={reason}
//                                   onClick={() =>
//                                     handleRejectReasonSelect(reason)
//                                   }
//                                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
//                                     (
//                                       localFormData.stretchTestRejectReasons ||
//                                       []
//                                     ).includes(reason)
//                                       ? "bg-indigo-50 text-indigo-700"
//                                       : ""
//                                   }`}
//                                 >
//                                   {reason}
//                                   {(
//                                     localFormData.stretchTestRejectReasons || []
//                                   ).includes(reason) && (
//                                     <CheckCircle
//                                       size={14}
//                                       className="text-indigo-600"
//                                     />
//                                   )}
//                                 </div>
//                               )
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                   <div>
//                     <label htmlFor="htqcWashingTest" className={labelClasses}>
//                       {t("sccDailyHTQC.washingTest")}
//                     </label>
//                     <select
//                       id="htqcWashingTest"
//                       value={localFormData.washingTestResult || "Pending"}
//                       onChange={(e) =>
//                         handleTestResultChange(
//                           "washingTestResult",
//                           e.target.value
//                         )
//                       }
//                       className={`${inputFieldClasses} ${
//                         localFormData.washingTestResult === "Pass"
//                           ? "bg-green-50 text-green-700"
//                           : localFormData.washingTestResult === "Reject"
//                           ? "bg-red-50 text-red-700"
//                           : ""
//                       }`}
//                     >
//                       <option value="Pending">{t("scc.pending")}</option>
//                       <option value="Pass">{t("scc.pass")}</option>
//                       <option value="Reject">{t("scc.reject")}</option>
//                     </select>
//                   </div>
//                 </div>
//               )}
//             {localFormData.isStretchWashingTestDone && (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start pt-4 border-t border-gray-200 mt-4">
//                 <div>
//                   <label className={labelClasses}>
//                     {t("sccDailyHTQC.stretchScratchTest")}
//                   </label>
//                   <input
//                     type="text"
//                     value={t(
//                       `scc.${
//                         localFormData.stretchTestResult?.toLowerCase() ||
//                         "pending"
//                       }`
//                     )}
//                     readOnly
//                     className={`${inputFieldReadonlyClasses} ${
//                       localFormData.stretchTestResult === "Pass"
//                         ? "bg-green-100 text-green-700"
//                         : localFormData.stretchTestResult === "Reject"
//                         ? "bg-red-100 text-red-700"
//                         : ""
//                     }`}
//                   />
//                   {localFormData.stretchTestResult === "Reject" &&
//                     (localFormData.stretchTestRejectReasons || []).length >
//                       0 && (
//                       <div className="mt-1 text-xs text-gray-600">
//                         <strong>{t("sccDailyHTQC.reasons")}:</strong>{" "}
//                         {localFormData.stretchTestRejectReasons.join(", ")}
//                       </div>
//                     )}
//                 </div>
//                 <div>
//                   <label className={labelClasses}>
//                     {t("sccDailyHTQC.washingTest")}
//                   </label>
//                   <input
//                     type="text"
//                     value={t(
//                       `scc.${
//                         localFormData.washingTestResult?.toLowerCase() ||
//                         "pending"
//                       }`
//                     )}
//                     readOnly
//                     className={`${inputFieldReadonlyClasses} ${
//                       localFormData.washingTestResult === "Pass"
//                         ? "bg-green-100 text-green-700"
//                         : localFormData.washingTestResult === "Reject"
//                         ? "bg-red-100 text-red-700"
//                         : ""
//                     }`}
//                   />
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

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
//             : t("sccDailyHTQC.selectMoColorPrompt")}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default DailyHTQC;

// import axios from "axios";
// import {
//   Eye,
//   EyeOff,
//   Loader2,
//   Minus,
//   Plus,
//   Search,
//   Settings,
//   Thermometer,
//   Clock,
//   Gauge,
//   CalendarDays,
//   Power,
//   PowerOff,
//   AlertTriangle,
//   Check,
//   ListChecks,
//   BookUser,
//   Send, // For submit button per row
//   RefreshCw // For refresh button or N/A toggle visual
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
// const iconButtonClasses =
//   "p-1.5 hover:bg-slate-200 rounded-full text-slate-600 hover:text-indigo-600 transition-colors";

// const TIME_SLOTS_CONFIG = [
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
//   const month = d.getMonth() + 1;
//   const day = d.getDate();
//   const year = d.getFullYear();
//   return `${month}/${day}/${year}`;
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

// const DailyHTQC = ({ onFormSubmit, isSubmitting: parentIsSubmitting }) => {
//   const { t } = useTranslation();
//   const { user } = useAuth();

//   const [settingsEnabled, setSettingsEnabled] = useState(false);
//   const [totalMachines, setTotalMachines] = useState(15);
//   const [tolerances, setTolerances] = useState({
//     temp: 5,
//     time: 0,
//     pressure: 0
//   });
//   const [inspectionDate, setInspectionDate] = useState(new Date());

//   const [regMachineNo, setRegMachineNo] = useState("");
//   const [regMoNoSearch, setRegMoNoSearch] = useState("");
//   const [regMoNo, setRegMoNo] = useState("");
//   const [regBuyer, setRegBuyer] = useState("");
//   const [regBuyerStyle, setRegBuyerStyle] = useState("");
//   const [regColor, setRegColor] = useState("");
//   const [regAvailableColors, setRegAvailableColors] = useState([]);
//   const [regReqTemp, setRegReqTemp] = useState(null);
//   const [regReqTime, setRegReqTime] = useState(null);
//   const [regReqPressure, setRegReqPressure] = useState(null);
//   const [moDropdownOptions, setMoDropdownOptions] = useState([]);
//   const [showRegMoDropdown, setShowRegMoDropdown] = useState(false);
//   const [isRegLoading, setIsRegLoading] = useState(false);

//   const regMoSearchInputRef = useRef(null);
//   const regMoDropdownRef = useRef(null);

//   const [registeredMachines, setRegisteredMachines] = useState([]);
//   const [filterMachineNo, setFilterMachineNo] = useState("All");
//   const [selectedTimeSlotKey, setSelectedTimeSlotKey] = useState("");
//   const [actualValues, setActualValues] = useState({});
//   const [isInspectionDataLoading, setIsInspectionDataLoading] = useState(false);
//   const [submittingMachineSlot, setSubmittingMachineSlot] = useState(null); // Stores `docId_slotKey`

//   const machineOptions = useMemo(
//     () => Array.from({ length: totalMachines }, (_, i) => String(i + 1)),
//     [totalMachines]
//   );

//   // --- Auto-fill Actual Values when Slot or Machines Change ---
//   useEffect(() => {
//     if (selectedTimeSlotKey && registeredMachines.length > 0) {
//       const newActuals = { ...actualValues };
//       registeredMachines.forEach((machine) => {
//         const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
//         const existingInspection = machine.inspections.find(
//           (insp) => insp.timeSlotKey === selectedTimeSlotKey
//         );

//         if (
//           !existingInspection &&
//           (!newActuals[docSlotKey] ||
//             !newActuals[docSlotKey].temp_isUserModified)
//         ) {
//           // Only prefill if not submitted and not already modified by user for this slot
//           newActuals[docSlotKey] = {
//             ...(newActuals[docSlotKey] || {}), // Preserve other potential fields like _isUserModified for other params
//             temp_actual: machine.baseReqTemp,
//             temp_isNA: false, // Default to not N/A
//             time_actual: machine.baseReqTime,
//             time_isNA: false,
//             pressure_actual: machine.baseReqPressure,
//             pressure_isNA: false
//           };
//         } else if (existingInspection) {
//           // If already submitted, ensure actualValues reflects it for display consistency (though inputs will be disabled)
//           newActuals[docSlotKey] = {
//             temp_actual: existingInspection.temp_actual,
//             temp_isNA: existingInspection.temp_isNA,
//             time_actual: existingInspection.time_actual,
//             time_isNA: existingInspection.time_isNA,
//             pressure_actual: existingInspection.pressure_actual,
//             pressure_isNA: existingInspection.pressure_isNA
//           };
//         }
//       });
//       setActualValues(newActuals);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedTimeSlotKey, registeredMachines]); // actualValues is intentionally omitted to prevent infinite loops

//   useEffect(() => {
//     const delayDebounceFn = setTimeout(() => {
//       if (regMoNoSearch.trim().length > 0 && regMoNoSearch !== regMoNo) {
//         setIsRegLoading(true);
//         axios
//           .get(`${API_BASE_URL}/api/scc/ht-first-output/search-active-mos`, {
//             params: { term: regMoNoSearch }
//           })
//           .then((response) => {
//             setMoDropdownOptions(response.data || []);
//             setShowRegMoDropdown(response.data.length > 0);
//           })
//           .catch((error) => {
//             console.error("Error searching MOs:", error);
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

//   const handleColorChange = (newColor, moNumberFromSelect = null) => {
//     setRegColor(newColor); // This will trigger a re-render

//     // Determine which MO number to use:
//     // 1. If moNumberFromSelect is provided (from handleMoSelect), use it.
//     // 2. Otherwise, use the current state `regMoNo` (for when user directly changes color from dropdown).
//     const moToUse = moNumberFromSelect || regMoNo;

//     console.log(
//       `[FRONTEND] handleColorChange. MO to use: "${moToUse}", New Color: "${newColor}", State regMoNo: "${regMoNo}"`
//     );

//     if (moToUse && newColor) {
//       setIsRegLoading(true);
//       console.log(
//         `[FRONTEND] Attempting to fetch specs for MO: "${moToUse}", Color: "${newColor}"`
//       );
//       axios
//         .get(`${API_BASE_URL}/api/scc/ht-first-output/specs-for-registration`, {
//           params: { moNo: moToUse, color: newColor }
//         })
//         .then((response) => {
//           console.log(
//             "[FRONTEND] Specs request successful. Response status:",
//             response.status
//           );
//           const specs = response.data;
//           console.log(
//             "[FRONTEND] Received specs from backend:",
//             JSON.stringify(specs, null, 2)
//           );
//           setRegReqTemp(specs?.reqTemp !== undefined ? specs.reqTemp : null);
//           setRegReqTime(specs?.reqTime !== undefined ? specs.reqTime : null);
//           setRegReqPressure(
//             specs?.reqPressure !== undefined ? specs.reqPressure : null
//           );
//         })
//         .catch((error) => {
//           if (error.response) {
//             console.error(
//               "[FRONTEND] Error fetching specs - Server responded:",
//               error.response.data
//             );
//             console.error("[FRONTEND] Error status:", error.response.status);
//           } else if (error.request) {
//             console.error(
//               "[FRONTEND] Error fetching specs - No response received:",
//               error.request
//             );
//           } else {
//             console.error(
//               "[FRONTEND] Error fetching specs - Request setup error:",
//               error.message
//             );
//           }
//           setRegReqTemp(null);
//           setRegReqTime(null);
//           setRegReqPressure(null);
//           // Swal.fire(...) // Keep your Swal alert
//         })
//         .finally(() => {
//           console.log("[FRONTEND] Specs fetch attempt finished.");
//           setIsRegLoading(false);
//         });
//     } else {
//       console.log(
//         `[FRONTEND] handleColorChange: Skipping API call. MO used: "${moToUse}", Color: "${newColor}"`
//       );
//       setRegReqTemp(null);
//       setRegReqTime(null);
//       setRegReqPressure(null);
//     }
//   };

//   const handleMoSelect = (selectedMo) => {
//     setRegMoNoSearch(selectedMo.moNo);
//     setRegMoNo(selectedMo.moNo); // This state update is async
//     setRegBuyer(selectedMo.buyer);
//     setRegBuyerStyle(selectedMo.buyerStyle);
//     setShowRegMoDropdown(false);
//     // Reset dependent fields immediately
//     setRegColor("");
//     setRegAvailableColors([]);
//     setRegReqTemp(null);
//     setRegReqTime(null);
//     setRegReqPressure(null);

//     setIsRegLoading(true);
//     axios
//       .get(
//         `${API_BASE_URL}/api/scc/ht-first-output/mo-details-for-registration`,
//         { params: { moNo: selectedMo.moNo } } // Use selectedMo.moNo directly here
//       )
//       .then((response) => {
//         setRegAvailableColors(response.data.colors || []);
//         if (response.data.colors && response.data.colors.length === 1) {
//           // Pass selectedMo.moNo directly to handleColorChange
//           handleColorChange(response.data.colors[0], selectedMo.moNo);
//         }
//       })
//       .catch((error) => {
//         console.error(
//           "Error fetching MO colors:",
//           error.response ? error.response.data : error.message
//         );
//         // Potentially reset colors if MO details fetch fails
//         setRegAvailableColors([]);
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
//     setRegReqTemp(null);
//     setRegReqTime(null);
//     setRegReqPressure(null);
//   };

//   const handleRegisterMachine = async () => {
//     if (!regMachineNo || !regMoNo || !regColor) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t(
//           "sccDailyHTQC.validation.fillMachineMoColor",
//           "Please select Machine No, search and select MO No, and Color."
//         ),
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
//       baseReqTemp: regReqTemp,
//       baseReqTime: regReqTime,
//       baseReqPressure: regReqPressure,
//       emp_id: user.emp_id,
//       emp_kh_name: user.kh_name,
//       emp_eng_name: user.eng_name,
//       emp_dept_name: user.dept_name,
//       emp_sect_name: user.sect_name,
//       emp_job_title: user.job_title
//     };

//     const success = await onFormSubmit("registerMachine", payload);
//     if (success) {
//       resetRegistrationForm();
//       fetchRegisteredMachinesForDate();
//     }
//   };

//   const fetchRegisteredMachinesForDate = useCallback(() => {
//     if (!inspectionDate) return;
//     setIsInspectionDataLoading(true);
//     axios
//       .get(`${API_BASE_URL}/api/scc/daily-htfu/by-date`, {
//         params: { inspectionDate: formatDateForAPI(inspectionDate) }
//       })
//       .then((response) => {
//         setRegisteredMachines(response.data || []);
//       })
//       .catch((error) => {
//         console.error("Error fetching registered machines:", error);
//         setRegisteredMachines([]);
//       })
//       .finally(() => setIsInspectionDataLoading(false));
//   }, [inspectionDate]);

//   useEffect(() => {
//     fetchRegisteredMachinesForDate();
//   }, [fetchRegisteredMachinesForDate]);

//   const handleActualValueChange = (docId, timeSlotKey, field, value) => {
//     const key = `${docId}_${timeSlotKey}`;
//     setActualValues((prev) => ({
//       ...prev,
//       [key]: {
//         ...(prev[key] || {}),
//         [field]: value === "" ? null : Number(value),
//         [`${field}_isUserModified`]: true
//       }
//     }));
//   };

//   const toggleActualNA = (docId, timeSlotKey, field) => {
//     const key = `${docId}_${timeSlotKey}`;
//     const currentIsNA = actualValues[key]?.[`${field}_isNA`] || false;
//     const baseReqValue = registeredMachines.find((m) => m._id === docId)?.[
//       `baseReq${field.charAt(0).toUpperCase() + field.slice(1)}`
//     ];

//     setActualValues((prev) => ({
//       ...prev,
//       [key]: {
//         ...(prev[key] || {}),
//         [`${field}_isNA`]: !currentIsNA,
//         [field]: !currentIsNA
//           ? null
//           : prev[key]?.[field] !== undefined
//           ? prev[key]?.[field]
//           : baseReqValue,
//         [`${field}_isUserModified`]: true
//       }
//     }));
//   };

//   const handleIncrementDecrement = (
//     docId,
//     timeSlotKey,
//     field,
//     baseReqValue,
//     increment
//   ) => {
//     const key = `${docId}_${timeSlotKey}`;
//     const currentActual = actualValues[key]?.[field];
//     let newValue;
//     if (
//       currentActual === null ||
//       currentActual === undefined ||
//       isNaN(Number(currentActual))
//     ) {
//       newValue =
//         baseReqValue !== null && baseReqValue !== undefined
//           ? Number(baseReqValue)
//           : 0;
//     } else {
//       newValue = Number(currentActual);
//     }
//     newValue += increment;

//     setActualValues((prev) => ({
//       ...prev,
//       [key]: {
//         ...(prev[key] || {}),
//         [field]: newValue,
//         [`${field}_isUserModified`]: true
//       }
//     }));
//   };

//   const inspectionTableDisplayData = useMemo(() => {
//     let filtered = registeredMachines;
//     if (filterMachineNo !== "All") {
//       filtered = registeredMachines.filter(
//         (m) => m.machineNo === filterMachineNo
//       );
//     }
//     return filtered.sort((a, b) => Number(a.machineNo) - Number(b.machineNo));
//   }, [registeredMachines, filterMachineNo]);

//   const handleSubmitMachineSlotInspection = async (machineDoc) => {
//     if (!selectedTimeSlotKey) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t(
//           "sccDailyHTQC.validation.selectTimeSlot",
//           "Please select a Time Slot first."
//         ),
//         "warning"
//       );
//       return;
//     }
//     const currentSlotConfig = TIME_SLOTS_CONFIG.find(
//       (ts) => ts.key === selectedTimeSlotKey
//     );
//     if (!currentSlotConfig) return;

//     const docSlotKey = `${machineDoc._id}_${selectedTimeSlotKey}`;
//     const currentActuals = actualValues[docSlotKey] || {};

//     const tempActualToSubmit = currentActuals.temp_isNA
//       ? null
//       : currentActuals.temp_actual !== undefined
//       ? currentActuals.temp_actual
//       : machineDoc.baseReqTemp;
//     const timeActualToSubmit = currentActuals.time_isNA
//       ? null
//       : currentActuals.time_actual !== undefined
//       ? currentActuals.time_actual
//       : machineDoc.baseReqTime;
//     const pressureActualToSubmit = currentActuals.pressure_isNA
//       ? null
//       : currentActuals.pressure_actual !== undefined
//       ? currentActuals.pressure_actual
//       : machineDoc.baseReqPressure;

//     const payload = {
//       inspectionDate: formatDateForAPI(inspectionDate),
//       timeSlotKey: selectedTimeSlotKey,
//       inspectionNo: currentSlotConfig.inspectionNo,
//       dailyTestingDocId: machineDoc._id,
//       temp_req: machineDoc.baseReqTemp,
//       temp_actual: tempActualToSubmit,
//       temp_isNA: !!currentActuals.temp_isNA,
//       temp_isUserModified: !!currentActuals.temp_isUserModified,
//       time_req: machineDoc.baseReqTime,
//       time_actual: timeActualToSubmit,
//       time_isNA: !!currentActuals.time_isNA,
//       time_isUserModified: !!currentActuals.time_isUserModified,
//       pressure_req: machineDoc.baseReqPressure,
//       pressure_actual: pressureActualToSubmit,
//       pressure_isNA: !!currentActuals.pressure_isNA,
//       pressure_isUserModified: !!currentActuals.pressure_isUserModified,
//       emp_id: user.emp_id
//     };

//     setSubmittingMachineSlot(docSlotKey);
//     const success = await onFormSubmit("submitSlotInspection", payload); // Note: singular endpoint
//     setSubmittingMachineSlot(null);

//     if (success) {
//       fetchRegisteredMachinesForDate(); // Refresh to get updated inspection array for the machine
//       // Optionally clear only this machine's actuals from state if not fully re-rendering
//       // setActualValues(prev => ({ ...prev, [docSlotKey]: {} })); // Or let the useEffect for actuals handle it
//     }
//   };

//   const getStatusAndBG = (actual, req, tolerance, isNA) => {
//     if (isNA)
//       return {
//         statusText: "N/A",
//         bgColor: "bg-slate-200 text-slate-600",
//         icon: <EyeOff size={14} className="mr-1" />
//       };
//     if (
//       actual === null ||
//       req === null ||
//       actual === undefined ||
//       req === undefined
//     ) {
//       return {
//         statusText: t("scc.pending", "Pending"),
//         bgColor: "bg-amber-100 text-amber-700",
//         icon: <Clock size={14} className="mr-1" />
//       };
//     }
//     const numActual = Number(actual);
//     const numReq = Number(req);
//     let diff = numActual - numReq;
//     if (typeof req === "number" && req.toString().includes(".")) {
//       // Handle float precision for pressure
//       diff = parseFloat(diff.toFixed(1));
//     }

//     if (Math.abs(diff) <= tolerance)
//       return {
//         statusText: `OK`,
//         valueText: `(${numActual})`,
//         bgColor: "bg-green-100 text-green-700",
//         icon: <Check size={14} className="mr-1" />
//       };

//     const deviationText = diff < 0 ? `Low` : `High`;
//     const valueText = `(${numActual}, ${diff < 0 ? "" : "+"}${diff.toFixed(
//       1
//     )})`;
//     return {
//       statusText: deviationText,
//       valueText,
//       bgColor: "bg-red-100 text-red-700",
//       icon: <AlertTriangle size={14} className="mr-1" />
//     };
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         regMoDropdownRef.current &&
//         !regMoDropdownRef.current.contains(event.target) &&
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
//     <div className="space-y-8 p-4 md:p-6 bg-slate-50 min-h-screen">
//       {overallIsLoading && (
//         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000]">
//           <Loader2 className="animate-spin h-16 w-16 text-indigo-400" />
//         </div>
//       )}
//       <header className="text-center mb-8">
//         <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
//           {t(
//             "sccDailyHTQC.mainTitle",
//             "Daily Heat Transfer / Fusing Machine Test and Calibration Sheet"
//           )}
//         </h1>
//         <p className="text-sm text-slate-500 mt-2">
//           {t(
//             "sccDailyHTQC.mainSubtitle",
//             "Calibration test need to perform every 2 hours during production and verify by QA"
//           )}
//         </p>
//       </header>

//       <section className="p-4 md:p-6 bg-white border border-slate-200 rounded-lg shadow-md">
//         <div className="flex justify-between items-center mb-4">
//           <div className="flex items-center text-slate-700">
//             <Settings size={20} className="mr-2 text-indigo-600" />
//             <h2 className="text-lg font-semibold">
//               {t("sccDailyHTQC.settingsTitle", "Settings")}
//             </h2>
//           </div>
//           <button
//             type="button"
//             onClick={() => setSettingsEnabled(!settingsEnabled)}
//             className={`p-2 rounded-md flex items-center transition-colors ${
//               settingsEnabled
//                 ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
//                 : "bg-slate-100 text-slate-600 hover:bg-slate-200"
//             }`}
//             title={
//               settingsEnabled
//                 ? t("scc.turnOffSettings", "Turn Off Settings")
//                 : t("scc.turnOnSettings", "Turn On Settings")
//             }
//           >
//             {settingsEnabled ? <Power size={18} /> : <PowerOff size={18} />}
//             <span className="ml-2 text-sm font-medium">
//               {settingsEnabled
//                 ? t("scc.onUpper", "ON")
//                 : t("scc.offUpper", "OFF")}
//             </span>
//           </button>
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 items-end">
//           <div>
//             <label htmlFor="totalMachines" className={labelClasses}>
//               {t("sccDailyHTQC.totalMachines", "Total Machines")}
//             </label>
//             <input
//               id="totalMachines"
//               type="number"
//               value={totalMachines}
//               onChange={(e) =>
//                 setTotalMachines(Math.max(1, Number(e.target.value)))
//               }
//               disabled={!settingsEnabled}
//               className={baseInputClasses}
//             />
//           </div>
//           <div>
//             <label htmlFor="tempTolerance" className={labelClasses}>
//               <AlertTriangle size={14} className="inline mr-1 text-slate-500" />
//               {t("sccDailyHTQC.tempTolerance", "Temp. Tolerance (°C)")}
//             </label>
//             <input
//               id="tempTolerance"
//               type="number"
//               value={tolerances.temp}
//               onChange={(e) =>
//                 setTolerances((p) => ({ ...p, temp: Number(e.target.value) }))
//               }
//               disabled={!settingsEnabled}
//               className={baseInputClasses}
//             />
//           </div>
//           <div>
//             <label htmlFor="timeTolerance" className={labelClasses}>
//               <AlertTriangle size={14} className="inline mr-1 text-slate-500" />
//               {t("sccDailyHTQC.timeTolerance", "Time Tolerance (Sec)")}
//             </label>
//             <input
//               id="timeTolerance"
//               type="number"
//               value={tolerances.time}
//               onChange={(e) =>
//                 setTolerances((p) => ({ ...p, time: Number(e.target.value) }))
//               }
//               disabled={!settingsEnabled}
//               className={baseInputClasses}
//             />
//           </div>
//           <div>
//             <label htmlFor="pressureTolerance" className={labelClasses}>
//               <AlertTriangle size={14} className="inline mr-1 text-slate-500" />
//               {t("sccDailyHTQC.pressureTolerance", "Pressure Tolerance (Bar)")}
//             </label>
//             <input
//               id="pressureTolerance"
//               type="number"
//               step="0.1"
//               value={tolerances.pressure}
//               onChange={(e) =>
//                 setTolerances((p) => ({
//                   ...p,
//                   pressure: Number(e.target.value)
//                 }))
//               }
//               disabled={!settingsEnabled}
//               className={baseInputClasses}
//             />
//           </div>
//         </div>
//       </section>

//       <div className="max-w-sm mx-auto md:max-w-xs my-6">
//         <label
//           htmlFor="htqcInspectionDate"
//           className={`${labelClasses} text-center`}
//         >
//           {t("scc.inspectionDate", "Inspection Date")}
//         </label>
//         <div className="relative">
//           <DatePicker
//             selected={inspectionDate}
//             onChange={(date) => setInspectionDate(date)}
//             dateFormat="MM/dd/yyyy"
//             className={`${baseInputClasses} text-center`}
//             id="htqcInspectionDate"
//             popperPlacement="bottom"
//             wrapperClassName="w-full"
//           />
//           <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
//         </div>
//       </div>

//       <section className="p-4 md:p-6 bg-white border border-slate-200 rounded-lg shadow-md">
//         <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
//           <BookUser size={20} className="mr-2 text-indigo-600" />
//           {t(
//             "sccDailyHTQC.registerMachineTitle",
//             "Register Machine for Inspection"
//           )}
//         </h2>
//         <div className="overflow-x-auto pretty-scrollbar">
//           <table className="min-w-full text-sm">
//             <thead className="bg-slate-100">
//               <tr className="text-left text-slate-600 font-semibold">
//                 <th className="p-3">{t("scc.machineNo")}</th>
//                 <th className="p-3">{t("scc.moNo")}</th>
//                 <th className="p-3">{t("scc.buyer")}</th>
//                 <th className="p-3">{t("scc.buyerStyle")}</th>
//                 <th className="p-3">{t("scc.color")}</th>
//                 <th className="p-3 text-center">
//                   {t("sccDailyHTQC.reqTempShort", "R.Temp")}
//                 </th>
//                 <th className="p-3 text-center">
//                   {t("sccDailyHTQC.reqTimeShort", "R.Time")}
//                 </th>
//                 <th className="p-3 text-center">
//                   {t("sccDailyHTQC.reqPressureShort", "R.Pres")}
//                 </th>
//                 <th className="p-3 text-center">{t("scc.action")}</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
//                 <td className="p-2 min-w-[100px]">
//                   <select
//                     value={regMachineNo}
//                     onChange={(e) => setRegMachineNo(e.target.value)}
//                     className={baseInputClasses}
//                   >
//                     <option value="">{t("scc.select")}</option>
//                     {machineOptions.map((m) => (
//                       <option key={m} value={m}>
//                         {m}
//                       </option>
//                     ))}
//                   </select>
//                 </td>
//                 <td className="p-2 min-w-[180px]" ref={regMoDropdownRef}>
//                   <div className="relative">
//                     <input
//                       type="text"
//                       ref={regMoSearchInputRef}
//                       value={regMoNoSearch}
//                       onChange={(e) => setRegMoNoSearch(e.target.value)}
//                       onFocus={() =>
//                         regMoNoSearch.trim() && setShowRegMoDropdown(true)
//                       }
//                       placeholder={t("scc.searchMoNo")}
//                       className={`${baseInputClasses} pl-9`}
//                     />
//                     <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
//                     {showRegMoDropdown && moDropdownOptions.length > 0 && (
//                       <ul className="absolute z-30 mt-1 w-full bg-white shadow-xl max-h-60 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto">
//                         {moDropdownOptions.map((mo, idx) => (
//                           <li
//                             key={idx}
//                             onClick={() => handleMoSelect(mo)}
//                             className="text-slate-900 cursor-pointer select-none relative py-2 px-4 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
//                           >
//                             {mo.moNo}{" "}
//                             <span className="text-xs text-slate-500">
//                               ({mo.buyerStyle || t("scc.naCap", "N/A")})
//                             </span>
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>
//                 </td>
//                 <td className="p-2 min-w-[140px]">
//                   <input
//                     type="text"
//                     value={regBuyer}
//                     readOnly
//                     className={`${baseInputClasses} bg-slate-100`}
//                   />
//                 </td>
//                 <td className="p-2 min-w-[140px]">
//                   <input
//                     type="text"
//                     value={regBuyerStyle}
//                     readOnly
//                     className={`${baseInputClasses} bg-slate-100`}
//                   />
//                 </td>
//                 <td className="p-2 min-w-[140px]">
//                   <select
//                     value={regColor}
//                     onChange={(e) => handleColorChange(e.target.value)}
//                     className={baseInputClasses}
//                     disabled={regAvailableColors.length === 0}
//                   >
//                     <option value="">{t("scc.selectColor")}</option>
//                     {regAvailableColors.map((c) => (
//                       <option key={c} value={c}>
//                         {c}
//                       </option>
//                     ))}
//                   </select>
//                 </td>
//                 <td className="p-2 min-w-[80px]">
//                   <input
//                     type="number"
//                     value={regReqTemp ?? ""}
//                     readOnly
//                     className={`${baseInputClasses} text-center bg-slate-100`}
//                   />
//                 </td>
//                 <td className="p-2 min-w-[80px]">
//                   <input
//                     type="number"
//                     value={regReqTime ?? ""}
//                     readOnly
//                     className={`${baseInputClasses} text-center bg-slate-100`}
//                   />
//                 </td>
//                 <td className="p-2 min-w-[80px]">
//                   <input
//                     type="number"
//                     step="0.1"
//                     value={regReqPressure ?? ""}
//                     readOnly
//                     className={`${baseInputClasses} text-center bg-slate-100`}
//                   />
//                 </td>
//                 <td className="p-2 text-center">
//                   <button
//                     type="button"
//                     onClick={handleRegisterMachine}
//                     disabled={
//                       !regMachineNo ||
//                       !regMoNo ||
//                       !regColor ||
//                       isRegLoading ||
//                       parentIsSubmitting
//                     }
//                     className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
//                   >
//                     {t("sccDailyHTQC.register", "Register")}
//                   </button>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </section>

//       <section className="p-4 md:p-6 bg-white border border-slate-200 rounded-lg shadow-md">
//         <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
//           <ListChecks size={20} className="mr-2 text-indigo-600" />
//           {t("sccDailyHTQC.inspectionDataTitle", "Inspection Data")}
//         </h2>
//         <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-slate-50 rounded-md mb-6 border border-slate-200">
//           <div className="w-full sm:w-auto">
//             <label htmlFor="filterMachineNo" className={labelClasses}>
//               {t("scc.machineNo")}
//             </label>
//             <select
//               id="filterMachineNo"
//               value={filterMachineNo}
//               onChange={(e) => setFilterMachineNo(e.target.value)}
//               className={baseInputClasses}
//             >
//               <option value="All">
//                 {t("scc.allMachines", "All Machines")}
//               </option>
//               {machineOptions
//                 .filter((m) =>
//                   registeredMachines.some((rm) => rm.machineNo === m)
//                 )
//                 .map((m) => (
//                   <option key={m} value={m}>
//                     {m}
//                   </option>
//                 ))}
//             </select>
//           </div>
//           <div className="w-full sm:w-auto">
//             <label htmlFor="selectedTimeSlotKey" className={labelClasses}>
//               {t("sccDailyHTQC.timeSlot", "Time Slot")}
//             </label>
//             <select
//               id="selectedTimeSlotKey"
//               value={selectedTimeSlotKey}
//               onChange={(e) => setSelectedTimeSlotKey(e.target.value)}
//               className={baseInputClasses}
//             >
//               <option value="">
//                 {t("sccDailyHTQC.selectTimeSlot", "-- Select Time Slot --")}
//               </option>
//               {TIME_SLOTS_CONFIG.map((ts) => (
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
//                   <th className="p-3 border border-slate-300">
//                     {t("scc.machineNo")}
//                   </th>
//                   <th className="p-3 border border-slate-300">
//                     {t("scc.moNo")}
//                   </th>
//                   <th className="p-3 border border-slate-300">
//                     {t("scc.color")}
//                   </th>
//                   <th className="p-3 border border-slate-300">
//                     {t("sccDailyHTQC.parameter")}
//                   </th>
//                   <th className="p-3 border border-slate-300 text-center">
//                     {t("sccDailyHTQC.reqValue")}
//                   </th>
//                   <th className="p-3 border border-slate-300 text-center">
//                     {t("sccDailyHTQC.actualValue")}
//                   </th>
//                   <th className="p-3 border border-slate-300 text-center">
//                     {t("scc.action")}
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-200">
//                 {inspectionTableDisplayData.length === 0 && (
//                   <tr>
//                     <td
//                       colSpan="7"
//                       className="p-6 text-center text-slate-500 italic"
//                     >
//                       {t(
//                         "sccDailyHTQC.noMachinesRegisteredOrFiltered",
//                         "No machines registered for this date, or none match current filters."
//                       )}
//                     </td>
//                   </tr>
//                 )}
//                 {inspectionTableDisplayData.map((machine) => {
//                   const existingInspectionForSlot = machine.inspections.find(
//                     (insp) => insp.timeSlotKey === selectedTimeSlotKey
//                   );
//                   const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
//                   const currentActualsForSlot = actualValues[docSlotKey] || {};
//                   const isCurrentlySubmittingThis =
//                     submittingMachineSlot === docSlotKey;

//                   const parameters = [
//                     {
//                       name: t("sccDailyHTQC.temperature", "Temperature"),
//                       field: "temp",
//                       unit: "°C",
//                       reqValue: machine.baseReqTemp,
//                       tolerance: tolerances.temp,
//                       icon: <Thermometer size={14} />
//                     },
//                     {
//                       name: t("sccDailyHTQC.timing", "Timing"),
//                       field: "time",
//                       unit: "Sec",
//                       reqValue: machine.baseReqTime,
//                       tolerance: tolerances.time,
//                       icon: <Clock size={14} />
//                     },
//                     {
//                       name: t("sccDailyHTQC.pressure", "Pressure"),
//                       field: "pressure",
//                       unit: "Bar",
//                       reqValue: machine.baseReqPressure,
//                       tolerance: tolerances.pressure,
//                       icon: <Gauge size={14} />
//                     }
//                   ];

//                   return (
//                     <React.Fragment key={machine._id}>
//                       {parameters.map((param, paramIdx) => (
//                         <tr
//                           key={`${machine._id}_${selectedTimeSlotKey}_${param.field}`}
//                           className="hover:bg-slate-50 transition-colors"
//                         >
//                           {paramIdx === 0 && (
//                             <>
//                               <td
//                                 rowSpan={parameters.length}
//                                 className="p-2.5 border border-slate-300 text-center align-middle font-medium text-slate-700"
//                               >
//                                 {machine.machineNo}
//                               </td>
//                               <td
//                                 rowSpan={parameters.length}
//                                 className="p-2.5 border border-slate-300 text-center align-middle text-slate-600"
//                               >
//                                 {machine.moNo}
//                               </td>
//                               <td
//                                 rowSpan={parameters.length}
//                                 className="p-2.5 border border-slate-300 text-center align-middle text-slate-600"
//                               >
//                                 {machine.color}
//                               </td>
//                             </>
//                           )}
//                           <td className="p-2.5 border border-slate-300 whitespace-nowrap text-slate-700 flex items-center">
//                             {React.cloneElement(param.icon, {
//                               className: "mr-1.5 text-indigo-600"
//                             })}{" "}
//                             {param.name}{" "}
//                             <span className="text-slate-500 ml-1">
//                               ({param.unit})
//                             </span>
//                           </td>
//                           <td className="p-2.5 border border-slate-300 text-center font-medium text-slate-600">
//                             {param.reqValue ?? t("scc.naCap", "N/A")}
//                           </td>
//                           <td
//                             className={`p-1.5 border border-slate-300 text-center`}
//                           >
//                             {existingInspectionForSlot ? (
//                               <span
//                                 className={`px-2 py-1 rounded-md text-xs font-semibold inline-flex items-center ${
//                                   getStatusAndBG(
//                                     existingInspectionForSlot[
//                                       `${param.field}_actual`
//                                     ],
//                                     param.reqValue,
//                                     param.tolerance,
//                                     existingInspectionForSlot[
//                                       `${param.field}_isNA`
//                                     ]
//                                   ).bgColor
//                                 }`}
//                               >
//                                 {
//                                   getStatusAndBG(
//                                     existingInspectionForSlot[
//                                       `${param.field}_actual`
//                                     ],
//                                     param.reqValue,
//                                     param.tolerance,
//                                     existingInspectionForSlot[
//                                       `${param.field}_isNA`
//                                     ]
//                                   ).icon
//                                 }
//                                 {existingInspectionForSlot[
//                                   `${param.field}_isNA`
//                                 ]
//                                   ? t("scc.naCap", "N/A")
//                                   : existingInspectionForSlot[
//                                       `${param.field}_actual`
//                                     ] ?? t("scc.naCap", "N/A")}
//                               </span>
//                             ) : (
//                               <div className="flex items-center justify-center space-x-1.5">
//                                 {currentActualsForSlot[
//                                   `${param.field}_isNA`
//                                 ] ? (
//                                   <span className="italic text-slate-500 px-2 py-1">
//                                     {t("scc.naCap", "N/A")}
//                                   </span>
//                                 ) : (
//                                   <>
//                                     <button
//                                       type="button"
//                                       onClick={() =>
//                                         handleIncrementDecrement(
//                                           machine._id,
//                                           selectedTimeSlotKey,
//                                           param.field,
//                                           param.reqValue,
//                                           -1
//                                         )
//                                       }
//                                       className={iconButtonClasses}
//                                       title={t("scc.decrement", "Decrement")}
//                                     >
//                                       <Minus size={12} />
//                                     </button>
//                                     <input
//                                       type="number"
//                                       step={
//                                         param.field === "pressure" ? "0.1" : "1"
//                                       }
//                                       value={
//                                         currentActualsForSlot[param.field] ?? ""
//                                       }
//                                       onChange={(e) =>
//                                         handleActualValueChange(
//                                           machine._id,
//                                           selectedTimeSlotKey,
//                                           param.field,
//                                           e.target.value
//                                         )
//                                       }
//                                       className="w-20 text-center p-1 border border-slate-300 rounded text-xs focus:ring-indigo-500 focus:border-indigo-500"
//                                     />
//                                     <button
//                                       type="button"
//                                       onClick={() =>
//                                         handleIncrementDecrement(
//                                           machine._id,
//                                           selectedTimeSlotKey,
//                                           param.field,
//                                           param.reqValue,
//                                           1
//                                         )
//                                       }
//                                       className={iconButtonClasses}
//                                       title={t("scc.increment", "Increment")}
//                                     >
//                                       <Plus size={12} />
//                                     </button>
//                                   </>
//                                 )}
//                                 <button
//                                   type="button"
//                                   onClick={() =>
//                                     toggleActualNA(
//                                       machine._id,
//                                       selectedTimeSlotKey,
//                                       param.field
//                                     )
//                                   }
//                                   className={iconButtonClasses}
//                                   title={
//                                     currentActualsForSlot[`${param.field}_isNA`]
//                                       ? t(
//                                           "scc.markAsApplicable",
//                                           "Mark as Applicable"
//                                         )
//                                       : t("scc.markNA", "Mark N/A")
//                                   }
//                                 >
//                                   {currentActualsForSlot[
//                                     `${param.field}_isNA`
//                                   ] ? (
//                                     <Eye size={12} className="text-slate-500" />
//                                   ) : (
//                                     <EyeOff size={12} />
//                                   )}
//                                 </button>
//                               </div>
//                             )}
//                           </td>
//                           {paramIdx === 0 && (
//                             <td
//                               rowSpan={parameters.length}
//                               className="p-2.5 border border-slate-300 text-center align-middle"
//                             >
//                               {existingInspectionForSlot ? (
//                                 <div className="flex flex-col items-center justify-center text-green-700 ">
//                                   <Check
//                                     size={20}
//                                     className="mb-0.5 text-green-500"
//                                   />
//                                   <span className="text-xs font-semibold">
//                                     {t("sccDailyHTQC.submitted", "Submitted")}
//                                   </span>
//                                   <span className="text-[10px] text-slate-500">
//                                     (
//                                     {formatTimestampForDisplay(
//                                       existingInspectionForSlot.inspectionTimestamp
//                                     )}
//                                     )
//                                   </span>
//                                 </div>
//                               ) : (
//                                 <button
//                                   type="button"
//                                   onClick={() =>
//                                     handleSubmitMachineSlotInspection(machine)
//                                   }
//                                   disabled={
//                                     isCurrentlySubmittingThis ||
//                                     parentIsSubmitting
//                                   }
//                                   className="w-full px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-slate-400 flex items-center justify-center"
//                                 >
//                                   {isCurrentlySubmittingThis ? (
//                                     <Loader2
//                                       size={14}
//                                       className="animate-spin mr-1.5"
//                                     />
//                                   ) : (
//                                     <Send size={14} className="mr-1.5" />
//                                   )}
//                                   {t("scc.submit")}
//                                 </button>
//                               )}
//                             </td>
//                           )}
//                         </tr>
//                       ))}
//                     </React.Fragment>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="text-center py-10 text-slate-500 italic">
//             {t(
//               "sccDailyHTQC.pleaseSelectTimeSlot",
//               "Please select a time slot to view or enter inspection data."
//             )}
//           </div>
//         )}
//       </section>
//     </div>
//   );
// };

// export default DailyHTQC;

import axios from "axios";
import {
  Eye,
  EyeOff,
  Loader2,
  Minus,
  Plus,
  Search,
  Settings,
  Thermometer,
  Clock,
  Gauge,
  CalendarDays,
  Power,
  PowerOff,
  AlertTriangle,
  Check,
  ListChecks,
  BookUser,
  Send, // For submit button per row
  RefreshCw // For refresh button or N/A toggle visual
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

const baseInputClasses =
  "text-sm block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";
const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
const iconButtonClasses =
  "p-1.5 hover:bg-slate-200 rounded-full text-slate-600 hover:text-indigo-600 transition-colors";

const TIME_SLOTS_CONFIG = [
  { key: "07:00", label: "07.00 AM", inspectionNo: 1 },
  { key: "09:00", label: "09.00 AM", inspectionNo: 2 },
  { key: "12:00", label: "12.00 PM", inspectionNo: 3 },
  { key: "14:00", label: "02.00 PM", inspectionNo: 4 },
  { key: "16:00", label: "04.00 PM", inspectionNo: 5 },
  { key: "18:00", label: "06.00 PM", inspectionNo: 6 }
];

const formatDateForAPI = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
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

const DailyHTQC = ({ onFormSubmit, isSubmitting: parentIsSubmitting }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [settingsEnabled, setSettingsEnabled] = useState(false);
  const [totalMachines, setTotalMachines] = useState(15);
  const [tolerances, setTolerances] = useState({
    temp: 5,
    time: 0,
    pressure: 0.2 // Example: Pressure tolerance, adjust as needed
  });
  const [inspectionDate, setInspectionDate] = useState(new Date());

  const [regMachineNo, setRegMachineNo] = useState("");
  const [regMoNoSearch, setRegMoNoSearch] = useState("");
  const [regMoNo, setRegMoNo] = useState("");
  const [regBuyer, setRegBuyer] = useState("");
  const [regBuyerStyle, setRegBuyerStyle] = useState("");
  const [regColor, setRegColor] = useState("");
  const [regAvailableColors, setRegAvailableColors] = useState([]);
  const [regReqTemp, setRegReqTemp] = useState(null);
  const [regReqTime, setRegReqTime] = useState(null);
  const [regReqPressure, setRegReqPressure] = useState(null);
  const [moDropdownOptions, setMoDropdownOptions] = useState([]);
  const [showRegMoDropdown, setShowRegMoDropdown] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);

  const regMoSearchInputRef = useRef(null);
  const regMoDropdownRef = useRef(null);

  const [registeredMachines, setRegisteredMachines] = useState([]);
  const [filterMachineNo, setFilterMachineNo] = useState("All");
  const [selectedTimeSlotKey, setSelectedTimeSlotKey] = useState("");
  const [actualValues, setActualValues] = useState({}); // Stores user inputs: { 'docId_slotKey': { temp_actual: val, time_actual: val, ... } }
  const [isInspectionDataLoading, setIsInspectionDataLoading] = useState(false);
  const [submittingMachineSlot, setSubmittingMachineSlot] = useState(null);

  const machineOptions = useMemo(
    () => Array.from({ length: totalMachines }, (_, i) => String(i + 1)),
    [totalMachines]
  );

  // Effect to initialize actualValues for a newly selected slot OR sync with existing inspections
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
          // If an inspection exists, ensure actualValues reflects the submitted data
          // This is mainly for display consistency if inputs become disabled.
          if (
            !newActuals[docSlotKey] || // If no local state for this slot yet
            newActuals[docSlotKey].temp_actual !==
              existingInspection.temp_actual ||
            newActuals[docSlotKey].time_actual !==
              existingInspection.time_actual ||
            newActuals[docSlotKey].pressure_actual !==
              existingInspection.pressure_actual ||
            newActuals[docSlotKey].temp_isNA !== existingInspection.temp_isNA ||
            newActuals[docSlotKey].time_isNA !== existingInspection.time_isNA ||
            newActuals[docSlotKey].pressure_isNA !==
              existingInspection.pressure_isNA
          ) {
            newActuals[docSlotKey] = {
              temp_actual: existingInspection.temp_actual,
              temp_isNA: existingInspection.temp_isNA,
              time_actual: existingInspection.time_actual,
              time_isNA: existingInspection.time_isNA,
              pressure_actual: existingInspection.pressure_actual,
              pressure_isNA: existingInspection.pressure_isNA,
              // Mark as user modified if it was, to prevent accidental overwrite by other logic (though less relevant now)
              temp_isUserModified: true,
              time_isUserModified: true,
              pressure_isUserModified: true
            };
            changed = true;
          }
        } else {
          // If no existing inspection and no local state for this slot, initialize it as an empty object.
          // User will type values. Default N/A state to false.
          if (!newActuals[docSlotKey]) {
            newActuals[docSlotKey] = {
              temp_isNA: false,
              time_isNA: false,
              pressure_isNA: false
              // actual values will be undefined initially, user types them
            };
            changed = true;
          } else {
            // Ensure NA flags are present if slot object exists but flags are missing
            if (newActuals[docSlotKey].temp_isNA === undefined)
              newActuals[docSlotKey].temp_isNA = false;
            if (newActuals[docSlotKey].time_isNA === undefined)
              newActuals[docSlotKey].time_isNA = false;
            if (newActuals[docSlotKey].pressure_isNA === undefined)
              newActuals[docSlotKey].pressure_isNA = false;
          }
        }
      });

      if (changed) {
        setActualValues(newActuals);
      }
    } else if (!selectedTimeSlotKey && Object.keys(actualValues).length > 0) {
      // Clear actuals if no timeslot is selected
      setActualValues({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeSlotKey, registeredMachines]); // actualValues is intentionally omitted

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (regMoNoSearch.trim().length > 0 && regMoNoSearch !== regMoNo) {
        setIsRegLoading(true);
        axios
          .get(`${API_BASE_URL}/api/scc/ht-first-output/search-active-mos`, {
            params: { term: regMoNoSearch }
          })
          .then((response) => {
            setMoDropdownOptions(response.data || []);
            setShowRegMoDropdown(response.data.length > 0);
          })
          .catch((error) => {
            console.error("Error searching MOs:", error);
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

  const handleColorChange = (newColor, moNumberFromSelect = null) => {
    setRegColor(newColor);
    const moToUse = moNumberFromSelect || regMoNo;
    if (moToUse && newColor) {
      setIsRegLoading(true);
      axios
        .get(`${API_BASE_URL}/api/scc/ht-first-output/specs-for-registration`, {
          params: { moNo: moToUse, color: newColor }
        })
        .then((response) => {
          const specs = response.data;
          setRegReqTemp(specs?.reqTemp !== undefined ? specs.reqTemp : null);
          setRegReqTime(specs?.reqTime !== undefined ? specs.reqTime : null);
          setRegReqPressure(
            specs?.reqPressure !== undefined ? specs.reqPressure : null
          );
        })
        .catch((error) => {
          console.error(
            "Error fetching specs:",
            error.response ? error.response.data : error.message
          );
          setRegReqTemp(null);
          setRegReqTime(null);
          setRegReqPressure(null);
          Swal.fire(
            t("scc.error"),
            t(
              "sccDailyHTQC.errorFetchingSpecs",
              "Error fetching specifications."
            ),
            "error"
          );
        })
        .finally(() => setIsRegLoading(false));
    } else {
      setRegReqTemp(null);
      setRegReqTime(null);
      setRegReqPressure(null);
    }
  };

  const handleMoSelect = (selectedMo) => {
    setRegMoNoSearch(selectedMo.moNo);
    setRegMoNo(selectedMo.moNo);
    setRegBuyer(selectedMo.buyer);
    setRegBuyerStyle(selectedMo.buyerStyle);
    setShowRegMoDropdown(false);
    setRegColor("");
    setRegAvailableColors([]);
    setRegReqTemp(null);
    setRegReqTime(null);
    setRegReqPressure(null);

    setIsRegLoading(true);
    axios
      .get(
        `${API_BASE_URL}/api/scc/ht-first-output/mo-details-for-registration`,
        { params: { moNo: selectedMo.moNo } }
      )
      .then((response) => {
        setRegAvailableColors(response.data.colors || []);
        if (response.data.colors && response.data.colors.length === 1) {
          handleColorChange(response.data.colors[0], selectedMo.moNo);
        }
      })
      .catch((error) => {
        console.error(
          "Error fetching MO colors:",
          error.response ? error.response.data : error.message
        );
        setRegAvailableColors([]);
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
    setRegReqTemp(null);
    setRegReqTime(null);
    setRegReqPressure(null);
  };

  const handleRegisterMachine = async () => {
    if (!regMachineNo || !regMoNo || !regColor) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyHTQC.validation.fillMachineMoColor"),
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
      baseReqTemp: regReqTemp,
      baseReqTime: regReqTime,
      baseReqPressure: regReqPressure,
      emp_id: user.emp_id,
      emp_kh_name: user.kh_name,
      emp_eng_name: user.eng_name,
      emp_dept_name: user.dept_name,
      emp_sect_name: user.sect_name,
      emp_job_title: user.job_title
    };
    const success = await onFormSubmit("registerMachine", payload);
    if (success) {
      resetRegistrationForm();
      fetchRegisteredMachinesForDate();
    }
  };

  const fetchRegisteredMachinesForDate = useCallback(() => {
    if (!inspectionDate) return;
    setIsInspectionDataLoading(true);
    axios
      .get(`${API_BASE_URL}/api/scc/daily-htfu/by-date`, {
        params: { inspectionDate: formatDateForAPI(inspectionDate) }
      })
      .then((response) => setRegisteredMachines(response.data || []))
      .catch((error) => {
        console.error("Error fetching registered machines:", error);
        setRegisteredMachines([]);
      })
      .finally(() => setIsInspectionDataLoading(false));
  }, [inspectionDate]);

  useEffect(() => {
    fetchRegisteredMachinesForDate();
  }, [fetchRegisteredMachinesForDate]);

  const handleActualValueChange = (docId, timeSlotKey, field, value) => {
    const key = `${docId}_${timeSlotKey}`;
    setActualValues((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value === "" ? null : Number(value), // Store as number or null
        [`${field}_isUserModified`]: true
      }
    }));
  };

  const toggleActualNA = (docId, timeSlotKey, field) => {
    const key = `${docId}_${timeSlotKey}`;
    setActualValues((prev) => {
      const currentSlotActuals = prev[key] || {};
      const newIsNA = !currentSlotActuals[`${field}_isNA`];
      let newActualValue = currentSlotActuals[field];

      if (newIsNA) {
        newActualValue = null; // When marking N/A, actual value becomes null
      }
      // When unmarking N/A, the currentActualValue (which might be user-typed or undefined) is kept.
      // The input field will show this value or be empty if it's undefined/null.

      return {
        ...prev,
        [key]: {
          ...currentSlotActuals,
          [`${field}_isNA`]: newIsNA,
          [field]: newActualValue,
          [`${field}_isUserModified`]: true
        }
      };
    });
  };

  const handleIncrementDecrement = (docId, timeSlotKey, field, increment) => {
    // No baseReqValue needed here if we don't prefill from it
    const key = `${docId}_${timeSlotKey}`;
    setActualValues((prev) => {
      const currentSlotActuals = prev[key] || {};
      let currentActualNum = Number(currentSlotActuals[field]);
      if (isNaN(currentActualNum)) {
        // If current value is not a number (e.g. undefined, null, or non-numeric string)
        currentActualNum = 0; // Start from 0 or from machine.baseReq if you want that
      }

      let newValue = currentActualNum + increment;
      if (field === "pressure") newValue = parseFloat(newValue.toFixed(1));

      return {
        ...prev,
        [key]: {
          ...currentSlotActuals,
          [field]: newValue,
          [`${field}_isUserModified`]: true
        }
      };
    });
  };

  const inspectionTableDisplayData = useMemo(() => {
    let filtered = registeredMachines;
    if (filterMachineNo !== "All") {
      filtered = registeredMachines.filter(
        (m) => m.machineNo === filterMachineNo
      );
    }
    return filtered.sort((a, b) => {
      const numA = parseInt(a.machineNo, 10);
      const numB = parseInt(b.machineNo, 10);
      return !isNaN(numA) && !isNaN(numB)
        ? numA - numB
        : a.machineNo.localeCompare(b.machineNo);
    });
  }, [registeredMachines, filterMachineNo]);

  const handleSubmitMachineSlotInspection = async (machineDoc) => {
    if (!selectedTimeSlotKey) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyHTQC.validation.selectTimeSlot"),
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

    // Ensure actual values are numbers or null, not undefined
    const tempActualToSubmit = currentActuals.temp_isNA
      ? null
      : currentActuals.temp_actual ?? null;
    const timeActualToSubmit = currentActuals.time_isNA
      ? null
      : currentActuals.time_actual ?? null;
    const pressureActualToSubmit = currentActuals.pressure_isNA
      ? null
      : currentActuals.pressure_actual ?? null;

    // Validation: Check if any non-N/A field is still null (meaning user hasn't typed anything)
    if (
      (!currentActuals.temp_isNA && tempActualToSubmit === null) ||
      (!currentActuals.time_isNA && timeActualToSubmit === null) ||
      (!currentActuals.pressure_isNA && pressureActualToSubmit === null)
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t(
          "sccDailyHTQC.validation.fillAllActualsOrNA",
          "Please fill all actual values or mark them as N/A."
        ),
        "warning"
      );
      return;
    }

    const payload = {
      inspectionDate: formatDateForAPI(inspectionDate),
      timeSlotKey: selectedTimeSlotKey,
      inspectionNo: currentSlotConfig.inspectionNo,
      dailyTestingDocId: machineDoc._id,
      temp_req: machineDoc.baseReqTemp ?? null,
      temp_actual: tempActualToSubmit,
      temp_isNA: !!currentActuals.temp_isNA,
      temp_isUserModified: !!currentActuals.temp_isUserModified,
      time_req: machineDoc.baseReqTime ?? null,
      time_actual: timeActualToSubmit,
      time_isNA: !!currentActuals.time_isNA,
      time_isUserModified: !!currentActuals.time_isUserModified,
      pressure_req: machineDoc.baseReqPressure ?? null,
      pressure_actual: pressureActualToSubmit,
      pressure_isNA: !!currentActuals.pressure_isNA,
      pressure_isUserModified: !!currentActuals.pressure_isUserModified,
      emp_id: user.emp_id
    };

    setSubmittingMachineSlot(docSlotKey);
    const success = await onFormSubmit("submitSlotInspection", payload);
    setSubmittingMachineSlot(null);

    if (success) {
      fetchRegisteredMachinesForDate();
      // Optional: Clear the specific slot from actualValues to reset inputs,
      // or let the useEffect handle it if `registeredMachines` change causes it to reset.
      // For now, fetching machines will trigger sync in useEffect.
    }
  };

  const getStatusAndBG = useCallback(
    (actual, req, tolerance, isNA, forCellBackground = false) => {
      if (isNA)
        return {
          statusText: "N/A",
          bgColor: "bg-slate-200 text-slate-600",
          icon: <EyeOff size={14} className="mr-1" />
        };

      // If forCellBackground, and actual is undefined or null, it means user hasn't typed yet.
      // Don't show "Pending" or "Error" colors on the input cell itself until there's a value or it's N/A.
      if (forCellBackground && (actual === null || actual === undefined)) {
        return { statusText: "", bgColor: "bg-white" }; // Default input background
      }

      if (
        actual === null ||
        req === null ||
        actual === undefined ||
        req === undefined
      ) {
        return {
          statusText: t("scc.pending", "Pending"),
          bgColor: "bg-amber-100 text-amber-700",
          icon: <Clock size={14} className="mr-1" />
        };
      }
      const numActual = Number(actual);
      const numReq = Number(req);

      if (isNaN(numActual) || isNaN(numReq)) {
        // Should not happen if data types are correct
        return {
          statusText: t("scc.invalidData", "Invalid Data"),
          bgColor: "bg-gray-100 text-gray-700",
          icon: <AlertTriangle size={14} className="mr-1" />
        };
      }

      let diff = numActual - numReq;
      if (
        field === "pressure" ||
        (typeof req === "number" && req.toString().includes("."))
      ) {
        diff = parseFloat(diff.toFixed(1));
      } else {
        diff = Math.round(diff);
      }

      if (Math.abs(diff) <= tolerance)
        return {
          statusText: `OK`,
          valueText: `(${numActual})`,
          bgColor: "bg-green-100 text-green-700",
          icon: <Check size={14} className="mr-1" />
        };

      const deviationText = diff < 0 ? `Low` : `High`;
      const valueText = `(${numActual}, ${diff < 0 ? "" : "+"}${
        typeof diff === "number" ? diff.toFixed(1) : diff
      })`;
      return {
        statusText: deviationText,
        valueText,
        bgColor: "bg-red-100 text-red-700",
        icon: <AlertTriangle size={14} className="mr-1" />
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [t, tolerances]
  ); // Added tolerances to dependency array for getStatusAndBG

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        regMoDropdownRef.current &&
        !regMoDropdownRef.current.contains(event.target) &&
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

  return (
    <div className="space-y-8 p-4 md:p-6 bg-slate-50 min-h-screen">
      {overallIsLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000]">
          <Loader2 className="animate-spin h-16 w-16 text-indigo-400" />
        </div>
      )}
      <header className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          {t("sccDailyHTQC.mainTitle")}
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          {t("sccDailyHTQC.mainSubtitle")}
        </p>
      </header>

      {/* Settings Section */}
      <section className="p-4 md:p-6 bg-white border border-slate-200 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-slate-700">
            <Settings size={20} className="mr-2 text-indigo-600" />
            <h2 className="text-lg font-semibold">
              {t("sccDailyHTQC.settingsTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setSettingsEnabled(!settingsEnabled)}
            className={`p-2 rounded-md flex items-center transition-colors ${
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
            {settingsEnabled ? <Power size={18} /> : <PowerOff size={18} />}
            <span className="ml-2 text-sm font-medium">
              {settingsEnabled ? t("scc.onUpper") : t("scc.offUpper")}
            </span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 items-end">
          <div>
            <label htmlFor="totalMachines" className={labelClasses}>
              {t("sccDailyHTQC.totalMachines")}
            </label>
            <input
              id="totalMachines"
              type="number"
              value={totalMachines}
              onChange={(e) =>
                setTotalMachines(Math.max(1, Number(e.target.value)))
              }
              disabled={!settingsEnabled}
              className={baseInputClasses}
            />
          </div>
          <div>
            <label htmlFor="tempTolerance" className={labelClasses}>
              <AlertTriangle size={14} className="inline mr-1 text-slate-500" />
              {t("sccDailyHTQC.tempTolerance")}
            </label>
            <input
              id="tempTolerance"
              type="number"
              value={tolerances.temp}
              onChange={(e) =>
                setTolerances((p) => ({ ...p, temp: Number(e.target.value) }))
              }
              disabled={!settingsEnabled}
              className={baseInputClasses}
            />
          </div>
          <div>
            <label htmlFor="timeTolerance" className={labelClasses}>
              <AlertTriangle size={14} className="inline mr-1 text-slate-500" />
              {t("sccDailyHTQC.timeTolerance")}
            </label>
            <input
              id="timeTolerance"
              type="number"
              value={tolerances.time}
              onChange={(e) =>
                setTolerances((p) => ({ ...p, time: Number(e.target.value) }))
              }
              disabled={!settingsEnabled}
              className={baseInputClasses}
            />
          </div>
          <div>
            <label htmlFor="pressureTolerance" className={labelClasses}>
              <AlertTriangle size={14} className="inline mr-1 text-slate-500" />
              {t("sccDailyHTQC.pressureTolerance")}
            </label>
            <input
              id="pressureTolerance"
              type="number"
              step="0.1"
              value={tolerances.pressure}
              onChange={(e) =>
                setTolerances((p) => ({
                  ...p,
                  pressure: Number(e.target.value)
                }))
              }
              disabled={!settingsEnabled}
              className={baseInputClasses}
            />
          </div>
        </div>
      </section>

      {/* Date Picker */}
      <div className="max-w-sm mx-auto md:max-w-xs my-6">
        <label
          htmlFor="htqcInspectionDate"
          className={`${labelClasses} text-center`}
        >
          {t("scc.inspectionDate")}
        </label>
        <div className="relative">
          <DatePicker
            selected={inspectionDate}
            onChange={(date) => setInspectionDate(date)}
            dateFormat="MM/dd/yyyy"
            className={`${baseInputClasses} text-center`}
            id="htqcInspectionDate"
            popperPlacement="bottom"
            wrapperClassName="w-full"
          />
          <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Register Machine Section */}
      <section className="p-4 md:p-6 bg-white border border-slate-200 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
          <BookUser size={20} className="mr-2 text-indigo-600" />
          {t("sccDailyHTQC.registerMachineTitle")}
        </h2>
        <div className="overflow-x-auto pretty-scrollbar">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr className="text-left text-slate-600 font-semibold">
                <th className="p-3">{t("scc.machineNo")}</th>
                <th className="p-3">{t("scc.moNo")}</th>
                <th className="p-3">{t("scc.buyer")}</th>
                <th className="p-3">{t("scc.buyerStyle")}</th>
                <th className="p-3">{t("scc.color")}</th>
                <th className="p-3 text-center">
                  {t("sccDailyHTQC.reqTempShort")}
                </th>
                <th className="p-3 text-center">
                  {t("sccDailyHTQC.reqTimeShort")}
                </th>
                <th className="p-3 text-center">
                  {t("sccDailyHTQC.reqPressureShort")}
                </th>
                <th className="p-3 text-center">{t("scc.action")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                <td className="p-2 min-w-[100px]">
                  <select
                    value={regMachineNo}
                    onChange={(e) => setRegMachineNo(e.target.value)}
                    className={baseInputClasses}
                  >
                    <option value="">{t("scc.select")}</option>
                    {machineOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 min-w-[180px]" ref={regMoDropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      ref={regMoSearchInputRef}
                      value={regMoNoSearch}
                      onChange={(e) => setRegMoNoSearch(e.target.value)}
                      onFocus={() =>
                        regMoNoSearch.trim() && setShowRegMoDropdown(true)
                      }
                      placeholder={t("scc.searchMoNo")}
                      className={`${baseInputClasses} pl-9`}
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    {showRegMoDropdown && moDropdownOptions.length > 0 && (
                      <ul className="absolute z-30 mt-1 w-full bg-white shadow-xl max-h-60 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto">
                        {moDropdownOptions.map((mo, idx) => (
                          <li
                            key={idx}
                            onClick={() => handleMoSelect(mo)}
                            className="text-slate-900 cursor-pointer select-none relative py-2 px-4 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
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
                <td className="p-2 min-w-[140px]">
                  <input
                    type="text"
                    value={regBuyer}
                    readOnly
                    className={`${baseInputClasses} bg-slate-100`}
                  />
                </td>
                <td className="p-2 min-w-[140px]">
                  <input
                    type="text"
                    value={regBuyerStyle}
                    readOnly
                    className={`${baseInputClasses} bg-slate-100`}
                  />
                </td>
                <td className="p-2 min-w-[140px]">
                  <select
                    value={regColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className={baseInputClasses}
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
                <td className="p-2 min-w-[80px]">
                  <input
                    type="number"
                    value={regReqTemp ?? ""}
                    readOnly
                    className={`${baseInputClasses} text-center bg-slate-100`}
                  />
                </td>
                <td className="p-2 min-w-[80px]">
                  <input
                    type="number"
                    value={regReqTime ?? ""}
                    readOnly
                    className={`${baseInputClasses} text-center bg-slate-100`}
                  />
                </td>
                <td className="p-2 min-w-[80px]">
                  <input
                    type="number"
                    step="0.1"
                    value={regReqPressure ?? ""}
                    readOnly
                    className={`${baseInputClasses} text-center bg-slate-100`}
                  />
                </td>
                <td className="p-2 text-center">
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
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {t("sccDailyHTQC.register")}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Inspection Data Section */}
      <section className="p-4 md:p-6 bg-white border border-slate-200 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
          <ListChecks size={20} className="mr-2 text-indigo-600" />
          {t("sccDailyHTQC.inspectionDataTitle")}
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-slate-50 rounded-md mb-6 border border-slate-200">
          <div className="w-full sm:w-auto">
            <label htmlFor="filterMachineNo" className={labelClasses}>
              {t("scc.machineNo")}
            </label>
            <select
              id="filterMachineNo"
              value={filterMachineNo}
              onChange={(e) => setFilterMachineNo(e.target.value)}
              className={baseInputClasses}
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
          <div className="w-full sm:w-auto">
            <label htmlFor="selectedTimeSlotKey" className={labelClasses}>
              {t("sccDailyHTQC.timeSlot")}
            </label>
            <select
              id="selectedTimeSlotKey"
              value={selectedTimeSlotKey}
              onChange={(e) => setSelectedTimeSlotKey(e.target.value)}
              className={baseInputClasses}
            >
              <option value="">{t("sccDailyHTQC.selectTimeSlot")}</option>
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
                  <th className="p-3 border border-slate-300">
                    {t("scc.machineNo")}
                  </th>
                  <th className="p-3 border border-slate-300">
                    {t("scc.moNo")}
                  </th>
                  <th className="p-3 border border-slate-300">
                    {t("scc.color")}
                  </th>
                  <th className="p-3 border border-slate-300">
                    {t("sccDailyHTQC.parameter")}
                  </th>
                  <th className="p-3 border border-slate-300 text-center">
                    {t("sccDailyHTQC.reqValue")}
                  </th>
                  <th className="p-3 border border-slate-300 text-center">
                    {t("sccDailyHTQC.actualValue")}
                  </th>
                  <th className="p-3 border border-slate-300 text-center">
                    {t("scc.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inspectionTableDisplayData.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-6 text-center text-slate-500 italic"
                    >
                      {t("sccDailyHTQC.noMachinesRegisteredOrFiltered")}
                    </td>
                  </tr>
                )}
                {inspectionTableDisplayData.map((machine) => {
                  const existingInspectionForSlot = machine.inspections.find(
                    (insp) => insp.timeSlotKey === selectedTimeSlotKey
                  );
                  const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
                  const currentActualsForSlot = actualValues[docSlotKey] || {
                    temp_isNA: false,
                    time_isNA: false,
                    pressure_isNA: false
                  }; // Ensure NA flags default to false
                  const isCurrentlySubmittingThis =
                    submittingMachineSlot === docSlotKey;

                  const parameters = [
                    {
                      name: t("sccDailyHTQC.temperature"),
                      field: "temp",
                      unit: "°C",
                      reqValue: machine.baseReqTemp,
                      tolerance: tolerances.temp,
                      icon: <Thermometer size={14} />
                    },
                    {
                      name: t("sccDailyHTQC.timing"),
                      field: "time",
                      unit: "Sec",
                      reqValue: machine.baseReqTime,
                      tolerance: tolerances.time,
                      icon: <Clock size={14} />
                    },
                    {
                      name: t("sccDailyHTQC.pressure"),
                      field: "pressure",
                      unit: "Bar",
                      reqValue: machine.baseReqPressure,
                      tolerance: tolerances.pressure,
                      icon: <Gauge size={14} />
                    }
                  ];

                  return (
                    <React.Fragment
                      key={`${machine._id}_${selectedTimeSlotKey}`}
                    >
                      {parameters.map((param, paramIdx) => {
                        const actualValueForParam =
                          currentActualsForSlot[`${param.field}_actual`];
                        const isNAForParam =
                          currentActualsForSlot[`${param.field}_isNA`];
                        // Get status for cell background, pass `true` for forCellBackground
                        const cellStatus = getStatusAndBG(
                          actualValueForParam,
                          param.reqValue,
                          param.tolerance,
                          isNAForParam,
                          true
                        );

                        return (
                          <tr
                            key={`${machine._id}_${selectedTimeSlotKey}_${param.field}`}
                            className={`transition-colors ${
                              !existingInspectionForSlot &&
                              actualValueForParam !== undefined
                                ? cellStatus.bgColor.replace(
                                    "text-",
                                    "bg-opacity-20 text-"
                                  )
                                : "hover:bg-slate-50"
                            }`}
                          >
                            {paramIdx === 0 && (
                              <>
                                <td
                                  rowSpan={parameters.length}
                                  className="p-2.5 border border-slate-300 text-center align-middle font-medium text-slate-700"
                                >
                                  {machine.machineNo}
                                </td>
                                <td
                                  rowSpan={parameters.length}
                                  className="p-2.5 border border-slate-300 text-center align-middle text-slate-600"
                                >
                                  {machine.moNo}
                                </td>
                                <td
                                  rowSpan={parameters.length}
                                  className="p-2.5 border border-slate-300 text-center align-middle text-slate-600"
                                >
                                  {machine.color}
                                </td>
                              </>
                            )}
                            <td className="p-2.5 border border-slate-300 whitespace-nowrap text-slate-700 flex items-center">
                              {React.cloneElement(param.icon, {
                                className: "mr-1.5 text-indigo-600"
                              })}{" "}
                              {param.name}{" "}
                              <span className="text-slate-500 ml-1">
                                ({param.unit})
                              </span>
                            </td>
                            <td className="p-2.5 border border-slate-300 text-center font-medium text-slate-600">
                              {param.reqValue ?? t("scc.naCap")}
                            </td>
                            <td
                              className={`p-1.5 border border-slate-300 text-center ${
                                !existingInspectionForSlot
                                  ? cellStatus.bgColor
                                  : ""
                              }`}
                            >
                              {existingInspectionForSlot ? (
                                <span
                                  className={`px-2 py-1 rounded-md text-xs font-semibold inline-flex items-center ${
                                    getStatusAndBG(
                                      existingInspectionForSlot[
                                        `${param.field}_actual`
                                      ],
                                      param.reqValue,
                                      param.tolerance,
                                      existingInspectionForSlot[
                                        `${param.field}_isNA`
                                      ]
                                    ).bgColor
                                  }`}
                                >
                                  {
                                    getStatusAndBG(
                                      existingInspectionForSlot[
                                        `${param.field}_actual`
                                      ],
                                      param.reqValue,
                                      param.tolerance,
                                      existingInspectionForSlot[
                                        `${param.field}_isNA`
                                      ]
                                    ).icon
                                  }
                                  {existingInspectionForSlot[
                                    `${param.field}_isNA`
                                  ]
                                    ? t("scc.naCap")
                                    : existingInspectionForSlot[
                                        `${param.field}_actual`
                                      ] ?? t("scc.naCap")}
                                </span>
                              ) : (
                                <div className="flex items-center justify-center space-x-1.5">
                                  {isNAForParam ? (
                                    <span className="italic text-slate-500 px-2 py-1">
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
                                            -(param.field === "pressure"
                                              ? 0.1
                                              : 1)
                                          )
                                        }
                                        className={iconButtonClasses}
                                        title={t("scc.decrement")}
                                      >
                                        <Minus size={12} />
                                      </button>
                                      <input
                                        type="number"
                                        step={
                                          param.field === "pressure"
                                            ? "0.1"
                                            : "1"
                                        }
                                        value={actualValueForParam ?? ""}
                                        onChange={(e) =>
                                          handleActualValueChange(
                                            machine._id,
                                            selectedTimeSlotKey,
                                            param.field,
                                            e.target.value
                                          )
                                        }
                                        className="w-20 text-center p-1 border border-slate-300 rounded text-xs focus:ring-indigo-500 focus:border-indigo-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleIncrementDecrement(
                                            machine._id,
                                            selectedTimeSlotKey,
                                            param.field,
                                            param.field === "pressure" ? 0.1 : 1
                                          )
                                        }
                                        className={iconButtonClasses}
                                        title={t("scc.increment")}
                                      >
                                        <Plus size={12} />
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
                                    className={iconButtonClasses}
                                    title={
                                      isNAForParam
                                        ? t("scc.markAsApplicable")
                                        : t("scc.markNA")
                                    }
                                  >
                                    {isNAForParam ? (
                                      <Eye
                                        size={12}
                                        className="text-slate-500"
                                      />
                                    ) : (
                                      <EyeOff size={12} />
                                    )}
                                  </button>
                                </div>
                              )}
                            </td>
                            {paramIdx === 0 && (
                              <td
                                rowSpan={parameters.length}
                                className="p-2.5 border border-slate-300 text-center align-middle"
                              >
                                {existingInspectionForSlot ? (
                                  <div className="flex flex-col items-center justify-center text-green-700 ">
                                    <Check
                                      size={20}
                                      className="mb-0.5 text-green-500"
                                    />
                                    <span className="text-xs font-semibold">
                                      {t("sccDailyHTQC.submitted")}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
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
                                      isCurrentlySubmittingThis ||
                                      parentIsSubmitting
                                    }
                                    className="w-full px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-slate-400 flex items-center justify-center"
                                  >
                                    {isCurrentlySubmittingThis ? (
                                      <Loader2
                                        size={14}
                                        className="animate-spin mr-1.5"
                                      />
                                    ) : (
                                      <Send size={14} className="mr-1.5" />
                                    )}
                                    {t("scc.submit")}
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 italic">
            {t("sccDailyHTQC.pleaseSelectTimeSlot")}
          </div>
        )}
      </section>
    </div>
  );
};

export default DailyHTQC;
